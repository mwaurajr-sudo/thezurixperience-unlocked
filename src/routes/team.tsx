import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";
import { Mail, Phone } from "lucide-react";

const team = [
  { name: "Zuri Mwende", role: "Founder & Curator", email: "zuri@thezurixperience.com", phone: "+254 700 000 001" },
  { name: "Kioko Mbithi", role: "Music Director", email: "music@thezurixperience.com", phone: "+254 700 000 002" },
  { name: "Amara Otieno", role: "Brand & Partners", email: "brands@thezurixperience.com", phone: "+254 700 000 003" },
  { name: "Tariq Hassan", role: "Operations", email: "ops@thezurixperience.com", phone: "+254 700 000 004" },
];

export const Route = createFileRoute("/team")({
  component: () => (
    <AuthGate>
      <TeamPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Team — TheZuriXperience" }] }),
});

function TeamPage() {
  return (
    <GatedPageLayout
      eyebrow="The curators"
      title={<>Meet the <span className="italic text-primary">room</span></>}
      description="Reach out directly. We respond — slowly, intentionally."
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2">
        {team.map((m) => (
          <div key={m.email} className="bg-card p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-primary">{m.role}</div>
            <div className="font-display mt-2 text-2xl font-bold">{m.name}</div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <a href={`mailto:${m.email}`} className="flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4 text-primary" /> {m.email}
              </a>
              <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-foreground">
                <Phone className="h-4 w-4 text-primary" /> {m.phone}
              </a>
            </div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
