---
title: Sponsor CRM
status: draft
owner: jordan
created: 2026-05-16
last_updated: 2026-05-21
home: staff-dashboard.html
---

# Sponsor CRM Plan

Status: draft for review
Prepared for: Karin (Development), Jordan
Last updated: 2026-05-21

## Mockup files in this folder

- **`staff-dashboard.html`** (home) — the development team's working surface (Kanban + List + Grant calendar).
- **`sponsor-detail.html`** — one sponsor's record on a single page.
- **`board-dashboard.html`** — read-only dashboard for board / development committee members.
- **`impact-report.html`** — the impact report (§6d).

## 1. Purpose

Karin's brief (`uploads/Sponsor CRM Brief for Jordan.docx.md`) describes a lightweight CRM the development team can use without leaving the portal: track every sponsor and prospect, log conversations, manage follow-ups, and visualize pipeline progress against fundraising goals. This plan adapts that brief to the existing portal so we reuse the people table, role/permission system, notification stack, and notes/attachments patterns instead of building parallel infrastructure. It also folds in two pieces of context Karin did not have: E8 is spinning up a 501(c)(3) sibling (E8 Impact) alongside the existing 501(c)(6), and we have an existing master sponsor spreadsheet to migrate.

## 2. Decisions on the open questions from §10 of the brief

- **Data storage** — same Turso database as the rest of the portal. New tables, no separate schema. All SQL goes through `CacheManager` per AGENTS.md §"Database Query Centralization".
- **Auth / SSO** — same portal login. Admins managed exactly like other staff (`auth_admins`).
- **Mobile** — mobile-responsive from v1. Cheaper than retrofitting later.
- **Notifications** — system alerts and follow-up reminders via Mailgun (`lib/mailgun.js`). Outbound emails Karin or another staff member sends *as themselves* to a sponsor use Google OAuth (`lib/email-sender.js`), same path entrepreneur messages use today.
- **Goal tracking** — track by campaign/program. Annual rollup is a derived view.
- **Entity reporting** — track separately per entity AND together. Every sponsor record carries `entity` (`501c6`, `501c3`, or `both`); goals are per-entity per-campaign; dashboards have an entity toggle (E8 Angels / E8 Impact / All).
- **Board notifications** — the portal is the canonical surface; the dev committee has a board view (§6c).
- **Board onboarding** — already handled. Board members are in the portal; we use the existing `BoardMember` role.
- **Historical data** — import the master spreadsheet (see §8). This is in scope for v1.

## 3. Sponsor record data model

The portal stores sponsor data using its existing normalized patterns:

- Contact names → existing `people` table. A sponsor has many contacts via a junction (`sponsor_contacts`). Contacts get a new role string in `people.roles` so they surface correctly in the directory.
- Conversation log → `sponsor_notes`, mirror of `committee_notes` / `company_notes`, append-only, 10-minute edit window enforced at the route layer. Note bodies are rich text (TipTap-edited; stored as both Markdown source and rendered sanitized HTML, per the existing portal pattern in `src/lib/tiptap-markdown.js`). Actionable next steps live in `sponsor_followups`, not as free-text fields on notes.
- Inbound and outbound email correspondence with sponsor contacts → automatically ingested by the existing `e8.logger` system (the same daemon that captures staff Gmail traffic for the entrepreneur pipeline today). See §7.
- Attachments → mirror of `company_note_attachments` (BLOB-stored, FK to note).
- Stage timeline → event-sourced (`sponsor_stage_events`) just like `entrepreneur_application_change_log` and `committee_membership_events`. Current stage is denormalized on the parent row for fast filtering but the timeline is the source of truth.
- Assigned To → multiple staff supported (a recurring shape in the master spreadsheet). Modeled as `sponsor_owners` (junction, person → sponsor with `is_primary`).

Two board-facing surfaces split this responsibility: the read-only board dashboard (§6c) for in-the-moment review, and a separate shareable impact document (§6d) exportable to PDF.

## 4. Data model

All new tables. SQL ships in `scripts/migrate-add-sponsor-crm.sql`; `createTables()` in `lib/cache-manager.js` updated for new environments; **never** auto-migrated at startup (AGENTS.md §"DB Schema Changes").

