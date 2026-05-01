import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: () => (
    <AuthGate>
      <AccountPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Account — TheZuriXperience" }] }),
});

const schema = z.object({
  display_name: z.string().trim().min(2, "Name too short").max(60),
  bio: z.string().trim().max(280).optional(),
  avatar_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
});

function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data, error }) => {
      if (error) toast.error(error.message);
      if (data) {
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url ?? "");
      }
      setLoading(false);
    });
  }, [user]);

  const onSave = async () => {
    if (!user) return;
    const result = schema.safeParse({ display_name: displayName, bio, avatar_url: avatarUrl });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: result.data.display_name,
        bio: result.data.bio || null,
        avatar_url: result.data.avatar_url || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] spotlight opacity-50" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-32 pt-32 sm:px-8 sm:pt-40">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">— Your profile</p>
        <h1 className="font-display mt-6 text-5xl font-light leading-[0.95] tracking-tight sm:text-6xl">
          Hello, <em className="italic text-primary-glow">{displayName || "member"}</em>
        </h1>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{user?.email}</p>

        {loading ? (
          <div className="mt-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary-glow" /></div>
        ) : (
          <div className="mt-12 space-y-6 border border-border/60 bg-card/40 p-8 backdrop-blur sm:p-10">
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} className="mt-2 rounded-none" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Avatar URL</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className="mt-2 rounded-none" />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} className="mt-2 rounded-none" />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={onSave} disabled={saving} className="rounded-none bg-primary text-primary-foreground hover:bg-primary-glow">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
              <Button onClick={onSignOut} variant="outline" className="rounded-none border-foreground/20 bg-transparent">
                Sign out
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
