import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User as UserIcon, X, ShieldCheck } from "lucide-react";

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
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .rpc("has_role", { _role: "admin", _user_id: user.id })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-background/70 to-transparent backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          className="font-display text-xl font-light italic tracking-tight sm:text-2xl"
          onClick={() => setOpen(false)}
        >
          <span className="text-primary-glow">Zuri</span>
          <span className="text-foreground">Xperience</span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary-glow" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="rounded-none font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow hover:bg-primary/10 hover:text-primary-glow">
                  <Link to="/admin">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="rounded-none font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-foreground/5">
                <Link to="/account">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Account</span>
                </Link>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="hidden rounded-none font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-foreground/5 lg:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground transition-colors hover:text-foreground lg:inline-block"
              >
                Sign in
              </Link>
              <Button
                asChild
                size="sm"
                className="rounded-none border border-primary/40 bg-primary/10 px-5 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground hover:bg-primary/20"
              >
                <Link to="/signup">Request access</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background/97 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-[1400px] flex-col px-5 py-4 sm:px-8">
            {navLinks.map((l, i) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 border-b border-border/30 py-4 font-display text-2xl italic text-foreground transition-colors last:border-b-0 hover:text-primary-glow"
                activeProps={{ className: "text-primary-glow" }}
              >
                <span className="font-mono text-[10px] not-italic tracking-[0.3em] text-muted-foreground">
                  0{i + 1}
                </span>
                {l.label}
              </Link>
            ))}
            {!user ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-4 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
              >
                Already a member? Sign in
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                className="mt-4 flex items-center gap-2 py-3 text-left font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
