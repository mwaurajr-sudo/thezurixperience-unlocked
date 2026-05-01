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
      index="05"
      eyebrow="The collaborators"
      title={<>The labels <em className="italic text-primary-glow">behind</em> the night</>}
      description="Every Xperience is co-created. These are the houses we trust."
    >
      <div className="grid grid-cols-1 divide-y divide-border/60 border border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
        {brands.map((b, i) => (
          <div key={b.name} className="group flex h-48 flex-col justify-between bg-background p-7 transition-colors hover:bg-card">
            <div className="flex items-start justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-primary-glow">
                {b.role}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                / 0{i + 1}
              </div>
            </div>
            <div className="font-display text-3xl font-light italic leading-none tracking-tight sm:text-4xl">
              {b.name}
            </div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
