import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent, type TicketTier } from "@/hooks/useSiteContent";
import { DigitalTicketPass, type DigitalTicketPassProps } from "@/components/DigitalTicketPass";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/tickets")({
  component: () => (
    <AuthGate>
      <TicketsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Tickets — TheZuriXperience" }] }),
});

function TicketsPage() {
  const { content, loading } = useSiteContent();
  const e = content.event;
  const navigate = useNavigate();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [lookupQuery, setLookupQuery] = useState("");
  const [searchingPass, setSearchingPass] = useState(false);
  const [foundPass, setFoundPass] = useState<DigitalTicketPassProps | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const handleLookupPass = async () => {
    if (!lookupQuery.trim()) {
      return toast.error("Enter a ticket code");
    }
    setSearchingPass(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tickets/verify/${lookupQuery.trim()}`);
      const data = await res.json();
      if (res.ok && data.success && data.ticket) {
        setFoundPass({
          code: data.ticket.code,
          tierName: data.ticket.tierName || "General",
          quantity: data.ticket.quantity || 1,
          eventTitle: data.ticket.eventTitle || e.name,
          eventDate: e.date,
          email: data.ticket.email,
        });
        toast.success(`Pass found for ${data.ticket.code}`);
      } else {
        toast.error(data.message || "Ticket code not found.");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not connect to ticket service.");
    } finally {
      setSearchingPass(false);
    }
  };

  const setCount = (name: string, n: number) =>
    setQty((q) => ({ ...q, [name]: Math.max(0, n) }));

  const reserve = (tier: TicketTier) => {
    const n = qty[tier.name] ?? 1;
    if (n < 1) return toast.error("Pick at least 1 ticket");
    if (n > tier.cap - tier.sold) return toast.error("Not enough left in this tier");
    const reservation = {
      tier: tier.name,
      qty: n,
      unit: tier.price,
      total: tier.price * n,
      eventVol: e.vol,
      eventName: e.name,
      eventDate: e.date,
    };
    sessionStorage.setItem("zuri_reservation", JSON.stringify(reservation));
    toast.success(`Reserved ${n} × ${tier.name}. Proceed to payment.`);
    navigate({ to: "/payment" });
  };

  return (
    <div className="min-h-screen bg-black text-primary font-mono">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl uppercase tracking-[0.3em]">
              &gt; Tickets<span className="animate-blink">_</span>
            </h1>
            <div className="mt-2 text-xs uppercase tracking-[0.3em] text-primary/60">
              Vol. {e.vol} — {e.name} · {e.date}
            </div>
          </div>

          {/* Ticket Pass Lookup Control */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={lookupQuery}
                onChange={(evt) => setLookupQuery(evt.target.value)}
                onKeyDown={(evt) => evt.key === "Enter" && handleLookupPass()}
                placeholder="Lookup Pass (e.g. ZURI-8841)"
                className="w-full border border-primary/40 bg-black/90 px-3 py-1.5 text-xs text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={handleLookupPass}
              disabled={searchingPass}
              className="border border-primary bg-primary px-3 py-1.5 text-xs font-bold text-black hover:bg-primary-glow uppercase tracking-wider flex items-center gap-1"
            >
              {searchingPass ? "..." : <Search className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Found Pass View Modal */}
        {foundPass && (
          <div className="mt-8 rounded-xl border border-primary/50 bg-black/95 p-6 relative">
            <button
              onClick={() => setFoundPass(null)}
              className="absolute top-4 right-4 p-1 text-primary/60 hover:text-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <DigitalTicketPass {...foundPass} />
          </div>
        )}

        <p className="mt-6 max-w-prose text-sm leading-relaxed text-primary/80">
          {content.ticketTagline}
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-primary/60">loading...</p>
        ) : content.tickets.length === 0 ? (
          <p className="mt-10 text-sm text-primary/60">
            {content.ticketSoldOut}
          </p>
        ) : (
          <div className="mt-10 space-y-4">
            {content.tickets.map((t) => {
              const left = t.cap - t.sold;
              const pct = t.cap > 0 ? Math.round((t.sold / t.cap) * 100) : 0;
              const soldOut = left <= 0;
              return (
                <div
                  key={t.name}
                  className="border border-primary/30 bg-black p-5 hover:border-primary/60"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-base uppercase tracking-[0.25em] text-primary font-bold">
                        {t.name}
                      </p>
                      <p className="mt-1 text-2xl text-primary font-extrabold">
                        KES {t.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.2em] text-primary/60">
                      {soldOut ? "Sold out" : `${left} left`}
                    </div>
                  </div>

                  {t.perks && (
                    <ul className="mt-4 space-y-1 text-sm text-primary/80">
                      {t.perks.split(",").map((p) => (
                        <li key={p}>· {p.trim()}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 h-1 bg-primary/20">
                    <div className="h-1 bg-primary" style={{ width: `${pct}%` }} />
                  </div>

                  {!soldOut && (
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex items-center border border-primary/40">
                        <button
                          onClick={() => setCount(t.name, (qty[t.name] ?? 1) - 1)}
                          className="px-3 py-2 text-primary hover:bg-primary hover:text-black font-bold"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] px-3 text-center text-primary font-bold">
                          {qty[t.name] ?? 1}
                        </span>
                        <button
                          onClick={() => setCount(t.name, (qty[t.name] ?? 1) + 1)}
                          className="px-3 py-2 text-primary hover:bg-primary hover:text-black font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => reserve(t)}
                        className="flex-1 border border-primary bg-primary px-4 py-2 text-xs uppercase tracking-[0.3em] text-black font-bold hover:bg-primary-glow transition-all"
                      >
                        Reserve →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-xs uppercase tracking-[0.3em]">
          <Link to="/event" className="text-primary/70 hover:text-primary">
            ← Back to event
          </Link>
        </div>
      </main>
    </div>
  );
}
