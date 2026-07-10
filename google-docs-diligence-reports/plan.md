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
- Put whole-section drafting, selection-level editing, Ask the AI, model comparison, ratings, and source access in an E8 sidebar inside Google Docs.

Google Docs becomes the report source of truth from the first report-writing action onward. The portal remains the diligence research and coordination workspace.

## Existing product model to preserve

The design is grounded in the current diligence implementation and live workspace:

- `DiligenceTab.jsx` renders the existing section list and persistent right rail.
- `SectionRow.jsx` owns each section's **Instructions / Findings / Report** subtabs, owner pills, approvals, and section notes.
- `RightRail.jsx` preserves the resizable accordion for **Reference Information**, **Supporting Documents**, **Transcripts and Recordings**, and **Team Mtg Minutes**.
- `SectionReportPane.jsx` currently contains Draft with AI, ratings, model comparison, TipTap editing, AI Edit Assistance, and version history.
- The header's existing **Report** button manages the final-report document.

The proposal does not introduce a separate portal report page, section list, evidence page, or drafting form. The existing layout, density, and navigation remain the visual and interaction baseline.

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

The primary mode tabs are:

1. **Draft Section** — create or replace the whole active section. When the section already has content, the primary action label becomes **Redraft section** and the replacement requires preview.
2. **Edit Selection** — edit only highlighted Google Docs text using user guidance, section context, and portal data.
3. **Ask the AI** — answer questions about the application, findings, documents, transcripts, meetings, ratings, and other report sections with citations.

There is no separate **Revise Section** or **Improve Section** mode. Whole-section work lives in Draft Section; selection-level work lives in Edit Selection.

#### Draft Section

- Requires no document selection.
- Retains the existing section-specific ratings, prompts, model choice, and model comparison.
- Uses the latest Findings and eligible supporting sources from the portal.
- For an empty section, the action is **Generate draft**.
- For a populated section, the action is **Redraft section**.
- Always shows a proposal before replacing registered section slots.

#### Edit Selection

- Becomes actionable when selected text is inside the active section.
- Sends selected text, surrounding context, section identity, user instruction, and eligible portal sources to E8.
- Shows current and proposed text before Apply.
- Rejects stale proposals if the document changed during generation.

#### Ask the AI

- Uses the existing E8 question-answering/RAG capabilities and custom prompts.
- Includes citations to portal data and documents.
- **Use in report** transfers the answer into a reviewable Draft Section or Edit Selection proposal; it never inserts text silently.

### 5. Portal materials inside the sidebar

The sidebar includes a compact materials toolbar:

- Findings
- Supporting Documents
- Reference Information
- Transcripts & Recordings
- Team Meeting Minutes
- Diligence Home

The first five open an inline materials browser inside the sidebar so the user can inspect information without leaving Google Docs. Each view can also include **Open in portal** for the complete portal experience. Diligence Home opens the existing diligence page for the same application.

There is no ambient “updates since review” card.

### 6. Section context and ownership

The portal passes the application ID and section token when opening the document. E8 resolves that token to the section bookmark and sidebar context.

The add-on may check the cursor or selection every three to five seconds and immediately before an AI action. Google Docs does not provide a dependable selection-change event for this workflow, so polling is a guardrail.

If the cursor moves into another registered section, the sidebar asks whether to switch. It never changes section context silently.

Ownership is advisory. Users may use AI in sections they do not own, but the first AI write in that section asks:

> You are not the owner of this section. Continue?

Opening or manually editing the section does not trigger that warning.

## Template adaptation

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

Whole-section generation returns structured content keyed by slot token rather than Markdown headings. This removes the current heading-parser translation risk.

Add a bookmark at every major section for portal deep links.

## Technical approach

### Components

