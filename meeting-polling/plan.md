---
title: "Meeting Polling"
status: draft
owner: jordan
created: 2026-06-08
last_updated: 2026-06-08
home: index
---

# Meeting Polling

Live, in-meeting polls for member meetings. Admins build reusable **polls** (ordered
sets of **questions**), release a poll for a specific pitching company during a live
(embedded-Zoom) meeting, and every viewer gets a centered modal to respond. Responses are
attributed to the **person**, the **application** (company) they were about, and the
**meeting** that was the context, with a timestamp. Results roll up to a new **Pipeline
Committee** dashboard and a spreadsheet-style per-meeting results page.

## Mockups in this folder

| File | What it shows |
|------|---------------|
| [`index.html`](index.html) | Overview / navigation hub for the mockups |
| [`poll-admin.html`](poll-admin.html) | Polls list + poll editor (questions, drag-drop reorder, conditional logic, role/vintage targeting, tokens) |
| [`question-types.html`](question-types.html) | Gallery of all six question types, incl. Multi-select Type 1 & Type 2 |
| [`meeting-admin-tab.html`](meeting-admin-tab.html) | New **Admin** tab on the live meeting side panel (Q&A admin moved here + Poll admin) |
| [`live-poll-modal.html`](live-poll-modal.html) | Member-facing poll modal that pops when a poll is released |
| [`pipeline-committee.html`](pipeline-committee.html) | Pipeline Committee dashboard with the Member Meeting Poll Results table |
| [`poll-results-detail.html`](poll-results-detail.html) | Spreadsheet-style per-meeting results (company tabs + question columns) |

---

## 1. Entry point — Polls button on the calendar admin

On `/admin/calendar`, add a **Polls** button immediately to the *left* of **Add calendar
item** in `.uc-controls-row` (file: `src/islands/UnifiedCalendarIsland.jsx`). Use a
secondary button style with a poll-appropriate icon (`BarChart3` / `ListChecks` from
lucide). It navigates to `/admin/polls`.

## 2. Poll management UI (`/admin/polls`)

A new island, `PollAdminIsland.jsx`:

- **Polls list** — table of polls: name, # questions, "Member Meeting Poll" badge,
  last updated. Row actions: edit, duplicate, delete. "New poll" button.
- **Poll editor** — name field; a **"Member Meeting Poll"** toggle (exactly one poll
  may hold this designation; turning it on for poll B clears it from poll A). An ordered
  list of questions with **drag-drop reorder** (reuse the existing dnd pattern; see the
  meeting-questions/agenda reorder). Add-question button opens the question editor.

### Question editor fields

Every question has:

- **Label** — supports the `{company}` and `{min check size}` tokens (see §6).
- **Type** — one of the six below.
- **Options** — for choice/multi-select types; ordered, add/remove/reorder.
- **Required** — boolean.
- **Help text** — optional sub-label (kept minimal per UI copy rules; off by default).
- **Conditional visibility** — "Show this question only after question *X* has been
  answered" (§4). Picks an earlier question in the same poll.
- **Audience targeting** (§5):
  - **Role** — role picker (reuse `EditPersonIsland` role popover); show only to people
    with any of the selected roles.
  - **Fund vintage** — "only investors in E8 Fund vintage *YYYY*" (family + vintage from
    `src/lib/fund-display.js`).

### Question types

| Key | UI |
|-----|----|
| `checkbox` | Single checkbox (agree/acknowledge), or a checkbox group when options present |
| `radio` | Radio buttons (single choice) |
| `multiselect_chips` | **Multi-select Type 1** — chip/tag input (the Sector-Interests component) |
| `multiselect_buttons` | **Multi-select Type 2** — option buttons that depress + show an inline checkbox |
| `text_input` | Single-line input |
| `textarea` | Multi-line text area |

## 3. Reusable component change — Multi-select Type 1 (Sector Interests)

`src/components/ui/multi-select-picker.jsx` currently opens its dropdown only when the
`+` icon is clicked. **Change:** clicking *anywhere* in the chip container opens the
dropdown (wrap the container as the Popover trigger), while the per-chip `×` remove
button and the `+` keep working. This is a shared component — re-verify the
`/admin/people/edit` Sector Interests usage after the change.

## 4. Conditional questions (response-gated)

A question may be marked conditional on an **earlier** question, with a comparison
operator against that question's answer:

- **has any answer** — appears once the gating question has any non-empty response.
- **is** / **is not** — appears when the answer equals (or doesn't equal) a chosen value
  (e.g. *show only when "How likely will you invest…" is "Likely"*).
- **is one of** — appears when the answer is any of a chosen set (useful for multi-select
  gating questions, where "is one of" means the member selected at least one of the set).

The value picker is populated from the gating question's options. It is re-evaluated
client-side in the live modal as the member fills the form: changing the gating answer to
a non-matching value hides the dependent question again and clears any answer it held. The
admin editor shows a "Shown when *Q* is *value*" chip on the question row. Gating is only
allowed on an **earlier** question to avoid cycles.

## 5. Audience targeting (role + fund vintage)

At render time the live modal filters questions by the current user:

- **Role gate** — exact-match against the user's `roles` (never substring; AGENTS.md
  §Role Matching). Question shows only if the user has one of the selected roles.
- **Vintage gate** — user must be an investor in the selected E8 Fund family+vintage
  (derive from the person's fund investments; see `latestFundVintage` / fund-display).

If a question is filtered out, it is simply not rendered and not required.

## 6. Label tokens

Label text may contain:

- `{company}` → the pitching company's name (from the released application).
- `{min check size}` → the application's deal-terms minimum check size formatted as
  `"$10,000"` (from `min_check_size_cents` in the deal-terms JSON; field stores raw
  dollars). If absent, the token renders as empty string (no placeholder, no "$0").

Token substitution happens server-side when building the live poll payload and again for
results display, so stored responses are not affected.

## 7. Meeting live page — Admin tab

On `/meeting/:slug/live` (`src/islands/MeetingPlaybackIsland.jsx`), add an **Admin** tab
to the side panel, to the right of **Company Q&A**. Gate it to meeting admins/moderators.

- **Move** the two existing Meeting Q&A admin controls (company picker / *Release*, and
  *Moderators*) out of the Company Q&A panel and into the Admin tab, under a
  **"Company Q&A"** section heading.
- Add a **"Poll Admin"** section below it: a poll indicator (which poll is active — the
  Member Meeting Poll by default), a **company picker**, and a **Release poll** button
  mirroring the Q&A release control. Releasing creates a `poll_release` row and pushes
  the modal to all live viewers (same realtime channel the Q&A focus uses).
- Show currently-released state + a **Close poll** / response counter while live.

## 8. Live poll modal (member-facing)

When a poll is released for a company, every viewer on the live page gets a centered
modal (`live-poll-modal.html`). It renders the visible/targeted questions for that user,
evaluates conditional questions as they answer, and submits one `poll_response` per
question (or one batched submit). After submitting it shows a brief "Thanks — response
recorded" state and can be dismissed. Re-releasing for a new company pops a fresh modal.

Each response stores: `person_record_id`, `application_record_id` (company),
`meeting_id`, `poll_id`, `question_id`, `answer` (JSON), `responded_at`.

## 9. Pipeline Committee dashboard

A committee dashboard mirroring `/committees/:committeeId`
(`src/islands/CommitteeDashboardIsland.jsx`) for the **existing Pipeline Committee**
record (admin: `/admin/membership?tab=committees&committee=pipeline`). Members, Tasks,
Documents, and Notes come from that committee's real data; only the central
"At a Glance" slot is replaced. Sections: **Members,
Tasks, Upcoming Meetings, Documents, Notes**. In the slot where Membership Committee
shows **"At a Glance"**, Pipeline shows **Member Meeting Poll Results** — a table with
one row per meeting:

| Column | Source |
|--------|--------|
| Month & Year | meeting date → `"April 2026"` |
| Companies pitching | comma-separated company names for that meeting |
| Responses | count of `poll_response` rows for that meeting |

Clicking a row → the per-meeting results page (§10).

## 10. Per-meeting results page (spreadsheet-style)

Mimics the linked Google Sheet: **tabs across the top to switch between companies** that
pitched at that meeting. For the selected company, a table with columns:

- **Name** (responder)
- **Role(s)**
- **One column per poll question** (the question label as header; cell shows that
  person's answer — chips for multi-selects, plain text otherwise)

Every column is **sortable** (click the header to toggle ascending/descending) and
**filterable** via a filter row: substring match on Name, role/answer-value match on
Role(s) and each question column. Yes/No and ordinal answers (e.g. Not at all / Maybe /
Likely) sort by rank, not alphabetically. A "Clear filters" control resets the row, and a
live count shows how many responders match.

## 11. Pre-seeded "Member Meeting Poll"

Seed one poll designated as the Member Meeting Poll with these questions, in order:

1. **Should we invite you to a follow-up meeting with {company}?** — radio: *Yes / No*
2. **Are you interested in participating in diligence?** — radio: *Yes / No*
3. **How likely will you directly invest {min check size} in this company?** — radio:
   *Not at all / Maybe / Likely*
4. **Which aspects of this company made a significant contribution to your investment
   answer?** — Multi-select Type 2, options: Personal Investment Focus, Technical
   Validation, Team, Traction, Competitive Advantage, GTM, Valuation, Return Potential

---

## Data model (proposed)

Schema applied by hand per AGENTS.md (no `ALTER`/`CREATE` at startup). New tables:

```
polls
  id (poll_ prefix), name, is_member_meeting_poll (0/1), created_at, updated_at

poll_questions
  id (pq_ prefix), poll_id, sort_order, label, type, options (JSON array),
  required (0/1), help_text,
  conditional_on_question_id (nullable),         -- gating question (§4)
  conditional_operator (nullable),               -- answered | is | is_not | one_of
  conditional_value (JSON, nullable),            -- the answer(s) to match (string or array)
  required_roles (JSON array, nullable),         -- role gate (§5)
  required_fund_family (nullable), required_fund_vintage (nullable),  -- vintage gate
  settings (JSON), created_at, updated_at

poll_releases
  id (prel_ prefix), poll_id, meeting_id, application_record_id,
  released_by (person_record_id), released_at, status (open|closed), closed_at

poll_responses
  id (pres_ prefix), release_id, poll_id, question_id,
  person_record_id, application_record_id, meeting_id,
  answer (JSON), responded_at
```

- All SQL lives in a new `lib/cache-manager/polls.js` domain module, wired via
  `Object.assign` (AGENTS.md §Database Query Centralization). Routes call
  `cacheManager.*`, never `turso.execute`.
- `is_member_meeting_poll` is enforced single-winner in app logic (clear others on set).
- Update `docs/database-schema.md`, `docs/data-query-glossary.md`, and
  `docs/ai-relationship-registry.*` (poll tables are staff-queryable; responses reference
  people/applications/meetings via soft FKs).

## Backend surface (proposed)

- `GET/POST/PUT/DELETE /admin/api/polls` and `/admin/api/polls/:id/questions` — CRUD +
  reorder (`PUT .../questions/reorder`).
- `POST /api/meetings/:meetingId/poll/release` `{ poll_id, application_record_id }` →
  creates `poll_releases`, broadcasts on the meeting realtime channel.
- `POST /api/meetings/:meetingId/poll/close`.
- `GET /api/meetings/:meetingId/poll/active` → payload with token-substituted labels,
  audience-filtered questions for the current user.
- `POST /api/meetings/:meetingId/poll/respond` `{ release_id, answers: [...] }`.
- `GET /api/committees/pipeline/poll-results` → per-meeting rollup (table in §9).
- `GET /api/meetings/:meetingId/poll-results` → per-company responder matrix (§10).

## Resolved decisions

- **Re-release / re-answer** — keep the prior response. A member who already answered for
  a company is **not** re-prompted; their existing response stands. Releasing for a
  *different* company always pops a fresh modal. (So: dedupe responses on
  `person_record_id + application_record_id + meeting_id`.)
- **Pipeline Committee** — use the **existing** Pipeline Committee record
  (`/admin/membership?tab=committees&committee=pipeline`); Members/Tasks/Docs/Notes come
  from its real data.

## Open questions

1. **Anonymity** — results show responder name + roles. Confirm that's acceptable (the
   linked sheet is named, so assuming yes).
2. **Non-investor visibility** — should non-investors see the modal at all if every
   question is role/vintage-gated out? (Proposed: don't pop an empty modal.)
3. **Checkbox type** — single acknowledge checkbox vs. checkbox *group*; the mockup shows
   both. Confirm whether both are needed or just the group.

## Design Guide Compliance (mockup stage)

- Form layout — labeled fields, single column in editors ✓
- Control sizing/spacing — house-style buttons/inputs ✓
- Table density / sticky header — sticky `thead`, compact rows ✓
- Search/input icon spacing — n/a in these mockups
- Dialog/copy minimalism — modal has no helper/meta copy; no technical tokens shown to
  members (tokens render to real values) ✓
- Mobile behavior — to validate at build time (modal + tables need responsive pass)
