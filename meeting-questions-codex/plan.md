---
title: "Meeting Questions Codex"
status: draft
owner: jordan
created: 2026-05-31
last_updated: 2026-05-31
home: rail-queue
---

# Meeting Questions Codex

## Implementation Source Of Truth

Implement [rail-queue.html](rail-queue.html) as the pixel-perfect source of truth. Match the mockup's layout, spacing, labels, control order, visual states, and interaction affordances. Do not improvise new UI copy, helper text, labels, alternate controls, or extra explanatory states unless the mockup is updated first.

The mockup shows the target desktop state. Mobile should preserve the same controls and hierarchy, stacked vertically as needed, without changing desktop layout.

## App Context

The feature belongs on the meeting playback page for live embedded Zoom Member Meetings. The current React entry point is `src/islands/MeetingPlaybackIsland.jsx`, which renders the video stage on the left and a resizable right rail on the right. The current right rail already contains meeting-side content such as meeting details and companies pitching.

The Meeting Panel becomes one of three top-level right-rail panels:

- `Agenda`
- `Chat`
- `Meeting Panel`

The Meeting Panel owns live Q&A. Chat remains a separate panel. The implementing agent should add the panel switcher to the meeting right rail and render this feature inside the `Meeting Panel` tab.

Presenting companies/applications come from the existing meeting-related companies data. Use `GET /api/meetings/:idOrSlug/related-companies` as the source for all company/application choices in this feature.

## Product Behavior

Questions exist for every company/application associated with the meeting. There is no "open questions for this company" state. The admin chooses which company to focus and release to attendees, but users may manually switch to another company from the Meeting Panel.

During Q&A, an admin:

- Selects the company/application to focus.
- Assigns one or more Moderators for that company/application.
- Presses `Release`.

`Release` sends a one-time event to attendees that switches their right rail to `Meeting Panel` and sets the released company as the default selected company. It does not lock attendees to Meeting Panel. Attendees may switch tabs or switch companies afterward.

Members can:

- Submit questions.
- See questions appear live.
- Upvote questions.
- Remove their own upvote by clicking an already-upvoted question.
- Switch to another company with the compact `Switch` dropdown in the company header.

Question authors are visible in the live list and archive. The author receives an implicit first vote.

## Mockup UI Contract

The visible controls and labels in the mockup are intentional:

- Top tabs: `Agenda`, `Chat`, `Meeting Panel`.
- Admin section label: `Admin: focus Q&A`.
- Admin action button: `Release`.
- Moderator label: `Moderator` when exactly one person is assigned, `Moderators` when more than one person is assigned.
- Moderator search placeholder: `Find a Moderator...`.
- Company header: company logo/initials, company name, `Moderator(s): ...`, and compact `⇄ Switch` button.
- Company switch dropdown: list of meeting companies, active company highlighted.
- Sort row: question count on the left; `Sort by` plus `Time` / `Votes` toggle on the right.
- Composer: question textarea and `Add Question` button.

Do not add explanatory status text such as "viewing questions", "one-time panel switch", or long help copy to the UI.

## Permissions

View access follows the existing meeting page access rules.

Admin-only:

- Company focus selector in the admin section.
- `Release`.
- Moderator assignment.

Moderator-only, scoped to the selected company/application:

- Checkmark button for marking a question as asked.

All attendees:

- View questions.
- Submit questions while the live meeting accepts questions.
- Upvote or remove their own upvote.
- See author names.
- See asked state.
- Manually switch the company shown in the Meeting Panel.

## Moderators

Moderator assignment is scoped to `meeting_id` and `application_record_id`.

Use the app's standard people picker behavior and person pills:

- Search people by name.
- Add selected people as pills.
- Remove a Moderator with the pill remove control.
- Render label text as `Moderator` for one assigned person and `Moderators` for more than one assigned person.

Moderators can mark questions as asked. Everyone sees asked questions as checked, dimmed, and struck through, matching the mockup.

## Question Sorting

Questions support two sort modes:

- `Time`: arrival order by `created_at` ascending.
- `Votes`: vote count descending, then `created_at` ascending as the stable tie-breaker.

Default sort is `Time`, so the list does not jump while people are reading. The mockup shows `Votes` selected to demonstrate reorder animation.

## Vote Control

Each question has a narrow vote box on the left:

- Top area: current vote count.
- Bottom area: clickable thumbs-up.
- Voted-by-me state: teal border, teal count background, filled thumbs-up area.
- Not-voted-by-me state: neutral border and gray thumbs-up area.
- Clicking a question the user has already upvoted removes that user's vote and decrements the count.

The author receives an implicit first vote. Persist this as product behavior; do not make the author manually upvote their own question.

## Animation

When a question's vote count increases, animate the count with a train-station-board style flip. The mockup uses `flipCount` to show the intended feel.

When the list is sorted by `Votes` and a vote changes row order, animate the moved row into its new position. The mockup uses `rowSwap` to show the intended feel. Implementation can use FLIP-style layout animation, CSS transition groups, or an equivalent React animation approach, but the result should match the mockup: compact, quick, and not distracting.

Respect reduced-motion preferences if the app has an established pattern for that.

## Data Model

Schema changes must use the repo's manual migration process. Do not auto-migrate at app startup.

Recommended tables:

