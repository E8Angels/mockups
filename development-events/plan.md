---
title: "Development CRM: Events"
status: building
owner: jordan
created: 2026-07-02
last_updated: 2026-07-02
home: events-grid
---

# Development CRM: Events

Events become first-class records in the Development CRM. Event-sponsorship opportunities link to an event instead of carrying a free-text `event_name`; the event aggregates its sponsors (pitched and confirmed, with dollar totals) straight from those linked opportunities. Events optionally belong to an **event series** (e.g. "PNW Climate Week"), carry logistics (date, time, location, venue, partners, audience, size), and roll costs (estimated by event type; actuals entered by hand).

Source material: Karin's "Updated Event Tracker" spreadsheet (Events / Sponsor List / $ Assumptions tabs). Field-by-field mapping in §3.

## Mockup files in this folder

- **`events-grid.html`** (home) — the Events grid inside `/admin/development` List mode: seeded views rail, columns, New Event dialog, series create/manage, event-type management.
- **`event-detail.html`** — the event slide-out panel (AdminDetailSheet): details, partner pills, sponsorship table with money summary.
- **`opportunities-event-view.html`** — the Opportunities grid "Event Sponsorships" seeded view with event rollup columns, plus the opportunity dialog's event picker.

## 1. Where Events live

No new top-level page. Events are a third dataset inside the existing Development dashboard (`/admin/development`, `DevelopmentDashboardIsland`):

- **List mode** — the existing `Opportunities | Funders` ToggleGroup gains a third item: **Events**. It renders `RecordGrid` with `tableKey="development_events"`, the view-builder rail, and saved/shared views — so filtering by partner, type, series, sorting, grouping, and summaries come free from the grid.
- **Calendar mode** — a new **Events** filter chip alongside Deadlines / Reporting / Follow-ups / Terms. Dated events render on their date; clicking opens the event panel.
- **Kanban mode** — unchanged. (Optional later: an event filter next to the existing type/subtype filters.)

Row click opens the **event slide-out panel** in the same `AdminDetailSheet` pattern used for funders and opportunities.

## 2. Data model

All new tables in `lib/development/schema.js`; SQL through the Development CacheManager domain module (`lib/cache-manager/development.js`). Manual prod migration per repo practice — never at startup. Money in integer cents via `lib/money.js`. States stored as 2-letter abbreviations, displayed as full names via `lib/location-airtable-format.js` maps (same as companies).

```sql
-- Event series: a recurring umbrella ("PNW Climate Week"). Not year-scoped;
-- each year's event is a new development_events row pointing at the same series.
CREATE TABLE development_event_series (
    id TEXT PRIMARY KEY,                                  -- dser_<hex>
    name TEXT NOT NULL,
    description TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event types with per-type default estimated cost (the "$ Assumptions" tab).
-- Seeded: Happy Hour 3000, Pitch Competition 3000, Panel 3000, Fireside Chat 3000,
--         Private Dinner 3000, AGM 10000, Learning Lab 3000 (dollars shown; stored as cents).
CREATE TABLE development_event_types (
    id TEXT PRIMARY KEY,                                  -- dtyp_<hex>
    name TEXT NOT NULL UNIQUE,                            -- Title Case canon
    estimated_cost_cents INTEGER,
    rationale TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0
);

-- Event instance. Every field except name is optional.
CREATE TABLE development_events (
    id TEXT PRIMARY KEY,                                  -- devt_<hex>
    name TEXT NOT NULL,
    series_id TEXT,                                       -- FK -> development_event_series.id
    event_type_id TEXT,                                   -- FK -> development_event_types.id
    date TEXT,                                            -- YYYY-MM-DD wall-clock; NULL = date not known yet
    start_time TEXT,                                      -- HH:MM wall-clock
    end_time TEXT,                                        -- HH:MM wall-clock
    timezone TEXT,                                        -- IANA; default America/Los_Angeles when times are set
    city TEXT,
    state TEXT,                                           -- 2-letter US/CA abbreviation; display full name
    venue TEXT,
    audience_json TEXT,                                   -- JSON array of canon values, see below
    expected_size INTEGER,
    actual_cost_cents INTEGER,                            -- user-entered actual cost
    notes_freeform TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_development_events_series ON development_events(series_id);
CREATE INDEX idx_development_events_date ON development_events(date) WHERE date IS NOT NULL;

-- Event partners: co-hosts/co-organizers. Links to the portal partners table
-- (cleantech_investors, joined for display names; partner_contacts for people).
CREATE TABLE development_event_partners (
    event_id TEXT NOT NULL,                               -- FK -> development_events.id
    partner_record_id TEXT NOT NULL,                      -- FK -> cleantech_investors.record_id
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, partner_record_id)
);

-- Opportunity linkage (the sponsor side).
ALTER TABLE development_opportunities ADD COLUMN event_id TEXT;   -- FK -> development_events.id
CREATE INDEX idx_development_opportunities_event
    ON development_opportunities(event_id) WHERE event_id IS NOT NULL;
```

