# Supabase CLI v2.76.10 — DB-side parity inventory (D1 / `astandsskodun-docker-c1`)

Scope: database container, init steps, migration history, as executed by
`supabase --workdir <worktree> --network-id astandsskodun-docker-c1-loopback start` with the pinned Windows binary
(`node_modules/supabase/bin/supabase.exe`, per `scripts/d1-local.mjs:138-145` in the project).

Source provenance
- Tag `v2.76.10` = commit `54c41b8477f286c0d83d3d6bec4700547b2436f1` (`gh api repos/supabase/cli/git/ref/tags/v2.76.10`).
- All CLI files were fetched with `gh api -H "Accept: application/vnd.github.raw" "repos/supabase/cli/contents/<path>?ref=v2.76.10"`
  into a local working copy (not committed). The key files' `git hash-object` values match the blob SHAs in the v2.76.10 tree.
- Citation format: `path:line @ v2.76.10`. Third-party dependency citations name their module version (taken from `go.mod @ v2.76.10`).
- Project config: `C:/Users/Danni/Desktop/Repos/astandsskodun-docker-local/supabase/config.toml` (cited as `config.toml:N`).
  Worktree HEAD `88ac8e7`. `supabase/` contains only `config.toml`, `.gitignore`, `migrations/` (2 files), `.temp/cli-latest`, `.branches/_current_branch`.
  There is no `roles.sql`, `seed.sql`, `.env` or `.temp/*-version` file.
- No secret or key values appear below. They are written as `<field>` placeholders.

Resolved config values used throughout

| Value | Resolved | Source |
|---|---|---|
| `Config.ProjectId` | `astandsskodun-docker-c1` | `config.toml:2`; validated `pkg/config/config.go:779-784 @ v2.76.10` |
| `Config.Hostname` | `127.0.0.1` (Docker Desktop on Windows uses an npipe daemon host, not `tcp://`) | `internal/utils/config.go:100 @ v2.76.10`, `internal/utils/misc.go:243-251 @ v2.76.10` |
| `Db.Port` | `56422` | `config.toml:10` |
| `Db.MajorVersion` | `17` | `config.toml:12` |
| `Db.Image` | `supabase/postgres:17.6.1.084`. `DockerStart` rewrites it to `public.ecr.aws/supabase/postgres:17.6.1.084` | `pkg/config/templates/Dockerfile:2 @ v2.76.10`, `pkg/config/constants.go:40-58 @ v2.76.10`, `pkg/config/config.go:343 @ v2.76.10`. No override: the switch only covers 13/14/15 (`pkg/config/config.go:620-627 @ v2.76.10`), and `.temp/postgres-version` is absent (`:628-634`). Registry rewrite: `internal/utils/docker.go:186-206,261 @ v2.76.10` |
| `Db.Password` | `<Db.Password>` = NewConfig literal (public CLI default in source). Not settable from TOML (`toml:"-" json:"-"`) | `pkg/config/config.go:344 @ v2.76.10`, `pkg/config/db.go:88 @ v2.76.10` |
| `Db.RootKey.Value` | `<Db.RootKey.Value>` = 64-hex NewConfig literal (public CLI default in source). TOML key `[db] root_key` is unset here and in the embedded template | `pkg/config/config.go:345-347 @ v2.76.10`, `pkg/config/db.go:89 @ v2.76.10` |
| `Db.HealthTimeout` | `2m` (from the embedded default template, which is merged before the project file) | `pkg/config/templates/config.toml:33 @ v2.76.10`, merge order `pkg/config/config.go:467-470,491-500 @ v2.76.10` |
| `Db.Settings` | all fields nil (no `[db.settings]` in project or template) | `pkg/config/db.go:46-70 @ v2.76.10` |
| `Db.Vault` | empty map (template has `[db.vault]` commented out) | `pkg/config/templates/config.toml:50-51 @ v2.76.10` |
| `Db.Migrations.Enabled` | `true` | `config.toml:16` |
| `Db.Seed.Enabled` | `false` | `config.toml:19` |
| `Auth.Enabled` / `Realtime.Enabled` / `Storage.Enabled` | `true` / `false` / `false` | `config.toml:30,22,28` |
| `Auth.JwtExpiry` | `3600` | `config.toml:33` |
| `Auth.JwtSecret.Value` | `<Auth.JwtSecret.Value>`. No `jwt_secret` is set, so `generateAPIKeys` assigns the `defaultJwtSecret` constant (public CLI default in source) | `pkg/config/apikeys.go:17,43-48 @ v2.76.10`, called at `pkg/config/config.go:922 @ v2.76.10` |
| `Auth.SiteUrl` | `http://127.0.0.1:3101` | `config.toml:31` |
| `Api.ExternalUrl` | `http://127.0.0.1:56421` (`api.tls.enabled = false` from the template) | `pkg/config/config.go:603-614 @ v2.76.10`, `pkg/config/templates/config.toml:20-22 @ v2.76.10`, `config.toml:5` |
| `Experimental.OrioleDBVersion` | empty | `pkg/config/templates/config.toml:378-380 @ v2.76.10` (template renders `{{ .Experimental.OrioleDBVersion }}`) |
| `utils.NetId` | `astandsskodun-docker-c1-loopback` (the `--network-id` value, which replaces `supabase_network_<id>`) | `internal/utils/config.go:61-64 @ v2.76.10`, flag `cmd/root.go:241 @ v2.76.10` |
| `utils.DbId` | `supabase_db_astandsskodun-docker-c1` (`"supabase_" + DbAliases[0] + "_" + ProjectId`) | `internal/utils/config.go:36,57-59,65 @ v2.76.10` |

