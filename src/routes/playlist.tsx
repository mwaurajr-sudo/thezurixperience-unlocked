import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/playlist")({
  component: () => (
    <AuthGate>
      <PlaylistPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Playlist — TheZuriXperience" }] }),
});

function PlaylistPage() {
  const { content } = useSiteContent();
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    const c = code.trim().toUpperCase();
    if (!/^ZURI\d{3,}$/.test(c)) {
      return toast.error("Code must look like ZURI001");
    }
    setChecking(true);
    const { data, error } = await supabase.rpc("verify_ticket_code", { _code: c });
    setChecking(false);
    if (error) return toast.error(error.message);
    if (data === true) {
      setUnlocked(true);
      toast.success("Code verified");
    } else {
      toast.error("Code not recognised");
    }
  };

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 font-mono">
        <h1 className="text-2xl uppercase tracking-[0.3em]">
          &gt; Playlist<span className="animate-blink">_</span>
        </h1>

        {!unlocked ? (
          <section className="mt-12 border border-primary/40 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
              [locked]
            </p>
            <p className="mt-3 text-sm text-primary/80">
              Enter the code from your ticket email to unlock the set.
            </p>
            <label className="mt-6 block">
              <span className="text-xs uppercase tracking-[0.3em] text-primary/60">
                Input code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder="ZURI001"
                className="mt-2 w-full border border-primary/40 bg-black px-3 py-3 text-lg tracking-[0.3em] text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none"
              />
            </label>
            <button
              onClick={verify}
              disabled={checking}
              className="mt-5 w-full border border-primary bg-primary px-4 py-3 text-xs uppercase tracking-[0.3em] text-black hover:bg-primary-glow disabled:opacity-60"
            >
              {checking ? "verifying..." : "Unlock"}
            </button>
          </section>
        ) : (
          <section className="mt-12">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
              [unlocked]
            </p>
            <h2 className="mt-3 text-xl uppercase tracking-[0.25em] text-primary">
              Welcome to the house.
            </h2>
            <p className="mt-4 text-sm text-primary/70">
              Vol. {content.event.vol} — {content.event.name}. Familiarise yourself.
            </p>

            {content.playlists.length === 0 ? (
              <p className="mt-10 text-sm text-primary/60">
                The DJ hasn't uploaded the set yet. Check back soon.
              </p>
            ) : (
              <ol className="mt-8 space-y-3">
                {content.playlists.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-4 border-b border-primary/20 pb-3 text-sm"
                  >
                    <span className="text-primary/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <p className="text-primary">{p.title || "Untitled"}</p>
                      {p.dj && (
                        <p className="text-xs text-primary/60">— {p.dj}</p>
                      )}
                      {p.desc && (
                        <p className="mt-1 text-xs text-primary/50">{p.desc}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
