# H1b.2 offline verification — 2026-10-27

NOT EXECUTED ON HOSTED. 33 focused checks passed.

- PostgreSQL: 17.11, cached image `public.ecr.aws/supabase/postgres:17.11.0.004`, ID `sha256:06ddc7962e11ab0f4f0334fd05671e97c30ea202f6e6a7113800bd3d6e416108`.
- Disposable container: network none, read-only root, tmpfs data, no volumes, passwords or Auth users.
- Application SQL executes as non-superuser postgres with CREATEROLE; fixture administrator initializes only the disposable cluster.
- Native Windows CLI package: 2.76.10; executable SHA-256 `a203c2ab7de2072fb4e72bb141a663b95942fe503ec48ef60def21fc639d8902`.
- CLI database transport: host loopback stdio tunnel into the same network-disabled container; no password, project link or hosted target. Outbound HTTP directed to a local deny proxy (3 blocked requests).
- Lost acknowledgement test discards the prior response and verifies state from fresh connections; it does not inject a physical network fault at COMMIT.
- This fixture models the reported grants and minimal Auth signatures; it is not a hosted Supabase/GoTrue/PostgREST integration certification.

- PASS default review artifact refuses execution and rolls back
- PASS wrong project attestation refuses execution
- PASS unexpected effective/session role refuses execution
- PASS unreviewed event-trigger fingerprint refuses execution
- PASS changed enabled DDL event trigger refuses execution
- PASS reviewed trigger fingerprint is stable across inspection/bootstrap search paths
- PASS standalone type collision refuses bootstrap without replacing it
- PASS pre-existing metadata schema refuses bootstrap
- PASS original baseline retains exactly the reported service_role Dxtm
- PASS atomic bootstrap passes all application and history assertions
- PASS duplicate attempt refuses replay and preserves exactly two records
- PASS PUBLIC TEMP remains true, executor remains NOLOGIN, Auth fixture has no users
- PASS lost acknowledgement recovery uses a fresh connection and matching receipts
- PASS Gate D rejects MAINTAIN grant and rolls back mutation
- PASS Gate D rejects column grant and rolls back mutation
- PASS Gate D rejects inherited read access and rolls back mutation
- PASS Gate D rejects SET ROLE escalation and rolls back mutation
- PASS Gate D rejects executor LOGIN and rolls back mutation
- PASS Gate D rejects FORCE RLS and rolls back mutation
- PASS Gate D rejects owner policy widening and rolls back mutation
- PASS Gate D rejects column default drift and rolls back mutation
- PASS Gate D rejects definer search_path and rolls back mutation
- PASS Gate D rejects definer owner and rolls back mutation
- PASS Gate D rejects history source corruption and rolls back mutation
- PASS Gate D rejects metadata column grant and rolls back mutation
- PASS failure in hardening rolls back baseline, role, metadata and receipts
- PASS failed postcondition rolls back all DDL and history
- PASS unintended inherited grants fail closed without broad corrective revokes
- PASS scoped hardening removes private/global service defaults while preserving defaults
- PASS concurrent approved attempts commit exactly one bootstrap
- PASS installed CLI executable reports pinned version 2.76.10
- PASS native CLI two-file failure leaves first migration committed and Dxtm present
- PASS native CLI list and push accept explicit bootstrap history and skip both sources

Native CLI result: baseline commits before second-file failure; one history row and service_role TRUNCATE/MAINTAIN survive. Explicit bootstrap result: failure rolls back both files and metadata; CLI list, no-op push, fetch and a later migration accept the initialized history.

The disposable container is removed by the test harness; existing project containers/volumes are not modified. Raw local-only CLI failure evidence stays under ignored artifacts/h1b2/.

<!-- BEGIN H1B2_GATE_B2_RESULTS -->

## Gate B.2 canonical migration/release safety — 2026-10-27

NOT EXECUTED ON HOSTED. 23 focused checks passed. Historical Gate B.1 results above are retained; native CLI compatibility checks were not rerun.

