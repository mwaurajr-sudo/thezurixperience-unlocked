import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ListPlus, Maximize2, SkipForward, Trash2, Undo2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import { PanelHeader, SectionCard } from "@/components/admin/AdminFields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MODE_LABELS,
  byVotes,
  requestsDb,
  saveMode,
  setStatus,
  useSongRequests,
  type RequestMode,
  type RequestStatus,
  type SongRequest,
} from "@/lib/song-requests";

const MODES: { id: RequestMode; hint: string }[] = [
  { id: "closed", hint: "Nobody can request or upvote." },
  { id: "before", hint: "3 requests per guest, plus upvotes. Use it in the run-up to the night." },
  { id: "live", hint: "Requests go to the booth, 1 every 5 minutes per guest. Phones refresh every few seconds." },
];

const FILTERS: { id: RequestStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "queued", label: "Queued" },
  { id: "played", label: "Played" },
  { id: "skipped", label: "Skipped" },
];

export function SongRequestsPanel() {
  const { user } = useAuth();
  const { content } = useSiteContent();
  const vol = content.event.vol;
  const { mode, requests, refresh, setMode } = useSongRequests(vol, user?.id ?? null);
  const [savingMode, setSavingMode] = useState<RequestMode | null>(null);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [booth, setBooth] = useState(false);

  const changeMode = async (next: RequestMode) => {
    setSavingMode(next);
    try {
      await saveMode(next);
      setMode(next);
      toast.success(`Song requests: ${MODE_LABELS[next]}.`);
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change the mode.");
    } finally {
      setSavingMode(null);
    }
  };

  const shown = requests.filter((r) => filter === "all" || r.status === filter).sort(byVotes);
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.id, f.id === "all" ? requests.length : requests.filter((r) => r.status === f.id).length]),
  );

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Song Requests"
        description={`Guests request songs for Vol. ${vol} before the night and send them to the booth during it. The chapter number comes from Event Details.`}
      />

      <SectionCard title="Mode">
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => changeMode(m.id)}
              disabled={savingMode !== null || mode === m.id}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                mode === m.id ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/60",
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                {m.id === "live" && <span className="zx-live-dot" aria-hidden />}
                {MODE_LABELS[m.id]}
                {mode === m.id && <span className="ml-auto text-xs text-primary">on</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`Requests — Vol. ${vol}`}>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => setFilter(f.id)}
            >
              {f.label} ({counts[f.id]})
            </Button>
          ))}
          <Button size="sm" variant="outline" className="ml-auto rounded-full text-xs" onClick={() => setBooth(true)}>
            <Maximize2 className="mr-1 h-3.5 w-3.5" /> Booth view
          </Button>
        </div>

        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests here yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {shown.map((r) => (
              <AdminRow key={r.id} request={r} onChange={refresh} />
            ))}
          </ul>
        )}
      </SectionCard>

      {booth && <BoothView requests={requests} mode={mode} onChange={refresh} onClose={() => setBooth(false)} />}
    </div>
  );
}

async function update(r: SongRequest, status: RequestStatus, onChange: () => void) {
  try {
    await setStatus(r.id, status);
    onChange();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Couldn't update that request.");
  }
}

