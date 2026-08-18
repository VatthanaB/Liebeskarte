# Hosting & data (cloud)

Liebeskarte stores memories in **Supabase Postgres** and photos in **Supabase Storage**. The website (and custom domain) stay on **Vercel**.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (Free).
2. Copy **Project URL** and **anon public** key from Settings → API.
3. In this `web/` folder, create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

4. In Supabase → SQL Editor, paste and run [`supabase/schema.sql`](../supabase/schema.sql).
5. Edit the last `insert into couple_allowlist` so it has **your two emails**.
6. Login is **off** for now (`AUTH_ENABLED = false` in `lib/auth.tsx`). Schema includes open `anon` policies so the app can read/write without sign-in. Turn auth on later by flipping that flag and dropping the `while auth off` policies.

## 2. Use the app

Restart the dev server after adding keys. You and your partner share the same Supabase project — no login screen until you enable auth.

## 3. Deploy frontend (custom domain, $0)

1. Push the repo to GitHub.
2. [Vercel](https://vercel.com) → Import → add the same two env vars.
3. Project → Domains → add `yourdomain.com` (buy the name anywhere; Vercel Hobby includes the connection + HTTPS).

## What lives where

| Data | Place |
|------|--------|
| Titles, dates, places, journal | Supabase table `memories` |
| Photo files | Supabase bucket `memory-photos` |
| Photo metadata | Supabase table `photos` |
| Who can see it | `couple_allowlist` + login |
| The Next.js app | Vercel + your domain |

Export still works as an extra backup file. It is not the source of truth anymore.
