---
title: Per-Company Investor Google Groups
status: draft
owner: jordan
created: 2026-05-16
last_updated: 2026-05-16
mockup: mockup.html
---

# Per-Company Investor Google Groups

**Status:** Draft for team review
**Mockup:** [docs/mockups/per-company-investor-groups.html](../mockups/per-company-investor-groups.html)
**Related infrastructure:** `lib/google-groups.js` (already supports add/remove/list members; needs a `createGroup` + settings configurator)

---

## Goal

When a company has **2+ investors**, automatically provision a private Google Group at
`{company-slug}-investors@e8angels.com` and keep its membership in sync as new
deployments land. Surface the group as a "mail this list" affordance on the portfolio
company header and the member-facing investments page, while keeping the membership
roster private (size visible, identities not).

---

## Scope

### In
- New table `company_investor_groups` to track which companies have a group.
- Auto-provision on the deployment that brings a company to 2+ unique investors.
- Auto-add new investors on subsequent deployments.
- Manual just-in-time provisioning button on company surfaces (incl. the 1-investor case).
- Read-side affordance on:
  - Admin company page header (`/admin/company/:companyRecordId`) — chip in the existing right-side icon row alongside the link / cart / checklist / `de` icons.
  - Member investments page `/forms/investments` — new "List" column at the right end of the table.
- Anonymized membership for members (count visible; identities hidden).
- **Admin-only "Manage members" panel** on the company admin page so staff can remove someone who emails asking to be taken off (plus add, re-sync, and delete the whole group).

### Out
- Retroactive bulk creation across the whole portfolio. (Manual button covers the long tail.)
- Auto-removal of investors when they exit a position — admins do this on request via the Manage members panel.
- Posting from within the portal (UI is a `mailto:` link; sending happens in their mail client).
- Cross-company "all investors" digest groups.

---

## Naming and uniqueness

- Slug: lowercase, hyphenated, alphanumerics only, max 50 chars; e.g. `Emerald Battery Labs` → `emerald-battery-labs-investors@e8angels.com`.
- If a slug collides (rare — e.g. two companies with same name), append `-2`, `-3`, etc.
- **Slug is locked at creation.** Renaming a company in the portal does NOT rename the group. We display the group address as-is.

---

## Data model

New table (migration script + `createTables()` update; DO NOT auto-migrate at boot):

```sql
CREATE TABLE company_investor_groups (
    company_record_id      TEXT PRIMARY KEY,
    group_email            TEXT NOT NULL UNIQUE,
    member_count           INTEGER NOT NULL DEFAULT 0,
    last_synced_at         TEXT,                 -- UTC ISO
    welcome_scheduled_for  TEXT,                 -- UTC ISO; debounce target for the welcome send
    welcome_sent_at        TEXT,                 -- UTC ISO; NULL until sent
    created_at             TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by             TEXT,                 -- admin email, or 'auto'
    created_reason         TEXT                  -- 'auto-threshold' | 'manual'
);
CREATE INDEX idx_cig_group_email ON company_investor_groups(group_email);
CREATE INDEX idx_cig_welcome_due ON company_investor_groups(welcome_scheduled_for)
    WHERE welcome_sent_at IS NULL;
```

Glossary: this is admin/infra metadata; **no `data-query-glossary.md` update required** (staff would never query it directly).

---

## Membership: who counts as an investor

"Investors in a company" = distinct `person_record_id` resolved from `deployments` rows for that `company_record_id` where `record_type = 'deployment'` AND `amount_cents > 0`.