1. **Existing portal diligence UI** — unchanged research workspace, with a simplified Report subtab handoff.
2. **E8 backend** — idempotent document creation, identity and authorization, prompt assembly, RAG, proposals, audit, and revision-safe Docs writes.
3. **Google Docs Editor add-on** — sidebar UI, cursor/selection reads, inline materials browser, and E8 API client.
4. **Google Drive/Docs APIs** — template copy, bookmarks, named ranges, structured writes, sharing, and revision control.

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
- `GET /diligence/api/docs-addon/materials?document_id=...&section_token=...&type=...`
- `POST /diligence/api/docs-addon/draft-section`
- `POST /diligence/api/docs-addon/revise-selection`
- `POST /diligence/api/docs-addon/compare-models`
- `POST /diligence/api/docs-addon/ask`
- `POST /diligence/api/docs-addon/apply-proposal`
- `GET /diligence/api/docs-addon/actions?document_id=...`

The backend retains prompts, source eligibility, retrieval, AI keys, authorization, and audit logic. Apps Script never receives portal cookies, service-account credentials, or model keys.

### Concurrency and safety

- Read the document revision before proposal generation.
- Fingerprint the selected text or registered section content and limited surrounding context.
- Use Google Docs revision controls when applying.
- If the source changed, require proposal refresh.
- Apply whole-section output only to registered content slots; never replace fixed headings or adjacent sections.
- Google Docs version history remains canonical for human edits.

### Audit record

Store:

- user, application, document, section, and timestamp
- mode: draft section, edit selection, or Ask the AI transfer
- model and user guidance
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
- All AI writes require an explicit preview and Apply.
- Google Docs Editor add-ons are desktop-only. Mobile users retain the existing portal Findings and materials experience plus normal Google Docs editing; selection-aware E8 assistance is unavailable on mobile.

## Rollout

### Phase 1 — Technical spike

- Replace one section's Report subtab with the Google Docs entry state.
- Ensure/create one shared report document idempotently.
- Deep-link from Product to the Product bookmark.
- Open the sidebar scoped to Product.
- Generate an empty Product section into registered slots.
- Read, preview, and replace a plain-text selection.
- Test Chrome and Safari with two collaborators.

### Phase 2 — Internal pilot

- All report sections and template slots.
- Draft Section, Edit Selection, Ask the AI, ratings, and model comparison.
- Inline Findings, Supporting Documents, Reference Information, Transcripts & Recordings, and Team Meeting Minutes.
- Ownership warning and AI action audit.

### Phase 3 — Migration

- Use Docs-native reports for new diligences.
- Import existing TipTap drafts once for diligences already underway.
- Keep finalized reports unchanged.
- Retire portal TipTap report editing after pilot success criteria are met.

## Success measures

- No report content is manually copied between the portal and Google Docs.
- Findings and the right rail remain fully usable and visually unchanged.
- First and later editors reach their section through the same portal entry point.
- Most launches require no manual section correction.
- Fixed headings and template formatting survive every AI action.
- AI never overwrites concurrently edited text.
- Users can inspect the evidence behind an answer or proposal while staying in Google Docs.
- “Which version is current?” support incidents decline materially.

## Validation plan

- Unit tests for ensure-and-open idempotency, bookmark resolution, slot validation, fingerprints, and structured output.
- Route tests for first creation, later open, concurrent creation, permission rejection, invalid mapping, and stale revision rejection.
- Google Docs integration tests for named ranges, bookmarks, paragraph/list/table rendering, and concurrent edits.
- Add-on tests for empty section, populated section, no selection, partial paragraph, multi-paragraph selection, cross-section selection, read-only document, and expired E8 auth.
- Browser smoke tests for the unchanged portal layout and section-level entry point.
- Chrome and Safari tests for the add-on, inline materials browser, and first/later editor flows.

## Decisions captured

- Preserve the existing diligence workspace and right rail.
- Change only report authoring and the Report subtab content.
- Put all draft-generation controls in the Google Docs sidebar.
- Use **Draft Section**, **Edit Selection**, and **Ask the AI**.
- Create the document on the first report-editing action, not team provisioning.
- Use one idempotent entry point for first and later editors.
- Show portal materials inline in the sidebar, with optional links back to the portal.
- Allow non-owner AI use after a warning.
- Do not show an “updates since review” card.

## Open questions

- Should the header-level Report button open the document at the beginning or return to the user's last active report section?
- Which Reference Information items may be exposed inside the add-on versus linked back to the portal because of permissions or sensitivity?
- Should applied proposals add a native Google Docs comment linking to the E8 audit record?
- How long should E8 retain full before/after proposal text?
