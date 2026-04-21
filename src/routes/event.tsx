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
      eyebrow="Vol. 01 — RnB"
      title={<>RnB Nights<br /><span className="italic text-primary">Vol. 01</span></>}
      description="Slow burn. Deep red. A night curated around rhythm, intimacy, and ritual. Lineup revealed at the door."
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2">
        {facts.map((f) => (
          <div key={f.label} className="flex items-start gap-4 bg-card p-8">
            <f.icon className="h-6 w-6 text-primary" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{f.label}</div>
              <div className="font-display mt-2 text-2xl font-bold">{f.value}</div>
            </div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
