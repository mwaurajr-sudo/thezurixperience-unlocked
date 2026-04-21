import { useState } from "react";
import { toast } from "sonner";
import { useAdminContent, type TicketTier } from "@/contexts/AdminContentContext";
import {
  PanelHeader,
  SectionCard,
  TextField,
  NumberField,
  TwoCol,
} from "@/components/admin/AdminFields";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

function TierCard({
  tier,
  index,
  onChange,
  onDelete,
}: {
  tier: TicketTier;
  index: number;
  onChange: (t: TicketTier) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const left = tier.cap - tier.sold;
  const pct = tier.cap > 0 ? Math.round((tier.sold / tier.cap) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-card/80 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
          <div>
            <div className="font-medium">{tier.name}</div>
            <div className="text-xs text-muted-foreground">
              KES {tier.price.toLocaleString()} · {left} of {tier.cap} left ({pct}% sold)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-5 pb-5 pt-4 space-y-4">
          <TwoCol>
            <TextField
              label="Tier name"
              value={tier.name}
              onChange={(v) => onChange({ ...tier, name: v })}
            />
            <NumberField
              label="Price (KES)"
              value={tier.price}
              onChange={(v) => onChange({ ...tier, price: v })}
            />
          </TwoCol>
          <TwoCol>
            <NumberField
              label="Total capacity"
              value={tier.cap}
              onChange={(v) => onChange({ ...tier, cap: v })}
            />
            <NumberField
              label="Tickets sold"
              value={tier.sold}
              onChange={(v) => onChange({ ...tier, sold: v })}
            />
          </TwoCol>
          <TextField
            label="Perks (comma-separated)"
            value={tier.perks}
            onChange={(v) => onChange({ ...tier, perks: v })}
            hint="e.g. Priority entry, Two welcome drinks"
          />
          <div className="mt-2 h-1.5 rounded-full bg-border/60">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive rounded-full text-xs"
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove tier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TicketsPanel() {
  const { content, setContent } = useAdminContent();

  const updateTier = (i: number, t: TicketTier) =>
    setContent((c) => {
      const tickets = [...c.tickets];
      tickets[i] = t;
      return { ...c, tickets };
    });

  const deleteTier = (i: number) =>
    setContent((c) => ({ ...c, tickets: c.tickets.filter((_, idx) => idx !== i) }));

  const addTier = () =>
    setContent((c) => ({
      ...c,
      tickets: [...c.tickets, { name: "New tier", price: 0, cap: 50, sold: 0, perks: "" }],
    }));

  const save = () => toast.success("Ticket tiers saved.");

  return (
    <div className="space-y-6">
      <PanelHeader title="Tickets & Pricing" description="Manage ticket tiers, pricing, capacity and perks." />

      <SectionCard title="Ticket tiers">
        <div className="space-y-3">
          {content.tickets.map((t, i) => (
            <TierCard
              key={i}
              tier={t}
              index={i}
              onChange={(updated) => updateTier(i, updated)}
              onDelete={() => deleteTier(i)}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 rounded-full text-xs"
          onClick={addTier}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add tier
        </Button>
      </SectionCard>

      <SectionCard title="Page copy">
        <TextField
          label="Tagline"
          value={content.ticketTagline}
          onChange={(v) => setContent((c) => ({ ...c, ticketTagline: v }))}
        />
        <TextField
          label="Sold out message"
          value={content.ticketSoldOut}
          onChange={(v) => setContent((c) => ({ ...c, ticketSoldOut: v }))}
        />
      </SectionCard>

      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save changes
      </Button>
    </div>
  );
}
