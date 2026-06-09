# Company Discussion Groups Execution Plan

## Purpose

This plan is for an implementation agent building Company Discussion Groups in `e8-portal`. It decomposes the work into subagent-ready packets with clear contracts, dependencies, and validation expectations.

The feature creates one Google Group per portfolio company so investors, diligence contributors, and interested members can discuss that company by email.

Primary address pattern:

```text
{company-slug}-chat@e8angels.com
```

## Product Decisions

- Everyone with portal access can see the company discussion group address.
- Anyone on the internet can send email to the group address.
- Membership controls receiving messages, not the ability to send.
- Portal users can join without admin approval.
- There is no join-request queue.
- There is no audit/event history for adds, removes, syncs, or sent messages.
- Admins can see and manage the current roster.
- Members can see group count, but not the member roster.
- Google Group settings are hardcoded in code, not editable in admin UI.
- Reconciliation uses the existing scheduled-job UI; no dedicated reconciliation UI.
- Backfill is a one-time script, not a portal UI.
- If a company group is missing for a portfolio company, create it just in time.
- In dev/staging, real Google Workspace mutations are allowed only for one explicitly selected company.

## Repo Guardrails

Before implementation:

- Read `AGENTS.md`.
- Read `docs/design-guide.md` before UI work.
- In a worktree, run `scripts/worktree-ensure.sh` before commands that need env, server, or browser verification.
- Keep SQL in the `CacheManager` layer. New SQL for this feature should go in `lib/cache-manager/company-chat-groups.js`.
- Do not add schema mutations during app startup.
- Use explicit migration scripts under `scripts/`.
- All new scripts in `scripts/` must support `--env=prod`.
- Update `docs/database-schema.md` for schema changes.
- Update `docs/data-query-glossary.md` if staff would naturally query the new concepts.
- Review/update `docs/ai-relationship-registry.*` if present and affected by new relationships.
- Frontend code must not import server-only `lib/` modules.

## Proposed PR Sequence

Use separate PRs if possible. If done in one PR, keep commits grouped by workstream.

1. Schema, data access, and Google Groups service wrapper.
2. Sync engine, dev safety guard, backfill script, and reconciliation job.
3. Member-facing APIs and UI.
4. Admin-facing APIs and UI.
5. Updates processor forwarding.
6. Final integration, docs, tests, and rollout checks.

## Shared Contracts

### Database Concepts

Use final table and column names that match repo conventions, but preserve these concepts:

- `company_chat_groups`
  - `company_record_id`
  - `group_email`
  - `google_group_id`
  - `old_aliases_json`
  - `created_at`
  - `updated_at`
- `company_chat_memberships`
  - `company_record_id`
  - `person_record_id`
  - `email`
  - `source_investor`
  - `source_diligence`
  - `source_self_add`
  - `source_admin_add`
  - `is_current_member`
  - `opted_out`
  - `updated_at`

Do not create an audit/event table.

### Suggested CacheManager API

Implement in `lib/cache-manager/company-chat-groups.js`.

```javascript
getCompanyChatGroup(companyRecordId)
getCompanyChatGroupByEmail(groupEmail)
listCompanyChatGroups({ search, limit, offset })
upsertCompanyChatGroup(group)
getCompanyChatMemberships(companyRecordId)
upsertCompanyChatMembership(membership)
removeCompanyChatMembership({ companyRecordId, email })
recordCompanyChatOptOut({ companyRecordId, personRecordId, email })
clearCompanyChatOptOut({ companyRecordId, personRecordId, email })
getCompanyChatSummaryForPerson(personRecordId)
```

### Suggested Service API

Create a Google Groups service wrapper. Keep external API calls out of route files.

```javascript
ensureCompanyDiscussionGroup(companyRecordId, options)
syncCompanyDiscussionGroup(companyRecordId, options)
renameCompanyDiscussionGroup(companyRecordId, options)
createCompanyDiscussionGroupAlias(companyRecordId, aliasEmail, options)
addCompanyDiscussionGroupMember(companyRecordId, email, options)
removeCompanyDiscussionGroupMember(companyRecordId, email, options)
listCompanyDiscussionGroupMembers(companyRecordId, options)
reconcileAllCompanyDiscussionGroups(options)
assertCompanyChatGoogleMutationAllowed(companyRecordId, options)
```

