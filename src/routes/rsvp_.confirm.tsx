import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DigitalTicketPass, type DigitalTicketPassProps } from "@/components/DigitalTicketPass";
import { useSiteContent } from "@/hooks/useSiteContent";
import { BACKEND_URL } from "@/lib/backend";

// Opened from the RSVP email, possibly on a device that isn't signed in, so this has no AuthGate.
export const Route = createFileRoute("/rsvp_/confirm")({
  component: ConfirmRsvpPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Confirm Attendance — TheZuriXperience" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
});

function ConfirmRsvpPage() {
  const { token } = Route.useSearch();
  const { content } = useSiteContent();
  const e = content.event;

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(token ? "" : "This confirmation link is incomplete.");
  const [pass, setPass] = useState<DigitalTicketPassProps | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/rsvp/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not confirm your attendance.");
      }
      setPass(data.ticket);
      setEmailSent(data.emailSent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to the RSVP service.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-primary font-mono">
      <main className="mx-auto max-w-xl px-5 py-16">
        {pass ? (
          <>
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-primary font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Attendance Confirmed
              </div>
              <h1 className="mt-3 text-xl font-bold uppercase tracking-[0.2em]">
                Welcome to the house
              </h1>
              <p className="mt-2 text-xs text-primary/70">
                {emailSent
                  ? `Your ticket has been sent to ${pass.email}. Check your spam folder if you don't see it.`
                  : "Your ticket is below, but we couldn't email it just now. Save this pass, or open your confirmation link again later to retry."}
              </p>
            </div>
            <DigitalTicketPass {...pass} />
          </>
        ) : (
          <div className="border border-primary/40 p-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60">
              [Guestlist Reservation]
            </p>
            <h1 className="mt-3 text-xl font-bold uppercase tracking-[0.2em]">
              Will you be there?
            </h1>
            <p className="mt-3 text-sm text-primary/80">
              Vol. {e.vol} — {e.name} · {e.date}
            </p>

            {error && <p className="mt-5 text-xs text-primary">{error}</p>}

            {token && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="mt-6 w-full border border-primary bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.25em] text-black hover:bg-primary-glow disabled:opacity-50 transition-all"
              >
                {confirming ? "Confirming..." : "Confirm Attendance →"}
              </button>
            )}

            {error && (
              <Link
                to="/"
                className="mt-5 inline-block text-xs uppercase tracking-[0.25em] text-primary/70 hover:text-primary"
              >
                ← Back to site
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
