# Phase 1A implementation review — 14 October 2026

Implemented the approved Concept 2 desktop foundation and Concept 1-inspired mobile list in the working application. This is the completed shell/reports implementation for review; it does not start Phase 1B. The earlier handoff and prototype artifacts remain historical records.

## Result and scope

- Desktop uses a 64 px petrol rail, grouped reports register and selected-report context. The old resume card, outer table card and marketing note have been removed.
- Search, status/asset filters, reset, result counts and Icelandic sorting are preserved. Sorting applies within the unfinished/reviewed groups. Report title and continuation links still go directly to the established routes.
- Selection reconciles with the filtered live store. The panel calculates progress, incomplete/unconfirmed answers, rooms, deviations and missing photo previews from current data. Reviewed samples and zero-room/zero-item drafts have explicit, honest states.
- The persistent panel is available from 1100 px; narrower layouts expose the same context in an optional named native modal. At 640 px and below, the register becomes a separated mobile list with labelled status/asset controls and direct actions. Navigation stays in the document flow.
- Native modal background inertness, explicit Tab wrapping, Escape, sticky close control, scroll locking/restoration and trigger focus restoration are implemented. If a resize hides the trigger, focus returns to the main landmark. Desktop selection keeps focus on its button and displays “Valin” as well as a border/highlight.
- The existing Manrope font and navy/petrol/teal tokens are retained. Real save status is now visible on mobile too. Sample notice, damaged-data warning and retry remain available.

## Changed files

| File | Change |
| --- | --- |
| [app-shell.tsx](../src/components/app-shell.tsx) | Rail, header, mobile navigation and sample help |
| [reports-screen.tsx](../src/components/screens/reports-screen.tsx) | Register, live selection, controls and mobile list |
| [report-overview.tsx](../src/components/report-overview.tsx) | New shared live report context and unchanged destination rules |
| [context-dialog.tsx](../src/components/context-dialog.tsx) | New reusable accessible modal/sheet |
| [globals.css](../src/app/globals.css) | Scoped shell/register/context styles; removal of unused old shell/report selectors |
| [prototype.spec.ts](../tests/prototype.spec.ts) | Mobile status selector adapted; existing behavior assertions retained |
| [readability.spec.ts](../tests/readability.spec.ts) | Hover target adapted to the register |
| [contrast-helpers.ts](../tests/contrast-helpers.ts) | New filter/dialog boundaries included in actual rendered contrast audits |
| [reports-shell.spec.ts](../tests/reports-shell.spec.ts) | Eight new behavior/accessibility cases across three viewport projects |
| [capture-approved-shell.mjs](../scripts/capture-approved-shell.mjs) | Reproducible isolated browser screenshots |
| [eslint.config.mjs](../eslint.config.mjs) | Excludes generated/historical artifacts from source linting; fixes the existing historical compiled-fixture lint error without editing the preserved prototypes |

The [before-source hashes](../artifacts/approved-shell-2026-10-14/baseline/source-hashes.json) and [verification summary](../artifacts/approved-shell-2026-10-14/verification-summary.json) show three changed existing application files: shell, reports screen and global CSS. Twenty-eight other previously captured source/config/lock files are byte-identical. In particular, remaining screen components, domain model, fixtures, provider, observation/photo editing, routes, dependency manifests and lockfile are unchanged. The lint config and test/QA additions are listed above separately.

No Git metadata exists in this workspace. No repository initialization, commit, push or deployment was performed. No dependency was added to the project. Formatting used an ephemeral Prettier command. Previous Playwright reports/results were copied into the new artifact set's `baseline/` before testing.

## Fresh verification

The final full test run used the local optimized production server (`npm run build`, then `npm run start` at `http://127.0.0.1:3000`).

| Check | Result / evidence |
| --- | --- |
| `npm run typecheck` | Passed; [stdout](../artifacts/approved-shell-2026-10-14/typecheck.log) |
| `npm run lint` | Passed, no errors or warnings; [stdout](../artifacts/approved-shell-2026-10-14/lint.log) |
| `npm run build` | Passed; optimized build, TypeScript and static/dynamic route generation succeeded |
| `npm test` | 70 passed, 2 expected skips, 0 unexpected/flaky; [stdout](../artifacts/approved-shell-2026-10-14/tests.log), [machine report](../artifacts/approved-shell-2026-10-14/playwright-results.json), [HTML report](../artifacts/approved-shell-2026-10-14/playwright-report/index.html) |
| Axe | Zero violations in tested WCAG A/AA-tagged states on all six screens and selected/draft/sample/modal/help/empty/warning contexts |
| Computed contrast | 6,059 checks over 54 audited states, including 4,115 text/placeholder checks; minimum text **5.9815:1**, relevant non-text **3.2441:1**; zero contrast, size or opacity failures |
| Focus | Tested visible 3 px outlines with contrast ≥3:1; manual browser inspection confirmed skip link, report trigger and dialog focus outlines |
| Responsive | 63 fresh captured states at seven widths; no horizontal page overflow or browser page errors |
| Long content/reflow | Additional context screenshots at 1024, 768, 720, 360 and 320 CSS px; long/unbroken title, room name and deviation description wrap without page or sheet overflow |

