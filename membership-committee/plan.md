---
title: "Membership Committee Page"
status: draft
owner: amanda
created: 2026-05-21
last_updated: 2026-05-28
home: mockup
---

# Membership Committee Page

## Background

The Membership Committee page currently jumps straight from Notes into the Metrics chart. The committee wants a roster snapshot — counts they can scan in a few seconds and click into — sitting above the Notes section, so they can see membership health without opening a separate report.

This mockup adds an "At a glance" card above Notes and makes every number a drill-in.

## Proposed UX

A new **At a glance** card is inserted directly above the Notes card, with three rows of stat tiles:

- **Roster** — Total members, New members YTD, Past members YTD, Active prospects.
- **Health** — Members at risk (no meetings/events in 6+ months), 1-year retention, Annual survey completion.
- **Members by hub** — Seattle, Oregon, Bay Area, SoCal, New York, Other.

Every tile is clickable. The mockup is a multi-screen linked prototype:

1. **Committee home** — the page with the At a glance card, Notes, and Metrics.
2. **Bucket page** — clicking a tile opens a full-page list of the people in that bucket (e.g. "New members YTD", "Members in Seattle").
3. **Member profile** — clicking a person opens a full profile with: contact & sourcing (location, email, LinkedIn, hub, lead source + detail, e8 member pair), lifecycle (join date, tenure, referral, last activity, survey), direct investments (company + date + amount, with deployed/returned totals), Annual Fund membership years, an engagement log (meetings / learning labs / diligence debriefs by count), committee history (current + past), diligence teams with role, interests, and — for prospects/past members — pipeline or departure detail.

The Annual survey tile is an external link to the survey results page rather than a drill-in.

All figures in the current mockup are populated from live E8 portal data (pull dated May 13, 2026).

### Definitions used

- **Total members** — distinct people holding the `Member` or `Corporate Member` role.
- **New / Past YTD** — `Membership Join` / `Membership Lapse` engagement events in 2026, paying members only (Additional Members excluded).
- **At risk** — members with no meeting/event engagement in 6+ months; Corporate Members are excluded since they don't attend individually.
- **1-yr retention** — of the 2025 paying-member cohort, the share still holding a paying role today.

## Open questions

- **Total members: 138 vs 139.** The role-based count is 138 (`Member` + `Corporate Member`). The portal's Metrics chart shows 139 because it runs a cumulative joins-minus-lapses total from a hardcoded baseline. The gap is a counting-method drift, not a single person. Decide which definition the tile should use.
- **Orphan engagement records.** Two 2026 `Membership Join` events point to person IDs that don't exist in the `people` table (`recQtmQCPEmnZhQWm`, `recYlwWYZbnxPwqcc`). They should be cleaned up or backfilled.
- **Survey results URL.** The Annual survey tile links to a best-guess URL (`/surveys/e8-annual-survey-2026`); confirm the real results page path.
- **"How they want to invest"** on the member profile is a placeholder — needs the specific annual-survey questions mapped to it.
- **Sidebar content** (committee members, documents) is currently hardcoded from a screenshot; wire it to `committee_membership_events` and `committee_documents` if this ships.
