import { createFileRoute } from "@tanstack/react-router";
import { RSVP_PAUSED } from "@/lib/rsvp-status";
import { db } from "@/server/db.server";
import { sendRsvpEmail } from "@/server/email.server";
import { getCurrentEvent, getSiteUrl } from "@/server/event.server";
import { countAttempt, handle, HttpError, isRateLimited, json, readJson, userIdFrom, validateEmail } from "@/server/http.server";
import { hashToken, newToken } from "@/server/token.server";
import {
  deliverTicket,
  findTicketForRsvp,
  issueTicketForRsvp,
  ticketPayload,
  type RsvpRow,
} from "@/server/tickets.server";

const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_COOLDOWN_MS = 60 * 1000;
const MAX_NAME_LENGTH = 80;
// Each pass admits the guest and a plus one, whose name isn't collected.
const GUESTS_PER_PASS = 2;
// This endpoint sends mail to any address typed into it, so it needs a ceiling per visitor.
const RSVP_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

// Same reply whatever state the address is in, so this endpoint can't reveal who has RSVP'd.
const RSVP_RECEIVED = {
  success: true,
  message: "RSVP received. Check your inbox to confirm your attendance.",
};

/**
 * Records an RSVP. By default the ticket comes straight back to show on screen, with no email.
 * With REQUIRE_EMAIL_CONFIRMATION=true, it instead emails the guest a link to confirm their attendance.
 * If the guest already has a ticket, it is returned (or re-sent) instead.
 */
export const Route = createFileRoute("/api/rsvp/")({
  server: {
    handlers: {
      POST: handle(async ({ request }: { request: Request }) => {
        if (RSVP_PAUSED) {
          throw new HttpError(403, "RSVPs are closed right now.");
        }
        if (isRateLimited(request, "rsvp", RSVP_LIMIT, WINDOW_MS)) {
          return json({ success: false, message: "Too many RSVP attempts. Please try again later." }, 429);
        }
        countAttempt(request, "rsvp", WINDOW_MS);

        const { email, customerName, tierName } = await readJson(request);
        if (!validateEmail(email)) {
          throw new HttpError(400, "A valid email is required.");
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const event = await getCurrentEvent();

        if (typeof tierName !== "string" || !event.tierNames.includes(tierName)) {
          throw new HttpError(400, "Please choose a valid pass type.");
        }

        const { data: existing, error: existingErr } = await db()
          .from("rsvps")
          .select("*")
          .eq("email", cleanEmail)
          .eq("event_vol", event.vol)
          .maybeSingle<RsvpRow>();

        if (existingErr) throw existingErr;

        const saveRsvp = async () => {
          const token = newToken();
          const fullName = String(customerName || "").trim().slice(0, MAX_NAME_LENGTH) || cleanEmail.split("@")[0];
          const userId = await userIdFrom(request);

          const { data: rsvp, error: upsertErr } = await db()
            .from("rsvps")
            .upsert(
              {
                email: cleanEmail,
                full_name: fullName,
                tier_name: tierName,
                quantity: GUESTS_PER_PASS,
                event_vol: event.vol,
                user_id: userId ?? existing?.user_id ?? null,
                token_hash: await hashToken(token),
                token_expires_at: new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString(),
              },
              { onConflict: "email,event_vol" },
            )
            .select("*")
            .single<RsvpRow>();

          if (upsertErr) throw upsertErr;
          return { rsvp, token, fullName };
        };

        if (process.env.REQUIRE_EMAIL_CONFIRMATION !== "true") {
          // Entering the same email again brings back the same ticket, so a lost pass can be recovered.
          let ticket = existing ? await findTicketForRsvp(existing.id) : null;
          const alreadyRsvpd = Boolean(ticket);

          if (!ticket) {
            const { rsvp } = await saveRsvp();
            ticket = await issueTicketForRsvp(rsvp);
            if (!ticket) {
              throw new HttpError(409, "Sorry, all passes have been claimed.");
            }
            await db()
              .from("rsvps")
              .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
              .eq("id", rsvp.id);
          }

          return json({ success: true, alreadyRsvpd, ticket: ticketPayload(ticket, event) });
        }

        if (existing?.last_email_at && Date.now() - new Date(existing.last_email_at).getTime() < EMAIL_COOLDOWN_MS) {
          return json(RSVP_RECEIVED);
        }

        const ticket = existing ? await findTicketForRsvp(existing.id) : null;
        if (existing && ticket) {
          try {
            await deliverTicket(existing, ticket, event);
          } catch (mailErr) {
            console.warn("Ticket re-send notice:", (mailErr as Error).message);
          }
          return json(RSVP_RECEIVED);
        }

        const { rsvp, token, fullName } = await saveRsvp();

        try {
          await sendRsvpEmail(cleanEmail, {
            customerName: fullName,
            eventTitle: event.title,
            eventDate: event.when,
            confirmUrl: `${getSiteUrl(request)}/rsvp/confirm?token=${token}`,
          });
        } catch (mailErr) {
          console.error("RSVP email failure:", (mailErr as Error).message);
          throw new HttpError(502, "We couldn't send your confirmation email. Please try again shortly.");
        }

        await db().from("rsvps").update({ last_email_at: new Date().toISOString() }).eq("id", rsvp.id);
        return json(RSVP_RECEIVED);
      }),
    },
  },
});