```sql
CREATE TABLE meeting_questions (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    application_record_id TEXT NOT NULL,
    author_person_record_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    asked_at TEXT,
    asked_by_person_record_id TEXT,
    deleted_at TEXT
);

CREATE INDEX idx_meeting_questions_meeting_app
ON meeting_questions(meeting_id, application_record_id, created_at);

CREATE TABLE meeting_question_votes (
    question_id TEXT NOT NULL,
    person_record_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (question_id, person_record_id)
);

CREATE TABLE meeting_question_moderators (
    meeting_id TEXT NOT NULL,
    application_record_id TEXT NOT NULL,
    person_record_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (meeting_id, application_record_id, person_record_id)
);

CREATE TABLE meeting_question_focus (
    meeting_id TEXT PRIMARY KEY,
    application_record_id TEXT NOT NULL,
    released_at TEXT,
    released_by_person_record_id TEXT
);
```

Notes:

- `created_at`, `asked_at`, and `released_at` are UTC instants.
- Vote count equals explicit vote rows plus the author's implicit first vote.
- Asked state is shared and persisted.
- Soft-delete is included for future moderation safety.

SQL belongs in a new cache-manager domain module such as `lib/cache-manager/meeting-questions.js`, wired through `lib/cache-manager.js`. Route files should call cache-manager methods, not `turso.execute` directly.

## API Shape

Suggested REST endpoints under the existing meetings API:

- `GET /api/meetings/:idOrSlug/questions`
  - Returns related companies, current focus company, questions grouped or filtered by `application_record_id`, vote counts, `myVote`, Moderators, and `myRole`.
- `POST /api/meetings/:idOrSlug/questions`
  - Body: `{ applicationRecordId, body }`.
  - Creates a question for the selected company/application.
- `POST /api/meetings/:idOrSlug/questions/:questionId/vote`
  - Adds the caller's vote.
- `DELETE /api/meetings/:idOrSlug/questions/:questionId/vote`
  - Removes the caller's vote.
- `POST /api/meetings/:idOrSlug/questions/:questionId/asked`
  - Moderator-only. Marks the question asked.
- `DELETE /api/meetings/:idOrSlug/questions/:questionId/asked`
  - Moderator-only. Clears asked state if needed.
- `PUT /api/meetings/:idOrSlug/questions/moderators`
  - Admin-only. Body: `{ applicationRecordId, personRecordIds }`.
- `POST /api/meetings/:idOrSlug/questions/release`
  - Admin-only. Body: `{ applicationRecordId }`.
  - Sets focus company and broadcasts the one-time panel switch.

Use camelCase request bodies for internal app APIs unless the surrounding route pattern requires otherwise.

## Realtime Behavior

Use the meeting live WebSocket channel if available, or create one compatible with the live meeting chat channel. Do not open multiple unnecessary sockets for chat and questions if one per-meeting room can carry both.

Events:

- `questions.released`: admin pressed `Release`; clients switch right rail to `Meeting Panel` and select the released company.
- `questions.questionCreated`: add a new question.
- `questions.voteChanged`: update vote count and `myVote`; run flip animation on changed count.
- `questions.orderChanged`: when sorted by `Votes`, animate changed row order.
- `questions.askedChanged`: update shared asked state.
- `questions.moderatorsChanged`: update Moderator pills and permissions.

On reconnect, clients should re-fetch REST state to avoid missed events.

## Frontend Integration

Likely components:

- `MeetingPanelTabs` for `Agenda`, `Chat`, `Meeting Panel`.
- `MeetingQuestionsPanel` for the right-rail Q&A surface.
- `MeetingQuestionsAdminControls` for company focus, `Release`, and Moderator picker.
- `MeetingQuestionRow` for vote box, author/time, body, and asked control/status.
- `MeetingQuestionComposer`.
- `MeetingCompanySwitchMenu`.

Keep browser-safe shared helpers in `src/lib/`; do not import from server-only `lib/` into React components.

All inputs must include:

- `autoComplete="off"`
- `data-lpignore="true"`
- `data-form-type="other"`

## Phase 2 Archive

Post-meeting archive is phase 2. Stub the entry point in Diligence Reference Information as `Audience Questions`.

Expected future behavior:

- Read-only list of questions for the application.
- Author visible.
- Vote count visible.
- Asked state visible.
- Grouped by meeting/date when multiple meetings exist.

## Testing

Backend:

- Create question with implicit author vote.
- Add/remove vote idempotently.
- `Votes` sort uses vote count desc, then `created_at` asc.
- Admin can set Moderators for one company without affecting another company.
- Moderator can mark asked; non-Moderator cannot.
- `Release` updates focus and emits/broadcasts the panel switch event.

Frontend:

- `Release` switches current attendee panel to `Meeting Panel` once.
- Manual `Switch` dropdown changes the displayed company.
- Vote count flips on increment.
- Rows animate when `Votes` order changes.
- Voted vs not-voted visual states match the mockup.
- Moderator sees checkmark controls; non-Moderator sees only asked status.
- Form controls include autofill suppression attributes.

Browser smoke:

- Live meeting page loads with right rail tabs.
- Admin selects company, assigns Moderators, presses `Release`.
- Attendee panel switches to Meeting Panel.
- Member submits question.
- Another member upvotes.
- Vote count updates live and animates.
- Moderator marks question asked.
