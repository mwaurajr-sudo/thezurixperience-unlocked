import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventDetails {
  vol: string;
  name: string;
  theme: string;
  tags: string;
  date: string;
  doors: string;
  venue: string;
  locMode: "secret" | "partial" | "full";
  dress: string;
  dresslbl: string;
  dj1: string;
  dj2: string;
  dj3: string;
  lineupMode: "secret" | "partial" | "full";
}

export interface TicketTier {
  name: string;
  cap: number;
  sold: number;
  perks: string;
}

export interface PlaylistEntry {
  title: string;
  dj: string;
  url: string;
  desc: string;
  visibility: "members" | "public";
}

export interface RecordingEntry {
  vol: string;
  title: string;
  url: string;
}

export interface PublicSiteContent {
  event: EventDetails;
  tickets: TicketTier[];
  ticketTagline: string;
  ticketSoldOut: string;
  playlists: PlaylistEntry[];
  recordings: RecordingEntry[];
}

const defaultContent: PublicSiteContent = {
  event: {
    vol: "01",
    name: "RnB Nights",
    theme: "Slow burn, deep red.",
    tags: "RnB Nights, Vol. 01, Nairobi, Members Only",
    date: "Friday, 6th November",
    doors: "Open 6:00 PM · Close 7:30 PM",
    venue: "",
    locMode: "secret",
    dress: "Comfortable & cozy",
    dresslbl: "",
    dj1: "",
    dj2: "",
    dj3: "",
    lineupMode: "secret",
  },
  tickets: [
    { name: "Pass", cap: 99, sold: 0, perks: "" },
  ],
  ticketTagline: "Capacity is intentionally small. Once a tier is gone, it's gone.",
  ticketSoldOut: "This chapter is full. Join the waitlist.",
  playlists: [],
  recordings: [],
};

export function useSiteContent() {
  const [content, setContent] = useState<PublicSiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_content")
      .select("section, data")
      .in("section", [
        "event",
        "tickets",
        "ticketTagline",
        "ticketSoldOut",
        "playlists",
        "recordings",
      ])
      .then(({ data }) => {
        if (cancelled || !data) {
          setLoading(false);
          return;
        }
        setContent((prev) => {
          const next = { ...prev };
          for (const row of data) {
            const key = row.section as keyof PublicSiteContent;
            if (row.data != null) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (next as any)[key] = row.data;
            }
          }
          return next;
        });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, loading };
}
