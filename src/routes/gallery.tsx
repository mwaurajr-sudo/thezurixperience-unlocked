import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { volumes } from "@/lib/gallery";

export const Route = createFileRoute("/gallery")({
  component: () => (
    <AuthGate>
      <GalleryPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Gallery — TheZuriXperience" }] }),
});

function GalleryPage() {
  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-16 font-mono">
        <h1 className="text-2xl uppercase tracking-[0.3em]">
          &gt; Gallery<span className="animate-blink">_</span>
        </h1>
        <p className="mt-4 text-sm text-primary/70">Photos from past chapters. Open a folder.</p>

        <ul className="mt-14 grid gap-16 sm:grid-cols-2">
          {volumes.map((v) => (
            <li key={v.slug}>
              <Link
                to="/gallery/$volume"
                params={{ volume: v.slug }}
                className="zx-folder group block"
                aria-label={`Open Volume ${v.vol}, ${v.title}, ${v.photos.length} photos`}
              >
                <div className="zx-folder-art">
                  <span className="zx-folder-back" />
                  {v.photos.slice(0, 3).map((p, i) => (
                    <img
                      key={p.src}
                      src={p.src}
                      alt=""
                      loading="lazy"
                      className={`zx-folder-peek zx-folder-peek-${i}`}
                    />
                  ))}
                  <span className="zx-folder-front">
                    <span className="text-xs uppercase tracking-[0.3em] text-primary/60">
                      Vol. {v.vol}
                    </span>
                  </span>
                </div>
                <p className="mt-6 text-lg uppercase tracking-[0.25em] text-primary group-hover:text-primary-glow">
                  Volume {Number(v.vol)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-primary/60">
                  {v.title} · {v.date} · {v.photos.length} frames
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
