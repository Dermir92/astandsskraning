# Phase 1B.1a — Safe local data recovery and validation

> **Historical implementation review.** These safety fixes are integrated in the current application. The worktree, branch-state and authorization statements below describe their original checkpoint. See [the current entry point](../README.md) and [publication notes](PUBLICATION.md).

16 October 2026 · **Accepted for local Git integration, subject to final diff review and fresh verification.** The integration results are recorded separately in the [local integration report](../artifacts/phase-1b1a-integration-2026-10-16/integration-report.md). Concept B production integration remains outside this approval.

## Implementation review — 15 October 2026

The following records the isolated implementation and its original verification before integration.

Worktree: `archived-worktrees/phase-1b1a-local-recovery`

Branch: `codex/phase-1b1a-local-recovery`

Base: `5997b9348aef17a689f3034a1905487b5a3e1631`

This implements only audit findings **F03 and F13**, following the [Concept B approval prerequisite](PHASE_1B_CONCEPT_B_APPROVAL.md). Concept B integration has not started. The original `main` checkout, its concept prototypes and their QA evidence are unchanged.

## Fixes

**F03 — protect unreadable source data.** A failed read or validation now enters a distinct `read-error` state. This includes malformed JSON, invalid report data, unsupported document versions and an existing empty string. Fallback samples remain available for viewing, but report creation, editing and room removal are rejected. The original localStorage entry is never replaced by those actions. Generic retry is absent in this state and is also a no-op in the store itself.

The Icelandic warning explains that the data is inaccessible or invalid/unsupported, the original is unchanged, and recovery or replacement needs a separate explicit decision. This task adds no reset, replacement or comprehensive recovery UI. A later fresh load can resume normal editing if the stored document can actually be read and validated.

**Preserve valid write retries.** A valid candidate whose storage write fails still remains editable in memory with the existing write-error warning and retry action. Retry persists that valid in-memory document after storage becomes available. Rejecting a subsequent invalid change, including report 501, preserves the earlier pending valid edits and their retry path.

**F13 — match the existing loader contract.** The existing maximum of 500 reports is now a shared constant; the limit and every existing validator rule are unchanged. Creation stops before allocating a new draft when the limit is reached and returns no report ID. The creation screen only navigates when a valid in-memory draft was accepted, so a rejected creation cannot open a ghost draft.

All candidate report mutations pass `isReportList` before any storage write or replacement of the current report list. A rejected mutation preserves both the current list and stored bytes and shows a non-destructive Icelandic message. Existing reports remain editable at 500, incomplete drafts remain allowed, and rejected room changes do not first discard their temporary previews. A successful-save status still requires a successful storage write.

## Modified files

| File | Change |
| --- | --- |
| [demo-provider.tsx](../src/components/demo-provider.tsx) | Read/write/validation states, protected mutation/retry boundaries, shared-limit creation guard and candidate validation. Export the existing store class for direct defensive-contract tests; no store extraction or new persistence layer. |
| [app-shell.tsx](../src/components/app-shell.tsx) | Use truthful error labels/icons; offer generic retry only for an actual pending write failure. No layout or styling changes. |
| [new-report-screen.tsx](../src/components/screens/new-report-screen.tsx) | Disable creation during read protection and avoid navigation when creation returns no ID. Normal creation remains unchanged. |
| [model.ts](../src/lib/model.ts) | Name the existing 500-report maximum and reuse it in the existing validator. No validation rule or inspection rule weakened or changed. |
| [locale/is.ts](../src/lib/locale/is.ts) | Icelandic read-protection and rejected-change status labels. |
| [local-data-safety.spec.ts](../tests/local-data-safety.spec.ts) | Eight browser scenarios and four direct store contracts, executed in all three configured projects. |
| [This review](PHASE_1B1A_LOCAL_DATA_SAFETY.md) | Scope, guarantees, verification and remaining limits. |

No dependency, report schema, storage key/version, fixture, inspection editor, report register, photo control, shared CSS or asset-template change is included.

## Verification

