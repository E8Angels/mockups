---
title: "Google Docs-Native Diligence Reports"
status: draft
owner: jordan
created: 2026-07-09
last_updated: 2026-07-09
---

# Google Docs-Native Diligence Reports

## Decision summary

Make one Google Doc the source of truth once report writing begins. Preserve E8's existing prompts, ratings, source retrieval, AI models, section ownership, and audit trail, but write drafts and subsequent edits directly into the Google Doc. Create the document on the first “Edit report” action, then launch the editor into the selected section. Add an E8 Google Docs Editor add-on for section- and selection-aware AI assistance inside Docs.

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

### 1. Create the report on first use

Do not create the report when the diligence team is provisioned. Team membership and deal terms can change during the two or three weeks of research before report writing starts.

The first time any user chooses **Edit report** for a section, E8 shows a concise confirmation and then copies the report template into the diligence Shared Drive folder using the current company, diligence team, round, and deal terms. The document contains the final section order and fixed, correctly styled headings. Each section body is tracked with named ranges. Creation is idempotent so simultaneous first-use requests cannot create duplicate reports.

After the one-time setup, every **Edit report** entry point opens the same live Google Doc at the requested section. There is no final “generate and lock” transition. Changes to team or deal terms after this first-use snapshot are edited natively in Google Docs for the initial release; automatic metadata refresh is deferred.

### 2. Portal report workspace

The portal remains the place to:

- See section owners and report completion status.
- Adjust section ratings used by the drafting prompt.
- Draft or redraft a whole section.
- Compare model outputs before writing one to the document.
- Manage supporting documents and source-processing status.
- Open the live report in Google Docs at a specific section.
- Review an audit log of E8 AI actions.

Every report section in the portal has an **Edit report** entry point. The launch includes the application ID and section token, so a Product owner lands directly at Product with the assistant already scoped to Product. This launch context is the primary source of section identity.

Users without the add-on can still edit the report normally in Google Docs and generate whole sections from the portal.

### 3. E8 sidebar inside Google Docs

The Editor add-on opens a compact E8 Diligence Assistant sidebar. It identifies the report from the Google file ID and loads the user, application, launch section, available sources, and permissions from E8.

The sidebar has two top-level modes:

- **Write report** — draft/revise a section or improve a selection.
- **Ask E8** — ask questions about the application and receive source-linked answers with a **Use in report** proposal action.

Within **Write report**, the workflow is left to right: **Draft section** or **Revise section** appears first, followed by **Improve selection**. The first label and default state depend on the live document:

- Empty active section → **Draft section** is selected.
- Existing active section with no selection → **Revise section** is selected.
- Existing active section with a text selection → **Improve selection** is selected.
- Unapplied proposal → return to that proposal.

Primary actions:

- **Draft section** — runs the existing ratings-driven generation flow and proposes content for the active section.
- **Improve selection** — sends selected text, surrounding context, section identity, and user guidance to E8.
- **Revise section** — revises the full active section with explicit instructions.
- **Compare models** — returns multiple proposals without changing the document.

Every AI write uses a preview-first flow: request, review before/after, then apply. The Apply action checks that the underlying selection or section still matches the version used to generate the proposal.

Section ownership is advisory, not exclusive. E8 allows a user to use AI in any section. Before the first AI draft or revision in a section they do not own, show: **“You are not the owner of this section. Continue?”** Manual Google Docs editing remains governed by the document's normal sharing permissions.

### 4. Section context and cursor movement

The portal launch section is authoritative when the document opens. The add-on then checks the current cursor or selection on open, immediately before an AI action, and on a light three-to-five-second interval while the sidebar is active.

Google Docs does not provide a dependable selection-change event for this workflow, so polling is a guardrail rather than the primary navigation model. If the cursor crosses into another registered section, the assistant does not switch silently. It asks: **“Your cursor is in Team. Switch the assistant from Product to Team?”** The user can keep the original section or switch. A visible section control always allows manual correction.

### 5. Portal resources from the sidebar

A compact toolbar in the sidebar links back to the main diligence page and to the portal evidence areas users consult while writing:

- Findings
- Supporting Documents
- Reference Information
- Transcripts & Recordings
- Team Meeting Minutes

These links open the corresponding portal view for the same application. The sidebar does not show an ambient “updates since review” card. AI proposals still list the sources they used, and Ask E8 answers include citations.

### 6. Versioning and audit

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

1. Starting in the portal and choosing **Edit report** for Product.
2. Creating the report once, at the moment report writing begins.
3. Landing directly in Product with the add-on scoped from portal launch context.
4. Switching between **Write report** and **Ask E8**.
5. Drafting/revising a whole section before improving a selection.
6. Clicking report text to simulate a Google Docs selection and reviewing a before/after proposal.
7. Prompting before changing assistant context when the cursor moves to another section.
8. Warning—but not blocking—when a user invokes AI in a section they do not own.
9. Opening Findings, Supporting Documents, Reference Information, Transcripts & Recordings, Team Meeting Minutes, or the diligence home from the sidebar toolbar.
10. A responsive fallback explaining the desktop add-on limitation while preserving portal generation and normal Docs editing.

## Technical approach

### Components

1. **Portal UI** — report status, ratings, sources, model comparison, AI audit, and Google Doc launch.
2. **E8 backend** — authentication, authorization, prompt assembly, RAG/context retrieval, AI calls, proposal storage, and Docs API writes.
3. **Google Docs Editor add-on** — minimal Apps Script and HTML/CSS interface for active-document and selection access.
4. **Google Drive/Docs APIs** — template copy, named ranges, structured formatting, revision-controlled updates, and permissions.

### Document structure

- Use one linear report rather than one Google Docs tab per section for the first release.
- Keep section headings in the template; AI generates section content only.
- Create stable named ranges for each content slot within a report section, not one catch-all range for the entire section.
- Store each named-range ID with its section token and slot token.
- Detect and repair deleted section markers without overwriting adjacent content.
- Prefer structured AI output (`paragraph`, `subheading`, `bullet_list`, `table`) over Markdown for whole-section writes.
- Initially limit selection replacement to text ranges. Tables, images, footnotes, and cross-section selections should produce a clear unsupported-selection message.
- Add stable bookmarks at each report section so portal entry points can deep-link to the requested location after first-use creation.

### Existing template adaptation

The current **Diligence Report Style Template** already provides the right overall report shell: one Report tab, seven major section bars, Heading 1/Heading 2 outline structure, fixed E8 branding, and placeholders for the report content. Keep that visual structure and adapt the placeholders into registered content slots.

The initial slot map should be:

- Executive Summary — executive summary, traction, investment thesis, risks and mitigations
- Product — product differentiation, competitive positioning
- Commercialization — business model, market analysis, go-to-market
- Team — team
- Finances — financial outlook, funding and deal terms
- Environmental Impact — environmental impact
- Sources — sources

For example, Product uses `e8.product.differentiation` and `e8.product.competitive_positioning`. Keep the styled section-bar tables and fixed subheadings outside the replaceable ranges. Add any missing fixed subheading, including Product Differentiation, so the model never has to invent heading structure.

Whole-section generation returns structured content keyed by slot token. This replaces the current Markdown-heading parser that attempts to split one AI response among multiple template placeholders and is the main protection against heading translation errors.

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
- Treat the launch section token as a convenience hint, then validate it against the document's registered section bindings before use.

### Proposed API surface

Names are placeholders for planning; implementation should follow the existing diligence route conventions.

- `GET /diligence/api/docs-addon/context?document_id=...`
- `POST /diligence/api/report-document/ensure` with application and launch section; idempotently create or return the report and section deep link
- `POST /diligence/api/docs-addon/draft-section`
- `POST /diligence/api/docs-addon/revise-selection`
- `POST /diligence/api/docs-addon/revise-section`
- `POST /diligence/api/docs-addon/compare-models`
- `POST /diligence/api/docs-addon/apply-proposal`
- `GET /diligence/api/docs-addon/actions?document_id=...`
- `POST /diligence/api/docs-addon/ask`

