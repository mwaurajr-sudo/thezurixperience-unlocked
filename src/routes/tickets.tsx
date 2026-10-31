import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContent, type TicketTier } from "@/hooks/useSiteContent";
import { DigitalTicketPass, type DigitalTicketPassProps } from "@/components/DigitalTicketPass";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, CheckCircle2, Ticket } from "lucide-react";

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
  const { user } = useAuth();
  const e = content.event;
  const navigate = useNavigate();

  const [qty, setQty] = useState<Record<string, number>>({});
  const [lookupQuery, setLookupQuery] = useState("");
  const [searchingPass, setSearchingPass] = useState(false);
  const [foundPass, setFoundPass] = useState<DigitalTicketPassProps | null>(null);

  // RSVP Modal State
  const [activeClaimTier, setActiveClaimTier] = useState<TicketTier | null>(null);
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [rsvpName, setRsvpName] = useState("");
  const [issuingPass, setIssuingPass] = useState(false);
  const [issuedPass, setIssuedPass] = useState<DigitalTicketPassProps | null>(null);

  const BACKEND_URL = import.meta.env.DEV
    ? (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    : (import.meta.env.VITE_BACKEND_URL && !import.meta.env.VITE_BACKEND_URL.includes("localhost")
        ? import.meta.env.VITE_BACKEND_URL
        : "");

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
          pdfUrl: data.ticket.pdfUrl,
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
    setQty((q) => ({ ...q, [name]: Math.max(1, n) }));

  const openClaimModal = (tier: TicketTier) => {
    setActiveClaimTier(tier);
    setRsvpEmail(user?.email || "");
    const defaultName = (user?.user_metadata as any)?.display_name || (user?.email ? user.email.split("@")[0] : "");
    setRsvpName(defaultName);
  };

  const handleConfirmRsvp = async () => {
    if (!activeClaimTier) return;
    if (!rsvpEmail.trim() || !/^\S+@\S+\.\S+$/.test(rsvpEmail.trim())) {
      return toast.error("Please provide a valid email address");
    }

    const count = qty[activeClaimTier.name] ?? 1;
    setIssuingPass(true);

    try {
      // 1. First attempt through Backend API (which generates PDF and dispatches confirmation email)
      const res = await fetch(`${BACKEND_URL}/api/tickets/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: rsvpEmail.trim(),
          customerName: rsvpName.trim() || rsvpEmail.split("@")[0],
          tierName: activeClaimTier.name,
          quantity: count,
          eventVol: e.vol,
          userId: user?.id ?? null,
          eventTitle: e.name,
          eventDate: e.date,
          venue: e.venue || "Disclosed at door",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.ticket) {
        setIssuedPass({
          code: data.ticket.code,
          tierName: data.ticket.tierName || activeClaimTier.name,
          quantity: data.ticket.quantity || count,
          eventTitle: data.ticket.eventTitle || e.name,
          eventDate: data.ticket.eventDate || e.date,
          venue: data.ticket.venue || "Disclosed at door",
          email: data.ticket.email || rsvpEmail.trim(),
          pdfUrl: data.ticket.pdfUrl,
        });

        if (data.emailSent) {
          toast.success(`Pass ${data.ticket.code} issued & email dispatched to ${rsvpEmail.trim()}!`);
        } else {
          toast.success(`Pass ${data.ticket.code} successfully registered!`);
        }

        setActiveClaimTier(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // If backend responded with non-200 error message
      if (!res.ok) {
        throw new Error(data.message || "Could not register pass via ticket service");
      }
    } catch (backendErr: any) {
      console.warn("Backend issuance warning, attempting direct Supabase fallback:", backendErr.message);

      // 2. Direct fallback to Supabase DB in case the local backend service is offline
      try {
        // Calculate countdown code starting from 99 backwards
        let fallbackCode = "ZURI099";
        let fallbackNum = 99;
        try {
          const { data: latest } = await supabase
            .from("tickets")
            .select("ticket_number, code")
            .order("created_at", { ascending: false })
            .limit(1);

          let prevNum = 100;
          if (latest && latest.length > 0) {
            const last = latest[0];
            if (last.ticket_number && Number(last.ticket_number) > 0 && Number(last.ticket_number) <= 99) {
              prevNum = Number(last.ticket_number);
            } else if (last.code && /^ZURI\d+$/i.test(last.code)) {
              const parsed = parseInt(last.code.replace(/^ZURI/i, ""), 10);
              if (!isNaN(parsed) && parsed > 0 && parsed <= 99) {
                prevNum = parsed;
              }
            }
          }
          fallbackNum = Math.max(1, prevNum - 1);
          fallbackCode = `ZURI${String(fallbackNum).padStart(3, "0")}`;
        } catch {
          // fallback calculation error ignored
        }

        const { data: directTicket, error: dbErr } = await supabase
          .from("tickets")
          .insert({
            email: rsvpEmail.trim().toLowerCase(),
            tier_name: activeClaimTier.name,
            quantity: count,
            total_kes: 0,
            payment_method: "RSVP",
            event_vol: e.vol,
            user_id: user?.id ?? null,
            code: fallbackCode,
            ticket_code: fallbackCode,
            ticket_number: fallbackNum,
            used: false,
          } as any)
          .select("*")
          .single();

        if (dbErr) throw dbErr;

        setIssuedPass({
          code: directTicket.code,
          tierName: directTicket.tier_name,
          quantity: directTicket.quantity,
          eventTitle: e.name,
          eventDate: e.date,
          venue: e.venue || "Disclosed at door",
          email: directTicket.email,
        });

        toast.success(`Pass ${directTicket.code} issued directly!`);
        setActiveClaimTier(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (fallbackErr: any) {
        toast.error(fallbackErr.message || "Failed to register ticket. Please try again.");
      }
    } finally {
      setIssuingPass(false);
    }
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
                placeholder="Lookup Pass (e.g. ZURI001)"
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

        {/* Issued Pass Celebration Section */}
        {issuedPass && (
          <section className="mt-10 rounded-xl border-2 border-primary bg-black/95 p-6 relative animate-fade-in shadow-[0_0_40px_rgba(191,46,38,0.3)]">
            <button
              onClick={() => setIssuedPass(null)}
              className="absolute top-4 right-4 p-1 text-primary/60 hover:text-primary transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-primary font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> RSVP Registration Confirmed
              </div>
              <h2 className="mt-2 text-xl font-bold uppercase tracking-[0.2em] text-primary">
                Welcome to the house
              </h2>
              <p className="mt-1 text-xs text-primary/70">
                A digital pass voucher has been registered for <span className="text-primary font-bold">{issuedPass.email}</span>.
              </p>
            </div>

            <DigitalTicketPass {...issuedPass} />

            <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs uppercase tracking-[0.25em]">
              <button
                onClick={() => navigate({ to: "/playlist" })}
                className="border border-primary bg-primary px-6 py-2.5 font-bold text-black hover:bg-primary-glow transition-all"
              >
                → Unlock DJ Playlist
              </button>
              <button
                onClick={() => setIssuedPass(null)}
                className="border border-primary/40 px-6 py-2.5 text-primary/80 hover:border-primary hover:text-primary transition-all"
              >
                Done
              </button>
            </div>
          </section>
        )}

        {/* Found Pass View Modal */}
        {foundPass && !issuedPass && (
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
          {content.ticketTagline || "Complimentary access is available via guestlist reservation. Claim your entry pass below."}
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-primary/60">loading tiers...</p>
        ) : content.tickets.length === 0 ? (
          <p className="mt-10 text-sm text-primary/60">
            {content.ticketSoldOut || "Passes currently unavailable."}
          </p>
        ) : (
          <div className="mt-10 space-y-4">
            {content.tickets.map((t) => {
              const left = t.cap - t.sold;
              const pct = t.cap > 0 ? Math.round((t.sold / t.cap) * 100) : 0;
              const soldOut = left <= 0;
              const count = qty[t.name] ?? 1;

              return (
                <div
                  key={t.name}
                  className="border border-primary/30 bg-black p-5 hover:border-primary/60 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-base uppercase tracking-[0.25em] text-primary font-bold">
                        {t.name}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl text-primary font-extrabold tracking-wider">
                          COMPLIMENTARY
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-primary/50 font-normal">
                          [RSVP]
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.2em] text-primary/60">
                      {soldOut ? "Fully Booked" : `${left} passes left`}
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
                          onClick={() => setCount(t.name, count - 1)}
                          className="px-3 py-2 text-primary hover:bg-primary hover:text-black font-bold"
                          title="Decrease guest count"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] px-3 text-center text-primary font-bold">
                          {count}
                        </span>
                        <button
                          onClick={() => setCount(t.name, count + 1)}
                          className="px-3 py-2 text-primary hover:bg-primary hover:text-black font-bold"
                          title="Increase guest count"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => openClaimModal(t)}
                        className="flex-1 border border-primary bg-primary px-4 py-2 text-xs uppercase tracking-[0.3em] text-black font-bold hover:bg-primary-glow transition-all flex items-center justify-center gap-2"
                      >
                        <Ticket className="h-3.5 w-3.5" /> Claim Pass →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Claim Pass RSVP Modal */}
        {activeClaimTier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border-2 border-primary bg-black p-6 font-mono text-primary shadow-2xl relative animate-scale-in">
              <button
                onClick={() => setActiveClaimTier(null)}
                className="absolute top-4 right-4 p-1 text-primary/60 hover:text-primary transition-colors"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b border-primary/30 pb-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary/60">
                  [Guestlist Reservation]
                </span>
                <h2 className="mt-1 text-lg font-bold uppercase tracking-[0.2em] text-primary">
                  Claim {activeClaimTier.name} Pass
                </h2>
                <p className="mt-1 text-xs text-primary/70">
                  {qty[activeClaimTier.name] ?? 1} Guest({(qty[activeClaimTier.name] ?? 1) > 1 ? "s" : ""}) · Vol. {e.vol}
                </p>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="block uppercase tracking-[0.2em] text-primary/70 mb-1">
                    Your Name:
                  </label>
                  <input
                    type="text"
                    value={rsvpName}
                    onChange={(evt) => setRsvpName(evt.target.value)}
                    placeholder="Alvin Nderitu"
                    className="w-full border border-primary/40 bg-black px-3 py-2 text-sm text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-[0.2em] text-primary/70 mb-1">
                    Email Address (Pass dispatched here):
                  </label>
                  <input
                    type="email"
                    value={rsvpEmail}
                    onChange={(evt) => setRsvpEmail(evt.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full border border-primary/40 bg-black px-3 py-2 text-sm text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="rounded border border-primary/20 bg-primary/5 p-3 text-[11px] leading-relaxed text-primary/70">
                  ★ No payment required. Your pass code will appear instantly on screen and an official PDF voucher will be delivered to your inbox.
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveClaimTier(null)}
                  className="border border-primary/40 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-primary/80 hover:border-primary transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRsvp}
                  disabled={issuingPass}
                  className="flex-1 border border-primary bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.25em] text-black hover:bg-primary-glow disabled:opacity-50 transition-all"
                >
                  {issuingPass ? "Registering Pass..." : "Confirm & Get Pass →"}
                </button>
              </div>
            </div>
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
