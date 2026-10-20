# Phase 1B.3b.6 — Concept C report preview: implementation review

20 October 2026. Implemented against approved `main` at `88f1c6ea3a36f4166dcb77fd79d4d8b93198997e`, following the owner-approved [proposal](phase-1b3/planning/phase-1b3b6-concept-c-preview/PROPOSAL.md). Changes remain uncommitted for independent review. No commit, push, PR, merge, deployment or later-phase work is authorized or performed.

## Result and architecture

**Forskoða skýrslu** opens a dedicated, read-only `/skyrslur/[id]/forskodun` route from Yfirferð. The existing four steps remain unchanged. The reader preserves Concept C's white document surface, petrol/teal identity, findings-first hierarchy, ruled metrics, complete condition records, contextual photographs and evidence references. Report text uses the approved Arial/Segoe stack; the existing shell remains Manrope. There is no A4 page simulation or export/print control.

The pure `buildReportPreview` adapter borrows the current valid store snapshot, calls the existing domain helpers and constructs recursively readonly presentation data. It has no store writers, storage, browser/DOM, network, clock or blob-lifecycle dependency. The screen supplies today's UTC date only for existing warning calculations. The renderer receives no store, editing, media-removal or confirmation callbacks.

Current condition, function and cleanliness answers remain independent. Incomplete answers, explicit unexamined/untested states, factual heating responses, actual defects and inactive retained values remain distinct. Room statistics retain the exact helper definitions; property concerns, missing fields and evidence limitations are separately labelled. Repeated concerns/limitations for the same source fact share one issue identity. Unusual supplied broken/dirty answers outside a checklist dimension remain visible with the approved qualification and existing helper counts.

The adapter retains actual report/room/item/fire-row/meter-utility identity. Reader R/A/M references are view-local locators. Exact media target-key matching and collision checks prevent guessed associations or cross-report leakage. Ambiguous IDs disable guessed correction links; known orphan source text remains outside current findings. Unknown heating extensions are preserved in the original data and disclosed rather than interpreted.

Photographs remain existing session blob URLs. An association is separate from pending, successful or failed display. Failed images retain their reference and caption; absence after reload does not invent prior images or a lost-upload history. Accessible labels name the source context and filename without describing unverified visual content. The first two images can accompany an observation; additional images flow in a wider grid, retaining all source associations and full prose.

## Navigation and scope

Correction links go to the existing Yfirferð source sections/rows; their existing precise editor and return contracts remain unchanged. The main return uses a fixed same-report Yfirferð destination and focuses the entry link. No separate preview history store, navigation-position write, snapshot persistence or second provider is introduced. Native reading disclosures and internal anchors affect only the reading view.

Protected read errors block previewing fallback fixtures as the user's report. Valid pending edits remain visible with their actual save warning. The shell's preview-only error branch replaces its retry writer with a link to Yfirferð, where the original retry remains available. New/list navigation remains unchanged.

No persisted schema, validator, storage key/version, capture contract, room template, existing domain helper or historical approved design is changed. No backend/authentication, permanent image storage, sharing, payment, signing, report finalization, notice/approval workflow, comparison or production PDF/printing feature is included.

## Exact implementation changed-file list

| File | Change |
| --- | --- |
| `src/app/skyrslur/[id]/forskodun/page.tsx` — new | Production route wrapper, metadata and Suspense boundary. |
| `src/components/screens/report-preview-screen.tsx` — new | Current snapshot adapter entry; loading, read-error, missing and sample guards. |
| `src/components/report-preview-entry.tsx` — new | Review entry and safe return-focus target. |
| `src/components/report-preview.tsx` — new | Semantic document, source links, complete records, retained disclosures, view-only image availability and full-image dialog. |
| `src/components/report-preview.module.css` — new | Scoped Concept C typography/layout, responsive evidence, explicit focus and enlarged-text reflow. |
| `src/lib/report-preview.ts` — new | Pure typed mapping, helper parity, source/issue registry and exact media association checks. |
| `src/components/screens/review-screen.tsx` | Add the preview entry; existing review/correction logic unchanged. |
| `src/components/app-shell.tsx` | Preview-only save-error return link; original retry elsewhere unchanged. |
| `src/lib/locale/is.ts` | Icelandic preview copy and explicit draft/evidence/verification boundaries. |
| `tests/report-preview-fixtures.ts` — new | Synthetic small, incomplete, limited, 84-item and 100-item records plus frozen-input support. |
| `tests/report-preview-contract.spec.ts` — new | Domain parity, active/retained gates, dates, exact source/media identity and store nonmutation. |
| `tests/report-preview.spec.ts` — new | Browser reading/correction/error/evidence/preservation, 40-photo case, keyboard and five-width/enlarged-text audits. |
| `docs/PHASE_1B3B6_REPORT_PREVIEW_REVIEW.md` — new | This review and evidence handoff. |

Total: **13 implementation/review files: 3 modified, 10 new**. The approved proposal was already untracked at implementation start and remains unchanged; it is not an implementation change. Repository tests/configuration, dependencies and historical design/evidence files are not modified. Build/typecheck may update ignored generated build/cache files, including `tsconfig.tsbuildinfo`.

