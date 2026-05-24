---
title: Companies Admin Redesign
status: draft
owner: jordan
created: 2026-05-23
home: variant-a-list
last_updated: 2026-05-24
---

# Companies admin redesign

## 1. The problem

The admin at `/admin/companies` exposes eight tabs, each a near-1:1 rendering of a database table. Most real questions cross all four staff-facing tables (`companies`, `applications`, `deployments`, `company_events`); the UI exposes each separately and forces the user to do the join in their head. The redesign is presentation, filter, and aggregation only — no schema changes.

The `/explore-companies` page is the closest existing answer to the same problem space. The redesign adopts what already works there — the MultiSelectDropdown component, the Furthest Stage rollup, the Investment Since slider, the as-you-type filter — and only innovates where explore-companies doesn't go.

## 2. Direction

- **One Companies surface, no top-level tabs.**
- **Four dimensions** — Company, Application, Investment, Event.
- **Built on the existing `/explore-companies` patterns** wherever those patterns already work. New UI inherits the MultiSelectDropdown component, the Furthest Stage algorithm, the Investment Since slider, the as-you-type filter, and the "dynamic columns" idea (when a filter is active, the matching column appears).
- **Views are the question layer.** Common staff questions are saved views, not hard-coded starter buttons. Views capture filters, columns, sort, grouping, and summary footer settings. The system ships with shared views that preserve today's useful company/application/admin views; users can create personal views without cluttering the shared list.
- **Plain English in all user-facing UI.** Filter labels and field descriptions are plain English. Users never see `boolean`, `rollup`, `EXISTS`, table or column names, type tags, or SQL previews. This rule applies everywhere — chooser dialogs, custom column builder, tooltips, error messages.
- **Three independent status-like columns** that do not conflate concepts:
  - **Furthest stage** (rollup) — the farthest pipeline point any of this company's applications reached, computed identically to explore-companies.
  - **$ Invested** (rollup) — $ deployed, right-aligned.
  - **Status** (rollup over instruments) — Active / Exited / Closed / blank. The blank case is the common one (we never invested or position state is unknown); the UI shows blank, not "Unknown". See §3.

## 3. The Status column — precise definition

| Display | Meaning | Source |
|---|---|---|
| **Active** | At least one open investment instrument | any `instruments.status = 'active'` for this company |
| **Closed** | All investment instruments written off, or company dissolved | every `instruments.status = 'written_off'`, or company has a `portfolio_events.event_type = 'dissolution'` event |
| **Exited** | Position fully realized via acquisition / exit; capital received back | all instruments `exited` or `converted` and at least one `record_type='return'` deployment |
| **(blank)** | We never invested, or state cannot be determined | no instruments and no deployments |

Notes:

- "Closed" is the UI label for `written_off`.
- "Active" wins over "Closed" when mixed. If a company has one active SAFE and one written-off prior SAFE, the company is Active.
- Whether we've ever invested is a separate, correlated property with a separate filter ("Have we invested?") and its own column (*$ Invested* > 0). Status describes the lifecycle of the position; "have we invested" describes whether a position exists at all. Many filter combinations only make sense when Status ≠ blank.

## 4. Vocabulary (UI-facing)

| What we say | What it maps to internally | Notes |
|---|---|---|
| Company | `companies` row | |
| Application | `applications` row | |
| Investment | `deployments` row | renamed in UI only |
| Event | `company_events` row | |
| Pipeline stage | `pipeline_stages.stage` | per-application, current state |
| Furthest stage | derived rollup | see §6 |
| Status | derived rollup | see §3. Keep the short label in the UI. |
| $ Invested | derived rollup | `Σ deployments.amount_cents` |

Users never see `lead_stage`, `instrument`, `record_type`, `record_id`, `co_*`, `app_*`, table or column names, or any `aTable.aField` notation in the UI. Tooltips that explain a field do so in plain English.

## 5. The four dimensions

User-facing domains, organized for the filter chooser. The mapping to tables is internal.

1. **About the company** — name, sector, US/Canada, state/province, primary contact, founder demographics.
2. **About their applications** — when applied, pitch content, fundraising terms, decarbon8/follow-on flags, current pipeline stage.
3. **About our investments** — invested?, total, # investments, fund, vehicle (instrument type), Status (Active/Exited/Closed), SPV, current mark.
4. **About their events** — pitches, screenings, diligence, IC.

## 6. Furthest stage — the rollup we want everywhere

### 6.1 Per application

The furthest stage reached by **one application**. Ladder, lowest to highest:

> Applied → Applied Decarbon8 → Screen → Pitch → Follow-On Pitch → Diligence Complete → Invested

Algorithm (matches `lib/cache-manager.js` ~line 32308):

1. Look at every `company_events` row for the application.
2. Map each `event` value to a ladder rung:
   - `Applied` → Applied
   - `Applied Decarbon8` → Applied Decarbon8
   - `Screen` → Screen
   - `Pitch` / `D8 Pitch` → Pitch
   - `Follow-On Pitch` → Follow-On Pitch
   - `Diligence Complete` / `Diligence Formed` / `DD Debrief` → Diligence Complete
3. Take the highest rung reached.
4. If the application has a row in `diligence_teams` / `diligence_memberships`, bump to "Diligence Complete" even if no debrief event exists yet.
5. If the application's company has any `deployments` row (`record_type='deployment'`), override to "Invested".

The UI tooltip explains this in plain English: *"The farthest the application got in our pipeline. Order: Applied → Screen → Pitch → Follow-On Pitch → Diligence Complete → Invested. If we ended up investing, this shows Invested regardless of which stage gates the application went through."*

### 6.2 Per company

The max furthest stage across **all the company's applications**, then the Invested override applies once. A company that applied three times and went Pitch / Pitch / Diligence Complete with no investment has company-level furthest stage = Diligence Complete. The instant any deployment exists, it becomes Invested.

### 6.3 Where it shows up

- **Column** in the main list (sortable, filterable).
- **Multi-select filter** with the seven ladder values.
- **Per-application detail** in the row-expansion strip (§7) — each application shows its own furthest stage so the user can see how many got to Pitch vs. only to Screen.

## 7. Row expansion — application history inline

Clicking the chevron at the left of a company row toggles its inline expansion. Clicking anywhere else on the row opens the company detail pane over the list. The expansion is a single inline table showing every application, sorted newest first. It answers "what has this company submitted, and did any submission pitch?" without pulling investment details into the row.

| Applied | Furthest stage | Pitch date |
|---|---|---|
| Apr 2025 | Diligence Complete | 2025-07-12 |
| Mar 2024 | Diligence Complete | 2024-05-18 |
| Feb 2022 | Screen |  |

- **Applied** — month + year, derived from `applications.date_added`. Same `formatAppliedMonth` formatter as explore-companies; pre-2022-07 reads "unknown."
- **Furthest stage** — per-application furthest, computed identically to §6.1.
- **Pitch date** — the first Pitch / D8 Pitch / Follow-On Pitch date tied to that application. Blank when the application did not pitch.
- The whole application row is clickable and opens the company detail pane at that application's anchor.

