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
      index="03"
      eyebrow="Wear the night"
      title={<>The Vol. 01 <em className="italic text-primary-glow">drop</em></>}
      description="Limited pieces tied to RnB Nights. When they're gone, they don't return."
    >
      <div className="grid grid-cols-1 divide-y divide-border/60 border border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.map((it, i) => (
          <div key={it.name} className="group bg-background p-6 transition-colors hover:bg-card">
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/20 via-card to-background">
              <div className="absolute inset-0 spotlight opacity-50 transition-opacity group-hover:opacity-80" />
              <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">
                / 0{i + 1}
              </div>
              <div className="absolute right-3 top-3 border border-foreground/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                Limited
              </div>
            </div>
            <div className="mt-5 font-display text-2xl font-light italic">{it.name}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {it.note}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-primary-glow">{it.price}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Soon</span>
            </div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