## Verification status

The final source passed lint/typecheck/build before the production regression; implementation source/tests were held unchanged throughout that completed regression. Final build ID: `Uf-7c58r-CVeW_S3ossA7`. The [build/check record](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/checks.json) and [full regression report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/full-04/html/index.html) are retained outside the checkout.

| Check | Actual result |
| --- | --- |
| `npm run lint` | Passed; zero warnings. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed, including the new production route. |
| Final focused adapter contracts | **11 passed**, no failures or skips. |
| New preview tests within final full run | **67 passed, 2 skipped**, no failures; 33 adapter executions and 34 browser executions. |
| Final full production regression, two workers, zero retries | **838 passed, 22 skipped, 1 failed by timeout**, 0 flaky classifications; 861 executions, 21.5 minutes. |
| Unchanged timed-out test, isolated one-worker rerun | **1 passed in 55.8 seconds**, original assertions and 180-second timeout retained. |
| Illustrated visual-reading session | **1 passed**, five real session uploads, all five widths, doubled text, unchanged storage and no page errors. |
| Supplemental 84-item/23-photo and 100-item/40-photo performance/evidence observations | **2 passed** (desktop and 360px projects, both sizes in each); known unavailable association and source preservation included. |

The full-run failure was the existing `inspection-evidence.spec.ts:382` five-width inspection-editor/review/image audit: its 180-second total budget expired inside an axe scan at the retained-record snapshot. It reported no failed assertion before timing out. Its [trace and failure context](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/full-04/test-results/inspection-evidence-five-w-18113-0-percent-text-verification-desktop/trace.zip) and [isolated passing report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/inspection-audit-rerun/html/index.html) remain available. Contention during concurrent audits is a plausible explanation, not an established root cause. **The full run is not reported as clean.** No original timeout/assertion was changed, and no unrelated fix was made.

All **22 skips** are duplicate mobile executions of width/scenario audits performed once by the desktop project: 20 existing skip rules and 2 new duplicate preview-audit skips. They do not conceal an unimplemented preview feature. Details are retained in [compact results](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/full-04/compact-results.json).

The verified story is **Yfirferð → current valid browser-local draft and session images → pure presentation adapter → read-only report → existing review/correction flow**. There is no business API/database boundary in this phase. Browser work uses installed Chrome 155.0.8059.80, the local production server on port 3136, disposable synthetic contexts, two workers and zero retries. The external verification configuration preserves the repository's project viewports, original assertions, timeouts and skip rules; output paths and the existing concept-upload fixture are isolated outside the checkout.

Early focused diagnostics exposed two new test setups trying to mutate deliberately frozen inputs, two exact-label selectors that omitted existing label hints, and a failed-image setup revoking the wrong source thumbnail. Those test setups/selectors were corrected without weakening source-preservation or domain assertions. A subsequent focused run passed **63/63** desktop/360/390 executions before final source-identity refinements. Three preliminary full runs were intentionally stopped while source/visual/domain refinements were finalized. Their logs and outputs remain as interrupted evidence, not completed regression results. The completed run above used the final source throughout.

## Visual review and accessibility

Agent visual review of actual browser captures checked the document hierarchy, complete/limited/missing records, mobile meter/fire sections and long descriptions with photographic evidence. It led to active-answer/date warning treatments, removal of misleading retained displays for matching meter guard metadata, and a less sparse layout for multiple photographs. The inline native reading guide is the proportionate alternative to an optional desktop side guide.

Automated browser coverage exercises 320/360/390/768/1440 CSS px, normal and doubled computed text, across complete, incomplete, limited and large records. It checks WCAG A/AA, 2.1 AA and 2.2 AA axe rules, rendered text contrast, semantic structure, full source records and document overflow. Keyboard checks exercise internal source anchors, disclosure operation, exact return focus, image dialog Escape/restore and unchanged remembered-position bytes. Image/upload paths use the actual existing capture controls.

The [visual evidence gallery](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/gallery.html) indexes **131 fresh PNGs**, preserving their original resolution: 110 final regression captures and 21 illustrated reading captures. Selected review evidence:

| Required scene | Screenshot |
| --- | --- |
| Desktop complete report with multiple deviations | [1440px findings and evidence summary](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-illustrated-02/1440-findings.png), [complete full report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-final-04/desktop-complete-report.png) |
| Mobile report at 360px | [360px findings](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-illustrated-02/360-findings.png), [mobile full report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-final-04/mobile-360-complete-report.png) |
| Incomplete report / missing information | [Incomplete full report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-final-04/desktop-incomplete.png), [incomplete opening](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-final-04/desktop-incomplete-viewport.png) |
| No defects, recorded limitations | [Limited full report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-final-04/desktop-limited.png) |
| Room photographs and full long prose | [360px long record and image](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-illustrated-02/360-long-record-photo.png), [multiple-image stress record](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-final-04/desktop-room-long-text-photos.png) |
| Meter and fire observations | [360px meters](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-illustrated-02/360-meters.png), [360px fire observations](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-illustrated-02/360-fire.png) |
| Enlarged text/reflow | [360px doubled-text record](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-illustrated-02/360-text-200-long-record.png), [320px doubled-text viewport](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/visual-final-04/desktop-complete-320-text-200-viewport.png) |

