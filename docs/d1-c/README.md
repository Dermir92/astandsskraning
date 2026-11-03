# D1 path C — C1 parity inventory

Status: **C1 complete, read-only. C2 implemented (not yet run).** No container
was created and no CLI, SQL or Docker network command was run for this inventory;
only read-only Docker metadata (`image inspect`, `context inspect`) and GitHub
source were read. The owner approved the six deviations below on 2026-11-03, and
`scripts/d1-local.mjs` implements them ([C2 notes](#c2-implementation-notes)).
Nothing here authorizes C3–C5. Gate C remains CLOSED; Gate E / PUBLIC TEMPORARY
remains unresolved.

## Why path C

The first authorized D1 starts (2026-11-03) showed that, on this Docker Desktop
(4.96.3, engine 29.9.2, WSL2), ports published without a host IP are bound to
`0.0.0.0` and `::` even when the network sets
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`. An isolated test
confirmed it, with and without `enable_ip_masquerade=false`, and showed that
only an explicit `-p 127.0.0.1:<host>:<container>` stays loopback-only (not
reachable through the PC's LAN address). Supabase CLI 2.76.10, 2.122.1 and
3.0.0 all publish without a host IP. Path C therefore has D1 create the same
four containers itself with explicit `127.0.0.1` bindings.

C1 records exactly what the pinned CLI 2.76.10 would have created, so C2 can
reproduce it and every deviation is deliberate.

## Documents

- [Database, init job and migration history](cli-2.76.10-database.md)
- [Kong, GoTrue, PostgREST and keys](cli-2.76.10-services.md)

Provenance: `supabase/cli` tag `v2.76.10` = commit
`54c41b8477f286c0d83d3d6bec4700547b2436f1`; every cited file was blob-verified
against that tree. Image init: `supabase/postgres` tag `17.6.1.084` = commit
`f183a83f0bd0122c9dcc438f17a106533435c963`. Neither document contains secret
values; public CLI defaults are named, never reproduced.

## What the CLI does (summary)

1. Pulls missing images, creates volume `supabase_db_astandsskodun-docker-c1`
   and starts `supabase_db_astandsskodun-docker-c1` (aliases `db`,
   `db.supabase.internal`). Its `sh -c` entrypoint writes
   `/etc/postgresql.schema.sql` (three embedded templates), the pgsodium root key
   and a `postgresql.conf` header, then runs `docker-entrypoint.sh postgres -D
   /etc/postgresql`. The image's `migrate.sh` applies the schema file as
   `supabase_admin` on first init.
2. Waits up to 2 minutes for `healthy` (`pg_isready -h 127.0.0.1`, 10s/2s/3).
3. Only on a new volume: connects from the host to `127.0.0.1:56422`, runs a
   one-off `gotrue migrate` container, creates
   `supabase_migrations.schema_migrations` and applies each migration file as one
   implicit transaction together with its history row.
4. Starts Kong, GoTrue and PostgREST on the same network, then waits up to 30
   seconds: Kong and GoTrue must be `healthy` (image `kong health`; CLI `wget
   /health`), PostgREST must answer `HEAD /rest-admin/v1/ready` through Kong with
   200.
5. Only the db (`5432/tcp → 56422`) and Kong (`8000/tcp → 56421`) are published,
   both with an **empty host IP**, which is the source of the `0.0.0.0` binding.

## Must mirror in C2 (no decision needed)

- Container names, images (pinned tags, `--pull never`), network and aliases.
- db: env, entrypoint construction, the three templates byte-for-byte
  (SHA-256 pinned), healthcheck, named volume and mount path.
- Order: db healthy → `gotrue migrate` → migrations → Kong, GoTrue, PostgREST.
- `gotrue migrate` env; GoTrue's 63 emitted variables; PostgREST's 7; Kong's 10,
  its nginx template and the TLS certificate files.
- Migration history table DDL and per-file atomicity (statements and history
  row in one transaction).
- Health gates and timeouts as listed above.

**The only change needed for the root cause:** `HostIp: 127.0.0.1` on the db
and Kong bindings.

## Deliberate deviations (approved by the owner 2026-11-03)

| # | Topic | CLI 2.76.10 | D1 |
|---|---|---|---|
| 1 | Keys and secrets | Public defaults: JWT secret, DB password, pgsodium root key, EC P-256 signing key (in `GOTRUE_JWT_KEYS`), `sb_publishable_`/`sb_secret_` keys; HS256 anon/service_role JWTs | Generate all per new stack with the same formats and claim shapes; keep them only in ignored `artifacts/d1-local/stack-secrets.json` (0600), never printed |
| 2 | Restart policy | `unless-stopped` | `no`: D1 containers run only when the launcher starts them |
| 3 | Labels | `com.supabase.cli.project` and `com.docker.compose.project` | D1 owner label only, so `supabase stop`/cleanup never acts on D1 |
| 4 | `kong.yml` | All 17 services; 9 point at containers that do not run, graphql targets an unexposed schema | Keep the 8 services whose upstream runs, drop the 9 others |
| 5 | Migration execution | Host pgx connection to `127.0.0.1:56422` | `docker exec` + `psql -v ON_ERROR_STOP=1 --single-transaction` inside the db container, history row in the same transaction; no host SQL client and no dependence on the published port |
| 6 | History `statements` column | CLI parser split (16 and 3 statements) | The whole file as one element (not the CLI parser split) |

## C2 implementation notes

**Parity check.** With the CLI's public default keys substituted, the D1
builders reproduce the recorded CLI outputs byte for byte: the db entrypoint
(9851 B, `64c86ff6…`), the full rendered `kong.yml` (14991 B, `18d09964…`), the
Kong entrypoint (21230 B, `017fffeb…`), the anon and service_role JWTs,
`GOTRUE_JWT_KEYS` (288 B) and `PGRST_JWT_SECRET` (335 B). This was a local,
uncommitted check because it needs the defaults. D1 then substitutes per-stack
keys and the trimmed `kong.yml` (CLI template lines 1–99 and 189–199, SHA-256
`0e46f517…de48`, pinned in the launcher).

**Resolved open items.**

- `pg_hba` (`supabase/postgres` @ `f183a83f`, `pg_hba.conf.j2`/`pg_ident.conf.j2`):
  `local all all peer map=supabase_map`, which maps OS `root` and `postgres` to
  the `postgres` role. `docker exec … psql --host /var/run/postgresql --username
  postgres` therefore needs no password at all.
- Healthy before init ends: the image's pinned docker-library entrypoint runs
  init on a socket-only temporary server, so `pg_isready -h 127.0.0.1` cannot
  pass early. D1 also asserts that `_supabase` exists after `healthy` (it is
  created last by the CLI schema file) before any further step.
- JWKS: a test signs with the generated GoTrue key and verifies with the
  public key that PostgREST receives; the private `d` never leaves `GOTRUE_JWT_KEYS`.

**Still open.** `additional_redirect_urls = []` is assumed to replace the CLI
default (empty `GOTRUE_URI_ALLOW_LIST`), as recorded in C1; not executed.

**Mechanics that differ from the CLI but not in what is created.**

- Containers are created with the Engine API (`POST /v1.44/containers/create`)
  through the verified `desktop-linux` pipe, so `Entrypoint`, `Healthcheck`
  and `Env` have the CLI's exact form and secrets never reach a command line.
- The one-off `gotrue migrate` job gets a 120-second limit (the CLI has none)
  and is force-removed after it exits, as the CLI removes it.
- Each migration runs in a fresh `psql` session, which resets more session state
  than the CLI's `RESET ALL`.
- Nothing is written to `supabase/.temp` or `supabase/.branches`: those are CLI
  bookkeeping, not stack state. Preflight now refuses them.
- Kong keeps the CLI's public localhost certificate and key, because only port
  8000 is published and 8443 never leaves the D1 network.

## Existing state that C3 must resolve (still present)

- Four stopped CLI-created D1 containers and volume
  `supabase_db_astandsskodun-docker-c1` (from the 0.0.0.0 start). They cannot be
  reused: published ports cannot be changed on an existing container.
- CLI-written, git-ignored `supabase/.temp/cli-latest` and
  `supabase/.branches/_current_branch`. The preflight rejects them before a new
  first start.

Removing any of these requires separate owner approval.
