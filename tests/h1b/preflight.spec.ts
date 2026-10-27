import { expect, test } from "@playwright/test";
import { X509Certificate } from "node:crypto";
import { inspect } from "node:util";
import { createServer } from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { checkServerIdentity } from "node:tls";
import { hostedConfiguration } from "../../src/lib/cloud/hosted-config.mjs";
import { developmentMode } from "../../src/lib/cloud/development-mode.mjs";
import { assertExplicitTLS, trustedTLS } from "../../src/lib/cloud/trusted-ca.mjs";
import { APPROVED_TLS_TARGET, checkHostedTLSConfiguration, probeHostedTLS } from "../../src/lib/cloud/hosted-tls-preflight.mjs";
import { verifyPostgresTLS } from "../../src/lib/cloud/postgres-tls.mjs";
import { assertHostedLoopback, bindHostedLoopback } from "../../src/lib/cloud/loopback-binding.mjs";
import { fixture, testCA } from "../h1a/fixtures";
import { certificates, postgresPeer } from "./tls-fixture";

let material: Awaited<ReturnType<typeof certificates>>;
test.beforeAll(async () => { material = await certificates(); });
test.afterAll(async () => { await material?.cleanup(); });
const trust = (host: string = APPROVED_TLS_TARGET.host) => trustedTLS(material.caFile, material.fingerprint, host);

test("approved live target and fingerprint are fixed; an arbitrary CA cannot satisfy hosted configuration", () => {
  expect(APPROVED_TLS_TARGET).toEqual({ projectRef: "ozcxjphzzwekpwsbglaf",
    host: "aws-1-eu-west-3.pooler.supabase.com", port: 5432,
    caSHA256: "807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa" });
  expect(Object.isFrozen(APPROVED_TLS_TARGET)).toBe(true);
  expect(() => checkHostedTLSConfiguration(material.caFile, {})).toThrow(/^h1b_tls_configuration_unavailable$/);
});

test("missing, malformed, mixed and mismatched trust fail without exposing configuration", () => {
  for (const file of ["", "relative.crt", "\\\\server\\share\\ca.crt", `${material.caFile}.missing`]) {
    expect(() => checkHostedTLSConfiguration(file, {})).toThrow(/^h1b_tls_configuration_unavailable$/);
  }
  for (const ca of ["bad PEM", `${material.ca}\n${material.ca}`, "-----BEGIN PRIVATE KEY-----\nDO-NOT-ECHO"]) {
    expect(() => trustedTLS(material.caFile, material.fingerprint, APPROVED_TLS_TARGET.host, () => ca)).toThrow();
  }
  for (const fingerprint of ["", "bad", "0".repeat(64)]) {
    expect(() => trustedTLS(material.caFile, fingerprint, APPROVED_TLS_TARGET.host)).toThrow();
  }
});

test("expired and not-yet-valid CA certificates fail offline", () => {
  const cert = new X509Certificate(material.ca), now = Date.now;
  try {
    for (const time of [Date.parse(cert.validFrom) - 1, Date.parse(cert.validTo) + 1]) {
      Date.now = () => time;
      expect(() => trust()).toThrow();
    }
  } finally { Date.now = now; }
});

test("process-wide trust or TLS bypasses are rejected in both preparation paths", () => {
  for (const name of ["NODE_TLS_REJECT_UNAUTHORIZED", "NODE_EXTRA_CA_CERTS", "NODE_OPTIONS", "SSL_CERT_FILE", "SSL_CERT_DIR", "OPENSSL_CONF"]) {
    expect(() => assertExplicitTLS({ [name]: "DO-NOT-ECHO" }, [])).toThrow(/^explicit_tls_required$/);
    expect(() => hostedConfiguration({ ...fixture(), [name]: "DO-NOT-ECHO" }, () => testCA)).toThrow(/^h1a_configuration_unavailable$/);
    expect(() => checkHostedTLSConfiguration(material.caFile, { [name]: "DO-NOT-ECHO" })).toThrow(/^h1b_tls_configuration_unavailable$/);
  }
  for (const arg of ["--tls-min-v1.0", "--use-openssl-ca", "--openssl-config=anything"]) {
    expect(() => assertExplicitTLS({}, [arg])).toThrow();
  }
});

test("network access requires opt-in before even reading configuration; CLI rejects overrides", async () => {
  for (const value of [undefined, false]) {
    await expect(probeHostedTLS("DO-NOT-READ", value, {})).rejects.toThrow(/^h1b_tls_network_not_authorized$/);
  }
  const run = promisify(execFile);
  for (const args of [[], ["probe", "--ca-file", material.caFile],
    ["check", "--ca-file", material.caFile, "--host", "evil.test"],
    ["check", "--ca-file", "DO-NOT-ECHO"]]) {
    const result = await run(process.execPath, ["scripts/h1b-tls-preflight.mjs", ...args], { windowsHide: true })
      .then(() => null, error => ({ code: error.code, output: `${error.stdout}${error.stderr}` }));
    expect(result).toEqual({ code: 1, output: "H1b TLS preflight unavailable. No application access enabled.\n" });
  }
});

