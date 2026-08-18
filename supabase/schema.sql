-- Our Atlas — run this in the Supabase SQL Editor (once).

create table if not exists public.couple_allowlist (
  email text primary key
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  lat double precision not null,
  lng double precision not null,
  place_name text not null default '',
  address text not null default '',
  type text not null default 'custom',
  journal text not null default '',
  journal_panda text not null default '',
  journal_henne text not null default '',
  journal_panda_shared boolean not null default false,
  journal_henne_shared boolean not null default false,
  visibility text not null default 'shared',
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  path text not null,
  name text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists memories_date_idx on public.memories (date);
create index if not exists photos_memory_id_idx on public.photos (memory_id);

alter table public.couple_allowlist enable row level security;
alter table public.memories enable row level security;
alter table public.photos enable row level security;

create or replace function public.is_couple_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create policy "couple can read allowlist"
  on public.couple_allowlist for select
  to authenticated
  using (public.is_couple_member());

create policy "couple can manage memories"
  on public.memories for all
  to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

create policy "couple can manage photos"
  on public.photos for all
  to authenticated
  using (public.is_couple_member())
  with check (public.is_couple_member());

grant select on public.couple_allowlist to authenticated;
grant select, insert, update, delete on public.memories to authenticated, anon;
grant select, insert, update, delete on public.photos to authenticated, anon;

-- Open access while AUTH_ENABLED is false in the app.
-- Drop these four policies before you turn login on.
create policy "open memories while auth off"
  on public.memories for all
  to anon
  using (true)
  with check (true);

create policy "open photos while auth off"
  on public.photos for all
  to anon
  using (true)
  with check (true);

create policy "open storage read while auth off"
  on storage.objects for select
  to anon
  using (bucket_id = 'memory-photos');

create policy "open storage write while auth off"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'memory-photos');

create policy "open storage update while auth off"
  on storage.objects for update
  to anon
  using (bucket_id = 'memory-photos')
  with check (bucket_id = 'memory-photos');

create policy "open storage delete while auth off"
  on storage.objects for delete
  to anon
  using (bucket_id = 'memory-photos');

insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', false)
on conflict (id) do nothing;

create policy "couple can read memory photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'memory-photos' and public.is_couple_member());

create policy "couple can upload memory photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'memory-photos' and public.is_couple_member());

create policy "couple can update memory photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'memory-photos' and public.is_couple_member())
  with check (bucket_id = 'memory-photos' and public.is_couple_member());

create policy "couple can delete memory photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'memory-photos' and public.is_couple_member());

-- Replace these with your two emails, then create those accounts in the app.
insert into public.couple_allowlist (email) values
  ('you@example.com'),
  ('partner@example.com')
on conflict (email) do nothing;

-- Additive: keep name and street address as separate fields.
alter table public.memories
  add column if not exists address text not null default '';

-- Dual journals: one entry per partner (Panda / Henne).
alter table public.memories
  add column if not exists journal_panda text not null default '',
  add column if not exists journal_henne text not null default '',
  add column if not exists journal_panda_shared boolean not null default false,
  add column if not exists journal_henne_shared boolean not null default false;

-- Migrate legacy single journal into Panda's shared entry.
update public.memories
set
  journal_panda = journal,
  journal_panda_shared = true
where journal <> '' and journal_panda = '';

-- Per-photo privacy: hidden photos only appear in Settings.
alter table public.photos
  add column if not exists hidden boolean not null default false;

-- Personal vs shared memories.
alter table public.memories
  add column if not exists visibility text not null default 'shared',
  add column if not exists owner text;

alter table public.memories
  drop constraint if exists memories_visibility_check;

alter table public.memories
  add constraint memories_visibility_check
  check (visibility in ('shared', 'personal'));

alter table public.memories
  drop constraint if exists memories_owner_check;

alter table public.memories
  add constraint memories_owner_check
  check (owner is null or owner in ('panda', 'henne'));

create index if not exists memories_visibility_idx on public.memories (visibility);
create index if not exists memories_owner_idx on public.memories (owner);

