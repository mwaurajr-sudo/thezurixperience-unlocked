import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/server/db.server";
import { getCurrentEvent } from "@/server/event.server";
import { handle, HttpError, json, readJson } from "@/server/http.server";
import { hashToken } from "@/server/token.server";
import {
  deliverTicket,
  findTicketForRsvp,
  issueTicketForRsvp,
  ticketPayload,
  type RsvpRow,
} from "@/server/tickets.server";

/**
 * Confirms attendance, issues the ticket and emails it.
 * This is a POST sent by a button on the confirm page: mail scanners open links in
 * emails automatically, which would confirm guests who never clicked if this were a GET.
 * Safe to repeat: it returns the same ticket, and retries the email if it hasn't gone out.
 */
export const Route = createFileRoute("/api/rsvp/confirm")({
  server: {
    handlers: {
      POST: handle(async ({ request }: { request: Request }) => {
        const { token } = await readJson(request);
        if (!token || typeof token !== "string") {
          throw new HttpError(400, "Confirmation token is required.");
        }

        const { data: rsvp, error: rsvpErr } = await db()
          .from("rsvps")
          .select("*")
          .eq("token_hash", await hashToken(token))
          .maybeSingle<RsvpRow>();

        if (rsvpErr) throw rsvpErr;
        if (!rsvp) {
          throw new HttpError(
            404,
            "This confirmation link isn't valid. If you RSVP'd again, use the link in the newest email.",
          );
        }

        let ticket = await findTicketForRsvp(rsvp.id);
        const alreadyConfirmed = Boolean(ticket);

        if (!ticket) {
          if (new Date(rsvp.token_expires_at).getTime() < Date.now()) {
            throw new HttpError(410, "This confirmation link has expired. RSVP again to get a new one.");
          }

          ticket = await issueTicketForRsvp(rsvp);
          if (!ticket) {
            throw new HttpError(409, "Sorry, all passes have been claimed.");
          }

          await db()
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
            console.error("Ticket email failure:", (mailErr as Error).message);
          }
        }

        return json({ success: true, alreadyConfirmed, emailSent, ticket: ticketPayload(ticket, event) });
      }),
    },
  },
});
