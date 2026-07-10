---
title: "Google Docs-Native Diligence Reports"
status: draft
owner: jordan
created: 2026-07-09
last_updated: 2026-07-09
---

# Google Docs-Native Diligence Reports

## Decision summary

Keep the existing diligence workspace intact. Instructions, Findings, section ownership, approvals, notes, Reference Information, Supporting Documents, Transcripts & Recordings, and Team Meeting Minutes remain in their current portal layout.

Change only report authoring:

- Replace the TipTap report editor in each section's existing **Report** subtab with an **Edit [Section] in Google Docs** entry point.
- Create one shared report document on the first use of any section-level entry point.
- Open that same document at the requested section for every later editor.
- Put whole-section drafting, flexible AI editing, Ask the AI, and ratings in the fixed E8 Google Docs sidebar. Open evidence, Findings coverage, and diligence materials in a separate authenticated E8 view.

Build this as a complete parallel beta. The legacy TipTap authoring path, its prompts, and its generated-report workflow remain operational and unchanged while selected diligence teams use the new experience. Each diligence has exactly one active report-authoring mode; the two systems never write to the same report.

The beta uses the native fixed-width 300-pixel Google Docs Editor add-on sidebar. Source inspection, Findings coverage, citations, audit history, and the diligence-materials accordion open in a separate full-width authenticated E8 view because Google Workspace does not provide a supported docked, drag-resizable add-on surface.

Google Docs becomes the report source of truth from the first report-writing action onward. The portal remains the diligence research and coordination workspace.

## Existing product model to preserve

The design is grounded in the current diligence implementation and live workspace:

- `DiligenceTab.jsx` renders the existing section list and persistent right rail.
- `SectionRow.jsx` owns each section's **Instructions / Findings / Report** subtabs, owner pills, approvals, and section notes.
- `RightRail.jsx` preserves the resizable accordion for **Reference Information**, **Supporting Documents**, **Transcripts and Recordings**, and **Team Mtg Minutes**.
- `SectionReportPane.jsx` currently contains Draft with AI, ratings, TipTap editing, AI Edit Assistance, version history, and a hidden provider-comparison control.
- The header's existing **Report** button manages the final-report document.

The proposal adds one focused evidence/materials view launched from the sidebar. It does not introduce a separate report editor, section list, or drafting form. The existing diligence layout, density, and navigation remain the visual and interaction baseline.

The hidden model-comparison feature is explicitly out of scope for the beta. The beta uses one configured provider and model. Provider bakeoffs remain in the separate bakeoff feature and do not appear in this interface or request path.

## User experience

### 1. Research and findings are unchanged

Users continue to:

- Expand their assigned section in the diligence workspace.
- Work in **Findings** with the existing editor.
- Consult the persistent right rail while researching.
- Add supporting documents, review reference information, open transcripts and recordings, and read team meeting minutes.
- See owners, approvals, and section notes in the existing section header.

No report-document creation happens during diligence team provisioning. Team membership and deal terms may change during the research period.

### 2. The existing Report subtab becomes the entry point

The **Report** subtab remains beside Instructions and Findings. Its content becomes a compact Google Docs handoff state; it does not contain ratings, sliders, model selection, draft generation, or a rich-text editor.

Before a report exists:

- Title: **Write Product in Google Docs**
- Primary action: **Edit Product in Google Docs**
- Supporting status: E8 will create the shared report using the current team and deal terms.

After a report exists:

- Title: **Product is edited in the shared Google Doc**
- Primary action: **Edit Product in Google Docs**
- Secondary action: **View whole report**
- Section status may say **Not drafted**, **Drafted**, or **Approved** based on the registered Google Docs content and existing approval state.

The header's existing **Report** button opens the same shared document at its beginning. It no longer represents a final export that locks portal editing.

### 3. First editor versus later editors

Every section-level entry point calls one idempotent ensure-and-open operation.

| Situation | What the user sees | What E8 does |
| --- | --- | --- |
| First report editor | The button immediately changes to **Creating shared report…** | Copy the template once, populate current company/team/deal terms, register slots and bookmarks, then open at the requested section. |
| Later editor, new section | The button immediately changes to **Opening report…** | Return the existing document and the requested section bookmark. No provisioning UI appears. |
| Two first users click together | Both buttons show progress | A uniqueness guard allows one document creation; both requests resolve to the same document. |
| Existing section draft | **Edit [Section] in Google Docs** | Open the existing document at that section; the sidebar defaults to Draft Section with a **Redraft section** action. |