| Check | Result |
| --- | --- |
| TypeScript | `npm run typecheck` passed. |
| ESLint | `npm run lint` passed. |
| Production build | `npm run build` passed; Next.js 16.4.0. |
| Full recovery-worktree suite | **142 passed, 2 expected skips, 0 failures, 0 flaky tests**, in 101.1 seconds against the local production build on port 3113. |
| Baseline application tests | **106 passed**, with the two existing duplicated intermediate-width cases skipped in the mobile projects. Existing tests were not modified. |
| New safety tests | **36 passed**: 12 scenarios/contracts × desktop, 360 px and 390 px projects. |
| Isolated concept tests | **Not copied or run in this worktree.** The 21 concept executions in the earlier 127-pass concept report are historical, separate evidence; they are not included in the 142-pass recovery result. Concept source and evidence preservation is verified by hashes. |
| Approved interface | Fresh normal register captures from this build are **byte-identical** to fresh captures from the unchanged original `main` application at 360, 390, 768 and 1440 px. The 360/1440 captures also match the archived Phase 1A.2 PNGs byte-for-byte. The older 390/768 PNGs differ only by ten search-icon pixels each; fresh baseline comparisons match at both widths. |
| Error-state presentation | Automated WCAG A/AA, 2.1 AA and 2.2 AA checks passed for read protection and the report-limit warning in all three test projects. Additional read-protection captures at all four widths have no recorded page errors, axe violations or horizontal overflow. Desktop and mobile warning layouts were visually inspected. |
| Diff hygiene | `git diff --check` passed. Only the five listed existing application files changed; original tests and dependencies are unchanged. |

The safety coverage verifies:

- Malformed JSON, invalid report shape, unsupported versions, an empty stored document and an already over-limit document retain their exact raw data. Direct retry, ordinary fallback edits, room removal, creation attempts and reload cannot authorize replacement.
- A read-access exception remains protected even if access later returns; a new successfully validated load can resume normally.
- Valid failed writes retry successfully with all pending field edits intact, including after a rejected 501st creation.
- At 500, creation leaves the current URL and stored bytes unchanged. Existing reports can still be edited and reloaded; other reports remain unchanged.
- The 499 → 500 creation path still supports details, room naming, inspection answers and reload; the next creation is rejected without a ghost draft.
- Invalid candidate IDs, room/item collection sizes and enum values are rejected by the existing validator. Its existing allowance for incomplete drafts remains.

All browser tests use fresh disposable contexts with synthetic data. Store-contract tests substitute in-worker storage. Tests never seed, clear or overwrite the user's open browser profiles or saved drafts. An initial new-test locator omitted the existing required/optional accessible-label suffix; the harness was corrected before the successful targeted and full runs. The initial diagnostic log is retained separately.

Historical worktree evidence: [full test log](../artifacts/phase-1b1a/tests.log), [JSON test results](../artifacts/phase-1b1a/results.json), [HTML test report](../artifacts/phase-1b1a/playwright-report/index.html), [typecheck](../artifacts/phase-1b1a/typecheck.log), [lint](../artifacts/phase-1b1a/lint.log), [visual/axe comparison](../artifacts/phase-1b1a/ux-evidence.json), [verification summary](../artifacts/phase-1b1a/verification-summary.json). Reproduce that run from the recovery worktree against a separately started production server with `npx playwright test --config artifacts/phase-1b1a/playwright.config.ts`.

## Data preservation and remaining limits

The existing `astandsskraning-demo-v1` key and `{ version: 1, reports }` envelope are unchanged. No migration, deletion, replacement, new backup document or new media persistence is performed. Read protection denies writes from this loaded store; rejected mutations do not replace valid saved or in-memory reports. Real write failures still require a successful retry before changes survive a reload.

Recovery/replacement authorization and any tool to export, repair or replace invalid source data remain outside this small fix. Browser storage clearing/eviction, other tabs or older running app versions can still modify or lose data; no cross-tab conflict solution or general recovery guarantee is claimed. Photographs are still temporary previews and disappear on reload. Synchronous whole-document validation/serialization remains; no persistence architecture or scaling work was added. Physical devices and assistive-technology sessions were not part of this Chromium regression run.

## Concept and Git preservation

Before code changes, inspected the original `main` checkout and verified the existing [218-entry preservation archive](../local-archive/phase-1b-approval-preservation-20261015T122241656Z/concepts-and-evidence-before-approval.zip) against its manifest hash. The 217 unchanged original prototype/evidence entries and the separately preserved final approval documents matched their hashes. There were 13 untracked concept/approval files and 206 ignored concept evidence files.

Created and attached a separate managed worktree from the accepted commit, then created the dedicated feature branch there. No original untracked files were moved, stashed, overwritten or copied into the recovery implementation. Final verification confirms that the original 97 tracked files, all 13 untracked concept/approval files and all 206 concept evidence files remain unchanged, and that the original checkout remains on `main` at the accepted commit.

**At the original 15 October review: no Concept B integration, commit, merge, push or deployment.** The 16 October acceptance authorizes the bounded local commit and fast-forward integration only. It does not authorize starting the residential inspection slice, pushing or deploying.
