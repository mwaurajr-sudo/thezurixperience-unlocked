import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/server/db.server";
import { countAttempt, handle, isRateLimited, json, readJson } from "@/server/http.server";
import { tracklist } from "@/server/tracklist";

// Only wrong codes count, so guests reopening the page aren't locked out while guessing is slowed.
const WRONG_CODE_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Returns the tracklist when the guest enters the code from a real ticket.
 * Checked-in tickets still count, so guests keep the playlist after the event.
 */
export const Route = createFileRoute("/api/playlist/unlock")({
  server: {
    handlers: {
      POST: handle(async ({ request }: { request: Request }) => {
        if (isRateLimited(request, "unlock", WRONG_CODE_LIMIT, WINDOW_MS)) {
          return json({ success: false, message: "Too many attempts. Please try again later." }, 429);
        }

        // Tickets read ZURI098, but guests may type zuri98 or ZURI 98.
        const body = await readJson(request);
        const cleanCode = String(body.code ?? "")
          .trim()
          .toUpperCase()
          .replace(/^ZURI\s*0*(\d+)$/, (_, n: string) => `ZURI${n.padStart(3, "0")}`);

        const { data: ticket, error } = await db().from("tickets").select("id").eq("code", cleanCode).maybeSingle();
        if (error) throw error;

        if (!ticket) {
          countAttempt(request, "unlock", WINDOW_MS);
          return json({ success: false, message: "That ticket code isn't right." }, 401);
        }

        return json({ success: true, tracks: tracklist });
      }),
    },
  },
});
