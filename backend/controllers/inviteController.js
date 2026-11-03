import { supabase } from "../config/db.js";
import { getCurrentEvent, getSiteUrl } from "../config/event.js";
import { sendInviteEmail } from "../services/emailService.js";
import { validateEmail } from "../utils/validators.js";

// Sends happen one at a time inside the request, so the admin screen works through a long
// list in batches of this size rather than risk a single request timing out.
const MAX_INVITES_PER_REQUEST = 25;

/**
 * Emails the event invite, with the RSVP link and instructions, to a batch of addresses.
 * Anyone already invited is skipped unless `resend` is true.
 *
 * POST /api/invites
 */
export const sendInvites = async (req, res, next) => {
  const { emails, resend } = req.body;

  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: "Add at least one email address." });
    }
    if (emails.length > MAX_INVITES_PER_REQUEST) {
      return res.status(400).json({
        success: false,
        message: `Send at most ${MAX_INVITES_PER_REQUEST} invites at a time.`,
      });
    }

    const cleanEmails = [...new Set(emails.map((email) => String(email).trim().toLowerCase()))];
    const event = await getCurrentEvent();

    const { data: existing, error: existingErr } = await supabase
      .from("invites")
      .select("email, status")
      .eq("event_vol", event.vol)
      .in("email", cleanEmails);

    if (existingErr) throw existingErr;

    const alreadySent = new Set(existing.filter((row) => row.status === "sent").map((row) => row.email));
    const results = { sent: [], skipped: [], invalid: [], failed: [] };

    for (const email of cleanEmails) {
      if (!validateEmail(email)) {
        results.invalid.push(email);
        continue;
      }
      if (alreadySent.has(email) && resend !== true) {
        results.skipped.push(email);
        continue;
      }

      const row = { email, event_vol: event.vol };
      try {
        await sendInviteEmail(email, {
          eventTitle: event.title,
          eventDate: event.date,
          doors: event.doors,
          venue: event.venue,
          rsvpUrl: `${getSiteUrl()}/rsvp`,
        });
        row.status = "sent";
        row.last_error = null;
        row.sent_at = new Date().toISOString();
        results.sent.push(email);
      } catch (mailErr) {
        console.error("Invite email failure:", mailErr.message);
        row.status = "failed";
        row.last_error = mailErr.message;
        results.failed.push(email);
      }

      const { error: saveErr } = await supabase
        .from("invites")
        .upsert(row, { onConflict: "email,event_vol" });
      if (saveErr) console.error("Invite record failure:", saveErr.message);
    }

    return res.status(200).json({ success: true, ...results });
  } catch (error) {
    console.error("Send Invites Error:", error.message);
    next(error);
  }
};
