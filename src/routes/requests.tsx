import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthGate } from "@/components/AuthGate";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import {
  byVotes,
  sendRequest,
  toggleVote,
  useSongRequests,
  withdrawRequest,
  type SongRequest,
} from "@/lib/song-requests";

export const Route = createFileRoute("/requests")({
  component: () => (
    <AuthGate>
      <RequestsPage />
    </AuthGate>
  ),
  head: () => ({ meta: [{ title: "Requests — TheZuriXperience" }] }),
});

function RequestsPage() {
  const { user } = useAuth();
  const { content, loading: contentLoading } = useSiteContent();
  const vol = content.event.vol;
  const { mode, requests, myVotes, error, refresh } = useSongRequests(vol, user?.id ?? null);

  const open = mode === "before" || mode === "live";
  const live = mode === "live";

  return (
    <div className="min-h-screen bg-black text-primary">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10 font-mono sm:px-5 sm:py-16">
        <h1 className="text-xl uppercase tracking-[0.2em] sm:text-2xl sm:tracking-[0.3em]">
          &gt; Requests<span className="animate-blink">_</span>
        </h1>

        {mode === null || contentLoading ? (
          <p className="mt-10 text-sm text-primary/60">loading...</p>
        ) : (
          <>
            <ModeBanner mode={mode} />
            {open && user && (
              <RequestForm
                vol={vol}
                live={live}
                defaultName={
                  (user.user_metadata as { display_name?: string } | undefined)?.display_name ||
                  (user.email ? user.email.split("@")[0] : "")
                }
                onSent={refresh}
              />
            )}
            {error && <p className="mt-6 text-sm text-primary/60">{error}</p>}
            <RequestList
              requests={requests}
              live={live}
              open={open}
              myVotes={myVotes}
              userId={user?.id ?? null}
              onChange={refresh}
            />
          </>
        )}
      </main>
    </div>
  );
}

function ModeBanner({ mode }: { mode: "closed" | "before" | "live" }) {
  if (mode === "live") {
    return (
      <section className="zx-live mt-8 border border-primary/60 bg-primary/10 px-4 py-4">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-primary">
          <span className="zx-live-dot" aria-hidden /> Live from the booth
        </p>
        <p className="mt-3 text-sm text-primary/80">
          Your request goes straight to the DJ. One every 5 minutes. Upvote what you want to hear next.
        </p>
      </section>
    );
  }
  if (mode === "before") {
    return (
      <section className="mt-8">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/60">[open]</p>
        <h2 className="mt-3 text-lg uppercase tracking-[0.2em] text-primary">The night is coming.</h2>
        <p className="mt-3 text-sm text-primary/70">
          Tell the DJ what you need to hear. Three requests each, then upvote the rest. The top of the list
          gets played.
        </p>
      </section>
    );
  }
  return (
    <section className="mt-8">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">[closed]</p>
      <p className="mt-3 text-sm text-primary/70">Requests open before the next chapter. Come back then.</p>
    </section>
  );
}

const inputClass =
  "w-full border border-primary/40 bg-black px-3 py-3 text-base text-primary placeholder:text-primary/30 focus:border-primary focus:outline-none sm:text-sm";

