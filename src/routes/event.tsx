import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";
import { CalendarDays, MapPin, Clock, Shirt } from "lucide-react";

export const Route = createFileRoute("/event")({
  component: () => (
    <AuthGate>
      <EventPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "RnB Nights Vol. 01 — TheZuriXperience" }] }),
});

const facts = [
  { icon: CalendarDays, label: "Date", value: "Saturday, December 14" },
  { icon: Clock, label: "Doors", value: "9:00 PM — 4:00 AM" },
  { icon: MapPin, label: "Location", value: "Disclosed at door · Nairobi" },
  { icon: Shirt, label: "Dress", value: "Wine, black, or both" },
];

function EventPage() {
  return (
    <GatedPageLayout
      index="01"
      eyebrow="Vol. 01 — RnB"
      title={<>RnB Nights<br /><em className="italic text-primary-glow">Vol. 01</em></>}
      description="Slow burn. Deep red. A night curated around rhythm, intimacy, and ritual. Lineup revealed at the door."
    >
      <div className="grid grid-cols-1 divide-y divide-border/60 border border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {facts.slice(0, 2).map((f) => (
          <FactCell key={f.label} {...f} />
        ))}
      </div>
      <div className="grid grid-cols-1 divide-y divide-border/60 border border-border/60 border-t-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {facts.slice(2).map((f) => (
          <FactCell key={f.label} {...f} />
        ))}
      </div>
    </GatedPageLayout>
  );
}

function FactCell({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="flex items-start gap-5 p-8 sm:p-10">
      <Icon className="mt-1 h-5 w-5 text-primary-glow" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          {label}
        </div>
        <div className="font-display mt-3 text-3xl font-light italic text-foreground sm:text-4xl">
          {value}
        </div>
      </div>
    </div>
  );
}
