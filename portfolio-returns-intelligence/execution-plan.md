# Execution Plan — Portfolio Returns Intelligence

Companion to [plan.md](plan.md). This is the orchestration tracker: what gets built, in
what order, by which model tier, with what verification, and where deferred work is
registered. The orchestrator (main session) updates task statuses **immediately** on
completion per AGENTS.md checklist discipline; this file is the source of truth for
"what's been done and what hasn't."

Legend: ⬜ not started · 🚧 in progress · ✅ done (verified) · ❌ blocked (reason noted) ·
⏸ gated (needs explicit user approval)

---

## Ground rules (bind every subagent)

### Model assignment

Per AGENTS.md §Claude Subagent Model Selection: **opus** for anything touching schema,
money arithmetic, auth/tokens, communications, dates, or judgment; **sonnet** for
implementation against a fully-specified pattern, tests against a clear spec, and UI built
from the mockup; **haiku** never used in this feature (every surface is
correctness-sensitive or user-facing). When uncertain, escalate.

### Deferred-work protocol (mandatory, verified by orchestrator)

Lesser models tend to defer work and then report the task complete. Countermeasures,
enforced on every task:

1. **Marker**: any deferred, stubbed, partial, or follow-up item MUST carry a code
   comment `TODO(pri): <what is missing> [D-<n>]` at the exact site. `pri` =
   portfolio-returns-intelligence. No other TODO spelling counts as registered.
2. **Register**: the same item MUST be added to the Deferred Work Register at the bottom
   of this file with an ID (D-1, D-2, …), location, what's missing, and which task will
   absorb it. A marker without a register row (or vice versa) is a defect.
3. **Sweep**: a task is not ✅ until the orchestrator runs
   `grep -rn "TODO(pri)" lib/ routes/ src/ scripts/ __tests__/` and confirms every hit
   maps to a register row. Phase completion requires a full sweep with zero unregistered
   hits.
4. **Subagent contract**: every subagent prompt includes: "If you defer ANY part of this
   task, mark it `TODO(pri): … [D-x]` in code and say so explicitly in your final report.
   Reporting 'done' while silently deferring work is the single worst failure mode.
   Deferring with a marker and a report is acceptable; hiding it is not."
5. AGENTS.md **No Stubs or Dead Wiring** still applies: deferral is for genuinely
   out-of-scope follow-ups, not for skipping the task's own acceptance criteria.

### Verification gates (every task)

- Tests added/updated and **run** in the same task (unit for logic, route tests for
  endpoints) — per AGENTS.md Test-First Completion Rule.
- UI tasks: browser smoke test via `pnpm run smoke:auth` against the worktree server;
  Design Guide compliance checklist in the task report.
- Subagent reports state what changed, what was verified, and anything unresolved.
- Orchestrator reviews the diff before marking ✅ — especially for sonnet-tier tasks.

### Git / DB rules

- All work in the `claude/nice-carson-82d98f` worktree branch → **one PR** to main;
  commit after each completed task (concise, present-tense).
- Dev DB changes: allowed as needed. **Prod DB: never without explicit user approval** —
  those steps are marked ⏸ and listed with exact SQL before asking.
- No schema mutation in app startup code, ever. `createTables()` updated for
  new-environment setup only.

---

## Phase 1 — Schema + governed agent surface

Exit criterion: **the "10 emails" scenario works end to end from an external agent**
against dev — sources ingested verbatim, claims proposed/validated, auto-accept routing
correct, company-level claims held for review, everything audited.

