import { supabase } from "../config/db.js";

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
        email,
        tier_name,
        quantity,
        total_kes,
        event_vol,
        used,
        created_at,
        pdf_url,
        payment_id,
        event_id
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

    // 2. Fetch associated event title if exists
    let eventTitle = `Vol. ${ticket.event_vol}`;
    if (ticket.event_id) {
      const { data: event, error: eventErr } = await supabase
        .from("events")
        .select("title")
        .eq("id", ticket.event_id)
        .maybeSingle();
      
      if (event) eventTitle = event.title;
    }

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
            tierName: ticket.tier_name,
            quantity: ticket.quantity,
            eventVol: ticket.event_vol,
            eventTitle: eventTitle,
            email: ticket.email,
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
        tierName: ticket.tier_name,
        quantity: ticket.quantity,
        eventVol: ticket.event_vol,
        eventTitle: eventTitle,
        email: ticket.email,
        used: ticket.used,
        pdfUrl: ticket.pdf_url,
      },
    });

  } catch (error) {
    console.error("Ticket Verification Error:", error.message);
    next(error);
  }
};
