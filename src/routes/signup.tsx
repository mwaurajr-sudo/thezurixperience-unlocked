import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Join — TheZuriXperience" }] }),
});

const schema = z.object({
  displayName: z.string().trim().min(2, "Name too short").max(60),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ displayName, email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { display_name: result.data.displayName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Welcome to the room.");
    navigate({ to: "/account" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/account`,
    });
    if (result.error) toast.error(result.error.message);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-24 sm:px-8">
      <div className="absolute inset-0 -z-10 spotlight opacity-60" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="w-full max-w-md">
        <Link to="/" className="font-display block text-center text-3xl font-light italic tracking-tight">
          <span className="text-primary-glow">Zuri</span>Xperience
        </Link>
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          — Request access
        </p>

        <div className="mt-12 border border-border/60 bg-card/60 p-8 backdrop-blur sm:p-10">
          <h1 className="font-display text-4xl font-light italic">Become a member</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free. Discreet. Yours.</p>

          <Button onClick={onGoogle} variant="outline" className="mt-8 w-full rounded-none border-foreground/20 bg-transparent hover:bg-foreground/5">
            <GoogleIcon /> Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> Or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Display name</Label>
              <Input id="name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2 rounded-none" maxLength={60} />
            </div>
            <div>
              <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 rounded-none" />
            </div>
            <div>
              <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 rounded-none" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary-glow">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="text-primary-glow hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 11v3.2h5.2c-.2 1.4-1.6 4.1-5.2 4.1-3.1 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.5 4.3 14.5 3.5 12 3.5 6.9 3.5 2.7 7.7 2.7 12.5S6.9 21.5 12 21.5c6.9 0 9.4-4.8 9.4-7.3 0-.5-.1-.9-.1-1.2H12z" />
    </svg>
  );
}
