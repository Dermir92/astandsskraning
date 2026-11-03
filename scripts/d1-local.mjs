// D1 creates its four Supabase containers itself (path C): CLI 2.76.10 publishes
// ports without a host IP, which Docker Desktop binds to 0.0.0.0. Templates are read
// byte-exact from the hash-pinned CLI binary and every port is bound to 127.0.0.1.
// D1 has no host SQL client, credential reader, reset/link/push/deploy command,
// package installer, image pull, volume removal or global Docker mutation. Its only
// SQL runs inside the D1 database container: the pinned migrations and their history.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createHash, createHmac, generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const PROJECT = "astandsskodun-docker-c1";
export const NETWORK = "astandsskodun-docker-c1-loopback";
export const CONTEXT = "desktop-linux";
export const ENDPOINT = "npipe:////./pipe/dockerDesktopLinuxEngine";
export const BRANCH = "codex/docker-first-local";
export const PORTS = [56420, 56421, 56422, 3101];
export const MIN_FREE_RAM = 4 * 1024 ** 3;
export const MIN_DOCKER_RAM = 4 * 1024 ** 3;
export const CLI_HASH = "a203c2ab7de2072fb4e72bb141a663b95942fe503ec48ef60def21fc639d8902";
export const CONFIG_HASH = "622f4d87855ca3f310b143c1a1299d523a32a94301fae2775ef9528abbf60d55";
export const MIGRATIONS = {
  "20261024000100_c1_owner_inspections.sql": "6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8",
  "20261027000100_c1_hosted_acl_hardening.sql": "6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62",
};
// CLI 2.76.10's exact cached service images. No floating tags or substitutions.
export const IMAGES = {
  db: "public.ecr.aws/supabase/postgres:17.6.1.084",
  auth: "public.ecr.aws/supabase/gotrue:v2.186.0",
  rest: "public.ecr.aws/supabase/postgrest:v14.5",
  kong: "public.ecr.aws/supabase/kong:2.8.1",
};
// The CLI's go:embed files, located in the pinned binary by first line and accepted
// only on an exact length and SHA-256 match (docs/d1-c/).
export const CLI_EMBEDS = {
  schema: ["\\set pgpass `echo \"$PGPASSWORD\"`\n", 702, "3a9f39fb79d67d4fb2f5e54638dca1d06894a3e1a57419bc188e4ee09c72556f"],
  webhook: ["BEGIN;\n", 8399, "aa956b7b1f205284a524882fe0d580c72d86374aea9c9c2e93ac398df5e07d0b"],
  supabase: ["CREATE DATABASE _supabase WITH OWNER postgres;\n", 421, "ced0d2dd073c86f402e409ff540ecda07455997e6a0a1e8a738c154c6b962a20"],
  kong: ["_format_version: \"1.1\"\n", 7011, "e2d93f2dc8babbaa86434b4cb8728c38abe38140de526d0a3fd8dc7d85645f20"],
  nginx: ["pid pids/nginx.pid;", 835, "c51eab99a3e358ff6515a0ded65ed9b1516b58dd9e19c8974b847402b3a7356f"],
  cert: ["-----BEGIN CERTIFICATE-----\n", 1846, "c3510ad93016830fdcffd117d88b59243b600d2ba2483c1d7b911753c3d47aa2"],
  certKey: ["-----BEGIN PRIVATE KEY-----\n", 3272, "5bd8e6514f9f33f87842113ae7be6e3bea1a487da78b23183a54d45049743bbd"],
};
// Owner decision 4: only the routes whose upstream container D1 runs.
export const KONG_SERVICES = ["auth-v1-open", "auth-v1-open-callback", "auth-v1-open-authorize", "auth-v1",
  "rest-v1", "rest-admin-v1", "graphql-v1", "well-known-oauth"];
// The CLI template's lines 1-99 and 189-199: the eight services and their headings.
export const KONG_TEMPLATE_HASH = "0e46f51757dfd61ac64e797ff45c66b10699ad96ab16b3b8eb3c4917f239de48";
export const SECRETS_FILE = path.join(ROOT, "artifacts/d1-local/stack-secrets.json");
const API_URL = "http://127.0.0.1:56421";
const SITE_URL = "http://127.0.0.1:3101";
const VOLUME = `supabase_db_${PROJECT}`;
const ALIASES = { db: ["db", "db.supabase.internal"], kong: ["kong", "api.supabase.internal"], auth: ["auth"], rest: ["rest"] };
const ownerLabel = "is.astandsskodun.local.project";
const bindingOption = "com.docker.network.bridge.host_binding_ipv4";
const masqueradeOption = "com.docker.network.bridge.enable_ip_masquerade";
const hash = value => createHash("sha256").update(value).digest("hex");
const assert = (condition, code) => { if (!condition) throw new Error(`STOP: ${code}`); };
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const containerName = service => `supabase_${service}_${PROJECT}`;
const ownedByD1 = item => item.Name.includes(PROJECT) || [item.Owner, item.Project, item.ComposeProject].includes(PROJECT);

export function cleanEnvironment(source = process.env) {
  const keep = new Set(["path", "pathext", "systemroot", "windir", "temp", "tmp", "userprofile",
    "appdata", "localappdata", "homedrive", "homepath", "programfiles", "programfiles(x86)", "programdata", "comspec"]);
  const env = Object.fromEntries(Object.entries(source).filter(([key]) => keep.has(key.toLowerCase())));
  return { ...env, DOCKER_CONTEXT: CONTEXT };
}
const execute = (binary, args, { input, timeout = 30_000 } = {}) => execFileSync(binary, args, {
  cwd: ROOT, env: cleanEnvironment(), encoding: "utf8", timeout, input,
  windowsHide: true, stdio: [input == null ? "ignore" : "pipe", "pipe", "pipe"], maxBuffer: 8 * 1024 ** 2,
}).trim();
const docker = (args, options) => execute("docker", ["--context", CONTEXT, ...args], options);
const json = value => JSON.parse(value || "null");