The backend should keep SQL in the CacheManager diligence module. Any new endpoints affecting the data-query API must update the served skill instructions in the same implementation PR.

### Possible persistence

A dedicated binding/action model will likely be clearer than repurposing portal draft rows:

- `diligence_report_section_bindings`
  - application record ID
  - Google file ID
  - section token
  - Google tab ID
  - named-range ID
  - slot token
  - last known content hash
  - last AI source snapshot hash
  - last AI update time and user
- `diligence_report_ai_actions`
  - proposal metadata, before/after values, model, sources, revision IDs, apply state

This is a proposed schema only. Production schema changes require separate implementation approval and migration work.

## Error and edge states

- Add-on installed but user is not an E8 member.
- User can view but not edit the Google Doc.
- Two users trigger first-use document creation at the same time.
- Google Doc is not mapped to an E8 diligence application.
- Section named range was deleted or duplicated.
- Selected range spans multiple sections or unsupported structures.
- Supporting document is still processing.
- AI returns empty or invalid structured content.
- Another collaborator edits the selection while AI is working.
- Service account loses access to the Shared Drive or document.
- E8 session/token expires while the sidebar is open.
- Workspace administrator blocks add-on installation.
- Portal launch section does not match any registered range or bookmark.
- Cursor moves to another section while an unapplied proposal is open.

## Accessibility and mobile

- Sidebar actions use visible labels, keyboard focus states, and status announcements.
- Selection state is communicated in text, not color alone.
- Async actions disable immediately and display progress.
- Destructive replacements require a preview and explicit Apply action.
- Google Docs Editor add-ons are desktop-only. Mobile users retain normal Google Docs editing and portal whole-section drafting; the portal explains that selection-aware AI editing is available on desktop.

## Rollout

### Phase 1 — Technical spike

- One template, one application, and one report section.
- Idempotently create the report on the first section-level **Edit report** action.
- Deep-link from Product in the portal to the Product bookmark and launch the add-on with Product context.
- Generate directly into a named range.
- Read a plain-text selection from the add-on.
- Preview and apply a revision-safe replacement.
- Test Chrome and Safari with two simultaneous collaborators.

### Phase 2 — Internal pilot

- All report sections, ratings, supporting documents, and AI action audit.
- Public/unlisted draft installation for a small cross-domain E8 group.
- Model comparison.
- Ask E8 mode, portal resource links, cursor-crossing prompt, and non-owner AI confirmation.

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
- Most report sessions launched from a portal section require no manual section correction.

## Validation plan

- Unit tests for section binding, fingerprints, structured block validation, and source freshness.
- Route tests for permission rejection, stale revision rejection, and invalid document mappings.
- Route tests for idempotent first-use creation and section deep-link generation.
- Docs integration tests for named-range replacement, paragraph/list/table rendering, and concurrent edits.
- Add-on tests for no selection, partial paragraph, multi-paragraph, unsupported structures, expired E8 auth, and read-only files.
- Browser smoke tests in Chrome and Safari.
- Manual collaboration test with two editors applying and rejecting overlapping proposals.
- Cross-browser test of portal-to-section launch and add-on behavior in Chrome and Safari.

## Decisions captured

- Create the Google Doc on the first **Edit report** action, not during diligence provisioning.
- Use section-level portal entry points and treat launch context as the initial active section.
- Prompt before switching assistant context when the cursor moves to another section.
- Allow non-owners to use AI after a concise warning.
- Do not show an ambient “updates since review” card.
- Provide sidebar toolbar entry points to the diligence home and major evidence areas.

## Open questions

- Should whole-section AI writes always require preview, or can a lead opt into direct writes for empty sections?
- Which portal sources should drafting and Ask E8 include by default versus only when a user explicitly requests them?
- Should applied proposals add a native Google Docs comment linking to the E8 AI action?
- Is the current Shared Drive permission model sufficient for every outside-domain diligence participant?
- How long should E8 retain before/after proposal content?
- Should compare-model results remain transient or be retained in the audit log?
