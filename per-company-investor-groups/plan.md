---
title: "Company Discussion Groups"
status: draft
owner: jordan
created: 2026-05-16
last_updated: 2026-06-09
home: member-experience
---

# Company Discussion Groups

## Goal

Create a per-company mailing list so E8 members can discuss a company with investors, diligence contributors, and other interested members. The group is backed by Google Groups and uses a predictable address:

```text
{company-slug}-chat@e8angels.com
```

Example: `emerald-battery-labs-chat@e8angels.com`.

## Recommendation Summary

| Question | Recommendation |
|---|---|
| How do people find the address? | Everyone with portal access can see the address anywhere the company discussion group appears: company page, investment table, and the member/profile widget. |
| How do people join? | Any portal user can add themselves from the company page, investment row, or Company Discussion Groups widget. No admin approval. |
| Can non-members send mail? | Yes. Configure Google Groups so anyone on the internet can send to the address. Membership controls who receives list mail and who can unsubscribe, not who can send. |
| Can admins see/manage lists and members? | Yes. Add `Manage -> Company -> Chats`, with the Chats menu item below Leads. Admins can create missing aliases, add/remove members, re-sync, and see the current roster with source badges. |
| Can admins audit mail sent or membership changes? | No. We do not track adds, removes, syncs, or messages sent to the list. The portal stores current group state only. |
| How do people unsubscribe? | The Company Discussion Groups widget has a Leave action. Leaving removes the Google Group membership and records an opt-out so auto-sync does not re-add the person unless they self-join or an admin adds them back. |
| How do people see which lists they're on? | Add a "Company Discussion Groups" tile on the member/profile page modeled on the investments tile: compact stat boxes, a bounded-height scroll table, address/member/status columns, and a split-button action per row. |
| How are new investors added to existing groups? | Every deployment write calls the shared sync function after commit. If the group already exists, the sync adds the new investor unless they previously opted out. |
| How are diligence contributors added? | Use the canonical diligence-team list in the system for that company. Whenever someone is added to that diligence team, sync them into the group. |
| How do we keep local membership state fresh? | Update local membership immediately when portal actions run, and run a nightly reconciliation job that reads all Google Groups and refreshes the local mirror. |
| How do we backfill existing invested companies? | Run a one-time backfill script after review. Do not include a portal backfill UI. |
| Can people see member count? | Yes. Show count on member-facing surfaces. |
| Can people see who is on the list? | No, except admins. Portal users see the address, count, and their own membership state; admins see the roster. |

## Mockups

- [Member experience](member-experience.html): company page, investment table, self-join, and the member/profile widget.
- [Admin console](admin-console.html): `Manage -> Company -> Chats`, current roster, source badges, and repair alias creation.
- [Overview](mockup.html): compact entry page linking the variants.
- [Execution plan](execution-plan.md): implementation checklist and subagent handoff plan.

## Core UX Decisions

### 1. Address visibility and sending

Everyone with portal access can see and use the company discussion group address. On company pages, the address lives inside a lightweight `Chat` split button in the right-side action group, just left of `Notes`. The main button opens mail to the group; the dropdown shows `Email {group address} ({member count})` plus `Join` or `Leave` depending on the viewer's membership state. The hover tooltip says `Contact mailing list of people interested in {company name}`.

In compact table contexts, the address can be shown as text while the row action remains the compact mail split button.

For the investments table, keep the column header blank and use a compact icon split button in each row: the mail icon sends to the group, and the caret opens `Join` or `Leave`.

For the member/profile page, model the widget on the existing investments/portfolio tile: a card header, a small stat row, and a bordered `max-height` table that scrolls after several rows. Each row uses the same compact mail split button for email plus `Join` or `Leave`.

The Google Group should accept mail from anyone on the internet. This is deliberate: a member does not need to be subscribed to send a message, and external senders can reply or forward relevant context into the discussion.

Membership controls:

- Who receives messages sent to the group.
- Who sees the group in their Company Discussion Groups widget as "Joined".
- Who can leave/unsubscribe through the portal.
- Who appears in the admin roster.

