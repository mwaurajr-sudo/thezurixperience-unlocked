import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/zuri-logo.jpeg";

const links = [
  { label: "About", to: "/about" as const },
  { label: "Event", to: "/event" as const },
  { label: "Tickets", to: "/tickets" as const },
  { label: "Settings", to: "/settings" as const },
];

export function SiteHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-primary/30 bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/about" className="flex items-center gap-2">
          <img src={logo} alt="ZX" className="h-8 w-8" />
          <span className="font-mono text-sm uppercase tracking-[0.25em] text-primary">
            TheZuriXperience
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="font-mono text-xs uppercase tracking-[0.3em] text-primary/70 hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={onSignOut}
            className="font-mono text-xs uppercase tracking-[0.3em] text-primary/50 hover:text-primary"
          >
            [out]
          </button>
        </nav>
      </div>
    </header>
  );
}
