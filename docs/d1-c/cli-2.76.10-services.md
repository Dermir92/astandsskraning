# Parity inventory: Kong, GoTrue, PostgREST and keys (Supabase CLI v2.76.10)

Scope: what `supabase --workdir <worktree> --network-id astandsskodun-docker-c1-loopback start` creates for **Kong, GoTrue (auth) and PostgREST (rest)**, resolved against `astandsskodun-docker-local/supabase/config.toml`, plus how the keys are made and how health is awaited. All work was read-only. No docker command was run and the `supabase` binary was not run.

**Source provenance.** Every CLI file cited here was fetched with `gh api -H "Accept: application/vnd.github.raw" repos/supabase/cli/contents/<path>?ref=v2.76.10`. Each file's `git hash-object` was then checked against the blob SHA in `git/trees/v2.76.10?recursive=1`, and all 31 files matched. The verified copies are kept in a local working copy (not committed). Citations take the form `path:line @ v2.76.10`. Project config citations take the form `config.toml:L` and refer to `C:/Users/Danni/Desktop/Repos/astandsskodun-docker-local/supabase/config.toml`. Citations of the CLI's embedded default config take the form `tmpl:L` and refer to `pkg/config/templates/config.toml:L @ v2.76.10`.

**Secret handling.** This file contains no secret values. Where a value is a secret, it shows the config field, how the value is derived and its SHA-256, and marks public CLI defaults as "(public CLI default in source)". The derivations were reproduced with a local helper script (not committed) that prints only hashes and redacted shapes.

---

## 0. Resolution context (applies to all three services)

| Item | Resolved value | Source |
|---|---|---|
| Config load order | Defaults come from the embedded `config.toml`, rendered with `NewConfig()` values through `Eject`. The project `config.toml` is then deep-merged over them through viper. `SUPABASE_*` env vars can override any key through `AutomaticEnv`. | `pkg/config/config.go:460-500 @ v2.76.10` |
| Env overrides actually present | None expected. `scripts/d1-local.mjs:39-44` (`cleanEnvironment`) passes only PATH-type variables plus `DOCKER_CONTEXT=desktop-linux`. The worktree has no `.env*` files (directory listing). | project file; `pkg/config/config.go:987-1025 @ v2.76.10` |
| `project_id` | `astandsskodun-docker-c1` | `config.toml:2` |
| `Hostname` | `127.0.0.1`. `GetHostname()` returns the DOCKER_HOST host only when the daemon scheme is `tcp`, and returns `127.0.0.1` otherwise. The `desktop-linux` context on Windows is an npipe endpoint (inferred, see UNRESOLVED). | `internal/utils/misc.go:243-251`, `internal/utils/config.go:100 @ v2.76.10` |
| `api.external_url` | `http://127.0.0.1:56421`. Built from Hostname and `api.port` with scheme `http` because `api.tls.enabled=false` (`tmpl:22`). | `pkg/config/config.go:603-614 @ v2.76.10`; `config.toml:5` |
| `auth.jwt_issuer` | `http://127.0.0.1:56421/auth/v1`. It is not set in either toml (`tmpl:160` is commented out). | `pkg/config/config.go:616-618 @ v2.76.10` |
| Image version overrides | None. Only `supabase/.temp/cli-latest` exists, and no `rest-version` or `gotrue-version` file. | `pkg/config/config.go:628-641`, `pkg/config/utils.go:56-58 @ v2.76.10` |
| Image registry | `public.ecr.aws`, rewritten to `public.ecr.aws/supabase/<last path segment>`. This assumes `INTERNAL_IMAGE_REGISTRY` is unset. | `internal/utils/docker.go:187-206 @ v2.76.10` |
| Network | `--network-id` sets both `NetId` and `HostConfig.NetworkMode` to `astandsskodun-docker-c1-loopback`. If the network is missing, it is created with the two project labels. A conflict (network already exists) is ignored. | `internal/utils/config.go:61-64`, `internal/utils/docker.go:63-77,269-276 @ v2.76.10` |
| Labels on every container (generic `DockerStart`) | `com.supabase.cli.project=astandsskodun-docker-c1` and `com.docker.compose.project=astandsskodun-docker-c1` | `internal/utils/docker.go:59-60,262-266 @ v2.76.10` |
| ExtraHosts | None on Windows. Linux would add `host.docker.internal:host-gateway`. | `internal/utils/docker_windows.go:10`, `internal/utils/docker_linux.go:8 @ v2.76.10` |
| Container naming | `supabase_<alias[0]>_<project_id>` | `internal/utils/config.go:57-59,61-80 @ v2.76.10` |
| `dbConfig` used in service DB URLs | Host = `supabase_db_astandsskodun-docker-c1` (container name, resolved on the user network). Port = `5432` (the container port, **not** `db.port` 56422). User = `postgres`. Password = `utils.Config.Db.Password`, which has toml/json tag `-` and so is the CLI default `config.go:344` (public CLI default in source; written below as `<db.password>`). Database = `postgres`. | `internal/start/start.go:65-71`, `pkg/config/db.go:88`, `pkg/config/config.go:344 @ v2.76.10` |
| Other `Config`/`HostConfig` fields | Not set by the CLI, so they keep zero or default values: no Hostname, User, WorkingDir, Tmpfs, LogConfig, Init, SecurityOpt or StopSignal for these three containers. The one exception is the Logflare Hostname, which belongs to a service that is not started here. | `internal/start/start.go:490-544,818-845,960-986 @ v2.76.10` |

Startup order: compose-pull of the db, gateway(kong), api(postgrest) and auth images (`start.go:232-238`, `utils/config.go:102-128`). Then the DB starts and is awaited (`start.go:241-245`). Then **Kong** (`start.go:429-549`), **GoTrue** (`start.go:551-849`) and **PostgREST** (`start.go:958-990`) start in that order. Finally the CLI waits on `started=[kong, auth, rest]` (`start.go:1283-1293`) @ v2.76.10.

---

## 1. Containers

### 1a. Kong (`supabase_kong_astandsskodun-docker-c1`)

