---
title: "Live Meeting Chat"
status: draft
owner: jordan
created: 2026-05-30
last_updated: 2026-05-30
home: mockup
---

# Live Meeting Chat

A real-time chat panel in the right sidebar of `/meeting/:slug`, available during a
live (embedded Zoom) committee meeting and replayed read-only when viewing the
recording afterward.

## Background

`MeetingPlaybackIsland.jsx` already renders the meeting page with a resizable
right sidebar (`w-[350px]`, `rightPanelCollapsed`) that holds Chapters /
Transcript / Description sections. The page distinguishes **live** from
**recording** mode via a single source of truth — `isLive` (`src/islands/MeetingPlaybackIsland.jsx:362`,
`isEmbedEligibleMeeting(meeting) && isWithinLiveWindow(meeting)`). Live mode
renders `<EmbeddedZoomPlayer>`; recording mode renders the YouTube `#player`.

Embed-eligible meetings are Committee Meetings on a "portal" committee with a
`zoom_meeting_id`, viewed within the live window — these are exactly the
meetings that should have chat.

The supporting infrastructure already exists:

- **Identity / photos / admin** — `GET /me` returns `name`, `person_record_id`,
  `isAdmin`, and `profilePhotoUrl` (`/api/member/photo/:personRecordId`). Frontend
  hook: `fetchUserInfo()` in `src/lib/shared-nav.js`. Avatar primitive:
  `src/components/shared/AuthorAvatar.jsx`.
- **WebSocket server** — the app already runs `ws@^8` wired into the Express
  `upgrade` handler for Yjs collaborative editing (`index.js`, `lib/yjs-note-server.js`,
  path `/ws/yjs/`). Chat adds a second WS path on the same server.
- **People-picker UX** — `src/islands/PeoplePicker.jsx` does case-insensitive
  substring matching on names; the `@`-mention dropdown reuses this matching
  approach (typing `@rob` matches "Adam Robinson").

## Decisions (confirmed)

1. **`@`-mention scope = chat presence.** The Zoom embed SDK as currently wired
   does not expose a participant roster, so "people in the live meeting" is
   defined as **people currently connected to the chat WebSocket** for this
   meeting. The mention picker is restricted to that live presence set. This is
   self-consistent (you can only @ someone who is actually here) and needs no
   Zoom-identity mapping.
2. **Recording view = read-only replay.** After the live window, the recording
   view shows the chat exactly as it happened — no composer, no new posts, no
   mentions (no one is live). Satisfies "viewable when viewing the recording."
3. **Transport = new WebSocket channel** alongside the existing `/ws/yjs/`
   upgrade, reusing the proven `ws` server and session auth.

## Feature requirements → design

| Requirement | Design |
|---|---|
| Replies, depth 1 | Each message has an optional flat `replies[]`. Replies cannot themselves be replied to (the reply affordance is hidden on replies). Indented thread under the parent. |
| Clickable links (new window), title-rewrite | Links render immediately as `target="_blank" rel="noopener"` with the short URL/host. The server fetches the page `<title>` and broadcasts a rewrite; clients swap the link text in place. Pending state shows a subtle "resolving" style. |
| Thumbs-up + common emoji, full set available | Reaction bar per message; composer emoji button. A top-level "frequently used" set (👍 ❤️ 😂 🎉 🔥 👀 🙏 😮) with an "All emoji" expander. Reactions toggle per-user and show counts. |
| Profile photo + name with comment | Each message shows `AuthorAvatar` (proxied photo or initials fallback) + display name + time. |
| Viewable on recording | Read-only replay (decision 2). |
| `@` mentions, picker restricted to live people, subset match | `@` opens a people-picker-style dropdown filtered to current chat presence; substring match on full name; arrow/Enter/click to select; inserts a mention token. Mentioned users are highlighted; "you" highlighted distinctly. |
| Edit / delete own comments | Hover actions on own messages: edit (inline) and delete (confirm). Edited messages show "(edited)". |
| Admin deletes anyone's | When `isAdmin`, delete is available on every message. |

See `mockup.html` for the interactive demo (toggle Live/Recording and
Member/Admin in the demo bar; type `@rob`, paste a URL, hover messages).

## Data model

Two new tables. **Schema changes are applied manually per the repo rule — no
auto-migration.** Provide `scripts/migrate-add-meeting-chat.sql`, update
`createTables()` in `lib/cache-manager.js` for new environments, and route all
SQL through a new `lib/cache-manager/meeting-chat.js` domain module.

```sql
CREATE TABLE meeting_chat_messages (
    id              TEXT PRIMARY KEY,           -- 'mcm_' prefix
    meeting_id      TEXT NOT NULL,
    parent_id       TEXT,                       -- null = top-level; set = reply (depth 1 only)
    author_person_record_id TEXT NOT NULL,
    author_name     TEXT NOT NULL,              -- denormalized snapshot at send time
    body            TEXT NOT NULL,              -- stored text with mention/link tokens
    mentions        TEXT,                       -- JSON array of person_record_ids
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),  -- UTC instant
    edited_at       TEXT,
    deleted_at      TEXT                        -- soft delete; deleted rows render as a tombstone or are filtered
);
CREATE INDEX idx_mcm_meeting ON meeting_chat_messages(meeting_id, created_at);

CREATE TABLE meeting_chat_reactions (
    message_id      TEXT NOT NULL,
    person_record_id TEXT NOT NULL,
    emoji           TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (message_id, person_record_id, emoji)
);
```

