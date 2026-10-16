# Phase 1B.2b — Exact inspection resume and navigation

16 October 2026. Approved for commit and push on `codex/phase-1b2b-inspection-navigation`, based on sanitized `main` at `e8d838aa73a40ed7a866e247b6cb3081d1e0f308`. Publication is limited to the feature branch and a draft pull request; merge and deployment are not authorized. Only the canonical sanitized development repository was used.

## Result

The approved Concept B checklist now resumes a deliberately visited report/room/item, exposes precise incomplete-item links, and supports item-specific review editing and return. Room and item navigation replaces the current inspection history entry; ordinary answers and typing create no entries and never advance the checklist.

- Explicit `rymi` and `atridi` destinations override stored position, including room-only links. Invalid explicit destinations cannot redirect to a different saved item.
- Continue also supports previously visited residential inspections with no condition answers. Never-visited drafts keep their apartment-details entry. Sample/non-residential routes retain their existing behavior.
- The last deliberately activated item remains the continuation position after closing its editor or using a condition-only quick answer. Those quick answers retain the compact collapsed behavior; later reload/Continue reopens that item.
- One inline **Ófullskráð atriði** disclosure lists incomplete items by room. **Ósvarað** distinguishes observations without meaningful input from **Ófullskráð** observations with partial answers or text.
- **Næsta ófullskráða atriði** searches after the current item and wraps once. It excludes completed unknown/untested items and does nothing automatically during editing. Only-current and all-complete states have explanatory text.
- Existing review findings and a compact per-room item index link to exact items. **Aftur í yfirferð** restores the stable source-item link, or its room/review heading if unavailable. The source-item link survives the disappearance of an original flagged finding.

## Navigation and persistence boundaries

`src/lib/inspection-navigation.ts` contains the independently testable position adapter, destination resolver, URL builders and classification/navigation helpers. Its storage dependency is injected for direct defensive-contract testing. The client hook coordinates this layer with the existing report snapshot; it has no report-mutation callback.

One independent localStorage key per report uses `astandsskraning-navigation-v1:<encoded-report-id>`. Its exact payload is `{ version: 1, roomId, itemId }`, with `itemId` a string or null. Reads validate JSON, version, fields and a 4096-character size bound; key length is bounded too. Membership is validated against the current report. Unknown fields and malformed/unsupported documents are rejected. There are no answers, report timestamps, names, photograph URLs or review snapshots in the payload.

Read failures or unsupported position documents preserve their original bytes and disable writes to that metadata entry for the loaded session. Write failures leave an in-memory position and a non-blocking Icelandic notice. Neither changes DemoStore's save status, valid pending writes or retry. Metadata writes are disabled during report read protection. Report validation, its JSON envelope/key/version, inspection business rules and media architecture are unchanged.

Resolution order:

1. Explicit room/item URL. A valid room without an item opens its checklist. A stale item keeps its valid room without opening another item.
2. With no explicit destination, valid saved position. A deleted saved item retains its valid room; a deleted room falls back safely.
3. Existing first-incomplete-room, then first-room fallback. No rooms and missing reports retain their existing recovery paths.

Duplicate parameters, ambiguous identifiers and item-without-room destinations cannot establish an exact item. Fallback/continuation URL normalization replaces history rather than adding entries. All generated destinations use fixed application routes and encoded IDs.

Completeness remains `observationComplete`; attention remains `needsAttention`. Incomplete totals reuse `total - recorded`. The entirely unanswered/partial split considers meaningful observation input, including subsidiary-only and note-only drafts, without changing model statistics. The existing missing-condition statistic is labelled **ástand vantar** in review. Deviation and missing-photo warnings remain distinct from answer completeness. Temporary previews never establish answer completeness or become persistent navigation data.

## Focus and review return

Explicit destinations expand one editor and focus a neutral missing-answer group or item heading. Text inputs are not automatically focused to open a touch keyboard. Local row interactions retain their established focus behavior; closing restores the row toggle. Focus requests run after the matching URL/editor has committed, once per deliberate destination. Save updates and typing cannot retrigger them.

Review source room/item IDs travel in fixed query parameters independently of the currently edited item. A one-use in-memory proof permits Back only for a directly originating review entry; room/item replacements preserve that preceding entry. Reloaded or externally opened edit links use the generated same-report review URL instead of guessing at history. Browser Back/Forward still resolves the URL before any saved position.

