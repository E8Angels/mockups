---
title: Development CRM Implementation Checklist
status: draft
owner: implementation-orchestrator
created: 2026-05-27
last_updated: 2026-05-27
---

# Development CRM Implementation Checklist

Use this file as the durable implementation ledger. Keep it current as work is assigned, completed, blocked, or verified. After every sub-agent finishes a workstream, update the relevant checklist items with status, owner, evidence, and remaining follow-ups.

Status markers:
- `[ ]` not started
- `[~]` in progress
- `[x]` complete and verified
- `[!]` blocked or needs decision

## Orchestration Rules

- [ ] Create a fresh implementation branch and record it here:
  - Branch:
  - Start date:
  - Orchestrator:
- [ ] Assign substantial workstreams to properly powered sub-agents where useful. Use capable coding/research agents for schema, backend, frontend, AI/data-query, import, and verification work; do not use low-capability/cheap agents for implementation-critical tasks.
- [ ] Require each sub-agent to return: files changed, tests added/updated, verification run, known gaps, and any code markers they left.
- [ ] If any agent defers, stubs, or partially implements required behavior, require a greppable marker in code using this exact prefix: `DEVELOPMENT_CRM_TODO`.
- [ ] Before final handoff, grep for `DEVELOPMENT_CRM_TODO` and either complete each item or list it in the final unresolved-work section below.
- [ ] Keep this checklist updated before any context compaction or handoff.

## Agent Workstream Ledger

| Workstream | Agent | Status | Last update | Evidence / notes |
|---|---|---|---|---|
| Schema + docs |  | [ ] |  |  |
| CacheManager + routes |  | [ ] |  |  |
| RecordGrid metadata + saved views |  | [ ] |  |  |
| Staff dashboard UI |  | [ ] |  |  |
| Funder/opportunity drawer |  | [ ] |  |  |
| Wizard + editing flows |  | [ ] |  |  |
| Activity, email, documents |  | [ ] |  |  |
| Follow-ups + reminders |  | [ ] |  |  |
| Board/development committee view |  | [ ] |  |  |
| Data-query write support |  | [ ] |  |  |
| Spreadsheet import |  | [ ] |  |  |
| End-to-end verification |  | [ ] |  |  |

## 1. Schema, Docs, and Data Contracts

- [ ] Add migration SQL for all development CRM tables and indexes.
- [ ] Update `createTables()` for new-environment setup only.
- [ ] Add CacheManager domain module wiring for development CRM.
- [ ] Add ID generation/normalization conventions for all new record prefixes.
- [ ] Update `docs/database-schema.md`.
- [ ] Update `docs/data-query-glossary.md`.
- [ ] Update `docs/ai-relationship-registry.*` if present and applicable.
- [ ] Add/verify role taxonomy docs for DevelopmentManager and development contact roles.
- [ ] Add/verify permission resources for development read/write/notes/followups/export/goals/admin.
- [ ] Add schema tests covering table creation SQL, key constraints, and migration assumptions.

Evidence:
- Files:
- Tests:
- Remaining:

## 2. Backend Data Layer and Routes

- [ ] Implement funder CRUD through CacheManager methods.
- [ ] Implement opportunity CRUD through CacheManager methods.
- [ ] Implement contacts linking/unlinking through CacheManager methods.
- [ ] Implement opportunity supporters CRUD.
- [ ] Implement amounts CRUD for ask/commit/receive and cash/in-kind rows.
- [ ] Implement stage-change flow with stage event, optional note, and follow-up suggestion.
- [ ] Implement notes CRUD with polymorphic funder/opportunity parents and edit-window enforcement.
- [ ] Implement follow-up/task CRUD with zero-to-many owners.
- [ ] Implement campaign and campaign-goal reads/writes.
- [ ] Implement activity feed reads from durable event tables.
- [ ] Add route-level permission checks for every read/write surface.
- [ ] Add route/integration tests for success, rejection, and boundary cases.

Evidence:
- Files:
- Tests:
- Remaining:

## 3. RecordGrid Integration

