---
title: "Home Page Pipeline Snapshot"
status: draft
owner: jordan
created: 2026-06-11
last_updated: 2026-06-11
home: mockup
---

# Home Page Pipeline Snapshot

## Background

The home page's center column currently leads with "What's New at E8", and the
diligence picture lives in a narrow left-column Diligence Team tile. Members have
no single at-a-glance view of where companies sit in the active pipeline — who is
pitching at the next member meeting, who is in diligence, and who is ready for
investment commitments.

This feature adds a **Pipeline Snapshot** widget at the top of the center column
(above What's New at E8). It **replaces the left-column Diligence Team tile**,
absorbing its content into the Diligence section of the snapshot.

## Proposed UX

One card, three stage sections ordered by proximity to investment: **Investment
Ready, Diligence, Pitching**. A stage section is **omitted entirely when it has
no companies** — the card shrinks to whatever is active.

### Card chrome

- Standard tile shell: white card, `rounded-lg border shadow-sm`, header row with
  the 13px semibold title **Pipeline Snapshot**.
- Each section opens with a small-caps stage label, a colored accent dot, and a
  count: Investment Ready (emerald), Diligence (teal), Pitching (blue). The colors
  echo the existing stage chips used on the Profile tile (`Pitch` blue,
  `In Diligence` teal).
- **Every company is the same bordered white sub-card** (slate-200 border,
  8px radius), giving each stage section a consistent rhythm and clear company
  boundaries. The viewer's own diligence team is the only tinted card.
- **Type hierarchy is deliberately flat**: company names are the only bold
  element (13px/600 slate-900); taglines, members, and metadata are 11px
  slate-500/400; buttons are 12px/500 slate-600. Stage labels are muted
  small-caps (slate-400) so they organize without competing.
- Company anatomy: logo + name, with the company **tagline** beneath (11px).
  Logos are 38px in Investment Ready / Diligence cards, 32px in the compact
  pitch tiles, top-aligned with the name.
- **Every company tile is one click target.** Hovering lights up the whole
  tile (blue border + soft blue shadow, name turns blue, pointer cursor) as
  the affordance; clicking anywhere on the tile opens that company's
  **Investor View slide-over** — this applies to Investment Ready, Diligence,
  and Pitching alike. Inner controls that do something else (the Diligence
  button, team-member name buttons) stop propagation so they don't also open
  the panel.

### Investment Ready — stage `Investment Ready`

Each company is its own bordered sub-card. The card is deliberately content-only
— no action buttons; everything actionable lives in the Investor View, which is
the click-through for the whole card:

- Header row: logo + name + tagline (full text, no clamp).
- **Deal Terms** beneath, indented to align with the name: a small-caps muted
  label followed by the `applications.deal_terms` text verbatim.
- Clicking the name or logo opens the Investor View slide-over (below), which
  carries the diligence report, recordings, and the Register Investment
  Interest action.

### Investor View — click-through for every pipeline company

Clicking anywhere on a company tile — in **any** stage section — opens an
**Investor View slide-over panel** (right side, `min(1400px, 90vw)`; full
width on mobile; dimmed overlay, Esc/overlay-click to close) instead of
navigating to the application page. It is a lighter-weight, evaluation-oriented
read of the application — optimized for a member deciding whether to invest —
not a replacement for the application page.

The panel is **stage-aware**: the header tag shows the company's stage in its
stage color (emerald Investment Ready, teal In Diligence / Pre-Diligence, blue
Pitching / Follow-On Pitch); the Deal Terms band renders whenever
`deal_terms` is populated, but the **Register Investment Interest** button and
the sticky footer CTA appear **only for Investment Ready** companies. All
media tiles follow their own data-presence rules, so an early-stage company
might show only its overview and raise details.

Panel anatomy, top to bottom:

Every element is sourced from fields that exist in the database.

- **Header (white, fixed):** 44px logo, company name with the stage tag in
  its stage color, and tagline. Right side: a **Full Application ↗**
  outline button — the escape hatch to the standalone application page where
  history, AI insights, the diligence workspace, and everything else lives —
  plus the close ✕.
- **Deal Terms band (privileged placement):** the first card, emerald-tinted
  so it reads as the headline. A stat row from the structured columns —
  `raise_instrument`, `capital_seeking`, `round_close_date`, `lead_investor`
  — followed by the `applications.deal_terms` free text verbatim in a white
  inset (this is where valuation/minimum-check details live; we do not parse
  or restate them). Action row: primary dark **Register Investment Interest**
  button (opens the shared interest modal). No round-progress bar — committed
  round totals are not structured data.
- **Media row (up to four tiles, one row on wide screens):** an auto-fit
  grid (`minmax(280px, 1fr)`) of equal tiles. **Each tile appears only when
  its source data exists — a missing report, deck, or recording means no
  tile, never a blank one.** Remaining tiles stretch to fill the row.
  - *Diligence Report tile:* (the report is linked and previewed, never
    excerpted — E8 diligence reports deliberately contain no investment
    recommendation, and the portal must not synthesize one) — compact
    document thumbnail (clickable) beside
    the report's `friendly_name` from `application_documents` (via
    `applications.current_report_document_id`), a **"Finalized {date}"**
    line from `file_last_updated`, and an **Open Report** button; the
    **"Diligence Team:"** roster sits full-width beneath — Lead(s) first,
    then Members, then Fellows, with "(Lead)" / "(Fellow)" annotations.
    While the Diligence Debrief is still upcoming, the two-line calendar
    button (date/time beneath the label) joins the actions here; it goes
    away once the recording tile exists. No page counts or report excerpts —
    that data does not exist.
  - *Pitch Deck tile (only when `pitch_deck_drive_file_id` is set):* a small
    embedded version of the full deck — the same page-by-page viewer as the
    application page (16:9 stage, prev/next arrows, slide counter) — with
    **Expand** opening a full-screen deck overlay (slide position preserved,
    Esc/backdrop closes) and **Download** in the section header.
  - *Member Meeting Pitch tile:* the same YouTube recording the meeting page
    hosts for the application's Pitch `company_events` row — embedded 16:9
    iframe with a `?start=` offset taken from the parent meeting's
    `chapters` JSON (the chapter whose name matches the company), so the
    video is queued to that company's pitch. Caption: meeting title + date.
    Omitted when there is no pitch event, parent meeting, or recording.
  - *DD Debrief Recording tile:* embedded 16:9 iframe of the Diligence
    Debrief recording (`recording_url` on the debrief `company_events` /
    `meetings` row). Caption: debrief title + date. Omitted until the
    recording exists.