| Field | Value (resolved) | Source |
|---|---|---|
| Start condition | `!isContainerExcluded(KongImage)`. This is **not** gated on `api.enabled`. | `internal/start/start.go:430 @ v2.76.10` |
| Container name | `supabase_kong_astandsskodun-docker-c1` | `internal/utils/config.go:37,66`; `internal/start/start.go:544 @ v2.76.10` |
| Image | `public.ecr.aws/supabase/kong:2.8.1`, from `FROM library/kong:2.8.1 AS kong` | `pkg/config/templates/Dockerfile:4`, `pkg/config/config.go:336`, `internal/utils/docker.go:261 @ v2.76.10` |
| Env | `KONG_DATABASE=off` | `internal/start/start.go:495 @ v2.76.10` |
| | `KONG_DECLARATIVE_CONFIG=/home/kong/kong.yml` | `:496` |
| | `KONG_DNS_ORDER=LAST,A,CNAME` | `:497` |
| | `KONG_PLUGINS=request-transformer,cors` | `:498` |
| | `KONG_PORT_MAPS=56421:8000` (`%d:8000` with `api.port`) | `:499`; `config.toml:5` |
| | `KONG_NGINX_PROXY_PROXY_BUFFER_SIZE=160k` | `:503` |
| | `KONG_NGINX_PROXY_PROXY_BUFFERS=64 160k` | `:504` |
| | `KONG_NGINX_WORKER_PROCESSES=1` | `:505` |
| | `KONG_SSL_CERT=/home/kong/localhost.crt` | `:507` |
| | `KONG_SSL_CERT_KEY=/home/kong/localhost.key` | `:508` |
| Entrypoint | `["sh","-c",<script>]`. The script chains four `cat <<'EOF' > file` heredocs and then runs `./docker-entrypoint.sh kong docker-start --nginx-conf /home/kong/custom_nginx.template`. The heredoc bodies in order are: rendered kong.yml → `/home/kong/kong.yml`, `nginxConfigEmbed` → `/home/kong/custom_nginx.template`, `Api.Tls.CertContent` → `/home/kong/localhost.crt`, `Api.Tls.KeyContent` → `/home/kong/localhost.key`. Script size is 21230 bytes and its SHA-256 is `017fffeb9a684bf8822c94bab7ac5cfa0c74017d212a7d6b9be77ac2bfddb691`. That hash holds only with default keys; the script embeds secrets. | `internal/start/start.go:510-523 @ v2.76.10` |
| Cmd | Not set. Because Entrypoint is set, Docker does not inherit the image CMD (daemon merge rule, not CLI code). | `internal/start/start.go:492-529 @ v2.76.10` |
| Healthcheck | **None set by the CLI.** The upstream image declares `HEALTHCHECK --interval=10s --timeout=10s --retries=10 CMD kong health` (`Kong/docker-kong` `alpine/Dockerfile:66 @ tag 2.8.1`). Whether the ECR mirror keeps it is UNRESOLVED. | `internal/start/start.go:492-529 @ v2.76.10` |
| ExposedPorts | `8000/tcp`, `8443/tcp`, `8088/tcp` (`nginxTemplateServerPort`) | `internal/start/start.go:524-528,113 @ v2.76.10` |
| PortBindings | `{"8000/tcp":[{"HostIp":"","HostPort":"56421"}]}`. `dockerPort` is 8000 because TLS is disabled; it would be 8443 with TLS. The **empty HostIp is the source of the 0.0.0.0 publish.** | `internal/start/start.go:486-489,532-534 @ v2.76.10` |
| RestartPolicy | `unless-stopped` | `internal/start/start.go:535 @ v2.76.10` |
| Binds | `[]` (empty). The only binds possible are email-template `content_path` files, mounted at `/home/kong/templates/email/<id><ext>:rw`, and none are configured. | `internal/start/start.go:469-484 @ v2.76.10` |
| Network / aliases | `astandsskodun-docker-c1-loopback`, aliases `["kong","api.supabase.internal"]` | `internal/start/start.go:537-543`, `internal/utils/config.go:37 @ v2.76.10` |
| Labels | The two project labels from §0 | `internal/utils/docker.go:262-266 @ v2.76.10` |

### 1b. GoTrue (`supabase_auth_astandsskodun-docker-c1`)

| Field | Value (resolved) | Source |
|---|---|---|
| Start condition | `auth.enabled && !excluded`. `auth.enabled=true` | `internal/start/start.go:552 @ v2.76.10`; `config.toml:30` |
| Container name | `supabase_auth_astandsskodun-docker-c1` | `internal/utils/config.go:38,67 @ v2.76.10` |
| Image | `public.ecr.aws/supabase/gotrue:v2.186.0` | `pkg/config/templates/Dockerfile:13`, `pkg/config/config.go:380 @ v2.76.10` |
| Entrypoint / Cmd | Not set. The image defaults apply. | `internal/start/start.go:819-833 @ v2.76.10` |
| Healthcheck | `["CMD","wget","--no-verbose","--tries=1","--spider","http://127.0.0.1:9999/health"]`, Interval 10s, Timeout 2s, Retries 3. No StartPeriod. | `internal/start/start.go:824-832 @ v2.76.10` |
| ExposedPorts | `9999/tcp` | `internal/start/start.go:823 @ v2.76.10` |
| PortBindings | **None** | `internal/start/start.go:834-836 @ v2.76.10` |
| RestartPolicy | `unless-stopped` | `internal/start/start.go:835 @ v2.76.10` |
| Binds | None | `internal/start/start.go:834-836 @ v2.76.10` |
| Network / aliases | `astandsskodun-docker-c1-loopback`, aliases `["auth"]` | `internal/start/start.go:837-843`, `internal/utils/config.go:38 @ v2.76.10` |

**GoTrue env, in emission order** (all `internal/start/start.go @ v2.76.10`, line given per row):