For each investor person, resolve their **primary email** from `people`. People without a usable email are skipped (logged, surfaced in the admin UI's "issues" line on the dialog).

---

## Provisioning flow

### Auto (on deployment write)

In the existing deployment write path (post-commit):

1. Compute distinct investor count for the company.
2. If count ≥ 2 AND no row in `company_investor_groups`:
   - Generate slug, resolve any collisions.
   - `googleGroups.createGroup({ email, name: '<Company> Investors', description: 'Private list for E8 investors in <Company>.' })`.
   - Apply privacy settings (see below).
   - Insert `company_investor_groups` row with `created_reason='auto-threshold'` and `welcome_scheduled_for = now + 5min`.
3. Whether new or pre-existing: diff current members against expected investor emails, add new ones via the existing `addMembersToGroup`. Never auto-remove.
4. Update `member_count` and `last_synced_at`. **If the group is still in its pre-welcome window (`welcome_sent_at IS NULL`), bump `welcome_scheduled_for` to `now + 5min`** — see "Welcome email" below.

Failures here do NOT block the deployment. Errors are logged and surfaced as a banner on the company page ("Investor mailing list sync failed — retry") with a retry button.

### Manual (just-in-time)

Wherever "Email investors" lives today (and on every portfolio company surface): show a single chip / button:

- **If group exists**: `📬 Email 12 investors` → `mailto:emerald-battery-labs-investors@e8angels.com`
- **If group does not exist**: `📬 Email investors` → opens dialog (see Mockup §3):
  - Title: "Create investor mailing list?"
  - Body: "There's no mailing list yet for **{Company}**. Create one now?"
  - Footnote with the eventual address and the resolved investor count.
  - Confirm → provisions, then dialog flips to a success state with the address as a `mailto:` link and a "Copy address" button.

For the 1-investor case the dialog explains it'll be a 1-person list and asks to confirm anyway (rather than silently refusing).

---

## Privacy / Google Groups settings

Applied at creation (Groups Settings API):

| Setting | Value | Why |
|---|---|---|
| `whoCanViewMembership` | `ALL_OWNERS_CAN_VIEW` | Members can't enumerate other members. |
| `whoCanViewGroup` | `ALL_MEMBERS_CAN_VIEW` | Members can read messages. |
| `whoCanPostMessage` | `ANYONE_CAN_POST` | A member can email it; an outside investor or LP candidate can ask the group a question; our own outbound infra (e.g. MailGun-relayed welcome message) gets through without needing to be a member. |
| `spamModerationLevel` | `MODERATE` | With `ANYONE_CAN_POST` we accept any sender, so let Google's spam scoring quarantine obvious junk. List addresses are never published outside the portal, so volume should stay near zero. |
| `whoCanContactOwner` | `ALL_MEMBERS_CAN_CONTACT` | For unsubscribe / questions. |
| `whoCanJoin` | `INVITED_CAN_JOIN` | We control membership. |
| `replyTo` | `REPLY_TO_SENDER` | Prevents reply-all from revealing the roster of recipients via Cc. |
| `includeInGlobalAddressList` | `false` | Doesn't appear in autocomplete or directory. |
| `showInGroupDirectory` | `false` | Not listed at groups.google.com. |
| `allowExternalMembers` | `true` | Investors may have non-e8angels.com emails. |
| `archiveOnly` | `false` | List is for sending. |
| `messageModerationLevel` | `MODERATE_NONE` | No moderation overhead. |

**Anonymity caveat to flag to the team:** when a member sends to the list, the recipients see the sender's "From" address. We can't hide that via group settings. Anonymity in this design means *you can't enumerate the list*; it does NOT mean *posts are anonymous*. The tooltip copy reflects this.

**Why "anyone can post":** beyond letting our own outbound infra send the welcome message, we want the list to be reachable by an interested non-investor (e.g. a member considering a follow-on, or someone who heard about the company through E8 and wants to ask the cap table a question). Since list addresses are never exposed outside the portal, abuse risk is low; spam moderation handles the long-tail.

---

## Welcome email (sent on creation, with a delay)

When a group is created — auto or manual — we send a single introductory message to the list itself so every member receives it. **The send is delayed and debounced** so that batch deployment workflows (e.g. an admin recording several deployments for a closed round in one sitting) don't fire the welcome to the first 2 investors and then leave the 3rd, 4th, … out.

**Mechanics — no scheduled jobs, no cron entries, no in-memory timers.** The "schedule" is a single column on the row:

- On create: `UPDATE … SET welcome_scheduled_for = now() + interval '5 min', welcome_sent_at = NULL`.
- On every subsequent member-adding sync, while `welcome_sent_at IS NULL`: the same `UPDATE` runs again. It's an idempotent column write — pushing the deadline forward costs one row write, doesn't enqueue anything, and doesn't need to be cancelled.
- One existing background worker (the same tick that drives `lib/recurring-emails/dispatcher.js` — runs every minute or so) executes one query per tick:

  ```sql
  SELECT company_record_id, group_email
  FROM company_investor_groups
  WHERE welcome_sent_at IS NULL
    AND welcome_scheduled_for <= datetime('now')
  LIMIT 50;
  ```

  For each row returned, it sends the welcome via the standard transactional mail path and stamps `welcome_sent_at`. The partial index `idx_cig_welcome_due` keeps that query O(due-rows), not O(table).

- After `welcome_sent_at` is set, later additions are silent (no per-add notifications). New investors land on the list and start receiving any future messages, but no backfilled welcome.

**What this avoids:**
- No per-group entries in any cron table or scheduled-task store. The set of "things to do" is just rows where one column is in the past.
- No timers to cancel when the deadline gets bumped — the next tick simply re-reads the column.
- No drift if the worker is restarted, the box reboots, or the deploy ships a fresh worker — state lives in the row.
- Worst-case actual delay = 5 min + one tick interval (~6 min). Acceptable for a welcome message.

**Sender:** `support@e8angels.com` (or whatever the existing transactional sender is) addressed to the group itself, not to individual members. Because `whoCanPostMessage = ANYONE_CAN_POST`, this delivers cleanly. Reply-To = `support@e8angels.com` so confused replies reach a human, not the whole group.

**Body (draft — please edit):**

> Subject: You're on the **{Company} investors** mailing list
>
> Hi — E8 just created a private mailing list for everyone who's invested in **{Company}**:
>
> &nbsp;&nbsp;&nbsp;&nbsp;`{company-slug}-investors@e8angels.com`
>
> Email that address to reach all the other investors at once. New investors are added automatically as they make a deployment.
>
> A few things to know:
>
> - The list is **private** — when you're on it, you can see the address but not the roster. Other investors can see when *you* post (your From line is visible) but not the other recipients.
> - To leave the list, reply to this message and ask, or email `support@e8angels.com` and we'll remove you. (Google's `+unsubscribe` self-service also works.)
> - Anyone can email the list, including non-investors with a question for the cap table.
>
> Questions: `support@e8angels.com`.

