# Liebeskarte, Roadmap

## Done

- [x] Concept, design system, and roadmap docs
- [x] Warm Atelier theme (single shipped theme)
- [x] Map view with Leaflet, Auckland default, world scope
- [x] Memory CRUD with Supabase Postgres
- [x] Photo attachments (Supabase Storage)
- [x] Timeline, album, gallery wall, and settings
- [x] Place search via Nominatim geocoding
- [x] Fly-to animation when selecting a memory
- [x] Map empty state with first-memory CTA (sample seed in development)
- [x] Mobile-responsive memory card (bottom sheet)
- [x] Keyboard shortcuts (Esc close, N new memory, arrows in stacks / lightbox)
- [x] Loading states and error handling
- [x] Themed confirm dialog
- [x] Supabase backend (Postgres + Storage; auth prepared but off)
- [x] Real-time reload when either partner adds or edits
- [x] Dual journals and partner switch (`panda` / `henne`)

## Still open

- [ ] Export / import JSON backup
- [ ] Couple login in production (`AUTH_ENABLED`, drop open anon RLS)
- [ ] Conflict resolution beyond last-write-wins
- [ ] Theme picker / `/styles` — dropped; one theme ships (see `docs/design-system.md`)

## Phase 4, Delight (later)

- [ ] Anniversary reminders (email or push)
- [ ] Year in review, auto-generated recap
- [ ] Printed atlas PDF export
- [ ] Voice memo attachments
- [ ] Rich text journal (markdown)
- [ ] Tags and filtering

## Phase 5, Gift Mode (deferred)

Onboarding, gift mode, and QR wait until auth is on and the core journal is stable.

- [ ] Onboarding wizard for first-time setup
- [ ] Pre-seed with "where we met" guided flow
- [ ] Presentation mode, fullscreen slideshow of memories
- [ ] QR code to open on partner's phone
- [ ] Profile row (email, avatar, display name) after auth enablement

## Tech Stack

| Layer | Now |
|-------|-----|
| Framework | Next.js 16 App Router |
| Styling | Tailwind CSS v4 |
| Map | Leaflet + raster tiles (watercolor / Voyager / terrain) |
| Storage | Supabase Postgres + Storage |
| Geocoding | Nominatim (OpenStreetMap) |
| Hosting | Vercel + custom domain |
| Auth | Partner gate now; Supabase allowlist prepared |

## Standing rules

- **All new UI is mobile-first**, must work on a 375px viewport before shipping (see `docs/design-system.md` → Responsive)

## Non-Goals (v1)

- No public social sharing or public memory URLs
- No paid map tile APIs
- No native mobile app (PWA optional later)
