---
title: "Dynamic Rollups and AI View Assist"
status: draft
owner: jordan
created: 2026-05-24
last_updated: 2026-05-25
---

# Dynamic Rollups and AI View Assist

## 1. Purpose

Build an AI-assisted view builder backed by a dynamic relationship and derived-field engine. The first product surface will be company/application-centric, but the infrastructure should support later People, Partner, and other row-base interfaces without rewriting the core engine.

The goal is for staff to ask questions in plain English, such as:

- "Show me portfolio companies that have interest in the built environment and pitched in the last 10 years."
- "Show me companies that have offered warrants."
- "Show me partners whose primary contact received a message in the last year."
- "Show me people from Kentucky."

The system should either create a saved view, propose a missing derived field/rollup, or create a safe query-backed view when the answer requires relationship traversal that the current configured grid cannot express directly.

There is only one user-facing product concept: **views**. Users should not see or need to understand a distinction between "normal views" and "reports." Internally, every saved view must become executable as a structured query plan before this feature is considered complete.

## 2. Product Scope

### Phase 1: Company/Application Assist

The first release is intentionally company/application-centric:

- Row base is Companies.
- Related data comes from Applications, Company Events, Deployments, Instruments, People/contact data, pitch/application fields, and documented derived fields.
- The AI may propose or create missing company-centered rollups.
- Deployment-centric views are not a priority because deployment questions should generally be reachable through Companies or People.

### Phase 2: Parallel Row Bases

After the company/application version is reliable, add parallel first-class surfaces:

- People-centric assist.
- Partner-centric assist.
- Other row bases only when staff workflows justify them.

Each surface should have its own default views, field vocabulary, permissions, and row-base assumptions. Do not force People or Partner questions into a Companies view.

### Phase 3: Unified Query-Backed Views

For questions that do not fit a configured grid, support query-backed saved views:

- AI proposes a validated query plan.
- The view renders in the same table UI with generated field metadata.
- Saved views store structured query plans, generated columns, owner, permission scope, and audit metadata.
- Existing saved views are backfilled into equivalent row-base-only query plans.
- The UI never labels these as reports. Query-backed execution is an implementation detail.

## 3. AI View Assist UX

AI Assist opens from the view-builder rail. It combines explicit mode controls with a conversational prompt:

| Mode | Meaning | Starting context |
|---|---|---|
| New view | Create a saved view from the request | Default table definition |
| New from current | Duplicate the current view, then apply changes | Current saved view plus unsaved state |
| Edit current | Modify the loaded view | Current view; save/update permissions apply |

The modal also includes save scope:

- Personal.
- Shared, only when permissioned.

The AI returns one of:

| Outcome | Purpose |
|---|---|
| `clarification_required` | Ask a targeted question before generating a view. |
| `proposal` | A saved-view payload for an existing configured grid. |
| `rollup_proposal` | A missing derived field that can be created, then used in a view. |
| `query_view_proposal` | A safe query-backed saved view when relationships or joins are needed. |
| `needs_engineering` | A relationship, JSON path, permission, or schema issue must be documented or implemented first. |

No proposal is saved until the user confirms. Preview applies the proposed state locally without saving.

## 4. Architecture

### 4.1 Shared Schema Source

Use the same canonical schema and semantic sources as the data-query skill:

- `docs/database-schema.md`
- `docs/data-query-glossary.md`
- data-query read-only safety patterns: SELECT/CTE only, denylists, limit caps, timeouts, and audit logging.

Do not make the authenticated admin route call `/api/data-query/*` over HTTP with a bearer token. Share the underlying schema/glossary loaders or factor a common module used by both data-query and AI Assist.

### 4.2 Relationship Graph

Create a durable relationship registry. It should document:

- hard foreign keys
- soft foreign keys
- join tables
- JSON paths
- computed paths
- cardinality
- labels and reverse labels
- permission scope
- confidence/review status
- caveats

Initial storage can be a checked-in JSON or YAML file for reviewability. Move to DB-backed metadata later if an admin UI needs to manage it.

Relationship edge shape:

```json
{
  "key": "company_applications",
  "from_table": "companies",
  "from_field": "record_id",
  "to_table": "applications",
  "to_field": "company_record_id",
  "relationship_type": "one_to_many",
  "label": "Applications",
  "reverse_label": "Company",
  "permission_scope": "admin.companies.view",
  "join_kind": "direct",
  "notes": "Applications submitted by this company."
}
```

### 4.3 Semantic Field Registry

Document business names and synonyms for fields and JSON paths. This is separate from table structure.

Example: Deal Terms metadata should expose typed paths for concepts like:

- warrant coverage
- valuation cap
- discount
- instrument type
- round size
- closing date

