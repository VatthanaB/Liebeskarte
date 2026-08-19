# Liebeskarte

A private map journal of your relationship milestones, from Auckland to the world.

**Liebeskarte** is German for *love map*. **Every place we became us.**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the map.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Map view, pins, journey line, memory cards |
| `/?view=gallery` | Photo wall of shared memories |
| `/timeline` | Chronological story of all memories |
| `/album` | Filterable photo album with lightbox |
| `/settings` | Who is signed in, hidden photos, memory and photo manager |
| `/onboarding` | First-run welcome and “where we met” |

Full route map: [`docs/review/README.md`](docs/review/README.md).

## Design

**Warm Atelier**, cream paper, terracotta accents, serif typography, travel-journal feel.

All UI is **mobile-first**, every feature must work on a 375px phone viewport. See [`docs/design-system.md`](docs/design-system.md) → Responsive.

## Features

- **World map** with Auckland as home base
- **Milestone pins**, met, date, trip, home, celebration, custom
- **Journey line** connecting memories in chronological order
- **Memory cards** with photos, journal entries, dates
- **Gallery wall** and **photo album**
- **Place search** via OpenStreetMap (Nominatim)
- **Couple login**, sign in as `panda` or `henne`
- **Cloud storage**, Supabase Postgres + photo Storage (shared between you two)
- **Live reload** when the other person adds or edits a memory
- **First-run onboarding**, welcome plus a guided “where we met” pin
- **Warm Atelier design**, cream journal aesthetic throughout

## Docs

See [`docs/`](docs/) for concept, design system, and roadmap.

## Stack

- Next.js 16 + React 19
- Tailwind CSS v4
- Leaflet + watercolor / Voyager / terrain map layers
- Supabase (database, photos, login)

## Setup

See [`docs/hosting.md`](docs/hosting.md). Copy `env.example` to `.env.local` and run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