**Audience canon** (Title Case, exact-match — from the spreadsheet): `Investors`, `Founders`, `Ecosystem`, `E8 Community`, `E8 Members`, `HNWI`. Canon lives in `lib/development/schema.js` next to the corporate-subtype canon.

**`event_name` deprecation.** `development_opportunities.event_name` (free text) is superseded by `event_id`. Backfill script creates one event per distinct `event_name` among sponsorship/event opportunities, links them, and reports unmatched rows; the column is dropped in a follow-up commit once backfill is verified in prod. Until then the grid `event` field prefers the joined event name.

### Derived fields (computed, never stored)

Per AGENTS.md "derive, don't persist status":

| Derived field | Definition |
|---|---|
| `status` | **Completed** when the event has ended: `date < today` (Pacific-safe wall-clock compare), or `date = today` and `end_time` in `timezone` has passed (same lexicographic wall-clock compare as `dateUtils.meetingHasEnded`). **Upcoming** when dated and not ended. **Undated** when `date IS NULL`. |
| `sponsors_pitched` | Funder display names of all linked, non-archived, non-declined opportunities — matching the spreadsheet, where the pitched list includes sponsors who later confirmed. |
| `pitched_total` | `SUM(amount_asked_cents)` over those opportunities (total asked for this event). |
| `sponsors_confirmed` | Funder display names of linked opportunities in stage committed / received. |
| `confirmed_total` | `SUM(amount_committed_cents)` over committed/received opportunities. (`received_total` = `SUM(amount_received_cents)` is a separate column.) |
| `estimated_cost` | `development_event_types.estimated_cost_cents` for the event's type. |
| `net` | `confirmed_total − COALESCE(actual_cost_cents, estimated_cost)`. Optional column, not default-visible. |

Declined and archived opportunities count toward neither sponsor bucket.

## 3. Spreadsheet → portal mapping

| Spreadsheet column | Portal field |
|---|---|
| Event Name | `development_events.name` |
| Event Series | `series_id` → `development_event_series` |
| Date | `date` (known or NULL — no "TBD October" complexity) |
| Time (e.g. 9:00–11:00) | `start_time` / `end_time` + `timezone` |
| Location | `city` + `state` (state = normalized dropdown, US + Canada) |
| Venue | `venue` |
| Partners | `development_event_partners` → partner pills |
| Sponsors – Pitched / Pitched Total $ | derived from linked opportunities in pipeline stages |
| Sponsors – CONFIRMED / CONFIRMED Total $ | derived from linked opportunities in committed/received |
| Actual Cost | `actual_cost_cents` (user-entered currency) |
| Audience | `audience_json` multi-select (canon above) |
| Size | `expected_size` integer |
| Type | `event_type_id` → `development_event_types` |
| Est. Cost ($) | derived: type's `estimated_cost_cents` (the VLOOKUP) |
| Sponsor List tab | already modeled: funders + opportunities + contacts |
| $ Assumptions tab | `development_event_types` seed rows |

