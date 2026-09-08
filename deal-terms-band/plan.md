---
title: "Deal Terms Band — Layout Options"
status: draft
owner: jordan
created: 2026-09-08
last_updated: 2026-09-08
home: deal-terms.html
---

# Deal Terms band — layout options

## Mockup files in this folder

- **`deal-terms.html`** (home) — the current band, a straw man showing what happens if the new fields simply join the stat rail, four layout options, sparse-deal versions of two of them, and the candidate-field table.

## 1. The problem

The Deal Terms band at the top of the application slide-out (`InvestorHero`, rendered inside `UnifiedRecordView`) is a four-column row: a vertical stat rail (Instrument, Capital Seeking, Round Close, Lead Investor), the generated deal-terms prose in a white box, the term sheet thumbnail, and the Register Investment Interest block.

Three more figures are wanted — Min Check Size, Raised to Date, Non-dilutive Raised to Date — but appending them to the rail makes it seven items tall and pushes the band from 266px to 428px, with the rail visually outweighing the description. Measured at the panel's real 1360px width.

## 2. Options

| | Layout | Height | Character |
|---|---|---|---|
| Straw man | Seven stats in the rail | 428px | Rail dominates; what we're avoiding |
| A | Rail keeps the headline four; the rest in a small wrapping strip under the whole band | 311px | Smallest change; closest to Jordan's sketch |
| B | Headline four rotate into a header row; prose full width; strip beneath it | 312px | Prose gets a real measure; loses the rail treatment |
| C | Two-tier rail — three big stats, the rest as a small label/value list below them | 365px | Keeps one column; tallest option |
| D | Prose leads, remaining figures as a two-column table in the right margin | 262px | Shortest; fact-sheet reading; widest |

Measured band heights at 1360px panel width, Enzinc (Series A-3) data.

## 3. Candidate fields

Everything below is already stored — nothing needs new capture. Structured deal terms live in `instruments.metadata_json` for the application (written by the Deal Terms wizard via `POST /api/save-deal-terms`); the raise figures live on the `applications` row.

**Asked for**

- Min check size — `min_check_size_dollars`. Nearly always set; the wizard defaults it.
- Raised to date — `applications.funding_to_date_amount_cents`.
- Non-dilutive to date — `applications.non_dilutive_amount_cents`.

**Worth adding at the same time**

- **Valuation / cap** (`valuation_dollars` or `cap_amount_dollars`, plus the pre/post flag). The number an angel checks first, and currently only available as prose.
- **Discount** (`discount_pct`) for SAFE/Note; **interest rate + maturity** for Notes; **liquidation preference** for equity. One instrument-dependent slot, not three permanent rows.
- **Lead commitment** (`lead_committed_cents`) as a suffix on the existing Lead Investor stat rather than its own row.
- **Raise min–max** (`raise_min_cents` / `raise_max_cents`) in place of Capital Seeking where present. `capital_seeking` is a free-text bucket ("1,500,000 or more"); the wizard values are real numbers.

**Needs a decision first**

- **Target close date** (`target_close_date`) is a *second* date, distinct from the Round Close stat, which comes from the Round Close event. Enzinc has both, nine days apart. Show one, or reconcile them — showing both unlabelled would be worse than showing neither.
- **E8 interest registered to date** (sum over `investment_interest`). The only genuinely E8-specific figure available, but it nudges herd behaviour and needs a permission call.

**Not this band**

- Employees (`num_employees`), financial position, use of funds, cap table — company/raise context that belongs in the Overview and Raise Details sections.

## 4. Notes for implementation

- The generated description already states the valuation, close date and lead in prose. Whatever lands in the strip should be the structured, comparable version of those facts — figures a member can scan across three companies — while the prose keeps the narrative (warrants, dividends, MFN).
- Money columns are cents (`*_cents`); the deal-terms wizard fields `cap_amount_dollars`, `valuation_dollars`, `principal_dollars` and `min_check_size_dollars` are raw dollars despite some pre-migration rows carrying `*_cents` keys. Format through `lib/money.js`, not ad hoc division.
- The band is click-to-edit for admins, and the term sheet thumbnail height tracks the description box via `ResizeObserver` with a fixed-width slot. Options B and D change what the thumbnail sits beside, so that matching logic needs revisiting with them.
- Every field is optional in practice. The sparse examples in the mockup (Beyond Silicon, a pre-seed SAFE with no close date, no cap and no term sheet) are closer to the median pipeline company than Enzinc is.

## 5. Open questions

1. Which option?
2. Add valuation/cap to the strip in the same change, or keep the first pass to the three requested figures?
3. Target close date vs Round Close — which wins?
4. Show E8 interest registered to date at all?