| # | Var | Value for this config | Line | Value source |
|---|---|---|---|---|
| 1 | API_EXTERNAL_URL | `http://127.0.0.1:56421` (no `/auth/v1`) | 559 | §0 |
| 2 | GOTRUE_API_HOST | `0.0.0.0` | 561 | literal |
| 3 | GOTRUE_API_PORT | `9999` | 562 | literal |
| 4 | GOTRUE_DB_DRIVER | `postgres` | 564 | literal |
| 5 | GOTRUE_DB_DATABASE_URL | `postgresql://supabase_auth_admin:<db.password>@supabase_db_astandsskodun-docker-c1:5432/postgres` | 565 | §0 dbConfig |
| 6 | GOTRUE_SITE_URL | `http://127.0.0.1:3101` | 567 | `config.toml:31` |
| 7 | GOTRUE_URI_ALLOW_LIST | `` (empty, from `strings.Join([],",")`) | 568 | `config.toml:32` overrides `tmpl:156` |
| 8 | GOTRUE_DISABLE_SIGNUP | `true` (`!enable_signup`) | 569 | `config.toml:36` |
| 9 | GOTRUE_JWT_ADMIN_ROLES | `service_role` | 571 | literal |
| 10 | GOTRUE_JWT_AUD | `authenticated` | 572 | literal |
| 11 | GOTRUE_JWT_DEFAULT_GROUP_NAME | `authenticated` | 573 | literal |
| 12 | GOTRUE_JWT_EXP | `3600` | 574 | `config.toml:33` |
| 13 | GOTRUE_JWT_SECRET | `<auth.jwt_secret>`, the 55-char default (public CLI default in source), sha256 `a064b502…cb37` | 575 | §3 |
| 14 | GOTRUE_JWT_ISSUER | `http://127.0.0.1:56421/auth/v1` | 576 | §0 |
| 15 | GOTRUE_EXTERNAL_EMAIL_ENABLED | `true` | 578 | `config.toml:42` |
| 16 | GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED | `true` | 579 | `tmpl:207` double_confirm_changes |
| 17 | GOTRUE_MAILER_AUTOCONFIRM | `true` (`!enable_confirmations`) | 580 | `config.toml:43` |
| 18 | GOTRUE_MAILER_OTP_LENGTH | `6` | 581 | `tmpl:215` |
| 19 | GOTRUE_MAILER_OTP_EXP | `3600` | 582 | `tmpl:217` |
| 20 | GOTRUE_MAILER_TEMPLATE_RELOADING_ENABLED | `true` | 583 | literal |
| 21 | GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED | `false` | 585 | `config.toml:37` |
| 22 | GOTRUE_SMTP_MAX_FREQUENCY | `1s` (time.Duration `%v`) | 587 | `tmpl:213` |
| 23 | GOTRUE_MAILER_URLPATHS_INVITE | `http://127.0.0.1:56421/auth/v1/verify` | 589 | jwt_issuer + `/verify` |
| 24 | GOTRUE_MAILER_URLPATHS_CONFIRMATION | same as 23 | 590 | " |
| 25 | GOTRUE_MAILER_URLPATHS_RECOVERY | same as 23 | 591 | " |
| 26 | GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE | same as 23 | 592 | " |
| 27 | GOTRUE_RATE_LIMIT_EMAIL_SENT | `360000` (SMTP is disabled, so the line 635 override does not apply) | 593 | literal |
| 28 | GOTRUE_EXTERNAL_PHONE_ENABLED | `false` | 595 | `tmpl:242`. `sms.validate` would also force false with no provider (`config.go:1179-1181`) |
| 29 | GOTRUE_SMS_AUTOCONFIRM | `true` | 596 | `tmpl:244` |
| 30 | GOTRUE_SMS_MAX_FREQUENCY | `5s` | 597 | `tmpl:248` |
| 31 | GOTRUE_SMS_OTP_EXP | `6000` | 598 | literal |
| 32 | GOTRUE_SMS_OTP_LENGTH | `6` | 599 | literal |
| 33 | GOTRUE_SMS_TEMPLATE | `Your code is {{ .Code }}` | 600 | `tmpl:246` (the template-escaped literal renders to this) |
| 34 | GOTRUE_SMS_TEST_OTP | `` (empty, no test_otp map) | 553-556,601 | `tmpl:251-252` commented |
| 35 | GOTRUE_PASSWORD_MIN_LENGTH | `12` | 603 | `config.toml:38` |
| 36 | GOTRUE_PASSWORD_REQUIRED_CHARACTERS | `` (empty). `password_requirements=""` maps to `…CharactersEmpty = ""` | 604 | `tmpl:178`; `pkg/config/auth.go:34-44`; `pkg/api/types.gen.go:1099 @ v2.76.10` |
| 37 | GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED | `true` | 605 | `config.toml:34` |
| 38 | GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL | `10` | 606 | `config.toml:35` |
| 39 | GOTRUE_SECURITY_MANUAL_LINKING_ENABLED | `false` | 607 | `tmpl:173` |
| 40 | GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION | `false` | 608 | `tmpl:211` secure_password_change |
| 41 | GOTRUE_MFA_PHONE_ENROLL_ENABLED | `false` | 609 | `tmpl:291` |
| 42 | GOTRUE_MFA_PHONE_VERIFY_ENABLED | `false` | 610 | `tmpl:292` |
| 43 | GOTRUE_MFA_TOTP_ENROLL_ENABLED | `false` | 611 | `tmpl:286` |
| 44 | GOTRUE_MFA_TOTP_VERIFY_ENABLED | `false` | 612 | `tmpl:287` |
| 45 | GOTRUE_MFA_WEB_AUTHN_ENROLL_ENABLED | `false` (zero value) | 613 | `tmpl:298-300` commented |
| 46 | GOTRUE_MFA_WEB_AUTHN_VERIFY_ENABLED | `false` (zero value) | 614 | " |
| 47 | GOTRUE_MFA_MAX_ENROLLED_FACTORS | `10` | 615 | `tmpl:282` |
| 48 | GOTRUE_RATE_LIMIT_ANONYMOUS_USERS | `30` | 618 | `tmpl:186` |
| 49 | GOTRUE_RATE_LIMIT_TOKEN_REFRESH | `500` | 619 | `config.toml:46` |
| 50 | GOTRUE_RATE_LIMIT_OTP | `500` (sign_in_sign_ups) | 620 | `config.toml:45` |
| 51 | GOTRUE_RATE_LIMIT_VERIFY | `30` | 621 | `tmpl:192` |
| 52 | GOTRUE_RATE_LIMIT_SMS_SENT | `30` | 622 | `tmpl:184` |
| 53 | GOTRUE_RATE_LIMIT_WEB3 | `30` | 623 | `tmpl:194` |
| 54 | GOTRUE_JWT_KEYS | `json.Marshal(Auth.SigningKeys)`: a single **private** EC P-256 JWK, `[{"kty":"EC","kid":"b81269f1-21d8-4f2e-b719-c2240a840d90","use":"sig","key_ops":["sign","verify"],"alg":"ES256","ext":true,"d":"<d>","crv":"P-256","x":"<x>","y":"<y>"}]` (public CLI default in source, `config.go:389-400`). 288 bytes, sha256 `caeddcdecd69f9f9e6df024b48f6ce73e804718df03b313b916ba88279c1ea9c`. SigningKeys has tag `toml:"-"`, so config cannot change it except through `signing_keys_path` (unset). | 627-628 | `pkg/config/auth.go:88-109,163-164`; `pkg/config/config.go:389-400,896-902` |
| 55 | GOTRUE_JWT_VALIDMETHODS | `HS256,RS256,ES256` | 630 | literal |
| 56 | GOTRUE_EXTERNAL_APPLE_ENABLED | `false` | 787 | `tmpl:305-306`. The default template's `[auth.external.apple]` survives the merge. |
| 57 | GOTRUE_EXTERNAL_APPLE_CLIENT_ID | `` (empty) | 788 | `tmpl:307` |
| 58 | GOTRUE_EXTERNAL_APPLE_SECRET | the literal string `env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)`. An unset `env()` reference is kept verbatim. | 789 | `tmpl:309`; `pkg/config/decode_hooks.go:15-26`, `pkg/config/secret.go:98-101` |
| 59 | GOTRUE_EXTERNAL_APPLE_SKIP_NONCE_CHECK | `false` | 790 | `tmpl:316` |
| 60 | GOTRUE_EXTERNAL_APPLE_EMAIL_OPTIONAL | `false` | 791 | `tmpl:318` |
| 61 | GOTRUE_EXTERNAL_APPLE_REDIRECT_URI | `http://127.0.0.1:56421/auth/v1/callback` (redirect_uri `""` falls back to jwt_issuer + `/callback`) | 794-798 | `tmpl:311` |
| 62 | GOTRUE_EXTERNAL_WEB3_SOLANA_ENABLED | `false` | 805 | `tmpl:322-323` |
| 63 | GOTRUE_EXTERNAL_WEB3_ETHEREUM_ENABLED | `false` (zero value) | 806 | not in tmpl |

