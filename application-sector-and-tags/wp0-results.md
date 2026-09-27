# Sector & Tags: WP0 accuracy results

WP0 PR: see `implementation-status.md`. Branch `wp0-sector-tags-accuracy`. Date: 2026-09-27.

## Summary

- **No candidate clears all three bars.** The Sector run-to-run bar is the one that fails. Across every candidate and setting, all 3 runs agree on the Sector for 89–92% of applications, against a 95% bar.
- **The best configuration is GPT-6 Luna at low effort.** It clears the other two bars:
  - Sector agreement with the reference: 92.0%
  - Technology agreement at the second level: 89.0%
  - Cost: $0.00084 per application for 3 runs on the batch API
  - It classifies the application text directly, without the brief.
- **Decided by Jordan on 2026-09-27** (plan decisions 8–9):
  - Model: GPT-6 Luna (`gpt-6-luna`), reasoning effort `low`, 3 runs, union tag rule, classifying the AI summary when one exists and the form fields otherwise. There is no brief step.
  - The run-to-run shortfall is accepted. Sector 2–1 splits keep the majority and go to `needs_review` (about 10% of applications). The monthly health report tracks the split rate.
  - Business type is "every value customers pay for as a real part of the business", with no "most companies have one" expectation.
- **Unmeasured changes:** prompt version 3 (the Business type wording) and the four seed v2 Sector definition edits. Every reported run used prompt v1 with multi-value Business type, and the reference set was labelled with v1.
- **Actual AI spend: $11.60** of the $13 cap.

## What was built

| Piece | Where |
|---|---|
| Shared, versioned classification prompt and schema (production and eval use the same text) | `lib/taxonomy/classification-prompt.js`, prompt version 3 (the production, direct-input path) |
| Reference set: 200 application ids and labels, no applicant text, frozen | `lib/taxonomy/evals/reference-set.json` |
| Eval harness: validation, 3-run vote (union and 2-of-3), metrics, cost | `lib/taxonomy/evals/harness.js`, `providers.js`, `thresholds.json` |
| Runner: fetch inputs, pilot, estimate, batch or standard runs, build reference, score | `scripts/run-taxonomy-evals.js` |
| `tagging` role: production choice, references and candidates, with prices | `lib/ai-models.js` → `TAGGING_MODELS` (`TAGGING_MODELS.production`) |
| Brief prompt, eval-only (kept so the brief comparison can be reproduced; not production) | `lib/taxonomy/evals/brief-prompt.js` |
| Tests | `__tests__/lib/taxonomy-evals.test.js`, `taxonomy-seed.test.js`, `ai-models.test.js` |

The runner reads application text from production (read-only, through `scripts/db-query.js`) into a cache directory outside git. Raw model outputs stay there too. The repo holds only ids and labels.

To repeat a run: `node scripts/run-taxonomy-evals.js fetch-inputs --env=prod`, then `run`, then `score`. The file header lists every flag. Stage names: this note's "direct" is runner stage `classify` (production), and "brief" is the eval-only stages `brief` and `brief-classify`.

## Reference set

- **Sample:** 200 submitted, non-draft applications with `date_added >= 2024-09-19`. They come from the 1,080 classified in the September test run (40 newer applications had no test-run strata). Seed 20260927. The draw:
  - every unstable boundary-pair case (29)
  - stable boundary-pair cases, to make 45 boundary cases in total
  - 20 other unstable cases
  - at least 9 per test-run Sector, or all of them when a Sector had fewer
  - a random fill balancing summary and form-only input
  - Result: 110 summary-based and 90 form-only applications.
- **Labels are not all two-model.** Please read this before using the numbers:
  - **60 applications** (`cross_vendor: true`) were labelled by **GPT-6 Sol and Claude Opus 5.5, both at high effort**.
    - The subset: 35 boundary-pair cases and 25 others, covering all 16 Sectors, 29 summary / 31 form-only.
    - Sector is the two models' agreement, or a reconciliation.
    - Tags keep the **union and the intersection** of the two models, so both recall and precision can be measured.
  - **The other 140 applications** were labelled by **GPT-6 Sol alone**, so their union and intersection are the same set.
  - The next section measures how much this favours OpenAI candidates. Result: it doesn't, on Sector.
