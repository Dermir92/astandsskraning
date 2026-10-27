// Standalone Node CLI support only. Never imported by the application.
import { connect } from "node:net";
import { assertExplicitTLS, trustedTLS } from "./trusted-ca.mjs";
import { verifyPostgresTLS, TLSProbeError } from "./postgres-tls.mjs";

export const APPROVED_TLS_TARGET = Object.freeze({
  projectRef: "ozcxjphzzwekpwsbglaf",
  host: "aws-1-eu-west-3.pooler.supabase.com", port: 5432,
  caSHA256: "807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa",
});

export class TLSConfigurationError extends Error {
  constructor() { super("h1b_tls_configuration_unavailable"); this.name = "TLSConfigurationError"; }
}

/** Offline only; the operator supplies one absolute public CA path, no credentials.
 * @param {string} caFile @param {Record<string, string | undefined>} [env]
 */
export function checkHostedTLSConfiguration(caFile, env = process.env) {
  try {
    assertExplicitTLS(env);
    return trustedTLS(caFile, APPROVED_TLS_TARGET.caSHA256, APPROVED_TLS_TARGET.host);
  } catch { throw new TLSConfigurationError(); }
}

/** No socket or DNS lookup unless explicitly opted in. No caller-selected host.
 * @param {string} caFile @param {boolean} [allowNetwork]
 * @param {Record<string, string | undefined>} [env]
 */
export async function probeHostedTLS(caFile, allowNetwork = false, env = process.env) {
  if (allowNetwork !== true) throw new Error("h1b_tls_network_not_authorized");
  const options = checkHostedTLSConfiguration(caFile, env);
  try {
    return await verifyPostgresTLS(connect({ host: APPROVED_TLS_TARGET.host, port: APPROVED_TLS_TARGET.port }), options);
  } catch { throw new TLSProbeError(); }
}
