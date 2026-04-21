import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  Ticket,
  ShoppingBag,
  Disc3,
  Building2,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type AdminPanel =
  | "dashboard"
  | "hero"
  | "event"
  | "tickets"
  | "merch"
  | "playlists"
  | "brands"
  | "team"
  | "settings"
  | "access";

const navItems: Array<{ id: AdminPanel; label: string; icon: React.ElementType; section: string }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Overview" },
  { id: "hero", label: "Hero & Manifesto", icon: Sparkles, section: "Content" },
  { id: "event", label: "Event Details", icon: CalendarDays, section: "Content" },
  { id: "tickets", label: "Tickets & Pricing", icon: Ticket, section: "Content" },
  { id: "merch", label: "Merch Drops", icon: ShoppingBag, section: "Content" },
  { id: "playlists", label: "Playlists", icon: Disc3, section: "Content" },
  { id: "brands", label: "Brand Partners", icon: Building2, section: "Content" },
  { id: "team", label: "Team", icon: Users, section: "Content" },
  { id: "settings", label: "Site Settings", icon: Settings, section: "Config" },
  { id: "access", label: "Access Control", icon: ShieldCheck, section: "Config" },
];

interface AdminLayoutProps {
  activePanel: AdminPanel;
  onNavigate: (panel: AdminPanel) => void;
  children: ReactNode;
}

export function AdminLayout({ activePanel, onNavigate, children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const sections = [...new Set(navItems.map((i) => i.section))];

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={cn(
        "flex h-full flex-col bg-[#120c10] text-foreground",
        mobile ? "w-full" : "w-60 shrink-0"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <ShieldCheck className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display text-sm font-bold">
            <span className="text-primary">Zuri</span>Xperience
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Superuser</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section) => (
          <div key={section} className="mb-4">
            <div className="px-5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/30">{section}</div>
            {navItems
              .filter((i) => i.section === section)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 border-l-2 px-5 py-2.5 text-left text-sm transition-all",
                    activePanel === item.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-transparent text-white/50 hover:bg-white/5 hover:text-white/80"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-1 text-xs text-white/40 truncate">{user?.email}</div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.1em] text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Site</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="capitalize text-foreground">
                {navItems.find((i) => i.id === activePanel)?.label}
              </span>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
            <Link to="/" target="_blank">View site ↗</Link>
          </Button>
        </header>

        {/* Panel content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