The portal entry point looks and behaves the same for every user. Document creation is an implementation detail behind the first click, not a separate page or workflow.

### 4. Google Docs sidebar

The sidebar opens with the company and portal-launch section already resolved. The section selector is visible, but the launch section is authoritative until the user deliberately switches.

The sidebar's primary mode tabs are:

1. **Draft Section** — create or replace the whole active section directly in the document.
2. **Edit Selection** — interpret an arbitrary instruction, use whatever read-only diligence tools are relevant, and propose a change to highlighted Google Docs text.
3. **Ask the AI** — answer questions about the application, Findings, documents, transcripts, meetings, ratings, and other report sections with citations.

There is no separate **Revise Section** or **Improve Section** mode. Whole-section work lives in Draft Section; selection-level work lives in Edit Selection.

#### Draft Section

- Requires no document selection.
- Retains the existing section-specific ratings while using beta-specific versioned prompts initialized from the current prompts.
- Uses the latest Findings and whichever eligible portal sources the authoring agent determines are relevant.
- For an empty section, the action is **Generate draft**.
- For a populated section, the action is **Replace section draft**.
- Writes the generated section directly into the registered section slots. A full-section preview is deliberately omitted because the document is the appropriate reading surface.
- The placeholder tokens prove whether this is the first draft. Generating replaces those tokens; replacing a populated section overwrites only that section's registered slots.
- Google Docs Undo and version history are the recovery mechanisms. E8 also stores the before/after run record for audit and support.
- Shows Findings treatment as **Preserve all substantive points** or **Synthesize and prioritize**, with the former as the default.
- After the write, shows a compact Findings coverage result only when something was combined, held out, contradicted, or left unverified.

The coverage result is actionable but intentionally compact. The sidebar shows a summary and opens the full ledger in the separate evidence/materials view, not a draft preview. Each Finding is marked **Included**, **Combined**, **Held for verification**, or **Not used**, with a short reason and the section/source destination. The user can then ask the agent to include a held-out item or continue reading in the document. The generated prose remains in Google Docs, where it is easier to read, edit, and undo.

#### Edit Selection

- Becomes actionable when selected text is inside the active section.
- Sends selected text, surrounding context, section identity, and the user's open-ended instruction to the authoring agent.
- The agent decides whether the request is a local rewrite, an evidence search, a citation task, a named-source request, or a verification question and selects the relevant read-only tools.
- Shows current and proposed text before Apply.
- Rejects stale proposals if the document changed during generation.

#### Ask the AI

- Uses the existing E8 question-answering/RAG capabilities and custom prompts.
- Includes citations to portal data and documents.
- **Use in report** transfers the answer into a reviewable Edit Selection proposal or asks where to insert it; it never rewrites a whole section silently from the Ask mode.

### 5. Separate evidence and diligence-materials view

The fixed sidebar includes one **Open evidence & materials** action. It launches a separate authenticated E8 view for the active report, section, and authoring run. That view combines the evidence dossier, citations, Findings ledger, source-processing state, and authoring history with the portal right rail's familiar diligence-materials accordion:

- Findings
- Reference Information
- Supporting Documents
- Transcripts & Recordings
- Team Meeting Minutes

Each accordion panel supports search, source opening, and **Open in portal**. A single **Open diligence in portal** action is available in the view header. Google Drive assets still open through authenticated E8 proxy routes rather than raw Drive URLs.

There is no ambient “updates since review” card.

### 6. Sidebar width and platform constraint

Native Google Editor add-on sidebars are fixed at 300 pixels. The accepted beta architecture uses that supported surface for compact authoring controls and does not simulate resizing. Evidence and materials move to the separate E8 view so source review has normal browser width. The fixed sidebar, external view launch, and return-to-document flow must be validated in both Chrome and Safari before beta users are enabled.

### 7. Section context and ownership

The portal passes the application ID and section token when opening the document. E8 resolves that token to the section bookmark and sidebar context.

