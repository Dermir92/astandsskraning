import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash, createHmac, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { spawnSync } from "node:child_process";
import { ROOT, PROJECT, NETWORK, IMAGES, MIGRATIONS, MIN_FREE_RAM, MIN_DOCKER_RAM, PORTS, KONG_SERVICES, KONG_TEMPLATE_HASH,
  HISTORY_TABLE_SQL, assertConfig, assertSources, cleanEnvironment, evaluatePreflight, networkIssues,
  assertStarted, parseExclusions, networkCreateArguments, validateCommand, redactCliOutput, main,
  findCli, extractEmbeds, generateStackSecrets, jwks, containerSpecs, trimKongTemplate, databaseEntrypoint,
  migrationSql, psqlArguments, parseContainer, routeSpec, assertNoDefaultRoute, NO_EGRESS_DNS } from "./d1-local.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
let cachedEmbeds;
const embeds = () => (cachedEmbeds ??= extractEmbeds(findCli().bytes));
// SHA-256 of CLI 2.76.10's public defaults (docs/d1-c), so the values never enter this repository.
const CLI_DEFAULT_HASHES = ["a064b502e61d27e94b8717290e5e1b32e36720e9fbdf952ec81a84c07128cb37",
  "bf1725a8f98bea37e88618702e725ba84bd8acdb2647c5e0ed638bfd685791cf", "70541e07fd4f900b66e289f5be55c85f9bef1def4924a5b0c518c45ea1688c12",
  "9705102db0d5f99ee08daa19a73e510d9877a2a9add9369da247cbbe6c2a0140", "c85debb55f2f204d868cc1552c42faa143b4c675f61363ab040dd50b5b5304cd"];

const network = () => ({ Name: NETWORK, Id: "dedicated-network-id", Driver: "bridge", Scope: "local",
  Internal: false, EnableIPv6: false, Options: { "com.docker.network.bridge.host_binding_ipv4": "127.0.0.1",
    "com.docker.network.bridge.enable_ip_masquerade": "false" },
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
    return { Id: id, Name: `/supabase_${service}_${PROJECT}`, Owner: PROJECT, Project: "", ComposeProject: "",
      Image: image, ImageId: state.images[image], Running: true, RestartPolicy: "no", Dns: ["192.0.2.1"], CapAdd: null,
      ActualPorts: structuredClone(ports), Ports: structuredClone(ports),
      Networks: { [NETWORK]: { NetworkID: state.network.Id } },
      Mounts: service === "db" ? [{ Type: "volume", Name: `supabase_db_${PROJECT}`, Destination: "/var/lib/postgresql/data" }] : [] };
  });
  return state;
}