This lets a user ask "show me companies that have offered warrants" and the system map that to a company row base, related applications, and a documented deal-terms JSON path.

### 4.3.1 No Example-Specific Planner Code

The example prompts in this plan are test cases for general capability, not product requirements to special-case. Do not add deterministic planner branches, regex fallbacks, hard-coded field mappings, or phrase-specific repairs for examples such as "built environment", "warrants", "Kentucky", "primary contact received a message", founder demographics, or any future ad hoc prompt used during testing.

Correct implementation path:

- Put durable business semantics in the relationship registry, semantic field registry, data-query glossary, or schema metadata.
- Let the AI planning loop discover those semantics through tools and compile a structured plan.
- If metadata is missing, return `needs_engineering` with the missing relationship/path/semantic documentation task.
- If the term is ambiguous, return `clarification_required`.
- Add tests that use representative prompts to prove the generic metadata/tooling path works, and add negative tests that fail if an example prompt succeeds only because of phrase-specific application code.

An implementation is not release-ready if representative examples pass because application code recognizes the example wording. The examples must remain useful as unbiased probes of the architecture.

### 4.4 Derived Field Definitions

Persist derived fields as structured metadata, not free-form SQL.

Example:

```json
{
  "row_base": "companies",
  "name": "Has offered warrants",
  "result_type": "boolean",
  "path": [
    { "from": "companies", "to": "applications", "edge": "company_applications" }
  ],
  "source_field": {
    "table": "applications",
    "field": "deal_terms_metadata_json",
    "json_path": "$.warrants"
  },
  "filters": [
    { "field": "applications.deal_terms_metadata_json.$.warrants", "operator": "is_present_or_true" }
  ],
  "aggregate": "any"
}
```

The compiler can turn this into safe SQL or an internal execution plan. The persisted definition remains reviewable, permissionable, migratable, and repairable.

### 4.5 Query-Plan Compiler

The compiler validates and executes structured derived-field and saved-view definitions. It must reject:

- unsafe tables
- sensitive fields
- unbounded joins
- ambiguous relationship paths
- invalid JSON paths
- unsupported aggregations
- missing permissions
- result sets that cannot produce a stable row identity

## 5. Current Rollup Migration

The current advanced rollup system is proof of concept but still configured in code:

- `ROLLUP_SOURCE_TABLE_KEYS_BY_TABLE`
- source field arrays in `lib/admin-grid-config.js`
- `_loadAdminGridRollupSourceRows()`
- `_getAdminGridRollupTargetKeys()`
- `_evaluateAdminGridAdvancedRollupField()`

Migrate rather than maintain two systems indefinitely.

### Migration Phases

1. Inventory current rollups.
   Export configured source tables, source fields, system custom fields, and existing `admin_grid_custom_fields` rollups.

2. Seed the relationship registry.
   Cover existing hard-coded paths: companies/applications, companies/deployments, companies/company events, companies/instruments, people/companies, people/deployments, instruments/deployments, portfolio/company relationships.

3. Build compatibility compilation.
   Translate existing rollup config JSON into the new derived-field format and compile it through the new engine.

4. Shadow-run.
   Compute legacy and new values side by side in tests and on local/staging sample data. Diff results.

5. Dual-read behind a flag.
   Enable the new engine per table or per field, with rollback to legacy evaluation.

6. Migrate persisted definitions.
   Backfill existing custom rollups to the new definition shape while preserving field keys, names, saved views, and permissions.

7. Remove legacy paths.
   Delete the old hard-coded source/target/evaluator code only after parity tests cover migrated fields.

Field keys must remain stable. Existing saved views must be migrated/backfilled into query-plan-backed saved views rather than preserved as a permanent second execution path.

## 5.1 Saved View Unification

This is a required completion gate, not a follow-up cleanup.

Target state:

- `admin_grid_views` is the user-facing saved-view table.
- Every saved view has a `query_plan_json` or an equivalent derived query plan.
- Existing simple saved views compile to row-base-only query plans.
- AI-created relationship views save into the same user-facing view list as existing views.
- The UI always says "view"; it never says "report" for this feature.
- Any separate query-view table or code path is temporary scaffolding and must be collapsed before the feature is considered complete.

Migration requirements:

1. Add query-plan storage to saved views using a manual migration SQL script.
2. Backfill every existing saved view into an equivalent query plan:
   - `row_base` from the grid table key.
   - `columns` from saved view columns.
   - `filters` from saved view filter conditions.
   - `sorts` from saved view sorts.
   - `groups` from saved view groups.
   - row colors remain presentation metadata on the view.
