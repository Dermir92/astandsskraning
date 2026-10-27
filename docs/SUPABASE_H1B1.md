# Hosted Supabase H1b.1 — secure connection preflight

Base: approved main `5eae0eb6907f56cb1e579c2591916d11b5d92d98` (PR #12).
Scope: offline implementation and synthetic loopback tests. No hosted connection,
Auth/API call, SQL execution, provisioning or application data access authorized.

## Operator-supplied Dashboard facts

Project `ozcxjphzzwekpwsbglaf`, Paris, Free, PostgreSQL 17.11. Shared **session**
pooler `aws-1-eu-west-3.pooler.supabase.com:5432`, database `postgres`.
`pgcrypto` 1.3 is in `extensions`; SSL enforcement is enabled. Data API is enabled,
exposing `public` and `graphql_public`, with extra search path `public, extensions`,
automatic table exposure disabled and row limit 1000. Email authentication and
confirmation are enabled; public signup and anonymous sign-in are disabled.
No C1 migration/executor has been provisioned; `c1_private` does not exist.
These are Dashboard findings, not independently queried database evidence.

Downloaded public CA: `prod-ca-2021.crt`, valid 2021-04-28 through 2031-04-26.
X.509 SHA-256 fingerprint (not file hash):
`807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`.
Its compatibility with the live shared pooler is **unverified**. Do not substitute
another CA, relax verification or fall back to system trust if the probe fails.

## Implemented boundaries

- `h1b:tls:check` validates a supplied absolute public CA path offline against
  the fixed fingerprint, validity, CA constraint and single-certificate PEM
  format. No .env discovery, password/key input, SDK, database client or DNS.
- `h1b:tls:probe` additionally requires literal `--allow-network`. Host, port,
  fingerprint, SNI and hostname verifier cannot be overridden. The protocol sends
  the eight-byte PostgreSQL SSLRequest, accepts only `S`, then requires verified
  TLS 1.2+ with the explicit CA and Node's hostname check. One five-second deadline
  covers DNS/TCP/negotiation/handshake. The socket closes immediately after TLS;
  no PostgreSQL StartupMessage, username, password, SQL or Auth request is sent.
  Failures produce static diagnostics without underlying errors/causes or inputs.
  This authenticates the shared pooler hostname only; without database login it
  cannot establish project routing, database identity or executor privileges.
- Process-wide TLS/CA overrides and TLS-related Node startup flags are rejected.
  There is no insecure fallback, retry, automatic probe, saved success marker or
  application enablement. Merely importing modules or running ordinary tests does
  not contact Supabase. The protocol engine's socket parameter is used only with
  synthetic loopback peers in tests; the live wrapper always creates its own
  connection to the fixed approved endpoint.
- H1a validation returns only frozen status. It no longer returns key/password,
  URLs or nested database options; JSON, object spread, structured cloning and
  inspection with custom hooks disabled cannot retrieve discarded credentials.
- The H1a launcher starts an isolated custom Next server. It binds the actual
  HTTP listener to `127.0.0.1:3101` and checks `server.address()` **before** loading
  and preparing Next; each request also checks the listener and socket address.
  Unready/invalid listeners return 503; a binding failure stops startup. The
  supported server uses documented Webpack mode for Windows native-SWC policy
  compatibility. Existing HTTP Host/Origin checks remain additional boundaries.
- H1b has no application mode, endpoint or UI. H1a remains preparation-only;
  demo/C1 routing and the local C1 database client remain unchanged. Starting
  Next another way cannot enable hosted Auth or database access: none is wired.

## Security gates and remaining approvals

| Gate | H1b.1 state |
| --- | --- |
| Actual preparation-server loopback binding | Implemented and locally testable, independently of headers |
| Nested configuration/diagnostic credential disclosure | Removed at the validator result boundary; existing process environment remains private operator responsibility |
| TLS protocol/chain/hostname/expiry failures | Locally testable with synthetic certificates and real loopback TLS |
| Live pooler accepts the approved CA/hostname | **Unverified — live probe NOT EXECUTED** |
| Application Auth/database access | **Disabled**; future factories must enforce an active actual loopback binding and verify TLS on every database connection; probe success alone cannot enable access |
| Hosted object ownership, ACLs and executor | **Unverified/unprovisioned**, separate bootstrap review and approvals required |

Before the first hosted connection: independently review this uncommitted change,
confirm the local absolute path of the downloaded public CA and its provenance,
run the offline check, and explicitly authorize the live TLS-only probe. It needs
neither an administrative password nor an executor nor a publishable key. Network
reachability and live CA compatibility remain unknown until that approved probe.

Offline command (replace only the absolute certificate path):

```powershell
npm run h1b:tls:check -- --ca-file "C:\absolute\path\prod-ca-2021.crt"
```

Eventual live command — **NOT EXECUTED; separate approval required**:

```powershell
npm run h1b:tls:probe -- --allow-network --ca-file "C:\absolute\path\prod-ca-2021.crt"
```

## Migration readiness — no SQL executed

The reported PostgreSQL 17.11, `pgcrypto` placement, API row limit and restrictive
Auth settings satisfy the corresponding documented prerequisites. Retain
`graphql_public` as reported; no exposure or extension changes are proposed.
The baseline migration and `supabase/config.toml` are unchanged.

[Read-only SQL review artifact](review/H1B1_READ_ONLY_PREFLIGHT.sql) contains
catalog queries for capabilities, object conflicts, migration-history presence,
extension/digest access, ownership, RLS, schema/table/column/function privileges,
default ACLs, role memberships and executor ownership. It is outside the automatic
migration directory, has no runner, and is **not executed**. It is not a pass/fail
certification or proof that the hosted administrative role can perform DDL.

Before bootstrap, confirm all C1 object/role names are absent, review the exact
application/recording process for the one-shot baseline migration, and verify the
intended common table/SECURITY DEFINER owner (normally postgres), empty function
search_path and RLS assumptions. Audit effective PUBLIC/default/service_role
grants as well as explicit grants. In particular, inherited database TEMP/schema
CREATE privileges need review against the executor's no-object-creation rule.
Retain explicit per-function revokes; no global default-privilege change or
ownership redesign is introduced. Executor LOGIN/password provisioning and two
confirmed synthetic Auth owners require subsequent separate approval. The
executor must not be a JWT role or be granted to authenticator; it can call the
private save function for any owner, so server-verified ownership remains the
write boundary. Reads continue to require authenticated owner RLS.

## Verification

Run `npm run test:h1b`, `npm run test:h1a`, focused existing state/demo isolation
regressions, typecheck, lint and production build. H1b tests require OpenSSL (Git's
bundled executable on Windows; PATH on other platforms) and create disposable
synthetic keys/certificates only in temporary directories. No private keys or
real credentials are committed; traces, screenshots and videos are disabled.
Suites using port 3101 must run sequentially. The historical full regression
suite is not required.

| Final check | Result |
| --- | --- |
| `npm run test:h1b` | 14 passed; real synthetic loopback TLS, trust/expiry/hostname/downgrade rejection, deadlines, opt-in, binding and result redaction |
| `npm run test:h1a` | 56 passed; all existing H1a offline and preparation-page checks |
| Existing C1 state tests + demo isolation | 17 state + 3 demo checks passed; no database/Auth requests |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build -- --webpack` | Passed with both cloud flags and unusable build sentinels injected; production mode stayed disabled |
| Loopback production smoke, both flags set | Root 200; H1a preparation and C1 config/read endpoints all 404 |
| Build-sentinel scan of generated JS/HTML/JSON | Zero matches in `.next` and `.next-h1a`; evidence applies to these synthetic values only |
| Baseline migration, Supabase config, C1 server/mode gate, dependency lockfile, AGENTS.md | Unchanged |

The selected regressions used an ignored temporary Playwright configuration
under `artifacts/h1b`, with line reporting and capture disabled. The demo server
used `npm run dev -- --webpack`. Windows Application Control blocked the installed
native SWC binary, so Next used its WASM fallback with documented Webpack mode.

## Exact review-file inventory

17 files: 6 modified, 11 added. Implementation remains uncommitted. Generated
framework/test output is ignored; existing untracked historical QA is untouched.

| File | Change |
| --- | --- |
| `docs/SUPABASE_H1A.md` | Modified: link follow-up and document status-only validation |
| `package.json` | Modified: add offline check, opt-in probe and H1b tests; dependencies unchanged |
| `playwright.config.ts` | Modified: exclude isolated H1b tests from ordinary demo runs |
| `scripts/h1a-hosted.mjs` | Modified: use the binding-checked preparation server |
| `src/lib/cloud/hosted-config.mjs` | Modified: discard credential-bearing results and share offline trust validation |
| `tests/h1a/config.spec.ts` | Modified: assert the status-only result; TLS checks now also covered by H1b |
| `docs/SUPABASE_H1B1.md` | Added: scope, Dashboard findings, commands, gates, readiness, verification and inventory |
| `docs/review/H1B1_READ_ONLY_PREFLIGHT.sql` | Added: unexecuted catalog queries, outside migrations |
| `playwright.h1b.config.ts` | Added: isolated tests, no evidence capture |
| `scripts/h1a-loopback-server.mjs` | Added: actual loopback HTTP binding before Next initialization |
| `scripts/h1b-tls-preflight.mjs` | Added: strict offline/live operator commands |
| `src/lib/cloud/hosted-tls-preflight.mjs` | Added: fixed approved target, pinned CA and disabled-by-default hosted probe |
| `src/lib/cloud/loopback-binding.mjs` | Added: real listener binding assertions |
| `src/lib/cloud/postgres-tls.mjs` | Added: bounded PostgreSQL SSLRequest/TLS-only protocol engine |
| `src/lib/cloud/trusted-ca.mjs` | Added: shared offline certificate and explicit-TLS validation |
| `tests/h1b/preflight.spec.ts` | Added: focused security tests without hosted access |
| `tests/h1b/tls-fixture.ts` | Added: temporary synthetic certificates and loopback PostgreSQL/TLS peer |