function AdminRow({ request: r, onChange }: { request: SongRequest; onChange: () => void }) {
  const remove = async () => {
    const { error } = await requestsDb.from("song_requests").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else onChange();
  };

  return (
    <li className="flex flex-wrap items-start gap-3 py-3">
      <div className="w-10 shrink-0 text-center">
        <div className="text-lg font-semibold tabular-nums">{r.votes}</div>
        <div className="text-[10px] uppercase text-muted-foreground">votes</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium", r.status === "played" && "line-through opacity-60")}>
          {r.title}
          {r.artist && <span className="text-muted-foreground"> — {r.artist}</span>}
        </div>
        {r.shoutout && <div className="text-xs italic text-muted-foreground">"{r.shoutout}"</div>}
        <div className="mt-1 text-xs text-muted-foreground">
          {r.requester_name || "anonymous"} · {r.phase === "live" ? "on the night" : "before the night"} ·{" "}
          {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
          <span className={cn(r.status === "queued" && "text-primary")}>{r.status}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {r.status !== "queued" && r.status !== "played" && (
          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={() => update(r, "queued", onChange)}>
            <ListPlus className="mr-1 h-3.5 w-3.5" /> Queue
          </Button>
        )}
        {r.status !== "played" && (
          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={() => update(r, "played", onChange)}>
            <Check className="mr-1 h-3.5 w-3.5" /> Played
          </Button>
        )}
        {(r.status === "new" || r.status === "queued") && (
          <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => update(r, "skipped", onChange)}>
            <SkipForward className="mr-1 h-3.5 w-3.5" /> Skip
          </Button>
        )}
        {(r.status === "played" || r.status === "skipped") && (
          <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => update(r, "new", onChange)}>
            <Undo2 className="mr-1 h-3.5 w-3.5" /> Undo
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs text-muted-foreground" onClick={remove} aria-label={`Delete ${r.title}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

/**
 * Full-screen view for the DJ's laptop: big type, what's queued and what's waiting,
 * one tap to queue, mark played or skip. It refreshes with the rest of the panel.
 */
function BoothView({
  requests,
  mode,
  onChange,
  onClose,
}: {
  requests: SongRequest[];
  mode: RequestMode | null;
  onChange: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const queued = requests.filter((r) => r.status === "queued").sort(byVotes);
  const waiting = requests.filter((r) => r.status === "new").sort(byVotes);
  const lastPlayed = requests
    .filter((r) => r.status === "played")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const item = (r: SongRequest, isQueued: boolean) => (
    <li key={r.id} className="flex items-center gap-4 border-b border-[oklch(0.62_0.24_25/0.25)] py-4">
      <span className="w-12 shrink-0 text-center text-2xl tabular-nums">{r.votes}</span>
      <div className="min-w-0 flex-1">
        <div className="text-2xl uppercase tracking-[0.08em] sm:text-3xl">{r.title}</div>
        <div className="mt-1 text-sm opacity-70">
          {r.artist && `${r.artist} · `}
          {r.requester_name || "anonymous"}
          {r.shoutout && ` · "${r.shoutout}"`}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {!isQueued && (
          <button
            type="button"
            onClick={() => update(r, "queued", onChange)}
            className="border border-[oklch(0.62_0.24_25)] px-4 py-3 text-sm uppercase tracking-[0.15em] hover:bg-[oklch(0.62_0.24_25/0.15)]"
          >
            Queue
          </button>
        )}
        <button
          type="button"
          onClick={() => update(r, "played", onChange)}
          className="bg-[oklch(0.62_0.24_25)] px-4 py-3 text-sm uppercase tracking-[0.15em] text-black hover:opacity-90"
        >
          Played
        </button>
        <button
          type="button"
          onClick={() => update(r, "skipped", onChange)}
          className="px-3 py-3 text-sm uppercase tracking-[0.15em] opacity-60 hover:opacity-100"
        >
          Skip
        </button>
      </div>
    </li>
  );

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black font-mono text-[oklch(0.62_0.24_25)]"
      role="dialog"
      aria-modal="true"
      aria-label="Booth view"
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-3 text-sm uppercase tracking-[0.35em]">
            {mode === "live" ? (
              <>
                <span className="zx-live-dot" aria-hidden /> Live — requests open
              </>
            ) : (
              `Requests: ${mode ? MODE_LABELS[mode] : "..."}`
            )}
          </p>
          <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] opacity-70 hover:opacity-100">
            <X className="h-4 w-4" /> close (esc)
          </button>
        </div>

        {lastPlayed && (
          <p className="mt-6 text-sm uppercase tracking-[0.2em] opacity-50">
            Last played: {lastPlayed.title}
            {lastPlayed.artist && ` — ${lastPlayed.artist}`}
          </p>
        )}

        <h2 className="mt-10 text-sm uppercase tracking-[0.35em]">Up next ({queued.length})</h2>
        {queued.length === 0 ? (
          <p className="mt-4 opacity-50">Nothing queued. Queue something from the requests below.</p>
        ) : (
          <ol className="mt-2">{queued.map((r) => item(r, true))}</ol>
        )}

        <h2 className="mt-12 text-sm uppercase tracking-[0.35em] opacity-70">Requests ({waiting.length}) — most upvoted first</h2>
        {waiting.length === 0 ? (
          <p className="mt-4 opacity-50">No new requests.</p>
        ) : (
          <ol className="mt-2">{waiting.map((r) => item(r, false))}</ol>
        )}
      </div>
    </div>
  );
}