---

## 1. Order of operations (`supabase start`, from the start until the DB is ready and migrations are applied)

| # | Step | Cite |
|---|---|---|
| 0a | Cobra `PersistentPreRunE` runs `LoadProfile`, then `ChangeWorkDir`. The `--workdir` value (viper `WORKDIR`) becomes the cwd, and every later relative path (`supabase/...`) resolves against it | `cmd/root.go:90-103 @ v2.76.10`, `internal/utils/misc.go:176-195 @ v2.76.10` |
| 0b | `flags.ParseDatabaseConfig` is a no-op for `start`, which has no `--db-url`/`--local`/`--linked` flags | `cmd/root.go:115 @ v2.76.10`, `internal/utils/flags/db_url.go:39-58 @ v2.76.10`, `cmd/start.go:55-62 @ v2.76.10` |
| 1 | `start.Run` → `flags.LoadConfig`: `Config.Load` (merges the template, then the project file, then `Validate`), then `UpdateDockerIds` | `internal/start/start.go:50 @ v2.76.10`, `internal/utils/flags/config_path.go:10-15 @ v2.76.10`, `pkg/config/config.go:590-677 @ v2.76.10` |
| 2 | `AssertSupabaseDbIsRunning` = `ContainerInspect(DbId)`. If the container **exists** (running or stopped), start prints "already running", shows status and returns | `internal/start/start.go:53-59 @ v2.76.10`, `internal/utils/misc.go:110-125 @ v2.76.10` |
| 3 | `LoadProjectRef`. It fails because there is no `.temp/project-ref`, so `services.CheckVersions` is skipped | `internal/start/start.go:60-62 @ v2.76.10`, `internal/utils/flags/project_ref.go:54-68 @ v2.76.10` |
| 4 | `dbConfig` = {Host: DbId, Port: 5432, User: postgres, Password: `<Db.Password>`, Database: postgres}. Used by later service containers, not by the DB setup | `internal/start/start.go:65-71 @ v2.76.10` |
| 5 | `run()`: `Auth.ResolveJWKS`, then a compose-based pull of `GetServices()` with `PullPolicyMissing`. The service list is db, kong ("gateway"), postgrest ("api"), gotrue ("auth") | `internal/start/start.go:216-238 @ v2.76.10`, `internal/utils/config.go:102-128 @ v2.76.10` |
| 6 | `StartDatabase(ctx, "", fsys, os.Stderr)` is called because `dbConfig.Host == DbId` | `internal/start/start.go:240-245 @ v2.76.10` |
| 6.1 | Build `NewContainerConfig()` (no args), `NewHostConfig()` and a networking config `{NetId: {Aliases: DbAliases}}` | `internal/db/start/start.go:133-141 @ v2.76.10` |
| 6.2 | `fromBackup == ""`, so the backup entrypoint branch is skipped | `internal/db/start/start.go:142-163 @ v2.76.10` |
| 6.3 | `VolumeInspect(DbId)`. `NoBackupVolume = IsNotFound`. Prints "Starting database..." for a new volume or "Starting database from backup..." for an existing one | `internal/db/start/start.go:164-174 @ v2.76.10` |
| 6.4 | `DockerStart(...)`: image check/pull, labels, network create-if-missing, named-volume create with labels, `ContainerCreate(name=DbId)`, `ContainerStart` (see §2) | `internal/db/start/start.go:175-177 @ v2.76.10`, `internal/utils/docker.go:252-330 @ v2.76.10` |
| 6.5 | `WaitForHealthyService(ctx, Db.HealthTimeout=2m, DbId)` (see §2 "health") | `internal/db/start/start.go:179-181 @ v2.76.10` |
| 6.6 | **Only if `NoBackupVolume`** (fresh volume): `SetupLocalDatabase(ctx, "", ...)`. On an existing volume, steps 6.6.x (init job, migrations) are **skipped** | `internal/db/start/start.go:182-187 @ v2.76.10` |
| 6.6.1 | `ConnectLocalPostgres(ctx, pgconn.Config{})` opens a host-side connection to `127.0.0.1:56422` (see §5) | `internal/db/start/start.go:359-363 @ v2.76.10` |
| 6.6.2 | `SetupDatabase(conn, host=DbId)` → `initSchema` prints "Initialising schema...". PG17 (> 14) goes to `initSchema15(host)` | `internal/db/start/start.go:364,370-373,242-253 @ v2.76.10` |
| 6.6.3 | `initSchema15`: realtime job **skipped** (disabled), storage job **skipped** (disabled), auth job **runs** (`gotrue migrate`, see §4). Jobs run sequentially through `DockerRunJob` | `internal/db/start/start.go:333-356 @ v2.76.10` |
| 6.6.4 | `vault.UpsertVaultSecrets` is a **no-op**: no vault entries, and only entries with non-empty `SHA256` count | `internal/db/start/start.go:374-377 @ v2.76.10`, `pkg/vault/batch.go:25-36 @ v2.76.10` |
| 6.6.5 | `migration.SeedGlobals([supabase/roles.sql])` fails to open the absent file with `os.ErrNotExist`, which is treated as success (**skipped**) | `internal/db/start/start.go:378-382 @ v2.76.10`, `internal/utils/misc.go:88 @ v2.76.10`, `pkg/migration/seed.go:85-99 @ v2.76.10`, `pkg/migration/file.go:51-54 @ v2.76.10` |
| 6.6.6 | `apply.MigrateAndSeed(ctx, "", conn, fsys)`. `EXPERIMENTAL` is false, so `applyMigrationFiles` runs both migrations (see §5). `applySeedFiles` is **skipped** because `db.seed.enabled = false` | `internal/db/start/start.go:367 @ v2.76.10`, `internal/migration/apply/apply.go:16-47 @ v2.76.10` |
| 6.7 | `initCurrentBranch(fsys)`. Runs whether or not the volume was new (see §6) | `internal/db/start/start.go:188,232-240 @ v2.76.10` |
| 7 | (Outside DB scope.) Prints "Starting containers...". Kong, GoTrue and PostgREST are started in that source order. Logflare/vector/inbucket/realtime/storage/imgproxy/edge/studio/pooler are skipped | `internal/start/start.go:252,430,552,959 @ v2.76.10` |
| 8 | Prints "Waiting for health checks..." and waits `serviceTimeout = 30s` for started services. The storage-bucket seeding branch is **skipped** (storage disabled) | `internal/start/start.go:152,1283-1293 @ v2.76.10` |
| 9 | On any `run()` error (unless `--ignore-health-check` and a health-join error): `DockerRemoveAll(ProjectId)` | `internal/start/start.go:72-80 @ v2.76.10`, `internal/utils/docker.go:96-148 @ v2.76.10` |
| 10 | After the command, `checkUpgrade` may write `supabase/.temp/cli-latest` (see §6) | `cmd/root.go:143,155-182 @ v2.76.10` |

