> Latest evidence: [final focused verification](FINAL-VERIFICATION.md) and [machine-readable results](final-verification.json). The original implementation results below, including the earlier failed full run, remain historical evidence.

# UX3-U2B — progress, counts and photograph correction

Approved base: `43ba3d1a371cb03323181e9ed782576a735cfcf7`, tree `747f4e80402e4b9396c6293179c17ee77fd484b3`. Implementation is isolated on `codex/ux3-u2b-implementation`. Delivery is a **Draft PR for independent review**, with no merge or deployment authority.

## Behavior and scope

F03: shared workflow links always show their numbers, with the current step still exposed by `aria-current="step"`. The visible ordinals are decorative (`aria-hidden="true"`), preserving each link's existing accessible name. Room navigation retains ordinals and factual recorded/deviation counts; the unconditional selected-room-total Check is removed. Item-answer, selected-radio, temporary-preview and SaveStatus indicators keep their existing meanings.

F06: review and selected-report overview show **total − recorded, ófullskráð atriði**. Overview attention is labeled **N atriði þarfnast athygli**, with an explanation covering incomplete recordings and recorded concerns/limitations. Existing domain predicates and models are unchanged. The mandatory fixture has 14 total, 8 recorded, 6 incomplete, 2 wholly unanswered, 4 partial, 4 deviations and 9 attention items. Recorded deviations and limitations remain recorded.

F05: missing overview, ordinary active-deviation and heating-defect photo tasks identify their room/item and link directly to capture via validated `mynd=yfirlit|atridi` intent on the existing inspection URL. General corrections retain missing-answer priority. Photo corrections reveal ancestor disclosures and the upload action area, then focus an enabled native file input without clicking it. Disabled inputs use a visible action summary or title; featured hidden titles are never the fallback. The eight-photo fallback specifically uses the upload disclosure, not the gallery's “show all images” summary.

Photo intent is handled once for each navigation destination. Edits and permission changes do not replay it. Ordinary room/item selection clears photo intent while preserving review origin. Existing stable room/item return targets, the same-document Back proof and fixed-URL reload/external-entry fallback remain in place. New target IDs encode report, room and item identity; malformed/duplicate/stale targets do not authorize writes or target another photo area.

Photos remain **temporary session-only previews**, separate from saved answers. Existing upload, decoding, limits, cleanup and permission logic is unchanged. No store/persistence/Web Locks/recovery/schema/backend/Auth/payment/Docker/D1 changes; no F07/F08/F09 or other UX phase. PR #19 is excluded.

## Separate implementation gates

F03/F06 were implemented and verified before F05 integration:

- Three new tests failed against approved main on actual missing step numbers, the unconditional success icon and the missing incomplete-item metric.
- After correction, all 12 executions of the new progress/count suite passed across desktop/mobile-360/mobile-390, including five-width AX/axe/contrast and 200% text checks.
- Twelve selected existing desktop report, room-label and reflow executions then passed. Two existing tests have approved display expectation changes: report-overview copy in `tests/reports-shell.spec.ts`, and the incomplete-item calculation plus label in `tests/inspection-checklist.spec.ts`. The existing prototype, concurrency, mobile-refinement and visual tests are unchanged.

F05 has its own focused suite. Two pre-integration tests reproduced the missing links (one assertion failure, one timeout waiting for an absent link). A subsequent run found the real gallery-summary focus bug described above. It was corrected within the existing navigation hook; no safety or routing architecture change was required. The dedicated desktop F05 suite subsequently passed all 12 tests.

Early F05 probe corrections also fixed overly broad selectors that included hidden summaries, an owner-release setup missing a reader-admission barrier, a text-enlargement probe that attempted to refocus an already focused control, and an incorrect expectation that focus would remain on the summary after deliberately clicking Retry. The current checks retain the actual contracts: visible initial fallback, no replay after the user chooses Retry, and enabled-input focus on a new explicit visit. No pre-existing assertions, skips, timeouts or retries were weakened.

## Validation and evidence

**The completed full Demo run is not green: 1,306 passed, 35 skipped, 3 failed, zero retries, zero flaky results (1,344 executions, 39.6 minutes).** All 1,296 baseline cases remain present with unchanged expected statuses; the 35 skips are pre-existing. All 48 new feature executions pass within this full run. See [validation.json](validation.json) for the compact machine-readable results and suite totals.

| Check | Result |
|---|---|
| Independent F03/F06 gate before F05 | 12 passed; three original defects reproduced first |
| F05 desktop gate | 12 passed; missing links and gallery-summary fallback reproduced first |
| Broader focused regression | 197 passed, 4 pre-existing skipped |
| New feature suites across all three projects | 48 passed; also all pass in the completed full run |
| Corrected metric expectation | 3 passed |
| Existing prototype accessible-name case plus new assertion | 6 passed, existing prototype test unchanged |
| Offline compatibility/contract checks | 147 passed; fake C1 transport only |
| Production build, typecheck, full lint | Passed on final application/test source |
| Complete Demo regression (`full-5`) | **1,306 passed, 35 skipped, 3 failed** |
| Separate unchanged failure diagnostic (`failure-rerun`) | 3 passed; does not replace or amend the full-run result |

Full-run failures were all in the desktop project:

- `demo-concurrency.spec.ts:116`: the T03/T05 collection-lock test timed out at 45 seconds waiting for “Reyna breytingarétt aftur”. Its mobile executions passed.
- `inspection-evidence.spec.ts:388`: the existing five-width visual/AX/200% test exceeded its existing 180-second limit during axe analysis. It passed in the earlier focused group and in the separate diagnostic.
- `mobile-refinement.spec.ts:168`: the existing exact URL expectation required a bare `/syni-ibud/skraning`, but received the canonical `?rymi=demo-kitchen` URL. Its mobile executions passed. The no-photo canonicalization behavior was not changed.

The same three tests passed unchanged together in a separate desktop diagnostic (1.5 minutes, zero retries). Their causes remain unproven; isolated passes do not establish a green full regression or justify merging. No assertions, retries, skips or timeouts were relaxed to address these failures.

Four earlier full-suite attempts were interrupted, and their partial results are retained separately: `full` 30 passed / 11 failed, `full-final` 125 / 1, `full-3` 339 / 1, and `full-4` 60 / 10. The first and fourth encountered repeated Next dev reloads; the fourth occurred with the source sampler disabled, so sampling is not a proven cause. After stopping the isolated server, only this worktree's generated `.next` cache was moved into its ignored artifacts directory; a fresh dev server completed `full-5`. No package, production configuration or prior worktree was changed for this workaround. The second attempt exposed the approved incomplete-metric expectation; the third exposed a real Stepper accessible-name regression, fixed with decorative ordinals while retaining the original prototype assertion. All failed-attempt logs and traces remain available.

Raw logs, JSON, screenshots, AX attachments, chooser-event attachments and traces are kept at:

`C:/Users/Danni/.codex/investigations/ux3-u2b-20261102/`

The original U2A investigation, proposal, diagnostics, screenshots, traces and manifests remain unchanged in their original worktree. Before images below are copied byte-for-byte from that approved-main investigation; after images are new Chromium captures of this implementation.

| Width | Before | After | Direct photo focus | Read-only fallback |
|---|---|---|---|---|
| 320 | [review](screenshots/before/review-320.png) | [review](screenshots/after/review-320.png) | [input](screenshots/after/overview-focus-320.png) | [summary](screenshots/after/readonly-focus-320.png) |
| 360 | [review](screenshots/before/review-360.png) | [review](screenshots/after/review-360.png) | [input](screenshots/after/overview-focus-360.png) | [summary](screenshots/after/readonly-focus-360.png) |
| 390 | [review](screenshots/before/review-390.png) | [review](screenshots/after/review-390.png) | [input](screenshots/after/overview-focus-390.png) | [summary](screenshots/after/readonly-focus-390.png) |
| 768 | [review](screenshots/before/review-768.png) | [review](screenshots/after/review-768.png) | [input](screenshots/after/overview-focus-768.png) | [summary](screenshots/after/readonly-focus-768.png) |
| 1440 | [review](screenshots/before/review-1440.png) | [review](screenshots/after/review-1440.png) | [input](screenshots/after/overview-focus-1440.png) | [summary](screenshots/after/readonly-focus-1440.png) |

New tests: `tests/ux3-progress-correction.spec.ts`, `tests/ux3-photo-corrections.spec.ts`; deterministic input: `tests/ux3-progress-fixture.json`, including valid nested extensions and envelope sentinels. Tests cover native keyboard/pointer interaction, photo limit and pending decoding, reader/unsupported/read-error/recovery states, actual Web Lock handoff, Back/Forward/reload/external URLs, duplicate/long names, invalid targets, unchanged canonical bytes/checkpoints and preview lifetime. Each F05 test records zero automatic file-chooser events.

Chromium only. Five CSS-width checks and CSS text enlargement are not physical-device, Firefox/Safari/WebKit, native zoom or manual screen-reader certification. No real database or deployment test was performed.

## Preservation and data safety

[preservation.json](preservation.json) records the initial/final comparison: all 6,669 tracked and nonignored untracked files across 12 prior worktrees, all 59 prior refs, 1,116 historical evidence files and 162 explicitly inventoried U2A evidence files are unchanged. The original checkout still has its six tracked modifications and 48 untracked QA files; its HEAD, status and index bytes are unchanged. The new implementation worktree and branch are the only additions. This inventory does not claim hashes for every dependency or ignored cache in older worktrees.

The final 155-file application/test/configuration source snapshot matches the source used for the completed regression. Canonical document bytes, valid extension fields, preview associations and recovery checkpoints are exercised by the focused tests. Model predicates, stores, persistence, Web Locks, recovery and backend files have no diff. Main remains at the approved base; PR #19 remains OPEN/Draft at `88ac8e785c449aa3579b525f6a0b3b75ca7c627a`.

## Review boundary

Review the small navigation addition, especially canonical query preservation, `reviewTrip` equality, disabled/pending/full fallback choice, once-per-destination handling and stable return anchors after a missing-photo link disappears. Verify the immutable domain/storage files and unchanged S1/U1 assertions against the approved baseline. The full-regression failures remain an unresolved review gate. Keep the PR in Draft until a new independent review and explicit owner merge approval; no merge or deployment is authorized.
