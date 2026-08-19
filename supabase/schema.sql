-- Liebeskarte, run this in the Supabase SQL Editor (once) for a new project.
-- Existing projects: run migrate-auth-on.sql instead of re-running this file.

create table if not exists public.couple_allowlist (
  email text primary key
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  partner text not null check (partner in ('panda', 'henne')),
  created_at timestamptz not null default now(),
  unique (partner)
);

create table if not exists public.sync_events (
  id integer primary key default 1 check (id = 1),
  tick bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.sync_events (id, tick)
values (1, 0)
on conflict (id) do nothing;

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

alter table public.memories
  add column if not exists address text not null default '';

alter table public.memories
  add column if not exists journal_panda text not null default '',
  add column if not exists journal_henne text not null default '',
  add column if not exists journal_panda_shared boolean not null default false,
  add column if not exists journal_henne_shared boolean not null default false;

update public.memories
set
  journal_panda = journal,
  journal_panda_shared = true
where journal <> '' and journal_panda = '';

alter table public.photos
  add column if not exists hidden boolean not null default false;

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

alter table public.couple_allowlist enable row level security;
alter table public.profiles enable row level security;
alter table public.sync_events enable row level security;
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

create or replace function public.current_partner_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.partner
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.can_view_memory(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memories m
    where m.id = target_id
      and public.is_couple_member()
      and (
        m.visibility = 'shared'
        or m.owner = public.current_partner_id()
      )
  );
$$;

create or replace function public.memory_id_from_storage_path(object_name text)
returns uuid
language plpgsql
stable
as $$
declare
  folder text;
begin
  folder := (storage.foldername(object_name))[1];
  if folder is null then
    return null;
  end if;
  begin
    return folder::uuid;
  exception
    when invalid_text_representation then
      return null;
  end;
end;
$$;

create or replace function public.protect_memory_privacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me text := public.current_partner_id();
begin
  if not public.is_couple_member() or me is null then
    raise exception 'Not a couple member';
  end if;

  if tg_op = 'INSERT' then
    if new.visibility = 'personal' and new.owner is distinct from me then
      raise exception 'Personal memories must be owned by you';
    end if;
    if new.visibility = 'shared' and new.owner is null then
      new.owner := me;
    end if;
    return new;
  end if;

  if me is distinct from 'panda' then
    new.journal_panda := old.journal_panda;
    new.journal_panda_shared := old.journal_panda_shared;
  end if;
  if me is distinct from 'henne' then
    new.journal_henne := old.journal_henne;
    new.journal_henne_shared := old.journal_henne_shared;
  end if;

  if old.visibility = 'personal' then
    new.owner := old.owner;
    new.visibility := old.visibility;
  elsif new.visibility = 'personal' and new.owner is distinct from me then
    raise exception 'Personal memories must be owned by you';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_memory_privacy on public.memories;
create trigger protect_memory_privacy
  before insert or update on public.memories
  for each row execute function public.protect_memory_privacy();

create or replace function public.touch_sync_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sync_events
  set tick = tick + 1, updated_at = now()
  where id = 1;
  return null;
end;
$$;

drop trigger if exists memories_touch_sync on public.memories;
create trigger memories_touch_sync
  after insert or update or delete on public.memories
  for each statement execute function public.touch_sync_events();

drop trigger if exists photos_touch_sync on public.photos;
create trigger photos_touch_sync
  after insert or update or delete on public.photos
  for each statement execute function public.touch_sync_events();

create or replace function public.reject_non_allowlisted_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or not exists (
    select 1
    from public.couple_allowlist
    where lower(email) = lower(new.email)
  ) then
    raise exception 'Email is not allowed to join this journal';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_allowlist on auth.users;
create trigger on_auth_user_created_allowlist
  before insert on auth.users
  for each row execute function public.reject_non_allowlisted_user();

create or replace function public.handle_new_couple_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local text := split_part(lower(coalesce(new.email, '')), '@', 1);
begin
  if local in ('panda', 'henne') then
    insert into public.profiles (id, partner)
    values (new.id, local)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_couple_user();

create or replace view public.memories_visible
with (security_barrier = true) as
select
  m.id,
  m.title,
  m.date,
  m.lat,
  m.lng,
  m.place_name,
  m.address,
  m.type,
  m.journal,
  case
    when public.current_partner_id() = 'panda' or m.journal_panda_shared
      then m.journal_panda
    else ''
  end as journal_panda,
  case
    when public.current_partner_id() = 'henne' or m.journal_henne_shared
      then m.journal_henne
    else ''
  end as journal_henne,
  case
    when public.current_partner_id() = 'panda' or m.journal_panda_shared
      then m.journal_panda_shared
    else false
  end as journal_panda_shared,
  case
    when public.current_partner_id() = 'henne' or m.journal_henne_shared
      then m.journal_henne_shared
    else false
  end as journal_henne_shared,
  m.visibility,
  m.owner,
  m.created_at,
  m.updated_at,
  m.created_by
from public.memories m
where public.is_couple_member()
  and (
    m.visibility = 'shared'
    or m.owner = public.current_partner_id()
  );

drop policy if exists "couple can read allowlist" on public.couple_allowlist;
create policy "couple can read allowlist"
  on public.couple_allowlist for select
  to authenticated
  using (public.is_couple_member());

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "couple can read sync events" on public.sync_events;
create policy "couple can read sync events"
  on public.sync_events for select
  to authenticated
  using (public.is_couple_member());

drop policy if exists "couple can manage memories" on public.memories;
drop policy if exists "couple can select memories" on public.memories;
drop policy if exists "couple can insert memories" on public.memories;
drop policy if exists "couple can update memories" on public.memories;
drop policy if exists "couple can delete memories" on public.memories;

create policy "couple can insert memories"
  on public.memories for insert
  to authenticated
  with check (
    public.is_couple_member()
    and (
      visibility = 'shared'
      or owner = public.current_partner_id()
    )
  );

create policy "couple can update memories"
  on public.memories for update
  to authenticated
  using (public.can_view_memory(id))
  with check (public.can_view_memory(id));

create policy "couple can delete memories"
  on public.memories for delete
  to authenticated
  using (public.can_view_memory(id));

drop policy if exists "couple can manage photos" on public.photos;
drop policy if exists "couple can select photos" on public.photos;
drop policy if exists "couple can insert photos" on public.photos;
drop policy if exists "couple can update photos" on public.photos;
drop policy if exists "couple can delete photos" on public.photos;

create policy "couple can select photos"
  on public.photos for select
  to authenticated
  using (public.can_view_memory(memory_id));

create policy "couple can insert photos"
  on public.photos for insert
  to authenticated
  with check (public.can_view_memory(memory_id));

create policy "couple can update photos"
  on public.photos for update
  to authenticated
  using (public.can_view_memory(memory_id))
  with check (public.can_view_memory(memory_id));

create policy "couple can delete photos"
  on public.photos for delete
  to authenticated
  using (public.can_view_memory(memory_id));

drop policy if exists "open memories while auth off" on public.memories;
drop policy if exists "open photos while auth off" on public.photos;
drop policy if exists "open storage read while auth off" on storage.objects;
drop policy if exists "open storage write while auth off" on storage.objects;
drop policy if exists "open storage update while auth off" on storage.objects;
drop policy if exists "open storage delete while auth off" on storage.objects;

revoke all on public.memories from anon;
revoke all on public.photos from anon;
revoke all on public.couple_allowlist from anon;
revoke all on public.profiles from anon;
revoke all on public.sync_events from anon;
revoke all on public.memories_visible from anon;

revoke select on public.memories from authenticated;
grant insert, update, delete on public.memories to authenticated;
grant select on public.memories_visible to authenticated;
grant select, insert, update, delete on public.photos to authenticated;
grant select on public.couple_allowlist to authenticated;
grant select on public.profiles to authenticated;
grant select on public.sync_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-photos',
  'memory-photos',
  false,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "couple can read memory photos" on storage.objects;
drop policy if exists "couple can upload memory photos" on storage.objects;
drop policy if exists "couple can update memory photos" on storage.objects;
drop policy if exists "couple can delete memory photos" on storage.objects;

create policy "couple can read memory photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'memory-photos'
    and public.can_view_memory(public.memory_id_from_storage_path(name))
  );

