# Phase 1B.2c — Evidence capture and review

17 October 2026. Implementation on `codex/phase-1b2c-evidence-review`, based on clean sanitized `main` at `9ba5935`. Approved for feature-branch publication and a draft PR. Verification was captured before commit; no merge or deployment. Implementation began on 16 October; final acceptance was run on 17 October.

## Behavior

- All item assessment states, including unanswered and N/A, expose optional photographs in the existing expanded editor. Explicit answer choices, Concept B rows, the single expanded editor and petrol/teal styling remain.
- Collapsed rows show short photograph/note/retained-description indicators. These do not affect completion or attention classification.
- Editor and review show two compact contextual thumbnails. `Sjá allar myndir (N)` reveals the remainder in place. Each image opens a native modal identifying the room, item/overview, filename and position. The full image fits without cropping. Previewing creates no navigation history entries.
- Removal uses inline confirmation with cancellation focused first. Cancel restores the initiating removal control. Confirm releases the object URL and focuses a visible neighbouring thumbnail or upload control; a busy upload falls back to the photograph heading. There is no undo mechanism.
- Existing notes remain editable and neutral. Inactive nonempty defect fields appear in a collapsed, read-only `Varðveitt frávikslýsing` disclosure outside active defect fields. The explanation explicitly excludes this text from current findings. Returning to a state requiring defect details restores the original editable values.
- Review includes photographs attached to satisfactory and unanswered items, as well as existing findings, notes and retained-description-only items. Room-overview photographs appear in their room card. Review remains read-only for photograph removal and retains precise editor/return links.
- Every gallery identifies previews as temporary. Upload guidance states that photos disappear on reload/closing and are not permanently saved. JPEG, PNG and WebP only; eight photos per attachment area; maximum 10 × 1024 × 1024 bytes per file, including the exact boundary. Real decoding is required.

## Data boundaries

`DemoStore.addPhoto` checks the current target and eight-photo limit synchronously after asynchronous decoding. Rejected additions release their URLs, including results arriving after a target was removed. Accepted photos keep the original ID-based association during navigation. Removing a room retains the existing cleanup behavior. Loading/read-protected stores reject photo mutations. Photo operations preserve pending-write errors and retry state.

Evidence controls call no report persistence or navigation mutation methods. Regression assertions compare exact report-storage bytes, all localStorage values, report statistics, assessment values, row status, timestamps and save indicators before/after add, inspect, cancel and remove. Direct store contracts also verify zero report writes, unchanged report references/status and URL cleanup. Explicit editing of an item note continues to use existing report persistence.

No report schema, storage key/version, assessment/completion function, navigation adapter/metadata format, dependency, lockfile, global stylesheet, backend, authentication, database, permanent media storage or PDF implementation changed. Original archive checkouts were not edited. Tests use disposable contexts with synthetic data and synthetic in-worker storage; no personal browser profile or existing personal draft was accessed.

## Exact changed files

Application:

1. `src/components/context-dialog.tsx` — optional preview-specific close label; existing default retained.
2. `src/components/demo-provider.tsx` — photo acceptance/read-protection guards; persistence remains unchanged.
3. `src/components/inspection-checklist.module.css` — scoped wrapping for enlarged text in inspection navigation/footer and item row actions.
4. `src/components/observation-editor.tsx` — optional photographs, content indicators, retained-description disclosure and room context.
5. `src/components/photo-preview.tsx` — live-state validation, shared gallery, upload announcements and temporary/HEIC guidance.
6. `src/components/screens/inspection-screen.tsx` — passes current room/item context.
7. `src/components/screens/review-screen.tsx` — contextual galleries and retained/current separation; handles photo-only observations safely.
8. `src/components/evidence-gallery.tsx` (new) — shared compact thumbnails, native preview and guarded removal; retained-description disclosure.
9. `src/components/evidence.module.css` (new) — scoped evidence styling and enlarged-text review reflow.
10. `src/lib/inspection-evidence.ts` (new) — pure retained-description presentation predicate using existing `requiresDamage`.

Regression tests:

11. `tests/inspection-checklist.spec.ts` — continued optional access replaces the old damage-only expectation; retention assertions remain.
12. `tests/prototype.spec.ts` — neutral item-photo input label.
13. `tests/inspection-evidence.spec.ts` (new) — evidence independence, retention, review, validation, concurrency/lifecycle, protection/retry, keyboard, store contracts and five-width captures.

Review evidence:

14. `docs/PHASE_1B2C_EVIDENCE_REVIEW.md` (this file).
15. `docs/qa/phase-1b2c/README.md` (new).
16. `docs/qa/phase-1b2c/verification-summary.json` (new).
17. `docs/qa/phase-1b2c/320-preview-text-200.png` (new).
18. `docs/qa/phase-1b2c/360-editor.png` (new).
19. `docs/qa/phase-1b2c/390-review.png` (new).
20. `docs/qa/phase-1b2c/768-review.png` (new).
21. `docs/qa/phase-1b2c/1440-review.png` (new).

