# Quality Review

Findings for tests, maintainability, dead code, and documentation drift.

---

## Current state

- **Tests:** None. No `*.test.*` / `*.spec.*` files. `package.json` has no test script — only `dev`, `build`, `start`, `lint`, and migration scripts.
- **CI:** No GitHub Actions or other pipeline.
- **Lint:** ESLint via `eslint-config-next`.
- **TypeScript:** `strict: true` in `tsconfig.json`; domain types in `lib/types.ts`.
- **Docs:** `concept.md`, `roadmap.md`, and `design-system.md` describe an earlier local-first app (Dexie, MapLibre, `/styles`) while the codebase uses Supabase, Leaflet, and a single theme.

---

## Findings

### HIGH — Zero automated test coverage

**Files:** `package.json`, entire `web/` tree

No unit, integration, or e2e tests. Regressions in visibility logic, geocoding, or memory grouping would only be caught manually.

**Suggested fix:**

1. Add **Vitest** for pure functions:
   - `lib/memory-visibility.ts`
   - `lib/location-groups.ts`
   - `lib/geocode.ts` (mock fetch)
2. Add **Playwright** smoke test:
   - Partner gate → add memory → appears on map/timeline
   - 375px viewport — no horizontal scroll
3. Add `npm test` and CI workflow (lint + test on push)

---

### MEDIUM — Documentation drift vs codebase

**Files:** `docs/roadmap.md`, `docs/concept.md`, `docs/design-system.md`, `README.md`

| Doc says | Code actually has |
|----------|-------------------|
| Dexie / IndexedDB local storage | Supabase Postgres + Storage |
| MapLibre GL | Leaflet + raster tiles (`lib/map-layers.ts`) |
| `/styles` theme mock, 4 themes | Single theme in `lib/themes.ts` |
| Export/import done (Phase 1) | Not implemented |
| Phase 2: Nominatim, fly-to, fit-all unchecked | Many Phase 2 items are done |
| Phase 3: Supabase unchecked | Supabase is primary backend |
| README: only `/` and `/timeline` | Also `/album`, `/settings`, gallery view |
| concept: JSON backup as v1 source of truth | Cloud is source of truth (`hosting.md`) |

**Suggested fix:**

- Rewrite roadmap phases to reflect current state and move completed items to a “Done” section
- Update concept storage section to Supabase-only
- Update design-system to single theme + Leaflet (or note MapLibre as abandoned)
- Sync README routes and features
- This review folder captures gaps until those docs are updated

---

### MEDIUM — Dead / unused code

| Item | File | Notes |
|------|------|-------|
| `SAMPLE_MEMORIES` | `lib/sample-data.ts` | Large array unused; only `AUCKLAND_CENTER` imported |
| Server Supabase client | `utils/supabase/server.ts` | Never imported; prepared for Server Components |
| Legacy `journal` column | DB + `lib/db.ts` | Migrated to dual journals; column kept for compatibility |

**Suggested fix:**

- Trim `sample-data.ts` to exports actually used, or wire sample as onboarding seed
- Keep `server.ts` if planning server actions; otherwise delete or document intent in a comment at top of file
- Plan eventual drop of legacy `journal` column after data migration confirmed

---

### MEDIUM — Duplication in UI patterns

**Files:** `app/MapPageClient.tsx`, `app/timeline/page.tsx`, filter chips in `AlbumGrid.tsx` / `PhotoManager.tsx`

- Backdrop + bottom sheet / side panel repeated across map and timeline edit
- Filter chip class strings duplicated

**Suggested fix:**

- Extract `OverlaySheet` or `ResponsivePanel` component
- Shared `FilterChip` component with theme tokens

---

### LOW — Debug logging in production paths

**Files:** See `reliability-and-performance.md`

**Suggested fix:** Remove or dev-gate `[atlas:*]` logs before treating app as production-ready.

---

### LOW — Date formatting scattered

**Files:** `lib/photos.ts`, `MemoryCard.tsx`, inline helpers in timeline/album

**Suggested fix:** Centralize date display helpers in `lib/dates.ts` or extend `lib/photos.ts`.

---

### LOW — Geocode result keys use array index

**Files:** `components/AddMemoryForm.tsx`

Search results use `key={i}` — can cause React reconciliation issues if list order changes.

**Suggested fix:** Stable key from place id or lat/lng + display name hash.

---

### LOW — No CI lint gate documented

**Files:** `docs/hosting.md`

Deploy docs cover Vercel env vars but not pre-merge checks.

**Suggested fix:** Add “Before merge: `npm run lint` (+ `npm test` when added)” to hosting or a new `docs/contributing.md`.

---

## Test priority matrix

| Area | Risk if broken | Test type | File |
|------|----------------|-----------|------|
| Personal vs shared visibility | Privacy leak in UI | Unit | `lib/memory-visibility.ts` |
| Location clustering | Wrong map stacks | Unit | `lib/location-groups.ts` |
| Geocode parsing | Bad pin placement | Unit | `lib/geocode.ts` |
| Memory save/load mapping | Data corruption | Unit (mock Supabase) | `lib/db.ts` |
| Partner gate → add memory | Core flow | E2E | Playwright |
| 375px layout | Mobile rule violation | E2E viewport | Playwright |

---

## Docs maintenance checklist

When implementing features from other review docs, update:

- [ ] `README.md` — routes, features, export status
- [ ] `docs/roadmap.md` — phase checkboxes and stack table
- [ ] `docs/concept.md` — storage and backup story
- [ ] `docs/design-system.md` — map library and theme count
- [ ] `docs/hosting.md` — auth-on checklist (align with `review/security.md`)

---

## Suggested implementation order

1. Vitest + tests for `memory-visibility`, `location-groups`, `geocode`
2. Strip dead `SAMPLE_MEMORIES` or use for onboarding
3. CI: lint (+ test when added)
4. Batch doc sync (roadmap, concept, design-system, README)
5. Extract shared overlay component when touching map/timeline UI
