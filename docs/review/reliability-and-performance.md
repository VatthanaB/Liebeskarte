# Reliability and Performance Review

Findings for data loading, error handling, images, uploads, and production noise.

---

## Implementation status

Last updated August 2026.

| Finding | Severity | Status |
|---------|----------|--------|
| N+1 photo loading | High | **Done** — single `getAllPhotos()` in `useMemories` |
| Errors swallowed in useMemories | Medium | **Done** — `error` state + `DataErrorBanner` |
| AddMemoryForm save failures | Medium | **Done** — `catch` + inline message |
| Map loading / empty state | Medium | **Done** — overlay + first-memory CTA |
| Unoptimized `<img>` | Medium | **Partial** — `loading="lazy"` added; `next/image` not yet |
| Signed URL churn | Medium | **Done** — in-memory cache with refresh buffer |
| Photo upload limits | Medium | **Done** — `lib/photo-limits.ts`, 15 MB |
| PhotoManager errors | Low | **Done** — load/action error banners |
| Nominatim from browser | Low | Open |
| Debug console noise | Low | **Done** — removed from map/page/theme/hook |
| Heavy first-load JS | Low | Open |
| MapCanvas window resize | Low | **Done** — `ResizeObserver` (see mobile review) |

---

## Current state (at original review)

- **Data loading:** `useMemories` loads all memories, filters by partner in JS, then fetches photos **per memory** in a sequential loop.
- **Signed URLs:** Every photo gets a new 24h signed URL on each load (`lib/db.ts`).
- **Errors:** Most failures are logged to `console.error` only; UI rarely shows them.
- **Map view:** No loading overlay while memories fetch; no empty-state CTA when there are zero pins.
- **Images:** Raw `<img>` tags throughout; no lazy loading or `next/image`.
- **Uploads:** Filename sanitized client-side; no max size; `contentType` from the File API.
- **Debug logs:** `[atlas:*]` prefixes in map, theme, and data hooks.

Note: `getAllMemories()` in `lib/db.ts` already batches photo **IDs** in one query; the N+1 problem is in `useMemories` calling `getPhotosForMemory` (which re-queries rows and signs URLs) once per visible memory.

---

## Findings

### HIGH — N+1 photo loading

**Files:** `lib/useMemories.ts` (lines 35–41), `lib/db.ts` (`getPhotosForMemory`, `getAllPhotos`)

For each visible memory, the hook awaits `getPhotosForMemory(memory.id)`, which runs a separate `photos` query and `Promise.all` of signed URL generation. With 50 memories this is 50 round trips plus 50×N signing calls.

**Suggested fix:**

- Add `getPhotosForMemories(ids: string[])` or use `getAllPhotos()` once and group by `memoryId` in the hook
- Or extend `getAllMemories` to return photo URLs in one pass
- Run independent signing in parallel with `Promise.all` if batching queries is not enough

---

### MEDIUM — Errors swallowed in useMemories

**Files:** `lib/useMemories.ts`

On failure, the hook logs and leaves `memories` empty with no `error` state. Users see an empty map/timeline with no explanation.

**Suggested fix:**

- Return `{ memories, loading, error, photoUrlMap, reload }`
- Show a dismissible error banner on map, timeline, album, and settings when `error` is set

---

### MEDIUM — AddMemoryForm save failures unhandled

**Files:** `components/AddMemoryForm.tsx` (`handleSubmit`)

`handleSubmit` uses `try/finally` without `catch`. Supabase save/upload failures become unhandled promise rejections; the form closes `saving` state but shows no message.

**Suggested fix:**

- Add `catch` with inline error text (e.g. “Couldn’t save — check connection and try again”)
- Optionally keep the form open with entered data intact

---

### MEDIUM — Map has no loading or empty state

**Files:** `app/MapPageClient.tsx`, `app/loading.tsx`

Route-level `loading.tsx` covers navigation; the map itself renders immediately with zero pins while `useMemories.loading` is true. Timeline, album, and gallery show loaders or empty states; the map does not.

**Suggested fix:**

- Overlay `LoveLoading` while `loading` on map view
- When `!loading && memories.length === 0`, show a CTA (“Add your first memory”) linking to add flow

---

### MEDIUM — All photos use unoptimized `<img>`

**Files:** `components/MemoryCard.tsx`, `components/AlbumGrid.tsx`, `components/GalleryCanvas.tsx`, `components/PhotoLightbox.tsx`, others

No `loading="lazy"`, no responsive sizes, no `next/image`. Large albums increase bandwidth and layout shift.

**Suggested fix:**

- Short term: `loading="lazy"` on below-the-fold images
- Longer term: `next/image` with Supabase remote patterns in `next.config.ts`

---

### MEDIUM — Signed URL churn

**Files:** `lib/db.ts` (`signedUrl`, 86400s TTL)

Every page load regenerates signed URLs for every photo. Tabs open longer than 24h may show broken images until reload.

**Suggested fix:**

- Cache URLs in memory with expiry buffer (refresh at 23h)
- Or expose `reload` when image `onError` fires
- Document expected behavior for long sessions

---

### MEDIUM — No photo upload limits

**Files:** `lib/db.ts` (`savePhoto`), `components/AddMemoryForm.tsx`

No max file size, no server-side MIME check. `contentType` comes from the client File object.

**Suggested fix:**

- Reject files over e.g. 10–15 MB before upload
- Validate extension and MIME; rely on HEIC conversion path for Apple photos
- Set Supabase bucket max object size

---

### LOW — PhotoManager errors logged only

**Files:** `components/PhotoManager.tsx`

Load, toggle hidden, and delete paths catch and `console.error` without user-visible feedback.

**Suggested fix:** Inline error state per action or toast/banner pattern shared with other pages.

---

### LOW — Nominatim geocoding from browser

**Files:** `lib/geocode.ts`, `components/AddMemoryForm.tsx`

Direct client calls to OpenStreetMap Nominatim. No caching; subject to rate limits and CORS/policy changes.

**Suggested fix:** Optional server proxy route with caching if usage grows.

---

### LOW — Production console noise

**Files:**

| File | Examples |
|------|----------|
| `app/MapPageClient.tsx` | `[atlas:page] memories`, mount logs |
| `components/MapCanvas.tsx` | layer, container px, marker effect |
| `lib/useMemories.ts` | load start/done |
| `components/ThemeProvider.tsx` | render/mount |

**Suggested fix:** Remove or gate behind `process.env.NODE_ENV === "development"`.

---

### LOW — Heavy first-load JS (~791 KB uncompressed on `/`)

**Source:** Next.js build diagnostics

Map route pulls Leaflet + page client + shared chunks. Leaflet is dynamically imported (good); CSS is global in `app/globals.css`.

**Suggested fix:**

- Code-split gallery/timeline-only components where possible
- Consider dynamic Leaflet CSS import on map route only

---

### LOW — Map sizing via window dimensions

**Files:** `components/MapCanvas.tsx`

Uses `window.innerWidth` / `innerHeight` for invalidateSize in places. Can mis-size with mobile browser chrome vs `h-dvh` parent.

**Suggested fix:** Prefer `ResizeObserver` on the map container or Leaflet’s built-in resize handling tied to the parent element.

---

## Suggested implementation order

1. Batch photo fetch + parallel signed URLs (biggest perf win)
2. `error` state in `useMemories` + banner component
3. `catch` in AddMemoryForm + PhotoManager feedback
4. Map loading overlay + empty state
5. `loading="lazy"` on images
6. Upload size limits
7. Strip debug logs
