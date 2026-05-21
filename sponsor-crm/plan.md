---
title: Development Dashboard
status: draft
owner: jordan
created: 2026-05-16
last_updated: 2026-05-19
mockup: mockup.html
---

# Sponsor CRM Plan

Status: draft for review
Prepared for: Karen (Development), Jordan
Last updated: 2026-05-16

## 1. Purpose

Karen's brief (`uploads/Sponsor CRM Brief for Jordan.docx.md`) describes a lightweight CRM the development team can use without leaving the portal: track every sponsor and prospect, log conversations, manage follow-ups, and visualize pipeline progress against fundraising goals. This plan adapts that brief to the existing portal so we reuse the people table, role/permission system, notification stack, and notes/attachments patterns instead of building parallel infrastructure. It also folds in two pieces of context Karen did not have: E8 is spinning up a 501(c)(3) sibling (E8 Impact) alongside the existing 501(c)(6), and we have an existing master sponsor spreadsheet to migrate.

## 2. Decisions on the open questions from §10 of the brief

- **Data storage** — same Turso database as the rest of the portal. New tables, no separate schema. All SQL goes through `CacheManager` per AGENTS.md §"Database Query Centralization".
- **Auth / SSO** — same portal login. Admins managed exactly like other staff (`auth_admins`).
- **Mobile** — mobile-responsive from v1. Cheaper than retrofitting later.
- **Notifications** — system alerts and follow-up reminders via Mailgun (`lib/mailgun.js`). Outbound emails Karen or another staff member sends *as themselves* to a sponsor use Google OAuth (`lib/email-sender.js`), same path entrepreneur messages use today.
- **Goal tracking** — track by campaign/program. Annual rollup is a derived view.
- **Entity reporting** — track separately per entity AND together. Every sponsor record carries `entity` (`501c6`, `501c3`, or `both`); goals are per-entity per-campaign; dashboards have an entity toggle (E8 Angels / E8 Impact / All).
- **Board notifications** — none in v1. The portal is the canonical surface; the dev committee already gets a board view (see §6).
- **Board onboarding** — already handled. Board members are in the portal; we use the existing `BoardMember` role.
- **Historical data** — import the master spreadsheet (see §8). This is in scope for v1.

## 3. Reframing Karen's "Sponsor Record" data fields

Karen's brief lists fields as a flat row on a single record. We will not store it that way. We use the existing normalized patterns:

- Contact names → existing `people` table. A sponsor has many contacts via a junction (`sponsor_contacts`). Contacts get a new role string in `people.roles` so they surface correctly in the directory.
- Conversation log → mirror of `committee_notes` / `company_notes` patterns (`sponsor_notes`), append-only, 10-minute edit window enforced at the route layer.
- Attachments → mirror of `company_note_attachments` (BLOB-stored, FK to note).
- Stage timeline → event-sourced (`sponsor_stage_events`) just like `entrepreneur_application_change_log` and `committee_membership_events`. Current stage is denormalized on the parent row for fast filtering but the timeline is the source of truth.
- Assigned To → multiple staff supported (a recurring shape in the master spreadsheet). Modeled as `sponsor_owners` (junction, person → sponsor with `is_primary`).

Karen's "PDF pipeline snapshot" is two distinct deliverables, addressed separately in §6 and §7. She does not literally need a PDF for the board; she needs a clean, screen-friendly view she can pull up live. The shareable impact document (exportable to PDF) is a separate, lower-priority feature.

## 4. Data model

All new tables. SQL ships in `scripts/migrate-add-sponsor-crm.sql`; `createTables()` in `lib/cache-manager.js` updated for new environments; **never** auto-migrated at startup (AGENTS.md §"DB Schema Changes").

### 4.1 New role strings (add to `people.roles`)

- `Sponsor Contact` — current contact at an existing/active sponsor
- `Sponsor Prospect Contact` — contact at a not-yet-committed prospect
- `Development Committee` — board sub-committee with read-only board dashboard

