# Hosting & data (cloud)

Liebeskarte stores memories in **Supabase Postgres** and photos in **Supabase Storage**. The website (and custom domain) stay on **Vercel**. Login is **on**: username `panda` or `henne` plus a password. Supabase only accepts email or phone, so those usernames map to dummy emails (`panda@liebeskarte.app`, `henne@liebeskarte.app`) and accounts are created already confirmed.

## Sign in (for now)

Use the username, not the dummy email. Rotate these later and remove this table.

| Username | Password |
|----------|----------|
| `panda` | `Lk-jryL31vd` |
| `henne` | `Lk-TzGh8JYf` |

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (Free).
2. Copy **Project URL** and **anon public** / publishable key from Settings → API.
3. In this `web/` folder, create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. In Supabase → SQL Editor, paste and run [`supabase/schema.sql`](../supabase/schema.sql). That file is idempotent and is the auth-on cutover (open anon policies dropped, partner profiles, personal/journal RLS, storage path checks).
5. Authentication → Providers → Email: **disable new user signups**. Allowlist + a `before insert` trigger on `auth.users` also reject unknown emails.
6. Create the two users (confirmed, no inbox step):

```bash
# web/.env.migrate needs NEW_DATABASE_URL or NEW_DB_PASSWORD
npm run seed:couple-users
```

Or in the SQL editor, after schema.sql:

```sql
select public.create_couple_user('panda@liebeskarte.app', 'choose-a-password', 'panda');
select public.create_couple_user('henne@liebeskarte.app', 'choose-a-password', 'henne');
```

Sign in with username `panda` or `henne` and that password. Session refresh runs in `proxy.ts` (Next.js 16; do not add `middleware.ts`).

## 2. Use the app

Restart the dev server after adding keys. Each of you signs in once; the session stays on that device.

## 3. Deploy frontend (custom domain, $0)

1. Push the repo to GitHub.
2. [Vercel](https://vercel.com) → Import → add the same two env vars.
3. Project → Domains → add `yourdomain.com` (buy the name anywhere; Vercel Hobby includes the connection + HTTPS).

## What lives where

| Data | Place |
|------|--------|
| Titles, dates, places, journal | Supabase table `memories` (reads go through `memories_visible`) |
| Photo files | Supabase bucket `memory-photos` (15 MB, images only) |
| Photo metadata | Supabase table `photos` |
| Who can sign in | `couple_allowlist` + `profiles` (panda / henne) |
| Live reload ping | `sync_events` (no journal text on the wire) |
| The Next.js app | Vercel + your domain |

Supabase is the source of truth. JSON export / import is not built yet.

Signed photo URLs last 24 hours and are regenerated on load. Anyone with the URL can view that photo until it expires. Fine for this private couple app once RLS is on.

## 4. Realtime (existing projects)

New projects that run [`supabase/schema.sql`](../supabase/schema.sql) publish `sync_events` to Realtime (not raw `memories` / `photos`, so private journals are not in the websocket payload).

If the database already exists, run the same `schema.sql` in the SQL editor. Older [`supabase/migrate-realtime.sql`](../supabase/migrate-realtime.sql) added table-level memory/photo publication; the auth-on schema replaces that with `sync_events`.
