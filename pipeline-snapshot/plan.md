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
- Everywhere a company appears, **both the logo and the name link to its
  application page** (logo gets a blue outline on hover to signal clickability).

### Investment Ready — stage `Investment Ready`

Each company is its own sub-card (slate-50 background, bordered) since it carries
the most content and the widget's true call-to-action:

- Header row: 32px logo + company name (both link to the application page) +
  primary category, with a **vertical stack of action buttons** on the right in
  the shared outline button style (white, slate border, blue on hover — same as
  Watch Pitch). Debrief button on top, Register below:
  - **Diligence Debrief** (upcoming) — calendar icon, two-line button: label on
    top, date/time beneath in smaller muted text ("Wed, June 17, 2026 5:00 PM
    PT"); links to the meeting / calendar page. Shown while
    `dateUtils.meetingHasEnded` is false.
  - **Watch DD Debrief** (past) — play icon; shown when the debrief has ended
    and has a recording, deep-linking to that recording.
  - **Register Investment Interest** — $ icon; always present.
- **Diligence Report** — outline button (document icon) directly beneath the
  company name/category on the left, opening the company's diligence report.

### Diligence — stages `Pre-Diligence` + `Diligence`

Modeled directly on the existing Diligence Team tile:

- Header row: logo + company name (links to application page) + primary category,
  with a **Watch Pitch** outline button (play icon) on the right that deep-links
  to the portion of the member meeting recording covering that company. Omitted
  when no recording segment exists.
- Overlapping 30px member avatars and the comma-separated member list with
  (Lead)/(Fellow) annotations; names open the person profile modal.
- The viewer's own team keeps the teal `bg-teal-50 border-teal-200` highlight and
  the "Go to Diligence Workspace →" link (your team or admin only).
- `Pre-Diligence` companies get a small "Pre-Diligence" tag; if no team has formed
  yet, the row shows "Team forming" in muted text instead of avatars.

### Pitching — stages `Pitch` + `Follow-On Pitch`

- Companies are **grouped under their member meeting**, stated once per group
  ("Pitching at the May 28, 2026 Member Meeting"). Companies not associated with
  a meeting are **not listed**.
- Within a group, companies tile **three to a row** in a compact bordered tile:
  32px logo + company name (both link to the application page) + primary
  category, truncated with ellipsis as needed. Two per row on mobile.
- `Follow-On Pitch` companies get a small "Follow-On" tag so members know they've
  seen this company before.

### States

- Any empty stage section is hidden (no empty-state copy per stage).
- If **all three** stages are empty, the whole tile is hidden via the tile
  registry rather than rendering an empty card.
- Mobile: Investment Ready header wraps so the button drops below the name;
  pitch grid goes to two columns.

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
- **Watch Pitch deep link:** the company's past Pitch / Follow-On Pitch
  `company_events` row → `recording_url` plus the segment offset for that
  company's slot, so the recording opens at the start of their pitch.
- **Diligence Debrief meeting:** `meetings` row of type Diligence Debrief with
  `application_record_id` matching the company's application; show
  `formatFriendlyDateTime(start_date, start_time)` and link to the meeting /
  calendar page.
- **Logos:** `companies.logo_drive_file_id` via the `/api/files/:fileId` proxy
  (never raw Drive URLs); initials fallback.
- **Links:** application page `/application-review?application={appId}`;
  investment interest `/forms/investment-interest?applicationId={appId}`.
- **Open questions:**
  - Canonical source for the Diligence Report link (diligence folder doc vs. a
    stored report URL on the application) — confirm before build.
  - Where the per-company recording segment offset lives (or whether the deep
    link is the meeting recording page anchored to the company) — confirm before
    build.

## Mockup

`mockup.html` shows the widget in homepage context (ghosted side columns and a
ghosted What's New card below), populated with representative sample data,
including the your-team highlight with Watch Pitch, a Follow-On tag in the pitch
grid, a Pre-Diligence "team forming" row, an upcoming-debrief two-line button
(Emberline) and a past-debrief Watch DD Debrief button (Petrichor) on the
Investment Ready cards. A second card demonstrates the hidden-empty-stage state
(Diligence only).
