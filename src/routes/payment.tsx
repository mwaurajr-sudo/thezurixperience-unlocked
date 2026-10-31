import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/payment")({
  component: () => (
    <AuthGate>
      <PaymentRedirectPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Tickets RSVP — TheZuriXperience" }] }),
});

function PaymentRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/tickets" });
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-primary font-mono">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
          [Direct Access Enabled]
        </p>
        <h1 className="mt-4 text-xl font-bold uppercase tracking-[0.25em] text-primary">
          Payment Not Required
        </h1>
        <p className="mt-4 text-sm text-primary/80">
          Entry passes are now complimentary RSVP. Redirecting to tickets...
        </p>
        <Link
          to="/tickets"
          className="mt-8 inline-block border border-primary bg-primary px-6 py-2.5 text-xs uppercase tracking-[0.3em] font-bold text-black hover:bg-primary-glow transition-all"
        >
          → Go to Tickets
        </Link>
      </main>
    </div>
  );
}