**Conditional GoTrue env that is NOT emitted for this config:**

| Block | Why it is skipped | Source |
|---|---|---|
| SMTP vars (`GOTRUE_SMTP_HOST/PORT/USER/PASS/ADMIN_EMAIL/SENDER_NAME`, and the 2nd `RATE_LIMIT_EMAIL_SENT`) | `auth.email.smtp` is nil and `inbucket.enabled=false` (`config.toml:26`) | `start.go:633-650` |
| `GOTRUE_SESSIONS_TIMEBOX` / `_INACTIVITY_TIMEOUT` | Both are 0 (`tmpl:255-259` commented) | `start.go:652-657` |
| `GOTRUE_MAILER_TEMPLATES_*` / `GOTRUE_MAILER_SUBJECTS_*` | The email template map is empty (`config.go:382`) | `start.go:659-674` |
| `GOTRUE_SMS_PROVIDER` and provider credentials | No provider is enabled (`tmpl:272-273` twilio false) | `start.go:676-715` |
| `GOTRUE_SECURITY_CAPTCHA_*` | `auth.captcha` is nil (`tmpl:197-200` commented) | `start.go:717-724` |
| `GOTRUE_HOOK_*` (six hooks) | All hooks are nil | `start.go:726-773` |
| `GOTRUE_MFA_PHONE_TEMPLATE/OTP_LENGTH/MAX_FREQUENCY` | Phone enroll and verify are both false | `start.go:775-782` |
| `GOTRUE_EXTERNAL_APPLE_URL` | `url=""` (`tmpl:314`) | `start.go:800-802` |
| `GOTRUE_OAUTH_SERVER_*` | `oauth_server.enabled=false` (`tmpl:351`) | `start.go:810-816` |

(All `start.go` lines above refer to `internal/start/start.go @ v2.76.10`.) Env ordering is deterministic. The only map iterations are over `External` (one key, `apple`), the email `Template` map (empty) and TestOTP (empty).

**Related one-shot GoTrue container (DB-init, fresh volume only).** On PG≥15 with no existing `supabase_db_*` volume, `initSchema15` runs `gotrue migrate` before the long-lived services start. The container has no name, the image is the same gotrue image, and the env is `API_EXTERNAL_URL`, `GOTRUE_LOG_LEVEL=error`, `GOTRUE_DB_DRIVER=postgres`, `GOTRUE_DB_DATABASE_URL=postgresql://supabase_auth_admin:<db.password>@supabase_db_astandsskodun-docker-c1:5432/postgres`, `GOTRUE_SITE_URL` and `GOTRUE_JWT_SECRET`. Cmd is `["gotrue","migrate"]`. It runs on the same network with the project labels and no aliases, and is force-removed after it exits. Sources: `internal/db/start/start.go:183-185,318-331,333-356`, `internal/utils/docker.go:347-377 @ v2.76.10`.

### 1c. PostgREST (`supabase_rest_astandsskodun-docker-c1`)

| Field | Value (resolved) | Source |
|---|---|---|
| Start condition | `api.enabled && !excluded`. `api.enabled=true` | `internal/start/start.go:959 @ v2.76.10`; `config.toml:4` |
| Container name | `supabase_rest_astandsskodun-docker-c1` | `internal/utils/config.go:41,70 @ v2.76.10` |
| Image | `public.ecr.aws/supabase/postgrest:v14.5` | `pkg/config/templates/Dockerfile:6`, `pkg/config/config.go:335 @ v2.76.10` |
| Env | `PGRST_DB_URI=postgresql://authenticator:<db.password>@supabase_db_astandsskodun-docker-c1:5432/postgres` | `internal/start/start.go:965 @ v2.76.10` |
| | `PGRST_DB_SCHEMAS=public` | `:966`; `config.toml:6` (overrides `tmpl:13` `public,graphql_public`) |
| | `PGRST_DB_EXTRA_SEARCH_PATH=public,extensions` | `:967`; `config.toml:7` |
| | `PGRST_DB_MAX_ROWS=500` | `:968`; `config.toml:8` |
| | `PGRST_DB_ANON_ROLE=anon` | `:969` |
| | `PGRST_JWT_SECRET=<JWKS JSON from ResolveJWKS>`. The shape is in §3. 335 bytes, sha256 `d1b4431c9dfcf723f6e18a34e03fba2f31b0e99017bcfab73c9e5112bc3f3545`. | `:970`; `:226` |
| | `PGRST_ADMIN_SERVER_PORT=3001` | `:971` |
| Entrypoint / Cmd | Not set. The image defaults apply. | `internal/start/start.go:962-974 @ v2.76.10` |
| Healthcheck | **None** (source comment: "PostgREST does not expose a shell for health check"). Readiness is an HTTP probe, see §4. | `internal/start/start.go:973 @ v2.76.10` |
| ExposedPorts | **None set by the CLI** | `internal/start/start.go:962-974 @ v2.76.10` |
| PortBindings | **None** | `internal/start/start.go:975-977 @ v2.76.10` |
| RestartPolicy | `unless-stopped` | `internal/start/start.go:976 @ v2.76.10` |
| Binds | None | " |
| Network / aliases | `astandsskodun-docker-c1-loopback`, aliases `["rest"]` | `internal/start/start.go:978-984`, `internal/utils/config.go:41 @ v2.76.10` |

