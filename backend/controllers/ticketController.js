import { supabase } from "../config/db.js";
import { generateTicketPDF } from "../services/pdfService.js";
import { sendConfirmationEmail } from "../services/emailService.js";
import { validateEmail } from "../utils/validators.js";

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

/**
 * Issues a ticket directly (RSVP / Free pass), generates high-aesthetic PDF pass,
 * uploads to Supabase storage, and dispatches confirmation email via Resend/Nodemailer.
 *
 * POST /api/tickets/issue
 */
export const issueTicket = async (req, res, next) => {
  const {
    email,
    customerName,
    tierName,
    quantity,
    eventVol,
    userId,
    eventTitle,
    eventDate,
    venue,
  } = req.body;

  try {
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const resolvedTitle = eventTitle || `ZuriXperience Vol. ${eventVol || "01"}`;
    const resolvedVenue = venue || "Disclosed at door";
    const resolvedDate = eventDate || "Saturday, December 14";

    // 1. Resolve/Find event in public.events if exists
    let eventId = null;
    try {
      const { data: eventData } = await supabase
        .from("events")
        .select("id")
        .eq("title", resolvedTitle)
        .maybeSingle();

      if (eventData) {
        eventId = eventData.id;
      } else {
        const { data: newEvent } = await supabase
          .from("events")
          .insert({
            title: resolvedTitle,
            venue: resolvedVenue,
            event_date: resolvedDate,
            price: 0,
          })
          .select("id")
          .maybeSingle();
        if (newEvent) eventId = newEvent.id;
      }
    } catch (eErr) {
      console.warn("Event resolution notice:", eErr.message);
    }

    // 2. Resolve/Insert User mapping in public.users if authenticated
    if (userId) {
      try {
        await supabase
          .from("users")
          .upsert({
            id: userId,
            full_name: customerName || cleanEmail.split("@")[0],
            email: cleanEmail,
          });
      } catch (uErr) {
        console.warn("User upsert notice:", uErr.message);
      }
    }

    // 3. Calculate countdown ticket code starting at 99 backwards (e.g. ZURI099, ZURI098, ...)
    let countdownCode = "ZURI099";
    let countdownNum = 99;
    try {
      const { data: latestTickets } = await supabase
        .from("tickets")
        .select("ticket_number, code")
        .order("created_at", { ascending: false })
        .limit(1);

      let prevNum = 100; // First ticket will be 100 - 1 = 99
      if (latestTickets && latestTickets.length > 0) {
        const last = latestTickets[0];
        if (last.ticket_number && Number(last.ticket_number) > 0 && Number(last.ticket_number) <= 99) {
          prevNum = Number(last.ticket_number);
        } else if (last.code && /^ZURI\d+$/i.test(last.code)) {
          const parsed = parseInt(last.code.replace(/^ZURI/i, ""), 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 99) {
            prevNum = parsed;
          }
        }
      }

      countdownNum = Math.max(1, prevNum - 1);
      countdownCode = `ZURI${String(countdownNum).padStart(3, "0")}`;
    } catch (countErr) {
      console.warn("Countdown code calculation fallback:", countErr.message);
    }

    // 4. Insert ticket into public.tickets with countdown code
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .insert({
        email: cleanEmail,
        tier_name: tierName || "General",
        quantity: qty,
        total_kes: 0,
        payment_method: "RSVP",
        event_vol: eventVol || "01",
        user_id: userId || null,
        event_id: eventId || null,
        code: countdownCode,
        ticket_code: countdownCode,
        ticket_number: countdownNum,
        used: false,
      })
      .select("*")
      .single();

    if (ticketErr) throw ticketErr;

    console.log(`Success: Registered Free RSVP Ticket ${ticket.code} for ${cleanEmail}`);

    // 4. Generate high-aesthetic PDF pass
    const pdfData = {
      eventTitle: resolvedTitle,
      venue: resolvedVenue,
      eventDate: resolvedDate,
      code: ticket.code,
      customerName: customerName || cleanEmail.split("@")[0],
      receiptNumber: `RSVP-${ticket.code}`,
      amountPaid: 0,
      quantity: qty,
      tierName: ticket.tier_name,
      eventVol: ticket.event_vol,
      purchaseDate: new Date().toISOString().split("T")[0],
    };

    let pdfBuffer = null;
    try {
      pdfBuffer = await generateTicketPDF(pdfData);
    } catch (pdfErr) {
      console.warn("PDF generation error:", pdfErr.message);
    }

    // 5. Upload PDF to Supabase Storage bucket ('tickets') if available
    if (pdfBuffer) {
      try {
        const fileName = `ticket-${ticket.code}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from("tickets")
          .upload(fileName, pdfBuffer, {
            contentType: "application/pdf",
            cacheControl: "3600",
            upsert: true,
          });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from("tickets")
            .getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            ticket.pdf_url = publicUrlData.publicUrl;
            await supabase
              .from("tickets")
              .update({ pdf_url: publicUrlData.publicUrl })
              .eq("id", ticket.id);
          }
        }
      } catch (storageErr) {
        console.warn("Storage upload notice:", storageErr.message);
      }
    }

    // 6. Send confirmation email via Resend / Nodemailer
    let emailDispatched = false;
    let emailNotice = null;
    if (pdfBuffer) {
      try {
        await sendConfirmationEmail(cleanEmail, pdfData, pdfBuffer);
        emailDispatched = true;
        console.log(`Dispatched confirmation email to ${cleanEmail}`);
      } catch (mailErr) {
        console.warn("Email dispatch notice:", mailErr.message);
        emailNotice = mailErr.message;
      }
    }

    return res.status(200).json({
      success: true,
      message: emailDispatched
        ? `Pass issued! Confirmation email dispatched to ${cleanEmail}.`
        : `Pass issued! Ticket code: ${ticket.code}.`,
      emailSent: emailDispatched,
      emailNotice,
      ticket: {
        id: ticket.id,
        code: ticket.code,
        number: ticket.ticket_number,
        tierName: ticket.tier_name,
        quantity: ticket.quantity,
        eventTitle: resolvedTitle,
        eventDate: resolvedDate,
        venue: resolvedVenue,
        email: ticket.email,
        pdfUrl: ticket.pdf_url,
      },
    });

  } catch (error) {
    console.error("Issue Ticket Error:", error.message);
    next(error);
  }
};
