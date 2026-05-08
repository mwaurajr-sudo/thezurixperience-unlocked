import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteContent } from "@/hooks/useSiteContent";

export const Route = createFileRoute("/recordings")({
  component: () => (
    <AuthGate>
      <RecordingsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Recordings — TheZuriXperience" }] }),
});

function RecordingsPage() {
  const { content, loading } = useSiteContent();
  const recs = content.recordings ?? [];

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 font-mono">
        <h1 className="text-2xl uppercase tracking-[0.3em]">
          &gt; Recordings<span className="animate-blink">_</span>
        </h1>
        <p className="mt-4 text-sm text-primary/70">
          DJ sets from past chapters.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-primary/60">loading...</p>
        ) : recs.length === 0 ? (
          <p className="mt-10 text-sm text-primary/60">
            No recordings posted yet.
          </p>
        ) : (
          <ul className="mt-10 space-y-6">
            {recs.map((r, i) => (
              <li key={i} className="border-b border-primary/20 pb-5">
                <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
                  Vol. {r.vol}
                </p>
                {r.title && (
                  <p className="mt-2 text-lg uppercase tracking-[0.2em] text-primary">
                    {r.title}
                  </p>
                )}
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-primary underline decoration-primary/40 hover:decoration-primary"
                  >
                    → Listen to the set
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-primary/50">Link coming soon.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
