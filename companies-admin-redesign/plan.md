---
title: "Companies admin redesign: company-first, not table-first"
status: draft
owner: jordan
created: 2026-05-17
last_updated: 2026-05-17
---

# Companies admin redesign

Status: **v7 — row-level interactions, kebab menu, draggable rail**
Last updated: 2026-05-17

## Change log

- **v1 (2026-05-17 am):** Two variants proposed (company-centric vs. faceted lenses).
- **v2 (2026-05-17 pm):** Variant A bones accepted; v2 added Company Events as a fourth dimension, dropped the merged "Status" pill, introduced workflow catalog, filter taxonomy, rollup catalog, group-by mode.
- **v3 (2026-05-17 evening):** Variant B file removed. Status redefined as the lifecycle outcome (Active / Exited / Closed / blank), not lead_stage. Inline excerpts removed. Row expansion added showing each application's history. Adopted patterns from `/explore-companies`. All technical jargon removed from UI.
- **v4 (2026-05-17 late):** View picker reworked as a compact popover. Modified-state + explicit save flow (no Airtable-style auto-save). All metacommentary stripped from UI surfaces; rule codified in §15.
- **v5 (2026-05-17 latest):** Audited the actual fields in `lib/admin-grid-config.js` and rebuilt the Add Filter dialog from real data. Proposed 16+ new rollups for engineering — flagged with an orange "Proposed" tag. Dialog UI polish: collapsible domain headings (default: only "About the company" expanded), auto-expand on search, A–Z flat list, "Recent" chip strip. Added missing application fields (14 pitch-content + cap table, deal terms, lead investor, etc.). Renamed three file URL filters to "Has data room / Has diligence folder / Has pitch deck" (boolean rather than text-match).
- **v6 (2026-05-17 end-of-day):** Group-by rebuilt as Airtable-style. Each column gets its own summary aggregation chosen from a popover at the column's footer cell. Summaries propagate to every group / sub-group header. Multi-level grouping (groups + sub-groups up to 4 deep). See §8.5. Also: per-row `N inv.` subtext under Capital removed (noise); summary footer cells redesigned with a clearer "＋ Summary" affordance for unset cells and a small `▾` chevron for set cells; column-header `Σ Sum` / `↑ Latest` red-on-orange badges replaced with a single tiny muted `Σ`.
- **v7 (2026-05-17 end-of-day-2):** Row interactions and table polish on the list view. Click anywhere on a company row to expand it; the chevron is now just an indicator (bigger size). Each company row has a `⋯` **kebab menu** at the far right carrying the actions that don't have an in-page affordance: Open company, Open latest application, Record valuation event, Apply cramdown, Delete company. The application-history mini-table inside each row is simplified — three columns (**Applied · Furthest stage · Outcome**) where Outcome is restricted to derivable values (Invested / Passed / In progress); the v3 "Flags" column and the "Open →" link column are gone (whole row is now clickable). The tagline under the company name clamps to **2 lines** with native hover tooltip. **Capital → "$ Invested"** column rename. **Left rail is drag-resizable** via a vertical handle between rail and table. See §17.

## 1. The problem (unchanged)

The admin at `/admin/companies` exposes eight tabs, each a near-1:1 rendering of a database table. The richer issue is that most real questions cross all four staff-facing tables (`companies`, `applications`, `deployments`, `company_events`); the current UI exposes each separately and forces the user to do the join in their head. The redesign is presentation, filter, and aggregation only — no schema changes.

The `/explore-companies` page is the best existing answer to the same problem space. v3 of this plan deliberately adopts what already works there — the MultiSelectDropdown component, the Furthest Stage rollup, the Investment Since slider, the as-you-type filter — and only innovates where explore-companies doesn't go.

## 2. Direction (decided)

- **One Companies surface, no top-level tabs.** (Variant A bones, confirmed.)
- **Four dimensions** — Company, Application, Investment, Event.
- **Built on the existing `/explore-companies` patterns** wherever those patterns already work. New UI inherits the MultiSelectDropdown component, the Furthest Stage algorithm, the Investment Since slider, the as-you-type filter, and the "dynamic columns" idea (when a filter is active, the matching column appears).
- **No technical jargon in user-facing UI.** Filter labels and field descriptions are plain English. Users never see `boolean`, `rollup`, `EXISTS`, table or column names, type tags, or SQL previews. This rule applies everywhere — chooser dialogs, custom column builder, tooltips, error messages.
- **The merged "Status" pill from v1 is gone; v2's three columns are kept but renamed/redefined.** v3 settles on three independent columns, none of which use the word "status" in a way that conflates concepts:
  - **Furthest stage** (rollup) — the farthest pipeline point any of this company's applications reached, computed identically to explore-companies.
  - **Capital** (rollup) — $ deployed + count.
  - **Status** (rollup over instruments) — Active / Exited / Closed / blank. The blank case is the common one (we never invested or position state is unknown); the UI shows blank, not "Unknown". See §3.

## 3. The Status column — precise definition

This is the field that caused confusion in v2. v3 nails it down:

| Display | Meaning | Source |
|---|---|---|
| **Active** | At least one open investment instrument | any `instruments.status = 'active'` for this company |
| **Closed** | All investment instruments written off, or company dissolved | every `instruments.status = 'written_off'`, or company has a `portfolio_events.event_type = 'dissolution'` event |
| **Exited** | Position fully realized via acquisition / exit; capital received back | all instruments `exited` or `converted` and at least one `record_type='return'` deployment |
| **(blank)** | We never invested, or state cannot be determined | no instruments and no deployments |

