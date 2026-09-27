# Where categories are used today

Every place `companies.category` (primary) and `companies.secondary_category` (JSON array) are stored, written, read, shown, filtered or exposed.

- Surveyed on main at `d346bbd5` (2026-09-25). Line numbers drift, so search by name.
- Managed list keys: `category` (primary) and `subcategory` (secondary).
- Directory cache rows hold the primary as a one-element array.
- **`src/islands/ApplicationFormIsland.jsx` is detected as binary**, so the zsh `grep` function silently skips it. Search it with `/usr/bin/grep -a`.

## 1. Storage and schema

- **Tables:**
  - `lib/cache-manager.js` ~4759: `CREATE TABLE companies` (`category TEXT`, `secondary_category TEXT`). No separate migration file exists.
  - `docs/database-schema.md` ~307: schema doc, also served to MCP.
  - `scripts/migrate-member-data-query-views.sql` ~85: `companies_public` view (member-tier MCP) exposes both.
  - `lib/data-query/member-policy.js` ~84: `companies_public` allowlisted; managed list tables also allowed (~47).
- **Managed lists:**
  - `lib/managed-lists-config.js`: `DEFAULT_PRIMARY_CATEGORY_PAIRS` / `DEFAULT_SECONDARY_CATEGORY_PAIRS` (the descriptions are prompt text), `mapCategorizerPairs()`, and list definitions `category` ("Category") and `subcategory` ("Secondary Category").
  - `lib/cache-manager.js`:
    - ~4081 and ~4095: DDL for `managed_list_definitions` / `managed_list_items`
    - ~30195 `syncManagedListDefinitions`: seeds with `INSERT OR IGNORE`, so **code changes don't update existing rows**
    - ~30284 `getManagedLists`
    - ~30490 `updateManagedListItemReferences`: renames rewrite `companies.category` and the JSON arrays
    - ~30620 `getCategoryAndSecondaryCategoryColorMap`
- **Admin list editing:**
  - API in `routes/admin.js`:
    - ~1262 `GET /api/lists`
    - ~1277 `POST /api/lists/items`
    - ~1308 `PATCH /api/lists/items/:id` (a rename triggers the reference rewrite)
    - ~1358 `DELETE /api/lists/items/:id`
    - ~1381 `POST /api/lists/reorder`
  - UI: `src/islands/ListsAdminIsland.jsx`, mounted at `AdminDashboardIsland.jsx` ~1855.
  - Colours: `routes/index.js` ~1413 `/api/lists/category-colors`, ~1424 `/api/lists/color-map`.
- **Airtable-era field names** (`'Category'`, `'Secondary Category'`, `'Secondary Categories'`):
  - `lib/agent/data-service.js` 13–28, 76–77, 116–126, 132, 186
  - `lib/cache-manager.js` ~32561 `getCompanySelectOptions` (distinct values, not the managed list), ~46645 `getCompaniesForPublicEmbed`, ~27312 `COMPANY_MERGEABLE_FIELDS`
  - `lib/agent/schema-description.js` 22–23, 50, 67
  - `lib/agent/services/insights-service.js` ~15

## 2. Writers

- **Categorizer:**
  - `lib/ai-categorizer.js` (prompts, a hardcoded redundant-secondary map, `getCategories()`, exported code defaults)
  - `lib/ai-helper.js` ~829 `categorize()`
- **Shared write helper:** `lib/company-categorization.js` `generateAndSaveCompanyCategory`. It fills only empty fields unless `force` is set.
  - Its only runtime caller is `routes/application-forms.js` ~5830, on first submit.
  - No backfill script exists.
  - `lib/scheduled-tasks.js` ~11 and `routes/screening-review.js` ~38 import `AICategorizer` but never use it.
- **Applicant side:** `routes/application-forms.js` ~4639 `GET /api/company-profile/options` and ~4779 `POST /api/company-profile/update`, which writes both fields.
- **Admin header:** `routes/admin.js` ~3761 `PATCH /api/sourcing/company/:id` (`category`, `secondaryCategories`), used by `UnifiedRecordIsland.jsx` ~1243.
- **MCP writes:**
  - `lib/data-query/write-contracts.js`:
    - ~999–1005: writable columns
    - ~980: `category` in `whereColumns`
    - ~1077: afterWrite `validateCompanyCategory`
    - ~1080–1088: notes
    - ~1872–1950: `managed_list_items` contract
  - `lib/data-query/mutation-executor.js`:
    - ~125: `secondary_category` in `COMPANY_JSON_ARRAY_COLUMNS`
    - ~542–570: `hookValidateCompanyCategory`
    - ~1323: rename references
