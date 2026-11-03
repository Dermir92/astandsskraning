# UX3-U2B — final focused verification

Reviewed head: `ee5f7131d8ba0308dbf6ec8fcb717a3deb8278ae`. Approved main remains `43ba3d1a371cb03323181e9ed782576a735cfcf7`. Application code and production configuration are unchanged since independent review. The existing Draft PR #24 receives one test correction and this evidence update only.

**Controlled complete regression: 1,309 passed, 35 skipped, 0 failed, 0 flaky, zero retries (1,344 executions, 36.1 minutes).** This result is green. The previous 1,306/35/3 run remains preserved and is not rewritten by this result.

## Exact URL investigation and correction

Approved main and the reviewed application both link from the report list to `/skyrslur/syni-ibud/skraning`, then resolve the first incomplete room and replace the URL with `/skyrslur/syni-ibud/skraning?rymi=demo-kitchen` in the navigation hook's effect. The external probe records that transition on both versions. After settlement the original bare-suffix regex is false; it can pass only by observing the transient bare URL. The baseline's original test passed, illustrating that timing dependency.

`tests/mobile-refinement.spec.ts` now waits for the exact report pathname and validates the settled canonical query: exactly one `rymi=demo-kitchen` parameter for this fresh fixture, with no fragment. The details and review destinations still require their exact pathname with no query or fragment. Extra, duplicate, stale, photo-intent and review-origin parameters cannot pass this check. Existing modal, label, title, context and return assertions are unchanged. There is no application routing change or permissive optional-query regex.

## Other two original failures

The T03/T05 concurrency failure is a pre-existing test admission race. A disabled creation button is also rendered during initialization. On both approved main and the reviewed application, a probe gates the real Web Lock request, observes disabled creation, closes the writer, then releases admission. The second tab correctly acquires ownership automatically: creation is enabled, no retry button exists, and canonical bytes remain unchanged. Both preserved failure snapshots show that same enabled/saved/no-retry state. DemoStore, save actions, the new-report screen and the concurrency test have identical Git blobs on main and head. The safety implementation and test are unchanged.

The visual/AX failure exhausted the existing cumulative 180-second budget; no preceding AX violation assertion failed. The unchanged case passed on main (2.4 minutes), in the reviewed application's focused group (2.7 minutes), and its controlled-full outcome is included in the machine-readable suite results. Historical baseline runs also approached the limit. No PR-specific AX defect was reproduced. Exact wall-clock attribution of the original timeout cannot be proven retrospectively; passing reruns alone are not proof that a timing failure is impossible.

## Validation and runner disclosure

| Check | Result |
|---|---|
| Three original cases on approved main, all projects | 7 passed, 2 existing skips |
| Original cases plus all F03/F05/F06 checks, reviewed application | 55 passed, 2 existing skips, zero failures/retries |
| Relative-fixture preflight after runner correction | 6 passed |
| One controlled complete run | **1,309 passed, 35 skipped, 0 failed, 0 flaky, zero retries** |
| Changed-test lint and full typecheck | Passed |

The initial full attempt was stopped early at 156 passed / 3 failed. One failure was the known admission race; two concept tests failed with `ENOENT` because the external working directory omitted `public/concepts/synthetic-wall-damage.png`. This was a runner setup mistake. Its logs, JSON, traces and shared captures are preserved separately. The exact repository fixture was copied into the new evidence directory and SHA-256 verified; all six affected concept cases then passed. No test or application code was changed for that setup correction. Only the subsequent `controlled-full` run is a completed regression.

The runner imports the existing configuration: two workers, three projects, zero retries, unchanged global/per-test timeouts, expected statuses and skips. All 1,344 cases from the reviewed head remain present, with no additions or policy changes. All 155 pinned application/test/config files match before/after the controlled run; only the URL assertion differs from the reviewed source snapshot. No rebuild was needed for a test-only change. Chromium-only and CSS text-enlargement limitations from the original packet still apply.

## Inventory, preservation and approval

This follow-up changes exactly four files: `tests/mobile-refinement.spec.ts`, this report, `final-verification.json`, and a latest-evidence pointer in `README.md`. [Machine-readable results and the complete 43-path PR inventory](final-verification.json) retain suite totals, canonicalization/admission probe output, unchanged-blob identities and policies.

Initial/final comparisons cover 13 prior worktrees, 7,451 tracked/nonignored files, 61 prior refs, 11,020 historical evidence files, 162 explicitly inventoried U2A files and 118 existing ignored test artifacts. Only this PR's approved files/branch may change. A new detached comparison worktree at approved main is retained. The original dirty checkout, prior evidence, unrelated worktrees and PR #19 are preserved. Dependency and generated cache files are outside this inventory.

Raw evidence: `C:/Users/Danni/.codex/investigations/ux3-u2b-final-verification-20261103/`. The post-commit/push preservation comparison is retained there. The PR remains Draft. Stop for explicit owner approval; no ready marking, merge, deployment, backend work or new UX phase is authorized.