`options.trigger` should be used for logs and control flow, not persisted as an audit trail.

### Suggested Routes

Member routes:

```text
GET    /api/companies/:id/chat
POST   /api/companies/:id/chat/join
POST   /api/companies/:id/chat/leave
GET    /api/me/company-chats
```

Admin routes:

```text
GET    /api/admin/company-chats
GET    /api/admin/companies/:id/chat/members
POST   /api/admin/companies/:id/chat/members
DELETE /api/admin/companies/:id/chat/members/:email
POST   /api/admin/companies/:id/chat/create-missing-alias
DELETE /api/admin/companies/:id/chat
```

Scheduled/internal:

```text
reconcileAllCompanyDiscussionGroups()
forwardCompanyUpdateToDiscussionGroup({ companyRecordId, originalMessage })
```

## Subagent Handoff Checklist

### Subagent 1: Schema, Migrations, and Data Access

Objective:

Build the persistent local mirror for group addresses and current membership state.

Inputs:

- Main feature plan: `docs/mockups/per-company-investor-groups/plan.md`
- Existing schema docs: `docs/database-schema.md`
- CacheManager conventions in `lib/cache-manager/`

Work items:

- [ ] Create an explicit migration script or SQL file under `scripts/`.
- [ ] Add `company_chat_groups`.
- [ ] Add `company_chat_memberships`.
- [ ] Add indexes for `company_record_id`, `person_record_id`, `email`, and `group_email`.
- [ ] Add `CREATE TABLE IF NOT EXISTS` setup for new-environment bootstrap in `lib/cache-manager.js`.
- [ ] Add `lib/cache-manager/company-chat-groups.js`.
- [ ] Wire the new module into `CacheManager.prototype`.
- [ ] Implement group CRUD methods.
- [ ] Implement membership CRUD and summary methods.
- [ ] Ensure methods return source badges from booleans, not from historical events.
- [ ] Update `docs/database-schema.md`.
- [ ] Update `docs/data-query-glossary.md` if staff-facing queries should understand company discussion groups.
- [ ] Review `docs/ai-relationship-registry.*` if present.

Validation:

- [ ] Run migration against dev database.
- [ ] Run `node -c` on changed server files.
- [ ] Add and run unit tests for data access success and failure paths.
- [ ] Confirm no startup schema mutation was added.

Output:

- Migration script.
- CacheManager module.
- Schema docs.
- Tests.

Dependencies:

- None.

### Subagent 2: Google Groups Service and Dev Safety Guard

Objective:

Create a reusable Google Groups integration that can create, rename, alias, add/remove members, and list members while protecting dev/staging from broad real Workspace mutations.

Inputs:

- Hardcoded Google settings from `plan.md`.
- Existing Google service account patterns in the repo.
- Schema/cache methods from Subagent 1.

Work items:

- [ ] Implement Google Groups service wrapper.
- [ ] Hardcode group settings:
  - [ ] `whoCanPostMessage=ANYONE_CAN_POST`
  - [ ] `messageModerationLevel=MODERATE_NONE`
  - [ ] `spamModerationLevel=SILENTLY_MODERATE`
  - [ ] `replyTo=REPLY_TO_LIST`
  - [ ] `membersCanPostAsTheGroup=false`
  - [ ] `allowWebPosting=true`
  - [ ] `sendMessageDenyNotification=false`
  - [ ] `whoCanViewMembership=ALL_MANAGERS_CAN_VIEW`
  - [ ] `whoCanViewGroup=ALL_MANAGERS_CAN_VIEW`
  - [ ] `whoCanDiscoverGroup=ALL_MEMBERS_CAN_DISCOVER`
  - [ ] `showInGroupDirectory=false`
  - [ ] `includeInGlobalAddressList=false`
  - [ ] `isArchived=true`
  - [ ] `archiveOnly=false`
  - [ ] `whoCanJoin=INVITED_CAN_JOIN`
  - [ ] `whoCanAdd=ALL_MEMBERS_CAN_ADD`
  - [ ] `whoCanInvite=ALL_MEMBERS_CAN_INVITE`
  - [ ] `whoCanLeaveGroup=ALL_MEMBERS_CAN_LEAVE`
  - [ ] `whoCanContactOwner=ALL_MEMBERS_CAN_CONTACT`
  - [ ] `whoCanModerateMembers=ALL_MEMBERS`
  - [ ] `whoCanModerateContent=OWNERS_AND_MANAGERS`
  - [ ] `allowExternalMembers=true`
  - [ ] `enableCollaborativeInbox=false`
  - [ ] `includeCustomFooter=true`
  - [ ] `customFooterText=To leave this list... https://app.e8angels.com/member/profile.`
  - [ ] `primaryLanguage=en_US`
