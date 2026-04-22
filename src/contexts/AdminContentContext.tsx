import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  price: number;
  cap: number;
  sold: number;
  perks: string;
}

export interface MerchItem {
  name: string;
  price: string;
  note: string;
  units: number;
  status: "live" | "coming" | "sold";
}

export interface BrandPartner {
  name: string;
  role: string;
  website: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
}

export interface SiteContent {
  hero: {
    chapterLabel: string;
    headline: string;
    subtext: string;
    cta1: string;
    cta2: string;
  };
  manifesto: {
    headline: string;
    body: string;
    chaptersLive: string;
    residentArtists: string;
  };
  event: EventDetails;
  tickets: TicketTier[];
  ticketTagline: string;
  ticketSoldOut: string;
  merch: MerchItem[];
  playlists: Array<{ title: string; dj: string; url: string; desc: string; visibility: "members" | "public" }>;
  brands: BrandPartner[];
  team: TeamMember[];
  site: {
    name: string;
    tagline: string;
    location: string;
    email: string;
    instagram: string;
    membershipMode: "open" | "invite" | "closed";
    memberLabel: string;
    metaTitle: string;
    metaDesc: string;
  };
}

const defaultContent: SiteContent = {
  hero: {
    chapterLabel: "Vol. 01 — RnB Nights",
    headline: "The night remembers you.",
    subtext:
      "TheZuriXperience curates immersive nightlife — sound, scent, light, and ritual. Tonight's chapter is RnB. Slow burn, deep red.",
    cta1: "Reserve your spot",
    cta2: "View the event",
  },
  manifesto: {
    headline:
      "We don't throw parties. We build worlds that disappear at sunrise.",
    body:
      "TheZuriXperience is a curation house for nightlife and culture. Every event is a chapter — its own sound, palette, dress, and ritual. You don't attend; you enter.\n\nMembership is required because intimacy is. We keep our rooms small, our lineups secret until the door, and our nights unrepeatable.",
    chaptersLive: "01",
    residentArtists: "12",
  },
  event: {
    vol: "01",
    name: "RnB Nights",
    theme: "Slow burn, deep red.",
    tags: "RnB Nights, Vol. 01, Nairobi, Members Only, Limited Capacity, Dress to Burn",
    date: "Saturday, December 14",
    doors: "9:00 PM — 4:00 AM",
    venue: "",
    locMode: "secret",
    dress: "Wine & black",
    dresslbl: "Dress to Burn",
    dj1: "",
    dj2: "",
    dj3: "",
    lineupMode: "secret",
  },
  tickets: [
    { name: "General", price: 2500, cap: 120, sold: 74, perks: "Entry after 10 PM, Welcome drink" },
    { name: "VIP", price: 6000, cap: 40, sold: 28, perks: "Priority entry, Reserved standing, Two welcome drinks" },
    { name: "Table (4)", price: 28000, cap: 10, sold: 7, perks: "Reserved table, Bottle service, Private host" },
  ],
  ticketTagline: "Capacity is intentionally small. Once a tier is gone, it's gone.",
  ticketSoldOut: "This chapter is full. Join the waitlist.",
  merch: [
    { name: "Vol. 01 Tee", price: "KES 3,500", note: "Heavyweight cotton, wine on black", units: 100, status: "live" },
    { name: "Velvet Cap", price: "KES 2,800", note: "Embroidered Z mark", units: 50, status: "live" },
    { name: "RnB Vinyl", price: "KES 4,500", note: "Limited 100 — signed sleeve", units: 100, status: "live" },
    { name: "Silk Bandana", price: "KES 1,800", note: "Hand-printed, edition of 50", units: 50, status: "live" },
  ],
  playlists: [
    {
      title: "RnB Nights Vol. 01 — Official Set",
      dj: "",
      url: "",
      desc: "The official set from RnB Nights Vol. 01. Slow builds, deep cuts.",
      visibility: "members",
    },
  ],
  brands: [
    { name: "Ruby Lounge", role: "Venue partner", website: "" },
    { name: "Noir Spirits", role: "Bar curation", website: "" },
    { name: "Atelier 254", role: "Wardrobe", website: "" },
    { name: "Sable Studio", role: "Visual identity", website: "" },
    { name: "Kilele Sound", role: "Audio engineering", website: "" },
    { name: "House of Fume", role: "Scent design", website: "" },
  ],
  team: [
    { name: "Zuri Mwende", role: "Founder & Curator", email: "zuri@thezurixperience.com", phone: "+254 700 000 001", bio: "" },
    { name: "Kioko Mbithi", role: "Music Director", email: "music@thezurixperience.com", phone: "+254 700 000 002", bio: "" },
    { name: "Amara Otieno", role: "Brand & Partners", email: "brands@thezurixperience.com", phone: "+254 700 000 003", bio: "" },
    { name: "Tariq Hassan", role: "Operations", email: "ops@thezurixperience.com", phone: "+254 700 000 004", bio: "" },
  ],
  site: {
    name: "TheZuriXperience",
    tagline: "Events, redefined",
    location: "Nairobi · Kenya",
    email: "hello@thezurixperience.com",
    instagram: "@thezurixperience",
    membershipMode: "open",
    memberLabel: "Members Only",
    metaTitle: "TheZuriXperience — Events, redefined",
    metaDesc:
      "An invite-only curation house for immersive nightlife and culture. Built in Nairobi. Felt everywhere.",
  },
};

type SectionKey = keyof SiteContent;

interface AdminContentContextValue {
  content: SiteContent;
  setContent: React.Dispatch<React.SetStateAction<SiteContent>>;
  loading: boolean;
  saveSection: (section: SectionKey | SectionKey[]) => Promise<void>;
}

const AdminContentContext = createContext<AdminContentContextValue | undefined>(undefined);

export function AdminContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  // Load all sections from DB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("site_content").select("section, data");
      if (cancelled) return;
      if (error) {
        console.error("Failed to load site content", error);
        toast.error("Could not load saved content; showing defaults.");
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        setContent((prev) => {
          const next = { ...prev } as SiteContent;
          for (const row of data) {
            const key = row.section as SectionKey;
            if (key in next && row.data != null) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (next as any)[key] = row.data;
            }
          }
          return next;
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveSection = async (section: SectionKey | SectionKey[]) => {
    const sections = Array.isArray(section) ? section : [section];
    const rows = sections.map((s) => ({
      section: s as string,
      data: content[s] as unknown as Record<string, unknown>,
    }));
    const { error } = await supabase
      .from("site_content")
      .upsert(rows, { onConflict: "section" });
    if (error) {
      console.error("Save failed", error);
      toast.error(`Save failed: ${error.message}`);
      throw error;
    }
  };

  return (
    <AdminContentContext.Provider value={{ content, setContent, loading, saveSection }}>
      {children}
    </AdminContentContext.Provider>
  );
}

export function useAdminContent() {
  const ctx = useContext(AdminContentContext);
  if (!ctx) throw new Error("useAdminContent must be used inside AdminContentProvider");
  return ctx;
}