function RequestForm({
  vol,
  live,
  defaultName,
  onSent,
}: {
  vol: string;
  live: boolean;
  defaultName: string;
  onSent: () => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [shoutout, setShoutout] = useState("");
  const [name, setName] = useState(defaultName);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSending(true);
    setMessage(null);
    try {
      await sendRequest({ eventVol: vol, title, artist, shoutout, requesterName: name });
      setTitle("");
      setArtist("");
      setShoutout("");
      setMessage({ ok: true, text: live ? "Sent to the booth." : "Request in. Now get people to upvote it." });
      onSent();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Couldn't send that. Try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-3 border-t border-primary/30 pt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="song *"
          aria-label="Song"
          maxLength={120}
          required
          className={inputClass}
        />
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="artist"
          aria-label="Artist"
          maxLength={120}
          className={inputClass}
        />
      </div>
      <input
        value={shoutout}
        onChange={(e) => setShoutout(e.target.value)}
        placeholder={live ? "shout-out (optional) — for the birthday girl..." : "why this one? (optional)"}
        aria-label="Shout-out"
        maxLength={200}
        className={inputClass}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name on the request"
          aria-label="Your name on the request"
          maxLength={60}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={sending || !title.trim()}
          className="shrink-0 border border-primary bg-primary px-5 py-3 text-xs uppercase tracking-[0.25em] text-black hover:bg-primary-glow disabled:opacity-40"
        >
          {sending ? "sending..." : live ? "[ send to the booth → ]" : "[ request it → ]"}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${message.ok ? "text-primary" : "text-primary/70"}`} role="status">
          {message.ok ? "✓ " : "× "}
          {message.text}
        </p>
      )}
    </form>
  );
}

function RequestList({
  requests,
  live,
  open,
  myVotes,
  userId,
  onChange,
}: {
  requests: SongRequest[];
  live: boolean;
  open: boolean;
  myVotes: Set<string>;
  userId: string | null;
  onChange: () => void;
}) {
  const upNext = requests.filter((r) => r.status === "queued").sort(byVotes);
  const waiting = requests.filter((r) => r.status === "new").sort(byVotes);
  const played = requests
    .filter((r) => r.status === "played")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (upNext.length + waiting.length + played.length === 0) {
    return open ? (
      <p className="mt-10 text-sm text-primary/60">No requests yet. Be the first.</p>
    ) : null;
  }

  const row = (r: SongRequest, i?: number) => (
    <RequestRow
      key={r.id}
      request={r}
      rank={i}
      voted={myVotes.has(r.id)}
      canVote={open && r.status !== "played" && !!userId}
      mine={r.user_id === userId}
      onChange={onChange}
    />
  );

  return (
    <div className="mt-12 space-y-10">
      {live && upNext.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">[up next]</p>
          <ol className="mt-3">{upNext.map((r) => row(r))}</ol>
        </section>
      )}
      {(waiting.length > 0 || (!live && upNext.length > 0)) && (
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
            {live ? "[requested]" : "[the list]"} — most upvoted first
          </p>
          <ol className="mt-3">{(live ? waiting : [...upNext, ...waiting].sort(byVotes)).map((r, i) => row(r, i))}</ol>
        </section>
      )}
      {played.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">[played] ✓</p>
          <ol className="mt-3 opacity-60">{played.map((r) => row(r))}</ol>
        </section>
      )}
    </div>
  );
}

function RequestRow({
  request: r,
  rank,
  voted,
  canVote,
  mine,
  onChange,
}: {
  request: SongRequest;
  rank?: number;
  voted: boolean;
  canVote: boolean;
  mine: boolean;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const vote = async () => {
    if (!user) return;
    setBusy(true);
    setNote(null);
    try {
      await toggleVote(r.id, user.id, voted);
      onChange();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Couldn't vote.");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await withdrawRequest(r.id);
      onChange();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Couldn't withdraw it.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex gap-3 border-b border-primary/20 py-3 text-sm sm:gap-4">
      <span className="w-7 shrink-0 pt-0.5 text-primary/50">
        {r.status === "played" ? "✓" : rank !== undefined ? String(rank + 1).padStart(2, "0") : "▸"}
      </span>
      <div className="min-w-0 flex-1 break-words">
        <p className={r.status === "played" ? "text-primary/70 line-through decoration-primary/40" : "text-primary"}>
          {r.title}
          {r.artist && <span className="text-primary/60"> — {r.artist}</span>}
        </p>
        {r.shoutout && <p className="mt-1 text-xs italic text-primary/60">"{r.shoutout}"</p>}
        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-primary/40">
          {r.requester_name ? `from ${r.requester_name}` : "anonymous"}
          {r.status === "queued" && <span className="ml-2 text-primary">· queued</span>}
          {mine && r.status === "new" && (
            <button type="button" onClick={withdraw} disabled={busy} className="ml-3 underline hover:text-primary">
              withdraw
            </button>
          )}
        </p>
        {note && <p className="mt-1 text-xs text-primary/70">{note}</p>}
      </div>
      <button
        type="button"
        onClick={vote}
        disabled={!canVote || busy}
        aria-pressed={voted}
        aria-label={`${voted ? "Remove upvote from" : "Upvote"} ${r.title}`}
        className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center border text-xs transition-colors ${
          voted ? "border-primary bg-primary text-black" : "border-primary/40 text-primary hover:border-primary"
        } disabled:cursor-default disabled:opacity-50`}
      >
        <span aria-hidden>▲</span>
        <span className="tabular-nums">{r.votes}</span>
      </button>
    </li>
  );
}
