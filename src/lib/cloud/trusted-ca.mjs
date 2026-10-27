// Node-only, offline trust validation. No DNS, sockets or database clients.
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { X509Certificate } from "node:crypto";
import { checkServerIdentity, createSecureContext } from "node:tls";

/** @param {Record<string, string | undefined>} env @param {string[]} [args] */
export function assertExplicitTLS(env, args = process.execArgv) {
  const overrides = ["NODE_TLS_REJECT_UNAUTHORIZED", "NODE_EXTRA_CA_CERTS", "NODE_OPTIONS",
    "SSL_CERT_FILE", "SSL_CERT_DIR", "OPENSSL_CONF"];
  if (overrides.some(name => env[name] !== undefined) ||
      args.some(arg => /^--(?:tls-|openssl-|use-(?:openssl|system|bundled)-ca)/.test(arg))) {
    throw new Error("explicit_tls_required");
  }
}

/**
 * The fingerprint identifies the X.509 certificate, not the PEM file contents.
 * @param {string} file @param {string} fingerprint @param {string} hostname
 * @param {(file: string) => string} [readCA]
 */
export function trustedTLS(file, fingerprint, hostname, readCA = file => readFileSync(file, "utf8")) {
  if (!isAbsolute(file) || file.startsWith("\\\\") || file.startsWith("//") ||
      !/^[a-fA-F0-9]{64}$/.test(fingerprint)) throw new Error("invalid_trust_configuration");
  const ca = readCA(file);
  if (!/^\s*-----BEGIN CERTIFICATE-----\r?\n[A-Za-z0-9+/=\r\n]+-----END CERTIFICATE-----\s*$/.test(ca)) {
    throw new Error("invalid_trust_configuration");
  }
  const certificate = new X509Certificate(ca);
  const now = Date.now();
  if (!certificate.ca || Date.parse(certificate.validFrom) > now || Date.parse(certificate.validTo) <= now ||
      certificate.fingerprint256.replaceAll(":", "").toLowerCase() !== fingerprint.toLowerCase()) {
    throw new Error("invalid_trust_configuration");
  }
  const options = Object.freeze({ ca, rejectUnauthorized: true, servername: hostname,
    minVersion: /** @type {const} */ ("TLSv1.2"), checkServerIdentity });
  createSecureContext(options);
  return options; // Public certificate only; never accepts or returns credentials.
}
