---
title: "Live Chat Codex"
status: draft
owner: jordan
created: 2026-05-31
last_updated: 2026-05-31
home: mockup
---

# Live Chat Codex

## Implementation Contract

Use `mockup.html` in this folder as the pixel-perfect interaction and layout spec. The plan below supplements the mockup with data, permission, integration, and testing details. If the plan and mockup appear to conflict on layout, spacing, controls, or interaction timing, prefer the mockup and update the plan only if the implementation needs clarification.

## Scope

Add real-time chat to the meeting playback experience reached from `/meetings` and rendered by `MeetingPlaybackIsland.jsx` for `/meeting/:slug` and `/meeting/:slug/live`.

The right sidebar should use top tabs:

- **Background** — existing meeting sidebar/background content.
- **Chat** — the new live chat panel.

The mockup shows the Chat tab selected. Preserve the existing background content by moving it behind the Background tab rather than deleting it.

## UX Requirements

- Chat is available during live embedded-Zoom meetings and remains viewable in read-only mode when viewing the recording.
- Live mode shows message history, reactions, replies, hover actions, mention picker, and the composer.
- Recording mode shows message history and reactions read-only; hide composer and live-only hover actions.
- Do not show a persistent “people in this meeting” bar. Presence is used by the mention picker and server authorization only.
- Top-level messages and replies use the same compact layout shown in the mockup: avatar + author/timestamp on the first line, message body underneath at full available width.
- Replies are single-level only, with a light indent and no vertical rule. The reply control appears only on hover for top-level messages.
- Hover actions:
  - Reply, edit, and delete are icon buttons with tooltips.
  - Emoji reaction action remains a simple emoji button without tooltip.
  - Edit/delete appear for the current user’s own messages.
  - Admins can delete anyone’s messages.
- Edit reuses the normal composer: load the existing message into the composer, switch Send to Save, and show a compact editing context row with cancel.
- Delete opens a real confirmation modal. Do not use `window.confirm`.
- Composer defaults to a three-line textarea, auto-expands for longer text, and places emoji + Send below the textarea so the text field keeps full sidebar width.
- Links render immediately as clickable links opening in a new window. Initially show a short URL/host; after server-side title resolution, rewrite the visible text using the page `<title>`.
- Existing reaction pills are clickable. Clicking an existing reaction adds the current user to it and increments the count; clicking again toggles the current user off and decrements the count.
- `@` mentions are restricted to people currently present in the live meeting chat. Matching is substring-based, so typing `@rob` can match `Adam Robinson`.
- The mention picker should reuse the existing people-picker behavior and visual style. Do not show a “People in this meeting” header.
- Resolved person names, including authors and `@` mentions, open the existing lightweight member profile viewer.

## Reuse Requirements

- Reuse `PersonProfileModal` from `src/components/tiles/MemberDirectoryTile.jsx` for the lightweight member profile viewer. It is already used by the full member directory, the member-directory tile, diligence-team tile, and annual-fund results.
- If `PersonProfileModal` should not live under `components/tiles/`, move it to a shared component path and update all existing imports in the same implementation.
- Reuse `PeoplePicker` behavior/result rendering for mentions. If the current component cannot accept a supplied live-presence list or lower query threshold cleanly, extend it rather than creating a parallel people picker.
- Reuse `AuthorAvatar` or the same proxied photo pattern for chat avatars. Never expose raw Google Drive URLs.
- Use `AlertDialog` for delete confirmation; async delete must use a plain `Button` and close manually after success.

## Data Model

Create manual migration SQL. Do not auto-migrate on startup.

Recommended tables:

```sql
CREATE TABLE meeting_chat_messages (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL,
    parent_id TEXT,
    author_person_record_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    mentions TEXT,
    sequence INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    edited_at TEXT,
    deleted_at TEXT
);

CREATE INDEX idx_meeting_chat_messages_meeting_sequence
    ON meeting_chat_messages(meeting_id, sequence);

CREATE TABLE meeting_chat_reactions (
    message_id TEXT NOT NULL,
    person_record_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (message_id, person_record_id, emoji)
);
```

Notes:

- Store `created_at`, `edited_at`, and `deleted_at` as UTC instants.
- Use `sequence` for deterministic replay ordering in addition to timestamps.
- Keep deleted parent comments as tombstones when they have replies. Preserve child replies.
- Route all SQL through a new `lib/cache-manager/meeting-chat.js` domain module.
- Update `createTables()` only for new-environment setup.
- Update `docs/database-schema.md`. No data-query glossary update is expected unless the implementation intentionally makes chat staff-queryable.

## API And Transport

- WebSocket: authenticated channel for live events and presence, e.g. `/ws/meeting-chat/:meetingId`.
- REST initial/replay load: `GET /api/meetings/:meetingId/chat`.
- Server-side events should cover: presence, message create, edit, delete, reaction toggle, link resolved, and reconnect/history sync.
- Server must authorize all actions:
  - View: user may view the meeting.
  - Create/reply/edit/react: only while the meeting is live.
  - Edit/delete own: author only.
  - Delete any: admin only.
- Do not trust client live/recording state for permissions.

## Replies

- UI exposes Reply only for top-level messages.
- If a client submits a reply to a reply, canonicalize it to the same top-level parent and store it as a peer reply. Do not reject or drop the user’s reply.
- Store only one reply level in API responses.

## Mentions And Notifications

- Mention picker source is the current meeting chat presence list, deduped by person record id.
- Mention tokens should persist by person record id and render as names.
- Clicking a rendered mention opens the lightweight profile viewer.
- If the mentioned user is viewing the meeting page, play a sound and flash the message three times. Scroll the message into view first if needed.
- If the mentioned user is on the meeting page but not on the Chat tab, flash the Chat tab and play the sound.
- No email or push notification is required for v1.

## Link Title Resolution

- Resolve links server-side to avoid CORS and keep replay durable.
- Render links immediately with target `_blank` and `rel="noopener"`.
- Fetch `<title>` with timeout, redirect limit, response size cap, and content-type validation.
- Sanitize resolved titles.
- Broadcast a link-resolved event and persist the resolved title so recordings replay the rewritten text.

## Frontend Integration

Suggested components under `src/components/meetings/chat/`:

- `MeetingChatPanel.jsx`
- `ChatMessage.jsx`
- `ChatComposer.jsx`
- `MentionPicker` wrapper or `PeoplePicker` extension for live-presence mentions
- `EmojiPicker.jsx` or a lightweight common emoji selector

Integrate in `MeetingPlaybackIsland.jsx` by replacing the current one-panel sidebar with a tabbed sidebar:

- Background tab: existing meeting sidebar/background content.
- Chat tab: new chat panel.

Use optimistic UI for low-risk actions:

- Message create/reply
- Edit
- Reaction toggle

Rollback or reconcile on server failure/echo.

## Tests

Add/update tests in the same implementation:

- Cache-manager tests for message create, edit, tombstone delete, admin delete, reaction toggle, deterministic sequence ordering, and reply canonicalization.
- Route/WebSocket authorization tests for live-only actions, owner edit/delete, admin delete-any, and view permissions.
- Link resolver tests for title extraction, timeout, size cap, redirects, malformed HTML, and sanitization.
- Frontend tests for token rendering, mention selection from presence, reaction toggling, composer edit mode, delete modal, recording read-only mode, and profile viewer opening from author/mention.
- Browser verification on `localhost:8080` if the user’s dev server is already running. Do not start or stop the user’s dev server unless explicitly asked.