Investment data stays on the company/application detail page and in investment-focused columns, filters, and summaries. If a company has zero applications, the expansion shows a small placeholder. If a company has investments but no application row (rare; some legacy direct investments), it's noted.

## 8. The Companies surface — layout

### 8.1 Default columns (in order)

1. **Company** — name + two-line clamped tagline beneath, with full text in the `title` tooltip. No logo / initials box in the list row.
2. **Sector** — primary category pill.
3. **HQ** — state + country.
4. **Furthest stage** — pill.
5. **$ Invested** — right-aligned. Blank if 0.
6. **Status** — Active / Exited / Closed / blank. (§3)
7. **Latest event** — event name + date (most recent `company_events` row). Date displays as `Mon D, YYYY`, e.g. `Mar 12, 2026`.
8. **Last touch** — derived.

Dynamic columns: when a filter is active for a field that isn't already shown, the matching column appears automatically (e.g. filter by Race/Ethnicity → that column appears; filter by State → that column appears). Pattern lifted from explore-companies (`DYNAMIC_COLUMN_DEFS` ~line 203).

Each row carries a `⋯` kebab menu at its right edge (§17.3).

Column interactions:

- **Reorder** — column headers show a small grip handle on hover. Dragging the grip reorders columns in the current view.
- **Resize** — dragging the divider between two column headers resizes the column width. The table preserves the user's chosen widths as part of the saved view.
- **Auto-size** — double-clicking a column divider auto-sizes the column to fit visible header and cell content, within sensible min/max widths so the table does not become unusable.
- **Reset** — the Columns control includes a reset action that returns column order and widths to the saved view defaults.
- These interactions update the modified view state, so Save view / discard behavior applies.

### 8.2 Left rail — view builder pane

The left rail is the view builder pane. It is the parent control for the table on the right, because a view is filters plus structure. Its contents, top to bottom:

1. **View picker** — current saved view, modified state, shared/personal view picker, and Save view actions.
2. **Columns, Group by, Sort** — view structure controls. These affect the layout and interpretation of the table, so they live with the filters instead of floating above the table.
3. **Filters** — Search and active filter controls.

Default `All companies` view:

- **Search** — as-you-type input across company name, tagline, primary contact, application content fields, and event notes. Lives in the rail; there is no separate top-of-page search bar.
- **Furthest stage** — multi-select dropdown, set to the broadest value (`Any stage`).
- **Investment Since** — slider with stops: N/A · 1 year · 2 years · 3 years · 5 years · Ever, set to `Ever`.

The default sort is **Most recent application ↓**. Other filters are added from the chooser only when the user needs them. This keeps the default page from looking like a schema browser while still making the two most useful broad filters easy to experiment with.

A drag handle (`⋮⋮`) on each filter group lets the user reorder filters in the rail. Each group has a "remove" affordance (×) that returns it to the chooser. A `＋ Add filter` button at the bottom of the rail opens the chooser (see `view-builder.html`). The user's filter order persists on their profile.

The rail is **collapsible**. A `‹` button at the top-right collapses it to a thin vertical button; clicking the vertical button re-expands. The collapsed vertical label reads `View: {view name}` (for example, `View: All companies`) and updates when the selected view changes. Drag the resize handle all the way left also collapses. State persists in `localStorage`. The drag handle between rail and main is 6px, highlights blue on hover/drag, and resizes the rail from 200px to 560px (default 280px).

Because the left rail expresses the entire view state, there is no horizontal chip bar above the table and no separate top-right Columns / Group by / Sort controls.

### 8.3 Summary footer on the main table

The table has an Airtable-style summary footer (a single row pinned to `<tfoot>` of the main table). Every column can carry its own summary aggregation, chosen from a popover that opens when the user clicks the footer cell:

| Column type | Available aggregations |
|---|---|
| Currency, Number | **Sum** · Average · Median · Min · Max · Count non-empty · Count · None |
| Date | Earliest · **Latest** · Range · Count non-empty · None |
| Single-select, Multi-select, Text | Count · Count unique · % filled · None |
| Boolean | **Count true** · Count false · % true · None |

Bold = sensible default the menu pre-highlights when the user opens the popover for the first time on that column.

Default footer state on the list page:

- **Company** — `N companies` (count of currently-filtered rows).
- **$ Invested** — Sum.
- **Last touch** — Latest.
- All other columns — `＋ Summary` dashed button (unset).

The footer renders dark (slate-900) with white text; unset cells show a `＋ Summary` dashed button; set cells show `mode-label  value  ▾`. Hovering a set cell tints the background and brightens the chevron.

The column header gets a subtle **Σ** indicator when a summary is active, so the user can see at a glance which columns are summarized.

Summary configuration lives in the footer cells themselves, not in the left view-builder pane. Summary settings are still part of the saved view.

This footer is the only summary surface — there is no separate "Matching: N companies · Total deployed · Avg / company" strip above the table. Different users care about different summaries, so saved views own the summary footer configuration instead of the product assuming the same answer bar for everyone.

### 8.4 Group-by mode

**Group by** is a view setting on the same Companies surface, not a separate destination. The mockup keeps `variant-a-groupby.html` only as a design convenience to show the grouped layout. In production, toggling group-by updates the current view state in place.

In group-by mode, the user picks **one or more grouping levels** in a Group-by popover. Each level has a dimension and a sort direction. Levels are ordered top to bottom (level 1 is the outermost grouping). The table renders as:

- **Level-1 group header rows** — one per distinct value of the level-1 dimension. Show the group's name, the row count, and (in their respective column cells) the same summary aggregations the user has set on each column, but computed only over the rows in this group.
- **Level-2 sub-group header rows** — within each level-1 group, one per distinct value of the level-2 dimension. Same shape, summaries computed over the sub-group's rows. Indented from the level-1 header to make hierarchy visible.
- Additional levels (level 3, 4, …) follow the same pattern with more indentation. Up to four levels.
- **Leaf rows** are the underlying company rows, indented under the deepest sub-group they belong to.
- **Chevrons** expand / collapse at every level independently.

The Group-by popover supports picking the dimension at each level from the same list of groupable fields (Sector, Country, Lead stage, Latest pipeline stage, Investment year, Fund family, Status, Founder demographics, Decarbon8 candidate, etc.), per-level sort direction, drag-to-reorder, remove, and `＋ Add another grouping level`.

The summary footer of group-by is the table-level aggregate; level-1 and level-2 headers each show the same aggregations applied to their slice. The mockup `variant-a-groupby.html` shows a full example of the same page state with filter `Invested = Yes`, group by **Status → Sector**, and summary aggregations set on **$ Invested (Sum)** and **Last touch (Latest)**.

### 8.5 Saved views — picker, modified state, explicit save

Views are the main way staff return to common questions. A view includes filters, search text, visible columns and column order, sort, group-by levels, summary footer aggregations, and left-rail filter order.

