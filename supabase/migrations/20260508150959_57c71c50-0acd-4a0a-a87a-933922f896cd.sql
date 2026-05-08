
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number int not null,
  code text not null unique,
  email text not null,
  tier_name text not null,
  quantity int not null,
  total_kes int not null,
  payment_method text not null,
  event_vol text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create sequence public.ticket_number_seq start 1;

create or replace function public.set_ticket_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ticket_number is null or new.ticket_number = 0 then
    new.ticket_number := nextval('public.ticket_number_seq');
  end if;
  if new.code is null or new.code = '' then
    new.code := 'ZURI' || lpad(new.ticket_number::text, 3, '0');
  end if;
  return new;
end;
$$;

create trigger tickets_set_code
before insert on public.tickets
for each row execute function public.set_ticket_code();

alter table public.tickets enable row level security;

create policy "Users insert own tickets"
on public.tickets for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users view own tickets"
on public.tickets for select to authenticated
using (auth.uid() = user_id);

create policy "Admins view all tickets"
on public.tickets for select to authenticated
using (has_role(auth.uid(), 'admin'));

create policy "Admins update tickets"
on public.tickets for update to authenticated
using (has_role(auth.uid(), 'admin'))
with check (has_role(auth.uid(), 'admin'));

create policy "Admins delete tickets"
on public.tickets for delete to authenticated
using (has_role(auth.uid(), 'admin'));

create or replace function public.verify_ticket_code(_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tickets where upper(code) = upper(_code)
  );
$$;

grant execute on function public.verify_ticket_code(text) to authenticated, anon;
