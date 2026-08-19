-- Run after schema.sql. Creates the two confirmed users (no inbox step).
-- Change the passwords before running if you do not want the defaults below.

select public.create_couple_user('panda@liebeskarte.app', 'change-me-panda', 'panda');
select public.create_couple_user('henne@liebeskarte.app', 'change-me-henne', 'henne');
