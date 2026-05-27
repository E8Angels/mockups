---
title: Development CRM
status: draft
owner: jordan
last_updated: 2026-05-27
home: staff-dashboard.html
---

# Development CRM Plan

## Mockup files in this folder

- **`staff-dashboard.html`** (home) — the development team's working surface (Opportunity Kanban + List + Calendar).
- **`entity-detail.html`** — the combined funder and opportunity workspace for one organization or individual.
- **`development-committee-dashboard.html`** — committee-style Development dashboard for board / development committee members.
- **`implementation-checklist.md`** — durable implementation ledger for the orchestrator agent.

## 1. Purpose

The Development CRM is the portal-native workspace for tracking supporter and prospect relationships, logging conversations, managing follow-ups, and visualizing pipeline progress against fundraising goals. It reuses the portal's people table, role/permission system, notification stack, and notes/attachments patterns rather than creating parallel infrastructure.

The model separates durable funder records from individual fundraising cycles. A **Funder** is the organization or individual relationship. An **Opportunity** is a specific grant cycle, sponsorship term, or one-off gift. This lets the system preserve cross-cycle context while keeping pipeline work, E8 organization reporting, deadlines, and money tied to the specific opportunity where they belong.

## 2. System Decisions

- **Data storage** — same Turso database as the rest of the portal. New tables, no separate schema. All SQL goes through `CacheManager` per AGENTS.md §"Database Query Centralization".
- **Auth / SSO** — same portal login. Admins managed exactly like other staff (`auth_admins`).
- **Mobile** — mobile-responsive from v1. Cheaper than retrofitting later.
- **Notifications** — system alerts, follow-up reminders, and reporting-deadline reminders via Mailgun (`lib/mailgun.js`). Outbound emails Karin or another staff member sends *as themselves* to a funder contact use Google OAuth (`lib/email-sender.js`), same path entrepreneur messages use today.
- **Goal tracking** — track by campaign/program. Annual rollup is a derived view. Goals are per campaign and E8 organization; money rolls up through opportunities.
- **E8 organization reporting** — track E8 Angels and E8 Impact separately and together. E8 organization (501c6 / 501c3 / both) lives on the **opportunity**, not the funder, because a single funder can give to either side year over year. Dashboards have an E8 organization toggle (E8 Angels / E8 Impact / All).
- **Board notifications** — the portal is the canonical surface; the dev committee has a board view (§6d).
- **Board onboarding** — already handled. Board members are in the portal; we use the existing `BoardMember` role.
- **Spreadsheet import** — no separate importer in v1. Test/import data flows through governed data-query write support.

## 3. Data model overview

The portal models fundraising as a two-level relationship:

- **Funder** (`development_funders`) — the durable record for an organization or individual on the giving side. Long-lived. Carries the relationship's contacts, single relationship lead, durable attachments (master MSAs, signed multi-year agreements), email correspondence, and free-text "about" notes.
- **Opportunity** (`development_opportunities`) — a specific grant cycle, sponsorship term, or one-off gift. One funder has zero or more opportunities; each opportunity belongs to exactly one funder. The pipeline (Prospect → Received) lives on the opportunity, not the funder. Every gift, even a one-time $500 individual donation, is modeled as an opportunity ("Smith Family Gift 2026"). A funder with no opportunities is a cold prospect — visible in the directory but not on the Kanban.

What lives where:

| Concept | Funder-level | Opportunity-level |
|---|---|---|
| Pipeline stage | — | yes |
| E8 organization (501c6/501c3) | — | yes |
| Campaign | — | yes |
| Money (ask/commit/receive) | — | yes |
| Application deadlines, decision dates | — | yes |
| Sponsorship/grant term dates | — | yes |
| Reporting requirements | — | yes |
| Contacts (people) | yes | — |
| Email correspondence | yes (optional tag to opp) | — |
| Conversation notes | polymorphic (default to current page's scope) | polymorphic |
| Follow-ups | polymorphic | polymorphic |
| Attachments | yes (durable: MSAs, brand kits) | yes (cycle-specific: LOIs, signed grants) |
| Lead | yes (single relationship lead) | yes (single per-opp staff member for that cycle's write-up) |
| Support | — (computed from in-flight opps' supporters) | yes (0..n internal E8 helpers, typically board members) |
| Source of relationship | yes | yes (this specific opp's source can differ) |

The Kanban, the dashboard KPIs, and most day-to-day work are opportunity-oriented. The combined relationship/opportunity drawer is where the development team reviews the relationship, works the active opportunity, and can inspect historical opportunities without leaving the dashboard.

Conversation notes and follow-ups are polymorphic (parent_kind + parent_id) so they can live at the right scope: a note about "Met Taylor at GreenBiz" belongs to the relationship; a note about "Submitted full proposal — committee meets June 12" belongs to the opportunity. The Add a note form defaults to the current drawer scope, with an explicit toggle.

Email events are relationship-scoped because people are attached to relationships, not opportunities; an opportunity can optionally tag specific email events when the email is clearly about a particular cycle. The opportunity Activity timeline shows opp-scoped events plus a "+ show all relationship activity" toggle.

## 4. Data model

All new tables. SQL ships in `scripts/migrate-add-development-crm.sql`; `createTables()` in `lib/cache-manager.js` updated for new environments; **never** auto-migrated at startup (AGENTS.md §"DB Schema Changes").

### 4.1 New role strings (add to `people.roles`)

System-managed person tags (never edited by hand; see §4.1.a):

- `Sponsor` — contact at a funder with at least one currently-active sponsorship opportunity (stage Committed or Received; `term_end_on` null or in the future)
- `Sponsor Prospect` — contact at a funder with at least one in-pipeline sponsorship opportunity (stage Prospect, Outreach, Conversation, or Proposal) and no currently-active sponsorship at that funder
- `Past Sponsor` — contact at a funder that previously had an active sponsorship (stage Committed or Received with `term_end_on` now in the past) and no currently-active sponsorship; may co-exist with `Sponsor Prospect` if the relationship is being re-courted
- `Funder` — contact at a funder with at least one grant opportunity, at any stage, at any time (no temporal distinction; "prospective" and "past" funders are all `Funder`)

Manually-set tag:

- `Development Committee` — board sub-committee with read-only Development overview access. Follows the existing committee pattern (new row in `committees`, `committee_memberships` rows, derived `DevelopmentCommittee` canonical role via `lib/auth.js:724-733`).

Add all five to the role taxonomy section of `docs/data-query-glossary.md` per AGENTS.md §"Data-Query Glossary". The first four are system-managed and must be documented as derived.

#### 4.1.a Automatic role assignment for development contacts

The four system-managed role strings above are computed by the portal, not edited by hand. A single helper `recomputeDevelopmentRoleTags(personRecordIds[])` evaluates the rules below for each affected person, is idempotent, and is safe to call from any write path.

Per-person evaluation (across all of a person's `development_contacts` links):

1. Collect every non-archived opportunity at every funder the person is a contact on. Skip funders with `is_archived = 1`.
2. Partition by `opportunity.type`:
   - Sponsorship-type = `type = 'sponsorship'` (any subtype: `annual`, `event`, `other`)
   - Grant-type = `type = 'grant'`
   - Gift-type = `type = 'gift'` (does not contribute to either tag set)
3. Sponsor tags (mutually exclusive within the sponsor family, with `Past Sponsor` and `Sponsor Prospect` allowed to co-exist when there is no current sponsorship):
   - If any sponsorship-type opp is in stage Committed or Received AND (`term_end_on IS NULL` OR `term_end_on >= today`) → `Sponsor`. Skip the other sponsor tags.
   - Else: add `Past Sponsor` if any sponsorship-type opp is in stage Committed or Received with `term_end_on < today`; add `Sponsor Prospect` if any sponsorship-type opp is in stage Prospect/Outreach/Conversation/Proposal. Both can apply.
4. Funder tag: if any grant-type opp exists at any of the person's funders, at any stage, at any time → `Funder`.
5. Remove any of the four tags from `people.roles` that do not apply.

Triggers (each must call `recomputeDevelopmentRoleTags` with the affected person_record_id set):

- Insert / delete on `development_contacts`
- Insert on `development_stage_events` (recompute for every contact of the affected opportunity's funder)
- Update to `development_opportunities.term_end_on`, `development_opportunities.type`, or `development_opportunities.is_archived`
- Update to `development_funders.is_archived`
- A nightly cron pass that re-evaluates every person whose funders have an opportunity with `term_end_on` between yesterday and today (so `Sponsor` → `Past Sponsor` transitions happen the morning after a term ends without requiring a write to anything)

Implementation lives in the Development CacheManager domain module. Backfill once on deploy via `scripts/backfill-development-role-tags.js` (dry-run by default per AGENTS.md). Glossary entry in §4.5 must flag these as system-managed and document the rules.

### 4.2 New canonical permission role

- `DevelopmentManager` — derived from a new `auth_admins.type = 'development_manager'` value, mapped in `typeToRole` (`lib/auth.js:703-712`). Karin is the first holder. This is the staff "Admin / Development" role from Karin's §7.

The `Team Member` role from Karin's §7 resolves to any logged-in staff (`SiteAdmin`, `ExecutiveDirector`, `MembershipManager`, etc.) via session roles. Board read-only access uses existing `BoardMember` plus the new `DevelopmentCommittee`. Permissions are bound by adding rows to `resource_permission_roles` keyed to the resource keys in §5.

### 4.3 Tables

```sql
-- Funder (org-level OR individual). One row per long-lived relationship.
CREATE TABLE development_funders (
  id TEXT PRIMARY KEY,                                  -- dent_<hex>
  display_name TEXT NOT NULL,                           -- "Walton Family Foundation" or "Jane Smith"
  funder_type TEXT NOT NULL CHECK (funder_type IN
    ('corporate','individual','foundation','government')),
  source TEXT,                                          -- how this relationship started; opps have their own
  matching_gift_eligible INTEGER,                       -- corporate only; nullable
  notes_freeform TEXT,                                  -- the funder-level "about" / Tags-Notes field
  primary_contact_person_record_id TEXT,                -- denorm; FK -> people.record_id
  lead_person_record_id TEXT,                          -- single relationship lead; FK -> people.record_id
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_development_funders_type ON development_funders(funder_type);

-- Opportunity. One row per grant cycle, sponsorship term, or one-off gift.
CREATE TABLE development_opportunities (
  id TEXT PRIMARY KEY,                                  -- dopp_<hex>
  funder_id TEXT NOT NULL,                              -- FK -> development_funders.id
  name TEXT NOT NULL,                                   -- "Wilmington Scholarship 2026"
  type TEXT NOT NULL CHECK (type IN ('grant','sponsorship','gift')),
  subtype TEXT CHECK (
    (type = 'sponsorship' AND subtype IN ('annual','event','other'))
    OR (type IN ('grant','gift') AND subtype IS NULL)
  ),                                                    -- subtype only applies to sponsorships
  stage TEXT NOT NULL CHECK (stage IN
    ('prospect','outreach','conversation','proposal',
     'committed','received','declined')),               -- denorm of latest stage event
  e8_organization TEXT NOT NULL CHECK (e8_organization IN
    ('501c6','501c3','both')),                          -- E8 Angels / E8 Impact / Both
  campaign_id TEXT,                                     -- FK -> development_campaigns.id
  fiscal_year INTEGER,                                  -- derived/denorm for filtering

  -- Money denorms (source of truth is development_amounts).
  -- Sums across cash + in-kind (in-kind rows contribute their estimated cash value).
  -- Recomputed on every amounts write.
  amount_asked_cents INTEGER,
  amount_committed_cents INTEGER,
  amount_received_cents INTEGER,
  amount_remaining_cents INTEGER,

  -- Dates (all nullable). Grant lifecycle:
  application_deadline TEXT,                            -- YYYY-MM-DD; when the funder needs our materials
  submitted_on TEXT,                                    -- when we submitted our application
  decision_expected_on TEXT,                            -- when the funder said they'd decide
  decided_on TEXT,                                      -- when we got an answer

  -- Sponsorship / grant period:
  term_start_on TEXT,                                   -- when the sponsorship or grant period begins
  term_end_on TEXT,                                     -- when it ends (drives Sponsor → Past Sponsor)
  event_name TEXT,                                      -- free-text event name when type='sponsorship' and subtype='event'

  -- Application link:
  application_url TEXT,                                 -- portal URL for the grant or sponsorship application

  -- Restricted-fund flags (grant-shaped; also applies to restricted corporate gifts):
  is_restricted INTEGER NOT NULL DEFAULT 0,
  restriction_notes TEXT,

  -- Reporting obligations (grants typically require interim / final reports):
  reporting_required INTEGER NOT NULL DEFAULT 0,
  reporting_due_on TEXT,                                -- next report due date
  reporting_completed_on TEXT,                          -- when the most recent report was submitted

  -- Renewal lineage:
  renewal_of_opportunity_id TEXT,                       -- self-FK; prior cycle this one renews

  -- Decline metadata (set when stage moves to 'declined'):
  decline_reason TEXT,

  -- Single lead per opportunity (staff member accountable for the cycle).
  lead_person_record_id TEXT,                          -- FK -> people.record_id

  source TEXT,                                          -- this opp's source ("repeat funder", "warm intro at GreenBiz")
  notes_freeform TEXT,                                  -- opp-level "about"
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_development_opportunities_funder ON development_opportunities(funder_id);
CREATE INDEX idx_development_opportunities_stage ON development_opportunities(stage);
CREATE INDEX idx_development_opportunities_type ON development_opportunities(type, subtype);
CREATE INDEX idx_development_opportunities_e8_organization ON development_opportunities(e8_organization);
CREATE INDEX idx_development_opportunities_campaign ON development_opportunities(campaign_id);
CREATE INDEX idx_development_opportunities_fy ON development_opportunities(fiscal_year);
CREATE INDEX idx_development_opportunities_deadline ON development_opportunities(application_deadline)
  WHERE application_deadline IS NOT NULL;
CREATE INDEX idx_development_opportunities_reporting_due ON development_opportunities(reporting_due_on)
  WHERE reporting_due_on IS NOT NULL AND reporting_completed_on IS NULL;

-- Contacts at a funder. Reuses people table. Contacts persist across opportunities.
CREATE TABLE development_contacts (
  funder_id TEXT NOT NULL,
  person_record_id TEXT NOT NULL,
  role_at_org TEXT,                                     -- "VP Partnerships" / "Program Officer" (override of people.title)
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (funder_id, person_record_id)
);

-- Leads are stored as a single `lead_person_record_id` column on `development_funders`
-- (relationship lead) and on `development_opportunities` (opportunity lead). There is
-- exactly one of each — no co-leads, no primary/secondary. Switching lead is a single
-- UPDATE; we keep the change history in `development_notes` (source='lead_changed') so
-- a separate lead assignment-events table is not needed for v1.

-- Opportunity supporters. A supporter is an internal E8 person (board member, exec, staff)
-- *helping* move a specific opportunity forward without being the accountable lead.
-- Cardinality is 0..n per opportunity, skewed toward 0 and 1. See §6c.iv.
CREATE TABLE development_opportunity_supporters (
  opportunity_id TEXT NOT NULL,                         -- FK -> development_opportunities.id
  person_record_id TEXT NOT NULL,                       -- FK -> people.record_id; must resolve to a board member or staff member
  notes TEXT,                                           -- "knows program officer directly"; "made the intro at GreenBiz"
  notification_suppressed INTEGER NOT NULL DEFAULT 0,   -- per-supporter opt-out from the good-news pings on stage advances
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  added_by_person_record_id TEXT,
  PRIMARY KEY (opportunity_id, person_record_id)
);
CREATE INDEX idx_development_opportunity_supporters_person ON development_opportunity_supporters(person_record_id);

-- Money. Always tied to an opportunity. ask vs commit vs receive, cash vs in-kind.
-- Multi-installment pledges: one 'commit' row + multiple 'receive' rows, each with due_on/received_on.
-- Mixed-nature opportunities: one opportunity can carry both cash and in-kind rows
-- (e.g. a sponsor commits $10,000 + a case of wine; that's one cash 'commit' row + one in_kind 'commit' row).
CREATE TABLE development_amounts (
  id TEXT PRIMARY KEY,                                  -- damt_<hex>
  opportunity_id TEXT NOT NULL,                         -- FK -> development_opportunities.id
  kind TEXT NOT NULL CHECK (kind IN ('ask','commit','receive')),
  nature TEXT NOT NULL CHECK (nature IN ('cash','in_kind')),
  amount_cents INTEGER,                                 -- cash amount; for nature='in_kind' this is optional estimated cash value
  in_kind_description TEXT,                             -- "Case of wine, 12 bottles"; required when nature='in_kind', NULL when 'cash'
  currency TEXT NOT NULL DEFAULT 'USD',
  due_on TEXT,                                          -- YYYY-MM-DD; when this slice is expected (for receives)
  received_on TEXT,                                     -- YYYY-MM-DD; when actually received (for receives)
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_person_record_id TEXT,
  CHECK (
    (nature = 'in_kind' AND in_kind_description IS NOT NULL AND length(in_kind_description) > 0)
    OR (nature = 'cash' AND amount_cents IS NOT NULL AND in_kind_description IS NULL)
  )
);
CREATE INDEX idx_development_amounts_opportunity ON development_amounts(opportunity_id);
CREATE INDEX idx_development_amounts_due_unrealized ON development_amounts(due_on)
  WHERE kind = 'receive' AND received_on IS NULL;

-- Stage timeline (event sourced; current stage is denorm on opportunities).
CREATE TABLE development_stage_events (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,                         -- FK -> development_opportunities.id
  from_stage TEXT,                                      -- nullable for initial row
  to_stage TEXT NOT NULL,
  changed_by_person_record_id TEXT,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT                                             -- prompted note attached at transition
);
CREATE INDEX idx_development_stage_events_opp ON development_stage_events(opportunity_id, changed_at);

-- Conversation log. Polymorphic: a note attaches to either a funder or an opportunity.
-- Append-only; 10-minute edit window enforced in route.
CREATE TABLE development_notes (
  id TEXT PRIMARY KEY,                                  -- dnote_<hex>
  parent_kind TEXT NOT NULL CHECK (parent_kind IN ('funder','opportunity')),
  parent_id TEXT NOT NULL,                              -- FK to dev_funders.id or dev_opportunities.id
  author_person_record_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN
    ('manual',                  -- staff entered via Add-a-note
     'manual_board',            -- board member "Log my interaction"
     'stage_change',            -- attached to a stage transition (parent must be opportunity)
     'opportunity_created',     -- auto-generated when an opp is created
     'report_completed')),      -- when reporting_completed_on is set
  occurred_at TEXT NOT NULL,                            -- when the interaction happened
  body_markdown TEXT NOT NULL,                          -- TipTap source of truth
  body_html TEXT NOT NULL,                              -- sanitized for render; rebuilt from body_markdown on save
  related_stage_event_id TEXT,                          -- FK -> development_stage_events.id when source='stage_change'
  is_internal INTEGER NOT NULL DEFAULT 0,               -- when 1, item is staff-only
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0                 -- admin-only; surfaces in audit
);
CREATE INDEX idx_development_notes_parent ON development_notes(parent_kind, parent_id, occurred_at);

-- Email events ingested via Google Pub/Sub. Always funder-scoped (people are on funders, not opportunities).
-- An email can optionally be tagged to one or more opportunities via development_opportunity_email_links.
CREATE TABLE development_email_events (
  id TEXT PRIMARY KEY,                                  -- demail_<hex>
  funder_id TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL UNIQUE,                -- Gmail Message-ID header
  thread_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_person_record_id TEXT,                           -- nullable; resolved from people.email when sender is known
  from_address TEXT NOT NULL,                           -- raw From address; fallback when sender isn't in people
  to_person_record_ids TEXT,                            -- JSON array of resolved person_record_ids
  to_addresses TEXT NOT NULL,                           -- JSON array of raw To/Cc addresses
  subject TEXT,
  body_text TEXT NOT NULL,                              -- full plain-text body for in-timeline display
  occurred_at TEXT NOT NULL,                            -- email date
  has_attachments INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_development_email_events_funder ON development_email_events(funder_id, occurred_at);

-- Junction: tag an email to one or more opportunities so it surfaces on those opps' timelines.
-- Set manually by staff ("attach this thread to this grant cycle") or by simple matching rules
-- (e.g., subject contains opportunity name).
CREATE TABLE development_opportunity_email_links (
  email_event_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  linked_by_person_record_id TEXT,
  linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email_event_id, opportunity_id)
);
CREATE INDEX idx_development_opportunity_email_links_opp ON development_opportunity_email_links(opportunity_id);

-- Attachments on ingested emails. Per-file so the timeline can render filetype icon + filename.
CREATE TABLE development_email_attachments (
  id TEXT PRIMARY KEY,                                  -- demaila_<hex>
  email_event_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content BLOB,                                         -- nullable; null means fetch-on-demand
  gmail_attachment_id TEXT,                             -- Gmail attachment ID for lazy fetch when content IS NULL
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_development_email_attachments_event ON development_email_attachments(email_event_id);

-- Attachments to notes.
CREATE TABLE development_note_attachments (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by_person_record_id TEXT
);

-- Funder-level durable attachments (master MSAs, brand kits, signed multi-year agreements).
CREATE TABLE development_funder_attachments (
  id TEXT PRIMARY KEY,
  funder_id TEXT NOT NULL,
  google_drive_file_id TEXT NOT NULL,
  google_drive_folder_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  web_url TEXT,
  label TEXT,                                           -- "Master MSA 2024"
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by_person_record_id TEXT
);

-- Opportunity-level attachments (LOI for this cycle, signed grant award letter, single-year sponsorship agreement).
CREATE TABLE development_opportunity_attachments (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  google_drive_file_id TEXT NOT NULL,
  google_drive_folder_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  web_url TEXT,
  label TEXT,                                           -- "Signed award letter"
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by_person_record_id TEXT
);

-- Follow-ups / tasks. Polymorphic: attach to funder OR opportunity.
CREATE TABLE development_followups (
  id TEXT PRIMARY KEY,
  parent_kind TEXT NOT NULL CHECK (parent_kind IN ('funder','opportunity')),
  parent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_on TEXT NOT NULL,                                 -- YYYY-MM-DD, Pacific business calendar
  reminder_note TEXT,
  completed_at TEXT,
  completed_by_person_record_id TEXT,
  completion_note TEXT,                                 -- can become a development_notes row
  reminder_sent_at TEXT,                                -- last Mailgun reminder timestamp
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_person_record_id TEXT
);
CREATE INDEX idx_development_followups_due ON development_followups(due_on)
  WHERE completed_at IS NULL;
CREATE INDEX idx_development_followups_parent ON development_followups(parent_kind, parent_id);

-- Task owners. A task can have zero or more owners; the UI uses the shared people picker.
CREATE TABLE development_followup_owners (
  followup_id TEXT NOT NULL,                            -- FK -> development_followups.id
  person_record_id TEXT NOT NULL,                       -- FK -> people.record_id
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  added_by_person_record_id TEXT,
  PRIMARY KEY (followup_id, person_record_id)
);
CREATE INDEX idx_development_followup_owners_person ON development_followup_owners(person_record_id);

-- Campaigns / programs. Goal tracking is per-campaign per-E8-organization.
CREATE TABLE development_campaigns (
  id TEXT PRIMARY KEY,                                  -- dcamp_<hex>
  name TEXT NOT NULL,                                   -- "FY26 Annual Fund"
  fiscal_year INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE development_campaign_goals (
  campaign_id TEXT NOT NULL,
  e8_organization TEXT NOT NULL CHECK (e8_organization IN ('501c6','501c3','both')),
  goal_cents INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, e8_organization)
);

-- Recent-activity feed (board dashboard, §6d). Pre-materialized for cheap reads.
-- Built by an SWR getter; stores recent items (30 days, hard-cap 500).
CREATE TABLE development_activity_feed (
  id TEXT PRIMARY KEY,
  funder_id TEXT NOT NULL,
  opportunity_id TEXT,                                  -- nullable when event is funder-level
  kind TEXT NOT NULL CHECK (kind IN
    ('new_opportunity','stage_advanced','commitment',
     'gift_received','note_added','report_submitted')),
  occurred_at TEXT NOT NULL,
  amount_cents INTEGER,
  summary TEXT NOT NULL,
  actor_person_record_id TEXT,
  is_internal INTEGER NOT NULL DEFAULT 0                -- when 1, item is staff-only
);
CREATE INDEX idx_development_activity_feed_at ON development_activity_feed(occurred_at);
```

ID prefixes follow the established convention (`dent_`, `dopp_`, `damt_`, `dnote_`, `demail_`, `demaila_`, `dcamp_`).

### 4.4 SWR cache keys

Heavy composed reads land in SWR (AGENTS.md §"SWR Cache"):

- `development.dashboard.staff` — staff Opportunity Kanban + KPIs (per-E8-organization-filtered variants built per request, not cached)
- `development.dashboard.board` — board read-only dashboard
- `development.activity-feed.30d` — feed materialization
- `development.funder-directory` — full funders directory (small dataset; full refresh on writes)
- Tags: `development`, `development-goals`, `development-followups`

Invalidate `development` on any write to `development_funders`, `development_opportunities`, `development_amounts`, `development_stage_events`. Invalidate `development-followups` separately because that view's TTL can be much shorter.

### 4.5 Glossary updates (mandatory per AGENTS.md)

`docs/data-query-glossary.md`:
- Add new section "Development (fundraising)" covering `development_funders`, `development_opportunities`, `development_amounts`, `development_notes`, `development_followups`, `development_campaigns`, `development_email_events`.
- Add the new role strings to the role taxonomy and flag the four system-managed ones (`Sponsor`, `Sponsor Prospect`, `Past Sponsor`, `Funder`) as derived per §4.1.a.
- Add a "Common gotcha" entry: "Development giving is not the same as `deployments`. `deployments` are E8's outbound investments into portfolio companies; `development_amounts` are gifts coming INTO E8."
- Add a "Common gotcha" entry: "Pipeline stage lives on `development_opportunities`, not `development_funders`. A funder with two opportunities can have one in Received and another in Prospect at the same time. Asking 'what stage is Walton Family Foundation in?' is the wrong shape of question; ask about a specific opportunity."
- Add a "Common gotcha" entry: "`development_amounts.kind = 'receive'` rows can be either expected (has `due_on`, null `received_on`) or realized (non-null `received_on`). KPIs that count 'Received' should filter on `received_on IS NOT NULL`."
- Add a "Common gotcha" entry: "`development_amounts.nature` distinguishes cash from in-kind. In-kind rows still carry an `amount_cents` (the estimated cash value); the opportunity's `amount_*_cents` denorms sum across both. A single opportunity can mix cash and in-kind (e.g. a sponsor commits $10,000 + a case of wine). When reporting on 'cash raised' specifically, filter `nature = 'cash'`."
- Add a "Common gotcha" entry: "Opportunity `type` is one of (`grant`, `sponsorship`, `gift`). `subtype` is non-null only when `type='sponsorship'` and is one of (`annual`, `event`, `other`). The dashboard and Kanban only surface the top-level `type`; `subtype` is a detail-page-only field. Don't write queries that filter by 'Annual Sponsorship' as if it were a top-level type — group by `type` and join `subtype` only when needed. 'In-kind' is not an opportunity type — it's a row-level `nature` on `development_amounts`, so a single opportunity can carry both cash and in-kind amount rows."
- Add a "Common gotcha" entry: "Each opportunity has exactly one lead (`development_opportunities.lead_person_record_id`) and zero or more supporters (`development_opportunity_supporters`). A supporter is an *internal* E8 person (board member, exec, staff) *helping* — not the accountable lead. Tasks and follow-ups should never be assigned to a supporter by default. Conversely, contacts (`development_contacts`) live on the *funder* and are *external* — they're the funder/sponsor-side person. Support ≠ contact ≠ lead; the three roles never overlap on the same record."

### 4.6 Data-query skill write support

The existing data-query skill is read-only today. For Development CRM, it becomes a governed read/write assistant for this domain:

- It can create and edit Funders, Opportunities, Contacts, Tasks, Notes, Amounts, Receipts, stage changes, Support assignments, and task owners.
- It uses the same glossary/schema/AI relationship registry metadata as read queries, plus a write-capability manifest that maps business actions to portal API endpoints and required resource permissions.
- It never writes SQL directly. Mutations call portal routes that already validate permissions, normalize dates, write through `CacheManager`, invalidate SWR, recompute role tags, and append activity/audit rows.
- Mutating actions require a structured confirmation preview before execution, including the exact Funder/Opportunity, fields changing, old values when known, and side effects such as notifications.
- Creation flows support natural-language commands such as "create a Funder for Portland General Electric", "add an event sponsorship opportunity for Portland Sip and Share", "add Lisa and Karin as task owners", or "move Walton to Proposal and create a follow-up for Jordan and Lisa".
- The skill can propose but not silently send outbound emails or board notifications. Any action that sends external communication remains an explicit portal flow.

## 5. Permissions

New resource keys (registered in `_seedResourceRegistry`, `lib/auth.js:274-348`):

| Resource key | Bound roles | Purpose |
|---|---|---|
| `admin.development.read` | DevelopmentManager, ExecutiveDirector, SiteAdmin, BoardMember, DevelopmentCommittee | Open the module |
| `admin.development.write` | DevelopmentManager, ExecutiveDirector, SiteAdmin | Create/edit funder + opportunity rows, stages, amounts |
| `admin.development.notes.write` | DevelopmentManager, ExecutiveDirector, SiteAdmin, *plus* logged-in staff | Log a conversation |
| `admin.development.notes.write.board` | BoardMember, DevelopmentCommittee | "Log my interaction" (creates note with `source='manual_board'`) |
| `admin.development.followups.write` | DevelopmentManager, ExecutiveDirector, SiteAdmin, plus any task owner | Set / complete a follow-up |
| `admin.development.export` | DevelopmentManager, ExecutiveDirector, SiteAdmin | CSV export |
| `admin.development.goals.write` | DevelopmentManager, ExecutiveDirector, SiteAdmin | Edit campaign goals |
| `admin.development.admin` | SiteAdmin, DevelopmentManager | Delete duplicates, archive |

Karin's three roles map cleanly:
- **Admin / Development** → `DevelopmentManager`
- **Team Member** → any other staff (resolved via session roles)
- **Board Member / Dev Committee** → `BoardMember` (already exists) plus `DevelopmentCommittee` (new)

## 6. UI surfaces

All views mobile-responsive from day one (single-column collapse at narrow widths; Kanban becomes horizontally scrollable list).

### 6a. Staff dashboard (`/admin/development`)

Layout, top to bottom:

1. **KPI strip** (6 cards): Received YTD vs. campaign goal (progress bar), Pipeline value (sum of asks across opps in stages Outreach → Proposal), Active opportunities (count in stages Outreach → Proposal), Overdue follow-ups (red if > 0), Avg gift size (received `development_amounts` rows only), Reporting due 30d (count of opps with `reporting_due_on` within 30 days). KPIs respond to the E8 organization filter.
2. **Workspace** — a two-column flex layout: left rail + main pane, separated by a draggable resize handle. The pattern mirrors `docs/mockups/companies-admin-redesign/variant-a-list.html`: width is persisted in `localStorage` under `e8.development.filterRailWidth`; min 200px, max 560px; default 280px. Drag the handle past 160px to collapse; collapsed state persists under `e8.development.filterRailOpen`. Collapsed, the rail becomes a thin vertical "Filters" button against the left edge that re-expands on click.

#### Left rail contents (top to bottom):

- **Collapse caret** at the top-right of the rail (`‹`) — also collapses to the thin button.
- **Search** — single text input that matches funder name, opportunity name, contact name, and free-text notes. Live filter. Placeholder: `Search opportunities, funders, contacts...`.
- **Quick filters** — `My Opportunities` filters by opportunity lead = current user. `My Funders` filters by funder lead = current user. These sit above the full filter groups so staff do not have to hunt inside Lead filters for the common case.
- **E8 organization** — segmented control: `All / 501c6 / 501c3`. Selection drives KPIs and the listing. Filters opportunities by `development_opportunities.e8_organization`.
- **Opportunity type** — checkbox group with counts. Three top-level options: `Grant / Sponsorship / Gift`. Sponsorship subtype (Annual / Event / Other) is a detail-level field that surfaces only in the opportunity drawer — it is not exposed as a top-level tag, chip, or filter on the dashboard.
- **Funder type** — checkbox group with counts: `Corporate / Foundation / Individual / Government`. (Filters opportunities through the funder join.)
- **Pipeline stage** — checkbox group with stage chips and counts.
- **Lead** — checkbox group with staff avatars and counts (opportunity lead).
- **Follow-up** — checkbox group: Overdue / Due in 7 days / None scheduled.
- **Fiscal year** — select: `Current FY / Prior FY / Two FYs back / All`.
- **Reporting** — checkbox group: `Reporting due 30d / Reporting overdue`.

#### Main pane:

- **Toolbar row**: `<result count>` left-aligned; right-aligned cluster of `Kanban / List / Calendar` view-mode toggle, then a divider, then **`+ New opportunity`** (primary blue), `Export CSV`.
- **Overdue banner** — appears below the toolbar when overdue count > 0.
- **View body**: Kanban / List / Calendar.
  - **Kanban** columns = 7 pipeline stages. Each Kanban card is an **opportunity** rendered as the four-band tile (§6a.i). **The entire card opens the relationship/opportunity drawer** over the dashboard. Dragging a card to another stage updates the card in place and persists the stage in the background; no note modal appears on drag.
  - **List** view: a RecordGrid-powered workspace with grouped saved views for **Opportunities** and **Funders**. Selecting an Opportunity view mounts the Opportunities grid in the content area. Selecting a Funder view mounts the Funders grid in that same content area. The two grids share the visible List surface but use separate base tables, field catalogs, saved views, AI Assist context, row actions, permissions, and write paths. Do not mix funder rows and opportunity rows in one grid instance.
  - **Calendar**: calendar workspace for application deadlines, reporting due dates, decision expected dates, sponsorship term dates, and follow-up tasks. It supports Month, Week, and Table views, with previous/next controls for moving between months or weeks. Month view uses weekday columns plus a compact shared Sat/Sun column. Calendar items are visually distinguished by type: deadline, report, task, and overdue task. Calendar entries link to the related opportunity when an opportunity association exists; clicking an entry opens the relationship/opportunity drawer with that opportunity selected.

#### 6a.i. Kanban tile layout (opportunity card)

Each card has three horizontal bands, top to bottom:

1. **Header band** (slate-100 fill, hairline below) — opportunity-type chip and E8 organization tag(s) on the left; the opportunity Lead's profile photo on the top-right, falling back to initials when no photo is available. Only three top-level type labels appear: `Grant`, `Sponsorship`, `Gift`. (Sponsorship subtype lives in the opportunity drawer; it is not surfaced on the tile.) When `e8_organization = 'both'` the band renders both `(c)6` and `(c)3` tags side by side rather than a single "both" label.
2. **Opportunity name** — 14px semibold, the strongest text on the card. ("Wilmington Scholarship 2026", "FY27 Sponsorship", "Smith Family Annual Gift")
3. **Funder name + funder-type chip** — 12px slate, shown so the card scans correctly out of context. Comma-separated when multiple contacts; rendered as muted italic `No contact yet` when the funder has no contact.
4. **Ask amount** — 16px semibold tabular numerals, full-dollar format (`$75,000`).
5. **Support** *(conditional)* — when the opportunity has at least one supporter, a 12px line below the ask amount reads `Support: Kathleen Hebert`. Multiple supporters render comma-separated; an opp with no supporter omits the line entirely (the band only appears when there is a supporter, so most tiles will not show it). See §6c.v for the data model and full semantics.

Below the body, a hairline separator and a **footer row**: `Follow-up: May 26`, color-coded by urgency (amber within 7 days, red+`· overdue` when past due, muted `none scheduled` when absent). When `reporting_due_on` is within 30 days, a second footer row shows `Report due Jun 30` in amber/red as appropriate.

The `+ New opportunity` button opens the dialog described in §6f.

### 6a.ii. List RecordGrid base tables

The staff dashboard List view uses the same RecordGrid component and view-builder/AI-assist patterns used by `/admin/companies`, `/admin/people`, and `/admin/partners`, but it supports two explicit base tables:

- **Opportunity views** mount `RecordGrid` with `tableKey="development_opportunities"`. Default saved views include `Pipeline opportunities`, `My Opportunities`, `Reporting due`, `Received this FY`, and `Declined / archived`. Row clicks open the relationship/opportunity drawer with that opportunity tab selected.
- **Funder views** mount `RecordGrid` with `tableKey="development_funders"`. Default saved views include `All Funders`, `My Funders`, `Cold prospects`, `Active funders`, and `No primary contact`. Row clicks open a right-side slide-out Funder panel rather than navigating away. The panel is modeled on `entity-detail.html`: funder summary, contacts, lead, active/historical opportunities, documents, and the unified activity stream.
- The List toolbar contains a compact saved-view selector grouped by `Opportunities` and `Funders`. Changing between groups unmounts the current grid and mounts the other base table in the same content area; it is not a polymorphic mixed-row grid.
- Each base table has its own column catalog, filter options, row selection semantics, CSV export, AI Assist prompt context, and view-builder rail state. Persist selected view separately, e.g. `e8-record-grid-view:development_opportunities` and `e8-record-grid-view:development_funders`.
- The shared left filter rail remains visible. When an Opportunity view is active, filters apply directly to opportunity fields. When a Funder view is active, opportunity-specific filters apply through related opportunities (`has at least one opportunity matching...`) and funder-specific filters apply directly to `development_funders`.
- The grid and panel share the same write APIs as the Kanban/drawer, so edits made from any surface update the same records and invalidate the same `development` SWR tags.
- `My Funders` is a first-class saved view and quick filter: current user is `development_funders.lead_person_record_id`.

### 6b. Relationship/opportunity drawer

The canonical detail surface for development CRM work. It opens as a right-side drawer over the staff dashboard, occupying roughly 95% of the viewport width with the dashboard still visible behind it. The drawer content uses tight left/right gutters so the panel reads as a workspace, not a centered page. Users close it with Escape, backdrop click, or the `X` in the drawer chrome. It combines durable relationship information, contacts, relationship lead assignment, opportunity work, historical opportunities, and relationship-level activity in one workspace. Opportunity-specific dashboard clicks open the drawer with the relevant opportunity tab selected.

Layout, top to bottom:

1. **Relationship summary card**:
   - Header: funder/person name, funder-type chip, and optional short description from `development_funders.notes_freeform`. Do not render an "Funder information" label.
   - Contacts render as the existing reusable people-pill component used elsewhere in the portal. The pill shows name/title and may include the email icon. Clicking a person opens the existing Add/Edit Contact dialog. The circular `+` affordance beside the pills adds a contact.
   - The Add/Edit Contact dialog includes name, email, title, phone, and LinkedIn. Name is the only required field.
   - Outbound email starts from the contact pill/email icon, not from a page-level button.
   - Relationship lead appears in this summary area.
   - Support is opportunity-scoped and does not appear as a relationship field.
   - Hovering the relationship summary reveals a pencil icon in the upper-right for inline relationship edits.
   - Do not render typical grant range or known preferences as separate structured fields. Put that information in the relationship description when it matters.
2. **Opportunity tabs**:
   - Default tab is the active opportunity: the first opportunity whose stage is not `received` or `declined`.
   - If there is no active opportunity, default to Summary.
   - Summary tab lists all opportunities for the relationship in a compact table for cross-cycle review.
   - Each opportunity gets its own tab. Active and historical opportunities use the same opportunity-tab layout; historical opportunities are not reduced to summary cards.
   - The active opportunity tab includes the current stage as a pill beside the opportunity name.
   - New opportunity is a compact `+` tab between the right-most opportunity tab and the Activity tab. It opens the New Opportunity wizard with this relationship preselected.
   - Activity tab shows the full relationship-level activity stream.
3. **Opportunity tab content**:
   - Left panel header: opportunity name flush to the top of the pane, with compact type chip (`Grant` / `Sponsorship` / `Gift`) and E8 organization chip (`501(c)3`, `501(c)6`, or both) directly beneath it.
   - Website appears just above the description without a separate label.
   - Description appears directly below the website/opportunity name without a separate label.
   - Lead and Support appear below the description as people-pill controls. Changing lead or supporter uses the same inline people-picker pattern as Contacts, not a page edit mode.
   - Properties use left-aligned labels: Stage, Amount, Due date, Decision, sponsorship term when relevant, and reporting/restriction fields when relevant. Use date strings such as `Aug 12, 2026`.
   - Amount fields are ordinary property rows in the left-label layout: `Requested` with editable amount, then `Committed` with editable amount. Do not render these as summary tiles.
   - The receipt table appears below the normal property rows, after Due date and Decision. It spans the full left panel width and does not have a left-side field label.
   - The receipt table columns are: Received (cash label or in-kind description), Date, Amount, and an edit icon. Cash receipts show the received cash amount. In-kind receipts show the description; if an estimated cash value exists, it appears in the Amount column.
   - Cash receipts are created from a `Record receipt` button. The modal collects amount and received date, writes a `development_amounts` row with `kind='receive'`, `nature='cash'`, `amount_cents`, and `received_on`, and then updates the receipt table.
   - Multi-installment commitments are represented as one or more `commit` rows and multiple `receive` rows. The table footer totals realized receipts and shows Remaining as committed minus total received value.
   - In-kind receipts are also created from `Record receipt`. The modal supports an in-kind mode that collects description, received date, and optional estimated cash value. It writes a `kind='receive'`, `nature='in_kind'` row with `received_on`; estimated cash value is included in rollups when present.
   - Stage dropdown remains inline in the property list.
   - Edit affordance is a pencil icon in the upper-right of the opportunity panel, visible on hover. Inline fields are directly editable where practical; do not use a full edit dialog for routine opportunity properties.
   - Documents panel appears above the activity stream. It lists Google Drive files in the opportunity folder and includes `Upload file` and `Create new document`.
   - Activity stream appears beside the opportunity details. A TipTap note editor sits above the stream. Notes are created from the activity pane, not from an Add Note button in the opportunity details panel. The editor has a clear `Save` button.
   - If a user starts a note and navigates to another tab before saving, show a modal prompt with Save / Discard / Cancel. Implement this with the existing React modal pattern, not `window.confirm`.
5. **Funder-level Activity tab**:
   - Shows all relationship activity by default: emails, notes, stage changes, money, files, contact changes, and opportunity lifecycle events.
   - Email ingestion is relationship-scoped because emails can often be matched to the relationship/contact but not confidently matched to a specific opportunity.
   - Activity can be filtered to `All`, a specific opportunity, or `Unassociated`.
   - Notes and structured events may carry an opportunity association. Emails may be unassociated unless staff tags them to an opportunity.

### 6c. Stage control on opportunity tabs

  **Stage dropdown.** The stage control in the opportunity property list is a single styled `<select>` rather than a chip + Advance button pair. The select is the stage chip — it carries the same per-stage color treatment, and its width fits the longest stage label. Changing the value updates the opportunity in place and persists the stage in the background, matching the later no-popup Kanban direction. Reasons for the dropdown over the chip+button: most stage changes don't go forward one step at a time (a grant can jump from Conversation straight to Declined; a sponsorship often moves Conversation → Committed without a Proposal); the `Advance` button implies a single-step forward flow that doesn't match reality. The dropdown also makes "go backwards" or "correct a mis-click" first-class instead of buried in a kebab.

Stage changes write `development_stage_events` for timeline/history. Staff can add a note separately in the Activity composer when context is needed.

#### 6c.i. Documents

Development documents and attachments are backed by Google Drive, not database BLOB storage.

- On first use, the app creates a `Development` folder under `PORTAL_STORAGE_DRIVE_FOLDER_ID` using the portal Google Service Account.
- Each relationship gets a folder inside `Development`, named from the display name plus funder id for uniqueness.
- Each opportunity gets a subfolder inside its relationship folder, named from the opportunity name plus opportunity id.
- Relationship-level files are stored in the relationship folder. Opportunity-level files are stored in the opportunity subfolder.
- The UI lists the current Drive folder contents directly, following the pattern used on the Diligence page's supporting documents panel.
- Document rows show last-edited date/time for editable Google files and uploaded date/time for static files such as PDFs. Do not mix relative update labels and file sizes in the same metadata column.
- `Upload file` uploads into the current relationship or opportunity folder.
- `Create new document` creates a new Google document in the current folder and opens it. Do not label this button "Google doc" in the UI.
- Existing Drive files can be linked into the current folder when needed, but the primary creation path is `Create new document`.
- The attachment tables store Drive metadata (`google_drive_file_id`, folder id, filename, mime type, optional size, web URL) so the portal can show stable records and activity events.

#### 6c.ii. Activity feed — event provenance

The Activity feed is a compact chronological log. It appears in the relationship/opportunity drawer, with the same rendering system across Summary, opportunity, and Activity tabs:

- The relationship feed includes relationship-level events plus events from all opportunities under the relationship.
- Opportunity tabs show the relationship-level feed filtered to the selected opportunity plus unassociated relationship activity when useful.
- Newest first by default. Date-grouped subheadings ("Yesterday", "Last week", "Earlier this month") appear when there are 30+ entries.
- A subtle timeline rail and small dots may be used for chronology, but the cards themselves carry the visual meaning. Do not depend on a thick colored left border.
- Do not render uppercase type labels or badges such as `NOTE`, `EMAIL`, `STAGE`, or `BOARD` inside individual feed items.
- Event type is conveyed through card structure, icon, alignment, and border/background treatment. Icons sit in the upper-right corner of each card.

Visual treatments:

- **Notes** — compact white bordered note card, pencil/note icon in the upper-right, author/date metadata above or within the card, rich-text body below. Board-logged notes use the same note treatment with board provenance in the metadata text, not a `BOARD` badge.
- **Inbound emails** — left-aligned bordered email card with envelope icon in the upper-right. Collapsed state shows route/from-to metadata, subject, and a two-line content teaser.
- **Outbound emails** — right-aligned bordered email card with send/mail-out icon in the upper-right. Use conversation-style placement to communicate direction; do not rely on color alone to explain inbound vs outbound.
- **Expanded emails** — the expanded version replaces the teaser rather than appearing underneath it. Hide the collapsed summary and show full email headers (`From`, `To`, `Subject`), full body, and attachments. The toggle text switches between `View more` and `View less`.
- **Stage/state changes** — compact full-border status card with from/to chips and author/date metadata. If a note was attached to the stage change, render the note body inside the same event.
- **Money events** — compact full-border card with amount, kind (`ask`, `commit`, `receive`), nature (`cash` or `in-kind`), campaign, received date when relevant, and author/date metadata.
- **Files** — compact full-border card with file icon, filename, size, and author/date metadata.

Each item corresponds to a real event in one of the underlying tables. Event kinds:

| Kind | Source / how it's created | What's shown in the timeline |
|---|---|---|
| **Note** | Staff "Add a note" form scoped to an opportunity (`source='manual'`, `parent_kind='opportunity'`) or to the relationship (`parent_kind='funder'`), or a board member "Log my interaction" (`source='manual_board'`). | Date, author, and rich-text body. A bare "Edit" link is shown to the author for 10 minutes after creation. Board-logged submissions trigger a Mailgun alert to the primary opportunity lead. |
| **Email** | Auto-ingested via Google Pub/Sub. Pub/Sub pushes each new Gmail message to the portal webhook; the webhook resolves sender/recipient addresses against `people.email` and, on a match against any contact in `development_contacts`, writes a `development_email_events` row plus one `development_email_attachments` row per file. Always relationship-scoped. An email surfaces on an opportunity timeline if it has a row in `development_opportunity_email_links` for that opp. Staff can tag/untag inline (`Attach to this opportunity`). | Collapsed: direction-aware left/right email card with route/from-to metadata, subject, and two-line teaser. Expanded: summary is replaced by full headers, full body, and attachments. Attachments render one-per-row as filetype icon + filename + size. |
| **Stage** | Generated by the Kanban drag or the stage dropdown in the opportunity drawer. Writes a `development_stage_events` row. | One line: `from-chip → to-chip · author`. Staff can add a separate note when stage context is needed. |
| **Money** | One row per `development_amounts` insert/update. | One line: `$amount · ask / commit / receive · campaign · author`. For realized receipts, include `received May 15, 2026`. For `receive` rows with `due_on` but no `received_on`, show `expected $amount · due Jun 30`. In-kind receipts can render as `In-kind received · <description>` with optional estimated value. |
| **File** | One row per `development_opportunity_attachments` insert (cycle-specific files). Relationship-level files appear on the relationship timeline. | One line: filetype icon · `Attached <filename> · size`. |
| **Reporting** | One row when `reporting_completed_on` is set on the opportunity. Generates a `development_notes` row with `source='report_completed'`. | One line: `Report submitted · author`. Optional body if the user added one. |
| **Opportunity created / Renewed** | Generated on initial opp creation. When `renewal_of_opportunity_id` is set, the row reads "Renewed from <prior opp name>" with a link to the prior opp. | One line: who created or renewed, optional carry-over note. |

Filter bar at top of Activity: `All · Notes · Email · Stage · Money · Files · Reporting` on opportunity tabs; the all-relationship Activity tab uses `All · Notes · Email · Stage · Money · Files · Opportunity lifecycle`.

#### 6c.iii. "Add a note" form

Scope toggle at the top of the form: `This opportunity (default) | The relationship`. Choosing "The relationship" writes a `development_notes` row with `parent_kind='funder'`; the note appears in the funder activity stream and can be included by opportunity filters as unassociated relationship activity.

Fields:

- **When** — date input (defaults to today), labels-left.
- **What was discussed** — TipTap rich-text editor with toolbar: Bold, Italic, Bullet list, Ordered list, Link. Markdown helpers: `src/lib/tiptap-markdown.js` (`@tiptap/react` per AGENTS.md §"TipTap Editor Pattern"). Stored as both Markdown source (`body_markdown`) and sanitized HTML (`body_html`).
- **Task** — secondary affordance in the note/activity composer. Opens the New task modal. The task inherits the current scope by default (this opp vs the relationship), but can be changed in implementation if needed.
- **Save note** — primary action. Appends to the relevant timeline immediately (optimistic UI per AGENTS.md §"Interaction Speed and Feedback").

#### 6c.iv. Follow-ups — how the data flows

A follow-up is a discrete actionable item:

- Stored in `development_followups` with `parent_kind` + `parent_id`, title, due date, completion fields, and reminder metadata. Owners live in `development_followup_owners`, so a task can have zero, one, or many owners.
- Created from the activity composer `Task` button or an explicit task/follow-up affordance in the opportunity drawer.
- The New task modal collects title, due date, and owners using the shared PeoplePicker/MultiPeoplePicker pattern. The picker can choose the opportunity lead, named supporters, or another person from `people`; it may also be empty when the task is intentionally unassigned.
- Surfaced in four places: (a) the opportunity activity stream, (b) the dashboard Calendar, (c) the staff dashboard KPI strip + Overdue banner, (d) Monday morning Mailgun digest to each task owner.
- In the activity stream, tasks appear in the same date-ordered timeline as every other activity item. Future tasks are not broken into a separate `Upcoming` list; they sort by due date alongside past/current items. Open overdue tasks appear with red overdue treatment. Completed tasks render as completed activity with checkbox checked, completion date, and optional completion note.
- Marking a follow-up done prompts for an optional completion note; that completion note creates a `development_notes` row tagged with `related_followup_id`.

Multiple open follow-ups per opportunity are allowed but uncommon. The band shows the soonest-due; a count chip ("3 open") expands the rest.

#### 6c.v. Support — what they are and where they show up

A **supporter** is an internal E8 person — typically a board member, but also occasionally a staff member or executive director — who is helping move a specific opportunity forward. Examples: a board member who personally knows the program officer at a foundation; an exec who's championing a sponsorship with their network; a member who agreed to make an intro at a specific event.

Cardinality is `0..n`, skewed heavily toward 0 and 1:

- Most opportunities have **zero** supporters. The lead is doing the work themselves.
- A common case is **one** supporter — a single board member who's actively in the loop.
- **More than one** supporter exists but is rare. The UI should accommodate up to three on a tile without wrapping; beyond that, additional supporters collapse to `+N more` on the tile and are listed in full in the opportunity drawer.

Where supporters surface:

- **Kanban tile** (§6a.i): `Support: Kathleen Hebert` line below the ask amount, only when present.
- **Opportunity RecordGrid views** (staff dashboard List): a dedicated `Support` column shows the first supporter's name, with `+N more` for additional.
- **Relationship/opportunity drawer** (§6b): the relationship summary does not show supporters; each opportunity tab shows its own supporters when present. No role tag — the data model doesn't carry one.
- **Board / Dev-Committee dashboard "My Connections" panel** (§6d): when the signed-in board member is the supporter (not just the source of the relationship), the funder appears in their connections list with a `Support` tag.

Distinguishing **supporter** from **lead**:

- The **lead** is the staff member accountable for the opportunity — writes the proposal, sends the follow-up emails, logs notes, pushes the stage forward. There is exactly one per opportunity.
- A **supporter** is a *helper*, not the accountable party. They aren't on the hook for sending emails or hitting deadlines; they're providing access, vouching, or making intros. Tasks and follow-ups are never assigned to supporters by default.

Distinguishing **supporter** from **contact**:

- A **contact** lives on the **funder** (the funder/sponsor side). They are the *external* person at Walton or Microsoft or Patagonia.
- A **supporter** lives on the **opportunity** and is an *internal* E8 person. The two never overlap; the person picker for supporter is restricted to people with a staff or board role.

Notifications:

- Supporters do **not** receive the standard follow-up or reporting reminders the lead gets.
- When stage advances to Proposal, Committed, or Received, all supporters on that opp receive a "good news" Mailgun ping ("Walton Fellowship Grant moved to Committed — thanks for your help") so they feel the impact of their advocacy. Suppressible per-supporter.
- When stage advances to Declined, no supporter notification is sent (the lead decides what to share).

#### 6c.vi. Visual style

Stage colors are a single-hue progression: cool gray for early stages → blue for active stages → emerald for received → neutral gray for declined. Opportunity-type chips have distinct color treatments so a glance at the Kanban reads them out: Grant = teal, Sponsorship = blue, Gift = slate. (The subtype of a sponsorship is *not* shown on the chip; it is shown only in the opportunity drawer details area.) E8 organization chips are visually distinct (`(c)6` = blue, `(c)3` = purple); opportunities tagged to both render both chips. Reporting-due chips: amber within 30 days, red when overdue. People are represented by names and roles; do not render initials-in-circle placeholders in CRM detail content. Use profile photos only when real profile images are available and they improve recognition. Money rows display nature inline: cash rows show the dollar value; in-kind rows show the dollar value plus the `in_kind_description` (e.g. `$750 in-kind · Case of wine, 12 bottles`).

### 6d. Development Committee dashboard (`/committees/development`)

Default landing for board and development-committee members. The page follows the existing committee dashboard pattern: committee title, committee actions, stacked content cards in the main column, and a sticky right column for committee members, meetings, documents, and personal development-work context. Mockup file: `development-committee-dashboard.html`.

Top actions:
- `Log interaction` opens the simplified board-member note form.

KPI strip:
- Raised vs goal.
- Pipeline value.
- Active opportunities.
- Overdue tasks.
- Average gift received.

Main column:
- `Meeting notes` shows the latest committee meeting note with date, title, and concise summary. `View all` opens the full meeting-note archive. `New note` follows the existing committee note pattern.
- `Pipeline` is a read-only Kanban snapshot using the same opportunity stages and chips as the staff dashboard. Cards link to the combined relationship/opportunity drawer in read-only mode.
- `Recent activity` shows meaningful external-facing development events from the last 30 days: new opportunities, commitments, receipts, stage advances, submitted applications, reports submitted, and board-member interactions. It excludes internal drafting noise.
- `Upcoming dates` shows application due dates, decision dates, reporting dates, and follow-up tasks. Entries link to the relevant opportunity.

Right column:
- `Members` uses the existing committee member tile pattern and contact action.
- `Upcoming meetings` uses the existing committee meetings tile pattern with links to meeting detail and past recordings.
- `My connections` shows relationships and opportunities where the signed-in committee member is a supporter, source / warm intro, or has logged a development note. Each row shows relationship name, active opportunity stage, amount context, and urgent state such as overdue follow-up.
- `Documents` lists committee-level documents and selected relationship / opportunity documents. Search covers all documents visible to this committee role.

Documents:
- Google Drive remains the backing store. Under `PORTAL_STORAGE_DRIVE_FOLDER_ID`, create `Development/Development Committee` for committee-level material.
- Relationship and opportunity documents continue to live in their relationship/opportunity folders under `Development`.
- The committee Documents tile can surface committee documents plus shortcuts into relationship/opportunity document folders.
- If a committee member adds a file to a relationship or opportunity folder from this dashboard, that file appears in the corresponding relationship/opportunity Documents panel because both views read from the same Drive folder.

Log interaction modal:
- Fields: relationship/opportunity, date, channel, summary, next step.
- Summary is capped at 500 characters.
- Notes are stored with `source='manual_board'`.
- The lead receives a Mailgun notification. If the interaction is scoped to an opportunity, notify the opportunity lead; otherwise notify the relationship lead.

Permissions:
- Board and development-committee roles hold `admin.development.read` plus permission to create board interaction notes.
- Opportunity fields, stages, amounts, receipts, documents created by staff, and task completion state are read-only unless the user also has staff/admin development permissions.

### 6e. Mobile layout

Kanban collapses to a "swipe between stages" carousel with one stage visible at a time and a stage-picker chip row. KPI strip becomes a 2×3 grid. The collapsible filter rail moves above the main pane as a collapsible accordion. The relationship/opportunity drawer stacks the relationship summary, opportunity tabs, opportunity details, and activity vertically. Editing affordances on mobile match desktop.

### 6e.i. Product copy standard

UI copy should be terse and functional. Use labels, values, section titles, and action names rather than explanatory helper text. Do not add microcopy that explains obvious controls or repeats the purpose of a field or section. Helper text belongs only where the user needs a constraint, format, consequence, or non-obvious distinction to make the right choice.

### 6f. New Opportunity wizard

Triggered by the **`+ New opportunity`** button on the staff dashboard or opportunity Kanban, and by the compact **`+`** opportunity tab in the relationship/opportunity drawer. The dashboard entry starts at Step 1. The drawer entry opens the same wizard with that relationship already selected and starts at Step 2. Modal, centered, max-w-3xl, labels-left layout per AGENTS.md §"Form Layout". Escape and click-on-overlay close.

#### Step 1 — Relationship

Ask whether the opportunity belongs to an existing relationship or requires a new relationship first.

**Existing relationship path:**
- Search input over `development_funders`.
- Typing opens a dropdown of matching funders with name and funder type.
- Selecting a funder pins it for the remainder of the wizard.

**New funder path:**
- Funder name, required.
- Funder type, required: Foundation / Corporate / Individual / Government.
- Funder description, optional multi-line plain text. Stores into `development_funders.notes_freeform`.

**Contacts:**
- Step 1 includes a compact Contacts area and a `+ Add contact` action.
- `+ Add contact` opens a small modal with: name, email, title, phone, LinkedIn URL.
- Contact modal labels are left of the inputs on desktop.
- Only name is required. Email is encouraged but not blocking.
- The user can add one or more contacts before continuing. New contacts create `people` rows and `development_contacts` links in the same transaction as the funder/opportunity creation when needed.

#### Step 2 — Opportunity shape

Collect the structural fields that determine the rest of the wizard.

| Field | Input | Notes |
|---|---|---|
| Opportunity name | Text | Required. Suggested format should include funder/program/year when useful. |
| Type | Compact choice: Grant / Sponsorship / Gift | Required. Drives type-specific fields in Step 3. |
| Sponsorship subtype | Segmented control: Annual / Event / Other | Optional. Visible only when Type = Sponsorship. |
| Event | Free text | Optional. Visible only when Type = Sponsorship and subtype = Event. Examples: `Portland Sip and Share`, `E8 Summit`, `Cleantech Open reception`. Stores in `development_opportunities.event_name`. |
| E8 organization | Compact choice: E8 Angels / E8 Impact / Both | Required. Asked here because it belongs with the opportunity's structure, not the durable relationship. Defaults to the most recent E8 organization used for this funder, falling back to 501c6. |
| Opportunity lead | Person picker, staff only | Defaults to current user. Exactly one lead per opportunity. |

Every opportunity created through the wizard starts in `Prospect`. Stage changes happen after creation through the Kanban drag or opportunity detail stage dropdown.

Do not ask for relationship Source in the visible wizard flow. Source remains available in the edit-details modal and import tooling.

#### Step 3 — Ask, description, and dates

Collect the working details the development team needs before opening the opportunity page.

**Ask editor.**
- The ask is required and supports both cash and in-kind components.
- The editor starts with one cash line and allows additional cash or in-kind lines.
- A cash line has a currency amount.
- An in-kind line has a required single-line description and an optional estimated cash value.
- Submission writes one `development_amounts` row per component, all with `kind='ask'`.
- The subtotal helper includes the estimated cash value when present and separates cash from in-kind.

**Description.**
- Required enough to orient the work, but may be brief.
- Uses the same lightweight TipTap pattern as notes: Bold, Italic, Bullet list, Ordered list, Link. Toolbar buttons use Lucide icons only; do not use text labels such as "Bulleted list" or "Numbered list" in the toolbar.
- Stores Markdown source and sanitized HTML. This becomes `development_opportunities.notes_freeform`.

**Dates and URL.**
- Website URL is optional for all opportunity types. For grants and applications it may be the application or program information page; for sponsorships it may be a sponsorship package or event page; for gifts it may be a donor or campaign reference page.
- Application due date is optional and shown for Grant and Sponsorship only.
- Decision expected date is optional and shown for all opportunity types, including Gift.
- Sponsorship term start/end are optional and shown for Sponsorship only.
- Grant-only options: Restricted grant and Reporting required. Checking Restricted grant reveals `restriction_notes`. Checking Reporting required reveals `reporting_due_on`.

#### Step 4 — Review and create

Show a compact review before creation:
- Funder name and type.
- Primary contact, if any.
- Opportunity name, type/subtype, E8 organization, initial stage, lead.
- Ask summary, including cash and in-kind components.
- Key dates and URL when present.

Actions:
- **Back** — returns to prior step without losing entered values.
- **Cancel** — closes without saving.
- **Create & open** — writes the relationship, contacts, opportunity, ask components, and initial activity events in one transaction; then opens the relationship/opportunity drawer with the new opportunity tab selected. On failure, show an inline error and leave the wizard open. Use the single-flight save pattern per AGENTS.md §"Async Save / Toast Single-Flight".

### 6g. Editing an existing funder or opportunity

Editing happens directly on the relevant detail page — no separate "edit mode" route. Patterns:

**Relationship drawer (§6b):**
- Inline edit on the About row (`development_funders.notes_freeform`).
- Contacts are managed from the Contacts panel header (`+ New`) and contact rows remain clean: name, optional primary chip, title, and email address link.
- Source is stored when available but is not shown as a prominent visible fact on the detail surface.
- Durable attachments are managed from the Files panel.

**Opportunity tab (§6b):**
- Inline edit on the About row (`development_opportunities.notes_freeform`).
- Inline-editable facts: Campaign, Amount components, Committed, Received, Application deadline, Decision expected, Term start/end, Application URL, Source, Fiscal year. Hover reveals pencil; click activates the matching control; Save on blur or Return.
- Per-row affordances on Money / Attachments.
- The opportunity panel pencil reveals inline controls for Name, Type, Subtype (when Type=Sponsorship), E8 organization, Campaign, Restricted + notes, Reporting required + due, and Renewal of. Routine edits do not use a full edit dialog.
- The stage dropdown in the opportunity tab is the only in-page stage-change affordance and writes `development_stage_events` without a modal.

**Renewal:**
- `Clone for next cycle` button on opportunity detail (visible when stage is Received or Declined). Opens the New Opportunity wizard pre-populated from this opportunity, with `renewal_of_opportunity_id` set and stage defaulting to Prospect. Term dates shift by one period (default 1 year) and the user adjusts before submitting.

**Permission gate:** all editing surfaces require `admin.development.write`. Without it pages render as read-only (same gate the board / dev-committee dashboard uses).

## 7. Notifications, reminders, and email ingest

- **Follow-up reminders** — Mailgun, sent on the morning a follow-up is due (Pacific). Idempotency via `development_followups.reminder_sent_at`. Templated through `email_template_versions` so Karin can edit copy without a deploy. Cron: a new entry in the existing dispatcher (`lib/recurring-emails/dispatcher.js`).
- **Reporting-due reminders** — Mailgun, sent to the primary opportunity lead at T-30 and T-7 days before `reporting_due_on`, and on the due date itself if `reporting_completed_on` is still null. Idempotency via per-opp `reporting_reminder_sent_at` tracker (separate table or denorm column; defer choice).
- **Board-logged-note alert** — Mailgun, sent immediately when a board member submits "Log my interaction". Recipient is the lead (opp lead if scoped to opp; funder lead if scoped to funder). Subject: "[Board] {Board Member} logged a note on {Funder}".
- **Overdue summary** — Mailgun digest to each staff lead Monday morning listing their overdue follow-ups (across opps + funders they own).
- **Outbound staff-sent email** — Gmail OAuth via `lib/email-sender.js`, identical wiring to entrepreneur messaging. The contact email affordance opens the same compose flow used elsewhere.
- **Email auto-ingest into the Activity timeline** — Google Pub/Sub pushes each new Gmail message to the portal webhook (the existing webhook used elsewhere; extend it with a development matcher if not already present). On each delivery the webhook resolves all sender/recipient addresses against `people.email` and checks for membership in `development_contacts`. On a match it writes a `development_email_events` row (idempotent on `gmail_message_id`) plus one `development_email_attachments` row per attachment, all scoped to the matched funder. Opportunity tagging is manual (an `Attach to opportunity` action on the email card) for v1; subject-line heuristics can be added later. SWR invalidation: tag `development`.

## 8. Data-query data loading reference

Source: `uploads/E8 Master Sponsor List.xlsx`.

There is no separate spreadsheet importer in v1. When test or migrated data is loaded through governed data-query write support, use this mapping so spreadsheet rows become one funder + one or more opportunities:

1. **Funder row** — Sponsor / Org Name + Sponsor Type + Source → `development_funders`. Matching gift eligibility lands on the funder.
2. **Annual giving columns** (`2023 Actual`, `2024 Actual`, `2025 Actual`, `2026 Goal`, `2026 Actual`) — each nonzero amount becomes an **opportunity** for that fiscal year. `type` inferred from funder type (Foundation → `grant`; Corporate → `sponsorship`/`annual`; Individual → `gift`). `stage` derived: realized actuals → `received`; 2026 Goal (no actual yet) → stage from the Stage column. `development_amounts` rows: a `commit` row and a `receive` row per realized year (default `nature='cash'`); an `ask` row for 2026.
3. **Ask Range** — parsed midpoint (or floor for "$X+"), stored as a `development_amounts` row with `kind='ask'`, `nature='cash'` on the 2026 (current FY) opportunity; original string in `note`.
4. **Stage** column — applied to the current-FY opportunity, not the funder.
5. **Foundation Prospects sheet** — one funder per foundation (`funder_type='foundation'`) + one opportunity per active pursuit (`type='grant'`, stage from Outreach Status). Focus area tags into `notes_freeform` on the funder. Grant deadlines into the opportunity's `application_deadline`.
6. **Email Activity Log sheet** — one `development_notes` row per entry. Default `parent_kind='funder'` since spreadsheet entries don't reliably map to a specific cycle; the data-loading prompt can attempt opp matching when the entry text contains a year that matches an FY opportunity. `occurred_at` from Date, `body_markdown` from Subject/Summary, author resolved by matching staff name to `people.email` (default to `legacy-import@e8angels` placeholder if not resolvable).
7. **Multi-value contact / email cells** — split into separate `people` rows and link via `development_contacts`. First listed becomes `is_primary=1`.
8. **Multi-assignee cells** — collapse to a single lead: the first listed name becomes `development_funders.lead_person_record_id` (and is inherited as the current-FY opportunity's `lead_person_record_id`). Any additional names from the same cell are imported into `development_opportunity_supporters` on the current-FY opportunity so the relationship isn't lost — Karin reviews via the dry-run CSV and can promote one to lead if the import picked the wrong primary.
9. **Mixed-format dates** — `Last Communication` and `Email Activity Log` columns mix `"2026-05-01"`, `"2024"`, `"Jan 2026"`. Parse to YMD where possible; store original string in the note body where not.
10. **Section headers** — sheets use merged-cell section dividers ("CONFIRMED 2026 SPONSORS", "HOT/WARM/COLD PROSPECTS"). Use the Stage column as truth; section text breaks ties only when Stage is blank.
11. **Dedup** — funders appearing on multiple sheets (e.g. Starbucks in Prospects + Email Log) collapse to one funder. Match on normalized name; ask before merging anything ambiguous.

Migration is scripted as `scripts/import-development-history.js` with `--env=prod` support per AGENTS.md, and dry-run by default. Output a CSV of decisions for Karin to review before the real run.

## 9. Phased rollout

Work is executed sequentially. The Development CRM is released to the team only after Phase 6 is complete.

### Phase 1 — Foundation
- Migration SQL + `createTables()` updates for all `development_*` tables
- Role + permission additions (incl. `DevelopmentManager`, role-tag rules)
- Glossary updates
- Empty `/admin/development` and `/board/development` shells gated on the new resources

### Phase 2 — Core CRUD
- Relationship + opportunity list/detail surfaces
- Stage Kanban on opportunities with drag-to-advance, optimistic DOM updates, and no stage-change prompt
- Conversation log (polymorphic) + attachments (relationship + opportunity scopes)
- Lead + primary contact assignment
- Inline editing of all required fields
- Mobile responsive pass

### Phase 3 — Money + goals
- `development_amounts` UI on opportunity detail (ask / commit / receive with due/received dates)
- Campaigns + per-E8-organization goals admin
- KPI strip on staff dashboard, including E8 organization toggle

### Phase 4 — Follow-ups + reminders
- `development_followups` CRUD (polymorphic)
- Mailgun reminders (per-follow-up + Monday digest + reporting-due reminders)
- Overdue widget + explicit follow-up/task creation
- Auto role-tag recompute helper + nightly cron

### Phase 5 — Board dashboard
- `/board/development` read-only view
- "My Connections" panel (funder-level)
- Recent activity feed (opportunity-aware)
- "Log my interaction" form + lead notification
- Calendar month/week/table views for deadlines, reports, and tasks

### Phase 6 — Import + cleanup
- `scripts/import-development-history.js` dry run
- Dry-run review pass on dedup decisions
- Real import
- `scripts/backfill-development-role-tags.js`
- CSV export from filtered list

## 10. V1 Boundaries

- **Lead-change audit trail.** v1 records lead changes as auto-generated `development_notes` rows (`source='lead_changed'`) rather than a dedicated `development_lead assignment_events` table.
- **Spreadsheet dedup.** Some funders may genuinely be different relationships under the same brand (Starbucks Corporate vs Starbucks Foundation). The import script flags ambiguous matches rather than auto-merging them.
- **E8 organization assignment for imported opportunities.** Rows without E8 organization data default to `501c6` (E8 Angels) unless the dry-run review changes them before import.
- **Glossary load lag.** The data-query skill caches the glossary per session; staff who already have a session open at deploy time need to restart the skill before the new tables appear in data-query answers.
- **Multi-installment pledge UX.** v1 stores a pledge as one commit row plus multiple receive rows, each with `due_on`. It does not include a dedicated pledge-schedule table.
- **Sponsorship benefits package.** Corporate sponsorship benefits such as logo placement, event tickets, naming rights, and recognition details are stored as free text in `development_opportunities.notes_freeform`.
- **Email-to-opportunity matching.** v1 ingests emails funder-scoped only. Staff tag specific emails to opportunities manually.
- **Grant vs sponsorship terminology.** The system distinguishes grants, sponsorships, and gifts through the `type` enum, sponsorship `subtype`, and the conditional fields those values control: deadlines/reporting for grants; term dates and subtype for sponsorships.
