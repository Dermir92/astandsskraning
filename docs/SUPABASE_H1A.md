# Hosted Supabase H1a — isolated preparation

Base: merged main `682534f56ce90d89cb57704c389960e0f6ebc4e0`.
Scope: configuration only; synthetic tests; no hosted access or provisioning.

H1b.1 follow-up: [secure connection preflight](SUPABASE_H1B1.md). Validation now
returns status only (no credential-bearing configuration), and the isolated
launcher checks the actual loopback listener before preparing Next. The H1a
verification/inventory below records the original approved PR #12 baseline.

## Implemented boundary

`NODE_ENV=development` plus `H1A_HOSTED_PREPARATION=1` selects H1a.
`C1_LOCAL_PROOF=1` still selects C1 when H1a is off. Both flags together, or
malformed flag values, disable development access. With neither flag the demo
is unchanged. Production/test environments cannot activate either cloud mode.

H1a displays a preparation-only page and offers only
`GET /api/h1a/preparation`, returning mode, configuration valid/invalid, and
`access: disabled`. Missing/invalid configuration returns HTTP 503. Other hosts
or origins are rejected; forwarded-host headers are not trusted. Existing C1
config/read/write endpoints return 404 in H1a. No hosted SDK/client, database
connection factory, Auth UI, migration runner or hosted transport is wired in.
No configuration values, including the publishable key, are sent to the browser.

`npm run h1a:check` validates locally without opening a socket. `npm run dev:h1a`
validates first, then launches Next development on **127.0.0.1:3101**, with
`.next-h1a` output. Extra CLI arguments and non-development NODE_ENV are rejected.
The launcher fixes HOSTNAME/PORT and accepts no bind override. Use only this
launcher for H1a; H1b must preserve the same local binding. H1a and C1 servers
cannot run simultaneously because they intentionally use the same port.

No actual environment/credential/CA files have been supplied or created for H1a.
The launcher does not load .env files or discover credentials. After separately
approved provisioning, settings must be injected privately into its process.
Never prefix H1a settings with NEXT_PUBLIC_, put them in next.config.env, pass
them as command arguments or copy them into QA output. NEXT_PUBLIC_H1A_ aliases
and process-wide TLS overrides are rejected. Config errors contain no values or
underlying causes; normal config JSON/inspection is redacted. The Node-only
validator is consumed through a server-only facade by Next; the CLI imports it
directly. It must never be imported by a client component.

## Required settings (names only)

| Server environment name | Required value/constraint |
| --- | --- |
| H1A_HOSTED_PREPARATION | Exactly `1`; C1_LOCAL_PROOF absent or `0` |
| H1A_PROJECT_REF | The explicit 20-character lowercase project reference |
| H1A_SUPABASE_URL | Exactly `https://<project-ref>.supabase.co`; no extra path, port, credentials or query |
| H1A_PUBLISHABLE_KEY | Publishable `sb_publishable_` key; legacy and secret/service keys rejected |
| H1A_DB_MODE | Exactly `session`; direct/transaction modes intentionally unsupported in H1a |
| H1A_POOLER_HOST | Exact AWS shared-pooler hostname copied from Connect; no region-derived default |
| H1A_DATABASE_URL | PostgreSQL URI, matching pooler host, explicit port 5432, database postgres, role `c1_executor.<project-ref>`, nonempty percent-encoded password; no query or fragment |
| H1A_DB_TLS | Exactly `verify-full` |
| H1A_DB_CA_FILE | Absolute local path to one explicitly trusted, currently valid PEM CA certificate; no network share, private key or extra PEM payload |
| H1A_DB_CA_SHA256 | Certificate SHA-256 fingerprint, 64 hex characters without colons, independently checked against the intended trusted CA |

The validator checks the database URI's explicit host, port, database and executor
identity, then discards all inputs and returns only mode/configuration/access
status. It exposes no database options or credential-bearing nested objects.
TLS pins the supplied CA, requires certificate validation, uses the
exact copied hostname for SNI and Node's built-in hostname verifier, and requires
TLS 1.2 or newer. No insecure fallback is allowed. Postgres.js `ssl: require`
would disable verification, so it is not used. Trust is checked offline only;
H1a never constructs a Postgres client. The old C1 client/settings are unchanged.

Offline validation cannot establish that a hostname belongs to this project,
that a key/password is authentic, that a role has the expected effective grants,
or that a hosted TLS handshake succeeds. Those remain H1b gates. A fingerprint
only confirms the selected CA bytes; the operator must establish their provenance.

