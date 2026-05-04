import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent } from "@/hooks/useSiteContent";

export const Route = createFileRoute("/event")({
  component: () => (
    <AuthGate>
      <EventPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Event — TheZuriXperience" }] }),
});

function EventPage() {
  const { content, loading } = useSiteContent();
  const e = content.event;

  const location =
    e.locMode === "full" && e.venue
      ? e.venue
      : e.locMode === "partial"
        ? "Nairobi · Exact venue at door"
        : "Disclosed at door · Nairobi";

  const lineup = [e.dj1, e.dj2, e.dj3].filter(Boolean);
  const lineupText =
    e.lineupMode === "full" && lineup.length
      ? lineup.join(" · ")
      : e.lineupMode === "partial" && lineup[0]
        ? `${lineup[0]} + secret guests`
        : "Revealed at the door";

  const facts: [string, string][] = [
    ["Date", e.date],
    ["Doors", e.doors],
    ["Location", location],
    ["Dress", `${e.dress} — ${e.dresslbl}`],
    ["Lineup", lineupText],
  ];

  const tags = e.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />

      {/* Marquee */}
      <div className="overflow-hidden border-b border-primary/30 bg-primary/5 py-2">
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap font-mono text-xs uppercase tracking-[0.4em] text-primary">
          {[...tags, ...tags, ...tags].map((t, i) => (
            <span key={i} className="mx-6">★ {t}</span>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-mono text-2xl uppercase tracking-[0.3em]">
          &gt; Event<span className="animate-blink">_</span>
        </h1>

        {loading ? (
          <p className="mt-10 font-mono text-sm text-primary/60">loading...</p>
        ) : (
          <>
            <div className="mt-10 font-mono">
              <p className="text-xs uppercase tracking-[0.4em] text-primary/60">Vol. {e.vol}</p>
              <h2 className="mt-3 text-4xl uppercase tracking-[0.15em] text-primary">
                {e.name}
              </h2>
              <p className="mt-4 italic text-primary/80">{e.theme}</p>
            </div>

            <dl className="mt-12 divide-y divide-primary/20 border-y border-primary/20 font-mono">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-4 py-4">
                  <dt className="text-xs uppercase tracking-[0.3em] text-primary/60">{k}</dt>
                  <dd className="col-span-2 text-base text-primary">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap gap-3 font-mono">
              <Link
                to="/tickets"
                className="border border-primary bg-primary px-5 py-3 text-xs uppercase tracking-[0.3em] text-black hover:bg-primary-glow"
              >
                → Get tickets
              </Link>
              <Link
                to="/about"
                className="border border-primary/40 px-5 py-3 text-xs uppercase tracking-[0.3em] text-primary/80 hover:border-primary hover:text-primary"
              >
                The house
              </Link>
            </div>
          </>
        )}
      </main>

      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}
