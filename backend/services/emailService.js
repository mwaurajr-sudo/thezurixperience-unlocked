import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

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
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

/**
 * Wraps email content in the shared TheZuriXperience layout.
 */
const buildLayout = ({ title, subtitle, body }) => `
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
          <p style="text-align:center;font-size:10px;color:${PRIMARY_RED};margin-top:30px;letter-spacing:1.5px;">[ LOOK NO FURTHER · DRESS TO BURN ]</p>
        </div>
      </body>
    </html>
  `;

const paragraph = (html) =>
  `<div style="font-size:13px;line-height:1.8;color:${TEXT_GREY};margin-bottom:25px;">${html}</div>`;

const detailRow = (label, value) => `
  <div style="margin:8px 0;font-size:12px;">
    <span style="color:${TEXT_GREY};display:inline-block;width:140px;">${label}:</span>
    <span style="color:${TEXT_WHITE};font-weight:bold;">${escapeHtml(value)}</span>
  </div>`;

/**
 * First email: asks the guest to confirm attendance.
 *
 * @param {Object} data - { customerName, eventTitle, eventDate, venue, quantity, confirmUrl }
 * @returns {string} HTML body
 */
const buildRsvpTemplate = (data) =>
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
        ${detailRow("VENUE", data.venue)}
        ${detailRow("PASS", `${data.quantity} GUEST(S)`)}
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
 * @param {Object} data - { eventTitle, eventDate, venue, code, quantity }
 * @returns {string} HTML body
 */