create policy "couple can upload memory photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'memory-photos'
    and public.can_view_memory(public.memory_id_from_storage_path(name))
  );

create policy "couple can update memory photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'memory-photos'
    and public.can_view_memory(public.memory_id_from_storage_path(name))
  )
  with check (
    bucket_id = 'memory-photos'
    and public.can_view_memory(public.memory_id_from_storage_path(name))
  );

create policy "couple can delete memory photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'memory-photos'
    and public.can_view_memory(public.memory_id_from_storage_path(name))
  );

delete from public.couple_allowlist
where lower(email) in ('you@example.com', 'partner@example.com');

insert into public.couple_allowlist (email) values
  ('panda@liebeskarte.app'),
  ('henne@liebeskarte.app')
on conflict (email) do nothing;

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memories'
  ) then
    alter publication supabase_realtime drop table public.memories;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'photos'
  ) then
    alter publication supabase_realtime drop table public.photos;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sync_events'
  ) then
    alter publication supabase_realtime add table public.sync_events;
  end if;
end $$;

alter table public.sync_events replica identity full;

create or replace function public.create_couple_user(
  user_email text,
  user_password text,
  user_partner text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_id uuid;
  encrypted text;
begin
  if user_partner not in ('panda', 'henne') then
    raise exception 'Partner must be panda or henne';
  end if;

  insert into public.couple_allowlist (email)
  values (lower(user_email))
  on conflict (email) do nothing;

  select id into new_id
  from auth.users
  where lower(email) = lower(user_email);

  encrypted := crypt(user_password, gen_salt('bf'));

  if new_id is null then
    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_id,
      'authenticated',
      'authenticated',
      lower(user_email),
      encrypted,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('partner', user_partner),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      new_id,
      jsonb_build_object('sub', new_id::text, 'email', lower(user_email)),
      'email',
      new_id::text,
      now(),
      now(),
      now()
    );
  else
    update auth.users
    set
      encrypted_password = encrypted,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = new_id;
  end if;

  insert into public.profiles (id, partner)
  values (new_id, user_partner)
  on conflict (id) do update set partner = excluded.partner;

  return new_id;
end;
$$;
