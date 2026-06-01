import { supabase } from "../config/db.js";
import { initiateSTKPush, parseCallbackData } from "../services/mpesaService.js";
import { generateTicketPDF } from "../services/pdfService.js";
import { sendConfirmationEmail } from "../services/emailService.js";
import { formatKenyanPhone, validateEmail } from "../utils/validators.js";

/**
 * Initiates an M-Pesa Lipa Na M-Pesa STK Push transaction.
 * Creates/matches dynamic users and events records before firing Safaricom calls.
 *
 * POST /api/payments/stkpush
 */
export const stkPush = async (req, res, next) => {
  const {
    email,
    phone,
    amount,
    tierName,
    quantity,
    eventVol,
    userId,
    customerName,
    eventTitle,
    eventDate,
    venue,
  } = req.body;

  try {
    // 1. Inputs validation
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }

    const formattedPhone = formatKenyanPhone(phone);
    if (!formattedPhone) {
      return res.status(400).json({ success: false, message: "Invalid Kenyan phone number format. Use 07XXXXXXXX, 01XXXXXXXX, or 254XXXXXXXXX." });
    }

    const billingAmount = Number(amount);
    if (isNaN(billingAmount) || billingAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount." });
    }

    console.log(`Payment Check Initiated for ${email} (${formattedPhone}) - Amount: KES ${billingAmount}`);

    // 2. Resolve/Insert Event details dynamically in public.events
    let eventId = null;
    const resolvedTitle = eventTitle || `ZuriXperience Vol. ${eventVol || "01"}`;
    const resolvedVenue = venue || "Disclosed at door";
    const resolvedDate = eventDate || "Saturday, December 14";

    const { data: eventData, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("title", resolvedTitle)
      .maybeSingle();

    if (eventData) {
      eventId = eventData.id;
    } else {
      const { data: newEvent, error: newEventErr } = await supabase
        .from("events")
        .insert({
          title: resolvedTitle,
          venue: resolvedVenue,
          event_date: resolvedDate,
          price: billingAmount / (quantity || 1),
        })
        .select("id")
        .single();
      
      if (newEventErr) throw newEventErr;
      eventId = newEvent.id;
    }

    // 3. Resolve/Insert User in public.users table mapping
    if (userId) {
      const { error: userUpdateErr } = await supabase
        .from("users")
        .upsert({
          id: userId,
          full_name: customerName || email.split("@")[0],
          email: email,
          phone: formattedPhone,
        });
      if (userUpdateErr) console.warn("Failed to upsert public users mapping:", userUpdateErr.message);
    }

    // 4. Initiate Safaricom Daraja STK Push request
    const reference = `Vol${eventVol || "01"}`;
    const mpesaResponse = await initiateSTKPush(formattedPhone, billingAmount, reference);

    const checkoutRequestId = mpesaResponse.CheckoutRequestID;
    if (!checkoutRequestId) {
      throw new Error("Safaricom failed to generate a CheckoutRequestID.");
    }

    // 5. Store pending payment record in payments table
    const { error: payInsertErr } = await supabase
      .from("payments")
      .insert({
        user_id: userId || null,
        amount: billingAmount,
        transaction_id: checkoutRequestId,
        phone: formattedPhone,
        status: "PENDING",
      });

    if (payInsertErr) throw payInsertErr;

    // Cache temporary checkout details in metadata attributes if helpful
    // For STK callback mapping, we store these variables on a temp table or file
    // Let's create a Supabase table cache or simple local cache to save transaction meta
    // But wait! We can store payload context directly inside a table if we alter the model,
    // or we can pass it in callback or recreate it. A simple database metadata insert is highly reliable,
    // but even simpler: let's query the pending payments status, and we can also add metadata cols.
    // Wait, let's store metadata in the DB. We can add columns to `payments` or store metadata in `payments`!
    // Let's alter `payments` to save transaction metadata so we can reconstruct tickets in the callback!
    // Yes! Let's alter payments table to add:
    // `meta_email`, `meta_tier_name`, `meta_quantity`, `meta_event_vol`, `meta_customer_name`, `meta_event_id`
    // This makes the callback 100% self-contained and completely avoids losing reservation states!
    const { error: metaErr } = await supabase
      .from("payments")
      .update({
        mpesa_receipt: JSON.stringify({
          email,
          tierName,
          quantity,
          eventVol,
          customerName: customerName || email.split("@")[0],
          eventId,
          eventTitle: resolvedTitle,
          eventDate: resolvedDate,
          venue: resolvedVenue,
        }),
      })
      .eq("transaction_id", checkoutRequestId);

    if (metaErr) console.warn("Meta cache err:", metaErr.message);

    res.status(200).json({
      success: true,
      message: "STK push payment request successfully initiated.",
      checkoutRequestId: checkoutRequestId,
    });

  } catch (error) {
    console.error("Initiate STK Push Error Catch:", error.message);
    next(error);
  }
};

/**
 * Handles Daraja M-Pesa Post Callback notification.
 * Generates tickets, uploads high-aesthetic PDFs, and triggers Nodemailer email attachments on successful payment.
 *
 * POST /api/payments/callback
 */
