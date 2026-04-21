import { toast } from "sonner";
import { useAdminContent } from "@/contexts/AdminContentContext";
import {
  PanelHeader,
  SectionCard,
  TextField,
  TextAreaField,
  SelectField,
  TwoCol,
  ThreeCol,
} from "@/components/admin/AdminFields";
import { Button } from "@/components/ui/button";

export function EventPanel() {
  const { content, setContent } = useAdminContent();
  const { event } = content;

  const set = (patch: Partial<typeof event>) =>
    setContent((c) => ({ ...c, event: { ...c.event, ...patch } }));

  const save = () => toast.success("Event details saved.");

  return (
    <div className="space-y-6">
      <PanelHeader title="Event Details" description="Update the current chapter — name, date, location, dress code, and lineup." />

      <SectionCard title="Chapter info">
        <TwoCol>
          <TextField label="Chapter number" value={event.vol} onChange={(v) => set({ vol: v })} />
          <TextField label="Event name" value={event.name} onChange={(v) => set({ name: v })} />
        </TwoCol>
        <TextField label="Theme / subtitle" value={event.theme} onChange={(v) => set({ theme: v })} />
        <TextField
          label="Marquee tags (comma-separated)"
          value={event.tags}
          onChange={(v) => set({ tags: v })}
          hint="These scroll across the hero banner."
        />
      </SectionCard>

      <SectionCard title="Date & location">
        <TwoCol>
          <TextField label="Date" value={event.date} onChange={(v) => set({ date: v })} placeholder="Saturday, December 14" />
          <TextField label="Doors open" value={event.doors} onChange={(v) => set({ doors: v })} placeholder="9:00 PM — 4:00 AM" />
        </TwoCol>
        <TextField
          label="Venue address"
          value={event.venue}
          onChange={(v) => set({ venue: v })}
          placeholder="Leave blank to keep hidden"
        />
        <SelectField
          label="Location reveal mode"
          value={event.locMode}
          onChange={(v) => set({ locMode: v as typeof event.locMode })}
          options={[
            { value: "secret", label: "Disclosed at door" },
            { value: "partial", label: "City only (Nairobi)" },
            { value: "full", label: "Full address shown" },
          ]}
        />
      </SectionCard>

      <SectionCard title="Dress code">
        <TwoCol>
          <TextField label="Dress theme" value={event.dress} onChange={(v) => set({ dress: v })} placeholder="Wine & black" />
          <TextField label="Short label" value={event.dresslbl} onChange={(v) => set({ dresslbl: v })} placeholder="Dress to Burn" />
        </TwoCol>
      </SectionCard>

      <SectionCard title="Lineup">
        <ThreeCol>
          <TextField label="Artist / DJ 1" value={event.dj1} onChange={(v) => set({ dj1: v })} placeholder="Name" />
          <TextField label="Artist / DJ 2" value={event.dj2} onChange={(v) => set({ dj2: v })} placeholder="Name" />
          <TextField label="Artist / DJ 3" value={event.dj3} onChange={(v) => set({ dj3: v })} placeholder="Name" />
        </ThreeCol>
        <SelectField
          label="Lineup reveal"
          value={event.lineupMode}
          onChange={(v) => set({ lineupMode: v as typeof event.lineupMode })}
          options={[
            { value: "secret", label: "Secret until door" },
            { value: "partial", label: "Tease first artist" },
            { value: "full", label: "Full lineup shown" },
          ]}
        />
      </SectionCard>

      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save event
      </Button>
    </div>
  );
}
