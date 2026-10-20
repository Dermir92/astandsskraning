# Phase 1B.3b.5 — R1/R2 corrections for commit review

R1 and R2 are corrected locally on `codex/phase-1b3b5-meter-readings`, still based on approved main `3b090748ed7b2689e95b317c53446238bda36479`. No commit, push, PR, merge or deployment is authorized or performed. This supplements the original implementation review; that document, the approved proposal, all original review evidence and the independent-review ZIP are preserved.

## Exact incremental scope

These are the only files changed during this correction task. All other implementation work that was already present remains unchanged.

| File | Correction |
| --- | --- |
| `src/lib/meter-readings.ts` | Return the original details object for identical purpose and effective participation. |
| `src/components/meter-readings.tsx` | Restore local keyboard focus after explicitly clearing a radio answer. |
| `tests/meter-readings-compatibility.spec.ts` | Three R1 domain/store regressions, including the original persistence reproduction. |
| `tests/meter-readings-capture.spec.ts` | One R1 browser regression and eight R2 keyboard scenarios, each exercised in three Chrome projects. |
| `docs/PHASE_1B3B5_R1_R2_CORRECTIONS_REVIEW.md` | This supplemental handoff. |

The [focused diff](C:/Users/Danni/.codex/visualizations/2026/10/19/01a15482-ae62-7740-a011-e87e3f1c6aec/phase-1b3b5-r1-r2-corrections-2026-10-20/focused.diff) compares the four source/test files against byte-preserved snapshots taken at the start of this task, including the untracked implementation. The [production-only diff](C:/Users/Danni/.codex/visualizations/2026/10/19/01a15482-ae62-7740-a011-e87e3f1c6aec/phase-1b3b5-r1-r2-corrections-2026-10-20/source-only.diff) isolates the two application changes. A normal Git diff against main would omit these currently untracked meter files.

## R1 — semantic no-op

`applyPurpose` checks mode, effective optional participation and any deliberately requested association correction before allocating. An absent/false unselected flag remains untouched; paired rental modes retain their existing independent optional flags. An identical selection returns the original details reference, allowing the existing store identity guard to reject persistence entirely. The tests assert unchanged snapshot/report/details identity, exact original storage bytes, no write calls, unchanged `updatedAt` and unknown extensions. A failed pending genuine edit also survives an identical selection and remains retryable.

Real participation changes still apply. Same-mode correction of unbound real facts still requires confirmation and updates its association. All existing purpose-transition, arrangement, stale-snapshot and cleared-facts checks remain in place. No deep normalization, storage comparison or new persisted field is introduced.

## R2 — clear-answer focus

Only the explicit clear click schedules focus restoration. After rendering, the first enabled radio in that same fieldset receives focus without selecting an answer. Its existing native fieldset/legend, radio label, help association and visible teal focus treatment provide accessible context. The fieldset is the local fallback if no radio is enabled. No focus effect runs during typing or ordinary report updates.

Clearing the last retained fact can remove the entire retained question when the context guard ceases to apply. For that case only, the clear action remembers the same utility's persistent disclosure summary and focuses it if the fieldset unmounts. Native scrolling reveals this fallback; no disclosure is opened or closed by the focus handler. Disconnected targets are ignored. No correction hook, route or room-position state is changed.

Actual installed Chrome keyboard tests use Tab, Enter and Space for ordinary applicability, ordinary reading status, inactive retained reading status and the last retained status under an arrangement guard. They assert the focused element, unchecked state where the question persists, accessible group names, retained raw facts/extensions/associations, unchanged URL and room/item position, and unchanged existing disclosure states. The last-fact scenario asserts that the original shared arrangement remains selected and the optional shared-reading disclosure stays closed. Typing in a retained text field keeps focus on that input.

## Verification

| Final-source run | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Focused R1/R2, Chrome desktop / 360 / 390 | 36 | 0 | 0 |
| Complete suite, original two-worker settings | 772 | 0 | 20 |
| Meter compatibility — subset of complete suite | 105 | 0 | 0 |
| Meter browser capture — subset of complete suite | 112 | 0 | 2 |
| Inspection navigation — subset of complete suite | 57 | 0 | 0 |
| Fire compatibility + capture — subset of complete suite | 77 | 0 | 4 |
| Local data safety — subset of complete suite | 36 | 0 | 0 |

