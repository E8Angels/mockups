---
title: "Portfolio Returns Intelligence"
status: draft
owner: jordan
created: 2026-07-01
last_updated: 2026-07-01
home: mockup
---

# Portfolio Returns Intelligence

Holistic tracking of what E8 members' investments are actually worth — built on four
principles: **facts are separated from estimates**, **every number carries its method,
confidence, and range**, **AI is the interface** (members and admins describe what
happened in plain language; deterministic code does the arithmetic), and **the schema is
built to be operated by agents** — the admin experience is asking Claude, not managing
tables.

Priority order for this feature (per owner decision): (1) getting data in, (2) a schema
robust enough to hold uneven, imperfect knowledge honestly, (3) representation —
dashboards and statements iterate later, once there is data, and on-demand agent-produced
reports carry reporting in the meantime.

## 1. Why

E8 members invest directly. The organization often doesn't learn outcomes firsthand:
sometimes a member reports exact proceeds, sometimes we get a Pitchbook article about an
exit with no per-investor terms, sometimes we know only that a company died, and for many
positions we know nothing beyond the original check. Today the portal can only represent
the rich end of that spectrum (a mark with a point multiple). Everything else is either
forced into false precision or left blank.

The goal state:

- Data gets in with near-zero friction: a member emails a paragraph; an admin tells
  Claude Cowork "I just received 10 emails from members describing their exit events —
  read them and do the right thing"; and structured, provenance-carrying records appear,
  with humans confirming rather than typing.
- Each member sees a personal portfolio statement — invested, realized, current value —
  where every number is honest about what it is: a reported fact, a derived allocation, or
  a bounded estimate.
- E8 can speak credibly about member returns as a group and over time, with a coverage
  statement instead of an asterisk — produced on demand by asking Claude, not by
  maintaining dashboards.

## 2. Current state (verified against prod, 2026-07-01)

### What already exists and is good

The valuation backbone is genuinely strong and this design **extends it rather than
replacing it**:

- `valuation_events` is an immutable, canonical event log (`financing_round`,
  `manual_adjustment`, `conversion`, `exit`, `shutdown`, `other`) with provenance
  (`methodology_note`, `source_reference`, `created_by_*`), scope (`global` /
  `member_private`), and a lifecycle (`applied` / `needs_repair` / `superseded` with
  `superseded_by_event_id`). Derived artifacts are rebuilt idempotently from it.
- `marks` are instrument-level derived valuations with `mark_method`
  (`last_round`/`internal`/`write_down`/`write_off`/`exit`/`other`), scope, and
  `source_event_id` back-pointers. `applyValuationEvent()` (lib/cache-manager.js) is the
  single deterministic write path from event → marks, with automatic `needs_repair`
  flagging when inputs are missing.
- Member-level cost basis already exists: `deployments.person_record_id` is populated on
  1,540 of 1,586 rows — 233 distinct people, 188 companies, $76.3M deployed since 2006.
  Every deployment links to exactly one instrument.
- A member-private submission + admin review pipeline already works end to end: members
  submit `member_private` valuation events; admins promote-to-global / reject / repair via
  the review queue in `routes/companies-admin.js` + `ValuationAdminPanel.jsx`.
- **A governed agent write surface already exists and is proven**: `routes/data-query.js`
  serves the external Claude data-query skill with bearer-token auth, per-token policies,
  `GET /schema` + `GET /glossary` for self-orientation, read-only SQL with a guard, and —
  for Development CRM — a **preview → execute mutation flow** (`POST /development/preview`,
  `POST /development/execute` with `confirmed:true`), an action-type registry that maps to
  cache-manager service methods (never raw SQL), and a full mutation audit trail
  (`development_data_query_mutations`, `data_query_audit`). This is the exact mechanism
  the portfolio intake surface extends.
- `getMemberPortfolioSnapshot()` (lib/cache-manager/people-identity.js) already computes a
  per-member statement with a small precedence rule (member-private mark > global mark >
  cost fallback) and MOIC/IRR. It is beta-gated to admins.
- Reusable AI plumbing: inbound-email ingestion with async AI extraction
  (`routes/email-ingest.js`, `lib/email-to-dealum-processor.js`), the `AIHelper` logged
  LLM wrapper with `json_object` structured output, and the survey runtime + recurring
  email audience providers for outreach.
- A companion plan (`portfolio-event-recording-wizard/`) already proposes the
  plain-language **admin** recording flow. That wizard becomes one intake channel among
  several; this plan is the superset.

### Where the data actually is (prod profile)

| Area | Reality |
|---|---|
| Deployments | 1,586 rows, $76.3M, 233 people, 188 companies, 2006–2026 |
| Instruments | 693 across 360 companies (EQUITY 384, NOTE 153, SAFE 135); ~2× more companies than deployments cover |
| Marks | 574, but only **107 of 188** portfolio companies have any mark; 95 marks are 0 (write-offs); median multiple 1.0 |
| Valuation events | ~157 total for 20 years of portfolio; only 10 are `member_private` |
| Realized proceeds | `deployments.record_type='return'`: **9 rows, $47.6k total** — essentially unused |
| `fund_distributions` / `fund_distribution_allocations` | **0 rows** — empty in prod |
| Company lifecycle | Of 188 portfolio companies: 122 active, 44 closed, 17 exited (derived from valuation_events) |

