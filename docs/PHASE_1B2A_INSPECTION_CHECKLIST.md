# Phase 1B.2a — Concept B residential checklist review

> **Integrated implementation record.** The bounded Phase 1B.2a checklist is present in the current application. The stopped-for-review and original-main statements below describe the original review checkpoint. Preserved `/hugmyndir` routes are archived prototypes, not additional active inspection modes. See [the current entry point](../README.md) and [publication notes](PUBLICATION.md).

16 October 2026. **Implemented in an isolated worktree; stopped for product and UX review. No commit, merge, push or deployment.**

Worktree: `archived-worktrees/phase-1b2a-inspection-checklist`

Branch: `codex/phase-1b2a-inspection-checklist`. Base/HEAD: `d5c0615946caa385f591061705b1234adc3ef1dc`.

## Implemented scope

The actual editable residential inspection route now uses compact room rows with an explicit, neutral **Í lagi** answer beside an equally available **Annað ástand** action. Items start collapsed and unanswered; opening a row supplies no answers. Row summaries distinguish condition, recorded/incomplete state, deviation and attention using the existing completion/statistics functions.

Quick-good changes condition only. Required functionality and cleanliness remain separate native radio groups. Quick-good opens required assessments and folds the already selected condition into an editable summary. Alternative selection exposes all six condition radios; focus alone does not select an answer. Choosing a condition does not advance to another item or room. A condition-only quick answer can close the editor once no further assessment/evidence context is needed.

The focused editor retains all existing deviation fields and item notes. Condition/applicability changes preserve prior values and photo associations. Closing the editor restores focus to its row. Programmatic/keyboard focus reveals the visible control; pointer focus does not move controls during a click. The existing room selector/sidebar, previous/next-room destinations, progress calculations, report statistics and review route remain.

Room-overview photos are disclosed after the checklist. Item photos remain available under the existing damage rules only; the upload component, limits, validation, preview keys and truthful reload disclosure are unchanged. Optional attachments for other condition states remain Phase 1B.2c work.

## Files changed

| File | Purpose |
| --- | --- |
| [inspection-screen.tsx](../src/components/screens/inspection-screen.tsx) | Compact room composition, initially collapsed rows, one focused editor, room-overview disclosure; existing room navigation retained. |
| [observation-editor.tsx](../src/components/observation-editor.tsx) | Explicit row answers, complete status summaries, existing native answer groups and detail fields, editable folded condition and focus handling. |
| [inspection-checklist.module.css](../src/components/inspection-checklist.module.css) | Inspection-scoped spacing, 14–16 px working text, 44 px row actions, focus and responsive styling. No shared CSS change. |
| [inspection-checklist.spec.ts](../tests/inspection-checklist.spec.ts) | Nine integration scenarios × three projects: explicit answers, alternatives, data retention, statistics, media limits, navigation, focus/visibility, F03/write retry, accessibility/reflow. |
| [inspection-checklist-fixtures.ts](../tests/inspection-checklist-fixtures.ts) | Synthetic reports with stable IDs and mixed states; test-only. |
| [prototype.spec.ts](../tests/prototype.spec.ts) · [readability.spec.ts](../tests/readability.spec.ts) · [reports-shell.spec.ts](../tests/reports-shell.spec.ts) | Existing regression entry steps/selectors updated to open collapsed rows or the photo disclosure. Assertions and business expectations retained. |
| [local-data-safety.spec.ts](../tests/local-data-safety.spec.ts) | One explicit row-open step added to the normal 499 → 500 scenario. Every recovery assertion remains unchanged. |
| [This review](PHASE_1B2A_INSPECTION_CHECKLIST.md) | Scope, evidence, differences and next-slice recommendation. |

## Fresh verification

