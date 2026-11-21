-- Song requests: guests send songs before the night (and upvote each other's), and
-- straight to the DJ booth during it. Admins switch the mode in Admin → Song Requests,
-- which saves { "mode": "closed" | "before" | "live" } in site_content under 'songRequests'.
-- Safe to run more than once: it skips or replaces anything that already exists.
-- In the Supabase SQL Editor, choose "Run without RLS": this script enables RLS itself.

create table if not exists public.song_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_vol text not null,
  phase text not null check (phase in ('before', 'live')),
  title text not null check (char_length(title) between 1 and 120),
  artist text check (char_length(artist) <= 120),
  shoutout text check (char_length(shoutout) <= 200),
  requester_name text check (char_length(requester_name) <= 60),
  status text not null default 'new' check (status in ('new', 'queued', 'played', 'skipped'))
);

create index if not exists song_requests_vol_created on public.song_requests (event_vol, created_at desc);
create index if not exists song_requests_user_recent on public.song_requests (user_id, created_at desc);

create table if not exists public.song_request_votes (
  request_id uuid not null references public.song_requests (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

-- The current mode, as saved by the admin panel. No row means closed.
create or replace function public.song_request_mode()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select data ->> 'mode' from public.site_content where section = 'songRequests'),
    'closed'
  );
$$;

-- Fills in who and when from the session (so guests can't fake them), and applies the limits:
-- 3 requests per guest per chapter before the night, and 1 every 5 minutes during it.
create or replace function public.prepare_song_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  used int;
begin
  new.user_id := auth.uid();
  new.status := 'new';
  new.created_at := now();
  new.phase := public.song_request_mode();
  new.title := btrim(new.title);
  new.artist := nullif(btrim(coalesce(new.artist, '')), '');
  new.shoutout := nullif(btrim(coalesce(new.shoutout, '')), '');
  new.requester_name := nullif(btrim(coalesce(new.requester_name, '')), '');

  if new.user_id is null then
    raise exception 'Sign in to request a song.' using errcode = 'P0001';
  end if;
  if new.phase not in ('before', 'live') then
    raise exception 'Song requests are closed right now.' using errcode = 'P0001';
  end if;
  if new.title = '' then
    raise exception 'Add the song name.' using errcode = 'P0001';
  end if;

  perform 1 from public.song_requests r
  where r.event_vol = new.event_vol
    and r.status in ('new', 'queued')
    and lower(r.title) = lower(new.title)
    and lower(coalesce(r.artist, '')) = lower(coalesce(new.artist, ''));
  if found then
    raise exception 'Someone already asked for that one. Upvote it instead.' using errcode = 'P0001';
  end if;

  if public.has_role(new.user_id, 'admin') then
    return new;
  end if;

  if new.phase = 'before' then
    select count(*) into used from public.song_requests
    where user_id = new.user_id and event_vol = new.event_vol and phase = 'before';
    if used >= 3 then
      raise exception 'You''ve sent your 3 requests for this chapter. Upvote other songs instead.' using errcode = 'P0001';
    end if;
  else
    select count(*) into used from public.song_requests
    where user_id = new.user_id and phase = 'live' and created_at > now() - interval '5 minutes';
    if used >= 1 then
      raise exception 'One request every 5 minutes. The DJ has your last one.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists song_requests_prepare on public.song_requests;
create trigger song_requests_prepare
  before insert on public.song_requests
  for each row execute function public.prepare_song_request();

alter table public.song_requests enable row level security;
alter table public.song_request_votes enable row level security;

-- Every signed-in member sees the list, so the room can upvote and watch what gets played.
drop policy if exists "Members can view song requests" on public.song_requests;
create policy "Members can view song requests"
  on public.song_requests for select
  to authenticated
  using (true);

drop policy if exists "Members can request songs" on public.song_requests;
create policy "Members can request songs"
  on public.song_requests for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Members can withdraw their own unplayed requests" on public.song_requests;
create policy "Members can withdraw their own unplayed requests"
  on public.song_requests for delete
  to authenticated
  using (user_id = auth.uid() and status = 'new');

drop policy if exists "Admins can manage song requests" on public.song_requests;
create policy "Admins can manage song requests"
  on public.song_requests for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Members can view votes" on public.song_request_votes;
create policy "Members can view votes"
  on public.song_request_votes for select
  to authenticated
  using (true);

drop policy if exists "Members can upvote while requests are open" on public.song_request_votes;
create policy "Members can upvote while requests are open"
  on public.song_request_votes for insert
  to authenticated
  with check (user_id = auth.uid() and public.song_request_mode() in ('before', 'live'));

drop policy if exists "Members can take back their upvote" on public.song_request_votes;
create policy "Members can take back their upvote"
  on public.song_request_votes for delete
  to authenticated
  using (user_id = auth.uid());
