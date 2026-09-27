# Sector & Tags: orchestrator brief

You are coordinating the Sector & Tags project in the e8-portal repo. Each work package (WP) runs as its own agent, in its own worktree, with its own PR. All product decisions are made. Don't reopen them; if something is genuinely missing, ask Jordan.

## Read first, in this order

1. `plan.md` (this folder): what to build and why. It ends with the decision log.
2. `mockup.html` (this folder, published at https://e8angels.github.io/mockups/application-sector-and-tags/mockup.html): the screens and the starting tag lists.
3. `AGENTS.md` at the repo root, plus the guides it routes to:
   - `docs/data-change-guide.md` for schema, write contracts and MCP
   - `docs/design-guide.md` for UI
   - `docs/worktree-dev-workflow.md` for worktrees and shipping
4. `category-usage-inventory.md`: every place `category` / `secondary_category` is read, written, shown or filtered today. Line numbers are from main at `d346bbd5` and will drift.
5. `ui-building-blocks.md`: existing components to reuse.
6. Jordan's project memory (`project_application_taxonomy_redesign` and the notes linked from its index), if your runtime loads it.

The taxonomy review page with the September test-run counts: https://claude.ai/artifact/TSe7kFJEPMh1Jh3DCKGC86.

## Sequence and gates

```
WP0 (accuracy gate) ──────────────────────────────┐
  └─ first commit: lib/taxonomy/seed.json          │
WP1 (foundation) ── merged ──┬─ WP2 tagging ◄──────┘ (model + method from WP0)
                             ├─ WP3 components + record page ── WP4 grids + filters
                             ├─ WP5 AI + MCP
                             ├─ WP6 lists admin
                             └─ WP7 label sweep + Sectors of Interest
All merged ─► Rollout (Jordan approves each step) ─► WP8 cleanup (≥ 1 week later)
```

- **WP0 and WP1 start together.** WP0's first commit is `seed.json` in the format below. Merge it early so WP1's loader has real content.
- **WP2–WP7 start after WP1 merges** and rebase on main.
  - WP3 may start earlier against fixtures that follow the row shape in `plan.md` → Data model.
  - WP4 uses WP3's components, so start it after WP3's components land, or coordinate a shared branch point.
- **`lib/cache-manager.js` is huge and shared.** WP1, WP4 and WP5 all touch it. Keep each change to its own functions, rebase often, and merge in dependency order.

## Approval gates (never cross these without Jordan's explicit OK)

State the exact command, target and impact when asking.

- **Any production database write or migration:**
  - the Sector & Tags schema
  - the managed-list re-key
  - the saved-view rewrite
  - the Sectors of Interest remap
  - the backfill
- **Any production deploy.**
- **The production write of the AI Insights prompt** (`scripts/migrate-application-insights-prompt.js`).
- **Setting production secrets.** For example, `SLACK_TAXONOMY_REPORT_CHANNEL_ID=C0B8LQD6SN4` on Fly.
- **Live AI spend beyond what's approved.** WP0 has about **$15** approved. Anything else — WP2 dev testing beyond a handful of calls, the backfill run, monthly jobs in dev — needs an estimate and a yes.
- **Pushing or deploying `~/dev/e8angels-com`**, or re-importing its Sanity content.

Pre-authorized, per `AGENTS.md`:
- local commits
- dev database migrations
- read-only production queries through `scripts/db-query.js --env=prod`

## Model use for sub-agents

Sub-agents run on your own model unless you set `model` when you launch them. Choose on purpose:

| Work | Model | Why |
|---|---|---|
| **Orchestration** (you) | Opus | Sequencing, reviewing, gates |
| **WP0** (definitions, reconciling reference disagreements, choosing the model) | Opus | Judgment that sets accuracy for everything downstream |
| **WP1** (schema, migration, roll-up, `PATCH` semantics) | Opus | Data-integrity risk; edits to the huge shared `lib/cache-manager.js` |
| **WP2** (tagging pipeline, backfill, health job) | Opus | Correctness of voting, roll-up and exclusions; spends real money |
| **WP3, WP4** (components, grids, filters) | Sonnet | Well-specified by the mockup and plan |
| **WP5** (Ask AI, MCP, AI Insights) | Sonnet | Well-specified. Use Opus if the eval changes or the similar-applications scoring get tricky. |
| **WP6, WP7** (lists admin, label sweep, Sectors of Interest) | Sonnet | Mechanical once WP1 lands |
| **Codebase searches and file inventories** | Haiku or Sonnet | Only the conclusion comes back to you |

- **Review:** before any PR merges, review its diff yourself, or have a fresh Opus agent review it with `/code-review`. Pay particular attention to WP1, WP2 and anything touching production data paths.
- **Escalation:** if a Sonnet agent struggles, or its work fails review twice, finish that WP on Opus rather than iterating on it.

## Conventions

- **Worktrees:** one worktree, one branch and one PR per WP, created with `scripts/worktree-create.sh`. Run `scripts/worktree-ensure.sh` before anything that needs the environment, and start the worktree's own dev server (`scripts/worktree-dev.sh --background`) before handing off.
- **Protected paths:** never touch the root checkout's dev server on port 8080, and never push a worktree branch to main.
- **Tests:** focused tests are required for non-trivial logic. The Jest ignore patterns in worktrees are anchored; don't override `--testPathIgnorePatterns`. Database suites need `pnpm test:db`.
- **Frontend changes:** run `npx vite build` after them, because the worktree server doesn't watch.
- **Model IDs go only in `lib/ai-models.js`.** Add a `tagging` role there. Exact IDs:
  - OpenAI: `gpt-6-luna`, `gpt-5.6-luna`, `gpt-6-sol`
  - Anthropic: `claude-haiku-4-5`, `claude-sonnet-5`, `claude-opus-5-5`
  - The OpenAI key is `OPENAI_CATEGORIZATION_API_KEY` (via `lib/ai-api-keys.js`); Anthropic uses `ANTHROPIC_API_KEY`.
  - `@anthropic-ai/sdk` and `openai` are already dependencies.
- **Anthropic call notes:**
  - Use structured outputs via `output_config.format`.
  - Forced `tool_choice` returns a 400 on Opus 5.5, so don't use it.
  - Thinking can't be disabled on Opus 5.5: set `output_config.effort` explicitly (`high` for reference labelling, `low` for production candidates if quality holds).
  - Batch APIs from both vendors are half price. Use them for the reference set, candidate runs and the backfill.
- **Security:** any security gap found mid-task goes to its own agent, worktree and PR right away. Don't batch it into this work.

## `lib/taxonomy/seed.json` format (the WP0 ↔ WP1 contract)

```json
{
  "version": 1,
  "sectors": [
    { "name": "Energy Storage", "description": "…", "includes": "…",
      "excludes": [{ "see": "sector:Grid & Power", "note": "…" }], "synonyms": ["…"] }
  ],
  "families": {
    "technology": [
      { "id": "technology/energy-storage", "name": "Energy Storage", "description": "…", "includes": "…",
        "excludes": [{ "see": "technology/industrial/critical-minerals-mining", "note": "…" }],
        "synonyms": [], "children": [ { "id": "technology/energy-storage/battery-materials", "…": "…",
          "children": [ { "id": "technology/energy-storage/battery-materials/silicon-anodes", "…": "…" } ] } ] }
    ],
    "market": [ { "id": "market/government-municipalities", "name": "Government & municipalities", "…": "…" } ],
    "business_type": [ { "id": "business_type/hardware", "name": "Hardware", "…": "…" } ],
    "built_with": [ { "id": "built_with/ai-machine-learning", "name": "AI / machine learning", "…": "…" } ]
  }
}
```

- **IDs** are `family/slug-path` and never change. A rename changes `name` only, and a retired tag becomes `active: false`.
- **Sector order and definitions:** `plan.md` → Appendix.
- **The starting Tags list:** the `TECH` / `FLAT` constants in `mockup.html` (keys `business` → `business_type`, `enabling` → `built_with`).

## Done criteria per WP

A WP isn't done until its PR has focused tests, the worktree server is running with the change visible (UI) or the endpoint exercised (server), and `implementation-status.md` is updated.

- **WP0**
  - `seed.json`, with a definition for every Sector and tag. The three boundary pairs are settled in the includes/excludes.
  - Reference set of about 200 applications:
    - sample: `applications.date_added >= '2024-09-19'`, submitted, non-draft
    - stratified by Sector, boundary cases, and summary vs form-only
    - stored in the repo as application IDs plus labels only, with no applicant text
  - Eval harness (following `lib/insights/evals`), runnable locally and repeatable.
  - Candidate results (the 4 candidates × 3 runs) and the union vs 2-of-3 comparison.
  - `wp0-results.md` in this folder. It records the chosen model, reasoning effort and tag rule, the metrics against the bars in `plan.md`, notable definition changes, and actual spend.
- **WP1**
  - Dev migration applied (expand phase only; nothing dropped).
  - The same SQL ready for production, not run.
  - Seed loader.
  - Cache-manager read/write.
  - Row fields: `sector`, `tags`, `tag_ids_expanded`, `tag_search_text`.
  - `GET /api/taxonomy`.
  - `PATCH` semantics, including exclusions.
  - Saved-view field-key rewrite, with a dry-run listing affected views.
  - Merge lists and write contracts.
  - Tests for the roll-up, exclusions and expansion.
- **WP2**
  - Classification end to end on dev for new submissions (with and without a pitch deck) and for re-applications (additive).
  - Backfill script with dry-run and batch mode, tested on a small dev sample.
  - Monthly job and page, with the Slack post verified in test mode (`SLACK_TEST_MODE`).
  - `ai-categorizer.js` removed and its callers updated.
- **WP3**
  - Pills, popover and tag picker match the mockup, including search across levels, parent selects branch, and keyboard.
  - Company header and edit mode, portfolio header.
  - Applicant dashboard no longer shows or edits Sector and Tags; the API fields are removed.
- **WP4**
  - Every filter and column listed in `plan.md` → Filtering and search works with parent-selects-descendants.
  - Explore URL params `?sector=` and `?tag=` work.
  - Metrics "By Sector" and its XLSX work.
- **WP5**
  - Ask AI: sector and tag filters work, including tag descendants; evals and suggested questions updated and passing.
  - AI Insights similar-applications scoring, with the prompt file updated (the production write waits for approval).
  - MCP docs, contracts and the member view updated.
- **WP6**
  - Lists admin edits Sectors and the tag tree: add, rename, move, synonyms, deactivate, merge. Each edit bumps the taxonomy version.
- **WP7**
  - No user-facing "Category" left, except the contexts listed under Leave alone in the plan.
  - Sectors of Interest reads the Sector list in all three places; the remap script is ready with a dry-run count.
  - Embed returns `sector` / `tags` alongside the old keys.
  - The `~/dev/e8angels-com` change is prepared on a branch there, not pushed.
- **Rollout:** the sequence in `plan.md`. Report after each step.
- **WP8:** drops and removals only after Jordan confirms a week of clean production running.

## Reporting

- Keep `implementation-status.md` current: status per WP, PR links, worktree URLs, blockers and follow-ups.
- Commit and push it to this folder in the mockups repo with the `publish-feature-plan` flow, committing only this folder.
- Report to Jordan when WP0's results are ready, when WP1 merges, when everything through WP7 is merged, and at every approval gate.
- Otherwise keep going without check-ins. Blockers and gates are the exception.
