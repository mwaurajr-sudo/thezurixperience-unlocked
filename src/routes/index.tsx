import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/zuri-logo.jpeg";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({ meta: [{ title: "TheZuriXperience" }] }),
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(2, "Name too short").max(60),
});

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"none" | "in" | "up">("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/about" });
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "in") {
      const r = signInSchema.safeParse({ email, password });
      if (!r.success) { toast.error(r.error.issues[0].message); setLoading(false); return; }
      const { error } = await supabase.auth.signInWithPassword(r.data);
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back");
      navigate({ to: "/about" });
    } else {
      const r = signUpSchema.safeParse({ email, password, displayName });
      if (!r.success) { toast.error(r.error.issues[0].message); setLoading(false); return; }
      const { error } = await supabase.auth.signUp({
        email: r.data.email,
        password: r.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/about`,
          data: { display_name: r.data.displayName },
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created");
      navigate({ to: "/about" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-10">
      <img
        src={logo}
        alt="TheZuriXperience"
        className="w-[280px] max-w-[80vw] select-none sm:w-[360px]"
        draggable={false}
      />

      {mode === "none" && (
        <div className="mt-10 flex flex-col items-center gap-4 animate-fade-in">
          <button
            onClick={() => setMode("in")}
            className="font-mono text-base uppercase tracking-[0.3em] text-primary hover:text-primary-glow"
          >
            [ Sign in ]
          </button>
          <button
            onClick={() => setMode("up")}
            className="font-mono text-base uppercase tracking-[0.3em] text-primary hover:text-primary-glow"
          >
            [ Sign up ]
          </button>
        </div>
      )}

      {mode !== "none" && (
        <form onSubmit={submit} className="mt-10 flex w-full max-w-xs flex-col gap-3 animate-fade-in">
          {mode === "up" && (
            <input
              type="text"
              placeholder="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
              required
              className="border border-primary/40 bg-black px-3 py-2 font-mono text-base text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none"
            />
          )}
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-primary/40 bg-black px-3 py-2 font-mono text-base text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-primary/40 bg-black px-3 py-2 font-mono text-base text-primary placeholder:text-primary/40 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="border border-primary bg-black px-3 py-2 font-mono text-base uppercase tracking-[0.3em] text-primary hover:bg-primary hover:text-black disabled:opacity-50"
          >
            {loading ? "..." : mode === "in" ? "Sign in" : "Sign up"}
          </button>
          <div className="flex justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
              className="font-mono uppercase tracking-[0.2em] text-primary/70 hover:text-primary"
            >
              {mode === "in" ? "Need an account?" : "Have an account?"}
            </button>
            <button
              type="button"
              onClick={() => setMode("none")}
              className="font-mono uppercase tracking-[0.2em] text-primary/70 hover:text-primary"
            >
              ← back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function _unused() { return <Link to="/" />; }
