# Security Review

Findings for Liebeskarte’s auth, RLS, partner gate, and session handling. **Severity: high / medium / low.**

---

## Current state

- **Supabase Auth** is implemented in `lib/auth.tsx` and `components/AuthGate.tsx` but **disabled** via `AUTH_ENABLED = false`.
- **Partner gate** is a separate client-only layer: password → `panda` or `henne`, stored in `localStorage` (`liebeskarte-partner`).
- **All data access** is from the browser through `lib/db.ts` using the public publishable key. There are no API routes or server actions.
- **RLS** is enabled on tables, but `supabase/schema.sql` includes **open anonymous policies** while auth is off.
- **Privacy** (personal memories, unshared journals, hidden photos) is filtered in React (`lib/memory-visibility.ts`), not enforced in Postgres.
- **Session refresh** helper exists in `proxy.ts` and `utils/supabase/middleware.ts`, but there is no root `middleware.ts` wired for Next.js to run it.

---

## Findings

### HIGH — Open anonymous database access (current production posture)

**Files:** `supabase/schema.sql` (lines 79–112), `lib/auth.tsx`

While `AUTH_ENABLED` is false, four policies allow `anon` full CRUD on `memories`, `photos`, and the `memory-photos` storage bucket. Grants also give `anon` insert/update/delete on tables.

Anyone with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (both are in the client bundle on any deployed site) can read, write, and delete all memories and photos.

**Suggested fix:**

1. Set `AUTH_ENABLED = true` in `lib/auth.tsx`.
2. Drop the four `"open ... while auth off"` policies in Supabase.
3. Revoke `anon` grants on `memories` and `photos` (or remove anon policies entirely).
4. Replace placeholder allowlist emails in `schema.sql` with the two real addresses.
5. Disable public signup in the Supabase dashboard, or add a trigger/Edge Function so only allowlisted emails can register.

Document the cutover in `docs/hosting.md` before deploying.

---

### HIGH — Partner passwords are not security

**Files:** `lib/partner-auth.ts`, `components/CurrentPartnerProvider.tsx`, `components/PartnerGate.tsx`

Partner passwords are hardcoded in source (`panda` → `panda`, `henne` → `henne`). They ship in the JavaScript bundle.

Session is `localStorage` only. Anyone can run `localStorage.setItem("liebeskarte-partner", "henne")` in DevTools to switch identity. This only affects UI filtering — combined with open RLS, it provides no real protection.

**Suggested fix:**

- Treat Supabase login as the real auth boundary.
- Map each authenticated user to a partner (`panda` / `henne`) via a `profiles` table or JWT custom claim.
- Keep the partner UX (who is viewing, personal memory defaults) but derive partner from the signed-in user, not a client password.
- If a lightweight gate is still desired pre-login, use server-validated secrets (env vars checked in a Route Handler), not hardcoded client maps.

---

### HIGH — Personal memories and private journals not enforced in RLS

**Files:** `lib/memory-visibility.ts`, `lib/useMemories.ts`, `supabase/schema.sql`

Client-side helpers filter what each partner sees:

- `visibility = 'personal'` → only `owner` matches current partner
- Journal columns filtered by `journal_*_shared` flags in UI components

Authenticated couple policies only check `is_couple_member()`. Either allowlisted user can `select *` on all rows, including the other partner’s personal memories and unshared journal text, via direct Supabase API calls.

**Suggested fix:**

- Add RLS (or security-barrier views) that enforce:
  - Shared memories visible to both partners
  - Personal memories visible only when `owner` matches the viewer’s partner identity
  - Journal columns redacted or row-filtered when `journal_*_shared` is false for the other partner
- Optionally filter `photos.hidden` at the query layer when not in “show hidden” mode (today: client filter only)
- Requires a stable way to know “current partner” in Postgres (profile table linked to `auth.users`)

---

### MEDIUM — Allowlist not enforced at signup

**Files:** `supabase/schema.sql`, `lib/auth.tsx`

`is_couple_member()` checks `couple_allowlist` by JWT email. `signUp()` does not verify the email is on the allowlist before creating an account.

**Suggested fix:**

- Disable public signup in Supabase, or
- Add a `before insert` trigger on `auth.users` / signup hook that rejects non-allowlisted emails

---

### MEDIUM — Storage RLS is bucket-wide

**Files:** `supabase/schema.sql`

Authenticated storage policies only require `bucket_id = 'memory-photos' AND is_couple_member()`. No path or memory ownership checks. Any couple member can read/upload/delete any object in the bucket.

**Suggested fix:**

- Tie storage paths to memory ownership (path prefix `{memory_id}/...` already used in `lib/db.ts`)
- Add policies that verify the user can access the referenced memory before read/write/delete

---

### MEDIUM — Middleware not wired

**Files:** `proxy.ts`, `utils/supabase/middleware.ts`

`proxy.ts` exports a session-refresh handler but Next.js will not run it without a root `middleware.ts` that delegates to it. When auth is enabled, cookie/session refresh may fail silently.

**Suggested fix:**

- Add `middleware.ts` at the web app root that imports and calls the existing middleware helper
- Verify session refresh on protected routes after enabling auth

---

### MEDIUM — No upload size or MIME enforcement server-side

**Files:** `lib/db.ts` (`savePhoto`)

Uploads use client-provided `contentType` and have no size cap. Storage policies do not restrict file types.

**Suggested fix:**

- Client: max file size before upload, reject non-images
- Storage: bucket file size limit in Supabase dashboard
- Longer term: server-side validation via Edge Function or server action

---

### LOW — No security headers

**Files:** `next.config.ts`

Config is empty — no CSP, HSTS, or related headers.

**Suggested fix:** Add headers in `next.config.ts` when moving toward production.

---

### LOW — Signed URLs (24h TTL)

**Files:** `lib/db.ts` (`signedUrl`)

Photos use 24-hour signed URLs regenerated on every load. URLs are shareable for their lifetime. Acceptable for a private couple app if auth/RLS is tight; document the tradeoff.

---

### LOW — Debug logging exposes memory metadata

**Files:** `app/MapPageClient.tsx`, `lib/useMemories.ts`

Console logs include memory counts and load events. Remove before public deploy.

---

## Environment variables (names only)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public — embedded in client |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public — must rely on RLS, not secrecy |

Migration scripts use additional names in `.env.migrate.example` (`NEW_DATABASE_URL`, service role keys, etc.). Those must never ship to the client or Vercel production env unless required for a one-off migration.

---

## Pre-deploy checklist

- [ ] `AUTH_ENABLED = true`
- [ ] Open anon policies dropped; anon grants revoked
- [ ] Real emails in `couple_allowlist`
- [ ] Public signup disabled or allowlist-enforced
- [ ] Middleware wired for session refresh
- [ ] Partner identity from auth, not client password
- [ ] Personal memory / journal privacy in RLS
- [ ] Hardcoded partner passwords removed or replaced
