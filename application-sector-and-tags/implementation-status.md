# Sector & Tags: implementation status

Last updated: 2026-09-27. Update this file as work moves.

| WP | Status | Branch / PR | Worktree URL | Notes |
|---|---|---|---|---|
| WP0 Accuracy gate | Phase A merged: seed.json ([#921](https://github.com/E8Angels/e8-portal/pull/921)). Phase B in progress: reference set, eval, candidates | `wp0-sector-tags-accuracy` | http://localhost:8100 | ~$15 AI spend approved 2026-09-26 |
| WP1 Foundation | In progress (Opus). Rebasing onto seed.json | `wp1-sector-tags-foundation` | | Dev migration pre-authorized; prod SQL waits for approval |
| WP2 Tagging | Not started | | | Waits on WP1 and WP0 results |
| WP3 Components + record page | In progress (Sonnet), on fixtures from seed.json; draft PR until WP1 merges | `wp3-sector-tags-components` | | |
| WP4 Grids + filters | Not started | | | Waits on WP1 and WP3 components |
| WP5 AI + MCP | Not started | | | Waits on WP1 |
| WP6 Lists admin | Not started | | | Waits on WP1 |
| WP7 Label sweep + Sectors of Interest | Not started | | | Waits on WP1 |
| Rollout | Not started | | | Every step needs Jordan's approval |
| WP8 Cleanup | Not started | | | At least one week after rollout |

## Blockers

None.

## Follow-ups found along the way

- WP0 ships `seed.json` as its own early PR so WP1 can load real content, then opens a second PR for the reference set and eval. This is a deliberate exception to one PR per WP.
- Seed format unchanged. Family-wide rules (one Business type, Market = all that apply, Built with only when fundamental) and Sector rules 1–5 live in a shared, versioned prompt module (planned `lib/taxonomy/classification-prompt.js`), written in WP0 and imported by WP2.
- `__tests__/lib/ai-models.test.js` pins current model IDs; update it when the `tagging` role lands.
- Worktrees land under the orchestrator worktree's `.worktrees/` (`treasure-child/.worktrees/`), not the root repo.
- The root `docs/mockups` checkout was missing on 2026-09-27 and was cloned so worktrees get the symlink.

## Production steps awaiting approval

None yet.
