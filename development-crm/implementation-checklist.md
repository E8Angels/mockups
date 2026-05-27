---
title: Development CRM Implementation Checklist
status: building
owner: implementation-orchestrator
created: 2026-05-27
last_updated: 2026-05-27
---

# Development CRM Implementation Checklist

Use this file as the durable implementation ledger. Keep it current as work is assigned, completed, blocked, or verified. Do not mark a workstream complete unless the implementation matches the accepted plan or a later user decision explicitly changed the plan.

Status markers:
- `[ ]` not started
- `[~]` in progress / partial
- `[x]` complete and verified
- `[!]` blocked or needs decision
- `[n/a]` intentionally removed from scope by user decision

## Current Truth After Plan Audit

- [~] The Development CRM is substantially implemented, but the full `plan.md` is not complete.
- [x] Core schema, CacheManager methods, portal routes, role resources, dashboard route, committee route, documents, reminders, email ingest, and data-query write endpoints exist in code.
- [x] Staff-facing UI exists and has received mockup-driven fixes for the wizard, drawer activity/task flows, committee dashboard details, and inline editing patterns covered by later user direction.
- [n/a] The left dashboard filter rail, `My Opportunities`, and `My Funders` quick filters were removed by later user direction. Kanban has no filter.
- [n/a] Kanban drag no longer opens a stage-note modal by later user direction. It updates the DOM optimistically and persists the new stage in the background.
- [n/a] The separate spreadsheet importer was removed from scope by later user direction. Test/import data should use governed data-query write support.
- [x] `DEVELOPMENT_CRM_TODO` audit: no markers found.

## Agent Workstream Ledger

| Workstream | Owner | Status | Evidence / notes |
|---|---|---:|---|
| Schema + docs | Codex | [x] | Tables, migration SQL, docs, glossary, AI registry, role-tag write-path recompute, `scripts/backfill-development-role-tags.js`, and the `development_role_tags_daily` scheduled term transition job exist. |
| CacheManager + routes | Codex | [x] | `lib/cache-manager/development.js` and `routes/development.js` cover funders, opportunities, contacts, supporters, amounts, notes, follow-ups, campaigns, documents, email ingest, stage changes, clone, and dashboard reads. |
| RecordGrid metadata + saved views | Codex | [x] | `development_opportunities` and `development_funders` metadata/base-row loaders exist. Default saved views now match the plan names/set, including current-user `My Opportunities` and `My Funders` filters via hidden lead id fields. |
| Staff dashboard UI | Codex | [x] | `/admin/development` exists with KPIs, E8 organization toggle, Kanban, RecordGrid List, Calendar Month/Week/Table modes, CSV export, wizard, and drawer. User removed left rail/filter scope. Browser smoke passed on the user-owned localhost server in the current authenticated session. |
| Funder/opportunity drawer | Codex | [~] | Drawer exists with funder header, tabs, opportunity side panel, relationship/opportunity Activity tab filtering, documents, notes with scope/date controls, React Save/Discard/Cancel guard for unsaved note tab navigation, task modal, completion-note modal, receipts, contacts, lead/support pickers, lightweight people-pill edit dialogs with full-edit links, edit dialogs, and loading treatment. Remaining: some plan inline-edit expectations. |
| New opportunity wizard + editing flows | Codex | [x] | Wizard exists with new/existing funder paths, full contact modal with staged add/edit/remove, required opportunity name, email format validation, lead picker, type-specific fields, currency formatting, multi-line cash/in-kind ask editor, TipTap description editors, funder description persistence, richer ask review, and create/open. |
| Activity, email, documents | Codex | [x] | Email ingest/linking, Drive-backed documents, upload/create/delete UI, proxy-safe open routes, notes, followups, receipt rows, Activity filter bar, relationship-level Activity tab, expandable inbound/outbound email cards, attachment metadata, and shared timeline visual treatments for files, money, stage, and reporting events exist. |
| Follow-ups + reminders | Codex | [~] | Follow-up storage, owner table, New task modal with owners, completion-note modal, completion endpoint, reminder script, scheduled job hook, reporting reminders, and supporter good-news notification code exist. Remaining: reminder/template production verification. Stage-change suggested follow-ups are out of scope after the later no-popup stage-change direction. |
| Board/development committee view | Codex | [x] | `/committees/development` exists with read-only KPIs, meeting-notes tile, Kanban snapshot, recent activity, upcoming dates, real committee members/upcoming meetings/documents tiles, Development CRM relationship/opportunity document surfacing, My connections, document search, and Log interaction. Browser smoke passed on the user-owned localhost server in the current authenticated session after fixing the document union query. |
| Data-query write support | Codex | [x] | `/api/data-query/development/preview` and `/execute` exist with token allowlist, confirmation, CacheManager routing, and mutation audit. Supports funder/opportunity/contact/task/note/amount/receipt/stage/support/campaign actions. |
| Spreadsheet import | Codex | [n/a] | Explicit user decision: no separate importer; use data-query write support for test/import data. |
| End-to-end verification | Codex | [~] | Focused source-contract tests, build, staff dashboard browser smoke, committee dashboard browser smoke, and dev real-Drive document create/open/upload/delete smoke passed after this audit. Remaining: role-by-role browser verification and true mobile device verification. |