**Manual override:** the admin Manage Members panel (Surface 4) shows the welcome status (`Welcome scheduled for HH:MM` / `Welcome sent at HH:MM`) and offers a **Send welcome now** button to fire early when the admin knows the membership is settled.

---

## Leaving the list

Two paths:

1. **Self-service via Google Groups** — `<group>+unsubscribe@e8angels.com` works natively. Members can also unsubscribe from groups.google.com if they sign in with the Google account that owns their list email.
2. **Admin-managed (primary path)** — when someone emails E8 staff saying "please take me off", an admin opens **Manage › Companies**, finds the row, and uses the row kebab → **Investor mailing list…** to open a panel showing current members with a Remove button per row. This is also where admins can:
   - Re-sync membership from current deployments (adds anyone who should be on it).
   - Add a member by email (one-off, e.g. an investor whose record is missing an email).
   - Delete the entire group (with confirmation), e.g. on company shutdown.

The admin panel is the only place the full member list is exposed in the portal — gated to admin role, never shown to members.

---

## UI surfaces

### 1. Application-review page header (portfolio companies)
The portfolio-company application-review header already shows a meta line:

> Total invested: **$545,000** · First: Nov 2025 · Stage: Invested

Append one more dot-separated item, **only when the company has an investor group**:

> … · Stage: Invested · ✉ **Email investors** (12)

