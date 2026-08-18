# Product Review

Gaps between what the app delivers, what docs promise, and what would complete the couple’s journal experience.

---

## Current state — shipped flows

| Flow | Route / entry | Key files | Status |
|------|---------------|-----------|--------|
| Partner gate | App shell | `PartnerGate.tsx`, `CurrentPartnerProvider.tsx` | Working — client password |
| Map | `/` | `MapPageClient.tsx`, `MapCanvas.tsx` | Working — pins, journey, layers, add via map click, empty CTA |
| Gallery wall | `/?view=gallery` | `GalleryCanvas.tsx` | Working — shuffle, reduced motion |
| Memory CRUD | Map / timeline edit | `AddMemoryForm.tsx`, `lib/db.ts` | Working — geocode, dual journals, HEIC |
| Memory panel | Map / gallery | `MemoryCard.tsx`, `MemoryStack.tsx` | Working — bottom sheet / side panel |
| Timeline | `/timeline` | `TimelineJourney.tsx`, `TimelineCard.tsx` | Working — year groups, edit, view on map |
| Album | `/album` | `AlbumGrid.tsx` | Working — filters, lightbox |
| Settings | `/settings` | `PhotoManager.tsx`, `ShowHiddenPhotosSetting.tsx` | Working — partner switch, hidden photos, shortcuts |
| Confirm | Deletes / switch | `ConfirmDialog.tsx` | Working — Warm Atelier dialog |
| Realtime | `useMemories` | `lib/useMemories.ts` | Working — reload on `memories` / `photos` changes |
| Supabase backend | — | `supabase/schema.sql`, `lib/db.ts` | Working — Postgres + Storage |
| Supabase login | — | `AuthGate.tsx`, `lib/auth.tsx` | Built but **disabled** |

---

## Findings

### HIGH — Export / import documented but not implemented

**Status:** Claims removed from README, hosting, concept, and roadmap. **Not implemented** (deferred).

**Files:** previously `README.md`, `docs/hosting.md`, `docs/concept.md`, `docs/roadmap.md`

No Settings UI or `lib/backup.ts`. Docs now say JSON export / import is not built yet.

**Later fix:** Settings section to export memories + photo metadata (and optionally download photos) as JSON; import with merge/replace confirmation.

---

### MEDIUM — README omits routes and features

**Status:** Done.

README pages table lists `/`, `/?view=gallery`, `/timeline`, `/album`, and `/settings`. Features list includes gallery, album, and live reload.

---

### MEDIUM — No first-run / empty map experience

**Status:** Done.

Empty map shows “Add your first memory”. Development builds also offer “Preview sample journey” from `DEMO_MEMORIES` (`lib/sample-data.ts`, `lib/seed-demo.ts`).

---

### MEDIUM — No realtime sync between partners

**Status:** Done.

`useMemories` subscribes to `memories` and `photos` and silently reloads. Existing projects need [`supabase/migrate-realtime.sql`](../../supabase/migrate-realtime.sql).

---

### LOW — Onboarding wizard not built

**Status:** Deferred (Phase 5). Roadmap updated.

“Where we met” guided flow, gift mode, QR — not in codebase.

---

### LOW — Theme picker / `/styles` not in app

**Status:** Done as documentation.

`docs/design-system.md` now matches the single Warm Atelier theme. No picker.

---

### LOW — Deletes use native confirm()

**Status:** Done.

`ConfirmDialog` + `useConfirm()` replace `window.confirm` on memory delete, photo delete, and partner switch.

---

### LOW — Keyboard shortcuts incomplete

**Status:** Done.

Map: Esc closes card/editor, N adds a memory. Stacks and lightbox keep arrow keys. Settings lists current shortcuts.

---

### LOW — “Profile” is partner identity only

**Status:** Deferred until auth is enabled.

Partner = `panda` | `henne` via password gate. No avatar or display name settings.

---

## Promised vs built

| Feature | Documented in | Built? |
|---------|---------------|--------|
| Map + pins + journey | README, concept | Yes |
| Timeline | README, concept | Yes |
| Album | README | Yes |
| Settings / photo manager | README | Yes |
| Gallery view | README | Yes |
| Place search (Nominatim) | README, roadmap | Yes |
| Cloud Supabase storage | README, hosting | Yes |
| Live reload | README, roadmap | Yes |
| Themed confirm | design-system | Yes |
| Keyboard shortcuts | Settings, roadmap | Yes |
| Export / import JSON | roadmap (open) | **No** |
| Supabase auth (production) | hosting | Prepared, off |
| Theme picker / `/styles` | design-system (historical) | No — single theme |
| Onboarding wizard | roadmap Phase 5 | No — deferred |

---

## Suggested product priorities

1. ~~Map empty state + optional demo seed~~
2. ~~Update README with full route list~~
3. ~~Realtime reload~~
4. ~~Themed delete confirmation~~
5. Export / import when a file backup is needed
6. Onboarding / gift mode / profile (after auth)
