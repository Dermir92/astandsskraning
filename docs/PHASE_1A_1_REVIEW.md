# Phase 1A.1 mobile refinement — 14 October 2026

Implemented the targeted mobile refinement of the generally approved Phase 1A. Desktop Concept 2 remains intact. This review supersedes the earlier mobile presentation described in [Phase 1A](PHASE_1A_IMPLEMENTATION_REVIEW.md); that report and its artifacts remain preserved.

## Changes

- Mobile has one primary “Ný skýrsla” CTA. The extra navigation row and long demo banner are removed below 801 px. The brand link still returns to reports, existing screen back links remain, and “Sýnihamur” opens the explanatory help. Save state and storage warnings/retry remain visible and truthful.
- Search stays directly available. “Sía og raða” expands labelled status, asset and sorting controls, with sorting paired with reset rather than occupying an isolated row. The collapsed control displays active filter count and current sorting. Native select behavior, result counts, clear/reset, matching and Icelandic sorting use the same state and rules as before.
- Mobile rows show report title, property information, status, meaningful progress and the next action. Secondary dates are omitted from mobile scanning. Padding and stacked actions are reduced while maintaining 44 px targets and 13–16 px working text.
- Report-name buttons with a disclosure indicator open quick context; each separate, labelled action directly opens registration, draft details or the sample report. Reviewed fixtures now say “Skoða sýniskýrslu” on mobile. Desktop titles, “Valin” selection, row actions and the context panel retain their existing behavior.
- Report buttons expose property information and the preview/continuation distinction through accessible descriptions. The existing named native modal keeps background inertness, Tab wrapping, Escape, sticky close and focus restoration. Filter Escape restores its toggle. Reset moves focus to the toggle before its button becomes disabled.
- At 320 CSS px, expanded fields stack to preserve readable controls during narrow/zoom reflow. All new presentation rules are limited to 800 px and below; no new project dependency was added.

## Measured result

Fresh isolated production-server captures compare the same fixture data with the before snapshots:

| Viewport | First report before → after | Fixture row height before → after | Reports fully visible at top |
| --- | --- | --- | --- |
| 360 × 800 | 529.8 → 299.7 px | 191.8 → 121.4 px (**36.7% shorter**) | 4 |
| 390 × 844 | 529.8 → 299.7 px | 191.8 → 121.4 px (**36.7% shorter**) | 4 |
| 768 × 900 | 608.8 → 302.0 px | 121.0 → 121.4 px | 4 |

The 1440 × 1000 initial desktop screenshot is **pixel-identical** to the baseline: zero changed pixels. The full desktop report list was also captured and visually reviewed. Long content can still wrap and increase a row's height; there is no forced truncation of report titles or property information.

## Verification

The final full run used `npm run build` followed by the optimized local server (`npm run start`, `http://127.0.0.1:3000`).

| Check | Result |
| --- | --- |
| TypeScript, lint, production build | Passed; [typecheck](../artifacts/phase-1a-1-2026-10-14/typecheck.log), [lint](../artifacts/phase-1a-1-2026-10-14/lint.log), [build](../artifacts/phase-1a-1-2026-10-14/build.log) |
| Existing and new browser suite | **85 passed, 2 expected skips**, zero unexpected/flaky; [stdout](../artifacts/phase-1a-1-2026-10-14/tests.log), [JSON](../artifacts/phase-1a-1-2026-10-14/playwright-results.json), [HTML report](../artifacts/phase-1a-1-2026-10-14/playwright-report/index.html) |
| Axe | Zero violations in the tested WCAG A/AA-tagged six-screen and expanded/collapsed/active/filter/demo/sheet states |
| Rendered contrast | **6,370 checks across 69 audited states**; 4,167 text/placeholder checks; minimum text **5.9815:1**, relevant non-text **3.1411:1**; zero contrast, size or opacity failures |
| Focus and targets | 44 px mobile touch targets verified; 3 px visible focus with contrast ≥3:1; filter Escape/reset and modal restoration tested |
| Responsive captures | 32 states at 360, 390, 768 and 1440 px; zero horizontal overflow or captured page errors |
| Reflow | Expanded filters at 720/320 CSS px, plus existing long-title/room/deviation context coverage at 1024/768/720/360/320 px |

The two skips are the existing duplicate intermediate-width checks in mobile projects; those checks run once in the desktop project. [Verification summary](../artifacts/phase-1a-1-2026-10-14/verification-summary.json) contains the measured counts, source preservation and comparison; [responsive evidence](../artifacts/phase-1a-1-2026-10-14/responsive-evidence.json) records individual states and row metrics.

