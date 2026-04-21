import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";
import { Button } from "@/components/ui/button";

const tiers = [
  { name: "General", price: "KES 2,500", perks: ["Entry after 10 PM", "Welcome drink"] },
  { name: "VIP", price: "KES 6,000", perks: ["Priority entry", "Reserved standing", "Two welcome drinks"], featured: true },
  { name: "Table (4)", price: "KES 28,000", perks: ["Reserved table", "Bottle service", "Private host"] },
];

export const Route = createFileRoute("/tickets")({
  component: () => (
    <AuthGate>
      <TicketsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Tickets — TheZuriXperience" }] }),
});

function TicketsPage() {
  return (
    <GatedPageLayout
      eyebrow="Reserve"
      title={<>Pick your <span className="italic text-primary">entry</span></>}
      description="Capacity is intentionally small. Once a tier is gone, it's gone."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border p-8 ${t.featured ? "border-primary bg-primary/5" : "border-border/60 bg-card/40"}`}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t.name}</div>
            <div className="font-display mt-3 text-4xl font-bold">{t.price}</div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {t.perks.map((p) => <li key={p}>· {p}</li>)}
            </ul>
            <Button className="mt-8 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              Reserve
            </Button>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
