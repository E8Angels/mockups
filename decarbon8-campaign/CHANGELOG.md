# Changelog

## 2026-07-27 (third pass)

- Sample donor names fictionalized for the public site; giving structure, tiers, asks, and mechanisms retained from the real pipeline.

## 2026-07-27 (second pass)

- Grid grouping redesigned for clarity: full-width colored stage bands (all five stages in pipeline order, Prospect → Declined; only In Conversation expanded in the mockup) and tier sub-groups rendered as colored left-rail sections with tinted headers, donor names aligned under their tier label; chevron-dot clutter removed; Recoverable checkboxes centered. Sample data replaced with real In Conversation people/tiers/asks/mechanisms from Karin's spreadsheet; flyout example is now Brian Arbogast.

## 2026-07-27

- First publish for Karin's review.

## 2026-07-26 (third pass)

- Tier sub-groups within each stage are the default grid grouping (with a trailing "No tier" sub-group); the separate "By tier" view is gone.

## 2026-07-26 (second pass)

- Incorporated Karin's actual spreadsheet: tier 1/2/3 field (sortable/groupable, tier-within-stage view); DAF mechanism back as free text with autocomplete (blank = unknown); expected amount renamed Ask (committed amount folds in at stage Committed); her Status column decomposed into stage + derived streak + recency + committee (no new enum); derived streak column (All N / ×N / Returned / Alt / New); giving split into lifetime / last gift / last-gift-year / years-active columns; D8 team role column + flyout chip; open-questions section for Karin (Active–Linked, Active–Core Team, survey tab, tier semantics); import prompt updated with column mappings + giving-history reconciliation.

## 2026-07-26

- MCP documentation elevated to a first-class deliverable (§7.1); added the one-time Cowork import of Karin's spreadsheet + Gmail history with conventions (staff-actor rows, message-id idempotency, confirm-before-creating-people) and the ready-to-paste prompt (§7.2), which doubles as the docs acceptance test.

## 2026-07-25 (fifth pass)

- Digest is weekly (was daily-default). Plan gains portal-wide reach-in: a seeded "Active Decarbon8 Prospects" view on the /admin/people grid (derived prospect-stage field, deploy-before-seed caveat) and a Decarbon8 Prospects audience token in the send-mail Audience Builder (active campaign, empty off-season, composable with excludes).

## 2026-07-25 (fourth pass)

- Flyout stage dropdown is color-coded to match the grid's stage chips (recolors on change). Digest email restructured into scannable tables — Stage changes (donor / new stage / why), Field updates (donor / expected / follow-up / status), New touchpoints (donor / direction / summary) — with donor-name links, widened layout.

## 2026-07-25 (third pass)

- Flyout: removed the Email button — the header email address is now a friendly-named mailto link (new window, hover-underlined). Grid: the Giving column's most-recent year is a color-coded recency tag (green = gave last year, through yellow/orange to red for lapsed donors).

## 2026-07-25 (second pass)

- Dropped cash/DAF vehicle tracking entirely — the existing `recoverable` flag is the only donation distinction (checkbox in grid + flyout, matching the Donors grid); dropped the owner concept (single-operator for now); flyout doubled in width with details and touchpoints as side-by-side columns (no scrolling) and stage as a compact dropdown; giving column now encodes recency ("$20k avg · 2023 +1" = most recent year plus N earlier years).

## 2026-07-25

- Feedback round: AI-maintained status summary + follow-up date replace the next-step one-liner (no tasks; "Ready for follow-up" view); seasonal on/off switch (no AI spend or digests off-season); fundraising-relevance filtering with broadcast detection (personal volunteer notes in bounds, blasts out); Add Prospect creates new people inline; giving history shown as average / most recent / prior + years; grid columns reworked (Follow-up + Status primary, Latest Touch dropped); note entry moved to a modal; email-specific inbound/outbound icons; compact Gmail icon-links; collapsed groups rendered as real collapsed headers.

## 2026-07-24

- Initial plan and mockups: Campaign tab (stats strip, stage-grouped prospect grid, prospect flyout with touchpoint timeline) and the AI activity digest email. Decisions baked in: 5 stages, full AI autonomy with digest oversight, summary-only logging with Gmail deep links, new Campaign tab under Decarbon8 admin.
