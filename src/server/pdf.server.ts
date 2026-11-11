// Builds the PDF ticket pass without any PDF library, so it runs on Cloudflare Workers
// (the old pdfkit version needed Node's file system). It uses the built-in PDF fonts
// Courier and Courier-Bold, which every PDF reader has, so nothing is embedded.

export type TicketPdfData = {
  eventTitle: string;
  venue: string;
  eventDate: string;
  doors: string;
  code: string;
  eventVol: string;
  issuedDate: string;
};

const WIDTH = 600;
const HEIGHT = 260;
// Courier is monospaced: every character is 0.6 of the font size wide, and the
// baseline sits 0.629 of the font size below the top of the line.
const CHAR_WIDTH = 0.6;
const ASCENT = 0.629;

const RED = "#bf2e26";
const GREY = "#8c8c8c";
const WHITE = "#e6e6e6";
const BLACK = "#000000";

const num = (n: number) => String(Math.round(n * 1000) / 1000);

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => num(parseInt(hex.slice(i, i + 2), 16) / 255)).join(" ");

// Characters outside plain ASCII, mapped to their place in the PDF's WinAnsi encoding.
const WIN_ANSI: Record<string, number> = { "—": 0x97, "–": 0x96, "’": 0x92, "‘": 0x91, "“": 0x93, "”": 0x94, "•": 0x95, "★": 0x2a };

/** Escapes text for a PDF string literal, keeping it plain ASCII. */
const pdfString = (text: string) => {
  let out = "";
  for (const ch of text) {
    const code = WIN_ANSI[ch] ?? ch.charCodeAt(0);
    if (ch === "(" || ch === ")" || ch === "\\") out += `\\${ch}`;
    else if (code >= 32 && code < 127) out += String.fromCharCode(code);
    else if (code >= 128 && code <= 255) out += `\\${code.toString(8).padStart(3, "0")}`;
    else out += "?";
  }
  return out;
};

type TextOptions = { bold?: boolean; size: number; color: string; spacing?: number; center?: number };

class Page {
  private ops: string[] = [];

  fillRect(x: number, y: number, w: number, h: number, color: string) {
    this.ops.push(`${rgb(color)} rg ${num(x)} ${num(HEIGHT - y - h)} ${num(w)} ${num(h)} re f`);
  }

  strokeRect(x: number, y: number, w: number, h: number, lineWidth: number, color: string) {
    this.ops.push(`${num(lineWidth)} w ${rgb(color)} RG ${num(x)} ${num(HEIGHT - y - h)} ${num(w)} ${num(h)} re S`);
  }

  line(x1: number, y1: number, x2: number, y2: number, lineWidth: number, color: string, dash?: [number, number]) {
    const dashOp = dash ? `[${dash[0]} ${dash[1]}] 0 d` : "[] 0 d";
    this.ops.push(
      `${dashOp} ${num(lineWidth)} w ${rgb(color)} RG ${num(x1)} ${num(HEIGHT - y1)} m ${num(x2)} ${num(HEIGHT - y2)} l S [] 0 d`,
    );
  }

  /** Draws text with its top-left corner at (x, y); with `center`, centres it in that width. */
  text(value: string, x: number, y: number, { bold, size, color, spacing = 0, center }: TextOptions) {
    const length = [...value].length;
    const width = length * CHAR_WIDTH * size + Math.max(0, length - 1) * spacing;
    const left = center === undefined ? x : x + (center - width) / 2;
    const baseline = HEIGHT - (y + ASCENT * size);
    this.ops.push(
      `BT /${bold ? "F2" : "F1"} ${num(size)} Tf ${num(spacing)} Tc ${rgb(color)} rg ${num(left)} ${num(baseline)} Td (${pdfString(value)}) Tj ET`,
    );
  }

  content() {
    return this.ops.join("\n");
  }
}

/** Assembles a one-page PDF file around the page's drawing commands. */
const assemble = (content: string): Uint8Array => {
  const font = (name: string) => `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${WIDTH} ${HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    font("Courier"),
    font("Courier-Bold"),
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  // Everything written is plain ASCII, so string length equals byte length for the offsets.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  return new TextEncoder().encode(pdf);
};

/** The ticket voucher: a 600 x 260 dark pass with a tear-off stub, as before. */
export const generateTicketPDF = (data: TicketPdfData): Uint8Array => {
  const page = new Page();

  // Background and double border
  page.fillRect(0, 0, WIDTH, HEIGHT, BLACK);
  page.strokeRect(10, 10, 580, 240, 1, RED);
  page.strokeRect(13, 13, 574, 234, 0.5, RED);

  // Dashed line between the ticket and its stub
  page.line(440, 13, 440, 247, 1, RED, [5, 4]);

  // Ticket: header, divider and event title
  page.text("*  THE ZURI XPERIENCE  *", 30, 30, { bold: true, size: 10, color: RED, spacing: 2 });
  page.line(30, 48, 420, 48, 0.5, RED);
  page.text((data.eventTitle || "RNB NIGHTS").toUpperCase(), 30, 60, { bold: true, size: 16, color: WHITE, spacing: 1 });

  // Ticket: details
  const details: [string, string][] = [
    ["EVENT VOL:", data.eventVol || "01"],
    ["VENUE:", data.venue || "Myra Residences, Kilimani"],
    ["DATE & TIME:", data.eventDate || "6th November"],
    ["ENTRY TYPE:", "DIRECT RSVP"],
    ["ACCESS:", "COMPLIMENTARY PASS"],
    ["ISSUED:", data.issuedDate || new Date().toISOString().split("T")[0]],
  ];
  details.forEach(([label, value], i) => {
    const y = 90 + i * 16;
    page.text(label, 30, y, { size: 9, color: GREY });
    page.text(value, 135, y, { size: 9, color: WHITE });
  });

  page.text(`[ INVITE ONLY  ·  ${(data.doors || "").toUpperCase()} ]`, 30, 222, {
    bold: true,
    size: 8,
    color: RED,
    spacing: 1.5,
  });

  // Stub: heading, code box and admittance
  page.text("TICKET STUB", 455, 30, { bold: true, size: 9, color: RED, center: 120 });
  page.line(455, 48, 570, 48, 0.5, RED);
  page.fillRect(455, 65, 115, 35, RED);
  page.text(data.code || "ZURI999", 455, 75, { bold: true, size: 13, color: BLACK, center: 115 });
  page.text("ADMITTANCE:", 455, 115, { size: 8, color: GREY });
  page.text("YOU + PLUS ONE", 455, 127, { bold: true, size: 9, color: WHITE });

  // Stub: barcode-style bars
  let barX = 460;
  for (let i = 0; i < 18; i++) {
    const barWidth = i % 3 === 0 ? 3 : 1;
    page.fillRect(barX, 190, barWidth, 30, RED);
    barX += barWidth + (i % 2 === 0 ? 3 : 1);
  }

  return assemble(page.content());
};