- [ ] Add `development_opportunities` RecordGrid metadata.
- [ ] Add `development_funders` RecordGrid metadata.
- [ ] Add default Opportunity saved views.
- [ ] Add default Funder saved views.
- [ ] Ensure List view mounts separate RecordGrid instances by base table; do not implement mixed Funder/Opportunity rows in one grid.
- [ ] Wire view picker/grouping so Opportunity and Funder views share the staff dashboard List content area.
- [ ] Scope AI Assist and view-builder context to the active base table.
- [ ] Persist selected views separately for each base table.
- [ ] Implement CSV export for each active base table.
- [ ] Add tests for metadata, saved views, row loading, and base-table switching.

Evidence:
- Files:
- Tests:
- Remaining:

## 4. Staff Dashboard

- [ ] Add `/admin/development` route and navigation entry.
- [ ] Implement KPI strip.
- [ ] Implement resizable/collapsible left filter rail.
- [ ] Implement quick filters: My Opportunities and My Funders.
- [ ] Implement E8 organization, opportunity type, funder type, stage, lead, follow-up, fiscal year, and reporting filters.
- [ ] Implement Kanban columns and cards.
- [ ] Show Lead photo or initials at top-right of Kanban cards.
- [ ] Show Support line only when opportunity has supporters.
- [ ] Implement drag-to-stage-change modal with note/follow-up handling.
- [ ] Implement List as RecordGrid workspace per Section 3.
- [ ] Implement Calendar workspace for deadlines, reports, term dates, and follow-ups.
- [ ] Add frontend tests for filters, quick filters, Kanban rendering, List base-table switching, and Calendar links.

Evidence:
- Files:
- Tests:
- Remaining:

## 5. Funder and Opportunity Drawer

- [ ] Implement right-side drawer over staff dashboard.
- [ ] Implement funder summary with contacts, lead, description, files, and edit affordances.
- [ ] Implement opportunity tabs and Summary tab.
- [ ] Implement Funder-level Activity tab.
- [ ] Implement opportunity detail fields and inline editing.
- [ ] Implement stage dropdown as the only opportunity-tab stage-change control.
- [ ] Implement unsaved-note guard with existing modal pattern.
- [ ] Implement read-only rendering for users without write permissions.
- [ ] Add tests for drawer open targets, opportunity tab selection, read-only mode, and edit/save behavior.

Evidence:
- Files:
- Tests:
- Remaining:

## 6. New Opportunity Wizard and Editing Flows

- [ ] Implement wizard entry from staff dashboard.
- [ ] Implement wizard entry from drawer with funder preselected.
- [ ] Implement existing-funder search.
- [ ] Implement new-funder creation path.
- [ ] Implement contact add flow inside wizard.
- [ ] Implement opportunity shape step.
- [ ] Show free-text Event field only for Sponsorship + Event.
- [ ] Implement E8 organization and Opportunity Lead fields.
- [ ] Implement ask editor with cash and in-kind lines.
- [ ] Implement description editor.
- [ ] Implement date/url fields and type-specific visibility.
- [ ] Implement review step and transactional create.
- [ ] Implement clone-for-next-cycle flow.
- [ ] Add tests for wizard success, validation, rollback/failure, event field visibility, and clone flow.

Evidence:
- Files:
- Tests:
- Remaining:

## 7. Activity, Email, and Documents

- [ ] Implement activity renderer for notes, emails, stage changes, money, files, and lifecycle events.
- [ ] Implement activity filters by type and opportunity association.
- [ ] Implement TipTap note composer and Task button.
- [ ] Implement Gmail/PubSub development matching and idempotent email event creation.
- [ ] Implement manual attach/untag email-to-opportunity flow.
- [ ] Implement Drive folder creation for funders and opportunities.
- [ ] Implement relationship-level and opportunity-level document lists.
- [ ] Implement upload, create document, and link existing Drive file flows.
- [ ] Ensure all Drive file access uses existing proxy routes.
- [ ] Add tests for activity feed ordering, email ingest matching, attachment records, and Drive URL safety.

