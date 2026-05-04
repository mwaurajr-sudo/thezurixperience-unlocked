import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  component: () => (
    <AuthGate>
      <AboutPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "About — TheZuriXperience" }] }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-mono text-2xl uppercase tracking-[0.3em]">
          &gt; About<span className="animate-blink">_</span>
        </h1>
        <div className="mt-10 space-y-6 font-mono text-base leading-relaxed">
          <p>
            TheZuriXperience is an invite-only nightlife curation house based in Nairobi.
          </p>
          <p>
            We craft intimate, ritualistic events for those who treat a night out as
            an art form — slow burns, deep red rooms, careful sound, careful guests.
          </p>
          <p>
            Members only. Capacity intentionally small. Locations disclosed at the door.
          </p>
          <p className="pt-6 text-primary/60">— MMXXV</p>
        </div>
      </main>
    </div>
  );
}