Views can be **shared** or **personal**. Shared views are curated for the whole staff; personal views belong to one user and never appear in the shared namespace.

**Compact picker, at the top of the view builder pane:**

```
[ All companies ▾ ]
Structure
  Columns      8 shown
  Group by     None
  Sort         Most recent app
Filters
  Search
  Furthest stage
  Investment Since
```

The button shows the current view's name and a `▾`. Click opens a popover.

**Popover contents:**

```
┌──────────────────────────────────────┐
│ [Find a view…                     ]  │
│                                      │
│  SHARED                              │
│  ● All companies (default)        ⋯  │
│    Active portfolio               ⋯  │
│    Active diligence               ⋯  │
│    Pitched · last 2y              ⋯  │
│    Underrepresented portfolio     ⋯  │
│    Canadian portfolio             ⋯  │
│                                      │
│  MINE                       [+ New]  │
│    Karen's diligence queue        ⋯  │
│    EV portfolio analysis          ⋯  │
│    PNW companies                  ⋯  │
└──────────────────────────────────────┘
```

- **Two sections.** *Shared* views are visible to all staff; *Mine* is private to the current user.
- **Active view dot.** `●` marks the loaded view.
- **(default) tag.** A user can mark one view as their personal default (`⋯` → Set as my default). If unset, the system default `All companies` is used.
- **`⋯` per row.** Rename, Set as my default, Duplicate, Make shared / Make personal, Delete. Permissions matter — only the owner / admins can rename, edit, or delete a shared view.
- **＋ New** in the *Mine* header creates a new personal view from the current filter state.
- **Search.** As-you-type filter over view names.

**Modified state and the explicit save flow.** When the user loads a view and changes any filter, search, sort, column, grouping, left-rail order, or summary aggregation, the page enters a **modified** state. The picker button shows it inline; a Save button appears to its right:

```
Companies   [ All companies · modified ▾ ]   [ Save ▾ ]   1,247 total · …
```

`Save ▾` opens a small menu:

- **Update "All companies"** — enabled only if the user owns the current view, or is an admin acting on a shared view.
- **Save as new view** — opens a save dialog with name, Personal or Shared, and optional color. The dialog follows the same compact modal styling as the Add Filter dialog shown in `view-builder.html`.
- **Discard changes** — reverts to the saved view's filter / column / sort / summary state.

If the user navigates away or switches views while modified, prompt: **"Save this view for later?"** Actions: **Update current view** (enabled when allowed), **Save as new personal view** (default for most users), **Save as new shared view** (permissioned), **Discard changes**, and **Cancel**. The prompt uses `AlertDialog` and a plain `Button` for async save actions; it must not use `AlertDialogAction` for save/update.

**View management dialog.** Reached from the bottom of the popover via "Manage all views". Lets the user rename, reorder within their personal section, change visibility, and delete in bulk.

**URL state.** The current view is captured by a slug (`?view=ev-portfolio-analysis`). Modifications append filter state to the URL so the user can share a one-off (`?view=ev-portfolio-analysis&country=ca`). Sharing a modified URL gives the recipient the modified view but doesn't change the saved view.

The summary settings (per column) and the grouping levels are part of the saved view (along with filters, columns, sort).

### 8.6 Seeded shared views

The new interface should launch with shared views that preserve today's useful admin views, translated into company-centered language. Exact names can be tuned with staff, but the seed set should include analogs of:

| Seeded shared view | Purpose |
|---|---|
| **All companies** | Default. All companies, sorted by most recent application. Minimal rail: Search, Furthest stage = any, Investment Since = ever. |
| **Companies** | Analog of today's Companies grid view. Company profile fields emphasized. |
| **Applications** | Analog of today's Applications grid view, but rows are still companies; application columns are visible and latest application is the primary sort. |
| **Investments** | Analog of today's Deployments view using UI language "Investments"; investment amount/date/fund columns and investment summaries visible. |
| **Pitch history** | Companies with Pitch / D8 Pitch / Follow-On Pitch events; pitch date column visible; sorted newest pitch first. |
| **Screening history** | Companies with screening events; screening date / decision columns visible. |
| **All events** | Companies with latest event and event-count columns; event filters available in the rail. |
| **Pipeline** | Active pipeline companies, grouped or sorted by current pipeline stage. |
| **Explore companies** | Staff-friendly company discovery view matching the useful parts of `/explore-companies`. |
| **Screening review** | Companies/applications currently in screening; screening rating columns visible where relevant. |

During implementation, audit the existing saved company/application/admin views and map each one to one of these shared views or to a narrower seeded view. Existing user-created private views should migrate to personal views when ownership can be identified.

## 9. The view builder — what users see

The chooser, the columns picker, and the custom-column builder all follow the same rule: **plain English, no schema, no types**.

### 9.1 Shown in the chooser

For each available filter:

- **Name** in plain English: "Sector", "Founder gender", "Latest pitch date", "Total invested".
- **One-line explanation** when needed: "The most recent application's current pipeline stage", "True if any of our investments was made via an SPV".
- (Optional) **A small grouping label** above the field: "About the company", "About our investments", etc.

### 9.2 View builder mockup

`view-builder.html` is the implementation reference for the left rail's Add Filter flow. It shows the filter rail, the `+ Add filter` control, the chooser dialog, domain-vs-A-Z sorting, recent filters, collapsible domain headings, already-added states, and the way a chosen filter is inserted back into the rail.

The list mockups (`variant-a-list.html` and `variant-a-groupby.html`) show the view builder rail in context. `view-builder.html` isolates the chooser interaction so implementation details that are difficult to see in the list surface remain explicit.

### 9.3 Custom column builder

For the rare case where the user wants something the pre-rolled set doesn't cover: a guided form that asks for a name, what to count/sum/find-latest-of, and which records to include. Hidden behind an "Advanced" disclosure.

### 9.4 Date and event filters

Date filters are first-class because many real questions are event-window questions, not status questions. The chooser includes:

| Filter | User control |
|---|---|
| **Applied date** | Between two dates; quick presets: this year, last year, last 12 months, all time |
| **Pitch date** | Between two dates; event types include Pitch, D8 Pitch, Follow-On Pitch |
| **Screening date** | Between two dates |
| **Diligence date** | Between two dates; includes diligence formed / complete / debrief events |
| **Investment date** | Between two dates |
| **Latest event date** | Between two dates |
| **Last touch** | Between two dates or relative window |

The date control is compact: `From [date]  To [date]` plus a small preset dropdown. Presets only set the dates; users can override either date manually.

## 10. Workflow catalog

The validation set; each must work:

1. **Companies in general** — no filters.
2. **Companies we've invested in** — Have we invested? = Yes.
3. **By category** — Have we invested? = Yes; Group by Sector.
4. **Underrepresented founders portfolio** — Have we invested? = Yes; Race/Ethnicity includes underrepresented values.
5. **Women founders portfolio** — Have we invested? = Yes; Gender includes Woman.
6. **Canadian portfolio** — Have we invested? = Yes; Country = Canada.
7. **Canadian applicants by stage** — Country = Canada; show Pipeline stage column.
8. **Exited / closed / active pivot** — Status filter, or Group by Status.
9. **Pitched in last 2y** — Latest pitch date in last 2 years.
10. **In diligence in 2025** — Was in diligence in 2025.
11. **Invested > $100K** — Total invested ≥ $100K.
12. **SPV investments** — Has SPV = Yes.
13. **Decarbon8 by year** — Fund = Decarbon8; Group by Investment vintage year.
14. **Active diligence right now** — Pipeline stage = Diligence.
15. **Furthest a company reached** — Furthest stage = Pitch (or Diligence Complete), Have we invested? = No. Answers "we passed but they got to pitch / diligence."
16. **Companies invested in the last year** — Investment Since slider = 1 year.
17. **Companies that pitched in a chosen window** — Pitch date between start/end dates.
18. **Companies with application text matching a term and investments in a chosen window** — Application content contains term; Investment date between start/end dates; summary footer on $ Invested = Sum.

## 11. Adopted from `/explore-companies`

| Pattern | What it is | Where it goes |
|---|---|---|
| `MultiSelectDropdown` | A dropdown that opens to a checkbox list with a search input on top | Every multi-value filter (Sector, State, Furthest Stage, Race/Ethnicity, Gender, Raise Instrument, etc.) |
| Furthest Stage rollup | Per-application + per-company computation of ladder position | New column and filter; tooltip explains the algorithm in plain English |
| Investment Since slider | 6-stop slider: N/A · 1y · 2y · 3y · 5y · Ever | Default left-rail filter |
| As-you-type, in-memory filter | Filter applies as the user types into a search box | The search input in the left rail, plus the filter chooser, plus dropdown search |
| Dynamic columns | A filter being active auto-shows its matching column | Same behavior — keeps the table from getting too wide when filters are inactive |
| Pipeline All / Active toggle | Two-button segmented control to scope to currently-active pipeline | Available as a filter; not in default rail |
| US/Canada-only country picker | Simplified country filter | The Country toggle |
| `formatAppliedMonth` | "Apr 2025" format with "unknown" for pre-Jul-2022 | Used in the row-expansion application history |

## 12. Where the other tabs go

`portfolio`, `instruments`, `marks`, `valuation`, and `events` tabs remain as power-user surfaces; their data also surfaces inside the unified company detail. Standalone removal is deferred.

## 13. UI Copy and Metacommentary policy

Per AGENTS.md §2 "UI Copy Minimalism": **minimal functional text by default; no explanatory or helper copy unless requested**.

- **Inside the white workspace area (anything that would render in the actual product):** zero instructional / explanatory copy. No "Updates as you type" tags on aggregate strips. No "(long-lived company facts)" subtitles on section headers. No per-field descriptions in dialogs. No "(rollup)" type tags on filter blocks. No "Example dropdown (always open here so the pattern is visible)" notes. No "Drag the ⋮⋮ handle..." help text.
- **Allowed in the actual UI:** field-meaning tooltips behind a `ⓘ` icon when the field genuinely needs explanation (Furthest Stage's algorithm, Status's lifecycle definition). These are tooltips on hover, not always-visible copy.

## 14. Typography

The base root font size is bumped above the framework default to give all admin text a more readable scale. Tailwind size tokens (`text-xs`, `text-sm`, `text-base`, etc.) and explicit pixel sizes throughout the mockups are calibrated to this larger root.

## 15. Field catalog and rollup proposals

Source of truth: `lib/admin-grid-config.js` — `TABLE_CONFIGS.{companies,applications,deployments}` and `SYSTEM_CUSTOM_FIELDS.companies`. The Add Filter dialog surfaces only fields that actually exist (or are explicitly proposed for engineering).

### 15.1 Available fields

**Companies grid fields** (all are filterable / sortable today):

- Identity: Company name, Website, Primary contact (name + email)
- Sector: Category, Secondary Category
- Location: City, State / Territory, Country
- Demographics: Underrepresented founder (boolean), Race / Ethnicity (multi), Gender (multi)
- Pipeline (rolled up from applications): # of applications, Most recent applied date, Most recent activity date, Current pipeline stage, Active pipeline (boolean), Raise instrument
- Investments (rolled up): Total invested ($), Latest investment date, In E8 Fund portfolio (boolean), In Decarbon8 portfolio (boolean), E8 Fund candidate (boolean), Decarbon8 candidate (boolean), Status (active / exited / written_off — UI shows as "Closed" for written_off)
- Lead handling: Lead stage, Lead source, Lead source detail, Internal leads, Follow-up date
- Notes: Notes count, Latest note date
- System: Created at, Updated at

**Applications grid fields:**

- Identity: Company, Dealum ID, Website, Primary contact (name + email)
- Sector: Category, Secondary Category
- Status: Status, Pipeline stage, In pipeline (boolean), Locked, Draft
- Investment: Invested $ (linked back to deployments)
- Fundraising: Follow-on, Raise instrument, Funding to date (boolean + amount), Capital seeking, Lead investor, Deal terms, Round close date, Financial position, Use of funds, Cap table
- Pitch content (long-text, full-text searchable): Tagline, Problem, Solution, Business Model, Market, Go to Market, Competitive Advantage, Traction, Competitors, Future Milestones, Patentable Ideas, Environmental Impact, Team, Management Qualifications
- Files: Pitch Deck URL, Data Room, Diligence Folder, Slack Channel
- Location + Demographics: same set as companies
- Notes: Notes count, Latest note date
- Dates: Applied date

**Deployments grid fields:**

- Identity: Investor, Investing Entity, Fund, Company, Instrument
- Categorization: Fund Family, Vintage, Instrument Type, Round, Category
- Date: Investment date, Year, Month
- Amount: Amount
- Flags: SPV, E8 Catalyzed, Is Follow-on

**Existing system custom-field rollups** (`SYSTEM_CUSTOM_FIELDS.companies`):

- `cf_decarbon8_portfolio_vintage` — Decarbon8 Vintage (latest fund vintage label)
- `cf_e8_fund_portfolio_vintage` — E8 Fund Vintage (latest fund vintage label)

### 15.2 Proposed new rollups

These rollups are required by the workflow catalog (§10). Each maps to an existing source field; the engineering work is in the rollup machinery, not in new schema.