## 4. Events grid (`tableKey: development_events`)

Registered in `lib/admin-grid-config.js` `TABLE_CONFIGS`, permission `admin.development.read` (writes `admin.development.write`), same as the other Development grids. Rollup source tables: `development_event_series`, `development_event_types`, `development_event_partners`, `cleantech_investors`, `development_opportunities`, `development_funders`.

**Fields** (all filterable/sortable/groupable unless noted): `name`, `series` (single_select), `status` (single_select: Upcoming/Completed/Undated), `date`, `time` (display "9:00–11:00 AM PT"; sorts by start), `city`, `state` (single_select, full names), `venue`, `type` (single_select), `partners` (multi_select), `sponsors_pitched` (multi_select), `pitched_total` (currency), `sponsors_confirmed` (multi_select), `confirmed_total` (currency), `received_total` (currency), `estimated_cost` (currency), `actual_cost` (currency), `net` (currency), `audience` (multi_select), `size` (number), `opportunities_count` (number), `notes`, `is_archived`, `created_at`, `updated_at`.

**Default visible:** name, series, date, status, type, city, partners, sponsors_confirmed, confirmed_total, pitched_total.
**Default summaries:** name → count; pitched_total, confirmed_total, actual_cost → sum.

**Seeded shared views** (via `createAdminGridView`, seeded by script *after* the field code deploys — the is_empty-matches-all trap):

1. **All Events** — no filter, date descending, undated rows last.
2. **Upcoming** — status is Upcoming or Undated, date ascending (undated last).
3. **Completed** — status is Completed, date descending.
4. **By Series** — grouped by series, date descending.

Filter-by-partner, filter-by-type, filter-by-audience etc. come free from the grid's field filters; users can save their own personal/shared views on top.

## 5. Lifecycle flows

### Create an event

**New Event** button on the Events grid toolbar → dialog (design-guide form layout: left labels, grouped rows, content-width controls):

- **Name** (required — the only required field)
- **Series** — combobox over non-archived series with inline create ("＋ Create series 'PNW Climate Week'")
- **Type** — select over non-archived event types
- **Date** — single date input (know it or leave blank)
- **Time** — start + end time inputs + timezone select (defaults America/Los_Angeles) under one "Time" label
- **Location** — City text + State select (US states + Canadian provinces, full names) under one "Location" label
- **Venue** — text
- **Audience** — `MultiSelectDropdown`, canon values
- **Size** — integer input
- **Actual cost** — currency input

Sponsors and partners are not in the create dialog; they're managed from the panel (sponsors are opportunities; partners get the picker there). Create → optimistic insert → opens the event panel.

### Create / edit an event series

- **Inline** from any series combobox (event dialog, event panel, opportunity event picker): type a new name → create.
- **Manage series** (Events toolbar overflow menu) → dialog listing series with event count and next event date; rename inline; archive (archived series keep history but leave pickers).

### Edit an event

Everything edits inline in the event slide-out panel — same interaction pattern as the funder/opportunity panels (click-to-edit fields, `EditableMarkdownField` for notes, optimistic saves). No separate edit dialog.

### Event slide-out panel (`event-detail.html`)

`AdminDetailSheet`, structure mirroring the opportunity panel:

- **Header** — name, series chip, type chip, status chip, friendly date + time ("Wed, August 12, 2026 · 9:00–11:00 AM PT"), city/state + venue.
- **Details column** — all §2 fields editable inline. Partners section: partner pills (content-width, `w-fit`); click opens that partner's slide-out; ＋ opens `PartnerPicker`; × unlinks.
- **Sponsorships column** —
  - Money tiles: **Pitched $**, **Confirmed $**, **Received $**, **Est. Cost** (from type), **Actual Cost** (editable), **Net**.
  - Table of linked opportunities: funder, opportunity name, stage chip, asked, committed, received. Row click opens the opportunity panel.
  - **New sponsorship** — opens the existing New Opportunity dialog pre-set to type=sponsorship, subtype=event, event=this event (funder picker as usual).
  - **Link existing** — opportunity picker (sponsorship/event opportunities without an event, plus search) setting `event_id`.

