import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";
import { Disc3 } from "lucide-react";

const sets = [
  { dj: "DJ Velour", set: "Opening Ritual", duration: "62 min", date: "Vol. 01 · Dec 14" },
  { dj: "Kanyari", set: "Slow Burn", duration: "78 min", date: "Vol. 01 · Dec 14" },
  { dj: "Mwangi B2B Sade", set: "Late Hours", duration: "94 min", date: "Vol. 01 · Dec 14" },
];

export const Route = createFileRoute("/playlists")({
  component: () => (
    <AuthGate>
      <PlaylistsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Playlists — TheZuriXperience" }] }),
});

function PlaylistsPage() {
  return (
    <GatedPageLayout
      eyebrow="The archive"
      title={<>Relive the <span className="italic text-primary">sets</span></>}
      description="Every chapter, captured. Curated mixes from each night, available only to members."
    >
      <div className="space-y-3">
        {sets.map((s) => (
          <div key={s.set} className="flex items-center justify-between gap-6 rounded-xl border border-border/60 bg-card/40 p-6 transition-colors hover:bg-card/60">
            <div className="flex items-center gap-5">
              <div className="grid h-12 w-12 place-content-center rounded-full bg-primary/10 text-primary">
                <Disc3 className="h-6 w-6" />
              </div>
              <div>
                <div className="font-display text-xl font-bold">{s.set}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.dj} · {s.date}</div>
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.duration}</div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