- **Input:** the references classified the full application input (the AI summary when present, otherwise the form fields). Candidates classified their own brief, as the plan's pipeline does, unless marked "direct".
- **Frozen:** labelled with prompt v1 / taxonomy v1 and reconciled against taxonomy v2 (`labelled_with` and `reconciled_against_taxonomy_version` in the file).

### Cross-vendor agreement (Sol vs Opus, 60 applications)

| Measure | Agreement |
|---|---|
| Sector | **93.3%** (56 of 60). Boundary pairs 94.3% (n=35), other 92.0% (n=25); summary 93.1%, form-only 93.5% |
| Technology lead tag, level 2 | 90.0% |
| Technology level-2 set, Jaccard | 87.6% |
| Technology exact set | Jaccard 82.8%, identical 70.0% |
| Market | Jaccard 82.5%, identical 60.0% |
| Business type | Jaccard 89.0%, identical 73.3% |
| Built with | Jaccard 93.3%, identical 91.7% |

### Sector disagreements reconciled

| Application | Sol | Opus | Label | Kind | Reasoning |
|---|---|---|---|---|---|
| `app_f3e85b6ca572452d` | AgTech & Food | Not cleantech | **Not cleantech** | Definition tightened | General commerce, payments and operations software for independent food businesses. It has no environmental function; the only benefit is a vague efficiency. |
| `rec53DMo94QsFheBb` | Other | Not cleantech | **Not cleantech** | Definition tightened | General recruiting software; Not cleantech already names recruiting. The claimed benefit (fewer interviews, less paper) is incidental. |
| `app_fbb02b6b114ac53f` | Industrial | Sustainable Materials | **Sustainable Materials** | Boundary pair, definition tightened | The customer buys a different, non-toxic substitute chemistry rather than a cleaner-made version of the same commodity. The substitute-material test applies even though the product is sold as a catalyst. |
| `recHPQYihmIfyn9TC` | Sustainable Materials | Industrial | **Industrial** | Boundary pair, genuine boundary case | The company sells materials R&D services today; its own branded materials come later. By rule 3 (first product) it is materials discovery, which Industrial includes. |

- Two of the four disagreements are the Industrial vs Sustainable Materials boundary.
- The other two are the Not cleantech line: permissive rule 4 against incidental claims.
- Energy Storage vs Grid & Power and Recycling & Waste vs Sustainable Materials produced no reference disagreements on this subset.

### Does a Sol-only reference flatter OpenAI candidates?

On the 60 two-model applications, each candidate was scored three ways: against Sol's labels alone, against Opus's labels alone, and against the merged reference.

| Candidate | Sector vs Sol | vs Opus | vs merged | Tech L2 vs Sol / Opus | Market Jaccard vs Sol / Opus |
|---|---|---|---|---|---|
| GPT-6 Luna, low, brief | 90.0% | 93.3% | 93.3% | 88.3% / 88.3% | 66.3% / 64.1% |
| GPT-5.6 Luna, low, brief | 86.7% | 90.0% | 90.0% | 86.7% / 88.3% | 66.6% / 67.1% |
| Claude Haiku 4.5, brief | 80.0% | 83.3% | 83.3% | 76.7% / 76.7% | 49.9% / 48.8% |
| GPT-6 Luna, low, direct | 93.3% | 93.3% | 93.3% | 90.0% / 88.3% | 76.1% / 74.9% |

- **Sector:** a Sol-only reference does not flatter the OpenAI candidates. It scores every candidate, Haiku included, 0–3.3 points lower than Opus does. So the 140 Sol-only items are, if anything, slightly harsh.
- **Tags:** vendor effects are within ±2 points. At n=60 every figure carries about ±4 points of sampling noise.

## Candidates against the bars

