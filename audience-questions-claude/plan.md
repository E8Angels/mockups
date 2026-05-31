---
title: "Audience Questions (Live Meeting Q&A)"
status: draft
owner: jordan
created: 2026-05-30
last_updated: 2026-05-31
home: variant-a-tabs
---

# Audience Questions — Live Meeting Q&A

A live, crowd-sourced question list in the right sidebar of `/meeting/:slug`, shown
during a live (embedded Zoom) **Member Meeting** while a portfolio company is
presenting. Members type questions, see them appear live, and upvote each other's.
A moderator can re-sort by votes to surface the best ones and check them off as the
speaker answers. After the meeting, the questions persist as a single read-only
document reachable from the company's **Diligence** page.

This feature shares the meeting sidebar with **Live Meeting Chat**
(`../meeting-live-chat/`). The two must be usable independently and, ideally, at the
same time — the design problem this plan exists to solve.

Mockups:

- `variant-a-tabs.html` — conservative single-column sidebar using Info / Chat / Questions tabs.
- `variant-b-split.html` — wider dock that shows Chat and Questions at the same time.
- `variant-c-console.html` — role-split design with a moderator console plus a lightweight member Q&A widget.

## Background

`MeetingPlaybackIsland.jsx` renders the meeting page as a flex row: video stage on
the left, a resizable/collapsible **350px** right sidebar
(`src/islands/MeetingPlaybackIsland.jsx:751-874`, `rightPanelCollapsed` /
`rightPanelWidth`) holding **Chapters / Transcript / Description / Companies
Pitching**. Live vs. recording is one source of truth — `isLive`
(`MeetingPlaybackIsland.jsx:362`). Live renders `<EmbeddedZoomPlayer>`; recording
renders the YouTube `#player`.

Member Meetings already know their associated companies/applications via
`GET /api/meetings/:idOrSlug/related-companies` (pitch `company_events` joined to
the meeting). That endpoint is exactly the list the admin picks from when choosing
**which company the questions are about**.

Reusable infrastructure (same as the chat plan):

- **Identity / admin** — `GET /me` returns `name`, `person_record_id`, `isAdmin`,
  `profilePhotoUrl`. Hook: `fetchUserInfo()` in `src/lib/shared-nav.js`.
- **WebSocket server** — the app runs `ws@^8` on the Express `upgrade` handler for
  Yjs (`index.js`, `lib/yjs-note-server.js`, path `/ws/yjs/`). Chat is adding a
  second path; Questions should ride the **same per-meeting room** rather than open
  a third socket (see Transport).
- **Polling fallback** — `MeetingPlaybackIsland` already polls a 30s `embedClock`
  and a 60s engagement heartbeat; the recording/no-WS path reuses that cadence.

### Open reconciliation with the chat plan

The chat plan defines "embed-eligible" as **Committee** Meetings on a portal
committee with a `zoom_meeting_id`. This feature is described against **Member**
Meetings, the company-pitching surface. The current embed eligibility helper is
committee-only, while the meeting sidebar already renders Member Meeting companies.
Before build, expand or parallel the eligibility rule so questions can appear on
live embedded **Member Meetings** that carry a `zoom_meeting_id`. The questions
feature applies to any live-embedded meeting that has ≥1 associated application —
the company selector is empty and the feature stays hidden otherwise.

## What we're building (requirements → design)

| Requirement | Design |
|---|---|
| Admin opens the question editor on demand during a live meeting | A moderator-only **session control**: pick a company from the meeting's related-companies list and toggle Questions **On**. Opening a company closes the previously-open one (one active company at a time per meeting). |
| Admin chooses which company/application the questions are about | Company selector sourced from `/related-companies`; the active `application_record_id` scopes every question. |
| Users type a question → added to the list | Composer at the bottom of the Questions view; enabled only while the meeting is live **and** a session is open. Optimistic insert, reconciled on the WS echo. |
| Users see questions appear live | WS broadcast of `question.new` to everyone in the meeting room; optimistic for the author. |
| Upvote someone else's question | Up-chevron + count toggle; one vote per person per question (you can't pad your own — see Open questions on self-vote). Optimistic, reconciled on `question.vote`. |
| Choose sort: arrival order **or** by votes desc | Sort toggle **Newest / Top**. **Default = Newest** so the list doesn't reshuffle under people as they vote. "Top" sorts votes desc, then `created_at` asc (stable tiebreak = arrival order). |
| See upvote counts | Count rendered in the vote pill. |
| Moderator checks off answered questions (self-view only) | A check affordance that strikes/dims the row. **Not persisted, not broadcast** — local component state (optionally `localStorage` keyed by question id so a refresh keeps it). |
| Works with or without chat visible | The three variants differ exactly here — tabbed swap, side-by-side columns, or a role-split console. |
| Admin turns off one company, turns on the next | Session control supports **Switch company** / **Close**; switching opens the next application and deactivates the prior. Prior questions are retained, not deleted. |
| After the meeting: a single questions document on the Diligence page | New read-only **Audience Questions** panel in the Diligence RightRail accordion (`src/islands/diligence-tab/RightRail.jsx`), keyed by `application_record_id`, sorted by votes, grouped by meeting/date. |