Final-source lint, typecheck and production build passed with exit code 0. The production route list is unchanged. Build ID: `sgAG72qC43aVQdyy-eHis`. The complete run took 10.7 minutes, with no failures, timeouts, interrupted tests, retries or flaky outcomes. Its 20 intentional skips follow the existing rules. The existing five-width photo-evidence audit passed within its original 180-second limit (about 1.9 minutes); the meter five-width / 200% text audit passed in 35.9 seconds. No isolated rerun was necessary. The original timeout and independent-review evidence remain preserved; this clean run does not erase those earlier observations.

[Complete report](C:/Users/Danni/.codex/visualizations/2026/10/19/01a15482-ae62-7740-a011-e87e3f1c6aec/phase-1b3b5-r1-r2-corrections-2026-10-20/full-suite-final/html/index.html), [machine-readable results and per-file counts](C:/Users/Danni/.codex/visualizations/2026/10/19/01a15482-ae62-7740-a011-e87e3f1c6aec/phase-1b3b5-r1-r2-corrections-2026-10-20/verification-results.json), [focused results](C:/Users/Danni/.codex/visualizations/2026/10/19/01a15482-ae62-7740-a011-e87e3f1c6aec/phase-1b3b5-r1-r2-corrections-2026-10-20/focused-verified/results.json). Focused cases are also included in the complete run; table subsets must not be added to its total.

The external test configuration retains two workers, zero retries, the original 45-second default / 10-second expect limits, all per-test timeouts, project viewports, assertions and skip rules. It uses installed Chrome against the production server on `127.0.0.1:3120` and redirects artifacts outside the checkout. Synthetic fixture contexts do not access personal drafts or a backend. The repository test configuration and all pre-existing test assertions are unchanged.

The original implementation reproduced seven expected failures in the new focused regressions before fixes. An intermediate new-test assertion mistakenly identified disclosures using live summary status text; it was corrected to use utility identity while continuing to assert unchanged open/closed state. A partial full run was deliberately stopped before completion to cover the disappearing retained-question case; its log is preserved and is not a full-suite result. All preliminary logs remain available separately.

## Visual and accessibility evidence

[Focus evidence index](C:/Users/Danni/.codex/visualizations/2026/10/19/01a15482-ae62-7740-a011-e87e3f1c6aec/phase-1b3b5-r1-r2-corrections-2026-10-20/focus-evidence/README.md) contains 15 actual PNGs: three pre-fix desktop failures; nine final ordinary/retained examples at desktop, 360 and 390; and three final last-fact fallback examples. Original PNG dimensions and hashes are recorded in `manifest.json`. The final focused report additionally retains screenshots for both activation keys and attached accessible snapshots / focused native markup.

Agent screenshot inspection confirmed visible focus on unanswered radios and on the persistent utility summary at 360 px. These are automated browser keyboard/semantics checks and visual inspection. Manual NVDA/VoiceOver announcements, physical devices and other browser engines are not verified by this correction task; no complete WCAG-conformance claim is made.

## Preservation and remaining finding

The [final preservation audit](C:/Users/Danni/.codex/visualizations/2026/10/19/01a15482-ae62-7740-a011-e87e3f1c6aec/phase-1b3b5-r1-r2-corrections-2026-10-20/preservation-after.json) confirms unchanged hashes, sizes and timestamps for all 12,811 original evidence files, including the Desktop independent-review ZIP. Git HEAD, branch and index bytes are unchanged. Exactly the five files listed above differ from the start-of-task snapshot; no original file was removed. The approved proposal, original review document, other application/test files, dependencies, schemas, navigation and existing tracked implementation diff remain unchanged.

R3 remains informational and unchanged: a manually constructed optional-field correction URL can prioritize a relevant context-confirmation guard ahead of the identifier/note input (`src/components/use-meter-correction.ts:15–19`). It does not independently block this review. No wider navigation refactoring is included.

Approval is requested for the completed corrections before any commit or PR.
