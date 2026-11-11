import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/server/db.server";
import { getCurrentEvent } from "@/server/event.server";
import { handle, HttpError, json, readJson, requireAdmin } from "@/server/http.server";

type Ctx = { request: Request; params: { ticketCode: string } };

/**
 * Checks a ticket's validity and status. With markUsed (?markUsed=true, or { markUsed: true }
 * in a POST body) it also checks the ticket in, which only signed-in admins may do.
 */
const verifyTicket = handle(async ({ request, params }: Ctx) => {
  const url = new URL(request.url);
  const body = request.method === "POST" ? await readJson(request) : {};
  const markUsed = url.searchParams.get("markUsed") === "true" || body.markUsed === true;

  const cleanCode = decodeURIComponent(params.ticketCode ?? "").trim().toUpperCase();
  if (!cleanCode) throw new HttpError(400, "Ticket code is required.");
  if (markUsed) await requireAdmin(request);

  const { data: ticket, error } = await db()
    .from("tickets")
    .select("id, code, ticket_number, quantity, event_vol, used, created_at")
    .eq("code", cleanCode)
    .maybeSingle();

  if (error) throw error;
  if (!ticket) {
    return json(
      { success: false, valid: false, message: `INVALID TICKET: Ticket code ${cleanCode} does not exist.` },
      404,
    );
  }

  const event = await getCurrentEvent();
  const eventTitle = event.vol === ticket.event_vol ? event.title : `Vol. ${ticket.event_vol}`;
  const summary = { code: ticket.code, quantity: ticket.quantity, eventVol: ticket.event_vol, eventTitle };

  if (markUsed) {
    if (ticket.used) {
      return json({
        success: true,
        valid: true,
        status: "USED",
        alreadyUsed: true,
        message: `REUSE BLOCKED: Ticket ${cleanCode} was already used.`,
        ticket: { ...summary, usedAt: ticket.created_at },
      });
    }

    const { error: updateErr } = await db().from("tickets").update({ used: true }).eq("id", ticket.id);
    if (updateErr) throw updateErr;
    ticket.used = true;
  }

  return json({
    success: true,
    valid: true,
    status: ticket.used ? "USED" : "UNUSED",
    message: ticket.used
      ? `TICKET VALIDATED (USED): Ticket ${cleanCode} has already been checked in.`
      : `TICKET VALID (UNUSED): Ticket ${cleanCode} is authentic and ready for check-in.`,
    ticket: { ...summary, used: ticket.used },
  });
});

export const Route = createFileRoute("/api/tickets/verify/$ticketCode")({
  server: {
    handlers: {
      GET: verifyTicket,
      POST: verifyTicket,
    },
  },
});
