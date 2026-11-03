import { supabase } from "./db.js";

// Mirrors the defaults in src/hooks/useSiteContent.ts, used until an admin saves their own.
const DEFAULT_EVENT = {
  vol: "01",
  name: "RnB Nights",
  date: "Saturday, December 14",
  venue: "Myra Residences, Kilimani",
};
const DEFAULT_TIER_NAMES = ["Pass"];

/**
 * Loads the current event and tier names from site_content. Emails are sent to whatever
 * address a visitor types, so event details must come from here and never from the request.
 *
 * @returns {Promise<Object>} { vol, title, date, venue, tierNames }
 */
export const getCurrentEvent = async () => {
  const { data, error } = await supabase
    .from("site_content")
    .select("section, data")
    .in("section", ["event", "tickets"]);

  if (error) throw error;

  const sections = Object.fromEntries((data || []).map((row) => [row.section, row.data]));
  const event = { ...DEFAULT_EVENT, ...sections.event };
  const tiers = Array.isArray(sections.tickets) ? sections.tickets.map((t) => t.name) : DEFAULT_TIER_NAMES;

  return {
    vol: event.vol,
    title: event.name,
    date: event.date,
    venue: event.venue || DEFAULT_EVENT.venue,
    tierNames: tiers,
  };
};