**Net effect for the 127.0.0.1 rewrite.** Among these three containers, only Kong has a host port binding: `8000/tcp` mapped to host `56421`. GoTrue and PostgREST are reachable only on the Docker network. Parity therefore needs the same Kong mapping with `HostIp:"127.0.0.1"`. `KONG_PORT_MAPS=56421:8000` stays unchanged.

---

## 2. Kong configuration generation

### 2a. Template inputs (`kongConfig`)

| Placeholder | Value | Source |
|---|---|---|
| `GotrueId` | `supabase_auth_astandsskodun-docker-c1` | `internal/start/start.go:433 @ v2.76.10` |
| `RestId` | `supabase_rest_astandsskodun-docker-c1` | `:434` |
| `RealtimeId` | `realtime-dev`. This is **`Config.Realtime.TenantId`, not the container name.** It resolves only through the realtime alias. | `:435`; `pkg/config/config.go:366`; `internal/utils/config.go:40` |
| `StorageId`, `StudioId`, `PgmetaId`, `EdgeRuntimeId`, `LogflareId`, `PoolerId` | `supabase_{storage,studio,pg_meta,edge_runtime,analytics,pooler}_astandsskodun-docker-c1` | `:436-441`; `internal/utils/config.go:42-49,71-79` |
| `ApiHost` / `ApiPort` | Passed in (`127.0.0.1` and `56421`) but **not referenced** in kong.yml (0 occurrences) | `:442-443` |
| `BearerToken` / `QueryToken` | Lua expressions, see 2c | `:444-464` |

Rendering uses Go `text/template` with `Option("missingkey=error")`, which applies no escaping (`internal/start/start.go:105-107,432 @ v2.76.10`).

### 2b. kong.yml services and routes (`internal/start/templates/kong.yml @ v2.76.10`)

`_format_version: "1.1"`. No consumers, no key-auth and no ACL. The only plugins used are `cors` and `request-transformer`.

| Service (lines) | Route path(s) (strip_path true) | Upstream | Plugins | Upstream running in this config? |
|---|---|---|---|---|
| auth-v1-open (4-13) | `/auth/v1/verify` | `http://{GotrueId}:9999/verify` | cors | yes |
| auth-v1-open-callback (14-23) | `/auth/v1/callback` | `…:9999/callback` | cors | yes |
| auth-v1-open-authorize (24-33) | `/auth/v1/authorize` | `…:9999/authorize` | cors | yes |
| auth-v1 (34-51) | `/auth/v1/` | `…:9999/` | cors, request-transformer add+replace `Authorization: {BearerToken}` | yes |
| rest-v1 (52-69) | `/rest/v1/` | `http://{RestId}:3000/` | cors, request-transformer (Authorization) | yes |
| rest-admin-v1 (70-80) | `/rest-admin/v1/` | `http://{RestId}:3001/` | cors (no auth; "TODO: validate apikey") | yes (admin server) |
| graphql-v1 (81-99) | `/graphql/v1` | `http://{RestId}:3000/rpc/graphql` | cors, request-transformer add `Content-Profile: graphql_public` + Authorization | rest yes, but `graphql_public` is **not** in `PGRST_DB_SCHEMAS=public` (inference: requests would be rejected by PostgREST) |
| realtime-v1-ws (100-115) | `/realtime/v1/` | `http://realtime-dev:4000/socket` (protocol ws) | cors, request-transformer replace querystring `apikey:{QueryToken}` | **no** (realtime disabled) |
| realtime-v1-rest (116-134) | `/realtime/v1/api` | `http://realtime-dev:4000/api` | cors, request-transformer (Authorization) | **no** |
| storage-v1-s3 (136-148) | `/storage/v1/s3/` | `http://{StorageId}:5000/s3` | cors | **no** |
| storage-v1 (150-167) | `/storage/v1/` | `…:5000/` | cors, request-transformer (Authorization) | **no** |
| functions-v1 (168-188) | `/functions/v1/` | `http://{EdgeRuntimeId}:8081/`, read_timeout 150000 | cors, request-transformer (Authorization) | **no** |
| well-known-oauth (190-199) | `/.well-known/oauth-authorization-server` | `http://{GotrueId}:9999/.well-known/oauth-authorization-server` | cors | GoTrue yes; oauth_server disabled |
| pg-meta (200-209) | `/pg/` | `http://{PgmetaId}:8080/` | cors | **no** |
| analytics-v1 (210-219) | `/analytics/v1/` | `http://{LogflareId}:4000/` | cors | **no** |
| pooler-v2-ws (220-230) | `/pooler/v2/` | `http://{PoolerId}:4000/v2` (ws) | cors | **no** |
| mcp (231-240) | `/mcp` | `http://{StudioId}:3000/api/mcp` | cors | **no** |

The template is static and always renders all 17 services, whatever is enabled. Routes to containers that are not running have hostnames that do not resolve on the network. Kong's behaviour for them (DB-less config loads, and requests most likely fail with a 5xx name-resolution error) is inferred, not verified.

### 2c. BearerToken / QueryToken

Both are built with `fmt.Sprintf`, embedding the secret key, the service_role JWT, the publishable key and the anon JWT **as literals** (`internal/start/start.go:444-464 @ v2.76.10`):

```
BearerToken = $((headers.authorization ~= nil and headers.authorization:sub(1, 10) ~= 'Bearer sb_' and headers.authorization)
              or (headers.apikey == '<SECRET_KEY>' and 'Bearer <SERVICE_ROLE_JWT>')
              or (headers.apikey == '<PUBLISHABLE_KEY>' and 'Bearer <ANON_JWT>')
              or headers.apikey)
QueryToken  = $((query_params.apikey == '<SECRET_KEY>' and '<SERVICE_ROLE_JWT>')
              or (query_params.apikey == '<PUBLISHABLE_KEY>' and '<ANON_JWT>')
              or query_params.apikey)
```

The source is a single line; it is wrapped here for readability. The semantics follow the comments at `start.go:445-451`:
- An existing non-`Bearer sb_` Authorization header is kept.
- An `sb_secret_`/`sb_publishable_` apikey becomes `Bearer <service_role|anon JWT>`.
- Otherwise the raw `apikey` value is copied **without** a `Bearer ` prefix.

The template uses both `add` and `replace` for the same header (kong.yml:44-51 etc.), so Authorization is always set. SHA-256 of the exact strings with default keys: BearerToken `3ab189f77e1ad69f7068bfb38dcb9eed444465f3669055f4d2054eae5c62e4e2`, QueryToken `b9857513e2f535c29cbd7962de818b54eabcae6e02e2d8dfb8cbd90c51151a3e`. **The rendered kong.yml therefore contains secrets.**