The first two are person-level role tags so contacts show up in the directory and search; they say nothing about login or permissions. `Development Committee` follows the existing committee pattern (new row in `committees`, `committee_memberships` rows, derived `DevelopmentCommittee` canonical role via `lib/auth.js:724-733`). Add all three to the role taxonomy section of `docs/data-query-glossary.md` per AGENTS.md §"Data-Query Glossary".

### 4.2 New canonical permission role

- `SponsorManager` — derived from a new `auth_admins.type = 'sponsor_manager'` value, mapped in `typeToRole` (`lib/auth.js:703-712`). Karen is the first holder. This is the staff "Admin / Development" role from Karen's §7.

The `Team Member` role from Karen's §7 maps to any logged-in staff (`SiteAdmin`, `ExecutiveDirector`, `MembershipManager`, etc.) — no new role needed. Board read-only access uses existing `BoardMember` plus the new `DevelopmentCommittee`. Permissions are bound by adding rows to `resource_permission_roles` keyed to new resource keys (see §5).

### 4.3 Tables

```sql
-- Sponsor (org-level OR individual). One row per relationship.
CREATE TABLE sponsors (
  id TEXT PRIMARY KEY,                                  -- spn_<hex>
  display_name TEXT NOT NULL,                           -- "Acme Corp" or "Jane Smith"
  sponsor_type TEXT NOT NULL CHECK (sponsor_type IN
    ('corporate','individual','foundation','in_kind')),
  entity TEXT NOT NULL CHECK (entity IN
    ('501c6','501c3','both')),                          -- E8 Angels / E8 Impact / Both
  stage TEXT NOT NULL CHECK (stage IN
    ('prospect','outreach','conversation','proposal',
     'committed','received','declined')),               -- denorm of latest stage event
  priority TEXT CHECK (priority IN ('high','medium','low')),
  source TEXT,                                          -- "warm intro", "event", free text
  campaign_id TEXT,                                     -- FK -> sponsor_campaigns.id
  matching_gift_eligible INTEGER,                       -- corporate only; nullable
  grant_deadline TEXT,                                  -- YYYY-MM-DD; foundation only
  renewal_month INTEGER,                                -- 1-12; nullable
  notes_freeform TEXT,                                  -- the "Tags / Notes" misc field
  primary_contact_person_record_id TEXT,                -- denorm; FK -> people.record_id
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sponsors_stage ON sponsors(stage);
CREATE INDEX idx_sponsors_entity ON sponsors(entity);
CREATE INDEX idx_sponsors_campaign ON sponsors(campaign_id);

-- Contacts at a sponsor. Reuses people table.
CREATE TABLE sponsor_contacts (
  sponsor_id TEXT NOT NULL,
  person_record_id TEXT NOT NULL,
  role_at_org TEXT,                                     -- "VP Partnerships" (override of people.title)
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sponsor_id, person_record_id)
);

-- E8 owners (assigned staff). Multi-owner support.
CREATE TABLE sponsor_owners (
  sponsor_id TEXT NOT NULL,
  person_record_id TEXT NOT NULL,                       -- the staff member
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sponsor_id, person_record_id)
);

-- Money: ask vs commit vs receive. One sponsor can have multiple gifts/years.
CREATE TABLE sponsor_amounts (
  id TEXT PRIMARY KEY,                                  -- spna_<hex>
  sponsor_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN
    ('ask','commit','receive','in_kind_value')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  campaign_id TEXT,                                     -- which initiative; usually inherits from sponsor
  occurred_on TEXT,                                     -- YYYY-MM-DD; required for 'receive'
  fiscal_year INTEGER,                                  -- derived/denorm for filtering
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_person_record_id TEXT
);
CREATE INDEX idx_sponsor_amounts_sponsor ON sponsor_amounts(sponsor_id);
CREATE INDEX idx_sponsor_amounts_kind_fy ON sponsor_amounts(kind, fiscal_year);

-- Stage timeline (event sourced; current stage is denorm on sponsors).
CREATE TABLE sponsor_stage_events (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  from_stage TEXT,                                      -- nullable for initial row
  to_stage TEXT NOT NULL,
  changed_by_person_record_id TEXT,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT                                             -- the prompted note ("why declined?")
);
CREATE INDEX idx_sponsor_stage_events_sponsor ON sponsor_stage_events(sponsor_id, changed_at);

-- Conversation log. Append-only; 10-minute edit window enforced in route.
CREATE TABLE sponsor_notes (
  id TEXT PRIMARY KEY,                                  -- spnn_<hex>
  sponsor_id TEXT NOT NULL,
  author_person_record_id TEXT NOT NULL,
  channel TEXT CHECK (channel IN
    ('call','email','in_person','event','text','other')),
  occurred_at TEXT NOT NULL,                            -- when the interaction happened
  summary TEXT NOT NULL,
  next_step TEXT,
  is_board_logged INTEGER NOT NULL DEFAULT 0,           -- entered via "Log my interaction"
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0                 -- admin-only; surfaces in audit
);
CREATE INDEX idx_sponsor_notes_sponsor ON sponsor_notes(sponsor_id, occurred_at);

CREATE TABLE sponsor_note_attachments (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by_person_record_id TEXT
);

-- Sponsor-level attachments (signed agreements, grant LOIs).
-- Separate from note attachments because they're durable artifacts of the relationship.
CREATE TABLE sponsor_attachments (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content BLOB NOT NULL,
  label TEXT,                                           -- "Signed agreement 2026"
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by_person_record_id TEXT
);

-- Follow-ups. One outstanding per (sponsor, assignee) is typical but not enforced.
CREATE TABLE sponsor_followups (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  due_on TEXT NOT NULL,                                 -- YYYY-MM-DD, Pacific business calendar
  assignee_person_record_id TEXT NOT NULL,              -- a staff member
  reminder_note TEXT,
  completed_at TEXT,
  completed_by_person_record_id TEXT,
  completion_note TEXT,                                 -- could become a sponsor_note
  reminder_sent_at TEXT,                                -- last Mailgun reminder timestamp
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_person_record_id TEXT
);
CREATE INDEX idx_sponsor_followups_due ON sponsor_followups(due_on)
  WHERE completed_at IS NULL;

-- Campaigns / programs. Goal tracking is per-campaign per-entity.
CREATE TABLE sponsor_campaigns (
  id TEXT PRIMARY KEY,                                  -- camp_<hex>
  name TEXT NOT NULL,                                   -- "FY26 Annual Fund"
  fiscal_year INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sponsor_campaign_goals (
  campaign_id TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('501c6','501c3','both')),
  goal_cents INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, entity)
);

-- Recent-activity feed (board dashboard, §6d). Pre-materialized for cheap reads.
-- Built by an SWR getter; this table only stores recent items (30 days, hard-cap 500).
CREATE TABLE sponsor_activity_feed (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN
    ('new_prospect','stage_advanced','commitment','gift_received','note_added')),
  occurred_at TEXT NOT NULL,
  amount_cents INTEGER,
  summary TEXT NOT NULL,
  actor_person_record_id TEXT,
  is_internal INTEGER NOT NULL DEFAULT 0                -- staff-only items hidden from board
);
CREATE INDEX idx_sponsor_activity_feed_at ON sponsor_activity_feed(occurred_at);
```