3. Update AI confirmation so all confirmed proposals create or update `admin_grid_views`.
4. Update row loading so it prefers query-plan execution and derives a plan from legacy saved-view fields only as a compatibility fallback.
5. Add a parity script that compares legacy saved-view output against query-plan output for current saved views.
6. Run parity locally/staging and review any intentional differences.
7. Remove user-facing "report" language and separate report sections from the grid UI.

Acceptance gate:

- A user sees only one kind of saved item: a view.
- Existing views still work.
- AI-created cross-table views appear and behave like ordinary views.
- Query-plan execution supports the current saved-view feature set: column projection, filters, sorts, groups, row colors, and one-hop related filters.
- The migration/backfill script exists and has been run on representative data.
- Parity output is clean or every difference is explicitly reviewed.

## 6. Schema Inventory

Before broad AI-created rollups ship, inventory every table and classify what is intrinsically understandable and what needs documentation.

| Classification | Meaning | Example |
|---|---|---|
| Intrinsic | Relationship/field is obvious from names and ID conventions. | `applications.company_record_id -> companies.record_id` |
| Soft FK needs confirmation | Looks relational but SQLite does not declare it or naming is ambiguous. | `person_record_id`, Airtable legacy IDs |
| JSON needs documentation | Values live inside JSON and need path/type/meaning docs. | Deal Terms wizard metadata |
| Polymorphic/contextual | Meaning depends on type columns or companion fields. | communications, notes, events, deployments vs returns |
| Sensitive/restricted | Exists but should not be AI-queryable or should be masked. | auth/OAuth/session fields, restricted investor details |
| Deprecated/internal | Exists but should normally be ignored. | caches, migration artifacts, CRDT state |

Deliverables:

- Inventory script that reads live schema and emits tables, fields, JSON-looking columns, ID-looking columns, and relationship guesses.
- Reviewed relationship registry file, initially `docs/ai-relationship-registry.md` or `docs/ai-relationship-registry.json`.
- Updates to `docs/data-query-glossary.md` for business terminology and synonyms.
- Test fixtures for ambiguous examples.

## 7. AI Orchestration

The model should be able to ask for schema slices instead of receiving one enormous prompt.

Tool-style operations:

| Operation | Returns |
|---|---|
| `list_schema_domains` | Staff-facing table/domain groups and descriptions. |
| `describe_tables` | Columns, types, indexes/keys, value summaries, relationship hints. |
| `find_related_fields` | Candidate paths from a row base to a requested concept. |
| `list_view_ready_fields` | Existing fields available in saved-view payloads. |
| `plan_rollup_field` | Derived field definition, source path, aggregation/filter logic, result type. |
| `validate_view_payload` | Existing saved-view validation. |
| `validate_derived_field` | Relationship/path/permission/aggregation validation. |
| `compile_query_plan` | Safe internal query plan for saved views or derived fields. |

Prompt rules:

- Explore full schema when needed.
- Prefer existing view-ready fields when accurate.
- If a needed field is missing, investigate and propose a derived field instead of refusing.
- Do not silently approximate if it changes meaning.
- Keep user-facing summaries in plain English.
- Keep raw schema details in the orchestration layer.
- Ask for clarification when business terms map to multiple definitions.

## 8. Example Flows

### Built Environment Portfolio Pitches

User asks for portfolio companies with built-environment interest that pitched in the last 10 years.

Expected behavior:

- Row base: Companies.
- Clarify whether "built environment" means sector only or application text too.
- Use existing fields where available.
- Propose/create missing derived fields if pitch-date or text-search helpers are missing.
- Save as a Companies view.

### Companies That Offered Warrants

User asks for companies that have offered warrants.

Expected behavior:

- Infer company row base.
- Traverse Companies -> Applications.
- Use documented Deal Terms JSON metadata.
- If warrant path exists, propose/create `Has offered warrants`.
- If path is undocumented, return `needs_engineering` with a registry documentation task.

### Partners Whose Primary Contact Received A Message

User asks for partners whose primary contact received a message in the last year.

Expected behavior after Partner surface exists:

- Row base: Partners.
- Traverse Partner -> Primary Contact Person -> Messages.
- Create or use a derived boolean/date field.
- Save as a Partner view.

Before Partner surface exists:

- Return a query-backed view proposal or a `needs_engineering` response, depending on whether the needed row base and relationships are available.

## 9. Implementation Plan

