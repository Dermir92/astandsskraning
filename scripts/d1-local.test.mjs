import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, PROJECT, NETWORK, IMAGES, MIN_FREE_RAM, MIN_DOCKER_RAM, PORTS,
  assertConfig, assertSources, cleanEnvironment, evaluatePreflight, networkIssues,
  assertStarted, parseExclusions, startArguments, validateCommand, main } from "./d1-local.mjs";

const network = () => ({ Name: NETWORK, Id: "dedicated-network-id", Driver: "bridge", Scope: "local",
  Internal: true, EnableIPv6: false, Options: { "com.docker.network.bridge.host_binding_ipv4": "127.0.0.1" },
  Labels: { "is.astandsskodun.local.project": PROJECT }, Containers: {} });
function fresh() {
  return { endpoint: "npipe:////./pipe/dockerDesktopLinuxEngine", docker: { OSType: "linux", MemTotal: MIN_DOCKER_RAM },
    freeRam: MIN_FREE_RAM, listeners: [], exclusions: [], network: network(), containers: [],
    volumes: [{ Name: "supabase_db_astandsskodun-c1" }, { Name: "supabase_db_verdid-web" }],
    networks: [{ Name: NETWORK }, { Name: "supabase_network_verdid-web" }],
    images: Object.fromEntries(Object.values(IMAGES).map(image => [image, `cached:${image}`])) };
}
function running() {
  const state = fresh();
  state.containers = Object.entries(IMAGES).map(([service, image]) => {
    const id = `id-${service}`;
    state.network.Containers[id] = { Name: `supabase_${service}_${PROJECT}` };
    const ports = service === "db" ? { "5432/tcp": [{ HostIp: "127.0.0.1", HostPort: "56422" }] }
      : service === "kong" ? { "8000/tcp": [{ HostIp: "127.0.0.1", HostPort: "56421" }] } : {};
    return { Id: id, Name: `/supabase_${service}_${PROJECT}`, Project: PROJECT, ComposeProject: PROJECT,
      Image: image, ImageId: state.images[image], Running: true, ActualPorts: structuredClone(ports),
      Ports: Object.fromEntries(Object.entries(ports).map(([port, bindings]) => [port, bindings.map(b => ({ ...b, HostIp: "" }))])),
      Networks: { [NETWORK]: { NetworkID: state.network.Id } },
      Mounts: service === "db" ? [{ Type: "volume", Name: `supabase_db_${PROJECT}`, Destination: "/var/lib/postgresql/data" }] : [] };
  });
  return state;
}

