---
title: "Multiple email addresses per person"
status: agreed
owner: jordan
created: 2026-10-02
last_updated: 2026-10-02
home: mockup.html
---

# Multiple email addresses per person

A person has zero or more email addresses: at most one **primary** and any number of **secondaries**.

- **The primary** is where we send email. It is also the value behind `people.email` and everything that reads it today.
- **Secondaries** are used for three things:
  - identity matching;
  - sign-in;
  - a fallback when looking someone up in Slack or granting Google Drive access.

Email is identity. Two people with the same name and different addresses are different people. Name matching is used only for sources with no email, such as Zoom participant lists.

The UI keeps multiple addresses rare:

- Sign-up asks for one address.
- Admins can see and manage every address. Replacing an address deletes the old one.
- Members see all of another member's addresses, comma-separated.
- People with one address can only edit it. Every change a person makes to their own addresses is verified by an emailed link.

Mockups: [mockup.html](mockup.html). Each "after" image is the real app, rendered from this worktree with only the proposed change injected into its DOM, next to a "before" capture of the same screen. Every name and address in the images is fictional.

## Decisions (agreed with Jordan, 2026-10-02)

1. **Sign-in works with any of a person's addresses.**
   - The magic link goes to the address the person typed; clicking it proves they control that inbox.
   - Google sign-in matches any of the person's addresses.
   - **Tripwire:** the first time a person signs in through a particular secondary, we email their primary: "You signed in with \<address\>. If this wasn't you, contact us."
2. **Admin replace** deletes the old address. There is no "keep the old address" option.
3. **A person changing their own primary** must verify the new address through an emailed link. After verification the old address is deleted; it does not become a secondary. Adding any address yourself also requires verification.
4. **Bounces:**
   - A Mailgun webhook for permanent failures records the bounce on the address.
   - The admin editor shows a warning badge on that address, and the People grid gets a "Bounced email" filter.
   - The weekly Membership admin digest gets one summary line. There are no per-bounce emails.
   - Mail sent through a person's own Gmail (oauth_user sends) is out of scope, because those bounces go to the sender's inbox.
5. **One person per address, in any casing.** PR #1020 (merged) already trims and lowercases `people.email` writes and refuses an address another person holds in any casing. Production has `idx_people_email_lower_unique` on `lower(email)`. `person_emails` keeps the same rule.

## Production sizing (read-only, 2026-10-02)

| | count |
|---|---|
| people rows | 7,570 |
| people with no email | 221 |
| distinct `LOWER(TRIM(email))` | 7,350 (no case-insensitive duplicates) |
| `fund_investors` rows with `alternate_emails` | 6 of 152 |

PR #1020 normalized the 16 non-lowercase addresses in production and added the `lower(email)` unique index.

## 1. Data model

### `person_emails` holds every address; `people.email` mirrors the primary

```sql
CREATE TABLE IF NOT EXISTS person_emails (
    email TEXT PRIMARY KEY,                -- always LOWER(TRIM()), so one owner per address in any casing
    person_record_id TEXT NOT NULL REFERENCES people(record_id),
    is_primary INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL,                  -- 'migrated' | 'self' | 'admin' | 'merge'
    verified_at TEXT,                      -- UTC; set when a link sent to this address is clicked (sign-in or verification)
    secondary_signin_notified_at TEXT,     -- UTC; tripwire sent for the first sign-in through this secondary
    bounced_at TEXT,                       -- UTC; latest permanent delivery failure, cleared on re-verify or replace
    bounce_reason TEXT,                    -- Mailgun delivery-status message, truncated
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by_person_record_id TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_person_emails_one_primary
    ON person_emails(person_record_id) WHERE is_primary = 1;
CREATE INDEX IF NOT EXISTS idx_person_emails_person ON person_emails(person_record_id);
CREATE INDEX IF NOT EXISTS idx_person_emails_bounced ON person_emails(bounced_at) WHERE bounced_at IS NOT NULL;
```

**Why one table for every address:**

- With the address itself as the primary key, the database enforces that an address belongs to one person, whether it is their primary or a secondary.
- A secondaries-only table couldn't stop a secondary from matching someone else's `people.email`.
- Writes always lowercase, so `email` as the key gives the same any-casing rule as #1020's `lower(email)` index.
- A person with no address has no rows.

