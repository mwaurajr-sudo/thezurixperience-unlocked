-- Site content table: one row per section, JSON payload
create table public.site_content (
  section text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.site_content enable row level security;

-- Public read
create policy "Site content is viewable by everyone"
  on public.site_content for select
  to anon, authenticated
  using (true);

-- Admin write
create policy "Admins can insert site content"
  on public.site_content for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update site content"
  on public.site_content for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete site content"
  on public.site_content for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
create trigger site_content_updated_at
  before update on public.site_content
  for each row execute function public.handle_updated_at();