import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { GatedPageLayout } from "@/components/GatedPageLayout";
import { Disc3, Play } from "lucide-react";

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
      index="04"
      eyebrow="The archive"
      title={<>Relive the <em className="italic text-primary-glow">sets</em></>}
      description="Every chapter, captured. Curated mixes from each night, available only to members."
    >
      <div className="border border-border/60 divide-y divide-border/60">
        {sets.map((s, i) => (
          <div
            key={s.set}
            className="group flex items-center justify-between gap-6 bg-background p-6 transition-colors hover:bg-card sm:p-8"
          >
            <div className="flex items-center gap-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                / 0{i + 1}
              </span>
              <div className="grid h-14 w-14 place-content-center border border-primary/40 bg-primary/10 text-primary-glow transition-colors group-hover:bg-primary/20">
                <Disc3 className="h-6 w-6 transition-transform group-hover:rotate-90" />
              </div>
              <div>
                <div className="font-display text-2xl font-light italic sm:text-3xl">{s.set}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {s.dj} · {s.date}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:inline">
                {s.duration}
              </span>
              <Play className="h-5 w-5 text-foreground/60 transition-colors group-hover:text-primary-glow" />
            </div>
          </div>
        ))}
      </div>
    </GatedPageLayout>
  );
}
