import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/server/db.server";
import { handle, HttpError, json, requireAdmin } from "@/server/http.server";

// Which table and rows each recipient group comes from.
const GROUPS = {
  tickets: { table: "tickets", filter: null },
  rsvps: { table: "rsvps", filter: null },
  invites: { table: "invites", filter: ["status", "sent"] },
} as const;

type Group = keyof typeof GROUPS;

/** Admins only: the email addresses in a guest group (?group=tickets|rsvps|invites), across all chapters. */
export const Route = createFileRoute("/api/emails/recipients")({
  server: {
    handlers: {
      GET: handle(async ({ request }: { request: Request }) => {
        await requireAdmin(request);

        const group = new URL(request.url).searchParams.get("group") as Group | null;
        if (!group || !(group in GROUPS)) {
          throw new HttpError(400, "Choose tickets, rsvps or invites.");
        }

        const { table, filter } = GROUPS[group];
        let query = db().from(table).select("email");
        if (filter) query = query.eq(filter[0], filter[1]);
        const { data, error } = await query.limit(5000);
        if (error) throw error;

        const emails = [
          ...new Set((data ?? []).map((row: { email: string | null }) => String(row.email ?? "").trim().toLowerCase())),
        ].filter(Boolean);

        return json({ success: true, group, emails });
      }),
    },
  },
});