| ID | Task | Model | Depends on | Verification | Status |
|----|------|-------|-----------|--------------|--------|
| 1.1 | Apply schema to **dev** DB (plan.md §8 SQL: 6 new tables + ALTERs on marks/valuation_events/deployments); update `createTables()`; update `docs/database-schema.md` (new tables + the 4 documented drift fixes) | opus | — | `PRAGMA table_info` diff vs plan SQL; app boots; existing valuation tests still pass | ✅ e0d4b164 |
| 1.2 | `lib/cache-manager/portfolio-returns.js`: service methods — create/list sources (dedup on gmail_message_id), create/list claims, claim transitions (accept/reject/clarify/supersede), create/list `investor_return_events`, backfill script for the 9 legacy `record_type='return'` rows (dev) | opus | 1.1 | unit tests per method incl. dedup, supersede chains, CHECK-violation rejections | ✅ 82930891 |
| 1.3 | Materialization + routing: deterministic auto-accept rules (member-attested self-scoped → auto-accept; else pending), accept→materialize into `investor_return_events` / existing `createValuationEvent`+`applyValuationEvent` / member-private marks; stock-consideration → rollover deployment + instrument minting (`record_type='rollover'`, `origin_return_event_id`) | opus | 1.2 | unit tests: routing matrix (basis × claim_type × who), EnerG2→Group14 fixture end to end, rollover excluded from cash-in sums | ✅ 1a38f2cf |
| 1.4 | Governed agent surface in `routes/data-query.js`: `POST /portfolio/preview` + `/portfolio/execute`, `requirePortfolioWriteToken` policy, action registry (`ingest_source`, `propose_claims`, `accept_claim`, `reject_claim`, `request_clarification`, `record_return_event`, `record_valuation_event`, `send_confirm_requests` stub-free or explicitly deferred to 2.3 with D-row), `portfolio_data_query_mutations` log; entity-resolution validation with candidate return | opus | 1.2, 1.3 | route tests: token gating, confirmed:true required, invalid enums rejected, preview shows routing, audit rows written | ✅ a5e50f79 |
| 1.5 | Schema legibility docs: `docs/data-query-glossary.md` entries (claims vs return events vs marks, tiers, auto-accept rule, gotchas: date precision = first-of-period, rollover ≠ cash-in, Decarbon8 exclusion) + `docs/ai-relationship-registry.*` (soft-FK paths, JSON shapes, member-private safety boundaries, "estimates are not facts" annotations) | sonnet (content fully specified in plan §6.3) | 1.1 | orchestrator review against plan §6.3 checklist | ✅ c171a3e5 |
| 1.6 | data-query skill portfolio module (ingest recipes per plan §6.2: verbatim-first, ranges-not-points, candidates-not-guesses, surface company-level claims in-conversation) — authored as `docs/data-query-skill-portfolio-module.md` (the live skill is the external `E8Angels/data-query-skill` repo; see D-5) | opus (defines agent write behavior) | 1.4, 1.5 | dry-run transcript: skill instructions produce correct action sequences for 3 sample emails | ✅ abf1db37 |
| 1.7 | End-to-end dev rehearsal of the "10 emails" scenario: scripted client simulating agent calls with 10 realistic email fixtures (incl. 1 ambiguous company, 1 no-amount, 3 duplicate company-level exit) | sonnet (fixtures + script) then opus review | 1.4 | all fixtures land correctly; duplicates dedup; ambiguity → candidates; audit complete | ✅ 2dda9ba1 |
| 1.8 | **Prod migration** — approved 2026-07-02 and applied: 7 tables + 11 additive columns (incl. `portfolio_confirm_requests` and the `realized_only` CHECK); legacy-returns backfill (9 rows, $47,644.66) | opus | 1.7 + user approval | prod PRAGMA ≡ dev per table; idempotency re-run clean; zero existing rows touched; full command record in task report | ✅ applied to prod |

## Phase 2 — Member confirm loop