Sources: [Supabase connection modes and custom usernames](https://supabase.com/docs/guides/database/connecting-to-postgres),
[TLS enforcement and verification](https://supabase.com/docs/guides/platform/ssl-enforcement),
and the installed Postgres.js 3.4.9 TLS implementation.

## Existing migration prerequisites — documented, not executed

Keep `supabase/migrations/20261024000100_c1_owner_inspections.sql` unchanged.
It creates objects once, so confirm they do not already exist and record its
application through the approved migration process; do not blindly rerun it.

1. A compatible PostgreSQL installation (local baseline: 17), Supabase Auth's
   `auth.users`, `auth.uid()`, and the standard anon/authenticated roles exist.
   The migration identity can create schemas/roles/tables/functions, reference
   auth.users, and grant/revoke privileges. Hosted postgres is administrative,
   not a general superuser; verify the required capabilities before applying.
2. `pgcrypto` is installed **in extensions**, and
   `extensions.digest(bytea,text)` is callable by the save-function owner.
   The baseline does not install it. If absent/misplaced, stop and separately
   review an extension change; do not move an extension used by other code.
3. Create the tables and SECURITY DEFINER save function under the same reviewed
   owner, normally postgres. Verify function owner, `prosecdef`, empty search_path,
   table ownership/access and enabled RLS. The function relies on owner access
   past RLS; FORCE RLS or changing ownership can break that assumption. All write
   predicates must remain explicitly scoped by the server-verified owner UUID.
4. `c1_executor` initially remains NOLOGIN. Later credential provisioning is a
   separate approval: LOGIN plus a dedicated password, NOSUPERUSER, NOCREATEDB,
   NOCREATEROLE, NOINHERIT, NOBYPASSRLS and no privileged role memberships.
   Required effective privileges: database CONNECT, c1_private USAGE and EXECUTE
   on precisely save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz). It must
   not own objects, CREATE objects, or directly read/write either application
   table. Audit inherited/PUBLIC privileges, not just explicit grants. Do not
   grant the executor to authenticator or make it a browser JWT role.
5. Data API stays enabled, with public exposed and c1_private excluded from
   exposed schemas and extra search paths. Automatic table exposure stays off;
   the baseline's authenticated SELECT grant opts in this table. Audit effective
   ACLs: authenticated SELECT only with owner RLS; anon no access; neither browser
   role may call the save function; executor no direct table access. Review any
   project-default service_role grants explicitly. Response row limit must be
   at least 500 so the existing bounded collection is not silently truncated.
6. Email/password provider remains enabled, public signups/anonymous sign-ins
   disabled, email confirmation enabled. Later, create two confirmed synthetic
   owners administratively and use their hosted Auth UUIDs. Do not copy local
   Auth records/UUIDs or insert directly into hosted auth.users. Invitation and
   reset-link handling are not implemented by C1/H1a. Pace future Auth tests to
   hosted rate limits rather than copying the local limit of 500.

The executor may call the function for any supplied owner. The trusted server's
Auth verification is the write-ownership boundary; RLS protects token-based
reads. No stronger claim is made by H1a.

## Default-function-privilege decision

The baseline's final schema-scoped default revoke cannot subtract PostgreSQL's
global PUBLIC EXECUTE default. Its explicit revoke on the existing save function
does protect that function. New functions need explicit revokes/grants in the
same transaction as creation, and an ACL check before access is enabled.

**No SQL addition or global ALTER DEFAULT PRIVILEGES is introduced by H1a.**
Changing defaults globally for postgres would affect future functions created
by that role in every schema, including future extension or Supabase-related
functions created as postgres. It would not repair existing functions or affect
objects created by other roles, and schema-level grants may still add access.
Such a change could break callers that rely on default EXECUTE. It needs an
inventory and explicit approvals/grants, not a broad hosted bootstrap shortcut.
A dedicated app-owner role could narrow future defaults but adds ownership and
migration responsibilities; that redesign is not part of H1a.

For H1b, retain explicit per-function revokes/grants and inspect effective ACLs.
Any proposed extension, privilege or ownership SQL must be presented as a
separate review artifact outside the auto-applied migration directory first.
[PostgreSQL default-privilege semantics](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html)

## Dashboard actions — none performed

| Action | Classification / timing |
| --- | --- |
| Inspect project ref, PostgreSQL version, Connect session host/port and SSL settings | Read-only; needed to prepare H1b review |
| Inspect pgcrypto installation/schema, exposed schemas, row limit and Auth settings | Read-only; needed to prepare H1b review |
| Download/inspect the public CA and independently verify its fingerprint | Dashboard read-only; creates a local public-certificate file; no password/key retrieval needed |
| Enable SSL enforcement if off | Changes state and briefly restarts the database; separate approval |
| Correct an extension, exposure, row-limit or Auth-provider setting if needed | Changes state; review the exact difference first |
| Apply baseline/additional SQL, enable/provision executor LOGIN, or create confirmed synthetic users | Changes state; separate H1b approval and secure provisioning required |

Keep the already confirmed restrictive settings. Do not enable GitHub integration,
public registration, anonymous users, private-schema API access or deployment.

## Verification and next gate

`npm run test:h1a` uses only unusable synthetic configuration and Node's public
CA store. It tests mode isolation, missing fields, URL/role/port boundaries,
trust failures, built-in hostname checking, safe diagnostics and the loopback
preparation page/endpoint. No hosted endpoints are called. TLS option tests are
offline checks, not proof of a hosted handshake. Traces/screenshots/video are off.

Executed 26 October 2026, with no retries:

| Check | Result |
| --- | --- |
| `npm run test:h1a` | 56 passed; offline configuration/TLS plus synthetic loopback runtime checks |
| C1 database + state projects | 27 passed; existing real local PostgreSQL/Auth/HTTP and store regressions |
| C1 ui-1440: newer-commit replay, account changes during recovery, account switching, pre-commit rejection | 4 passed |
| Demo isolation, all three configured projects | 3 passed; both C1 and H1a endpoints absent |
| `npm run typecheck` / `npm run lint` | Both exit 0 |
| `npm run build`, both development flags set, unusable secret/key sentinels injected | Exit 0; production mode stayed disabled |
| Loopback production smoke with both flags set | Root 200; C1 config, read, write and H1a preparation all 404 |
| Known local password / build-sentinel scan | 221 changed/generated files checked; zero matches |
| New H1a verification screenshots, traces, videos | Zero |
| Baseline migration, Supabase config, C1 launcher and dependency lockfile | Unchanged |

The C1 commands selected database/state and four screenshot-free UI scenarios,
with `--reporter=line --trace=off` and output under ignored `artifacts/h1a/`.
Demo isolation used the same reporter/trace overrides. These are relevant local
regressions, not a rerun of all 77 C1 checks or the complete demo suite. The
existing C1 volume/accounts were reused without reset, preparation or credential
rotation; only synthetic local test data was written. The stack was started
from its retained volume, and no migration command was run. No hosted project
was contacted. H1a browser scripts were also checked for the synthetic key and
password. This scan is evidence for the tested values, not a general secret audit.

## Exact changed-file inventory

19 files: 9 modified, 10 added. No staged files or commits.

| File | Change |
| --- | --- |
| `.gitignore` | Ignore separate H1a framework output |
| `eslint.config.mjs` | Ignore H1a generated files |
| `next.config.ts` | Select isolated mode/build directory |
| `package.json` | Add H1a check, serve and test commands; no dependencies changed |
| `playwright.config.ts` | Exclude H1a tests from ordinary demo runs |
| `src/app/layout.tsx` | Isolated preparation-only server page; preserve C1/demo providers |
| `src/lib/cloud/server.ts` | Share mutually exclusive mode gate; retain local transport unchanged |
| `tests/c1-demo-isolation.spec.ts` | Assert H1a endpoint is absent in demo |
| `tsconfig.json` | Include H1a generated route types |
| `docs/SUPABASE_H1A.md` | Added: scope, settings, prerequisites, decisions, manual actions, verification and inventory |
| `playwright.h1a.config.ts` | Added: isolated configuration tests, no evidence capture |
| `scripts/h1a-hosted.mjs` | Added: local-only validator/launcher, no provisioning |
| `src/app/api/h1a/preparation/route.ts` | Added: status-only endpoint with local request checks |
| `src/lib/cloud/development-mode.mjs` | Added: shared mode and local request boundaries |
| `src/lib/cloud/hosted-config.mjs` | Added: Node-only configuration/TLS validation; no connections |
| `src/lib/cloud/hosted-preparation.ts` | Added: server-only status facade |
| `tests/h1a/config.spec.ts` | Added: focused mode, secret, URI and TLS rejection tests |
| `tests/h1a/fixtures.ts` | Added: unusable synthetic settings and public test trust material |
| `tests/h1a/runtime.spec.ts` | Added: synthetic loopback endpoint/page/bundle checks |

Pre-existing untracked QA files were left untouched. Generated framework and
test output is ignored; no new screenshot/evidence package was produced.

**Next action before H1b:** independently review this uncommitted H1a diff and
approve (or revise) a separate H1b scope for hosted preflight and secure
provisioning. H1a itself authorizes no hosted connection or state change.
