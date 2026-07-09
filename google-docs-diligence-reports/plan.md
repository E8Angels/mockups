---
title: "Google Docs-Native Diligence Reports"
status: draft
owner: jordan
created: 2026-07-09
last_updated: 2026-07-09
---

# Google Docs-Native Diligence Reports

## Decision summary

Make one Google Doc the source of truth for a diligence report from the beginning of report writing. Preserve E8's existing prompts, ratings, source retrieval, AI models, section ownership, and audit trail, but write drafts and subsequent edits directly into the Google Doc. Add an E8 Google Docs Editor add-on for selection-aware AI assistance inside Docs.

## Background

The current report workflow drafts each section in a collaborative TipTap editor, saves portal versions, and exports the assembled report to Google Docs at the end. Once exported, portal editing is locked and the report continues in Google Docs.

This produces two authoring systems. Formatting can change during Markdown/TipTap-to-Docs conversion, edits made in Docs are not reflected in the portal draft, and collaborators must decide which version is current. Google Docs also provides a more complete authoring and collaboration environment than the embedded TipTap editor.

## Goals

- Keep a single live report throughout diligence.
- Retain the existing “Draft with AI” ratings, prompts, model comparison, source retrieval, and section-specific generation.
- Support true selection-level AI edits inside Google Docs.
- Let AI incorporate newly added portal data, supporting documents, transcripts, scratchpads, and other report sections.
- Preserve native Google Docs collaboration, comments, formatting, and version history.
- Prevent AI from silently overwriting concurrent human edits.
- Keep the portal useful for report status, ownership, source management, and whole-section generation.

## Non-goals

- Rebuilding Google Docs inside the E8 portal.
- Mirroring every Google Docs keystroke back into a portal rich-text editor.
- Replacing Google Docs sharing permissions or version history.
- Making the add-on responsible for E8 data retrieval or prompt logic.
- Depending on Developer Preview suggestion-writing APIs for the first release.

## Proposed user experience

### 1. Create the report earlier

When a diligence team is provisioned, E8 copies the report template into the diligence Shared Drive folder. The document contains the final section order and fixed, correctly styled headings. Each section body is tracked with a named range.

The portal shows the report immediately, even when every section is empty. There is no final “generate and lock” transition.

### 2. Portal report workspace

The portal remains the place to:

- See section owners and report completion status.
- Adjust section ratings used by the drafting prompt.
- Draft or redraft a whole section.
- Compare model outputs before writing one to the document.
- Manage supporting documents and source-processing status.
- Open the live report in Google Docs.
- Review an audit log of E8 AI actions.

Users without the add-on can still edit the report normally in Google Docs and generate whole sections from the portal.

### 3. E8 sidebar inside Google Docs

The Editor add-on opens a compact E8 Diligence Assistant sidebar. It identifies the report from the Google file ID and loads the user, application, active section, available sources, and permissions from E8.

Primary actions:

- **Draft section** — runs the existing ratings-driven generation flow and proposes content for the active section.
- **Improve selection** — sends selected text, surrounding context, section identity, and user guidance to E8.
- **Revise section** — revises the full active section with explicit instructions.
- **Review new evidence** — shows sources added or changed since the last AI action and proposes a focused update.
- **Compare models** — returns multiple proposals without changing the document.

Every AI write uses a preview-first flow: request, review before/after, then apply. The Apply action checks that the underlying selection or section still matches the version used to generate the proposal.

### 4. Source freshness

The sidebar displays a compact freshness card when portal information has changed:

> 3 updates since this section was reviewed

Opening it shows the new supporting documents, transcripts, application-field changes, or scratchpad updates. Users choose which sources to consider. E8 produces a focused proposal and records the selected source IDs.

### 5. Versioning and audit

Google Docs version history is canonical for human editing. E8 stores an AI action record containing:

- User and timestamp
- Application, document, section, and selection fingerprint
- Guidance and model
- Source IDs and source snapshot hash
- Before/after text hashes
- Proposed text and whether it was applied
- Google document revision before and after the action

The portal no longer attempts to save versions of every manual edit.

## Mockup behavior

The interactive mockup demonstrates:

1. Clicking report text to simulate a Google Docs selection.
2. Asking E8 to improve that selection.
3. Reviewing a before/after proposal.
4. Applying the change to the document.
5. Reviewing new source material and proposing an evidence-based update.
6. Opening the Draft section flow with ratings.
7. Switching to the portal report workspace.
8. A responsive fallback explaining the desktop add-on limitation while preserving portal generation and normal Docs editing.

## Technical approach

### Components

1. **Portal UI** — report status, ratings, sources, model comparison, AI audit, and Google Doc launch.
2. **E8 backend** — authentication, authorization, prompt assembly, RAG/context retrieval, AI calls, proposal storage, and Docs API writes.
3. **Google Docs Editor add-on** — minimal Apps Script and HTML/CSS interface for active-document and selection access.
4. **Google Drive/Docs APIs** — template copy, named ranges, structured formatting, revision-controlled updates, and permissions.

### Document structure

- Use one linear report rather than one Google Docs tab per section for the first release.
- Keep section headings in the template; AI generates section content only.
- Create one named range per report section.
- Store both the named-range ID and the section token.
- Detect and repair deleted section markers without overwriting adjacent content.
- Prefer structured AI output (`paragraph`, `subheading`, `bullet_list`, `table`) over Markdown for whole-section writes.
- Initially limit selection replacement to text ranges. Tables, images, footnotes, and cross-section selections should produce a clear unsupported-selection message.