Membership does not control who can send.

### 2. Naming and collisions

Use `-chat`, because the group is broader than investors.

Slug rules:

- Lowercase.
- Alphanumeric plus hyphens.
- Max 50 characters before `-chat`.
- Derive from the company's canonical portal name.

Do not resolve collisions by appending `-2`, `-3`, etc. Two companies should not have the same canonical name. If the generated address is already taken:

1. Do not create a different address silently.
2. Send an alert email to the Support Manager.
3. Include the attempted address, the company record ID, the company name, and any existing group/company record that owns the address.
4. Keep the company visible in the admin Chats table with the normal compact columns and make the repair path available from the table context.

### 3. Company renames

If a company name changes after a group exists:

1. Generate the new canonical address.
2. Change the Google Group primary address to the new address.
3. Add the old address as an alias/forwarder so mail to the old address still reaches the group.
4. Update the portal row so users see only the new correct address.
5. Keep the old address in alias history for repair visibility.

If Google rejects the rename or alias creation, alert the Support Manager and make the repair path available from the admin Chats table context.

### 4. Who gets auto-subscribed

Auto-add:

- Investors: people tied to deployment records for the company.
- Diligence team: the canonical list in the system of people on the diligence team for the company.

When either source changes after the group exists, run the same sync function and add the new person unless they have opted out.

Opt-out rule:

- If someone leaves the list and later invests again in the same company, do not auto-re-add them.
- They can still add themselves back from the portal.
- An admin can add them back from the admin roster.

### 5. Source badges

The admin roster shows why each person is on the list. A person can have multiple source badges:

- `Investor`
- `Diligence`
- `Self-add`
- `Admin-add`

Examples:

- Someone who invested and was also on diligence shows `Investor` and `Diligence`.
- Someone who added themselves shows `Self-add`.
- Someone staff added manually shows `Admin-add`.

This is a current-state label, not an event log.

### 6. Self-subscribe

Any authenticated portal user can join any company discussion group from:

- The company page.
- The investments table row.
- The Company Discussion Groups tile on the member/profile page.

Self-join behavior:

1. If the Google Group is missing for a portfolio company, auto-create it just in time.
2. Add the current user's canonical email to the Google Group.
3. Remove any opt-out row for that user/company.
4. Add or update the local membership mirror with the `Self-add` source.
5. Immediately show the row as Joined.

No admin request/approval flow.

### 7. Unsubscribe and opt-outs

The portal "Leave" action is the primary unsubscribe path.

When a person leaves:

- Remove them from the Google Group.
- Insert or update an opt-out row for that company/email.
- Remove them from the current local membership mirror.
- Keep the opt-out across future investor and diligence syncs.
- Show the member-facing state as "Not joined" with a Join action.

Google native unsubscribe should still be allowed if Google requires it for normal mailing-list behavior. The nightly reconciliation job should detect Google-side removals and update the local mirror. If it can match the email to a person, it should also record the opt-out so automated sync does not add the person back.

### 8. Google-native subscribe by email

The product preference is: do not allow people to subscribe by sending a subscribe email to the list alias.

Recommended setting:

- Set `whoCanJoin=INVITED_CAN_JOIN`.
- Keep add/invite/approve controls manager-owned.
- Let the portal service account add members through the Admin SDK when a user self-joins.

Implementation should explicitly verify this behavior in the E8 Google Workspace tenant. If Google still permits a native subscribe-email path despite `INVITED_CAN_JOIN`, document the limitation and rely on portal reconciliation/visibility as the source of truth.

### 9. Admin management

Entry point:

```text
Manage -> Company -> Chats
```

In the Manage -> Company menu, put Chats below Leads.

Default table columns:

- Company.
- Group email, displayed in compact form such as `emerald-battery-labs@...` with the full address available for mailto/copy actions.
- Members.
- Sources.
- Kebab menu.

Do not show message activity or audit history. Do not show a sync timestamp in the dashboard table. The dashboard is for current state and repair needs.

Table interaction:

- Clicking a row opens that company's roster as a right-side slide-out panel, matching the admin/people slide-out pattern.
- The kebab menu offers `Edit`, `Email`, and `Delete`.
- `Edit` opens the same roster slide-out.
- `Email` opens `mailto:{groupAddress}`.
- `Delete` opens a concise alert confirmation modal before any destructive action.

Roster slide-out:

- Members: admin-only current roster, add/remove, source badges, opt-out status.

Repair action:

- Add a "Create missing alias" button when the group is missing, the primary address is wrong, or the expected alias is absent.
- This should rarely be needed, but gives staff a controlled repair tool when Google or sync state drifts.

No portal backfill controls. Backfill is a one-time script, not an admin dashboard feature.

### 10. Reconciliation

We maintain a local mirror of current Google Group membership, not an event history.

Update the local mirror immediately when:

- A portal user joins.
- A portal user leaves.
- An admin adds a member.
- An admin removes a member.
- A new deployment creates an investor membership.
- A canonical diligence-team change creates a diligence membership.
- The one-time backfill script creates or syncs groups.

Add a nightly reconciliation job using the existing scheduled-jobs infrastructure and its existing UI:

- Runs once per day at night, during a window when no other jobs are scheduled.
- Lists every company discussion group.
- Reads the Google Group member list.
- Rebuilds or updates the local current-membership mirror.
- Refreshes member counts and source badges where they can be derived from portal data.
- Flags mismatches or API failures as current issues on the admin dashboard.

We do not store:

- Who was added.
- Who was removed.
- Who performed a sync.
- What messages were sent.
- Message sender, subject, body, delivery, or moderation history.

### 11. Updates email forwarding

The portal already has code that processes emails sent to `updates@e8angels.com`. Extend that workflow:

1. When the updates processor determines that an email is relevant to a particular company, resolve that company's discussion group address.
2. If the company is a portfolio company and the group is missing, create it just in time before forwarding.
3. Send an alert email to:
   - The company-relevant email target already used or determined by the updates workflow.
   - The company's discussion group address.
4. Include the original email in full:
   - Original From.
   - Original To/Cc when available.
   - Original Subject.
   - Original received date.
   - Full HTML body with formatting preserved.
   - Plain-text fallback.
   - Attachments.
   - Inline images/content IDs when available.
5. Make the wrapper clear that this came through `updates@e8angels.com` and why the company was matched.

The forwarded email should preserve the original content as faithfully as the existing email infrastructure allows. If full attachment pass-through is not currently supported by the updates processor, add it to the implementation scope rather than stripping attachments silently.

## Hardcoded Google Group Configuration

Recommended MVP settings:

These settings should be hardcoded in the Google Groups creation/configuration code. There is no admin UI for editing them.

