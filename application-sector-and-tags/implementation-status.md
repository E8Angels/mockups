# Sector & Tags: implementation status

Last updated: 2026-09-27. Update this file as work moves.

| WP | Status | Branch / PR | Worktree URL | Notes |
|---|---|---|---|---|
| WP0 Accuracy gate | Phase A merged ([#921](https://github.com/E8Angels/e8-portal/pull/921)). Phase B in progress on the trimmed plan | `wp0-sector-tags-accuracy` | http://localhost:8100 | Cap raised to $13 on 2026-09-27; $5.33 spent so far |
| WP1 Foundation | PR open ([#922](https://github.com/E8Angels/e8-portal/pull/922)), under review. Dev migration, seed and saved views applied | `wp1-sector-tags-foundation` | http://localhost:8120 | Prod commands listed below, not run |
| WP2 Tagging | Not started | | | Waits on WP1 and WP0 results |
| WP3 Components + record page | Draft PR ([#923](https://github.com/E8Angels/e8-portal/pull/923)); taking screenshots | `wp3-sector-tags-components` | http://localhost:8130 | Needs rebase and wiring after WP1 merges |
| WP4 Grids + filters | Not started | | | Waits on WP1 and WP3 components |
| WP5 AI + MCP | Not started | | | Waits on WP1 |
| WP6 Lists admin | Not started | | | Waits on WP1 |
| WP7 Label sweep + Sectors of Interest | Not started | | | Waits on WP1 |
| Rollout | Not started | | | Every step needs Jordan's approval |
| WP8 Cleanup | Not started | | | At least one week after rollout |

## Decision changes

- 2026-09-27: Business type has no limit on the number of values; it was exactly 1. `plan.md` is updated, and WP0, WP1 and WP3 have been told. WP0 revises the Hardware/Software wording in the seed and scores Business type by overlap.

- 2026-09-27: No dev dry-runs or live-AI dev tests unless they're necessary. WP1 runs the saved-view dry-run read-only against prod instead of dev. WP2 uses mocks plus a handful of live calls, and the monthly job is tested with mocked AI. The backfill dry-run saves its classifications and the real backfill applies them, so the AI cost is paid once; there's a cost estimate before any run.

- 2026-09-27: WP0 trimmed. GPT-6 Sol labels all 200 as the reference; Opus 5.5 labels 60 (boundary-weighted) to check cross-vendor agreement and how much a Sol-only reference flatters the OpenAI candidates. Lunas and Haiku get 3 runs each; Sonnet only if nothing cheaper passes. No separate stability runs, since the production 3-run vote measures that. Hard cap $13.

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

## Production steps awaiting approval

WP1, in order. Not run; each needs Jordan's OK:
1. `node scripts/run-sql-migration.js --env=prod scripts/migrate-sector-and-tags.sql`. Must run before the deploy.
2. `node scripts/load-taxonomy-seed.js --env=prod`, with `--dry-run` first.
3. Deploy.
4. `node scripts/migrate-saved-views-sector.js --env=prod`. The read-only prod dry-run shows 26 views, column `category` → `sector` only, with no filters dropped. 20 views still show a `secondary_category` column (WP4).
5. Re-run the `category` → `sector` copy from the migration header to catch companies categorized in the gap.
