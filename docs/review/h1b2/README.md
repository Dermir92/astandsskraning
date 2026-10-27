# H1b.2 Gate B.2 — canonical migration and release safety

**NOT EXECUTED ON HOSTED. NOT AUTHORIZATION TO EXECUTE.** Prepared 2026-10-27.
No hosted database/Auth connection, Dashboard change, credential, account,
executor LOGIN, deployment, commit or PR is part of this package.

The original C1 file remains at
`supabase/migrations/20261024000100_c1_owner_inspections.sql`, unchanged:
5,703 bytes; SHA-256
`6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8`.
The canonical companion now exists, uncommitted, at
`supabase/migrations/20261027000100_c1_hosted_acl_hardening.sql`: 551 bytes;
SHA-256 `6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62`.
Its bytes exactly match the unchanged reviewed `HARDENING.sql`.
`manifest.json` pins both canonical sources and all package inputs/generated SQL.
`prepare.mjs` refuses a missing or changed canonical file BEFORE writing output.
It embeds executable SQL and history text from the verified canonical bytes;
the review-directory copy is a checked mirror, never the execution/history source.

**Gate C remains unapproved.** The current approved main does not yet contain
the new canonical file or release-preparation sources. The exact SQL Editor
execution method also requires separate approval and verification; local psql
tests do not establish Dashboard batch/connection/error behavior.

## Exact inventory

| File | Purpose |
| --- | --- |
| `README.md` | Strategy comparison, risks, approval gates and operator runbook |
| `HARDENING.sql` | Unchanged reviewed mirror of the canonical companion |
| `GATE_D.template.sql` | Application ownership/RLS/definition/effective-privilege assertions |
| `HISTORY_ASSERTIONS.template.sql` | Metadata shape, source receipts, ownership and access assertions |
| `GATE_D.sql` | Generated, pinned application + metadata assertions; reusable after commit |
| `PRE_EXECUTION_INVENTORY.sql` | SELECT-only supplementary identity/defaults/memberships/event-trigger inventory |
| `BOOTSTRAP.NOT_EXECUTED.sql` | Generated single-transaction proposal; execution inputs deliberately disabled |
| `RECOVERY_INVENTORY.sql` | SELECT-only first step after an unknown transaction outcome |
| `RECOVERY_HISTORY.sql` | SELECT-only receipt comparison, conditional on history table presence |
| `prepare.mjs` | Canonical hash guards, deterministic generation/integrity check, read-only Git release-prerequisite validation; no database/network |
| `test-local.mjs` | Focused tests using only a fresh disposable local cluster and isolated CLI workspaces |
| `manifest.json` | Versions, hashes, byte lengths, body hash and release inputs |
| `OFFLINE_VERIFICATION.md` | Actual local results, environment and limitations |

All thirteen files remain review artifacts. The additional canonical companion
was added to active migrations under Gate B.2 authorization, but not applied.
Generated SQL should be regenerated from the reviewed inputs, not hand-maintained.

## Strategy decision

| | Option 1: native CLI, two files | Option 2: explicit transaction |
| --- | --- | --- |
| Metadata initialization/recording | Native CLI | Reviewed bootstrap wrapper |
| Cross-file atomicity | Not provided by tested CLI 2.76.10 handling | Explicit BEGIN/COMMIT includes both sources and both receipts |
| Second-file failure | Baseline, executor NOLOGIN and first receipt remain committed; service_role Dxtm survives | Baseline, role, hardening, metadata initialization and receipts all roll back |
| Recovery | Requires review of partial state and separately approved completion | Fresh-session inventory + matching receipts + Gate D |
| Future CLI compatibility | Native format | Verified locally: list, no-op push, fetch, later migration |
| Main risk | Partially bootstrapped database until correction | Manual metadata correctness and future CLI format drift |

