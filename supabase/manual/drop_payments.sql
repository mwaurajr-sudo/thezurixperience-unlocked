-- Permanently deletes payment history and the M-Pesa schema. Cannot be undone.
-- Deliberately kept out of supabase/migrations so `supabase db push` never runs it.
-- Export public.payments first if you need the records, then run this in the SQL editor.
-- Requires 20261103120000_rsvp_confirmation.sql to be applied first.
begin;

alter table public.tickets drop column if exists payment_id;
alter table public.tickets drop column if exists total_kes;
alter table public.tickets drop column if exists payment_method;
alter table public.events drop column if exists price;
drop table if exists public.payments;

commit;