export function assertConfig(bytes) {
  assert(hash(bytes) === CONFIG_HASH, "D1_CONFIG_CHANGED");
}
export function assertSources(root = ROOT, afterStart = false) {
  assertConfig(fs.readFileSync(path.join(root, "supabase/config.toml")));
  const migrations = path.join(root, "supabase/migrations");
  assert(JSON.stringify(fs.readdirSync(migrations).sort()) === JSON.stringify(Object.keys(MIGRATIONS).sort()), "MIGRATION_SET_CHANGED");
  for (const [name, expected] of Object.entries(MIGRATIONS)) {
    assert(hash(fs.readFileSync(path.join(migrations, name))) === expected, "CANONICAL_MIGRATION_CHANGED");
  }
  assert(!fs.readdirSync(root).some(name => name.startsWith(".env")), "ENV_FILE_PRESENT");
  // D1 never runs the CLI, so CLI link/branch/version state is always foreign here.
  const allowed = [".gitignore", "config.toml", "migrations"];
  assert(fs.readdirSync(path.join(root, "supabase")).every(name => allowed.includes(name)), "SUPABASE_STATE_OR_CUSTOM_SQL_PRESENT");
  const inspectArtifacts = directory => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), "ARTIFACT_SYMLINK_PRESENT");
      assert(entry.name !== "runtime.json" && !entry.name.startsWith(".env"), "OLD_RUNTIME_PRESENT");
      // A first start always generates new keys; old ones belong to an old stack.
      assert(afterStart || entry.name !== path.basename(SECRETS_FILE), "OLD_STACK_SECRETS_PRESENT");
      if (entry.isDirectory()) inspectArtifacts(path.join(directory, entry.name));
    }
  };
  inspectArtifacts(path.join(root, "artifacts"));
}

export function networkIssues(network) {
  if (!network) return ["NETWORK_MISSING"];
  // Current Docker Desktop adds explicit IPv4/IPv6 defaults on creation.
  const acceptedOptions = { [bindingOption]: "127.0.0.1", [masqueradeOption]: "false",
    "com.docker.network.enable_ipv4": "true", "com.docker.network.enable_ipv6": "false" };
  return [
    [network.Name === NETWORK, "WRONG_NETWORK_NAME"],
    [network.Driver === "bridge" && network.Scope === "local", "WRONG_NETWORK_DRIVER"],
    [network.Options?.[bindingOption] === "127.0.0.1", "NETWORK_NOT_LOOPBACK"],
    [network.Options?.[masqueradeOption] === "false", "NETWORK_EGRESS_NAT_ENABLED"],
    [Object.entries(network.Options ?? {}).every(([key, value]) => acceptedOptions[key] === value), "UNREVIEWED_NETWORK_OPTIONS"],
    // Docker Desktop forwards no Windows host port to internal-only containers:
    // the first D1 start was refused on 127.0.0.1:56422 while the database was healthy.
    [network.Internal === false, "NETWORK_INTERNAL_BLOCKS_HOST_PORTS"],
    [network.EnableIPv6 === false, "NETWORK_IPV6_ENABLED"],
    [network.Labels?.[ownerLabel] === PROJECT, "NETWORK_NOT_OWNED_BY_D1"],
  ].filter(([ok]) => !ok).map(([, code]) => code);
}
export function evaluatePreflight(snapshot, requireNetwork = true) {
  const issues = [];
  if (snapshot.endpoint !== ENDPOINT || snapshot.docker.OSType !== "linux") issues.push("WRONG_DOCKER_ENGINE");
  if (snapshot.freeRam < MIN_FREE_RAM) issues.push("HOST_RAM_BELOW_4_GIB");
  if (snapshot.docker.MemTotal < MIN_DOCKER_RAM) issues.push("DOCKER_RAM_BELOW_4_GIB");
  for (const port of PORTS) {
    if (snapshot.listeners.some(item => item.LocalPort === port)) issues.push(`PORT_${port}_BUSY`);
    if (snapshot.exclusions.some(([first, last]) => first <= port && port <= last)) issues.push(`PORT_${port}_RESERVED`);
  }
  if (snapshot.containers.some(ownedByD1)) issues.push("PROJECT_CONTAINER_EXISTS");
  if (snapshot.volumes.some(ownedByD1)) issues.push("PROJECT_VOLUME_EXISTS");
  if (snapshot.networks.some(item => item.Name !== NETWORK && (item.Name.includes(PROJECT) || item.Labels?.includes(PROJECT)))) issues.push("PROJECT_NETWORK_COLLISION");
  if (snapshot.network) {
    issues.push(...networkIssues(snapshot.network));
    if (Object.keys(snapshot.network.Containers ?? {}).length) issues.push("NETWORK_IN_USE");
  } else if (requireNetwork) issues.push("NETWORK_MISSING");
  if (!Object.values(IMAGES).every(image => snapshot.images[image])) issues.push("CACHED_IMAGE_MISSING_NO_PULL_ALLOWED");
  return issues;
}

