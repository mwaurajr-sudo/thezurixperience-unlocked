import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Lock } from "lucide-react";
import heroImg from "@/assets/hero-zuri.jpg";
import velvetImg from "@/assets/texture-velvet.jpg";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  component: Index,
});

const sections = [
  { num: "01", title: "The Event", desc: "RnB Nights — our debut. Date, lineup, ritual.", to: "/event" as const },
  { num: "02", title: "Tickets", desc: "GA, VIP, and tables. Capacity is intentionally small.", to: "/tickets" as const },
  { num: "03", title: "Merch", desc: "Wear the night. Limited drops, never reissued.", to: "/merch" as const },
  { num: "04", title: "Playlists", desc: "Relive the sets. Curated mixes from each chapter.", to: "/playlists" as const },
  { num: "05", title: "Brands", desc: "The houses we trust. Our quiet collaborators.", to: "/brands" as const },
  { num: "06", title: "Team", desc: "Meet the curators. Reach us directly.", to: "/team" as const },
];

const tickerWords = [
  "Vol. 01", "RnB Nights", "Nairobi", "Members Only",
  "Limited Capacity", "Dress to Burn", "Sat · Dec 14",
];

function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO — split-screen editorial */}
      <section className="relative grain isolate min-h-screen overflow-hidden">
        {/* Background image */}
        <img
          src={heroImg}
          alt="Intimate maroon-lit lounge with velvet seating and candlelight"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        {/* Layered overlays for depth */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/30" />

        {/* Side rail — vertical text */}
        <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 lg:block sm:left-8">
          <div className="vertical-text font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            <span className="text-primary-glow">●</span>&nbsp;&nbsp;Recording in session — Nairobi · 01°17'S 36°49'E
          </div>
        </div>

        {/* Main hero content */}
        <div className="relative mx-auto grid min-h-screen max-w-[1400px] grid-cols-12 items-end gap-6 px-5 pb-32 pt-32 sm:px-8 sm:pb-36 sm:pt-40 lg:items-center">
          <div className="col-span-12 lg:col-span-8 lg:col-start-2">
            <div className="flex animate-fade-up items-center gap-4 font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
              <span className="h-px w-12 bg-primary-glow/60" />
              Vol. 01 / The Debut Chapter
            </div>

            <h1 className="font-display mt-8 text-[3.5rem] font-light leading-[0.88] tracking-tighter text-foreground animate-fade-up sm:text-[5.5rem] md:text-[7rem] lg:text-[9rem]">
              The night<br />
              <span className="italic text-primary-glow">remembers</span><br />
              <span className="text-foreground/70">you.</span>
            </h1>

            <div className="mt-12 grid gap-8 sm:grid-cols-12 sm:gap-6">
              <p className="text-sm leading-relaxed text-muted-foreground sm:col-span-7 sm:text-base">
                TheZuriXperience curates immersive nightlife — sound, scent,
                light, and ritual. Tonight's chapter is RnB. Slow burn,
                deep red, intimate by design.
              </p>
              <div className="flex flex-wrap items-start gap-3 sm:col-span-5">
                <Button asChild size="lg" className="group rounded-none bg-primary px-7 text-primary-foreground hover:bg-primary-glow">
                  <Link to="/signup">
                    Reserve your spot
                    <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-none border-foreground/20 bg-transparent px-7 hover:bg-foreground/5">
                  <Link to="/event">View the chapter</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom marquee */}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-y border-border/40 bg-background/70 py-3.5 backdrop-blur-md">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.4em] text-foreground/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-12">
                {tickerWords.map((w) => (
                  <span key={w} className="flex items-center gap-12">
                    {w}
                    <span className="text-primary-glow">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO — editorial typography */}
      <section className="relative border-b border-border/60 px-5 py-32 sm:px-8 md:py-40">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
              — 001 / Manifesto
            </p>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Filed in Nairobi<br />
              {new Date().getFullYear()}
            </p>
          </div>
          <div className="lg:col-span-9">
            <h2 className="font-display text-4xl font-light leading-[1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              We don't throw parties.<br />
              We <em className="italic text-primary-glow">build worlds</em><br />
              that disappear at sunrise.
            </h2>
            <div className="mt-12 grid gap-8 text-base leading-relaxed text-muted-foreground md:grid-cols-2 md:gap-12">
              <p className="border-l border-primary/40 pl-6">
                TheZuriXperience is a curation house for nightlife and culture.
                Every event is its own chapter — its own sound, palette, dress,
                and ritual. You don't attend; you enter.
              </p>
              <p className="border-l border-border pl-6">
                Membership is required because intimacy is. We keep our rooms
                small, our lineups secret until the door, and our nights
                unrepeatable. What happens stays in the room — except the playlist.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-6 border-t border-border/60 pt-10 sm:gap-12">
              {[
                { n: "01", l: "Chapters live" },
                { n: "12", l: "Resident artists" },
                { n: "∞", l: "Stories untold" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-5xl font-light italic text-primary-glow sm:text-6xl">
                    {s.n}
                  </div>
                  <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* THE ROOMS — magazine grid */}
      <section className="relative border-b border-border/60 px-5 py-32 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
                — 002 / Step inside
              </p>
              <h2 className="font-display mt-5 text-4xl font-light leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
                Six doors.<br />
                <em className="italic text-primary-glow">One room.</em>
              </h2>
            </div>
            <div className="flex items-center gap-2 border border-primary/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <Lock className="h-3 w-3 text-primary-glow" />
              Members only
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border/60 border-x border-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
            {sections.slice(0, 3).map((s) => (
              <RoomCard key={s.num} {...s} />
            ))}
          </div>
          <div className="grid grid-cols-1 divide-y divide-border/60 border border-border/60 border-t-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
            {sections.slice(3).map((s) => (
              <RoomCard key={s.num} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING — asymmetric editorial spread */}
      <section className="relative isolate overflow-hidden border-b border-border/60 px-5 py-32 sm:px-8">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{ backgroundImage: `url(${velvetImg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/40" />

        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
              — 003 / Now boarding
            </p>
            <h2 className="font-display mt-6 text-5xl font-light leading-[0.92] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              RnB Nights<br />
              <em className="italic text-primary-glow">Vol. 01</em>
            </h2>

            <dl className="mt-12 grid grid-cols-2 gap-y-8 border-y border-border/60 py-10">
              {[
                { l: "Date", v: "Sat · Dec 14" },
                { l: "Doors", v: "9:00 PM" },
                { l: "Location", v: "At the door" },
                { l: "Dress", v: "Wine & black" },
              ].map((f) => (
                <div key={f.l}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {f.l}
                  </dt>
                  <dd className="font-display mt-2 text-3xl font-light italic text-foreground sm:text-4xl">
                    {f.v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-none bg-primary px-8 text-primary-foreground hover:bg-primary-glow">
                <Link to="/tickets">Get tickets</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-none px-8 text-foreground hover:bg-foreground/5">
                <Link to="/event">Full chapter →</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden border border-border/60">
              <img
                src={heroImg}
                alt="Velvet booth bathed in maroon light"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
                    Chapter 01
                  </div>
                  <div className="font-display mt-2 text-3xl font-light italic">
                    RnB
                  </div>
                </div>
                <div className="border border-foreground/30 bg-background/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.3em] backdrop-blur">
                  Limited
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <span>Capacity 180</span>
              <span className="text-primary-glow">●&nbsp;72% reserved</span>
            </div>
          </div>
        </div>
      </section>

      {/* GATE / CTA — quiet, confident */}
      <section className="relative border-b border-border/60 px-5 py-32 text-center sm:px-8 md:py-40">
        <div className="mx-auto max-w-3xl">
          <Lock className="mx-auto h-8 w-8 text-primary-glow animate-flicker" />
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
            — 004 / The threshold
          </p>
          <h2 className="font-display mt-6 text-4xl font-light leading-[0.95] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            The room is locked.<br />
            <em className="italic text-primary-glow">You hold the key.</em>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
            Create your account to unlock tickets, merch drops, playlists,
            brand partners, and direct access to the team. Free to join.
            Always discreet.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-none bg-primary px-10 text-primary-foreground hover:bg-primary-glow">
              <Link to="/signup">Request access</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-none border-foreground/20 bg-transparent px-10 hover:bg-foreground/5">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-background px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-display text-3xl font-light italic">
              <span className="text-primary-glow">Zuri</span>Xperience
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              An invite-only curation house for immersive nightlife and culture.
              Built in Nairobi. Felt everywhere.
            </p>
          </div>
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Explore
            </div>
            <ul className="mt-5 space-y-2.5 text-sm">
              {sections.map((l) => (
                <li key={l.title}>
                  <Link
                    to={l.to}
                    className="font-display text-lg italic text-foreground/80 transition-colors hover:text-primary-glow"
                  >
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Stay close
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              hello@thezurixperience.com<br />
              Nairobi · Kenya<br />
              <span className="text-primary-glow">+254 700 000 000</span>
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1400px] items-center justify-between border-t border-border/60 pt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>© {new Date().getFullYear()} TheZuriXperience</span>
          <span className="text-primary-glow">Vol. 01 — RnB</span>
        </div>
      </footer>
    </div>
  );
}

function RoomCard({
  num, title, desc, to,
}: { num: string; title: string; desc: string; to: typeof sections[number]["to"] }) {
  return (
    <Link
      to={to}
      className="group relative flex min-h-[280px] flex-col justify-between bg-background p-7 transition-colors hover:bg-card sm:p-8"
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          / {num}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-glow" />
      </div>
      <div>
        <h3 className="font-display text-4xl font-light leading-none tracking-tight">
          {title}
        </h3>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {desc}
        </p>
      </div>
    </Link>
  );
}
