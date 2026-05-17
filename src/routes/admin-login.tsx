import { useState, useEffect, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
  head: () => ({ meta: [{ title: "Admin login — TheZuriXperience" }] }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already signed in, check role and route accordingly
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    supabase
      .rpc("has_role", { _role: "admin", _user_id: user.id })
      .then(({ data }) => {
        if (cancelled) return;
        if (data) navigate({ to: "/admin" });
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const uid = authData.user?.id;
      if (!uid) throw new Error("Sign-in failed");
      const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
        _role: "admin",
        _user_id: uid,
      });
      if (roleErr) throw roleErr;
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("This account does not have admin access.");
        return;
      }
      toast.success("Welcome back, curator.");
      navigate({ to: "/admin" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-block text-xs uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to site
        </Link>

        <div className="rounded-2xl border border-border/60 bg-card/70 p-8 shadow-2xl backdrop-blur-sm md:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
              Superuser access
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              Admin <span className="italic text-primary">log in</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage events, tickets, playlists, and the database side of the
              house.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="curator@thezurixperience.com"
                className="h-11 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-background/50"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-full bg-primary text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying
                </>
              ) : (
                "Enter admin"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Restricted area · all access is logged
          </p>
        </div>
      </div>
    </div>
  );
}