Illustrated property images are the unchanged, approved **AI-generated synthetic Concept C JPEG derivatives**, read from historical assets and uploaded only in disposable QA sessions. Their visuals are illustrative, not source-verified evidence or newly generated assets. Regression image stress cases use accepted-format synthetic 960×640 PNGs. No personal draft/browser session is used.

These checks and screenshot inspection do not establish full WCAG conformance. **Manual NVDA/VoiceOver announcements, physical iOS/Android devices, actual browser zoom controls, Firefox and Safari are not verified.** Doubled computed text and 320 CSS px reflow are actual DOM/CSS checks, not claims of real 200%/400% browser zoom. No human landlord/tenant reader-testing session is claimed.

## Preservation and practical limits

The [final preservation audit](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/preservation-final.json) compares **878 original workspace files**, excluding Git/dependencies/generated build/output directories. **874 are identical in content and modification time**. The only four changed originals are the three authorized source files and ignored generated `tsconfig.tsbuildinfo`. No original file is missing. The approved proposal, existing tests/configuration/dependencies, schemas/validators/helpers and historical design/evidence files remain unchanged. New verification output uses its own external directory; exploratory and interrupted runs remain available.

All **12 implementation source/test files** match the hashes recorded before the completed final full regression. `HEAD` remains `88f1c6ea3a36f4166dcb77fd79d4d8b93198997e` on `main`; the staging area is empty and `git diff --check` passes.

Tests freeze nested report/media input, compare serialized source bytes, and check exact localStorage envelope/navigation/sentinel bytes through preview entry, reading, disclosures, source links, image viewing, history and reload. Pending-write and protected-read scenarios retain their established behavior. Explicit corrections remain ordinary existing edits; reading never confirms meter context, changes source timestamps or cleans/rebinds photographs.

The completed full suite retains one timing failure that passed unchanged in isolation. Remaining product limits are those explicitly approved: browser-local mutable drafts, temporary images, no immutable issue/provenance or verified identity, and existing cross-tab/quota/older-writer constraints. Ambiguous legacy association data is qualified rather than repaired. Shared meter readings remain qualified, and factual heating responses never become automatic repair tasks. Final manual accessibility/cross-browser review remains outstanding. No later phase has begun.

## Performance observations

The local development host is Windows NT 10.0.26300.0, Intel Core i5-1245U (10 cores / 12 logical processors), approximately 16 GiB installed RAM, with Chrome 155.0.8059.80. Final full-run adapter/index measurements were **1.54–6.33 ms** across small, limited, 84-item and 100-item inputs, below the proposal's development-machine <50 ms target; no repeated >50 ms mapping work was observed.

The supplemental [desktop observations](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/performance-observation-performance-desktop.json) and [360px observations](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/performance-observation-performance-mobile.json) used the actual existing uploader, maximum 8 files per target, 960×640 accepted PNGs, full long prose and both 84/23 and 100/40 cases. Exact source storage was unchanged. A real associated image was deliberately revoked in the 84/23 case; 23 associations and 22 successful displays remained distinct.

| Measurement, one observation per size/project | Actual range / limit |
| --- | --- |
| Click-to-observed report heading text | **365–397 ms**; includes link activation/route/render, not a universal first-paint benchmark. |
| Keyboard guide activation through focus on final room | **41–49 ms** including automation acknowledgement. |
| 30 sampled scroll animation-frame intervals | Median **16.6–16.7 ms**, maximum **20.0 ms**. |
| Observed UI long tasks | Desktop: none in these windows. 360px: one **57 ms** and one **60 ms** task; not attributed to the pure adapter. |
| JavaScript used heap across each observation | Approximately **13.9–24.2 MiB before**, **21.7–33.5 MiB after**; not garbage-collection-normalized, not a leak/stability proof. |
| Image presentation | All image nodes use native lazy loading and reserved geometry; 40/40 displayed after traversal, or 22/23 with the known failure. Small files were already cached from capture/review, so all available images had completed by the post-entry observation. |

The renderer has no image-decode promise/barrier before report text and creates no copied image buffers or blob URL lifecycle. These observations **do not prove** slow/high-resolution image decoding behavior or total decoded/GPU/browser memory. CDP heap/external-backing estimates are not reliable total image-memory measurements. CPU/network throttling, high-resolution originals, sustained navigation memory and physical-device performance remain outstanding. The passing [supplemental report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a158f7-4bdc-76c1-923e-d6aba49c3e81/phase-1b3b6-review/performance-run-03/html/index.html) preserves the measured cases. Early external measurement-harness diagnostics selected the wrong guide link and attempted to scroll a deliberately hidden failed image; corrected harness setup passed without changing production source or repository tests. Their failed/interrupted diagnostics remain retained separately.