test("real loopback PostgreSQL SSL negotiation verifies chain and hostname, sends no authentication", async () => {
  const peer = await postgresPeer(material);
  try {
    const options = trust();
    expect(options.rejectUnauthorized).toBe(true);
    expect(options.checkServerIdentity).toBe(checkServerIdentity);
    expect(options.minVersion).toBe("TLSv1.2");
    expect(Object.isFrozen(options)).toBe(true);
    const result = await verifyPostgresTLS(peer.socket(), options);
    expect(result).toMatchObject({ tls: "verified", databaseAuthentication: "not-attempted", applicationAccess: "disabled" });
    expect(peer.requests).toEqual([Buffer.from([0, 0, 0, 8, 4, 210, 22, 47])]);
    expect(peer.applicationData).toEqual([]);
  } finally { await peer.close(); }
});

test("wrong hostname and an untrusted server chain fail the real local handshake", async () => {
  for (const options of [trust("wrong.example"), trustedTLS(material.caFile,
    new X509Certificate(testCA).fingerprint256.replaceAll(":", ""), APPROVED_TLS_TARGET.host, () => testCA)]) {
    const peer = await postgresPeer(material);
    try {
      await expect(verifyPostgresTLS(peer.socket(), options)).rejects.toThrow(/^h1b_tls_probe_failed$/);
      expect(peer.applicationData).toEqual([]);
    } finally { await peer.close(); }
  }
});

test("an expired peer certificate fails the real local handshake", async () => {
  const peer = await postgresPeer({ ...material, cert: material.expiredCert });
  try {
    await expect(verifyPostgresTLS(peer.socket(), trust())).rejects.toThrow(/^h1b_tls_probe_failed$/);
    expect(peer.applicationData).toEqual([]);
  } finally { await peer.close(); }
});

test("plaintext refusal, malformed SSL response and a stalled peer fail closed within the deadline", async () => {
  for (const reply of ["N", "invalid", "silent", "stall-tls"]) {
    const peer = await postgresPeer(material, reply);
    try {
      await expect(verifyPostgresTLS(peer.socket(), trust(), 200)).rejects.toThrow(/^h1b_tls_probe_failed$/);
      expect(peer.applicationData).toEqual([]);
    } finally { await peer.close(); }
  }
});

test("protocol engine rejects verification bypasses before sending protocol data", async () => {
  for (const override of [{ rejectUnauthorized: false }, { minVersion: "TLSv1" }, { checkServerIdentity: () => undefined }]) {
    const peer = await postgresPeer(material);
    try {
      const options = { ...trust(), ...override } as ReturnType<typeof trust>;
      await expect(verifyPostgresTLS(peer.socket(), options)).rejects.toThrow(/^h1b_tls_probe_failed$/);
      expect(peer.requests).toEqual([]);
    } finally { await peer.close(); }
  }
});

test("TLS 1.2 is accepted and TLS 1.1 cannot downgrade the connection", async () => {
  for (const maxVersion of ["TLSv1.2", "TLSv1.1"] as const) {
    const peer = await postgresPeer(material, "S", maxVersion);
    try {
      const result = verifyPostgresTLS(peer.socket(), trust());
      if (maxVersion === "TLSv1.2") expect(await result).toMatchObject({ tls: "verified", protocol: "TLSv1.2" });
      else await expect(result).rejects.toThrow(/^h1b_tls_probe_failed$/);
    } finally { await peer.close(); }
  }
});

test("configuration has no credential-bearing descendants even when redaction hooks are bypassed", () => {
  const config = hostedConfiguration(fixture(), () => testCA);
  const representations = [config, { ...config }, structuredClone(config), { nested: config }, Object.entries(config)];
  for (const value of representations) {
    for (const text of [JSON.stringify(value), inspect(value, { customInspect: false, depth: null })]) {
      expect(text).not.toContain("synthetic-unusable-fixture");
      expect(text).not.toContain(fixture().H1A_PUBLISHABLE_KEY);
      expect(text).not.toContain(fixture().H1A_DATABASE_URL);
    }
  }
  expect(Reflect.ownKeys(config).sort()).toEqual(["access", "configuration", "mode"]);
});

test("loopback gate inspects the real listener and rejects wildcard, wrong port and closed listeners", async () => {
  const approved = createServer();
  try {
    expect(() => assertHostedLoopback(approved)).toThrow();
    await bindHostedLoopback(approved);
    expect(() => assertHostedLoopback(approved)).not.toThrow();
  } finally { await new Promise<void>(resolve => approved.close(() => resolve())); }
  expect(() => assertHostedLoopback(approved)).toThrow();
  for (const host of ["0.0.0.0", "127.0.0.1"]) {
    const other = createServer();
    try {
      await new Promise<void>(resolve => other.listen(host === "0.0.0.0" ? 3101 : 0, host, resolve));
      expect(() => assertHostedLoopback(other)).toThrow(/^hosted_loopback_required$/);
    } finally { await new Promise<void>(resolve => other.close(() => resolve())); }
  }
});

test("TLS preflight has no application mode or activation flag", () => {
  expect(developmentMode({ NODE_ENV: "development", H1B_TLS_PREFLIGHT: "1" })).toBe("demo");
  expect(developmentMode({ ...fixture(), C1_LOCAL_PROOF: "1" })).toBe("disabled");
  expect(developmentMode({ ...fixture(), NODE_ENV: "production" })).toBe("demo");
});
