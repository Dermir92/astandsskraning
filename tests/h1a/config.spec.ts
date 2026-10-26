import { expect, test } from "@playwright/test";
import { X509Certificate } from "node:crypto";
import { checkServerIdentity, type PeerCertificate } from "node:tls";
import { inspect } from "node:util";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { developmentMode, h1aLocalRequest } from "../../src/lib/cloud/development-mode.mjs";
import { hostedConfiguration, HostedConfigurationError } from "../../src/lib/cloud/hosted-config.mjs";
import { fixture, testCA } from "./fixtures";

test("modes are explicit, mutually exclusive and development-only", () => {
  expect(developmentMode({ NODE_ENV: "development" })).toBe("demo");
  expect(developmentMode({ NODE_ENV: "development", C1_LOCAL_PROOF: "1" })).toBe("c1-local");
  expect(developmentMode(fixture())).toBe("h1a-hosted");
  expect(developmentMode({ ...fixture(), C1_LOCAL_PROOF: "1" })).toBe("disabled");
  expect(developmentMode({ ...fixture(), H1A_HOSTED_PREPARATION: "true" })).toBe("disabled");
  for (const NODE_ENV of ["production", "test", undefined]) {
    expect(developmentMode({ ...fixture(), NODE_ENV, C1_LOCAL_PROOF: "1" })).toBe("demo");
  }
});

test("session configuration pins TLS, hostname and role without a connection", () => {
  const env = fixture(), config = hostedConfiguration(env, () => testCA);
  expect(config.access).toBe("disabled");
  expect(config.postgres).toMatchObject({ host: env.H1A_POOLER_HOST, port: 5432, database: "postgres",
    username: `c1_executor.${env.H1A_PROJECT_REF}`, max: 2, debug: false });
  expect(config.postgres.ssl).toMatchObject({ ca: testCA, rejectUnauthorized: true,
    servername: env.H1A_POOLER_HOST, minVersion: "TLSv1.2" });
  expect(config.postgres.ssl.checkServerIdentity).toBe(checkServerIdentity);
  const peer = { subjectaltname: `DNS:${env.H1A_POOLER_HOST}` } as PeerCertificate;
  expect(config.postgres.ssl.checkServerIdentity(env.H1A_POOLER_HOST, peer)).toBeUndefined();
  expect(config.postgres.ssl.checkServerIdentity("wrong.example", peer)).toBeInstanceOf(Error);
  expect(Object.isFrozen(config.postgres.ssl)).toBe(true);
  expect(JSON.stringify(config)).not.toContain("synthetic-unusable-fixture");
  expect(inspect(config)).not.toContain(env.H1A_PUBLISHABLE_KEY);
});

for (const name of Object.keys(fixture()).filter(name => name.startsWith("H1A_"))) {
  test(`missing ${name} fails closed`, () => {
    const env: Record<string, string | undefined> = fixture(); delete env[name];
    expect(() => hostedConfiguration(env, () => testCA)).toThrow(HostedConfigurationError);
  });
}

const invalid: [string, Record<string, string>][] = [
  ["disabled mode", { H1A_HOSTED_PREPARATION: "0" }],
  ["production", { NODE_ENV: "production" }],
  ["C1 overlap", { C1_LOCAL_PROOF: "1" }],
  ["wrong project URL", { H1A_SUPABASE_URL: "https://other.supabase.co" }],
  ["HTTP API", { H1A_SUPABASE_URL: "http://abcdefghijklmnopqrst.supabase.co" }],
  ["URL credentials", { H1A_SUPABASE_URL: "https://user@abcdefghijklmnopqrst.supabase.co" }],
  ["secret API key", { H1A_PUBLISHABLE_KEY: "sb_secret_not_allowed_here" }],
  ["legacy key", { H1A_PUBLISHABLE_KEY: "eyJ.synthetic.legacy" }],
  ["key whitespace", { H1A_PUBLISHABLE_KEY: "sb_publishable_H1aSyntheticFixtureOnly\n" }],
  ["transaction mode", { H1A_DB_MODE: "transaction" }],
  ["direct mode", { H1A_DB_MODE: "direct" }],
  ["pooler suffix attack", { H1A_POOLER_HOST: "aws-7-eu-west-3.pooler.supabase.com.evil.test" }],
  ["loopback host", { H1A_POOLER_HOST: "127.0.0.1" }],
  ["raw IPv6", { H1A_POOLER_HOST: "[::1]" }],
  ["non-DNS host", { H1A_POOLER_HOST: "https://aws-7-eu-west-3.pooler.supabase.com" }],
  ["oversized DNS label", { H1A_POOLER_HOST: `aws-7-${"a".repeat(64)}-3.pooler.supabase.com` }],
  ["host mismatch", { H1A_POOLER_HOST: "aws-8-eu-west-3.pooler.supabase.com" }],
  ["TLS require", { H1A_DB_TLS: "require" }],
  ["TLS prefer", { H1A_DB_TLS: "prefer" }],
  ["TLS disabled", { H1A_DB_TLS: "disable" }],
  ["process TLS bypass", { NODE_TLS_REJECT_UNAUTHORIZED: "0" }],
  ["alternate CA injection", { NODE_EXTRA_CA_CERTS: "other.crt" }],
  ["public environment alias", { NEXT_PUBLIC_H1A_DATABASE_URL: "forbidden" }],
  ["relative CA path", { H1A_DB_CA_FILE: "relative.crt" }],
  ["network CA path", { H1A_DB_CA_FILE: "\\\\untrusted.test\\share\\ca.crt" }],
  ["untrusted fingerprint", { H1A_DB_CA_SHA256: "0".repeat(64) }],
];
for (const [name, overrides] of invalid) test(`rejects ${name}`, () => {
  expect(() => hostedConfiguration({ ...fixture(), ...overrides }, () => testCA)).toThrow("h1a_configuration_unavailable");
});