Evidence:
- Files:
- Tests:
- Remaining:

## 8. Follow-ups, Reminders, and Notifications

- [ ] Implement polymorphic follow-up/task storage.
- [ ] Implement zero-to-many task owners with PeoplePicker/MultiPeoplePicker UI.
- [ ] Implement completion flow with optional completion note.
- [ ] Implement per-follow-up due reminders.
- [ ] Implement Monday overdue digest by staff lead/task owner as planned.
- [ ] Implement reporting-due reminders.
- [ ] Implement supporter good-news notifications on configured stage advances.
- [ ] Implement notification suppression for supporters.
- [ ] Add tests for reminder selection, idempotency, task ownership, completion notes, and notification permission boundaries.

Evidence:
- Files:
- Tests:
- Remaining:

## 9. Board and Development Committee Surface

- [ ] Add `/committees/development` route.
- [ ] Implement read-only committee dashboard.
- [ ] Implement board/development committee permission gating.
- [ ] Implement Log interaction modal.
- [ ] Implement read-only Kanban snapshot.
- [ ] Implement upcoming dates list.
- [ ] Implement My connections panel.
- [ ] Implement member/meeting/document side panels using existing committee patterns.
- [ ] Add tests for read-only enforcement, board note creation, lead notification, and My connections inclusion rules.

Evidence:
- Files:
- Tests:
- Remaining:

## 10. Data-query Write Support

- [ ] Extend data-query tooling from read-only to governed write support for this domain.
- [ ] Route all writes through portal APIs/service methods, not direct ad hoc SQL.
- [ ] Support creation/editing for Funders, Opportunities, Contacts, Tasks, Notes, Amounts, Receipts, stage changes, Support assignments, and task owners.
- [ ] Add confirmation flow before mutations.
- [ ] Add permission checks identical to UI/API permissions.
- [ ] Add audit/event logging for data-query writes.
- [ ] Add tests for approved writes, rejected writes, permission failures, validation failures, and no-op/cancel behavior.

Evidence:
- Files:
- Tests:
- Remaining:

## 11. Spreadsheet Import

- [ ] Implement dry-run importer.
- [ ] Map master sponsor sheets into funders, opportunities, contacts, notes, amounts, and supporters.
- [ ] Produce reviewable dry-run CSVs for creates, updates, ambiguous matches, and skipped rows.
- [ ] Parse mixed-format dates safely and preserve original ambiguous values in notes.
- [ ] Implement real import path after dry-run approval.
- [ ] Implement role-tag backfill.
- [ ] Add tests for representative rows, duplicate handling, multi-assignee handling, mixed dates, and dry-run vs real-run behavior.

Evidence:
- Files:
- Tests:
- Remaining:

## 12. Verification and Release Readiness

- [ ] Run all focused unit and integration tests added for this feature.
- [ ] Run relevant existing regression suites.
- [ ] Verify staff dashboard as DevelopmentManager/SiteAdmin.
- [ ] Verify read-only board/development committee view.
- [ ] Verify unauthorized users cannot read or write development CRM data.
- [ ] Verify data-query write paths use confirmations and respect permissions.
- [ ] Verify no raw Google Drive URLs reach the client.
- [ ] Verify no startup/init code performs schema migration.
- [ ] Verify `DEVELOPMENT_CRM_TODO` markers are fully resolved or documented below.
- [ ] Verify docs/schema/glossary/registry are in sync with final implementation.
- [ ] Prepare deployment notes with migration SQL, env changes, verification commands, and known risks.

Evidence:
- Files:
- Tests:
- Remaining:

## Unresolved Work / Greppable Markers

Keep this section empty unless a `DEVELOPMENT_CRM_TODO` marker remains by explicit decision.

| Marker | File | Owner | Reason | Required follow-up |
|---|---|---|---|---|

## Final Handoff Summary

Complete this before handing off or opening a PR.

- Completed workstreams:
- Deferred work:
- Tests run:
- Browser/manual verification:
- Migration SQL provided:
- Docs updated:
- Known risks:
