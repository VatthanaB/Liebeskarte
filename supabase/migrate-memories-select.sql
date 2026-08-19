-- Fix: authenticated reads of memories_visible fail with
--   permission denied for table memories (42501)
-- because SELECT was revoked on the base table and the view is
-- security_invoker (caller needs table privileges + a SELECT policy).
--
-- Paste and run in the Supabase SQL Editor, or re-run schema.sql.

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
  m.created_by
from public.memories m
where public.is_couple_member()
  and (
    m.visibility = 'shared'
    or m.owner = public.current_partner_id()
  );

drop policy if exists "couple can select memories" on public.memories;
create policy "couple can select memories"
  on public.memories for select
  to authenticated
  using (
    public.is_couple_member()
    and (
      visibility = 'shared'
      or owner = public.current_partner_id()
    )
  );

grant select, insert, update, delete on public.memories to authenticated;
grant select on public.memories_visible to authenticated;
