# C1 final regression correction — 2026-10-26

**Recommendation: ready for final independent approval review.** No remaining C1
regression blocker was found. Approval itself remains independent. All changes
are uncommitted; HEAD remains `d44b8e79c76357512c606f79d0111e9d47b0ad1a`.

## Findings and correction

Both original scenarios expose an application race in `useInspectionNavigation`.
Native history changes the browser URL before `useSearchParams()` necessarily
provides that query to a render. An effect from a stale render could canonicalize
its older destination over a more recent item selection or meter correction URL.
The effect now checks that its query still matches the browser URL before it
changes navigation metadata, the URL or focus-related state.

For the read-protected scenario, a controlled selection at the initial native
history canonicalization boundary failed before the guard and passed afterward.
The recorded sequence was room → selected windows item → room before correction,
and room → selected windows item afterward. The original test is retained; a new
test controls this interleaving at all three configured viewport sizes and checks
that unreadable source bytes and navigation-storage protection remain intact.

The initial six-case recheck reproduced the meter failure on desktop. Both its
trace and the original full-regression trace show the requested meter correction
URL ending up back at the ordinary walls URL. This is more than an assertion that
ran too early: the newer requested destination was overwritten. The original
rapid round trip remains in the test, with an additional exact-URL assertion.

A second, completed ordinary-editor round trip exposed a retained-destination
marker suppressing focus when returning to the same room from a property
correction. Its added focus assertion failed on mobile-390 before correction.
The hook now clears that marker when the current property correction takes over.
The test checks ordinary-editor focus, correction focus and exact final URLs,
alongside all original report-byte and navigation-position assertions.

Scheduling/workload affects exposure. No version bisect was performed, so these
findings do not establish that Next.js 16.4.3 or React 19.3.1 introduced the defect.
No test-isolation failure, cloud overwrite or cross-owner disclosure was shown.
There are no added delays, retries, skips or relaxed assertions/timeouts.

## Files changed by this task

- `src/components/use-inspection-navigation.ts`: reject stale-query effects and
  reset the previous room destination when a property correction takes over.
- `tests/inspection-navigation.spec.ts`: add the controlled protected-data race
  regression; retain the original scenario and assertions.
- `tests/meter-readings-capture.spec.ts`: retain the original rapid navigation
  and add exact-URL and completed editor/focus round-trip assertions.
- `docs/C1_FINAL_REGRESSION_FIX.md`: this report.
- `docs/qa/c1-final-regression/VERIFY_REGRESSION_COVERAGE.py`: complete-coverage
  verifier, runnable from the repository with the bundled or another Python 3.
- `docs/qa/c1-final-regression/tested-source-sha256.json`: 133-file source snapshot.
- `docs/qa/c1-final-regression/regression-coverage.json`: primary execution hashes,
  counts and identity-verification result.
- `docs/qa/c1-final-regression/trace-findings.json`: original and reproduced meter
  trace URL transitions.
- `docs/qa/c1-final-regression/validation.json`: final results and integrity record.

Earlier C1 recovery/replay, database, owner isolation, dependencies and unrelated
working-tree changes are preserved. Hash checks confirmed that the other 110
pre-existing dirty/new files were unchanged. The meter test was clean at the
start of this task. No source changed during final verification, and the Git
index remains empty. The prior R2 ZIP is unchanged. The start-of-task and frozen
verification hashes are retained under `artifacts/c1-final-regression/`.

## Verification and evidence

Every result below was executed on 2026-10-26 for this correction. Primary logs,
JSON reports and failure traces are under `artifacts/c1-final-regression/`.

| Verification | Result | Primary record |
| --- | --- | --- |
| Initial unchanged affected scenarios | 5 passed, 1 meter failure | `affected-before.json` |
| Controlled protected-data race before / after query guard | 1 failed / 1 passed | `controlled-before.json`, `controlled-after.json` |
| Stronger same-room return assertion before marker reset | 8 passed, 1 failed | `affected-final.json` |
| Final affected scenarios and controlled race, three projects | 9 passed | `affected-final-fixed.json` |
| Both complete affected suites after final correction | 172 passed, 2 existing skips | `focused-final.json` |
| Full ordinary regression partition | 929 passed, 22 existing skips | `regression-standard.json` |
| Separate five-width evidence matrix | 1 passed, 2 existing skips | `regression-visual.json` |
| Complete verified regression union | **930 passed, 24 existing skips, 0 failed** | `regression-coverage.json` |
| All C1 tests | **77 passed, 0 failed** | `c1.json` |
| Typecheck / lint / production build | All passed, exit 0 | `typecheck.log`, `lint.log`, `build.log` |

C1 comprises 10 real local PostgreSQL/Auth/HTTP integration tests, 17 store tests
and 50 browser executions across 320, 360, 390, 768 and 1440 px. It rechecked failed
and malformed recovery, delayed responses, owner switching, successful replacement,
conflicts and replay after a newer revision. Existing local accounts/volumes were
reused without resetting the database. Only the C1 stack was started/stopped; its
volume is retained. The test servers have been stopped.

The two affected suites include native keyboard/focus, axe and enlarged-text
checks. Default demo-mode checks also passed in the complete regression. This
task did not change C1 gating, architecture, recovery/replay implementation,
dependency manifests or lockfile. Next.js remains 16.4.3 and React 19.3.1; the prior
accepted zero-finding security audit was not rerun for this dependency-unchanged
correction.

The earlier failed full-regression reports and R2 review package remain historical
evidence and have not been overwritten or relabeled. This new complete execution
supersedes their five unresolved regression entries for current verification;
isolated rechecks are not substituted into either primary full-regression report.

Full regression follows the established disjoint partitions: ordinary two-worker
execution excluding the expensive five-width evidence matrix; then that exact
matrix alone with one worker. A fresh inventory must match every primary result
by suite path, title and project. The inventory contains all 951 original
identities plus the new race scenario in three projects: 954 total, with the same
24 intentional skips. The verifier confirmed all 954 identities, exactly one
result each, no missing/duplicated/unexpected identities, zero retries and the
same 24 skip identities as the previous full run. The derived aggregate is
explicitly not a single run. The main partition took 41.3 minutes and the separate
matrix 2.0 minutes. No full-regression partition was repeated.

## Limits and recommendation

Proceed to final independent approval review of these targeted corrections. No
remaining technical approval blocker was demonstrated by this verification.
All browser results are
automated Chromium checks and simulated user journeys, not real human usability
testing or physical-device validation. The existing demo single-tab,
fictional-data restriction and C1 development-only scope remain. No C2, Phase 7b,
hosted project, migration, permanent photographs, new review ZIP, commit, push,
PR, merge or deployment is part of this correction.