| Proposed field | Source | Notes |
|---|---|---|
| **Furthest stage** | rollup over `company_events` + `deployments` | Already computed by `lib/cache-manager.js` for `/explore-companies` (§6) — lift into the admin-grid config as a system rollup on `companies` |
| **Has pitched** | rollup over `company_events` where event ∈ Pitch / Follow-On Pitch / D8 Pitch | Needs `company_events` as a rollup source table (not currently in `ROLLUP_SOURCE_TABLE_KEYS_BY_TABLE.companies`) |
| **Latest pitch date** | rollup over `company_events` | Same prerequisite |
| **Number of pitches** | rollup over `company_events` | Same |
| **Was in diligence** | rollup over `company_events` (Diligence-related events) + `diligence_teams` | Same |
| **Diligence year(s)** | rollup over `company_events` | Same; multi-year value |
| **Last event date** | rollup over `company_events` | Same |
| **Has SPV investment** | rollup over `deployments.spv` | Source already in `COMPANY_ROLLUP_DEPLOYMENT_SOURCE_FIELDS` |
| **Has follow-on investment** | rollup over `deployments.is_follow_on` | Same |
| **Has catalyzed investment** | rollup over `deployments.e8_catalyzed` | Same |
| **Number of investments** | count of `deployments` | Same |
| **First investment date** | MIN(`deployments.investment_date`) | Same |
| **Total returned** | Σ `deployments.amount_cents` where `record_type='return'` | Source already available |
| **Net invested** | Total invested − Total returned | Computed atop the above |
| **Funds invested via** | multi-value of distinct `deployments.fund` | Source already available |
| **Latest screening date** | MAX(`company_events.date`) where event='Screening' | Needs `company_events` rollup source |

The single largest engineering prerequisite is **adding `company_events` to `ROLLUP_SOURCE_TABLE_KEYS_BY_TABLE.companies`** and authoring a `COMPANY_ROLLUP_COMPANY_EVENTS_SOURCE_FIELDS` array. Once that's in, eight of the proposed rollups become declarative configuration.

### 15.3 The Add Filter dialog

The dialog's `FILTERS` array in `view-builder.html` is the mockup reference list, with 70+ entries across five domains. The production source of truth remains `lib/admin-grid-config.js` plus the proposed rollups in §15.2. Notable inclusions:

- **All 14 pitch-content long-text fields** from `applications` (Tagline, Problem, Solution, Business Model, Market, Go to Market, Competitive Advantage, Traction, Competitors, Future Milestones, Patentable Ideas, Environmental Impact, Team, Management Qualifications) — each filterable as a full-text search; plus an "Application content (full-text)" wrapper that searches across all of them at once for the "match anywhere in the pitch" case.
- **The fundraising / files / metadata columns** on `applications`: Cap table, Data room, Deal terms, Diligence folder, Financial position, Funding to date amount, Lead investor, Slack channel, Status (per application), Use of funds, Dealum ID.
- **Investing entity and Round** on `deployments` (the human-readable round name, e.g. "Pre-seed", "Series A").
- **Last updated date** on `companies` for the "what changed recently" query.

### 15.4 Dialog UI

- **Default sort: by domain.** Domain headings are **collapsible**. Click a heading to toggle. Default state: only "About the company" is expanded. Other domains start collapsed showing the count badge.
- **Auto-expand on search.** Typing in the search box auto-expands any domain whose fields match. Clearing the search returns to the user's manual expand state.
- **Alternative sort: A–Z.** Flat alphabetical list with no headings.
- **Domain headings** include a chevron, the domain name, a count badge, and a hairline rule extending across; hover background indicates the click target.
- **"Already added" rows** are visually de-emphasized (lighter text + greyed background) and not clickable.
- **Recent strip** above the field list — 4 frequently-used filters as chips for one-click re-add. Personal to the user.
- **Search.** Stays at top. Searches against field labels only (not types or domain names).
- File URL filters render as booleans — "Has data room / Has diligence folder / Has pitch deck."

## 16. Row interactions, table polish, kebab menu

### 16.1 Row click and expansion

- Clicking the chevron at the left toggles expansion (application history). The chevron is the only expand/collapse target.
- Clicking anywhere else on the company row opens the company detail pane.
- Inline controls inside the row, such as the kebab `⋯` button, call `event.stopPropagation()` so they don't open the pane.
- The expansion is a small inline table directly under the row.

### 16.2 Application history mini-table

Three columns: **Applied · Furthest stage · Pitch date.** See §7 for column definitions. Whole application row is clickable and opens the detail pane with the selected company and application reflected in URL state.

### 16.3 Kebab menu on each company row

Right-most column on each row holds a `⋯` button. Click opens a small dropdown menu carrying the actions that don't have a direct in-page affordance:

| Action | Why it's here |
|---|---|
| **Open company** | Navigation. Same destination as clicking the company name; provided here so right-click "Open in new tab" via the kebab is also natural. |
| **Open latest application** | Direct jump to the most-recent application's review surface. |
| ─ | |
| **Record valuation event…** | Power-user portfolio action. |
| **Apply cramdown…** | Wizard-style action that has no good inline trigger. |
| ─ | |
| **Delete company…** | Destructive, requires confirmation. Behind a kebab on purpose so it's never a click-target by accident. |

Closed by clicking outside or pressing Escape. Positioned absolute relative to the trigger button.

### 16.4 Company blurb clamp under company name

The company list/detail header uses `companies.blurb` for company-level descriptive text, clamped to two lines via the `tagline-clamp` CSS class where space is tight. Application tagline (`applications.tagline`) is not used as company header copy; it appears inside the selected application tab.

### 16.5 Logo handling

The list row does not show a logo or initials placeholder. The company detail header can still show a logo (or initials fallback). When `companies.logo_drive_file_id` is set, render `<img src="/api/files/<logo_drive_file_id>">` (proxied per AGENTS.md, never raw Drive URL).

### 16.6 Resizable, collapsible rail

The left filter rail and the main table are separated by a 6px vertical drag handle. Hovering or dragging the handle highlights it in blue. Drag horizontally to resize the rail (min 200px, max 560px; default 280px). A `‹` button at the top-right of the rail collapses it to a thin vertical button; clicking that button re-expands. Width and open/closed state persist in `localStorage`.

### 16.7 Company detail pane from the list

Opening a company from `variant-a-list.html` does not navigate away from the companies table. Row clicks, company-name links, application-history rows, and the header Detail link open a right-side detail pane over the list. The pane uses the same interaction model as the Development CRM relationship detail drawer:

- Fixed overlay aligned to the right with a subtle page scrim.
- Width is `min(96vw, 1320px)`.
- The detail content is `detail.html` rendered inside an iframe in the mockup; implementation can render the detail route/component directly.
- Close button sits outside the detail content at the top-right of the pane.
- Clicking the scrim closes the pane.
- While the pane is open, background page scrolling is locked.
- The table state, filters, expanded rows, and scroll position remain intact behind the pane.

Direct URLs for `/admin/company/<company_record_id>` can still render the same detail component, but the primary list workflow is an in-place detail pane.

## 17. Company detail page (view + edit)

The redesigned detail page replaces both today's `/admin/company/<id>` (`EditCompanyIsland`) and `/admin/application/<id>` (`EditApplicationIsland`) routes. One company; all of its data accessible without leaving the page.

### 17.1 Detail surfaces