Notes:
- We display "Closed" in the UI even though the schema column is `written_off`. The mapping is one-line.
- "Active" wins over "Closed" when mixed. If a company has one active SAFE and one written-off prior SAFE, the company is Active.
- Whether we've ever invested is **a separate, correlated property** with a separate filter ("Have we invested?") and its own column (*Capital* > 0). Status describes the lifecycle of the position; "have we invested" describes whether a position exists at all. Many filter combinations only make sense when Status ≠ blank.

## 4. Vocabulary (UI-facing)

| What we say | What it maps to internally | Notes |
|---|---|---|
| Company | `companies` row | unchanged |
| Application | `applications` row | unchanged |
| Investment | `deployments` row | renamed in UI only |
| Event | `company_events` row | new in v2 |
| Pipeline stage | `pipeline_stages.stage` | per-application, current state |
| Furthest stage | derived rollup | see §6 |
| Status | derived rollup | see §3 |
| Capital | derived rollup | `Σ deployments.amount_cents` |

Users never see `lead_stage`, `instrument`, `record_type`, `record_id`, `co_*`, `app_*`, table or column names, or any `aTable.aField` notation in the UI. Tooltips that explain a field do so in plain English.

## 5. The four dimensions

User-facing domains, organized for the filter chooser. The mapping to tables is internal.

1. **About the company** — name, sector, US/Canada, state/province, primary contact, founder demographics.
2. **About their applications** — when applied, pitch content, fundraising terms, decarbon8/follow-on flags, current pipeline stage.
3. **About our investments** — invested?, total, # investments, fund, vehicle (instrument type), Status (Active/Exited/Closed), SPV, current mark.
4. **About their events** — pitches, screenings, diligence, IC.

## 6. Furthest stage — the rollup we want everywhere

The `/explore-companies` codebase already computes this; v3 adopts its definition unchanged.

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
5. If the application's company has any `deployments` row (record_type='deployment'), override to "Invested".

The UI tooltip explains this in plain English: *"The farthest the application got in our pipeline. Order: Applied → Screen → Pitch → Follow-On Pitch → Diligence Complete → Invested. If we ended up investing, this shows Invested regardless of which stage gates the application went through."*

### 6.2 Per company

The max furthest stage across **all the company's applications**, then the Invested override applies once. A company that applied three times and went Pitch / Pitch / Diligence Complete with no investment has company-level furthest stage = Diligence Complete. The instant any deployment exists, it becomes Invested.

### 6.3 Where it shows up

- **Column** in the main list (sortable, filterable).
- **Multi-select filter** with the seven ladder values.
- **Per-application detail** in the row-expansion strip (§7) — each application shows its own furthest stage so the user can see how many got to Pitch vs. only to Screen.

## 7. Row expansion — application history inline

Restored from v1 (v2 dropped it; v3 brings it back, refined).

Clicking the disclosure arrow on a company row reveals a single inline table showing every application, sorted newest first. Columns:

| When applied | Furthest stage | Outcome | Decarbon8 / Follow-on | Open |
|---|---|---|---|---|
| 2025 (Apr) | Diligence Complete | Invested | — | → |
| 2024 (Mar) | Diligence Complete | Pass (too early) | — | → |
| 2022 (Feb) | Screen | Pass | — | → |

- **When applied** — month + year, derived from `applications.date_added`. Same `formatAppliedMonth` formatter as explore-companies; pre-2022-07 reads "unknown."
- **Furthest stage** — per-application furthest, computed identically to §6.1.
- **Outcome** — derived from pipeline state and presence of an investment:
  - "Invested" if any deployment links to this application
  - "Pass" / "Pass (too early)" if `screening_drafts.decision` is set
  - "Open" if pipeline stage is non-terminal
  - "Closed" if pipeline stage is closed without investment
