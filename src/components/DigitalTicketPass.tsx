import { Printer, CheckCircle2 } from "lucide-react";

export interface DigitalTicketPassProps {
  code: string;
  tierName?: string;
  quantity?: number;
  eventTitle?: string;
  eventDate?: string;
  venue?: string;
  email?: string;
  totalKes?: number;
}

export function DigitalTicketPass({
  code,
  tierName = "General Entry",
  quantity = 1,
  eventTitle = "The Zuri Experience",
  eventDate = "Saturday, Dec 14",
  venue = "Ruby Lounge",
  email,
  totalKes,
}: DigitalTicketPassProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    code
  )}&color=bf2e26&bgcolor=0a0a0a`;

  const handlePrint = () => {
    window.print();
  };

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

      {/* Ticket QR Code Display */}
      <div className="my-6 flex flex-col items-center justify-center rounded-lg border border-primary/30 bg-[#0a0a0a] p-4 text-center">
        <div className="relative overflow-hidden rounded-md border border-primary/40 p-2 bg-[#0a0a0a]">
          <img
            src={qrUrl}
            alt={`QR Pass for ${code}`}
            className="h-44 w-44 object-contain brightness-110"
            loading="eager"
          />
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-primary/60">
          CONCERT GATE PASS CODE
        </div>
        <div className="mt-1 text-2xl font-bold tracking-[0.35em] text-primary selection:bg-primary selection:text-black">
          {code}
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs">
        <div className="flex justify-between border-b border-primary/10 pb-1.5">
          <span className="text-primary/60 uppercase tracking-[0.15em]">Pass Type:</span>
          <span className="font-bold text-primary uppercase">{tierName} ({quantity} Guest{quantity > 1 ? "s" : ""})</span>
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
        {totalKes !== undefined && totalKes > 0 && (
          <div className="flex justify-between pt-0.5">
            <span className="text-primary/60 uppercase tracking-[0.15em]">Total Paid:</span>
            <span className="font-bold text-primary">KES {totalKes.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-center gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex flex-1 items-center justify-center gap-2 rounded border border-primary bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black hover:bg-primary-glow transition-all"
        >
          <Printer className="h-4 w-4" /> Save / Print Pass
        </button>
      </div>

      <p className="mt-4 text-center text-[9px] uppercase tracking-[0.2em] text-primary/50">
        [ PRESENT QR AT FOYER DOOR FOR GATE SCANNER ACCESS ]
      </p>
    </div>
  );
}