1. Extract schema/glossary loaders shared with data-query.
2. Generate schema inventory and relationship guesses.
3. Create reviewed AI relationship registry.
4. Build derived-field definition schema and validator.
5. Build query-plan compiler for safe joins, filters, aggregations, and JSON paths.
6. Translate existing hard-coded rollups into new definitions.
7. Shadow-run legacy vs new rollups.
8. Add AI Assist endpoint returning clarification/proposal JSON.
9. Add Company/Application AI Assist UI.
10. Add rollup proposal/confirmation flow.
11. Add query-backed view execution for row-base-only views and one-hop relationship filters.
12. Add saved-view query-plan storage and manual migration SQL.
13. Backfill existing saved views into query plans.
14. Merge AI-created query-backed views into the ordinary saved-view list.
15. Remove user-facing report language and any separate report selector.
16. Add saved-view parity script and run it against representative data.
17. Migrate persisted custom rollups.
18. Remove legacy hard-coded rollup paths after parity.

## 9.1 Current Implementation Status

As of 2026-05-25, the implementation has moved well beyond the original mockup stage but is not complete enough to ship without a focused hardening pass.

Completed or substantially implemented:

- Shared docs loading exists for AI/data-query context.
- `docs/ai-relationship-registry.json` exists and validates.
- Dynamic rollup modules exist under `lib/dynamic-rollups/`.
- AI Assist propose/confirm endpoints exist under the admin grid routes.
- The Companies grid has a chat-first AI Assist dialog with proposal-local "Make it" confirmation.
- AI-created query-backed views save into ordinary `admin_grid_views`, not a separate user-facing report list.
- Query-plan storage/backfill support exists in `scripts/migrate-schema.sql` and related scripts.
- Relative date filters exist in the filter UI and AI schema context, including rolling windows, offset dates, and period presets.
- Discrete option values are exposed to AI schema context for configured select/multi-select fields and managed-list backed fields such as company events.
- AI proposal normalization now repairs common model label/key mismatches before validation. Examples include mapping human-ish relationship/source/field labels such as `applications`, `instrument records`, `Gender`, `Invested $`, `deployments`, and `date` to validated keys such as `company_applications`, `company_instruments`, `gender`, `invested_amount`, `company_deployments`, and `investment_date`.
- Tests cover registry validation, dynamic rollup compilation, query-plan compilation, option-value validation, relative date normalization, AI proposal repair, and query-backed view confirmation.

Partially implemented and needs more hardening:

- The schema-slice/toolkit architecture exists, but the model still receives a large focused schema context in one prompt. The system should evolve toward true iterative tool use where the model can inspect domains, then request only relevant tables/fields/relationships.
- Relationship and field resolution is now generalized, but it remains heuristic. It needs broader fixtures across unrelated row bases and ambiguous terms so it asks clarification questions instead of over-matching.
- Query-backed execution currently supports row-base-only views and one-hop related filters. Multi-hop paths, JSON-path predicates, richer joins, and generated related-value columns need more work.
- Derived fields are structured and validated, but the legacy rollup evaluator is still present as compatibility scaffolding.
- Existing saved views can be represented as query plans, but parity must be run and reviewed on representative data before relying on query-plan execution as the only path.
- The AI can create some dynamic rollups and query-backed views, but prompt robustness needs adversarial testing with staff-like requests that were not anticipated during implementation.
- Browser/UI verification has been opportunistic, not a complete end-to-end acceptance run.

Known remaining completion gates:

1. Run the schema migration and backfill scripts on a representative dev/staging database, if not already applied in that environment.
2. Run saved-view query-plan parity and review every difference.
3. Run dynamic rollup parity for migrated custom rollups.
4. Expand the relationship registry and tests for any staff-facing relationships exposed by current admin grids.
5. Replace prompt-only schema delivery with a more explicit planner/tool loop, or otherwise prove the focused-context approach is reliable enough.
6. Harden ambiguous-term behavior: when two fields/relationships are plausible, the AI should ask a concise clarification question.
7. Remove or retire legacy hard-coded rollup paths only after parity is clean and rollback risk is acceptable.
8. Complete an end-to-end UI run: open AI Assist, ask for a normal field-only view, ask for a derived rollup view, ask for a query-backed relationship view, confirm each, reload, and verify the saved views render correctly.

## 10. Tests

Coverage should include:

- schema inventory freshness
- relationship registry validation
- JSON path validation
- permission and denylist enforcement
- legacy rollup parity
- ambiguous relationship rejection
- built-environment prompt
- companies with warrants prompt
- people from Kentucky prompt
- partners whose primary contact received a message prompt
- invalid model output repair/rejection
- saved-view payload validation
- saved-view query-plan validation
- legacy saved-view vs query-plan parity

## 11. Documentation Requirements

Update `AGENTS.md` so future agents maintain the AI relationship registry when schema or app behavior changes. Required updates:

- soft FKs
- relationship paths
- JSON metadata shapes
- polymorphic records
- permission boundaries
- deprecated/internal tables
- staff-facing business synonyms

This registry should be treated as the machine-usable companion to `docs/database-schema.md` and `docs/data-query-glossary.md`.
