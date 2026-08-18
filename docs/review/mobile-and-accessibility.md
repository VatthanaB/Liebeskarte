# Mobile and Accessibility Review

Findings against the project’s mobile-responsive rules (375px viewport, 44px tap targets, safe areas, bottom sheets) and general a11y.

Reference: workspace rule `.cursor/rules/mobile-responsive.mdc`, `docs/design-system.md` → Responsive.

---

## Implementation status

Last updated after mobile/a11y pass (August 2026). Cross-reference [reliability-and-performance.md](./reliability-and-performance.md) for overlapping items.

| Finding | Severity | Status | Notes |
|---------|----------|--------|-------|
| Tap targets below 44px | Medium | **Done** | NavBar, MapCanvas, GalleryCanvas shuffle, add FAB, AddMemoryForm photo deletes |
| AddMemoryForm close control | Medium | **Done** | `aria-label`, `min-h-11`, focus ring, `role="dialog"` |
| PhotoLightbox safe-area top | Medium | **Done** | Top/right chrome uses `env(safe-area-inset-*)`; 44px buttons |
| Gallery shuffle vs memory sheet | Medium | **Done** | Shuffle hidden whenever `selectedId` is set |
| Modals lack focus trap | Medium | **Done** | `lib/useFocusTrap.ts` on AddMemoryForm, PhotoLightbox |
| Map markers small hit area | Low | **Done** | 44px transparent hit target; visual pin unchanged |
| Timeline year rail `aria-hidden` | Low | **Done** | `<nav aria-label>` + `aria-current`; removed `aria-hidden` |
| LoveLoading screen readers | Low | **Done** | `sr-only` “Loading”, `aria-busy`, `aria-label` |
| No skip link | Low | **Done** | Skip link in `app/layout.tsx` → `#main-content` |
| Inconsistent alt text | Low | **Partial** | Gallery, timeline thumbs, lightbox improved; form previews stay decorative |
| ShowHiddenPhotos switch semantics | Low | **Done** | `aria-labelledby` on switch; label wrapper removed |
| MapCanvas window resize | Low | **Done** | Fixed in reliability pass (`ResizeObserver`, no `window.inner*` sizing) |

### Already passing before this pass

- Bottom sheet / side panel pattern (`MapPageClient`, timeline editor)
- Safe areas on nav, map controls, bottom sheets, timeline FAB
- No `100vw` / `w-screen`
- `h-dvh`, `max-h-[70vh]` overlays
- Album filter chips at 44px
- `prefers-reduced-motion` in gallery and loading
- Keyboard: lightbox arrows (via focus trap + handlers), memory stack

### Related work in other review docs

| Item | Doc | Status |
|------|-----|--------|
| Map loading overlay + empty state | reliability-and-performance | **Done** |
| Error banners (`DataErrorBanner`) | reliability-and-performance | **Done** |
| `loading="lazy"` on photos | reliability-and-performance | **Done** |

---

## Current state (baseline at review time)

**Strengths:**

- Map memory panel uses bottom sheet on mobile, fixed side panel on `md+` — `app/MapPageClient.tsx`
- Safe-area padding on nav (`components/NavBar.tsx`), map controls (`components/MapCanvas.tsx`), timeline FAB
- No `100vw` or `w-screen` in source
- `h-dvh`, `w-full`, `max-h-[70vh]` on overlays
- Filter chips and nav rows use `flex-wrap` or scroll where needed
- Album captions visible on mobile (`opacity-100` base); hover enhancements from `md:`
- Widespread `aria-label` on map and gallery controls
- `prefers-reduced-motion` respected in gallery and loading
- Keyboard: lightbox Esc/arrows; memory stack arrow keys
- `lang="en"`, `viewportFit: "cover"` in `app/layout.tsx`

**Gaps (original review):** Many interactive controls used `h-8` (32px). Modals lacked focus traps. Some overlays missed safe-area top padding. — **Addressed in implementation status above.**

---

## Findings (original)

### MEDIUM — Tap targets below 44px minimum

**Rule:** Minimum 44px height/width for touch targets.

**Files and examples:**