The implementation deliberately uses stable item/room anchors and native browser restoration rather than a pixel-scroll snapshot framework or persistent disclosure state. On return the relevant item-index disclosure opens, focus is restored without immediate scrolling, and the target is revealed only when outside the working viewport. Exact historical pixel offset is not promised.

The installed Next.js 16.4 guides were read before coding. Its native History API integration copies internal state itself; passing its internal `__NA` state back would bypass URL-hook synchronization. Review's new search-parameter hook is wrapped in Suspense for production builds.

## Verification

| Check | Final result |
| --- | --- |
| TypeScript | Passed. |
| ESLint | Passed with no warnings. |
| Production build | Passed, Next.js 16.4.0. |
| Complete production-server suite | **247 passed, 2 expected skips, 0 failures, 0 flaky tests**. |
| New navigation coverage | **57 passed**: 19 scenarios/contracts in desktop, mobile-360 and mobile-390. |
| Phase 1B.1a safety regression | **36 passed**, including protected raw data, valid pending-write retry and the 500-report boundary. |
| Existing regression coverage | **190 passed, 2 expected skips**, including the archived concepts and Phase 1B.2a checklist. |
| Four-width browser/visual verification | **28 states, 56 PNGs** at 360 × 800, 390 × 844, 768 × 1000 and 1440 × 1000, including doubled working text. Zero recorded page/console errors, horizontal overflows or automated WCAG A/AA, 2.1 AA and 2.2 AA violations. |
| Diff and isolation | `git diff --check` passed. Model, DemoStore, photo component, shared global CSS and dependency files are unchanged from sanitized main. |

Repository-contained evidence is in the [curated evidence record](qa/phase-1b2b/README.md) and [verification summary](qa/phase-1b2b/verification-summary.json). The two skips are the existing duplicated intermediate-width case in the mobile projects. Desktop has 83 passing tests; each mobile project has 82 passing tests and one expected skip.

The full generated logs, JSON/HTML test reports, capture harness and all 56 images remain **local-only, ignored output** under `artifacts/phase-1b2b/`. They are not included in a clean checkout and are deliberately not linked as repository evidence. The local QA configuration uses the production build on port 3116 without changing the tracked Playwright configuration.

Automated tests and captures use synthetic reports in disposable browser contexts or injected in-worker storage. The supervised walkthrough used a newly created synthetic draft through visible controls in a task-created browser tab. Existing drafts were not edited, cleared or replaced. Navigation-only automated checks compare exact report-storage bytes, including `updatedAt`, and preserve unrelated storage sentinels. Separate tests inject metadata read/write failures and report-only write failures.

The first full diagnostic run found an older clearing test that unconditionally toggled an item after return; precise resume now already opens it. The test now asserts that expanded state before exercising the unchanged clearing assertions. Earlier focused runs also exposed the Next history-state integration detail and a pre-commit focus request; both were corrected in application code. A dedicated condition-only quick-answer regression covers compact editor behavior. No completion, data-recovery or media assertion was weakened.

## Final supervised acceptance review

The complete residential path was explored through visible controls: create apartment → details → rooms → checklist; quick-good plus separate cleanliness; condition-only quick-good; expanded alternative condition/functionality and note entry; reload exact room/item; cross-room incomplete links and explicit next-incomplete; review-item editing and return; browser Back/Forward and keyboard Tab/radio behavior. Mobile review used explicit 360 × 800 and 390 × 844 viewports. The final build was checked again after corrections.

Two confirmed focus defects were corrected within the existing navigation hook:

- Reload detection was affecting later client visits and Back to the original entry. It is now restricted to the initial matching document entry, preserving neutral target focus on subsequent navigation.
- Native Back restoration could leave the focused review source link partly below the viewport. Review return now makes one bounded post-restoration visibility correction. It adds no pixel-scroll snapshot framework, history-depth tracking, controls or screens.

A new three-project regression covers reload → review edit → missing-group focus → fully visible source return → next-link keyboard focus → Back to the preceding inspection destination.

