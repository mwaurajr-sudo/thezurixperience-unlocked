import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";

const items = [
  { name: "Vol. 01 Tee", price: "KES 3,500", note: "Heavyweight cotton, wine on black" },
  { name: "Velvet Cap", price: "KES 2,800", note: "Embroidered Z mark" },
  { name: "RnB Vinyl", price: "KES 4,500", note: "Limited 100 — signed sleeve" },
  { name: "Silk Bandana", price: "KES 1,800", note: "Hand-printed, edition of 50" },
];

export const Route = createFileRoute("/merch")({
  component: () => (
    <AuthGate>
      <MerchPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Merch — TheZuriXperience" }] }),
});

function MerchPage() {
  return (
    <GatedPageLayout
      eyebrow="Wear the night"
      title={<>The Vol. 01 <span className="italic text-primary">drop</span></>}
      description="Limited pieces tied to RnB Nights. When they're gone, they don't return."
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.name} className="bg-card p-6">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-background" />
            <div className="mt-4 font-display text-xl font-bold">{it.name}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{it.note}</div>
            <div className="mt-3 text-sm font-semibold text-primary">{it.price}</div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
