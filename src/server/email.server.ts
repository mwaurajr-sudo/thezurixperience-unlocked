// Emails for invites, RSVP confirmations and tickets, sent through Resend (https://resend.com).
// Settings, set as Cloudflare secrets/variables:
//   RESEND_API_KEY     - the Resend API key
//   EMAIL_FROM         - sender for RSVP and ticket emails, e.g. tickets@thezurixperience.co.ke
//   INVITE_EMAIL_FROM  - sender for invites (optional; falls back to EMAIL_FROM)
//   REPLY_TO           - where guests' replies go (optional)
// The sender's domain must be verified in Resend first.
import type { TicketPdfData } from "./pdf.server";

type RsvpEmailData = { customerName: string; eventTitle: string; eventDate: string; confirmUrl: string };
type InviteEmailData = { guestName: string; eventDate: string; doors: string; rsvpUrl: string };

// Guests see this as the sender, whichever mailbox the email goes out through.
const SENDER_NAME = "Zuri";

const PRIMARY_RED = "#bf2e26";
const BG_COLOR = "#000000";
const BOX_BG = "#0a0a0a";
const TEXT_GREY = "#a6a6a6";
const TEXT_WHITE = "#f2f2f2";

/**
 * Guest-supplied values end up in the HTML, so they must never be rendered as markup.
 */
const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  } as Record<string, string>)[c]);

/**
 * Wraps email content in the shared TheZuriXperience layout.
 */