**Recommend Option 2 for the previously specified all-or-nothing bootstrap.**
Option 1 is simpler for normal migration management, but a standard two-file push
cannot be represented as one atomic bootstrap. The local failure test reached the
second file, raised division-by-zero, then observed one committed baseline receipt
and surviving service_role TRUNCATE/MAINTAIN. No hosted transport was tested.
Native handling could be reconsidered only if independently accepting an empty,
partially bootstrapped NOLOGIN state is an approved change to that requirement.
Neither path admits application use before all hardening and Gate D checks pass.

### Manual metadata contract and risks

The wrapper creates the absent schema as postgres, then the CLI 2.76.10-compatible
table `supabase_migrations.schema_migrations` with columns, in order:
`version text NOT NULL PRIMARY KEY`, `statements text[]`, `name text`.
It restricts schema/table access to the owner and asserts both explicit ACLs and
effective privileges, including column access. Existing metadata is rejected;
there is no `IF NOT EXISTS`, conflict suppression or migration repair.

Expected records at initial commit:

| version | name | statements |
| --- | --- | --- |
| `20261024000100` | `c1_owner_inspections` | One text-array entry containing the exact original source |
| `20261027000100` | `c1_hosted_acl_hardening` | One text-array entry containing the exact canonical companion source |

The wrapper checks each source SHA-256 before COMMIT. The CLI accepts a complete
source chunk in each array: this representation was exercised by migration fetch.
Fetch may normalize file delimiters/whitespace; preserve the original approved
source rather than replacing it with fetched output. The CLI compares version IDs,
not source checksums, so future use still requires the source manifest/Git review.

**Canonical presence is fixed; release approval remains a separate prerequisite.**
Both canonical files are now hash-verified before generation, and both history
records are generated from those canonical sources. The companion is still
uncommitted, so no approved Git revision containing it is available yet. Before
hosted execution, independently review the actual canonical files and approve
the exact Git revision containing both files AND the generator/assertion inputs.
Any future commit/PR needs separate authorization; none is performed by this work.
Prepare an isolated hosted migration workspace with exactly those approved files.
Do not link or push this repository's existing local-proof workspace/configuration.

### Offline release-prerequisite gate

The generator supports only three modes, all offline and all leaving execution
disabled:

- No arguments: validate both pinned canonical hashes and the review mirror,
  then regenerate disabled SQL and manifest. A missing/mismatched file fails
  before output writes; the approved hash constants are not learned from disk.
- `--check`: perform the same source checks and compare all generated SQL and
  manifest bytes with fresh in-memory output; refuse stale/modified artifacts.
- `--verify-release <approval-json>`: additionally validate explicit review and
  execution-method attestations, exact canonical mapping, approved revision equal
  to this repository's HEAD, and Git blob equality for both canonical files plus
  the generator and assertion inputs listed in the manifest. The repository root
  must match exactly. Missing/uncommitted/modified release sources stop the check.
  It then performs generated-artifact integrity checks and prints a result only.

The approval JSON must carry these fields (no valid approval is supplied here):

| Field | Required meaning/value |
| --- | --- |
| `schemaVersion` | `1` |
| `approvalReference` | Nonempty reference to actual human review/authorization evidence |
| `canonicalFilesReviewed` | `true` only after independent review of the actual canonical files |
| `approvedGitRevision` | Exact approved 40-character commit ID, equal to HEAD and containing the verified release sources |
| `canonicalMigrations` | Exact two `manifest.json` versions mappings, including canonical source paths/names/hashes, in version order |
| `gateCExecutionApproved` | `true` only after separate explicit Gate C authorization |
| `executionMethod` | `supabase-sql-editor-single-batch-one-connection` |
| `sqlEditorExecutionMethodApprovedAndVerified` | `true` only after the exact proposed execution method is approved and verified |

