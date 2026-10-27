# H1b.2 — proposed Gate C execution method

Offline review/preparation, 2026-10-27. **NOT AUTHORIZATION TO EXECUTE.**
Approved source baseline: `b3e23ea00ff7e8226f4425cff9ed8a3562cc3a3e`.
No project endpoint, database, Auth service or credential was accessed here.

## Recommendation

Use a reviewed PostgreSQL 17 `psql` client, one process/session and one approved
bootstrap file, through the already specified session pooler on port 5432.
Retain the file's explicit BEGIN/COMMIT. No ordinary two-file `supabase db push`.
The existing SQL Editor method is not sufficiently verified for this bootstrap.

| Requirement | Supabase SQL Editor | Proposed psql method |
| --- | --- | --- |
| Session | A single submitted SQL string can use one backend call; separate clicks/submissions have no demonstrated session continuity | One controlled client session; approved file contains no reconnect commands |
| Atomicity | Depends on the full unchanged transaction reaching PostgreSQL | Same reviewed explicit transaction, read from one hash-checked file |
| Error observation | Browser/HTTP/service errors can obscure the database outcome | ON_ERROR_STOP and noninteractive process exit status; still reconcile uncertain COMMIT |
| Timeout | Dashboard has an additional 60-second limit | Server limits and a separately reviewed whole-transaction bound; no Dashboard request timer |
| Source fidelity | Selection, copy/paste and submission handling require additional evidence | Approved file bytes are checked locally before use |

Supabase documents the Dashboard timeout and recommends Supavisor/direct
connections for longer transactions. Its public postgres-meta v0.100.0 query
route passes one SQL string into its query layer, whose implementation calls a
pool query and returns row data. This supports a single-call interpretation;
it does not establish the deployed Dashboard version, frontend selection/split
behavior, retry policy, cancellation delivery or commit acknowledgement contract.
An HTTP timeout is not proof of rollback. The inspected source is evidence about
that release, not certification of this hosted project's transport.

Sources: [Supabase timeouts](https://supabase.com/docs/guides/database/postgres/timeouts),
[query route v0.100.0](https://github.com/supabase/postgres-meta/blob/v0.100.0/src/server/routes/query.ts),
[query implementation v0.100.0](https://github.com/supabase/postgres-meta/blob/v0.100.0/src/lib/db.ts).

## Proposed invocation — NOT EXECUTED

This is a method specimen, not a configured command or service. No service or
credential file has been created. The client version, connection profile, exact
file and full command must be separately approved before Gate C.

```text
psql -X -w -v ON_ERROR_STOP=on -v ON_ERROR_ROLLBACK=off -d "service=REVIEWED_BOOTSTRAP_SERVICE" -c "SET idle_in_transaction_session_timeout='30s'; SET transaction_timeout='180s';" -f "APPROVED_BOOTSTRAP.sql"
```

`-X` suppresses startup files; `-w` prevents password prompting. Stop-on-error is
explicit, and savepoint-based error continuation is disabled. Do not add `-1` /
`--single-transaction`: the approved file already contains BEGIN/COMMIT. Do not
split its contents across client processes, add reconnect commands or enable
automatic retry. These choices follow the documented
[psql options/error behavior](https://www.postgresql.org/docs/17/app-psql.html).

The proposed profile must pin the approved session host/port, postgres identity,
database and project route. Require `sslmode=verify-full`, the independently
approved CA and TLS 1.2 or newer. Do not fall back to `require`/`prefer`, other
hosts or transaction-pooler mode. Credentials remain a separate private operator
procedure after authorization; no password/key belongs in argv, this repository
or captured output. No profile or credential is inspected/prepared by this review.
See [libpq certificate/hostname verification](https://www.postgresql.org/docs/17/libpq-ssl.html)
and [Supabase connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Timeouts and outcome

Keep the reviewed SQL's transaction-local lock timeout 5s and statement timeout
60s unchanged. The latter limits each statement, not the entire script. The
specimen additionally proposes session-only idle-in-transaction 30s and total
transaction 180s, established before the file in the same client session. Those
new session bounds require approval and confirmation of support/effect before
execution; no global/role defaults or bootstrap assertions are changed here.
They limit abandoned sessions without using a browser timeout as a rollback claim.
See [PostgreSQL 17 timeout semantics](https://www.postgresql.org/docs/17/runtime-config-client.html).

Require exit 0 and the final COMMIT acknowledgement, then verify both receipts
and Gate D from a fresh authorized connection. A PASS printed before COMMIT is
provisional. Exit 1/2/3 or a missing response means stop, not retry. A SQL error
before commit aborts the transaction; session termination cleans up uncommitted
work. A disconnect before, during or after commit remains uncertain even with
psql. Freeze further execution and first resolve the prior backend/transaction,
or STOP. An all-absent snapshot alone cannot prove rollback while that transaction
may still commit. After it has definitively ended, use a fresh authorized session
for the recovery inventory/history procedure. All-present requires exact receipts
and full Gate D; mixed/uncertain state means STOP. There is no automatic retry,
backend cancel or terminate. Hosted investigation/intervention needs its own
authorization; this offline package does not provide it.
See [PostgreSQL protocol termination/cancellation](https://www.postgresql.org/docs/17/protocol-flow.html).

## Guard/runbook changes and supplied catalog evidence

- The catalog query correction is only `ORDER BY 1, 2`, in both the generator
  and generated inventory. It avoids output aliases inside ORDER BY expressions;
  ordinal ordering is identifier ordering, not an alphabetical-role-name promise.
- The release check now accepts only
  `psql-single-session-explicit-transaction-on-error-stop` plus the neutral
  `executionMethodApprovedAndVerified` attestation. Old SQL Editor method/field
  approvals do not satisfy it. The method-review document joins the Git-reviewed
  release input set. No command enables SQL or grants human authorization.
- Both canonical migrations, the transaction body and all security assertions
  remain byte-identical to approved main. All three SQL activation inputs remain
  disabled/unconfirmed. This review creates no enabled release copy or approval JSON.
- The operator reports PostgreSQL 17.11/postgres, C1/executor/history absence,
  reviewed memberships/ACLs, and seven reviewed enabled event triggers with hash
  `c15af4bafb248aa9901781363b5bba51d6cefd55af7a9268ed13421b2065b352`.
  These supplied findings are recorded, not re-queried here. They do not authorize
  replacing the release inputs. Revalidate absence/identity at execution time.
- Remaining gates: approve this correction/method/source revision, the exact
  client/profile/command and session bounds, direct history handling and final
  release-copy hash, then separately authorize Gate C. Remote SQL cannot prove
  local Git approval. Gate D remains future work. PUBLIC TEMP remains a Gate E
  decision; executor LOGIN, Auth accounts and application admission stay disabled.
