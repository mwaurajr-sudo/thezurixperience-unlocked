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
            Your payment has been successfully cleared and mapped. You are officially registered for the upcoming volume of the Nairobi nightlife curation series.
          </div>

          <div class="ticket-card">
            <div class="ticket-header">Concert Gate Voucher</div>
            <div class="code-box">${data.code || "ZURI999"}</div>
            
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
              <span class="detail-label">M-PESA REF:</span>
              <span class="detail-value">${data.receiptNumber || "N/A"}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">TOTAL PAID:</span>
              <span class="detail-value">KES ${Number(data.amountPaid).toLocaleString()}</span>
            </div>
          </div>

          <div class="manifesto">
            We have generated and attached a high-fidelity **PDF entry pass** directly to this email. Please ensure you keep it saved on your mobile device. You will be required to present the barcode voucher to the foyer gatekeepers for scanner verification.
          </div>

          <p class="footer-note">[ LOOK NO FURTHER · DRESS TO BURN ]</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Sends a transactional confirmation email using Nodemailer (SMTP) or Resend API.
 *
 * @param {string} toEmail - Customer email address
 * @param {Object} ticketData - Ticket and event details
 * @param {Buffer} pdfBuffer - Generated PDF binary buffer
 * @returns {Promise<Object>} Sending receipt result
 */
export const sendConfirmationEmail = async (toEmail, ticketData, pdfBuffer) => {
  const emailFrom = process.env.EMAIL_FROM || '"TheZuriXperience" <no-reply@thezurixperience.com>';
  const subject = `Entry Confirmed: ${ticketData.code} — TheZuriXperience`;
  const htmlContent = buildEmailTemplate(ticketData);

  // Attachment details
  const attachment = {
    filename: `Ticket-${ticketData.code}.pdf`,
    content: pdfBuffer,
    contentType: "application/pdf",
  };

  // Option 1: Try Resend API first if configured
  if (process.env.RESEND_API_KEY) {
    console.log("Resend API Key detected. Dispatching email via Resend...");
    try {
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: emailFrom,
          to: toEmail,
          subject: subject,
          html: htmlContent,
          attachments: [
            {
              filename: attachment.filename,
              content: pdfBuffer.toString("base64"), // Resend expects base64 string
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
      // Fallback to Nodemailer if SMTP credentials exist, else rethrow
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error(`Email dispatch failed via Resend: ${err.message}`);
      }
      console.log("Attempting fallback to Nodemailer SMTP...");
    }
  }

  // Option 2: Fallback to Nodemailer SMTP
  const service = process.env.EMAIL_SERVICE || "gmail";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing SMTP credentials (EMAIL_USER / EMAIL_PASSWORD) and Resend API Key.");
  }

  console.log(`Configuring Nodemailer SMTP client via ${service}...`);
  const transporter = nodemailer.createTransport({
    service: service,
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: emailFrom,
    to: toEmail,
    subject: subject,
    html: htmlContent,
    attachments: [attachment],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email successfully dispatched via Nodemailer:", info.messageId);
    return info;
  } catch (err) {
    console.error("Nodemailer SMTP email transmission failure:", err.message);
    throw new Error(`Email dispatch failed via Nodemailer SMTP: ${err.message}`);
  }
};
