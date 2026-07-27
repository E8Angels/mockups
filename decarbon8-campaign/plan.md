---
title: "Decarbon8 Campaign — Lightweight Donor CRM"
status: draft
owner: jordan
created: 2026-07-24
last_updated: 2026-07-27
home: campaign.html
---

# Decarbon8 Campaign Plan

## Mockup files in this folder

- **`campaign.html`** (home) — the Campaign tab under Decarbon8 admin: stats strip, stage-grouped prospect grid, and the wide two-column prospect flyout (details + touchpoints side by side).
- **`digest.html`** — the periodic "what the AI did" email Karin receives.

## 1. Purpose

A deliberately lightweight CRM for the Decarbon8 donor campaign. Decarbon8 is E8's philanthropic, donor-based fund (tax-deductible gifts, cash or through a DAF). Karin needs to work a yearly list of prospective donors — mostly past donors — through a simple pipeline, with email as the only communication channel, sent from her own Gmail.

Explicitly **not** the Development CRM. No opportunities, campaigns-with-goals, products, tasks, or attachments. Two slim tables, heavy reuse of existing portal machinery, and Claude Cowork (via the MCP data connector) as the power tool for anything complicated.

Division of labor:

- **Portal** — always-on (in season) email watching, AI touchpoint capture, structured fields, pipeline views, bulk email, stats.
- **Cowork** — ad-hoc heavy lifting ("draft a check-in to everyone still deciding that I haven't talked to in three weeks, summarizing where each conversation stands"), reading the cheap one-line summaries instead of raw email.

## 2. Decisions

Agreed 2026-07-24:

- **Stages (5):** Prospect → In Conversation → Committed → Received / Declined.
- **AI autonomy:** full — the AI auto-fills fields *and* moves stages when an email is unambiguous. Every AI action is logged, and a periodic digest email tells Karin everything the AI did so she can catch errors.
- **Log content:** one-line summaries only. No email bodies stored. Each email-derived touchpoint keeps the Gmail message id for a deep link to the real thread.
- **Placement:** a new **Campaign** tab in `/admin/decarbon8`, sibling to Donors, same permission gate (`admin.decarbon8.donors`).

Second round, 2026-07-25:

- **Status + follow-up instead of tasks.** Each prospect carries a rich, AI-maintained **status** ("Needs to talk to his wife about the amount; planning to decide by mid-April") and a **follow-up date** the AI extracts ("check back with me in April" → a date). No task objects. A "Ready for follow-up" view shows who's due.
- **Seasonal switch.** Fundraising runs roughly April–October. One switch turns the whole apparatus off — no AI spend, no digests — while the tab stays browsable.
- **Fundraising-relevance, not Decarbon8-relevance.** Only prospects' email is ever examined, and within that, generic Decarbon8 traffic (volunteer solicitations, portfolio reports, blasts to hundreds) is filtered out. A *personal* note — including "I'd like to volunteer for screening" — is in bounds, because personal engagement with the fund is exactly what Karin wants to know.
- **New prospects can be new people.** The Add Prospect flow creates the person on the spot when they're not in the portal yet.
- **Past giving is shown as stats** (average, most recent, prior) — six years of history makes "total" alone misleading.
- **Grid emphasis:** Follow-up and Status are the working columns; Last Contact is secondary; a separate "latest touch" column is dropped (Status subsumes it).

Sixth round, 2026-07-26 — from Karin's actual spreadsheet ("D8 2026 Donor Pipeline.xlsx"):