- The `✉` is the Lucide `Mail` icon, sized to match the surrounding text.
- The label and the count are part of the same `mailto:` link.
- Hidden entirely when no group exists. Member-facing surfaces never show a "create" affordance — provisioning is automatic at the 2-investor threshold; manual creation lives in the admin grid (Surface 4).
- This works because **only portfolio companies** ever get a group, so the meta line stays clean for non-portfolio companies (which don't show "Total invested" either).
- Tooltip (delay 0): `12 people who invested in Emerald Battery Labs are on this list. Membership is private — you'll see the list address, not who's on it.`

### 2. /forms/investments table
New **separate** column at the right end of the table, immediately before the row kebab. **No header text.** Each cell is just the Lucide `Mail` icon (no count, no pill chrome) — clicking opens `mailto:`. Hover tooltip (delay 0): `Email the 12 other people who invested in Emerald Battery Labs (membership is private)`.

Rows for companies without a group show an empty cell.

### 3. Create-list dialog
Two states (prompt → success). On success the address is shown once with a Copy button and a `mailto:` link. Reached only from the admin grid (Surface 4) — never from member-facing surfaces.

### 4. Admin Manage › Companies grid kebab (`CompaniesAdminIsland`)
The admin URL the user pointed at is `/admin/company/:companyRecordId?tab=companies&companies_view=3`, the **CompaniesAdminIsland** grid. Each row already has a kebab menu (Record Valuation Event, Apply Cramdown, Most Recent Application, Delete). Add one item:

- **Investor mailing list…** — opens the Manage members panel for that row's company.
  - If no group exists, the panel opens in an empty state with a primary "Create mailing list" button (uses Surface 3's prompt copy inline).
  - If it exists, the panel opens directly to the member list.

The Manage members panel itself contains:

- Header: group address (with copy), member count, "Last synced" timestamp, "Re-sync now" button.
- Member table: email · status (Invited / Active / Bouncing — from Groups API) · Remove button.
- Footer actions: "Add member by email…" inline input, and a destructive "Delete group" with a typed-confirmation guard.
- **Welcome status** strip: `Welcome scheduled for 3:42 PM` (countdown to fire) or `Welcome sent at 11:08 AM Mar 12`. While pending, a **Send welcome now** button fires it immediately and stamps `welcome_sent_at`.
- All actions hit the routes below; updates are optimistic.

---

## Implementation phases

1. **Schema + lib**
   - Migration SQL `scripts/migrate-add-company-investor-groups.sql`; update `createTables()`.
   - Extend `lib/google-groups.js`: `createGroup({ email, name, description })`, `applyGroupSettings(email, settings)`, `groupExists(email)`.
   - Add `lib/cache-manager/investor-groups.js` with the SQL helpers (`getByCompany`, `upsert`, `incrementMemberCount`).

2. **Sync service**
   - `lib/investor-group-sync.js` with `syncCompany(companyRecordId, { trigger })` — single entrypoint used by both the deployment hook and the manual button. Bumps `welcome_scheduled_for` on every additive sync while `welcome_sent_at IS NULL`.
   - Wire into the existing deployment write path post-commit (don't block writes).

3. **Welcome dispatcher** (`lib/investor-group-welcome.js` + scheduled job)
   - Polls `company_investor_groups` for `welcome_sent_at IS NULL AND welcome_scheduled_for <= now()` (uses the partial index above).
   - Renders the welcome template (variables: company name, group address) and sends via the existing transactional mail path; uses the per-job idempotency-key pattern already used by other senders (key = `welcome:<company_record_id>`).
   - Stamps `welcome_sent_at` on success; logs and retries with backoff on transient failures.
   - Runs on the same scheduler as other portal jobs — interval ≤ 1 min so the worst-case actual delay is ~5–6 min.

4. **Routes**
   - `GET /api/companies/:id/investor-group` → `{ exists, groupEmail, memberCount, lastSyncedAt, eligibleInvestorCount, welcomeSentAt, welcomeScheduledFor }`.
   - `POST /api/companies/:id/investor-group` → manual provision.
   - `POST /api/companies/:id/investor-group/sync` → re-sync members on demand (admin only).
   - `POST /api/admin/companies/:id/investor-group/send-welcome` → fire the welcome immediately (admin override).
   - `GET /api/admin/companies/:id/investor-group/members` → admin-only roster.
   - `POST /api/admin/companies/:id/investor-group/members` `{ email }` → manual add.
   - `DELETE /api/admin/companies/:id/investor-group/members/:email` → manual remove.
   - `DELETE /api/admin/companies/:id/investor-group` → delete group entirely.
   - Member-facing read endpoint embedded in the existing investments listing payload (one extra join — no separate roundtrip).

5. **Frontend**
   - Reusable `<InvestorGroupChip companyId={...} />` used in the portfolio header and the investments table cell.
   - Reusable `<InvestorGroupCreateDialog />` (alert-dialog pattern from design guide §2.13 — plain `Button`, manual close).
   - Manage-members panel includes the welcome status strip and "Send welcome now" button.
   - Tooltip via `ourtooltip` shorthand with `delayDuration={0}`.

6. **Tests** (per AGENTS.md test-first rule)
   - Unit: slug generation, collision handling, threshold logic (1 → no group, 2 → group), debounce-bump logic (each add resets the timer; bump is a no-op once `welcome_sent_at` is set).
   - Route: provisioning idempotency, permission gating, missing-email handling, send-welcome override.
   - Integration: deployment write triggers sync; second deployment for same company adds the new investor; **batch deployment scenario** (3 deployments inside the 5-min window) sends exactly one welcome that includes all 3 investors.

---

## Open questions for the team

1. **Domain confirmation.** Are we OK with `e8angels.com` as the group domain? (Service account must have admin SDK delegation for that workspace; confirm it does.)
2. **Member-facing visibility.** Should members see the chip on companies *they* didn't invest in (so they could ask to be added), or only on their own holdings? Mockup shows the latter.
3. **Investor email source.** Use the person's primary work email, or a preference field if one exists? Need to confirm there is one canonical "communications" email per person.
4. **Sender-anonymity expectation.** Confirm the team understands that recipients see the sender's address (group privacy ≠ post privacy). Tooltip wording reflects this — adjust if you want a different framing.
5. **Renaming.** If a company is renamed post-creation, do we want to (a) keep old slug forever, (b) create a Google alias on the new slug, or (c) rename the group? (a) is the simplest and what's drafted.
