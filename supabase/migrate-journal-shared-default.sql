-- New journals are shared with the other partner unless opted out.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- Does not change existing journal sharing flags.

alter table public.memories
  alter column journal_panda_shared set default true,
  alter column journal_henne_shared set default true;
