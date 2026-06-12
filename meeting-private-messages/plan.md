---
title: "Private Messages in Meeting Chat"
status: draft
owner: jordan
created: 2026-06-02
last_updated: 2026-06-02
home: mockup
---

# Private Messages in Meeting Chat

Extend the live meeting chat (see `meeting-live-chat`) so a message can be sent
**privately to one or more people** instead of always going to everyone. Today
every message is broadcast to the whole meeting room ("@everybody"). This adds a
second audience: a private message visible only to its sender and the chosen
recipient(s).

## Design principles

1. **One timeline, not separate DM inboxes.** Private messages stay interleaved
   in the same chronological chat, just visually marked. This matches the
   meeting mental model (you're all in one room) and is the smallest change to
   the existing UX. No new tabs, no conversation switcher.
2. **Audience is a property of each message, chosen at send time** — the Zoom
   meeting-chat "To: Everyone ▾" pattern people already know, extended to allow
   **multiple** recipients (Zoom only does one).
3. **Impossible to send to the wrong audience by accident.** The composer
   changes color (violet) and shows recipient pills + a 🔒 Private label
   whenever the audience is anything other than Everyone. Every private message
   in the timeline carries a lock badge and an "Only visible to you and …" line.
4. **Default is unchanged.** Audience defaults to Everyone; if you never touch
   the selector, behavior is exactly what we ship today.

## UX walkthrough (see mockup.html)

- **Composer audience bar.** A new "To" row sits above the text box with a chip:
  `To: Everyone ▾`. Click it → a popover with **Everyone** at top plus a
  searchable, multi-select list of people currently in the meeting (chat
  presence). Pick one or more → the chip becomes `To: Maria, Devon ▾`, recipient
  pills appear, and the whole composer turns violet with a 🔒 Private marker.
  Placeholder switches to "Private message to Maria, Devon…".
- **Sending.** Optimistic, same as the public path (input clears immediately, you
  can keep typing). The chosen audience **persists** for the next message until
  you change it back to Everyone — so a private side-conversation doesn't reset
  after every line.
- **Timeline rendering.** Private messages get a violet left border, a 🔒 Private
  pill next to the name, and a small "Only you and Maria" audience line. Public
  messages are unchanged.
- **Replies inherit & lock the audience.** Replying to a private message is
  private to the same group (selector locked); replying to a public message is
  public. You can't widen a private thread by accident.
- **Mentions scope to the audience.** In private mode the @-picker only lists the
  message's recipients — you can't @mention someone who can't see the message.
- **Visibility demo.** The "Viewing as" control in the mockup proves the model: a
  private note between Maria & Jordan is gone when you view as Devon; the
  3-person note from Jordan shows for Adam and Roberta but not Devon.

## Implementation contract

### Data model (manual Turso migration — see `project_manual_schema_migrations`)

`meeting_chat_messages` — add one column:

| column       | type | notes |
|--------------|------|-------|
| `visibility` | TEXT NOT NULL DEFAULT `'public'` | `'public'` \| `'private'` |

New table `meeting_chat_message_recipients` (the audience of a private message;
author is implicit and always included):

| column              | type | notes |
|---------------------|------|-------|
| `message_id`        | TEXT NOT NULL | FK → `meeting_chat_messages(id)` ON DELETE CASCADE |
| `person_record_id`  | TEXT NOT NULL | a recipient |
| PK `(message_id, person_record_id)` | | |
| index on `person_record_id` | | for the per-user visibility filter |

> A join table (not a JSON column on the message) is the key choice: the message
> list is fetched **per viewer**, so visibility must be an indexable SQL filter,
> not a post-fetch scan.

### Query — `lib/cache-manager/meeting-chat.js`

`listMeetingChatMessages(meetingId, currentPersonRecordId)` already takes the
viewer (today only used for the reaction `mine` flag). Add a visibility filter:

```sql
WHERE m.meeting_id = ?
  AND ( m.visibility = 'public'
        OR m.author_person_record_id = ?
        OR EXISTS (SELECT 1 FROM meeting_chat_message_recipients r
                   WHERE r.message_id = m.id AND r.person_record_id = ?) )
```

Because the WebSocket sync path already calls this with each client's
`personRecordId`, **per-user filtering on the live broadcast works for free.**
Load recipients alongside the rows and attach `visibility` + `recipients` to each
returned message so the client can render the lock/audience line.

### WebSocket — `lib/meeting-chat-server.js`

- Message-bearing broadcasts must go through the **per-user `sync`** path
  (`sendMeetingChatSyncToClients`), never the broadcast-to-all `event` payload —
  otherwise a private body could leak to every connected client. Audit the
  reaction broadcast: a reaction on a private message must only sync to people
  who can see that message.

### API — `routes/meetings.js`

- **POST** `/chat`: accept `visibility` (`'public'` default) and `recipients`
  (array of recordIds). If `visibility==='private'`, require ≥1 recipient and
  validate each against live presence (reuse the `normalizeChatMentions`
  validation pattern). Persist the message + recipient rows in one transaction.
- **PATCH / DELETE / reactions** on a message id: add a server-side guard that
  the caller can actually *see* the target message (public, author, or
  recipient) before mutating — otherwise a private message id could be probed.
- A reply inherits the parent's visibility + recipients on the server too; don't
  trust the client to set them for a reply.

### Frontend — `src/components/meetings/chat/MeetingChatPanel.jsx`

- `ChatComposer`: add the audience selector (chip + multi-select popover reusing
  presence), the violet "private" state, recipient pills, placeholder + send
  carry the `visibility`/`recipients` into `onSubmit`.
- `handleSubmit`: include `visibility` + `recipients` in the optimistic message
  and the POST body. Keep the audience selection after send; reset to Everyone on
  reply-cancel.
- `ChatMessage`: render the 🔒 Private pill + audience line + violet treatment
  when `message.visibility === 'private'`.
- Reply: lock audience to the parent. Mentions: scope the picker to recipients in
  private mode.
- Reuse the existing mention-notification path (highlight + sound) to notify a
  recipient of a new private message addressed to them.

## Resolved decisions (Jordan, 2026-06-02)

1. **Admin / host visibility — truly private.** Only the sender + recipients ever
   see a private message; admins have no override. No admin oversight path.
2. **Recording playback — same visibility filter.** On replay a viewer sees only
   the private messages they were party to. Private messages are *not* stripped
   from the saved transcript; they're filtered per viewer.
3. **Recipients — currently connected only.** Validate recipients against live
   chat presence at send time, exactly like @mentions today. No messaging
   not-yet-connected members.
4. **Naming — "Private".** UI uses "Private message" / 🔒 Private pill; one word
   on controls per UI-copy rules. Not "DM".