Other branches skipped for this config / PG17
- PG ≤ 14 paths: `GlobalsSql` + `InitSchema14` (`internal/db/start/start.go:244-251 @ v2.76.10`), alternate entrypoint (`:104-113`), `Tmpfs` (`:126-128`).
- OrioleDB env (`internal/db/start/start.go:69-77 @ v2.76.10`): OrioleDB version is empty.
- `POSTGRES_INITDB_ARGS=--lc-collate=C.UTF-8` (`internal/db/start/start.go:78-80 @ v2.76.10`): `VersionCompare("17.6.1.084","15.8.1.005") = +1`, not < 0 (`pkg/config/config.go:679-693 @ v2.76.10`).
- Failure cleanup on step 9 prunes volumes only when `NoBackupVolume` is true, meaning the volume was created by this run (`internal/utils/docker.go:127-140 @ v2.76.10`).

---

## 2. Database container

### Identity / image

| Item | Value | Cite |
|---|---|---|
| Container name | `supabase_db_astandsskodun-docker-c1` | `internal/db/start/start.go:175 @ v2.76.10`, `internal/utils/config.go:57-59,65 @ v2.76.10` |
| Image (as created) | `public.ecr.aws/supabase/postgres:17.6.1.084`. The registry can be overridden by the `SUPABASE_INTERNAL_IMAGE_REGISTRY` env var (viper prefix `SUPABASE`) | `internal/utils/docker.go:186-206,261 @ v2.76.10`, `cmd/root.go:230-234 @ v2.76.10` |
| Pull | `DockerPullImageIfNotCached`: `ImageInspect(registry url)`. If not found, pull with 2 retries (2<<(i+1) s back-off) | `internal/utils/docker.go:225-248,254-259 @ v2.76.10` |

### Env (`container.Config.Env`, in this order)

| # | Var | Resolved | Cite |
|---|---|---|---|
| 1 | `POSTGRES_PASSWORD` | `<Db.Password>` (NewConfig default, public CLI default in source) | `internal/db/start/start.go:64 @ v2.76.10`, `pkg/config/config.go:344 @ v2.76.10` |
| 2 | `POSTGRES_HOST` | `/var/run/postgresql` | `internal/db/start/start.go:65 @ v2.76.10` |
| 3 | `JWT_SECRET` | `<Auth.JwtSecret.Value>` (`defaultJwtSecret`, public CLI default in source) | `internal/db/start/start.go:66 @ v2.76.10`, `pkg/config/apikeys.go:44-45 @ v2.76.10` |
| 4 | `JWT_EXP` | `3600` | `internal/db/start/start.go:67 @ v2.76.10`, `config.toml:33` |
| – | `POSTGRES_INITDB_ARGS`, `S3_*` | **not set** (see §1 skipped branches) | `internal/db/start/start.go:69-80 @ v2.76.10` |

### Entrypoint / Cmd (exact construction, PG > 14 branch)

`Entrypoint = ["sh", "-c", S]`; `Cmd` is not set by the CLI (`internal/db/start/start.go:81-103 @ v2.76.10`). `NewContainerConfig()` is called with
no `args` (`internal/db/start/start.go:133 @ v2.76.10`), so `strings.Join(args, " ")` = `""`, which leaves a trailing space after `/etc/postgresql`.

```
S = "\n"
  + "cat <<'EOF' > /etc/postgresql.schema.sql && \\\n"
  + "cat <<'EOF' > /etc/postgresql-custom/pgsodium_root.key && \\\n"
  + "cat <<'EOF' >> /etc/postgresql/postgresql.conf && \\\n"
  + "docker-entrypoint.sh postgres -D /etc/postgresql " + "" + "\n"
  + <schema.sql> + "\n" + <webhook.sql> + "\n" + <_supabase.sql> + "\n"
  + "EOF\n"
  + <Db.RootKey.Value> + "\n"
  + "EOF\n"
  + <Db.Settings.ToPostgresConfig()> + "\n"
  + "EOF"                                   # no trailing newline
```
(Cite: `internal/db/start/start.go:90-102 @ v2.76.10`; template embeds `:32-41`.)

