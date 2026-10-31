import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Builds a highly responsive, styled HTML email template matching TheZuriXperience aesthetics.
 *
 * @param {Object} data - Ticket details: { eventTitle, venue, eventDate, code, customerName, receiptNumber, amountPaid, quantity, tierName }
 * @returns {string} Fully responsive HTML structure
 */
const buildEmailTemplate = (data) => {
  const primaryRed = "#bf2e26";
  const bgColor = "#000000";
  const boxBg = "#0a0a0a";
  const textGrey = "#a6a6a6";
  const textWhite = "#f2f2f2";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Confirmation — TheZuriXperience</title>
        <style>
          body {
            background-color: ${bgColor};
            color: ${textGrey};
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: ${bgColor};
            border: 2px solid ${primaryRed};
            padding: 30px;
          }
          .header {
            text-align: center;
            border-b: 1px solid ${primaryRed};
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .title {
            color: ${primaryRed};
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
          }
          .subtitle {
            color: ${textWhite};
            font-size: 11px;
            letter-spacing: 2px;
            margin: 10px 0 0 0;
            text-transform: uppercase;
          }
          .manifesto {
            font-size: 13px;
            line-height: 1.8;
            color: ${textGrey};
            margin-bottom: 25px;
          }
          .ticket-card {
            background-color: ${boxBg};
            border: 1px dashed ${primaryRed};
            padding: 20px;
            margin-bottom: 25px;
          }
          .ticket-header {
            color: ${primaryRed};
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 0 0 15px 0;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(191, 46, 38, 0.2);
            padding-bottom: 8px;
          }
          .code-box {
            background-color: ${primaryRed};
            color: #000000;
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            letter-spacing: 3px;
            margin-bottom: 20px;
            font-family: 'Courier New', Courier, monospace;
          }
          .detail-row {
            margin: 8px 0;
            font-size: 12px;
          }
          .detail-label {
            color: ${textGrey};
            display: inline-block;
            width: 140px;
          }
          .detail-value {
            color: ${textWhite};
            font-weight: bold;
          }
          .footer-note {
            text-align: center;
            font-size: 10px;
            color: ${primaryRed};
            margin-top: 30px;
            letter-spacing: 1.5px;
          }
          .link-btn {
            display: block;
            text-align: center;
            background-color: transparent;
            color: ${primaryRed};
            border: 1px solid ${primaryRed};
            padding: 12px;
            text-decoration: none;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 20px;
          }
          .link-btn:hover {
            background-color: ${primaryRed};
            color: #000000;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">★ THE ZURI XPERIENCE ★</h1>
            <p class="subtitle">ENTRY CONFIRMED & REGISTERED</p>
          </div>

          <div class="manifesto">
            Salutations, <strong style="color:${textWhite};">${data.customerName || "Guest"}</strong>.<br><br>
            Your complimentary RSVP pass for <strong>${(data.eventTitle || "The Zuri Experience").toUpperCase()}</strong> has been confirmed. You are officially registered on the guestlist.
          </div>

          <div class="ticket-card">
            <div class="ticket-header">Official Gate Pass Voucher</div>
            <div class="code-box">${data.code || "ZURI099"}</div>
            
            <div class="detail-row">
              <span class="detail-label">EVENT:</span>
              <span class="detail-value">${(data.eventTitle || "RNB NIGHTS").toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">DATE & TIME:</span>
              <span class="detail-value">${data.eventDate || "Saturday, December 14"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">VENUE:</span>
              <span class="detail-value">${data.venue || "Disclosed at door"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">PASS TYPE:</span>
              <span class="detail-value">${(data.tierName || "General").toUpperCase()} (${data.quantity || 1} GUEST(S))</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">REGISTRATION:</span>
              <span class="detail-value">CONFIRMED RSVP</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">ACCESS:</span>
              <span class="detail-value">COMPLIMENTARY PASS</span>
            </div>
          </div>

          <div class="manifesto">
            ★ <strong>How to unlock the DJ Playlist:</strong><br>
            Log in to the website and open the <strong>Playlist</strong> tab. Enter your exclusive ticket code <strong style="color:${primaryRed};">${data.code}</strong> to instantly unlock the private chapter mix.
            <br><br>
            ★ <strong>Door Access:</strong><br>
            Your official PDF entry voucher is attached directly to this email. Please save it to your phone or present your pass code at the gate.
          </div>

          <p class="footer-note">[ LOOK NO FURTHER · DRESS TO BURN ]</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Sends a transactional confirmation email using Nodemailer (Gmail SMTP) or Resend API.
 *
 * @param {string} toEmail - Customer email address
 * @param {Object} ticketData - Ticket and event details
 * @param {Buffer} pdfBuffer - Generated PDF binary buffer
 * @returns {Promise<Object>} Sending receipt result
 */
export const sendConfirmationEmail = async (toEmail, ticketData, pdfBuffer) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const service = process.env.EMAIL_SERVICE || "gmail";
  const emailFrom = process.env.EMAIL_FROM || (user ? `"TheZuriXperience" <${user}>` : '"TheZuriXperience" <zuri@gmail.com>');
  const subject = `Entry Confirmed: ${ticketData.code} — TheZuriXperience`;
  const htmlContent = buildEmailTemplate(ticketData);

  // Attachment details
  const attachment = {
    filename: `Ticket-${ticketData.code}.pdf`,
    content: pdfBuffer,
    contentType: "application/pdf",
  };

  // Option 1: Prioritize Gmail / Nodemailer SMTP if user credentials are provided
  const hasValidSmtp = user && pass && user !== "your-email@gmail.com" && pass !== "your-gmail-app-password";
  if (hasValidSmtp) {
    try {
      console.log(`Configuring Nodemailer SMTP client via ${service} (${user})...`);
      const transporter = nodemailer.createTransport({
        service: service,
        auth: {
          user: user,
          pass: pass,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"zurixperience@gmail.com" <${user}>`,
        replyTo: process.env.REPLY_TO || "zurixperience@gmail.com",
        to: toEmail,
        subject: subject,
        html: htmlContent,
        attachments: [attachment],
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email successfully dispatched via Nodemailer:", info.messageId);
      return info;
    } catch (err) {
      console.error("Nodemailer SMTP email transmission failure:", err.message);
      if (!process.env.RESEND_API_KEY) {
        throw new Error(`Email dispatch failed via Nodemailer SMTP: ${err.message}`);
      }
      console.log("Attempting fallback to Resend API...");
    }
  }

  // Option 2: Dispatch via Resend API (if configured or as fallback)
  if (process.env.RESEND_API_KEY) {
    console.log("Dispatching email via Resend API...");
    try {
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: emailFrom.includes("gmail.com") ? "TheZuriXperience <onboarding@resend.dev>" : emailFrom,
          to: toEmail,
          subject: subject,
          html: htmlContent,
          attachments: [
            {
              filename: attachment.filename,
              content: pdfBuffer.toString("base64"),
            },
          ],
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
      console.error("Resend API email transmission failure:", err.response?.data || err.message);
      throw new Error(`Email dispatch failed via Resend: ${err.message}`);
    }
  }

  throw new Error("Missing email credentials. Please configure EMAIL_USER and EMAIL_PASSWORD in backend/.env.");
};
