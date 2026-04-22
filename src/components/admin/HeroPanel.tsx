import { toast } from "sonner";
import { useAdminContent } from "@/contexts/AdminContentContext";
import { PanelHeader, SectionCard, TextField, TextAreaField, TwoCol } from "@/components/admin/AdminFields";
import { Button } from "@/components/ui/button";

export function HeroPanel() {
  const { content, setContent, saveSection } = useAdminContent();
  const { hero, manifesto } = content;

  const save = async () => {
    try {
      await saveSection(["hero", "manifesto"]);
      toast.success("Hero & Manifesto saved.");
    } catch { /* error toast handled in context */ }
  };

  return (
    <div className="space-y-6">
      <PanelHeader title="Hero & Manifesto" description="Edit the homepage hero copy and brand manifesto text." />

      <SectionCard title="Hero section">
        <TextField
          label="Chapter label"
          value={hero.chapterLabel}
          onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, chapterLabel: v } }))}
        />
        <TextField
          label="Headline"
          value={hero.headline}
          onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, headline: v } }))}
        />
        <TextAreaField
          label="Subtext"
          value={hero.subtext}
          onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, subtext: v } }))}
          rows={3}
        />
        <TwoCol>
          <TextField
            label="CTA button 1"
            value={hero.cta1}
            onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, cta1: v } }))}
          />
          <TextField
            label="CTA button 2"
            value={hero.cta2}
            onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, cta2: v } }))}
          />
        </TwoCol>
      </SectionCard>

      <SectionCard title="Manifesto">
        <TextField
          label="Headline"
          value={manifesto.headline}
          onChange={(v) => setContent((c) => ({ ...c, manifesto: { ...c.manifesto, headline: v } }))}
        />
        <TextAreaField
          label="Body copy"
          value={manifesto.body}
          onChange={(v) => setContent((c) => ({ ...c, manifesto: { ...c.manifesto, body: v } }))}
          rows={5}
        />
        <TwoCol>
          <TextField
            label="Chapters live"
            value={manifesto.chaptersLive}
            onChange={(v) => setContent((c) => ({ ...c, manifesto: { ...c.manifesto, chaptersLive: v } }))}
          />
          <TextField
            label="Resident artists"
            value={manifesto.residentArtists}
            onChange={(v) => setContent((c) => ({ ...c, manifesto: { ...c.manifesto, residentArtists: v } }))}
          />
        </TwoCol>
      </SectionCard>

      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save changes
      </Button>
    </div>
  );
}
