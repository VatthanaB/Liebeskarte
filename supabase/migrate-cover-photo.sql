-- Chosen event cover photo. Run once in the Supabase SQL Editor.

alter table public.memories
  add column if not exists cover_photo_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'memories_cover_photo_id_fkey'
  ) then
    alter table public.memories
      add constraint memories_cover_photo_id_fkey
      foreign key (cover_photo_id) references public.photos (id) on delete set null;
  end if;
end $$;

create or replace function public.protect_memory_cover_photo()
returns trigger
language plpgsql
as $$
begin
  if new.cover_photo_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.photos p
    where p.id = new.cover_photo_id
      and p.memory_id = new.id
  ) then
    raise exception 'Cover photo must belong to this memory';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_memory_cover_photo on public.memories;
create trigger protect_memory_cover_photo
  before insert or update on public.memories
  for each row execute function public.protect_memory_cover_photo();

create or replace view public.memories_visible
with (security_barrier = true, security_invoker = true) as
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
  m.created_by,
  m.cover_photo_id
from public.memories m
where public.is_couple_member()
  and (
    m.visibility = 'shared'
    or m.owner = public.current_partner_id()
  );

notify pgrst, 'reload schema';