test("approved D1 config and unchanged canonical migrations are usable without dependencies or runtime", () => {
  assertSources();
  assert.equal(fs.existsSync(path.join(ROOT, "artifacts/c1-local/runtime.json")), false);
});
test("config changes cannot redirect D1, enable seeds/services or introduce hosted configuration", () => {
  const config = fs.readFileSync(path.join(ROOT, "supabase/config.toml"), "utf8");
  for (const changed of [config.replace(PROJECT, "astandsskodun-c1"), config.replace("56422", "55422"),
    config.replace("56421", "54321"), config.replace("[db.seed]\nenabled = false", "[db.seed]\nenabled = true"),
    config.replace("[studio]\nenabled = false", "[studio]\nenabled = true"), config + '\n[experimental]\ns3_host = "https://example.invalid"\n',
    config.replaceAll("\n", "\r\n")]) assert.throws(() => assertConfig(changed), /D1_CONFIG_CHANGED/);
});
test("the clean first-start plan preserves unrelated projects and the old C1 volume", () => {
  assert.deepEqual(evaluatePreflight(fresh()), []);
});
test("all dedicated ports reject listeners on any address and Windows reserved ranges", () => {
  for (const port of PORTS) {
    for (const address of ["127.0.0.1", "0.0.0.0", "::", "::1"]) {
      const state = fresh(); state.listeners.push({ LocalPort: port, LocalAddress: address });
      assert.ok(evaluatePreflight(state).includes(`PORT_${port}_BUSY`));
    }
    const state = fresh(); state.exclusions = [[port - 1, port + 1]];
    assert.ok(evaluatePreflight(state).includes(`PORT_${port}_RESERVED`));
  }
});
test("Windows range parsing handles both families and administered ranges", () => {
  assert.deepEqual(parseExclusions("Protocol tcp\nStart Port End Port\n-----\n 50000 50059 *\r\n 56400 56499\n"), [[50000, 50059], [56400, 56499]]);
});
test("first start refuses old, partial or foreign resources under the new project identity", () => {
  for (const mutate of [
    s => s.containers.push({ Name: `/${PROJECT}`, Project: "other" }),
    s => s.containers.push({ Name: "/unrelated", Project: PROJECT }),
    s => s.containers.push({ Name: "/unrelated", ComposeProject: PROJECT }),
    s => s.volumes.push({ Name: `supabase_db_${PROJECT}` }),
    s => s.volumes.push({ Name: "unexpected", Project: PROJECT }),
    s => s.networks.push({ Name: `supabase_network_${PROJECT}` }),
    s => { s.network.Containers.foreign = { Name: "foreign" }; },
  ]) { const state = fresh(); mutate(state); assert.ok(evaluatePreflight(state).length); }
});
test("memory and engine checks fail closed, and a missing cached image cannot trigger a download", () => {
  for (const [mutate, expected] of [
    [s => { s.freeRam--; }, "HOST_RAM_BELOW_4_GIB"],
    [s => { s.docker.MemTotal--; }, "DOCKER_RAM_BELOW_4_GIB"],
    [s => { s.endpoint = "tcp://example.invalid:2375"; }, "WRONG_DOCKER_ENGINE"],
    [s => { s.docker.OSType = "windows"; }, "WRONG_DOCKER_ENGINE"],
    [s => { delete s.images[IMAGES.auth]; }, "CACHED_IMAGE_MISSING_NO_PULL_ALLOWED"],
  ]) { const state = fresh(); mutate(state); assert.ok(evaluatePreflight(state).includes(expected)); }
});
test("missing networks are allowed only during preparation; unsafe existing networks are never adopted", () => {
  const state = fresh(); state.network = null;
  assert.deepEqual(evaluatePreflight(state, false), []);
  assert.deepEqual(evaluatePreflight(state), ["NETWORK_MISSING"]);
  const desktopNetwork = network();
  desktopNetwork.Options["com.docker.network.enable_ipv4"] = "true";
  desktopNetwork.Options["com.docker.network.enable_ipv6"] = "false";
  assert.deepEqual(networkIssues(desktopNetwork), []);
  for (const mutate of [
    n => { n.Name = "bridge"; }, n => { n.Driver = "overlay"; }, n => { n.Scope = "swarm"; },
    n => { n.Internal = false; }, n => { n.EnableIPv6 = true; }, n => { n.Labels = {}; },
    n => { n.Options = {}; }, n => { n.Options["com.docker.network.bridge.host_binding_ipv4"] = "0.0.0.0"; },
    n => { n.Options["com.docker.network.bridge.gateway_mode_ipv4"] = "routed"; },
    n => { n.Options["com.docker.network.enable_ipv6"] = "true"; },
  ]) { const item = network(); mutate(item); assert.ok(networkIssues(item).length); }
});
test("inherited hosted, PostgreSQL, Docker endpoint, proxy and Node overrides are removed", () => {
  const env = cleanEnvironment({ PATH: "tools", SystemRoot: "windows", USERPROFILE: "profile", DOCKER_HOST: "tcp://foreign:2375",
    DOCKER_CONTEXT: "foreign", DOCKER_CONFIG: "foreign", SUPABASE_DB_HOST: "example.invalid", SUPABASE_ACCESS_TOKEN: "fictional",
    C1_DATABASE_URL: "postgres://old", H1A_DATABASE_URL: "postgres://hosted", PGHOST: "foreign", PGSERVICE: "hosted",
    HTTP_PROXY: "http://foreign", NODE_OPTIONS: "--import=foreign", npm_config_script_shell: "foreign" });
  assert.deepEqual(env, { PATH: "tools", SystemRoot: "windows", USERPROFILE: "profile", DOCKER_CONTEXT: "desktop-linux" });
});
test("only the explicit local-start argument is accepted; no target overrides or other operations reach discovery", async () => {
  assert.deepEqual(startArguments(), ["--workdir", ROOT, "--network-id", NETWORK, "start"]);
  validateCommand("start", ["--allow-local-start"]);
  for (const [command, args] of [["start", []], ["start", ["--allow-local-start", "--db-url", "postgres://foreign"]],
    ["check", ["--linked"]], ["network", ["--network-id", "bridge"]], ["verify", ["--workdir", "old"]],
    ...["prepare", "reset", "stop", "link", "push", "deploy", "serve", "test"].map(c => [c, []])]) {
    await assert.rejects(main(command, args), /STOP: (UNKNOWN_D1_COMMAND|UNEXPECTED_OR_UNAPPROVED_ARGUMENTS)/);
  }
});
test("runtime accepts only four intended containers, effective loopback bindings and the dedicated volume", () => {
  assertStarted(running());
  assert.throws(() => assertStarted(running(), "replaced-network"), /NETWORK_REPLACED_DURING_START/);
  assert.throws(() => assertStarted(running(), network().Id, { ...fresh().images, [IMAGES.db]: "changed-cached-image" }), /UNEXPECTED_RUNTIME_IMAGE/);
});
test("runtime rejects wildcard/IPv6/extra ports, wrong network, unexpected images and old mounts", () => {
  const mutations = [
    s => { s.containers[0].ActualPorts["5432/tcp"][0].HostIp = "0.0.0.0"; },
    s => { s.containers[0].ActualPorts["5432/tcp"][0].HostIp = "::"; },
    s => { s.containers[0].ActualPorts["5432/tcp"][0].HostIp = ""; },
    s => { s.containers[0].Ports["5432/tcp"][0].HostIp = "0.0.0.0"; },
    s => { s.containers[0].ActualPorts["5432/tcp"][0].HostPort = "55422"; },
    s => { s.containers[0].ActualPorts["5432/tcp"].push({ HostIp: "::", HostPort: "56422" }); },
    s => { s.containers[1].ActualPorts["9999/tcp"] = [{ HostIp: "127.0.0.1", HostPort: "9999" }]; },
    s => { s.containers[0].Networks.bridge = { NetworkID: "foreign" }; },
    s => { s.containers[0].Networks[NETWORK].NetworkID = "foreign"; },
    s => { s.network.Containers.foreign = { Name: "foreign" }; },
    s => { s.containers.pop(); },
    s => { s.containers[0].Running = false; },
    s => { s.containers[0].Project = "astandsskodun-c1"; },
    s => { s.containers[0].ImageId = "replacement-image"; },
    s => { s.containers[0].Mounts[0].Name = "supabase_db_astandsskodun-c1"; },
    s => { s.containers[0].Mounts = [{ Type: "bind", Source: "old-data", Destination: "/var/lib/postgresql/data" }]; },
    s => { s.containers[0].Mounts = []; },
    s => { s.listeners.push({ LocalAddress: "::", LocalPort: 56421 }); },
  ];
  for (const mutate of mutations) { const state = running(); mutate(state); assert.throws(() => assertStarted(state), /STOP:/); }
});
test("every legacy C1 alias fails in the D1 worktree before resolving CLI/dependencies or reading runtime", () => {
  const scripts = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).scripts;
  for (const [alias, command] of Object.entries({ "c1:start": "start", "c1:stop": "stop", "c1:reset": "reset", "c1:prepare": "prepare", "dev:c1": "serve", "test:c1": "test" })) {
    assert.equal(scripts[alias], `node scripts/c1-local.mjs ${command}`);
    const result = spawnSync(process.execPath, ["scripts/c1-local.mjs", command], {
      cwd: ROOT, env: cleanEnvironment(), encoding: "utf8", timeout: 10_000, windowsHide: true,
    });
    assert.equal(result.status, 1, alias);
    assert.match(result.stderr, /Legacy C1 commands are disabled/, alias);
    assert.equal(result.stdout, "", alias);
  }
  assert.equal(fs.existsSync(path.join(ROOT, "supabase/.temp")), false);
  assert.equal(fs.existsSync(path.join(ROOT, "artifacts/c1-local/runtime.json")), false);
});
