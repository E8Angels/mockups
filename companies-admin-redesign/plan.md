---
title: Companies Admin Redesign
owner: jordan
home: variant-a-list
---

# Companies admin redesign

## 1. The problem

The admin at `/admin/companies` exposes eight tabs, each a near-1:1 rendering of a database table. Most real questions cross all four staff-facing tables (`companies`, `applications`, `deployments`, `company_events`); the UI exposes each separately and forces the user to do the join in their head. The redesign is presentation, filter, and aggregation only — no schema changes.

The `/explore-companies` page is the closest existing answer to the same problem space. The redesign adopts what already works there — the MultiSelectDropdown component, the Furthest Stage rollup, the Investment Since slider, the as-you-type filter — and only innovates where explore-companies doesn't go.

## 2. Direction

- **One Companies surface, no top-level tabs.**
- **Four dimensions** — Company, Application, Investment, Event.
- **Built on the existing `/explore-companies` patterns** wherever those patterns already work. New UI inherits the MultiSelectDropdown component, the Furthest Stage algorithm, the Investment Since slider, the as-you-type filter, and the "dynamic columns" idea (when a filter is active, the matching column appears).
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
| Status | derived rollup | see §3 |
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

Clicking anywhere on a company row toggles its inline expansion (the chevron is a visual indicator only, not the click target). The expansion is a single inline table showing every application, sorted newest first. Three columns:

| Applied | Furthest stage | Outcome |
|---|---|---|
| Apr 2025 | Diligence Complete | Invested |
| Mar 2024 | Diligence Complete | Passed |
| Feb 2022 | Screen | Passed |

- **Applied** — month + year, derived from `applications.date_added`. Same `formatAppliedMonth` formatter as explore-companies; pre-2022-07 reads "unknown."
- **Furthest stage** — per-application furthest, computed identically to §6.1.
- **Outcome** — one of:
  - **Invested** — at least one deployment ties to this application (or its company).
  - **Passed** — the application's pipeline_stage is terminal and no deployment exists.
  - **In progress** — pipeline_stage is non-terminal.
- The whole application row is clickable and navigates to the application's anchor on the detail page.

If a company has zero applications, the expansion shows a small placeholder. If a company has investments but no application row (rare; some legacy direct investments), it's noted.

## 8. The Companies surface — layout

### 8.1 Default columns (in order)

1. **Company** — name + favicon (or initials placeholder). Click → detail. Two-line clamped tagline beneath, with full text in the `title` tooltip.
2. **Sector** — primary category pill.
3. **HQ** — state + country.
4. **Furthest stage** — pill.
5. **$ Invested** — right-aligned. Blank if 0.
6. **Status** — Active / Exited / Closed / blank. (§3)
7. **Latest event** — event name + date (most recent `company_events` row).
8. **Last touch** — derived.

Dynamic columns: when a filter is active for a field that isn't already shown, the matching column appears automatically (e.g. filter by Race/Ethnicity → that column appears; filter by State → that column appears). Pattern lifted from explore-companies (`DYNAMIC_COLUMN_DEFS` ~line 203).

Each row carries a `⋯` kebab menu at its right edge (§17.3).

### 8.2 Left rail — search, filters, and applied state

The left rail is the single representation of what is filtered. Its contents, top to bottom:

1. **Search** — as-you-type input across company name, tagline, primary contact, application content fields, and event notes. Lives in the rail; there is no separate top-of-page search bar.
2. **Have we invested?** — Yes / No / Either toggle.
3. **Sector** — multi-select dropdown (checkboxes).
4. **Country** — US / Canada toggle. (We only accept applications from these two.)
5. **State / Province** — multi-select dropdown (searchable; appears below Country, populated from US + CA combined).
6. **Furthest stage** — multi-select dropdown.
7. **Status** (Active / Exited / Closed) — multi-select dropdown.
8. **Investment Since** — slider with stops: N/A · 1 year · 2 years · 3 years · 5 years · Ever. (Lifted from explore-companies.)
9. **Founder demographics** — opens to two sub-pickers: *Race / Ethnicity* and *Gender*, both multi-select dropdowns.