The four lines joined by `\`+newline form one command line with three quoted (`'EOF'`, no expansion) heredocs. They are consumed in order:

| Heredoc | Target | Body (exact) | Bytes | SHA-256 |
|---|---|---|---|---|
| 1 | `> /etc/postgresql.schema.sql` (overwrite) | `schema.sql ‖ "\n" ‖ webhook.sql ‖ "\n" ‖ _supabase.sql ‖ "\n"` | 9525 | `6a733d0e55a1fefdaf87d782d461d8e697289de21133f6cf22d0a3af44b8fbd9` |
| 2 | `> /etc/postgresql-custom/pgsodium_root.key` (overwrite) | `<Db.RootKey.Value> ‖ "\n"` | 65 | `0f0a54e1402112b4e6435af6b243389d3e93898760492b904c9e25d1f467946c` (default key; value not shown) |
| 3 | `>> /etc/postgresql/postgresql.conf` (**append**) | `"\n# supabase [db.settings] configuration\n\n"` | 41 | `71dd74284269253b72d549edc7c0df2d309a63222e53577e1060d383782b3b0d` |
| – | then | `docker-entrypoint.sh postgres -D /etc/postgresql ` (runs only if all three `cat` succeed, `&&`) | | |

- Full `S` (with the default root key): 9851 bytes, SHA-256 `64c86ff67dfba07cb63856cd18922362c81754aaf587bf4c5222ca3946ba38fa`.
  Computed by a local helper script (not committed), which extracts the raw-string pieces from `start.go`. The script asserts that the reconstruction equals the layout above and that no template line equals `EOF`.
- `ToPostgresConfig()` = `pgConfHeader + toml(settings)` with `"`→`'` (`pkg/config/db.go:181-190 @ v2.76.10`). With every settings field nil, the
  BurntSushi encoder writes nothing (`encode.go:526-528 @ BurntSushi/toml v1.6.0`; version from `go.mod:6 @ v2.76.10` and `pkg/go.mod:6 @ v2.76.10`;
  encoder `pkg/config/config.go:1603-1611 @ v2.76.10`). Result: exactly `"\n# supabase [db.settings] configuration\n"`.
- Derived (shell semantics, not CLI code): the entrypoint re-runs on every container (re)start, including `unless-stopped` restarts. `/etc` lives in the container layer, not the volume, so each restart appends another 41-byte block to `postgresql.conf` and rewrites the other two files.

### Healthcheck

| Field | Value | Cite |
|---|---|---|
| Test | `["CMD","pg_isready","-U","postgres","-h","127.0.0.1","-p","5432"]` | `internal/db/start/start.go:84-85 @ v2.76.10` |
| Interval / Timeout / Retries | `10s` / `2s` / `3` | `internal/db/start/start.go:86-88 @ v2.76.10` |
| StartPeriod / StartInterval | not set | same block |

### HostConfig

| Field | Value | Cite |
|---|---|---|
| PortBindings | `{"5432/tcp": [{HostIP: "", HostPort: "56422"}]}`. **HostIP is empty**, so the engine default (all interfaces) applies | `internal/db/start/start.go:118-120 @ v2.76.10` |
| ExposedPorts | **not set by the CLI** (only PortBindings). Any `5432/tcp` exposure comes from the image or engine | `internal/db/start/start.go:81-103 @ v2.76.10` (absent) |
| RestartPolicy | `unless-stopped` | `internal/db/start/start.go:121 @ v2.76.10` |
| Binds | `["supabase_db_astandsskodun-docker-c1:/var/lib/postgresql/data"]` (named volume `DbId`) | `internal/db/start/start.go:122-124 @ v2.76.10` |
| Tmpfs | none (only set for PG ≤ 14) | `internal/db/start/start.go:126-128 @ v2.76.10` |
| ExtraHosts | none on the Windows build (`extraHosts` is nil). The Linux build would add `host.docker.internal:host-gateway` | `internal/utils/docker.go:268 @ v2.76.10`, `internal/utils/docker_windows.go:10 @ v2.76.10`, `internal/utils/docker_linux.go:8 @ v2.76.10` |
| NetworkMode | `astandsskodun-docker-c1-loopback` (from viper `network-id`) | `internal/utils/docker.go:269-273 @ v2.76.10` |
| Not set by CLI | User, Hostname, WorkingDir, ShmSize, Ulimits, CapAdd, SecurityOpt, Init, LogConfig, resource limits, StopSignal/StopTimeout, AutoRemove | `internal/db/start/start.go:62-130 @ v2.76.10`, `internal/utils/docker.go:252-310 @ v2.76.10` (absent) |

### Network, aliases, labels, volume

| Item | Value | Cite |
|---|---|---|
| EndpointsConfig | key `utils.NetId` = `astandsskodun-docker-c1-loopback` → `Aliases: ["db","db.supabase.internal"]` | `internal/db/start/start.go:135-141 @ v2.76.10`, `internal/utils/config.go:36,62 @ v2.76.10` |
| Network creation | `NetworkCreate(name, {Labels: config.Labels})` only when the mode is user-defined. `Conflict`/exists errors are ignored, so the pre-created D1 network is reused unchanged. No driver or options are passed | `internal/utils/docker.go:63-77,274-276 @ v2.76.10`, `internal/utils/docker_windows.go:12-15 @ v2.76.10` |
| Container labels | `com.supabase.cli.project=astandsskodun-docker-c1`, `com.docker.compose.project=astandsskodun-docker-c1`. These are the only labels: `NewContainerConfig` sets none | `internal/utils/docker.go:58-60,262-266 @ v2.76.10` |
| Volume creation | Each named-volume source in Binds (parsed by compose `loader.ParseVolume`, type `volume`) is created explicitly with `VolumeCreate{Name: "supabase_db_astandsskodun-docker-c1", Labels: <same two labels>}`. Binds stay unchanged. Skipped only when `BITBUCKET_CLONE_DIR` is set | `internal/utils/docker.go:277-306 @ v2.76.10` |
| Create/start | `ContainerCreate(&config, &hostConfig, &networkingConfig, nil, "supabase_db_astandsskodun-docker-c1")` then `ContainerStart`. A port-bind error adds a suggestion only | `internal/utils/docker.go:307-329 @ v2.76.10` |