- **Merge:**
  - `lib/cache-manager.js` ~27305 `COMPANY_MERGEABLE_FIELDS`
  - `lib/company-dedupe.js` 47, 57, 90
  - `routes/admin.js` ~3391, ~3482
  - Coverage test `__tests__/lib/company-merge-coverage.test.js` ~84

## 3. Backend readers and APIs

- **Company and application endpoints:**
  - `routes/admin.js` ~2776 `GET /api/sourcing/company/:id` (category, secondaryCategories, option lists)
  - `routes/screening-review.js`:
    - ~1384 `/api/application-details`
    - ~2774 and ~2903 `/api/companies/votes`
    - ~3471 and ~3653 `/api/companies`, via `getCompaniesByIdsForStageList` (`lib/cache-manager/companies-applications.js` ~1803)
  - `routes/diligence.js` ~1406, ~1884 (`unified-load`), ~2106 (`company-review/overview`)
  - `routes/application-forms.js` ~2668 `buildEntrepreneurDashboardResponse`
  - `routes/meetings.js` ~578 (sent but not rendered)
  - `routes/pipeline-management.js` ~670 `/api/pitch-history` (via `getCompanyEventHistoryRows`, `lib/cache-manager.js` ~33356)
  - `routes/homepage.js` ~745: pipeline snapshot. Its builder is `lib/cache-manager/pipeline-snapshot.js` ~129, which uses category as the tagline fallback.
- **Admin companies, portfolio and directory:**
  - `routes/companies-admin.js`:
    - ~2385 directory, with `categories` / `secondaryCategories` filters; `getSourcingCompaniesPagedFromDirectory` is at `lib/cache-manager.js` ~34014, search ~34242, sort ~34265
    - ~2420 `directory-filter-options` (`getAdminDirectoryFilterOptions` ~34310)
    - ~2457 portfolio (`listAdminPortfolioCompanies` ~18489)
    - ~2542 portfolio detail (~19057, ~19303)
  - `routes/admin.js` ~2662 and ~2694 `/api/sourcing/companies|applications`
  - `routes/index.js` ~2417 `/api/explore-companies` (member-only; `_buildExploreCompaniesCache` ~34606)
- **Directory cache builders:**
  - `lib/cache-manager.js` ~35123, ~35327
  - `lib/cache-manager/incremental-cache.js` ~236, ~423
  - `lib/company-admin-rollups.js` 70–71
- **Admin grid field registry:**
  - `lib/admin-grid-config.js`:
    - ~311: deployment rollup source
    - ~553: Investments `category`
    - ~616, ~632–633: Companies (both marked `multi_select`)
    - ~686, ~694–695: Applications
    - ~799–800: Portfolio
  - Grid rows and options in `lib/cache-manager.js`:
    - ~35836: cheap field keys
    - ~45406, ~45425, ~45452 (`_getCompanyGridManagedFilterOptions`), ~45490, ~45523
    - ~45821, ~46004, ~46305, ~46558: base row builders
  - `docs/ai-relationship-registry.json` ~1854, ~4094, ~4176
  - `scripts/seed-admin-grid-default-views.js` ~173, ~223, ~233. Saved views stored in the DB also reference these keys.
- **Reports and exports:**
  - `routes/admin.js` ~11877 `/api/metrics/portfolio/investments-by-category` (`getInvestmentsByCategory` ~8004, "Uncategorized")
  - ~12480 XLSX ("Primary Category", sheet "By Category")
  - **Not company category, so leave alone:** `routes/admin.js` ~11774 and ~12411, which are the investment type.
- **Public embed:**
  - `routes/embed.js` 53–54 (`primary_category`, `secondary_categories`), 113–123, 521, 537, 688 (JSON-LD), 710, 871, 930 (API docs)
  - `routes/view-builder.js` 23–25 `VALID_FIELDS` (the `embed_views` table stores field names)
  - `public/embed/widget.js` 272, 327, 471
  - `scripts/test-embed-security.js`
  - External consumer: `~/dev/e8angels-com` (`scripts/import-portfolio.mjs`, Sanity `src/sanity/schemas/portfolioCompany.ts`)
- **Other readers:**
  - `lib/cache-manager/companies-applications.js` ~2015 `getCompanyCategoriesForAI`, ~2052 `searchCompaniesForAI`, ~2130, ~2186
  - `lib/cache-manager/insights.js` 21–28 (primary or `json_each(secondary)`), 63, 905

## 4. AI surfaces

- **AI Insights:**
  - `lib/cache-manager/application-insights.js` ~236 `getSimilarCategoryApplications` (exact primary match), ~311, ~334 (`primary_category` in the bundle), ~230 `companyForEvidence`
  - Prompt: `docs/application-insights-prompt.md` ~159 and ~167–174
    - The runtime copy is in the `diligence_prompts` table (token `screening_review`)
    - It is stored by `scripts/migrate-application-insights-prompt.js`
    - It is served over MCP by `get_application_insights_prompt` (`lib/mcp/data-query-server.js` ~363, ~784)
  - Tests: `__tests__/lib/application-insights.test.js` ~98–156