- **`variant-a-list.html` detail pane** — primary read workflow. Opens `detail.html` over the company list without losing table state.
- **`view-builder.html`** — focused Add Filter / filter chooser interaction for the Companies list left rail.
- **`detail.html`** — read-mostly **view** of one company. Every section visible; every section is what a staff person would *consume* (read) about the company. Some fields can be edited in place (pencil hover) but the page's role is to inform. It is pane-ready and does not include a list breadcrumb/back header.
- **`detail-edit.html`** — edit-form density and control-pattern reference. It is not the canonical source for detail-page read layout or sample data; the implementation should use the field grouping rules in §17.4 and §17.6.

Switching between view and edit preserves scroll position and the section anchor.

### 17.2 Detail page information architecture

The detail page is company-first. The top of the page must establish the durable company identity before showing any application-specific content. Administrators often think in terms of "the company" even when the data comes from an application, so the UI makes the boundary visible without forcing the user to understand the schema.

Order on `detail.html`:

1. **Company header** — single compact company summary. Shows logo, company name, portfolio-company tag when applicable, category/subcategory, HQ, website, company blurb, company status, conditional invested amount, and conditional current stage. It must not repeat the same facts in a second profile card below.
2. **Investments panel** — collapsible, open by default. Uses the same content model as Application Review's `InvestmentsSection` on `application-review?tab=details&section=investments`. Investments are never nested under an application tab because E8 invests in companies, not applications.
3. **Applications workspace** — one tab per application, sorted newest first. Application tabs are the primary way to read pipeline submissions.
4. **Right rail** — stacked accordion panels following the `application-review?tab=diligence` right-rail model. Notes and Emails are first-class panels in this stack, not small cards. Application-scoped document and recording panels live inside the selected application tab instead.

All major panels use the same disclosure pattern: chevron + title + one-line summary in the header; body hidden when collapsed. Default open/closed state is a product setting, not hard-coded to the component.

### 17.2.1 Detail page data provenance

Do not invent display text or metrics. Every label/value on the detail page must come from one of these sources or be hidden.

| Display | Source / generation rule |
|---|---|
| Company name | `companies.name` |
| Logo | `companies.logo_drive_file_id` rendered via `/api/files/<id>`; initials fallback only when empty |
| Category | `companies.category` |
| Subcategory tags | parse `companies.secondary_category`; supports JSON arrays and legacy strings |
| HQ | `companies.city`, `companies.state`, `companies.country` |
| Website | `companies.website` |
| Company blurb | `companies.blurb`; if empty, omit the blurb area. Do not substitute an application tagline unless explicitly labeled as latest application tagline. |
| Company status | `companies.status`; display as its own field only, never combine into invented labels such as "Active investment" |
| Portfolio company tag | show when `SUM(deployments.amount_cents WHERE company_record_id = companies.record_id AND record_type='deployment') > 0` |
| Invested amount | `SUM(deployments.amount_cents WHERE company_record_id = companies.record_id AND record_type='deployment')`; show `Invested: $x` if and only if the sum is greater than zero |
| Deployment rows | `deployments` rows sorted newest first by `investment_date` |
| Instrument count/status | `instruments` rows for `company_record_id`; count by `instruments.status`, label exactly from normalized status |
| Current stage | latest/current `pipeline_stages.stage` for an application in a non-terminal stage. Terminal stages are exactly `Invested`, `Not Moving Forward`, and empty/null stage. Show `Current stage: <stage>` if and only if at least one application is in a non-terminal stage; otherwise omit it. Do not call it company role. |
| Furthest stage | derived from `company_events` and investments using the Furthest Stage rules in §6. If implementation cannot compute it confidently, omit the company-level rollup and show per-application stage pills only. |
| Notes count/list | `company_notes` rows by `company_record_id`, plus `application_record_id` when scoped to an app |
| Emails count/list | `person_communications` rows by `company_record_id` |
| Application documents | Application-scoped document/link sources only: pitch deck fields on `applications`, current diligence/supporting-document endpoints, and `reference_documents` by `application_record_id` where applicable. Do not aggregate unlabeled application documents into a company-level document list. |
| Application recordings/transcripts | Application-scoped recording/transcript sources only. Every row must show which application it belongs to when shown outside the selected application context. |

The mockup uses staging data from Embue (`companies.record_id = rec4vI3UkomccgqII`) as a realism reference. Implementation must query the current company at runtime and hide unavailable fields instead of carrying over Embue text.

### 17.3 Header banner

Always at the top of the page content:

- Logo image via `/api/files/<logo_drive_file_id>` or initials fallback, never a raw Google Drive URL.
- Company name (`h1`).
- Portfolio-company tag when the company has one or more deployment rows with `record_type='deployment'`. This is a derived tag, not a stored status.
- Company status from `companies.status` as a separate plain field when present.
- `Invested: $x` directly after company status if and only if total deployment amount is greater than zero.
- `Current stage: <stage>` directly after invested amount if and only if a non-terminal application stage exists.
- Primary category and subcategory tags.
- Company blurb from `companies.blurb` directly under the name when present. Do not show application tagline here.
- HQ and website link.
- Edit affordance is a small pencil icon that appears on hover over the company tile. It links to `detail-edit.html` and does not reserve layout space before hover.
- Do not show an `Add note` button in the company tile. New notes are created from the Notes rail header action.

### 17.4 Company summary and edit fields