### Health wait

| Item | Value | Cite |
|---|---|---|
| Timeout | `Db.HealthTimeout` = `2m` | `internal/db/start/start.go:179 @ v2.76.10`, `pkg/config/templates/config.toml:33 @ v2.76.10` |
| Policy | constant 1 s back-off, `WithMaxRetries(uint64(timeout.Seconds()))` = 120 retries (≈121 probes), context-bound | `internal/db/start/start.go:191-197,212-213 @ v2.76.10` |
| Probe | `status.IsServiceReady(DbId)` → `assertContainerHealthy`: `ContainerInspect`. The container must be `Running` and, if a health block exists, `Health.Status == "healthy"` | `internal/db/start/start.go:199-211 @ v2.76.10`, `internal/status/status.go:141-161 @ v2.76.10` |
| On failure | Prints `<id> container logs:` and streams logs once to stderr. The error propagates (fromBackup is empty) | `internal/db/start/start.go:214-222,179-181 @ v2.76.10` |

---

## 3. Embedded SQL templates (exact bytes @ v2.76.10)

Command used for each file `<f>`:
`gh api -H "Accept: application/vnd.github.raw" "repos/supabase/cli/contents/internal/db/start/templates/<f>?ref=v2.76.10" > file && sha256sum file && git hash-object file`.
The blob SHA matches the v2.76.10 tree entry. Files are LF-only ASCII and each ends with `\n`.

| File | Bytes | Git blob | SHA-256 | Description |
|---|---|---|---|---|
| `internal/db/start/templates/schema.sql` | 702 | `dee166ae58a4b1f77b650d8e72f8a249e5918ce5` | `3a9f39fb79d67d4fb2f5e54638dca1d06894a3e1a57419bc188e4ee09c72556f` | psql script. It reads `$PGPASSWORD`/`$JWT_SECRET`/`$JWT_EXP` with `\set` backticks, sets the database-level `app.settings.jwt_secret`/`jwt_exp` on `postgres`, sets the password of postgres, authenticator, pgbouncer, supabase_auth_admin, supabase_storage_admin, supabase_replication_admin and supabase_read_only_user to the DB password, and creates schema `_realtime` owned by postgres (`schema.sql:1-17 @ v2.76.10`) |
| `internal/db/start/templates/webhook.sql` | 8399 | `52cd0974730ae10f04cc50d5915c167cbe1b064c` | `aa956b7b1f205284a524882fe0d580c72d86374aea9c9c2e93ac398df5e07d0b` | One `BEGIN…COMMIT`. It creates `pg_net` in `extensions`, schema `supabase_functions` (tables `migrations` and `hooks`, trigger fn `http_request()`) and role `supabase_functions_admin` if missing. It drops the legacy `supabase_pg_net_admin`, adds pg_net grants and fn `extensions.grant_pg_net_access()` with event trigger `issue_pg_net_access`, and records versions `initial` and `20210809183423_update_grants` (`webhook.sql:1-232 @ v2.76.10`) |
| `internal/db/start/templates/_supabase.sql` | 421 | `6e5d8487bad85c83a9ebdf18629bdbf9996c376c` | `ced0d2dd073c86f402e409ff540ecda07455997e6a0a1e8a738c154c6b962a20` | Creates database `_supabase` owned by postgres and, inside it (`\c _supabase`), schemas `_analytics` and `_supavisor` owned by postgres, then `\c postgres` (`_supabase.sql:1-13 @ v2.76.10`) |

All three are written into `/etc/postgresql.schema.sql` by the container entrypoint (§2). The CLI does not execute them itself. They contain psql meta-commands (`\set`, `\c`), so something inside the image must run them through `psql`. See UNRESOLVED.
(`restore.sh` is embedded too, but only used for `--from-backup`: `internal/db/start/start.go:39-40,142-163 @ v2.76.10`.)

---

## 4. `gotrue migrate` init job

