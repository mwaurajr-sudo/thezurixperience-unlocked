import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/payment")({
  component: () => (
    <AuthGate>
      <PaymentPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Payment — TheZuriXperience" }] }),
});

interface Reservation {
  tier: string;
  qty: number;
  unit: number;
  total: number;
  eventVol: string;
  eventName: string;
  eventDate: string;
}

type Method = "bank" | "mpesa";

function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [method, setMethod] = useState<Method>("mpesa");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bankRef, setBankRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState<{ code: string; number: number } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("zuri_reservation");
    if (raw) {
      try {
        setReservation(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
    if (user?.email) setEmail(user.email);
  }, [user]);

  const submit = async () => {
    if (!reservation) return;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return toast.error("Enter a valid email");
    }
    if (method === "mpesa" && !phone.trim()) {
      return toast.error("Enter your M-Pesa phone number");
    }
    if (method === "bank" && !bankRef.trim()) {
      return toast.error("Enter your bank transfer reference");
    }
    setSubmitting(true);
    const insertRow = {
      email,
      tier_name: reservation.tier,
      quantity: reservation.qty,
      total_kes: reservation.total,
      payment_method: method,
      event_vol: reservation.eventVol,
      user_id: user?.id ?? null,
      // code + ticket_number are assigned by a DB trigger
    } as never;
    const { data, error } = await supabase
      .from("tickets")
      .insert(insertRow)
      .select("code, ticket_number")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not record payment");
      return;
    }
    setIssued({ code: data.code, number: data.ticket_number });
    sessionStorage.removeItem("zuri_reservation");
    toast.success(`Ticket issued: ${data.code}`);
  };

  if (!reservation && !issued) {
    return (
      <div className="min-h-screen bg-black text-primary">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-5 py-16 font-mono">
          <h1 className="text-2xl uppercase tracking-[0.3em]">
            &gt; Payment<span className="animate-blink">_</span>
          </h1>
          <p className="mt-6 text-sm text-primary/70">
            No reservation found. Pick your tickets first.
          </p>
          <Link
            to="/tickets"
            className="mt-6 inline-block border border-primary px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary hover:bg-primary hover:text-black"
          >
            → Go to tickets
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 font-mono">
        <h1 className="text-2xl uppercase tracking-[0.3em]">
          &gt; Payment<span className="animate-blink">_</span>
        </h1>

        {issued ? (
          <section className="mt-10 border border-primary p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
              [confirmed]
            </p>
            <h2 className="mt-3 text-xl uppercase tracking-[0.25em] text-primary">
              Welcome to the house.
            </h2>
            <p className="mt-4 text-sm text-primary/80">
              Your purchase is recorded. Ticket #{issued.number}.
            </p>
            <div className="mt-6 border border-primary/40 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
                Your code
              </p>
              <p className="mt-2 text-3xl tracking-[0.4em] text-primary">
                {issued.code}
              </p>
            </div>
            <p className="mt-6 text-sm text-primary/70">
              A confirmation will be sent to <span className="text-primary">{email}</span>.
              Save this code — you'll need it to unlock the playlist for this volume.
            </p>
            <div className="mt-8 flex gap-3 text-xs uppercase tracking-[0.3em]">
              <button
                onClick={() => navigate({ to: "/playlist" })}
                className="border border-primary bg-primary px-4 py-2 text-black hover:bg-primary-glow"
              >
                → Unlock playlist
              </button>
              <Link
                to="/event"
                className="border border-primary/40 px-4 py-2 text-primary/80 hover:border-primary"
              >
                Back to event
              </Link>
            </div>
          </section>
        ) : reservation ? (
          <>
            <section className="mt-10 border border-primary/30 p-5 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
                [receipt]
              </p>
              <p className="mt-3 text-primary">
                Vol. {reservation.eventVol} — {reservation.eventName}
              </p>
              <p className="text-primary/70">{reservation.eventDate}</p>
              <div className="mt-4 flex justify-between border-t border-primary/20 pt-3">
                <span>{reservation.qty} × {reservation.tier}</span>
                <span>KES {reservation.unit.toLocaleString()} ea</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-primary/20 pt-3 text-base">
                <span className="uppercase tracking-[0.25em]">Total</span>
                <span className="text-primary">KES {reservation.total.toLocaleString()}</span>
              </div>
            </section>

            <section className="mt-8">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
                [payment method]
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["mpesa", "bank"] as Method[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`border px-4 py-3 text-xs uppercase tracking-[0.3em] ${
                      method === m
                        ? "border-primary bg-primary text-black"
                        : "border-primary/40 text-primary/80 hover:border-primary"
                    }`}
                  >
                    Pay via {m === "mpesa" ? "M-Pesa" : "Bank"}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-8 space-y-4 text-sm">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.3em] text-primary/60">
                  Email (ticket sent here)
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="mt-2 w-full border border-primary/40 bg-black px-3 py-2 text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
                />
              </label>

              {method === "mpesa" ? (
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.3em] text-primary/60">
                    M-Pesa phone number
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="mt-2 w-full border border-primary/40 bg-black px-3 py-2 text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
                  />
                  <span className="mt-2 block text-xs text-primary/60">
                    You'll receive an STK push. Approve to complete.
                  </span>
                </label>
              ) : (
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.3em] text-primary/60">
                    Bank transfer reference
                  </span>
                  <input
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="Your name or transaction ref"
                    className="mt-2 w-full border border-primary/40 bg-black px-3 py-2 text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
                  />
                  <span className="mt-2 block text-xs text-primary/60">
                    Transfer to: ZuriXperience Ltd · Equity Bank · Acc 0123456789
                  </span>
                </label>
              )}
            </section>

            <button
              onClick={submit}
              disabled={submitting}
              className="mt-8 w-full border border-primary bg-primary px-4 py-3 text-xs uppercase tracking-[0.3em] text-black hover:bg-primary-glow disabled:opacity-60"
            >
              {submitting ? "processing..." : `Pay KES ${reservation.total.toLocaleString()}`}
            </button>

            <Link
              to="/tickets"
              className="mt-6 block text-center text-xs uppercase tracking-[0.3em] text-primary/60 hover:text-primary"
            >
              ← Back to tickets
            </Link>
          </>
        ) : null}
      </main>
    </div>
  );
}
