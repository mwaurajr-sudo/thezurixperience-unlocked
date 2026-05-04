import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/settings")({
  component: () => (
    <AuthGate>
      <SettingsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Settings — TheZuriXperience" }] }),
});

const schema = z.object({
  display_name: z.string().trim().min(2, "Name too short").max(60),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).single().then(({ data }) => {
      if (data) setDisplayName(data.display_name ?? "");
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const r = schema.safeParse({ display_name: displayName });
    if (!r.success) return toast.error(r.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: r.data.display_name }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-mono text-2xl uppercase tracking-[0.3em]">
          &gt; Settings<span className="animate-blink">_</span>
        </h1>

        {loading ? (
          <p className="mt-10 font-mono text-sm text-primary/60">loading...</p>
        ) : (
          <div className="mt-10 space-y-6 font-mono text-base">
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-primary/60">Email</label>
              <p className="mt-2 border border-primary/30 bg-black px-3 py-2 text-primary/80">{user?.email}</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-primary/60">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                className="mt-2 w-full border border-primary/40 bg-black px-3 py-2 text-primary focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="border border-primary bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary hover:bg-primary hover:text-black disabled:opacity-50"
              >
                {saving ? "..." : "Save"}
              </button>
              <button
                onClick={onSignOut}
                className="border border-primary/40 bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-primary/70 hover:border-primary hover:text-primary"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
