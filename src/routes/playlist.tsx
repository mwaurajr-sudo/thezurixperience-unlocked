import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import { tracklist } from "@/data/tracklist";

export const Route = createFileRoute("/playlist")({
  component: () => (
    <AuthGate>
      <PlaylistPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Playlist — TheZuriXperience" }] }),
});

function PlaylistPage() {
  const { content } = useSiteContent();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visibleTracks = tracklist
    .map((title, i) => ({ title, n: i + 1 }))
    .filter((t) => t.title.toLowerCase().includes(q));

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 font-mono">
        <h1 className="text-2xl uppercase tracking-[0.3em]">
          &gt; Playlist<span className="animate-blink">_</span>
        </h1>

        <section className="mt-12">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">[unlocked]</p>
          <h2 className="mt-3 text-xl uppercase tracking-[0.25em] text-primary">
            Welcome to the house.
          </h2>
          <p className="mt-4 text-sm text-primary/70">
            Vol. {content.event.vol} — {content.event.name}. Familiarise yourself.
          </p>

          {content.playlists.length === 0 ? (
            <p className="mt-10 text-sm text-primary/60">
              The DJ hasn't uploaded the set yet. Check back soon.
            </p>
          ) : (
            <ol className="mt-8 space-y-3">
              {content.playlists.map((p, i) => (
                <li key={i} className="flex gap-4 border-b border-primary/20 pb-3 text-sm">
                  <span className="text-primary/50">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="text-primary">{p.title || "Untitled"}</p>
                    {p.dj && <p className="text-xs text-primary/60">— {p.dj}</p>}
                    {p.desc && <p className="mt-1 text-xs text-primary/50">{p.desc}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-14 border-t border-primary/40 pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
              [tracklist] {tracklist.length} tracks
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search tracks..."
              aria-label="Search tracks"
              className="mt-4 w-full border border-primary/40 bg-black px-3 py-3 text-sm text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
            />
            {visibleTracks.length === 0 ? (
              <p className="mt-6 text-sm text-primary/60">No track matches "{query}".</p>
            ) : (
              <ol className="mt-6">
                {visibleTracks.map((t) => (
                  <li
                    key={t.n}
                    className="flex gap-4 border-b border-primary/20 py-2.5 text-sm hover:bg-primary/10"
                  >
                    <span className="w-8 shrink-0 text-primary/50">
                      {String(t.n).padStart(3, "0")}
                    </span>
                    <span className="text-primary">{t.title}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
