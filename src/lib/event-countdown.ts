// The countdown on the Event page. Admins set the moment in Event Details ("startsAt");
// until they do, it counts down to the default below. Clearing it hides the countdown.
// Times are Nairobi time (UTC+3 all year), whatever timezone the admin's device is in.

export const DEFAULT_COUNTDOWN = "2027-01-20T19:00:00+03:00";
const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

/** How long after the start the page says "we're live" before the countdown disappears. */
export const LIVE_FOR_MS = 6 * 60 * 60 * 1000;

/** The moment to count down to, or null when the countdown is switched off or the date is unreadable. */
export function countdownTarget(startsAt: string | undefined): number | null {
  if (startsAt === "") return null;
  const t = Date.parse(startsAt ?? DEFAULT_COUNTDOWN);
  return Number.isFinite(t) ? t : null;
}

/** "2027-01-20T19:00:00+03:00" → "2027-01-20T19:00", the format a datetime-local input shows. */
export function toNairobiInput(iso: string | undefined): string {
  const t = Date.parse(iso ?? "");
  if (!Number.isFinite(t)) return "";
  return new Date(t + NAIROBI_OFFSET_MS).toISOString().slice(0, 16);
}

/** "2027-01-20T19:00" from a datetime-local input → "2027-01-20T19:00:00+03:00". Empty stays empty. */
export function fromNairobiInput(value: string): string {
  return value ? `${value}:00+03:00` : "";
}

/** "Wed 20 Jan · 7:00 pm" in Nairobi time. */
export function formatNairobi(t: number): string {
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(t);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(t);
  return `${day} · ${time}`;
}

/** Days, hours, minutes and seconds left, or null once the moment has passed. */
export function timeLeft(target: number, now: number) {
  const diff = target - now;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    lastDay: diff < 24 * 60 * 60 * 1000,
  };
}
