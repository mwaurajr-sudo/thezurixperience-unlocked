// Song requests: guests send songs before the night (and upvote each other's), and straight
// to the DJ booth during it. Everything goes through Supabase; the rules (who can request,
// limits, duplicates) live in the database: supabase/migrations/20261121120000_song_requests.sql.
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// The generated database types don't include these tables yet, so this client is untyped.
export const requestsDb = supabase as unknown as SupabaseClient;

export type RequestMode = "closed" | "before" | "live";
export type RequestStatus = "new" | "queued" | "played" | "skipped";

export type SongRequest = {
  id: string;
  created_at: string;
  user_id: string;
  event_vol: string;
  phase: "before" | "live";
  title: string;
  artist: string | null;
  shoutout: string | null;
  requester_name: string | null;
  status: RequestStatus;
  votes: number;
};

export const MODE_LABELS: Record<RequestMode, string> = {
  closed: "Closed",
  before: "Before the night",
  live: "Live tonight",
};

/** Most upvoted first, then oldest first: the order the DJ should look at them. */
export const byVotes = (a: SongRequest, b: SongRequest) =>
  b.votes - a.votes || a.created_at.localeCompare(b.created_at);

/** The current mode, saved by admins in site_content under "songRequests". */
export async function fetchMode(): Promise<RequestMode> {
  const { data } = await requestsDb.from("site_content").select("data").eq("section", "songRequests").maybeSingle();
  const mode = (data?.data as { mode?: string } | undefined)?.mode;
  return mode === "before" || mode === "live" ? mode : "closed";
}

export async function saveMode(mode: RequestMode) {
  const { error } = await requestsDb
    .from("site_content")
    .upsert({ section: "songRequests", data: { mode } }, { onConflict: "section" });
  if (error) throw new Error(error.message);
}

/** Requests for one chapter, with their upvote counts. */
export async function fetchRequests(eventVol: string): Promise<SongRequest[]> {
  const { data, error } = await requestsDb
    .from("song_requests")
    .select("id, created_at, user_id, event_vol, phase, title, artist, shoutout, requester_name, status, song_request_votes(count)")
    .eq("event_vol", eventVol)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => {
    const counts = row.song_request_votes as { count: number }[] | undefined;
    const { song_request_votes: _omit, ...rest } = row;
    return { ...(rest as Omit<SongRequest, "votes">), votes: counts?.[0]?.count ?? 0 };
  });
}

/** Ids of the requests this member has upvoted. */
export async function fetchMyVotes(userId: string): Promise<Set<string>> {
  const { data } = await requestsDb.from("song_request_votes").select("request_id").eq("user_id", userId);
  return new Set((data ?? []).map((v: { request_id: string }) => v.request_id));
}

/** Database errors carry the reason written for guests (limits, duplicates, closed). */
const reason = (error: { message: string } | null) =>
  error ? error.message || "Something went wrong. Please try again." : null;

export async function sendRequest(input: {
  eventVol: string;
  title: string;
  artist: string;
  shoutout: string;
  requesterName: string;
}) {
  const { error } = await requestsDb.from("song_requests").insert({
    event_vol: input.eventVol,
    title: input.title.trim().slice(0, 120),
    artist: input.artist.trim().slice(0, 120) || null,
    shoutout: input.shoutout.trim().slice(0, 200) || null,
    requester_name: input.requesterName.trim().slice(0, 60) || null,
    // The database sets the real phase, status and requester from the session.
    phase: "before",
  });
  const message = reason(error);
  if (message) throw new Error(message);
}

export async function toggleVote(requestId: string, userId: string, voted: boolean) {
  const { error } = voted
    ? await requestsDb.from("song_request_votes").delete().eq("request_id", requestId).eq("user_id", userId)
    : await requestsDb.from("song_request_votes").insert({ request_id: requestId });
  const message = reason(error);
  if (message) throw new Error(voted ? message : "Upvotes are closed right now.");
}

export async function withdrawRequest(requestId: string) {
  const { error } = await requestsDb.from("song_requests").delete().eq("id", requestId);
  if (error) throw new Error(reason(error) ?? undefined);
}

export async function setStatus(requestId: string, status: RequestStatus) {
  const { error } = await requestsDb.from("song_requests").update({ status }).eq("id", requestId);
  if (error) throw new Error(error.message);
}

/**
 * Loads the mode and the chapter's requests, and keeps them fresh: every 8 seconds while
 * live (so phones and the booth stay in step), every 30 seconds otherwise.
 */
export function useSongRequests(eventVol: string, userId: string | null) {
  const [mode, setMode] = useState<RequestMode | null>(null);
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [m, list, votes] = await Promise.all([
        fetchMode(),
        fetchRequests(eventVol),
        userId ? fetchMyVotes(userId) : Promise.resolve(new Set<string>()),
      ]);
      setMode(m);
      setRequests(list);
      setMyVotes(votes);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load requests.");
    }
  }, [eventVol, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, mode === "live" ? 8000 : 30000);
    return () => window.clearInterval(id);
  }, [mode, refresh]);

  return { mode, requests, myVotes, error, refresh, setMode };
}