The add-on may check the cursor or selection every three to five seconds and immediately before an AI action. Google Docs does not provide a dependable selection-change event for this workflow, so polling is a guardrail.

If the cursor moves into another registered section, the sidebar asks whether to switch. It never changes section context silently.

Ownership is advisory. Users may use AI in sections they do not own, but the first AI write in that section asks:

> You are not the owner of this section. Continue?

Opening or manually editing the section does not trigger that warning.

## Template adaptation and direct section writes

The existing **Diligence Report Style Template** remains the source template. It already provides one Report tab, E8 branding, section-bar tables, Heading 1/Heading 2 structure, and the correct report order.

Adapt the existing placeholders into stable registered content slots:

- Executive Summary — executive summary, traction, investment thesis, risks and mitigations
- Product — product differentiation, competitive positioning
- Commercialization — business model, market analysis, go-to-market
- Team — team
- Finances — financial outlook, funding and deal terms
- Environmental Impact — environmental impact
- Sources — sources

For example, Product uses `e8.product.differentiation` and `e8.product.competitive_positioning`. Keep section bars and fixed subheadings outside replaceable ranges. Add missing fixed subheadings so the model does not invent document structure.

Whole-section generation returns structured content keyed by slot token rather than Markdown headings. This removes the current heading-parser translation risk. On first generation, E8 atomically replaces the section's placeholder tokens. On replacement, it atomically replaces the same registered slots without touching fixed headings or adjacent sections.

Add a bookmark at every major section for portal deep links.

## Technical approach

### Components

1. **Existing portal diligence UI** — unchanged research workspace, with a simplified Report subtab handoff.
2. **E8 authoring service** — identity, authorization, flexible task planning, read-only tool orchestration, beta prompt versions, evidence assembly, validation, and audit.
3. **Google Docs integration** — fixed sidebar UI, cursor/selection reads, external evidence/materials launch, and revision-safe Docs operations.
4. **Google Drive/Docs APIs** — template copy, bookmarks, named ranges, structured writes, sharing, and revision control.

### One flexible authoring agent

Draft Section, Edit Selection, and Ask the AI use one underlying agent with different write boundaries, not separate hard-coded command handlers.

The agent receives:

- task mode: draft section, edit selection, or answer only
- application, document, section, selection, and user identity
- permitted write boundary
- user instruction, ratings, and Findings treatment
- beta prompt version
- a read-only tool catalog

Core tools include:

- read selection, section, report outline, and relevant report sections
- read Findings and ratings
- search diligence sources across the application
- locate a document, interview, transcript, recording, or meeting by name
- read a source excerpt with page or timestamp provenance
- read structured application and reference fields

The model may make zero or several tool calls according to the request. “Make this shorter” should normally use only document context. “Add citations,” “include the Gary Peterson interview,” or “is this true?” should retrieve and inspect supporting evidence. Tools remain read-only; E8 owns every Docs mutation.

The agent returns a typed result: answer only, replace selection, insert at cursor, draft section, or replace section. The result includes evidence IDs, citations, warnings, and a Findings coverage record when applicable.

### Concrete authoring pipeline

The agent is not asked to “search everything” and hope that a few nearest-neighbor passages describe the company. Every authoring run produces an inspectable dossier before prose is written:

1. **Classify the request.** Determine whether it is a local rewrite, a citation/evidence request, a named-source request, a verification question, a whole-section draft, or a whole-section replacement. This controls the write boundary and whether source retrieval is needed.
2. **Inventory the available record.** Read source metadata and source-level summaries for the application, Findings, supporting documents, transcripts, recordings, meetings, and structured application fields. This is the breadth pass across potentially dozens of materials.
3. **Build a coverage map.** For an initial draft, derive the required dimensions from the section specification. For Commercialization, the map includes customer and buyer, buying process, pricing and economics, current alternatives, market evidence, go-to-market motion, pipeline, and unresolved risks. For an edit, the map is derived from the selected claims and the user's instruction.
4. **Shortlist sources per dimension.** Use metadata, lexical search, and semantic retrieval together. The agent can expand a dimension when the evidence is thin, conflicting, or too generic; it does not stop after a fixed two-chunk result.
5. **Read exact excerpts.** Fetch page-, paragraph-, or timestamp-level passages from shortlisted sources and attach provenance. A source summary is not enough to support a material claim.
6. **Resolve gaps and conflicts.** Mark dimensions as supported, partially supported, conflicting, or missing. The agent may ask for another bounded retrieval pass, but it must expose the gap rather than manufacture a holistic conclusion.
7. **Write and validate.** The writer receives the section specification, Findings coverage ledger, evidence dossier, ratings, and current report context. A validator checks that required dimensions and Findings dispositions are reflected and that material claims map to evidence.