- **Decarbon8 / Follow-on** — flags from `applications.decarbon8` and `applications.follow_on`.
- **Open** — link to the application detail (deep-link to the company detail's Applications section, expanded to this app).

If a company has zero applications, the expansion shows a small placeholder ("No applications. Capital from <fund>, <date>."). If a company has investments but no application row (rare; happens for some legacy direct investments), it's noted.

## 8. The Companies surface — v3 layout

### 8.1 Default columns (in order)

1. **Company** — name + favicon. Click → detail.
2. **Sector** — primary category pill (from explore-companies' `CategoryPill`).
3. **HQ** — state + country.
4. **Furthest stage** — pill.
5. **Capital** — $ total + count, right-aligned. Blank if 0.
6. **Status** — Active / Exited / Closed / blank. (§3)
7. **Latest event** — event name + date (most recent `company_events` row).
8. **Last touch** — derived.

Dynamic columns: when a filter is active for a field that isn't already shown, the matching column appears automatically (e.g. filter by Race/Ethnicity → that column appears; filter by State → that column appears). Pattern lifted from explore-companies (`DYNAMIC_COLUMN_DEFS` ~line 203).

### 8.2 Default left-rail filters (in order — and rearrangeable)

1. **Have we invested?** — Yes / No / Either toggle.
2. **Sector** — multi-select dropdown (checkboxes).
3. **Country** — US / Canada toggle. (We only accept applications from these two; a full country picker was overpowered.)
4. **State / Province** — multi-select dropdown (searchable; appears below Country, populated from US + CA combined).
5. **Furthest stage** — multi-select dropdown.
6. **Status** (Active / Exited / Closed) — multi-select dropdown.
7. **Investment Since** — slider with stops: N/A · 1 year · 2 years · 3 years · 5 years · Ever. (Lifted from explore-companies.)
8. **Founder demographics** — opens to two sub-pickers: *Race / Ethnicity* and *Gender*, both multi-select dropdowns.

A small drag-handle (`⋮⋮`) on each filter group lets the user reorder filters in the rail. Each group has a "remove" affordance (×) that returns it to the chooser. The user's order is saved on their profile.

A "**+ Add filter**" button at the bottom of the rail opens the chooser. The chooser shows all available filters organized by domain, with plain-English labels and plain-English explanations. No type tags. No source labels. No formula notation. See `view-builder.html`.

### 8.3 Search

Above the table, one input. As-you-type filtering across company name, tagline, primary contact, application content fields, and event notes. **No "type N+ characters" hint** — the field debounces internally and the table filters in place, just like the existing explore-companies page. v2's yellow `match:` chips and inline excerpts are gone — the search is fast enough that scanning the filtered list is the right interaction, and visual noise per row was the problem.

### 8.4 Summary strip

A single horizontal strip directly above the table showing aggregates for the current filter: *N companies · M investments · $X deployed · avg / company*. Updates live. Replaces v2's redundant column-of-totals at the bottom.

### 8.5 Group-by mode — Airtable-style, multi-level, per-column summaries

The current implementation treats group-by as a different *table shape*: it replaces the row-per-company display with row-per-group rows that carry fixed aggregate columns (`# companies`, `Total deployed`, `Avg / company`). That works for one specific shape of question; it doesn't compose. v6 replaces it with the model Airtable uses, which keeps the same row-per-company table and layers summary aggregations on top.

#### 8.5.1 Per-column summary aggregations

Every table column can have a **summary aggregation** chosen independently. The aggregation appears as a row at the bottom of the table (the *summary row*, always present when any column has one set) showing the result computed across all currently-filtered rows.

Aggregations are picked from a small popover that opens when the user clicks a footer cell. The available options depend on the column's data type:

| Column type | Available aggregations |
|---|---|
| Currency, Number | **Sum** · Average · Median · Min · Max · Count non-empty · Count · None |
| Date | Earliest · **Latest** · Range · Count non-empty · None |
| Single-select, Multi-select, Text | Count · Count unique · % filled · None |
| Boolean | **Count true** · Count false · % true · None |

Bold = sensible default the menu pre-highlights when the user opens the popover for the first time on that column.

The column header gets a subtle **Σ** indicator when a summary is active, so the user can see at a glance which columns are summarized without scrolling to the footer.

#### 8.5.2 Group-by — multi-level

The user picks **one or more grouping levels** in a Group-by popover. Each level has a dimension and a sort direction. Levels are ordered top to bottom (level 1 is the outermost grouping). The table renders as:

- **Level-1 group header rows** — one per distinct value of the level-1 dimension. Show the group's name, the row count, and (in their respective column cells) the same summary aggregations the user has set on each column, but computed only over the rows in this group.
- **Level-2 sub-group header rows** — within each level-1 group, one per distinct value of the level-2 dimension. Same shape, summaries computed over the sub-group's rows. Indented from the level-1 header to make hierarchy visible.
- Additional levels (level 3, 4, …) follow the same pattern with more indentation.
- **Leaf rows** are the underlying company rows, indented under the deepest sub-group they belong to.
- **Chevrons** expand / collapse at every level independently.

The Group-by popover supports:
- Picking the dimension at each level from the same list of groupable fields (Sector, Country, Lead stage, Latest pipeline stage, Investment year, Fund family, Investment status, Founder demographics, Decarbon8 candidate, etc.).
- Per-level sort direction (asc / desc — affects how groups order on screen).
- Drag to reorder levels.
- Remove a level (×).
- "+ Add another grouping level" link (capped at 4 levels for sanity).
- "Done" applies and closes; closing without "Done" preserves the current state.

#### 8.5.3 Replacing the v2 mode

The "row-per-group with aggregate columns" mode goes away. The v2 mockup's `# companies` and `Total deployed` columns are no longer dedicated UI; they're produced by setting `Count` on Company and `Sum` on Capital and then turning on group-by. This is more powerful (any column can be summarized, not just dedicated ones) and more discoverable (the user doesn't have to learn a separate page shape).

#### 8.5.4 What the user sees end-to-end

The mockup `variant-a-groupby.html` shows a full example: filter `Invested = Yes`, group by **Status → Sector**, with summary aggregations set on **Capital (Sum)** and **Last touch (Latest)**. The table reads:

```
COMPANY                      SECTOR    HQ        ...    CAPITAL          STATUS    LATEST EVENT     LAST TOUCH
─────────────────────────────────────────────────────────────────────────────────────────────────────────
▾ Active · 276 companies                                Σ $70,600,000               MAX 2026-04-12
  ▾ Solar · 52 companies                                Σ $18,400,000               MAX 2026-04-02
    Aurora Cells              Solar    WA · USA  ...    $400,000         Active     Diligence …  2 d ago
    Photon Edge               Solar    CA · USA  ...    $325,000         Active     Pitch          1 wk
    …
  ▾ Electric vehicles · 28 companies                    Σ $8,400,000                MAX 2026-02-14
    Voltaic Drive             EV       WA · USA  ...    $425,000         Active     Diligence …  3 d ago
    Mileage Labs              EV       OR · USA  ...    $300,000         Active     IC          12 d ago
    …
  ▸ Energy storage · 34 companies                       Σ $9,200,000                MAX 2026-04-12
  ▸ Carbon capture · 19 companies                       Σ $5,100,000                MAX 2026-03-08
  …
▸ Exited · 22 companies                                 Σ $4,700,000                MAX 2025-12-19
▸ Closed · 14 companies                                 Σ $2,900,000                MAX 2024-08-30
─────────────────────────────────────────────────────────────────────────────────────────────────────────
SUMMARY  312 companies                                  Σ $78,200,000               MAX 2026-04-12
```

The summary row at the bottom is the table-level aggregate. The level-1 (Status) and level-2 (Sector) headers each show the same Σ/MAX applied to their slice.

#### 8.5.5 Saving with the view

The summary settings (per column) and the grouping levels are part of the saved view (along with filters, columns, sort, group-by). Switching views restores not only what columns and filters were active but also what aggregations were summarised and how rows were grouped.

### 8.6 Saved views — picker, modified state, explicit save

The horizontal views strip from v2 doesn't scale (long scrolling list, no organization), doesn't separate personal views from shared, and doesn't handle the "I made changes and don't want to clobber the shared view" problem. v4 replaces it with a popover picker.

**Compact picker, next to the page title:**

```
Companies   [ All companies ▾ ]   1,247 total · 312 invested · 84 active applications
```

The button shows the current view's name and a `▾`. Click opens a popover. The popover is the only UI dedicated to views — it doesn't dominate the page.

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

- **Two sections.** *Shared* views are visible to all staff; *Mine* is private to the current user. (No "Pinned to sidebar" tier from v3 — over-engineered; two tiers is enough.)
- **Active view dot.** `●` marks the loaded view.
- **(default) tag.** A user can mark one view as their personal default (`⋯` → Set as my default). If unset, the system default `All companies` is used.
- **`⋯` per row.** Rename, Set as my default, Duplicate, Make shared / Make personal, Delete. Permissions matter — only the owner / admins can rename, edit, or delete a shared view.
- **+ New** in the *Mine* header creates a new personal view from the current filter state.
- **Search.** As-you-type filter over view names. Useful once a person has 15+ views.

**Modified state and the explicit save flow:**

The Airtable problem: the default view auto-saves whatever the last user did, and the next user finds the configuration mangled. v4 explicitly avoids auto-save.

When the user loads a view and changes any filter, sort, column, or grouping, the page enters a **modified** state. The picker button shows it inline; a Save button appears to its right:

```
Companies   [ All companies · modified ▾ ]   [ Save ▾ ]   1,247 total · …
```

`Save ▾` opens a small menu:
- **Update "All companies"** — only enabled if the user owns the current view, or is an admin acting on a shared view. Greyed out otherwise.
- **Save as new view** — opens the save dialog (already in `view-builder.html`): name, Personal or Shared, optional color.
- **Discard changes** — reverts to the saved view's filter / column / sort state.

Switching views while modified pops a confirmation: *"Discard changes to the current view?"*

**View management dialog.** Reached from the bottom of the popover via "Manage all views". Lets the user rename, reorder within their personal section, change visibility, and delete in bulk. This is where housekeeping happens; not in the popover.

**URL state.** The current view is captured by a slug (`?view=ev-portfolio-analysis`). Modifications append filter state to the URL so the user can share a one-off (`?view=ev-portfolio-analysis&country=ca`). Sharing a modified URL gives the recipient the modified view but doesn't change the saved view.

**No "Save view" button at the title row when not modified.** New views are created from the popover's `+ New` instead. Saves real estate; reduces the number of always-on actions in the title row.

## 9. The view builder — what users see (and don't)

The chooser, the columns picker, and the custom-column builder all follow the same rule: **plain English, no schema, no types**.

### 9.1 What's shown in the chooser

For each available filter:

- **Name** in plain English: "Sector", "Founder gender", "Latest pitch date", "Total invested".
- **One-line explanation** when needed: "The most recent application's current pipeline stage", "True if any of our investments was made via an SPV".
- (Optional) **A small grouping label** above the field: "About the company", "About our investments", etc.

That's it.

### 9.2 What's NOT shown

- No type tags ("boolean", "currency", "date range", "multi-select").
- No source/origin notes (`EXISTS deployments`, `SUM(deployments)`, `MAX(date) WHERE event IN ('Pitch')`).
- No table or column references (`deployments.investment_date`, `companies.lead_stage`).
- No SQL preview, no formula syntax.
- No "rollup" label. The user doesn't need to know which fields are aggregates and which are raw columns — both behave identically from their perspective (apply a filter, see the result).

### 9.3 Live click-through

`view-builder.html` includes a working interactive demo: click "+ Add filter", browse the chooser, click "Founder demographics", and the filter is added to the left rail. The user can then expand its dropdown, pick race/ethnicity values, and see the chip appear in the active-filters row above the table.

### 9.4 Custom column builder

For the rare case where the user wants something the pre-rolled set doesn't cover: a guided form that asks for a name, what to count/sum/find-latest-of, and which records to include. No formulas. Default to hidden behind an "Advanced" disclosure. (Still v2 of this redesign; v3 doesn't ship custom columns.)

## 10. Workflow catalog (unchanged from v2)

Repeating here as the validation set; each must work in v3:

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

Two new workflows added in v3:

15. **Furthest a company reached** — Furthest stage = Pitch (or Diligence Complete), Have we invested? = No. Answers "we passed but they got to pitch / diligence."
16. **Companies invested in the last year** — Investment Since slider = 1 year.

## 11. Adopted from `/explore-companies`

| Pattern | What it is | Where it goes in v3 |
|---|---|---|
| `MultiSelectDropdown` | A dropdown that opens to a checkbox list with a search input on top | Every multi-value filter (Sector, State, Furthest Stage, Race/Ethnicity, Gender, Raise Instrument, etc.) |
| Furthest Stage rollup | Per-application + per-company computation of ladder position | New column and filter; tooltip explains the algorithm in plain English |
| Investment Since slider | 6-stop slider: N/A · 1y · 2y · 3y · 5y · Ever | Default left-rail filter |
| As-you-type, in-memory filter | Filter applies as the user types into a search box | Top search bar on Companies surface, plus the filter chooser, plus dropdown search |
| Dynamic columns | A filter being active auto-shows its matching column | Same behavior — keeps the table from getting too wide when filters are inactive |
| Pipeline All / Active toggle | Two-button segmented control to scope to currently-active pipeline | Available as a filter; not in default rail |
| US/Canada-only country picker | Simplified country filter | Replaces v2's "any country" dropdown |
| `formatAppliedMonth` | "Apr 2025" format with "unknown" for pre-Jul-2022 | Used in the row-expansion application history |

## 12. Where the other tabs go (unchanged from v1/v2)

`portfolio`, `instruments`, `marks`, `valuation`, and `events` tabs remain as power-user surfaces in v1 of this redesign; their data also surfaces inside the unified company detail. Standalone removal is deferred.

## 13. Open questions

1. **The "Closed" label.** I'm calling `written_off` → "Closed" in the UI. Confirm "Closed" is the right word, vs. "Written off" (preserves schema language), "Inactive", or "Wound down."
2. **Mixed-status companies.** "Active wins over Closed when mixed" is the rule. Confirm — or do we want to show "Active, partial write-off" for the rare cases?
3. **Country toggle.** US/Canada only is the design; do we want a hidden "Other" bucket for the handful of legacy non-US/CA rows that exist in `companies.country`?
4. **Founder demographics chooser shape.** Today there's a Race/Ethnicity dropdown and a Gender dropdown side-by-side in explore-companies. v3 groups them under "Founder demographics" — open inside the chooser, two sub-pickers appear. Or do we want them as two top-level filters at all times?
5. **Saved-view migration.** Existing `admin_grid_views` rows don't map. Translate best-effort or ask staff to recreate?
6. **`Pipeline All / Active` toggle.** Useful enough to put in the default rail, or just leave in the chooser?

## 14. What this plan still does not commit to

- Specific routes / API shapes — written when the design is locked.
- Bulk-edit, export, embedding.
- The custom column builder (referenced but not implemented in v1 of the redesign).
- Migration of `admin_grid_views`.

## 15. UI Copy and Metacommentary policy

Per AGENTS.md §2 "UI Copy Minimalism": **minimal functional text by default; no explanatory or helper copy unless requested**. v4 audits all mockup HTML against this rule. The boundary:

- **Inside the white workspace area (anything that would render in the actual product):** zero instructional / explanatory copy. No "Updates as you type" tags on aggregate strips. No "(long-lived company facts)" subtitles on section headers. No per-field descriptions in dialogs. No "(rollup)" type tags on filter blocks. No "Example dropdown (always open here so the pattern is visible)" notes. No "Drag the ⋮⋮ handle..." help text. No "Type into the search box above..." footer notes.
- **Allowed in the actual UI:** field-meaning tooltips behind a `ⓘ` icon when the field genuinely needs explanation (Furthest Stage's algorithm, Status's lifecycle definition). These are tooltips on hover, not always-visible copy.
- **Mockup reviewer commentary** (notes for the team reviewing the mockup, not for end users) goes in the yellow seed-note box at the top of each HTML file. Nothing else.

The yellow seed-note has a distinct background, distinct border, and the word "Seed annotation" or "v4 changes" in bold — so a reviewer can't confuse it with shipped UI copy.

## 16. Field catalog and rollup proposals

Source of truth: `lib/admin-grid-config.js` — `TABLE_CONFIGS.{companies,applications,deployments}` and `SYSTEM_CUSTOM_FIELDS.companies`. The Add Filter dialog must surface only fields that actually exist (or are explicitly proposed for engineering).

### 16.1 What's already there

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

That's it for built-in rollups. Everything else is pre-computed by the cache builder and exposed as plain fields on `companies`.

### 16.2 What's missing — proposed new rollups

These are the rollups the workflow catalog (§5) demands but that aren't computed today. Each maps to an existing source field; the engineering work is in the rollup machinery, not in new schema.

| Proposed field | Source | Notes |
|---|---|---|
| **Furthest stage** | rollup over `company_events` + `deployments` | Already computed by `lib/cache-manager.js` for `/explore-companies` (§6 of this plan) — lift into the admin-grid config as a system rollup on `companies` |
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

### 16.3 What goes in the Add Filter dialog

The dialog's `FILTERS` array in `view-builder.html` is the canonical list. As of this iteration it has 70+ entries across five domains. Notable inclusions added in this iteration:

- **All 14 pitch-content long-text fields** from `applications` (Tagline, Problem, Solution, Business Model, Market, Go to Market, Competitive Advantage, Traction, Competitors, Future Milestones, Patentable Ideas, Environmental Impact, Team, Management Qualifications) — each filterable as a full-text search; plus an "Application content (full-text)" wrapper that searches across all of them at once for the "match anywhere in the pitch" case.
- **The fundraising / files / metadata columns** on `applications`: Cap table, Data room, Deal terms, Diligence folder, Financial position, Funding to date amount, Lead investor, Slack channel, Status (per application), Use of funds, Dealum ID.
- **Investing entity and Round** on `deployments` (the human-readable round name, e.g. "Pre-seed", "Series A").
- **Last updated date** on `companies` for the "what changed recently" query.

### 16.4 Dialog UI polish

- **Default sort: by domain.** Domain headings are **collapsible**. Click a heading to toggle. Default state: only "About the company" is expanded. Other domains start collapsed showing the count badge, so the user sees structure without scroll.
- **Auto-expand on search.** Typing in the search box auto-expands any domain whose fields match — collapsed sections aren't a barrier to discovery. Clearing the search returns to the user's manual expand state.
- **Alternative sort: A–Z.** Flat alphabetical list with no headings at all — no domain groups, no letter sub-headers. This is the right shape when you already know the name of the field you want.
- **Domain headings** include a chevron, the domain name, a count badge, and a hairline rule extending across; hover background indicates the click target.
- **"Already added" rows** are visually de-emphasized (lighter text + greyed background) and not clickable.
- **"Proposed" badge** appears on rollups that don't exist yet — orange tag, only visible during design review. Per §15 metacommentary policy, the badge would be removed before ship; here it's a deliberate reviewer signal so you can distinguish what exists from what we're proposing engineering build.
- **Recent strip** above the field list — 4 frequently-used filters as chips for one-click re-add. Personal to the user.
- **Recently used.** Across the top, a small "Recently used" strip with 3–5 filter pills (e.g. *Founder demographics · Total invested · Sector*) for one-click re-add. Personal to the user.
- **Search.** Stays at top. Searches against field labels only (not types or domain names).

## 17. Row interactions, table polish, kebab menu

### 17.1 Row click and expansion

- Clicking anywhere on a company row toggles its expansion (application history). The chevron at the left is just a visual indicator of expand state — bigger and clearly an open/closed glyph (▸ collapsed, ▾ expanded), but not the click target.
- Inline links inside the row (company name → detail page, kebab `⋯` button) call `event.stopPropagation()` so they don't also trigger the expand.
- The expansion is a small inline table directly under the row.

### 17.2 Application history mini-table inside the expansion

Three columns, in this order: **Applied · Furthest stage · Outcome.**

- **Applied** — month + year of `applications.date_added` (formatted "Apr 2025"). Uses the same `formatAppliedMonth` formatter explore-companies already uses; pre-2022-07 reads "unknown".
- **Furthest stage** — the per-application Furthest Stage rollup (§6.1), rendered as the same pill used in the parent row's column.
- **Outcome** — one of:
  - **Invested** — at least one deployment ties to this application (or its company; current mapping is application-side).
  - **Passed** — the application's pipeline_stage is terminal and no deployment exists (`Not Moving Forward`, etc.).
  - **In progress** — pipeline_stage is non-terminal.
  
  No other Outcome values. We do not show free-text decision reasons ("too early," etc.) because those aren't reliably recorded. We do not list fund vintages here ("Annual Fund 2025 + 2026") because that's noise — fund detail belongs in the Investments section of the company detail page.

- Whole application row is clickable (`onclick="location.href='/admin/company/<id>#app-<id>'"`). No "Open →" link column.

### 17.3 Kebab menu on each company row

Right-most column on each row holds a `⋯` button. Click opens a small dropdown menu carrying the actions that don't have a direct in-page affordance. The contents and the rationale:

| Action | Why it's here |
|---|---|
| **Open company** | Navigation. Same destination as clicking the company name; provided here so right-click "Open in new tab" via the kebab is also natural. |
| **Open latest application** | Direct jump to the most-recent application's review surface. |
| ─ | |
| **Record valuation event…** | Power-user portfolio action. Inherits from today's CompaniesAdminIsland kebab. |
| **Apply cramdown…** | Same — wizard-style action that has no good inline trigger. |
| ─ | |
| **Delete company…** | Destructive, requires confirmation. Behind a kebab on purpose so it's never a click-target by accident. |

Things that are **not** in the kebab because they're already inline:
- "View company" → company name is the link.
- "Most recent application" → the expanded row shows the application history with each row clickable; this kebab item is provided as a shortcut to the latest one specifically.
- "Edit company" / "Edit application" → the detail page is the editor (inline editing of fields).

Closed by clicking outside or pressing Escape (assumed; not yet specified). Positioned absolute relative to the trigger button.

### 17.4 Tagline clamp under company name

The tagline (`applications.tagline` for the latest application, or `companies.blurb` as fallback) renders under the company name in 11px muted text. **Clamped to two lines** via the `tagline-clamp` CSS class (`-webkit-line-clamp: 2; overflow: hidden`). The full text is in the `title` attribute so the native browser tooltip shows on hover. Required because real taglines can be 1–3 sentences and would otherwise blow up the row height.

### 17.5 Logo placeholder

The colored square next to each company name with the initials is a **logo placeholder**. When `companies.logo_drive_file_id` is set, the cell renders `<img src="/api/files/<logo_drive_file_id>">` in its place (proxied per AGENTS.md, never raw Drive URL). When no logo exists, the initials placeholder with a deterministic color hash stays. This is the convention everywhere in the portal where company logos appear.

### 17.6 Column rename — "$ Invested"

The Capital column header is renamed to **$ Invested** for clarity. Same data (`companies.invested_amount`, in dollars). The change is label-only; filters and rollups keep their internal `invested_amount` key.

### 17.7 Resizable rail

The left filter rail and the main table are separated by a 6px vertical drag handle. Hovering or dragging the handle highlights it in blue. Drag horizontally to resize the rail (min 200px, max 560px). The user's chosen width persists per session (stored on the user's profile, alongside the saved-views default).

The default rail width is 280px — the same width used in the current explore-companies and other admin grids.

### 17.8 Polish items consolidated from earlier rounds

These were applied in v5 / v6 but not previously codified in the plan:

- Per-row `N inv.` subtext under Capital removed (and the corresponding "Investments: N" stat removed from the summary strip). The number of investments per company is available as a rollup column anyone can add.
- Footer summary row cells redesigned: unset cells render a dashed-border **＋ Summary** button; set cells render `mode-label  value  ▾` with the mode label small and muted.
- Column-header summary indicator is a single tiny muted `Σ` next to the column name — no badge, no background, no "Sum" / "Latest" text.
- Three application file URL filters renamed to boolean "Has data room / Has diligence folder / Has pitch deck" — the underlying field is a URL but the useful filter is "is there one."

## 18. Company detail page (view + edit)

The redesigned detail page replaces both today's `/admin/company/<id>` (`EditCompanyIsland`) and `/admin/application/<id>` (`EditApplicationIsland`) routes. One company; all of its data accessible without leaving the page.

### 18.1 Two pages

- **`detail.html`** — read-mostly **view** of one company. Every section visible; every section is what a staff person would *consume* (read) about the company. Some fields can be edited in place (pencil hover) but the page's role is to inform, not to edit.
- **`detail-edit.html`** — full **edit form**. Same sections, same field set, all editable. Reached from `detail.html` via an `Edit` button in the header (top-right) or via a per-section ✎ icon (drops you into edit mode anchored at that section).

Switching between view and edit preserves scroll position and the section anchor.

### 18.2 Sections (left-rail nav, in order)

1. **Overview** — header banner facts + last-touch feed (5 most recent notes / emails / events).
2. **Profile** — long-lived company facts.
3. **Contacts** — people associated with the company (`company_contacts` → `people`).
4. **Applications** — one card per application, each with all 28+ application fields.
5. **Investments** — deployments + linked instruments + marks, in one ledger.
6. **Notes** — `company_notes` for this company (and its applications), as a feed.
7. **Emails** — `person_communications` scoped to this company.
8. **Events** — `company_events` chronological list.
9. **Ratings & Decisions** — screening ratings + decision messages per application.

The current split between "inline ratings/notes section" and the side-sheet Notes/Emails buttons goes away. Notes and Emails are first-class scrollable sections on the detail page itself; the side-sheet from `CompanyNotesSheet` is replaced.

### 18.3 Header banner

Always at the top, sticky:
- Logo (or initials placeholder, per §17.5)
- Company name (h1)
- **Status** pill — **Active / Exited / Closed** (or blank). The legacy field `companies.lead_stage` is no longer surfaced; the v3 Status definition (§3) is the single source of truth. "Portfolio" is not a value. UI never says "Lead Stage."
- Sector · HQ · Website link
- Right side: key stats — `$ Invested · N investments · Latest application: year + stage · Last touch: date`
- `Edit` button (top right) → flips to `detail-edit.html` (or to edit mode)

### 18.4 Profile section (view + edit)

Fields, with the grouping I'd render in edit mode (mirroring `EditCompanyIsland`'s `CompactRow` 160px-label pattern):

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

