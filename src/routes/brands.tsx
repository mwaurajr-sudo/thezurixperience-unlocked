import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";

const brands = [
  { name: "Ruby Lounge", role: "Venue partner" },
  { name: "Noir Spirits", role: "Bar curation" },
  { name: "Atelier 254", role: "Wardrobe" },
  { name: "Sable Studio", role: "Visual identity" },
  { name: "Kilele Sound", role: "Audio engineering" },
  { name: "House of Fume", role: "Scent design" },
];

export const Route = createFileRoute("/brands")({
  component: () => (
    <AuthGate>
      <BrandsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Brands — TheZuriXperience" }] }),
});

function BrandsPage() {
  return (
    <GatedPageLayout
      eyebrow="The collaborators"
      title={<>The labels <span className="italic text-primary">behind</span> the night</>}
      description="Every Xperience is co-created. These are the houses we trust."
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <div key={b.name} className="flex h-40 flex-col justify-between bg-card p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-primary">{b.role}</div>
            <div className="font-display text-3xl font-bold">{b.name}</div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