test("approved D1 config and unchanged canonical migrations are usable without dependencies or runtime", () => {
  // A running stack's keys may be present; refusing them before a first start is tested on a copy below.
  assertSources(ROOT, true);
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
    s => s.containers.push({ Name: "/auto_generated_job_name", Owner: PROJECT }),
    s => s.volumes.push({ Name: `supabase_db_${PROJECT}` }),
    s => s.volumes.push({ Name: "unexpected", Project: PROJECT }),
    s => s.volumes.push({ Name: "unexpected", Owner: PROJECT }),
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
  assert.deepEqual(networkCreateArguments(), ["network", "create", "--driver", "bridge",
    "--opt", "com.docker.network.bridge.host_binding_ipv4=127.0.0.1", "--opt", "com.docker.network.bridge.enable_ip_masquerade=false",
    "--label", `is.astandsskodun.local.project=${PROJECT}`, NETWORK]);
  // The first internal D1 network blocked Windows host ports; it is refused, never adopted or replaced.
  const previous = network(); previous.Internal = true;
  delete previous.Options["com.docker.network.bridge.enable_ip_masquerade"];
  assert.deepEqual(networkIssues(previous), ["NETWORK_EGRESS_NAT_ENABLED", "NETWORK_INTERNAL_BLOCKS_HOST_PORTS"]);
  assert.ok(evaluatePreflight({ ...fresh(), network: previous }, false).includes("NETWORK_INTERNAL_BLOCKS_HOST_PORTS"));
  for (const mutate of [
    n => { n.Name = "bridge"; }, n => { n.Driver = "overlay"; }, n => { n.Scope = "swarm"; },
    n => { n.Internal = true; }, n => { n.EnableIPv6 = true; }, n => { n.Labels = {}; },
    n => { n.Options = {}; }, n => { n.Options["com.docker.network.bridge.host_binding_ipv4"] = "0.0.0.0"; },
    n => { n.Options["com.docker.network.bridge.enable_ip_masquerade"] = "true"; },
    n => { delete n.Options["com.docker.network.bridge.enable_ip_masquerade"]; },
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
  validateCommand("start", ["--allow-local-start"]);
  for (const [command, args] of [["start", []], ["start", ["--allow-local-start", "--db-url", "postgres://foreign"]],
    ["check", ["--linked"]], ["network", ["--network-id", "bridge"]], ["verify", ["--workdir", "old"]],
    ...["prepare", "reset", "stop", "link", "push", "deploy", "serve", "test"].map(c => [c, []])]) {
    await assert.rejects(main(command, args), /STOP: (UNKNOWN_D1_COMMAND|UNEXPECTED_OR_UNAPPROVED_ARGUMENTS)/);
  }
});
test("start failure logs mask JWTs, API/hex keys, URL passwords and labelled secrets but keep the error", () => {
  const text = redactCliOutput(["ANON_KEY=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.c2lnbmF0dXJl",
    "│ Secret │ sb_secret_fictional123 │", "postgresql://postgres:fictional@127.0.0.1:56422/postgres",
    "JWT secret: fictional-jwt-value", "S3 access key 0123456789abcdef0123456789abcdef",
    "failed to connect to `host=127.0.0.1 user=postgres database=postgres`: dial error"].join("\n"));
  for (const secret of ["eyJ", "sb_secret_", ":fictional@", "fictional-jwt-value", "0123456789abcdef0123456789abcdef"]) {
    assert.ok(!text.includes(secret), secret);
  }
  assert.match(text, /host=127\.0\.0\.1 user=postgres database=postgres`: dial error/);
  const secrets = generateStackSecrets();
  const known = [secrets.dbPassword, secrets.pgsodiumRootKey, secrets.jwtSecret, Buffer.from(secrets.jwtSecret).toString("base64url"),
    secrets.signingKey.d, secrets.anonKey, secrets.serviceRoleKey, secrets.publishableKey, secrets.secretKey];
  const masked = redactCliOutput(known.map(value => `unlabelled ${value} in output`).join("\n"), secrets);
  for (const value of known) assert.ok(!masked.includes(value));
});
test("each start generates its own keys in the CLI's formats, never the public CLI defaults", () => {
  const [first, second] = [generateStackSecrets(), generateStackSecrets()];
  for (const key of ["dbPassword", "pgsodiumRootKey", "jwtSecret", "anonKey", "serviceRoleKey", "publishableKey", "secretKey"]) {
    assert.notEqual(first[key], second[key], key);
    assert.ok(!CLI_DEFAULT_HASHES.includes(sha(first[key])), key);
  }
  assert.match(first.dbPassword, /^[0-9a-f]{64}$/); // Raw in the CLI's database URLs, so URL-safe.
  assert.match(first.pgsodiumRootKey, /^[0-9a-f]{64}$/);
  assert.ok(first.jwtSecret.length >= 32);
  assert.match(first.publishableKey, /^sb_publishable_[\w-]{31}$/);
  assert.match(first.secretKey, /^sb_secret_[\w-]{31}$/);
  for (const role of ["anon", "service_role"]) {
    const token = role === "anon" ? first.anonKey : first.serviceRoleKey;
    const [header, payload, signature] = token.split(".");
    assert.deepEqual(JSON.parse(Buffer.from(header, "base64url")), { alg: "HS256", typ: "JWT" });
    assert.equal(Buffer.from(payload, "base64url").toString(), `{"iss":"supabase-demo","role":"${role}","exp":1983812996}`);
    assert.equal(createHmac("sha256", first.jwtSecret).update(`${header}.${payload}`).digest("base64url"), signature);
  }
  assert.deepEqual(Object.keys(first.signingKey), ["kty", "kid", "use", "key_ops", "alg", "ext", "d", "crv", "x", "y"]);
});
test("PostgREST's JWKS verifies what GoTrue's signing key signs and exposes no private part", () => {
  const secrets = generateStackSecrets();
  const { keys: [publicKey, oct] } = JSON.parse(jwks(secrets));
  assert.deepEqual(Object.keys(publicKey), ["kty", "kid", "use", "key_ops", "alg", "ext", "crv", "x", "y"]);
  assert.deepEqual([publicKey.kid, publicKey.key_ops, oct.kty], [secrets.signingKey.kid, ["verify"], "oct"]);
  assert.equal(Buffer.from(oct.k, "base64url").toString(), secrets.jwtSecret);
  const signature = sign("sha256", Buffer.from("payload"), { key: createPrivateKey({ key: secrets.signingKey, format: "jwk" }), dsaEncoding: "ieee-p1363" });
  assert.ok(verify("sha256", Buffer.from("payload"), { key: createPublicKey({ key: publicKey, format: "jwk" }), dsaEncoding: "ieee-p1363" }, signature));
});
test("the pinned CLI binary yields each template exactly once, and only on an exact hash", () => {
  const templates = embeds();
  assert.deepEqual(Object.keys(templates), ["schema", "webhook", "supabase", "kong", "nginx", "cert", "certKey"]);
  const bytes = Buffer.from(Object.values(templates).join("\0"));
  assert.deepEqual(extractEmbeds(bytes), templates);
  assert.throws(() => extractEmbeds(Buffer.concat([bytes, bytes])), /CLI_TEMPLATE_NOT_FOUND/);
  assert.throws(() => extractEmbeds(Buffer.from(bytes.toString().replace("pgpass", "pgpasx"))), /CLI_TEMPLATE_NOT_FOUND/);
});
test("Kong keeps only the eight routes with running upstreams and refuses a changed template", () => {
  const trimmed = trimKongTemplate(embeds().kong);
  assert.equal(sha(trimmed), KONG_TEMPLATE_HASH);
  assert.deepEqual([...trimmed.matchAll(/^ {2}- name: (\S+)$/gm)].map(match => match[1]), KONG_SERVICES);
  assert.throws(() => trimKongTemplate(embeds().kong.replace("name: graphql-v1\n", "name: graphql-v2\n")), /KONG_TEMPLATE_CHANGED/);
  assert.throws(() => trimKongTemplate(embeds().kong.replace("  - name: mcp\n", "  - name: mcp\n  - name: rest-v1\n")), /KONG_TEMPLATE_CHANGED/);
  assert.throws(() => databaseEntrypoint({ ...embeds(), webhook: "SELECT 1;\nEOF\n" }, "00"), /HEREDOC_TERMINATOR_IN_TEMPLATE/);
});
test("containers mirror the CLI except explicit 127.0.0.1 ports, no restart policy and only the D1 label", () => {
  const secrets = generateStackSecrets();
  const specs = containerSpecs(secrets, embeds());
  assert.deepEqual(Object.keys(specs), ["db", "kong", "auth", "rest", "authMigrate"]);
  for (const [service, spec] of Object.entries(specs)) {
    assert.deepEqual(spec.Labels, { "is.astandsskodun.local.project": PROJECT }, service);
    assert.equal(spec.Image, IMAGES[service === "authMigrate" ? "auth" : service]);
    assert.ok(!JSON.stringify(spec).includes("unless-stopped"));
    assert.ok(!spec.HostConfig.PublishAllPorts && !spec.HostConfig.Privileged && !spec.HostConfig.ExtraHosts && !spec.HostConfig.CapAdd);
    if (service === "authMigrate") continue;
    assert.equal(spec.HostConfig.NetworkMode, NETWORK);
    assert.deepEqual(spec.HostConfig.Dns, NO_EGRESS_DNS, service);
  }
  assert.deepEqual(specs.db.HostConfig, { PortBindings: { "5432/tcp": [{ HostIp: "127.0.0.1", HostPort: "56422" }] },
    Binds: [`supabase_db_${PROJECT}:/var/lib/postgresql/data`], RestartPolicy: { Name: "no" }, NetworkMode: NETWORK, Dns: NO_EGRESS_DNS });
  assert.deepEqual(specs.kong.HostConfig.PortBindings, { "8000/tcp": [{ HostIp: "127.0.0.1", HostPort: "56421" }] });
  for (const service of ["auth", "rest", "authMigrate"]) assert.equal(specs[service].HostConfig.PortBindings, undefined);
  // The job joins the database's namespace, which has no default route by then.
  assert.deepEqual(specs.authMigrate.HostConfig, { NetworkMode: `container:supabase_db_${PROJECT}` });
  assert.equal(specs.authMigrate.NetworkingConfig, undefined);
  assert.deepEqual(specs.authMigrate.Cmd, ["gotrue", "migrate"]);
  assert.deepEqual(specs.db.NetworkingConfig.EndpointsConfig[NETWORK].Aliases, ["db", "db.supabase.internal"]);
  assert.deepEqual(specs.db.Healthcheck, { Test: ["CMD", "pg_isready", "-U", "postgres", "-h", "127.0.0.1", "-p", "5432"], Interval: 10e9, Timeout: 2e9, Retries: 3 });
  assert.deepEqual(specs.db.Env.map(entry => entry.split("=")[0]), ["POSTGRES_PASSWORD", "POSTGRES_HOST", "JWT_SECRET", "JWT_EXP"]);
  assert.equal(specs.auth.Env.length, 63);
  assert.ok(specs.auth.Env.includes(`GOTRUE_JWT_KEYS=${JSON.stringify([secrets.signingKey])}`));
  assert.ok(specs.rest.Env.includes(`PGRST_JWT_SECRET=${jwks(secrets)}`));
  const kong = specs.kong.Entrypoint[2];
  assert.equal([...kong.matchAll(/^ {2}- name: /gm)].length, 8);
  assert.ok(kong.includes(`headers.apikey == '${secrets.secretKey}' and 'Bearer ${secrets.serviceRoleKey}'`));
  for (const missing of ["realtime-dev", "storage", "edge_runtime", "pg_meta", "analytics", "pooler", "studio"]) assert.ok(!kong.includes(missing), missing);
  assert.ok(specs.db.Entrypoint[2].includes(`\n${secrets.pgsodiumRootKey}\nEOF\n`));
});
test("egress isolation removes only the default route, with NET_ADMIN held by a short-lived helper alone", () => {
  for (const service of Object.keys(IMAGES)) {
    const remove = routeSpec(service, "del", "default");
    assert.deepEqual(remove, { Image: IMAGES.auth, User: "root", Entrypoint: ["ip"], Cmd: ["route", "del", "default"],
      Labels: { "is.astandsskodun.local.project": PROJECT },
      HostConfig: { NetworkMode: `container:supabase_${service}_${PROJECT}`, CapAdd: ["NET_ADMIN"] } });
    assert.deepEqual(routeSpec(service, "show").HostConfig, { NetworkMode: `container:supabase_${service}_${PROJECT}` });
  }
  assertNoDefaultRoute("172.19.0.0/16 dev eth0 scope link  src 172.19.0.2 \n");
  for (const routes of ["default via 172.19.0.1 dev eth0 \n172.19.0.0/16 dev eth0 scope link  src 172.19.0.2", "", "\n"]) {
    assert.throws(() => assertNoDefaultRoute(routes), /CONTAINER_HAS_DEFAULT_ROUTE/);
  }
  assert.deepEqual(NO_EGRESS_DNS, ["192.0.2.1"]); // RFC 5737 TEST-NET-1: external lookups go nowhere.
});
test("migrations run through psql inside the database container, each with its history row in one transaction", () => {
  assert.equal(HISTORY_TABLE_SQL.split(";\n").filter(Boolean).length, 5);
  for (const [file, expected] of Object.entries(MIGRATIONS)) {
    const content = fs.readFileSync(path.join(ROOT, "supabase/migrations", file), "utf8");
    assert.equal(sha(content), expected);
    const sql = migrationSql(file, content);
    const [, version, name] = /^(\d+)_(.+)\.sql$/.exec(file);
    assert.ok(sql.startsWith(content));
    assert.ok(sql.endsWith(`VALUES ('${version}', '${name}', ARRAY[$d1_history$${content}$d1_history$]);\n`));
  }
  for (const [file, content] of [["1_x.sql", "SELECT 1"], ["1_x.sql", "\\c other\nSELECT 1;"],
    ["1_x.sql", "SELECT '$d1_history$';"], ["x.sql", "SELECT 1;"], ["1_X'.sql", "SELECT 1;"]]) {
    assert.throws(() => migrationSql(file, content), /MIGRATION_NOT_SAFE_FOR_PSQL/);
  }
  const args = psqlArguments("--single-transaction", "--file", "-");
  assert.deepEqual(args.slice(0, 4), ["exec", "--interactive", `supabase_db_${PROJECT}`, "psql"]);
  assert.ok(args.join(" ").includes("--set ON_ERROR_STOP=1 --host /var/run/postgresql --username postgres --dbname postgres --single-transaction"));
  assert.ok(!args.some(arg => /56422|127\.0\.0\.1|password/i.test(arg)));
});
test("CLI link/branch state and old stack keys block a first start", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "d1-sources-"));
  try {
    fs.cpSync(path.join(ROOT, "supabase"), path.join(root, "supabase"), { recursive: true,
      filter: source => ![".temp", ".branches"].includes(path.basename(source)) });
    assertSources(root);
    fs.mkdirSync(path.join(root, "artifacts/d1-local"), { recursive: true });
    fs.writeFileSync(path.join(root, "artifacts/d1-local/stack-secrets.json"), "{}");
    assert.throws(() => assertSources(root), /OLD_STACK_SECRETS_PRESENT/);
    assertSources(root, true);
    for (const state of [".temp", ".branches"]) {
      fs.mkdirSync(path.join(root, "supabase", state));
      assert.throws(() => assertSources(root, true), /SUPABASE_STATE_OR_CUSTOM_SQL_PRESENT/);
      fs.rmSync(path.join(root, "supabase", state), { recursive: true });
    }
  } finally { fs.rmSync(root, { recursive: true }); }
});
test("runtime accepts only four intended containers, effective loopback bindings and the dedicated volume", () => {
  assertStarted(running());
  // Real D1 containers have no CLI labels, which docker inspect prints as "<no value>".
  const absent = running();
  absent.containers = absent.containers.map(({ Project, ComposeProject, ...rest }) =>
    parseContainer(JSON.stringify({ ...rest, Project: "<no value>", ComposeProject: "<no value>" })));
  assertStarted(absent);
  assert.equal(parseContainer('{"Name":"/other","Owner":"<no value>"}').Owner, "");
  assert.throws(() => assertStarted(running(), "replaced-network"), /NETWORK_REPLACED_DURING_START/);
  assert.throws(() => assertStarted(running(), network().Id, { ...fresh().images, [IMAGES.db]: "changed-cached-image" }), /UNEXPECTED_RUNTIME_IMAGE/);
});
test("runtime rejects wildcard/IPv6/extra ports, wrong network, unexpected images and old mounts", () => {
  const mutations = [
    s => { s.containers[0].ActualPorts["5432/tcp"][0].HostIp = "0.0.0.0"; },
    s => { s.containers[0].ActualPorts["5432/tcp"][0].HostIp = "::"; },
    s => { s.containers[0].ActualPorts["5432/tcp"][0].HostIp = ""; },
    s => { s.containers[0].Ports["5432/tcp"][0].HostIp = "0.0.0.0"; },
    // An empty requested HostIp is what the CLI sends and Docker Desktop publishes on 0.0.0.0.
    s => { s.containers[3].Ports["8000/tcp"][0].HostIp = ""; },
    s => { s.containers[0].RestartPolicy = "unless-stopped"; },
    s => { s.containers[0].Project = PROJECT; },
    s => { s.containers[0].ComposeProject = PROJECT; },
    s => { s.containers[0].Owner = ""; },
    s => { s.containers[1].Dns = null; },
    s => { s.containers[1].Dns = ["192.0.2.1", "1.1.1.1"]; },
    s => { s.containers[2].CapAdd = ["NET_ADMIN"]; },
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
