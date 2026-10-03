---
title: "Multiple email addresses per person"
status: draft
owner: jordan
created: 2026-10-02
last_updated: 2026-10-02
home: mockup.html
---

# Multiple email addresses per person

A person has zero or more email addresses: at most one **primary** and any number of **secondaries**.

- **Primary:** the address we email them at, and the value behind `people.email` and everything that reads it today.
- **Secondaries:** used for identity matching (Luma, forms, imports, inbound mail) and as a fallback for Slack and Google Drive.

Email is identity. Two people with the same name and different addresses are different people. Name matching applies only to sources that have no email address, such as Zoom participant lists.

The UI keeps multiple addresses rare:

- Sign-up asks for one address.
- Admins can see and manage every address. Their default edit action replaces the address.
- Members see all of another member's addresses, comma-separated.
- People with one address cannot add a second one themselves.

Mockup: [mockup.html](mockup.html), covering admin view and edit, replace confirmation, address taken, self-edit with one and with several addresses, verification pending, entrepreneur account page, Show Member, and sign-in with a secondary.

## Production sizing (read-only, 2026-10-02)

| | count |
|---|---|
| people rows | 7,570 |
| with no email | 221 |
| distinct `LOWER(TRIM(email))` | 7,350 (no case-insensitive duplicates) |
| `email` not already lowercase and trimmed | 16 |
| `fund_investors` rows with `alternate_emails` | 6 of 152 |

`people.email` is declared `TEXT UNIQUE`, but SQLite compares it case-sensitively, so `A@x.com` and `a@x.com` can coexist today. Every lookup uses `LOWER(email)` and returns whichever row it finds first.

## 1. Data model

### Recommendation: a `person_emails` table that holds *every* address, with `people.email` kept as a mirror of the primary

```sql
CREATE TABLE IF NOT EXISTS person_emails (
    email TEXT PRIMARY KEY,                -- always stored LOWER(TRIM()); one owner per address
    person_record_id TEXT NOT NULL REFERENCES people(record_id),
    is_primary INTEGER NOT NULL DEFAULT 0, -- 0/1
    source TEXT,                           -- 'migrated' | 'admin' | 'self' | 'merge' | 'import' | 'form' | 'luma' …
    verified_at TEXT,                      -- UTC instant; set when a link to this address was clicked (magic link or change verification)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_person_record_id TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_person_emails_one_primary
    ON person_emails(person_record_id) WHERE is_primary = 1;
CREATE INDEX IF NOT EXISTS idx_person_emails_person ON person_emails(person_record_id);
```

**Why this design and not a secondaries-only table:** the requirement is that an address belongs to at most one person, primary or secondary, case-insensitively. A secondaries-only table can't enforce that in the database, because nothing stops a secondary from equalling someone else's `people.email`; every writer would have to check both tables, and some would forget. With all addresses in one table, `email` as the primary key enforces global uniqueness, and the partial unique index enforces "at most one primary". A person with no address simply has no rows.

**Keeping `people.email` consistent:**

- `people.email` stays in place as the compatibility layer, so the roughly 160 existing readers keep working unchanged.
- It must always equal the `is_primary = 1` row, or be NULL when there is no primary.
- Every write goes through one CacheManager function in a new `lib/cache-manager/person-emails.js` domain module.
- That function writes `person_emails` and `people.email` in one Turso `batch` (a single transaction), so the two can't diverge.
- `createPerson` and `updatePerson` already sit on every write path to `people.email` (the admin PATCH, member PATCH, entrepreneur verification, prospect update, development person, MCP `executePeople`, form and intake creates). When `fields.email` is present they delegate to this function, so no caller is missed.
- Writes are normalized to lowercase and trimmed. The existing `PEOPLE_EMAIL_CONFLICT` error becomes `PERSON_EMAIL_CONFLICT` and carries the holder's `person_record_id`, which the admin UI needs.
- A focused test (`__tests__/lib/person-emails-consistency.test.js`) covers the write paths.
- A read-only audit script (`scripts/audit-person-emails.js --env=prod`) reports drift: a people row whose email has no matching primary row, or a primary row whose people row disagrees. It also runs as step 3 of the migration.
- I considered SQLite triggers for the mirror and rejected them. They would have to work in both directions (`people.email` ← primary row ← `people.email`), and Turso migrations here are applied by hand, so a trigger missing in prod would fail silently.

### Migration (prod applied by hand with Jordan's approval)

`scripts/migrate-person-emails.js` (idempotent; `--env=prod`; prints counts only):

