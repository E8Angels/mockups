# Changelog

- 2026-09-25: Initial plan and mockup: Sector rename, Tags families (Technology tree, Market, Business type, Enabling tech), tag picker, display surfaces, data model, work packages.
- 2026-09-25: Decisions recorded (applicants hidden, Sectors of Interest remap, embed keys + e8angels.com, leaf + N cell). Classification revised: Sector derived from primary Technology tag, scope notes, brief → tag → 3-run vote, provenance, review queue, WP0 accuracy gate with gold set; Market/Business type/Enabling tightened.
- 2026-09-25: Per Jordan: Sector stays independent of Technology; no Market cap; Government/Heavy industry/AI kept with tighter definitions; Energy project developers market added. Human gold set replaced by a two-vendor frontier reference set; model comparison (GPT-6 Luna, GPT-5.6 Luna, Haiku 4.5 vs frontier references); monthly taxonomy health report and model-drift checks.
- 2026-09-26: Reference models = flagship per vendor (GPT-6 Sol, Claude Opus 5.5); production candidates add Sonnet 5; tags = union of 3 runs with per-tag vote counts (tested vs 2-of-3 in WP0); classify once when the best input is ready; monthly Taxonomy health page + Slack link to #screening-chairs-jordan-sarah, reviewed monthly by Jordan.
- 2026-09-26: No AI/Manual display (source tracked internally only); all tags as pills, Technology pills show parent level; re-applications additive (union of tags, manual removals stick, company Sector = latest application, reporting by each application's Sector); per-application classification rows; Slack channel C0B8LQD6SN4.
- 2026-09-27: "Enabling tech" renamed "Built with" (kept as its own family; Technology = what they build, Built with = what it's built with).
- 2026-09-27: Confirmed: reporting by each application's Sector; members see Sector and Tags on Explore Companies.
- 2026-09-27: Handoff package: orchestrator-brief.md (sequence, gates, seed format, done criteria), implementation-status.md, category-usage-inventory.md, ui-building-blocks.md; plan consistency fixes (per-application classification, PATCH semantics, WP0 owns seed.json).
- 2026-09-27: Orchestrator brief gains a Model use section (Opus for WP0–WP2 and review, Sonnet for WP3–WP7, Haiku/Sonnet for searches).

- 2026-09-27: Orchestration started. WP0 and WP1 launched in parallel.
- 2026-09-27: seed.json merged (#921). WP0 Phase B and WP3 (on fixtures) started.
- 2026-09-27: Business type no longer limited to one value (plan decision 7).
