# Docker-first local setup — D1

D1 prepares the first isolated local start. **No Supabase start, database/Auth
connection, SQL, account provisioning or executor LOGIN was performed in D1.**
Gate C remains CLOSED; Gate E / PUBLIC TEMPORARY remains unresolved.

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
npm run test:d1     # Offline boundary tests; no Docker or Supabase execution
npm run d1:check    # Read-only host/config/image/resource/isolation checks
npm run d1:network  # Create/verify only the dedicated network, never a container
```

The dedicated bridge network is `astandsskodun-docker-c1-loopback`, with
`com.docker.network.bridge.host_binding_ipv4=127.0.0.1`, IPv6 off, and `--internal`
to restrict container egress. It has a D1 ownership label, no Supabase CLI project
label, and is never silently replaced or adopted from a foreign owner. No global
daemon settings change. Its actual port forwarding is deliberately untested until
the separately authorized first start.

The CLI is resolved from this worktree's installed package, or the primary
checkout's existing installation via Git's common directory. Nothing is copied
from the primary checkout. Package version **2.76.10** and executable SHA-256
`a203c2ab7de2072fb4e72bb141a663b95942fe503ec48ef60def21fc639d8902` are checked
without executing the CLI. This avoids `--version`'s cache/update-check side effect.
The pinned binary contains `network-id`; the pinned source wires it into Docker
network selection and leaves host binding to that network's default:
[CLI network selection](https://github.com/supabase/cli/blob/v2.76.10/internal/utils/config.go),
[container creation](https://github.com/supabase/cli/blob/v2.76.10/internal/utils/docker.go).
See also [Docker bridge binding](https://docs.docker.com/engine/network/drivers/bridge/#default-host-binding-address)
and [internal networks](https://docs.docker.com/reference/cli/docker/network/create/#internal).

## First start — separate approval required

**Do not run during D1.** After approval and a fresh successful `d1:check`:

```powershell
npm run d1:start -- --allow-local-start
```

The flag is an intentional operator action, not proof of approval. The launcher
rechecks everything immediately before invoking precisely the pinned binary with
`--workdir <this worktree> --network-id astandsskodun-docker-c1-loopback start`.
It accepts no target, workdir, database URL, network or extra CLI arguments.
The child's environment retains only Windows execution essentials and fixes
`DOCKER_CONTEXT=desktop-linux`; inherited Supabase/PG/C1/H1A, proxy and Node
overrides are excluded. Config contents and canonical source hashes are pinned.
Dotenv, custom SQL/roles, link/branch state and old runtime files are rejected.
The guarded path has no hosted database/Auth client or hosted execution command;
it does not restrict arbitrary manual commands outside the launcher.

First start creates a new local database volume and four containers. Supabase
initializes its own local schemas/Auth structures, then applies exactly:

1. `20261024000100_c1_owner_inspections.sql`.
2. `20261027000100_c1_hosted_acl_hardening.sql`.

This is native **per-file** migration handling, not the hosted atomic release
wrapper. No seed, Auth user or executor LOGIN is added. A failed migration/start
is STOP; no reset, repair or retry is attempted. The CLI itself may clean up newly
created resources on startup failure; preflight refuses any pre-existing D1
container/volume so old C1 and unrelated data are never selected.

These exact cached images are required; missing images cause STOP, never an
installer/pull fallback:

- `public.ecr.aws/supabase/postgres:17.6.1.084`
- `public.ecr.aws/supabase/gotrue:v2.186.0`
- `public.ecr.aws/supabase/postgrest:v14.5`
- `public.ecr.aws/supabase/kong:2.8.1`

CLI 2.76.10 uses `PullPolicyMissing` for these services
([source](https://github.com/supabase/cli/blob/v2.76.10/internal/utils/config.go)).
Keep the cached images present between inspection and startup; do not run image
cleanup concurrently. The local PostgreSQL default is 17.6, whereas historical
H1b SQL fixtures used 17.11. Hosted Gate D assertions are not local certification.

## STOP conditions and verification

- Wrong config/canonical bytes, branch, CLI hash/version, engine or network.
- Existing D1 container/volume, conflicting network ownership/membership,
  `.env`, link state, custom SQL or `runtime.json`; nothing is reused or deleted.
- Any occupied/reserved dedicated port or missing cached image.
- Less than **4 GiB free Windows RAM** or **4 GiB assigned to Docker**. These are
  conservative D1 operating thresholds, not Supabase's published minimums.
  Close unneeded applications and recheck; unrelated Docker projects are not stopped.
- After start: anything other than the four expected containers/images, wrong
  network ID, extra mounts, extra ports, or any effective binding other than
  `127.0.0.1:56421` and `127.0.0.1:56422`. `0.0.0.0`, `[::]`/`::`, blank effective
  bindings and Windows wildcard listeners are STOP.

The startup wrapper captures CLI output without printing keys, checks effective
Docker/Windows bindings and stops only its own exactly identified new containers
on failure. It does not remove volumes/networks. `npm run d1:verify` repeats the
metadata-only runtime checks; it opens no database/Auth session. Actual startup,
port reachability and migration/RLS SQL tests remain unperformed until authorized.
The launcher supports **first start only**; existing D1 data requires a separately
reviewed resume/recovery path, never reset or implicit reuse.

All six legacy C1 entry points now refuse this D1 config before resolving any CLI,
reading runtime or loading database/Auth dependencies. In particular stop/reset
no longer bypass that guard. D1 does not connect Next.js: its existing C1 endpoint
guards still target 55421/55422. A later approved phase must explicitly implement
the new app endpoints, local test accounts and executor setup. Hosted scripts and
release guards are unchanged.