Generated logs, the production-server test override, full-size captures, traces and HTML report remain ignored under `artifacts/phase-1b2c/`.

## Verification

| Check | Final result |
| --- | --- |
| Complete production-server regression suite | **287 passed, 4 expected skips, 0 failures, 0 flaky tests** in 276.6 seconds. Desktop: 97 passed; 360 px: 95 passed/2 skipped; 390 px: 95 passed/2 skipped. |
| Evidence coverage | 40 passing executions, including the five-width matrix; existing navigation: 57 passed; existing local-data safety: 36 passed. |
| ESLint | Passed with no warnings. |
| TypeScript | Passed. |
| Production build | Passed, Next.js 16.4.0. |
| Browser/accessibility matrix | 45 audited states at 320, 360, 390, 768 and 1440 px; 200% text in editor, review and preview. Zero recorded axe violations, rendered-contrast failures, document horizontal overflows, page errors or console errors. |
| Keyboard and touch | Preview trap, Tab/Shift+Tab, Escape/trigger focus, removal cancellation/confirmation focus and existing native assessment/navigation regressions passed. New evidence targets meet 44 px checks. |
| Data safety | Exact report bytes, timestamps, assessments, completion, save state, navigation metadata and unrelated storage remain unchanged during evidence-only operations. Read protection, pending-write retry, current photo cap, removed-target rejection and URL cleanup passed. |
| Git | Pre-publication acceptance snapshot: 21 changed files, 9 modified and 12 new; index empty; HEAD `9ba5935`; whitespace check passed. No merge or deployment. |

The four skips are duplicate intermediate-width checks (two existing mobile skips) and duplicate five-width capture cases (two mobile skips; the desktop case creates all five contexts).

Final results are recorded in [the verification summary](qa/phase-1b2c/verification-summary.json). Curated screenshots and provenance are indexed in [the screenshot record](qa/phase-1b2c/README.md).

Local generated records: `artifacts/phase-1b2c/full-suite.log`, `artifacts/phase-1b2c/results.json`, `artifacts/phase-1b2c/report/index.html`, `artifacts/phase-1b2c/lint.log`, `artifacts/phase-1b2c/typecheck.log` and `artifacts/phase-1b2c/build.log`. These paths identify intentionally ignored local records; the files are unavailable in a clean GitHub checkout and are not part of the 21-file review set. The committed verification summary and curated screenshots linked above provide the portable evidence.

The full suite runs against `next build` / `next start` on a separate local port. The normal desktop, 360 px and 390 px projects cover the complete application, concepts, navigation, report recovery and evidence flows. A dedicated test uses a new browser context for each width: 320, 360, 390, 768 and 1440 px. It audits editor, populated/empty gallery, retained text, removal confirmation, review and preview; doubles computed text sizes in editor, review and preview; verifies keyboard trapping/dismissal and 44 px evidence controls; checks contrast, axe WCAG A/AA tags, runtime errors and document overflow.

Initial diagnostic runs found narrow enlarged-text overflow in the existing stepper, review counters and room footer. Inspection/review-scoped wrapping corrected it. Narrow rows can wrap actions below the heading when enlarged text needs more room. Visual inspection also corrected a stacked thumbnail grid at 360 px and removed inherited list borders/spacing from nested review thumbnails. Screenshot capture now explicitly waits for the review heading, avoiding captures of the loading shell. Test selectors and navigation synchronization were corrected without weakening the acceptance assertions. Earlier diagnostic logs and interrupted pre-refinement suite logs are retained separately; only the completed final run counts as acceptance.

## Remaining limitations

- Photographs exist only as in-memory local blob previews. Reloading or closing loses them; missing-photo warnings return. No persistent evidence or recoverable media is provided.
- There is no capture chronology, assessment-at-attachment, provenance, verification status or history model. Photographs and notes cannot be classified by past/current condition from the available data. A future professional report must exclude inactive retained descriptions from current findings unless separately authorized by supporting data.
- HEIC/HEIF conversion is absent. On a physical iPhone, camera/library availability and the format returned by the picker depend on the browser, device settings and original media. Desktop viewport/touch emulation cannot establish camera permissions, actual capture or library compatibility. Select JPEG, PNG or WebP; this phase adds no conversion infrastructure or dedicated camera flow.
- Browser verification uses Chromium. Physical iPhone/Android camera/library flows, Safari, Firefox and manual screen-reader sessions remain unverified. Automated axe/contrast and keyboard testing are not full accessibility certification.
- Existing browser-local draft persistence, recovery protections and best-effort navigation metadata remain. Cross-tab conflict resolution, device synchronization and broader history/undo policies are outside this phase.