- **Tier (1/2/3).** Her ⭐/📈/💚 tiers become a `tier` field — movable in the flyout, sortable and groupable in the grid (e.g. by tier within a stage).
- **DAF mechanism is back, as free text.** Not cash/DAF — it's *which* mechanism ("Fidelity Charitable", "Schwab Charitable", "Seattle Foundation", "Direct"). Free text with autocomplete over existing values (her sheet repeats Fidelity ×5, Schwab ×6, plus one-offs); blank means unknown — no "Unknown" value.
- **"Suggested Ask" is our ask.** The expected-amount field is renamed **Ask** (`ask_amount_cents`); her Committed Amount column folds into it once the stage is Committed.
- **Her Status column decomposes — no new enum.** "✅ Committed 2026" is a stage; "Active – Loyal/Streak/Gap/Alt Years/New" is a derived giving-pattern (streak); "Lapsed since YYYY" is recency (the color-coded year tag); "Active – Core Team" is (probably) the committee column. Open questions for Karin in §11.
- **Streak is derived and displayed.** Computed from the donation years, shown as its own column: "All 5" (every year), "×3" (consecutive run), "Returned" (back after a gap), "Alt" (alternating), "New", or "—".
- **Giving splits into independent columns** — lifetime total, last gift, last gift year (color tag), years active — individually sortable/groupable, instead of one combined cell.
- **D8 team membership is visible** — whether the person is on that year's Decarbon8 screening committee (and their role: Screening / Manager / Judge / Intern), as a grid column and on the flyout.
- **Still out:** outreach owner (it's all Karin), her Contact/Follow-Up date columns (ours are live from the log), free-form Notes (status summary + touchpoints cover it), and her Timeline tab (campaign calendar — not this feature).

Fifth round, 2026-07-26:

- **Spreadsheet + Gmail history import via Cowork.** Karin's existing tracking spreadsheet and this year's correspondence get imported in a single Cowork session using the portal connector's governed writes — no bespoke importer. The exact prompt lives in §7.2, and doubles as the acceptance test for the MCP-facing documentation.

Fourth round, 2026-07-25:

- **Weekly digest.** The AI activity digest goes to Karin weekly, not daily.
- **Portal-wide reach-in.** The people admin grid gets a seeded "Active Decarbon8 Prospects" view, and the send-mail Audience Builder gets a matching audience token, so prospects are addressable outside the Campaign tab.

Third round, 2026-07-25:

- **No vehicle tracking.** Cash vs DAF doesn't matter — a donation is a donation, regardless of where it comes from. What we actually track today (and keep tracking) is the existing **recoverable** flag on `decarbon8_donors`. Prospects get the same checkbox; no `giving_vehicle` column anywhere.
- **No owner.** Single-operator assumption for now; drop the concept entirely and revisit if more people join the campaign.
- **Recency in the giving column.** "3 years but the last was 3 years ago" ≠ "each of the last 3 years." The grid shows average, most recent year, and a "+N" for other years (e.g. "$20k avg · 2023 +1"); the flyout has the full per-year detail.
- **Wide flyout, no scrolling.** The flyout is roughly double width with two columns — details on the left, touchpoints on the right — so the timeline is visible without scrolling. Stage is a compact dropdown, not a pill row.

## 3. Data model

Two new tables. SQL ships as a manual migration script (never auto-migrated at startup); `createTables()` updated for new environments. No changes to `decarbon8_donors`.

### 3.1 `decarbon8_prospects` — one row per person per campaign year

```sql
CREATE TABLE decarbon8_prospects (
    id TEXT PRIMARY KEY,                          -- d8p_...
    person_record_id TEXT NOT NULL,               -- people.record_id
    campaign_year INTEGER NOT NULL,               -- 2026; maps to funds.id 12026
    stage TEXT NOT NULL DEFAULT 'prospect'
        CHECK (stage IN ('prospect','conversation','committed','received','declined')),
    tier INTEGER CHECK (tier IN (1, 2, 3)),       -- priority; NULL = untiered
    ask_amount_cents INTEGER,                     -- the ask; becomes the committed amount at stage Committed
    recoverable INTEGER NOT NULL DEFAULT 0
        CHECK (recoverable IN (0, 1)),            -- same flag as decarbon8_donors
    daf_mechanism TEXT,                           -- free text ("Fidelity Charitable"); NULL/empty = unknown
    status_summary TEXT,                          -- AI-maintained "state of things"; human-editable
    follow_up_on TEXT,                            -- ISO date; AI-extracted or manual
    donor_id TEXT,                                -- decarbon8_donors.id once the gift lands
    created_at TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE (person_record_id, campaign_year)
);
```

`status_summary` is the glance-level answer to "where does this stand?" — richer than a next-step one-liner, rewritten by the AI as the conversation evolves, always editable by staff (a staff edit is logged too, and the AI's next rewrite starts from the edited text). `follow_up_on` is a date, not a task: set by the AI when an email implies timing, or by hand; cleared when a new exchange supersedes it. `recoverable` is staff-set (pre-fillable from their most recent donation at seeding time) and carries over to the donation row when the gift lands.

`daf_mechanism` edits offer autocomplete over the distinct values already in the table, so repeats ("Schwab Charitable") are one keystroke and one-offs ("Maine Community Foundation") are just typed.

Derived, never stored: **last contact** (max touchpoint date); **past giving stats** (lifetime total, average, most recent, prior, last gift year, years active — from `decarbon8_donors`); **streak** — a giving-pattern classifier over the donation years: *All N* (every year since first gift), *×N* (N consecutive years through their latest gift), *Returned* (gave most recently after skipping), *Alt* (alternating years), *New* (first year), *—* (nothing usable); and **D8 team membership** — whether the person is on the campaign year's Decarbon8 committee, with role, from the portal's committee data. Amount received is authoritative in `decarbon8_donors`; a prospect reaches **Received** only when its donation row exists (`donor_id` set), never by AI inference.

### 3.2 `decarbon8_contact_log` — one row per touchpoint

```sql
CREATE TABLE decarbon8_contact_log (
    id TEXT PRIMARY KEY,                          -- d8log_...
    person_record_id TEXT NOT NULL,
    campaign_year INTEGER NOT NULL,
    occurred_at TEXT NOT NULL,
    kind TEXT NOT NULL
        CHECK (kind IN ('email_in','email_out','note','ai_update')),
    summary TEXT NOT NULL,                        -- the one-liner
    gmail_message_id TEXT UNIQUE,                 -- dedupe + Gmail deep link
    thread_id TEXT,
    extracted_json TEXT,                          -- {amount_cents, stage_hint, follow_up_on, confidence}
    actor TEXT NOT NULL CHECK (actor IN ('ai','staff')),
    created_by_person_record_id TEXT,             -- when actor='staff'
    digested_at TEXT,                             -- set when included in an AI digest email
    created_at TEXT NOT NULL
);
```

When the AI changes anything on the prospect (fields, stage, status, follow-up) it writes **one** `ai_update` row summarizing the changes alongside the touchpoint row for the email itself. One table serves the timeline, the audit trail, and the digest (`actor='ai' AND digested_at IS NULL`).

### 3.3 Season switch

One app setting, `decarbon8_active_campaign_year` (nullable integer, managed from the Campaign tab):

- **Set (e.g. 2026)** — that year is the working campaign: the watcher roster includes its prospects, the AI processes matches, digests go out.
- **Null (off-season)** — the roster returns no Decarbon8 entries, so the Apps Script matches nothing and **zero** AI calls happen; the digest job no-ops. The Campaign tab remains fully browsable for any year.

## 4. Campaign lifecycle

- **Start campaign** — an admin action seeds a `prospect`-stage row for every distinct past donor (any vintage) who doesn't already have a row for the year (recoverable pre-filled from their most recent donation), and sets the active-year setting. Re-runnable; never overwrites existing rows.
- **Add prospect** — people picker over existing people, with an inline **New person** path (name + email) for prospects not in the portal yet; creates the `people` row (Prospect role, same pattern the email logger uses for unknown correspondents) and the prospect row in one step.
- **End of season** — flip the switch off. Un-received commitments and open conversations keep their state for next year's seeding.
- **Year over year** — everything is scoped by `campaign_year`; next year is another Start Campaign click. Declined prospects still seed the next year (a no in 2026 is not a no in 2027).

## 5. Email intelligence

### 5.1 Capture — extend the existing watcher, don't clone it

The development email watcher (Apps Script inside Karin's Gmail, 5-minute trigger, roster pre-filter, ingest POST) gains a second audience:

- `GET /api/development/email-watch/roster` additionally returns active-campaign prospect emails (empty off-season). The script just matches a superset; no script logic changes.
- The ingest handler fans out server-side: funder match → existing dev-CRM path, unchanged; D8 prospect match → new Decarbon8 handler. One script, one trigger, one heartbeat. A message can legitimately log in both systems.
- The dev CRM's "Member roles veto logging" rule does **not** apply on the D8 path — most D8 donors *are* members.

### 5.2 Relevance — personal and fundraising-related, aggressively filtered

Decarbon8 comes up constantly in E8 mail (volunteer recruitment, portfolio reporting, event announcements), so "mentions Decarbon8" is nowhere near enough. Filtering runs in three layers, cheapest first:

1. **Roster gate (free).** Only messages to/from an active-campaign prospect are examined at all.
2. **Broadcast detection (code, no AI).** The portal composer sends blasts as individual Gmail messages, so a 300-person solicitation looks like 300 separate outbound emails. The ingest handler hashes normalized subject+body; the same content arriving for multiple prospects within a short window is a broadcast and is dropped for all of them (first occurrence included, retroactively). Portal-originated sends can additionally be fingerprinted at send time so composer blasts never even reach classification.
3. **Relevance classifier (classification-tier model, `crm` key routing).** The prompt asks: *is this a personal exchange that tells us something about this person's relationship to the Decarbon8 fund?* In bounds: giving intent, amounts, timing, hesitations — and personal engagement signals like offering to volunteer for screening. Out of bounds: newsletters, generic volunteer solicitations, portfolio reports, event logistics, and anything that reads as one-to-many even if it slipped past layer 2.

Survivors go to the summarize/extract step (high-volume-tier model): one-line summary plus `{amount_cents, stage_hint, follow_up_on, status_update, confidence}`. Full bodies are used transiently, never stored.

Precedent: `lib/email-to-company-note-processor.js` (AI email → structured note) and `lib/luma-guest-registered-handler.js` (nano-model classification).

### 5.3 Act autonomously, report everything

On a confident extraction the handler updates the prospect directly:

- **Fields** — ask amount, follow-up date.
- **Status** — rewrites `status_summary` to reflect the current state of things ("Needs to talk to his wife about the amount; deciding by mid-April — check back then"), so Karin reads state, not history.
- **Stages** — Prospect → In Conversation (any real exchange, including Karin's first personal outreach), In Conversation → Committed (clear commitment), → Declined (clear no). Never → Received (that's the donation row's job). Low confidence = log the touchpoint, touch nothing else.

Every autonomous change writes an `ai_update` log row. A scheduled job (same pattern as the existing 6 a.m. task-alert cron) sends the **weekly AI activity digest** via Mailgun to campaign staff — skipped when the week had no activity, silent off-season. See `digest.html`.

## 6. UI

### 6.1 Campaign tab (`/admin/decarbon8?tab=campaign`)

- **Header** — campaign year selector, the **Active** season switch, Start Campaign / Add Prospect / Contact buttons.
- **Stats strip** — Committed / Received / In Play dollar totals plus per-stage counts, for the selected campaign year. Received comes from `decarbon8_donors` for that year's fund.
- **Prospect grid** — a `RecordGrid` (`admin-grid-config` entry, `tableKey: 'decarbon8_prospects'`) grouped by stage with **tier sub-groups inside each stage by default** (Received and Declined groups default collapsed; untiered prospects fall in a trailing "No tier" sub-group). Columns, each independently sortable/groupable: name, **tier**, **ask**, recoverable (checkbox), **DAF mechanism**, **lifetime total**, **last gift**, **last gift year** (color-coded recency tag — green for last year, shading through yellow and orange to red the further back it is), **years active**, **streak** (derived pattern), **D8 team** (committee role), **follow-up** (due dates highlighted), last contact, **status**. The giving facts are individual columns rather than one combined cell so each is scannable and sortable on its own.
  - *Why this shape:* Follow-up is the working question ("who do I owe attention?") — it sorts the groups and gets the visual emphasis. Status is the at-a-glance state and makes a separate "latest touch" column redundant. Last contact stays as a secondary column because staleness ("no follow-up set and nothing heard in weeks") is a different failure mode than "follow-up due."
  - Seeded views: **Ready for follow-up** (follow-up on/before today), **Needs attention** (no follow-up set, no contact in 3+ weeks), **Committed, not received**.
- **Contact** — the existing select-rows → spreadsheet-recipients → send-mail composer flow, exactly as the Donors tab does today.

### 6.2 Prospect flyout

Click a row → a wide right-side sheet (~2/3 of the screen), two columns so nothing needs scrolling:

- **Header (full width):** person and email address, plus a **D8 team chip** (role + year) when they're on that year's Decarbon8 committee. The email address itself is the send affordance: it's a `mailto:` link carrying the friendly name ("Dana Whitfield <dana@…>"), opened in a new window, visibly clickable on hover — no separate button. She sends from her own mail client, the watcher logs the outbound copy, and last-contact updates itself.
- **Left column:** stage (compact dropdown, color-coded to match the grid's stage colors), tier, ask, recoverable checkbox, DAF mechanism (free text with autocomplete over existing values); **Status** (multi-line, AI-maintained, provenance and freshness shown, editable in place); **Follow up on** (date); **Giving history** (lifetime / average / most recent / prior stats, then per-year rows with their recoverable flags).
- **Right column:** the **touchpoint timeline** — newest first, email-specific inbound/outbound icons, AI-action entries visually tagged, compact per-entry Gmail icon-links. **Add note** opens a small modal with a multi-line editor (calls, hallway conversations).

### 6.3 Donors tab

Unchanged.

### 6.4 Elsewhere in the portal

- **People admin grid** (`/admin/people`): a derived, default-hidden column — active-campaign Decarbon8 prospect stage — plus a seeded shared view **"Active Decarbon8 Prospects"** filtering to people with a prospect row in the active campaign year. Deploy-order caveat: the field code must be deployed *before* the view is seeded (an `is_empty`-style filter on an unknown field matches every row), and the saved view needs its column row written, per the established admin-grid seeding procedure.
- **Audience Builder** (send-mail composer): a new **Decarbon8 Prospects** audience token resolving to the active campaign's prospects (empty off-season), alongside the existing `d8_investors_*` donor audiences. Composable with the builder's exclude support, so "all prospects except those already committed" is expressible without new UI.

## 7. Cowork / MCP

### 7.1 Documentation — the connector interface is a first-class deliverable

Everything Cowork knows about these tables comes from the MCP server's own docs, so shipping them is part of the feature, not an afterthought:

- **`docs/database-schema.md`** — full sections for `decarbon8_prospects` and `decarbon8_contact_log` (column semantics, stage meanings, the "Received requires a donation row" rule, season setting), which `get_schema` renders live.
- **`docs/data-query-glossary.md`** — terms like *Decarbon8 prospect*, *campaign year*, *touchpoint*, *status summary*, *follow-up date*, so Karin's natural phrasing resolves to the right tables.
- **`docs/ai-relationship-registry.json`** — joins to `people` and `decarbon8_donors`.
- **Write contracts** (`mode: 'generic'`) for both tables — writable business columns (including `tier`, `ask_amount_cents`, `daf_mechanism`, `status_summary`, `follow_up_on`, `recoverable`, and `actor` on log rows), `neverWrite` ids/timestamps/`digested_at`, insertable, deletable; money columns validated by the existing hook. Contracts render into `get_schema`, so documentation and enforcement can't drift.

Result: Karin's Cowork can query pipeline + status summaries cheaply, draft mail via her Gmail connector, and log notes or fix fields through governed writes with undo.

### 7.2 One-time import: her spreadsheet + Gmail history, via Cowork

Karin has been tracking this year's campaign in a spreadsheet, with the correspondence in her Gmail. The import is a Cowork session, not portal code: her Cowork has both the portal connector (governed writes with preview/undo) and her Gmail, which is everything the job needs.

Import conventions (documented in the schema docs so Cowork picks them up):

- Imported touchpoints set `gmail_message_id` where known — deep links work, and the UNIQUE constraint makes re-runs and any watcher overlap idempotent.
- Imported log rows use `actor='staff'` — they're Karin's own reviewed data, and this keeps the backlog out of the weekly "what the AI did" digest (which only reports `actor='ai'` rows).
- Unmatched spreadsheet names are surfaced for confirmation before any new `people` rows are created.

The prompt she'll use (also useful as the acceptance test for the docs — if this prompt works cold, the documentation is good):

> I'm moving my 2026 Decarbon8 fundraising tracking into the E8 portal. Attached is the spreadsheet I've been using.
>
> 1. Read the portal schema for `decarbon8_prospects` and `decarbon8_contact_log` and follow the documented conventions.
> 2. Match each spreadsheet row to a person in the portal. Show me the ones you can't match confidently and wait for my answer before creating anyone new.
> 3. Create or update a 2026 prospect row for each person: stage (my Status column's "Committed" rows are stage Committed; my Committed Amount becomes the ask there), tier, ask (my Suggested Ask), recoverable flag, DAF mechanism (skip "Unknown" — leave it blank), and a status summary reflecting where things stand per my Notes / Strategy column. Don't import lifetime totals, years active, or streak — the portal derives those from the donation records; instead, flag any rows where my spreadsheet's giving history disagrees with the portal's donation records so I can reconcile.
> 4. Then search my Gmail for my correspondence with each of these people this year. For personal exchanges relevant to Decarbon8 giving (skip anything I sent as a bulk blast, and skip generic fund announcements), add one contact-log entry per meaningful email — one-line summary, direction, date, and the Gmail message id — marked as staff-entered. Where the email trail is fresher than my spreadsheet, update the status summary and set a follow-up date.
> 5. Preview everything and show me a summary of what you're about to write — how many prospects, how many log entries, anything surprising — before executing.

### 7.3 Ongoing use

After the import, the live watcher takes over for new mail, and Cowork remains the power tool for ad-hoc asks ("draft check-ins to everyone still deciding that I haven't talked to in three weeks, summarizing where each conversation stands, into my Gmail drafts").

## 8. Permissions

Reuse `admin.decarbon8.donors` for the Campaign tab, its APIs, and the grid config — same audience as the Donors tab, no new resource strings. Everyone with the permission sees and can work everything.

## 9. Out of scope (v1)

- Kanban board, in-app composer, follow-up *tasks* (dates only), attachments, goals — the Development CRM exists for heavyweight needs.
- Owner/assignment on prospects (single-operator assumption; revisit if more people join the campaign).
- Cash-vs-DAF tracking (a donation is a donation; the existing recoverable flag is the only distinction that matters).
- Storing email bodies or HTML; the log is summaries + Gmail links.
- Org-level donors (prospects are people, matching `decarbon8_donors`).
- Auto-creating `decarbon8_donors` rows from email ("received" stays a human/money event).

## 10. Open questions for Karin

- **"Active – Linked"** (one row) — linked to what? A household/partner's giving? Determines whether we need any linkage concept or it folds into the status summary.
- **"Active – Core Team"** (one row) — is this "serves on the D8 screening team"? If so, the D8 team column covers it.
- **"Annual Survey – Plan to invest" tab** — the portal's annual survey has no Decarbon8-investment question; where does this list come from, and should those people be seeded as prospects (her sheet marks them "screening" / "past donor")?
- **Tier semantics** — confirm 1/2/3 means priority/likelihood as assumed, and how "NEW" donors should be tiered (proposal: tier stays empty until she sets it).

## 11. Implementation phases

1. **Schema + plumbing** — migration script (manual apply per project rules), `createTables()`, cache-manager CRUD, seeding action, season setting, docs.
2. **Watcher extension** — roster union (season-gated), ingest fan-out, broadcast detection, D8 handler with AI gate/summarize/extract/act, log writes. Apps Script change is roster-transparent (version bump only).
3. **UI** — Campaign tab in `Decarbon8AdminIsland`, grid config + seeded views, wide two-column flyout, note modal, Gmail links, Contact reuse, stats strip, season switch, Add Prospect with new-person path; people-grid prospect-stage field + "Active Decarbon8 Prospects" seeded view (field code deploys before view seeding); Decarbon8 Prospects audience token in the Audience Builder + resolver.
4. **Digest** — weekly scheduled job + Mailgun template, season-gated.
5. **Cowork** — write contracts, schema/glossary/registry docs (including the §7.2 import conventions), contract tests; dry-run the §7.2 import prompt against dev as the docs acceptance test.
6. **Tests** — ingest fan-out + role-gate differences, broadcast detection, AI handler (mocked models), stage-transition rules, status/follow-up updates, season gating (roster empty, digest no-op), digest idempotency (`digested_at`), grid/flyout island tests.
