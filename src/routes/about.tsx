import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState, useCallback } from "react";

export const Route = createFileRoute("/about")({
  component: () => (
    <AuthGate>
      <AboutPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "About — TheZuriXperience" }] }),
});

function AboutPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // A removed video keeps playing its sound, so stop it when the guest leaves this page.
  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setTimeout(() => setShowOverlay(false), 800);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setShowOverlay(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-0 py-8 sm:px-5">
        <h1 className="px-5 font-mono text-2xl uppercase tracking-[0.3em] sm:px-0">
          &gt; About<span className="animate-blink">_</span>
        </h1>

        {/* ── Cinematic Video Section — clean, no borders ── */}
        <div className="mt-6">
          <div
            className="group relative mx-auto w-fit max-w-full cursor-pointer overflow-hidden"
            onClick={togglePlay}
            onMouseEnter={() => isPlaying && setShowOverlay(true)}
            onMouseLeave={() => isPlaying && setShowOverlay(false)}
          >
            {/* Video element — starts paused, no autoplay */}
            <video
              ref={videoRef}
              src="/zuri-about.mp4"
              className="block h-[calc(100svh-12rem)] min-h-80 max-w-full"
              preload="metadata"
              playsInline
              onEnded={handleVideoEnd}
              style={{ aspectRatio: "576 / 1024", objectFit: "contain", background: "#000" }}
            />

            {/* Play / Pause Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
              style={{
                opacity: showOverlay ? 1 : 0,
                pointerEvents: showOverlay ? "auto" : "none",
                background: isPlaying
                  ? "radial-gradient(circle, oklch(0 0 0 / 0.3) 0%, oklch(0 0 0 / 0.5) 100%)"
                  : "radial-gradient(circle, oklch(0 0 0 / 0.4) 0%, oklch(0 0 0 / 0.7) 100%)",
              }}
            >
              {/* Play / Pause Icon */}
              <div
                className="flex items-center justify-center transition-transform duration-300 hover:scale-110"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "2px solid oklch(0.62 0.24 25 / 0.8)",
                  background: "oklch(0 0 0 / 0.6)",
                  boxShadow: "0 0 20px oklch(0.62 0.24 25 / 0.3)",
                }}
              >
                {isPlaying ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="6" y="4" width="4" height="16" rx="1" fill="oklch(0.62 0.24 25)" />
                    <rect x="14" y="4" width="4" height="16" rx="1" fill="oklch(0.62 0.24 25)" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginLeft: "3px" }}>
                    <path d="M8 5v14l11-7L8 5z" fill="oklch(0.62 0.24 25)" />
                  </svg>
                )}
              </div>
            </div>

            {/* Bottom label */}
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em]"
              style={{
                background: "linear-gradient(to top, oklch(0 0 0 / 0.85), transparent)",
                color: "oklch(0.62 0.24 25 / 0.7)",
                opacity: showOverlay ? 1 : 0,
                transition: "opacity 0.5s",
              }}
            >
              {isPlaying ? "▌▌ pause" : "▶ play"}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