These fields are HUMAN ATTESTATIONS, not a self-authenticating authorization
mechanism. A JSON file cannot grant user permission. The validator does not
enable SQL, emit an enabled release copy, connect anywhere or execute anything.
The current checkout deliberately cannot pass its committed-source prerequisite.
After a future source revision is approved, regenerate/check at that revision,
retain the validator result, and independently review the exact final release
copy/hash before changing its three disabled release inputs. No command or flag
in this package enables execution. Do not bypass the check by editing a stale copy.

**Remote SQL cannot inspect local Git or prove human approval.** SQL still checks
its embedded receipt hashes, but source presence/revision/review remain local
release prerequisites. The new preparation guard closes the missing-canonical-file
generation path; it does not turn a project-ref literal or a database receipt into
proof of local source-control approval. Later source changes invalidate the
release review and require the local checks and final-copy review again.

The tested format is an internal CLI contract, not a permanently stable API.
CLI upgrades, different metadata ownership/ACL expectations, manual false receipts,
wrong version/name/text, or executing only part of the wrapper can invalidate it.
Direct metadata initialization/writes require explicit approval. Revalidate when
changing the pinned CLI. A metadata receipt alone is not proof of object integrity.

## Security boundaries and STOP conditions

- Correct scoped revokes remove service_role access from both tables, private
  schema and exact save signature. Table ALL includes PostgreSQL 17 MAINTAIN.
  Assertions cover raw ACL allowlists, table and column privileges, grant options,
  inherited access, executor role reachability and API SET ROLE to owner/executor.
  Unexpected inherited access causes failure; no broad corrective grants/revokes.
- The function and both tables must be owned by postgres; RLS enabled and FORCE
  off; exactly one authenticated owner SELECT policy; no receipts policies.
  Exact body hash, language, signature, empty search_path, columns, defaults and
  constraints are checked. Unreviewed application triggers/rules are rejected.
  Existing owner-scoped predicates, locks, revisions and replay behavior remain
  unchanged. This package does not rerun domain/integration regressions.
- The executor stays NOLOGIN/NOINHERIT, has no elevated attributes or ownership,
  outgoing membership or persistent CREATE. PG17's inverse creator ADMIN grant
  is allowed only from postgres, with INHERIT/SET false. Unexpected creator
  membership settings stop preflight; they are not automatically changed.
- PUBLIC CONNECT/TEMPORARY remains unchanged; the wrapper checks the observed
  database ACL and snapshots it and all global defaults across the transaction.
  **TEMP is explicitly a Gate E blocker for strict no-object-creation.** Passing
  this NOLOGIN Gate D is not approval of temporary objects or executor admission.
- Owner bypass of RLS and the function's ability to accept any owner UUID remain
  intentional limitations. Trusted server Auth verification remains mandatory.
- The original schema-scoped default function revoke does not remove global
  PUBLIC EXECUTE for future functions. Current explicit function ACLs are checked;
  future functions need reviewed transactional revokes. No global defaults change.
- Database name/role/version do not identify a Supabase project. The project-ref
  release input is an operator attestation only. Independently verify Dashboard
  project `ozcxjphzzwekpwsbglaf` and its intended development branch before any SQL.
- Data API exposure/extra search path and Auth configuration require independent
  Dashboard confirmation. Do not infer them from catalog assertions or add
  `c1_private`/`supabase_migrations` to exposure settings.

Every assertion raises `H1B2_STOP` on mismatch; SQL errors also fail the transaction.
Null/missing catalog identities, pre-existing C1 objects/roles/types, any existing
migration metadata schema, unreviewed enabled event triggers, wrong identity or
version, unexpected privilege/definition/history, and uncertain results mean STOP.
There is no automatic repair, drop, retry, LOGIN or account creation.

## Operator runbook — separate approval gates

1. **Gate B.2 independent offline review.** Review the actual canonical migrations,
   source hashes, generator guards and negative tests along with the SQL package,
   local evidence and manual metadata risks. Preparation is the only current
   authorization. Offline regeneration: `node docs/review/h1b2/prepare.mjs`.
   Integrity check: `node docs/review/h1b2/prepare.mjs --check`.
   Focused B.2 reproduction: `node docs/review/h1b2/test-local.mjs --gate-b2`.
   The test requires the existing cached image and local Docker Desktop engine;
   it never pulls images, accesses existing stacks or uses a hosted target.