ID prefixes follow the established convention (`spn_`, `spna_`, `spnn_`, `camp_`).

### 4.4 SWR cache keys

Heavy composed reads land in SWR (AGENTS.md §"SWR Cache"):

- `sponsors.dashboard.staff` — staff Kanban + KPIs (per-entity-filtered variants built per request, not cached)
- `sponsors.dashboard.board` — board read-only dashboard
- `sponsors.activity-feed.30d` — feed materialization
- Tags: `sponsors`, `sponsors-goals`, `sponsors-followups`

Invalidate `sponsors` on any write to `sponsors`, `sponsor_amounts`, `sponsor_stage_events`. Invalidate `sponsors-followups` separately because that view's TTL can be much shorter.

### 4.5 Glossary updates (mandatory per AGENTS.md)

`docs/data-query-glossary.md`:
- Add new section "Sponsors / Development" covering `sponsors`, `sponsor_amounts`, `sponsor_notes`, `sponsor_followups`, `sponsor_campaigns`.
- Add the new role strings to the role taxonomy.
- Add a "Common gotcha" entry: "Sponsor giving is not the same as `deployments`. `deployments` are E8's outbound investments into portfolio companies; `sponsor_amounts` are gifts coming INTO E8."

## 5. Permissions

New resource keys (registered in `_seedResourceRegistry`, `lib/auth.js:274-348`):