## Plan Compliance Details

### 1. Schema, Docs, and Data Contracts

- [x] Migration SQL for development tables and indexes.
- [x] `createTables()` new-environment setup updated through `DEVELOPMENT_CRM_SCHEMA_SQL`.
- [x] CacheManager development domain module wired.
- [x] ID prefixes and normalization implemented in the development CacheManager module.
- [x] `docs/database-schema.md` updated.
- [x] `docs/data-query-glossary.md` updated.
- [x] `docs/ai-relationship-registry.json` updated.
- [x] Development permission resources and role mapping added.
- [x] Automatic role tags implemented in write paths.
- [x] Backfill script for development role tags.
- [x] Nightly role-tag recompute for sponsorship term transitions.

### 2. Backend Data Layer and Routes

- [x] Funder CRUD.
- [x] Opportunity CRUD.
- [x] Contact link/unlink.
- [x] Opportunity supporters CRUD.
- [x] Amount creation/update for ask/commit/receive and cash/in-kind.
- [x] Stage-change endpoint with stage event and optional note.
- [x] Notes CRUD with polymorphic parents and edit/delete route surface.
- [x] Follow-up/task CRUD with owner table support.
- [x] Campaign and campaign-goal reads/writes.
- [x] Activity feed reads.
- [x] Route-level permission checks.
- [~] Integration coverage is focused source-contract/API-method coverage, not complete browser/API end-to-end coverage.

### 3. RecordGrid Integration

- [x] `development_opportunities` metadata.
- [x] `development_funders` metadata.
- [x] Default saved views match plan names/set for Opportunity and Funder bases.
- [x] List view mounts separate RecordGrid instances by base table.
- [x] Opportunity row click opens the opportunity tab in the drawer.
- [x] Funder row click opens the drawer summary for the funder.
- [~] Per-base-table selected view persistence relies on existing RecordGrid behavior; not fully browser-verified here.

### 4. Staff Dashboard

- [x] `/admin/development` route and navigation entry.
- [x] KPI strip.
- [n/a] Left filter rail and quick filters removed by later user direction.
- [x] E8 organization filtering/toggle from plan is implemented as a dashboard control and reloads dashboard data from `/api/development/bootstrap?e8=...`.
- [x] Kanban columns and cards.
- [~] Lead avatar/photo behavior is initials-based; real profile-photo behavior was not verified.
- [x] Support line omitted when no supporters.
- [n/a] Kanban drag stage-note modal removed by later user direction.
- [x] List view uses RecordGrid workspace.
- [x] Calendar has Month/Week/Table modes, working previous/next/today navigation, compact weekday plus Sat/Sun-column month layout, and events for deadlines, reports, term dates, decisions, and follow-ups.
- [~] Mobile behavior has CSS support and narrow in-app viewport smoke passed; true mobile/device verification remains.

