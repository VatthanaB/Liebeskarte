# Liebeskarte, Concept

## Vision

**Liebeskarte** is a private, interactive map journal of your relationship, every milestone pinned to the world, connected chronologically into a journey line. It is not a social app. It is a living artifact you and your partner build together over years: where you met, first dates, trips abroad, moving in, anniversaries, quiet afternoons in Auckland, and everything still to come.

Think of it as a shared diary with a map as its spine. The map lets you wander spatially; the timeline lets you scroll through time. Each pin opens a memory card with photos, journal text, and context.

## Personas

### You (the builder)
- Wants to surprise your architect partner with something meaningful and beautiful
- Comfortable adding memories, photos, and journal entries over time
- Values aesthetics and the emotional weight of the artifact

### Your partner (the architect)
- Appreciates precision, spatial thinking, and design craft
- Will enjoy the map-as-blueprint metaphor and clean visual language
- May contribute annotations, place names, and design sensibility to entries

## Core Features (v1)

### Map View
- World map with Auckland, NZ as the default home view
- Custom markers per milestone type (met, date, trip, home, celebration, custom)
- Chronological journey line connecting all pins
- Click a pin to open its memory card
- Zoom from intimate city scale to global trips

### Memory Cards
- Title, date, location name, coordinates
- Milestone type with distinct marker styling
- Journal entry (rich text in future; plain text in v1)
- Photo attachments (Supabase Storage)
- Tags for filtering (optional later)

### Timeline View
- Scrollable chronological list of all memories
- Same card content as map view
- "View on map" link to fly to the pin

### Add / Edit Flow
- Drop a pin on the map or search a place (Nominatim geocoding)
- Fill in memory details and attach photos
- Edit or delete existing memories

### Shared cloud
- Memories live in Supabase Postgres; photos live in Supabase Storage
- Both of you use the same project
- Edits reload live while you are both in the app
- JSON export / import is not built yet

## Milestone Types

| Type | Icon | Use case |
|------|------|----------|
| `met` | First spark | Where you first met |
| `date` | Heart | Dates, outings, dinners |
| `trip` | Compass | Travel, holidays |
| `home` | House | Moving in, home base (Auckland) |
| `celebration` | Star | Anniversaries, engagements, milestones |
| `custom` | Pin | Anything else |

## Geographic Scope

- **Default view**: Auckland, New Zealand, your home base
- **World scope**: Full world map for memories across countries and continents
- **Smart framing**: App opens centered on Auckland; "Fit all" zooms to show every pin globally

## Future Ideas (v2+)

- **Couple login**, Supabase auth and allowlist (prepared, currently off)
- **JSON backup**, export / import of memories and photo metadata
- **Anniversary reminders**, gentle notifications on milestone dates
- **Printed atlas export**, PDF or print-ready layout for a physical gift
- **Constellation mode**, night theme with animated lines between stars
- **Voice memos**, attach audio notes to a pin
- **Collaborative annotations**, partner adds their own journal entry to the same pin
- **Year in review**, auto-generated recap of memories added that year

## Name & Tagline

**Liebeskarte**, *Every place we became us.*

German for *love map*. The name is hers as much as the map is yours: **Henne** is German for hen/chicken, and **Panda** is his nickname. A German compound keeps that private joke in the title without spelling it out.

Formerly sketched as *Our Atlas*. The product is still a shared atlas, the name is now the two of you.
