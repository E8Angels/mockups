## E8 Angels Live Design — conventions

This is a **descriptive** system: every value reproduces the live E8 Angels member portal (app.e8angels.com) as it actually renders today, not the brand guidelines. Where the two disagree, the live value is what ships — see `readme.md` § BRAND-GUIDELINE DEVIATIONS in the bundle for the specific gaps (e.g. brand teal `#2EC4B6` never appears in the product; the page ground is a cool blue-grey, not the guideline's warm Bone). If a build needs to be *brand-correct* rather than *product-accurate*, use the "Brand-guideline reference" custom properties documented at the bottom of `tokens/colors.css` instead of the default ones.

### Setup

No provider or theme wrapper is required — every component is a plain function component with no context dependency. Include, in this order:
```html
<link rel="stylesheet" href="styles.css">
<script src="_vendor/react.production.min.js"></script>
<script src="_vendor/react-dom.production.min.js"></script>
<script src="_ds_bundle.js"></script>
```
Everything is exposed on `window.E8Live.<ComponentName>`.

**Icon gotcha (easy to miss, fails silently):** `Icon`, and anything that composes it — `IconButton`, `DataTable`, `SearchInput`, `SelectControl`, `ActivityRail`, `ChatFab`, `NewsRow`, `TopNav` — renders glyphs via **Lucide**, loaded from CDN at runtime, not bundled. Add this script tag whenever any of those components are used, or the icon renders as an empty box with no error:
```html
<script src="https://unpkg.com/lucide@0.462.0/dist/umd/lucide.js"></script>
```
This is a deliberate substitution (readme.md § ICONOGRAPHY): the live product's actual icon set was never supplied, so Lucide's thin-stroke outline glyphs stand in as the closest public match. The observed set is: home, git-branch, users, link-2, search, chevron-down/up, mail, map-pin, sparkles, calendar, play, filter, message-square, x, clock, file-text, square-check, arrow-right.

### Styling idiom — inline style props, no CSS classes

Nothing here uses class names. Every component styles itself via a `style={{...}}` object referencing CSS custom properties defined in `tokens/*.css`. Compose new layout the same way: inline `style` objects reading these tokens, never invented class names.

Real token families (see `tokens/colors.css`, `tokens/spacing.css`, `tokens/typography.css` for the full set):
- **Surfaces/borders**: `--surface-page`, `--surface-card`, `--surface-subtle`, `--surface-inverse`, `--border-hairline`, `--border-default`, `--border-strong`
- **Text**: `--text-strong`, `--text-body`, `--text-muted`, `--text-faint`, `--text-link`
- **Action/brand**: `--action`, `--action-fill` (live CTA fill — NOT brand teal, see deviations), `--action-hover`, `--action-soft`
- **Semantic**: `--success` / `-soft`, `--warning` / `-soft`, `--danger` / `-soft`
- **Spacing** (4px base): `--space-1` (4px) through `--space-16` (64px)
- **Radius**: `--radius-xs`(4) `-sm`(6) `-md`(8, controls) `-lg`(12, cards) `-xl`(16) `-pill` `-circle`
- **Shadow**: `--shadow-xs` `-sm` `-md` `-lg`, `--shadow-focus`
- **Type**: `--font-sans` (Urbanist — the shipped stand-in for Cosmica, which has no webfont files here), `--font-mono` (IBM Plex Mono, used for stage markers/data); size scale `--fs-2xs`(11) through `--fs-numeral`(44); weight `--fw-regular`(400) `-medium`(500) `-semibold`(600) `-bold`(700)

### Where the truth lives

Read `styles.css` first — it's a single `@import` chain (`tokens/fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `interaction.css`, `base.css`) and is the complete token vocabulary. Each component's `.prompt.md` has real usage examples pulled from the live product; each `.d.ts` is the accurate prop contract (cross-checked against source during this sync). `readme.md` (bundled, not per-component) has the full descriptive spec: content voice, iconography substitution, and the numbered brand-guideline deviation table.

### Build example

```jsx
<CompanyCard
  name="Andros Innovations Inc."
  initials="AI"
  programme="Decarbon8"
  description="Andros Innovations is developing a chemical-looping ammonia reactor…"
  team={[{ name: 'Andrew Reiter', lead: true }, { name: 'Clare Fredrick' }]}
/>
<Button variant="filled" pill iconRight="→">Refer a Company</Button>
```
Layout glue (grids, page shells) follows the same idiom — `style={{ display: 'grid', gap: 'var(--space-4)', padding: 'var(--space-5)' }}` — never a new class.

---

# e8-angels-live-design — component index

40 components across 5 groups.

## core

- `Avatar` — `components/core/Avatar/`
- `AvatarStack` — `components/core/AvatarStack/`
- `Badge` — `components/core/Badge/`
- `Button` — `components/core/Button/`
- `Card` — `components/core/Card/`
- `Divider` — `components/core/Divider/`
- `Eyebrow` — `components/core/Eyebrow/`
- `IconButton` — `components/core/IconButton/`
- `Tag` — `components/core/Tag/`

## data

- `CountChip` — `components/data/CountChip/`
- `DataTable` — `components/data/DataTable/`
- `EmptyState` — `components/data/EmptyState/`
- `GroupHeader` — `components/data/GroupHeader/`
- `RatingCell` — `components/data/RatingCell/`
- `RatingMatrix` — `components/data/RatingMatrix/`
- `SegmentedRating` — `components/data/SegmentedRating/`
- `Skeleton` — `components/data/Skeleton/`
- `StatTile` — `components/data/StatTile/`

## forms

- `Field` — `components/forms/Field/`
- `Input` — `components/forms/Input/`
- `SearchInput` — `components/forms/SearchInput/`
- `SelectControl` — `components/forms/SelectControl/`
- `StageTabs` — `components/forms/StageTabs/`
- `Toggle` — `components/forms/Toggle/`
- `UnderlineTabs` — `components/forms/UnderlineTabs/`

## media

- `Icon` — `components/media/Icon/`
- `Wordmark` — `components/media/Wordmark/`

## portal

- `ActivityRail` — `components/portal/ActivityRail/`
- `ChatFab` — `components/portal/ChatFab/`
- `CompanyCard` — `components/portal/CompanyCard/`
- `ConfirmationSummary` — `components/portal/ConfirmationSummary/`
- `CtaBanner` — `components/portal/CtaBanner/`
- `DetailSheet` — `components/portal/DetailSheet/`
- `EventItem` — `components/portal/EventItem/`
- `MemberRow` — `components/portal/MemberRow/`
- `NewsRow` — `components/portal/NewsRow/`
- `SectionCard` — `components/portal/SectionCard/`
- `SectionHeader` — `components/portal/SectionHeader/`
- `SlackStrip` — `components/portal/SlackStrip/`
- `TopNav` — `components/portal/TopNav/`