| Item | Value | Cite |
|---|---|---|
| Trigger | `Auth.Enabled` is true, it is the only job in `initJobs`, and it runs after the DB is healthy and the host connection is open | `internal/db/start/start.go:346-348 @ v2.76.10` |
| Image | `Config.Auth.Image` = `supabase/gotrue:v2.186.0`, which `DockerStart` rewrites to `public.ecr.aws/supabase/gotrue:v2.186.0`. There is no `.temp/gotrue-version` override | `internal/db/start/start.go:320 @ v2.76.10`, `pkg/config/templates/Dockerfile:13 @ v2.76.10`, `pkg/config/config.go:380,638-640 @ v2.76.10`, `internal/utils/docker.go:261 @ v2.76.10` |
| Env 1 | `API_EXTERNAL_URL=http://127.0.0.1:56421` | `internal/db/start/start.go:322 @ v2.76.10`, `pkg/config/config.go:603-614 @ v2.76.10` |
| Env 2 | `GOTRUE_LOG_LEVEL=error` | `internal/db/start/start.go:323 @ v2.76.10` |
| Env 3 | `GOTRUE_DB_DRIVER=postgres` | `internal/db/start/start.go:324 @ v2.76.10` |
| Env 4 | `GOTRUE_DB_DATABASE_URL=postgresql://supabase_auth_admin:<Db.Password>@supabase_db_astandsskodun-docker-c1:5432/postgres`. The host is `utils.DbId`, passed down from `SetupLocalDatabase`. The password is inserted raw with `fmt.Sprintf` (not URL-escaped) | `internal/db/start/start.go:325,364 @ v2.76.10` |
| Env 5 | `GOTRUE_SITE_URL=http://127.0.0.1:3101` | `internal/db/start/start.go:326 @ v2.76.10`, `config.toml:31` |
| Env 6 | `GOTRUE_JWT_SECRET=<Auth.JwtSecret.Value>` (public CLI default in source) | `internal/db/start/start.go:327 @ v2.76.10` |
| Cmd | `["gotrue","migrate"]`. Entrypoint is not overridden, so the image entrypoint applies | `internal/db/start/start.go:329 @ v2.76.10` |
| Runner | `DockerRunJob` → `DockerRunOnceWithStream` → `DockerRunOnceWithConfig(container.Config{Image,Env,Cmd}, HostConfig{}, NetworkingConfig{}, name "")` | `internal/utils/docker.go:347-377 @ v2.76.10` |
| Container name | `""`, so Docker auto-generates a name | `internal/utils/docker.go:364 @ v2.76.10` |
| Network | NetworkMode `astandsskodun-docker-c1-loopback` (via `DockerStart`); no aliases, no port bindings, no restart policy, no binds | `internal/utils/docker.go:269-273 @ v2.76.10` |
| Labels | `com.supabase.cli.project` and `com.docker.compose.project`, both `astandsskodun-docker-c1` | `internal/utils/docker.go:262-266 @ v2.76.10` |
| Auto-remove | **No** Docker `AutoRemove`. The comment says the exit code must be inspected and cancellation handled. Removal is `defer DockerRemove(id)` → `ContainerRemove{Force:true, RemoveVolumes:true}` on `context.Background()` | `internal/utils/docker.go:368-375,332-339 @ v2.76.10` |
| Wait | `DockerStreamLogs` with `Follow:true` blocks until the log stream ends (container exit). Then `ContainerInspect` reads the exit code | `internal/utils/docker.go:381-403 @ v2.76.10` |
| Fail | exit 0 → ok. 137 → `error running container: exit 137`. Any other code N → `error running container: exit N`. The error aborts `initSchema15`, which aborts StartDatabase and leads to `DockerRemoveAll` | `internal/utils/docker.go:404-412 @ v2.76.10`, `internal/db/start/start.go:350-354 @ v2.76.10`, `internal/start/start.go:72-80 @ v2.76.10` |
| Output | stdout → `io.Discard`. stderr → debug logger (stderr only with `--debug`/`SUPABASE_DEBUG`, otherwise discarded) | `internal/db/start/start.go:349-351 @ v2.76.10`, `internal/utils/logger.go:10-15 @ v2.76.10` |

---

## 5. Migration application

### Connection (`ConnectLocalPostgres(ctx, pgconn.Config{})`)

| Param | Value | Cite |
|---|---|---|
| Host | `Config.Hostname` = `127.0.0.1` (host-published port, **not** the container network) | `internal/utils/connect.go:128-130 @ v2.76.10` |
| Port | `Config.Db.Port` = `56422` | `internal/utils/connect.go:131-133 @ v2.76.10` |
| User / Password / Database | `postgres` / `<Db.Password>` / `postgres` | `internal/utils/connect.go:134-142 @ v2.76.10` |
| ConnectTimeout | 2 s, giving URL `postgresql://postgres:<pw>@127.0.0.1:56422/postgres?connect_timeout=2` (`url.UserPassword` escaping) | `internal/utils/connect.go:143-145,23-45 @ v2.76.10` |
| TLS | `TLSConfig = nil` (plaintext) | `internal/utils/connect.go:146-149 @ v2.76.10` |
| Driver | `pgx.ParseConfig` + `ConnectConfig` (pgx v4.18.3 / pgconn v1.14.3). Notices print to stderr except a few "already exists" notices. **No retry** on connect | `pkg/pgxv5/connect.go:15-42 @ v2.76.10`, `go.mod:35,38 @ v2.76.10` |
| Session reuse | One connection, used for vault, roles, migration table and every migration file | `internal/db/start/start.go:359-367 @ v2.76.10` |

### File discovery / ordering
- `applyMigrationFiles` returns early only if `db.migrations.enabled` is false (it is true here). `list.LoadPartialMigrations("")` → `ListLocalMigrations("supabase/migrations", filter v<=""→all)`
  (`internal/migration/apply/apply.go:27-36 @ v2.76.10`, `internal/migration/list/list.go:82-87 @ v2.76.10`, `internal/utils/misc.go:82 @ v2.76.10`).
- Directories are skipped. A first file `<ts>_init.sql` with ts < 20211209000000 would be skipped (not applicable). Files must match `^([0-9]+)_(.*)\.sql$`, and order follows `fs.ReadDir` (sorted by filename)
  (`pkg/migration/list.go:33-77 @ v2.76.10`, `pkg/migration/file.go:30 @ v2.76.10`).
- This path does no history comparison. All local files are applied, which is correct only because it runs only on a fresh volume (§1 6.6).
- For this project: `20261024000100_c1_owner_inspections.sql` (5703 B, sha256 `6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8`) and
  `20261027000100_c1_hosted_acl_hardening.sql` (551 B, sha256 `6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62`). Both are LF and ASCII-only, with no transaction-control statements.