- [ ] Add welcome email copy for reply-to-list behavior, reply-all dedupe, private roster visibility, visible From addresses, and unsubscribe paths.
- [ ] Verify accepted Google Groups Settings API values in the E8 tenant.
- [ ] Implement slug generation.
- [ ] Implement collision detection and Support Manager alert.
- [ ] Do not auto-resolve collisions with `-2`, `-3`, etc.
- [ ] Implement primary address rename plus old-address alias.
- [ ] Implement create alias repair.
- [ ] Implement member add/remove/list.
- [ ] Implement `assertCompanyChatGoogleMutationAllowed`.
- [ ] Add env vars to `env.template`:
  - [ ] `COMPANY_CHAT_GROUP_DEV_ALLOW_GOOGLE_MUTATIONS`
  - [ ] `COMPANY_CHAT_GROUP_DEV_COMPANY_RECORD_ID`
  - [ ] Support Manager alert recipient if not already configured.
- [ ] In non-production, block create/rename/alias/member mutation unless both dev flags are set and the company ID matches.
- [ ] Make all mutation entrypoints use the same guard.

Validation:

- [ ] Unit test slug generation boundaries.
- [ ] Unit test collision alert behavior.
- [ ] Unit test dev guard rejects broad mutations.
- [ ] Unit test dev guard permits only the selected company when explicitly enabled.
- [ ] Run one dev smoke test with a single selected company only.

Output:

- Google Groups service wrapper.
- Dev safety guard.
- Env template updates.
- Tests.

Dependencies:

- Subagent 1 for persistence methods.

### Subagent 3: Membership Eligibility and Sync Engine

Objective:

Calculate expected members, preserve opt-outs, and keep Google/local state aligned.

Inputs:

- Deployment/investment data source.
- Canonical diligence-team list for a company.
- Cache methods from Subagent 1.
- Google wrapper from Subagent 2.

Work items:

- [ ] Identify the canonical diligence-team source in the current system.
- [ ] Implement expected investor member calculation.
- [ ] Implement expected diligence member calculation.
- [ ] Implement source badge calculation:
  - [ ] Investor
  - [ ] Diligence
  - [ ] Self-add
  - [ ] Admin-add
- [ ] Support multiple source badges for one member.
- [ ] Implement opt-out preservation.
- [ ] Do not auto-readd someone who left and later invests again.
- [ ] Allow self-join to clear opt-out.
- [ ] Allow admin-add to clear/override opt-out.
- [ ] Implement `syncCompanyDiscussionGroup(companyRecordId, { trigger, actorEmail })`.
- [ ] Trigger sync after new deployment creation.
- [ ] When a person becomes an investor through a deployment write, add them to the company's Google Group and local current-membership mirror after the deployment commit succeeds, unless they previously opted out.
- [ ] If the investor deployment is the first event that needs the group and the company is a portfolio company, create the company Google Group just in time before adding the investor.
- [ ] Trigger sync after canonical diligence-team add/remove/change.
- [ ] Trigger sync after company rename.
- [ ] Trigger just-in-time create when a portfolio company group is missing.
- [ ] Ensure sync does not write audit history.

Validation:

- [ ] Unit test investor eligibility.
- [ ] Unit test diligence eligibility.
- [ ] Unit test multiple source badges.
- [ ] Unit test opt-out after second investment.
- [ ] Unit test self-join and admin-add opt-out override.
- [ ] Integration test deployment write triggers sync for existing group.
- [ ] Integration test a new investor deployment adds that investor to the Google Group and local current-membership mirror when they have not opted out.
- [ ] Integration test a new investor deployment creates the missing company group just in time and then adds the investor.
- [ ] Integration test a new investor deployment does not readd an investor who previously opted out.
- [ ] Integration test diligence-team addition triggers sync.