A drag handle (`⋮⋮`) on each filter group lets the user reorder filters in the rail. Each group has a "remove" affordance (×) that returns it to the chooser. A `＋ Add filter` button at the bottom of the rail opens the chooser (see `view-builder.html`). The user's filter order persists on their profile.

The rail is **collapsible**. A `‹` button at the top-right collapses it to a thin vertical button; clicking the vertical button re-expands. Drag the resize handle all the way left also collapses. State persists in `localStorage`. The drag handle between rail and main is 6px, highlights blue on hover/drag, and resizes the rail from 200px to 560px (default 280px).

Because the left rail expresses the entire filter state, there is no horizontal chip bar above the table.

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

This footer is the only summary surface — there is no separate "Matching: N companies · Total deployed · Avg / company" strip above the table.

### 8.4 Group-by mode

A **Group by** button at the top-right of the page navigates to `variant-a-groupby.html`, the group-by view of the same data.

In group-by mode, the user picks **one or more grouping levels** in a Group-by popover. Each level has a dimension and a sort direction. Levels are ordered top to bottom (level 1 is the outermost grouping). The table renders as:

- **Level-1 group header rows** — one per distinct value of the level-1 dimension. Show the group's name, the row count, and (in their respective column cells) the same summary aggregations the user has set on each column, but computed only over the rows in this group.
- **Level-2 sub-group header rows** — within each level-1 group, one per distinct value of the level-2 dimension. Same shape, summaries computed over the sub-group's rows. Indented from the level-1 header to make hierarchy visible.
- Additional levels (level 3, 4, …) follow the same pattern with more indentation. Up to four levels.
- **Leaf rows** are the underlying company rows, indented under the deepest sub-group they belong to.
- **Chevrons** expand / collapse at every level independently.

The Group-by popover supports picking the dimension at each level from the same list of groupable fields (Sector, Country, Lead stage, Latest pipeline stage, Investment year, Fund family, Investment status, Founder demographics, Decarbon8 candidate, etc.), per-level sort direction, drag-to-reorder, remove, and `＋ Add another grouping level`.

The summary footer of group-by is the table-level aggregate; level-1 and level-2 headers each show the same aggregations applied to their slice. The mockup `variant-a-groupby.html` shows a full example: filter `Invested = Yes`, group by **Status → Sector**, with summary aggregations set on **$ Invested (Sum)** and **Last touch (Latest)**.

### 8.5 Saved views — picker, modified state, explicit save

**Compact picker, next to the page title:**

