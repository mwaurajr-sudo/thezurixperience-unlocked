import { useAdminContent } from "@/contexts/AdminContentContext";
import { PanelHeader } from "@/components/admin/AdminFields";
import type { AdminPanel } from "@/components/AdminLayout";
import { CalendarDays, Ticket, ShoppingBag, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onNavigate: (panel: AdminPanel) => void;
}

export function DashboardPanel({ onNavigate }: Props) {
  const { content } = useAdminContent();
  const { event, tickets } = content;

  const totalCap = tickets.reduce((s, t) => s + t.cap, 0);
  const totalSold = tickets.reduce((s, t) => s + t.sold, 0);
  const totalLeft = totalCap - totalSold;
  const fillPct = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;

  const stats = [
    { label: "Tickets remaining", value: totalLeft, sub: `${fillPct}% capacity filled`, icon: Ticket, panel: "tickets" as AdminPanel },
    { label: "Merch items", value: content.merch.length, sub: `${content.merch.filter((m) => m.status === "live").length} live`, icon: ShoppingBag, panel: "merch" as AdminPanel },
    { label: "Team members", value: content.team.length, sub: "Curators listed", icon: Users, panel: "team" as AdminPanel },
    { label: "Brand partners", value: content.brands.length, sub: "Active collaborators", icon: CalendarDays, panel: "brands" as AdminPanel },
  ];

  return (
    <div>
      <PanelHeader title="Dashboard" description={`Superuser overview — ${event.name} Vol. ${event.vol}`} />

      {/* Event summary */}
      <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary">Active chapter</p>
            <h2 className="font-display mt-2 text-3xl font-bold">
              {event.name} <span className="text-primary/70">Vol. {event.vol}</span>
            </h2>
            <div className="mt-3 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span><span className="text-foreground font-medium">Date:</span> {event.date}</span>
              <span><span className="text-foreground font-medium">Doors:</span> {event.doors}</span>
              <span><span className="text-foreground font-medium">Dress:</span> {event.dress}</span>
              <span>
                <span className="text-foreground font-medium">Location:</span>{" "}
                {event.locMode === "full" && event.venue ? event.venue : event.locMode === "partial" ? "Nairobi" : "Disclosed at door"}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onNavigate("event")}
          >
            Edit event <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.panel)}
            className="group rounded-xl border border-border/60 bg-card/50 p-5 text-left transition-colors hover:border-primary/40 hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 text-primary" />
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="font-display mt-4 text-4xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm font-medium text-foreground">{s.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Ticket breakdown */}
      <div className="mt-8 rounded-xl border border-border/60 bg-card/50 p-6">
        <div className="mb-5 text-[11px] uppercase tracking-[0.2em] text-primary">Ticket tiers</div>
        <div className="space-y-4">
          {tickets.map((t) => {
            const pct = t.cap > 0 ? (t.sold / t.cap) * 100 : 0;
            return (
              <div key={t.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground">
                    {t.cap - t.sold} left of {t.cap}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-border/60">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 rounded-full text-xs"
          onClick={() => onNavigate("tickets")}
        >
          Manage tickets <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