| Resource key | Bound roles | Purpose |
|---|---|---|
| `admin.sponsors.read` | SponsorManager, ExecutiveDirector, SiteAdmin, BoardMember, DevelopmentCommittee | Open the module |
| `admin.sponsors.write` | SponsorManager, ExecutiveDirector, SiteAdmin | Create/edit sponsor rows, stages, amounts |
| `admin.sponsors.notes.write` | SponsorManager, ExecutiveDirector, SiteAdmin, *plus* logged-in staff | Log a conversation |
| `admin.sponsors.notes.write.board` | BoardMember, DevelopmentCommittee | "Log my interaction" (creates note with `is_board_logged=1`) |
| `admin.sponsors.followups.write` | SponsorManager, ExecutiveDirector, SiteAdmin, plus assignee of any followup | Set / complete a follow-up |
| `admin.sponsors.export` | SponsorManager, ExecutiveDirector, SiteAdmin | CSV + impact report export |
| `admin.sponsors.goals.write` | SponsorManager, ExecutiveDirector, SiteAdmin | Edit campaign goals |
| `admin.sponsors.admin` | SiteAdmin, SponsorManager | Delete duplicates, archive |

Karen's three roles map cleanly onto this:
- **Admin / Development** → `SponsorManager`
- **Team Member** → any other staff (resolved via session roles)
- **Board Member / Dev Committee** → `BoardMember` (already exists) plus `DevelopmentCommittee` (new)

## 6. UI surfaces

All views mobile-responsive from day one (single-column collapse at narrow widths, Kanban becomes horizontally scrollable list).

### 6a. Staff dashboard (`/admin/sponsors`)

KPI strip across top with an entity toggle (All / E8 Angels / E8 Impact):

- Received YTD vs. campaign goal (progress bar)
- Pipeline value (sum of asks in stages 2-5)
- Active prospects (count in stages 2-4)
- Overdue follow-ups (count, red if > 0)
- Avg gift size (received only)

Default view is Kanban: columns = 7 pipeline stages, cards show sponsor name + type + ask + follow-up status + entity chip. Drag a card to advance stage; a modal prompts for a note. List view, region view, and a calendar strip of upcoming grant deadlines are toggles on the same toolbar. Sidebar filters: entity, sponsor type, stage, assigned staff, priority, follow-up status. Filters compose with the entity toggle.

### 6b. Sponsor detail (`/admin/sponsors/:id`)

Header: name, type, entity chip, current stage with one-click advance, primary owner. Tabs:

- **Overview** — key facts grid (campaign, ask/commit/received, source, renewal month, grant deadline if foundation, matching-gift if corporate), upcoming follow-up.
- **Contacts** — list with primary flag, role at org, link to person profile in the existing directory.
- **Activity** — interleaved timeline of stage events, conversation notes, amount changes, follow-ups. Newest first. Each conversation note is editable for 10 minutes after creation, then locked.
- **Notes** — same data as Activity filtered to free-form notes; quick-add form at top.
- **Attachments** — sponsor-level files (signed agreements, LOIs).