export const callback = async (req, res, next) => {
  try {
    const callbackData = parseCallbackData(req.body);
    const { success, checkoutRequestId, receipt, amount, phone, message } = callbackData;

    console.log(`M-Pesa Callback Received — ID: ${checkoutRequestId} — Status: ${success ? "SUCCESS" : "FAILED"}`);

    // 1. Verify matching transaction records in payments table
    const { data: payment, error: payFetchErr } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_id", checkoutRequestId)
      .maybeSingle();

    if (payFetchErr) throw payFetchErr;
    if (!payment) {
      console.warn(`CRITICAL: Payment transaction ${checkoutRequestId} not found in database.`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received for unknown transaction." });
    }

    if (payment.status !== "PENDING") {
      console.log(`Callback ignored. Payment ${checkoutRequestId} is already updated to status: ${payment.status}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Duplicate callback transaction ignored." });
    }

    // 2. Handle failed payments
    if (!success) {
      await supabase
        .from("payments")
        .update({ status: "FAILED" })
        .eq("id", payment.id);

      console.log(`Payment marked as failed: ${message}`);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
    }

    // 3. Process completed payments
    // Extract metadata values stored in payment receipt column cache
    let meta = {};
    try {
      meta = JSON.parse(payment.mpesa_receipt || "{}");
    } catch {
      console.warn("Could not decode payment metadata JSON string.");
    }

    // Update payment record to COMPLETED state
    const { error: payUpdateErr } = await supabase
      .from("payments")
      .update({
        status: "COMPLETED",
        mpesa_receipt: receipt,
      })
      .eq("id", payment.id);

    if (payUpdateErr) throw payUpdateErr;

    // 4. Generate Ticket row in public.tickets table
    // Let the trigger set the sequence ticket_number and unique ticket_code!
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .insert({
        email: meta.email || "guest@thezurixperience.com",
        tier_name: meta.tierName || "General",
        quantity: meta.quantity || 1,
        total_kes: payment.amount,
        payment_method: "mpesa",
        event_vol: meta.eventVol || "01",
        user_id: payment.user_id || null,
        event_id: meta.eventId || null,
        payment_id: payment.id,
        used: false,
      })
      .select("*")
      .single();

    if (ticketErr) throw ticketErr;

    console.log(`Success: Registered Ticket ${ticket.code} inside database. Generating VIP PDF...`);

    // 5. Generate high-aesthetic ticket PDF stream buffer
    const pdfData = {
      eventTitle: meta.eventTitle || "RNB NIGHTS",
      venue: meta.venue || "Disclosed at door",
      eventDate: meta.eventDate || "Saturday, December 14",
      code: ticket.code,
      customerName: meta.customerName || meta.email.split("@")[0],
      receiptNumber: receipt,
      amountPaid: payment.amount,
      quantity: meta.quantity || 1,
      tierName: meta.tierName || "General",
      eventVol: meta.eventVol || "01",
      purchaseDate: new Date().toISOString().split("T")[0],
    };

    const pdfBuffer = await generateTicketPDF(pdfData);

    // 6. Upload PDF file to Supabase Storage bucket ('tickets')
    const fileName = `ticket-${ticket.code}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("tickets")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadErr) {
      console.error("PDF upload to storage failed:", uploadErr.message);
      // Even if upload fails, we have recorded the ticket. But let's log the error.
    } else {
      // Construct public URL
      const { data: publicUrlData } = supabase.storage
        .from("tickets")
        .getPublicUrl(fileName);

      const publicPdfUrl = publicUrlData.publicUrl;
      
      // Update ticket with public PDF URL
      await supabase
        .from("tickets")
        .update({ pdf_url: publicPdfUrl })
        .eq("id", ticket.id);
      
      ticket.pdf_url = publicPdfUrl;
      console.log(`PDF Ticket successfully uploaded to storage: ${publicPdfUrl}`);
    }

    // 7. Dispatch HTML email notification with attachment
    try {
      await sendConfirmationEmail(meta.email, pdfData, pdfBuffer);
      console.log(`Success: Dispatched HTML ticket notification to ${meta.email}`);
    } catch (mailErr) {
      console.error("Email notification dispatch error:", mailErr.message);
      // Do not block response to Safaricom if email fails.
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });

  } catch (error) {
    console.error("Daraja callback handler captured exception:", error.message);
    // Always return a success state to Safaricom to prevent callback retries
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback parsed with error." });
  }
};

/**
 * Returns payment and ticketing status of a transaction for client short polling.
 *
 * GET /api/payments/status/:checkoutRequestId
 */
export const getStatus = async (req, res, next) => {
  const { checkoutRequestId } = req.params;

  try {
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_id", checkoutRequestId)
      .maybeSingle();

    if (payErr) throw payErr;
    if (!payment) {
      return res.status(404).json({ success: false, message: "Transaction record not found." });
    }

    if (payment.status === "PENDING") {
      return res.status(200).json({ success: true, status: "PENDING" });
    }

    if (payment.status === "FAILED") {
      return res.status(200).json({ success: true, status: "FAILED", message: "Transaction was cancelled or failed." });
    }

    // If completed, fetch the issued ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("code, pdf_url, ticket_number")
      .eq("payment_id", payment.id)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      status: "COMPLETED",
      ticket: ticket ? {
        code: ticket.code,
        pdfUrl: ticket.pdf_url,
        number: ticket.ticket_number,
      } : null,
    });

  } catch (error) {
    console.error("Get Payment Status Error:", error.message);
    next(error);
  }
};