| Check | Result |
| --- | --- |
| TypeScript | Passed: [log](../artifacts/phase-1b2a/typecheck-acceptance.log). |
| Lint | Passed: [log](../artifacts/phase-1b2a/lint-acceptance.log). |
| Production build | Passed, Next.js 16.4.0: [log](../artifacts/phase-1b2a/build-acceptance.log). |
| Complete feature-worktree suite | **169 passed, 2 expected skips, 0 failures, 0 flaky tests**, 197.3 seconds: [log](../artifacts/phase-1b2a/acceptance-tests.log), [JSON](../artifacts/phase-1b2a/acceptance-results.json), [HTML report](../artifacts/phase-1b2a/acceptance-report/index.html). |
| Baseline application regression | **106 passed, 2 expected skips**. The two mobile duplicates of the desktop intermediate-width case retain their existing skip. |
| Phase 1B.1a recovery | **36 passed**: 24 browser scenarios plus 12 direct store-contract executions. Invalid/unsupported raw preservation, valid write retry and the 500-report boundary remain functional. |
| New inspection integration | **27 passed**: nine scenarios × desktop, mobile-360 and mobile-390. |
| Preserved isolated concepts | **21 passed**, separately from original unchanged main/prototype build on port 3114: A 9, B 9, shared separation/navigation 3. [Log](../artifacts/phase-1b2a/concept-verified.log). These are not integration tests against the feature build. |
| Four-width comparison | **32 inspection states**: four states × four widths × before/after. Zero recorded page errors, horizontal overflows or automated WCAG A/AA, 2.1 AA and 2.2 AA violations. [Capture log](../artifacts/phase-1b2a/capture-acceptance.log), [metrics](../artifacts/phase-1b2a/capture-evidence-final.json). |
| Shared register | Fresh before/after PNGs are byte-identical at all four widths. |
| Diff hygiene | `git diff --check` passed; only the listed implementation, regression and documentation files differ. Index empty. |

The production feature build runs locally on port 3115. All tests/captures used fresh disposable browser contexts with synthetic data, or synthetic in-worker storage. No existing user browser profile or draft was read, seeded, cleared or overwritten. Before/after capture actions produce equal report content after excluding the normal edit timestamp. The model, DemoStore, report JSON schema/key/version, fixtures, review screen, photo component, app shell, register, room-configuration screen, dependencies and shared global CSS were not modified.

During visual review, the first scrolling approach exposed an obscured mobile answer and then pointer-click interference. Both were fixed in application code, without weakening assertions: focus scrolling is gated to keyboard use, row actions reveal the needed group after activation, and the room footer no longer overlays controls. An 18-execution targeted verification passed before this complete successful suite. Earlier diagnostic logs/traces are retained in the new QA folder. Capture harness setup/label/type issues were also corrected before the successful capture run; they are separate from application results.

## Before/after screenshots

All states have viewport and full-page captures. The viewport can be scrolled to the active assessment; full-page images show the entire room. Synthetic photo evidence is labelled by its test filename and is not a real inspection.

| Width | State | Viewport | Full page |
| --- | --- | --- | --- |
| 360 | unanswered | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-unanswered.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-unanswered.png) | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-unanswered-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-unanswered-full.png) |
| 360 | satisfactory | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-satisfactory.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-satisfactory.png) | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-satisfactory-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-satisfactory-full.png) |
| 360 | incomplete | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-incomplete.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-incomplete.png) | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-incomplete-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-incomplete-full.png) |
| 360 | deviation | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-deviation.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-deviation.png) | [Before](../artifacts/phase-1b2a/screenshots-final/360/before-deviation-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/360/after-deviation-full.png) |
| 390 | unanswered | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-unanswered.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-unanswered.png) | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-unanswered-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-unanswered-full.png) |
| 390 | satisfactory | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-satisfactory.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-satisfactory.png) | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-satisfactory-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-satisfactory-full.png) |
| 390 | incomplete | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-incomplete.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-incomplete.png) | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-incomplete-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-incomplete-full.png) |
| 390 | deviation | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-deviation.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-deviation.png) | [Before](../artifacts/phase-1b2a/screenshots-final/390/before-deviation-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/390/after-deviation-full.png) |
| 768 | unanswered | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-unanswered.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-unanswered.png) | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-unanswered-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-unanswered-full.png) |
| 768 | satisfactory | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-satisfactory.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-satisfactory.png) | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-satisfactory-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-satisfactory-full.png) |
| 768 | incomplete | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-incomplete.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-incomplete.png) | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-incomplete-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-incomplete-full.png) |
| 768 | deviation | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-deviation.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-deviation.png) | [Before](../artifacts/phase-1b2a/screenshots-final/768/before-deviation-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/768/after-deviation-full.png) |
| 1440 | unanswered | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-unanswered.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-unanswered.png) | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-unanswered-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-unanswered-full.png) |
| 1440 | satisfactory | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-satisfactory.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-satisfactory.png) | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-satisfactory-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-satisfactory-full.png) |
| 1440 | incomplete | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-incomplete.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-incomplete.png) | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-incomplete-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-incomplete-full.png) |
| 1440 | deviation | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-deviation.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-deviation.png) | [Before](../artifacts/phase-1b2a/screenshots-final/1440/before-deviation-full.png) · [After](../artifacts/phase-1b2a/screenshots-final/1440/after-deviation-full.png) |

