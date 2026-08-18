-- Run once in the Supabase SQL Editor after deploying hidden-photo support.

alter table public.photos
  add column if not exists hidden boolean not null default false;
