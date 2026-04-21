import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Ticket, ShoppingBag, Disc3, Sparkles, Users, CalendarDays, Lock } from "lucide-react";
import heroImg from "@/assets/hero-rnb.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

const navLinks = [
  { label: "Event", href: "/event" },
  { label: "Tickets", href: "/tickets" },
  { label: "Merch", href: "/merch" },
  { label: "Playlists", href: "/playlists" },
  { label: "Brands", href: "/brands" },
  { label: "Team", href: "/team" },
];

const sections = [
  {
    title: "The Event",
    desc: "RnB Nights — our debut. Date, lineup, location, dress code.",
    icon: CalendarDays,
    href: "/event",
  },
  {
    title: "Tickets",
    desc: "GA, VIP, and table reservations. Limited seats — first come.",
    icon: Ticket,
    href: "/tickets",
  },
  {
    title: "Merch",
    desc: "Wear the night. Limited drops tied to each event.",
    icon: ShoppingBag,
    href: "/merch",
  },
  {
    title: "Playlists",
    desc: "Relive the sets. Curated DJ mixes from previous nights.",
    icon: Disc3,
    href: "/playlists",
  },
  {
    title: "Brands",
    desc: "The labels and partners shaping every Xperience.",
    icon: Sparkles,
    href: "/brands",
  },
  {
    title: "The Team",
    desc: "Meet the curators. Get in touch directly.",
    icon: Users,
    href: "/team",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            <span className="text-primary">Zuri</span>Xperience
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground sm:inline-block"
            >
              Sign in
            </a>
            <Button asChild size="sm" className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
              <a href="/signup">Join</a>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative grain isolate flex min-h-screen items-end overflow-hidden">
        <img
          src={heroImg}
          alt="RnB Nights crowd bathed in deep wine red stage light"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/30 to-background" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-40">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary/90">
            <span className="h-px w-10 bg-primary/60" />
            Vol. 01 — RnB Nights
          </div>
          <h1 className="font-display mt-6 max-w-5xl text-6xl font-black leading-[0.95] tracking-tight text-foreground sm:text-7xl md:text-8xl lg:text-[9rem]">
            The night<br />
            <span className="italic text-primary">remembers</span><br />
            you.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            TheZuriXperience curates immersive nightlife — sound, scent, light, and ritual.
            Tonight's chapter is RnB. Slow burn, deep red.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="group rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90">
              <a href="/signup">
                Reserve your spot
                <ArrowUpRight className="ml-1 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-foreground/20 bg-transparent px-8 text-foreground hover:bg-foreground/5">
              <a href="/event">View the event</a>
            </Button>
          </div>
        </div>

        {/* Marquee */}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-border/40 bg-background/60 py-4 backdrop-blur">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-sm uppercase tracking-[0.4em] text-foreground/60">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-12">
                <span>RnB Nights</span><span>·</span>
                <span>Vol. 01</span><span>·</span>
                <span>Nairobi</span><span>·</span>
                <span>Members Only</span><span>·</span>
                <span>Limited Capacity</span><span>·</span>
                <span>Dress to Burn</span><span>·</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="relative border-b border-border/60 px-6 py-32">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">— Our Manifesto</p>
          </div>
          <div className="lg:col-span-8">
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              We don't throw parties.<br />
              We <span className="italic text-primary">build worlds</span> that disappear at sunrise.
            </h2>
            <div className="mt-10 grid gap-8 text-base leading-relaxed text-muted-foreground md:grid-cols-2">
              <p>
                TheZuriXperience is a curation house for nightlife and culture. Every event is a chapter — its own
                sound, palette, dress, and ritual. You don't attend; you enter.
              </p>
              <p>
                Membership is required because intimacy is. We keep our rooms small, our lineups secret until
                the door, and our nights unrepeatable. What happens stays in the room — except the playlist.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border/60 pt-10">
              <div>
                <div className="font-display text-4xl font-bold text-primary">01</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Chapters live</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-primary">12</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Resident artists</div>
              </div>
              <div>
                <div className="font-display text-4xl font-bold text-primary">∞</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Stories untold</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTIONS GRID */}
      <section className="relative border-b border-border/60 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">— Step inside</p>
              <h2 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Everything you need.<br />Behind one door.
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Members only access
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s) => (
              <a
                key={s.title}
                href={s.href}
                className="group relative flex min-h-[280px] flex-col justify-between bg-card p-8 transition-colors hover:bg-card/60"
              >
                <s.icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <div>
                  <h3 className="font-display text-3xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
                    Open
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* UPCOMING EVENT TEASER */}
      <section className="relative isolate overflow-hidden px-6 py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">— Now boarding</p>
            <h2 className="font-display mt-4 text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl">
              RnB Nights<br />
              <span className="italic text-primary/90">Vol. 01</span>
            </h2>
            <dl className="mt-10 grid grid-cols-2 gap-8 border-t border-border/60 pt-8">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Date</dt>
                <dd className="font-display mt-2 text-2xl font-bold">Sat, Dec 14</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Doors</dt>
                <dd className="font-display mt-2 text-2xl font-bold">9:00 PM</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Location</dt>
                <dd className="font-display mt-2 text-2xl font-bold">Disclosed at door</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dress</dt>
                <dd className="font-display mt-2 text-2xl font-bold">Wine & black</dd>
              </div>
            </dl>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90">
                <a href="/tickets">Get tickets</a>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full px-8 text-foreground hover:bg-foreground/5">
                <a href="/event">Full lineup →</a>
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/60">
            <img
              src={heroImg}
              alt="RnB Nights ambient stage"
              loading="lazy"
              className="h-full w-full object-cover grayscale-0 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-primary">Chapter</div>
                <div className="font-display mt-1 text-3xl font-bold">01 / RnB</div>
              </div>
              <div className="rounded-full border border-foreground/30 bg-background/40 px-4 py-2 text-xs uppercase tracking-[0.2em] backdrop-blur">
                Limited
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / GATE */}
      <section className="border-t border-border/60 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h2 className="font-display mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            The room is locked.<br />
            <span className="italic text-primary">You hold the key.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
            Create your account to unlock tickets, merch drops, playlists, brand partners, and direct access
            to the team. Free to join. Always discreet.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-primary px-10 text-primary-foreground hover:bg-primary/90">
              <a href="/signup">Create account</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-foreground/20 bg-transparent px-10 hover:bg-foreground/5">
              <a href="/login">Sign in</a>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-card/40 px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-display text-2xl font-bold">
              <span className="text-primary">Zuri</span>Xperience
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              An invite-only curation house for immersive nightlife and culture.
              Built in Nairobi. Felt everywhere.
            </p>
          </div>
          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Explore</div>
            <ul className="mt-4 space-y-2 text-sm">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-foreground/80 transition-colors hover:text-primary">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Stay close</div>
            <p className="mt-4 text-sm text-muted-foreground">
              hello@thezurixperience.com<br />
              Nairobi · Kenya
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-border/60 pt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span>© {new Date().getFullYear()} TheZuriXperience</span>
          <span>Vol. 01 — RnB</span>
        </div>
      </footer>
    </div>
  );
}
