# H1b.2 offline readiness hardening — 2026-10-27

OFFLINE REVIEW ONLY. GATE C REMAINS CLOSED.
Base: `bb7b0abfe4dd9bea7defacadeb670ba06519cd65` (merged PR #15).

## Change and approval boundary

The deterministic manifest now records source hashes and a fixed Git-validation
policy. It does not embed live HEAD or canonical-at-HEAD observations. Ordinary
`prepare.mjs --check` therefore checks identical bytes consistently across
commits/merges and in a source-only copy. It does not attest a Git revision.
`--verify-release` still requires the exact repository root, approval revision
identical to live HEAD, exact canonical mapping/hashes and committed Git blobs
identical to every release input. README and recovery inventory are now also
required committed release inputs. All human-approval and execution guards remain.

File-only tests create a fresh OS temporary directory per run. All fixture
copies, synthetic attestations, Git commits/branches/merges and a new exclusive
`FILE_ONLY_RESULTS.json` stay there. No real-checkout Git mutation, enabled SQL
artifact or real approval JSON is produced. Global/system Git configuration,
inherited Git routing, hooks and commit signing are disabled in fixtures. A
private empty Git configuration file supports Windows Git without reading user
configuration. The existing database/CLI test modes were not run.

Recovery now freezes further execution and requires resolving the old execution/
backend/transaction before treating all-absent inventory as evidence of no commit.
If that state cannot be established, STOP. No automatic retry, cancel or terminate
is provided. After resolution, use a fresh separately authorized session:
all-present requires exact history receipts and full Gate D; mixed/uncertain state
means STOP. Changes to RECOVERY_INVENTORY.sql are line comments only.

## Fresh offline verification

- `node docs/review/h1b2/prepare.mjs --check`: PASS after regeneration.
- `node docs/review/h1b2/test-local.mjs --files-only`: 27/27 PASS.
- The fixture suite explicitly advances HEAD and performs a squash merge with
  unchanged preparation sources, then checks/regenerates identical artifacts.
- Dirty committed and untracked release sources are rejected in isolated Git.
  Old revision attestations and non-Git release workspaces are rejected as well.
- No Docker, database client, SQL, hosted connection, credential/Auth action or
  deployment was executed. Synthetic approvals target fixture commits only and
  cannot authorize the real release. File-only mode does not construct enabled SQL.
- The first fixture run exposed a Windows null-device Git configuration path
  incompatibility. It was corrected with the isolated empty configuration file;
  the final complete 27-check run passed.
- Historical OFFLINE_VERIFICATION.md (33 Gate B.1, 23 Gate B.2 and 19 method checks)
  was not rewritten or rerun. No old QA file is an input to the test fixtures.

Final isolated JSON report SHA-256: `478becf48ef1b6cef8330f37d490e5524e7435a2b2afcb7c748b7f0c8694088f`.
Its exact path is printed by the test command; it is retained outside the source
checkout. This report transcribes its 27 results:

- PASS canonical preparation: both approved canonical files generate disabled SQL
- PASS canonical preparation: missing companion fails without output writes
- PASS canonical preparation: mismatched companion hash fails without output writes
- PASS canonical preparation: missing original baseline fails without output writes
- PASS canonical preparation: modified original baseline fails without output writes
- PASS canonical preparation: review copy cannot override canonical source fails without output writes
- PASS canonical preparation: both canonical files map to exact recorded source chunks
- PASS canonical preparation: regeneration is deterministic and check mode validates it
- PASS canonical preparation: check and manifest stay identical after a new Git commit
- PASS canonical preparation: check and manifest stay identical after an isolated squash merge
- PASS canonical preparation: modified generated SQL is rejected without rewriting it
- PASS canonical preparation: release check rejects missing explicit canonical review
- PASS canonical preparation: release check rejects missing Gate C approval
- PASS canonical preparation: release check rejects unverified execution method
- PASS canonical preparation: release check rejects legacy SQL Editor method
- PASS canonical preparation: release check rejects legacy SQL Editor approval field
- PASS canonical preparation: release check rejects incorrect canonical approval mapping
- PASS canonical preparation: release check rejects different approved revision
- PASS canonical preparation: exact fixture revision verifies without enabling execution
- PASS canonical preparation: dirty committed release source is rejected in an isolated Git fixture
- PASS canonical preparation: advancing fixture HEAD invalidates its previous revision attestation
- PASS canonical preparation: a source-only non-Git fixture cannot pass release verification
- PASS canonical preparation: an untracked release source is rejected in an isolated Git fixture
- PASS canonical preparation: no option enables or emits executable release SQL
- PASS canonical preparation: psql file retains one explicit transaction and no reconnect/meta-commands
- PASS canonical preparation: executable bootstrap and Gate D retain approved security bytes
- PASS file-only isolation: real review and canonical sources remain byte-identical

## Preserved source/security boundaries

The complete bootstrap SQL remains unchanged, including the executable transaction
body SHA-256 `88541fbf2ba3b815a5544828202e0203e6f3d26b2debc2c9e325c56b869f816a`.
Gate D SQL retains SHA-256
`d336d9f516d4d2785d5460a09d6bc988b1cf249625da12944e2640fa52ba87f4`;
its templates, ownership/RLS/SECURITY DEFINER, effective ACL/column/MAINTAIN checks,
transaction advisory locking, two history receipts and rollback behavior remain
unchanged. Both canonical migrations retain their approved SHA-256 values:

- `20261024000100_c1_owner_inspections.sql`:
  `6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8`.
- `20261027000100_c1_hosted_acl_hardening.sql`:
  `6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62`.

Historical CLI compatibility remains pinned to Supabase CLI 2.76.10; it was not
rerun. The 48 pre-existing untracked QA files, application source, previous
branches and other worktrees are outside this change and preserved.

## Remaining risks and decisions

A local integrity check cannot authorize release. Human attestation JSON is not
self-authenticating, and remote SQL cannot prove local Git presence or approval.
Independent review of this branch/revision and any merge remain pending.

The operator reports a successful hosted PostgreSQL 17.11 psql connection with
verify-full TLS 1.3 and readback of 30s idle/180s transaction timeouts, followed by
deletion of temporary credentials/profile/environment. These supplied facts were
not repeated or independently inspected here. Actual timeout expiry and physical
connection loss at COMMIT remain untested. Their operational acceptance, the
exact future client/profile/command, prior-backend resolution, direct migration
metadata handling and the final release-copy hash require separate review and
explicit execution approval. No ordinary db push may replace the atomic bootstrap.

Gate D hosted verification has not occurred. PUBLIC TEMPORARY remains a separate
Gate E blocker. Executor LOGIN/credentials, Auth users, provisioning, deployment
and hosted application admission remain closed.
