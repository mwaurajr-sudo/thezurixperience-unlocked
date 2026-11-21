import { useEffect, useState } from "react";
import { LIVE_FOR_MS, countdownTarget, formatNairobi, timeLeft } from "@/lib/event-countdown";

/**
 * Big red countdown to the next chapter. It ticks every second, glows harder on the last day,
 * switches to "we're live" when doors open, and disappears 6 hours later.
 * It renders nothing until it's running in the browser, so the server and browser agree.
 */
export function Countdown({ startsAt, label }: { startsAt: string | undefined; label: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const target = countdownTarget(startsAt);
  if (target === null || now === null || now - target >= LIVE_FOR_MS) return null;

  const left = timeLeft(target, now);

  if (!left) {
    return (
      <section className="zx-countdown zx-countdown-live mt-10 border border-primary bg-primary/10 px-5 py-8 text-center font-mono">
        <p className="flex items-center justify-center gap-3 text-xs uppercase tracking-[0.4em] text-primary">
          <span className="zx-live-dot" aria-hidden /> Doors are open
        </p>
        <p className="zx-count-digit mt-4 text-4xl uppercase tracking-[0.2em] sm:text-6xl">We're live</p>
      </section>
    );
  }

  const units: [number, string][] = [
    [left.days, left.days === 1 ? "day" : "days"],
    [left.hours, "hrs"],
    [left.minutes, "min"],
    [left.seconds, "sec"],
  ];

  return (
    <section className={`zx-countdown mt-10 font-mono ${left.lastDay ? "zx-countdown-soon" : ""}`}>
      <p className="text-xs uppercase tracking-[0.4em] text-primary/60">
        {label} <span className="text-primary">· {formatNairobi(target)}</span>
      </p>
      <p className="sr-only">
        {left.days} days, {left.hours} hours and {left.minutes} minutes to go.
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-4" aria-hidden>
        {units.map(([value, unit]) => (
          <div key={unit} className="border border-primary/40 bg-primary/5 py-4 text-center sm:py-6">
            <div className="zx-count-digit text-3xl tabular-nums sm:text-6xl">{String(value).padStart(2, "0")}</div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-primary/60 sm:text-xs">{unit}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