1. `CREATE TABLE` and the two indexes above.
2. `UPDATE people SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email))`: 16 rows today. The script aborts if this would create a duplicate.
3. `INSERT OR IGNORE INTO person_emails (email, person_record_id, is_primary, source, created_at) SELECT LOWER(TRIM(email)), record_id, 1, 'migrated', datetime('now') FROM people WHERE TRIM(COALESCE(email,'')) <> ''`: about 7,349 rows. A second run is a no-op, so the step can be repeated after deploy to pick up rows that old code wrote in between.
4. Run the audit and print the drift count, which should be 0.

`fund_investors.alternate_emails` stays untouched in this migration. It means "also send fund mail here", which is a different meaning from "this is the same person" (open question 6).

Rollback: the table is additive. Old code ignores it, so rolling back the deploy is enough. Dropping the table needs separate approval.

### Bootstrap schema and docs

- Add the DDL to `CacheManager.createTables()` in `lib/cache-manager.js`, next to `people`. Do not wire it into startup.
- Update `docs/database-schema.md`.
- `docs/data-query-glossary.md`: people.email means "primary address"; to match a person by any address, join `person_emails`.
- `docs/ai-relationship-registry.json`: add the soft FK `person_emails.person_record_id → people.record_id`.
- Write contract (`lib/data-query/write-contracts.js`): the people.email entry, which says "THE LOGIN IDENTITY … the admin path does not migrate existing sessions", is rewritten. `person_emails` is read-only for MCP in v1. Writes to people.email go through the shared function, so MCP edits stay consistent.
- `lib/data-query/sql-guard.js`: `person_emails` holds PII, so restrict it to the admin data-access tiers and keep it away from the member tier.

### Merge implications