This is an ambitious system, and the beta should be explicit about its limits. AI may be able to assemble a useful go-to-market picture from many sources, but it cannot guarantee that the picture is complete or correct. The user sees the evidence and unresolved dimensions in the separate E8 view; the generated prose remains in Google Docs for normal human review and editing.

### Findings coverage contract

Before writing, the agent decomposes Findings into atomic items and assigns each one a disposition:

- include directly
- combine with another Finding
- include after qualification or verification
- hold because sources conflict
- omit as duplicative or outside the section

In **Preserve all substantive points** mode, every substantive conclusion and example must be mapped into the draft unless it is contradictory or impossible to support. In **Synthesize and prioritize** mode, the agent may omit tangential or duplicative material, but every omission remains visible in the coverage record. A post-write validator prevents “include” items from disappearing silently.

### Ensure-and-open endpoint

`POST /diligence/api/report-document/ensure`

Request:

- application record ID
- launch section token

Response:

- document ID
- document URL
- section bookmark URL
- `created: true | false`

The endpoint must be idempotent and concurrency-safe. A unique application-to-current-report binding prevents duplicate documents.

### Proposed add-on API surface

- `GET /diligence/api/docs-addon/context?document_id=...`
- `GET /diligence/api/google-docs/evidence?document_id=...&section_token=...&run_id=...`
- `POST /diligence/api/docs-addon/draft-section`
- `POST /diligence/api/docs-addon/revise-selection`
- `POST /diligence/api/docs-addon/ask`
- `POST /diligence/api/docs-addon/apply-proposal`
- `POST /diligence/api/docs-addon/write-section`
- `GET /diligence/api/docs-addon/actions?document_id=...`

The backend retains prompts, source eligibility, retrieval, AI keys, authorization, and audit logic. Apps Script never receives portal cookies, service-account credentials, or model keys.

### Concurrency and safety

- Read the document revision before every AI task.
- Fingerprint the selected text or registered section content and limited surrounding context.
- Use Google Docs revision controls when applying.
- If the source changed, require proposal refresh.
- Apply selection and insertion proposals only after review.
- Apply initial and replacement whole-section output directly to registered content slots after generation; never replace fixed headings or adjacent sections.
- Google Docs version history remains canonical for human edits.

### Audit record

Store:

- user, application, document, section, and timestamp
- mode: draft section, replace section, edit selection, Ask the AI, or Ask transfer
- configured model, beta prompt version, user guidance, and Findings treatment
- tool calls, retrieval queries, source catalog version, and evidence IDs
- Findings item dispositions and post-write coverage validation
- source IDs and source snapshot hash
- before/after hashes and proposed text
- document revision before and after
- applied, discarded, stale, or failed state

## Error and edge states

- User can view but not edit the document.
- User has not installed or authorized the add-on.
- Workspace administrator blocks add-on installation.
- First-use document creation fails or times out.
- Two first-use requests arrive simultaneously.
- Launch section token or bookmark is missing.
- A named range is deleted or duplicated.
- Selection crosses sections or contains unsupported structures.
- Source document is still processing.
- User moves sections while a proposal is pending.
- Another collaborator edits the target before Apply.
- E8 identity or session expires.

## Accessibility and mobile

- Preserve the existing portal's semantic tabs, buttons, focus states, and compact density.
- Async actions show immediate progress and prevent duplicate clicks.
- Selection and section context are communicated in text, not color alone.
- Selection replacements and insertions require preview and Apply. Initial and replacement whole-section drafts write directly into the document and rely on Google Docs Undo/version history plus the E8 audit record.
- Google Docs Editor add-ons are desktop-only. Mobile users retain the existing portal Findings and materials experience plus normal Google Docs editing; selection-aware E8 assistance is unavailable on mobile.

