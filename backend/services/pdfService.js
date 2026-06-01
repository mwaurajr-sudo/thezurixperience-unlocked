import PDFDocument from "pdfkit";

/**
 * Generates a premium high-fashion PDF ticket voucher.
 * Matches the Wine & Black absolute dark-theme aesthetic of TheZuriXperience.
 *
 * @param {Object} data - Ticket details: { eventTitle, venue, eventDate, code, customerName, receiptNumber, amountPaid, purchaseDate }
 * @returns {Promise<Buffer>} PDF file binary buffer
 */
export const generateTicketPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      // Create landscape concert voucher style ticket (width: 600, height: 260)
      const doc = new PDFDocument({ size: [600, 260], margin: 0 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Colors
      const bgColor = "#000000";
      const primaryRed = "#bf2e26"; // Curated typewriter blood red
      const textGrey = "#8c8c8c"; // Dimmed details
      const textWhite = "#e6e6e6"; // Crisp highlight

      // 1. Draw solid background
      doc.rect(0, 0, 600, 260).fill(bgColor);

      // 2. Draw aesthetic typewriter double border
      doc.rect(10, 10, 580, 240).lineWidth(1).stroke(primaryRed);
      doc.rect(13, 13, 574, 234).lineWidth(0.5).stroke(primaryRed);

      // 3. Draw vertical dash line separating ticket from stub (at x: 440)
      doc.moveTo(440, 13).lineTo(440, 247).lineWidth(1).dash(5, { space: 4 }).stroke(primaryRed);
      doc.undash(); // Clear dash styling for subsequent lines

      // 4. Ticket Left Section Content (x: 30 to 420)
      // Top Brand Header
      doc.font("Courier-Bold").fontSize(10).fillColor(primaryRed);
      doc.text("★  THE ZURI XPERIENCE  ★", 30, 30, { characterSpacing: 2 });

      // Divider Line
      doc.moveTo(30, 48).lineTo(420, 48).lineWidth(0.5).stroke(primaryRed);

      // Large Event Title
      doc.font("Courier-Bold").fontSize(16).fillColor(textWhite);
      const uppercaseTitle = (data.eventTitle || "RNB NIGHTS").toUpperCase();
      doc.text(uppercaseTitle, 30, 60, { characterSpacing: 1 });

      // Metadata details rows
      const details = [
        { label: "CUSTOMER:", value: data.customerName || "N/A" },
        { label: "EVENT VOL:", value: data.eventVol || "01" },
        { label: "VENUE:", value: data.venue || "Disclosed at door" },
        { label: "DATE & TIME:", value: data.eventDate || "Saturday, December 14" },
        { label: "MPESA REF:", value: data.receiptNumber || "N/A" },
        { label: "TOTAL PAID:", value: `KES ${Number(data.amountPaid).toLocaleString()}` },
        { label: "ISSUED:", value: data.purchaseDate || new Date().toISOString().split("T")[0] },
      ];

      let yPos = 90;
      doc.font("Courier").fontSize(9);
      details.forEach((row) => {
        doc.fillColor(textGrey).text(row.label.padEnd(13, " "), 30, yPos);
        doc.fillColor(textWhite).text(row.value, 135, yPos);
        yPos += 16;
      });

      // Bottom aesthetic text footer
      doc.font("Courier-Bold").fontSize(8).fillColor(primaryRed);
      doc.text("[ INVITE ONLY  ·  DOORS AT 9:00 PM  ·  DRESS TO BURN ]", 30, 222, { characterSpacing: 1.5 });

      // 5. Stub Right Section Content (x: 455 to 580)
      doc.font("Courier-Bold").fontSize(9).fillColor(primaryRed);
      doc.text("TICKET STUB", 455, 30, { align: "center", width: 120 });
      doc.moveTo(455, 48).lineTo(570, 48).lineWidth(0.5).stroke(primaryRed);

      // Ticket Code display box
      doc.rect(455, 65, 115, 35).fill(primaryRed);
      doc.font("Courier-Bold").fontSize(13).fillColor("#000000");
      doc.text(data.code || "ZURI999", 455, 75, { align: "center", width: 115 });

      // Stub details list
      doc.font("Courier").fontSize(8).fillColor(textGrey);
      doc.text("PASS CATEGORY:", 455, 115);
      doc.font("Courier-Bold").fontSize(9).fillColor(textWhite);
      doc.text((data.tierName || "General").toUpperCase(), 455, 127);

      doc.font("Courier").fontSize(8).fillColor(textGrey);
      doc.text("ADMITTANCE:", 455, 150);
      doc.font("Courier-Bold").fontSize(9).fillColor(textWhite);
      doc.text(`${data.quantity || 1} GUEST(S)`, 455, 162);

      // Vertical Barcode aesthetic using simple tall rectangle lines
      let barX = 460;
      doc.lineWidth(1.5).fillColor(primaryRed);
      for (let i = 0; i < 18; i++) {
        const barWidth = i % 3 === 0 ? 3 : 1;
        doc.rect(barX, 190, barWidth, 30).fill(primaryRed);
        barX += barWidth + (i % 2 === 0 ? 3 : 1);
      }

      // Finish drawing and output stream
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