The first actionable condition button is fully visible initially at both mobile sizes: **y=526–570 px** at 360 × 800 and 390 × 844. Previously the first condition control was below the initial viewport, at y=950–996 and y=902–948 respectively. These are layout measurements, not inspection-time measurements.

Approved Concept B reference: [390 px opening](../artifacts/phase-1b-concepts/screenshots/390/b/01-opening.png), [390 px assessment](../artifacts/phase-1b-concepts/screenshots/390/b/04-assessment.png), [1440 px opening](../artifacts/phase-1b-concepts/screenshots/1440/b/01-opening.png). The implementation was visually compared with the preserved reference: compact room rows, focused expansion, neutral explicit answers, petrol/teal identity and separate assessments are retained.

## Differences from the prototype for review

- Every production row visibly names **Annað ástand** with the same neutral treatment and minimum height as quick-good, as required by the approval. The older prototype relied more heavily on opening the item row.
- Existing application steps and room selection controls remain, instead of the prototype's custom room/pause dialogs. No synthetic session store, scenario picker or sandbox state was imported.
- **The previous/next-room footer is in normal document flow after the room checklist, rather than sticky.** This prevents overlap with answer controls and the observed partial-target accessibility failure. Its actions and destinations remain unchanged; the room selector/sidebar remain available. Product review should confirm this placement.
- Exact room/item resume, incomplete queues, expanded review navigation and inline next-item navigation were not added. Optional photos outside existing damage rules were not added.

## Preservation and remaining limits

All **99 tracked original-main files**, **13 untracked concept/approval files**, and **1305 pre-existing QA files** match the pre-edit SHA-256 manifest. This includes all **206** original concept evidence files. Original main remains on `d5c0615946caa385f591061705b1234adc3ef1dc`; no branch switch, stash, reset or cleanup was performed there. The preservation archive retains SHA-256 `A3FB2E8423AD70CF7217DF7A6A0AAF0A31F5463720BCE70B6C2967F9CE7EF563`. [Before manifest](../artifacts/phase-1b2a/preservation-before.json); [final preservation checks](../artifacts/phase-1b2a/verification-summary.json).

No inspection business rule, automatic-answer rule, limit or persistence schema changed. Recorded remains answer completeness, not a claim of satisfactory condition; unknown/untested, not-applicable, incomplete and deviation states retain the existing model/review meaning. F03/F13 code is unchanged and its regressions pass.

No known blocker remains in the exercised Chromium desktop/mobile-emulation paths. Physical-device camera/virtual-keyboard behavior, screen-reader sessions, Safari/Firefox and OS text scaling remain unverified. Photographs are still temporary previews lost on reload. Exact item continuation is intentionally absent in this slice; rows reopen through explicit user action. Browser eviction/clearing and cross-tab conflicts retain their existing limitations.

## Recommendation for Phase 1B.2b

After product/UX review, implement exact report/room/item continuation and precise incomplete/review return as a separate bounded slice. Use separately validated navigation metadata without changing report serialization; explicit destinations must win, and deleted/stale targets must fall back safely. Add reload/Continue, browser-history, stale-target and keyboard-focus regressions. Keep optional photo-access changes for Phase 1B.2c. No Phase 1B.2b implementation has started.