| File | Control | Was |
|------|---------|-----|
| `components/NavBar.tsx` | Nav links, partner chip, menu toggle | `h-8`, `min-w-8` |
| `components/MapCanvas.tsx` | Layer, home, fit-all buttons | `h-8 w-8` |
| `components/GalleryCanvas.tsx` | Shuffle button | `h-8 w-8` |
| `components/AddMemoryForm.tsx` | Photo remove buttons | `h-5 w-5` |
| `app/MapPageClient.tsx` | Add-memory FAB | via NavBar |

**Fix applied:** `min-h-11 min-w-11` on primary controls; map markers use 44px hit wrapper.

---

### MEDIUM — AddMemoryForm close control

**Fix applied:** `aria-label="Close"`, 44px target, focus ring, dialog semantics.

---

### MEDIUM — PhotoLightbox missing safe-area top

**Fix applied:** Safe-area insets on close/nav; 44px buttons; focus trap.

---

### MEDIUM — Gallery shuffle overlaps memory sheet on mobile

**Fix applied:** `showShuffle = … && !selectedId` (all viewports).

---

### MEDIUM — Modals lack focus trap

**Fix applied:** `lib/useFocusTrap.ts` — AddMemoryForm, PhotoLightbox. Timeline edit uses AddMemoryForm trap.

---

### LOW — Map markers 28–36px

**Fix applied:** 44px button wrapper; visual pin size unchanged.

---

### LOW — Timeline year rail marked aria-hidden with buttons inside

**Fix applied:** `<nav aria-label="Jump to year">`, `aria-current`, 44px year buttons.

---

### LOW — LoveLoading and screen readers

**Fix applied:** Hidden “Loading” text + `aria-busy`.

---

### LOW — No skip link

**Fix applied:** `.skip-link` in `globals.css`, link in `app/layout.tsx`, `#main-content` wrapper.

---

### LOW — Inconsistent alt text

**Partial:** Meaningful alt on gallery frames, timeline/memory thumbs, lightbox. Form thumbnail previews remain `alt=""` (decorative in edit context).

---

### LOW — ShowHiddenPhotosSetting switch semantics

**Fix applied:** `aria-labelledby` linking heading + On/Off status.

---

### LOW — MapCanvas uses window dimensions for resize

**Done** in reliability pass — see [reliability-and-performance.md](./reliability-and-performance.md).

---

## Mobile checklist (from project rules)

| Check | Status |
|-------|--------|
| No horizontal scroll at 375px | Pass |
| Bottom sheet on mobile overlays | Pass |
| Safe areas on nav / bottom sheets / map controls / lightbox | Pass |
| All actions reachable without hover | Pass |
| 44px tap targets | Pass (primary chrome) |
| Overlays don’t cover critical controls | Pass (shuffle hidden when sheet open) |

---

## Remaining / optional follow-ups

- ~~Themed confirm dialog instead of `window.confirm()`~~ ✓ (`ConfirmDialog.tsx`)
- Broader alt-text audit for edit-form previews
- Focus trap on timeline backdrop click-only overlay (form trap covers focus today)
- Manual 375px QA pass on device or simulator

---

## Key files touched

| File | Change |
|------|--------|
| `lib/useFocusTrap.ts` | New focus-trap hook |
| `app/layout.tsx` | Skip link + `#main-content` |
| `app/globals.css` | `.skip-link`, `.sr-only` |
| `components/NavBar.tsx` | 44px nav + FAB |
| `components/MapCanvas.tsx` | 44px controls + marker hit area |
| `components/GalleryCanvas.tsx` | 44px shuffle; hide when selected |
| `components/AddMemoryForm.tsx` | Dialog a11y + close + photo deletes |
| `components/PhotoLightbox.tsx` | Safe areas + trap + 44px |
| `components/LoveLoading.tsx` | Loading label for AT |
| `components/TimelineJourney.tsx` | Year nav a11y |
| `components/ShowHiddenPhotosSetting.tsx` | Switch labelling |
| `components/MemoryCard.tsx`, `TimelineCard.tsx`, `GalleryCanvas.tsx` | Alt text |

---

## Suggested implementation order (completed)

1. ~~Bump nav + map + gallery controls to `min-h-11 min-w-11`~~
2. ~~AddMemoryForm close button (label + size)~~
3. ~~PhotoLightbox safe-area + button sizes~~
4. ~~Hide gallery shuffle when memory panel open~~
5. ~~Focus traps on modals~~
6. ~~Timeline year rail a11y~~
7. ~~Skip link + LoveLoading label~~
