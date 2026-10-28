// D1 has no SQL/Auth client, credential reader, reset/link/push/deploy command,
// package installer, image pull, volume removal or global Docker mutation.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const PROJECT = "astandsskodun-docker-c1";
export const NETWORK = "astandsskodun-docker-c1-loopback";
export const CONTEXT = "desktop-linux";
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
const ownerLabel = "is.astandsskodun.local.project";
const bindingOption = "com.docker.network.bridge.host_binding_ipv4";
const runAsync = promisify(execFile);
const hash = value => createHash("sha256").update(value).digest("hex");
const assert = (condition, code) => { if (!condition) throw new Error(`STOP: ${code}`); };
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];

export function cleanEnvironment(source = process.env) {
  const keep = new Set(["path", "pathext", "systemroot", "windir", "temp", "tmp", "userprofile",
    "appdata", "localappdata", "homedrive", "homepath", "programfiles", "programfiles(x86)", "programdata", "comspec"]);
  const env = Object.fromEntries(Object.entries(source).filter(([key]) => keep.has(key.toLowerCase())));
  return { ...env, DOCKER_CONTEXT: CONTEXT };
}
const execute = (binary, args) => execFileSync(binary, args, {
  cwd: ROOT, env: cleanEnvironment(), encoding: "utf8", timeout: 30_000,
  windowsHide: true, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 ** 2,
}).trim();
const docker = args => execute("docker", ["--context", CONTEXT, ...args]);
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
  const allowed = [".gitignore", "config.toml", "migrations", ...(afterStart ? [".temp", ".branches"] : [])];
  assert(fs.readdirSync(path.join(root, "supabase")).every(name => allowed.includes(name)), "SUPABASE_STATE_OR_CUSTOM_SQL_PRESENT");
  if (afterStart && fs.existsSync(path.join(root, "supabase/.temp"))) {
    assert(fs.readdirSync(path.join(root, "supabase/.temp")).every(name => name === "cli-latest"), "LINK_OR_VERSION_OVERRIDE_PRESENT");
  }
  const inspectArtifacts = directory => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), "ARTIFACT_SYMLINK_PRESENT");
      assert(entry.name !== "runtime.json" && !entry.name.startsWith(".env"), "OLD_RUNTIME_PRESENT");
      if (entry.isDirectory()) inspectArtifacts(path.join(directory, entry.name));
    }
  };
  inspectArtifacts(path.join(root, "artifacts"));
}

export function networkIssues(network) {
  if (!network) return ["NETWORK_MISSING"];
  // Current Docker Desktop adds explicit IPv4/IPv6 defaults on creation.
  const acceptedOptions = { [bindingOption]: "127.0.0.1", "com.docker.network.enable_ipv4": "true", "com.docker.network.enable_ipv6": "false" };
  return [
    [network.Name === NETWORK, "WRONG_NETWORK_NAME"],
    [network.Driver === "bridge" && network.Scope === "local", "WRONG_NETWORK_DRIVER"],
    [network.Options?.[bindingOption] === "127.0.0.1", "NETWORK_NOT_LOOPBACK"],
    [Object.entries(network.Options ?? {}).every(([key, value]) => acceptedOptions[key] === value), "UNREVIEWED_NETWORK_OPTIONS"],
    [network.Internal === true && network.EnableIPv6 === false, "NETWORK_NOT_INTERNAL_IPV4"],
    [network.Labels?.[ownerLabel] === PROJECT, "NETWORK_NOT_OWNED_BY_D1"],
  ].filter(([ok]) => !ok).map(([, code]) => code);
}
export function evaluatePreflight(snapshot, requireNetwork = true) {
  const issues = [];
  if (snapshot.endpoint !== "npipe:////./pipe/dockerDesktopLinuxEngine" || snapshot.docker.OSType !== "linux") issues.push("WRONG_DOCKER_ENGINE");
  if (snapshot.freeRam < MIN_FREE_RAM) issues.push("HOST_RAM_BELOW_4_GIB");
  if (snapshot.docker.MemTotal < MIN_DOCKER_RAM) issues.push("DOCKER_RAM_BELOW_4_GIB");
  for (const port of PORTS) {
    if (snapshot.listeners.some(item => item.LocalPort === port)) issues.push(`PORT_${port}_BUSY`);
    if (snapshot.exclusions.some(([first, last]) => first <= port && port <= last)) issues.push(`PORT_${port}_RESERVED`);
  }
  if (snapshot.containers.some(item => item.Name.includes(PROJECT) || item.Project === PROJECT || item.ComposeProject === PROJECT)) issues.push("PROJECT_CONTAINER_EXISTS");
  if (snapshot.volumes.some(item => item.Name.includes(PROJECT) || item.Project === PROJECT || item.ComposeProject === PROJECT)) issues.push("PROJECT_VOLUME_EXISTS");
  if (snapshot.networks.some(item => item.Name !== NETWORK && (item.Name.includes(PROJECT) || item.Labels?.includes(PROJECT)))) issues.push("PROJECT_NETWORK_COLLISION");
  if (snapshot.network) {
    issues.push(...networkIssues(snapshot.network));
    if (Object.keys(snapshot.network.Containers ?? {}).length) issues.push("NETWORK_IN_USE");
  } else if (requireNetwork) issues.push("NETWORK_MISSING");
  if (!Object.values(IMAGES).every(image => snapshot.images[image])) issues.push("CACHED_IMAGE_MISSING_NO_PULL_ALLOWED");
  return issues;
}