Existing regression assertions are retained for creation, draft details, rooms, observations, deviations, temporary images, reload persistence, failed/corrupt storage, retry and missing report recovery. Tests now identify the mobile title as a preview button and assert original destinations through the row's direct action. New tests cover the single CTA, compact initial list, disclosure keyboard order, filter/sort indicators, reset focus, explicit action semantics, accessible property descriptions, reflow, touch targets and expanded-control contrast.

Manual browser keyboard review confirmed skip → creation → search → disclosure order, native filter selection, sorting, active-filter text after collapse, Escape restoring the filter toggle, title opening the sheet, first focus on close, backward/forward wrapping and Escape restoring the title. The accessibility tree exposed the disclosure's expanded/collapsed state, named controls and report/property semantics; while modal, background content was absent from that tree. Actual screenshots were visually inspected for hierarchy, readable metadata, overlaps, target spacing and filter/sheet states.

## Screenshots

All fresh artifacts are under `artifacts/phase-1a-1-2026-10-14/`. The copied test outputs also contain narrow reflow, long-content and six-screen regression screenshots.

| Viewport | List at top | Several entries | Expanded filters | Bottom sheet |
| --- | --- | --- | --- | --- |
| 360 | [Top](../artifacts/phase-1a-1-2026-10-14/mobile-360/reports-top.png) | [Scanning](../artifacts/phase-1a-1-2026-10-14/mobile-360/reports-scanning.png) | [Filters](../artifacts/phase-1a-1-2026-10-14/mobile-360/filters-expanded.png) | [Sheet](../artifacts/phase-1a-1-2026-10-14/mobile-360/bottom-sheet.png) |
| 390 | [Top](../artifacts/phase-1a-1-2026-10-14/mobile-390/reports-top.png) | [Scanning](../artifacts/phase-1a-1-2026-10-14/mobile-390/reports-scanning.png) | [Filters](../artifacts/phase-1a-1-2026-10-14/mobile-390/filters-expanded.png) | [Sheet](../artifacts/phase-1a-1-2026-10-14/mobile-390/bottom-sheet.png) |
| 768 | [Top](../artifacts/phase-1a-1-2026-10-14/tablet-768/reports-top.png) | [Scanning](../artifacts/phase-1a-1-2026-10-14/tablet-768/reports-scanning.png) | [Filters](../artifacts/phase-1a-1-2026-10-14/tablet-768/filters-expanded.png) | [Modal](../artifacts/phase-1a-1-2026-10-14/tablet-768/bottom-sheet.png) |

Desktop: [1440 viewport](../artifacts/phase-1a-1-2026-10-14/desktop-1440/reports-top.png), [full list](../artifacts/phase-1a-1-2026-10-14/desktop-1440/reports-full.png), [before](../artifacts/phase-1a-1-2026-10-14/baseline/desktop.png). Mobile folders also contain active-filter, scrolled-sheet, restored-focus, demo-help and storage-warning captures.

## Files and preserved scope

Application changes are limited to [app-shell.tsx](../src/components/app-shell.tsx), [reports-screen.tsx](../src/components/screens/reports-screen.tsx) and [globals.css](../src/app/globals.css). Thirty previously captured source/config/lock files are byte-identical, including the model, fixture data, provider, report overview, dialog, remaining screen components, routes and dependency manifests. Before hashes and source backups are in `baseline/`; source backups use `.before.txt` extensions to keep them outside compilation.

QA changes: [prototype.spec.ts](../tests/prototype.spec.ts), [reports-shell.spec.ts](../tests/reports-shell.spec.ts), new [report-list-helpers.ts](../tests/report-list-helpers.ts), new [mobile-refinement.spec.ts](../tests/mobile-refinement.spec.ts), and new [capture-mobile-refinement.mjs](../scripts/capture-mobile-refinement.mjs). Prior Phase 1A evidence remains in its own artifact directory.

No business rules, report data, persistence schema, backend, authentication, PDF or payment capability changed. No Git metadata exists here; no initialization, commit, push or deployment occurred. The optimized server remains local for review. Phase 1B was not started.

## Remaining limitations

Chromium desktop/mobile viewport simulation was used. Physical devices, Firefox/Safari and an actual screen-reader session remain untested. Accessibility-tree inspection and automated checks are not WCAG certification. Reflow was checked at zoom-equivalent CSS widths; actual browser zoom remains unverified because the in-app browser's zoom shortcut did not change its viewport/device ratio in the earlier review.

Phase 1A.1 is implemented and stopped for review.