Output:

- Sync engine.
- Eligibility helpers.
- Tests.

Dependencies:

- Subagent 1.
- Subagent 2.

### Subagent 4: Member API and Member UI

Objective:

Expose group discovery, send, join, leave, and "my lists" experiences without exposing roster names.

Inputs:

- `member-experience.html`
- Existing member/profile page and investments table implementation.
- Sync engine from Subagent 3.

Work items:

- [ ] Add `GET /api/companies/:id/chat`.
- [ ] Add `POST /api/companies/:id/chat/join`.
- [ ] Add `POST /api/companies/:id/chat/leave`.
- [ ] Add `GET /api/me/company-chats`.
- [ ] Ensure member APIs return address, count, current user's membership state, and source summary only.
- [ ] Ensure member APIs never return roster names/emails.
- [ ] Add company page Chat split button near Notes/Dealum actions.
- [ ] Main Chat button opens `mailto:{groupAddress}`.
- [ ] Split dropdown offers Join or Leave based on membership state.
- [ ] Add tooltip: `Contact mailing list of people interested in {company name}`.
- [ ] Update Notes, Dealum, and related buttons to lightweight labeled buttons.
- [ ] Update investments table: no "Discussion Group" header; compact mail split button only.
- [ ] Add Company Discussion Groups widget to member/profile page, modeled on the investments tile.
- [ ] Add bounded-height scroll table in the widget.
- [ ] Use the same email plus Join/Leave split-button pattern in the widget.
- [ ] Ensure missing portfolio groups are created just in time through guarded service path.
- [ ] Ensure Leave records opt-out and removes from Google Group.

Validation:

- [ ] Route tests for auth and permission behavior.
- [ ] UI tests or browser smoke tests for company page Chat button.
- [ ] UI tests or browser smoke tests for investments table control.
- [ ] UI tests or browser smoke tests for member/profile widget.
- [ ] Confirm roster names are not present in member API responses.
- [ ] Run Vite build.

Output:

- Member routes.
- Member UI changes.
- Tests.

Dependencies:

- Subagent 1.
- Subagent 2.
- Subagent 3.

### Subagent 5: Admin API and Admin UI

Objective:

Give admins a compact management table, row actions, roster slide-out, member add/remove, and delete confirmation.

Inputs:

- `admin-console.html`
- Existing admin/company navigation.
- Existing admin/people slide-out pattern.

Work items:

- [ ] Add `Manage -> Company -> Chats` below Leads.
- [ ] Add `GET /api/admin/company-chats`.
- [ ] Add `GET /api/admin/companies/:id/chat/members`.
- [ ] Add `POST /api/admin/companies/:id/chat/members`.
- [ ] Add `DELETE /api/admin/companies/:id/chat/members/:email`.
- [ ] Add `POST /api/admin/companies/:id/chat/create-missing-alias`.
- [ ] Add `DELETE /api/admin/companies/:id/chat`.
- [ ] Build admin table columns:
  - [ ] Company
  - [ ] Group email, compact display such as `emerald-battery-labs@...`
  - [ ] Members
  - [ ] Sources
  - [ ] Kebab menu
- [ ] Do not show status, issues, last sync, or audit columns.
- [ ] Row click opens roster slide-out.
- [ ] Kebab menu offers:
  - [ ] Edit, opens roster slide-out.
  - [ ] Email, opens `mailto:{groupAddress}`.
  - [ ] Delete, opens alert confirmation modal.
- [ ] Roster slide-out shows member names/emails to admins only.
- [ ] Roster source badges show Investor, Diligence, Self-add, Admin-add.
- [ ] Show multiple source badges when applicable.
- [ ] Support admin add member.
- [ ] Support admin remove member.
- [ ] Support create missing alias repair action.
- [ ] Do not add reconciliation UI.
- [ ] Do not add Google settings UI.
- [ ] Do not add join-request UI.

Validation:

- [ ] Route tests reject non-admin users.
- [ ] Route tests cover admin list, roster, add, remove, alias repair, and delete confirmation endpoint behavior.
- [ ] Browser smoke test the admin table and slide-out.
- [ ] Browser smoke test kebab menu actions.
- [ ] Verify table density and mobile behavior against `docs/design-guide.md`.
- [ ] Run Vite build.

