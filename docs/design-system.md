# Liebeskarte, Design System

Four candidate visual directions. Pick one via the `/styles` mock page; the chosen theme becomes the app's default (stored in `localStorage`).

---

## Shared UX Principles

1. **Map is the hero**, UI chrome stays minimal; the map fills the viewport
2. **Memory cards feel like artifacts**, not generic modals; each theme gives cards a distinct material quality
3. **Chronology is visible**, journey line on map, timeline as alternate view
4. **Typography carries emotion**, display type for titles, readable body for journal text
5. **Motion is gentle**, fly-to animations on map, soft card transitions (200–300ms)
6. **Accessible**, 4.5:1 contrast on text, focus rings, keyboard navigation
7. **Phone-first**, every new feature ships usable on a 375px viewport; desktop is an enhancement, not the default

### Shared Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon padding |
| `space-3` | 12px | Inline spacing |
| `space-4` | 16px | Card padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Page margins |
| `space-12` | 48px | Large sections |

### Shared Component Inventory

| Component | Description |
|-----------|-------------|
| `MapCanvas` | Full-viewport MapLibre map with themed style |
| `MemoryMarker` | Pin on map, color/icon by milestone type |
| `JourneyLine` | GeoJSON line connecting pins chronologically |
| `MemoryCard` | Slide-over panel with photo, title, date, journal |
| `TimelineItem` | Row in timeline view |
| `AddMemoryForm` | Form for new/edit memory |
| `ThemePicker` | Theme selection (settings or `/styles`) |
| `ExportImport` | Backup buttons |

---

## Responsive

### Breakpoints (Tailwind mobile-first)

| Token | Width | Use |
|-------|-------|-----|
| `base` | 0–767px | Phone layout, default for all new UI |
| `md:` | 768px+ | Tablet / desktop enhancements |
| `lg:` | 1024px+ | Wide layouts (e.g. 4-column album grid) |

### Overlay pattern

| Viewport | Pattern |
|----------|---------|
| Mobile | Bottom sheet, full width, `max-h-[70vh]`, scrollable |
| `md+` | Fixed side panel, `w-96`, top-right |

Reference: `web/app/MapPageClient.tsx`.

### Safe areas

Use `env(safe-area-inset-*)` on fixed chrome (nav, bottom sheets, map controls) so content clears notches and home indicators.

### Touch vs hover

- Mobile: captions and actions must be visible or tappable without hover.
- Desktop: hover enhancements (`group-hover:opacity-100`, lift on hover) are allowed from `md:` up.

### Layout rules

- Prefer `w-full`, `max-w-*`, `h-dvh`, `inset-0`, never `100vw` / `w-screen`.
- Page content: `mx-auto max-w-* px-4 md:px-8`.
- Chip / filter rows: `flex flex-wrap gap-2`.
- Horizontal photo strips: `overflow-x-auto`.
- Minimum tap target: 44px.

---

## Theme 1: Blueprint

*Architectural drafting, technical drawing lines, grid paper, ink blue accent.*

### Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#F4F6F8` | Page background (blueprint paper) |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--ink` | `#1A2332` | Primary text |
| `--ink-muted` | `#5C6B7A` | Secondary text |
| `--accent` | `#2563EB` | Links, active markers, CTAs |
| `--accent-light` | `#DBEAFE` | Hover, selected states |
| `--grid` | `#CBD5E1` | Grid lines, borders |
| `--line` | `#94A3B8` | Journey line on map |

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | DM Sans | 600 | 28–36px |
| Body | DM Sans | 400 | 15–16px |
| Label | DM Mono | 500 | 11–12px uppercase |
| Annotation | DM Mono | 400 | 10px |

### Map Style
- Light neutral vector tiles (Carto Positron or similar)
- Thin grid overlay optional
- Markers: circle with crosshair, ink blue fill

### Card Treatment
- White surface, 1px grid border
- Corner registration marks (small L-shapes)
- Date as mono annotation label

---

## Theme 2: Warm Atelier

*Travel journal, cream paper, serif type, terracotta and sage, taped photos.*

### Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#F5F0E8` | Cream paper |
| `--surface` | `#FFFCF7` | Cards |
| `--ink` | `#3D3229` | Primary text |
| `--ink-muted` | `#7A6E63` | Secondary |
| `--accent` | `#C4704B` | Terracotta, CTAs, markers |
| `--accent-secondary` | `#6B8F71` | Sage, secondary accents |
| `--border` | `#E8DFD0` | Soft borders |
| `--line` | `#C4704B` | Journey line (dashed) |

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | Playfair Display | 600 | 28–36px |
| Body | Source Serif 4 | 400 | 16px |
| Label | Source Sans 3 | 500 | 12px |

### Map Style
- Warm, muted tiles (Stamen Toner Lite or custom warm filter)
- Markers: rounded pin, terracotta

### Card Treatment
- Slight paper texture background
- Photos with "taped corner" shadow effect
- Handwritten-style date optional

---

## Theme 3: Minimal Editorial

*Gallery whitespace, one bold accent, large photography, restrained UI.*

### Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#FAFAFA` | Near white |
| `--surface` | `#FFFFFF` | Cards |
| `--ink` | `#111111` | Primary text |
| `--ink-muted` | `#666666` | Secondary |
| `--accent` | `#E11D48` | Rose, single bold accent |
| `--border` | `#E5E5E5` | Hairline borders |
| `--line` | `#111111` | Journey line (thin black) |

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | Inter | 700 | 32–40px |
| Body | Inter | 400 | 16px |
| Label | Inter | 500 | 11px uppercase tracking-wide |

### Map Style
- Ultra-light tiles, minimal labels
- Markers: small black dot, rose on hover/active

### Card Treatment
- Full-bleed photo top, text below
- Maximum whitespace, no decorative borders

---

## Theme 4: Night Atlas

*Dark elegant map, glowing markers, constellation lines between milestones.*

### Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#0B0F19` | Deep night sky |
| `--surface` | `#151B28` | Cards, panels |
| `--ink` | `#E8ECF4` | Primary text |
| `--ink-muted` | `#8892A4` | Secondary |
| `--accent` | `#60A5FA` | Soft blue glow |
| `--accent-glow` | `#93C5FD` | Marker glow, line glow |
| `--border` | `#1E293B` | Subtle borders |
| `--line` | `#60A5FA` | Constellation lines (glow) |

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display | Outfit | 600 | 28–36px |
| Body | Outfit | 400 | 15–16px |
| Label | Outfit | 500 | 11px uppercase letter-spacing |

### Map Style
- Dark vector tiles (Carto Dark Matter)
- Markers: glowing circles with soft shadow
- Journey line: dashed with glow filter

### Card Treatment
- Dark glass surface, subtle border glow
- Photos with soft vignette
- Star-like sparkle on celebration milestones

---

## Milestone Marker Colors (all themes)

Each type gets a semantic color that adapts per theme:

| Type | Blueprint | Atelier | Editorial | Night |
|------|-----------|---------|-----------|-------|
| met | `#2563EB` | `#C4704B` | `#E11D48` | `#F472B6` |
| date | `#7C3AED` | `#6B8F71` | `#111` | `#A78BFA` |
| trip | `#0891B2` | `#8B7355` | `#666` | `#34D399` |
| home | `#059669` | `#5C4A3A` | `#E11D48` | `#FBBF24` |
| celebration | `#D97706` | `#C4704B` | `#E11D48` | `#FCD34D` |
| custom | `#64748B` | `#7A6E63` | `#999` | `#94A3B8` |
