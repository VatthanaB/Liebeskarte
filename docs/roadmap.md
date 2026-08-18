# Liebeskarte — Roadmap

## Phase 1 — Foundation (current)

- [x] Concept, design system, and roadmap docs
- [x] Theme mock page (`/styles`) — compare 4 visual directions
- [x] Theme system with localStorage persistence
- [x] Map view with MapLibre, Auckland default, world scope
- [x] Memory CRUD with Dexie (IndexedDB)
- [x] Photo attachments (local blobs)
- [x] Timeline view
- [x] Export / import backup

## Phase 2 — Polish

- [ ] Place search via Nominatim geocoding
- [ ] Fly-to animation when selecting a memory
- [ ] "Fit all pins" button
- [ ] Empty state with sample Auckland memory
- [x] Mobile-responsive memory card (bottom sheet)
- [ ] Keyboard shortcuts (Esc close card, N new memory)
- [ ] Loading states and error handling

## Phase 3 — Shared Experience

- [ ] Supabase backend (auth, Postgres, Storage)
- [ ] Two-person couple account (invite link)
- [ ] Real-time sync when either partner adds/edits
- [ ] Conflict resolution (last-write-wins or merge journal)
- [ ] Partner attribution on entries ("Added by…")

## Phase 4 — Delight

- [ ] Anniversary reminders (email or push)
- [ ] Year in review — auto-generated recap
- [ ] Printed atlas PDF export (architect-friendly layout)
- [ ] Voice memo attachments
- [ ] Rich text journal (markdown)
- [ ] Tags and filtering
- [ ] Constellation animation mode (Night theme)

## Phase 5 — Gift Mode

- [ ] Onboarding wizard for first-time setup
- [ ] Pre-seed with "where we met" guided flow
- [ ] Presentation mode — fullscreen slideshow of memories
- [ ] QR code to open on partner's phone
- [ ] Optional password lock (local PIN)

## Tech Stack

| Layer | v1 | v2+ |
|-------|----|-----|
| Framework | Next.js 16 App Router | Same |
| Styling | Tailwind CSS v4 | Same |
| Map | MapLibre GL + free vector tiles | Same |
| Storage | Supabase Postgres + Storage | Same |
| Geocoding | Nominatim (OpenStreetMap) | Same |
| Hosting | Vercel + custom domain | Same |
| Auth | Supabase (couple allowlist) | Same |

## Standing rules

- **All new UI is mobile-first** — must work on a 375px viewport before shipping (see `docs/design-system.md` → Responsive)

## Non-Goals (v1)

- No user accounts or login
- No social sharing or public URLs
- No paid map tile APIs
- No native mobile app (PWA optional later)