## Three design directions

The hard part is sharing ~350–700px of sidebar with chat while serving two very
different users (a member who glances + upvotes, and a moderator running the room).
Each variant is a different answer; see the linked mockups.

### Variant A — Segmented Tabs (single column) · `variant-a-tabs.html`
Keep the existing 350px panel. A segmented control at the top swaps **Info · Chat ·
Questions** (Questions shows a live count badge when a session is open). The
Questions tab is a self-contained column: moderator session banner (company chip +
On/Off + Switch) → **Newest/Top** sort toggle → scrollable list (vote pill • text •
author/time • moderator check) → composer.

- **Pro:** smallest change, drops straight into the existing collapse/resize panel,
  trivially mobile. Mirrors the tab pattern the chat mockup already introduced.
- **Con:** chat and questions are mutually exclusive — a moderator watching chat
  can't see questions at the same time.
- **Best when:** we want the lowest-risk v1 and accept tab-switching.
- **Design recommendation:** best v1 if chat and questions ship close together but
  we want the fewest moving parts in the existing 350px rail.

### Variant B — Expanding Split Dock (multi-column) · `variant-b-split.html`
When a session opens (or the user clicks **Columns**), the sidebar widens from
350px to ~680px and splits into two columns: **Chat** | **Questions**, each with its
own header/scroll. A layout toggle collapses back to a single column (Questions
full-width, chat hidden) — that's the "without chat" mode. The video stage shrinks
to make room. Below a width threshold it falls back to Variant-A tabs.

- **Pro:** chat + questions visible simultaneously; great for a moderator on a wide
  screen. Directly satisfies "viewable with or without the chat."
- **Con:** eats horizontal space from the video; more layout state; needs the
  responsive fallback.
- **Best when:** moderators run meetings on large displays and want both streams.
- **Design recommendation:** strongest general-purpose design if we can tolerate a
  wider rail on desktop. It directly answers "viewable with or without chat" while
  keeping the member experience in the same place.

### Variant C — Moderator Console + inline ask (role-split) · `variant-c-console.html`
Decouple the two audiences. **Members** get a lightweight inline Q&A *inside the
company card* in the Info tab — top 3 questions, a one-line "Ask a question" box, and
"View all (N)" — so casual asking/upvoting never competes with the chat tab.
**Moderators** get an **Open Console** button that launches a wide overlay docked
left of the video: a two-pane reading view (Incoming/Newest stream | Top-Voted with
large type and big counts), session controls as company chips across the top
(On/Off, Switch, Close), and check-off that slides answered questions into a
collapsed "Asked" group. The **same console, read-only**, is the post-meeting
archive surfaced on the Diligence page.

- **Pro:** optimizes each role; the moderator tool is genuinely usable for running a
  room; the archive view is free (console in read-only mode).
- **Con:** most to build (inline widget + console + archive sharing one component);
  two surfaces to keep in sync.
- **Best when:** we believe the moderator experience deserves a first-class surface
  and the member experience should stay minimal.

## Data model

Three tables. **Schema changes are applied manually — no auto-migration** (repo
rule). Provide `scripts/migrate-add-meeting-questions.sql`, update `createTables()`
in `lib/cache-manager.js` for new environments, and route all SQL through a new
`lib/cache-manager/meeting-questions.js` domain module.

```sql
CREATE TABLE meeting_questions (
    id                       TEXT PRIMARY KEY,          -- 'mq_' prefix
    meeting_id               TEXT NOT NULL,
    application_record_id    TEXT NOT NULL,             -- which company the question is about
    author_person_record_id  TEXT NOT NULL,
    author_name              TEXT NOT NULL,             -- denormalized snapshot at ask time
    body                     TEXT NOT NULL,
    created_at               TEXT NOT NULL DEFAULT (datetime('now')),  -- UTC instant; chronological sort
    deleted_at               TEXT                       -- soft delete (admin moderation)
);
CREATE INDEX idx_mq_meeting_app ON meeting_questions(meeting_id, application_record_id, created_at);

CREATE TABLE meeting_question_votes (
    question_id              TEXT NOT NULL,
    person_record_id         TEXT NOT NULL,
    created_at               TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (question_id, person_record_id)         -- one vote per person per question
);

-- Which company is "live for questions" right now, and the history of opens.
CREATE TABLE meeting_question_sessions (
    meeting_id               TEXT NOT NULL,
    application_record_id    TEXT NOT NULL,
    opened_at                TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at                TEXT,
    is_active                INTEGER NOT NULL DEFAULT 1,  -- at most one active row per meeting
    PRIMARY KEY (meeting_id, application_record_id)
);
```

- **Upvote count** = `COUNT(*)` from `meeting_question_votes` per question; `myVote`
  = does a row exist for `req.user.person_record_id`.