// Read selected Docker metadata only: never inspect Config.Env or CLI status keys.
function inspectContainers() {
  const ids = docker(["ps", "--all", "--format", "{{.ID}}"]);
  if (!ids) return [];
  const format = '{"Id":"{{.Id}}","Name":"{{.Name}}","Project":"{{index .Config.Labels "com.supabase.cli.project"}}","ComposeProject":"{{index .Config.Labels "com.docker.compose.project"}}","Image":"{{.Config.Image}}","ImageId":"{{.Image}}","Running":{{.State.Running}},"Ports":{{json .HostConfig.PortBindings}},"ActualPorts":{{json .NetworkSettings.Ports}},"Networks":{{json .NetworkSettings.Networks}},"Mounts":{{json .Mounts}}}';
  return ids.split(/\r?\n/).map(id => json(docker(["inspect", "--format", format, id])));
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
function findCli() {
  const common = execute("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  const candidates = [ROOT, path.dirname(common)].map(root => path.join(root, "node_modules/supabase"));
  const installation = candidates.find(directory => fs.existsSync(path.join(directory, "bin/supabase.exe")));
  assert(installation, "PINNED_CLI_NOT_INSTALLED");
  assert(json(fs.readFileSync(path.join(installation, "package.json"), "utf8")).version === "2.76.10", "WRONG_CLI_VERSION");
  assert(json(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).devDependencies.supabase === "2.76.10", "WRONG_CLI_PIN");
  const binary = path.join(installation, "bin/supabase.exe");
  const bytes = fs.readFileSync(binary);
  assert(hash(bytes) === CLI_HASH && bytes.includes(Buffer.from("network-id")), "CLI_BINARY_OR_NETWORK_SUPPORT_CHANGED");
  return binary;
}
export function inspectHost(afterStart = false) {
  assert(process.platform === "win32", "WINDOWS_DOCKER_DESKTOP_REQUIRED");
  assertSources(ROOT, afterStart);
  assert(execute("git", ["branch", "--show-current"]) === BRANCH, "WRONG_WORKTREE_BRANCH");
  const cli = findCli(); // Hash/version only; executing --version can write CLI cache.
  const endpoint = docker(["context", "inspect", CONTEXT, "--format", "{{.Endpoints.docker.Host}}"]);
  const info = json(docker(["info", "--format", '{"OSType":"{{.OSType}}","MemTotal":{{.MemTotal}}}']));
  const windows = json(execute("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command",
    '$os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop; $ports = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Select-Object LocalAddress,LocalPort); @{FreeRam=[int64]$os.FreePhysicalMemory*1024;TotalRam=[int64]$os.TotalVisibleMemorySize*1024;Listeners=$ports} | ConvertTo-Json -Compress']));
  const exclusions = ["ipv4", "ipv6"].flatMap(family => parseExclusions(execute("netsh", ["interface", family, "show", "excludedportrange", "protocol=tcp"])));
  const volumes = docker(["volume", "ls", "--format", '{"Name":"{{.Name}}","Project":"{{.Label "com.supabase.cli.project"}}","ComposeProject":"{{.Label "com.docker.compose.project"}}"}']);
  const networks = docker(["network", "ls", "--format", '{"Name":"{{.Name}}","Labels":{{json .Labels}}}']);
  const images = {};
  for (const image of Object.values(IMAGES)) {
    try { images[image] = docker(["image", "inspect", "--format", "{{.Id}}", image]); }
    catch { images[image] = null; } // A missing image is a STOP, never an implicit pull.
  }
  return { cli, endpoint, docker: info, freeRam: windows.FreeRam, totalRam: windows.TotalRam,
    listeners: array(windows.Listeners), exclusions, containers: inspectContainers(),
    volumes: volumes ? volumes.split(/\r?\n/).map(json) : [], networks: networks.split(/\r?\n/).map(json),
    network: inspectNetwork(), images };
}

export function assertStarted(snapshot, expectedNetworkId = snapshot.network?.Id, expectedImages = snapshot.images) {
  assert(networkIssues(snapshot.network).length === 0, "UNSAFE_RUNTIME_NETWORK");
  assert(snapshot.network.Id === expectedNetworkId, "NETWORK_REPLACED_DURING_START");
  const containers = snapshot.containers.filter(item => item.Project === PROJECT || item.Name.includes(PROJECT));
  assert(containers.length === 4, "UNEXPECTED_RUNTIME_SERVICE_COUNT");
  const expectedNames = Object.keys(IMAGES).map(service => `supabase_${service}_${PROJECT}`);
  assert(Object.keys(snapshot.network.Containers ?? {}).length === 4, "UNEXPECTED_NETWORK_MEMBER");
  for (const container of containers) {
    const name = container.Name.replace(/^\//, "");
    assert(expectedNames.includes(name) && container.Project === PROJECT && container.ComposeProject === PROJECT && container.Running, "UNEXPECTED_RUNTIME_CONTAINER");
    const service = name.slice("supabase_".length, -(PROJECT.length + 1));
    assert(container.Image === IMAGES[service] && container.ImageId === expectedImages[IMAGES[service]], "UNEXPECTED_RUNTIME_IMAGE");
    assert(JSON.stringify(Object.keys(container.Networks ?? {})) === JSON.stringify([NETWORK]), "CONTAINER_ON_WRONG_NETWORK");
    assert(container.Networks[NETWORK].NetworkID === snapshot.network.Id && snapshot.network.Containers[container.Id], "NETWORK_ID_MISMATCH");
    const expectedPort = service === "db" ? ["5432/tcp", "56422"] : service === "kong" ? ["8000/tcp", "56421"] : null;
    for (const [index, ports] of [container.Ports, container.ActualPorts].entries()) {
      const published = Object.entries(ports ?? {}).filter(([, bindings]) => bindings?.length);
      assert(published.length === (expectedPort ? 1 : 0), "UNEXPECTED_PUBLISHED_PORT");
      for (const [port, bindings] of published) {
        // The CLI leaves HostConfig.HostIp empty: the network supplies its
        // default. NetworkSettings must attest the effective address explicitly.
        const safeAddress = bindings[0]?.HostIp === "127.0.0.1" || (index === 0 && bindings[0]?.HostIp === "");
        assert(port === expectedPort[0] && bindings.length === 1 && safeAddress && bindings[0].HostPort === expectedPort[1], "PUBLIC_OR_WRONG_PORT_BINDING");
      }
    }
    const mounts = container.Mounts ?? [];
    assert(mounts.every(mount => mount.Type === "volume" && service === "db" && mount.Name === `supabase_db_${PROJECT}` && mount.Destination === "/var/lib/postgresql/data"), "UNEXPECTED_RUNTIME_MOUNT");
    if (service === "db") assert(mounts.length === 1, "DATABASE_VOLUME_MISSING");
  }
  assert(!snapshot.listeners.some(item => [56421, 56422].includes(item.LocalPort) && !["127.0.0.1", "::1"].includes(item.LocalAddress)), "WINDOWS_PUBLIC_PORT_BINDING");
}
export function startArguments() {
  return ["--workdir", ROOT, "--network-id", NETWORK, "start"];
}
export function validateCommand(command, args) {
  assert(["check", "network", "start", "verify"].includes(command), "UNKNOWN_D1_COMMAND");
  assert(command === "start" ? JSON.stringify(args) === '["--allow-local-start"]' : args.length === 0, "UNEXPECTED_OR_UNAPPROVED_ARGUMENTS");
}
function report(snapshot, issues) {
  console.log(JSON.stringify({ status: issues.length ? "BLOCKED" : "READY FOR LOCAL START", issues,
    project: PROJECT, network: NETWORK, api: "http://127.0.0.1:56421", database: "127.0.0.1:56422",
    freeRamGiB: +(snapshot.freeRam / 1024 ** 3).toFixed(2), totalRamGiB: +(snapshot.totalRam / 1024 ** 3).toFixed(2),
    dockerRamGiB: +(snapshot.docker.MemTotal / 1024 ** 3).toFixed(2), minimumFreeRamGiB: 4,
    cachedImages: snapshot.images, cliVersion: "2.76.10", cliSha256: CLI_HASH,
    gateC: "CLOSED", gateE: "UNRESOLVED", startAuthorizedByReport: false }, null, 2));
}
export async function main(command, args) {
  validateCommand(command, args); // Fail before Docker/CLI/file discovery on bad input.
  const snapshot = inspectHost(command === "verify");
  if (command === "verify") {
    assertStarted(snapshot);
    console.log("LOCAL RUNTIME VERIFIED: four D1 containers; loopback ports; dedicated internal network. No SQL/Auth connection attempted.");
    return;
  }
  const issues = evaluatePreflight(snapshot, command !== "network");
  if (command === "network") {
    // Network preparation does not consume the RAM needed for the later stack.
    const fatal = issues.filter(code => !["HOST_RAM_BELOW_4_GIB", "DOCKER_RAM_BELOW_4_GIB"].includes(code));
    assert(fatal.length === 0, fatal.join(","));
    if (!snapshot.network) docker(["network", "create", "--driver", "bridge", "--internal",
      "--opt", `${bindingOption}=127.0.0.1`, "--label", `${ownerLabel}=${PROJECT}`, NETWORK]);
    const network = inspectNetwork();
    assert(networkIssues(network).length === 0, "NETWORK_CREATION_VERIFICATION_FAILED");
    report({ ...snapshot, network }, evaluatePreflight({ ...snapshot, network }));
    return;
  }
  report(snapshot, issues);
  if (issues.length) { process.exitCode = 1; return; }
  if (command !== "start") return;
  // Only this exact fixed command can reach the CLI. Capture all output because
  // even a local startup can print privileged keys. No user-supplied arguments.
  let failed = false;
  try {
    await runAsync(snapshot.cli, startArguments(), { cwd: ROOT, env: cleanEnvironment(),
      windowsHide: true, timeout: 300_000, maxBuffer: 16 * 1024 ** 2 });
    assertStarted(inspectHost(true), snapshot.network.Id, snapshot.images);
  } catch {
    failed = true;
    // Fail closed: stop only the freshly created, exactly labelled D1 containers.
    // Preserve every volume/network and every other project's container.
    const owned = inspectContainers().filter(item => item.Project === PROJECT &&
      Object.keys(IMAGES).some(service => item.Name === `/supabase_${service}_${PROJECT}`));
    for (const item of owned) docker(["container", "stop", item.Id]);
  }
  assert(!failed, "LOCAL_START_OR_BINDING_CHECK_FAILED_OWN_CONTAINERS_STOPPED_INSPECT_BEFORE_RETRY");
  console.log("LOCAL START VERIFIED. No app, credentials, executor LOGIN or Auth users were prepared. No SQL verification was performed.");
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await main(process.argv[2], process.argv.slice(3)); }
  catch (error) {
    console.error(error.message?.startsWith("STOP:") ? error.message : "STOP: LOCAL_INSPECTION_FAILED; no fallback or automatic repair");
    process.exitCode = 1;
  }
}