// Docker prints "<no value>" for a label key the container does not have.
export function parseContainer(text) {
  const container = json(text);
  for (const key of ["Owner", "Project", "ComposeProject"]) if (container[key] === "<no value>") container[key] = "";
  return container;
}
// Read selected Docker metadata only: never inspect Config.Env or the entrypoint.
function inspectContainers() {
  const ids = docker(["ps", "--all", "--format", "{{.ID}}"]);
  if (!ids) return [];
  const format = `{"Id":"{{.Id}}","Name":"{{.Name}}","Owner":"{{index .Config.Labels "${ownerLabel}"}}","Project":"{{index .Config.Labels "com.supabase.cli.project"}}","ComposeProject":"{{index .Config.Labels "com.docker.compose.project"}}","Image":"{{.Config.Image}}","ImageId":"{{.Image}}","Running":{{.State.Running}},"RestartPolicy":"{{.HostConfig.RestartPolicy.Name}}","Ports":{{json .HostConfig.PortBindings}},"ActualPorts":{{json .NetworkSettings.Ports}},"Networks":{{json .NetworkSettings.Networks}},"Mounts":{{json .Mounts}}}`;
  return ids.split(/\r?\n/).map(id => parseContainer(docker(["inspect", "--format", format, id])));
}
function inspectNetwork() {
  const names = docker(["network", "ls", "--format", "{{.Name}}"]);
  const matches = names.split(/\r?\n/).filter(name => name === NETWORK);
  assert(matches.length <= 1, "DUPLICATE_NETWORK_NAME");
  return matches.length ? json(docker(["network", "inspect", NETWORK]))[0] : null;
}
export function parseExclusions(text) {
  return text.split(/\r?\n/).flatMap(line => {
    const match = /^\s*(\d+)\s+(\d+)\s*\*?\s*$/.exec(line);
    return match ? [[Number(match[1]), Number(match[2])]] : [];
  });
}
export function findCli() {
  const common = execute("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  const candidates = [ROOT, path.dirname(common)].map(root => path.join(root, "node_modules/supabase"));
  const installation = candidates.find(directory => fs.existsSync(path.join(directory, "bin/supabase.exe")));
  assert(installation, "PINNED_CLI_NOT_INSTALLED");
  assert(json(fs.readFileSync(path.join(installation, "package.json"), "utf8")).version === "2.76.10", "WRONG_CLI_VERSION");
  assert(json(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).devDependencies.supabase === "2.76.10", "WRONG_CLI_PIN");
  const binary = path.join(installation, "bin/supabase.exe");
  const bytes = fs.readFileSync(binary);
  assert(hash(bytes) === CLI_HASH, "CLI_BINARY_CHANGED");
  return { binary, bytes };
}
export function extractEmbeds(bytes) {
  return Object.fromEntries(Object.entries(CLI_EMBEDS).map(([name, [firstLine, length, expected]]) => {
    const matches = [];
    for (let at = bytes.indexOf(firstLine); at !== -1; at = bytes.indexOf(firstLine, at + 1)) {
      const candidate = bytes.subarray(at, at + length);
      if (hash(candidate) === expected) matches.push(candidate.toString("utf8"));
    }
    assert(matches.length === 1, "CLI_TEMPLATE_NOT_FOUND");
    return [name, matches[0]];
  }));
}
export function inspectHost(afterStart = false) {
  assert(process.platform === "win32", "WINDOWS_DOCKER_DESKTOP_REQUIRED");
  assertSources(ROOT, afterStart);
  assert(execute("git", ["branch", "--show-current"]) === BRANCH, "WRONG_WORKTREE_BRANCH");
  const cli = findCli(); // Read and hashed only, never executed.
  const endpoint = docker(["context", "inspect", CONTEXT, "--format", "{{.Endpoints.docker.Host}}"]);
  const info = json(docker(["info", "--format", '{"OSType":"{{.OSType}}","MemTotal":{{.MemTotal}}}']));
  const windows = json(execute("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command",
    '$os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $ports = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Select-Object LocalAddress,LocalPort); @{FreeRam=[int64]$os.FreePhysicalMemory*1024;TotalRam=[int64]$os.TotalVisibleMemorySize*1024;Listeners=$ports} | ConvertTo-Json -Compress']));
  const exclusions = ["ipv4", "ipv6"].flatMap(family => parseExclusions(execute("netsh", ["interface", family, "show", "excludedportrange", "protocol=tcp"])));
  const volumes = docker(["volume", "ls", "--format", `{"Name":"{{.Name}}","Owner":"{{.Label "${ownerLabel}"}}","Project":"{{.Label "com.supabase.cli.project"}}","ComposeProject":"{{.Label "com.docker.compose.project"}}"}`]);
  const networks = docker(["network", "ls", "--format", '{"Name":"{{.Name}}","Labels":{{json .Labels}}}']);
  const images = {};
  for (const image of Object.values(IMAGES)) {
    try { images[image] = docker(["image", "inspect", "--format", "{{.Id}}", image]); }
    catch { images[image] = null; } // A missing image is a STOP, never an implicit pull.
  }
  return { cli: cli.binary, embeds: extractEmbeds(cli.bytes), endpoint, docker: info, freeRam: windows.FreeRam,
    totalRam: windows.TotalRam, listeners: array(windows.Listeners), exclusions, containers: inspectContainers(),
    volumes: volumes ? volumes.split(/\r?\n/).map(json) : [], networks: networks.split(/\r?\n/).map(json),
    network: inspectNetwork(), images };
}

