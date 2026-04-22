import { toast } from "sonner";
import { useState } from "react";
import { useAdminContent } from "@/contexts/AdminContentContext";
import {
  PanelHeader,
  SectionCard,
  TextField,
  TextAreaField,
  SelectField,
  NumberField,
  TwoCol,
} from "@/components/admin/AdminFields";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Plus, Search, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { searchUsers, toggleAdminRole } from "@/server/admin-users";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

/* ─── MERCH ─── */
export function MerchPanel() {
  const { content, setContent, saveSection } = useAdminContent();
  const [open, setOpen] = useState<number | null>(null);

  const save = async () => {
    try { await saveSection("merch"); toast.success("Merch saved."); } catch { /* handled */ }
  };

  const updateItem = (i: number, patch: Partial<(typeof content.merch)[0]>) =>
    setContent((c) => {
      const merch = [...c.merch];
      merch[i] = { ...merch[i], ...patch };
      return { ...c, merch };
    });

  const deleteItem = (i: number) =>
    setContent((c) => ({ ...c, merch: c.merch.filter((_, idx) => idx !== i) }));

  const addItem = () =>
    setContent((c) => ({
      ...c,
      merch: [...c.merch, { name: "New item", price: "KES 0", note: "", units: 50, status: "coming" as const }],
    }));

  return (
    <div className="space-y-6">
      <PanelHeader title="Merch Drops" description="Manage limited-edition drops tied to each chapter." />
      <SectionCard title="Current drop items">
        <div className="space-y-3">
          {content.merch.map((item, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-card/80 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.price} · {item.status} · {item.units} units</div>
                </div>
                {open === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {open === i && (
                <div className="border-t border-border/60 px-5 pb-5 pt-4 space-y-4">
                  <TwoCol>
                    <TextField label="Name" value={item.name} onChange={(v) => updateItem(i, { name: v })} />
                    <TextField label="Price" value={item.price} onChange={(v) => updateItem(i, { price: v })} placeholder="KES 3,500" />
                  </TwoCol>
                  <TwoCol>
                    <NumberField label="Units" value={item.units} onChange={(v) => updateItem(i, { units: v })} />
                    <SelectField
                      label="Status"
                      value={item.status}
                      onChange={(v) => updateItem(i, { status: v as typeof item.status })}
                      options={[
                        { value: "live", label: "Live" },
                        { value: "coming", label: "Coming soon" },
                        { value: "sold", label: "Sold out" },
                      ]}
                    />
                  </TwoCol>
                  <TextField label="Description note" value={item.note} onChange={(v) => updateItem(i, { note: v })} />
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive rounded-full text-xs" onClick={() => deleteItem(i)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-2 rounded-full text-xs" onClick={addItem}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add item
        </Button>
      </SectionCard>
      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save changes
      </Button>
    </div>
  );
}

/* ─── PLAYLISTS ─── */
export function PlaylistsPanel() {
  const { content, setContent, saveSection } = useAdminContent();
  const [open, setOpen] = useState<number | null>(0);

  const save = async () => {
    try { await saveSection("playlists"); toast.success("Playlists saved."); } catch { /* handled */ }
  };

  const update = (i: number, patch: Partial<(typeof content.playlists)[0]>) =>
    setContent((c) => {
      const playlists = [...c.playlists];
      playlists[i] = { ...playlists[i], ...patch };
      return { ...c, playlists };
    });

  const addPlaylist = () =>
    setContent((c) => ({
      ...c,
      playlists: [...c.playlists, { title: "New playlist", dj: "", url: "", desc: "", visibility: "members" as const }],
    }));

  const deletePlaylist = (i: number) =>
    setContent((c) => ({ ...c, playlists: c.playlists.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-6">
      <PanelHeader title="Playlists" description="Manage DJ sets and curated mixes for each chapter." />
      <SectionCard title="Playlists">
        <div className="space-y-3">
          {content.playlists.map((pl, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-card/80 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div>
                  <div className="font-medium">{pl.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground">{pl.dj || "No DJ set"} · {pl.visibility}</div>
                </div>
                {open === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {open === i && (
                <div className="border-t border-border/60 px-5 pb-5 pt-4 space-y-4">
                  <TwoCol>
                    <TextField label="Playlist title" value={pl.title} onChange={(v) => update(i, { title: v })} />
                    <TextField label="DJ / curator" value={pl.dj} onChange={(v) => update(i, { dj: v })} />
                  </TwoCol>
                  <TextField label="Spotify / SoundCloud URL" value={pl.url} onChange={(v) => update(i, { url: v })} placeholder="https://open.spotify.com/..." />
                  <TextAreaField label="Description" value={pl.desc} onChange={(v) => update(i, { desc: v })} rows={2} />
                  <SelectField
                    label="Visibility"
                    value={pl.visibility}
                    onChange={(v) => update(i, { visibility: v as typeof pl.visibility })}
                    options={[
                      { value: "members", label: "Members only" },
                      { value: "public", label: "Public" },
                    ]}
                  />
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive rounded-full text-xs" onClick={() => deletePlaylist(i)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-2 rounded-full text-xs" onClick={addPlaylist}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add playlist
        </Button>
      </SectionCard>
      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save changes
      </Button>
    </div>
  );
}

/* ─── BRANDS ─── */
export function BrandsPanel() {
  const { content, setContent, saveSection } = useAdminContent();
  const [open, setOpen] = useState<number | null>(null);

  const save = async () => {
    try { await saveSection("brands"); toast.success("Brand partners saved."); } catch { /* handled */ }
  };

  const update = (i: number, patch: Partial<(typeof content.brands)[0]>) =>
    setContent((c) => {
      const brands = [...c.brands];
      brands[i] = { ...brands[i], ...patch };
      return { ...c, brands };
    });

  const deleteBrand = (i: number) =>
    setContent((c) => ({ ...c, brands: c.brands.filter((_, idx) => idx !== i) }));

  const addBrand = () =>
    setContent((c) => ({
      ...c,
      brands: [...c.brands, { name: "New partner", role: "", website: "" }],
    }));

  return (
    <div className="space-y-6">
      <PanelHeader title="Brand Partners" description="Manage the labels and collaborators shaping each Xperience." />
      <SectionCard title="Partners">
        <div className="space-y-3">
          {content.brands.map((b, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-card/80 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.role}</div>
                </div>
                {open === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {open === i && (
                <div className="border-t border-border/60 px-5 pb-5 pt-4 space-y-4">
                  <TwoCol>
                    <TextField label="Brand name" value={b.name} onChange={(v) => update(i, { name: v })} />
                    <TextField label="Role / category" value={b.role} onChange={(v) => update(i, { role: v })} placeholder="e.g. Bar curation" />
                  </TwoCol>
                  <TextField label="Website" value={b.website} onChange={(v) => update(i, { website: v })} placeholder="https://" />
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive rounded-full text-xs" onClick={() => deleteBrand(i)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-2 rounded-full text-xs" onClick={addBrand}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add partner
        </Button>
      </SectionCard>
      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save changes
      </Button>
    </div>
  );
}

/* ─── TEAM ─── */
export function TeamPanel() {
  const { content, setContent, saveSection } = useAdminContent();
  const [open, setOpen] = useState<number | null>(null);

  const save = async () => {
    try { await saveSection("team"); toast.success("Team saved."); } catch { /* handled */ }
  };

  const update = (i: number, patch: Partial<(typeof content.team)[0]>) =>
    setContent((c) => {
      const team = [...c.team];
      team[i] = { ...team[i], ...patch };
      return { ...c, team };
    });

  const deleteMember = (i: number) =>
    setContent((c) => ({ ...c, team: c.team.filter((_, idx) => idx !== i) }));

  const addMember = () =>
    setContent((c) => ({
      ...c,
      team: [...c.team, { name: "New member", role: "", email: "", phone: "", bio: "" }],
    }));

  return (
    <div className="space-y-6">
      <PanelHeader title="Team" description="Manage the curators and their public profiles." />
      <SectionCard title="Curators">
        <div className="space-y-3">
          {content.team.map((m, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-card/80 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
                {open === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {open === i && (
                <div className="border-t border-border/60 px-5 pb-5 pt-4 space-y-4">
                  <TwoCol>
                    <TextField label="Full name" value={m.name} onChange={(v) => update(i, { name: v })} />
                    <TextField label="Role" value={m.role} onChange={(v) => update(i, { role: v })} />
                  </TwoCol>
                  <TwoCol>
                    <TextField label="Email" value={m.email} onChange={(v) => update(i, { email: v })} type="email" />
                    <TextField label="Phone" value={m.phone} onChange={(v) => update(i, { phone: v })} />
                  </TwoCol>
                  <TextAreaField label="Bio (short)" value={m.bio} onChange={(v) => update(i, { bio: v })} rows={2} />
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive rounded-full text-xs" onClick={() => deleteMember(i)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-2 rounded-full text-xs" onClick={addMember}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add member
        </Button>
      </SectionCard>
      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save changes
      </Button>
    </div>
  );
}

/* ─── SITE SETTINGS ─── */
export function SiteSettingsPanel() {
  const { content, setContent, saveSection } = useAdminContent();
  const { site } = content;
  const set = (patch: Partial<typeof site>) => setContent((c) => ({ ...c, site: { ...c.site, ...patch } }));

  const save = async () => {
    try { await saveSection("site"); toast.success("Site settings saved."); } catch { /* handled */ }
  };

  return (
    <div className="space-y-6">
      <PanelHeader title="Site Settings" description="Global configuration for the public-facing site." />
      <SectionCard title="Site identity">
        <TwoCol>
          <TextField label="Site name" value={site.name} onChange={(v) => set({ name: v })} />
          <TextField label="Tagline" value={site.tagline} onChange={(v) => set({ tagline: v })} />
        </TwoCol>
        <TwoCol>
          <TextField label="Location" value={site.location} onChange={(v) => set({ location: v })} />
          <TextField label="Contact email" value={site.email} onChange={(v) => set({ email: v })} />
        </TwoCol>
        <TextField label="Instagram handle" value={site.instagram} onChange={(v) => set({ instagram: v })} placeholder="@thezurixperience" />
      </SectionCard>
      <SectionCard title="Membership">
        <TwoCol>
          <SelectField
            label="Membership mode"
            value={site.membershipMode}
            onChange={(v) => set({ membershipMode: v as typeof site.membershipMode })}
            options={[
              { value: "open", label: "Open registration" },
              { value: "invite", label: "Invite only" },
              { value: "closed", label: "Closed" },
            ]}
          />
          <TextField label="Member label" value={site.memberLabel} onChange={(v) => set({ memberLabel: v })} />
        </TwoCol>
      </SectionCard>
      <SectionCard title="SEO & meta">
        <TextField label="Meta title" value={site.metaTitle} onChange={(v) => set({ metaTitle: v })} />
        <TextAreaField label="Meta description" value={site.metaDesc} onChange={(v) => set({ metaDesc: v })} rows={3} />
      </SectionCard>
      <Button className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90" onClick={save}>
        Save changes
      </Button>
    </div>
  );
}

/* ─── ACCESS CONTROL ─── */
export function AccessPanel() {
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!newPw || newPw.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    }
  };

  return (
    <div className="space-y-6">
      <PanelHeader title="Access Control" description="Manage superuser credentials and session." />
      <SectionCard title="Superuser account">
        <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">
          <span className="text-muted-foreground">Logged in as </span>
          <span className="font-medium">{user?.email}</span>
        </div>
      </SectionCard>
      <SectionCard title="Change password">
        <TextField
          label="New password"
          value={newPw}
          onChange={setNewPw}
          type="password"
          hint="Minimum 8 characters."
        />
        <TextField
          label="Confirm new password"
          value={confirmPw}
          onChange={setConfirmPw}
          type="password"
        />
        <Button
          className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Updating…" : "Update password"}
        </Button>
      </SectionCard>
    </div>
  );
}