- **Top sort** = `vote_count DESC, created_at ASC` (arrival order as stable tiebreak).
- **Active company** = the `is_active=1` row in `meeting_question_sessions`. Opening
  company B sets B active and flips any other active row to `is_active=0,
  closed_at=now`.
- **Check-off (answered)** is **not** in the schema — it's local self-view state
  (component state + optional `localStorage`), never persisted or broadcast.
- `created_at` columns are **UTC instants** (date/timezone rules) — render with
  `formatFriendlyDateTime`.
- These are operational tables; **no data-query glossary entry** needed (audience
  questions aren't a concept staff query in the data skill). Flag this in the PR.

## Transport & API

**WebSocket — share one per-meeting room with chat.** Rather than a third socket,
add a `questions` message namespace to the meeting room the chat plan is already
opening (or, if built first, define `ws://…/ws/meeting/:meetingId` carrying both).
Coordinate with `../meeting-live-chat/`. Events relayed to the room and persisted
via `lib/cache-manager/meeting-questions.js`:

- `question.new` — `{ id, applicationRecordId, body, author…, created_at }`
- `question.vote` — `{ questionId, voteCount, voterPersonId, added: bool }`
- `question.session` — `{ applicationRecordId, action: 'open' | 'close' }`
- `question.delete` — admin soft-delete (optional v1)

On WS reconnect, re-fetch via REST since the last seen `created_at` to backfill.

**REST (initial load, recording/no-WS path, archive):**

- `GET /api/meetings/:meetingId/questions?applicationRecordId=…` — questions +
  `voteCount` + `myVote`, plus the active session. Omit `applicationRecordId` to get
  all, grouped by application (post-meeting archive).
- `POST /api/meetings/:meetingId/questions` — `{ applicationRecordId, body }`.
- `POST /api/meetings/:meetingId/questions/:id/vote` /
  `DELETE …/vote` — toggle the caller's vote.
- `POST /api/meetings/:meetingId/questions/session` —
  `{ applicationRecordId, action }` (admin only).

**Authorization (enforced server-side, never trust the client):**

- View: entitled to view the meeting.
- Ask / vote: meeting `isLive` **and** a session is open for that
  `application_record_id` (server checks `meetingHasEnded` / live window + active
  session — see date/timezone rules; never compare wall-clock columns to UTC
  `datetime('now')`).
- Session open/close/switch: `req.user.isAdmin`.
- Delete any (optional): `req.user.isAdmin`.

**Optimistic UI** (design guide): the author's own question, and anyone's vote
toggle, render locally immediately and reconcile on the WS echo; rollback on failure.

## Post-meeting archive (Diligence page)

Add an **Audience Questions** panel to the Diligence RightRail accordion
(`src/islands/diligence-tab/RightRail.jsx`, alongside Reference Information /
Supporting Documents / Transcripts & Recordings / Meeting Notes). New component
`src/islands/diligence-tab/AudienceQuestionsPanel.jsx`, keyed by
`application_record_id`:

- Read-only list of all questions ever asked about this application, default sorted
  **Top** (votes desc), grouped by meeting + date (`formatFriendlyDate`).
- Shows vote counts and asker (subject to the anonymity decision below).
- Variant C reuses its console in read-only mode here instead of a bespoke panel.

## Edge cases & decisions to settle at build time

- **Self-vote:** can you upvote your own question? Lean **no** (or auto-count the
  author as 1) to keep "top" meaningful. Decide and enforce server-side.
- **Anonymity:** show the asker's name (like chat) or keep questions anonymous to
  encourage candor and vote-on-merit? The mockups show attributed; flag for a
  product call. The archive's attribution follows whatever we choose.
- **Multiple companies open at once:** disallowed in v1 (one active per meeting).
  Confirm that matches how moderators actually run the room.
- **Switching company mid-stream:** prior questions persist and remain in the
  archive; only the *active* session moves. Composer disables for the closed company.
- **Edit/delete own question:** out of scope v1 unless cheap; admin soft-delete for
  moderation is the safety valve.
- **Duplicate questions:** no dedup in v1; upvoting is the natural merge.
- **Rate limiting:** basic per-socket throttle on ask + vote.

## Testing

- `lib/cache-manager/meeting-questions.js` — create question, vote toggle
  (idempotent, one-per-person), session open flips prior active, top-sort ordering,
  soft delete.
- Authorization — ask/vote rejected when not live or no open session; session
  control rejected for non-admins.
- Date/timezone — live-window check uses wall-clock comparison, not UTC
  `datetime('now')` (regression guard).
- Frontend — optimistic insert/vote + reconcile + rollback; Newest vs Top sort
  stability; check-off is local only (survives refresh via localStorage, never hits
  the network).
- Browser smoke test on `localhost:8080`: live meeting → admin opens company →
  member asks → second member upvotes (count updates live) → moderator switches sort
  to Top → checks one off → admin switches to next company → recording view is
  read-only → Diligence page shows the archived list.

## Out of scope (v1)

- Notifications / email on new questions.
- Threaded answers or written responses to questions (this is upvote-and-ask only).
- Cross-meeting question merging.
- Anonymous-with-reveal or reputation weighting on votes.
