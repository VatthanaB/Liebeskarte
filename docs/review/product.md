# Product Review

Gaps between what the app delivers, what docs promise, and what would complete the couple’s journal experience.

---

## Current state — shipped flows

| Flow | Route / entry | Key files | Status |
|------|---------------|-----------|--------|
| Partner gate | App shell | `PartnerGate.tsx`, `CurrentPartnerProvider.tsx` | Working — client password |
| Map | `/` | `MapPageClient.tsx`, `MapCanvas.tsx` | Working — pins, journey, layers, add via map click |
| Gallery wall | `/?view=gallery` | `GalleryCanvas.tsx` | Working — shuffle, reduced motion |
| Memory CRUD | Map / timeline edit | `AddMemoryForm.tsx`, `lib/db.ts` | Working — geocode, dual journals, HEIC |
| Memory panel | Map / gallery | `MemoryCard.tsx`, `MemoryStack.tsx` | Working — bottom sheet / side panel |
| Timeline | `/timeline` | `TimelineJourney.tsx`, `TimelineCard.tsx` | Working — year groups, edit, view on map |
| Album | `/album` | `AlbumGrid.tsx` | Working — filters, lightbox |
| Settings | `/settings` | `PhotoManager.tsx`, `ShowHiddenPhotosSetting.tsx` | Working — partner switch, hidden photos |
| Supabase backend | — | `supabase/schema.sql`, `lib/db.ts` | Working — Postgres + Storage |
| Supabase login | — | `AuthGate.tsx`, `lib/auth.tsx` | Built but **disabled** |

---

## Findings

### HIGH — Export / import documented but not implemented

**Files:** `README.md`, `docs/hosting.md`, `docs/concept.md`, `docs/roadmap.md`

README lists “Export / import — optional JSON backup”. Hosting says “Export still works as an extra backup file.” Roadmap marks export/import as done. **No Settings UI or `lib/backup.ts` exists** — only unrelated `JSON.stringify` in `lib/show-hidden-photos.ts`.

**Suggested fix (pick one):**

- **Implement:** Settings section to export all memories + photo metadata (and optionally download photos) as JSON; import with merge/replace confirmation
- **Or document:** Remove export/import claims from README, hosting, concept, roadmap until built

---

### MEDIUM — README omits routes and features

**Files:** `README.md`

README pages table lists only `/` and `/timeline`. Missing:

- `/album`
- `/settings`
- Gallery view (`/?view=gallery`)

**Suggested fix:** Update README pages table and features list (or link to `docs/review/README.md` for full route map).

---

### MEDIUM — No first-run / empty map experience

**Files:** `app/MapPageClient.tsx`, `lib/sample-data.ts`

Timeline, album, and gallery have empty states. Map shows default Auckland with no pins and no guidance when `memories.length === 0`.

`SAMPLE_MEMORIES` in `lib/sample-data.ts` is unused (~270 lines); only `AUCKLAND_CENTER` is referenced.

**Suggested fix:**

- Map empty state with “Add your first memory” CTA
- Optional: one-click demo seed from trimmed sample data (dev or first-run only)

---

### MEDIUM — No realtime sync between partners

**Files:** `docs/roadmap.md` Phase 3

Both partners share one Supabase project but must refresh to see each other’s edits. No Supabase Realtime subscriptions.

**Suggested fix:** Subscribe to `memories` and `photos` changes; call `reload()` from `useMemories` on insert/update/delete.

---

### LOW — Onboarding wizard not built

**Files:** `docs/roadmap.md` Phase 5

“Where we met” guided flow, gift mode, QR — not in codebase.

**Suggested fix:** Defer or add post-auth onboarding route when ready.

---

### LOW — Theme picker / `/styles` not in app

**Files:** `docs/design-system.md`, `docs/roadmap.md`

Docs reference four themes and a `/styles` mock page. App uses single hardcoded theme in `lib/themes.ts` + `ThemeProvider.tsx`.

**Suggested fix:** Update design-system doc to match single theme, or implement theme picker if still desired.

---

### LOW — Deletes use native confirm()

**Files:** `app/MapPageClient.tsx`, `app/timeline/page.tsx`, `components/PhotoManager.tsx`, `components/PartnerIndicator.tsx`

Functional but off-brand vs Warm Atelier UI.

**Suggested fix:** Themed confirm dialog component.

---

### LOW — Keyboard shortcuts incomplete

**Files:** `docs/roadmap.md`

Roadmap mentions Esc close card, N new memory. Partial coverage exists (lightbox, memory stack). No global shortcuts on map.

**Suggested fix:** Document current shortcuts; add optional map shortcuts when polish phase starts.

---

### LOW — “Profile” is partner identity only

No user accounts UI beyond optional Supabase auth. Partner = `panda` | `henne` via password gate. No avatar or display name settings.

**Suggested fix:** After auth enablement, profile row in settings (email, partner mapping).

---

## Promised vs built

| Feature | Documented in | Built? |
|---------|---------------|--------|
| Map + pins + journey | README, concept | Yes |
| Timeline | README, concept | Yes |
| Album | — (not in README) | Yes |
| Settings / photo manager | — (not in README) | Yes |
| Gallery view | — (not in README) | Yes |
| Place search (Nominatim) | README, roadmap | Yes |
| Cloud Supabase storage | README, hosting | Yes |
| Export / import JSON | README, hosting, roadmap | **No** |
| Supabase auth (production) | hosting | Prepared, off |
| Realtime sync | roadmap | No |
| Theme picker / `/styles` | design-system, roadmap | No |
| Onboarding wizard | roadmap | No |

---

## Suggested product priorities

1. Resolve export/import — implement or remove claims
2. Map empty state + optional demo seed
3. Update README with full route list
4. Realtime reload (if both partners use app actively)
5. Themed delete confirmation
6. Onboarding / gift mode (later)