Inline edit on any field; stage change always prompts a note (Karen's §4a requirement). "Set follow-up" is a tile at the top right that becomes a red banner when overdue.

### 6c. Board / Development Committee dashboard (`/board/sponsors`)

Default landing for board + dev committee members. Read-only. Same KPI strip and Kanban but every editing affordance is hidden. Adds:

- **My Connections** sidebar — sponsors where this board member is the `source` or has logged a note. Overdue follow-ups on these are highlighted so the board member can proactively reach out.
- **Recent Activity** feed — last 30 days, clean copy ("Acme Corp committed $10,000"), declined records and internal staff-only notes excluded.
- **Grant deadlines** — 60-day calendar strip.
- **Log my interaction** button — opens a simplified note form (date, channel, ≤500-char summary, optional outcome). Submitted note appears in the sponsor's activity tagged "logged by board member". The primary owner receives a Mailgun notification.

### 6d. Impact report (`/admin/sponsors/impact`) — separate feature

A standalone shareable document, not the same thing as the board dashboard. Lives in v1.5. Goal: produce a single page suitable for sending to existing and prospective sponsors. Sections: who we are, who's already supporting us, anonymized impact stats from the broader portal (cohort outcomes, deployments, etc.), this year's goal vs progress. Renders as HTML; can be exported to PDF via the existing PDF skill / a print stylesheet. Bare-bones board-snapshot PDF (Karen's §8g) is a checkbox-on-export of the dashboard, not a custom document.

### 6e. Mobile layout

Kanban collapses to a "swipe between stages" carousel with one stage visible at a time and a stage-picker chip row. KPI strip becomes a 2x2 grid. Detail page tabs become a horizontally scrollable tab bar. Editing affordances are unchanged on mobile per AGENTS.md (no desktop-only behaviors without explicit approval).

## 7. Notifications & reminders

- **Follow-up reminders** — Mailgun, sent on the morning a follow-up is due (Pacific). Idempotency via `sponsor_followups.reminder_sent_at`. Templated through `email_template_versions` so Karen can edit copy without a deploy. Cron: a new entry in the existing dispatcher (`lib/recurring-emails/dispatcher.js`).
- **Board-logged-note alert** — Mailgun, sent immediately when a board member submits "Log my interaction". Recipient is the sponsor's primary owner. Subject: "[Board] {Board Member} logged a note on {Sponsor}".
- **Overdue summary** — Mailgun digest to each staff owner Monday morning listing their overdue follow-ups.
- **Outbound member-sent email to a sponsor contact** — Gmail OAuth via `lib/email-sender.js`, identical wiring to entrepreneur messaging. Logged to `person_communications` so it shows up in the sponsor activity timeline. The "Send email" affordance on a sponsor detail page opens the same compose flow used elsewhere; no new email infra.

No Slack / SMS / digest emails to the board in v1.

## 8. Historical data import

Source: `uploads/E8 Master Sponsor List.xlsx`.

Handling the data-quality issues observed:

1. **Multi-value contact/email cells.** Pervasive in the spreadsheet (~50% of rows on the Active sheet, similar on Prospects). Split into separate `people` rows and link via `sponsor_contacts`. First listed becomes `is_primary=1`.
2. **Multi-assignee cells.** Split into multiple `sponsor_owners` rows. First listed becomes `is_primary=1`.
3. **Section headers as soft enum.** Sheets use merged-cell section dividers ("CONFIRMED 2026 SPONSORS", "HOT/WARM/COLD PROSPECTS"). Don't trust them blindly; let the `Stage` column ("3 — Conversation") be the truth, and use the section text only to break ties when stage is blank.
4. **Mixed-format dates.** `Last Communication` and `Email Activity Log` columns mix `"2026-05-01"`, `"2024"`, `"Jan 2026"`. Parse to YMD where possible; store original string in `note` field of the migrated entry where not.
5. **Free-text dollar ranges.** `Ask Range` like `"$20,000+"`, `"$3,000–$5,000"`, `"TBD"` becomes one `sponsor_amounts` row with `kind='ask'` and parsed midpoint (or floor for "$X+"); original string stored in `note`.
6. **Foundation Focus Area tags.** Comma-separated → stored as-is in `notes_freeform` for v1 (we can add a real tag table later if needed).
7. **Annual giving columns** (`2023 Actual`, `2024 Actual`, `2025 Actual`, `2026 Goal`, `2026 Actual`) → one `sponsor_amounts` row per nonzero cell, `kind` mapped from column.
8. **Email Activity Log sheet** → one `sponsor_notes` row per entry, `occurred_at` from Date, `channel='email'`, `summary` from Subject/Summary column, with author resolved by matching staff name to `people.email` (default to a `legacy-import@e8angels` placeholder if not resolvable).
9. **Foundation Prospects sheet** → one `sponsor` row per foundation with `sponsor_type='foundation'`, stage inferred from Outreach Status, focus areas into `notes_freeform`.
10. **Dedup.** Companies appearing on multiple sheets (e.g. Starbucks in Prospects + Email Log) collapse to one sponsor. Match on normalized name; ask before merging anything ambiguous.

Migration is scripted as `scripts/import-sponsor-history.js` with `--env=prod` support per AGENTS.md, and dry-run by default. Output a CSV of decisions for Karen to review before the real run.

## 9. Phased rollout

### Phase 1 — Foundation (week 1)
- Migration SQL + `createTables()` updates
- Role + permission additions
- Glossary updates
- Empty `/admin/sponsors` and `/board/sponsors` shells gated on the new resources

### Phase 2 — Core CRUD (weeks 1-2)
- Sponsor list + detail pages
- Stage Kanban with drag-to-advance and stage-change prompts
- Conversation log + attachments
- Owner + primary contact assignment
- Inline editing of all required fields
- Mobile responsive pass

### Phase 3 — Money + goals (week 2)
- `sponsor_amounts` UI (ask / commit / receive / in-kind)
- Campaigns + per-entity goals admin
- KPI strip on staff dashboard, including entity toggle

### Phase 4 — Follow-ups + reminders (week 3)
- `sponsor_followups` CRUD
- Mailgun reminders (per-follow-up + Monday digest)
- Overdue widget + auto-suggested follow-up dates on stage change

### Phase 5 — Board dashboard (week 3)
- `/board/sponsors` read-only view
- "My Connections" panel
- Recent activity feed
- "Log my interaction" form + owner notification
- 60-day grant deadline strip

### Phase 6 — Import + cleanup (week 4)
- `scripts/import-sponsor-history.js` dry run
- Karen review pass on dedup decisions
- Real import
- CSV export from filtered list

### Phase 7 (post-v1) — Impact report
- Standalone shareable document at `/admin/sponsors/impact`
- HTML print stylesheet + PDF export through existing PDF skill
- Anonymized cohort + deployment stats pulled from the rest of the portal

## 10. Out of scope for v1

- Gmail/Outlook auto-ingest of sent emails to sponsor activity (architect for; deliver later)
- DocuSign / e-signature integration
- Google Calendar push for follow-up dates
- Slack notifications for overdue follow-ups
- Self-serve board onboarding (use existing admin invite flow)
- A literal PDF Pipeline Snapshot tailored for the board — the board dashboard is the canonical surface; export is a print stylesheet, not a separate document

## 11. Risks & open items

- **Multi-owner reminders.** If a sponsor has two primary owners, do both get the reminder? Default: only owners with `is_primary=1` on `sponsor_owners` get follow-up reminders; the assignee on the specific `sponsor_followups` row always does. Confirm with Karen.
- **Spreadsheet dedup.** Some sponsors may genuinely be different relationships under the same brand (Starbucks Corporate vs Starbucks Foundation). The import script should flag, not auto-merge.
- **Entity assignment for historical records.** The spreadsheet only started tagging `Entity` recently. Pre-existing records will default to `501c6` (E8 Angels) since the 501c3 is brand new. Karen reviews the dry-run CSV.
- **Glossary load lag.** The data-query skill caches the glossary per session; staff who already have a session open at deploy time won't see the new tables in their next question until they restart the skill. Worth a Slack heads-up at launch.
