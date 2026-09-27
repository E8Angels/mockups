# Sector & Tags: implementation status

Last updated: 2026-09-27. Update this file as work moves.

| WP | Status | Branch / PR | Worktree URL | Notes |
|---|---|---|---|---|
| WP0 Accuracy gate | **Done.** [#921](https://github.com/E8Angels/e8-portal/pull/921) and [#924](https://github.com/E8Angels/e8-portal/pull/924) merged; results in [`wp0-results.md`](wp0-results.md) | `wp0-sector-tags-accuracy` | http://localhost:8100 | $11.60 spent. GPT-6 Luna, low effort, direct input, union |
| WP1 Foundation | **Merged** ([#922](https://github.com/E8Angels/e8-portal/pull/922), `a7ae2be0`) after Opus review; 12 findings fixed. Prod migration and seed v1 applied 2026-09-27 | `wp1-sector-tags-foundation` | http://localhost:8120 | Deploy and post-deploy steps wait for rollout |
| WP2 Tagging | 12 fixes pushed to [#930](https://github.com/E8Angels/e8-portal/pull/930) (sweep job, jobs table, atomic claim); Opus re-review in progress | `wp2-sector-tags-tagging` | http://localhost:8170 | Prod backfill about $2.50 |
| WP3 Components + record page | **Merged** ([#923](https://github.com/E8Angels/e8-portal/pull/923), `b9f95307`) after Opus review; 13 fixes | `wp3-sector-tags-components` | http://localhost:8130 | Tag picker `mode="assign"` in edit mode, `mode="filter"` for filters |
| WP4 Grids + filters | In progress (Sonnet) | `wp4-sector-tags-grids` | | Turns on `TAG_CHIP_EXPLORE_LINKS_ENABLED` once `?tag=` works |
| WP5 AI + MCP | **Merged** ([#927](https://github.com/E8Angels/e8-portal/pull/927), `1e03f4a9`) after Opus review; 9 fixes | `wp5-sector-tags-ai-mcp` | http://localhost:8140 | Live eval suite (default model `gpt-5.6`) about $1–10; not run |
| WP6 Lists admin | Opus fixes pushed to [#925](https://github.com/E8Angels/e8-portal/pull/925) (`5ea5151f`); final review in progress | `wp6-sector-tags-lists-admin` | http://localhost:8160 | Sector delete now deactivates. Don't edit the Lists admin during the rolling deploy |
| WP7 Label sweep + Sectors of Interest | **Merged** ([#926](https://github.com/E8Angels/e8-portal/pull/926)) after Opus review; 13 fixes plus a follow-up | `wp7-sector-tags-labels` | http://localhost:8150 | e8angels-com branch `wp7-sector-tags-sector-field` (`fcde436`), local only |
| Rollout | Not started | | | Every step needs Jordan's approval |
| WP8 Cleanup | Not started | | | At least one week after rollout |

## Decision changes

- 2026-09-27: Business type has no limit on the number of values; it was exactly 1. `plan.md` is updated, and WP0, WP1 and WP3 have been told. WP0 revises the Hardware/Software wording in the seed and scores Business type by overlap.

- 2026-09-27: No dev dry-runs or live-AI dev tests unless they're necessary. WP1 runs the saved-view dry-run read-only against prod instead of dev. WP2 uses mocks plus a handful of live calls, and the monthly job is tested with mocked AI. The backfill dry-run saves its classifications and the real backfill applies them, so the AI cost is paid once; there's a cost estimate before any run.

- 2026-09-27: WP0 trimmed. GPT-6 Sol labels all 200 as the reference; Opus 5.5 labels 60 (boundary-weighted) to check cross-vendor agreement and how much a Sol-only reference flatters the OpenAI candidates. Lunas and Haiku get 3 runs each; Sonnet only if nothing cheaper passes. No separate stability runs, since the production 3-run vote measures that. Hard cap $13.

- 2026-09-27: WP0 decisions (Jordan): accept the run-to-run shortfall, with 2–1 splits going to `needs_review`; classify directly with no brief step; remove the "most companies have one" Business type wording. Production model: GPT-6 Luna, low effort, union tags (plan decisions 8–9).

- 2026-09-27 (orchestrator call, open to Jordan's override): the extra legacy Sectors of Interest values map as Grid → Grid & Power, Renewables → Energy Generation, AgTech and Food → AgTech & Food, Circular Economy → Recycling & Waste, Other Environmental → Other.

- 2026-09-27: The rollout keeps the gap between deploy and backfill to minutes. The backfill classifies and saves to `application_classifications` on prod before the deploy (the current code never reads that table); Jordan reviews the report; the apply runs right after the deploy. Prod has 251 companies with no submitted application, which can't be tagged; 8 have legacy Sector values (Infrastructure and Recycling map deterministically, the rest go to manual review). Untagged companies fall back to Sector-only similar applications in AI Insights.

## Blockers

None.

## Follow-ups found along the way

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
- `node scripts/run-sql-migration.js --env=prod scripts/migrate-sector-and-tags.sql`: 21 statements. 2,733 companies got `sector` (0 mismatches with `category`); 6 tables created; `sector` list with 16 items. The `category` list is still active.
- `node scripts/load-taxonomy-seed.js --env=prod`: 240 tags (197/27/9/7) and 16 Sector definitions, taxonomy version 1.

Awaiting approval (rollout), in order:
1. Pre-deploy migrations (additive; the old code ignores them):
   - `node scripts/migrate-taxonomy-admin-tracking.js --env=prod` (WP6; must precede the seed reload)
   - `node scripts/run-sql-migration.js --env=prod scripts/migrate-sector-and-tags-tagging.sql` (WP2; 4 columns and 3 tables incl. `application_classification_jobs`)
   - `node scripts/run-sql-migration.js --env=prod scripts/migrate-member-data-query-views.sql` (WP5)
2. Seed v2 reload: `node scripts/load-taxonomy-seed.js --env=prod --dry-run`, then again without `--dry-run`.
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
