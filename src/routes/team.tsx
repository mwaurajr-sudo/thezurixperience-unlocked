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
      index="06"
      eyebrow="The curators"
      title={<>Meet the <em className="italic text-primary-glow">room</em></>}
      description="Reach out directly. We respond — slowly, intentionally."
    >
      <div className="grid grid-cols-1 divide-y divide-border/60 border border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {team.slice(0, 2).map((m, i) => <Person key={m.email} {...m} index={i + 1} />)}
      </div>
      <div className="grid grid-cols-1 divide-y divide-border/60 border border-border/60 border-t-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {team.slice(2).map((m, i) => <Person key={m.email} {...m} index={i + 3} />)}
      </div>
    </GatedPageLayout>
  );
}

function Person({ name, role, email, phone, index }: { name: string; role: string; email: string; phone: string; index: number }) {
  return (
    <div className="bg-background p-8 transition-colors hover:bg-card sm:p-10">
      <div className="flex items-start justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-primary-glow">
          {role}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          / 0{index}
        </div>
      </div>
      <div className="font-display mt-4 text-3xl font-light italic sm:text-4xl">{name}</div>
      <div className="mt-6 space-y-3 text-sm text-muted-foreground">
        <a href={`mailto:${email}`} className="flex items-center gap-3 transition-colors hover:text-foreground">
          <Mail className="h-4 w-4 text-primary-glow" /> {email}
        </a>
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-3 transition-colors hover:text-foreground">
          <Phone className="h-4 w-4 text-primary-glow" /> {phone}
        </a>
      </div>
    </div>
  );
}