export function assertStarted(snapshot, expectedNetworkId = snapshot.network?.Id, expectedImages = snapshot.images) {
  assert(networkIssues(snapshot.network).length === 0, "UNSAFE_RUNTIME_NETWORK");
  assert(snapshot.network.Id === expectedNetworkId, "NETWORK_REPLACED_DURING_START");
  const containers = snapshot.containers.filter(ownedByD1);
  assert(containers.length === 4, "UNEXPECTED_RUNTIME_SERVICE_COUNT");
  const expectedNames = Object.keys(IMAGES).map(containerName);
  assert(Object.keys(snapshot.network.Containers ?? {}).length === 4, "UNEXPECTED_NETWORK_MEMBER");
  for (const container of containers) {
    const name = container.Name.replace(/^\//, "");
    // Owner decision 3: only the D1 label, so `supabase stop` can never act on D1.
    assert(expectedNames.includes(name) && container.Owner === PROJECT && !container.Project && !container.ComposeProject && container.Running, "UNEXPECTED_RUNTIME_CONTAINER");
    assert(container.RestartPolicy === "no", "UNEXPECTED_RESTART_POLICY");
    const service = name.slice("supabase_".length, -(PROJECT.length + 1));
    assert(container.Image === IMAGES[service] && container.ImageId === expectedImages[IMAGES[service]], "UNEXPECTED_RUNTIME_IMAGE");
    assert(JSON.stringify(Object.keys(container.Networks ?? {})) === JSON.stringify([NETWORK]), "CONTAINER_ON_WRONG_NETWORK");
    assert(container.Networks[NETWORK].NetworkID === snapshot.network.Id && snapshot.network.Containers[container.Id], "NETWORK_ID_MISMATCH");
    const expectedPort = service === "db" ? ["5432/tcp", "56422"] : service === "kong" ? ["8000/tcp", "56421"] : null;
    for (const ports of [container.Ports, container.ActualPorts]) {
      const published = Object.entries(ports ?? {}).filter(([, bindings]) => bindings?.length);
      assert(published.length === (expectedPort ? 1 : 0), "UNEXPECTED_PUBLISHED_PORT");
      for (const [port, bindings] of published) {
        // Docker Desktop ignores the network's host_binding_ipv4: only an explicit
        // 127.0.0.1 in both the request and the effective binding is accepted.
        assert(port === expectedPort[0] && bindings.length === 1 && bindings[0].HostIp === "127.0.0.1" && bindings[0].HostPort === expectedPort[1], "PUBLIC_OR_WRONG_PORT_BINDING");
      }
    }
    const mounts = container.Mounts ?? [];
    assert(mounts.every(mount => mount.Type === "volume" && service === "db" && mount.Name === VOLUME && mount.Destination === "/var/lib/postgresql/data"), "UNEXPECTED_RUNTIME_MOUNT");
    if (service === "db") assert(mounts.length === 1, "DATABASE_VOLUME_MISSING");
  }
  assert(!snapshot.listeners.some(item => [56421, 56422].includes(item.LocalPort) && !["127.0.0.1", "::1"].includes(item.LocalAddress)), "WINDOWS_PUBLIC_PORT_BINDING");
}
// Not --internal (host ports must be forwarded); outbound NAT is disabled instead.
export function networkCreateArguments() {
  return ["network", "create", "--driver", "bridge", "--opt", `${bindingOption}=127.0.0.1`,
    "--opt", `${masqueradeOption}=false`, "--label", `${ownerLabel}=${PROJECT}`, NETWORK];
}

// Owner decision 1: fresh keys per stack, in the CLI's formats and claim shapes.
const signHs256 = (claims, secret) => {
  const unsigned = [{ alg: "HS256", typ: "JWT" }, claims].map(part => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".");
  return `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
};
export function apiKeyJwt(role, jwtSecret) {
  return signHs256({ iss: "supabase-demo", role, exp: 1983812996 }, jwtSecret);
}
export function generateStackSecrets() {
  const jwtSecret = randomBytes(32).toString("base64url");
  const { d, crv, x, y } = generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey.export({ format: "jwk" });
  const opaque = () => randomBytes(24).toString("base64url").slice(0, 31);
  return { dbPassword: randomBytes(32).toString("hex"), pgsodiumRootKey: randomBytes(32).toString("hex"), jwtSecret,
    signingKey: { kty: "EC", kid: randomUUID(), use: "sig", key_ops: ["sign", "verify"], alg: "ES256", ext: true, d, crv, x, y },
    anonKey: apiKeyJwt("anon", jwtSecret), serviceRoleKey: apiKeyJwt("service_role", jwtSecret),
    publishableKey: `sb_publishable_${opaque()}`, secretKey: `sb_secret_${opaque()}` };
}
export function jwks({ signingKey: { kty, kid, use, alg, ext, crv, x, y }, jwtSecret }) {
  return JSON.stringify({ keys: [{ kty, kid, use, key_ops: ["verify"], alg, ext, crv, x, y },
    { kty: "oct", k: Buffer.from(jwtSecret).toString("base64url") }] });
}
const databaseUrl = (user, secrets) => `postgresql://${user}:${secrets.dbPassword}@${containerName("db")}:5432/postgres`;
const heredoc = text => { assert(!text.split("\n").includes("EOF"), "HEREDOC_TERMINATOR_IN_TEMPLATE"); return text; };

// The CLI's script line by line, including the trailing space it leaves after
// "/etc/postgresql " and its empty [db.settings] block.
export function databaseEntrypoint(embeds, rootKey) {
  return ["", "cat <<'EOF' > /etc/postgresql.schema.sql && \\", "cat <<'EOF' > /etc/postgresql-custom/pgsodium_root.key && \\",
    "cat <<'EOF' >> /etc/postgresql/postgresql.conf && \\", "docker-entrypoint.sh postgres -D /etc/postgresql ",
    heredoc(embeds.schema), heredoc(embeds.webhook), heredoc(embeds.supabase), "EOF", heredoc(rootKey), "EOF",
    "", "# supabase [db.settings] configuration", "", "EOF"].join("\n");
}
export function trimKongTemplate(template) {
  const output = [], services = [];
  let pending = [], keep = true;
  for (const line of template.slice(0, -1).split("\n")) {
    // Two-space comments head the next service and go with it.
    if (/^  # /.test(line)) { pending.push(line); continue; }
    const service = /^  - name: (\S+)$/.exec(line)?.[1];
    if (service) {
      keep = KONG_SERVICES.includes(service);
      if (keep) { output.push(...pending); services.push(service); }
      pending = [];
    }
    if (keep) output.push(line);
  }
  assert(template.endsWith("\n") && !pending.length && JSON.stringify(services) === JSON.stringify(KONG_SERVICES), "KONG_TEMPLATE_CHANGED");
  return `${output.join("\n")}\n`;
}
export function renderKongConfig(template, secrets) {
  const values = { GotrueId: containerName("auth"), RestId: containerName("rest"),
    BearerToken: `$((headers.authorization ~= nil and headers.authorization:sub(1, 10) ~= 'Bearer sb_' and headers.authorization) or (headers.apikey == '${secrets.secretKey}' and 'Bearer ${secrets.serviceRoleKey}') or (headers.apikey == '${secrets.publishableKey}' and 'Bearer ${secrets.anonKey}') or headers.apikey)` };
  const rendered = template.replace(/\{\{ \.(\w+) \}\}/g, (_, key) => { assert(key in values, "KONG_TEMPLATE_KEY_MISSING"); return values[key]; });
  assert(!rendered.includes("{{"), "KONG_TEMPLATE_NOT_RENDERED");
  return rendered;
}
export function kongEntrypoint(kongConfig, embeds) {
  return ["cat <<'EOF' > /home/kong/kong.yml && \\", "cat <<'EOF' > /home/kong/custom_nginx.template && \\",
    "cat <<'EOF' > /home/kong/localhost.crt && \\", "cat <<'EOF' > /home/kong/localhost.key && \\",
    "./docker-entrypoint.sh kong docker-start --nginx-conf /home/kong/custom_nginx.template",
    heredoc(kongConfig), "EOF", heredoc(embeds.nginx), "EOF", heredoc(embeds.cert), "EOF", heredoc(embeds.certKey), "EOF", ""].join("\n");
}
export function authEnvironment(secrets) {
  const issuer = `${API_URL}/auth/v1`;
  return [`API_EXTERNAL_URL=${API_URL}`, "GOTRUE_API_HOST=0.0.0.0", "GOTRUE_API_PORT=9999",
    "GOTRUE_DB_DRIVER=postgres", `GOTRUE_DB_DATABASE_URL=${databaseUrl("supabase_auth_admin", secrets)}`,
    `GOTRUE_SITE_URL=${SITE_URL}`, "GOTRUE_URI_ALLOW_LIST=", "GOTRUE_DISABLE_SIGNUP=true",
    "GOTRUE_JWT_ADMIN_ROLES=service_role", "GOTRUE_JWT_AUD=authenticated", "GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated",
    "GOTRUE_JWT_EXP=3600", `GOTRUE_JWT_SECRET=${secrets.jwtSecret}`, `GOTRUE_JWT_ISSUER=${issuer}`,
    "GOTRUE_EXTERNAL_EMAIL_ENABLED=true", "GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED=true", "GOTRUE_MAILER_AUTOCONFIRM=true",
    "GOTRUE_MAILER_OTP_LENGTH=6", "GOTRUE_MAILER_OTP_EXP=3600", "GOTRUE_MAILER_TEMPLATE_RELOADING_ENABLED=true",
    "GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=false", "GOTRUE_SMTP_MAX_FREQUENCY=1s",
    ...["INVITE", "CONFIRMATION", "RECOVERY", "EMAIL_CHANGE"].map(kind => `GOTRUE_MAILER_URLPATHS_${kind}=${issuer}/verify`),
    "GOTRUE_RATE_LIMIT_EMAIL_SENT=360000",
    "GOTRUE_EXTERNAL_PHONE_ENABLED=false", "GOTRUE_SMS_AUTOCONFIRM=true", "GOTRUE_SMS_MAX_FREQUENCY=5s",
    "GOTRUE_SMS_OTP_EXP=6000", "GOTRUE_SMS_OTP_LENGTH=6", "GOTRUE_SMS_TEMPLATE=Your code is {{ .Code }}", "GOTRUE_SMS_TEST_OTP=",
    "GOTRUE_PASSWORD_MIN_LENGTH=12", "GOTRUE_PASSWORD_REQUIRED_CHARACTERS=",
    "GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED=true", "GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL=10",
    "GOTRUE_SECURITY_MANUAL_LINKING_ENABLED=false", "GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION=false",
    ...["PHONE_ENROLL", "PHONE_VERIFY", "TOTP_ENROLL", "TOTP_VERIFY", "WEB_AUTHN_ENROLL", "WEB_AUTHN_VERIFY"].map(factor => `GOTRUE_MFA_${factor}_ENABLED=false`),
    "GOTRUE_MFA_MAX_ENROLLED_FACTORS=10",
    "GOTRUE_RATE_LIMIT_ANONYMOUS_USERS=30", "GOTRUE_RATE_LIMIT_TOKEN_REFRESH=500", "GOTRUE_RATE_LIMIT_OTP=500",
    "GOTRUE_RATE_LIMIT_VERIFY=30", "GOTRUE_RATE_LIMIT_SMS_SENT=30", "GOTRUE_RATE_LIMIT_WEB3=30",
    `GOTRUE_JWT_KEYS=${JSON.stringify([secrets.signingKey])}`, "GOTRUE_JWT_VALIDMETHODS=HS256,RS256,ES256",
    "GOTRUE_EXTERNAL_APPLE_ENABLED=false", "GOTRUE_EXTERNAL_APPLE_CLIENT_ID=",
    // An unset env() reference reaches GoTrue verbatim, exactly as from the CLI.
    "GOTRUE_EXTERNAL_APPLE_SECRET=env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)", "GOTRUE_EXTERNAL_APPLE_SKIP_NONCE_CHECK=false",
    "GOTRUE_EXTERNAL_APPLE_EMAIL_OPTIONAL=false", `GOTRUE_EXTERNAL_APPLE_REDIRECT_URI=${issuer}/callback`,
    "GOTRUE_EXTERNAL_WEB3_SOLANA_ENABLED=false", "GOTRUE_EXTERNAL_WEB3_ETHEREUM_ENABLED=false"];
}
const loopbackPort = (port, hostPort) => ({ [`${port}/tcp`]: [{ HostIp: "127.0.0.1", HostPort: String(hostPort) }] });
const healthcheck = Test => ({ Test, Interval: 10e9, Timeout: 2e9, Retries: 3 });
// Owner decisions 2 and 3: no restart policy, D1 label only.
const serviceSpec = (service, config, hostConfig = {}) => ({ ...config, Image: IMAGES[service], Labels: { [ownerLabel]: PROJECT },
  HostConfig: { ...hostConfig, RestartPolicy: { Name: "no" }, NetworkMode: NETWORK },
  NetworkingConfig: { EndpointsConfig: { [NETWORK]: { Aliases: ALIASES[service] } } } });
export function containerSpecs(secrets, embeds) {
  const kongTemplate = trimKongTemplate(embeds.kong);
  assert(hash(kongTemplate) === KONG_TEMPLATE_HASH, "KONG_TEMPLATE_CHANGED");
  return {
    db: serviceSpec("db", { Env: [`POSTGRES_PASSWORD=${secrets.dbPassword}`, "POSTGRES_HOST=/var/run/postgresql",
      `JWT_SECRET=${secrets.jwtSecret}`, "JWT_EXP=3600"],
    Healthcheck: healthcheck(["CMD", "pg_isready", "-U", "postgres", "-h", "127.0.0.1", "-p", "5432"]),
    Entrypoint: ["sh", "-c", databaseEntrypoint(embeds, secrets.pgsodiumRootKey)] },
    { PortBindings: loopbackPort(5432, 56422), Binds: [`${VOLUME}:/var/lib/postgresql/data`] }),
    kong: serviceSpec("kong", { Env: ["KONG_DATABASE=off", "KONG_DECLARATIVE_CONFIG=/home/kong/kong.yml",
      "KONG_DNS_ORDER=LAST,A,CNAME", "KONG_PLUGINS=request-transformer,cors", "KONG_PORT_MAPS=56421:8000",
      "KONG_NGINX_PROXY_PROXY_BUFFER_SIZE=160k", "KONG_NGINX_PROXY_PROXY_BUFFERS=64 160k", "KONG_NGINX_WORKER_PROCESSES=1",
      "KONG_SSL_CERT=/home/kong/localhost.crt", "KONG_SSL_CERT_KEY=/home/kong/localhost.key"],
    Entrypoint: ["sh", "-c", kongEntrypoint(renderKongConfig(kongTemplate, secrets), embeds)],
    ExposedPorts: { "8000/tcp": {}, "8443/tcp": {}, "8088/tcp": {} } }, { PortBindings: loopbackPort(8000, 56421) }),
    auth: serviceSpec("auth", { Env: authEnvironment(secrets), ExposedPorts: { "9999/tcp": {} },
      Healthcheck: healthcheck(["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:9999/health"]) }),
    rest: serviceSpec("rest", { Env: [`PGRST_DB_URI=${databaseUrl("authenticator", secrets)}`, "PGRST_DB_SCHEMAS=public",
      "PGRST_DB_EXTRA_SEARCH_PATH=public,extensions", "PGRST_DB_MAX_ROWS=500", "PGRST_DB_ANON_ROLE=anon",
      `PGRST_JWT_SECRET=${jwks(secrets)}`, "PGRST_ADMIN_SERVER_PORT=3001"] }),
    // One-off schema job, as the CLI runs it on a new volume: no name, aliases or ports.
    authMigrate: { Image: IMAGES.auth, Cmd: ["gotrue", "migrate"], Labels: { [ownerLabel]: PROJECT }, HostConfig: { NetworkMode: NETWORK },
      Env: [`API_EXTERNAL_URL=${API_URL}`, "GOTRUE_LOG_LEVEL=error", "GOTRUE_DB_DRIVER=postgres",
        `GOTRUE_DB_DATABASE_URL=${databaseUrl("supabase_auth_admin", secrets)}`, `GOTRUE_SITE_URL=${SITE_URL}`,
        `GOTRUE_JWT_SECRET=${secrets.jwtSecret}`] },
  };
}

// Owner decision 5: SQL runs only through psql inside the db container, as the CLI's
// `postgres` role (peer map over the socket), one transaction per file with its
// history row. Owner decision 6: `statements` holds the file as one element.
export const HISTORY_TABLE_SQL = ["SET lock_timeout = '4s'", "CREATE SCHEMA IF NOT EXISTS supabase_migrations",
  "CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text NOT NULL PRIMARY KEY)",
  "ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS statements text[]",
  "ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS name text"].map(statement => `${statement};\n`).join("");
export function migrationSql(file, content) {
  const [, version, name] = /^(\d+)_([a-z0-9_]+)\.sql$/.exec(file) ?? [];
  assert(version && content.trimEnd().endsWith(";") && !content.includes("\\") && !content.includes("$d1_history$"), "MIGRATION_NOT_SAFE_FOR_PSQL");
  return `${content}\nINSERT INTO supabase_migrations.schema_migrations(version, name, statements) VALUES ('${version}', '${name}', ARRAY[$d1_history$${content}$d1_history$]);\n`;
}
export function psqlArguments(...extra) {
  return ["exec", "--interactive", containerName("db"), "psql", "--no-psqlrc", "--quiet", "--set", "ON_ERROR_STOP=1",
    "--host", "/var/run/postgresql", "--username", "postgres", "--dbname", "postgres", ...extra];
}
const psql = sql => docker(psqlArguments("--single-transaction", "--file", "-"), { input: sql, timeout: 120_000 });

// Created through the verified desktop-linux pipe, so environment and entrypoint
// secrets travel in the request body and never on a command line.
function createContainer(name, spec) {
  return new Promise((resolve, reject) => {
    const query = name ? `?name=${encodeURIComponent(name)}` : "";
    const request = http.request({ socketPath: ENDPOINT.slice("npipe://".length).replaceAll("/", "\\"), method: "POST",
      path: `/v1.44/containers/create${query}`, headers: { "Content-Type": "application/json" }, timeout: 30_000 }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { body += chunk; });
      response.on("end", () => response.statusCode === 201 ? resolve(json(body).Id)
        : reject(Object.assign(new Error(`STOP: CONTAINER_CREATE_FAILED_${response.statusCode}`), { stderr: body })));
    });
    request.on("timeout", () => request.destroy(new Error("STOP: CONTAINER_CREATE_TIMEOUT")));
    request.on("error", reject);
    request.end(JSON.stringify(spec));
  });
}
async function waitUntil(checks, seconds, code) {
  const pending = new Map(Object.entries(checks));
  for (let attempt = 0; attempt <= seconds && pending.size; attempt++) {
    if (attempt) await sleep(1000);
    for (const [name, check] of pending) if (await check()) pending.delete(name);
  }
  assert(!pending.size, `${code}_${[...pending.keys()].join("_").toUpperCase()}`);
}
const healthy = service => () => {
  const state = docker(["container", "inspect", "--format", "{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{end}}", containerName(service)]);
  return state === "true healthy";
};
const restReady = secretKey => () => fetch(`${API_URL}/rest-admin/v1/ready`, { method: "HEAD",
  headers: { apikey: secretKey }, signal: AbortSignal.timeout(10_000) }).then(response => response.status === 200, () => false);

async function startStack(snapshot, secrets) {
  const specs = containerSpecs(secrets, snapshot.embeds);
  fs.mkdirSync(path.dirname(SECRETS_FILE), { recursive: true });
  fs.writeFileSync(SECRETS_FILE, `${JSON.stringify({ project: PROJECT, ...secrets }, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  docker(["volume", "create", "--label", `${ownerLabel}=${PROJECT}`, VOLUME]);
  assert(docker(["volume", "inspect", "--format", `{{index .Labels "${ownerLabel}"}}`, VOLUME]) === PROJECT, "VOLUME_NOT_OWNED_BY_D1");
  await createContainer(containerName("db"), specs.db);
  docker(["container", "start", containerName("db")]);
  await waitUntil({ db: healthy("db") }, 120, "SERVICE_NOT_READY");
  // migrate.sh applies the CLI schema file only during initdb; _supabase is created last.
  const initialised = docker(psqlArguments("--tuples-only", "--no-align", "--command", "SELECT count(*) FROM pg_database WHERE datname = '_supabase'"));
  assert(initialised === "1", "DATABASE_INIT_SCHEMA_NOT_APPLIED");
  const job = await createContainer("", specs.authMigrate);
  try { docker(["container", "start", "--attach", job], { timeout: 120_000 }); }
  finally { docker(["container", "rm", "--force", job]); }
  psql(HISTORY_TABLE_SQL);
  for (const file of Object.keys(MIGRATIONS).sort()) {
    const bytes = fs.readFileSync(path.join(ROOT, "supabase/migrations", file));
    assert(hash(bytes) === MIGRATIONS[file], "CANONICAL_MIGRATION_CHANGED");
    psql(migrationSql(file, bytes.toString("utf8")));
  }
  for (const service of ["kong", "auth", "rest"]) {
    await createContainer(containerName(service), specs[service]);
    docker(["container", "start", containerName(service)]);
  }
  await waitUntil({ kong: healthy("kong"), auth: healthy("auth"), rest: restReady(secrets.secretKey) }, 30, "SERVICE_NOT_READY");
}

export const FAILURE_LOG = path.join(ROOT, "artifacts/d1-local/start-failure.log");
// Failure diagnostics only: this stack's keys, JWTs, API/hex keys, URL passwords and
// labelled secrets are masked before anything reaches the ignored log. Nothing is printed.
export function redactCliOutput(text, secrets) {
  const known = secrets ? [secrets.dbPassword, secrets.pgsodiumRootKey, secrets.jwtSecret, Buffer.from(secrets.jwtSecret).toString("base64url"),
    secrets.signingKey.d, secrets.anonKey, secrets.serviceRoleKey, secrets.publishableKey, secrets.secretKey] : [];
  return known.reduce((output, value) => output.replaceAll(value, "[REDACTED_STACK_SECRET]"), String(text ?? ""))
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]*/g, "[REDACTED_JWT]")
    .replace(/\bsb_(?:secret|publishable)_[\w-]+/g, "[REDACTED_KEY]")
    .replace(/\b[a-f0-9]{32,}\b/gi, "[REDACTED_HEX]")
    .replace(/(\/\/[^:/\s@]+:)[^@\s]+@/g, "$1[REDACTED]@")
    .replace(/((?:key|secret|password|token)[\w ]*?\s*[:=│|]\s*)\S+/gi, "$1[REDACTED]");
}
function writeFailureLog(error, secrets) {
  const redact = text => redactCliOutput(text, secrets);
  const lines = [`message: ${redact(String(error?.message ?? "").split(/\r?\n/)[0])}`,
    `status: ${error?.status ?? "n/a"}; code: ${error?.code ?? "n/a"}; signal: ${error?.signal ?? "none"}`,
    "--- stderr", redact(error?.stderr), "--- stdout", redact(error?.stdout)];
  fs.mkdirSync(path.dirname(FAILURE_LOG), { recursive: true });
  fs.writeFileSync(FAILURE_LOG, `${lines.join("\n")}\n`, { mode: 0o600 });
}
export function validateCommand(command, args) {
  assert(["check", "network", "start", "verify"].includes(command), "UNKNOWN_D1_COMMAND");
  assert(command === "start" ? JSON.stringify(args) === '["--allow-local-start"]' : args.length === 0, "UNEXPECTED_OR_UNAPPROVED_ARGUMENTS");
}
function report(snapshot, issues) {
  console.log(JSON.stringify({ status: issues.length ? "BLOCKED" : "READY FOR LOCAL START", issues,
    project: PROJECT, network: NETWORK, api: API_URL, database: "127.0.0.1:56422",
    freeRamGiB: +(snapshot.freeRam / 1024 ** 3).toFixed(2), totalRamGiB: +(snapshot.totalRam / 1024 ** 3).toFixed(2),
    dockerRamGiB: +(snapshot.docker.MemTotal / 1024 ** 3).toFixed(2), minimumFreeRamGiB: 4,
    cachedImages: snapshot.images, cliVersion: "2.76.10", cliSha256: CLI_HASH, cliTemplates: Object.keys(snapshot.embeds),
    gateC: "CLOSED", gateE: "UNRESOLVED", startAuthorizedByReport: false }, null, 2));
}
export async function main(command, args) {
  validateCommand(command, args); // Fail before Docker/CLI/file discovery on bad input.
  const snapshot = inspectHost(command === "verify");
  if (command === "verify") {
    assertStarted(snapshot);
    console.log("LOCAL RUNTIME VERIFIED: four D1 containers; 127.0.0.1-only ports; dedicated network without outbound NAT. No SQL/Auth connection attempted.");
    return;
  }
  const issues = evaluatePreflight(snapshot, command !== "network");
  if (command === "network") {
    // Network preparation does not consume the RAM needed for the later stack.
    const fatal = issues.filter(code => !["HOST_RAM_BELOW_4_GIB", "DOCKER_RAM_BELOW_4_GIB"].includes(code));
    assert(fatal.length === 0, fatal.join(","));
    if (!snapshot.network) docker(networkCreateArguments());
    const network = inspectNetwork();
    assert(networkIssues(network).length === 0, "NETWORK_CREATION_VERIFICATION_FAILED");
    report({ ...snapshot, network }, evaluatePreflight({ ...snapshot, network }));
    return;
  }
  report(snapshot, issues);
  if (issues.length) { process.exitCode = 1; return; }
  if (command !== "start") return;
  let failed = false, secrets;
  try {
    secrets = generateStackSecrets();
    await startStack(snapshot, secrets);
    assertStarted(inspectHost(true), snapshot.network.Id, snapshot.images);
  } catch (error) {
    failed = true;
    // Fail closed: stop only the freshly created, exactly labelled D1 containers.
    // Preserve the volume, network, keys file and every other project's container.
    const owned = inspectContainers().filter(item => item.Owner === PROJECT &&
      Object.keys(IMAGES).some(service => item.Name === `/${containerName(service)}`));
    for (const item of owned) docker(["container", "stop", item.Id]);
    try { writeFailureLog(error, secrets); console.error("Redacted failure details: artifacts/d1-local/start-failure.log"); }
    catch { console.error("Redacted failure details could not be written."); }
  }
  assert(!failed, "LOCAL_START_OR_BINDING_CHECK_FAILED_OWN_CONTAINERS_STOPPED_INSPECT_BEFORE_RETRY");
  console.log("LOCAL START VERIFIED. Keys are in artifacts/d1-local/stack-secrets.json (never printed). No app, executor LOGIN or Auth users were prepared.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await main(process.argv[2], process.argv.slice(3)); }
  catch (error) {
    console.error(error.message?.startsWith("STOP:") ? error.message : "STOP: LOCAL_INSPECTION_FAILED; no fallback or automatic repair");
    process.exitCode = 1;
  }
}