**People Merge (PR #1017):**

- Replace the stub `preserveAbsorbedPersonEmail()` with an UPDATE that moves the absorbed person's rows to the survivor as secondaries: `UPDATE person_emails SET person_record_id = :survivor, is_primary = 0, source = 'merge' WHERE person_record_id = :absorbed`.
- It must run **inside** `mergePersonRecords`' batch, before the absorbed `people` row is deleted. Today the hook runs after the merge commits, and by then the FK row would be orphaned or the absorbed address would be gone.
- Add `person_emails.person_record_id` to `PERSON_MERGE_SPECIAL` (`handledBy: preserveAbsorbedPersonEmail`); `people-merge-coverage.test.js` will demand it.
- In the analysis, return `emailPreserved: true` and the list of addresses that will move. The review dialog then shows "dana@… will become another address for Dana".
- The absorbed person's sessions and tokens are still deleted. The survivor can sign in only with the survivor's primary (see the login rule).
- MailerLite cleanup for the absorbed address is unchanged: the address leaves the role groups and is not deleted.

**Company Merge:** `person_emails` references no company, so `COMPANY_MERGEABLE_FIELDS`, `repointCompanyLinksForDeduplication` and `bulkDeleteCompaniesForAdminGrid` need no change. `company-merge-coverage.test.js` should stay green.

**Person delete:** add `person_emails` to the delete batch in `people-identity.js` (around the list at line 2553), so a deleted person's addresses become free for reuse.

## 2. Consumer inventory

Full line-level inventory from a sweep of `lib/`, `routes/`, `src/` and `index.js`. Counts are call sites.

| Class | Sites | Where |
|---|---|---|
| **Any address matches** (inbound identity) | about 75 | `getPersonRecordIdByEmail` / `getPersonByEmail` / `getPeopleByEmails` / `findPersonRecordIdByEmail`, `auth.getPersonByEmail`, the people-cache email index; Luma registration and Zoom-name → Luma-guest matching; `findOrCreatePersonForForm` and application team members; contact, membership-interest and public intake; Stripe checkout and invoice → person; admin lookup and duplicate checks; investment-interest CSV and pasted emails; Gmail log-email, person_communications sender/recipient matching, development and Decarbon8 email events and rosters; Zoom OAuth connect; MCP `hookNormalizePersonEmail` / `lookupPersonIdByEmail`; uniqueness checks on email change |
| **Primary, then secondary fallback** | about 37 | Slack `users.lookupByEmail` (22 sites, all through `slack-notifier.findUserByEmail`); Drive grants (`grantFolderAccessToUser`, `grantFileEditAccess`; 9 sites); applicant company-domain matching and auto-join (4); Stripe `getOrCreateCustomer` (1); Luma name+domain gate (1, removed by PR #1018) |
| **Primary only** | about 85, plus about 78 Mailgun sends | All outbound mail; session identity and the role refresh; auth_admins, TOTP and MCP grant identity; MailerLite; hub, committee and company-chat Google Groups; Google Calendar invites and meeting audiences; exports and the admin grid email column; `getPersonMembershipFieldsByEmail` callers |

Most "any address matches" sites go through four helpers. Teaching `getPersonRecordIdByEmail` and the in-memory `_peopleCacheByEmail` map to index every address covers them in one change: the cache person object gains `emails: [{ email, isPrimary }]`, and `email` stays the primary.

About 15 sites run their own SQL or keep their own map. Each needs a small edit to join `person_emails`:

- `auth.js` :956 and :1019
- `development.js` :2073, :2080 and :2175
- `decarbon8-campaign.js` :311 and :829
- `data-query-access.js` :355 and :415
- `mutation-executor.js` :724 and :2163
- `members-with-open-stripe-invoice.js` :29
- `person-emails.js` :214 and :312
- `pipeline-management.js` :2421
- `committees.js` :1623
- `diligence-email-notifications.js` :99

**Fallback recommendations beyond Slack and Drive:**

| Place | Fallback? | Why |
|---|---|---|
| Slack DM / mention lookup | yes: primary, then secondaries | The Slack account often uses the work address while E8 mail goes to a personal one. Do it once, inside `findUserByEmail`, which resolves the person by any address and tries their addresses primary first. |
| Slack channel *removal* (`diligence.js:3737`) | try **all** addresses | Removal has to catch whichever address they were added under. |
| Drive folder and file grants | yes: primary, then secondaries | Grant to the primary. If Drive rejects it (no Google account at that address), try secondaries in order. |
| Drive revokes and reconcile (`reconcileDiligenceFolderAccess`, `revokeFolderAccessForUser`) | match **all** addresses | Otherwise an access grant made under a secondary is never revoked. This is a security requirement. |
| Applicant domain auto-join and company match | yes: any non-personal domain among the person's addresses | Same intent as today, with more evidence. Auto-join only ever *offers* access. |
| Stripe customer lookup | yes: primary, then secondaries | Avoids creating duplicate Stripe customers when a member paid under an older address. |
| person_communications and Messages history | all addresses | Mail they sent from a secondary belongs in their history. |
| Development and Decarbon8 Apps Script rosters | list all addresses | The roster is a filter for inbound mail. |
| Google Groups (hub, committee, company chat) membership | **no**, primary only. Removal checks all addresses. | Group mail is mail. |
| Mailgun, Gmail send-as, MailerLite, Calendar invites | **no** | The primary is the single place we send. Auto-falling back on a bounce would mail an address the person may have abandoned (open question 7). |
| Session identity, admin flags, TOTP, MCP grants | **no**, keyed to the person and the primary | These are security identity, not matching. |
| Zoom attendance | unchanged: name-based | There is no email in the source. |

## 3. Login: should a link sent to a secondary sign the person in?

**Recommendation: no. Sign-in links go only to the primary.** When someone enters one of their secondaries on a sign-in form, we send the link to their **primary** and say so with a masked hint ("We sent a sign-in link to the main address on your account, pr•••@ce•••.com"). We never create a new account for an address that is already someone's secondary. Today an unknown address on the application sign-in creates an Entrepreneur person, and that branch must check `person_emails` first.

**Risk this avoids:**

- Secondaries mostly arrive *unverified*: Luma registrations (anyone can register any address), imports, form team-member lists, merges and admin typing.
- Old work addresses get recycled by the employer.
- A magic link is full account access, including LP and fund pages. Only admins have 2FA.
- If a secondary could sign someone in, whoever controls any address ever attached to a person would own the account.
- The masked hint reveals that an account exists. The current flow already does that for unknown addresses (`not_found`), so this adds no new enumeration.

**Google sign-in** (`createSessionForVerifiedIdentity`) follows the same rule in v1. It matches a person only by primary. A verified secondary gets the message "Sign in with the main address on your account". Allowing Google-verified secondaries is open question 2.

Supporting changes in the auth layer, which has two copies (`lib/auth.js` and its duplicate mixin `lib/cache-manager/permissions.js`):

- `auth.getPersonByEmail` gains a `{ match: 'primary' | 'any' }` option. The login paths pass `'primary'` and branch on a new `resolvePersonEmail(email) → { personRecordId, isPrimary }`.
- `_createAndSendMagicLink` always sends to `people.email`, never to the typed address.
- `getSession`'s hourly role and access refresh resolves by `auth_sessions.person_record_id` instead of `row.email`, so a primary change no longer strands sessions. `person_record_id` is already stored on sessions.
- Successful magic-link verification sets `person_emails.verified_at` on the primary.

## 4. Email changes and identity

All four actions run through one server operation in `person-emails.js`, so the side effects are identical whether an admin, the person or MCP triggers them.

| Action | `person_emails` / `people.email` | Sessions and sign-in links | Email-keyed identity rows | MailerLite | Google groups (hub, committee, company chat), calendar |
|---|---|---|---|---|---|
| **Replace primary** (the default edit) | The old row is deleted, or kept as a secondary if "Keep as another address" is ticked. The new row is inserted as primary. `people.email` is updated in the same batch. | Sessions stay valid: they resolve by person id, and their stored email is rewritten to the new address. Outstanding `auth_tokens` for the old address are deleted. | `auth_admins`, `auth_user_totp`, `data_query_access_grants` and `mcp_oauth_*` `.email` are re-keyed to the new address in the same batch. Today an admin email edit silently drops admin access and 2FA. | Remove the old address from role groups, then upsert the new address with the person's role groups. General Subscribers is additive, so the old address stays there. | Swap the old address for the new one. Hub sync already runs on email change; committee and company-chat sync are added. Meeting invites are moved by the existing `resyncPersonEmailInvites`. |
| **Make primary** (an existing secondary) | Swap the `is_primary` flags in one batch and mirror the result into `people.email`. | Same as replace. | Same as replace. | Same as replace. | Same as replace. |
| **Add secondary** | Insert the row. A conflict with any person returns the holder. | none | none | none (secondaries are never subscribed) | none |
| **Remove secondary** | Delete the row. The primary can't be removed while other addresses exist; make another address primary first. Removing the last address is allowed for admins only. | Delete `auth_tokens` rows for that address. | none | none | Remove that address from any group or Drive share it was added under (removal matches all addresses). |

Who may do what:

- **Admin** (`admin.membership.view` edit path): all four actions. Replacing the primary of someone who has an active session or sign-in link, or holds admin access, 2FA or a data-connector grant, shows a confirmation first (mockup: "Admin: replace confirm"). Otherwise the change autosaves like any other field.
- **Member self-edit** (`PATCH /api/member/profile`): today this writes `people.email` immediately with no verification, no normalization and no session handling.
  - Proposed: replacing the primary sends a verification link to the new address, reusing `entrepreneur_email_change_tokens` (renamed `email_change_tokens`).
  - Removing a secondary, or making an existing secondary primary, applies immediately. The person already receives mail there, and it is one of their own addresses.
  - With several addresses, editing a secondary's text means remove plus add. The new text is stored unverified and can't sign them in.
  - People with one address get no Add control.
- **Entrepreneur** (`/forms/application/account`): the existing verified change flow becomes "replace primary" through the shared operation. The several-address state lists the secondaries with Make primary and Remove.
- The form sync comment "Account email changes require identity-aware session and token handling" (`lib/cache-manager.js:27082`) stays true: application forms never change an existing person's email. With this design a form address that matches no one creates a new person, and PR #1016 already enforces that.

## 5. Integration with in-flight work

- **People Merge (PR #1017):** fill `preserveAbsorbedPersonEmail()` as described in §1, moved inside the merge batch, and add `person_emails` to the coverage list. If #1017 merges first, this lands in PR 1 below; otherwise #1017 rebases onto it.
- **Luma email-only matching (PR #1018):** `recordLumaRegistration` calls `getPersonRecordIdByEmail`, so it consults all addresses once PR 1 lands, with no Luma code change. Add a regression test where a registration on a secondary resolves to the person and creates no new person. `scripts/fix-luma-name-matched-registrations.js` should run *after* PR 1 deploys, so a registrant whose address is already a secondary isn't split into a new person.
- **PR #1016** (form team-member identity): already removes the name-match email overwrite in `findOrCreatePersonForForm`. No conflict.

## 6. UI (see mockup)

- **Admin Edit Person** (`src/islands/EditPersonIsland.jsx` in `AdminDetailSheet`):
  - View mode lists every address in the Basic Info `InfoItem`, with the primary first and an outline "Primary" badge. People with one address show no badge.
  - Edit mode keeps the primary as the existing `Input`, so typing replaces it. Secondaries are read-only rows with a ⋯ menu (Make primary / Edit address / Remove). "+ Add another address" is a text link.
  - Conflict: "That address belongs to **Name** (role)", with a link to the record and "Merge them…", which opens the PR #1017 dialog prefilled.
- **Member profile dialog** (`ProfileReviewDialog.jsx`):
  - One address: unchanged, plus the verification-pending banner after a change.
  - Several addresses: one input per address, a "Use for E8 email" radio, and remove on every address except the one we email. No Add button.
  - Conflict copy never names the holder: "That email address is already associated with another account."
- **Entrepreneur account page:** unchanged with one address. With several, secondaries are listed with Make primary and Remove. Sign-up still asks for one address.
- **Show Member** (`PersonProfileModal` in `MemberDirectoryTile.jsx`): all addresses, primary first, comma-separated, each its own mailto link. The member-directory payload gains `emails`.
- **Sign-in:** the masked "sent to your main address" state on both the portal and the application sign-in pages.

## 7. Build plan (reviewable PRs)

1. **Data layer and identity matching (no UI).**
   - Schema module, bootstrap DDL, migration script and audit script.
   - Single write path in `createPerson`/`updatePerson`, with normalization and `PERSON_EMAIL_CONFLICT`.
   - People cache `emails` and an all-address index. `getPersonRecordIdByEmail` and the ~15 SQL bypasses match any address.
   - Person delete, and the People Merge hook if #1017 has merged.
   - Login rule: primary-only sends, the secondary branch, the account-creation guard, and session refresh by person id.
   - Docs: schema, glossary, registry, write contract, sql-guard.
   - Tests: uniqueness (case-insensitive, across primary and secondary), the mirror invariant, any-address lookup through the cache and through the SQL fallback, magic link to a secondary going to the primary, no new account for a known secondary, a Luma registration on a secondary, merge carrying addresses.
   - **Prod step (needs Jordan's approval):** run `node scripts/migrate-person-emails.js --env=prod` *before* deploy (additive), deploy, then re-run it (idempotent catch-up) and the audit.
2. **Identity-aware changes.**
   - One `replacePrimaryEmail` / `makePrimary` / `addSecondary` / `removeSecondary` operation, with session, token, auth_admins, TOTP, MCP grant, MailerLite and group side effects.
   - The admin PATCH, member PATCH (now verified), entrepreneur verify route and MCP `executePeople` all use it.
   - Rename `entrepreneur_email_change_tokens` to `email_change_tokens` (prod rename needs approval; otherwise keep the old name).
   - Tests for each action's side effects, and for the admin-changes-an-admin's-email regression.
3. **UI.** Admin editor list, menu, add link, conflict and confirm dialog; member profile dialog states and verification banner; entrepreneur several-address state; Show Member list; sign-in masked state. Add `emails` to the member-directory and person-detail payloads. Tests plus one targeted screenshot per surface. Deploy only, no migration.
4. **Fallbacks.** `slack-notifier.findUserByEmail` with primary-then-secondary ordering; Slack removal across all addresses; Drive grant fallback and all-address revoke and reconcile; applicant domain, Stripe customer, person_communications and Apps Script rosters. Tests per helper. Deploy only.

PRs 3 and 4 are independent once PR 2 lands.

## 8. Found while inventorying (not part of this feature; should be fixed regardless)

- **Admin email edits strand access.** `PATCH /admin/api/membership/person` changes `people.email` but leaves `auth_admins`, `auth_user_totp`, MCP grants and sessions on the old address. An admin whose email is edited loses admin and 2FA, and their sessions refresh roles by the old email. PR 2 fixes this; worth a standalone fix if PR 2 is far off.
- **Member self-edit** writes `people.email` unverified and un-normalized, and doesn't move sessions. A case variant of someone else's address passes the case-sensitive UNIQUE constraint.
- **The auth email methods are duplicated** in `lib/auth.js` and `lib/cache-manager/permissions.js`. Every change has to land in both until one is removed.
- **`updatePerson` doesn't update MailerLite** when the email changes, so the person stays subscribed under the old address.

## 9. Open questions for Jordan

1. **Sign-in with a secondary:** OK to send the link to the primary with a masked hint (recommended), rather than refusing or signing in through the secondary?
2. **Google sign-in with a verified secondary:** allow it (Google proves control of the mailbox), or keep v1 primary-only (recommended)?
3. **Admin replace:** should "Keep the old address as another address" default to off (a pure replace, as mocked) or on?
4. **Member self-change of the primary:** require a verification link, as entrepreneurs already do (recommended; new friction for members)?
5. **Choosing a primary:** may people with several addresses choose which one we email (mocked as "Use for E8 email"), or is that admin-only?
6. **`fund_investors.alternate_emails`** (6 rows): keep it as a fund-only "also send here" list (recommended), or import those addresses as secondaries?
7. **Bounces:** when the primary hard-bounces, flag it for an admin (recommended), or fall back to or promote a secondary automatically?
8. **Luma calendar MailerLite subscription:** subscribe the address the person registered with, or their primary once they resolve to a known person?
9. **Visibility:** should anyone other than admins and members (entrepreneurs viewing E8 contacts, MCP member tier) ever see secondaries? The recommendation is no.