Notes on terminology:
- The "Lead & Source" card from today's `EditCompanyIsland` is renamed simply **Profile**.
- The "Lead Stage" field is removed. Status is derived (§3) and displayed only in the header banner; not editable in the Profile section.
- "Portfolio" never appears as a value anywhere.

### 18.5 Contacts section

`ContactPillsEditor`-style. Each contact is a pill: name + title + role badge (Primary / Other). Inline `+ Add contact` opens a person picker. Each pill has a small `×` to remove; clicking a pill opens the person detail.

### 18.6 Applications section — every field

One card per application, sorted newest first. Header:
- Year · month applied (e.g. **Apr 2025**)
- Furthest stage pill
- Outcome (Invested / Passed / In progress) per §17.2
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

**Pitch Video** — when `application.latestRecording.status === 'submitted' | 'archived'`, render `<PitchVideoSection>`. Sits beside the pitch deck (deck shrinks to one column, video takes the other). When video plays, video expands to fill the row. Rare; the case is supported but doesn't dominate the layout when absent.

**Deal Terms** — special: the field `applications.deal_terms` holds an AI-generated descriptive paragraph. The structured metadata lives in `application_instruments.metadata_json` (round, instrument type, valuation cap, discount, MFN, etc.). In view mode, render the paragraph as plain text. In edit mode, render the paragraph + an `Edit Deal Terms` button that opens the **`DealTermsWizard`** dialog (4 steps for application mode: type → type-specific terms → details → review). When the wizard saves, the AI re-generates the paragraph from the new structured metadata; the paragraph in the field updates.