All 200 applications, 3 runs each. Sector numbers don't depend on the tag rule. Tag columns use the union rule.

Column key:

- **Agree:** Sector agreement with the reference (bar ≥ 90%).
- **3 of 3:** share of applications where all 3 runs give the same Sector (bar ≥ 95%).
- **Tech L2:** the lead Technology tag agrees with the reference at level 2 (bar ≥ 85%).

| Candidate | Agree | 3 of 3 | Tech L2 | Tech exact lead | Market Jaccard | Business type Jaccard / exact set | $ per application (3 runs) |
|---|---|---|---|---|---|---|---|
| GPT-6 Luna, low, brief | 89.0% ✗ | 91.5% ✗ | 87.5% ✓ | 81.0% | 69.3% | 82.4% / 66.0% | $0.00071 incl. brief (batch) |
| GPT-5.6 Luna, low, brief | 86.0% ✗ | 91.5% ✗ | 89.0% ✓ | 82.0% | 67.8% | 82.9% / 65.5% | $0.00156 incl. brief (batch) |
| Claude Haiku 4.5, brief | 78.5% ✗ | 75.0% ✗ | 77.5% ✗ | 71.0% | 50.4% | 72.1% / 47.0% | $0.0125 incl. brief (standard API) |
| *Diagnostic:* GPT-6 Luna, low, **direct** | **92.0% ✓** | 89.5% ✗ | **89.0% ✓** | 86.5% | 74.1% | 88.1% / 76.5% | $0.00084 (batch) |
| *Diagnostic:* GPT-6 Luna, **medium**, direct | 91.0% ✓ | 89.0% ✗ | 90.0% ✓ | 87.0% | 81.1% | 90.6% / 83.5% | $0.00109 (batch) |

- Claude Sonnet 5 was not run. The coordinator's instruction was to run it only after asking, if no cheaper model cleared the bars.
- No output was invalid in any configuration: 0 of 3,000 candidate calls.
- **Why the diagnostics were run.** Most Luna Sector misses were subtle rule-3 ("flagship product") and rule-1 ("only for that market") calls, where the brief had dropped the deciding detail.
  - Examples: the first commercial product was a compressor, not the storage system; irrigation sold to homes, not farms.
  - Classifying the application text directly lifted Sector agreement by 3 points.
  - It cut over-tagging: Technology exact-set precision went from 75% to 83%, Market from 74% to 85%.
  - It barely changed Sector stability (91.5% → 89.5%, within noise).
  - Medium effort improved tags further (Market Jaccard 81%) but did not improve stability.

**Stratum and population view.** The sample over-represents hard cases: 65 of the 200 are boundary or unstable cases, against about 19% of the frame. Re-weighted to the frame's mix, Sector agreement / 3 of 3 are:

| Candidate | Sector agreement | 3 of 3 |
|---|---|---|
| GPT-6 Luna, brief | 89.1% | 92.0% |
| GPT-6 Luna, direct | 92.5% | 90.0% |
| GPT-6 Luna, medium, direct | 91.9% | 90.1% |
| GPT-5.6 Luna | 86.2% | 91.5% |
| Haiku | 79.5% | 77.0% |

The stability bar is not met on the real mix either. For GPT-6 Luna, 17–22 applications split 2–1 in each configuration; 18 of them split in at least two configurations. So part of the gap is real ambiguity in the applications, not run noise.

## Union vs 2-of-3 (tags)

GPT-6 Luna, low effort. Tags per company compared with the reference. For reference, GPT-6 Sol's own averages are Technology 1.52, Market 3.03, Business type 1.74, Built with 0.64.