```
Companies   [ All companies ▾ ]   1,247 total · 312 invested · 84 active applications
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

**Modified state and the explicit save flow.** When the user loads a view and changes any filter, sort, column, grouping, or summary aggregation, the page enters a **modified** state. The picker button shows it inline; a Save button appears to its right:

```
Companies   [ All companies · modified ▾ ]   [ Save ▾ ]   1,247 total · …
```

`Save ▾` opens a small menu:

- **Update "All companies"** — enabled only if the user owns the current view, or is an admin acting on a shared view.
- **Save as new view** — opens the save dialog (in `view-builder.html`): name, Personal or Shared, optional color.
- **Discard changes** — reverts to the saved view's filter / column / sort / summary state.

Switching views while modified pops a confirmation: *"Discard changes to the current view?"*

**View management dialog.** Reached from the bottom of the popover via "Manage all views". Lets the user rename, reorder within their personal section, change visibility, and delete in bulk.

**URL state.** The current view is captured by a slug (`?view=ev-portfolio-analysis`). Modifications append filter state to the URL so the user can share a one-off (`?view=ev-portfolio-analysis&country=ca`). Sharing a modified URL gives the recipient the modified view but doesn't change the saved view.

The summary settings (per column) and the grouping levels are part of the saved view (along with filters, columns, sort).

## 9. The view builder — what users see

The chooser, the columns picker, and the custom-column builder all follow the same rule: **plain English, no schema, no types**.

### 9.1 Shown in the chooser

For each available filter:

- **Name** in plain English: "Sector", "Founder gender", "Latest pitch date", "Total invested".
- **One-line explanation** when needed: "The most recent application's current pipeline stage", "True if any of our investments was made via an SPV".
- (Optional) **A small grouping label** above the field: "About the company", "About our investments", etc.

### 9.2 Live click-through

`view-builder.html` includes a working interactive demo: click "+ Add filter", browse the chooser, click "Founder demographics", and the filter is added to the left rail. The user can then expand its dropdown, pick race/ethnicity values, and see the filter reflected in the left rail.

### 9.3 Custom column builder

For the rare case where the user wants something the pre-rolled set doesn't cover: a guided form that asks for a name, what to count/sum/find-latest-of, and which records to include. Hidden behind an "Advanced" disclosure.

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

The dialog's `FILTERS` array in `view-builder.html` is the canonical list, with 70+ entries across five domains. Notable inclusions:

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

- Clicking anywhere on a company row toggles its expansion (application history). The chevron at the left is a visual indicator of expand state (▸ collapsed, ▾ expanded), not the click target.
- Inline links inside the row (company name → detail page, kebab `⋯` button) call `event.stopPropagation()` so they don't also trigger the expand.
- The expansion is a small inline table directly under the row.

### 16.2 Application history mini-table

Three columns: **Applied · Furthest stage · Outcome.** See §7 for column definitions. Whole application row is clickable and navigates to `/admin/company/<id>#app-<id>`.

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

### 16.4 Tagline clamp under company name

The tagline (`applications.tagline` for the latest application, or `companies.blurb` as fallback) renders under the company name in muted text, **clamped to two lines** via the `tagline-clamp` CSS class. The full text is in the `title` attribute so the native browser tooltip shows on hover.

### 16.5 Logo placeholder

The colored square next to each company name with the initials is a **logo placeholder**. When `companies.logo_drive_file_id` is set, the cell renders `<img src="/api/files/<logo_drive_file_id>">` in its place (proxied per AGENTS.md, never raw Drive URL). When no logo exists, the initials placeholder with a deterministic color hash stays.

### 16.6 Resizable, collapsible rail

The left filter rail and the main table are separated by a 6px vertical drag handle. Hovering or dragging the handle highlights it in blue. Drag horizontally to resize the rail (min 200px, max 560px; default 280px). A `‹` button at the top-right of the rail collapses it to a thin vertical button; clicking that button re-expands. Width and open/closed state persist in `localStorage`.

## 17. Company detail page (view + edit)

The redesigned detail page replaces both today's `/admin/company/<id>` (`EditCompanyIsland`) and `/admin/application/<id>` (`EditApplicationIsland`) routes. One company; all of its data accessible without leaving the page.

### 17.1 Two pages

- **`detail.html`** — read-mostly **view** of one company. Every section visible; every section is what a staff person would *consume* (read) about the company. Some fields can be edited in place (pencil hover) but the page's role is to inform.
- **`detail-edit.html`** — full **edit form**. Same sections, same field set, all editable. Reached from `detail.html` via an `Edit` button in the header (top-right) or via a per-section ✎ icon (drops you into edit mode anchored at that section).

Switching between view and edit preserves scroll position and the section anchor.

### 17.2 Sections (left-rail nav, in order)

1. **Overview** — header banner facts + last-touch feed (5 most recent notes / emails / events).
2. **Profile** — long-lived company facts.
3. **Contacts** — people associated with the company (`company_contacts` → `people`).
4. **Applications** — one card per application, each with all 28+ application fields.
5. **Investments** — deployments + linked instruments + marks, in one ledger.
6. **Notes** — `company_notes` for this company (and its applications), as a feed.
7. **Emails** — `person_communications` scoped to this company.
8. **Events** — `company_events` chronological list.
9. **Ratings & Decisions** — screening ratings + decision messages per application.

