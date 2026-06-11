---
title: "Sourcing Committee Metrics"
status: draft
owner: sarah
created: 2026-05-26
last_updated: 2026-06-11
home: mockup
---

# Sourcing Committee Metrics

## Background

The Sourcing Committee wants a dashboard to measure the effectiveness of E8's
sourcing efforts — to "establish a proactive sourcing engine that consistently
delivers high-quality, diverse, and competitive climate deals." The committee's
April 7 2026 discussion (Sarah & Lorana) produced a wish list of ~14 candidate
metrics across seven themes; Q4 2026 is meant to establish a baseline, with Q1/Q2
2027 used to course-correct toward targets.

This v1 mockup takes the existing committee-dashboard shell (the same chrome the
Membership Committee page uses) and adds a Sourcing-specific **"At a glance"** card
above Notes, organized by the seven themes, with every tile drilling into detail.
Figures are populated from live E8 portal data (pull dated May 26, 2026) where the
metric is computable today; metrics that need new capture (e.g. a "How did you hear
about E8?" field) are shown as targets with the baseline marked pending.

## Proposed UX

A new **At a glance** card sits above Notes, grouped into the doc's themes. Each
tile shows the current value, a **target chip**, and a red/amber/green status dot:

- **Deal Quality** — average screening score by stage (0–4 scale), and the share of
  advancing deals clearing the score thresholds. Targets: ≥3.0 avg to pre-screening
  / screening, ≥3.5 to member meeting.
- **Dealflow Mix & Attribution** — source-attribution coverage (the gating metric),
  with proactive-vs-reactive split shown as "pending" until the new source field
  exists. Targets: 100% tagged by Sep 2026; ≥60% proactively sourced; ≥75% of
  investment into proactive deals.
- **Channel Effectiveness & Coverage** — active sourcing channels, top channel,
  channel concentration (target <40% from any one channel), plus a per-channel table.
- **Partner Network Strength** — active (Operational) sourcing partners with a
  red/amber/green pipeline, referrals-in this year, and a top-referrers table.
  Targets: ≥8 active Tier 1/2 partners; ≥3 qualified referrals per priority partner
  per quarter.
- **Diversity of Dealflow** — share of inbound deals with female / underrepresented
  founders, month-over-month. Target ≥60%.

Below the tiles, a **Metrics** card with tabs renders simple bar charts from the same
live data: channel mix, current pipeline by stage, partner pipeline (RAG), and founder
diversity. Clicking a tile opens a right-hand **drawer** with the underlying breakdown
(channel list, partner list with RAG + referral counts, diversity detail, and a
deal-quality methodology note). The sidebar carries the real committee roster, meetings,
and the committee's actual Drive documents.

### Live figures used in this draft (pull: May 26, 2026)

- Applications: 275 in 2026 (448 in 2025).
- Current pipeline: Watchlist 60, Pre-Screening 36, Pre-Diligence 6, Diligence 6, Invested 20.
- Deal quality (composite avg, 0–4): Pre-Screening 1.6, Screening 2.2 — full-history baseline.
- Source attribution: only 37 of 246 (15%) of 2026 applicant companies are tagged with a source.
- Channel mix (tagged): VC/Incubator 49, Industry Event 36, Speed Networking 28, Pitch Event 15, Personal 15, PortCo 3.
- Partners: 276 orgs; pipeline — Operational 20, Initiated 30, Priority to Initiate 6, Not Started 138; 114 have an E8 owner.
- Referrals in (2026): 60. Top referrers: Greentown Labs 17, Keiretsu Forum 6, Third Derivative 4, SV Social Venture Fund 4.
- Founder diversity (2026 applicants): 124 of 246 underrepresented = 50%.

## Open questions

- **Score thresholds & scale.** The portal records scores 0–4 (Dealbreaker→Strong) and
  the doc cites 3.0/3.5 "averages." v1 uses the composite category average per stage as
  the headline; the doc notes the Recommendation measure may be the better signal. Which
  should the tile use, and over what window (full history vs. trailing 12 months vs. current cycle)?
- **Proactive vs reactive.** Current `lead_source` tags (VC/Incubator, Industry Event,
  Speed Networking, Pitch Event, Personal, PortCo) are all proactive-style; there is no
  "reactive/inbound" category, so the split is not yet computable. Confirm the planned
  "How did you hear about E8?" application dropdown and its option list.
- **Attribution target.** Coverage is 15% today vs a 100%-by-Sep-2026 target. Is the tile's
  denominator "applicant companies" or "all deals"?
- **Partner tiers.** The doc targets "Tier 1 / Tier 2 active" partners; the portal stores a
  `deal_flow_sharing_status` (Not Started → Operational) but not an explicit tier. Map status
  to tier, or add a tier field?
- **Per-channel quality & conversion.** Volume by channel is live now; avg score and
  conversion per channel need the source field wired through the pipeline before they populate.
- **Which metrics make v1?** The doc flags some as Remove (conversion ≥40%/channel), Low
  (portfolio showcases), or "keep reporting as is." Confirm the cut for the first shipped version.