for (const [name, mutate] of [
  ["transaction port", (value: string) => value.replace(":5432/", ":6543/")],
  ["missing port", (value: string) => value.replace(":5432/", "/")],
  ["administrator role", (value: string) => value.replace("c1_executor.", "postgres.")],
  ["missing project suffix", (value: string) => value.replace(".abcdefghijklmnopqrst:", ":")],
  ["wrong project suffix", (value: string) => value.replace(".abcdefghijklmnopqrst:", ".tsrqponmlkjihgfedcba:")],
  ["missing password", (value: string) => value.replace(":synthetic-unusable-fixture@", "@")],
  ["TLS URL override", (value: string) => `${value}?sslmode=disable`],
  ["host URL override", (value: string) => `${value}?host=evil.test`],
  ["URL fragment", (value: string) => `${value}#ssl=disable`],
  ["malformed URL", () => "not a connection string"],
  ["wrong database", (value: string) => value.replace("/postgres", "/template1")],
  ["wrong protocol", (value: string) => value.replace("postgresql:", "https:")],
] as const) test(`rejects database ${name}`, () => {
  const env = fixture(); env.H1A_DATABASE_URL = mutate(env.H1A_DATABASE_URL);
  expect(() => hostedConfiguration(env, () => testCA)).toThrow(HostedConfigurationError);
});

test("unreadable, malformed, expired or mixed CA material is rejected without echoing input", () => {
  for (const read of [() => { throw new Error("private-file-system-detail"); }, () => "bad PEM",
    () => `${testCA}\n${testCA}`, () => `${testCA}\n-----BEGIN PRIVATE KEY-----`]) {
    expect(() => hostedConfiguration(fixture(), read)).toThrow(/^h1a_configuration_unavailable$/);
  }
  const now = Date.now;
  try {
    Date.now = () => Date.parse(new X509Certificate(testCA).validTo) + 1;
    expect(() => hostedConfiguration(fixture(), () => testCA)).toThrow(HostedConfigurationError);
  } finally { Date.now = now; }
});

test("local request boundary rejects alternate hosts, ports, origins and forwarded-host spoofing", () => {
  expect(h1aLocalRequest(new Headers({ host: "127.0.0.1:3101" }))).toBe(true);
  const rejected: Record<string, string>[] = [{ host: "localhost:3101" }, { host: "127.0.0.1:3000" },
    { host: "evil.test", "x-forwarded-host": "127.0.0.1:3101" },
    { host: "127.0.0.1:3101", origin: "https://evil.test" }];
  for (const headers of rejected) {
    expect(h1aLocalRequest(new Headers(headers))).toBe(false);
  }
});

test("launcher rejects missing configuration and extra bind arguments without echoing values", async () => {
  const run = promisify(execFile);
  for (const args of [["check"], ["serve", "--hostname", "0.0.0.0"]]) {
    const result = await run(process.execPath, ["scripts/h1a-hosted.mjs", ...args], {
      env: { ...process.env, NODE_ENV: "development", H1A_PROJECT_REF: "", H1A_DATABASE_URL: "DO-NOT-ECHO" },
    }).then(() => null, error => ({ code: error.code, output: `${error.stdout}${error.stderr}` }));
    expect(result?.code).toBe(1);
    expect(result?.output).toBe("H1a configuration unavailable. No server or hosted connection started.\n");
  }
});
