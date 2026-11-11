import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/server/db.server";
import { sendInviteEmail } from "@/server/email.server";
import { getCurrentEvent, getSiteUrl } from "@/server/event.server";
import { handle, HttpError, json, readJson, requireAdmin, validateEmail } from "@/server/http.server";

// Sends happen one at a time inside the request, so the admin screen works through a long
// list in batches of this size rather than risk a single request timing out.
const MAX_INVITES_PER_REQUEST = 25;
const MAX_NAME_LENGTH = 80;

/**
 * Admins only: emails the event invite, with the RSVP link, to a batch of guests ({ email, name }).
 * Anyone already invited is skipped unless `resend` is true.
 */
export const Route = createFileRoute("/api/invites")({
  server: {
    handlers: {
      POST: handle(async ({ request }: { request: Request }) => {
        await requireAdmin(request);
        const { guests, resend } = await readJson(request);

        if (!Array.isArray(guests) || guests.length === 0) {
          throw new HttpError(400, "Add at least one email address.");
        }
        if (guests.length > MAX_INVITES_PER_REQUEST) {
          throw new HttpError(400, `Send at most ${MAX_INVITES_PER_REQUEST} invites at a time.`);
        }

        const namesByEmail = new Map<string, string>(
          guests.map((guest: { email?: unknown; name?: unknown }) => [
            String(guest?.email ?? "").trim().toLowerCase(),
            String(guest?.name ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH),
          ]),
        );
        const cleanEmails = [...namesByEmail.keys()];
        const event = await getCurrentEvent();

        const { data: existing, error: existingErr } = await db()
          .from("invites")
          .select("email, status")
          .eq("event_vol", event.vol)
          .in("email", cleanEmails);

        if (existingErr) throw existingErr;

        const alreadySent = new Set((existing ?? []).filter((r) => r.status === "sent").map((r) => r.email));
        const results = { sent: [] as string[], skipped: [] as string[], invalid: [] as string[], failed: [] as string[] };
        const rsvpUrl = `${getSiteUrl(request)}/rsvp`;

        for (const email of cleanEmails) {
          if (!validateEmail(email)) {
            results.invalid.push(email);
            continue;
          }
          if (alreadySent.has(email) && resend !== true) {
            results.skipped.push(email);
            continue;
          }

          const row: Record<string, unknown> = { email, event_vol: event.vol };
          try {
            await sendInviteEmail(email, {
              guestName: namesByEmail.get(email) ?? "",
              eventDate: event.date,
              doors: event.doors,
              rsvpUrl,
            });
            row.status = "sent";
            row.last_error = null;
            row.sent_at = new Date().toISOString();
            results.sent.push(email);
          } catch (mailErr) {
            console.error("Invite email failure:", (mailErr as Error).message);
            row.status = "failed";
            row.last_error = (mailErr as Error).message;
            results.failed.push(email);
          }

          const { error: saveErr } = await db().from("invites").upsert(row, { onConflict: "email,event_vol" });
          if (saveErr) console.error("Invite record failure:", saveErr.message);
        }

        return json({ success: true, ...results });
      }),
    },
  },
});
