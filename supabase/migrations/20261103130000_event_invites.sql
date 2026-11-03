-- Event invites emailed by admins. One row per email per event, so a list can be
-- re-sent without emailing people who already have their invite.
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  event_vol text not null,
  status text not null check (status in ('sent', 'failed')),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email, event_vol)
);

alter table public.invites enable row level security;

create policy "Admins view all invites"
  on public.invites for select to authenticated
  using (has_role(auth.uid(), 'admin'));