const buildTicketTemplate = (data) =>
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
        ${detailRow("PASS", `${data.quantity} GUEST(S)`)}
      </div>
      ${paragraph(`
        ★ <strong>How to unlock the DJ Playlist:</strong><br>
        Log in to the website and open the <strong>Playlist</strong> tab. Enter your exclusive ticket code <strong style="color:${PRIMARY_RED};">${escapeHtml(data.code)}</strong> to instantly unlock the private chapter mix.
        <br><br>
        ★ <strong>Door Access:</strong><br>
        Your official PDF entry voucher is attached to this email. Please save it to your phone or present your pass code at the gate.
      `)}
    `,
  });

/**
 * Event invite: the event details, the RSVP link and how to get a ticket.
 *
 * @param {Object} data - { eventTitle, eventDate, doors, venue, rsvpUrl }
 * @returns {string} HTML body
 */
const buildInviteTemplate = (data) =>
  buildLayout({
    title: "You're Invited",
    subtitle: "You're invited",
    body: `
      ${paragraph(`
        You're invited to <strong style="color:${TEXT_WHITE};">${escapeHtml(data.eventTitle.toUpperCase())}</strong>. Entry is complimentary, but you need a ticket to get in.
      `)}
      <div style="background-color:${BOX_BG};border:1px dashed ${PRIMARY_RED};padding:20px;margin-bottom:25px;">
        ${detailRow("EVENT", data.eventTitle.toUpperCase())}
        ${detailRow("DATE", data.eventDate)}
        ${detailRow("TIME", data.doors)}
        ${detailRow("VENUE", data.venue)}
      </div>
      <a href="${escapeHtml(data.rsvpUrl)}" style="display:block;text-align:center;background-color:${PRIMARY_RED};color:#000000;padding:14px;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:25px;">RSVP Now →</a>
      ${paragraph(`
        <strong style="color:${TEXT_WHITE};">How to RSVP and get your ticket:</strong><br>
        1. Press <strong>RSVP Now</strong> above, or open this link: <a href="${escapeHtml(data.rsvpUrl)}" style="color:${PRIMARY_RED};">${escapeHtml(data.rsvpUrl)}</a><br>
        2. Press <strong>RSVP</strong> on the page, enter your name and email, then press <strong>Send RSVP</strong>. You don't need an account.<br>
        3. Look for an email from <strong>Zuri</strong> and press <strong>Confirm Attendance</strong>. Check your spam folder if you don't see it.<br>
        4. Your ticket arrives by email as a PDF. Save it and show your pass code at the door.
      `)}
    `,
  });

/**
 * Reads one sender's settings. Invites have their own account and never fall back to
 * the one that handles RSVP and ticket emails.
 *
 * @param {string} prefix - Environment variable prefix ("EMAIL" or "INVITE_EMAIL")
 */
const readSender = (prefix) => {
  const user = process.env[`${prefix}_USER`];
  const pass = process.env[`${prefix}_PASSWORD`];
  const configuredFrom = process.env[`${prefix}_FROM`] || user;
  const address = configuredFrom?.match(/<([^>]+)>/)?.[1] ?? configuredFrom;
  return {
    prefix,
    user,
    pass,
    service: process.env[`${prefix}_SERVICE`] || "gmail",
    host: process.env[`${prefix}_HOST`],
    port: process.env[`${prefix}_PORT`],
    from: address ? `"${SENDER_NAME}" <${address}>` : null,
    replyTo: process.env[`${prefix}_REPLY_TO`] || process.env.REPLY_TO || "zurixperience@gmail.com",
    hasSmtp: Boolean(user && pass && user !== "your-email@gmail.com" && pass !== "your-gmail-app-password"),
  };
};

const buildTransport = (sender) => {
  const auth = { user: sender.user, pass: sender.pass };
  if (sender.host) {
    const port = Number(sender.port) || 587;
    return nodemailer.createTransport({ host: sender.host, port, secure: port === 465, auth });
  }
  return nodemailer.createTransport({ service: sender.service, auth });
};

/**
 * Sends a message from the given sender using Nodemailer SMTP, or the Resend API
 * if SMTP is unavailable.
 *
 * @param {Object} sender - Result of readSender
 * @param {Object} message - { to, subject, html, attachments }
 * @returns {Promise<Object>} Sending receipt result
 */
const dispatch = async (sender, { to, subject, html, attachments = [] }) => {
  if (sender.hasSmtp) {
    try {
      const info = await buildTransport(sender).sendMail({
        from: sender.from,
        replyTo: sender.replyTo,
        to,
        subject,
        html,
        attachments,
      });
      console.log(`Email dispatched via SMTP (${sender.prefix}):`, info.messageId);
      return info;
    } catch (err) {
      console.error(`SMTP transmission failure (${sender.prefix}):`, err.message);
      if (!process.env.RESEND_API_KEY) {
        throw new Error(`Email dispatch failed via SMTP: ${err.message}`);
      }
      console.log("Attempting fallback to Resend API...");
    }
  }

  if (process.env.RESEND_API_KEY && sender.from) {
    try {
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: sender.from,
          reply_to: sender.replyTo,
          to,
          subject,
          html,
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content.toString("base64"),
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Resend API transmission failure:", err.response?.data || err.message);
      throw new Error(`Email dispatch failed via Resend: ${err.message}`);
    }
  }

  throw new Error(
    `Missing email credentials. Configure ${sender.prefix}_USER and ${sender.prefix}_PASSWORD (or RESEND_API_KEY and ${sender.prefix}_FROM) in backend/.env.`
  );
};

/**
 * Sends the "confirm your attendance" email from the main address (EMAIL_*).
 *
 * @param {string} toEmail - Guest email address
 * @param {Object} data - RSVP and event details, including confirmUrl
 */
export const sendRsvpEmail = (toEmail, data) =>
  dispatch(readSender("EMAIL"), {
    to: toEmail,
    subject: `Confirm your attendance — ${data.eventTitle}`,
    html: buildRsvpTemplate(data),
  });

/**
 * Sends the ticket with its PDF attached from the main address (EMAIL_*).
 *
 * @param {string} toEmail - Guest email address
 * @param {Object} ticketData - Ticket and event details
 * @param {Buffer} pdfBuffer - Generated PDF binary buffer
 */
export const sendTicketEmail = (toEmail, ticketData, pdfBuffer) =>
  dispatch(readSender("EMAIL"), {
    to: toEmail,
    subject: `Your ticket: ${ticketData.code} — TheZuriXperience`,
    html: buildTicketTemplate(ticketData),
    attachments: [
      {
        filename: `Ticket-${ticketData.code}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

/**
 * Sends the event invite from the invite address (INVITE_EMAIL_*).
 *
 * @param {string} toEmail - Guest email address
 * @param {Object} data - Event details and rsvpUrl
 */
export const sendInviteEmail = (toEmail, data) =>
  dispatch(readSender("INVITE_EMAIL"), {
    to: toEmail,
    subject: `You're invited: ${data.eventTitle}`,
    html: buildInviteTemplate(data),
  });
