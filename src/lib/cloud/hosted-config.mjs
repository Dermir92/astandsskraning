// Node-only implementation shared by the local launcher and server-only facade.
// No network imports, clients, DNS lookups or connection factories belong here.
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { X509Certificate } from "node:crypto";
import { checkServerIdentity, createSecureContext } from "node:tls";
import { developmentMode } from "./development-mode.mjs";

/** @typedef {import('./development-mode.mjs').Environment} Environment */

export class HostedConfigurationError extends Error {
  constructor() { super("h1a_configuration_unavailable"); this.name = "HostedConfigurationError"; }
}

/**
 * Validate preparation only. The result is never a permission to connect.
 * @param {Environment} [env]
 * @param {(file: string) => string} [readCA]
 */
export function hostedConfiguration(env = process.env, readCA = file => readFileSync(file, "utf8")) {
  try {
    if (developmentMode(env) !== "h1a-hosted") throw new HostedConfigurationError();
    // Do not inherit a process-wide TLS bypass or alternate CA configuration.
    if (env.NODE_TLS_REJECT_UNAUTHORIZED !== undefined || env.NODE_EXTRA_CA_CERTS !== undefined ||
        Object.keys(env).some(name => name.startsWith("NEXT_PUBLIC_H1A_") && env[name] !== undefined)) {
      throw new HostedConfigurationError();
    }
    const ref = env.H1A_PROJECT_REF ?? "";
    const url = env.H1A_SUPABASE_URL ?? "";
    const key = env.H1A_PUBLISHABLE_KEY ?? "";
    const host = env.H1A_POOLER_HOST ?? "";
    if (!/^[a-z0-9]{20}$/.test(ref) || ref !== ref.trim() || url !== `https://${ref}.supabase.co` ||
        !/^sb_publishable_[A-Za-z0-9_-]{16,200}$/.test(key) || key !== key.trim() ||
        !/^aws-[0-9]+-[a-z0-9]+(?:-[a-z0-9]+)+\.pooler\.supabase\.com$/.test(host) ||
        host.length > 253 || host.split(".").some(label => label.length > 63) ||
        env.H1A_DB_MODE !== "session" || env.H1A_DB_TLS !== "verify-full") {
      throw new HostedConfigurationError();
    }
    const rawDatabase = env.H1A_DATABASE_URL ?? "";
    const database = new URL(rawDatabase);
    const username = `c1_executor.${ref}`;
    if (!['postgres:', 'postgresql:'].includes(database.protocol) ||
        database.hostname !== host || database.port !== "5432" ||
        decodeURIComponent(database.username) !== username || database.pathname !== "/postgres" ||
        !database.password || /[\s\u0000-\u001f\u007f]/.test(decodeURIComponent(database.password)) ||
        rawDatabase !== rawDatabase.trim() || rawDatabase.includes("?") || rawDatabase.includes("#")) {
      throw new HostedConfigurationError();
    }
    const file = env.H1A_DB_CA_FILE ?? "";
    const fingerprint = env.H1A_DB_CA_SHA256 ?? "";
    if (!isAbsolute(file) || file.startsWith("\\\\") || file.startsWith("//") ||
        !/^[a-fA-F0-9]{64}$/.test(fingerprint)) throw new HostedConfigurationError();
    const ca = readCA(file);
    // Exactly one explicitly trusted CA. No private keys or extra PEM payloads.
    if (!/^\s*-----BEGIN CERTIFICATE-----\r?\n[A-Za-z0-9+/=\r\n]+-----END CERTIFICATE-----\s*$/.test(ca)) {
      throw new HostedConfigurationError();
    }
    const certificate = new X509Certificate(ca);
    const now = Date.now();
    if (!certificate.ca || Date.parse(certificate.validFrom) > now || Date.parse(certificate.validTo) <= now ||
        certificate.fingerprint256.replaceAll(":", "").toLowerCase() !== fingerprint.toLowerCase()) {
      throw new HostedConfigurationError();
    }
    const ssl = Object.freeze({ ca, rejectUnauthorized: true, servername: host,
      minVersion: /** @type {const} */ ("TLSv1.2"), checkServerIdentity });
    createSecureContext(ssl); // Parse/validate locally; this opens no socket.
    const config = {
      mode: /** @type {const} */ ("h1a-hosted"), access: /** @type {const} */ ("disabled"),
      url, key,
      // Explicit fields prevent URL parameters and PG* defaults overriding TLS or identity.
      postgres: Object.freeze({ host, port: 5432, database: "postgres", username,
        password: decodeURIComponent(database.password), ssl, max: 2, prepare: true,
        idle_timeout: 20, connect_timeout: 5, debug: false, onnotice: () => {},
        connection: Object.freeze({ application_name: "astandsskodun-h1", statement_timeout: 10000 }) }),
    };
    // Accidental normal logging/JSON serialization must not print credentials.
    const redacted = () => ({ mode: config.mode, access: config.access, configuration: "redacted" });
    Object.defineProperty(config, "toJSON", { value: redacted });
    Object.defineProperty(config, Symbol.for("nodejs.util.inspect.custom"), { value: redacted });
    return Object.freeze(config);
  } catch {
    // Never attach a URL, path, PEM, input value or original error/cause.
    throw new HostedConfigurationError();
  }
}