The mobile first actions remain visible, alternatives retain equal access, and one editor stays expanded. Navigation focuses headings or neutral answer groups rather than text inputs. No answer is selected by focus, and typing neither advances nor resets the viewport. The deliberately opened incomplete list can be long for a mostly unanswered apartment; selecting an item collapses it. This review found no confirmed reason to add more filtering or navigation layers.

Source review confirmed that navigation has no report mutation path and leaves `observationComplete`, `needsAttention`, report timestamps, read protection, pending-write retry, photograph association/storage behavior and Concept B answer controls unchanged.

## Curated screenshots

These six images accompany the implementation under `docs/qa/phase-1b2b/`, outside the ignored QA directory. Their [provenance and hashes](qa/phase-1b2b/verification-summary.json) distinguish supervised browser captures from automated fixture captures. They are unmodified screenshots containing synthetic data only.

| Width | Representative state |
| --- | --- |
| 360 | [Checklist opening](qa/phase-1b2b/360-checklist.jpg) · [Exact continuation after reload](qa/phase-1b2b/360-resume.jpg) |
| 390 | [Neutral incomplete-item focus](qa/phase-1b2b/390-incomplete-editor.jpg) · [Review return with visible source focus](qa/phase-1b2b/390-review-return.jpg) |
| 768 | [Grouped incomplete-item list](qa/phase-1b2b/768-incomplete-list.png) |
| 1440 | [Concept B checklist](qa/phase-1b2b/1440-checklist.png) |
## Exact changed files

| Git state | File | Purpose |
| --- | --- | --- |
| Modified | `src/app/skyrslur/[id]/yfirferd/page.tsx` | Review Suspense boundary. |
| Modified | `src/components/inspection-checklist.module.css` | Scoped disclosure, item-link and focus styling. |
| Modified | `src/components/observation-editor.tsx` | Navigation activation, neutral focus targets, partial state and next action. |
| Modified | `src/components/report-overview.tsx` | Continuation entry for previously visited unanswered inspections. |
| Modified | `src/components/screens/inspection-screen.tsx` | Exact destinations, incomplete access and bounded room/item history. |
| Modified | `src/components/screens/reports-screen.tsx` | Apply continuation-aware entry helpers. |
| Modified | `src/components/screens/review-screen.tsx` | Precise finding/item links, source anchors and accurate missing-condition wording. |
| Modified | `tests/inspection-checklist.spec.ts` | Scoped progress selectors and intentional URL/metadata expectations. |
| Modified | `tests/prototype.spec.ts` | Assert the resumed editor is open before exercising clearing. |
| New | `src/components/use-inspection-navigation.ts` | Client position subscription, destination/focus coordination and review return. |
| New | `src/lib/inspection-navigation.ts` | Independent metadata adapter and pure navigation helpers. |
| New | `tests/inspection-navigation.spec.ts` | 19 defensive contracts and browser scenarios across three projects. |
| New | `docs/PHASE_1B2B_INSPECTION_NAVIGATION.md` | This review and evidence links. |
| New | `docs/qa/phase-1b2b/` | Six curated images, evidence README and machine-readable verification summary; exact names are listed in that README. |

No change to `model.ts`, `demo-provider.tsx`, `photo-preview.tsx`, shared global CSS, package files, fixtures or archived concepts. No backend, authentication, database, payment, permanent media, dependency, Phase 1B.2c feature or unrelated refactor was added.

## Remaining limits

- Browser clearing/eviction and same-report last-writer metadata behavior remain best-effort. There is no new cross-tab report synchronization or conflict policy.
- Photographs remain temporary previews and disappear on reload; continuation is not a promise that photographs or failed report writes were saved.
- Chromium desktop/mobile emulation, axe checks and visual/keyboard verification are not WCAG certification. Physical-device camera/keyboard operation, manual screen-reader sessions, Safari and Firefox remain unverified.
- Stable review item/room return is supported; exact pixel-scroll restoration and reconstruction of every previously open disclosure are intentionally omitted.

Feature-branch publication and a draft pull request are approved. Stop after publication; merge and deployment require separate approval.

Pre-publication verification checkpoint: branch `codex/phase-1b2b-inspection-navigation`; HEAD matched the sanitized main base, with nine modified tracked files and twelve new files before staging. The six curated screenshots and their records belong to the approved publication; full generated QA output remains ignored and local. This checkpoint records the verified source state before the feature commit.