The two skips are duplicate intermediate-width checks in the mobile projects; that coverage runs once in the desktop project. Measured contrast results describe the actual rendered tested states and are not a WCAG certification. Full detailed findings are retained in the copied test outputs and verification summary.

Regression coverage retains creation → details → rooms → observations → review, incomplete drafts, persistence/reload, deviation descriptions, not-inspected versus not-applicable answers, room removal confirmation, temporary photo lifecycle, invalid images, storage failure/corruption and missing report recovery. New cases verify that selecting/filtering does not write draft data, changing rooms/answers updates context, photo counts change after client navigation and reset on reload, empty/zero-item data remains honest, storage retry preserves memory-only edits, and modal navigation restores normal scrolling.

## Screenshots and visual review

All new evidence is under [artifacts/approved-shell-2026-10-14](../artifacts/approved-shell-2026-10-14). [responsive-evidence.json](../artifacts/approved-shell-2026-10-14/responsive-evidence.json) indexes the captured states and viewport dimensions. `reports.png` is the full list; `reports-viewport.png` shows the initial viewport. Each viewport folder also contains active/draft/sample context, filtered and empty states. The three primary sizes include all six application screens, sample help and storage warnings. Narrower viewport folders also contain initial/scrolled sheet screenshots.

| Width | Reports | Context |
| --- | --- | --- |
| 1440 × 1000 | [Desktop](../artifacts/approved-shell-2026-10-14/desktop/reports.png) | [Active panel](../artifacts/approved-shell-2026-10-14/desktop/active-context.png), [draft](../artifacts/approved-shell-2026-10-14/desktop/draft-context.png), [sample](../artifacts/approved-shell-2026-10-14/desktop/sample-context.png) |
| 1280 × 900 | [Desktop intermediate](../artifacts/approved-shell-2026-10-14/width-1280/reports.png) | [Panel](../artifacts/approved-shell-2026-10-14/width-1280/active-context.png) |
| 1024 × 900 | [Tablet register](../artifacts/approved-shell-2026-10-14/width-1024/reports.png) | [Modal](../artifacts/approved-shell-2026-10-14/width-1024/active-context.png) |
| 768 × 900 | [Tablet](../artifacts/approved-shell-2026-10-14/width-768/reports.png) | [Modal](../artifacts/approved-shell-2026-10-14/width-768/active-context.png) |
| 641 × 900 | [Intermediate](../artifacts/approved-shell-2026-10-14/width-641/reports.png) | [Modal](../artifacts/approved-shell-2026-10-14/width-641/active-context.png) |
| 390 × 844 | [Mobile](../artifacts/approved-shell-2026-10-14/mobile-390/reports.png) | [Sheet](../artifacts/approved-shell-2026-10-14/mobile-390/drawer-viewport.png), [scrolled sheet](../artifacts/approved-shell-2026-10-14/mobile-390/drawer-scrolled.png) |
| 360 × 800 | [Narrow mobile](../artifacts/approved-shell-2026-10-14/mobile-360/reports.png) | [Sheet](../artifacts/approved-shell-2026-10-14/mobile-360/drawer-viewport.png) |

Fresh desktop and narrow-mobile screenshots of the six screens were visually inspected, together with tablet/intermediate layouts, warning, context, empty/filter and long-content states. No title/control collisions or horizontal clipping were found. Long context uses normal page scrolling on desktop and a scrollable modal with a sticky close control on mobile. All direct report actions remain available without opening context.

Manual browser keyboard review at 390 and 1440 px confirmed logical order from skip link → main creation/search/filters → report title/direct action/optional preview; opening context focuses close, Shift+Tab wraps to the final link, Tab wraps back, Escape restores the trigger, and desktop selection retains its focused control. The browser accessibility tree exposed the sheet's name and hid background content while modal. This is an accessibility-tree review, not a full screen-reader session.

## Remaining limitations / review boundary

- Browser tests ran in Chromium. Physical iOS/Android, Firefox/Safari and a real screen-reader session remain untested.
- Reflow was checked at CSS viewport widths equivalent to 200–400% zoom. The in-app browser zoom shortcut did not change viewport size/device ratio, so actual browser zoom is not claimed as verified.
- Tablet widths use the optional modal instead of squeezing the persistent desktop context beside the register. Mobile retains sorting in a separate readable control row.
- Existing local-only limitations remain: origin/browser-specific mutable drafts, no concurrent-tab protection and non-durable in-memory photo previews. No backend, authentication, invitations, payment, comparison or PDF capability was introduced.

Phase 1A is implemented and ready for review. Further work requires a separately scoped request.