## Parallel beta and evaluation

Build the complete beta behind an application-level report-experience flag. Internal engineering milestones may be incremental, but no diligence team receives a partial workflow.

The beta is ready for a cohort only when it supports every report section, direct initial and replacement drafting, flexible selection edits, Ask the AI, citations, the materials accordion, Findings coverage, ownership warnings, document concurrency, source-processing states, audit, and Chrome/Safari validation.

During evaluation:

- Legacy authoring, prompts, storage, and final-document generation remain unchanged.
- A diligence is assigned either `legacy` or `google_docs_beta`; never both.
- The beta creates and owns a separate report-document binding and separate versioned prompt set.
- One or two complete diligence teams may use the beta while all others continue with legacy.
- There is no automatic dual-write, merge, or synchronization between the two authoring systems.
- Retirement of TipTap is a later decision based on completed-report quality, factual accuracy, Findings fidelity, time-to-completion, and user preference.

## Success measures

- No report content is manually copied between the portal and Google Docs.
- Findings and the right rail remain fully usable and visually unchanged.
- First and later editors reach their section through the same portal entry point.
- Most launches require no manual section correction.
- Fixed headings and template formatting survive every AI action.
- AI never overwrites concurrently edited text.
- Users can inspect the evidence behind an answer, selection proposal, or generated section while staying in Google Docs.
- No substantive Finding disappears silently; every Finding has a recorded disposition.
- Users can complete arbitrary rewrite, citation, named-source, and verification requests through one instruction interface.
- “Which version is current?” support incidents decline materially.

## Validation plan

- Unit tests for ensure-and-open idempotency, bookmark resolution, slot validation, fingerprints, and structured output.
- Route tests for first creation, later open, concurrent creation, permission rejection, invalid mapping, and stale revision rejection.
- Google Docs integration tests for named ranges, bookmarks, paragraph/list/table rendering, and concurrent edits.
- Agent tests for local rewrites with no retrieval, citation requests, named-source requests, verification questions, contradictory evidence, large source sets, and tool-budget exhaustion.
- Findings tests for rough-draft prose, brain-dump notes, duplicate items, out-of-scope items, conflicts, and post-write coverage validation.
- Add-on tests for empty section, populated section, direct section replacement, Undo recovery, no selection, partial paragraph, multi-paragraph selection, cross-section selection, read-only document, and expired E8 auth.
- Browser smoke tests for the unchanged portal layout and section-level entry point.
- Chrome and Safari tests for the fixed add-on sidebar, separate evidence/materials view, and first/later editor flows.

## Decisions captured

- Preserve the existing diligence workspace and right rail.
- Change only report authoring and the Report subtab content.
- Put all draft-generation controls in the Google Docs sidebar.
- Use **Draft Section**, **Edit Selection**, and **Ask the AI**.
- Create the document on the first report-editing action, not team provisioning.
- Use one idempotent entry point for first and later editors.
- Build a complete parallel beta; do not incrementally replace the legacy authoring workflow.
- Never allow legacy and beta to author the same report.
- Give the beta independent versioned prompts.
- Use one configured provider/model with no comparison UI.
- Write initial and replacement whole-section drafts directly into Google Docs; preview only smaller selection and insertion edits.
- Use the supported fixed 300-pixel native sidebar for compact authoring controls.
- Use one flexible authoring agent that chooses read-only tools based on the user's request.
- Open evidence, Findings coverage, audit history, source status, and the familiar diligence-materials accordion in a separate authenticated E8 view.
- Track a Findings coverage contract so points cannot disappear silently.
- Allow non-owner AI use after a warning.
- Do not show an “updates since review” card.

## Open questions

- Should the header-level Report button open the document at the beginning or return to the user's last active report section?
- Which Reference Information items may be exposed inside the add-on versus linked back to the portal because of permissions or sensitivity?
- Should applied proposals add a native Google Docs comment linking to the E8 audit record?
- How long should E8 retain full before/after proposal text?
- Should Findings treatment remember the user's last choice globally, per diligence, or per section?
