import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/server/db.server";
import { getCurrentEvent } from "@/server/event.server";
import { handle, json } from "@/server/http.server";
import { buildTicketPass, type TicketRow } from "@/server/tickets.server";

/** Downloads a ticket's PDF pass. */
export const Route = createFileRoute("/api/tickets/pass/$ticketCode")({
  server: {
    handlers: {
      GET: handle(async ({ params }: { request: Request; params: { ticketCode: string } }) => {
        const cleanCode = decodeURIComponent(params.ticketCode ?? "").trim().toUpperCase();

        const { data: ticket, error } = await db()
          .from("tickets")
          .select("code, quantity, event_vol, created_at")
          .eq("code", cleanCode)
          .maybeSingle<TicketRow>();

        if (error) throw error;
        if (!ticket) {
          return json({ success: false, message: `Ticket code ${cleanCode} does not exist.` }, 404);
        }

        const { pdf } = buildTicketPass(ticket, await getCurrentEvent());
        return new Response(pdf as unknown as BodyInit, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Zuri-Pass-${ticket.code}.pdf"`,
          },
        });
      }),
    },
  },
});