### Concurrency

- Read the document revision before generating.
- Fingerprint the selected text or named-range content plus limited surrounding context.
- Use Google Docs revision controls when applying the update.
- If content changed while the proposal was generated, do not apply it; show “The document changed—refresh this proposal.”
- Treat the add-on as another collaborator rather than as an authoritative overwrite process.

### Authentication and distribution

- Publish the Editor add-on as public/unlisted because E8 collaborators use Google accounts across multiple domains.
- Use individual installation for the pilot; document that some Workspace administrators may block add-on installation.
- Connect the add-on to E8 through a one-time authorization link and short-lived E8 tokens.
- Map the Google identity to an active E8 person record and enforce the same application/section permissions as the portal.
- Keep portal cookies, service-account credentials, and AI keys out of Apps Script properties and sidebar JavaScript.

### Proposed API surface

Names are placeholders for planning; implementation should follow the existing diligence route conventions.

- `GET /diligence/api/docs-addon/context?document_id=...`
- `GET /diligence/api/docs-addon/source-freshness?document_id=...&section_token=...`
- `POST /diligence/api/docs-addon/draft-section`
- `POST /diligence/api/docs-addon/revise-selection`
- `POST /diligence/api/docs-addon/revise-section`
- `POST /diligence/api/docs-addon/compare-models`
- `POST /diligence/api/docs-addon/apply-proposal`
- `GET /diligence/api/docs-addon/actions?document_id=...`

The backend should keep SQL in the CacheManager diligence module. Any new endpoints affecting the data-query API must update the served skill instructions in the same implementation PR.

### Possible persistence

A dedicated binding/action model will likely be clearer than repurposing portal draft rows:

- `diligence_report_section_bindings`
  - application record ID
  - Google file ID
  - section token
  - Google tab ID
  - named-range ID
  - last known content hash
  - last AI source snapshot hash
  - last AI update time and user
- `diligence_report_ai_actions`
  - proposal metadata, before/after values, model, sources, revision IDs, apply state

This is a proposed schema only. Production schema changes require separate implementation approval and migration work.

## Error and edge states

- Add-on installed but user is not an E8 member.
- User can view but not edit the Google Doc.
- Google Doc is not mapped to an E8 diligence application.
- Section named range was deleted or duplicated.
- Selected range spans multiple sections or unsupported structures.
- Supporting document is still processing.
- AI returns empty or invalid structured content.
- Another collaborator edits the selection while AI is working.
- Service account loses access to the Shared Drive or document.
- E8 session/token expires while the sidebar is open.
- Workspace administrator blocks add-on installation.

## Accessibility and mobile

- Sidebar actions use visible labels, keyboard focus states, and status announcements.
- Selection state is communicated in text, not color alone.
- Async actions disable immediately and display progress.
- Destructive replacements require a preview and explicit Apply action.
- Google Docs Editor add-ons are desktop-only. Mobile users retain normal Google Docs editing and portal whole-section drafting; the portal explains that selection-aware AI editing is available on desktop.

## Rollout

### Phase 1 — Technical spike

- One template, one application, and one report section.
- Create the report at diligence provisioning.
- Generate directly into a named range.
- Read a plain-text selection from the add-on.
- Preview and apply a revision-safe replacement.
- Test Chrome and Safari with two simultaneous collaborators.

### Phase 2 — Internal pilot

- All report sections, ratings, supporting documents, and AI action audit.
- Public/unlisted draft installation for a small cross-domain E8 group.
- Source freshness and focused updates.
- Model comparison.

### Phase 3 — Migration

- Use Docs-native reports for new diligences.
- Import current TipTap drafts into the new report structure once.
- Keep existing finalized reports unchanged.
- Retire portal TipTap report editing after the pilot meets success criteria.

## Success measures

- No report content must be manually copied between the portal and Google Docs.
- Section headings and core formatting survive every AI action.
- AI never overwrites a concurrently edited selection.
- Most section editors complete drafting and revisions without opening TipTap.
- Users can identify which new sources informed an AI change.
- Support incidents related to “which version is current?” decline materially.

## Validation plan

- Unit tests for section binding, fingerprints, structured block validation, and source freshness.
- Route tests for permission rejection, stale revision rejection, and invalid document mappings.
- Docs integration tests for named-range replacement, paragraph/list/table rendering, and concurrent edits.
- Add-on tests for no selection, partial paragraph, multi-paragraph, unsupported structures, expired E8 auth, and read-only files.
- Browser smoke tests in Chrome and Safari.
- Manual collaboration test with two editors applying and rejecting overlapping proposals.

## Open questions

- Should the Google Doc be created during diligence provisioning or on the first report action?
- Should whole-section AI writes always require preview, or can a lead opt into direct writes for empty sections?
- Do section owners need exclusive write permissions, or only ownership/status indicators?
- Which E8 data changes should count as “new evidence” by default?
- Should applied proposals add a native Google Docs comment linking to the E8 AI action?
- Is the current Shared Drive permission model sufficient for every outside-domain diligence participant?
- How long should E8 retain before/after proposal content?
- Should compare-model results remain transient or be retained in the audit log?

