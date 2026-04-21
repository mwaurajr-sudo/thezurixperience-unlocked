import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

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

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
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
                className="rounded-full text-xs uppercase tracking-[0.2em]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground sm:inline-block"
              >
                Sign in
              </Link>
              <Button asChild size="sm" className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                <Link to="/signup">Join</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