| Setting | Value | Reason |
|---|---|---|
| `whoCanPostMessage` | `ANYONE_CAN_POST` | Anyone on the internet can send mail to the group address. |
| `whoCanJoin` | `INVITED_CAN_JOIN` | Prevents Google-native self-join/request flow; portal adds members by API. |
| `whoCanAdd` | `ALL_MEMBERS_CAN_ADD` | Members can add other investors (e.g. a co-investor whose record lacks the right email). |
| `whoCanInvite` | `ALL_MEMBERS_CAN_INVITE` | Same as above, native-invite path. |
| `whoCanModerateMembers` | `ALL_MEMBERS` | Members can manage membership. **Caveat:** this also lets a member remove other members; for an investor list with small membership this is acceptable, flag if revisited. |
| `whoCanModerateContent` | `OWNERS_AND_MANAGERS` | Only the impersonated admin (effectively the service-account owner) can approve/reject moderated content. With `spamModerationLevel: SILENTLY_MODERATE` below, the queue should stay empty. |
| `allowExternalMembers` | `true` | Investors may use non-E8 emails. |
| `whoCanViewMembership` | `ALL_MANAGERS_CAN_VIEW` | Hides roster from normal members. |
| `whoCanViewGroup` | `ALL_MANAGERS_CAN_VIEW` | Keeps any Google-hosted group UI private to managers. |
| `whoCanDiscoverGroup` | `ALL_MEMBERS_CAN_DISCOVER` | Most-restrictive value the API offers — non-members and the public internet cannot find the group. Portal handles discovery on our side. |
| `showInGroupDirectory` | `false` | Not listed at groups.google.com. |
| `includeInGlobalAddressList` | `false` | Keeps lists out of Workspace autocomplete. |
| `isArchived` | `true` | Keeps a member-readable archive so a late joiner can see the history (still gated by `whoCanViewGroup`). |
| `archiveOnly` | `false` | The group receives mail. |
| `messageModerationLevel` | `MODERATE_NONE` | Normal delivery, no manual approval. |
| `spamModerationLevel` | `SILENTLY_MODERATE` | Google drops obvious spam silently — no moderation queue to babysit. (Switched from `MODERATE`; see "Moderation: how it actually works" below.) |
| `replyTo` | `REPLY_TO_LIST` | This is a **chat group**, not a broadcast list — replies go back to the group by default so threads stay coherent. Members who want to whisper to the sender must change the To address by hand. See "Reply behavior" note below. |
| `whoCanLeaveGroup` | `ALL_MEMBERS_CAN_LEAVE` | Self-service unsubscribe via `<group>+unsubscribe@` and Mail-client one-click. |
| `membersCanPostAsTheGroup` | `false` | Prevents anyone from sending mail that appears to come from the list itself (impersonation). |
| `enableCollaborativeInbox` | `false` | This isn't a support queue. |
| `allowWebPosting` | `true` | Members who'd rather use groups.google.com can. Realistically near-zero usage because the group is not discoverable — they'd have to bookmark the URL — but turning it off doesn't gain anything. |
| `includeCustomFooter` | `true` | Auto-append unsubscribe / preferences instructions to every message. |
| `customFooterText` | See below | |
| `primaryLanguage` | `en_US` | Explicit beats default. |

**Custom footer text:**

> To leave this list: click **Unsubscribe** at the top of this message, or email `{group}+unsubscribe@e8angels.com`. You can also manage your communication preferences in your profile at https://app.e8angels.com/member/profile.

Notes:
- The one-click **Unsubscribe** link in mail clients comes from the `List-Unsubscribe` header that Google Workspace adds automatically to outbound group messages. No code change needed for that to work in Gmail, Apple Mail, Outlook, etc.
- The profile-page link assumes we'll add a "Mailing lists you're on" section to `/member/profile` so the link is actionable for the member. **Follow-up task:** thread investor-group memberships into the user's profile page (read from `company_investor_groups` joined with `cacheManager.listGroupMemberEmails`).

### Reply behavior

`REPLY_TO_LIST` makes the group behave like a thread — hit Reply, everyone sees it. This is the right default for an investor "chat" where the typical exchange is "FYI we're considering a follow-on" → "we are too, here's what I'm hearing on valuation".

Surface these behaviors in the welcome email so nobody is surprised:
- **Replies go to the whole list.** If you want to whisper to the sender, change the To address by hand.
- **Reply-all does NOT add the list twice.** Google's group handling dedupes — clicking Reply All sends one copy to the list (which fans out to everyone), not one copy each.
- **Membership is private.** Members can see the list address and count, not the roster. When someone posts, recipients still see that sender's From address.
- **Leaving is self-service.** Members can use one-click Unsubscribe in their mail client, email the `+unsubscribe@` address, or ask `support@e8angels.com` for admin removal.

This raises the privacy bar slightly: a member can no longer reply "privately" by reflex. Spell it out in the welcome body and accept that — for a chat group it's the right trade.

### Moderation: how it actually works

With `spamModerationLevel: MODERATE` (the previously-listed value), Google holds suspected spam in a queue visible at `groups.google.com/forum/#!pendingmsg/<group>`. Notifications go to the group's owners (the impersonated admin `director@e8angels.com`) as a periodic digest — there is **no real-time alert, webhook, or Slack integration**, and in practice these emails are easy to miss. For a private list nobody outside the portal knows the address of, the queue should stay empty 99% of the time, but the 1% would sit indefinitely.