The view page should not have a second Company Profile panel that repeats the header. Company facts appear once, in the compact company summary at the top. Edit mode still needs the full company-owned field set, with grouping rendered in edit mode (mirroring `EditCompanyIsland`'s `CompactRow` 160px-label pattern):

| Row label | Controls on the same row |
|---|---|
| Name | Name · Logo · Website |
| Blurb | Company blurb (`companies.blurb`) |
| Sector | Primary category (single-select) · Subcategory (multi-select) |
| HQ | City · State / Province · Country (3 inputs) |
| Founder demographics | Race / Ethnicity (multi) · Gender (multi) |
| Underrepresented | Yes / No checkbox |
| Referral partner | Partner picker + pills |
| Lead source | Lead source (multi-select) · Lead source detail (text) — both on one row |
| Internal leads | Multi-people picker |
| Follow-up date | Date input (YYYY-MM-DD) |

Company `status` is displayed exactly from `companies.status` when present. Portfolio-company state is a derived tag from investments and is not editable here.

### 17.5 Contacts section

`ContactPillsEditor`-style. Each contact is a pill: name + title + role badge (Primary / Other). Inline `+ Add contact` opens a person picker. Each pill has a small `×` to remove; clicking a pill opens the person detail.

### 17.6 Applications workspace

The Applications workspace uses tabs, not stacked cards. Each tab represents one application, sorted newest first. Tab labels are intentionally compact:

- Month/year from `applications.date_added`, formatted `Mon YYYY`.
- One tag for the application form/source: `E8`, `D8`, `Returning`, or `Dealum`.
- Do not include stage, outcome, close date, or extra descriptive microcopy in the tab label.

Application form/source tag generation:

- `D8` when `applications.decarbon8` is true.
- `Returning` when `applications.follow_on` is true.
- `Dealum` when `applications.dealum_id` is non-empty.
- `E8` otherwise.
- Precedence is exactly `D8`, `Returning`, `Dealum`, `E8`.

If a company has zero applications, the workspace shows an empty state with the company profile/investments still visible. Do not show a `New application` button in the read-only detail mockup.

Within the active tab, the layout is:

1. **Application section menu** — fixed-width left rail on desktop, stacked above content on mobile. It mirrors the section model on `/application-review?tab=details`: selecting one menu item replaces the right-side content with that section. It is not an accordion and does not show multiple sections at once.
2. **Application content area** — main column. Shows only the selected section. The default selected section is **Basics**.
3. **Application edit link** — available from the tab or active application header, linking to the edit route with `?application=<application_record_id>`.

Application section menu options, in order:

| Menu item | Contents | Source |
|---|---|---|
| **Basics** | Pitch deck/video area, tagline, problem, solution, business model, market, go to market, competitive advantage, traction, competitors, future milestones, patentable ideas, environmental impact, application notes | `applications`, pitch deck file fields |
| **Team** | Team and management qualifications | `applications.team`, `applications.management_qualifications` |
| **Raise Details** | Funding to date, funding-to-date amount, non-dilutive amount, capital seeking, raise instrument, have lead, lead investor, round close date, financial position, use of funds, employee count, deal terms, cap table | `applications`; structured deal-term metadata comes from `application_instruments.metadata_json` when present |
| **Screening** | Applied date, current stage, application form/source, Decarbon8 flag, follow-on flag, screening notes/ratings when available | `applications`, `pipeline_stages`, existing screening rating/detail endpoints |
| **Diligence Team** | Diligence lead and member assignments | existing diligence team/membership data keyed by `application_record_id` |
| **Discussions** | Application-scoped discussion threads and unread count | existing application discussion endpoints keyed by `application_record_id` |
| **Documents** | Application-scoped supporting documents only. Empty state when none exist. | Application document endpoints / `reference_documents.application_record_id` / current diligence document sources |
| **AI Insights** | Generated application insight content when present | existing AI insight fields/endpoints keyed by `application_record_id` |
| **Ask the AI** | Application-scoped AI question surface | existing Ask AI application context |
| **History** | Application event timeline | `company_events` filtered by `application_record_id`, ordered by event date |

The menu uses a compact light selected state: blue-tinted background, subtle border, and a 3px blue inset bar on the left. It does not use a dark active background. Optional counts, such as Discussions or Documents, appear as small quiet badges aligned to the right of the menu item. On mobile, menu items wrap into a compact two-column grid above the selected section.

Investments do not appear in the application section menu because E8 invests in companies, not applications. Company-level investments are shown only in the top Investments panel. Ratings do not appear as a company-level placeholder panel; screening and rating-related data belongs in the selected application's **Screening** section.

The active company, active application, and active application section must be reflected in the URL so admins can copy a link to the exact state. The implementation can use query params or route params, but it must encode:

- `company` — `companies.record_id`
- `application` — `applications.record_id` for the selected application tab
- `section` — the selected application section id, matching the left menu item

Changing the selected company, application tab, or application section updates the URL without a full page reload. Loading a deep link opens the company detail pane, selects the matching application tab, and selects the matching application section. If a URL references an application that does not belong to the company, fall back to the newest application and default **Basics** section.

Empty application sections use short factual empty states derived from zero records, such as `No supporting documents are attached to this application.` or `No diligence team records.` Do not add instructional copy.

Body — **all editable application fields** remain visible somewhere on the active application tab. Fields with no value render a quiet `Not provided` state so implementers and admins can see that the field exists. Application tagline is a real current column, `applications.tagline`, and appears as **Tagline** inside the application tab. Company blurb is `companies.blurb` and appears only in the company summary.

**Application content fields shown in the main content area:**

- `applications.tagline` — label: Tagline
- `applications.problem` — Problem
- `applications.solution` — Solution
- `applications.business_model` — Business Model
- `applications.market` — Market
- `applications.go_to_market` — Go To Market
- `applications.competitive_advantage` — Competitive Advantage
- `applications.traction` — Traction
- `applications.competitors` — Competitors
- `applications.future_milestones` — Future Milestones
- `applications.patentable_ideas` — Patentable Ideas
- `applications.environmental_impact` — Environmental Impact
- `applications.team` — Team
- `applications.management_qualifications` — Management Qualifications
- `applications.deal_terms` — Deal Terms
- `applications.cap_table` — Cap Table
- `applications.notes` — Application Notes

**Application raise/background fields shown in the section menu content:**

- `applications.date_added`
- `applications.dealum_id`
- `applications.decarbon8`
- `applications.follow_on`
- `applications.pitch_deck_drive_file_id`
- `applications.funding_to_date`
- `applications.funding_to_date_amount_cents`
- `applications.non_dilutive_amount_cents`
- `applications.capital_seeking`
- `applications.raise_instrument`
- `applications.have_lead`
- `applications.lead_investor`
- `applications.round_close_date`
- `applications.financial_position`
- `applications.use_of_funds`
- `applications.num_employees`

**Pitch Deck** — embedded PDF viewer (per `PitchDeckTile.jsx`): header bar with "Pitch Deck" label, page counter (`{currentPage} / {numPages}`), Expand, Download. Body renders the PDF via `pdfjs-dist` into a `<canvas>`. Bottom-overlaid prev/next page nav. Keyboard left/right cycles pages, Escape collapses. In edit mode, a Replace / Remove control is added; the embedded viewer stays.

**Pitch Video** — when `application.latestRecording.status === 'submitted' | 'archived'`, render `<PitchVideoSection>`. Sits beside the pitch deck (deck shrinks to one column, video takes the other). When video plays, video expands to fill the row.

**Deal Terms** — the field `applications.deal_terms` holds an AI-generated descriptive paragraph. The structured metadata lives in `application_instruments.metadata_json` (round, instrument type, valuation cap, discount, MFN, etc.). In view mode, render the paragraph as plain text. In edit mode, render the paragraph + an `Edit Deal Terms` button that opens the **`DealTermsWizard`** dialog (4 steps for application mode: type → type-specific terms → details → review). When the wizard saves, the AI re-generates the paragraph from the new structured metadata; the paragraph in the field updates.

### 17.7 Investments section

Company-level panel near the top of the detail page. It should match `src/components/application-review/InvestmentsSection.jsx` rather than the old deployment-row grid.

Header/body behavior:

- The surrounding company-detail panel remains collapsible.
- Inside the expanded body, render the Application Review investments summary:
  - `Total invested: $x` when total invested is greater than zero.
  - `First investment: Month YYYY` when `firstInvestDate` exists.
  - Empty state text from the existing section when there is no investment data and the company/application context is not follow-on.

Rounds table:

| Column | Source / rule |
|---|---|
| Round | `round.roundName` from `/screening-review/api/company-rounds-summary?companyRecordId=<company_record_id>` |
| Investors | Admin/permissioned users see `round.investorNames`; otherwise show `round.investorCount` |
| Date | `round.earliestDate`, formatted `Mon YYYY`; `-` when blank |
| Amount | `round.totalAmount`, formatted with no cents; `-` when zero |
| Est Value | `round.estimatedValue`, formatted with no cents; `-` when zero |

The table has the same compact styling as Application Review: plain text rows, subtle bottom borders, right-aligned monospaced currency columns, `Est Value` separated by a left border, and a bold Total row. The Total row sums `totalAmount`, sums `estimatedValue`, and shows unique investor count (`N unique` for permissioned/admin users or `N` for count-only users).

Data source details:

- Fetch rounds from `/screening-review/api/company-rounds-summary?companyRecordId=<company_record_id>`.
- This endpoint is backed by `cacheManager.getCompanyRoundsSummary(companyRecordId)`.
- Do not build this panel directly from raw `deployments` rows. Deployment-level rows are not the intended display here.
- Include instrument/round rows even when the amount is zero, matching the current Application Review behavior.

### 17.8 Company right rail accordion

Use the same scaling model as the diligence right rail (`src/islands/diligence-tab/RightRail.jsx`):

- Fixed right-side rail on desktop, top-aligned with the company tile. It must not sit lower than the left column content.
- Full-width stacked below main content on narrow screens.
- Default state on `detail.html` is collapsed.
- Rail width defaults to 380px in the mockup. Implementation should persist the user's chosen width in local storage.
- The rail has a draggable left resize handle. Dragging left/right resizes the rail between the minimum and maximum widths. Dragging narrower than the collapse threshold collapses the whole rail.
- When the rail is collapsed, it becomes a 36px vertical band on the right with count badges at the top, a vertical "Activity" label, and an open chevron. Collapsed count badges include an icon inside the badge so users can distinguish notes from email without opening the rail. These badges should be allowed to be vertical ovals or compact rounded rectangles; do not force the icon and number into a tight circle. Clicking the band restores the prior open rail width.
- One panel may be expanded at a time. Opening Emails collapses Notes; opening Notes collapses Emails.
- Clicking the heading of the currently expanded panel collapses it, leaving the rail open with only panel headers visible.
- Panel headers use a light background, chevron, title, colored count badge, and optional action button. Do not use dark/black header bars.
- Count badge colors are semantic and consistent in both the collapsed band and expanded panel headers: gray/quiet when the count is zero, green when notes count is greater than zero, and yellow when emails count is greater than zero.
- The rail has a full-height scrollable body for the active panel.
- Target panels for this company detail page:
  - Notes
  - Emails

Do not put application-scoped documents, transcripts, or recordings in the company right rail. Those belong inside the selected application tab's section menu so older application material does not get mixed with newer application material.

### 17.9 Notes rail panel

Loads `company_notes` for this company plus application-scoped notes where `company_record_id` matches. Sort newest first by `date DESC, created_at DESC`.

Each note summary shows:

- Author avatar/photo when available, otherwise initials.
- Author name resolved from `author_person_record_id`.
- Type pill from `company_notes.type`.
- Markdown note preview rendered with the shared notes renderer.
- `Read More...` affordance when the note is truncated.
- Quiet footer metadata: created date/time from `created_at` or `date`, and stage from `company_notes.stage` when present.
- Application scope when `application_record_id` is set.

`+` in the panel header opens the same note composer behavior as the current company notes sheet. Attachments come from `company_note_attachments`.

### 17.10 Emails rail panel

Chronological list of `person_communications` rows scoped by `company_record_id`, sorted `sent_at DESC`. This panel is read-only.

Each collapsed email row shows a scan summary:

- Sender and recipient: `sender_name`/`sender_email` → `recipient_name`/`recipient_email`
- Date and time from `sent_at`, formatted in the user locale
- Subject from `subject`; if null, omit the subject line rather than generating one
- Preview from `body_text`, stripped of HTML/markdown and truncated
- Message kind from `source`/`channel` using the same mapping as `getEmailKindLabel()` in `src/islands/shared/EmailsPanel.jsx`

Clicking a row expands it inline into an email-like view. Expanded rows show From, To, Subject, Date, and then the body text. Do not add a "Body" or "Content" label above the body. Attachments render below the body when `attachments_json` is non-empty.

### 17.11 Date formats

- **`YYYY-MM-DD`** for date inputs and most read-display dates (e.g., investment date, follow-up, round close, diligence date formed, note date).
- **`Mon D, YYYY`** ("Mar 12, 2026") for the Companies list **Latest event** column.
- **`Mon YYYY`** ("Apr 2026") for application month-of-applied and round date summaries.
- **"N days ago"** / **"N wk ago"** / **"N mo ago"** for the Last touch column.

### 17.12 Edit page (detail-edit.html)

`detail-edit.html` demonstrates edit density and form controls. The production edit page should keep the same company/application URL state as the view page, but it does not need to copy the old edit mockup's left nav or sample company data. Each field becomes an input. Field grouping mirrors `EditCompanyIsland`'s `CompactRow` pattern (160px right-aligned uppercase label · multi-input row). For application fields, grouping mirrors `EditApplicationIsland`'s 2-column grid for pitch-content fields plus the special Deal Terms launcher.

Header actions on the edit page:

- Back arrow to view page
- Save (PATCH only changed fields, per the diff-based pattern `buildChangedFieldsPayload` already uses)
- Cancel (discard changes, prompt if dirty)

### 17.13 Routes

- List view: `/admin/companies`; selecting a company opens the detail pane without leaving this route.
- Direct view: `/admin/company/<co_record_id>` renders the same detail component as a full page for reloads, deep links, and external links.
- Edit: `/admin/company/<co_record_id>/edit`
- Deep links use URL state for the exact detail-pane state: `?company=<co_record_id>&application=<app_record_id>&section=<section_id>`. The supported `section` values are `basics`, `team`, `raise`, `screening`, `diligence-team`, `discussions`, `documents`, `ai-insights`, `ask-ai`, and `history`.

Legacy `/admin/application/<app_record_id>` redirects to `/admin/company/<co_record_id>?application=<app_record_id>&section=basics` for read view or `/admin/company/<co_record_id>/edit?application=<app_record_id>` for edit actions.

## 18. Design Guide Compliance checklist

- **Form layout (labels-left, content-sized controls)** — pass.
- **Table density / sticky header / paging** — pass; `!overflow-visible` wrapper + `sticky top-0 z-20` header.
- **Search input** — pass; placeholder is concise, no "type N+" hint.
- **In-header filtering** — pass; filters use compact controls.
- **Sort indicators** — pass.
- **Dialog / copy minimalism** — pass; chooser shows label only, no subtitle, no footer instructional text.
- **Plain English in user-facing copy** — pass per §9.
- **Empty cells render blank, not `-`** — pass.
- **Filter chips content-sized (`w-fit`)** — pass.
