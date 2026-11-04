import { Link, useNavigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/zuri-logo.jpeg";

const links = [
  { label: "About", to: "/about" as const },
  { label: "Event", to: "/event" as const },
  { label: "RSVP", to: "/rsvp" as const },
  { label: "Playlist", to: "/playlist" as const },
  { label: "Recordings", to: "/recordings" as const },
  { label: "Settings", to: "/settings" as const },
];

export function SiteHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="z-50 border-b border-primary/30 bg-black md:sticky md:top-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <Link to="/about" className="flex min-w-0 items-center gap-2">
          <img src={logo} alt="ZX" className="h-8 w-8 shrink-0" />
          <span className="font-mono text-sm uppercase tracking-[0.15em] text-primary sm:tracking-[0.25em]">
            TheZuriXperience
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          className="shrink-0 border border-primary/40 px-2 py-2 font-mono text-xs uppercase tracking-[0.1em] text-primary hover:border-primary min-[360px]:px-3 min-[360px]:tracking-[0.2em]"
        >
          {menuOpen ? "[close]" : "[menu]"}
        </button>
        {menuOpen && (
          <nav
            id={menuId}
            className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 border-t border-primary/20 pt-4 sm:gap-x-5"
          >
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="font-mono text-xs uppercase tracking-[0.15em] text-primary/70 hover:text-primary sm:tracking-[0.3em]"
                activeProps={{ className: "text-primary" }}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={onSignOut}
              className="font-mono text-xs uppercase tracking-[0.15em] text-primary/50 hover:text-primary sm:tracking-[0.3em]"
            >
              [out]
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