`SILENTLY_MODERATE` (now recommended) tells Google to drop obvious spam without holding anything for review. Trade-off: no recourse if a legitimate sender gets misclassified. Given list volume will be ~handful-of-messages-per-month, the friction of an unmonitored queue is worse than the rare false positive. **Flag for the team** if you'd rather keep `MODERATE` and accept the babysitting cost.

Implementation note: the official Groups Settings API defines `ANYONE_CAN_POST` as the internet-wide posting option and `INVITED_CAN_JOIN` as invited-only joining. Verify the exact accepted values in the E8 tenant during implementation because Workspace-wide policies can restrict group behavior. Use `scripts/test-investor-group-settings.js` to round-trip every setting against a throwaway group before shipping.

## Data Model

New tables:

```sql
CREATE TABLE company_chat_groups (
    company_record_id TEXT PRIMARY KEY,
    group_email TEXT NOT NULL UNIQUE,
    group_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    member_count INTEGER NOT NULL DEFAULT 0,
    auto_investor_count INTEGER NOT NULL DEFAULT 0,
    auto_diligence_count INTEGER NOT NULL DEFAULT 0,
    self_joined_count INTEGER NOT NULL DEFAULT 0,
    admin_added_count INTEGER NOT NULL DEFAULT 0,
    last_reconciled_at TEXT,
    last_reconcile_status TEXT,
    last_reconcile_error TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    created_reason TEXT
);

CREATE TABLE company_chat_group_aliases (
    company_record_id TEXT NOT NULL,
    alias_email TEXT NOT NULL PRIMARY KEY,
    is_current_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    retired_at TEXT
);

CREATE TABLE company_chat_group_members (
    company_record_id TEXT NOT NULL,
    person_record_id TEXT,
    email TEXT NOT NULL,
    source_json TEXT NOT NULL, -- ["Investor", "Diligence", "Self-add", "Admin-add"]
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
    left_at TEXT,
    PRIMARY KEY (company_record_id, email)
);

CREATE TABLE company_chat_opt_outs (
    company_record_id TEXT NOT NULL,
    person_record_id TEXT,
    email TEXT NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    PRIMARY KEY (company_record_id, email)
);
```

No join-request table and no audit/event table.

Migration policy:

- Create an explicit migration script under `scripts/`.
- Update `lib/cache-manager.js` `createTables()` for new environment setup only.
- Update `docs/database-schema.md`.
- Update `docs/data-query-glossary.md` because staff may ask which companies have discussion groups.
- Update `docs/ai-relationship-registry.*` if present because this adds soft relationships among people, companies, group membership, aliases, and email forwarding metadata.

## Sync Logic

One shared entrypoint:

```javascript
await syncCompanyDiscussionGroup(companyRecordId, { trigger, actorEmail });
```

Use it from:

- Deployment write path, after the deployment commit succeeds.
- Investor creation path: when someone becomes an investor in a company, add them to that company's discussion group after the investment/deployment commit succeeds, unless they previously opted out.
- Diligence-team add/remove/change path, after the change commits.
- Company rename path, after the name change commits.
- Member self-join path.
- One-time backfill script.
- Updates processor when it needs to forward to a missing portfolio-company group.

Sync behavior:

1. Resolve the expected primary group email from the current company name.
2. If the company qualifies and the group is missing, create it.
3. If the group email no longer matches the current company name, rename the group and create an alias for the old address.
4. Compute expected auto members from investors and the canonical diligence team list.
5. Exclude emails in `company_chat_opt_outs`.
6. Add missing expected members.
7. Never auto-remove members except when an explicit opt-out/removal exists.
8. Update the current local member mirror, counts, source badges, and issue state.

Just-in-time creation:

- Portfolio companies should never have "no discussion group" as a member-facing steady state.
- If a user opens a portfolio company and the group is missing, create it just in time.
- If creation fails, show a concise repair/error state and alert the Support Manager.