| ID | Task | Model | Depends on | Verification | Status |
|----|------|-------|-----------|--------------|--------|
| 2.1 | `POST /api/portfolio/intake/parse`: in-app extraction via `AIHelper.createLoggedChatCompletion` (`json_object`, schema-in-prompt per `email-to-dealum-processor.js` conventions), session-user identity, directory fuzzy company resolution with candidates | opus | 1.4 | unit tests with recorded fixtures; malformed-JSON repair path; no dollar figures invented (fixture asserts) | ✅ 162aaef3 |
| 2.2 | Member "Tell us what happened" UI: free-text box on portfolio page + per-company row, "Here's what we understood" editable claim cards, confirm → claims `basis='attested'` (mockup "Report an outcome" view is the spec) | sonnet | 2.1 | smoke:auth flow: type → parse → edit → confirm → claim rows exist; Design Guide checklist | ✅ a8b2b7e5 |
| 2.3 | Confirm-link emails: tokenized link → confirm UI preloaded with pending claims; confirmation upgrades basis + triggers auto-accept; `send_confirm_requests` action wired | opus (communications + tokens) | 2.2 | route tests: token scope/expiry, idempotent send, EMAIL_TEST_MODE respected | ✅ c2aec3df (+5a3c9b61 test repoint; adds `portfolio_confirm_requests` table — rides the 1.8 prod migration) |
| 2.4 | Admin "Portfolio Intake" review queue: list pending/needs-clarification claims (source quote, proposer incl. agent token, candidates, confidence), accept-with-repair / reject-with-note / request-clarification; impact preview for company-level accepts (reuse valuation preview primitives) | sonnet (pattern = `ValuationAdminPanel.jsx`) | 1.4 | smoke:auth: queue renders, each action round-trips; permission-gated `admin.portfolio.view` | ✅ 0eed7825 |
| 2.5 | Record Portfolio Update wizard exit branch writes `investor_return_events` (per-member proceeds section, ranges + date precision) | opus (extends valuation flows) | 1.3 | regression tests for exit flow; wizard plan's open question resolved in its plan.md | ✅ c4010fb8 |
| 2.6 | Member-visible "update pending verification" hint on positions with pending company-level claims (existence only) | sonnet | 2.4 | smoke test; no claim contents/reporter leaked (test asserts payload) | ✅ 9b9bb5c1 |

## Phase 3 — Estimation engine

| ID | Task | Model | Depends on | Verification | Status |
|----|------|-------|-----------|--------------|--------|
| 3.1 | `lib/portfolio-estimation/`: pure waterfall (plan §4 tiers 1–7), band math from assumption set, realized/unrealized split, `inputs_json` provenance, `engine_version` | opus | 1.3 | unit tests per tier + tier-selection matrix + band monotonicity (higher tier ⊆ wider band never violated) | ✅ 71439e63 (D-6 noted) |
| 3.2 | Seed default `estimation_assumption_sets` row; cohort priors computed from E8 resolved history (script, dev) | opus | 3.1 | prior computation reproducible; documented in assumptions_json | ✅ 52a5cf61 (dev seed eas_3d90df29b852607d; prod --seed pending 1.8/deploy) |
| 3.3 | Annual Fund LP inclusion in member scope (via `fund_investors`, `funds.family='annual'`, pro-rated through fund deployments); Decarbon8 excluded | opus (fund semantics) | 3.1 | unit tests: member with direct + AF + D8 positions → D8 absent, AF pro-rata correct | ✅ a8690255 (Economic Percentage convention; fund_distributions company-attributable) |
| 3.4 | Live now-view API (SWR-cached member/org estimates) + quarterly snapshot runner writing `position_estimate_snapshots`; `run_estimates` action for the skill | opus | 3.1–3.3 | route tests; snapshot idempotency per (run, as_of, assumption set); SWR tags correct | ✅ 36088517 (closes D-4; opens D-7) |
| 3.5 | Retire `getMemberPortfolioSnapshot` beta path in favor of engine (keep API shape or migrate callers) | sonnet (prescribed swap) | 3.4 | existing member-profile tests pass; no dead code left | ✅ be601ca7 (+bf39a391: LP-row dates fixed same-day, D-9 opened and closed inline) |
| 3.6 | Skill question/report recipes (member statement, org summary, vintage cohorts, data-health worklist — trust rules baked in) | sonnet | 3.4 | dry-run transcripts for the 4 canonical questions reviewed by orchestrator | ✅ 1841d5d4 (also fixed a wrong-join SQL bug in an earlier doc recipe) |

## Phase 4 — Representation (deliberately deferred)

Member statement GA (confidence UI, coverage bar, provenance popovers) and org views are
**not scheduled** until Phases 1–3 have produced real data and on-demand reports have
taught us what the surfaces should be. Tracked here so it isn't lost: **D-0** in the
register below.