### 2d. custom_nginx.template

- Source: `//go:embed templates/custom_nginx.template` into `nginxConfigEmbed`. The hardcoded companions are `nginxEmailTemplateDir="/home/kong/templates/email"` and `nginxTemplateServerPort=8088` (`internal/start/start.go:109-114 @ v2.76.10`).
- Content (`internal/start/templates/custom_nginx.template:1-29 @ v2.76.10`): the Kong nginx skeleton (`pid`, `error_log ${{LOG_LEVEL}}`, `daemon ${{NGINX_DAEMON}}`, `worker_processes ${{NGINX_WORKER_PROCESSES}}`, `events { multi_accept on; }`). It adds one extra `server` (`server_name email_templates; listen 0.0.0.0:8088 reuseport backlog=16384;` with `location /email { autoindex on; root /home/kong/templates; }`) and then `include 'nginx-kong.conf';`.
- Kong is started with `--nginx-conf /home/kong/custom_nginx.template` (`start.go:514`).

### 2e. TLS cert/key written when `api.tls.enabled=false`

- The content is always embedded and always written, even with TLS disabled. `NewConfig` sets `Api.Tls.CertContent=kongCert` and `KeyContent=kongKey` (`pkg/config/config.go:337-340 @ v2.76.10`), and these come from `//go:embed templates/certs/kong.local.crt` and `templates/certs/kong.local.key` (`pkg/config/config.go:429-432 @ v2.76.10`).
- `Validate` replaces the content only when `tls.enabled` is true and `cert_path`/`key_path` are set (`pkg/config/config.go:796-814 @ v2.76.10`). Neither condition holds here.
- Cert (`pkg/config/templates/certs/kong.local.crt @ v2.76.10`): self-signed RSA-4096 with sha256WithRSAEncryption, `CN=localhost`, SAN `DNS:localhost, IP:127.0.0.1`. Valid from 2024-07-05 14:22:54 GMT to 2034-07-03 14:22:54 GMT. SHA-256 fingerprint `90:FD:EC:27:74:32:E2:B8:48:B8:04:28:61:05:96:67:A2:DF:76:C5:5A:F9:ED:9F:3F:DC:E4:5C:C3:D9:0F:BF`. File is 1846 bytes.
- Key: a PKCS#8 `BEGIN PRIVATE KEY` file of 3272 bytes (public CLI default in source; not reproduced here).
- The regeneration command is documented at `internal/status/status.go:164-168 @ v2.76.10`.
- With TLS disabled, 8443 is exposed but not published (`start.go:486-489,524-534`).

### 2f. Hashes (bytes at v2.76.10)

Command: `gh api -H "Accept: application/vnd.github.raw" "repos/supabase/cli/contents/<path>?ref=v2.76.10" > f && sha256sum f`. The blob was cross-checked with `git hash-object f` against the tree SHA. Both files are ASCII, LF only and end with `\n`.

| File | Bytes | SHA-256 | git blob SHA-1 |
|---|---|---|---|
| `internal/start/templates/kong.yml` | 7011 | `e2d93f2dc8babbaa86434b4cb8728c38abe38140de526d0a3fd8dc7d85645f20` | `0c185eb6e41e16b9235733f08bd649cc521d52c9` |
| `internal/start/templates/custom_nginx.template` | 835 | `c51eab99a3e358ff6515a0ded65ed9b1516b58dd9e19c8974b847402b3a7356f` | `e1417cc5ba684bebdfff06c5bab2e455fe110c06` |
| `pkg/config/templates/certs/kong.local.crt` | 1846 | `c3510ad93016830fdcffd117d88b59243b600d2ba2483c1d7b911753c3d47aa2` | n/a |
| `pkg/config/templates/certs/kong.local.key` | 3272 | `5bd8e6514f9f33f87842113ae7be6e3bea1a487da78b23183a54d45049743bbd` | n/a |

The following values were derived by the local helper script for this config with default keys:
- Rendered kong.yml: 14991 bytes, sha256 `18d099648b6e5ea86f886d12aba6c24d779d2700caa2e98f6e9da1f9818bd80d`.
- In-container files carry one extra trailing `\n`, because each embed already ends in `\n` and is followed by `\nEOF` in the heredoc (`start.go:515-522`). The resulting in-container SHA-256 values are:
  - `/home/kong/kong.yml`: `3bf4f1eb1f685cff46a67cddc3dfeaa42a9682afa86c658b0569d190c4900e5f`
  - `/home/kong/custom_nginx.template`: `9bfdd671361d40816ea8c7a98d27a8ec4ff6d993ffd3f83ed39259e543bff1db`
  - `localhost.crt`: `9149c59a707da42289d9a0c7cf574194c92efbb449a3b4c840dc0f966acf7152`
  - `localhost.key`: `9629d3cc8e377aa58ac8b5cc5192a166d1944448718b9a3847bdb553e4fc3b23`

---

## 3. Keys

All derivation happens in `generateAPIKeys`, called from `Validate` whether or not auth is enabled (`pkg/config/config.go:922 @ v2.76.10`). None of `auth.jwt_secret`, `anon_key`, `service_role_key`, `publishable_key` or `secret_key` is set in `config.toml` or in the env (§0). The fields exist as `Secret` with toml keys (`pkg/config/auth.go:177-182 @ v2.76.10`).