2. **Supplemental read-only approval.** The supplied Gate A summary established
   history-table absence, not metadata-schema absence or an enabled event-trigger
   fingerprint. With separate authorization, run the SELECT inventory in the
   confirmed Dashboard project, one SELECT at a time; review each result before
   continuing, including event trigger handler hashes/behavior,
   complete creator defaults and memberships. Known facts need not be re-reviewed
   beyond confirming they remain unchanged. A pre-existing metadata schema needs
   its own reviewed branch of the plan; this wrapper will refuse it.
3. **Release preparation approval.** The canonical companion has been created,
   but the actual canonical files and exact Git revision still need independent
   approval. Ensure all manifest-listed release sources exist at that approved
   revision, then regenerate and run the read-only release-prerequisite check
   with real human approval evidence. Approve the isolated workspace, direct
   metadata writes and the exact SQL Editor execution method separately. Supply
   the reviewed event-trigger fingerprint. Only after those gates, prepare a
   release COPY with its three explicit input literals changed: authorization
   true, confirmed project ref and approved event-trigger fingerprint. Keep this
   review artifact disabled. Hash and independently review the complete release
   copy; changing inputs does not itself authorize execution.
4. **Gate C explicit hosted migration approval.** The SQL Editor method is a
   proposal requiring approval/verification, not an established hosted guarantee.
   Only after that and explicit execution approval may the operator execute the
   complete approved batch in SQL Editor on ONE connection as postgres,
   without selection/splitting or other migration operators. The advisory lock
   serializes cooperating attempts; object creation and primary keys fail closed
   against duplicate/noncooperating attempts. Permission errors/timeouts abort.
   Do not use normal two-file db push in place of this reviewed transaction.
5. **Gate D separately approved verification.** After confirmed COMMIT, run
   `GATE_D.sql` from a fresh connection in the confirmed project. Its assertions
   are catalog-only; no application function is called and no Auth rows are read.
   All checks must pass, both tables must still be unused, and Dashboard settings
   must remain as approved. A PASS printed before COMMIT is provisional.
6. **Gate E remains closed.** Decide TEMP policy separately; no database-wide
   privilege change is proposed here. Executor credentials/LOGIN and synthetic
   Auth accounts need distinct approval after Gate D. Gate F integration testing
   and application admission remain later work.

### Failure, rollback and lost acknowledgement

All statements support transaction rollback, including CREATE ROLE. A normal SQL
error aborts the transaction: no baseline, role, hardening or metadata commit.
The client must stop, close/roll back its session, and inspect from a fresh one.
Do not continue from the failed line or treat an earlier PASS as a committed result.
No executed SQL text/credentials should be copied into logs; use static errors,
catalog metadata and approved source hashes.

If the connection fails around COMMIT, delivery is uncertain even though database
effects remain atomic. **No automatic retry.** With read-only recovery authorization:

1. Confirm the Dashboard project again; run `RECOVERY_INVENTORY.sql` alone.
2. All C1 identities and metadata absent means this expected first bootstrap did
   not commit. Reconcile the failure and obtain approval before retrying.
3. All present: run `RECOVERY_HISTORY.sql`; require exactly the two matching
   version/name/source receipts, then run full `GATE_D.sql` independently.
4. Only matching receipts AND passing Gate D establish completion. Mixed state,
   extra/missing/wrong receipts, unexpected shapes/owners/ACLs, or any query error
   mean STOP for investigation. Never fabricate history or rerun the baseline.

The local recovery test suppresses the previous response and inspects fresh
connections. It is not a physical connection-loss injection at the commit instant.
Hosted Supabase event triggers, Auth service behavior, API routing and privileged
platform paths are outside the local fixture's proof.
