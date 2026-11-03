import { CheckCircle2, Download } from "lucide-react";
import { BACKEND_URL } from "@/lib/backend";

export interface DigitalTicketPassProps {
  code: string;
  quantity?: number;
  eventTitle?: string;
  eventDate?: string;
  venue?: string;
  email?: string;
}

export function DigitalTicketPass({
  code,
  quantity = 1,
  eventTitle = "The Zuri Experience",
  eventDate = "Saturday, Dec 14",
  venue = "Myra Residences, Kilimani",
  email,
}: DigitalTicketPassProps) {
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border-2 border-primary/80 bg-black/95 p-6 font-mono text-primary shadow-[0_0_30px_rgba(191,46,38,0.25)] backdrop-blur-md">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between border-b border-primary/30 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70">
            ★ OFFICIAL ENTRY VOUCHER ★
          </span>
          <h3 className="mt-1 text-lg font-extrabold uppercase tracking-[0.2em] text-primary">
            {eventTitle}
          </h3>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Concert Gate Pass Code Block (No QR code) */}
      <div className="my-6 flex flex-col items-center justify-center rounded-lg border border-primary/40 bg-[#0a0a0a] p-5 text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-primary/60">
          CONCERT GATE PASS CODE
        </div>
        <div className="my-3 rounded-md border-2 border-primary bg-primary/10 px-6 py-2.5 text-3xl font-black tracking-[0.35em] text-primary selection:bg-primary selection:text-black">
          {code}
        </div>
        <p className="text-[11px] text-primary/70">
          Use this code to unlock the DJ playlist & for door check-in
        </p>

        {/* Aesthetic Ticket Stub Barcode Lines */}
        <div
          className="mt-4 flex items-center justify-center gap-[3px] py-1 opacity-75"
          aria-hidden="true"
        >
          {[
            4, 2, 6, 2, 4, 3, 2, 5, 2, 7, 3, 2, 4, 6, 2, 3, 5, 2, 4, 2, 6, 3, 2, 4, 5, 2, 3, 6, 2,
            4,
          ].map((h, idx) => (
            <div
              key={idx}
              className="bg-primary"
              style={{
                width: idx % 4 === 0 ? "3px" : idx % 2 === 0 ? "2px" : "1.5px",
                height: `${22 + h * 2}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs">
        <div className="flex justify-between border-b border-primary/10 pb-1.5">
          <span className="text-primary/60 uppercase tracking-[0.15em]">Pass:</span>
          <span className="font-bold text-primary uppercase">
            {quantity} Guest{quantity > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex justify-between border-b border-primary/10 pb-1.5">
          <span className="text-primary/60 uppercase tracking-[0.15em]">Date & Time:</span>
          <span className="font-bold text-primary">{eventDate}</span>
        </div>
        <div className="flex justify-between border-b border-primary/10 pb-1.5">
          <span className="text-primary/60 uppercase tracking-[0.15em]">Venue:</span>
          <span className="font-bold text-primary">{venue}</span>
        </div>
        {email && (
          <div className="flex justify-between border-b border-primary/10 pb-1.5">
            <span className="text-primary/60 uppercase tracking-[0.15em]">Recipient:</span>
            <span className="font-bold text-primary truncate max-w-[180px]">{email}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
        <a
          href={`${BACKEND_URL}/api/tickets/pass/${encodeURIComponent(code)}`}
          download
          className="flex flex-1 items-center justify-center gap-2 rounded border border-primary bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black hover:bg-primary-glow transition-all"
        >
          <Download className="h-4 w-4" /> Save Pass
        </a>
      </div>

      <p className="mt-4 text-center text-[9px] uppercase tracking-[0.2em] text-primary/50">
        [ PRESENT PASS CODE AT DOOR · USE CODE TO UNLOCK PLAYLIST ]
      </p>
    </div>
  );
}
