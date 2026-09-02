---
title: Ambassador Guide (single-page rewrite)
status: draft
owner: jordan
created: 2026-09-02
last_updated: 2026-09-02
---

# Ambassador Guide — single-page rewrite

Replaces `/ambassador-guide` (audience picker + four-step entrepreneur wizard + light-touch page) with one article.

## Mockup files

- **`mockup.html`** — the whole page. Sections are a native exclusive accordion (`<details name>`); section 1 opens by default, opening another closes the rest. Copy buttons and the rail's current-section highlight work.
- `assets/` — Cosmica Semibold/Bold so headings render in the portal's display face.

## Design system

Colors, type sizes, line heights, radii, shadows, and the 800px reading rail are copied from `src/css/e8-design-tokens.css` under their real `--e8-*` names. Body prose is the `e8-reading` role (15px / 1.5), UI text is `--e8-text-base` (14.5px / 1.4), meta is 13px, eyebrows are 11px mono. Headings use `--e8-font-display` at weight 600.

## Sequence pattern

Numbered ring nodes on a connector line, a bold label and a one-line descriptor per node. Used for the page spine; stacks vertically under 640px. Reuse it anywhere the guide shows an ordered sequence.

## Structure

The conversation arc *is* the page. A four-step stepper sits under the header and acts as both diagram and navigation; the accordion sections below are those same four steps:

1. **Introduce E8** — who fits, the 30-second intro (copy block).
2. **Understand the company** — the five prompts, red flags.
3. **Explain E8's process** — a copyable, email-safe summary of the application-to-investment steps (copy block), FAQ pointer.
4. **Refer** — get their email, good fit / not a fit, Refer a Company CTA, follow-up email (copy block).

Clicking a step opens its section. The stepper mirrors the open section: earlier steps show a teal ring and connector, the current step is filled, later steps are grey.

Outside the arc:

- **Shortcut: If you only met them briefly** — an unnumbered section after the four steps, holding the short note (copy block). Reached from a branch row at the end of step 1 ("Only had a minute?"), since that's the moment the path forks.
- **Sticky rail** — *Refer* (the Refer a Company button, with the partner-referral note under it: skip the guide, log it), *Keep handy* (slide deck, FAQ), and the Do / Don't guardrails, which apply to every step and so live beside all of them instead of inside one.

## What changed from the live page and why

- **No audience picker.** Only the entrepreneur path exists, so the page is the entrepreneur guide. Member / Sponsor / Partner and "Coming soon" are gone.
- **No wizard.** Nothing is hidden behind Continue, nothing repeats per step (the live pitch carousel and resource tiles rendered on every step).
- **Every piece of content sits where it's used.** The intro under Introduce, "get their email" at the top of Refer, red flags under the prompts, the email template after the checklist that tells you to send it.
- **One pattern for copyable text.** Intro, follow-up email, and short note use the same copy block, and each links to e8angels.com and e8angels.com/entrepreneurs with the address as the visible text. Copy puts both rich text (links intact for Gmail) and plain text on the clipboard.
- **One primary action.** Refer a Company is the only filled button (rail + Refer section).

## Dropped

- Member / Sponsor / Partner cards and "Coming soon".
- The unlinked Investor / VC view in `content.js`. It had no entry point.
- The pitch "carousel". One version exists; it's a copy block.
- Wizard footer, progress bar, "Choose another pathway".
- A separate Resources section. The three resources live in the rail.

## Open questions

- Page title: "Bringing Entrepreneurs to E8" vs keeping "Ambassador Guide" as the H1.
- Guardrails in the rail vs. as a fifth accordion section. Rail keeps them visible at every step but is 232px wide.