### 4.1 New role strings (add to `people.roles`)

- `Sponsor Contact` — current contact at an existing/active sponsor
- `Sponsor Prospect Contact` — contact at a not-yet-committed prospect
- `Development Committee` — board sub-committee with read-only board dashboard

The first two are person-level role tags so contacts show up in the directory and search; they say nothing about login or permissions. `Development Committee` follows the existing committee pattern (new row in `committees`, `committee_memberships` rows, derived `DevelopmentCommittee` canonical role via `lib/auth.js:724-733`). Add all three to the role taxonomy section of `docs/data-query-glossary.md` per AGENTS.md §"Data-Query Glossary".

### 4.2 New canonical permission role

- `SponsorManager` — derived from a new `auth_admins.type = 'sponsor_manager'` value, mapped in `typeToRole` (`lib/auth.js:703-712`). Karin is the first holder. This is the staff "Admin / Development" role from Karin's §7.

The `Team Member` role from Karin's §7 resolves to any logged-in staff (`SiteAdmin`, `ExecutiveDirector`, `MembershipManager`, etc.) via session roles. Board read-only access uses existing `BoardMember` plus the new `DevelopmentCommittee`. Permissions are bound by adding rows to `resource_permission_roles` keyed to new resource keys (see §5).

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
-- 'source' identifies how the note was created so the UI can render it correctly
-- and the board feed can scope to non-internal notes.
CREATE TABLE sponsor_notes (
  id TEXT PRIMARY KEY,                                  -- spnn_<hex>
  sponsor_id TEXT NOT NULL,
  author_person_record_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN
    ('manual',                  -- staff entered via Activity quick-add
     'manual_board',            -- board member entered via "Log my interaction"
     'email_ingest',            -- auto-pulled by e8.logger; see sponsor_email_events
     'stage_change')),          -- attached to a stage transition
  occurred_at TEXT NOT NULL,                            -- when the interaction happened (not when entered)
  body_markdown TEXT NOT NULL,                          -- TipTap source of truth
  body_html TEXT NOT NULL,                              -- sanitized for render; rebuilt from body_markdown on save
  related_stage_event_id TEXT,                          -- FK -> sponsor_stage_events.id when source='stage_change'
  related_email_event_id TEXT,                          -- FK -> sponsor_email_events.id when source='email_ingest'
  is_internal INTEGER NOT NULL DEFAULT 0,               -- when 1, item is staff-only
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0                 -- admin-only; surfaces in audit
);
CREATE INDEX idx_sponsor_notes_sponsor ON sponsor_notes(sponsor_id, occurred_at);