## Backfill Plan

Backfill is not an admin UI feature.

Add `scripts/backfill-company-chat-groups.js` with:

```text
Usage:
  node scripts/backfill-company-chat-groups.js --dry-run
  node scripts/backfill-company-chat-groups.js --company=<company_record_id>
  node scripts/backfill-company-chat-groups.js --limit=25
  node scripts/backfill-company-chat-groups.js --env=prod --dry-run
  node scripts/backfill-company-chat-groups.js --env=prod --limit=25
```

Per repo rules, the script must support `--env=prod` by swapping `TURSO_URL`, `TURSO_AUTH_TOKEN`, `AIRTABLE_BASE_ID`, and `AIRTABLE_API_KEY` from `PROD_*` values before loading config.

Backfill steps:

1. Dry run locally/staging: list companies that would get groups, expected address, investor count, diligence-team count, missing emails, rename/collision alerts, and alias changes.
2. Review the dry-run output with staff.
3. Run production backfill once after explicit approval.
4. Remove or archive the script after the one-time run if staff does not want it retained.

## API Routes

Member-facing:

- `GET /api/company-discussion-groups/my`
- `GET /api/companies/:id/discussion-group`
- `POST /api/companies/:id/discussion-group/join`
- `DELETE /api/companies/:id/discussion-group/membership/me`

Admin:

- `GET /api/admin/company-chats`
- `GET /api/admin/companies/:id/chat`
- `POST /api/admin/companies/:id/chat`
- `POST /api/admin/companies/:id/chat/sync`
- `POST /api/admin/companies/:id/chat/create-missing-alias`
- `GET /api/admin/companies/:id/chat/members`
- `POST /api/admin/companies/:id/chat/members`
- `DELETE /api/admin/companies/:id/chat/members/:email`

Scheduled:

- Nightly job/helper: `reconcileAllCompanyDiscussionGroups()`.

Updates processor:

- Internal helper, not necessarily a route: `forwardCompanyUpdateToDiscussionGroup({ companyRecordId, originalMessage })`.

All SQL belongs in `lib/cache-manager/company-chat-groups.js`.

## Dev Testing Safety

Google Groups are created in the real E8 Google Workspace, even when the portal is running against dev/staging data. Dev testing must therefore have a one-company creation mode.

Recommended guardrail:

- In non-production environments, block every Google Group create/rename/alias mutation unless the target company record ID matches an explicit allowlist.
- Configure that allowlist with a single company at a time, for example `COMPANY_CHAT_GROUP_DEV_COMPANY_RECORD_ID=<company_record_id>`.
- Require a second explicit enable flag before any non-production Google mutation, for example `COMPANY_CHAT_GROUP_DEV_ALLOW_GOOGLE_MUTATIONS=true`.
- If the flag or company record ID is missing, dev/staging can render UI, calculate expected addresses, preview expected members, and update local mock state, but must not create or mutate a real Google Group.
- If a dev/staging action targets any company other than the selected company, return a clear blocked response that names the configured company record ID requirement.
- Just-in-time group creation, admin "create missing alias", updates-processor forwarding creation, and backfill creation must all use the same guard.
- Nightly reconciliation in dev/staging may read existing Google Group membership for the selected company only. It must not create missing groups for all companies.

Dev smoke-test command shape:

```bash
node scripts/backfill-company-chat-groups.js --company=<company_record_id> --dry-run
COMPANY_CHAT_GROUP_DEV_ALLOW_GOOGLE_MUTATIONS=true COMPANY_CHAT_GROUP_DEV_COMPANY_RECORD_ID=<company_record_id> node scripts/backfill-company-chat-groups.js --company=<company_record_id> --create
```

The second command should create or repair only that one company list. It should refuse to run if `--company` is omitted or does not match `COMPANY_CHAT_GROUP_DEV_COMPANY_RECORD_ID`.

## Implementation Phases

### Phase 1: Foundations

