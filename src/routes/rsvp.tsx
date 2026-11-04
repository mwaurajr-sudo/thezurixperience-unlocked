import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/contexts/AuthContext";
import { usePassesLeft } from "@/hooks/usePassesLeft";
import { useSiteContent, type TicketTier } from "@/hooks/useSiteContent";
import { DigitalTicketPass, type DigitalTicketPassProps } from "@/components/DigitalTicketPass";
import { BACKEND_URL } from "@/lib/backend";
import { CheckCircle2, Search, X, Mail, Ticket } from "lucide-react";

export const Route = createFileRoute("/rsvp")({
  // Public: invited guests open this from their email and may not have an account.
  component: RsvpPage,
  head: () => ({ meta: [{ title: "RSVP — TheZuriXperience" }] }),
});

function RsvpPage() {
  const { content, loading } = useSiteContent();
  const { user, session } = useAuth();
  const e = content.event;

  const [lookupQuery, setLookupQuery] = useState("");
  const [searchingPass, setSearchingPass] = useState(false);
  const [foundPass, setFoundPass] = useState<DigitalTicketPassProps | null>(null);

  // RSVP Modal State
  const [activeClaimTier, setActiveClaimTier] = useState<TicketTier | null>(null);
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [rsvpName, setRsvpName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [issuedPass, setIssuedPass] = useState<DigitalTicketPassProps | null>(null);
  const passes = usePassesLeft(issuedPass?.code);

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
          quantity: data.ticket.quantity || 1,
          eventTitle: data.ticket.eventTitle || e.name,
          eventDate: e.date,
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

  const openClaimModal = (tier: TicketTier) => {
    setActiveClaimTier(tier);
    setRsvpEmail(user?.email || "");
    const defaultName =
      (user?.user_metadata as any)?.display_name || (user?.email ? user.email.split("@")[0] : "");
    setRsvpName(defaultName);
  };

  const handleConfirmRsvp = async () => {
    if (!activeClaimTier) return;
    if (!rsvpEmail.trim() || !/^\S+@\S+\.\S+$/.test(rsvpEmail.trim())) {
      return toast.error("Please provide a valid email address");
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          email: rsvpEmail.trim(),
          customerName: rsvpName.trim(),
          tierName: activeClaimTier.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not record your RSVP");
      }

      if (data.ticket) {
        setIssuedPass(data.ticket);
      } else {
        setSubmittedEmail(rsvpEmail.trim());
      }
      setActiveClaimTier(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast.error(err.message || "Could not connect to the RSVP service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-primary font-mono">
      {user && <SiteHeader />}
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-5 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="break-words text-xl uppercase tracking-[0.2em] sm:text-2xl sm:tracking-[0.3em]">
              &gt; RSVP<span className="animate-blink">_</span>
            </h1>
            <div className="mt-2 break-words text-xs uppercase tracking-[0.15em] text-primary/60 sm:tracking-[0.3em]">
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

        {/* Ticket Issued Section */}
        {issuedPass && (
          <section className="mt-10 rounded-xl border-2 border-primary bg-black/95 p-6 relative animate-fade-in shadow-[0_0_40px_rgba(191,46,38,0.3)]">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-primary font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> You're on the list
              </div>
              <h2 className="mt-2 text-xl font-bold uppercase tracking-[0.2em] text-primary">
                This is your ticket
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-primary/70">
                Press Save Pass to keep it on your phone, and show it at the door. It won't be
                emailed. If you lose it, RSVP again with the same email to get it back.
              </p>
            </div>
            <DigitalTicketPass {...issuedPass} />
          </section>
        )}

        {/* RSVP Received Section */}
        {submittedEmail && (
          <section className="mt-10 rounded-xl border-2 border-primary bg-black/95 p-6 relative animate-fade-in shadow-[0_0_40px_rgba(191,46,38,0.3)]">
            <button
              onClick={() => setSubmittedEmail(null)}
              className="absolute top-4 right-4 p-1 text-primary/60 hover:text-primary transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-primary font-bold">
                <Mail className="h-3.5 w-3.5" /> RSVP Received
              </div>
              <h2 className="mt-2 text-xl font-bold uppercase tracking-[0.2em] text-primary">
                Check your inbox
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-primary/70">
                We sent a confirmation link to{" "}
                <span className="text-primary font-bold">{submittedEmail}</span>. Confirm your
                attendance and your ticket will follow in a separate email.
              </p>
            </div>
          </section>
        )}

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
          {content.ticketTagline ||
            "Complimentary access is available via guestlist reservation. RSVP below with your email."}
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
              const left = passes?.left ?? t.cap - t.sold;
              const total = passes?.total ?? t.cap;
              const pct = total > 0 ? Math.round(((total - left) / total) * 100) : 0;
              const soldOut = left <= 0;

              return (
                <div
                  key={t.name}
                  className="border border-primary/30 bg-black p-4 hover:border-primary/60 transition-colors sm:p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-base uppercase tracking-[0.25em] text-primary font-bold">
                        {t.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-xl text-primary font-extrabold tracking-wider sm:text-2xl">
                          COMPLIMENTARY
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-primary/50 font-normal">
                          [RSVP]
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-xs uppercase tracking-[0.2em] text-primary/60 sm:text-right">
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
                      <button
                        onClick={() => openClaimModal(t)}
                        className="flex-1 border border-primary bg-primary px-4 py-2 text-xs uppercase tracking-[0.3em] text-black font-bold hover:bg-primary-glow transition-all flex items-center justify-center gap-2"
                      >
                        <Ticket className="h-3.5 w-3.5" /> RSVP →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RSVP Modal */}
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
                  RSVP — {activeClaimTier.name}
                </h2>
                <p className="mt-1 text-xs text-primary/70">You + a plus one · Vol. {e.vol}</p>
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
                    placeholder="Your name"
                    className="w-full border border-primary/40 bg-black px-3 py-2 text-sm text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-[0.2em] text-primary/70 mb-1">
                    Email Address:
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
                  ★ Your ticket, with the venue, appears on the next screen. Save it and show it at
                  the door.
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
                  disabled={submitting}
                  className="flex-1 border border-primary bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.25em] text-black hover:bg-primary-glow disabled:opacity-50 transition-all"
                >
                  {submitting ? "Getting your ticket..." : "Get My Ticket →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div className="mt-10 text-xs uppercase tracking-[0.3em]">
            <Link to="/" className="text-primary/70 hover:text-primary">
              Sign up or sign in →
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