- PASS canonical preparation: both approved canonical files generate disabled SQL
- PASS canonical preparation: missing companion fails without output writes
- PASS canonical preparation: mismatched companion hash fails without output writes
- PASS canonical preparation: missing original baseline fails without output writes
- PASS canonical preparation: modified original baseline fails without output writes
- PASS canonical preparation: review copy cannot override canonical source fails without output writes
- PASS canonical preparation: both canonical files map to exact recorded source chunks
- PASS canonical preparation: regeneration is deterministic and check mode validates it
- PASS canonical preparation: modified generated SQL is rejected without rewriting it
- PASS canonical preparation: release check rejects missing explicit canonical review
- PASS canonical preparation: release check rejects missing Gate C approval
- PASS canonical preparation: release check rejects unverified SQL Editor method
- PASS canonical preparation: release check rejects incorrect canonical approval mapping
- PASS canonical preparation: release check rejects different approved revision
- PASS canonical preparation: release check rejects sources absent from approved current revision
- PASS canonical preparation: no option enables or emits executable release SQL
- PASS default review artifact refuses execution and rolls back
- PASS atomic bootstrap passes all application and history assertions
- PASS database history receipts match both canonical source hashes
- PASS duplicate attempt refuses replay and preserves exactly two records
- PASS failure in hardening rolls back baseline, role, metadata and receipts
- PASS failed postcondition rolls back all DDL and history
- PASS concurrent approved attempts commit exactly one bootstrap

Both canonical source hashes and recorded source chunks match the approved values. Generator negative cases use copied fixtures only; the real baseline/canonical sources were not altered. Read-only Git revision checks reject the current uncommitted release inputs. Synthetic JSON attestations in negative tests are not human approval. No command enables SQL.

Atomic rollback and concurrency were rechecked in disposable PostgreSQL 17.11 (sha256:06ddc7962e11ab0f4f0334fd05671e97c30ea202f6e6a7113800bd3d6e416108), using a network-disabled container and no credentials/Auth users. SQL Editor execution method and hosted behavior remain unverified/unapproved. The exact metadata format stays pinned to CLI 2.76.10 and its previously recorded compatibility proof.

<!-- BEGIN H1B2_EXECUTION_METHOD_REVIEW_RESULTS -->

## Execution-method review — 2026-10-27

19 file-only preparation checks passed. No Docker operation, psql invocation, SQL, database/Auth connection, credential access or hosted operation occurred. Canonical source/hash, deterministic generation, release refusal and unchanged transaction-boundary checks only.

- PASS canonical preparation: both approved canonical files generate disabled SQL
- PASS canonical preparation: missing companion fails without output writes
- PASS canonical preparation: mismatched companion hash fails without output writes
- PASS canonical preparation: missing original baseline fails without output writes
- PASS canonical preparation: modified original baseline fails without output writes
- PASS canonical preparation: review copy cannot override canonical source fails without output writes
- PASS canonical preparation: both canonical files map to exact recorded source chunks
- PASS canonical preparation: regeneration is deterministic and check mode validates it
- PASS canonical preparation: modified generated SQL is rejected without rewriting it
- PASS canonical preparation: release check rejects missing explicit canonical review
- PASS canonical preparation: release check rejects missing Gate C approval
- PASS canonical preparation: release check rejects unverified execution method
- PASS canonical preparation: release check rejects legacy SQL Editor method
- PASS canonical preparation: release check rejects legacy SQL Editor approval field
- PASS canonical preparation: release check rejects incorrect canonical approval mapping
- PASS canonical preparation: release check rejects different approved revision
- PASS canonical preparation: release check rejects uncommitted release-source changes
- PASS canonical preparation: no option enables or emits executable release SQL
- PASS canonical preparation: psql file retains one explicit transaction and no reconnect/meta-commands

Legacy SQL Editor method/approval fields are refused; the proposed psql method still requires explicit human authorization, approved Git source and final artifact integrity. Both canonical migrations and Gate D/security assertion sources remain unchanged. Historical Gate B.1 and B.2 database/CLI evidence above was not rerun and is not evidence that the new proposed psql/profile/timeouts have been tested against hosted Supabase.
