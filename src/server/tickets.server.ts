import { db } from "./db.server";
import { sendTicketEmail } from "./email.server";
import type { CurrentEvent } from "./event.server";
import { generateTicketPDF, type TicketPdfData } from "./pdf.server";

const MAX_TICKET_NUMBER = 99;
const ISSUE_ATTEMPTS = 5;

// Rows from public.rsvps and public.tickets, with the columns used here.
export type RsvpRow = {
  id: string;
  email: string;
  full_name: string;
  tier_name: string;
  quantity: number;
  event_vol: string;
  user_id: string | null;
  token_expires_at: string;
  last_email_at: string | null;
  ticket_emailed_at: string | null;
};

export type TicketRow = {
  id: string;
  code: string;
  quantity: number;
  event_vol: string;
  email: string;
  created_at: string;
};

/** Finds the next countdown ticket number (99, 98, ... 1), or null once all are issued. */
const nextTicketNumber = async (): Promise<number | null> => {
  const { data, error } = await db()
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

/** Counts down with the ticket codes: 99 before the first ticket, 98 after ZURI099, and so on. */
export const getPassesLeft = async () => ({
  left: (await nextTicketNumber()) ?? 0,
  total: MAX_TICKET_NUMBER,
});

export const findTicketForRsvp = async (rsvpId: string): Promise<TicketRow | null> => {
  const { data, error } = await db().from("tickets").select("*").eq("rsvp_id", rsvpId).maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Issues the ticket for a confirmed RSVP. Unique constraints on rsvp_id and code make this
 * safe to race: a duplicate confirmation returns the existing ticket, and a code taken by
 * another guest moves on to the next number. Returns null once every code has been issued.
 */
export const issueTicketForRsvp = async (rsvp: RsvpRow): Promise<TicketRow | null> => {
  for (let attempt = 0; attempt < ISSUE_ATTEMPTS; attempt++) {
    const ticketNumber = await nextTicketNumber();
    if (ticketNumber === null) return null;

    const code = `ZURI${String(ticketNumber).padStart(3, "0")}`;
    const { data: ticket, error } = await db()
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

    if (!error) return ticket;
    if (error.code !== "23505") throw error;
    if (error.message.includes("rsvp_id")) return findTicketForRsvp(rsvp.id);
  }

  throw new Error("Could not allocate a ticket code. Please try again.");
};

/** Generates the PDF pass for a ticket. */
export const buildTicketPass = (ticket: TicketRow, event: CurrentEvent) => {
  const pdfData: TicketPdfData = {
    eventTitle: event.title,
    venue: event.venue,
    eventDate: event.when,
    doors: event.doors,
    code: ticket.code,
    eventVol: ticket.event_vol,
    issuedDate: ticket.created_at.split("T")[0],
  };
  return { pdfData, pdf: generateTicketPDF(pdfData) };
};

/** Emails the PDF pass to the address the guest RSVP'd with. */
export const deliverTicket = async (rsvp: RsvpRow, ticket: TicketRow, event: CurrentEvent) => {
  const { pdfData, pdf } = buildTicketPass(ticket, event);
  await sendTicketEmail(rsvp.email, pdfData, pdf);

  const now = new Date().toISOString();
  await db().from("rsvps").update({ ticket_emailed_at: now, last_email_at: now }).eq("id", rsvp.id);
};

/** The ticket as shown on screen, including the venue. */
export const ticketPayload = (ticket: TicketRow, event: CurrentEvent) => ({
  code: ticket.code,
  quantity: ticket.quantity,
  eventTitle: event.title,
  eventDate: event.when,
  venue: event.venue,
  email: ticket.email,
});
