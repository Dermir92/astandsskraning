// Node-only implementation shared by the local launcher and server-only facade.
// No network imports, clients, DNS lookups or connection factories belong here.
import { developmentMode } from "./development-mode.mjs";
import { assertExplicitTLS, trustedTLS } from "./trusted-ca.mjs";

/** @typedef {import('./development-mode.mjs').Environment} Environment */

export class HostedConfigurationError extends Error {
  constructor() { super("h1a_configuration_unavailable"); this.name = "HostedConfigurationError"; }
}

/**
 * Validate preparation only. The result is never a permission to connect.
 * @param {Environment} [env]
 * @param {(file: string) => string} [readCA]
 */
export function hostedConfiguration(env = process.env, readCA) {
  try {
    if (developmentMode(env) !== "h1a-hosted") throw new HostedConfigurationError();
    // Do not inherit a process-wide TLS bypass or alternate CA configuration.
    assertExplicitTLS(env);
    if (Object.keys(env).some(name => name.startsWith("NEXT_PUBLIC_H1A_") && env[name] !== undefined)) {
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
    trustedTLS(env.H1A_DB_CA_FILE ?? "", env.H1A_DB_CA_SHA256 ?? "", host, readCA);
    // Discard validated inputs. Returning credentials with cosmetic toJSON/inspect
    // hooks leaks through nested objects, spread, structuredClone and hook bypasses.
    // No application database options/factory are exposed in preparation mode.
    return Object.freeze({ mode: /** @type {const} */ ("h1a-hosted"),
      access: /** @type {const} */ ("disabled"), configuration: /** @type {const} */ ("valid") });
  } catch {
    // Never attach a URL, path, PEM, input value or original error/cause.
    throw new HostedConfigurationError();
  }
}