The "Compare side-by-side" affordance from v1's mockup is removed. Comparing applications was a future-version idea that doesn't earn its weight in v1 of the redesign.

### 18.7 Investments section

One row per deployment, sorted newest first. Columns: Date · Fund / member · Amount · Instrument · Terms / status · Current mark. Each row expands inline to show:
- Instrument lifecycle events (conversions, exits, dissolutions)
- Mark history (valuation_events) for that instrument
- Linked Annual-Fund ledger transaction (if any)

A summary at the top of the section: Total deployed · Total returned · Net invested · Number of investments. (Same numbers that drive the rollup catalog.)

### 18.8 Notes section

First-class, inline. Loads `company_notes` for this company plus any application-scoped notes (`application_record_id` set). Filtering toolbar: scope (All / Company-only / Application:YYYY), type (Note / Referral / News / Ask / AI Summary / Company Authored), date range. `+ New note` opens an inline TipTap editor; the editor supports markdown, attachments, confidential toggle, optional reply-thread (one level), assignment to an author. Save endpoint: `/admin/api/company-updates/companies/:id/notes` (same as today). Note rendering uses the same `<NotesPanel>` primitive as today's side-sheet, but the panel is embedded in the page rather than slid in.

### 18.9 Emails section

Chronological list of `person_communications` rows scoped by `company_record_id`. Each row: date · sender · recipient · channel (email / screening decision / portal message) · subject · snippet. Click to expand the full body inline; expanded view shows attachments. No editing — emails are a read-only log. Endpoint: `/person-emails/api/company/:companyRecordId`.

