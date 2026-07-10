# Design QA — Google Docs-Native Diligence Reports

## Evidence

- Source visual truth: current signed-in E8 diligence workspace captured at 2314 × 1196.
- Source report state: current signed-in Report subtab with TipTap and AI Edit Assistance captured at 2314 × 1196.
- Implementation: corrected portal state and Google Docs sidebar captured at 1265 × 712.
- Test states: first editor in Product, later editor in Team, first creation handoff, existing-document handoff, Supporting Documents browser, whole-section draft preview, and applied draft.

## Full-view comparison

The corrected portal mockup preserves the product's existing visual and interaction hierarchy: global navigation, company header, application context, Diligence/Application tabs, section rows, owner pills, section subtabs, and persistent right rail. The only material change is inside the active section's Report subtab, where the TipTap report editor becomes a compact Google Docs handoff.

## Focused comparison

The current Report subtab and proposed Google Docs editing state were compared together. Existing report actions, section-specific context, AI drafting, and revision controls move into the Google Docs sidebar. Findings and source categories remain available from the sidebar without replacing the portal research workspace.

## Findings and resolutions

- P0: none.
- P1: none.
- P2 resolved: replaced the separate report landing page with the current diligence workspace.
- P2 resolved: moved Generate Draft controls from the portal into the Google Docs sidebar.
- P2 resolved: renamed the modes to Draft Section, Edit Selection, and Ask the AI.
- P2 resolved: added explicit first-editor and later-editor scenarios using one idempotently created shared document.
- P2 resolved: added Findings, Documents, Reference, Calls, Minutes, and Diligence Home to the editing sidebar.
- P2 resolved: tightened sidebar spacing so the primary draft action remains visible at a standard laptop viewport.

## Interaction verification

- First editor creates one shared report and lands at Product: passed.
- Later editor opens the existing report and lands at Team without provisioning UI: passed.
- Supporting Documents opens inside the sidebar and returns to AI controls: passed.
- Whole-section draft produces a reviewable proposal before changing the document: passed.
- Applying the proposal updates the section and changes the action to Redraft section: passed.
- Ask the AI displays a cited answer and a reviewable Use in report handoff: passed.
- Section scope, owner warning, and cursor-switch patterns are present: passed.

## Comparison history

1. Initial concept introduced a separate report workspace and duplicated the portal's section navigation.
2. Corrected concept restored the existing diligence page and moved only report authoring to Google Docs.
3. Final pass tightened portal and sidebar density and verified first- and later-editor flows.

## Final result

passed
