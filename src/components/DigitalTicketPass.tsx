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
  eventDate = "6th November",
  venue = "On your saved pass",
  email,
}: DigitalTicketPassProps) {
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border-2 border-primary/80 bg-black/95 p-4 font-mono sm:p-6 text-primary shadow-[0_0_30px_rgba(191,46,38,0.25)] backdrop-blur-md">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-3 border-b border-primary/30 pb-4">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70 sm:tracking-[0.3em]">
            ★ OFFICIAL ENTRY VOUCHER ★
          </span>
          <h3 className="mt-1 break-words text-lg font-extrabold uppercase tracking-[0.2em] text-primary">
            {eventTitle}
          </h3>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Concert Gate Pass Code Block (No QR code) */}
      <div className="my-6 flex flex-col items-center justify-center rounded-lg border border-primary/40 bg-[#0a0a0a] p-3 text-center sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.15em] text-primary/60 sm:tracking-[0.3em]">
          CONCERT GATE PASS CODE
        </div>
        <div className="my-3 rounded-md border-2 border-primary bg-primary/10 px-3 py-2.5 text-2xl font-black tracking-[0.2em] sm:px-6 sm:text-3xl sm:tracking-[0.35em] text-primary selection:bg-primary selection:text-black">
          {code}
        </div>
        <p className="text-[11px] text-primary/70">Show this code at the door to check in</p>

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
      <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs sm:p-4">
        <div className="flex justify-between gap-3 border-b border-primary/10 pb-1.5">
          <span className="shrink-0 text-primary/60 uppercase tracking-[0.15em]">Pass:</span>
          <span className="min-w-0 break-words text-right font-bold text-primary uppercase">
            {quantity > 1 ? "You + a plus one" : "1 Guest"}
          </span>
        </div>
        <div className="flex justify-between gap-3 border-b border-primary/10 pb-1.5">
          <span className="shrink-0 text-primary/60 uppercase tracking-[0.15em]">Date & Time:</span>
          <span className="min-w-0 break-words text-right font-bold text-primary">{eventDate}</span>
        </div>
        <div className="flex justify-between gap-3 border-b border-primary/10 pb-1.5">
          <span className="shrink-0 text-primary/60 uppercase tracking-[0.15em]">Venue:</span>
          <span className="min-w-0 break-words text-right font-bold text-primary">{venue}</span>
        </div>
        {email && (
          <div className="flex justify-between gap-3 border-b border-primary/10 pb-1.5">
            <span className="shrink-0 text-primary/60 uppercase tracking-[0.15em]">Recipient:</span>
            <span className="min-w-0 truncate font-bold text-primary">{email}</span>
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
        [ PRESENT PASS CODE AT DOOR ]
      </p>
    </div>
  );
}