| Configuration | Rule | Tags per company (Tech / Market / Business type / Built with) | Tech exact recall / precision | Market recall / precision | Business type recall / precision | 1-vote share |
|---|---|---|---|---|---|---|
| Brief | union | 1.76 / 3.81 / 1.95 / 0.78 | 83.5% / 75.1% | 91.5% / 74.3% | 94.3% / 86.9% | 15.6% |
| Brief | 2 of 3 | 1.39 / 3.19 / 1.77 / 0.68 | 78.0% / 82.8% | 86.4% / 82.3% | 90.7% / 90.2% | 0% |
| Direct | union | 1.54 / 3.12 / 1.80 / 0.67 | 83.8% / 83.3% | 87.7% / 85.0% | 95.5% / 93.1% | 13.6% |
| Direct | 2 of 3 | 1.30 / 2.56 / 1.64 / 0.59 | 81.0% / 89.8% | 81.2% / 92.6% | 90.7% / 94.4% | 0% |

**Run-to-run agreement** is the mean pairwise Jaccard between individual runs, measured on the direct configuration:

| Family | Agreement |
|---|---|
| Technology | 85.4% |
| Market | 81.4% |
| Business type | 92.1% |
| Built with | 95.1% |
| Sector (pairwise) | 93.0% |

As instructed, the stability of the final voted set was not measured separately; production's 3-run vote will measure it going forward.

**Decision:**

- **Direct input: union.** Its tag counts match the reference almost exactly, so it does not over-tag, and it keeps 3–7 points more recall than 2-of-3.
- **Brief input:** union over-tags Technology by 16% and Market by 26% relative to the reference. With the brief, 2-of-3 would be the better rule.

## Business type (now multi-value)

- Scored like Market: recall against the reference intersection, precision against the union, Jaccard, and an exact-set match against either reference model.
- It is voted and compared under both tag rules above.
- **Finding:** every model, including both references, gives about half of companies two Business types. Jordan removed the "most companies have one" wording on 2026-09-27; the rule is just "as many as genuinely apply".
  - GPT-6 Sol gives exactly one Business type to 45% of companies (average 1.74). Opus 5.5 gives one to 50% (average 1.6). Candidates average 1.8–2.0.
  - This is a wording problem, not a small-model problem.
  - **Proposed tightening (not applied, untested):** "Most companies have exactly one. Add a second only when the application shows customers paying separately for it today, or plans it as a revenue line of similar weight."

## Seed definitions changed after v1

Production holds taxonomy v1, loaded from the seed merged in PR #921. This PR sets `seed.json` `version` to 2 and changes the entries below. Nothing was added or removed. Review these before re-running `scripts/load-taxonomy-seed.js`.