### 18.10 Events section

Chronological list of `company_events`. Each row: date · event type (Pitch / Follow-On Pitch / Pre-Screening / Screening / Diligence Debrief / Investment Committee / …) · application year · member lead · attached links (recording, zoom, questions doc). The pitch-meeting parent (via `parent_meeting_id`) is shown as a small "linked to Member Meeting · 2026-04-12" footer on Pitch / Follow-On Pitch rows.

### 18.11 Ratings & Decisions section

Per-application sub-strip (All applications | 2026 | 2025 | …). Within each:
- **Screening ratings** — `screening_rating_submissions` + `screening_rating_responses` rolled up. Show: N submissions, average rating, recommend / don't-recommend counts. Click to expand individual ratings.
- **Decision messages** — `decision_messages` for AI-generated drafts; `screening_drafts.decision` for the final outcome (Pass / Too Early / Advance).

### 18.12 Date formats — kept as-is

Per the existing system convention:
- **`YYYY-MM-DD`** for date inputs and most read-display dates (e.g., investment date, follow-up, round close, diligence date formed, note date).
- **`Mon YYYY`** ("Apr 2026") for application month-of-applied and round date summaries.
- **"N days ago"** / **"N wk ago"** / **"N mo ago"** for the Last touch column (existing behavior).

