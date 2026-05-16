---
title: "Membership Dashboard: Meetings Code Cleanup"
status: building
owner: jordan
created: 2026-05-16
last_updated: 2026-05-16
---

# Handoff prompt: clean up dead meetings code in MembershipDashboardIsland.jsx

> **For the user:** copy the block below and paste it as the initial message to a fresh Opus agent in this repo. Self-contained.

---

```
You are working in /Users/jordanschwartz/dev/e8-portal on branch `main`. The `unified-calendar` branch was merged to main, so all of the unified-calendar work (new `/admin/calendar` surface, retired old surfaces, extracted shared dialogs, etc.) is now in main. You'll commit directly to main on this task. Read AGENTS.md and CLAUDE.md before any work.

# Context — read this first

A change from the `unified-calendar` branch ("Retire old calendar/meetings entry points") deleted the entire meetings-tab UX from `src/islands/MembershipDashboardIsland.jsx`:

- Removed the meetings entry from `allowedTabs`.
- Removed `'meetings'` from URL allowlists in `getInitialMode` and the `popstate` handler.
- Removed the `mode === 'meetings'` doc-title label.
- Removed the meetings dispatch in `handleModeChange` and in the mode-load effect (the `else if (mode === 'meetings') { loadMeetings(); loadZoomAccounts(); }` branch).
- Removed two meetings-only effects (auto-open new-meeting dialog from `?openNewMeeting=1`; Google/Zoom re-auth retry).
- Removed the meetings JSX render block (the deprecation banner + `<MeetingsCalendarView>` invocation, ~21 lines) at what was around lines 5371–5391.
- The URL `/admin/membership?tab=meetings` now `<Navigate replace>`s to `/admin/calendar?scope=membership` immediately after the `if (loading)` early-return, so the meetings render path is unreachable from this island.

What was NOT touched (and is your scope):

A large amount of meetings-specific state, handlers, helpers, refs, lazy-loaded components, and imports inside `MembershipDashboardIsland.jsx` that the deleted code was the only consumer of. The previous agent flagged ~200 lingering references but did not remove them because the blast radius made the change risky to do as a "while-I'm-here" sweep. Your job: do that cleanup carefully.

# Goal

Remove every meetings-only identifier in `src/islands/MembershipDashboardIsland.jsx` that is no longer referenced by any reachable code path inside this file. Do NOT touch other tabs (members, engagements, etc.). Do NOT touch any other file unless your work invalidates an import of `MembershipDashboardIsland` itself, which is very unlikely.

The identifiers you'll be evaluating include (non-exhaustive — confirm via grep before assuming):
- `meetings`, `setMeetings` and related list state (`meetingsLoading`, `meetingsPage`, `meetingsTotal`, `meetingsSearch`, `meetingsFilter`, `meetingsTypeFilter`, etc.)
- Pagination state tied to meetings (`paginatedMeetings`, `meetingsCount`, anything similar)
- Selection state for bulk meeting delete (`selectedMeetingIds`, etc.)
- Dialog state (`openMeetingDialog`, `editingMeeting`, `meetingDialogMode`, etc.)
- Zoom state if it was ONLY meetings-related (`zoomAccounts`, `zoomAccountsLoading`, etc.) — be careful here; verify nothing else uses it
- Handlers: `loadMeetings`, `loadZoomAccounts`, `handleDeleteMeetingsClick`, `handleConfirmDeleteMeetings`, `openNewMeetingDialog`, `handleMeetingsPageChange`, etc.
- Lazy-imported components used only by meetings tab: `MeetingDialog`, `MeetingsCalendarView`, etc.
- Imports near the top of the file that are only consumed by meetings code (icons, helpers, types)
- Computed refs (`useMemo`, `useCallback`) whose only consumers were meetings code

# Approach — staged, with tests between each stage

## Stage 0: enumerate

1. `cd` into `/Users/jordanschwartz/dev/e8-portal`. Confirm you're on `main` (`git rev-parse --abbrev-ref HEAD`) and that it's clean (`git status`). Confirm the file is `src/islands/MembershipDashboardIsland.jsx`.
2. Read the file end-to-end. Build a mental map of which state slots and handlers each tab uses.
3. Run `git log -p -- src/islands/MembershipDashboardIsland.jsx | head -300` to read the recent commits' diffs (the deletion of the meetings-tab render, dispatchers, and allowlist entries) so you understand exactly what was removed.
4. Build an explicit list of identifiers you BELIEVE are dead. Save it to scratch. Each entry has: identifier name, line of definition, the COMPLETE list of every line that references it.
5. For each identifier, classify:
   - **DEFINITELY DEAD**: every reference is inside MembershipDashboardIsland.jsx, and every reference is itself in a dead block (or trivially unreachable via the deleted code paths).
   - **MAYBE DEAD**: some reference is in a place I'm not sure about — flag for human review.
   - **ALIVE**: at least one reference is reachable from a non-meetings tab.

The classification step is the most important part of this task. Do not delete anything you classified MAYBE.

## Stage 1: delete the DEFINITELY DEAD state slots

State slots are the lowest-risk to remove first because if you accidentally remove a still-used one, React will throw immediately at runtime and the tests/build will likely catch it.

After each batch of deletions:
- `npx vite build` (with the nvm PATH export from AGENTS.md)
- `npx jest --testPathIgnorePatterns="/node_modules/"` — confirm the 4-suite baseline holds (`__tests__/routes/diligence.test.js`, `__tests__/src/url-param-preservation.test.js`, `__tests__/person-emails-log-email.test.js`, `__tests__/entrepreneur-message-routing.test.js`). No new failures.

Commit after each clean batch with a descriptive message.

## Stage 2: delete the DEFINITELY DEAD handlers and helpers

Same pattern. Run build + tests after each batch.

## Stage 3: delete dead imports

Including the lazy-loaded components (`MeetingDialog`, `MeetingsCalendarView`) if they are no longer rendered anywhere in this file.

Run build + tests.

## Stage 4: list MAYBE-DEAD items in your final report for the user

Do NOT delete MAYBEs without the user's explicit confirmation. Quote each one with file:line of definition and every reference, plus your reasoning for why it's ambiguous.

# Cross-file vigilance

Before deleting any identifier, also run:
- `rg -n "<identifier>" src/ __tests__/ e2e/ --hidden`

If a test file references the identifier you're about to remove, decide whether the test is testing meetings behavior (now dead — delete the test) or whether it's testing something general (don't delete; the test fails at the assertion that no longer applies → update the test).

# Reflection / dynamic dispatch check

Before declaring an identifier definitely dead, search for indirect references:
- `rg -n "['\"]meetings['\"]"` — string literals that might dispatch into a deleted code path
- Lookups through the props or window
- Anywhere code does `state[someVar]` or `obj[modeName]` — those can hide references

This codebase is mostly direct, but checking is cheap.

# Test infrastructure note

The repo has Jest with `testEnvironment: 'node'` — pure Node tests pass with `npx jest`. There is NO React component test infrastructure (jsdom + babel-jest + @testing-library/react are not installed). Helper-only tests are the rule. Do not introduce React-render tests; if you delete a test that was for meetings UI behavior, just delete it without trying to replace it.

# Definition of Done

1. Every identifier in `src/islands/MembershipDashboardIsland.jsx` that is referenced ONLY by deleted code paths has been removed.
2. The MAYBE-DEAD list is in your final report — not deleted.
3. `npx vite build` passes.
4. `npx jest --testPathIgnorePatterns="/node_modules/"` shows the same 4 pre-existing failing suites (no new failures, no new passes from "fixing" something out-of-scope).
5. The file is meaningfully shorter (the previous agent estimated ~200 dead references; expect 500–1500 lines removed depending on how dense the dead code is).
6. The `docs/plans/unified-calendar.md` "Open work" table has the "Cleanup of dead chapter-builder code in `MembershipDashboardIsland.jsx`" row removed (or, if you only completed it partially due to MAYBEs, leave the row in place with the remaining MAYBE items called out in the Notes column). That plan doc no longer has a "Deferrals" section — it was rewritten to be a what's-done / what's-open snapshot.

# Banned phrases

You may use `TODO(unified-calendar): <one-line justification>` paired with a Deferrals entry. You may NOT use these phrases without TODO+Deferrals:
- "for now", "later", "stub", "placeholder", "out of scope", "we can do this in a follow-up", "minimal implementation", "happy path only"

# Final report format

1. **Identifier inventory** — the full classified list (DEFINITELY DEAD / MAYBE DEAD / ALIVE) you produced in Stage 0. Include line numbers.
2. **Removed by stage** — one bulleted list per stage (state, handlers, imports), with line counts and a one-line justification per group.
3. **MAYBE-DEAD list** — what you didn't touch and why, organized so the user can quickly approve or reject each.
4. **Build + test results** at each stage commit.
5. **Banned-phrase scan** — output of the rg.
6. **File size before / after** — wc -l and diff stat.
7. **Plan-doc update** — quote the diff to `docs/plans/unified-calendar.md` "Open work" table (row removed or Notes updated).
8. **Suggested next steps** — if anything obvious comes up during cleanup that's worth flagging (e.g. another file that has dead imports of `MembershipDashboardIsland`'s now-removed exports).

# What NOT to do

- Do NOT change behavior of any other tab (members, engagements, etc.).
- Do NOT delete `<MeetingDialog>` or `<MeetingsCalendarView>` from src/components/ — those may be used by the unified calendar (`UnifiedCalendarIsland.jsx` does in fact reuse `MeetingDialog`'s subcomponents). Only remove them from THIS file's imports if THIS file no longer references them.
- Do NOT delete tests in `__tests__/lib/` or `__tests__/routes/` for the unified calendar — those are unrelated.
- Do NOT touch `src/islands/UnifiedCalendarIsland.jsx`, `src/components/calendar/*`, `src/lib/calendar-*.cjs`, or anything Phase 5+ of the unified calendar plan added — those are the active code now.
- Do NOT skip a stage's build/test verification because "it should be fine."
- **The chapter-builder code is now safe to delete** (`openChapterBuilder`, `setChapterBuilderMeeting`, `setChapterBuilderChapters`, `setChapterBuilderThumbnail`, `setChapterBuilderOpen`, `setChapterBuilderCompanies`, `setChapterBuilderLoading`, the `<ChapterBuilderDialog>` render block, related-companies fetch, `formatTimestamp`/`parseTimestamp`/`handleAddChapter`/`handleRemoveChapter`/`handleUpdateChapter`/`handleSaveChapters`/`handleCaptureThumbnail`/`handleSetChaptersClick`, the YouTube player init `useEffect`, and `chapterPlayerRef`/`chapterPlayerPlaying`). The chapter-builder has been extracted into `src/components/meetings/MeetingChapterBuilderDialog.jsx` (commit on the `unified-calendar` branch); the unified calendar form mounts it. The legacy `MeetingDialog`'s `onSetChapters` callback in `MembershipDashboardIsland` was the only consumer of these inline definitions, and that callback path is itself dead since the meetings tab was deleted. `extractYouTubeId` from `@/lib/utils` is still used by other consumers — keep it; only remove the chapter-builder specific code.

# Operational notes

- `export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ | tail -1)/bin:$PATH"` before any `node`/`npm`/`npx` command.
- The user's dev server runs on port 8080 — DO NOT start anything there.
- For backend syntax checks, `node -c <file>`. There's no Node code in this island so this likely won't apply, but if you touch any server file as a side-effect: check it.
- Commit directly to `main` after each clean stage (state-slot batch → handler/helper batch → imports batch). One commit per stage with a clear message. Push at the end. If your harness supports `isolation: "worktree"`, use it so you can iterate freely without dirtying the user's main checkout.

Begin.
```
