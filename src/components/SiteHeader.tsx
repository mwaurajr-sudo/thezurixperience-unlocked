import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User as UserIcon, X } from "lucide-react";

const navLinks = [
  { label: "Event", to: "/event" as const },
  { label: "Tickets", to: "/tickets" as const },
  { label: "Merch", to: "/merch" as const },
  { label: "Playlists", to: "/playlists" as const },
  { label: "Brands", to: "/brands" as const },
  { label: "Team", to: "/team" as const },
];

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="font-display text-base font-bold tracking-tight sm:text-lg" onClick={() => setOpen(false)}>
          <span className="text-primary">Zuri</span>Xperience
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-xs uppercase tracking-[0.2em]">
                <Link to="/account">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </Link>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="hidden rounded-full text-xs uppercase tracking-[0.2em] md:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground md:inline-block"
              >
                Sign in
              </Link>
              <Button
                asChild
                size="sm"
                className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90 sm:px-5"
              >
                <Link to="/signup">Join</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/30 py-3 text-sm uppercase tracking-[0.2em] text-muted-foreground transition-colors last:border-b-0 hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
            {!user ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-3 py-3 text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                className="mt-3 flex items-center gap-2 py-3 text-left text-sm uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
