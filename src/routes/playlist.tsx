import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import { BACKEND_URL } from "@/lib/backend";

const CODE_STORAGE_KEY = "zuri-playlist-code";

function readSavedCode() {
  try {
    return localStorage.getItem(CODE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_STORAGE_KEY, code);
    else localStorage.removeItem(CODE_STORAGE_KEY);
  } catch {
    // Without storage, the guest just enters the code again next time.
  }
}

export const Route = createFileRoute("/playlist")({
  component: () => (
    <AuthGate>
      <PlaylistPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Playlist — TheZuriXperience" }] }),
});

function PlaylistPage() {
  const [tracks, setTracks] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unlock = async (candidate: string, isSavedCode = false) => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/playlist/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: candidate }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        saveCode(candidate);
        setTracks(data.tracks);
      } else if (res.status === 401 && isSavedCode) {
        // The ticket behind this saved code is gone, or it's from before codes were tickets.
        saveCode(null);
      } else {
        setError(data.message || "Couldn't check that code. Please try again.");
      }
    } catch {
      setError("Couldn't reach the site. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const saved = readSavedCode();
    if (saved) void unlock(saved, true);
    else setChecking(false);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) void unlock(code.trim());
  };

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10 font-mono sm:px-5 sm:py-16">
        <h1 className="break-words text-xl uppercase tracking-[0.2em] sm:text-2xl sm:tracking-[0.3em]">
          &gt; Playlist<span className="animate-blink">_</span>
        </h1>

        {tracks ? (
          <UnlockedPlaylist tracks={tracks} />
        ) : (
          <section className="mt-10 sm:mt-12">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">[locked]</p>
            <h2 className="mt-3 break-words text-lg uppercase tracking-[0.15em] text-primary sm:text-xl sm:tracking-[0.25em]">
              Enter your ticket code.
            </h2>
            <p className="mt-4 break-words text-sm text-primary/70">
              It's on your pass.
            </p>
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ticket code"
                aria-label="Ticket code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="min-w-0 flex-1 border border-primary/40 bg-black px-3 py-3 text-base text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={checking || !code.trim()}
                className="border border-primary bg-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.3em] text-black hover:bg-primary-glow disabled:opacity-50"
              >
                {checking ? "Checking..." : "Unlock"}
              </button>
            </form>
            {error && (
              <p role="alert" className="mt-4 break-words text-sm text-primary">
                {error}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function UnlockedPlaylist({ tracks }: { tracks: string[] }) {
  const { content } = useSiteContent();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visibleTracks = tracks
    .map((title, i) => ({ title, n: i + 1 }))
    .filter((t) => t.title.toLowerCase().includes(q));

  return (
    <section className="mt-10 sm:mt-12">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">[unlocked]</p>
      <h2 className="mt-3 break-words text-lg uppercase tracking-[0.15em] text-primary sm:text-xl sm:tracking-[0.25em]">
        Welcome to the house.
      </h2>
      <p className="mt-4 break-words text-sm text-primary/70">
        {content.event.announced === true
          ? `Vol. ${content.event.vol} — ${content.event.name}. Familiarise yourself.`
          : "Familiarise yourself."}
      </p>

      {content.playlists.length === 0 ? (
        <p className="mt-10 text-sm text-primary/60">
          The DJ hasn't uploaded the set yet. Check back soon.
        </p>
      ) : (
        <ol className="mt-8 space-y-3">
          {content.playlists.map((p, i) => (
            <li key={i} className="flex gap-3 border-b border-primary/20 pb-3 text-sm sm:gap-4">
              <span className="shrink-0 text-primary/50">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1 break-words">
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
          [tracklist]{tracks.length > 0 && ` ${tracks.length} tracks`}
        </p>
        {tracks.length === 0 ? (
          <p className="mt-6 break-words text-sm text-primary/60">
            A new tracklist drops before the next event. Check back soon.
          </p>
        ) : (
          <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search tracks..."
            aria-label="Search tracks"
            className="mt-4 w-full border border-primary/40 bg-black px-3 py-3 text-base text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none sm:text-sm"
          />
          {visibleTracks.length === 0 ? (
            <p className="mt-6 break-words text-sm text-primary/60">No track matches "{query}".</p>
          ) : (
            <ol className="mt-6">
              {visibleTracks.map((t) => (
                <li
                  key={t.n}
                  className="flex gap-3 border-b border-primary/20 py-2.5 text-sm hover:bg-primary/10 sm:gap-4"
                >
                  <span className="w-8 shrink-0 text-primary/50">
                    {String(t.n).padStart(3, "0")}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-primary">{t.title}</span>
                </li>
              ))}
            </ol>
          )}
          </>
        )}
      </div>
    </section>
  );
}