Output:

- Admin routes.
- Admin UI changes.
- Tests.

Dependencies:

- Subagent 1.
- Subagent 2.
- Subagent 3.

### Subagent 6: Backfill Script and Nightly Reconciliation

Objective:

Create groups for existing portfolio companies once, and keep the local current-membership mirror fresh through the existing scheduled-job infrastructure.

Inputs:

- Existing scheduled jobs implementation.
- Script standards from `AGENTS.md`.
- Dev safety guard from Subagent 2.

Work items:

- [ ] Add `scripts/backfill-company-chat-groups.js`.
- [ ] Support `--env=prod`.
- [ ] Support `--dry-run`.
- [ ] Support `--company=<company_record_id>`.
- [ ] Support `--limit=25` or equivalent batching.
- [ ] Support a create/execute flag for non-dry-run behavior.
- [ ] Ensure dry run lists expected address, investor count, diligence count, missing emails, rename/collision alerts, and alias changes.
- [ ] Ensure non-production execution refuses broad creation and allows only selected company with dev flags.
- [ ] Ensure production execution requires explicit command and logs clear output.
- [ ] Add nightly reconciliation job using the existing scheduled-job mechanism and UI.
- [ ] Schedule once per day at night, avoiding existing jobs.
- [ ] Reconciliation reads Google Group membership and refreshes local current-membership mirror.
- [ ] Reconciliation preserves derivable source badges.
- [ ] Reconciliation does not write audit history.
- [ ] Reconciliation in dev/staging reads selected company only.

Validation:

- [ ] Script dry run passes in dev/staging.
- [ ] Single-company dev create test passes only for selected company.
- [ ] Unit test dry run does not mutate local state.
- [ ] Unit test reconciliation updates local mirror from Google member list.
- [ ] Unit test reconciliation does not create all missing groups in dev/staging.
- [ ] Confirm scheduled job appears only through existing scheduled-job UI.

Output:

- Backfill script.
- Nightly job.
- Tests.

Dependencies:

- Subagent 1.
- Subagent 2.
- Subagent 3.

### Subagent 7: Updates Processor Forwarding

Objective:

When `updates@e8angels.com` processing identifies an email as relevant to a company, forward the full original email to the company target and the company discussion group.

Inputs:

- Existing updates processor code.
- Existing email forwarding/sending helpers.
- Google group just-in-time creation path from Subagent 3.

Work items:

- [ ] Locate the existing `updates@e8angels.com` processor.
- [ ] Identify how the processor determines company relevance.
- [ ] Identify the existing company-relevant email target.
- [ ] Add `forwardCompanyUpdateToDiscussionGroup({ companyRecordId, originalMessage })`.
- [ ] Resolve the company discussion group address.
- [ ] If portfolio company group is missing, create it just in time through the guarded service path.
- [ ] Send the alert email to the existing company-relevant target.
- [ ] Send the alert email to the company discussion group.
- [ ] Preserve original From.
- [ ] Preserve original To/Cc when available.
- [ ] Preserve original Subject.
- [ ] Preserve original received date.
- [ ] Preserve full HTML body formatting.
- [ ] Preserve plain-text fallback.
- [ ] Preserve attachments.
- [ ] Preserve inline images/content IDs when available.
- [ ] Make the wrapper clear that the email came through `updates@e8angels.com`.
- [ ] Do not strip attachments silently.

Validation:

- [ ] Test matched company forwarding.
- [ ] Test no-match behavior.
- [ ] Test missing group just-in-time creation.
- [ ] Test HTML body preservation.
- [ ] Test attachment forwarding.
- [ ] Test failure handling without duplicate sends.

Output:

- Updates processor integration.
- Email preservation tests.

Dependencies:

- Subagent 2.
- Subagent 3.

### Subagent 8: Final QA, Rollout, and Documentation

Objective:

Verify end-to-end behavior, document operational commands, and prepare for controlled rollout.

Inputs:

- Outputs from all implementation subagents.
- `AGENTS.md` completion requirements.

Work items:

- [ ] Run all unit and route tests.
- [ ] Run `npm test`.
- [ ] Run `node test-email-processor.js` if updates processor changed.
- [ ] Run `npx vite build`.
- [ ] Browser smoke test member company page.
- [ ] Browser smoke test investments table.
- [ ] Browser smoke test member/profile widget.
- [ ] Browser smoke test admin Chats table, kebab menu, roster slide-out, add/remove, and delete modal.
- [ ] Dev smoke test one selected company group creation in real Google Workspace.
- [ ] Verify broad dev/staging group creation is blocked.
- [ ] Verify no member-facing API exposes roster names/emails.
- [ ] Verify Google group can receive email from a non-member sender.
- [ ] Verify a newly created deployment automatically adds the investor to the company's Google Group and local current-membership mirror.
- [ ] Verify portal Leave removes Google membership and records opt-out.
- [ ] Verify later deployment does not readd opted-out member.
- [ ] Verify self-join can add the user back.
- [ ] Verify admin-add can add the user back.
- [ ] Verify one-time backfill dry run output.
- [ ] Verify production backfill command is documented but not run without explicit approval.
- [ ] Update `docs/database-schema.md`.
- [ ] Update `docs/data-query-glossary.md` or document why no glossary update is needed.
- [ ] Review `docs/ai-relationship-registry.*` or document why not applicable.
- [ ] Add PR notes with env vars, migration command, dev test command, and production approval requirements.

Validation:

- [ ] All tests pass.
- [ ] Browser smoke tests pass with authenticated session cookie.
- [ ] No unintended Google Workspace groups are created.
- [ ] No audit/event tables or UI were added.

Output:

- Final QA report.
- PR description.
- Rollout checklist.

Dependencies:

- All prior subagents.

## End-to-End Acceptance Criteria

- [ ] Every portfolio company can resolve a company discussion group address.
- [ ] Missing portfolio-company group is created just in time.
- [ ] Address is visible on company page, investments table, and member/profile widget.
- [ ] Member can send email via `mailto`.
- [ ] Member can join without approval.
- [ ] When someone becomes an investor in a company, they are automatically added to that company's discussion group unless they previously opted out.
- [ ] If that company's discussion group does not exist yet, the investor-triggered sync creates it just in time and then adds the investor.
- [ ] Member can leave and is not auto-readded after later investment.
- [ ] Member can self-join again after leaving.
- [ ] Admin can add member.
- [ ] Admin can remove member.
- [ ] Admin can see roster and source badges.
- [ ] Member cannot see roster names/emails.
- [ ] Admin table has only Company, Group email, Members, Sources, and kebab menu.
- [ ] Kebab Edit opens roster slide-out.
- [ ] Kebab Email opens `mailto`.
- [ ] Kebab Delete opens confirmation modal.
- [ ] Google Group settings are hardcoded.
- [ ] Anyone on the internet can post to the group address.
- [ ] Google-native subscribe-by-email is disabled if tenant settings allow it.
- [ ] Nightly reconciliation refreshes local current membership only.
- [ ] No audit/event history is stored.
- [ ] No reconciliation UI is added.
- [ ] No settings UI is added.
- [ ] Backfill is script-only.
- [ ] Dev/staging can create or repair only one explicitly selected real Google Workspace group.
- [ ] Updates processor forwards matched company emails to the company target and company discussion group with HTML and attachments preserved.

## Known Open Questions

- What exact field/table is the canonical diligence-team list for a company?
- Who is the Support Manager alert recipient?
- What is the company-relevant email target in the updates workflow?
- Should self-join send a confirmation email?
- What nightly time window is clear of existing scheduled jobs?

## Suggested Agent Assignment Order

Parallelizable after Subagent 1 and Subagent 2 establish contracts:

1. Subagent 1 starts schema/data access.
2. Subagent 2 starts Google service wrapper and dev guard.
3. Subagent 3 starts after Subagents 1 and 2 agree on method contracts.
4. Subagents 4 and 5 can work in parallel after Subagent 3 exposes APIs or mock service contracts.
5. Subagents 6 and 7 can work in parallel after Subagent 3.
6. Subagent 8 runs after all code lands.

Recommended handoff cadence:

- Each subagent returns changed files, tests run, remaining risks, and any contract changes.
- If a subagent changes a shared contract, pause dependent agents and update this execution plan before continuing.
