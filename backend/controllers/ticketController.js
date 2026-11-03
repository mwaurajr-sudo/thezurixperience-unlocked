import { supabase } from "../config/db.js";
import { getCurrentEvent } from "../config/event.js";
import { buildTicketPass } from "../services/ticketService.js";

/**
 * Verifies a ticket's validity and status.
 * Optionally marks the ticket as used if request contains a `markUsed` flag.
 *
 * GET /api/tickets/verify/:ticketCode
 */
export const verifyTicket = async (req, res, next) => {
  const { ticketCode } = req.params;
  const markUsed = req.query.markUsed === "true" || req.body.markUsed === true;

  try {
    if (!ticketCode || ticketCode.trim() === "") {
      return res.status(400).json({ success: false, message: "Ticket code is required." });
    }

    const cleanCode = ticketCode.trim().toUpperCase();

    // 1. Query ticket details
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select(`
        id,
        code,
        ticket_number,
        quantity,
        event_vol,
        used,
        created_at
      `)
      .eq("code", cleanCode)
      .maybeSingle();

    if (ticketErr) throw ticketErr;

    if (!ticket) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: `INVALID TICKET: Ticket code ${cleanCode} does not exist.`,
      });
    }

    // 2. Resolve the current event title
    const event = await getCurrentEvent();
    const eventTitle = event.vol === ticket.event_vol ? event.title : `Vol. ${ticket.event_vol}`;

    // 3. Mark ticket as used if requested and not already used
    if (markUsed) {
      if (ticket.used) {
        return res.status(200).json({
          success: true,
          valid: true,
          status: "USED",
          alreadyUsed: true,
          message: `REUSE BLOCKED: Ticket ${cleanCode} was already used.`,
          ticket: {
            code: ticket.code,
            quantity: ticket.quantity,
            eventVol: ticket.event_vol,
            eventTitle: eventTitle,
            usedAt: ticket.created_at, // Or add used_at column if applicable
          },
        });
      }

      const { error: updateErr } = await supabase
        .from("tickets")
        .update({ used: true })
        .eq("id", ticket.id);

      if (updateErr) throw updateErr;
      ticket.used = true;
    }

    return res.status(200).json({
      success: true,
      valid: true,
      status: ticket.used ? "USED" : "UNUSED",
      message: ticket.used
        ? `TICKET VALIDATED (USED): Ticket ${cleanCode} has already been checked in.`
        : `TICKET VALID (UNUSED): Ticket ${cleanCode} is authentic and ready for check-in.`,
      ticket: {
        code: ticket.code,
        quantity: ticket.quantity,
        eventVol: ticket.event_vol,
        eventTitle: eventTitle,
        used: ticket.used,
      },
    });

  } catch (error) {
    console.error("Ticket Verification Error:", error.message);
    next(error);
  }
};

/**
 * Downloads a ticket's PDF pass.
 *
 * GET /api/tickets/pass/:ticketCode
 */
export const downloadPass = async (req, res, next) => {
  const cleanCode = req.params.ticketCode.trim().toUpperCase();

  try {
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("code, quantity, event_vol, created_at")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error) throw error;

    if (!ticket) {
      return res.status(404).json({ success: false, message: `Ticket code ${cleanCode} does not exist.` });
    }

    const { pdfBuffer } = await buildTicketPass(ticket, await getCurrentEvent());

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Zuri-Pass-${ticket.code}.pdf"`,
    });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Download Pass Error:", error.message);
    next(error);
  }
};