### Delete / archive

Archive only (`is_archived`), like funders/opportunities; archiving an event does not touch its opportunities (they keep `event_id`; the panel shows an archived badge).

## 6. Opportunities integration (the "pivot" view)

The events view is, in part, an opportunities view — so event data flows back onto the opportunities grid as rollups:

- **New rollup fields** on `development_opportunities` grid config: `event` (linked event name — replaces the free-text sourced field), `event_series`, `event_date`, `event_status`, `event_city`, `event_partners` (multi_select). Rollup source tables gain `development_events`, `development_event_series`, `development_event_partners`, `cleantech_investors`.
- **Seeded shared view "Event Sponsorships"**: filter type=sponsorship AND subtype=event; visible columns opportunity_name, funder_name, stage, amount_asked, amount_committed, amount_received, event, event_series, event_date, event_partners, lead; sorted event_date descending. Grouping by `event` or `event_series` gives per-event subtotals with the grid's sum summaries — the spreadsheet's pitched/confirmed totals as a pivot.
- **Opportunity dialog + panel**: when type=sponsorship and subtype=event, the free-text "Event name" input becomes an **event combobox** (events with dates shown, inline "＋ New event" mini-create with just name/series/date). Existing saved rows migrate via the backfill.
- Per the memory about saved views: existing saved opportunity views are untouched; the new columns must be added to any shared view that should show them (`updateAdminGridView`), and fast-mode hydration must mark the new fields pending.

## 7. Plumbing checklist (implementation phase)

- **CacheManager**: new methods in `lib/cache-manager/development.js` (`createDevelopmentEvent`, `updateDevelopmentEvent`, `setDevelopmentEventPartners`, `upsertDevelopmentEventSeries`, `listDevelopmentEvents` with derived rollups, `upsertDevelopmentEventType`); `_developmentTouch()` invalidation; batch partner/funder name resolution (no N+1).
- **Routes**: `routes/development.js` — CRUD endpoints matching the funder/opportunity patterns.
- **Data-query writes**: add `create_event`, `update_event`, `set_event_partners`, `upsert_event_series`, `upsert_event_type` to `DEVELOPMENT_WRITE_ACTIONS` + preview/execute switch in `routes/data-query.js`; `update_opportunity` accepts `event_id`.
- **Docs**: `docs/database-schema.md`; `docs/data-query-glossary.md` (new staff-queryable tables + gotcha: sponsors are derived from opportunities, don't query a sponsors table); `docs/ai-relationship-registry.*` (soft FKs `event_id`, `partner_record_id`; `audience_json` JSON path + canon).
- **Migrations** (manual, prod after explicit approval): 4 CREATEs + 1 ALTER; `createTables()` updated for new environments; seed `development_event_types`; backfill `event_name` → events (dry-run default); seed shared views **after** code deploy.
- **Tests**: derived status boundaries (today/end-time/timezone), sponsor bucket + totals math, backfill script, grid config registration, route CRUD.

## 8. Open questions

1. **Confirmed total$** — recommend `SUM(amount_committed)` over committed/received opps (with Received $ as its own column). OK, or should confirmed prefer received-when-present?
2. **Event types** — recommend the `development_event_types` table + a small "Manage event types" dialog (est. costs are data and change yearly). The lighter alternative is a hardcoded canon in `lib/development/schema.js` (edits require a deploy).
3. **Undated events in "Upcoming"** — recommend yes (they're future plans), sorted after dated rows.
4. **Notes / follow-ups on events** — v1 keeps conversation on the funder/opportunity. Extending `development_notes.parent_kind` and `tasks.parent_kind` with `'event'` is cheap if you want event-level notes.
5. **Calendar chip** — recommend shipping the Events calendar chip in v1 (cheap, high-visibility).
