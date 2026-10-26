# Current verification status

Historical 25 October snapshot. For the current candidate, see
[the 26 October final regression report](../../C1_FINAL_REGRESSION_FIX.md):
930 passed, 24 existing skips, zero failures; all 77 C1 checks passed.
It supersedes the approval hold and counts below; independent approval is pending.
Generated screenshots and detailed Playwright reports referenced by this historical
record remain local and are intentionally excluded from the Draft PR.

Actual completed regression: {'passed': 922, 'skipped': 24, 'failed': 5}. Approval is blocked by unresolved regression findings.

See REGRESSION_FINDINGS.md for failure classification and unchanged-source rechecks.

# C1 independent-review corrections — executed evidence

25 October 2026. Candidate only; independent approval pending. All changes remain
uncommitted. This record supersedes the historical sibling `supabase-c1/` counts
and unresolved-advisory statement for the corrected candidate. See
[root causes and changes](../../SUPABASE_C1_REVIEW_CORRECTIONS.md),
[exact file inventory](CHANGED_FILES.md) and [security change](SECURITY.md).

## Final executed results

| Check | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Focused state + real PostgreSQL/Auth/HTTP | 27 | 0 | 0 |
| All C1 (10 database/API + 17 state + 50 browser) | 77 | 0 | 0 |
| Full default-demo regression | 922 | 5 | 24 |
| Additional recovery accessibility matrix | 5 | 0 | 0 |
| Two hardened demo cases, each repeated twice | 4 | 0 | 0 |
| Comparison matrix readiness correction (five widths in one test) | 1 | 0 | 0 |
| Fire focus-target hydration readiness (three regression projects) | 3 | 0 | 0 |
| Resumed hydration, per-item selection, native upload and reset cases | 18 | 0 | 0 |
| Separate unchanged-source rechecks (do not replace failures) | 6 | 0 | 0 |
| Flagged production C1 API probes | 3 | 0 | 0 |

Focused/matrix/repeated cases overlap the full suites; do not sum these as unique
coverage. The reports have zero global errors and no retry-based flaky classifications
(automatic retries are disabled). Cross-run intermittency is observed and documented;
the isolated successes do not replace failed primary executions. The regression
inventory remains 924 accepted cases plus three default-mode C1
endpoint guard executions, with the same 24 intentional skips. No retry, timeout,
skip, expected outcome or accessibility rule was relaxed. Four earlier incomplete
attempts are retained separately: three stopped during diagnosis and a fourth
interrupted for low battery. They are not completed passing runs. The final complete
suite uses two fresh, non-overlapping partitions: 948 executions with ordinary two
workers (actual outcomes in validation.json), then the large visual matrix alone
with one worker (1 pass/2 skip). The original 180-second matrix limit and every assertion remain.
`regression-coverage.json` verifies all 951 identities against a fresh `--list`
inventory, with no missing, extra or overlapping cases. `regression-playwright.json`
is explicitly a derived aggregate, not one invocation. See [execution method](REGRESSION_METHOD.md).

Typecheck, lint and production build each exited 0. Full npm audit reports zero
findings, without new overrides or suppressions. Production API GET config,
GET inspections and POST inspections returned 404 even with the C1 flag in the
server environment and query/cookie manipulation. The root remained demo mode.
Ten served production scripts contained no generated executor URL/password or
fictional-account passwords. No credential values are recorded here.

## Test types and integrity evidence

- `database.spec.ts`: actual retained local PostgreSQL 17.6, GoTrue Auth, RLS,
  executor permissions and Next HTTP API. Includes real simultaneous CAS writes,
  duplicate operations and the added commit/lost-ack/newer-commit/replay scenario.
  The replay returns original revision 1 with `replayed: true`; revision 2 and the
  newer document remain the real database head. Receipt count stays one for that
  original operation. No current database reset or migration change was needed.
- `store.spec.ts`: injected/deferred transports, not real outages. Failure,
  malformed/null/wrong-owner/duplicate-ID records, delays, edits during reload,
  successful revision replacement and account changes (including A→B→A) check
  exact active-candidate preservation, owner-scoped downloads and fencing. Replay
  acknowledges the old commit without sending newer typing automatically.
- `ui.spec.ts`: ten scenarios at 320, 360, 390, 768 and 1440 CSS px. Real browser,
  local Auth/database and two tabs; selected routes simulate precommit rejection,
  acknowledgement loss, delayed reads and malformed responses. Changed recovery
  errors/progress/success are checked for keyboard use, focus, downloads, accurate
  live messages, overflow and axe WCAG 2/2.1/2.2 A/AA tags. The failure scan runs
  before a download replaces the result message. C1's demo-storage sentinel stays
  byte-for-byte unchanged through creation, four screens, preview and reload.
- Default regression includes existing domain, baseline reconfirmation, retired
  associations, legacy/unknown-field records, navigation and session-photo cases.
  Test drivers wait for actual destinations and an open disclosure. The exact
  original synthetic photo is selected through its real chooser. All original
  preservation/reload assertions remain. The fire focus-target test waits for its
  hydrated target before counting radio inputs, retaining every original focus
  and no-write assertion. Read-protected navigation and filters wait for hydration.
  Rapid N/A selection targets the selected item's condition group. The large
  preview upload waits for the selected room and uses its native chooser with
  unchanged synthetic bytes and counts.

Two `original-defect-probes` confirm the old archived store hides the active
candidate/recovery after failed reload and marks replayed receipts saved without
a freshness warning. These deliberately observe BAD historical behavior using
simulated transports; they are not two additional corrected-code pass cases.

`pre-correction-state-playwright.json` retains an intentional red run (6 old cases
pass, 11 new cases fail). Some fail first on the missing explicit-result contract;
it does not establish eleven distinct data-loss events. It is not approval data.

## Portable evidence and screenshots

`validation.json` contains commands, timings, counts and test classifications.
`TESTED_SOURCE_SHA256.json` identifies the final application/config/fixture/test
bytes. Hashes were recorded during execution and rechecked after testing; file
modification times predate their applicable final suite starts. Documentation and
packaging follow those runs. `evidence-provenance.json` records raw/portable hashes.
Only machine paths, attachment references/data and terminal ANSI formatting were
removed from report/log copies. Every outcome, failure and count is preserved.
Raw traces/HTML/HAR, runtime credentials and database dumps are excluded.

For each width 320/360/390/768/1440, direct browser captures are named
`recovery-network-WIDTH.png`, `recovery-malformed-WIDTH.png` and
`recovery-pending-WIDTH.png`. They contain controlled fictional data. Agent visual
inspection of the narrow error/pending captures complements the automated checks;
it is not prospective-user testing. There are no real inspection photographs.

## Limits

These are automated desktop Chromium viewport simulations, not physical-phone,
human usability or complete screen-reader validation. No exploit, production
outage, hosted Supabase or backup/restore test is claimed. npm audit is not an
independent security guarantee. The local Docker ports are published beyond
loopback; other Docker projects were not changed. C1 services were stopped after
testing with their fictional volume retained.

Recovery remains page memory plus manual plaintext download, with no merge or
automatic import. Unexported data may be lost on page/process destruction. A read
or acknowledgement is point-in-time. Default demo localStorage P1 remains under
its single-tab/fictional-data restriction. C1 remains development-only. SQL/RLS,
original domain contracts and comparison rules are unchanged. No C2, Phase 7b,
sharing, migration, permanent photographs, commit, push, PR, merge or deployment.
