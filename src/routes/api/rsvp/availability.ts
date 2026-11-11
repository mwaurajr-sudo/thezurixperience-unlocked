import { createFileRoute } from "@tanstack/react-router";
import { handle, json } from "@/server/http.server";
import { getPassesLeft } from "@/server/tickets.server";

/** How many passes are left. */
export const Route = createFileRoute("/api/rsvp/availability")({
  server: {
    handlers: {
      GET: handle(async (_ctx: { request: Request }) => json({ success: true, ...(await getPassesLeft()) })),
    },
  },
});