| Key | How it is produced | Format / claims | Fingerprint (default) | Source |
|---|---|---|---|---|
| JWT secret | `auth.jwt_secret` if set (≥16 chars, else error), otherwise the constant `defaultJwtSecret` (public CLI default in source) | 55-char ASCII string | sha256 `a064b502e61d27e94b8717290e5e1b32e36720e9fbdf952ec81a84c07128cb37` | `pkg/config/apikeys.go:17,44-48 @ v2.76.10` |
| anon key | If unset, `generateJWT("anon")`. `signing_keys_path` is empty, so the symmetric path applies: **HS256** signed with the JWT secret. | Header `{"alg":"HS256","typ":"JWT"}`; payload exactly `{"iss":"supabase-demo","role":"anon","exp":1983812996}`. `exp` is the constant `defaultJwtExpiry` = 2032-11-11T19:09:56Z. No `iat`/`ref`/`aud`/`sub`, so the token is byte-deterministic. base64url, unpadded. | 153 chars, sha256 `bf1725a8f98bea37e88618702e725ba84bd8acdb2647c5e0ed638bfd685791cf`. The signature was confirmed equal to the widely published local demo anon key. | `pkg/config/apikeys.go:18,23-40,50-56,75-87 @ v2.76.10` |
| service_role key | Same as anon with role `service_role` | Payload `{"iss":"supabase-demo","role":"service_role","exp":1983812996}` | 164 chars, sha256 `70541e07fd4f900b66e289f5be55c85f9bef1def4924a5b0c518c45ea1688c12` | `pkg/config/apikeys.go:57-64 @ v2.76.10` |
| (asymmetric variant, NOT used) | Applies only if `signing_keys_path` is set and keys load: ES256/RS256 with the first signing key, `kid` header, `exp`=now+10y | n/a | n/a | `pkg/config/apikeys.go:77-80,90-117 @ v2.76.10` |
| publishable key | Hardcoded constant `defaultPublishableKey` if unset. Opaque, not a JWT. | `sb_publishable_` + 31 chars (46 total) | sha256 `9705102db0d5f99ee08daa19a73e510d9877a2a9add9369da247cbbe6c2a0140` | `pkg/config/apikeys.go:19,66-68 @ v2.76.10` |
| secret key | Hardcoded constant `defaultSecretKey` if unset. Opaque. | `sb_secret_` + 31 chars (41 total) | sha256 `c85debb55f2f204d868cc1552c42faa143b4c675f61363ab040dd50b5b5304cd` | `pkg/config/apikeys.go:20,69-71 @ v2.76.10` |
| Signing keys (GoTrue) | Default single EC P-256 private JWK from `NewConfig`. `kid` `b81269f1-21d8-4f2e-b719-c2240a840d90`, `alg` ES256, `use` sig, `key_ops` [sign, verify], `ext` true (public CLI default in source). | See row 54 in §1b | see §1b | `pkg/config/config.go:389-400 @ v2.76.10` |

Where the keys are consumed in these three services:
- GoTrue receives `GOTRUE_JWT_SECRET` and `GOTRUE_JWT_KEYS`.
- PostgREST receives the JWKS.
- Kong embeds all four API keys and the JWTs in BearerToken/QueryToken.
- The CLI health probe sends the secret key as `apikey` (§4).

**`ResolveJWKS` for this config** (`pkg/config/config.go:1491-1573 @ v2.76.10`):
1. `ThirdParty.IssuerURL()` returns `""`, because firebase, auth0, aws_cognito and clerk are false in `tmpl:326-346` and workos is false by zero value. **No network fetch** happens (`config.go:1452-1474,1497`).
2. For each `SigningKeys` entry, it appends `ToPublicJWK()`. This keeps kty, kid, use, alg and ext, keeps only `key_ops:["verify"]`, keeps crv/x/y and drops `d` (`pkg/config/auth.go:112-145`).
3. Because `signing_keys_path` is empty, it appends `{"kty":"oct","k":base64url_nopad(jwt_secret)}` (`config.go:1553-1565`).

The result, which is the `PGRST_JWT_SECRET` value shape:
```
{"keys":[{"kty":"EC","kid":"b81269f1-21d8-4f2e-b719-c2240a840d90","use":"sig","key_ops":["verify"],"alg":"ES256","ext":true,"crv":"P-256","x":"<x>","y":"<y>"},{"kty":"oct","k":"<base64url(jwt_secret)>"}]}
```
It is 335 bytes with sha256 `d1b4431c9dfcf723f6e18a34e03fba2f31b0e99017bcfab73c9e5112bc3f3545`. It is computed once at `start.go:226`; an error aborts start.

---

## 4. Health waiting

| Step | Behaviour | Source |
|---|---|---|
| DB gate (before Kong/GoTrue/PostgREST are created) | `WaitForHealthyService(ctx, Db.HealthTimeout=2m, supabase_db_…)`. On a fresh volume it is followed by `SetupLocalDatabase`, which includes the `gotrue migrate` job. | `internal/db/start/start.go:175-186 @ v2.76.10`; `tmpl:33` |
| Final wait | `start.WaitForHealthyService(ctx, serviceTimeout=30s, started...)` with `started=[supabase_kong_…, supabase_auth_…, supabase_rest_…]` | `internal/start/start.go:152,548,848,989,1283-1293 @ v2.76.10` |
| Retry policy | Constant 1s backoff with `WithMaxRetries(30)` (≈31 probes, about 30s) under the context. Each probe re-checks only the containers that are still unhealthy. On final failure it prints `docker logs` of the remaining containers. | `internal/db/start/start.go:191-224 @ v2.76.10` |
| Kong readiness | `status.IsServiceReady` calls `assertContainerHealthy`: the container must be `State.Running`, and if `State.Health != nil` the status must be `healthy`. The CLI sets no healthcheck, so the gate is the image HEALTHCHECK if present (see §1a), otherwise "running". | `internal/status/status.go:141-150,152-162 @ v2.76.10` |
| GoTrue readiness | Same `assertContainerHealthy`. It relies on the CLI healthcheck (wget `/health`, 10s/2s/3), so it cannot pass before the first probe at about 10s. | `internal/status/status.go:161`; `internal/start/start.go:824-832 @ v2.76.10` |
| PostgREST readiness | `checkHTTPHead("/rest-admin/v1/ready")` sends `HEAD http://127.0.0.1:56421/rest-admin/v1/ready` (`api.external_url`) through Kong to `{RestId}:3001/ready`. The fetcher is built once with `NewServiceGateway(external_url, Auth.SecretKey)`. The key starts with `sb_`, so only the header `apikey: <secret key>` is added, with no Authorization header, plus `User-Agent: SupabaseCLI/<version>`. Expected status is **200**; anything else is an error and is retried. The HTTP client has a 10s timeout and trusts the embedded Kong cert. | `internal/status/status.go:153-156,169-213`; `pkg/fetcher/gateway.go:9-32`; `pkg/fetcher/http.go:97-107 @ v2.76.10` |
| Failure handling | An unhealthy result is a joined error (`IsUnhealthyError`). Without `--ignore-health-check`, `DockerRemoveAll` runs. It stops and prunes containers with label `com.supabase.cli.project=<id>`, prunes volumes only if `NoBackupVolume`, and prunes networks matching the label. | `internal/start/start.go:72-80`; `internal/db/start/start.go:226-230`; `internal/utils/docker.go:96-148 @ v2.76.10` |

---

## 5. Cross-check against supabase/supabase self-hosting (short)

Files read: `docker/docker-compose.yml`, `docker/docker-compose.kong.yml`, `docker/volumes/api/kong.yml` and `docker/volumes/api/kong-entrypoint.sh` from `supabase/supabase@cdba349de944dd7c1f206e304ec54729e0857563` (master as of 2026-11-03).