### `CreateMigrationTable` (once, before the first file, if any files are pending)

One `pgconn.Batch`. Statements are executed in order with no parameters, in one implicit transaction (single Sync)
(`pkg/migration/apply.go:57-61 @ v2.76.10`, `pkg/migration/history.go:31-44 @ v2.76.10`):

1. `SET lock_timeout = '4s'` (`pkg/migration/history.go:13 @ v2.76.10`)
2. `CREATE SCHEMA IF NOT EXISTS supabase_migrations` (`:14`)
3. `CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text NOT NULL PRIMARY KEY)` (`:15`)
4. `ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS statements text[]` (`:16`)
5. `ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS name text` (`:17`)

Final column order is `version text NOT NULL PRIMARY KEY, statements text[], name text`. There are no other columns. `seed_files` is **not** created because `SeedData` with zero pending seeds is never reached (`pkg/migration/seed.go:65-70 @ v2.76.10`, `internal/migration/apply/apply.go:38-41 @ v2.76.10`).

### Per-file loop (`ApplyMigrations`)

| Step | Detail | Cite |
|---|---|---|
| a | stderr `Applying migration <filename>...` | `pkg/migration/apply.go:63-64 @ v2.76.10` |
| b | `conn.Exec(ctx, "RESET ALL")`. Runs before **every** file, on its own (outside the batch) | `pkg/migration/apply.go:65-69 @ v2.76.10` |
| c | `NewMigrationFromFile`: `parser.SplitAndTrim`, `Version` = regex group 1, `Name` = group 2 | `pkg/migration/file.go:34-48 @ v2.76.10` |
| d | `ExecBatch`: one `pgconn.Batch`. Each statement → `ExecParams(stmt, nil, nil, nil, nil)` (extended protocol, unnamed statement, no cache) | `pkg/migration/file.go:75-80 @ v2.76.10` |
| e | Same batch, appended last: `INSERT INTO supabase_migrations.schema_migrations(version, name, statements) VALUES($1, $2, $3)` | `pkg/migration/file.go:81-86,149-176 @ v2.76.10`, `pkg/migration/history.go:18 @ v2.76.10` |
| e' | Params: `$1` version (OID 25 text, text fmt), `$2` name (text, text fmt), `$3` statements (`text[]` OID 1009). `$3` is binary-encoded unless `PreferSimpleProtocol`, which is not set, so binary | `pkg/migration/file.go:149-174 @ v2.76.10` |
| f | `conn.PgConn().ExecBatch(...).ReadAll()`. pgconn appends one `Sync`, so all statements plus the history INSERT form **one implicit transaction**. Any error rolls back the file and its history row | `pkg/migration/file.go:87-88 @ v2.76.10`, `pgconn.go:1764-1799 @ jackc/pgconn v1.14.3` (`ExecParams` = Parse + ExecPrepared: `pgconn.go:1730-1740 @ jackc/pgconn v1.14.3`) |
| g | Error text: `<pg error>`, optional Detail, hint for 42704 unqualified types, then `At statement: <i>` and the failing statement with a caret | `pkg/migration/file.go:88-113 @ v2.76.10` |

The history rows that result for this project are `('20261024000100','c1_owner_inspections', <16 stmts>)` and `('20261027000100','c1_hosted_acl_hardening', <3 stmts>)`.

