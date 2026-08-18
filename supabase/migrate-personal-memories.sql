-- Personal vs shared memories. Run once in the Supabase SQL Editor.

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