Conclusion: cost basis is rich; company-level valuation is half-covered; **member-level
realized outcomes are almost entirely missing** and have no adequate home. That is the
core data gap this feature fills — and why intake friction is the binding constraint.

## 3. Architecture: three layers

```
┌───────────────────────────────────────────────────────────────────────┐
│ LAYER 0 — SOURCES (immutable, verbatim)                               │
│ portfolio_intake_sources: email bodies, web free-text, admin pastes,  │
│ agent-submitted documents. Never edited, never deleted.               │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ AI (in-app pipeline OR external agent)
                               │ proposes; never commits
┌──────────────────────────────▼────────────────────────────────────────┐
│ LAYER 1 — FACTS / CLAIMS (structured observations)                    │
│ portfolio_claims: "member M received ~$80k of Group14 stock for the   │
│ EnerG2 note, 2021". Carries who-said-it, verbatim quote, range, date  │
│ precision, status (pending_review → accepted/rejected/superseded).    │
│ Accepted claims materialize into the canonical fact stores:           │
│   • valuation_events (company-level, EXISTING)                        │
│   • investor_return_events (member-level realized, NEW)               │
│   • marks with scope=member_private (member-reported holding values)  │
│ Facts supersede; they never overwrite.                                │
└──────────────────────────────┬────────────────────────────────────────┘
                               │ deterministic estimation engine
┌──────────────────────────────▼────────────────────────────────────────┐
│ LAYER 2 — ESTIMATES (derived, rebuildable, versioned)                 │
│ Per (investor, company) position: the waterfall picks the best method │
│ the facts support, computes low/expected/high, and records exactly    │
│ which facts and assumptions it used. Live "how am I doing right now"  │
│ via SWR; position_estimate_snapshots for quarterly statements of      │
│ record.                                                               │
└───────────────────────────────────────────────────────────────────────┘
```

Rules that make it trustworthy — and safe to hand to agents:

1. **AI proposes, deterministic code computes.** Models (in-app or Cowork) extract,
   classify, resolve entities, and select — they never invent a dollar figure that isn't
   in the source, and per-tier arithmetic is reproducible JS, unit-tested, versioned
   (`engine_version`).
2. **Agents write claims, never canonical stores.** The only write path an agent has is
   the governed action registry (§6): submit sources, propose claims, and invoke the same
   accept/reject actions an admin would — each server-validated, previewed, audited.
   There is no raw-SQL write path. "Do the right thing" is safe by construction because
   the blast radius of any agent action is a reviewable claim, not a mutated fact.
3. **Facts are immutable.** A better fact supersedes an old one (same `superseded_by`
   pattern `valuation_events` already uses). Estimates are cache: safe to delete and
   rebuild from facts at any time.
4. **Every value is a range with a method.** `low / expected / high` plus a
   `confidence_tier`, everywhere — storage, API, and UI.
5. **Nothing ambiguous is committed silently.** Extraction below the confidence bar, or
   with unresolved entities, lands in the review queue (or comes back to the agent
   conversation as a question), not in the fact stores.

## 4. Confidence tiers and the estimation waterfall

For each (investor, company) position, the engine walks tiers top-down and uses the first
one the available facts support. Higher tier = tighter band. All band parameters live in a
named **assumption set** (not hardcoded), so sensitivity analysis is just "run with a
different set".

