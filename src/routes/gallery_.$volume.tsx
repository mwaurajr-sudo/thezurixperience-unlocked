import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { findVolume, scatterLayout, type GalleryVolume } from "@/lib/gallery";

export const Route = createFileRoute("/gallery_/$volume")({
  component: () => (
    <AuthGate>
      <VolumePage />
    </AuthGate>
  ),
  head: ({ params }) => {
    const v = findVolume(params.volume);
    return { meta: [{ title: `${v ? `Volume ${Number(v.vol)}` : "Gallery"} — TheZuriXperience` }] };
  },
});

function VolumePage() {
  const { volume } = Route.useParams();
  const v = findVolume(volume);

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12 font-mono">
        <Link
          to="/gallery"
          className="text-xs uppercase tracking-[0.3em] text-primary/60 hover:text-primary"
        >
          ← all volumes
        </Link>
        {v ? (
          <ScatterWall volume={v} />
        ) : (
          <p className="mt-10 text-sm text-primary/60">That folder doesn't exist.</p>
        )}
      </main>
    </div>
  );
}

type Offset = { dx: number; dy: number };

function ScatterWall({ volume }: { volume: GalleryVolume }) {
  const { aspect, slots } = scatterLayout(volume.photos);
  const [offsets, setOffsets] = useState<Offset[]>(() => volume.photos.map(() => ({ dx: 0, dy: 0 })));
  // Stacking order: the last photo touched sits on top.
  const [order, setOrder] = useState<number[]>(() => volume.photos.map((_, i) => i));
  const [open, setOpen] = useState<number | null>(null);
  const drag = useRef<{ i: number; x: number; y: number; start: Offset; moved: boolean } | null>(null);

  const raise = (i: number) => setOrder((o) => [...o.filter((n) => n !== i), i]);

  // Dragging only on the scattered desktop wall; on phones the photos sit in a loose column.
  const canDrag = () => window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;

  const onPointerDown = (i: number) => (e: PointerEvent) => {
    raise(i);
    if (!canDrag()) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { i, x: e.clientX, y: e.clientY, start: offsets[i], moved: false };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    setOffsets((o) => o.map((off, n) => (n === d.i ? { dx: d.start.dx + dx, dy: d.start.dy + dy } : off)));
  };

  const onPointerUp = (i: number) => () => {
    const moved = drag.current?.moved;
    drag.current = null;
    if (!moved) setOpen(i);
  };

  const reshuffle = () => {
    setOffsets(volume.photos.map(() => ({ dx: 0, dy: 0 })));
    setOrder(volume.photos.map((_, i) => i));
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl uppercase tracking-[0.3em]">
            &gt; Volume {Number(volume.vol)}
            <span className="animate-blink">_</span>
          </h1>
          <p className="mt-3 text-xs uppercase tracking-[0.25em] text-primary/60">
            {volume.title} · {volume.date} · {volume.photos.length} frames
          </p>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.2em] text-primary/50">
          <p className="hidden md:block">drag the photos around · click one to open it</p>
          <p className="md:hidden">tap a photo to open it</p>
          <button
            type="button"
            onClick={reshuffle}
            className="mt-2 hidden border border-primary/40 px-3 py-1 text-primary/70 hover:border-primary hover:text-primary md:inline-block"
          >
            [restack]
          </button>
        </div>
      </div>

      <div className="zx-wall mt-10" style={{ "--wall-aspect": aspect } as CSSProperties}>
        {volume.photos.map((p, i) => {
          const s = slots[i];
          const style = {
            "--x": `${s.x}%`,
            "--y": `${s.y}%`,
            "--w": `${s.w}%`,
            "--r": `${s.r}deg`,
            "--dx": `${offsets[i].dx}px`,
            "--dy": `${offsets[i].dy}px`,
            "--i": i,
            zIndex: order.indexOf(i) + 1,
          } as CSSProperties;
          return (
            <figure
              key={p.src}
              className={`zx-photo ${i % 2 ? "zx-photo-right" : "zx-photo-left"}`}
              style={style}
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp(i)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(i)}
              tabIndex={0}
              role="button"
              aria-label={`Open photo ${i + 1} of ${volume.photos.length}`}
            >
              {i % 3 === 0 && <span className="zx-tape" aria-hidden />}
              <img
                src={p.src}
                width={p.width}
                height={p.height}
                alt={`Volume ${Number(volume.vol)}, photo ${i + 1}`}
                loading={i < 6 ? "eager" : "lazy"}
                draggable={false}
              />
              <figcaption>
                ZURI · VOL.{volume.vol} · #{String(i + 1).padStart(2, "0")}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {open !== null && (
        <Lightbox volume={volume} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function Lightbox({
  volume,
  index,
  onIndex,
  onClose,
}: {
  volume: GalleryVolume;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const total = volume.photos.length;
  const go = useCallback((step: number) => onIndex((index + step + total) % total), [index, total, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  const p = volume.photos[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 font-mono"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${total}`}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-5 py-4 text-xs uppercase tracking-[0.3em] text-primary/70">
        <span>
          Vol.{volume.vol} · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <button type="button" onClick={onClose} className="hover:text-primary">
          [close]
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        <img
          src={p.src}
          alt={`Volume ${Number(volume.vol)}, photo ${index + 1}`}
          className="max-h-full max-w-full border border-primary/30 object-contain shadow-[0_0_40px_oklch(0.62_0.24_25/0.25)]"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 border border-primary/40 bg-black/70 px-3 py-2 text-primary hover:border-primary sm:left-6"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 border border-primary/40 bg-black/70 px-3 py-2 text-primary hover:border-primary sm:right-6"
        >
          ›
        </button>
      </div>
    </div>
  );
}