- **Company Overview:** a two-column scannable fact grid of **all**
  Basics-tab fields in tab order — Problem, Solution, Business Model,
  Market, Go To Market, Competitive Advantage, Traction, Competitors, Future
  Milestones, Patentable Ideas, Environmental Impact — with Traction
  rendered full-width and newline-preserving (founders often enter KPI
  lists). Small-caps labels, 12px body — skim-first, not editor-first.
  Fields with no data render a muted em-dash so the evaluator can see what
  the founder hasn't provided.
- **Team (only when team data is populated):** compact rows from the
  application's team fields; omitted when empty.
- **Raise Details:** label/value rows for the populated subset of Capital
  Seeking, Funding To Date, Lead Investor, Use of Funds, Financial Position,
  Round Close Date. (Instrument and the terms text stay in the Deal Terms
  band and are not repeated here.)
- **Footer (white, fixed):** a muted summary line and a repeated primary
  **Register Investment Interest** button, so the CTA is reachable from the
  bottom of a long scroll.

Mobile: the panel goes full-width; the fact grid collapses to one column; the
deal-stat grid wraps to three columns; the report thumbnail wraps above its
text.

### Diligence — stages `Pre-Diligence` + `Diligence`

- Header row: logo + name + tagline (no Watch Pitch button — the pitch
  recording lives in the Investor View panel's Member Meeting Pitch tile).
- **Diligence button — only when the viewer is on that company's diligence
  team or is the Pipeline Manager:** an outline button (checklist icon) that
  navigates to the full application page's diligence tab. It floats right
  inside the card body so the tagline text flows around it, and it stops
  propagation so clicking it doesn't open the panel.
- Team row beneath, indented to align with the name: overlapping 26px member
  avatars inline with the comma-separated member list with (Lead)/(Fellow)
  annotations; names open the person profile modal (and stop propagation).
- The viewer's own team keeps the teal `bg-teal-50 border-teal-200` highlight.
- `Pre-Diligence` companies get a small "Pre-Diligence" tag; if no team has formed
  yet, the card shows "Team forming" in muted text instead of avatars.

### Pitching — stages `Pitch` + `Follow-On Pitch`

- The member meeting is named **once, inline in the stage header** — "Pitching ·
  4" on the left, calendar icon + "May 28, 2026 Member Meeting" right-aligned on
  the same line. When pitches span multiple meetings, fall back to a muted
  sub-label per meeting group. Companies not associated with a meeting are
  **not listed**.
- Companies tile **two to a row** in compact bordered tiles: 32px logo +
  company name (single line, ellipsized) + tagline (two-line clamp). One per
  row on mobile.
- **Sort order:** `Pitch` event companies first, then `Follow-On Pitch`
  companies.
- `Follow-On Pitch` companies get a small "Follow-On" tag so members know they've
  seen this company before.
- **Portfolio companies** show the word "Portfolio" set into the tile's top
  border (small-caps label breaking the border line, top-right). Portfolio
  status derives from the canonical invested-companies model (`deployments`
  rows for the company — never `fund_portfolio_companies`).

### States

- Any empty stage section is hidden (no empty-state copy per stage).
- If **all three** stages are empty, the whole tile is hidden via the tile
  registry rather than rendering an empty card.
- Mobile: pitch grid goes to one column; the Investor View panel is full
  width; the Investment Ready deal-terms block loses its left indent.

## Implementation notes

- **Tile registry:** new tile `pipeline-snapshot`, `column='center'`, ordered
  above `whats-new`. Remove `diligence-team` from the left column (its API
  endpoint stays for the snapshot's diligence data).
- **API:** one endpoint, e.g. `GET /api/homepage/pipeline-snapshot`, built in a
  `lib/cache-manager/` domain module behind `swrGet` (tags: `home`, `pipeline`,
  `diligence`, `directory`), returning `{ pitching: [...groups], diligence:
  [...tiles], investmentReady: [...] }` with per-user `isYourTeam` resolved
  client-side or via a thin per-user pass (SWR must not cache per-user data).
- **Stage source:** latest `pipeline_stages` row per application, filtered to the
  five stages.
- **Meeting association:** the application's upcoming `company_events` row of type
  Pitch / Follow-On Pitch → `parent_meeting_id` → `meetings.name` /
  `meetings.start_date`. Pitch companies with no meeting association are excluded
  from the Pitching section.
- **Pitch recording (Member Meeting Pitch tile):** the company's past Pitch /
  Follow-On Pitch `company_events` row → `parent_meeting_id` →
  `meetings.recording_url`, with the `?start=` offset from the chapter in
  `meetings.chapters` whose name matches the company. Consumed by the
  Investor View panel (there is no Watch Pitch button on the tiles).
- **Diligence Debrief meeting:** `meetings` row of type Diligence Debrief with
  `application_record_id` matching the company's application; show
  `formatFriendlyDateTime(start_date, start_time)` and link to the meeting /
  calendar page.
- **Logos:** `companies.logo_drive_file_id` via the `/api/files/:fileId` proxy
  (never raw Drive URLs); initials fallback.
- **Links:** application page `/application-review?application={appId}` —
  reached via the panel's Full Application button and the Diligence button
  (which deep-links to the diligence tab).
- **Diligence button visibility:** render only when the viewer's person
  record is in the company's `diligence_memberships` or the viewer is the
  Pipeline Manager; resolved per-user client-side (SWR payload stays
  user-agnostic).
- **Investment interest modal (shared component, mandatory):** extract the form
  contents of `src/islands/InvestmentInterestFormIsland.jsx` (intro markdown,
  Deal Terms block, Name/Company/Amount/Comment fields, the three stacked
  submit buttons, and all load/submit logic) into a shared component, e.g.
  `src/components/investment-interest/InvestmentInterestForm.jsx`, taking
  `applicationId` as a prop. The `/forms/investment-interest` route island
  becomes a thin page wrapper around it, and the Pipeline Snapshot button opens
  the same component inside a Radix Dialog — one source of truth, so any change
  to the page's contents/layout automatically appears in the dialog. The
  window-close-on-success behavior must be parameterized (close dialog vs.
  close window).
- **Taglines:** company one-liner/tagline field on `companies` (confirm exact
  column; fall back to primary category if a company has no tagline).
- **Investor View panel:** new component (e.g.
  `src/components/pipeline-snapshot/InvestorViewPanel.jsx`) rendered as a
  Radix Dialog/slide-over from the home page. One endpoint, e.g.
  `GET /api/applications/:appId/investor-view`, assembled in a cache-manager
  domain module. Field sources (all existing columns):
  - `applications`: `tagline`, `problem`, `solution`, `business_model`,
    `market`, `traction`, `go_to_market`, `competitive_advantage`,
    `competitors`, `future_milestones`, `environmental_impact`, `team`,
    `deal_terms`, `raise_instrument`, `capital_seeking`, `funding_to_date`,
    `lead_investor`, `use_of_funds`, `financial_position`,
    `round_close_date`, `pitch_deck_drive_file_id`,
    `current_report_document_id`.
  - `companies`: `name`, `logo_drive_file_id` via `/api/files/:fileId`.
  - `application_documents`: report `friendly_name`, `filetype`,
    `file_last_updated` for the diligence report card.
  - `diligence_teams` + `diligence_memberships` + `people`: full roster with
    roles, ordered Lead → Member → Fellow.
  - `meetings` (type Diligence Debrief, matching `application_record_id`):
    date/time for the upcoming variant, `recording_url` for the past variant.
  Reuse the application page's deck-viewer component rather than forking it.
- **Diligence report thumbnail:** report documents are typically links
  (`filetype = 'link'`), so the default is a stylized document glyph; when
  the report is a Drive PDF, render page 1 via pdfjs-dist at thumbnail scale
  (same library as the deck viewer).
- **Investor View link policy:** clicking anywhere on a company tile — in
  every stage section — opens the Investor View; the tiles never navigate
  directly to the application page. The application page is reached from the
  panel's Full Application button (and the diligence tab via the Diligence
  button on diligence tiles).
- **Open questions:**
  - ~~Canonical source for the Diligence Report link~~ — resolved:
    `applications.current_report_document_id` → `application_documents`
    (`friendly_name`, `filetype`, `location`).
  - ~~Where the per-company recording segment offset lives~~ — resolved:
    `meetings.chapters` JSON (`[{time, name}]`); match the chapter name to
    the company and use its `time` as the YouTube `?start=` offset.

## Mockup

`mockup.html` shows the widget in homepage context (ghosted side columns and a
ghosted What's New card below), including the your-team highlight, a Follow-On
tag in the pitch grid, and a Pre-Diligence "team forming" row. Register
Investment Interest opens a working modal mirroring the
`/forms/investment-interest` page contents. A second card demonstrates the
hidden-empty-stage state (Diligence only).

The Investment Ready section shows **Inovues** — the company actually in that
stage as of 2026-06-11 — as a button-free card with its real tagline and deal
terms. Diligence and Pitching companies remain representative sample data.
**Every tile in all three stages is hover-highlighted and clickable**, opening
the stage-aware Investor View (90vw, max 1400px). Inovues demonstrates the
full panel: a four-tile media row with the diligence report (real name,
finalized date, full team roster), the embedded pitch deck with working
prev/next and full-screen Expand (slide content illustrative — Inovues has no
deck file on record), the Member Meeting Pitch embed (the real April 2026
member meeting recording queued to the Inovues chapter at 11:47 via
`?start=707`), and the DD Debrief recording embed (the real June 2 recording);
all eleven Basics fields with muted em-dashes for the six left blank; and the
Register CTA in the deal band and sticky footer. The sample companies
demonstrate the sparse states: Northbeam (your-team highlight, Diligence
button with text flowing around it, pitch-recording-only media row, no
Register CTA), Clearcurrent (no deal band, no media row), and the pitch grid
shows two-per-row with Pitch companies sorted before the Follow-On company,
whose tile carries the "Portfolio" border label.
