-- Create Users table mapped to auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- Enable RLS for users
alter table public.users enable row level security;

create policy "Users can view all user profiles"
  on public.users for select to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.users for update to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert to authenticated
  with check (auth.uid() = id);

-- Create Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text not null,
  event_date text not null,
  price integer not null,
  created_at timestamptz not null default now()
);

-- Enable RLS for events
alter table public.events enable row level security;

create policy "Events are viewable by everyone"
  on public.events for select to anon, authenticated
  using (true);

create policy "Admins can manage events"
  on public.events for all to authenticated
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

-- Create Payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  amount integer not null,
  mpesa_receipt text,
  transaction_id text not null unique,
  phone text not null,
  status text not null default 'PENDING', -- PENDING, COMPLETED, FAILED
  created_at timestamptz not null default now()
);

-- Enable RLS for payments
alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage all payments"
  on public.payments for all to authenticated
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

-- Alter Tickets table to support the payment-ticketing link
alter table public.tickets add column if not exists event_id uuid references public.events(id) on delete set null;
alter table public.tickets add column if not exists payment_id uuid references public.payments(id) on delete set null;
alter table public.tickets add column if not exists pdf_url text;
alter table public.tickets add column if not exists used boolean not null default false;
alter table public.tickets add column if not exists ticket_code text;

-- Create a sequence starting at 0 for ticket codes
create sequence if not exists public.zuri_ticket_code_seq start with 0 minvalue 0;

-- Update the existing ticket trigger to automatically populate new values if they are missing
create or replace function public.set_ticket_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num int;
begin
  if new.ticket_number is null or new.ticket_number = 0 then
    new.ticket_number := nextval('public.ticket_number_seq');
  end if;
  
  if new.code is null or new.code = '' then
    new.code := 'ZURI' || lpad(new.ticket_number::text, 3, '0');
  end if;

  if new.ticket_code is null or new.ticket_code = '' then
    new.ticket_code := new.code;
  end if;

  return new;
end;
$$;

-- Create policy for public insert to payments for anon/auth
create policy "Anyone can insert payments"
  on public.payments for insert to anon, authenticated
  with check (true);

-- Ensure public select for tickets by code works for verification
create policy "Anyone can select tickets by code"
  on public.tickets for select to anon, authenticated
  using (true);