| # | Tier | When it applies | Expected value | Default band (assumption-set params) |
|---|------|-----------------|----------------|--------------------------------------|
| 1 | `reported_actual` | Member attested/reported their own proceeds or current holding value | The reported figure | Reporter's own range, else ±0–10% by basis (`attested` tightest) |
| 2 | `derived_allocation` | Ownership (shares/%) + exit terms both known | shares × per-share consideration | ±10% |
| 3 | `exit_prorata` | Company exit multiple known, member terms unknown | member basis × company exit multiple | low 0.6×E … high 1.1×E (dilution + preference haircut) |
| 4 | `last_round_mark` | Existing mark from a financing round / internal mark | pre-mark basis × mark multiple + post-mark basis × 1.0 (basis deployed after the mark is valued at cost) | pre-mark component widens with mark age (<12mo ±20%; 1–3y 0.5–1.2×E; >3y 0.25–1.2×E); post-mark component takes the cost_basis band |
| 5 | `cost_basis` | No mark usable (already today's "cost fallback") | basis × 1.0 | 0.25×–1.5× basis, widening with position age |
| 6 | `status_prior` | Company known dead → 0; known exited but zero terms info → cohort exit prior | 0, or cohort median exit MOIC | dead: 0–0.1× basis; exited-unknown: cohort P25–P75 |
| 7 | `cohort_imputed` | Nothing known at all (no mark, no status, stale) | cohort median MOIC by vintage/stage | cohort P10–P90 — the honest "we don't know" band |

Notes:

- **Realized vs unrealized are computed separately** and each carries its own tier.
  Realized comes from `investor_return_events` (tier = the event's `confidence_tier`);
  unrealized from the waterfall above. Expected-but-unpaid amounts (escrows, holdbacks)
  are represented as the low/expected/high range on the original return event — no
  separate receivable state (decided).
- Tier 3's haircut is deliberate finance realism: a company-level exit multiple applied
  pro-rata ignores intermediate dilution and liquidation preferences, which almost always
  cut the common/early-note holder's share — hence an asymmetric band centered below 1.0×
  of the naive number.
- Tier 4 inherits `applyValuationEvent()`'s existing arithmetic unchanged; the new part is
  the age-based band and the explicit tier label. Per-tranche split: the mark multiple is
  applied only to basis invested on or before the mark's effective date; basis deployed
  after the mark is valued at cost (×1.0), so `expected = preMarkBasis × multiple +
  postMarkBasis`, the pre-mark component takes the staleness band and the post-mark
  component takes the cost_basis band, and the two are summed (a later top-up neither loses
  the mark nor inherits a multiple set before that capital existed).
- Tier 6/7 cohort priors are computed from **E8's own resolved history only** (the 62
  exited/written-off instruments and their marks; decided — revisit blending external
  benchmarks when resolved-n grows). They're stored in the assumption set so they're
  inspectable, not magic.
- **Scope of a member's statement (decided):** direct checks plus the member's Annual
  Fund LP positions (via `fund_investors`, `funds.family='annual'`, pro-rated through the
  fund's deployments). Decarbon8 is a different kind of vehicle and is excluded from the
  personal statement.
- Waterfall selection, inputs, and parameters are recorded per position in
  `inputs_json` — every number can answer "why do you think that?"

## 5. Getting data in: AI as the interface

One claims pipeline, several doors. All channels write Layer 0 + Layer 1; none write
canonical stores directly. Extraction can happen **inside the portal** (AIHelper pipeline)
or **inside an external agent** (Claude Cowork reading Gmail) — the server treats both as
proposers and applies identical validation, preview, and audit.

### 5.1 Agent channel: Claude Cowork does the batch work (flagship)

The scenario that shapes this design: *"I just received 10 emails from members describing
their exit events. Read them and do the right thing."*

Flow (all via the governed API in §6, using the e8 data-query skill extended with a
portfolio module):

1. Cowork reads the 10 emails from Gmail (it already has access) and, per email:
2. `ingest_source` — submits the **verbatim** email body + sender + date (channel
   `'agent'`, `gmail_message_id` for dedup). The raw text is preserved server-side
   regardless of what the agent concludes from it.
3. `propose_claims` — Cowork does the extraction itself (it's reading the email in full
   context) and proposes structured claims: types, amounts as ranges, dates with
   precision, its entity-resolution picks with candidates. The server validates enums,
   re-checks entity resolution against the directory, and returns a preview: what would
   be created, what would auto-accept, what needs whom.
4. `execute` (confirmed) — claims are written. Then, deterministically server-side:
   - Claims **by a member about their own position** auto-accept (no dollar threshold —
     decided) → `investor_return_events` / member-private marks materialize, member
     notified.
   - Claims from a member **not yet confirmed by them** (email didn't come through a
     confirm flow) stay `pending_review` and the member gets a confirm link
     (§5.3) — Cowork can also be told "and send the confirmation emails."
   - **Company-level claims** (an exit happened, a round, a shutdown) land in
     `pending_review` — and because the admin is right there in the Cowork conversation,
     the skill surfaces them for a same-session decision: "Korvata reportedly sold for
     ~$45M (public source). Accept as a company-level claim? It would move 6 member
     positions." Accepting runs the same `accept_claim` action an admin would use in the
     review-queue UI.
5. Cowork reports back: N sources ingested, M claims created, K auto-accepted, J awaiting
   member confirmation, 2 questions for you.

The same channel handles singletons ("Bob just told me at lunch that he got 2× on
Meadowlark — record that, reported-not-attested") and documents ("here's the closing
statement PDF — extract everyone's allocations").

### 5.2 Web: "Tell us what happened" (member self-serve)

A free-text box on the member's portfolio page (and on each company row):

1. Member types: *"Impel was acquired by Vontier last March. I had $50k in the 2019 SAFE
   and got back about $130k cash, plus some escrow that hasn't paid out."*
2. `POST /api/portfolio/intake/parse` runs synchronous in-app extraction (AIHelper,
   `response_format: json_object`, prompt enumerates claim types/enums exactly like
   `email-to-dealum-processor.js`). Entity resolution: member = session user; company
   fuzzy-matched against the directory with candidates when uncertain.
3. UI shows "**Here's what we understood**" — one card per claim with editable structured
   fields (company, type, amount, date + precision, the verbatim quote it came from).
4. Member confirms → claims created with `basis='attested'` → same deterministic
   auto-accept/review routing as §5.1 step 4.

The confirm step is what makes web intake stronger than a form: the member attests to the
structured interpretation, so we get tier-1 facts without anyone hand-filling ten fields.

### 5.3 Email confirm links (upgrade path for unattested claims)

Whenever claims exist for a member with `basis='reported'` (extracted from an email or
relayed by an admin/agent), the member gets one email: "Here's what we understood — click
to confirm or fix," linking to the §5.2 confirm UI pre-loaded with those claims.
Confirmation upgrades them to `attested` and triggers auto-accept for self-scoped ones.
No reply just leaves them for the admin queue. (A standing inbound address +
Apps-Script/Mailgun pipeline — the fully automated version of §5.1 — reuses
`routes/email-ingest.js` patterns and can come later; Cowork covers batch email intake
first. Decided ordering.)

### 5.4 Admin paste and structured recording

Admins can paste a Pitchbook excerpt or news story into the same intake box (admin mode) —
extraction produces company-level claims with `basis='public_source'` or `'secondhand'`,
always `pending_review`. This is how "we know the exit happened and roughly the price, but
no member terms" enters honestly — it becomes a tier-3 input, not a fake tier-1 fact.
The Record Portfolio Update wizard (companion plan) and the existing member
valuation-event form remain as pre-structured channels, gaining the new fields (ranges,
date precision, basis).

### 5.5 Review queue (extends the existing one)

A "Portfolio Intake" admin queue alongside the current valuation review queue, modeled on
`ValuationAdminPanel.jsx` — the **fallback** surface for anything not resolved
conversationally:

- Each row: source excerpt (verbatim quote), proposed structured claim, entity-resolution
  candidates, extraction confidence, and who/what proposed it (member, admin, or agent
  token).
- Actions: **accept** (optionally repairing fields first — same repair-form pattern),
  **reject** (with note), **ask for clarification** (generates a follow-up email to the
  reporter; claim → `needs_clarification`).
- Accepting materializes canonical records and stamps the claim with
  `applied_valuation_event_id` / `applied_return_event_id` so every canonical row traces
  back through the claim to the verbatim source.
- **Members holding a company with a pending company-level claim see a neutral "update
  pending verification" hint on that position (decided)** — existence only, no contents,
  no reporter identity.

## 6. Agent-first administration: Claude is the admin interface

The owner will operate this system by talking to Claude — asking questions, requesting
reports, and directing intake — not by managing tables. That makes agent legibility and a
governed write surface first-class deliverables, not afterthoughts.

### 6.1 Governed portfolio actions (mirrors the Development CRM write flow)

Extend `routes/data-query.js` with a portfolio action surface, identical in shape to the
proven Development flow:

- `POST /api/data-query/portfolio/preview` and `POST /api/data-query/portfolio/execute`
  (`confirmed:true` required), bearer-token auth with a new per-token policy gate
  (`requirePortfolioWriteToken`), every call recorded to a mutation log + `data_query_audit`.
- An **action-type registry** that maps to cache-manager service methods — never raw SQL:

| Action | What it does | Guard |
|---|---|---|
| `ingest_source` | Store verbatim raw text/document (Layer 0) | dedup on `gmail_message_id` |
| `propose_claims` | Create `portfolio_claims` rows against a source | enum + entity validation; returns per-claim routing preview |
| `accept_claim` / `reject_claim` / `request_clarification` | Same transitions the review-queue UI performs | company-level accepts show impact preview (positions affected) first |
| `record_return_event` | Direct pre-structured entry (admin dictating a known fact) | creates the backing claim automatically for provenance |
| `record_valuation_event` | Delegates to the existing create/apply path | existing `applyValuationEvent` semantics |
| `send_confirm_requests` | Queue confirm-link emails for named members' pending claims | idempotent per claim |
| `run_estimates` | Trigger a live estimation run / quarterly snapshot | read-mostly; snapshot writes versioned rows |

Reads need no new mechanism: the skill already has governed SQL via `POST /query`, and
`GET /schema` / `GET /glossary` already self-describe — the new tables just have to be
documented well (§6.3).

### 6.2 Skill deliverables

Extend the existing **e8 data-query Claude skill** with a portfolio module (shipped as
part of this feature, same repo/process as the current skill):

- **Ingestion recipes**: the §5.1 loop, spelled out — always `ingest_source` verbatim
  before proposing; propose ranges not points; never guess an entity match below the
  server's confidence bar (submit candidates instead); surface company-level claims to
  the human in-conversation; offer `send_confirm_requests` at the end of a batch.
- **Question recipes**: "how is member X doing", "how are 2016-vintage members doing as a
  group", "which positions would benefit most from better data" — canonical SQL/action
  sequences against the estimates and facts layers, with the trust rules baked in (always
  report ranges + coverage; never present tier-4+ numbers as facts).
- **Report recipes**: on-demand member statement, quarterly org summary, data-health
  worklist — generated conversationally; these are the v1 "dashboards" (decided: iterate
  representation after data exists).

### 6.3 Schema legibility (what makes "do the right thing" possible)

Required in the same phase as the schema itself, per AGENTS.md rules and because the
agent literally reads these to operate:

- `docs/database-schema.md` — new tables + the drift fixes found during research.
- `docs/data-query-glossary.md` — plain-language entries: what a claim is vs a return
  event vs a mark; what each tier means; the auto-accept rule; "realized vs unrealized";
  gotchas (date precision means first-of-period; rollover deployments aren't cash-in;
  Decarbon8 excluded from member statements).
- `docs/ai-relationship-registry.*` — soft-FK paths (claim → source, claim → applied
  events, return event → rollover deployment), JSON payload shapes (`inputs_json`,
  `assumptions_json`), polymorphic meanings (`claim_type` families member-level vs
  company-level), and **safety boundaries**: member-private scope rules for AI-generated
  rollups, and "estimates are not facts" annotations so dynamic rollups can't misread
  tier-7 numbers as reported data.

### 6.4 Who touches what (why the schema complexity doesn't land on the admin)

| Table | Written by | Humans ever hand-edit? |
|---|---|---|
| `portfolio_intake_sources` | intake channels (web/agent/email) | never |
| `portfolio_claims` | AI proposers + confirm/review transitions | via review UI or Claude only |
| `investor_return_events` | claim acceptance + wizard/action entry | via governed actions only |
| `valuation_events`, `marks`, `portfolio_events` | existing engine (unchanged paths) | via existing admin flows |
| `estimation_assumption_sets` | seeded default; edited rarely, deliberately | yes — it's the knob box |
| `position_estimate_snapshots` | estimation engine only | never |

The admin's real interfaces are three: a Cowork conversation, the review queue, and
members' own confirm links. Everything else is machinery.

## 7. Gap analysis → schema changes

| # | Gap (confirmed) | Where it bites | Fix |
|---|---|---|---|
| 1 | Member-level realized proceeds have no home: `fund_distributions` requires `fund_id` (and is empty); `deployments.record_type='return'` is a bare amount with no type/link/provenance | Can't record "I got $130k back", can't compute DPI per member | New `investor_return_events` table (§8.3) |
| 2 | No cross-company consideration: exit of A paid in shares of B (EnerG2 → Group14) | Stock-for-stock exits — common in this portfolio's history | `consideration_company_record_id` + rollover deployment linkage (§8.3, §8.6) |
| 3 | No confidence tier, no value range, no attestation basis on any stored value | Estimates masquerade as facts; aggregation can't propagate uncertainty | Range + tier + basis columns on new tables; additive columns on `marks` / `valuation_events` (§8.4, §8.5) |
| 4 | Dates are `YYYY-MM-DD NOT NULL` with no precision flag | "Sometime in 2021" becomes a fake exact date | `*_date_precision` columns; store first-of-period date |
| 5 | `marks` store only a multiple; awkward for member-reported absolute values ("my stake is worth ~$50k", public-stock positions) | Member holding-value reports don't fit | `fair_value_cents` (+ range) on `marks`; engine prefers absolute when present (§8.4) |
| 6 | No raw-source or claims layer; free text has nowhere to land; AI has no propose-space | Everything requires form-filling; provenance chains break at the human | `portfolio_intake_sources` + `portfolio_claims` (§8.1, §8.2) |
| 7 | No governed agent write path for portfolio data (Development CRM has one; portfolio doesn't) | Cowork can read everything but can't safely record anything | Portfolio action registry + mutation log (§6.1, §8.9) |
| 8 | No estimate persistence/versioning; snapshot logic is implicit in one function | Can't report "as of Q2", can't do sensitivity, can't show composition over time | `estimation_assumption_sets` + `position_estimate_snapshots` (§8.7, §8.8) |

Doc-drift found during research (fix in `docs/database-schema.md` during implementation,
not this phase): `deployments.instrument_id` (NOT NULL FK) is undocumented;
`companies.status` (legacy, non-authoritative) is undocumented; `instruments.fund_id`,
`portfolio_company_id`, `drop_me_round_record_id` and `funds.theme` are undocumented.

## 8. Proposed schema — exact SQL (for review; nothing applied)

Conventions follow the existing tables: TEXT ids with type prefixes, `unixepoch()`
audit columns, CHECK-enforced enums, `scope`/`status`/`superseded_by` lifecycle mirroring
`valuation_events`. Turso/SQLite dialect.

### 8.1 `portfolio_intake_sources` — Layer 0, immutable raw submissions

```sql
CREATE TABLE portfolio_intake_sources (
    id TEXT PRIMARY KEY,                        -- 'pis_' + nanoid
    channel TEXT NOT NULL
        CHECK (channel IN ('email','web_form','admin_paste','agent','document','import')),
    sender_person_record_id TEXT,               -- resolved member, when known
    sender_email TEXT,
    subject TEXT,
    raw_content TEXT NOT NULL,                  -- verbatim free text, never edited
    attachments_json TEXT,                      -- [{driveFileId,name,mimeType}]
    gmail_message_id TEXT,                      -- email/agent-channel dedup key
    received_at TEXT NOT NULL,                  -- UTC instant (ISO)
    created_by_token_id TEXT,                   -- data-query token when channel='agent'
    processing_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending','extracted','failed','ignored')),
    processing_error TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX idx_pis_gmail_message
    ON portfolio_intake_sources(gmail_message_id)
    WHERE gmail_message_id IS NOT NULL;
```

### 8.2 `portfolio_claims` — Layer 1, structured observations

```sql
CREATE TABLE portfolio_claims (
    id TEXT PRIMARY KEY,                        -- 'clm_' + nanoid
    source_id TEXT REFERENCES portfolio_intake_sources(id),
    claim_type TEXT NOT NULL CHECK (claim_type IN (
        'invested',            -- member states a position/basis we lack
        'realized_cash',       -- cash proceeds received
        'realized_stock',      -- stock consideration received
        'holding_value',       -- member's view of current value
        'ownership',           -- share count / percentage
        'exit_occurred',       -- company-level: acquisition/IPO/secondary
        'round_occurred',      -- company-level: financing round
        'company_shutdown',    -- company-level: dead
        'still_operating',     -- company-level: alive signal (refreshes staleness)
        'other')),
    person_record_id TEXT,                      -- member the claim concerns (NULL = company-level)
    company_record_id TEXT,                     -- resolved company
    company_name_raw TEXT,                      -- as written, pre-resolution
    instrument_id TEXT,                         -- when resolvable
    deployment_id TEXT,                         -- when resolvable
    consideration_company_record_id TEXT,       -- stock-for-stock: shares of this company
    value_low_cents INTEGER,
    value_expected_cents INTEGER,
    value_high_cents INTEGER,
    multiple_low REAL,
    multiple_expected REAL,
    multiple_high REAL,
    share_quantity REAL,
    effective_date TEXT,                        -- YYYY-MM-DD; first day of period if imprecise
    effective_date_precision TEXT NOT NULL DEFAULT 'day'
        CHECK (effective_date_precision IN ('day','month','quarter','year','unknown')),
    basis TEXT NOT NULL
        CHECK (basis IN ('attested','reported','secondhand','public_source','inferred')),
    attested_by_person_record_id TEXT,          -- who vouches (confirm-flow)
    reported_by TEXT,                           -- name/email when reporter isn't a member
    extraction_confidence REAL,                 -- 0..1; NULL for manual entry
    extraction_model TEXT,                      -- model id, or 'agent:<token_id>' for external agents
    created_by_token_id TEXT,                   -- data-query token when agent-proposed
    quote TEXT,                                 -- verbatim supporting excerpt from source
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review','needs_clarification',
                          'accepted','rejected','superseded')),
    superseded_by_claim_id TEXT,
    reviewed_by_person_record_id TEXT,
    reviewed_at INTEGER,
    review_note TEXT,
    applied_valuation_event_id TEXT,            -- canonical rows created on accept
    applied_return_event_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_claims_status  ON portfolio_claims(status);
CREATE INDEX idx_claims_company ON portfolio_claims(company_record_id);
CREATE INDEX idx_claims_person  ON portfolio_claims(person_record_id);
CREATE INDEX idx_claims_source  ON portfolio_claims(source_id);
```

### 8.3 `investor_return_events` — canonical member-level realized proceeds

The member-side counterpart of `fund_distributions`, sharing the `valuation_events`
lifecycle vocabulary. Exactly one of `person_record_id` / `fund_id` is set (mirrors
`deployments`).

```sql
CREATE TABLE investor_return_events (
    id TEXT PRIMARY KEY,                        -- 'ret_' + nanoid
    person_record_id TEXT,
    fund_id INTEGER,
    company_record_id TEXT NOT NULL,
    instrument_id TEXT,
    deployment_id TEXT,                         -- deployment this return is against, when known
    return_type TEXT NOT NULL CHECK (return_type IN (
        'exit_cash','secondary_sale','escrow_release','dividend','interest',
        'note_repayment','stock_consideration','buyback','other')),
    amount_low_cents INTEGER,
    amount_cents INTEGER,                       -- expected/point value (NULL only for pure stock w/ unknown value)
    amount_high_cents INTEGER,
    consideration_company_record_id TEXT,       -- set when return_type='stock_consideration'
    share_quantity REAL,
    rollover_deployment_id TEXT,                -- deployment minted in the consideration company (§8.6)
    effective_date TEXT NOT NULL,
    effective_date_precision TEXT NOT NULL DEFAULT 'day'
        CHECK (effective_date_precision IN ('day','month','quarter','year','unknown')),
    confidence_tier TEXT NOT NULL
        CHECK (confidence_tier IN ('attested','reported','derived','estimated')),
    source_claim_id TEXT REFERENCES portfolio_claims(id),
    source_event_id TEXT,                       -- valuation_events.id of the exit, when linked
    methodology_note TEXT,
    source_reference TEXT,
    scope TEXT NOT NULL DEFAULT 'member_private'
        CHECK (scope IN ('global','member_private')),
    status TEXT NOT NULL DEFAULT 'applied'
        CHECK (status IN ('applied','needs_repair','superseded')),
    superseded_by_id TEXT,
    created_by_person_record_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    CHECK ((person_record_id IS NULL) <> (fund_id IS NULL))
);
CREATE INDEX idx_ire_person  ON investor_return_events(person_record_id, company_record_id);
CREATE INDEX idx_ire_company ON investor_return_events(company_record_id);
CREATE INDEX idx_ire_event   ON investor_return_events(source_event_id);
```

Migration note: the 9 existing `deployments.record_type='return'` rows ($47.6k) get
backfilled into this table (`return_type='other'`, `confidence_tier='reported'`) and the
old rows retired from new read paths.

### 8.4 `marks` — additive columns (range, absolute value, tier, date precision)

```sql
ALTER TABLE marks ADD COLUMN valuation_multiple_low REAL;
ALTER TABLE marks ADD COLUMN valuation_multiple_high REAL;
ALTER TABLE marks ADD COLUMN fair_value_cents INTEGER;       -- absolute member-scope value; overrides multiple when set
ALTER TABLE marks ADD COLUMN fair_value_low_cents INTEGER;
ALTER TABLE marks ADD COLUMN fair_value_high_cents INTEGER;
ALTER TABLE marks ADD COLUMN confidence_tier TEXT
    CHECK (confidence_tier IN ('reported_actual','derived_allocation','exit_prorata',
                               'last_round_mark','cost_basis','status_prior','cohort_imputed'));
ALTER TABLE marks ADD COLUMN effective_date_precision TEXT NOT NULL DEFAULT 'day'
    CHECK (effective_date_precision IN ('day','month','quarter','year','unknown'));
```

All nullable/defaulted → zero impact on existing rows and `applyValuationEvent()` until
each write path opts in.

### 8.5 `valuation_events` — additive columns (claim link, basis, date precision)

```sql
ALTER TABLE valuation_events ADD COLUMN effective_date_precision TEXT NOT NULL DEFAULT 'day'
    CHECK (effective_date_precision IN ('day','month','quarter','year','unknown'));
ALTER TABLE valuation_events ADD COLUMN confidence_basis TEXT
    CHECK (confidence_basis IN ('attested','reported','secondhand','public_source','inferred'));
ALTER TABLE valuation_events ADD COLUMN source_claim_id TEXT;
```

(Value ranges for events stay in `payload_json` — the event payload is already
polymorphic per `event_type`, and marks carry the queryable range.)

### 8.6 `deployments` — stock-for-stock rollover linkage

When an accepted `stock_consideration` return is material, the system mints the new
position in company B so B's future valuation events mark it forward naturally:

```sql
ALTER TABLE deployments ADD COLUMN origin_return_event_id TEXT
    REFERENCES investor_return_events(id);
```

Rollover deployments use a new `record_type='rollover'` (app-enforced; the column has no
CHECK in prod) with `amount_cents` = value of the stock at receipt. Trade-off, decided
deliberately: existing queries filter `record_type='deployment'`, so rollover positions
are invisible to legacy cash-in sums (correct — no new cash was deployed) and to the
current snapshot function (acceptable — the new estimation engine replaces it in Phase 3
and treats rollover as basis for the B position while excluding it from cash-in
aggregates). EnerG2→Group14 becomes: return event on EnerG2 (`stock_consideration`,
`consideration_company_record_id`=Group14) → rollover deployment + instrument on Group14
→ Group14's marks value it from then on.

### 8.7 `estimation_assumption_sets` — named, versioned sensitivity knobs

```sql
CREATE TABLE estimation_assumption_sets (
    id TEXT PRIMARY KEY,                        -- 'eas_' + nanoid
    name TEXT NOT NULL,                         -- 'Default 2026-Q3', 'Conservative', …
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
    assumptions_json TEXT NOT NULL,             -- band params per tier, staleness curve,
                                                -- dilution haircut, dead-recovery, cohort priors
    notes TEXT,
    created_by_person_record_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

Sensitivity analysis = run the engine with a different set and diff the totals; the
"assumptions" behind any published number are a row you can read.

### 8.8 `position_estimate_snapshots` — Layer 2 official runs

```sql
CREATE TABLE position_estimate_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,                       -- 'run_' + nanoid; groups one engine run
    as_of_date TEXT NOT NULL,                   -- YYYY-MM-DD
    assumption_set_id TEXT NOT NULL REFERENCES estimation_assumption_sets(id),
    person_record_id TEXT,
    fund_id INTEGER,
    company_record_id TEXT NOT NULL,
    method_tier TEXT NOT NULL CHECK (method_tier IN (
        'reported_actual','derived_allocation','exit_prorata',
        'last_round_mark','cost_basis','status_prior','cohort_imputed',
        'realized_only')),
    invested_cents INTEGER NOT NULL,            -- cash-in basis (excludes rollover)
    realized_low_cents INTEGER NOT NULL,
    realized_cents INTEGER NOT NULL,
    realized_high_cents INTEGER NOT NULL,
    unrealized_low_cents INTEGER NOT NULL,
    unrealized_cents INTEGER NOT NULL,
    unrealized_high_cents INTEGER NOT NULL,
    inputs_json TEXT NOT NULL,                  -- fact ids + parameters used (full provenance)
    engine_version TEXT NOT NULL,
    computed_at INTEGER NOT NULL DEFAULT (unixepoch()),
    CHECK ((person_record_id IS NULL) <> (fund_id IS NULL))
);
CREATE INDEX idx_pes_run    ON position_estimate_snapshots(run_id);
CREATE INDEX idx_pes_person ON position_estimate_snapshots(person_record_id, as_of_date);
CREATE INDEX idx_pes_asof   ON position_estimate_snapshots(as_of_date, assumption_set_id);
```

Quarterly snapshot runs are the statements of record; interactive "how am I doing right
now" computes live via SWR (`swrGet`) with the same engine (decided: both).

`method_tier` carries one of the seven unrealized-waterfall tiers OR the sentinel
`'realized_only'`. The seven tiers describe how the *unrealized* value was estimated;
`'realized_only'` is not a waterfall tier — it flags a purely-realized position (fully
exited, no remaining valuation basis) whose unrealized band is zero and whose value is
entirely realized proceeds. Including it in the CHECK from day one lets the snapshot writer
persist those positions instead of silently dropping them (D-7).

### 8.9 `portfolio_data_query_mutations` — agent action audit (mirrors development)

Same shape as the existing `development_data_query_mutations`:

```sql
CREATE TABLE portfolio_data_query_mutations (
    id TEXT PRIMARY KEY,
    token_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    preview_json TEXT NOT NULL,
    result_json TEXT,
    status TEXT NOT NULL,                       -- previewed | executed | failed
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executed_at TEXT,
    error TEXT
);
```

## 9. Reporting (deliberately minimal in v1)

Decided: representation iterates after data exists. v1 reporting is:

- **Live "how am I doing right now"** — the estimation engine computed on demand
  (member statement API + the eventual GA page), plus **quarterly snapshot runs** for
  numbers of record and time series.
- **On-demand agent reports** (§6.2) — member statements, org summaries, vintage
  cohorts, data-health worklists produced conversationally by the skill. These carry the
  reporting load while we learn what dashboards should be.
- The trust rules apply everywhere from day one: reported facts render plainly; estimates
  always carry `~`, a band, and a tier label; every total comes with its coverage line
  ("58% of this value is reported or derived"). The mockup's dashboard views remain as
  later-phase explorations, not v1 commitments.

## 10. Decisions record (2026-07-01)

1. **No dollar threshold on auto-accept** — member-confirmed claims about their own
   position always auto-accept.
2. **Pending company-level claims are visible** to members holding that company as a
   neutral "update pending verification" hint (existence only).
3. **Member statements include Annual Fund LP positions; Decarbon8 excluded** (different
   kind of vehicle).
4. **Cohort priors from E8-only resolved history**; revisit external benchmarks when
   resolved-n grows.
5. **Escrows/holdbacks are a range on the original return event**, not a separate
   receivable state.
6. **Quarterly snapshots + live now-view**, both from the same engine.
7. **Intake and schema robustness before representation**; dashboards iterate once data
   exists; agent-produced reports fill the gap.
8. **Agent-first operations**: extend the data-query skill + governed action API so
   Claude Cowork can ingest ("read these 10 emails and do the right thing"), answer, and
   report; schema legibility docs (glossary/registry) ship with the schema, not after.

## 11. Implementation phases

**Phase 1 — Schema + governed agent surface.** Create the tables + additive ALTERs (§8;
dev first, prod after review). Backfill the 9 legacy return rows. New cache-manager
module `lib/cache-manager/portfolio-returns.js` (all SQL there per repo rules). Portfolio
action registry + preview/execute routes + token policy (§6.1). Ship the legibility docs
in the same PR: `docs/database-schema.md` (incl. drift fixes), `docs/data-query-glossary.md`,
AI relationship registry. Update the data-query skill with the portfolio module
(read + ingest recipes). **Exit criterion: the "10 emails" scenario works end to end from
Cowork**, with claims landing pending/auto-accepted correctly.

**Phase 2 — Member confirm loop.** Web "tell us what happened" box + confirm UI
(§5.2), confirm-link emails for unattested claims (§5.3), the admin intake review queue
(§5.5), and the wizard's exit branch writing `investor_return_events`. Outcomes-survey
outreach can start here — replies are handled through Cowork until the automated inbound
pipeline earns its keep.

**Phase 3 — Estimation engine.** Deterministic waterfall in `lib/portfolio-estimation/`
(pure functions: facts + assumption set → position estimates; unit-tested per tier;
`engine_version`ed). Default assumption set seeded with §4 bands + E8-only cohort priors.
Annual Fund LP positions folded into member scope. Live now-view API + first quarterly
snapshot run. Skill gains question/report recipes over estimates.

**Phase 4 — Representation.** Member statement GA (confidence UI, coverage bar,
provenance popovers), org views — designed from what the on-demand reports taught us.

Each phase ships behind its own review; no schema reaches prod without explicit sign-off
(SQL above is the review artifact).

## 12. Design guide compliance

Mockup only in this phase — no production UI shipped. The mockup follows the repo design
guide (dense tables, compact controls, no helper copy, no technical vocabulary in
user-facing text: members see "Reported / Based on last round / Estimate", never
`confidence_tier` or table names). A compliance checklist accompanies each UI phase at
implementation time.
