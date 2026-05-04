import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/event")({
  component: () => (
    <AuthGate>
      <EventPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Event — TheZuriXperience" }] }),
});

const facts = [
  ["Date", "Saturday, December 14"],
  ["Doors", "9:00 PM — 4:00 AM"],
  ["Location", "Disclosed at door · Nairobi"],
  ["Dress", "Wine, black, or both"],
];

function EventPage() {
  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-mono text-2xl uppercase tracking-[0.3em]">
          &gt; Event<span className="animate-blink">_</span>
        </h1>

        <div className="mt-10 font-mono">
          <p className="text-xs uppercase tracking-[0.4em] text-primary/60">Vol. 01</p>
          <h2 className="mt-3 text-3xl uppercase tracking-[0.15em]">RnB Nights</h2>
          <p className="mt-6 max-w-prose text-base leading-relaxed text-primary/80">
            Slow burn. Deep red. A night curated around rhythm, intimacy, and ritual.
            Lineup revealed at the door.
          </p>
        </div>

        <dl className="mt-12 divide-y divide-primary/20 border-y border-primary/20 font-mono">
          {facts.map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-4 py-4">
              <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{k}</dt>
              <dd className="col-span-2 text-base text-primary">{v}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
