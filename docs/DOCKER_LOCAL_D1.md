# Docker-first local setup — D1

D1 is the isolated local stack. Its first start (path C) ran on 2026-11-03 with
owner approval and was verified ([results](#verification-c5-2026-11-03)). Gate C
remains CLOSED; Gate E / PUBLIC TEMPORARY remains unresolved. No app connection,
Auth user or executor LOGIN is part of D1.

## Identity and services

- Approved base: `08a9b39420a86e8c5a4b584bddb4f002df1a742a`.
- Branch: `codex/docker-first-local`.
- Worktree: `C:/Users/Danni/Desktop/Repos/astandsskodun-docker-local`.
- Project: `astandsskodun-docker-c1`; API `127.0.0.1:56421`, PostgreSQL
  `127.0.0.1:56422`, shadow `56420`; future Next.js `127.0.0.1:3101`.
- Four services only: PostgreSQL, GoTrue/Auth, PostgREST, Kong/API gateway.
  Studio, Storage, Realtime, Inbucket, Analytics, Edge Runtime and pooler are off.
- Seeds remain disabled. Both canonical migrations and hosted release inputs
  remain byte-identical to the approved base.

## Prepared commands

Run from this worktree. These commands use Node built-ins; no dependency install,
`npx`, environment file or copied runtime is needed.

```powershell
npm run test:d1     # Boundary tests; reads the pinned CLI binary, runs no Docker
npm run d1:check    # Read-only host/config/image/resource/isolation checks
npm run d1:network  # Create/verify only the dedicated network, never a container
```

The dedicated bridge network is `astandsskodun-docker-c1-loopback`, with
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`, IPv6 off, and
`com.docker.network.bridge.enable_ip_masquerade=false` (no outbound NAT). **This
does not restrict egress on Docker Desktop:** C5 showed the containers still reach
the internet. Egress is blocked per container instead ([C6](#egress-isolation-c6)).
It has a D1 ownership label, no Supabase CLI project
label, and is never silently replaced or adopted from a foreign owner. No global
daemon settings change.

It is deliberately **not** `--internal`. The first authorized start (2026-11-03)
used an internal network: the database container became healthy, but the CLI's
connection from Windows to `127.0.0.1:56422` was refused, because Docker Desktop
forwarded no host port. The CLI removed its own new container and volume; no SQL
ran. That earlier internal network is refused (`NETWORK_INTERNAL_BLOCKS_HOST_PORTS`)
and must be removed manually while it has no members before `d1:network` creates
the reviewed one. Like `host_binding_ipv4`, Docker Desktop's own networking stack
ignores the disabled masquerade: Docker documents that all outbound container
traffic originates from the `com.docker.backend` process.

### Egress isolation (C6)

Docker Desktop's air-gapped containers need Docker Business and apply to every
container, and an internal network loses the host ports. D1 therefore isolates
each of its own containers (owner decisions 7 and 8, 2026-11-03):

- **No default route.** Right after each container starts, a short-lived helper
  (busybox `ip` from the cached GoTrue image, `NET_ADMIN`, joined to that
  container's network namespace) runs `ip route del default`; a second helper
  confirms the route is gone. Forwarded host connections reach the containers
  from the bridge gateway, which is on the container subnet, so the
  `127.0.0.1` ports and service-to-service traffic keep working, while internet
  connections fail with "Network unreachable". The services themselves get no
  extra capability.
- **No external DNS.** Containers are created with DNS server `192.0.2.1`
  (RFC 5737 TEST-NET-1). Docker's resolver still answers D1 container names but
  forwards external lookups to an address that goes nowhere.
- The one-off `gotrue migrate` job joins the database container's namespace,
  which has no default route by then.

An isolated test (2026-11-03, throwaway network and containers, removed
afterwards) confirmed each point: the `127.0.0.1` port and name-based traffic
between containers kept working, `http://1.1.1.1`, `http://example.com` and
`https://github.com` became unreachable, and external lookups failed only with
the DNS setting. The route stays removed while a container runs; restarting a
container restores it, which is one reason D1 supports a first start only.

## Why D1 creates the containers itself (path C)

The second authorized start (2026-11-03) ran the pinned CLI on the reviewed
network. Docker Desktop 4.96.3 ignored the network's `host_binding_ipv4` and
published the database and Kong on `0.0.0.0` and `::`; the binding check stopped
the containers (`PUBLIC_OR_WRONG_PORT_BINDING`). An isolated test confirmed that
only an explicit `127.0.0.1:<host>:<container>` binding stays loopback-only. CLI
2.76.10, 2.122.1 and 3.0.0 all publish without a host IP. The network option is
kept as defense in depth, but the explicit bindings are what keep D1 local.

D1 therefore creates the same four containers itself. [docs/d1-c/](d1-c/README.md)
records, with source citations, everything CLI 2.76.10 would have created. D1
mirrors it exactly except for the port host IP and eight owner-approved deviations
(2026-11-03):

1. **Keys:** every start generates a new database password, pgsodium root key,
   JWT secret, EC P-256 signing key, `sb_publishable_`/`sb_secret_` keys and
   HS256 anon/service_role JWTs, in the CLI's formats and claim shapes. They are
   stored only in the git-ignored `artifacts/d1-local/stack-secrets.json` and
   never printed. The CLI's public defaults are never used.
2. **Restart policy** `no` instead of `unless-stopped`.
3. **Labels:** only `is.astandsskodun.local.project`, so `supabase stop` or CLI
   cleanup can never act on D1.
4. **Kong** routes only the eight services whose upstream runs (auth, rest,
   rest-admin, graphql and the OAuth discovery route); the nine routes to
   Realtime, Storage, Functions, pg-meta, Analytics, pooler and Studio are dropped.
5. **Migrations** run through `psql` inside the database container
   (`docker exec`, peer-mapped `postgres` role over the socket, `ON_ERROR_STOP`,
   one transaction per file), never from Windows and never over the published port.
6. **Migration history** stores each file as a single `statements` element
   instead of the CLI parser's split.
7. **No default route** in any D1 container ([C6](#egress-isolation-c6)).
8. **No external DNS**: DNS server `192.0.2.1` on every service container.

The CLI templates (schema, webhook and `_supabase` SQL, `kong.yml`, nginx template
and Kong's localhost certificate) are read byte-exact from the pinned binary. Each
must match its recorded length and SHA-256 exactly once, so no third-party file or
key is copied into this repository. The binary is resolved from this worktree's
installed package, or the primary checkout's installation via Git's common
directory. Package version **2.76.10** and executable SHA-256
`a203c2ab7de2072fb4e72bb141a663b95942fe503ec48ef60def21fc639d8902` are checked.
The CLI is never executed.

## First start — separate approval required

**Do not run without approval.** After approval and a fresh successful `d1:check`:

```powershell
npm run d1:start -- --allow-local-start
```

The flag is an intentional operator action, not proof of approval. The launcher
rechecks everything immediately before starting and accepts no target, workdir,
database URL, network or extra arguments. Docker commands run with only Windows
execution essentials and `DOCKER_CONTEXT=desktop-linux`; inherited
Supabase/PG/C1/H1A, proxy and Node overrides are excluded. Config contents and
canonical source hashes are pinned. Dotenv, custom SQL/roles, CLI link/branch
state, old stack keys and old runtime files are rejected. The guarded path has no
hosted database/Auth client or hosted execution command. It does not restrict
arbitrary manual commands outside the launcher.

The start follows the CLI's order:

1. Write new keys to `artifacts/d1-local/stack-secrets.json` (refused if present).
2. Create the labelled volume and the database container, remove its default
   route, then wait up to 2 minutes for `healthy`. Confirm the CLI schema file ran
   during init (`_supabase` exists).
3. Run the one-off `gotrue migrate` container in the database's namespace, then
   remove it.
4. Create `supabase_migrations.schema_migrations` and apply exactly, each with its
   history row in the same transaction:
   1. `20261024000100_c1_owner_inspections.sql`.
   2. `20261027000100_c1_hosted_acl_hardening.sql`.
5. Start Kong, GoTrue and PostgREST, removing each one's default route; wait up
   to 30 seconds for Kong and GoTrue to be `healthy` and for
   `HEAD /rest-admin/v1/ready` through Kong to answer 200.
6. Verify the runtime metadata (below).

Containers are created through the verified `desktop-linux` named pipe, so the
environment and entrypoint secrets travel in the request body, never on a command
line. This is native **per-file** migration handling, not the hosted atomic
release wrapper. No seed, Auth user or executor LOGIN is added. A failed
migration/start is STOP; no reset, repair or retry is attempted.

These exact cached images are required; missing images cause STOP, never an
installer/pull fallback (containers are created through the Engine API, which
never pulls):

- `public.ecr.aws/supabase/postgres:17.6.1.084`
- `public.ecr.aws/supabase/gotrue:v2.186.0`
- `public.ecr.aws/supabase/postgrest:v14.5`
- `public.ecr.aws/supabase/kong:2.8.1`

Keep the cached images present between inspection and startup; do not run image
cleanup concurrently. The local PostgreSQL default is 17.6, whereas historical
H1b SQL fixtures used 17.11. Hosted Gate D assertions are not local certification.

## STOP conditions and verification

- Wrong config/canonical bytes, branch, CLI hash/version or templates, engine or network.
- Existing D1 container/volume (by name or any D1/CLI label), conflicting network
  ownership/membership, `.env`, CLI link/branch state (`supabase/.temp`,
  `supabase/.branches`), custom SQL, old `stack-secrets.json` or `runtime.json`;
  nothing is reused or deleted.
- Any occupied/reserved dedicated port or missing cached image.
- Less than **4 GiB free Windows RAM** or **4 GiB assigned to Docker**. These are
  conservative D1 operating thresholds, not Supabase's published minimums.
  Close unneeded applications and recheck; unrelated Docker projects are not stopped.
- After start: anything other than the four expected containers/images, a CLI
  label, a restart policy other than `no`, wrong network ID, extra mounts, extra
  ports, or any binding other than `127.0.0.1:56421` and `127.0.0.1:56422` in
  both the requested and the effective port maps. `0.0.0.0`, `[::]`/`::`, blank
  bindings and Windows wildcard listeners are STOP. So are a DNS setting other than
  `192.0.2.1`, any added capability on a service container, and a default route
  left in any of the four containers.

On failure the launcher stops only its own exactly named, D1-labelled containers.
It keeps the volume, network and keys file for inspection; it removes nothing.
It writes the failure, with this stack's keys, JWTs, API/hex keys, URL passwords
and labelled secrets masked, only to the ignored
`artifacts/d1-local/start-failure.log`. `npm run d1:verify` repeats the runtime
checks from Docker metadata, plus one short-lived, labelled helper per container to
read its routes (PostgREST has no shell); it opens no database/Auth session. The
launcher
supports **first start only**; existing D1 data requires a separately reviewed
resume/recovery path, never reset or implicit reuse.

The CLI start of 2026-11-03 left four stopped CLI-labelled containers, the volume
`supabase_db_astandsskodun-docker-c1` and CLI-written `supabase/.temp/cli-latest`
and `supabase/.branches/_current_branch`. With owner approval (C3), the
containers and volume were removed by exact name, and the two files were moved
out of the worktree. Other Docker projects' containers and volumes were compared
before and after and are unchanged.

## Verification (C5, 2026-11-03)

The first path-C start took 42 seconds; the launcher's own checks and
`npm run d1:verify` passed. Then, read-only and with owner approval:

- **Port exposure.** `docker ps` shows `127.0.0.1:56422->5432/tcp` and
  `127.0.0.1:56421->8000/tcp`; GoTrue and PostgREST publish nothing. Docker
  Desktop's backend log records only `tcp4 forward from 127.0.0.1` for both ports,
  with no wildcard or IPv6 forward. TCP connections succeed on `127.0.0.1` and are
  refused on `::1`, the PC's LAN address and the WSL/Hyper-V adapter addresses.
- **Database** (`psql` inside the container, `default_transaction_read_only=on`).
  `supabase_migrations.schema_migrations` has `version text, statements text[],
  name text` and exactly the two migrations, each stored as one element whose
  SHA-256 equals the pinned file hash. `public.c1_inspections` and
  `c1_private.operation_receipts` exist with RLS and owner `postgres`, as the CLI
  would create them. Only `c1_executor` (NOLOGIN) and the owner may execute
  `c1_private.save_inspection`. There are no rows and no Auth users. The CLI init
  ran (`_supabase` exists, two webhook versions, 74 GoTrue migrations), and the
  server is PostgreSQL 17.6.
- **Egress is open.** From the GoTrue container, `http://1.1.1.1`,
  `http://example.com` and `https://github.com` answered, and DNS resolves through
  Docker's resolver. The services need no egress and the database holds no data,
  but the network does not provide the egress isolation once intended. This
  led to [C6](#egress-isolation-c6); that stack was replaced (below).
- `/rest-admin/v1/ready` answers without a key, as with the CLI: that Kong route
  has no authentication, and it is reachable only on `127.0.0.1`.

## C6 applied (2026-11-03)

With owner approval, the C4 stack (four containers, its volume and its keys file)
was removed by exact name, and a fresh start with C6 succeeded in 42 seconds,
including `gotrue migrate` in the database's namespace. Then:

- `npm run d1:verify` passed: no default route in any of the four containers,
  DNS `192.0.2.1` on all of them, no added capabilities, restart policy `no`.
- The ports behave as in C5: open on `127.0.0.1`, refused on `::1`, the LAN
  address and the WSL/Hyper-V adapters; `HEAD /rest-admin/v1/ready` through Kong
  answers 200.
- From the GoTrue container, `http://1.1.1.1` fails with "Network unreachable",
  and `example.com` and `github.com` do not resolve. D1 container names resolve
  and GoTrue reaches PostgREST by name.
- The migration history again holds both files with their pinned hashes; 74
  GoTrue migrations, no Auth users, no rows, `c1_executor` NOLOGIN. No helper
  container was left behind.
- Containers, volumes and networks outside the D1 stack were compared before
  and after and are unchanged.

Containers use restart policy `no`, so they do not return after a Docker Desktop
or Windows restart. The launcher supports a first start only; resuming the
existing stack needs a separately reviewed path.

All six legacy C1 entry points now refuse this D1 config before resolving any CLI,
reading runtime or loading database/Auth dependencies. In particular stop/reset
no longer bypass that guard. D1 does not connect Next.js: its existing C1 endpoint
guards still target 55421/55422. A later approved phase must explicitly implement
the new app endpoints, local test accounts and executor setup. Hosted scripts and
release guards are unchanged.
