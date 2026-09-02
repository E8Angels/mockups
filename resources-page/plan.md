---
title: Resources Page
status: draft
owner: nami
created: 2026-09-02
last_updated: 2026-09-02
home: resources-page.html
---

# Resources Page Plan

## Mockup files in this folder

- **`resources-page.html`** (home) — the Resource library page for the E8 Angels member portal: role-aware tabs by resource type, four-up card rows that expand with "View all", and a viewer for opening a resource (Google Drive / YouTube) in place.
- **`resource-descriptions.md`** — draft copy for each resource's description line, as shown under the item title.
- `resources-data.js`, `resources-sheet.js` — the mock data driving the page (built from a planning sheet; only rows marked "Y" in a "Shown on UI" column render — see note below).
- `_ds/` — the E8 Angels design system token/component bundle this mockup renders against (design-canvas export).

## Background

Built as a Claude Design canvas prototype outside this workflow, then imported here for team review. The page itself documents its own data model: content is driven from a planning sheet, only rows flagged "Y" in a "Shown on UI" column are rendered, and Decarbon8 resources are explicitly held back for March 2027.

Sections in the mockup, matching the categories in `resource-descriptions.md`:

1. Start here (Member Handbook, Membership Agreement, New Member Orientation, AI Policy)
2. You're meeting someone (Entrepreneurs / Partners / Sponsors)
3. Company evaluation & due diligence (Overview / Screening / Pitch / Follow-up / Diligence)
4. Investing (Valuation Policy, Data & Governance Policy, SPV Policy)
5. Learning Labs
6. Member meeting recordings
7. Fellows
8. Decarbon8

The mockup also includes a "Preview as" role switcher, described in the UI as a prototype-only control (the live page would read the signed-in role instead).

## Open questions

Carried over directly from `resource-descriptions.md`, where they're flagged inline — these are content gaps, not design decisions, and need an owner:

- **How to refer a partner to E8** — not yet written.
- **E8 Slide Deck — meeting partners** — currently staff-only; confirm before releasing to members.
- **Talking to a prospective sponsor** — no material yet; page currently says to connect prospects with the E8 team directly.
- **Diligence Talk — Dec 2024** — recording currently unlocated, may sit in Learning Labs.
- **Legal Doc for D8** — to be drafted.
- Learning Lab and Member meeting recording feeds are marked "to be connected" — not yet wired to a real source.

## Not yet reviewed

This plan captures what's in the mockup as authored; it hasn't yet been discussed with the rest of the project team per this project's group-review norm. Flagging for review rather than treating any of the above as decided.

## Known issue — not yet fixed

The published page currently renders on browser fallback styling, not the real E8 design tokens: every file under `_ds/` (fonts/colors/typography/spacing tokens, and the TopNav component) returns HTTP 503 on `e8angels.github.io`, and the top nav bar is blank as a result. Everything else (cards, tabs, descriptions, the role-preview chips) renders fine since it's inline in the mockup HTML.

Likely cause: the `mockups` repo has no `.nojekyll` file, and GitHub Pages' default Jekyll processing excludes underscore-prefixed folders like `_ds/` from the built site. Standard fix is an empty `.nojekyll` at the repo root — a repo-wide change, not scoped to this folder, so it's being held for a decision with Jordan/the team rather than applied here.

Live URL: https://e8angels.github.io/mockups/resources-page/resources-page.html