**Business type, for multiple values** (coordinator's instruction, 2026-09-27):

| Tag | Changed | Now says |
|---|---|---|
| `business_type/hardware` | includes; excludes → software, consumer-product, materials-chemicals | A device with an app or monitoring subscription is Hardware only. Add Software only for a separately paid, substantial subscription. The `hardware + software` synonym is kept. |
| `business_type/software` | excludes → marketplace, services | When to add Software alongside Marketplace or Services. |
| `business_type/materials-chemicals` | excludes → project-developer-operator, ip-licensing | When both apply. |
| `business_type/project-developer-operator` | excludes → services | When both apply. |
| `business_type/services` | excludes → software, project-developer-operator | When both apply. |
| `business_type/marketplace` | excludes → software | When both apply. |
| `business_type/financial-product` | excludes → marketplace, project-developer-operator | When both apply. |
| `business_type/consumer-product` | excludes → hardware | When both apply. |
| `business_type/ip-licensing` | excludes → materials-chemicals, hardware | When both apply. |

**Sector reconciliations:**

| Sector | Changed | Now says |
|---|---|---|
| Not cleantech | includes | Industry-generic business software (commerce, payments, POS, HR, marketing, scheduling) stays Not cleantech even when its customers are restaurants, farms, builders or fleets. An incidental claimed benefit (less travel, less paper) doesn't make a company cleantech. |
| Other | excludes → Not cleantech | Same point. |
| AgTech & Food | new exclude → Not cleantech | General commerce, payments or operations software for food businesses is Not cleantech. |
| Industrial | includes; excludes → Sustainable Materials | A non-toxic substitute chemistry sold to replace a conventional one is Sustainable Materials, even when called a catalyst. AI or computational materials-discovery companies go by their current business. |
| Sustainable Materials | includes; excludes → Industrial | Mirror of the Industrial change. |

The classification prompt version is 3. The measured runs used version 1: the v1 definitions plus the multi-value Business type change. The four reconciliation edits (v2) and the v3 Business type wording have not been measured.

## Actual spend

These are costs computed from the token usage each API reported, at list prices, with batch discounts applied where used.

| Item | USD |
|---|---|
| Pilots, 6 models, standard API | 0.735 |
| Opus probe, 20 applications. Discarded: run before Business type became multi-value | 2.461 |
| Sol probe, 20 applications. Discarded, same reason | 0.180 |
| Briefs, 4 candidates × 200, plus 1 retry | 1.956 |
| GPT-6 Sol reference, 200 (batch) | 1.465 |
| Claude Opus 5.5 reference, 60 (standard API, warm cache) | 2.057 |
| GPT-6 Luna × 3 (batch) | 0.104 |
| GPT-5.6 Luna × 3 (batch) | 0.222 |
| Claude Haiku 4.5 × 3 (standard API, warm cache) | 2.028 |
| Diagnostic: GPT-6 Luna low, direct × 3 (batch) | 0.168 |
| Diagnostic: GPT-6 Luna medium, direct × 3 (batch) | 0.218 |
| **Total** | **11.595** |

## Caching and prompt size (for WP2)

- **Prompt size.** The classification prompt carries every definition, about 19k tokens on OpenAI's tokenizer, 35k on Opus/Sonnet and 23k on Haiku.
  - Synonyms are left out of the prompt; they stay in the seed for the tag picker.
  - Every call pays for this prefix, so caching decides the cost.
- **OpenAI (GPT-6 Sol and Luna, GPT-5.6 Luna):**
  - Put an explicit `prompt_cache_breakpoint` after the developer message and set `prompt_cache_options.mode: "explicit"`.
  - This gave 99.5–99.8% cache hits on the batch API and on standard calls.
- **Anthropic:**
  - The Batch API cached poorly: a 20-request Opus probe read only 25% of the prefix from cache, even with a 1-hour TTL and a warm cache.
  - Standard calls, with one request first to write the cache and then 4–6 concurrent requests, read 98–99.8% from cache.
  - Use the standard API for Anthropic.

**Backfill cost** for about 3,150 applications, 3 runs each, from observed usage:

| Setup | Backfill cost |
|---|---|
| GPT-6 Luna, low, direct, batch | about **$2.60** ($0.00084 per application) |
| GPT-6 Luna, low, with the brief, batch | about $2.20 |
| GPT-6 Luna, medium, direct, batch | about $3.40 |
| New submissions on the standard API (twice the batch rate) | about $0.0017 per application |
| For comparison: Haiku 4.5, standard API | about $39 |
| For comparison: Sonnet 5, standard API | about $135 (estimated from its pilot) |

## Decisions (formerly open questions)

1. **Run-to-run bar:** accepted as is. 2–1 splits go to `needs_review`. Sonnet 5 was not tested and definitions were not re-measured.
2. **Input:** classify directly. No brief is generated now; the vector-search plan generates briefs when it needs them.
3. **Business type wording:** the tightening was not applied, and "most companies have one" was removed.

## Notes for later work packages

- **`lib/taxonomy/classification-prompt.js` takes a seed-shaped object.**
  - WP2 should build it from the active database taxonomy (WP1's `buildFamilyTree`), not the file.
  - WP2 should record the database taxonomy version rather than `seed.version`.
  - Tag names must stay unique within each family. The seed test enforces this.
- **Resolving model output.** `resolveClassification` maps names to ids and drops listed ancestors. WP1's `collapseToMostSpecific` in `lib/taxonomy/tree.js` covers the same ground; WP2 can consolidate.
- **Rerunning the reference.** The frozen reference set is the regression check for any future taxonomy, prompt or model change. Rerunning the 60 cross-vendor items costs about $2.10 (Opus) + $0.45 (Sol).
