# Solution Review

**Liebeskarte** — architecture and improvement backlog from a full review of the `web/` app (August 2026).

This folder documents findings and **implementation status** per category. Use it as a backlog for remaining work (security, product, quality).

---

## Implementation progress

| Category | Doc | Status |
|----------|-----|--------|
| Security | [security.md](./security.md) | **Implemented** — apply `schema.sql` + seed users on the live project |
| Reliability & performance | [reliability-and-performance.md](./reliability-and-performance.md) | **Mostly done** — batch photos, errors, map empty/loading, upload limits, lazy images |
| Mobile & accessibility | [mobile-and-accessibility.md](./mobile-and-accessibility.md) | **Done** — 44px targets, focus traps, skip link, lightbox safe areas |
| Product gaps | [product.md](./product.md) | **Mostly done** — empty map, README, realtime, confirms, shortcuts, onboarding. Export/import still deferred |
| Quality & tests | [quality.md](./quality.md) | Not started — Vitest, CI, docs drift |

---

## What is working well

The core product is in good shape for a private couple’s journal:

| Area | Notes |
|------|-------|
| **Domain model** | Partners (`panda` / `henne`), shared vs personal memories, dual journals, hidden photos — see `lib/types.ts` |
| **Data boundary** | All Supabase CRUD in `lib/db.ts`; shared hook `lib/useMemories.ts` across map, timeline, album, settings |
| **Routes** | `/` (map + gallery), `/timeline`, `/album`, `/settings`, `/onboarding` |
| **Mobile patterns** | Bottom sheets on phone, side panels on `md+`, safe-area padding, no `100vw` — see `app/MapPageClient.tsx` |
| **Map** | Leaflet dynamically imported; layer switch; journey line; fly-to via `?memory=` |
| **Photos** | HEIC conversion deferred; Supabase Storage with signed URLs |
| **TypeScript** | Strict mode; typed domain model; minimal `any` |
| **Auth** | Username `panda` / `henne` → dummy email + Supabase password; partner from `profiles` |

---

## Architecture at a glance

```
Browser (client components)
  → lib/db.ts (Supabase browser client)
  → Postgres (memories, photos) + Storage (memory-photos)

Auth gate (username panda/henne + password)
Partner from profiles table (not localStorage)
```

There are **no API routes** and **no server actions**. Every read and write goes from the browser with the public anon/publishable key. Security must come from RLS — and open anon policies are active while auth is off.

---

## Priority overview

| Priority | Category | Doc |
|----------|----------|-----|
| **P0** | Security — do before any public URL | [security.md](./security.md) |
| **P1** | Reliability and performance | [reliability-and-performance.md](./reliability-and-performance.md) |
| **P2** | Mobile, accessibility, product polish | [mobile-and-accessibility.md](./mobile-and-accessibility.md), [product.md](./product.md) |
| **P3** | Quality, tests, docs drift | [quality.md](./quality.md) |

Suggested order when implementing:

1. ~~Enable auth, drop open anon RLS, wire session refresh~~ ✓ — run `schema.sql` on the live project
2. ~~Map Supabase users to partners; enforce personal/journal privacy in Postgres~~ ✓
3. ~~Batch photo loading, surface errors, map empty/loading states~~ ✓
4. ~~Tap targets, a11y, product polish~~ ✓ — export/import still deferred
5. Vitest, CI, sync stale docs

Do **not** treat P0 as a single PR with everything else. Auth + RLS is a coordinated cutover (app flag, SQL, allowlist, middleware).

---

## Category index

| File | Contents |
|------|----------|
| [security.md](./security.md) | Open anon RLS, disabled auth, partner passwords, client-only privacy, middleware |
| [reliability-and-performance.md](./reliability-and-performance.md) | N+1 photos, errors, map loading — **mostly implemented** |
| [mobile-and-accessibility.md](./mobile-and-accessibility.md) | 44px targets, focus traps, skip link — **implemented** |
| [product.md](./product.md) | Product polish — **mostly implemented**; export/import still open |
| [quality.md](./quality.md) | Zero tests, dead code, stale concept/roadmap/design-system |

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [../hosting.md](../hosting.md) | Deploy steps (auth-off mode; realtime SQL for existing projects) |
| [../concept.md](../concept.md) | Product vision |
| [../roadmap.md](../roadmap.md) | Done vs later phases |
| [../design-system.md](../design-system.md) | Warm Atelier tokens and responsive rules |