---

## Phase 5 — Unify recording: wizard becomes the structured mode of the claims system

Owner decision (2026-07-04): close the capability gaps, then consolidate — one process, one
database trail. Architecture: claims gain a verbatim `event_payload` passthrough to the
existing engine; the wizard's structured forms become the "Enter details" mode of a single
Record Portfolio Update dialog; admin structured entries auto-apply (one-step UX preserved)
while writing full source→claim→event provenance. NOTHING is retired until the parity gate
(5.6) passes. Cramdown stays in its separate dialog (out of scope — neither system does it).

| ID | Task | Model | Depends on | Verification | Status |
|----|------|-------|-----------|--------------|--------|
| 5.1 | Schema: rebuild `portfolio_claims` (dev) — add `event_payload TEXT` (JSON, nullable) + claim_type values `conversion`, `valuation_update` (company-level) to the CHECK; copy 69 dev rows; createTables() + schema docs + glossary/registry updates; plan §8.2 SQL amended (prod table is EMPTY — rebuild is free, but still gated) | opus | — | PRAGMA + row-copy verified; docs updated | ✅ 41bf8136 (opens D-11) |
| 5.2 | Materialization passthrough: `applyPortfolioClaim` uses `claim.event_payload` verbatim for company-level claims when present (financing_round/exit/shutdown + new conversion/valuation_update mappings), else today's thin synthesis; accept-preview uses `previewValuationEventImpact` with the rich payload; new deterministic auto-apply rule: company-level claim WITH event_payload created via the admin structured endpoint by an `admin.portfolio.view` holder applies immediately with that actor (server-enforced) | opus | 5.1 | unit tests: payload passthrough per event type ≡ direct engine call; auto-apply rule matrix | ✅ 7ccf40ea (+84851eaa beta-gate mock fix); closes D-11 |
| 5.3 | Unified dialog: refit `ValuationEventWizardDialog` branches (financing/exit incl. proceeds table/shutdown/conversion/manual) as the "Enter details" mode of the Record Portfolio Update dialog alongside "Describe it" (free-text); live impact preview before save; posts admin structured claims (5.2); ALL 6 admin mounts open the unified dialog | opus | 5.2 | smoke every branch from both /admin/companies and /admin/annual-fund mounts; DG checklist | ✅ 55d980af (shared form w/ transport prop — parity-gate ready) |
| 5.4 | Member mount (#7 InvestmentsFormIsland "Adjust Valuation") switches to the member claims flow (member-private semantics preserved; holding_value / structured member-private events; promote pipeline untouched) | opus | 5.2 | member-private parity tests; smoke | ✅ 1629eda8 (wizard zero mounts; promote pipeline verified on claims-born events) |
| 5.5 | Agent parity: `record_valuation_event` data-query action goes claims-backed with optional rich `event_payload`; skill instructions doc updated | opus | 5.2 | route tests; payload-key verification vs code | ✅ b85fbfcf |
| 5.6 | **Parity gate + retire**: golden tests run each legacy wizard scenario through BOTH paths asserting equivalent marks/portfolio_events/valuation_events; THEN remove the old direct-post wiring from the UI (admin route retained for repair/reapply/promote machinery); full battery + e2e | opus | 5.3–5.5 | golden parity suite green; sweep; battery | ⬜ |
| 5.7 | Prod migration (claims rebuild — table empty) + deploy-time notes; committee guide touch-up for the unified dialog | opus | 5.6 + **user approval** | PRAGMA prod ≡ dev; guide rebuilt | ⏸ |

## Deferred Work Register

Every `TODO(pri): … [D-n]` in code maps to a row here. Rows are removed only when the
work ships (with the commit noted) — never silently.

| ID | Location | What's deferred | Absorbed by | Status |
|----|----------|-----------------|-------------|--------|
| D-0 | (no code marker — plan-level) | Member statement GA + org dashboards | Phase 4, scheduled after Phase 3 review | open |
| D-1 | (plan-level) | Automated standing inbound-email pipeline (Apps-Script/Mailgun → intake); Cowork covers batch email intake first | Revisit after Phase 2 | open |
| D-3 | ~~routes/data-query.js:64; routes/companies-admin.js:1366~~ | `send_confirm_requests` action + clarification-request email | Task 2.3 | **shipped c2aec3df** — both markers removed |
| D-4 | ~~routes/data-query.js:65~~ | `run_estimates` action | Task 3.4 | **shipped 36088517** — marker removed |
| D-7 | ~~lib/cache-manager/portfolio-returns.js:2191~~ | Snapshots omit purely-realized positions | Fixed pre-1.8: `realized_only` added to the CHECK (dev rebuilt; plan §8.8 SQL amended) | **shipped 801002a3** |
| D-8 | (plan-level — design question) | The estimation loader seeds positions from deployments only; a position with return events but NO deployment rows (e.g. legacy data gaps) never enters the live compute. Decide whether to seed positions from return events too. | Phase 4 / data-quality review | open |
| D-11 | ~~lib/cache-manager/portfolio-returns.js:1160~~ | event_payload passthrough | Task 5.2 | **shipped 7ccf40ea** — marker removed |
| D-10 | (plan-level — data quality) | Prod cohort-prior seed deliberately HELD: prod's 17 historical exits have no exit marks, so E8-only priors compute degenerate (85 write-offs, 0 exits → imputed {0,0,0}). Engine's neutral code defaults apply meanwhile. Unblock by backfilling exit marks/multiples for historical exits (pairs with the data-health worklist), then run `compute-portfolio-cohort-priors.js --env=prod --seed`. Also add an all-write-offs guard to the script's imputed prior. | Post-deploy data-quality pass | open |
| D-5 | docs/data-query-skill-portfolio-module.md | Skill-repo merge SUPERSEDED by the served-instructions refactor (skill repo main is now a bootstrap fetching `GET /api/data-query/instructions`; the portfolio module is already merged byte-identical into `docs/data-query-skill-instructions.md` on e8-portal branch `worktree-fold-development-into-contracts`). Remaining: merge+deploy that branch's /instructions endpoint, then rebuild/distribute the skill zip — owner decision (branch is other-session WIP). | Owner decision | superseded/blocked |
| D-6 | lib/portfolio-estimation/load-facts.js:272 | Thread claim attestation onto member-private marks so attested holding values get the tighter `reported_actual` band (currently conservative wider `reported` band) | Phase 3 polish or Phase 4 | open |
| D-2 | (plan-level) | Attachment/document parsing (closing statements, K-1s) in intake | Revisit after Phase 2 | open |

## Progress log

| Date | Event |
|------|-------|
| 2026-07-01 | Plan v2 published; execution plan drafted. No implementation started. |
| 2026-07-02 | Phase 1 complete (1.1–1.7 ✅; 1.8 gated). "10 emails" rehearsal green end to end on dev. Found+flagged pre-existing cache-rebuild race (separate task). |
| 2026-07-02 | Phase 2 complete (2.1–2.6 ✅). D-3 shipped (confirm-link flow; adds `portfolio_confirm_requests` — rides 1.8). Companion wizard plan's proceeds question answered. Only D-4 marker remains in code. |
| 2026-07-02 | Review follow-through per owner: finding #2 resolved as a per-tranche tier-4 split (f2adda13 — mark multiple applies to pre-mark basis only; post-mark tranches at cost band; plan §4 updated); dedup cleanup (e0e6df18). Prod pre-deploy done: permission rows seeded+verified on prod; DATA_QUERY_PORTFOLIO_WRITE_TOKEN_IDS=skill-v1 staged on Fly; cohort-prior seed HELD (D-10 — prod exits lack exit marks, priors degenerate; engine code defaults apply). Remaining manual step: owner merges + deploys; orchestrator handles post-deploy verification + D-5 skill merge. |
| 2026-07-02 | Branch code review (8 finder angles + adversarial verify): 8 findings confirmed, 2 refuted. Mechanical fixes applied in dc5880c5 + ff266ca5 (MOIC null display, valuation-event read-back fields, org-compute ~63% faster with parity proof, SQL centralization, shared money module, env.template, inline-style/comment conventions). Finding #2 (multi-tranche stale-mark semantics: first- vs last-investment-date gate, predicates.js:77) left for owner sign-off. |
| 2026-07-02 | **Prod migration applied** (1.8 ✅): 7 tables + 11 columns, PRAGMA ≡ dev, idempotent, legacy backfill 9 rows/$47,644.66, zero existing rows touched. Portfolio (Beta) gated behind console-managed `member.portfolio.returns-beta` (55ce639d; seeded to PortfolioCommittee on dev; prod seed rides deploy). Admin portfolio tab verified already fully console-managed. Committee guide doc delivered (~/Desktop/E8-Portfolio-Returns-Guide.docx). PR #410 up to date, unmerged per owner. |
| 2026-07-02 | Phase 3 complete (3.1–3.6 ✅). D-4 and D-7 shipped; D-9 opened+closed same day; D-6 (attested-mark band tightening) and D-8 (returns-without-deployments positions) remain open. Full battery 256/256 (one intermittent cross-suite failure traced to the pre-existing cache-rebuild race — separate task chip filed). Draft PR #410 carries Phases 1–3. Remaining: 1.8 prod migration (⏸ user approval, now incl. `portfolio_confirm_requests` + `realized_only` CHECK), prod cohort-prior seed, D-5 external skill merge post-deploy. Phase 4 deliberately unscheduled per plan §9. |
| 2026-07-01 | Task 1.7 done (2dda9ba1): `__tests__/e2e/portfolio-ten-emails-rehearsal.test.js` rehearses the full "10 emails" scenario end to end against dev (real CacheManager + real routes/data-query.js portfolio surface via supertest). All (a)-(g) assertions pass; 4 portfolio suites (60 pre-existing + 7 new = 67) green together. Found and worked around a real cache-manager defect: the cold-start snapshot-hydrate path fires an unawaited background full-cache-rebuild that can silently discard fixture rows patched moments earlier (intermittent ~1-in-6-8 flake) — not filed as a TODO(pri) since it's fully worked around in the test, not deferred; worth a follow-up hardening pass in lib/cache-manager.js / lib/cache-manager/people-identity.js if other tests hit the same pattern. |
| 2026-07-02 | Task 2.4 done: Admin "Portfolio Intake" review queue shipped as a sibling tab beside `ValuationAdminPanel` in `CompaniesAdminIsland.jsx` (`?tab=portfolio-intake`). New routes in `routes/companies-admin.js`: `GET /api/admin/portfolio/claims/review-queue`, `GET /:claimId`, `POST /:claimId/repair`, `GET /:claimId/accept-preview`, `POST /:claimId/accept`, `POST /:claimId/reject`, `POST /:claimId/request-clarification` — all guarded by `admin.portfolio.view`, mirroring the valuation review-queue route conventions exactly. New island `src/islands/shared/PortfolioIntakeAdminPanel.jsx` (table, accept/edit/reject/clarify dialogs, generic REPAIR_FIELD_CONFIG repair form, single-flight guards). `request-clarification` only transitions claim status — the outbound email is D-3 (unchanged, already registered), marked with `TODO(pri): ... [D-3]` at the route. 15 new route tests in `__tests__/routes/portfolio-claims-admin.test.js` (permission gating, enrichment fields, repair whitelist, accept-preview positions count, accept applies + returns applied id, reject/clarify require note, clarify does not send email) — all pass against dev DB with real CacheManager. Updated a source-inspection test (`__tests__/src/companies-admin-routes.test.js`) for the new TABS entry. Browser-smoked via `pnpm run smoke:auth` + a puppeteer debug harness against the worktree server (auth via `E8_SMOKE_AUTH_SESSION`): queue renders fixture rows, Accept/Edit/Reject/Ask-to-clarify dialogs all open and function, a real accept round-tripped to an `investor_return_events` row and removed the claim from the queue; all fixtures cleaned up after. |