**Where secondaries come from.** Only three sources may add a secondary. `source` records which.

1. `self`: the person adds it, and it saves only after they click a verification link.
2. `admin`: an admin adds it in the person editor.
3. `merge`: People Merge moves the absorbed person's addresses to the survivor.

Luma, application forms, contact and intake forms, imports and MCP never add secondaries. Matching is email-only, so an address that matches no one creates a new person. That is what makes sign-in through a secondary acceptable (see §3).

**Keeping `people.email` consistent:**

- `people.email` stays in place as the compatibility layer, so the roughly 160 existing readers don't change.
- It always equals the `is_primary = 1` row, or is NULL when the person has no address.
- Every write goes through one CacheManager function in a new `lib/cache-manager/person-emails.js` module. That function writes both tables in one Turso `batch`.
- `createPerson` and `updatePerson`, which #1020 already made the normalizing choke point for every `people.email` write, hand off to that function whenever `fields.email` is present.
- A conflict raises #1020's existing conflict error, extended to carry the holder's `person_record_id` so the admin UI can link to that person.
- `scripts/audit-person-emails.js --env=prod` is a read-only report of drift: a people row whose email has no matching primary row, or a primary row that disagrees with its people row.
- A focused test covers every write path.
- I rejected SQLite triggers for the mirror: they would have to run both ways, and in this repo production schema is applied by hand, so a missing trigger would fail silently.

### Migration (production applied by hand with Jordan's approval)

`scripts/migrate-person-emails.js` is idempotent, takes `--env=prod`, and prints counts only:

1. `CREATE TABLE` and the three indexes above.
2. `INSERT OR IGNORE INTO person_emails (email, person_record_id, is_primary, source, created_at) SELECT email, record_id, 1, 'migrated', datetime('now') FROM people WHERE TRIM(COALESCE(email,'')) <> ''`. That is about 7,349 rows. The addresses are already lowercase because of #1020.
3. Run the audit and print the drift count, which should be 0.

The script runs before the deploy, because the table is additive and old code ignores it. It runs again after the deploy to catch rows written in between.

Rollback means rolling back the deploy. Dropping the table needs separate approval. `fund_investors.alternate_emails` is untouched; it means "also send fund mail here", not "same person" (open question 2).

### Bootstrap schema and docs

- Add the DDL to `CacheManager.createTables()` next to `people`, without wiring it into startup.
- Update `docs/database-schema.md`.
- `docs/data-query-glossary.md`: `people.email` is the primary address; to match someone by any address, join `person_emails`.
- `docs/ai-relationship-registry.json`: add the soft foreign key `person_emails.person_record_id → people.record_id`.
- Write contract: rewrite the `people.email` entry. It is still the sending address, but sign-in now matches any address. `person_emails` is read-only for MCP in v1.
- `lib/data-query/sql-guard.js`: `person_emails` is visible to admin data-access tiers only, not the member tier.

### Merge implications

