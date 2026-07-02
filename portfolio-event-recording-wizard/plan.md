---
title: "Portfolio Event Recording Wizard"
status: draft
owner: jordan
created: 2026-05-27
last_updated: 2026-07-02
home: mockup
---

# Portfolio Event Recording Wizard

## Background

The portfolio admin page already has the backend pieces needed to record valuation-changing events: canonical `valuation_events`, derived `marks`, derived `portfolio_events`, fund distributions, and lifecycle status derived from applied exit/shutdown events. The current UI exposes those pieces as separate admin concepts: Add Company Event, Add Mark, Apply Cramdown, Marks, Events, and Valuation. That makes a normal operating question such as "this company exited; how do I record the outcome?" feel like a database exercise.

The desired admin experience is one plain-language workflow for recording what happened to a portfolio company and previewing the effect before saving.

## Current-State Findings

- Company lifecycle is already canonical in `valuation_events`: any applied `exit` event makes the company Exited; any applied `shutdown` event makes it Written off/Closed; otherwise it remains Active.
- The backend already derives instrument valuation marks from canonical events. Financing rounds can apply one repricing multiple to all active instruments, or derive a multiple from price/share, pre-money, post-money, or a reference valuation.
- Exit support exists below the UI layer: `applyValuationEvent()` handles `eventType === 'exit'`, creates exit marks, records portfolio acquisition events, and stores proceeds on the portfolio event.
- The company detail UI still presents Add Mark and Add Company Event as separate actions. Exit is hidden under Mark Method, while the "What happened?" select only lists Pricing / Valuation Changed, Instrument Structure Changed, and Company Shut Down (Write Off).
- The portfolio grid kebab menu does not offer direct outcomes like Record Exit, Record New Round, or Record Closure; it offers Add Company Event and Apply Cramdown.
- The valuation acceptance tests describe the core behavior, but they are currently skipped as a suite, so implementation should add/activate focused coverage for this flow rather than rely only on manual testing.

## Proposed UX

Replace the current Add Company Event / Add Mark split with a single primary action:

**Record Portfolio Update**

Entry points:

- Portfolio grid row kebab: Record Portfolio Update, Open Company.
- Company detail header: Record Portfolio Update.
- Valuation History section: Keep history display, but replace Add Mark and Add Company Event with Record Portfolio Update.
- Advanced instrument-level screens may keep lower-level actions behind a More menu, but the main company workflow should not require them.

Step 1: What happened?

- New financing round closed
- Company exited
- Company closed / shut down
- Instrument converted
- Manual valuation update
- Cram down / restructuring

Use plain labels only. The wizard maps these choices to `valuation_events.event_type` and derived artifacts internally.

Step 2: Ask only the fields required for that outcome.

For a new financing round:

- Closing date
- Round name/instrument, optionally create if missing
- New round price/share, pre-money, post-money, amount raised, or direct valuation multiple
- Prior reference valuation if the system cannot infer it
- Scope: update all active prior investments by default
- Optional source and note

For an exit:

- Exit date
- Exit type: acquisition, IPO/public listing, secondary sale, liquidation with proceeds, other
- Company exit valuation or per-instrument return multiple
- Total proceeds returned to E8 investors, with optional per-fund/per-investor allocation if known
- Whether this is final and should move the company to Exited
- Source and note

For a closure/shutdown:

- Closure date
- Optional note/source
- Default outcome: write all active instruments to zero and move company to Closed

For a conversion:

- Source instrument
- Target instrument: create new or use existing
- Conversion date
- Price/share or conversion multiple if needed

For a manual valuation update:

- Effective date
- Instrument(s) affected
- New valuation multiple or company value
- Source and note

For cram down/restructuring:

- Reuse the existing cramdown mechanics, but expose it as one option inside the same Record Portfolio Update workflow.

Step 3: Preview impact before save.

The preview should show:

- Company status after save: Active, Closed, or Exited.
- Instruments affected.
- Current cost, new fair value, and implied MOIC by instrument.
- Count of member deployments/investments affected.
- Derived records to be created, using admin-friendly language: valuation update, instrument status update, return/distribution record. Avoid surfacing table names in the primary preview.
- Any missing data that prevents automatic calculation, with an inline repair prompt.

Step 4: Save as one canonical event.

The save should create one `valuation_events` record and let existing backend logic derive marks and portfolio events. For exits with real cash/stock returns, the workflow should also guide the admin into recording distributions/return rows where the existing data model supports them.

## Backend Mapping

The first implementation can be UI-heavy and reuse existing tables:

- New financing round -> `valuation_events.event_type = 'financing_round'`; payload includes source/round instrument, pricing inputs, reference valuation inputs, and `apply_to_all_active_instruments = true`.
- Exit -> `valuation_events.event_type = 'exit'`; payload includes event description, exit subtype, proceeds amount, valuation multiple, optional per-instrument multiples, and optional distribution allocation metadata.
- Closure -> `valuation_events.event_type = 'shutdown'`; backend writes zero marks and dissolution portfolio events.
- Conversion -> `valuation_events.event_type = 'conversion'`; backend writes conversion portfolio event and valuation mark when possible.
- Manual valuation update -> `valuation_events.event_type = 'manual_adjustment'`.
- Cram down -> current cramdown flow, launched from the same wizard path.

Schema changes are probably not required for the first pass. Two follow-up schema/data-model questions remain:

- Should company-level lifecycle vocabulary use `closed` in the UI while continuing to store `written_off` internally, or should a migration rename status values?
- ~~Should exits with actual returned capital create `fund_distributions` and/or deployment `record_type = 'return'` rows from this wizard, or should the first iteration only record the valuation event and prompt admins to reconcile distributions separately?~~ **Answered (task 2.5, 2026-07-02):** the exit branch still creates exactly one canonical `exit` valuation event; when the admin knows per-member proceeds it additionally records `investor_return_events` (the member-level realized-proceeds store from Portfolio Returns Intelligence §8.3), one per filled investor row, via the claims-backed path so each carries provenance (a backing `portfolio_claims` row, `basis='reported'`, linked to the exit through `source_event_id`). Escrows/holdbacks ride in the high end of the return event's amount band rather than a separate receivable row. `fund_distributions` remains untouched — it is fund-vehicle-only (empty in prod) and is not written from this direct/member wizard flow. Neither the wizard nor this task writes `deployments.record_type='return'`; that legacy shape is superseded by `investor_return_events` (with the 9 legacy return rows backfilled separately). Proceeds are recorded through a follow-up call to `POST /api/admin/portfolio/valuation-events/:eventId/proceeds` so the exit valuation event stays atomic and proceeds are additive and idempotent (keyed per investor row).

## Implementation Plan

1. Rename entry points and remove ambiguous primary actions from the portfolio company workflow.
2. Refactor `ValuationEventWizardDialog` into a plain-language Record Portfolio Update wizard with outcome-specific branches.
3. Add a direct Exit branch that posts `event_type: 'exit'`; do not route exit through Mark Method.
4. Add an impact preview endpoint or reuse the existing apply repair/preview primitives to show affected instruments and estimated values before save.
5. Keep advanced tabs (`Marks`, `Events`, `Valuation`) for audit and repair, but make the company detail flow the recommended path.
6. Add regression tests for financing round, exit, shutdown, and direct UI wiring so admins cannot lose the plain-language outcomes.

## Open Questions

- For exit proceeds, do admins usually know company-level exit valuation, total E8 cash returned, exact per-investor returns, or some mix?
- Should Exited always mean "no more portfolio tracking", or should post-exit distributions/escrows keep the company visible in a follow-up state?
- Should the UI call shutdowns "Closed" everywhere and reserve "Written off" for audit/reporting only?
- Are member-private valuation submissions still needed in this admin flow, or should this page always create global portfolio updates?
