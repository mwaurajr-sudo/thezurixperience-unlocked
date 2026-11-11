import { createFileRoute } from "@tanstack/react-router";
import { sendCustomEmail } from "@/server/email.server";
import { handle, HttpError, json, readJson, requireAdmin, validateEmail } from "@/server/http.server";

// Sends go one at a time (spaced out for Resend), so the admin screen sends in batches of
// this size rather than risk one long request timing out.
const MAX_RECIPIENTS_PER_REQUEST = 25;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 10_000;

/**
 * Admins only: emails a message the admin wrote to a batch of addresses.
 * With { test: true } it goes only to the signed-in admin's own address.
 */
export const Route = createFileRoute("/api/emails/")({
  server: {
    handlers: {
      POST: handle(async ({ request }: { request: Request }) => {
        const admin = await requireAdmin(request);
        const body = await readJson(request);

        const subject = String(body.subject ?? "").trim().replace(/\s+/g, " ");
        const message = String(body.message ?? "").replace(/\r\n/g, "\n").trim();
        if (!subject) throw new HttpError(400, "Add a subject.");
        if (!message) throw new HttpError(400, "Write a message.");
        if (subject.length > MAX_SUBJECT_LENGTH) {
          throw new HttpError(400, `Keep the subject under ${MAX_SUBJECT_LENGTH} characters.`);
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
          throw new HttpError(400, `Keep the message under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`);
        }

        let recipients: string[];
        if (body.test === true) {
          if (!admin.email) throw new HttpError(400, "Your account has no email address to send a test to.");
          recipients = [admin.email.toLowerCase()];
        } else {
          if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
            throw new HttpError(400, "Add at least one email address.");
          }
          recipients = [...new Set(body.recipients.map((r: unknown) => String(r ?? "").trim().toLowerCase()))];
          if (recipients.length > MAX_RECIPIENTS_PER_REQUEST) {
            throw new HttpError(400, `Send to at most ${MAX_RECIPIENTS_PER_REQUEST} addresses at a time.`);
          }
        }

        const results = { sent: [] as string[], invalid: [] as string[], failed: [] as string[], firstError: null as string | null };

        for (const email of recipients) {
          if (!validateEmail(email)) {
            results.invalid.push(email);
            continue;
          }
          try {
            await sendCustomEmail(email, subject, message);
            results.sent.push(email);
          } catch (mailErr) {
            const reason = (mailErr as Error).message;
            console.error("Admin email failure:", reason);
            results.failed.push(email);
            results.firstError ??= reason;
          }
        }

        return json({ success: true, ...results });
      }),
    },
  },
});
