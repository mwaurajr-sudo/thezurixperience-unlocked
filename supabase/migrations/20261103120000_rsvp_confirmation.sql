-- RSVP records: one per email per event. A ticket is only issued once the guest
-- confirms through the tokenised link sent to that email.
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  tier_name text not null,
  quantity int not null default 1 check (quantity between 1 and 10),
  event_vol text not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  token_hash text not null unique,
  token_expires_at timestamptz not null,
  last_email_at timestamptz,
  confirmed_at timestamptz,
  ticket_emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email, event_vol)
);

alter table public.rsvps enable row level security;

-- The backend uses the service role; only admins read RSVPs from the browser.
create policy "Admins view all rsvps"
  on public.rsvps for select to authenticated
  using (has_role(auth.uid(), 'admin'));

-- A confirmed RSVP maps to exactly one ticket, so repeat confirmations can't issue a second one.
alter table public.tickets add column if not exists rsvp_id uuid unique references public.rsvps(id) on delete set null;

-- Tickets are free now. These columns stay until supabase/manual/drop_payments.sql is run.
alter table public.tickets alter column total_kes set default 0;
alter table public.tickets alter column payment_method set default 'RSVP';

-- Tickets are only issued by the backend after confirmation, and only the backend
-- looks them up by code. These policies let any visitor forge tickets or read every guest's email.
drop policy if exists "Users insert own tickets" on public.tickets;
drop policy if exists "Anyone can select tickets by code" on public.tickets;
drop policy if exists "Anyone can insert payments" on public.payments;