### Statement splitting (`pkg/parser`)
- `SplitAndTrim` = `Split` with `TrimRight(tok, ";")` followed by `TrimSpace`. Empty tokens are dropped. Comments are **kept** inside statements (`pkg/parser/token.go:81-119 @ v2.76.10`).
- The FSM splits on `;` only in Ready state. It understands `--` line comments, nested `/* */`, `'…'`/`"…"` with doubled-quote escape, `$tag$…$tag$`, and `\` escape (consumes the next char).
  `(`…`)` and `BEGIN ATOMIC … END` (case-insensitive window match) suppress splitting. Any text left at EOF becomes the final statement (`pkg/parser/state.go:24-184 @ v2.76.10`, `pkg/parser/token.go:21-70 @ v2.76.10`).
- Scanner buffer: start 4096 B, max `MaxScannerCapacity` = 256 KiB, raised to the file size when larger unless `SUPABASE_SCANNER_BUFFER_SIZE` is set (`pkg/parser/token.go:15-19,86-91 @ v2.76.10`, `pkg/migration/file.go:56-63 @ v2.76.10`).
- Quirk to replicate: `ScanToken` advances one **byte** at a time (the outer `width` is shadowed), so non-ASCII bytes after the first byte of a rune decode as U+FFFD (`pkg/parser/token.go:53-55 @ v2.76.10`). This project's migrations are ASCII-only.
- Reference output: a local Python port of the splitter (not committed) passes all 24 cases in `pkg/parser/state_test.go @ v2.76.10` and the `testdata/all.sql` ↔ `split_00..17` vector. It splits the project files into **16** and **3** statements.
  SHA-256 of Python `json.dumps(statements, ensure_ascii=False)`: `38ef149d205794473ecd9ba15807947ce0af1da0248c249e3fc4026d2df27d58` and `266fcf00de81835523a9cda70c2a7de7c01e7cc090b13a18e6e953ed256d2414`.

### lock_timeout / session state
- `SET lock_timeout = '4s'` applies only to the `CreateMigrationTable` batch. The source comment claims it resets when the implicit transaction ends (`pkg/migration/history.go:32-33 @ v2.76.10`).
  Under PostgreSQL semantics a non-LOCAL `SET` survives commit. Either way, `RESET ALL` before each file (`pkg/migration/apply.go:67 @ v2.76.10`) restores the default, so **migration files run with the server/role/db default lock_timeout**. The CLI sets no statement_timeout.

---

## 6. Other DB-side effects after start

| Effect | Detail | Cite |
|---|---|---|
| `supabase/.branches/_current_branch` | Created only if absent. Content `main` (4 bytes, no newline), file mode 0644, parent dirs 0755. Runs after the health wait, even when the volume already existed. The path is relative to the cwd (= `--workdir`). Observed in the worktree: `main` | `internal/db/start/start.go:188,232-240 @ v2.76.10`, `internal/utils/misc.go:79,206-226 @ v2.76.10` |
| `supabase/.temp/cli-latest` | Not DB-specific. Written after the command by `checkUpgrade` when the file is missing or older than 10 h and `supabase/` exists. Content = latest release tag, or empty when offline. Observed: `v3.0.0` | `cmd/root.go:143,155-182 @ v2.76.10`, `internal/utils/misc.go:77 @ v2.76.10` |
| Other `.temp` files | None written in the start path files reviewed. `.temp/*-version` and `.temp/pooler-url` are only read (`pkg/config/config.go:600-668 @ v2.76.10`). `.temp/profile` is read before the workdir change (`internal/utils/profile.go:124 @ v2.76.10`) | as cited |
| stderr messages (DB) | `Starting database...` / `Starting database from backup...`, `Initialising schema...`, `Applying migration <f>...` | `internal/db/start/start.go:168,173,243 @ v2.76.10`, `pkg/migration/apply.go:64 @ v2.76.10` |
| Failure cleanup | `DockerRemoveAll(ProjectId)`: stop running containers labelled `com.supabase.cli.project=<id>`, `ContainersPrune`, `VolumesPrune` with `all=true` only if `NoBackupVolume` (API ≥ 1.42), `NetworksPrune` with the same label filter (a pre-created network without that label is not pruned) | `internal/utils/docker.go:96-159 @ v2.76.10` |

---

## UNRESOLVED / caveats

1. **Image-internal init: mostly RESOLVED (2026-11-03)** from `supabase/postgres` at tag `17.6.1.084` (commit `f183a83f`):
   - `Dockerfile-17:157` copies `migrations/db` into `/docker-entrypoint-initdb.d/`, so `migrate.sh` runs once, on an empty data directory.
   - `migrations/db/migrate.sh:17-19` exports `PGHOST=${POSTGRES_HOST}` (here the unix socket `/var/run/postgresql`) and `PGPASSWORD=${POSTGRES_PASSWORD}`. That is where `schema.sql`'s `\set pgpass` gets its value.
   - `migrate.sh:65-68` runs `/etc/postgresql.schema.sql` as `supabase_admin` with `psql -v ON_ERROR_STOP=1` after the image's own init scripts and dbmate migrations.
   - `Dockerfile-17:135,147-148` sets `pgsodium.getkey_script`/`vault.getkey_script` to `/usr/lib/postgresql/bin/pgsodium_getkey.sh` (from `pgsodium_getkey_urandom.sh.j2`), which is what reads `/etc/postgresql-custom/pgsodium_root.key`. The script body was not read.
   - Still open: whether `pg_isready -h 127.0.0.1` can report ready during the initdb phase (the temporary initdb server normally listens on the socket only).
2. **Engine semantics, not CLI code:**
   - empty `HostIP` means all interfaces.
   - with `Entrypoint` set and `Cmd` unset, the image `CMD` is not applied.
   - `ExposedPorts` come from the image `EXPOSE`.
   - the first health probe runs after `Interval` (10 s).
   - `VolumeCreate` on an existing volume does not update its labels.
3. **Shell semantics:** it is not verified whether `/bin/sh` in the image `exec`s `docker-entrypoint.sh` (the last command of an `&&` list) or stays as PID 1. This matters for signal handling.
4. **Env overrides assumed absent:** viper reads `SUPABASE_*` env vars (`pkg/config/config.go:461-466 @ v2.76.10`, `cmd/root.go:230-234 @ v2.76.10`), and `loadNestedEnv` reads `supabase/.env*` files (`pkg/config/config.go:593 @ v2.76.10`).
   I did not verify whether `ExperimentalBindStruct` env binding covers keys absent from TOML (for example `SUPABASE_DB_ROOT_KEY`, `SUPABASE_AUTH_JWT_SECRET`).
5. **Experimental flag:** if `--experimental` or `SUPABASE_EXPERIMENTAL` were set, `MigrateAndSeed` would apply `schema_paths` (empty) **instead of** migrations, so no migrations would run (`internal/migration/apply/apply.go:17-20 @ v2.76.10`).
6. **Statement split counts and hashes:** these come from a Python port validated against the CLI's own test vectors, not from running the Go code.
7. **lock_timeout persistence:** the note in §5 relies on PostgreSQL `SET` semantics and contradicts the source comment. Also from PostgreSQL semantics (not verified here): `RESET ALL` does not reset `role`/`session_authorization`, so a `SET ROLE` inside one migration file would carry into the next.
8. **`Db.Password` assignments:** I did not grep the whole repo for other assignments. `Db.Password` is `toml:"-"`/`json:"-"`, and no override appears in the files read.
9. **Platform:** this assumes the Windows build, which has no `ExtraHosts`. The Linux build adds `host.docker.internal:host-gateway` to every container, including the gotrue job.
10. **Pre-existing volume:** if the volume `supabase_db_astandsskodun-docker-c1` already exists, the CLI skips the init job and migrations entirely. Only the container start, health wait and `_current_branch` steps happen.