-- Email events ingested from e8.logger. One row per logged email between
-- a staff member and one or more contacts at this sponsor. Idempotent on
-- gmail_message_id so re-runs don't duplicate.
CREATE TABLE sponsor_email_events (
  id TEXT PRIMARY KEY,                                  -- spne_<hex>
  sponsor_id TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL UNIQUE,                -- Gmail Message-ID header
  thread_id TEXT,                                       -- Gmail thread for grouping related events
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_person_record_id TEXT,                           -- staff side if outbound, contact side if inbound
  to_person_record_ids TEXT,                            -- JSON array of person_record_ids
  subject TEXT,
  snippet TEXT,                                         -- first ~200 chars for timeline preview
  occurred_at TEXT NOT NULL,                            -- email date
  has_attachments INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sponsor_email_events_sponsor ON sponsor_email_events(sponsor_id, occurred_at);

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

-- Recent-activity feed (board dashboard, §6c). Pre-materialized for cheap reads.
-- Built by an SWR getter; stores recent items (30 days, hard-cap 500).
CREATE TABLE sponsor_activity_feed (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN
    ('new_prospect','stage_advanced','commitment','gift_received','note_added')),
  occurred_at TEXT NOT NULL,
  amount_cents INTEGER,
  summary TEXT NOT NULL,
  actor_person_record_id TEXT,
  is_internal INTEGER NOT NULL DEFAULT 0                -- when 1, item is staff-only
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

Karin's three roles map cleanly onto this:
- **Admin / Development** → `SponsorManager`
- **Team Member** → any other staff (resolved via session roles)
- **Board Member / Dev Committee** → `BoardMember` (already exists) plus `DevelopmentCommittee` (new)

## 6. UI surfaces

All views mobile-responsive from day one (single-column collapse at narrow widths, Kanban becomes horizontally scrollable list).

### 6a. Staff dashboard (`/admin/sponsors`)

Layout, top to bottom:

1. **KPI strip** (5 cards): Received YTD vs. campaign goal (progress bar), Pipeline value (sum of asks in stages 2–5), Active prospects (count in stages 2–4), Overdue follow-ups (red if > 0), Avg gift size (received only). KPIs respond to the entity filter.
2. **Workspace** — a two-column flex layout: left rail + main pane, separated by a draggable resize handle. The pattern mirrors `docs/mockups/companies-admin-redesign/variant-a-list.html`: width is persisted in `localStorage` under `e8.sponsors.filterRailWidth`; min 200px, max 560px; default 280px. Drag the handle past 160px to collapse; collapsed state persists under `e8.sponsors.filterRailOpen`. Collapsed, the rail becomes a thin vertical "Filters" button against the left edge that re-expands on click.

#### Left rail contents (top to bottom):

- **Collapse caret** at the top-right of the rail (`‹`) — also collapses to the thin button.
- **Search** — single text input that matches sponsor name, contact name, and free-text notes. Live filter (the dataset is small enough to skip debounce).
- **Entity** — segmented control: `All / 501c6 / 501c3`. Selection drives both KPIs and the listing.
- **Sponsor type** — checkbox group with counts.
- **Pipeline stage** — checkbox group with stage chips and counts.
- **Assigned to** — checkbox group with staff avatars and counts.
- **Follow-up** — checkbox group: Overdue / Due in 7 days / None scheduled.

#### Main pane:

- **Toolbar row**: `<result count>` left-aligned; right-aligned cluster of `Kanban / List / Grant calendar` view-mode toggle, then a divider, then **`+ New sponsor`** (primary blue), `Export CSV`, `Snapshot PDF` (desktop only).
- **Overdue banner** — appears below the toolbar when overdue count > 0.
- **View body**: Kanban / List / Grant calendar. Kanban columns = 7 pipeline stages. Each Kanban card is a four-band tile (see §6a.i below). **The entire card is a single clickable anchor** to the sponsor detail page. Drag a card to advance stage; a modal prompts for a note. In the List view the **entire row** navigates to the detail page on click. The Grant calendar shows the next 60 days of foundation grant deadlines.

#### 6a.i. Kanban tile layout

Each card has four horizontal bands, top to bottom:

1. **Header band** (slate-100 fill, hairline below) — sponsor-type chip and entity tag(s) on the left, the primary owner's initials avatar pinned to the right. When the sponsor's entity is `both` the band renders both `(c)6` and `(c)3` tags side by side rather than a single "both" label, so the same scan works whether the user filters by entity or not.
2. **Entity name** — 14px semibold, the strongest text on the card.
3. **Contact line** — 12px slate. Comma-separated when there are multiple primary contacts; rendered as muted italic `No contact yet` when empty (common for `Prospect`-stage rows).
4. **Ask amount** — 16px semibold tabular numerals, full-dollar format (`$75,000`, no compact `k` suffix). Typical asks sit in the `$5,000`–`$100,000` range; the body has room for higher figures.

Below the body, a hairline separator and a **follow-up footer**: `Follow-up: May 26`, with the date colored amber when due within seven days, red and tagged `· overdue` when past due, and a muted `none scheduled` when no follow-up exists. Date format is short month + numeric day.

The `+ New sponsor` button opens the dialog described in §6f.

### 6b. Sponsor detail (`/admin/sponsors/:id`)

The detail page is one scrollable layout inside a single `max-w-5xl` column. Karin runs the development function herself with a working set of roughly 20–30 active relationships at any time — she already knows the key facts of each sponsor in her head. The page exists to (a) tell her instantly where things stand with this sponsor and what action is owed, (b) let her drop a note about a new touchpoint, and (c) let her quickly retrieve a specific past artifact (an email, an attachment) when she needs to.

Layout, top to bottom:

1. **Slim sticky header** — back link to All sponsors, then `Send email` / `Archive` / current-user avatar on the right.
2. **Identity + status card** (white, single bordered block) carrying:
   - Row 1: name, type chip, entity chip — on the left; **Stage chip + Advance button** on the right.
   - Row 2: owner avatars with primary marker and a "+ owner" link.
   - Row 3 (full-width amber band): **the open follow-up** with "Mark done" / "Edit" / "+ another" inline actions. When there is no follow-up, this row becomes a single "+ Set follow-up" affordance. When overdue, the band is red.
   - Row 4 (facts strip): inline `Campaign · Ask · Committed · Received · Grant deadline · Source`, each label small-caps and the value tabular. Flex-wraps naturally on narrow widths.
   - Row 5 (about): sponsor-level freeform observations ("Climate justice focus area. Multi-year roadmap requested. Prefers single annual gift over installments."). Editable on click. This is the only durable freeform field on the sponsor; conversation-level free text lives in `sponsor_notes`.
3. **3-column reference strip** (Contacts / Money / Attachments). Each card has the same header pattern (label, count, `+ Add` link), each card sits in its own border. The Money card also shows a 3-cell `Asked / Committed / Received` totals strip at the bottom. The cards are deliberately compact — most sponsors have 1–2 contacts and 1 money row. On mobile (`<md`) the three cards stack.
4. **Add a note** form — TipTap editor with toolbar (Bold / Italic / Bullet / Ordered / Link-with-custom-modal), date input top-right, `+ Add follow-up` and `Save note` at the bottom. See §6b.ii.
5. **Activity feed** — the chronological timeline. Filter chips (`All · Notes · Email · Stage · Money · Files`) on the right of the section header. Compact rail with colored dots indicating event kind. See §6b.i for the event provenance table.

Stage changes prompt a note (Karin's §4a requirement); the prompt is the same modal used on the staff Kanban.

#### 6b.i. Activity feed — event provenance

The Activity feed is the relationship's source-of-truth chronological log (the bottom section of the detail page). Every item corresponds to a real event in one of the underlying tables. Six event kinds, each with a specific source:

| Kind | Source / how it's created | What's shown in the timeline |
|---|---|---|
| **Note** | Staff member uses the "Add a note" form (`source='manual'`), or a board member uses "Log my interaction" from the board dashboard / sponsor detail page (`source='manual_board'`). | Date · author · rich-text body. A bare "Edit" link is shown to the author for 10 minutes after creation, then disappears. Board-logged notes are tagged "Note · Board" and trigger a Mailgun alert to the primary owner. |
| **Email** | Auto-ingested by the existing `e8.logger` daemon. Whenever a logged Gmail message has a `From` or `To` address matching any `people.email` of a contact in `sponsor_contacts`, a `sponsor_email_events` row is written and rendered as a timeline entry. Idempotent on Gmail `Message-ID`. | Date · direction (Jordan → Taylor or Taylor → Jordan) · subject · ~200-char snippet · attachment count if any. The snippet is the preview; full body expands inline on click (renders sanitized HTML from the stored message body). |
| **Stage** | Generated by the Kanban drag, the "Advance" button, or the change-stage modal. Writes a `sponsor_stage_events` row. An optional note attached at change-time creates a paired `sponsor_notes` row with `source='stage_change'`. | One line: `from-chip → to-chip · author`. If a note was attached, its body renders inline beneath the chips on the same item. |
| **Money** | Generated when a `sponsor_amounts` row is created (via `+ Entry` in the Money card). One timeline entry per row. | One line: `$amount` · `ask` / `commit` / `receive` / `in-kind` · campaign · author. |
| **File** | Generated when a `sponsor_attachments` row is created (via `+ Upload` in the Attachments card). | One line: `Attached <filename> · size`. |
| **Sponsor created / owner change** | Generated on initial creation (`sponsor_owners` first write) and on subsequent `sponsor_owners` edits. | One line: who created or reassigned. |

Filter bar at top of Activity: `All · Notes · Email · Stage · Money · Files`. Active filter dims everything else; selecting "All" returns to the interleaved view. Newest first by default; date-grouped sub-headings ("Yesterday", "Last week", "Earlier this month") appear when there are 30+ entries.

#### 6b.ii. "Add a note" form

The note form sits directly above the Activity feed on the detail page (between the 3-column reference strip and the chronological timeline). Fields:

- **When** — date input (defaults to today), labels-left.
- **What was discussed** — **TipTap rich-text editor** with toolbar: Bold, Italic, Bullet list, Ordered list, Link. The Link button opens a styled modal (URL + optional link text). Editor body has room to write a full meeting summary — minimum ~120px tall, grows with content. Reference implementation: `src/components/application-review/EditableMarkdownField.jsx`. Markdown helpers: `src/lib/tiptap-markdown.js` (`@tiptap/react` per AGENTS.md §"TipTap Editor Pattern"). Stored as both Markdown source (`body_markdown`) and sanitized HTML (`body_html`).
- **+ Add follow-up** — secondary affordance below the editor. Optional. Revealing it expands an inline row with `Due` (date), `Assignee` (defaults to the current user), and `Reminder note` (free text). Saving the note also creates the follow-up.
- **Save note** — primary action. Appends to timeline immediately (optimistic UI per AGENTS.md §"Interaction Speed and Feedback"); reconcile/rollback on failure.

#### 6b.iii. Follow-ups — how the data flows

A follow-up is a discrete actionable item:

- Stored in `sponsor_followups`: assignee (a staff person), due date (YYYY-MM-DD Pacific), reminder text.
- Created from three places: the inline "+ Add follow-up" in the note form, an explicit "Set follow-up" button in the sponsor detail header, or auto-suggested by the stage-change modal (per-stage default offset configurable in admin).
- Surfaced in two places: (a) the amber follow-up band inside the sponsor detail page's identity block (turns red when overdue), (b) the staff dashboard KPI strip + Overdue banner.
- Marking a follow-up done prompts for an optional **completion note**. That completion note creates a normal `sponsor_notes` row tagged with `related_followup_id`, so the timeline shows: "Note (author) — completed follow-up: ‹reminder text›".

Multiple open follow-ups per sponsor are allowed but uncommon. The banner shows the soonest-due; a count chip ("3 open") expands the rest.

#### 6b.iv. Visual style

Stage colors are a single-hue progression: cool gray for early stages → blue for active stages → emerald for received → neutral gray for declined. Sponsor-type chips are a single neutral chip (`type-chip`) with the type label in text. Entity chips are visually distinct (`(c)6` = blue, `(c)3` = purple) since filtering by entity is a frequent action; sponsors tagged to both entities render both chips rather than a "both" label. Timeline event kind is conveyed by the colored dot on the rail and a small uppercase label.

### 6c. Board / Development Committee dashboard (`/board/sponsors`)

Default landing for board and dev-committee members. Read-only. The layout mirrors the staff dashboard so the two pages feel like the same product: KPI strip at the top, then a workspace with the same collapsible/resizable filter rail on the left and the main content on the right.

**Left rail (identical pattern to §6a):** collapse caret · Search · Entity segmented control (`All / 501c6 / 501c3`) · Sponsor type · Pipeline stage · Owner. Resize handle and collapse state use `localStorage` keys `e8.sponsors.board.filterRailWidth` and `e8.sponsors.board.filterRailOpen` so the board user's rail width is independent from the staff user's.

**Toolbar row**: `Board view · read-only` on the left; right-aligned cluster of `Log my interaction` (primary blue) and `Export board report`. The board page is a single overview surface.

**Main content** below the toolbar is a two-column grid (collapses to one column below `xl`):
- **Left column (1fr):** stacked sections — `Pipeline` (read-only Kanban; clicking a card opens the sponsor detail in read-only mode), `Recent activity · last 30 days` (clean copy like "Acme Corp committed $10,000"; the feed shows commitments, gifts received, new prospects, and stage advances on non-internal records), `Foundation grant deadlines · next 60 days`.
- **Right column (320px, sticky):** `My Connections` — sponsors where this board member is listed as the `source` or has logged a note. Each row shows the sponsor name, entity chip, the **primary contact's name** (the person the board member knows), stage chip, ask amount, and either "Overdue follow-up" (red) or "Last activity ‹N›d ago". Click any row to open the sponsor detail page.

**Log my interaction modal** — opens a simplified note form (date, ≤500-char summary, optional outcome / next step). Submitted note appears in the sponsor's activity tagged "Note · Board"; the primary owner receives a Mailgun notification (§7).

The board / dev-committee roles hold `admin.sponsors.read` only; the page renders read-only and the Kanban stage-drag is disabled.

### 6d. Impact report (`/admin/sponsors/impact`)

A standalone shareable document. A single page suitable for sending to existing and prospective sponsors. Sections: who we are, who's already supporting us, anonymized impact stats from the broader portal (cohort outcomes, deployments, etc.), this year's goal vs progress. Renders as HTML; exported to PDF via the existing PDF skill / a print stylesheet. The "Snapshot PDF" button on the staff dashboard is a print-stylesheet export of the dashboard itself.

### 6e. Mobile layout

Kanban collapses to a "swipe between stages" carousel with one stage visible at a time and a stage-picker chip row. KPI strip becomes a 2×2 grid. The collapsible filter rail moves above the main pane as a collapsible accordion. The detail page's 3-column reference strip stacks vertically. Editing affordances on mobile match desktop.

### 6f. New Sponsor dialog

Triggered by the **"New sponsor"** button in the staff dashboard header. Modal, centered, max-w-lg, labels-left layout per AGENTS.md §"Form Layout". Escape and click-on-overlay close.

**Required fields** (visible by default):

| Field | Input | Notes |
|---|---|---|
| Type | 4-button segmented control: Corporate / Foundation / Individual / In-kind | Drives which optional fields appear. Defaults to Corporate (most common per the master spreadsheet). |
| Name | Text | Org or individual name. Autofocused on open. |
| Entity | 3-button segmented control: E8 Angels (501c6) / E8 Impact (501c3) / Both | Required. Defaults to 501c6. |
| Stage | Select, six options (Prospect → Received) | Defaults to "Prospect". Declined is reached via the move-stage modal. |
| Owner | Person picker (staff only) | Defaults to the current user. Multi-owner is supported but the dialog only sets the primary; additional owners are added on the detail page. |

**Optional fields** (collapsed under a "More details (optional)" disclosure):

| Field | Input | Notes |
|---|---|---|
| Primary contact | Name + email + title | All three optional. If `name` and `email` are filled, the submission creates a `people` row with role `Sponsor Prospect Contact` and links it via `sponsor_contacts` as primary. If `email` matches an existing `people.email`, link to that person instead of creating a new one. |
| Source | Text | "Warm intro / event / cold / referral / …" |
| Campaign | Select from active `sponsor_campaigns` | "— none —" is valid; can be set later. |
| Ask amount | Currency input | Creates a `sponsor_amounts` row with `kind='ask'`. |
| **Foundation only**: Grant deadline | Date | Stored on the sponsor row. |
| **Corporate or Foundation**: Renewal month | Month select | Stored on the sponsor row. |
| **Corporate only**: Matching gift eligible | Checkbox | |

**Type-conditional reveal** is wired by the Type segmented control. Switching types hides/shows the type-specific rows; previously-entered values are preserved across toggles.

**Actions**:

- **Cancel** — closes without saving.
- **Create & open** — primary action. Writes the new `sponsors` row + initial `sponsor_stage_events` row + optional `people` + `sponsor_contacts` + `sponsor_amounts` rows in one transaction. Navigates to the new sponsor's detail page on success. On failure shows an inline error toast and leaves the dialog open with values intact. Single-flight ref guard per AGENTS.md §"Async Save / Toast Single-Flight".

The dialog collects only the minimum needed to make a useful record. Stage timeline notes, follow-up creation, additional contacts, and attachments are added on the detail page after creation.

### 6g. Editing an existing sponsor

Editing happens directly on the sponsor detail page (§6b) — there is no separate "edit mode" route. Four affordances cover the editable surface:

1. **Inline edit on the About row** (`sponsors.notes_freeform`). Hovering the row reveals an "Edit" pencil; clicking turns the line into a textarea with Save/Cancel.
2. **Inline-editable facts strip values** (Campaign, Ask, Committed, Received, Grant deadline, Source). Hovering any value reveals a small pencil; clicking turns that single value into the matching control (select for Campaign, currency for Ask/Committed/Received, date for Grant deadline, text for Source). Save on blur or Return; Escape cancels. The `+ owner` link, primary marker, and avatar dismiss handle the owners row.
3. **Per-row affordances inside the reference cards**:
   - Contacts: each row hover-reveals `Make primary` (if not already), `Edit`, `Remove`. `+ Add` opens a contact picker (existing person or create-new).
   - Money: each row hover-reveals `Edit` and `Remove`. `+ Entry` opens a small modal to add a new `sponsor_amounts` row.
   - Attachments: each row hover-reveals `Download` and `Remove`. `+ Upload` opens the file picker.
4. **`Edit details` button in the slim sticky header** (between `Send email` and `Archive`). Opens the **Edit sponsor details** modal — the canonical place to change durable sponsor-row fields and to perform the rarer edits the inline pencils don't cover.

**Edit sponsor details modal:**

Same `max-w-lg` modal pattern as §6f (New Sponsor). All fields are pre-populated from the current sponsor row. Fields:

| Field | Input | Notes |
|---|---|---|
| Name | Text | `sponsors.display_name`. |
| Type | 4-button segmented control | Changing type re-evaluates the conditional rows below. |
| Entity | 3-button segmented control | |
| Source | Text | |
| Campaign | Select from active `sponsor_campaigns` | |
| **Foundation only**: Grant deadline | Date | |
| **Corporate or Foundation**: Renewal month | Month select | |
| **Corporate only**: Matching gift eligible | Checkbox | |

**Footer actions:**
- `Archive sponsor` — destructive, left-aligned. Confirms in a follow-up `AlertDialog` per AGENTS.md §"Confirmation Dialogs"; on confirm sets `sponsors.is_archived = 1` and closes the modal. Archived sponsors drop out of the dashboard's default lists but remain accessible via a filter.
- `Cancel` — closes without saving.
- `Save changes` — primary. PATCHes the changed fields in a single transaction. Optimistic UI per AGENTS.md §"Interaction Speed and Feedback"; single-flight ref guard per §"Async Save / Toast Single-Flight".

**Stage changes** keep their own affordance: the stage chip on the identity card is itself clickable (in addition to the Advance button) and opens the same stage-change modal used on the staff Kanban. This is the only path that creates `sponsor_stage_events`; the Edit sponsor details modal does not include a stage field.

**Permission gate:** all editing surfaces (inline pencils, per-row affordances, the Edit details button, the stage chip) require `admin.sponsors.write`. Without it the page renders as read-only — the same gate the board / dev-committee dashboard uses (§6c).

## 7. Notifications, reminders, and email ingest

- **Follow-up reminders** — Mailgun, sent on the morning a follow-up is due (Pacific). Idempotency via `sponsor_followups.reminder_sent_at`. Templated through `email_template_versions` so Karin can edit copy without a deploy. Cron: a new entry in the existing dispatcher (`lib/recurring-emails/dispatcher.js`).
- **Board-logged-note alert** — Mailgun, sent immediately when a board member submits "Log my interaction". Recipient is the sponsor's primary owner. Subject: "[Board] {Board Member} logged a note on {Sponsor}".
- **Overdue summary** — Mailgun digest to each staff owner Monday morning listing their overdue follow-ups.
- **Outbound staff-sent email to a sponsor contact** — Gmail OAuth via `lib/email-sender.js`, identical wiring to entrepreneur messaging. The "Send email" affordance on a sponsor detail page opens the same compose flow used elsewhere.
- **Email auto-ingest into the Activity timeline** — every Gmail message captured by the existing `e8.logger` system is matched against `people.email` for everyone in `sponsor_contacts`. On a match, a `sponsor_email_events` row is written (idempotent on `gmail_message_id`) and renders as an Email entry in the sponsor's Activity timeline. Implementation lives in the same place `e8.logger`'s entrepreneur-side ingest does: a sponsor matcher runs alongside the existing entrepreneur matcher and reuses the message-fetch path. SWR invalidation: tag `sponsors` (per §4.4).

## 8. Historical data import

Source: `uploads/E8 Master Sponsor List.xlsx`.

Handling the data-quality issues observed:

1. **Multi-value contact/email cells.** Pervasive in the spreadsheet (~50% of rows on the Active sheet, similar on Prospects). Split into separate `people` rows and link via `sponsor_contacts`. First listed becomes `is_primary=1`.
2. **Multi-assignee cells.** Split into multiple `sponsor_owners` rows. First listed becomes `is_primary=1`.
3. **Section headers as soft enum.** Sheets use merged-cell section dividers ("CONFIRMED 2026 SPONSORS", "HOT/WARM/COLD PROSPECTS"). Don't trust them blindly; let the `Stage` column ("Conversation") be the truth, and use the section text only to break ties when stage is blank.
4. **Mixed-format dates.** `Last Communication` and `Email Activity Log` columns mix `"2026-05-01"`, `"2024"`, `"Jan 2026"`. Parse to YMD where possible; store original string in `note` field of the migrated entry where not.
5. **Free-text dollar ranges.** `Ask Range` like `"$20,000+"`, `"$3,000–$5,000"`, `"TBD"` becomes one `sponsor_amounts` row with `kind='ask'` and parsed midpoint (or floor for "$X+"); original string stored in `note`.
6. **Foundation Focus Area tags.** Comma-separated → stored as-is in `notes_freeform`.
7. **Annual giving columns** (`2023 Actual`, `2024 Actual`, `2025 Actual`, `2026 Goal`, `2026 Actual`) → one `sponsor_amounts` row per nonzero cell, `kind` mapped from column.
8. **Email Activity Log sheet** → one `sponsor_notes` row per entry, `occurred_at` from Date, `channel='email'`, `summary` from Subject/Summary column, with author resolved by matching staff name to `people.email` (default to a `legacy-import@e8angels` placeholder if not resolvable).
9. **Foundation Prospects sheet** → one `sponsor` row per foundation with `sponsor_type='foundation'`, stage inferred from Outreach Status, focus areas into `notes_freeform`.
10. **Dedup.** Companies appearing on multiple sheets (e.g. Starbucks in Prospects + Email Log) collapse to one sponsor. Match on normalized name; ask before merging anything ambiguous.

Migration is scripted as `scripts/import-sponsor-history.js` with `--env=prod` support per AGENTS.md, and dry-run by default. Output a CSV of decisions for Karin to review before the real run.

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
- Karin review pass on dedup decisions
- Real import
- CSV export from filtered list

### Phase 7 (post-v1) — Impact report
- Standalone shareable document at `/admin/sponsors/impact`
- HTML print stylesheet + PDF export through existing PDF skill
- Anonymized cohort + deployment stats pulled from the rest of the portal

## 10. Open items

- **Multi-owner reminders.** If a sponsor has two primary owners, do both get the reminder? Default: only owners with `is_primary=1` on `sponsor_owners` get follow-up reminders; the assignee on the specific `sponsor_followups` row always does. Confirm with Karin.
- **Spreadsheet dedup.** Some sponsors may genuinely be different relationships under the same brand (Starbucks Corporate vs Starbucks Foundation). The import script should flag, not auto-merge.
- **Entity assignment for historical records.** The spreadsheet only started tagging `Entity` recently. Pre-existing records will default to `501c6` (E8 Angels) since the 501c3 is brand new. Karin reviews the dry-run CSV.
- **Glossary load lag.** The data-query skill caches the glossary per session; staff who already have a session open at deploy time won't see the new tables in their next question until they restart the skill. Worth a Slack heads-up at launch.
