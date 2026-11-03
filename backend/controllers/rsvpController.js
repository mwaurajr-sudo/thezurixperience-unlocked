import crypto from "crypto";
import { supabase } from "../config/db.js";
import { getCurrentEvent, getSiteUrl } from "../config/event.js";
import { sendRsvpEmail } from "../services/emailService.js";
import {
  deliverTicket,
  findTicketForRsvp,
  getPassesLeft,
  issueTicketForRsvp,
} from "../services/ticketService.js";
import { validateEmail } from "../utils/validators.js";

const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_COOLDOWN_MS = 60 * 1000;
const MAX_NAME_LENGTH = 80;
// Each pass admits the guest and a plus one, whose name isn't collected.
const GUESTS_PER_PASS = 2;

// Same reply whatever state the address is in, so this endpoint can't reveal who has RSVP'd.
const RSVP_RECEIVED = {
  success: true,
  message: "RSVP received. Check your inbox to confirm your attendance.",
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * Resolves the signed-in user from the bearer token, if one was sent.
 */
const resolveUserId = async (req) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user?.id ?? null;
};

/**
 * Returns how many passes are left.
 *
 * GET /api/rsvp/availability
 */
export const getAvailability = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, ...(await getPassesLeft()) });
  } catch (error) {
    console.error("Availability Error:", error.message);
    next(error);
  }
};

/**
 * Records an RSVP and emails the guest a link to confirm their attendance.
 * If the guest already has a ticket, it is re-sent instead.
 *
 * POST /api/rsvp
 */
export const createRsvp = async (req, res, next) => {
  const { email, customerName, tierName } = req.body;

  try {
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const event = await getCurrentEvent();

    if (!event.tierNames.includes(tierName)) {
      return res.status(400).json({ success: false, message: "Please choose a valid pass type." });
    }

    const { data: existing, error: existingErr } = await supabase
      .from("rsvps")
      .select("*")
      .eq("email", cleanEmail)
      .eq("event_vol", event.vol)
      .maybeSingle();

    if (existingErr) throw existingErr;

    if (existing?.last_email_at && Date.now() - new Date(existing.last_email_at).getTime() < EMAIL_COOLDOWN_MS) {
      return res.status(200).json(RSVP_RECEIVED);
    }

    const ticket = existing ? await findTicketForRsvp(existing.id) : null;
    if (ticket) {
      try {
        await deliverTicket(existing, ticket, event);
      } catch (mailErr) {
        console.warn("Ticket re-send notice:", mailErr.message);
      }
      return res.status(200).json(RSVP_RECEIVED);
    }

    const fullName = String(customerName || "").trim().slice(0, MAX_NAME_LENGTH) || cleanEmail.split("@")[0];
    const token = crypto.randomBytes(32).toString("base64url");
    const userId = await resolveUserId(req);

    const { data: rsvp, error: upsertErr } = await supabase
      .from("rsvps")
      .upsert(
        {
          email: cleanEmail,
          full_name: fullName,
          tier_name: tierName,
          quantity: GUESTS_PER_PASS,
          event_vol: event.vol,
          user_id: userId ?? existing?.user_id ?? null,
          token_hash: hashToken(token),
          token_expires_at: new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString(),
        },
        { onConflict: "email,event_vol" }
      )
      .select("*")
      .single();

    if (upsertErr) throw upsertErr;

    try {
      await sendRsvpEmail(cleanEmail, {
        customerName: fullName,
        eventTitle: event.title,
        eventDate: event.date,
        confirmUrl: `${getSiteUrl()}/rsvp/confirm?token=${token}`,
      });
    } catch (mailErr) {
      console.error("RSVP email failure:", mailErr.message);
      return res.status(502).json({
        success: false,
        message: "We couldn't send your confirmation email. Please try again shortly.",
      });
    }

    await supabase.from("rsvps").update({ last_email_at: new Date().toISOString() }).eq("id", rsvp.id);

    console.log(`RSVP recorded: ${rsvp.id}`);
    return res.status(200).json(RSVP_RECEIVED);
  } catch (error) {
    console.error("Create RSVP Error:", error.message);
    next(error);
  }
};

/**
 * Confirms attendance, issues the ticket and emails it.
 * This is a POST sent by a button on the confirm page: mail scanners open links in
 * emails automatically, which would confirm guests who never clicked if this were a GET.
 * Safe to repeat: it returns the same ticket, and retries the email if it hasn't gone out.
 *
 * POST /api/rsvp/confirm
 */
export const confirmRsvp = async (req, res, next) => {
  const { token } = req.body;

  try {
    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "Confirmation token is required." });
    }

    const { data: rsvp, error: rsvpErr } = await supabase
      .from("rsvps")
      .select("*")
      .eq("token_hash", hashToken(token))
      .maybeSingle();

    if (rsvpErr) throw rsvpErr;

    if (!rsvp) {
      return res.status(404).json({
        success: false,
        message: "This confirmation link isn't valid. If you RSVP'd again, use the link in the newest email.",
      });
    }

    let ticket = await findTicketForRsvp(rsvp.id);
    const alreadyConfirmed = Boolean(ticket);

    if (!ticket) {
      if (new Date(rsvp.token_expires_at).getTime() < Date.now()) {
        return res.status(410).json({
          success: false,
          message: "This confirmation link has expired. RSVP again to get a new one.",
        });
      }

      ticket = await issueTicketForRsvp(rsvp);
      if (!ticket) {
        return res.status(409).json({ success: false, message: "Sorry, all passes have been claimed." });
      }

      await supabase
        .from("rsvps")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", rsvp.id);
    }

    const event = await getCurrentEvent();

    let emailSent = Boolean(rsvp.ticket_emailed_at);
    if (!emailSent) {
      try {
        await deliverTicket(rsvp, ticket, event);
        emailSent = true;
      } catch (mailErr) {
        console.error("Ticket email failure:", mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      alreadyConfirmed,
      emailSent,
      ticket: {
        code: ticket.code,
        quantity: ticket.quantity,
        eventTitle: event.title,
        eventDate: event.date,
        venue: event.venue,
        email: ticket.email,
      },
    });
  } catch (error) {
    console.error("Confirm RSVP Error:", error.message);
    next(error);
  }
};