No date-format changes in v7.

### 18.13 Edit page (detail-edit.html)

Same section layout as `detail.html`. Each field becomes an input. Field grouping mirrors `EditCompanyIsland`'s `CompactRow` pattern (160px right-aligned uppercase label · multi-input row). For the application card, grouping mirrors `EditApplicationIsland`'s 2-column grid for the pitch-content fields plus the special Deal Terms launcher.

Header actions on the edit page:
- Back arrow to view page
- Save (PATCH only changed fields, per the diff-based pattern `buildChangedFieldsPayload` already uses)
- Cancel (discard changes, prompt if dirty)

### 18.14 Routes

- View: `/admin/company/<co_record_id>`
- Edit: `/admin/company/<co_record_id>/edit`
- Deep links to a section: `#overview`, `#profile`, `#contacts`, `#applications`, `#app-<app_record_id>` (auto-expands that application card), `#investments`, `#notes`, `#emails`, `#events`, `#ratings`

Legacy `/admin/application/<app_record_id>` redirects to `/admin/company/<co_record_id>/edit#app-<app_record_id>`.

## 19. Design Guide Compliance checklist

(unchanged from previous iteration)

- **Form layout (labels-left, content-sized controls)** — pass.
- **Table density / sticky header / paging** — pass; `!overflow-visible` wrapper + `sticky top-0 z-20` header.
- **Search input** — pass; placeholder is concise, no "type N+" hint.
- **In-header filtering** — pass; filters use compact controls.
- **Sort indicators** — pass.
- **Dialog / copy minimalism** — pass; chooser shows label only (no per-field description as of v4), no subtitle, no footer instructional text.
- **No technical jargon in user-facing copy** — pass per §9.2.
- **No metacommentary in workspace area** — pass per §15.
- **Empty cells render blank, not `-`** — pass.
- **Filter chips content-sized (`w-fit`)** — pass.