const buildLayout = ({ title, subtitle, body }: { title: string; subtitle: string; body: string }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} — TheZuriXperience</title>
      </head>
      <body style="background-color:${BG_COLOR};color:${TEXT_GREY};font-family:'Courier New',Courier,monospace;margin:0;padding:0;">
        <div style="max-width:600px;margin:20px auto;background-color:${BG_COLOR};border:2px solid ${PRIMARY_RED};padding:30px;">
          <div style="text-align:center;border-bottom:1px solid ${PRIMARY_RED};padding-bottom:20px;margin-bottom:25px;">
            <h1 style="color:${PRIMARY_RED};font-size:16px;font-weight:bold;letter-spacing:4px;margin:0;text-transform:uppercase;">★ THE ZURI XPERIENCE ★</h1>
            <p style="color:${TEXT_WHITE};font-size:11px;letter-spacing:2px;margin:10px 0 0 0;text-transform:uppercase;">${subtitle}</p>
          </div>
          ${body}
          <p style="text-align:center;font-size:10px;color:${PRIMARY_RED};margin-top:30px;letter-spacing:1.5px;">[ LOOK NO FURTHER ]</p>
        </div>
      </body>
    </html>
  `;

const paragraph = (html: string) =>
  `<div style="font-size:13px;line-height:1.8;color:${TEXT_GREY};margin-bottom:25px;">${html}</div>`;

const detailRow = (label: string, value: unknown) => `
  <div style="margin:8px 0;font-size:12px;">
    <span style="color:${TEXT_GREY};display:inline-block;width:140px;">${label}:</span>
    <span style="color:${TEXT_WHITE};font-weight:bold;">${escapeHtml(value)}</span>
  </div>`;

/**
 * First email: asks the guest to confirm attendance.
 *
 * @param {Object} data - { customerName, eventTitle, eventDate, confirmUrl }
 * @returns {string} HTML body
 */
const buildRsvpTemplate = (data: RsvpEmailData) =>
  buildLayout({
    title: "Confirm Your Attendance",
    subtitle: "RSVP received — one step left",
    body: `
      ${paragraph(`
        Salutations, <strong style="color:${TEXT_WHITE};">${escapeHtml(data.customerName)}</strong>.<br><br>
        We have your RSVP for <strong>${escapeHtml(data.eventTitle.toUpperCase())}</strong>. Confirm your attendance below and your ticket will follow in a separate email.
      `)}
      <div style="background-color:${BOX_BG};border:1px dashed ${PRIMARY_RED};padding:20px;margin-bottom:25px;">
        ${detailRow("EVENT", data.eventTitle.toUpperCase())}
        ${detailRow("DATE & TIME", data.eventDate)}
        ${detailRow("VENUE", "Sent with your ticket")}
        ${detailRow("PASS", "ADMITS YOU + A PLUS ONE")}
      </div>
      <a href="${escapeHtml(data.confirmUrl)}" style="display:block;text-align:center;background-color:${PRIMARY_RED};color:#000000;padding:14px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Confirm Attendance →</a>
      <p style="font-size:11px;line-height:1.6;color:${TEXT_GREY};margin-top:20px;">
        This link expires in 7 days. If you didn't RSVP, ignore this email and no ticket will be issued.
      </p>
    `,
  });

/**
 * Second email: delivers the ticket after the guest has confirmed.
 *
 * @param {Object} data - { eventTitle, eventDate, venue, code }
 * @returns {string} HTML body
 */
const buildTicketTemplate = (data: TicketPdfData) =>
  buildLayout({
    title: "Your Ticket",
    subtitle: "Entry confirmed & registered",
    body: `
      ${paragraph(`
        Your attendance at <strong>${escapeHtml(data.eventTitle.toUpperCase())}</strong> is confirmed. You are officially on the guestlist.
      `)}
      <div style="background-color:${BOX_BG};border:1px dashed ${PRIMARY_RED};padding:20px;margin-bottom:25px;">
        <div style="color:${PRIMARY_RED};font-size:11px;font-weight:bold;letter-spacing:2px;margin:0 0 15px 0;text-transform:uppercase;padding-bottom:8px;">Official Gate Pass Voucher</div>
        <div style="background-color:${PRIMARY_RED};color:#000000;font-size:20px;font-weight:bold;text-align:center;padding:10px;letter-spacing:3px;margin-bottom:20px;">${escapeHtml(data.code)}</div>
        ${detailRow("EVENT", data.eventTitle.toUpperCase())}
        ${detailRow("DATE & TIME", data.eventDate)}
        ${detailRow("VENUE", data.venue)}
        ${detailRow("PASS", "ADMITS YOU + A PLUS ONE")}
      </div>
      ${paragraph(`
        ★ <strong>Door Access:</strong><br>
        Your official PDF entry voucher is attached to this email. Please save it to your phone or present your pass code at the gate.
      `)}
    `,
  });

/**
 * Event invite, in the organiser's wording, with the link to RSVP.
 *
 * @param {Object} data - { guestName, eventDate, doors, rsvpUrl }
 * @returns {string} HTML body
 */
const buildInviteTemplate = (data: InviteEmailData) => {
  const listItem = (html: string) => `<li style="margin-bottom:6px;">${html}</li>`;
  const callout = data.guestName
    ? `<strong style="color:${TEXT_WHITE};">${escapeHtml(data.guestName)}</strong>, we want you at Zuri.`
    : "We want you at Zuri.";

  return buildLayout({
    title: "You're Invited",
    subtitle: "You're invited",
    body: `
      ${paragraph(`
        Zuri started as a feeling. That one late night song that gets you in, deep. That's what's inside Zuri's Room. The feel, the intimacy; crafted by an art we all love; music. Come through, meet new people, sing some Bryson Tiller then go tell the story after. ${callout}
      `)}
      ${paragraph(`
        <strong style="color:${TEXT_WHITE};">What you should know:</strong>
        <ul style="padding-left:18px;margin:10px 0 0 0;">
          ${listItem(`Date: <strong style="color:${TEXT_WHITE};">${escapeHtml(data.eventDate)}</strong>`)}
          ${listItem(`Venue: <strong style="color:${TEXT_WHITE};">Upon your confirmation</strong>`)}
          ${listItem(`Time: <strong style="color:${TEXT_WHITE};">${escapeHtml(data.doors)}</strong>`)}
          ${listItem("Bring your own bottle")}
          ${listItem("Invite is valid for you and a plus one")}
          ${listItem("Be prepared to be on camera for YT.")}
        </ul>
      `)}
      ${paragraph(`
        *No payment to be made, bring yo bottle, lets have a good time.<br><br>
        <strong style="color:${PRIMARY_RED};">ZURI</strong><br><br>
        Kindly confirm your availability to receive further details.
      `)}
      <a href="${escapeHtml(data.rsvpUrl)}" style="display:block;text-align:center;background-color:${PRIMARY_RED};color:#000000;padding:14px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px;">Confirm Availability →</a>
      <p style="font-size:11px;line-height:1.6;color:${TEXT_GREY};margin:0;">
        Press the button and enter your name and email. We'll email you a link to confirm, then your ticket with the venue will follow.
      </p>
    `,
  });
};

/** "Zuri <address>" from a configured sender, which may be a bare address or "Name <address>". */
const sender = (configured: string | undefined) => {
  const address = configured?.match(/<([^>]+)>/)?.[1] ?? configured?.trim();
  return address ? `${SENDER_NAME} <${address}>` : null;
};

const base64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

type Message = {
  from: string | null;
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Uint8Array }[];
};

/** Sends one email through the Resend API. Throws with Resend's reason if it is refused. */
const dispatch = async ({ from, to, subject, html, attachments = [] }: Message) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !from) {
    throw new Error("Email isn't set up: add RESEND_API_KEY and EMAIL_FROM in Cloudflare.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: process.env.REPLY_TO || "zurixperience@gmail.com",
      subject,
      html,
      attachments: attachments.map((a) => ({ filename: a.filename, content: base64(a.content) })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend refused the email (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json();
};

/** The "confirm your attendance" email. */
export const sendRsvpEmail = (toEmail: string, data: RsvpEmailData) =>
  dispatch({
    from: sender(process.env.EMAIL_FROM),
    to: toEmail,
    subject: `Confirm your attendance — ${data.eventTitle}`,
    html: buildRsvpTemplate(data),
  });

/** The ticket, with its PDF pass attached. */
export const sendTicketEmail = (toEmail: string, ticketData: TicketPdfData, pdf: Uint8Array) =>
  dispatch({
    from: sender(process.env.EMAIL_FROM),
    to: toEmail,
    subject: `Your ticket: ${ticketData.code} — TheZuriXperience`,
    html: buildTicketTemplate(ticketData),
    attachments: [{ filename: `Ticket-${ticketData.code}.pdf`, content: pdf }],
  });

/** The event invite, with the link to RSVP. */
export const sendInviteEmail = (toEmail: string, data: InviteEmailData) =>
  dispatch({
    from: sender(process.env.INVITE_EMAIL_FROM || process.env.EMAIL_FROM),
    to: toEmail,
    subject: data.guestName ? `${data.guestName}, we want you at Zuri` : "We want you at Zuri",
    html: buildInviteTemplate(data),
  });
