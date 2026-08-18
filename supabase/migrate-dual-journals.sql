-- Dual journal migration (Panda / Henne)
-- Run this once in the Supabase SQL Editor if your database was created
-- before dual journals were added. Safe to re-run.
--
-- Adds per-partner journal columns and copies existing `journal` text into
-- Panda's shared entry so both people can still read old stories.

alter table public.memories
  add column if not exists journal_panda text not null default '',
  add column if not exists journal_henne text not null default '',
  add column if not exists journal_panda_shared boolean not null default false,
  add column if not exists journal_henne_shared boolean not null default false;

update public.memories
set
  journal_panda = journal,
  journal_panda_shared = true
where journal <> ''
  and journal_panda = '';