### 5. Funder and Opportunity Drawer

- [x] Right-side drawer over staff dashboard.
- [x] Funder summary with description, contacts, lead, and edit affordance.
- [x] Funder contact add uses a contact dialog with existing-person picker plus name, email, title, phone, and LinkedIn.
- [x] People pill name clicks open the lightweight edit contact dialog; only the mail icon opens email, and Full edit opens the Admin > People edit route in a separate window.
- [x] Opportunity tabs and Summary tab.
- [x] Activity tab exists with relationship and opportunity timelines, filters, note/task/email cards, and file/money/stage/reporting event treatments where those event types apply.
- [x] Opportunity detail left panel with stage, lead/support, requested/committed, due date, decision, receipts, and documents.
- [x] Requested/Committed save on blur; receipts use a Record receipt dialog.
- [x] Stage dropdown is inline.
- [n/a] Stage-change note modal removed by later user direction; stage dropdown persists immediately and staff can add a separate Activity note when needed.
- [x] Unsaved-note guard has browser unload protection plus a React Save/Discard/Cancel modal on drawer tab navigation.
- [~] Read-only rendering exists through permission gates, but role-by-role browser verification remains.

### 6. New Opportunity Wizard and Editing Flows

- [x] Wizard entry from staff dashboard.
- [x] Wizard entry from drawer with funder preselected.
- [x] Existing-funder selection.
- [x] New-funder creation path.
- [x] Contact add flow uses a modal with name, email, title, phone, and LinkedIn.
- [x] Opportunity shape step.
- [x] Event field only for Sponsorship + Event.
- [x] E8 organization and Opportunity Lead fields.
- [x] Ask editor supports multiple cash and in-kind components.
- [x] Description uses the shared TipTap markdown editor.
- [x] Date/url fields and type-specific visibility.
- [x] Review step summarizes the total ask and shows the cash/in-kind component breakdown.
- [x] Clone-for-next-cycle flow exists.

### 7. Activity, Email, and Documents

- [x] Activity renderer exists for notes, followups, expandable inbound/outbound emails, stage changes, money events, files, and reporting dates.
- [x] Opportunity email association and manual attach/untag endpoints exist.
- [x] TipTap note composer exists with scope toggle, date field, Task modal, and `Save note` label.
- [x] Gmail/App Script development ingest endpoint exists and is idempotent on Gmail message id.
- [x] Drive folder creation/upload/create-document/delete routes exist.
- [x] Relationship-level and opportunity-level document routes exist.
- [x] UI lists documents, shows created/updated metadata, creates Google Docs, uploads files, and deletes through React confirmation.
- [x] Drive file access uses portal proxy/open routes rather than exposing raw Drive URLs.
- [x] Browser/API-level Google Drive permission/open smoke passed in the dev authenticated environment.

### 8. Follow-ups, Reminders, and Notifications

- [x] Polymorphic follow-up/task storage.
- [x] Zero-to-many task owners in data/API layer.
- [x] Completion endpoint with optional completion note.
- [x] Per-follow-up due reminders.
- [x] Monday scheduled job hook.
- [x] Reporting-due reminders.
- [x] Supporter good-news notification hook.
- [x] Supporter notification suppression field and code path.
- [x] UI for task owners, completion-note prompt, and task creation modal.
- [~] Mailgun template/version integration from the plan is not fully verified.

### 9. Board and Development Committee Surface

- [x] `/committees/development` route.
- [x] Read-only committee dashboard shell.
- [x] Board/development committee permission gating.
- [x] Log interaction modal.
- [x] Read-only Kanban snapshot.
- [x] Upcoming dates list.
- [x] My connections panel.
- [x] Existing committee notes, member, meeting, and document tile patterns are represented on the Development Committee dashboard.
- [x] Committee document search includes committee Drive docs plus Development CRM relationship/opportunity documents through proxy-safe URLs.
- [x] Browser verification passed in the current authenticated localhost session.

