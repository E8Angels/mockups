---
title: "Pipeline & Portfolio — internal view"
status: draft
owner: sarah
created: 2026-07-06
last_updated: 2026-07-06
home: mockup
---

# Pipeline & Portfolio — internal view

## Background

Split out of Sourcing Committee Metrics V4 (2026-07-06) per Sarah's review. The
committee dashboard stays outcome-focused for committee meetings; this internal
companion holds the operational/working sections Sarah uses directly.

## Sections (moved from sourcing-committee V3)

- **Decide & act this quarter** — editable action cards (Pursue / Re-engage / Fix /
  Review): click-through rationale showing the rule that fired and its evidence,
  editable status (Proposed/Accepted/In progress/Dismissed), notes, and multiple
  tasks per decision with checkboxes. Session-only persistence in the mockup; a
  committee-actions table with audit trail in production.
- **Data discipline** — capture-rate tiles with targets (referral-linked
  intentionally has none) and click-through to source fields and sample records.
  Q4 2026 baseline snapshot.
- **PitchBook-assessed success** — cleantech exits per investor vs referrals sent
  to E8, all current deal-flow partners ("pending" where unmatched), non-system
  cleantech investors, and an Other bucket. Placeholder pending PitchBook
  integration. (Future-relationship radar stayed on the committee dashboard,
  under Dealflow by channel.)
- **Source → investment outcomes** — invested dollars by attributed channel with
  company drill-downs; amounts are actuals, never timeframe-scaled.

## Open questions

- Should decisions/tasks sync to the committee dashboard once accepted, or stay
  internal until announced?
- Where should the committee-actions table live in the portal schema?
- PitchBook integration scope: exits only, or fund size / co-investors / round
  participation too?