- Add schema, docs, cache-manager module, and Google Groups service wrapper.
- Implement create group, apply settings, add/remove/list members, rename group, create alias.
- Implement Support Manager alert emails for collisions, failed creation, failed rename, and missing alias repair.
- Implement non-production Google mutation guardrails so dev/staging can create or repair only one explicitly selected company list.
- Add unit tests for slugging, collision alerting, expected membership, opt-outs, self-join, admin-add, rename/alias behavior, and idempotency.

### Phase 2: Member Experience

- Add company-page discussion group affordance visible to portal users.
- Add investment-table controls that show email, join/leave state, and member count.
- Add Company Discussion Groups tile to the member/profile page, modeled on the investments tile with a bounded scroll table.
- Add self-join and leave-list flows.
- Add just-in-time group creation for missing portfolio groups.

### Phase 3: Admin Console

- Add `Manage -> Company -> Chats` below Leads.
- Build admin table, kebab row actions, delete confirmation modal, and roster slide-out.
- Add create missing alias, create group, add member, and remove member flows.
- Add route tests for admin permission gating and membership operations.

### Phase 4: Reconciliation

- Add nightly reconciliation job using the existing scheduled-job mechanism.
- Schedule it once per day at night, avoiding existing scheduled jobs.
- Refresh local current-membership mirror and counts from Google Group membership.
- Surface reconciliation failures as current issues, not history.

### Phase 5: Backfill

- Add dry-run/backfill script.
- Run staging dry run and review output.
- Run one production backfill after explicit approval.

### Phase 6: Updates Processor

- Extend `updates@e8angels.com` processing to forward company-relevant updates to the company's discussion group.
- Preserve HTML body, text fallback, metadata, inline content, and attachments.
- Add tests for matched company forwarding, missing group just-in-time creation, attachment forwarding, and no-match behavior.

## Tests

Required tests for implementation:

- Slug generation and collision alert behavior.
- Google settings payload builder, including `ANYONE_CAN_POST` and `INVITED_CAN_JOIN`.
- Expected member calculation for investors and canonical diligence team members.
- Roster source badge calculation, including multiple badges for the same person.
- Diligence-team addition triggers sync after the group exists.
- Opt-out prevents auto-readd after later deployment, including a second investment.
- Self-join removes opt-out and adds the `Self-add` source.
- Admin add can override opt-out and adds the `Admin-add` source.
- Member summary returns address, count, and current user's membership state but not roster.
- Admin-only roster endpoint rejects non-admin users.
- Backfill dry run does not mutate data.
- Non-production Google mutation guard rejects broad create/rename/alias actions and permits only the explicitly selected company when the dev enable flag is set.
- Deployment write triggers sync for pre-existing group.
- New investor deployment adds the investor to the company discussion group and local current-membership mirror unless they previously opted out.
- Missing portfolio-company group is created just in time.
- Rename changes primary group email and creates old-address alias.
- Collision sends Support Manager alert and does not create a silent alternate address.
- Nightly reconciliation refreshes local membership from Google Groups.
- Nightly reconciliation preserves source badges derivable from portal data.
- Updates processor forwards full HTML and attachments to the company address and discussion group.

## Clarifying Questions

1. What exact system field/table is the canonical diligence-team list for a company?
2. Who is the Support Manager email recipient for collision/repair alerts?
3. What is "the email address relevant to the company" in the updates workflow: primary contact, company owner, deal lead, or an existing processor target?
4. Should people who self-join receive a confirmation email, or is the immediate joined state in the portal enough?
5. What nightly time window is currently clear of other scheduled jobs?

## Design Guide Compliance

- Form layout: Pass. Member actions use compact controls and avoid long forms.
- Control sizing/spacing: Pass. Buttons and row actions are compact and content-width.
- Table density, paging, and sticky-header behavior: Pass. Admin table is dense and should paginate when 50+ rows.
- Search input icon/text spacing: Pass. Mockups reserve left padding where search icons appear.
- Dialog/copy minimalism: Pass. Self-join/leave copy is short and action-focused.
- Mobile behavior: Pass in concept. Member widget stacks on mobile; admin detail drawer moves below the table.