Link-title resolution writes the resolved title back into `body` (replacing the
pending token), so it is durable and shows correctly on the recording replay.

Notes:
- `created_at` / `edited_at` / `deleted_at` are **UTC instants** (per the
  date/timezone rules) — render via `formatFriendlyDateTime`.
- These are internal/operational tables; **no data-query glossary entry needed**
  (chat is not a concept staff query in the data skill). Flag this explicitly in
  the PR.

## Transport & API

**WebSocket channel:** `ws://…/ws/meeting-chat/:meetingId`, added to the
existing `server.on('upgrade', …)` dispatch next to the Yjs handler. The upgrade
handler authenticates via the same session cookie path the Yjs server uses and
rejects users not entitled to view the meeting (reuse the meeting view
eligibility check the page already enforces).

Server responsibilities:
- On connect: register the socket in an in-memory per-meeting room, send the
  current presence list, broadcast a `presence` update to the room.
- **Presence is the `@`-mention universe** — derived from the set of connected
  sockets (person_record_id + name), deduped per person.
- Relay events to the room and persist via `lib/cache-manager/meeting-chat.js`:
  `message`, `edit`, `delete`, `reaction`, `link-resolved`, `presence`.
- On `message` containing a URL: enqueue a server-side unfurl (fetch the page,
  parse `<title>`, timeout + size cap, sanitize), then broadcast `link-resolved`
  with the message id and resolved title. The unfurl runs server-side to avoid
  client CORS and to keep it consistent for all viewers and the replay.

**REST (recording replay + initial load):**
- `GET /api/meetings/:meetingId/chat` — full message tree (top-level + replies +
  reactions) for initial render and read-only replay. Excludes/soft-renders
  deleted messages.

**Authorization** (enforced server-side, not just client):
- View: must be entitled to view the meeting.
- Post / mention / react / reply: only while the meeting `isLive` (server checks
  `meetingHasEnded` / live window — never trust the client).
- Edit / delete own: `author_person_record_id === req.user.person_record_id`.
- Delete any: `req.user.isAdmin`.

## Frontend

New components under `src/components/meetings/chat/`:
- `MeetingChatPanel.jsx` — sidebar panel; opens the WS, loads history via REST,
  holds message state, renders presence + list + composer. Read-only when not live.
- `ChatMessage.jsx` — avatar (`AuthorAvatar`) + name + time, rendered body,
  reactions, hover actions (react / reply / edit / delete by permission), reply thread.
- `ChatComposer.jsx` — autosizing textarea, emoji button, `@`-mention dropdown.
- `MentionPicker.jsx` — substring match over presence list (mirrors `PeoplePicker`
  matching + keyboard nav); restricted to live presence.
- `EmojiPicker.jsx` — common set + "all emoji" expander.

Integration into `MeetingPlaybackIsland.jsx`:
- Add a **Chat** tab/section to the existing sidebar region (the
  `rightPanelCollapsed` / `rightPanelWidth` panel, ~lines 751–874), alongside
  Chapters / Transcript / Description. Show it for embed-eligible meetings
  (live now, or a recording of an eligible meeting that has chat history).
- Live → full chat; recording → read-only replay (composer hidden, replay banner).

**Optimistic UI** (per design guide): own messages, edits, reactions render
locally immediately and reconcile on the WS echo; rollback on failure.

**Token rendering** (browser-safe, in `src/lib/`):
- `{{mention:personId}}` → highlighted `@Name` (distinct style when it's you).
- Links: clickable, `target="_blank" rel="noopener"`; pending vs resolved title.
- Sanitize all rendered HTML with DOMPurify (already a dependency).

**Emoji:** evaluate `emoji-picker-react` / `emoji-mart` (none installed yet) vs a
small curated common-set + native picker. Lean to a lightweight curated set with
an "all emoji" expander to avoid a heavy dependency for a sidebar widget — decide
at build time.

## Edge cases & decisions to settle at build time

- **Deleted message with replies:** render a "message deleted" tombstone so the
  reply thread context survives, vs hard-remove. (Lean: tombstone.)
- **Mention of someone who then leaves:** mention token persists and renders as a
  plain highlighted name; only the *picker* is restricted to live presence.
- **Reconnect / missed messages:** on WS reconnect, re-fetch history since the
  last seen `created_at` to backfill gaps.
- **Notifications:** out of scope for v1 (no email/push on @-mention). Flag as a
  possible follow-up.
- **Rate limiting / abuse:** basic per-socket send throttle on the server.

## Testing

- `lib/cache-manager/meeting-chat.js` — message CRUD, soft-delete, reaction
  toggle, reply depth enforcement (reject `parent_id` pointing at a reply).
- Authorization — post rejected when meeting not live; edit/delete ownership;
  admin delete-any.
- Link unfurl — title extraction, timeout, size cap, sanitization, malformed HTML.
- Token rendering (frontend) — mention/link/pending parsing + DOMPurify.
- Browser smoke test on `localhost:8080`: live meeting → post, @-mention from
  presence, react, reply, edit, delete; admin delete; recording → read-only replay.

## Out of scope (v1)

- @-mention email/push notifications.
- Mentioning people not currently connected to the chat.
- Threaded replies deeper than 1 level.
- Typing indicators, read receipts, message search.
