# Next implementation task — approved scope

**Implement Concept 2 as the desktop foundation for the shared application shell and “Mínar skýrslur”, with a simpler Concept 1-inspired mobile list and accessible contextual details interaction.** This document is a plan; the handoff task did not start implementation.

## Preparation

1. Read [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md), [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md), [UX_UI_HANDOFF.md](UX_UI_HANDOFF.md) and [DESIGN_ARTIFACTS.md](DESIGN_ARTIFACTS.md). Latest explicit approval supersedes historical recommendations in prototype artifacts.
2. Inspect Git/filesystem state again; the current workspace has no Git repository. Preserve local work. Do not initialize/commit/push/deploy by assumption. Follow `AGENTS.md` and installed Next docs before coding.
3. Run the app locally and inspect existing behavior and both standalone prototypes. Use fresh browser contexts for fixture QA; never clear the user's draft storage just to simplify testing.

## Implementation sequence

1. Update `src/components/app-shell.tsx` and scoped styles in `src/app/globals.css`: compact desktop rail and economical header; appropriate simple mobile navigation. Preserve skip link, page landmarks, actual save status, sample notice, storage failure warning/retry and existing destinations.
2. Update `src/components/screens/reports-screen.tsx`: remove the oversized resume panel and enclosing table card; build a readable report register based on Concept 2. Preserve search matching, asset/status filtering, clear/reset controls, counts, Icelandic sorting and report destinations.
3. Add a contextual panel derived from the selected **live store report**, using existing `model.ts` calculations. Show essential room/progress/missing-answer/deviation context, with a clear continuation/review action. Do not hard-code fixture counts or copy static prototype href logic. Select a valid report when filtering removes the old selection, and handle no results, missing IDs, drafts without rooms and reviewed sample records honestly.
4. On mobile, favor Concept 1's simple separated list and direct next actions. Expose context through a labelled, accessible drawer/bottom sheet if it helps. Support keyboard opening/closing, Escape, focus containment/restoration and scrolling without obscuring controls. Avoid introducing an unnecessary preview step before direct continuation.
5. Refine typography, spacing, navy/petrol/teal and focus/hover/disabled styles within approved scope. Any shared-shell changes affect every route; regression-check those routes without redesigning their internal content.
6. Run the verification below, inspect actual screenshots, fix failures and report evidence plus remaining limitations. Do not expand into backend/auth/storage/payment or redesign the remaining screens.

## Acceptance criteria

- Desktop has a compact rail, report register as the main workspace and useful selected-report context; no large resume box, KPI cards or decorative container grid.
- Mobile at 360/390 px has a clear report list, readable filters and next actions; no overlaps or horizontal page scrolling. Intermediate widths are coherent.
- All six reports and newly created drafts remain discoverable. Search/filter/sort combinations, counts and empty/reset states remain correct.
- Existing route behavior is preserved: active residential records continue registration; drafts open details; reviewed sample/non-residential fixtures open their appropriate summaries. Selecting context does not corrupt drafts or replace direct continuation.
- Panel contents reflect room/observation changes after returning to the list. Missing/zero-item cases do not show fabricated completion, invalid percentages or finalized status.
- Keyboard users can identify rail controls, search/filter/select, open/close context and continue. Selection does not lose focus. Drawer has an accessible name, contains focus while modal, restores its trigger and closes with Escape.
- Saved/error/memory/loading states remain truthful. Storage retry and damaged-data warning remain accessible. Existing localStorage key/schema and temporary-photo lifecycle are preserved.
- Normal text ≥4.5:1; large text/relevant non-text ≥3:1 in normal, hover, focus and disabled states. Dates, metadata, descriptions, placeholders and labels remain legible; status includes words/tokens beyond colour.
- Remaining screen contents retain their existing behavior/layout apart from the shared shell. No new feature, payment, external service, customer data or deployment is introduced.

## Tests and visual QA

Run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test`. Adapt existing tests only where approved layout changes legitimately change selectors/structure; retain behavior assertions. Add meaningful coverage for live contextual selection, filtering away selection, missing/empty report data and modal keyboard/focus behavior.

Existing `tests/prototype.spec.ts`, `tests/readability.spec.ts` and `tests/contrast-helpers.ts` cover creation, room editing/removal, observations, deviations, temporary photos, reload persistence, failed/corrupt localStorage, route errors, responsive overflow, focus and axe/contrast. Repeat that regression coverage on all six screens because shell/styles are shared.

Capture and manually inspect fresh desktop/mobile screenshots at 1440×1000, 390×844 and 360×800, plus sensible intermediate widths (existing app coverage includes 641/768/1024/1280). Check initial/list/filter/empty/selected contexts, drawer and save-warning states. Run axe WCAG A/AA tags and computed text/placeholder/non-text contrast checks; inspect disabled states and focus separately. Review keyboard/zoom and screen-reader interaction; document any physical-device/browser checks not performed.

Historical standalone `qa.mjs` protects hashes of 43 old production/doc/config files. It will intentionally fail its “unchanged source” assertion after authorized implementation. Preserve the historical report; do not rewrite it as new production evidence. Production acceptance belongs in the app's tests and a new dated QA artifact set.

## Ready-to-paste opening instruction

> Read docs/PROJECT_HANDOFF.md, docs/PRODUCT_DECISIONS.md, docs/UX_UI_HANDOFF.md, docs/IMPLEMENTATION_NEXT_STEPS.md and docs/DESIGN_ARTIFACTS.md. Implement the approved Concept 2 desktop shell and “Mínar skýrslur” layout, with a simpler Concept 1-inspired mobile list and accessible contextual drawer/bottom sheet. Preserve existing behavior, storage schema and photo limitations. Do not redesign the remaining screens or add backend, payments, deployment, commits or pushes. Inspect current workspace/Git status first, follow AGENTS.md, and verify actual desktop/mobile screenshots, keyboard behavior, regression tests and WCAG 2.2 AA contrast. Historical Concept 1 recommendations are superseded by the latest approval recorded in the handoff.