| Area | Self-hosted (compose) | CLI v2.76.10 | Notable |
|---|---|---|---|
| Gateway | Default is **Envoy** (`api-gw`, `docker-compose.yml:70-107`). Kong is an overlay using `kong/kong:3.9.3`, `KONG_ROUTER_FLAVOR=expressions` and plugins `request-transformer,cors,key-auth,acl,basic-auth,request-termination,ip-restriction,post-function` (`docker-compose.kong.yml:14,31,35`). | `kong:2.8.1`, plugins `request-transformer,cors` only | The CLI does **no apikey validation** at the gateway: no consumers, key-auth or ACL. Self-hosted kong.yml enforces `key-auth` plus ACL groups `anon`/`admin` (`kong.yml:7-25,132-148`) and adds the open routes `/.well-known/jwks.json`, `openid-configuration` and SSO SAML (`kong.yml:70-119`). Self-hosted has no `/rest-admin/v1` route. |
| Lua key translation | Built at runtime by `kong-entrypoint.sh:15-38` from env, mapping opaque keys to **asymmetric** JWTs (`*_ASYMMETRIC`). It falls back to apikey pass-through when opaque keys are unset. | Built in Go and baked into kong.yml, mapping opaque keys to the **HS256** demo JWTs (§2c) | Same expression shape (`start.go:452` vs `kong-entrypoint.sh:17`) |
| Auth | `gotrue:v2.197.0`. `API_EXTERNAL_URL` example is `http://localhost:8000/auth/v1` and `GOTRUE_JWT_ISSUER=${API_EXTERNAL_URL}`. `GOTRUE_JWT_KEYS` is commented out. MAILER_URLPATHS are **relative** (`/auth/v1/verify`). `postgres://` DB URL, healthcheck on `localhost` at 5s/5s/3. (`docker-compose.yml:109-178`; `.env.example:101,178-181`) | `v2.186.0`. `API_EXTERNAL_URL=http://127.0.0.1:56421` (**no** `/auth/v1`) while `JWT_ISSUER` adds `/auth/v1`. `GOTRUE_JWT_KEYS` is **always** set (EC private key). MAILER_URLPATHS are **absolute** issuer+`/verify`. `postgresql://`, healthcheck on 127.0.0.1 at 10s/2s/3, and many explicit defaults (rate limits, MFA, SMS, apple provider). | API_EXTERNAL_URL semantics differ (base vs `/auth/v1`). |
| Rest | `postgrest:v14.18`, `PGRST_JWT_SECRET=${JWT_JWKS:-${JWT_SECRET}}`. Adds `PGRST_ADMIN_SERVER_HOST=localhost`, `PGRST_DB_USE_LEGACY_GUCS=false` and `PGRST_APP_SETTINGS_JWT_EXP`. Healthcheck is `postgrest --ready` at 5s (`docker-compose.yml:249-282`). | `v14.5`, JWKS always (EC public + oct). No admin host, legacy-GUC or app-settings vars, no container healthcheck. Readiness is an HTTP HEAD through Kong to admin port 3001. | The CLI's admin server must be reachable from Kong, so it cannot be bound to localhost. |
| DB | `supabase/postgres:17.6.1.136`, bind-mounted `PGDATA`. Init uses SQL files mounted into `/docker-entrypoint-initdb.d` (`roles.sql`, `jwt.sql`, `webhooks.sql`, `realtime.sql`, `_supabase.sql`, `logs.sql`, `pooler.sql`). Healthcheck is `pg_isready` at 5s/5s/10 (`docker-compose.yml:478-530`). | `17.6.1.084`. Named volume `supabase_db_<id>`. An `sh -c` heredoc entrypoint writes `/etc/postgresql.schema.sql` (schema + webhook + `_supabase` SQL), the pgsodium root key and postgresql.conf additions. Post-start Go setup follows, plus one-shot service-migration containers (`gotrue migrate`). Healthcheck is `pg_isready` at 10s/2s/3. | Different init mechanism (`internal/db/start/start.go:62-130,183-185,333-356 @ v2.76.10`). |
| Ports | `${API_GW_HTTP_PORT:-8000}:8000`, with no host IP | `HostPort` only, with empty HostIp | **Both publish on all interfaces by default.** |

---

## UNRESOLVED / caveats

1. **Kong image HEALTHCHECK: RESOLVED (2026-11-03).** The CLI sets none, but `docker image inspect public.ecr.aws/supabase/kong:2.8.1` shows the image keeps `CMD-SHELL kong health` (interval 10s, timeout 10s, retries 10). The CLI's Kong gate is therefore "healthy", not just "running".
2. **Hostname = 127.0.0.1: RESOLVED (2026-11-03).** `docker context inspect desktop-linux` gives `npipe:////./pipe/dockerDesktopLinuxEngine`, so `GetHostname()` returns `127.0.0.1` and the derived URLs above hold.
3. **Docker daemon semantics (not CLI code).**
   - The image CMD is not inherited when Entrypoint is overridden.
   - An empty `HostIp` publishes on 0.0.0.0/[::].
   - Containers are resolvable by name on a user-defined network. kong.yml relies on this for the `supabase_*` upstreams, while `realtime-dev` relies on the alias.

   These are standard Docker behaviour and were not re-verified here.
4. **Viper merge of `additional_redirect_urls = []`.** It is assumed to replace the template default `["https://127.0.0.1:3000"]`, giving an empty `GOTRUE_URI_ALLOW_LIST`. This rests on viper's deep-merge replacing non-map values. It was not executed.
5. **GoTrue/PostgREST runtime behaviour is out of CLI scope.** Examples are which key GoTrue signs session tokens with when `GOTRUE_JWT_KEYS` contains a `sign` key (likely ES256 with that kid), PostgREST's response to the graphql route with `graphql_public` not exposed, and Kong's 5xx on unresolvable upstreams. These are inferences only.
6. **Hashes of rendered or in-container files assume the default keys and default `realtime-dev` tenant.** The env for this run was cleaned, so no `SUPABASE_*` override applied, but the hashes change if any key or secret is overridden. The in-container hashes also assume busybox `sh` heredoc semantics, which add one trailing newline per file.
7. **`GOTRUE_EXTERNAL_APPLE_SECRET` is the literal `env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)`.** That holds only because the variable is unset. If it were set in the environment or a `.env` file, its value would be emitted instead.
8. **Self-hosted cross-check is against a moving branch.** It is pinned to commit `cdba349…` (master at fetch time). Its image versions and env differ from what the CLI pins.