- **Ask AI / Portfolio Insights:**
  - `lib/agent/services/category-service.js` 1–90 (hardcoded `PRIMARY_ALIAS_MAP`, including "Energy Efficiency")
  - `lib/insights/semantic-catalog.js` 4, 41–46, 94–97 (`company.category`)
  - `lib/insights/query-plan-compiler.js` 26
  - `lib/agent/tools/portfolio-investment-query.js` 273, 284
  - `lib/agent/tools/insights.js` (many; list, resolve, and by-category tools)
  - `lib/agent/services/insights-service.js` (many; aggregate, leaders and screening by category)
  - `lib/agent/tools/query.js` 14–15, 51, 85, 178–208 (aliases "sector" and "industry" → Category), 260, 442–506, 599–626
  - `lib/agent/runtime.js` 14–31
  - `lib/insights/instructions.js` 42
  - `data/insights-suggested-questions.json` 2–6
  - `lib/insights/evals/cases.json` 49, 379–504. Many other `"category"` keys there are eval buckets, not company category.
- **Dead code:** `lib/portfolio-tools.js` is required nowhere.
- **RAG does not use company category.** Its `category` means chunk type. Leave these alone:
  - `lib/rag-indexer.js`, `lib/rag-chatbot.js`
  - `scripts/create-qdrant-indexes.js`
  - `lib/route-helpers.js` ~403
  - `lib/diligence-report-doc/source-retrieval.js`
  - `lib/diligence-context-format.js`
- **Diligence authoring prompts:** no company-category use.

## 5. MCP

- `lib/data-query/docs-loader.js` 6–10 serves the schema, glossary, instructions and registry docs.
- **Glossary** `docs/data-query-glossary.md`: ~231 ("sector tags"), ~434, ~475, ~599, ~634.
- **Registry and contracts:** sections 2 and 3.
- **Member view:** `companies_public`.
- **Other docs:** `docs/mcp-member-tier-plan.md` ~182 and `docs/research/write-contracts/*`.

## 6. Frontend display

- **Company page and application flyout** (`src/islands/UnifiedRecordIsland.jsx`):
  - ~352 form state
  - ~483, ~1031: loading
  - ~780, ~1003: form seeding
  - ~1101: patch and optimistic update
  - ~1395 and ~1603: header shows the primary only, as hand-written slate pill markup (not `CategoryPill`)
  - ~1537–1555: editor ("Primary category" select, "Secondary Categories" `MultiSelectPicker`)
- **Applicant dashboard** (`ApplicationFormIsland.jsx`, binary-detected):
  - ~1369, ~1437, ~2784, ~2911, ~2951
  - copy at ~5791 and ~6627
  - ~5849 tags, ~5978–6005 editors, ~6682 summary rows
- **Admin companies** (`src/islands/CompaniesAdminIsland.jsx`):
  - ~82, 87, 650, 1114, 3383: colour map
  - ~685: patch
  - ~840: grid pills
  - ~1521: portfolio pills
  - ~1699: portfolio detail header
  - ~228 `EMPTY_ADVANCED`
- **Record grid** (`src/components/record-grid/RecordGrid.jsx`):
  - ~108, ~691: formatting
  - ~756: `CategoryPill` cell
  - ~2332: labels "Sector (primary)" / "Sector (secondary)"
  - ~2492: profile domain
- **Explore Companies** (`src/islands/ExploreCompaniesIsland.jsx`): ~186 CSV columns, ~203 pills, ~303 colour maps, ~887.
- **Stage Review** (`src/islands/StageReviewIsland.jsx`): ~70 `normalizePrimaryCategory`, ~1219 pill.
- **Pitch History** (`src/islands/PipelineMgtPitchHistoryIsland.jsx`): ~41, ~128, ~494, ~677 headers, ~793 pills.
- **Metrics** (`src/islands/AdminMetricsIsland.jsx`): ~1865 "By Category", ~2469 header, ~2562 rows linking to Explore, ~1379, ~2304. **~628 is investment type; leave it alone.**
- **Shared:** `src/components/CategoryPill.jsx` and `src/lib/category-colors.js`.
- **View Builder** `src/islands/ViewBuilderIsland.jsx` 60–61, 69.
- **Imported but not rendered:** `MeetingPlaybackIsland.jsx` (`showCategory`) and `PipelineSnapshotTile.jsx` ~130 (tagline fallback).

