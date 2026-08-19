-- Auth-on cutover for an existing Liebeskarte project.
-- Paste and run supabase/schema.sql in the SQL editor instead of this file.
-- schema.sql is idempotent: it drops open anon policies, adds profiles,
-- journal/personal RLS, storage path checks, and the couple-user helper.

select
  'Run supabase/schema.sql in the SQL editor, then npm run seed:couple-users'
  as instructions;