Notes and Emails are first-class scrollable sections on the detail page itself.

### 17.3 Header banner

Always at the top, sticky:

- Logo (or initials placeholder, per §16.5)
- Company name (h1)
- **Status** pill — **Active / Exited / Closed** (or blank). The Status definition (§3) is the single source of truth. "Portfolio" is not a value.
- Sector · HQ · Website link
- Right side: key stats — `$ Invested · N investments · Latest application: year + stage · Last touch: date`
- `Edit` button (top right) → flips to `detail-edit.html` (or to edit mode)

### 17.4 Profile section (view + edit)

Fields, with the grouping rendered in edit mode (mirroring `EditCompanyIsland`'s `CompactRow` 160px-label pattern):

| Row label | Controls on the same row |
|---|---|
| Name | Name · Website |
| Sector | Primary sector (single-select) · Secondary sector (multi-select) |
| HQ | City · State / Province · Country (3 inputs) |
| Founder demographics | Race / Ethnicity (multi) · Gender (multi) |
| Underrepresented | Yes / No checkbox |
| Referral partner | Partner picker + pills |
| Lead source | Lead source (multi-select) · Lead source detail (text) — both on one row |
| Internal leads | Multi-people picker |
| Follow-up date | Date input (YYYY-MM-DD) |

The "Lead & Source" card from today's `EditCompanyIsland` is renamed simply **Profile**. Status is derived (§3) and displayed only in the header banner; not editable in the Profile section.

### 17.5 Contacts section

`ContactPillsEditor`-style. Each contact is a pill: name + title + role badge (Primary / Other). Inline `+ Add contact` opens a person picker. Each pill has a small `×` to remove; clicking a pill opens the person detail.

### 17.6 Applications section

One card per application, sorted newest first. Header:

- Year · month applied (e.g. **Apr 2025**)
- Furthest stage pill
- Outcome (Invested / Passed / In progress) per §16.2
- Decarbon8 / Follow-on / Locked / Draft badges if true
- `Edit` icon → drops into the application's edit anchor on `detail-edit.html`

Body — **all 28 editable application fields** organized into the same cards `EditApplicationIsland` uses:

**Basics card** (3-col top row + 2-col grid for the 14 pitch fields):

- Top row: Company (read-only link) · Dealum ID · Pitch Deck (upload widget — in edit; embedded viewer — in view)
- Two-column pairs: Tagline · Problem · Solution · Business Model · Market · Go to Market · Competitive Advantage · Traction · Competitors · Future Milestones · Patentable Ideas · Environmental Impact (full-width row of its own)

**Raise details card** (2-col):

- Funding To Date · Funding To Date Amount
- Capital Seeking · Raise Instrument
- Lead Investor · Financial Position
- Use Of Funds · **Deal Terms**
- Round Close Date · (Cap Table spans full)

**Team card** (2-col):

- Team · Management Qualifications

**Pitch Deck** — embedded PDF viewer (per `PitchDeckTile.jsx`): header bar with "Pitch Deck" label, page counter (`{currentPage} / {numPages}`), Expand, Download. Body renders the PDF via `pdfjs-dist` into a `<canvas>`. Bottom-overlaid prev/next page nav. Keyboard left/right cycles pages, Escape collapses. In edit mode, a Replace / Remove control is added; the embedded viewer stays.

**Pitch Video** — when `application.latestRecording.status === 'submitted' | 'archived'`, render `<PitchVideoSection>`. Sits beside the pitch deck (deck shrinks to one column, video takes the other). When video plays, video expands to fill the row.

**Deal Terms** — the field `applications.deal_terms` holds an AI-generated descriptive paragraph. The structured metadata lives in `application_instruments.metadata_json` (round, instrument type, valuation cap, discount, MFN, etc.). In view mode, render the paragraph as plain text. In edit mode, render the paragraph + an `Edit Deal Terms` button that opens the **`DealTermsWizard`** dialog (4 steps for application mode: type → type-specific terms → details → review). When the wizard saves, the AI re-generates the paragraph from the new structured metadata; the paragraph in the field updates.

### 17.7 Investments section

One row per deployment, sorted newest first. Columns: Date · Fund / member · Amount · Instrument · Terms / status · Current mark. Each row expands inline to show:

- Instrument lifecycle events (conversions, exits, dissolutions)
- Mark history (valuation_events) for that instrument
- Linked Annual-Fund ledger transaction (if any)

A summary at the top of the section: Total deployed · Total returned · Net invested · Number of investments.

### 17.8 Notes section

First-class, inline. Loads `company_notes` for this company plus any application-scoped notes (`application_record_id` set). Filtering toolbar: scope (All / Company-only / Application:YYYY), type (Note / Referral / News / Ask / AI Summary / Company Authored), date range. `+ New note` opens an inline TipTap editor; the editor supports markdown, attachments, confidential toggle, optional reply-thread (one level), assignment to an author. Save endpoint: `/admin/api/company-updates/companies/:id/notes`. Note rendering uses the same `<NotesPanel>` primitive as today's side-sheet.

### 17.9 Emails section

Chronological list of `person_communications` rows scoped by `company_record_id`. Each row: date · sender · recipient · channel (email / screening decision / portal message) · subject · snippet. Click to expand the full body inline; expanded view shows attachments. Read-only log. Endpoint: `/person-emails/api/company/:companyRecordId`.

### 17.10 Events section

Chronological list of `company_events`. Each row: date · event type (Pitch / Follow-On Pitch / Pre-Screening / Screening / Diligence Debrief / Investment Committee / …) · application year · member lead · attached links (recording, zoom, questions doc). The pitch-meeting parent (via `parent_meeting_id`) is shown as a small "linked to Member Meeting · 2026-04-12" footer on Pitch / Follow-On Pitch rows.

### 17.11 Ratings & Decisions section

Per-application sub-strip (All applications | 2026 | 2025 | …). Within each:

- **Screening ratings** — `screening_rating_submissions` + `screening_rating_responses` rolled up. Show: N submissions, average rating, recommend / don't-recommend counts. Click to expand individual ratings.
- **Decision messages** — `decision_messages` for AI-generated drafts; `screening_drafts.decision` for the final outcome (Pass / Too Early / Advance).

### 17.12 Date formats

- **`YYYY-MM-DD`** for date inputs and most read-display dates (e.g., investment date, follow-up, round close, diligence date formed, note date).
- **`Mon YYYY`** ("Apr 2026") for application month-of-applied and round date summaries.
- **"N days ago"** / **"N wk ago"** / **"N mo ago"** for the Last touch column.

### 17.13 Edit page (detail-edit.html)

Same section layout as `detail.html`. Each field becomes an input. Field grouping mirrors `EditCompanyIsland`'s `CompactRow` pattern (160px right-aligned uppercase label · multi-input row). For the application card, grouping mirrors `EditApplicationIsland`'s 2-column grid for the pitch-content fields plus the special Deal Terms launcher.

Header actions on the edit page:

- Back arrow to view page
- Save (PATCH only changed fields, per the diff-based pattern `buildChangedFieldsPayload` already uses)
- Cancel (discard changes, prompt if dirty)

### 17.14 Routes

- View: `/admin/company/<co_record_id>`
- Edit: `/admin/company/<co_record_id>/edit`
- Deep links to a section: `#overview`, `#profile`, `#contacts`, `#applications`, `#app-<app_record_id>` (auto-expands that application card), `#investments`, `#notes`, `#emails`, `#events`, `#ratings`

Legacy `/admin/application/<app_record_id>` redirects to `/admin/company/<co_record_id>/edit#app-<app_record_id>`.

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