## 7. Frontend filters and search

- **Admin grids:** filter, group and sort through `admin-grid-config.js`; options come from managed lists (`lib/cache-manager.js` ~45452).
- **Explore Companies:**
  - ~145: URL `category` param
  - ~322 and ~834: "Category" dropdown
  - ~409: advanced options
  - ~649: Category / Secondary multi-selects
  - ~492: text search covers both
  - ~573: placeholder
- **Stage Review:** ~363, ~392, ~1089: "Primary Category" filter.
- **Pitch History:** ~286 search, ~618 placeholder.
- **Metrics:** ~56 `buildExploreCompaniesUrl({category})`.
- **Backend-only filters:** directory and portfolio endpoints accept `categories` / `secondaryCategories`, but no frontend sends them.
- **Embed widget:** ~471 search.

## 8. Tests that reference these fields

- `__tests__/company-categorization.test.js`
- `__tests__/lib/application-insights.test.js`
- `__tests__/lib/insights-query-plan-executor.test.js`
- `__tests__/lib/insights-query-plan-compiler.test.js`
- `__tests__/lib/insights-evals.test.js`
- `__tests__/lib/insights-suggested-questions.test.js`
- `__tests__/lib/insights-catalog-tools.test.js`
- `__tests__/lib/cache-manager-companies-admin-grid-rows.test.js`
- `__tests__/standalone/test-admin-grid-fast-company-rows.js`
- `__tests__/lib/admin-grid-companies-redesign.test.js`
- `__tests__/dynamic-rollups.test.js`
- `__tests__/src/record-grid-search.test.js`
- `__tests__/unified-company-application-view.test.js`
- `__tests__/src/unified-record-edit-seed.test.js`
- `__tests__/src/ApplicationFormIsland.test.js`
- `__tests__/routes/screening-review-companies-payload.test.js`
- `__tests__/routes/diligence.test.js`
- `__tests__/routes/admin-sourcing-company.test.js`
- `__tests__/lib/member-tier-views.test.js`
- `__tests__/lib/data-query-read-executor.test.js`
- `__tests__/lib/cache-manager-public-embed-website-blurb.test.js`
- `__tests__/pipeline-snapshot.test.js`
- `__tests__/lib/company-merge-coverage.test.js`
- `__tests__/lib/scheduled-tasks-*` (they mock `ai-categorizer`)
- `scripts/test-embed-security.js`

## User-visible labels to replace

| Label | Where |
|---|---|
| "Category" | `admin-grid-config.js` 311, 553, 632, 694, 799; `managed-lists-config.js` ~197; merge fields; Explore ~186, ~652, ~834; Pitch History ~677; applicant summary ~6682; write-contract uiLabel |
| "Secondary Category/Categories" | `admin-grid-config.js` 633, 695, 800; `managed-lists-config.js` ~207; Explore ~187; Pitch History ~678; `UnifiedRecordIsland.jsx` ~1550; applicant ~5995; View Builder ~61 |
| "Primary Category/category" | Metrics ~2475; Stage Review ~1093; XLSX `routes/admin.js` ~12486; `UnifiedRecordIsland.jsx` ~1538; applicant ~5978; View Builder ~60; categorizer prompt |
| "No primary category" | `UnifiedRecordIsland.jsx` ~1540 |
| "By Category" | Metrics ~1865; XLSX sheet |
| "Primary industry category" / "Additional category tags" | Embed API docs, `routes/embed.js` ~871, ~930 |
| "Uncategorized" | `cache-manager.js` ~8105, ~8131; insights-service; glossary ~600 |

## Members' "Sectors of Interest" (`people.sector_most_interested`)

- **Hardcoded copies of the old list:**
  - `lib/admin-grid-config.js` ~39
  - `src/islands/EditPersonIsland.jsx` ~79
  - `src/components/ProfileReviewDialog.jsx` ~29
- **Collected in:**
  - `MembershipDashboardIsland.jsx` ~824, which posts to `routes/index.js` ~1898–1965
  - the admin person editor
  - the profile review dialog
- **Shown in:**
  - `MemberProfileIsland.jsx` ~652
  - the member directory
  - `routes/homepage.js` ~475, ~533
- **Also referenced by:**
  - `lib/data-query/write-contracts.js` ~767
  - `docs/ai-relationship-registry.json` ~3914
  - `docs/data-query-glossary.md` ~114
  - `lib/cache-manager/people-identity.js` ~1626 (`'Sector - Most Interested'`)

## Unrelated "category" uses (leave alone)

- Email template category
- Annual Fund ledger categories
- Stack-rank category
- Screening vote categories
- Membership category
- Meeting recording display category
- Audience builder categories
- RAG chunk category
- Investment-type category in Metrics
