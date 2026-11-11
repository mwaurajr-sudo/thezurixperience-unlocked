import { db } from "./db.server";

// Mirrors the defaults in src/hooks/useSiteContent.ts, used until an admin saves their own.
const DEFAULT_EVENT = {
  vol: "01",
  name: "RnB Nights",
  date: "Friday, 6th November",
  doors: "Open 6:00 PM · Close 7:30 PM",
  venue: "Myra Residences, Kilimani",
};
const DEFAULT_TIER_NAMES = ["Pass"];

export type CurrentEvent = {
  vol: string;
  title: string;
  date: string;
  doors: string;
  when: string;
  venue: string;
  tierNames: string[];
};

/**
 * Loads the current event and tier names from site_content. Emails go to whatever
 * address a visitor types, so event details come from here and never from the request.
 */
export const getCurrentEvent = async (): Promise<CurrentEvent> => {
  const { data, error } = await db()
    .from("site_content")
    .select("section, data")
    .in("section", ["event", "tickets"]);

  if (error) throw error;

  const sections = Object.fromEntries((data || []).map((row) => [row.section, row.data]));
  const event = { ...DEFAULT_EVENT, ...(sections.event ?? {}) };
  const tiers = Array.isArray(sections.tickets)
    ? sections.tickets.map((t: { name: string }) => t.name)
    : DEFAULT_TIER_NAMES;

  return {
    vol: event.vol,
    title: event.name,
    date: event.date,
    doors: event.doors,
    when: `${event.date} · ${event.doors}`,
    venue: event.venue || DEFAULT_EVENT.venue,
    tierNames: tiers,
  };
};

/** The public site address used for links in emails: PUBLIC_SITE_URL, else the address this request came in on. */
export const getSiteUrl = (request: Request) =>
  (process.env.PUBLIC_SITE_URL || new URL(request.url).origin).trim().replace(/\/$/, "");
