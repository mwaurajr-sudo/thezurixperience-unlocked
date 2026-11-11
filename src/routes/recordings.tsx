import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import { hostedRecordings, type HostedRecording } from "@/lib/recordings";

export const Route = createFileRoute("/recordings")({
  component: () => (
    <AuthGate>
      <RecordingsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Recordings — TheZuriXperience" }] }),
});

function RecordingsPage() {
  const { content, loading } = useSiteContent();
  const linked = content.recordings ?? [];

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 font-mono">
        <h1 className="text-2xl uppercase tracking-[0.3em]">
          &gt; Recordings<span className="animate-blink">_</span>
        </h1>
        <p className="mt-4 text-sm text-primary/70">
          DJ sets from past chapters.
        </p>

        <ul className="mt-10 space-y-6">
          {hostedRecordings.map((r) => (
            <li key={r.src} className="border-b border-primary/20 pb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
                Vol. {r.vol}
              </p>
              <p className="mt-2 text-lg uppercase tracking-[0.2em] text-primary">
                {r.title}
              </p>
              <SetPlayer recording={r} />
            </li>
          ))}

          {/* Sets linked from the admin panel, such as Mixcloud or SoundCloud pages */}
          {linked.map((r, i) => (
            <li key={`linked-${i}`} className="border-b border-primary/20 pb-5">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
                Vol. {r.vol}
              </p>
              {r.title && (
                <p className="mt-2 text-lg uppercase tracking-[0.2em] text-primary">
                  {r.title}
                </p>
              )}
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-primary underline decoration-primary/40 hover:decoration-primary"
                >
                  → Listen to the set
                </a>
              ) : (
                <p className="mt-3 text-sm text-primary/50">Link coming soon.</p>
              )}
            </li>
          ))}
        </ul>

        {loading && hostedRecordings.length === 0 && (
          <p className="mt-10 text-sm text-primary/60">loading...</p>
        )}
      </main>
    </div>
  );
}

const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};

/** A player for one set. Starting one set pauses any other that is playing. */
function SetPlayer({ recording }: { recording: HostedRecording }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration);
  const [failed, setFailed] = useState(false);

  // Stop the sound when the guest leaves the page.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      document.querySelectorAll("audio").forEach((other) => other !== audio && other.pause());
      setFailed(false);
      audio.play().catch(() => setFailed(true));
    } else {
      audio.pause();
    }
  };

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.min(Math.max(seconds, 0), duration);
    audio.currentTime = target;
    setTime(target);
  };

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div className="mt-4">
      <audio
        ref={audioRef}
        src={recording.src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${recording.title}` : `Play ${recording.title}`}
          className="border border-primary/50 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-primary hover:border-primary hover:shadow-[0_0_14px_oklch(0.62_0.24_25/0.35)]"
        >
          {playing ? "[❚❚ pause]" : "[▶ play]"}
        </button>
        <button
          type="button"
          onClick={() => seekTo(time - 30)}
          aria-label="Back 30 seconds"
          className="text-xs uppercase tracking-[0.15em] text-primary/60 hover:text-primary"
        >
          [-30s]
        </button>
        <button
          type="button"
          onClick={() => seekTo(time + 30)}
          aria-label="Forward 30 seconds"
          className="text-xs uppercase tracking-[0.15em] text-primary/60 hover:text-primary"
        >
          [+30s]
        </button>
        <span className="ml-auto text-xs tabular-nums tracking-[0.15em] text-primary/60">
          {buffering && playing ? "loading... " : ""}
          {clock(time)} / {clock(duration)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={1}
        value={time}
        onChange={(e) => seekTo(Number(e.target.value))}
        aria-label={`Position in ${recording.title}`}
        className="zx-seek mt-3 w-full"
        style={{ "--progress": `${progress}%` } as CSSProperties}
      />

      {failed && (
        <p className="mt-2 text-xs text-primary/60">Couldn't play this set. Check your connection and try again.</p>
      )}
    </div>
  );
}
