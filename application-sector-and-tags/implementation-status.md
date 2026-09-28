# Sector & Tags: implementation status

Last updated: 2026-09-27. Update this file as work moves.

| WP | Status | Branch / PR | Worktree URL | Notes |
|---|---|---|---|---|
| WP0 Accuracy gate | **Done.** [#921](https://github.com/E8Angels/e8-portal/pull/921) and [#924](https://github.com/E8Angels/e8-portal/pull/924) merged; results in [`wp0-results.md`](wp0-results.md) | `wp0-sector-tags-accuracy` | http://localhost:8100 | $11.60 spent. GPT-6 Luna, low effort, direct input, union |
| WP1 Foundation | **Merged** ([#922](https://github.com/E8Angels/e8-portal/pull/922), `a7ae2be0`) after Opus review; 12 findings fixed. Prod migration and seed v1 applied 2026-09-27 | `wp1-sector-tags-foundation` | http://localhost:8120 | Deploy and post-deploy steps wait for rollout |
| WP2 Tagging | **Merged** ([#930](https://github.com/E8Angels/e8-portal/pull/930)) after three Opus review rounds | `wp2-sector-tags-tagging` | http://localhost:8170 | Dev live calls $0.013. Prod backfill about $2.50 (worst $11.13). Monthly health AI parts about $1.40/month in prod |
| WP3 Components + record page | **Merged** ([#923](https://github.com/E8Angels/e8-portal/pull/923), `b9f95307`) after Opus review; 13 fixes | `wp3-sector-tags-components` | http://localhost:8130 | Tag picker `mode="assign"` in edit mode, `mode="filter"` for filters |
| WP4 Grids + filters | **Merged** ([#934](https://github.com/E8Angels/e8-portal/pull/934)) after Opus review; 12 fixes. Metrics is a straight rename to "By Sector" | `wp4-sector-tags-grids` | http://localhost:8200 | |
| WP5 AI + MCP | **Merged** ([#927](https://github.com/E8Angels/e8-portal/pull/927), `1e03f4a9`) after Opus review; 9 fixes | `wp5-sector-tags-ai-mcp` | http://localhost:8140 | Live eval suite (default model `gpt-5.6`) about $1–10; not run |
| WP6 Lists admin | **Merged** ([#925](https://github.com/E8Angels/e8-portal/pull/925)); finished on Opus after three review rounds | `wp6-sector-tags-lists-admin` | http://localhost:8160 | Sector delete deactivates. A cited tag can't be deactivated until it's merged or its references are removed. Don't edit the Lists admin during the rolling deploy |
| WP7 Label sweep + Sectors of Interest | **Merged** ([#926](https://github.com/E8Angels/e8-portal/pull/926)) after Opus review; 13 fixes plus a follow-up | `wp7-sector-tags-labels` | http://localhost:8150 | e8angels-com branch `wp7-sector-tags-sector-field` (`fcde436`), local only |
| Rollout | **Complete** (2026-09-28). Portal deployed with hotfixes #938 and #939; all companies on valid Sectors; e8angels.com deployed and portfolio re-imported | | | WP8 started immediately (no waiting period) |
| WP8 Cleanup | **Done** (2026-09-28). [#940](https://github.com/E8Angels/e8-portal/pull/940) merged after Opus review plus a fix (`list_successful_exits` read `c.category`); deployed `de79bb06`; prod views rewritten (20 grid, 4 embed); prod contract drop done | | | Backup: `~/dev/e8-portal/tmp/sector-and-tags-contract-backup-prod-2026-09-28T14-27-30-871Z.json`. Tag split/merge tuning still open |

## Decision changes

- 2026-09-27: Business type has no limit on the number of values; it was exactly 1. `plan.md` is updated, and WP0, WP1 and WP3 have been told. WP0 revises the Hardware/Software wording in the seed and scores Business type by overlap.

- 2026-09-27: No dev dry-runs or live-AI dev tests unless they're necessary. WP1 runs the saved-view dry-run read-only against prod instead of dev. WP2 uses mocks plus a handful of live calls, and the monthly job is tested with mocked AI. The backfill dry-run saves its classifications and the real backfill applies them, so the AI cost is paid once; there's a cost estimate before any run.

- 2026-09-27: WP0 trimmed. GPT-6 Sol labels all 200 as the reference; Opus 5.5 labels 60 (boundary-weighted) to check cross-vendor agreement and how much a Sol-only reference flatters the OpenAI candidates. Lunas and Haiku get 3 runs each; Sonnet only if nothing cheaper passes. No separate stability runs, since the production 3-run vote measures that. Hard cap $13.

- 2026-09-27: WP0 decisions (Jordan): accept the run-to-run shortfall, with 2–1 splits going to `needs_review`; classify directly with no brief step; remove the "most companies have one" Business type wording. Production model: GPT-6 Luna, low effort, union tags (plan decisions 8–9).

- 2026-09-27 (orchestrator call, open to Jordan's override): the extra legacy Sectors of Interest values map as Grid → Grid & Power, Renewables → Energy Generation, AgTech and Food → AgTech & Food, Circular Economy → Recycling & Waste, Other Environmental → Other.

- 2026-09-27: The rollout keeps the gap between deploy and backfill to minutes. The backfill classifies and saves to `application_classifications` on prod before the deploy (the current code never reads that table); Jordan reviews the report; the apply runs right after the deploy. Prod has 251 companies with no submitted application, which can't be tagged; 8 have legacy Sector values (Infrastructure and Recycling map deterministically, the rest go to manual review). Untagged companies fall back to Sector-only similar applications in AI Insights.

- 2026-09-28: Jordan dropped the one-week wait before WP8; it had been written into the brief, not decided by him. There will be no redeploy rollback, and database backups exist. WP8 started immediately.
- 2026-09-28: Torn down 13 merged worktrees (WP0–WP7 and 5 fixes).

- 2026-09-28: WP8 prod steps, approved by Jordan: saved-view rewrite (before the deploy); deploy `de79bb06` (includes #941); `migrate-sector-and-tags-contract.js --env=prod` dropped `companies.category` (2,762 non-empty) and `secondary_category` (2,385), recreated `companies_public`, and deleted the `category` (16) and `subcategory` (40) lists. Dev is contracted too.

## Blockers

None. `tagging_pending_sweep` recorded success at 2026-09-28 04:00 UTC after the #939 deploy.

## Follow-ups found along the way

- **Done 2026-09-28:** tag splits. [#942](https://github.com/E8Angels/e8-portal/pull/942) merged after Opus review. Prod taxonomy v3: 24 new tags, 2 renames, 33 definitions edited. `--retag-tags` re-tagged 1,148 companies for $0.866 (554 moved; no Sector or non-Technology tag changed; manual tags intact). 6 companies returned no Technology tag and kept their old ones. Correction pass done under the standing approval: 21 companies corrected (9 tags added, 14 removed, 8 primaries changed, 1 Sector: ESTAT → Industrial); 14 left as "unsure" (e.g. Wadelle, Jois, OnePak, Avenue Intelligence, Forever Flight, SEEVA, Magnaboard). Duplicate company records seen: Jiminy's (×2), Full Circle Farm(s).
- (Superseded) tag tuning plan: Jordan approved 11 splits plus two new tags (efficiency-retrofits-financing, hydrogen-chemical-storage): 24 new tags in all, with a targeted re-tag of about 765 companies (~$0.55, cap $2). No merges: the small tags (plug-in solar, wide-bandgap, geopolymers, metals & steel, decentralized sanitation) are distinct categories and stay. Broad tags are valuable as modifiers; split only to tell companies apart. Metals & steel corrected: Solacia, Phinix, Hydrova and ReSourceX added. About 60 misapplied tags will be corrected under the standing approval after the splits.
- 32 companies whose latest submitted application has no text stay unclassified. Twenty come from a 2026-02-15 bulk import. Nine need attention: six hold retired Sectors (EQO Recycling, Transaera Infrastructure, ATX LED and Enersponse Energy Efficiency, Terra.do Software) and four have none (Full Moon Sensor, Open Ocean Robotics, EDEN Concept Fill, Green Think Energy). Fix manually, or classify from the company record.
- e8angels.com: the three public views (All active, E8 Fund, Decarbon8) return only `primary_category`, not `sector`. Add the Sector column in View Builder and remove the import's fallback to `primary_category`.
- Long tag chips wrapped onto two lines in grid rows; fixed in [#937](https://github.com/E8Angels/e8-portal/pull/937).
- Metrics "By Category" counts investments, so it becomes "By Sector" bucketed by the company's current Sector (the plan's rename). Decision 5 (each application counted under its own Sector) applies to dealflow reports; no dealflow-by-sector report exists today, so it applies when one is built. `application_classifications.sector` holds the per-application Sector.
- PR #932 (outside this project) left two TopNav tests stale on main; fixed in [#935](https://github.com/E8Angels/e8-portal/pull/935).
- `dynamic-rollups.test.js` broke on main after WP5 (the test was out of date); fixed in [#933](https://github.com/E8Angels/e8-portal/pull/933).
- New companies no longer get `secondary_category` (`ai-categorizer.js` is retired). The public embed's legacy `secondary_categories` key is therefore empty for new companies until WP8 removes it; e8angels.com moves to `sector`.
- The smoke auth session expired on 2026-09-20; a fresh dev session was minted on 2026-09-27.
- `worktree-create.sh` picks ports from `.worktrees/` only, so it can clash with registry-held ports (WP1 got 8120 instead of 8110).
- Tag renames (WP6) invalidate the whole directory: a rebuild of about 100 s on every instance.
- Legacy category-list renames never refreshed cached rows; `sector` renames do.
- WP0 ships `seed.json` as its own early PR so WP1 can load real content, then opens a second PR for the reference set and eval. This is a deliberate exception to one PR per WP.
- Seed format unchanged. Family-wide rules (Business type = what customers pay for, as many as genuinely apply; Market = all that apply, Built with only when fundamental) and Sector rules 1–5 live in a shared, versioned prompt module (planned `lib/taxonomy/classification-prompt.js`), written in WP0 and imported by WP2.
- `__tests__/lib/ai-models.test.js` pins current model IDs; update it when the `tagging` role lands.
- Worktrees land under the orchestrator worktree's `.worktrees/` (`treasure-child/.worktrees/`), not the root repo.
- The root `docs/mockups` checkout was missing on 2026-09-27 and was cloned so worktrees get the symlink.

## Production steps

Done (approved by Jordan 2026-09-27):
- Phase A step 1: `node scripts/migrate-taxonomy-admin-tracking.js --env=prod` added 3 columns and backfilled `seed_name` on 16 Sectors.
- Phase A step 2: `migrate-sector-and-tags-tagging.sql`, 12 statements; jobs, health reports and proposals tables created.
- Phase A step 3: `migrate-member-data-query-views.sql`, 16 statements; `companies_public` has 2,961 rows, 2,733 with a Sector.
- Phase A step 4: seed v2 reload; 9 Business type tags and 5 Sector definitions updated; taxonomy version 2.
- Phase A step 5: backfill `--dry-run`: 2,678 classifications saved, 0 failed; cost $1.84. 32 applications have no text.
- Deploy by Jordan, 2026-09-28 ~03:15 UTC (worker registered the new jobs at 03:15:09).
- Phase B: the catch-up backfill had nothing to classify.
- Phase B: AI Insights prompt stored (screening_review v10).
- Phase B: saved views rewritten (26; 0 filters or colour rules dropped).
- Phase B: Sectors of Interest remapped (106 members; 1 left with none).
- Phase B: `--apply` finished; 2,671 companies tagged; Iteros and Novinium mapped Infrastructure → Grid & Power.
- Phase B: post-deploy script run; `category` list definition inactive.
- Manual Sectors set, approved by Jordan: EQO → Recycling & Waste, Transaera → Grid & Power; then 12 more (ATX LED, Revert, Retrolux → Built Environment; Enersponse → Grid & Power; Full Moon Sensor → Carbon; Open Ocean Robotics → Conservation & Adaptation; EDEN Concept Fill → Sustainable Materials; Green Think Energy, Atmos → Energy Generation; Propel → Clean Fuels & Hydrogen; Climate First Bank → Other; Eko → Not cleantech). 0 retired values remain in prod.
- Backfill fix #938: classified 6 more (UrbanX, 2S Water, Terra.do, OpConnect, Evrnu, Triton Anchor; $0.005) and rolled up only those.
- e8angels.com: `sector` added to embed views #4, #1 and #3 (prod). Site PR E8Angels/e8-website#84 merged and deployed to Vercel production (www.e8angels.com). Portfolio import via the repo's "Sync portfolio from portal" workflow (run 36375504703): 2 created, 187 updated, 3 flagged missing, 0 retired values. The live portfolio shows the 16 Sectors.
- Omnidian corrected: Not cleantech → Energy Generation (manual; solar performance services), under Jordan's standing approval for Sector/tag fixes.
- Phase A step 6: report. Of 2,710 companies: 1,403 unchanged, 1,249 changed (711 from retired values, 126 pure renames, 538 re-sorted between current Sectors), 26 newly given a Sector; 236 need review. Tags per company: Technology 1.53, Market 2.66, Business type 1.87, Built with 0.46; 1-vote share 15.8%.
- `node scripts/run-sql-migration.js --env=prod scripts/migrate-sector-and-tags.sql`: 21 statements. 2,733 companies got `sector` (0 mismatches with `category`); 6 tables created; `sector` list with 16 items. The `category` list is still active.
- `node scripts/load-taxonomy-seed.js --env=prod`: 240 tags (197/27/9/7) and 16 Sector definitions, taxonomy version 1.

Awaiting approval (rollout), in order:
1. Pre-deploy migrations (additive; the old code ignores them):
   - `node scripts/migrate-taxonomy-admin-tracking.js --env=prod` (WP6; must precede the seed reload)
   - `node scripts/run-sql-migration.js --env=prod scripts/migrate-sector-and-tags-tagging.sql` (WP2; 4 columns and 3 tables incl. `application_classification_jobs`)
   - `node scripts/run-sql-migration.js --env=prod scripts/migrate-member-data-query-views.sql` (WP5)
2. Seed v2 reload: `node scripts/load-taxonomy-seed.js --env=prod --dry-run`, then again without `--dry-run`. The review simulated 9 tags and up to 5 Sectors updated, nothing skipped; re-check the dry-run counts after the migration.
3. Backfill classify-and-save before the deploy: `node scripts/backfill-sector-and-tags.js --env=prod --dry-run` (about $2.50), then `--report --report-file=tmp/prod-backfill-report.json` for Jordan to review.
4. Deploy, and set `SLACK_TAXONOMY_REPORT_CHANNEL_ID=C0B8LQD6SN4` on Fly. The monthly health job's AI parts default on in prod, about $1.40 a month.
5. Right after the deploy:
   - `node scripts/backfill-sector-and-tags.js --env=prod --dry-run` again, as a catch-up that classifies only applications submitted since the first run (cents)
   - `node scripts/backfill-sector-and-tags.js --env=prod --apply`
   - `node scripts/run-sql-migration.js --env=prod scripts/migrate-sector-and-tags-post-deploy.sql`
   - `node scripts/migrate-application-insights-prompt.js --file=docs/application-insights-prompt.md --env=prod`
6. `node scripts/migrate-saved-views-sector.js --env=prod`: 26 views, columns only.
7. `node scripts/remap-sectors-of-interest.js --env=prod`: 106 of 125 members affected.
8. Optional: the live Ask AI eval suite (default model `gpt-5.6`; about $1–10).
9. The e8angels.com change (push, deploy, Sanity schema and re-import).