**People Merge (PR #1017):**

- `preserveAbsorbedPersonEmail()` becomes `UPDATE person_emails SET person_record_id = :survivor, is_primary = 0, source = 'merge', secondary_signin_notified_at = NULL WHERE person_record_id = :absorbed`.
- It runs *inside* `mergePersonRecords`' batch, before the absorbed `people` row is deleted. Today the hook runs after the commit.
- Add `person_emails.person_record_id` to `PERSON_MERGE_SPECIAL`; `people-merge-coverage.test.js` requires it.
- The review step lists the addresses that will move. After the merge, the survivor can sign in with the absorbed address, and the tripwire fires on first use.
- The absorbed person's sessions and tokens are still deleted. MailerLite cleanup for the absorbed address is unchanged.

**Company Merge:** no change, because `person_emails` doesn't reference companies.

**Person delete:** add `person_emails` to the delete batch, so the addresses become free for reuse.

## 2. Consumer inventory

These counts come from sweeping `lib/`, `routes/`, `src/` and `index.js` and are counts of call sites.

| Class | Sites | Where |
|---|---|---|
| **Any address matches** (inbound identity and sign-in) | about 75 | The lookup helpers `getPersonRecordIdByEmail`, `getPersonByEmail`, `getPeopleByEmails`, `findPersonRecordIdByEmail` and `auth.getPersonByEmail`, plus the people-cache email index. Also: magic link and Google sign-in; Luma registration; Zoom-name → Luma-guest matching; application team members; contact, intake and membership-interest forms; Stripe checkout and invoice → person; admin lookup and duplicate checks; investment-interest CSV; Gmail log-email; person_communications matching; development and Decarbon8 email events and rosters; Zoom OAuth connect; the MCP person-email hooks; uniqueness checks on email change. |
| **Primary, then secondary fallback** | about 37 | Slack `users.lookupByEmail` (22 sites, all through `slack-notifier.findUserByEmail`); Drive grants (9); applicant company-domain matching and auto-join (4); Stripe `getOrCreateCustomer` (1). |
| **Primary only** | about 85, plus about 78 Mailgun sends | All outbound mail; MailerLite; hub, committee and company-chat Google Groups; Calendar invites and meeting audiences; exports and the admin grid email column; `getPersonMembershipFieldsByEmail` callers. |

Most "any address" sites go through the lookup helpers. Indexing every address in `getPersonRecordIdByEmail` and the in-memory `_peopleCacheByEmail` map covers them in one change. The cached person object gains `emails: [{ email, isPrimary, bouncedAt }]`, and its `email` field stays the primary.

About 15 sites run their own SQL. Each needs a small edit to join `person_emails`:

- `auth.js:956`, `auth.js:1019`
- `development.js:2073`, `development.js:2080`, `development.js:2175`
- `decarbon8-campaign.js:311`, `decarbon8-campaign.js:829`
- `data-query-access.js:355`, `data-query-access.js:415`
- `mutation-executor.js:724`, `mutation-executor.js:2163`
- `members-with-open-stripe-invoice.js:29`
- `person-emails.js:214`, `person-emails.js:312`
- `pipeline-management.js:2421`
- `committees.js:1623`
- `diligence-email-notifications.js:99`

**Where a fallback makes sense:**

| Place | Behavior | Why |
|---|---|---|
| Slack DM and mention lookup | Primary, then secondaries | Slack accounts often use a work address while E8 mail goes elsewhere. Implemented once, inside `findUserByEmail`. |
| Slack channel *removal* (`diligence.js:3737`) | All addresses | Removal must catch whichever address the person was added under. |
| Drive folder and file grants | Primary, then secondaries | If Drive rejects the primary (no Google account at that address), try the secondaries in order. |
| Drive revokes and reconcile | All addresses | Otherwise a grant made under a secondary is never revoked. This is a security requirement. |
| Applicant domain auto-join and company match | Any non-personal domain among the person's addresses | More evidence for the same check. Auto-join only ever *offers* access. |
| Stripe customer lookup | Primary, then secondaries | Avoids duplicate customers for members who paid under an older address. |
| person_communications and Messages history | All addresses | Mail they sent from a secondary belongs in their history. |
| Apps Script rosters (development, Decarbon8) | List all addresses | The roster filters inbound mail. |
| Google Groups membership | **No** (primary only); removal checks all addresses | Group mail is mail. |
| Mailgun, Gmail send-as, MailerLite, Calendar invites | **No** | Mail goes only to the primary. A bounce is recorded and shown to admins, never rerouted. |
| Admin flags, TOTP, MCP grants | **No**; keyed to the person and kept on the primary | These are security identity, not matching. |
| Zoom attendance | Unchanged (name-based) | The source has no email. |

## 3. Sign-in

**Rule:** a person can sign in with any of their addresses.

- The magic link goes to **the address typed** and signs in the person who owns it. No masking is needed, because clicking the link proves control of that inbox.
- Google sign-in (`createSessionForVerifiedIdentity`) matches any of the person's addresses.
- An address that is nobody's still follows today's rules. The application sign-in creates a new Entrepreneur for it; other sign-ins say the address wasn't found.

**Tripwire.** On a successful sign-in through a secondary whose `secondary_signin_notified_at` is NULL:

- Send the person's primary a short notice: "You signed in to E8 with \<address\> on \<date/time PT\>. If this wasn't you, contact support@e8angels.com."
- Stamp `secondary_signin_notified_at`. It fires once per address. A merge, an admin re-add, or a self re-verification resets it.
- Both magic-link and Google sign-ins count. Sign-in through the primary never triggers it.
- Successful verification also sets `verified_at` on the address used.

**Risk analysis:**

- Who controls the inbox is proven at sign-in time. What's left is how the address got attached to the person in the first place. Secondaries come only from:
  - the person, with verification (no risk);
  - an admin;
  - People Merge.
- Luma, forms and imports never attach an address to an existing person. A new address always means a new person, so an attacker can't plant an address on someone else's account by registering for an event.
- **Residual risk 1, wrong attachment.** An admin types or merges an address that belongs to someone else. That person could then sign in as this one. Mitigations:
  - the conflict check: an address can't belong to two people;
  - the tripwire to the real primary;
  - People Merge's review step, which lists the addresses that will move.
- **Residual risk 2, recycled work addresses.** An employer reassigns an old work mailbox, and its new holder requests a link. Mitigations:
  - the tripwire;
  - admins removing stale addresses;
  - a bounce on an address is a strong hint it is stale. The badge and the digest line put it in front of an admin.
- 2FA (admins only) still applies after the link, whichever address was used.

**Auth-layer changes.** The auth code exists twice, in `lib/auth.js` and in its duplicate mixin `lib/cache-manager/permissions.js`, so every change lands in both.

- `auth.getPersonByEmail` and the login paths match any address through `resolvePersonEmail(email) → { personRecordId, isPrimary }`.
- `_createAndSendMagicLink` keeps sending to the typed address and stores it in `auth_tokens.email`.
- `getSession`'s hourly role and access refresh resolves the user by `auth_sessions.person_record_id` instead of `row.email`. A session's email is the address it signed in with, and changing the primary no longer strands sessions.
- `auth_admins`, `auth_user_totp` and MCP grants stay keyed to the primary. They are checked by person: the session's person must hold the primary that appears in those tables.

## 4. Email changes and identity

All actions run through one server operation in `person-emails.js`, so the side effects are the same whether an admin, the person or MCP triggers them.

| Action | Who | Verification | `person_emails` / `people.email` | Sessions and links | Email-keyed identity rows | MailerLite | Google groups, calendar |
|---|---|---|---|---|---|---|---|
| **Replace primary** | Admin | None; a confirmation appears only if the person has signed in, or holds admin access, 2FA or MCP access ([mockup](mockup.html#admin-replace)) | The old row is **deleted** and the new row inserted as primary, in one batch with `people.email` | Sessions stay valid (resolved by person id). `auth_tokens` for the old address are deleted. | `auth_admins`, `auth_user_totp`, `data_query_access_grants` and `mcp_oauth_*` `.email` are re-keyed to the new address in the same batch | Remove the old address from role groups, then upsert the new address with the person's role groups | Swap old for new (hub sync exists; committee and company-chat sync are added). Meeting invites are moved by the existing `resyncPersonEmailInvites`. |
| **Change own primary** | Person (member, entrepreneur) | A link to the new address; nothing changes until it is clicked ([mockup](mockup.html#self-pending)) | On verification, the same as admin replace: the old address is deleted, not kept | Same | Same | Same | Same |
| **Add secondary** | Admin | None | Insert. A conflict names the holder to admins ([mockup](mockup.html#admin-conflict)) | — | — | — (secondaries are never subscribed) | — |
| **Add or edit own secondary** | Person, only if they already have several addresses; there is no Add control | A link to the new address | On verification, insert it. An edit then deletes the old secondary. | — | — | — | — |
| **Make primary** | Admin | None | Swap the flags in one batch and mirror the result to `people.email` | Same as replace | Same as replace | Same as replace | Same as replace |
| **Remove secondary** | Admin, or the person | None | Delete. The primary can't be removed while other addresses exist. | Delete `auth_tokens` for that address | — | — | Remove that address from any group or Drive share it was added under |

Notes:

- `entrepreneur_email_change_tokens` becomes the shared verification store, renamed `email_change_tokens` and given a `kind` column (`replace_primary` | `add_secondary` | `edit_secondary`).
- The member path (`PATCH /api/member/profile`) currently writes the address immediately without verification or session handling. It moves to this flow.
- The form-sync comment "Account email changes require identity-aware session and token handling" (`lib/cache-manager.js:27082`) stays true: application forms never change an existing person's email (PR #1016).

## 5. Bounces

**Mailgun availability (checked read-only, 2026-10-02, with the repo's Mailgun config):**

- The configured sending domain is a custom domain and is active.
- `GET /v3/domains/{domain}/webhooks` returns 200 with no webhooks configured. **Domain webhooks are available on this account** (Mailgun offers them on every plan), so the webhook design works as is.
- The account and subscription endpoints return 404 for this API key, so the plan name couldn't be read. The key looks domain-scoped.
- **Event retention is about 1 day:** the oldest retained event was 1.0 days old, which matches Mailgun's entry-level plans. Polling the events API as a fallback would have to run at least daily and would lose data on any missed day.
- The bounce suppression list (`/v3/{domain}/bounces`) returned 401 for this key, so a key with suppression scope would be needed to clear a suppression.
- The check used the dev `.env`. Its domain looks like production's, but that was not confirmed against production's secrets.

**Design:**

- **Webhook.** A public route `POST /webhooks/mailgun/permanent-failure`, subscribed to the domain's `permanent_fail` event.
  - It verifies Mailgun's HMAC signature with a new `MAILGUN_WEBHOOK_SIGNING_KEY`.
  - It is idempotent: a small `mailgun_webhook_events(event_id PK, received_at)` table dedupes deliveries.
  - It lowercases the recipient and, when the address is in `person_emails`, sets `bounced_at` and `bounce_reason`. Unknown addresses are ignored.
  - It always returns 200 after verifying the signature, so Mailgun doesn't retry forever.
  - It does not touch Gmail sends.
- **Configuring the webhook in Mailgun** is a production change. Jordan approves it after deploy. The webhook URL points at production only, because dev and production appear to share the sending domain.
- **Admin editor.** A "Bounced" warning badge sits next to the address; the tooltip shows the date and reason ([mockup](mockup.html#admin-several)).
- **People grid.** A "Bounced email" field in the people admin-grid config (`lib/admin-grid-config.js`), filterable as is/is not, true when any of the person's addresses has `bounced_at`. Per the existing memory notes, saved views need a column row; the default view gets the filter.
- **Digest.** One line in `sendMembershipAdminDigest` (Monday 07:20 PT): "N email addresses bounced this week", linking to the People grid with the filter applied. The line is omitted when N is 0.
- **Clearing a bounce:**
  - a fresh verification click on that address (sign-in or change verification) clears `bounced_at`;
  - an admin replacing or removing the address deletes the row.
- Mailgun also suppresses future sends to a bounced address by itself, so a cleared bounce may also need the suppression deleted (`DELETE /v3/{domain}/bounces/{address}`). That is a follow-up once a key with that scope is configured; v1 shows "Mailgun is suppressing this address" in the tooltip.
- **No fallback sending.** A bounce never reroutes mail to a secondary.
- **If webhooks ever become unavailable,** the fallback is a daily job (at most 24 hours apart, given the 1-day retention) that pages `GET /v3/{domain}/events?event=failed&severity=permanent` since the last cursor and applies the same update.

## 6. Integration with in-flight work

- **People Merge (#1017):** the hook and the coverage entry described in §1. It lands in PR 1 if #1017 has merged; otherwise #1017 rebases onto PR 1.
- **Luma email-only matching (#1018):** `recordLumaRegistration` calls `getPersonRecordIdByEmail`, so it matches all addresses once PR 1 lands. Add a regression test: a registration on a secondary resolves to that person. Run `scripts/fix-luma-name-matched-registrations.js` after PR 1 deploys.
- **#1020 (merged):** `person_emails` keeps its any-casing rule and reuses its conflict error. The existing `idx_people_email_lower_unique` stays as a second guard on the mirror.
- **#1016:** forms never change an existing person's email. No conflict.

## 7. UI (see mockup)

- **Admin person editor** (`EditPersonIsland.jsx`, Basic Information card):
  - The Email / Phone row keeps its input, which is the primary; typing over it replaces the address.
  - Secondaries are listed underneath as plain text with "Make primary" and "Remove" links, plus a Bounced badge where it applies.
  - A small "+ Add another address" link sits under the list.
  - When the row has more than one line, the label top-aligns (`CompactRow alignTop`).
  - A conflict names the holder and offers "Merge people…".
  - The replace confirmation is an `AlertDialog` and only appears for people with sign-in or access state.
- **Member profile dialog** (`ProfileReviewDialog.jsx`):
  - One address: unchanged, plus a "verification pending" notice after a change.
  - Several addresses: one input per address, and × on secondaries.
  - The conflict message never names the holder.
- **Entrepreneur My Account:**
  - One address: unchanged.
  - Several addresses: an "Also" row per secondary with Remove.
  - The pending banner gains "your current address is removed once you do".
- **Show Member** (`PersonProfileModal`): all addresses, primary first, comma-separated mailto links. The directory payload gains `emails`.
- **Tripwire email:** a plain transactional email in the existing Mailgun templates. It needs no mockup.

## 8. Build plan (reviewable PRs)

1. **Data layer, matching and sign-in.**
   - Scope:
     - schema module, bootstrap DDL, migration and audit scripts;
     - the write path in `createPerson` and `updatePerson`;
     - cache `emails` and the all-address index;
     - any-address lookups, including the ~15 SQL sites;
     - person delete, and the People Merge hook if #1017 has merged;
     - sign-in with any address, the tripwire, and session refresh by person id;
     - docs, write contract and sql-guard.
   - Tests:
     - uniqueness across primary and secondary in any casing;
     - the mirror invariant;
     - any-address lookup through the cache and through SQL;
     - a magic link and a Google sign-in via a secondary, and that the tripwire fires once;
     - a Luma registration on a secondary;
     - a merge carrying addresses.
   - **Production step (approval):** `node scripts/migrate-person-emails.js --env=prod` before the deploy, then deploy, then run it again and run the audit.
2. **Identity-aware changes.**
   - Scope:
     - the replace, make-primary, add, remove and verify operations, with every side effect listed in §4;
     - the admin PATCH, member PATCH (now verified), entrepreneur verify route and MCP `executePeople` all use it;
     - verification tokens gain `kind`.
   - **Production step (approval):** rename `entrepreneur_email_change_tokens` → `email_change_tokens` and add `kind`.
   - Tests: each action's side effects, and the regression where an admin edits an admin's email.
3. **UI.** The admin editor list, add link, conflict and confirmation; the member dialog states; the entrepreneur several-address and pending states; Show Member. Tests, plus one targeted screenshot per surface. Deploy only.
4. **Bounces.**
   - Scope: the webhook route with its signature check and dedupe table; the bounce columns already exist from PR 1; the badge, grid field and digest line.
   - **Production steps (approval):**
     - create `mailgun_webhook_events`;
     - set `MAILGUN_WEBHOOK_SIGNING_KEY`;
     - register the `permanent_fail` webhook URL in Mailgun after deploy.
5. **Fallbacks.** `findUserByEmail` ordering; Slack removal across all addresses; Drive grant fallback and all-address revoke; applicant domain, Stripe customer, person_communications and rosters. Deploy only.

PRs 3 to 5 are independent once PR 2 lands.

## 9. Found while inventorying (fix regardless)

- **Admin email edits strand access.** `PATCH /admin/api/membership/person` leaves `auth_admins`, `auth_user_totp`, MCP grants and sessions on the old address. An admin whose email is edited loses admin and 2FA. PR 2 fixes this; consider a standalone fix if PR 2 slips.
- **Member self-edit is unverified.** It writes `people.email` with no verification and doesn't move sessions (#1020 now blocks case-variant duplicates).
- **The auth email methods are duplicated** in `lib/auth.js` and `lib/cache-manager/permissions.js`.
- **`updatePerson` doesn't update MailerLite** when the email changes.

## 10. Open questions for Jordan

1. With several addresses, may a person choose which one is their primary themselves (verified addresses only), or is "Make primary" admin-only? The mockups show it as admin-only.
2. `fund_investors.alternate_emails` (6 rows): keep it as a fund-only "also send here" list (recommended), or import those addresses as secondaries?
3. Luma calendar MailerLite subscription: subscribe the address the person registered with, or their primary once they resolve to a known person?
4. Beyond admins and members, should anyone see secondaries, such as entrepreneurs viewing E8 contacts or the MCP member tier? The recommendation is no.
