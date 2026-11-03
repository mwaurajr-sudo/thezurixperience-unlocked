import { supabase } from "../config/db.js";
import { generateTicketPDF } from "./pdfService.js";
import { sendTicketEmail } from "./emailService.js";

const MAX_TICKET_NUMBER = 99;
const ISSUE_ATTEMPTS = 5;

/**
 * Finds the next countdown ticket number (99, 98, ... 1), or null once all are issued.
 */
const nextTicketNumber = async () => {
  const { data, error } = await supabase
    .from("tickets")
    .select("ticket_number")
    .gte("ticket_number", 1)
    .lte("ticket_number", MAX_TICKET_NUMBER)
    .order("ticket_number", { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return MAX_TICKET_NUMBER;
  return data[0].ticket_number > 1 ? data[0].ticket_number - 1 : null;
};

/**
 * Counts down with the ticket codes: 99 before the first ticket, 98 after ZURI099, and so on.
 *
 * @returns {Promise<{ left: number, total: number }>}
 */
export const getPassesLeft = async () => ({
  left: (await nextTicketNumber()) ?? 0,
  total: MAX_TICKET_NUMBER,
});

export const findTicketForRsvp = async (rsvpId) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("rsvp_id", rsvpId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Issues the ticket for a confirmed RSVP. Unique constraints on rsvp_id and code make this
 * safe to race: a duplicate confirmation returns the existing ticket, and a code taken by
 * another guest moves on to the next number.
 *
 * @param {Object} rsvp - Row from public.rsvps
 * @returns {Promise<Object|null>} The ticket row, or null if every code has been issued
 */
export const issueTicketForRsvp = async (rsvp) => {
  for (let attempt = 0; attempt < ISSUE_ATTEMPTS; attempt++) {
    const ticketNumber = await nextTicketNumber();
    if (ticketNumber === null) return null;

    const code = `ZURI${String(ticketNumber).padStart(3, "0")}`;
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        rsvp_id: rsvp.id,
        email: rsvp.email,
        tier_name: rsvp.tier_name,
        quantity: rsvp.quantity,
        event_vol: rsvp.event_vol,
        user_id: rsvp.user_id,
        code,
        ticket_code: code,
        ticket_number: ticketNumber,
        used: false,
      })
      .select("*")
      .single();

    if (!error) {
      console.log(`Success: Issued ticket ${ticket.code} for RSVP ${rsvp.id}`);
      return ticket;
    }

    if (error.code !== "23505") throw error;
    if (error.message.includes("rsvp_id")) return findTicketForRsvp(rsvp.id);
  }

  throw new Error("Could not allocate a ticket code. Please try again.");
};

/**
 * Generates the PDF pass for a ticket.
 *
 * @param {Object} ticket - Row from public.tickets
 * @param {Object} event - Result of getCurrentEvent
 * @returns {Promise<{ pdfData: Object, pdfBuffer: Buffer }>}
 */
export const buildTicketPass = async (ticket, event) => {
  const pdfData = {
    eventTitle: event.title,
    venue: event.venue,
    eventDate: event.date,
    code: ticket.code,
    eventVol: ticket.event_vol,
    issuedDate: ticket.created_at.split("T")[0],
  };

  return { pdfData, pdfBuffer: await generateTicketPDF(pdfData) };
};

/**
 * Emails the PDF pass to the email the guest RSVP'd with.
 *
 * @param {Object} rsvp - Row from public.rsvps
 * @param {Object} ticket - Row from public.tickets
 * @param {Object} event - Result of getCurrentEvent
 */
export const deliverTicket = async (rsvp, ticket, event) => {
  const { pdfData, pdfBuffer } = await buildTicketPass(ticket, event);

  await sendTicketEmail(rsvp.email, pdfData, pdfBuffer);

  const now = new Date().toISOString();
  await supabase.from("rsvps").update({ ticket_emailed_at: now, last_email_at: now }).eq("id", rsvp.id);
};