### 10. Data-query Write Support

- [x] Governed write support endpoints added under `/api/data-query/development`.
- [x] Writes route through portal CacheManager/service methods, not direct ad hoc SQL.
- [x] Supported actions include Funders, Opportunities, Contacts, Tasks, Notes, Amounts, Receipts, stage changes, Support assignments, task owners, and campaign goals.
- [x] Confirmation preview required before execution.
- [x] Explicit write-token allowlist via `DATA_QUERY_WRITE_TOKEN_IDS`.
- [x] Mutation/audit logging implemented.

### 11. Spreadsheet Import

- [n/a] Dry-run importer.
- [n/a] Real importer.
- [n/a] Import CSV review outputs.
- [n/a] Mixed-format spreadsheet date parsing.
- [x] Role-tag recompute happens through development contact/opportunity writes.
- [x] Backfill script exists for existing development role tags if historical data is loaded through data-query.

### 12. Verification and Release Readiness

- [x] Rerun focused tests after audit corrections.
- [x] Rerun Vite build after audit corrections.
- [x] Staff dashboard browser verification in current authenticated localhost session.
- [x] Board/development committee browser verification in current authenticated localhost session.
- [~] Mobile browser verification: narrow in-app viewport smoke passed; true mobile/device verification remains.
- [x] Production-like document upload/create/open/delete smoke against the dev Drive folder.
- [x] No raw Drive URL exposure found in the implemented document routes/UI.
- [x] No `DEVELOPMENT_CRM_TODO` markers found.
- [x] Migration SQL exists at `scripts/migrate-add-development-crm.sql`.
- [x] Deployment notes/checklist call out role-tag backfill/nightly pass and the remaining role/device verification gaps.

## Unresolved Work

| Priority | Gap | Required follow-up |
|---|---|---|
| P2 | Full role/device smoke incomplete. | Verify role-by-role desktop/mobile flows with the intended DevelopmentManager, SiteAdmin, and board/development committee personas. |

## Verification Log

- `rg -n "DEVELOPMENT_CRM_TODO" . -g '!node_modules' -g '!public/build-next/**' -g '!downloads/**' -g '!logs/**'` found no markers.
- `node -c routes/data-query.js` passed during the plan audit.
- `node -c lib/cache-manager/development.js routes/development.js routes/data-query.js lib/scheduled-tasks.js scripts/supplemental-worker.js` passed on 2026-05-27.
- `node -c scripts/seed-admin-grid-default-views.js && node -c lib/admin-grid-config.js && node -c lib/cache-manager.js && node -c routes/admin-grid.js` passed on 2026-05-27.
- `node -e "JSON.parse(require('fs').readFileSync('docs/ai-relationship-registry.json','utf8'))"` passed on 2026-05-27.
- `npx jest __tests__/development-crm.test.js --runInBand` passed on 2026-05-27: 18 tests.
- `npx vite build` passed on 2026-05-27.
- Browser smoke on 2026-05-27: `/admin/development` loaded in the current authenticated localhost session; E8 org toggle, New opportunity wizard default/new-funder ordering, Kanban drawer, document actions, activity filters, and note scope/date controls were visible at a narrow in-app viewport.
- Browser smoke on 2026-05-27: `/committees/development` initially exposed the Development CRM document query errors; fixed missing attachment `updated_at` references and union aliases, then verified the committee dashboard loads with KPIs, Pipeline, Recent activity, Documents, document search, and no SQLite error.
- Drive smoke on 2026-05-27: created a temporary Google Doc through `/documents/google-doc`, verified the open route returns a Google Docs redirect, then deleted it through the app route.
- Drive smoke on 2026-05-27: uploaded a temporary text file through `/documents/upload`, verified `/api/files/:fileId` returns 200, then deleted it through the app route.
