import { connect as connectTLS, checkServerIdentity } from "node:tls";

export class TLSProbeError extends Error {
  constructor() { super("h1b_tls_probe_failed"); this.name = "TLSProbeError"; }
}

/**
 * Protocol engine with no endpoint selection or connection creation. Tests supply
 * a synthetic loopback socket; only the separately opted-in CLI opens a hosted one.
 * Send PostgreSQL SSLRequest, verify TLS, then close WITHOUT a StartupMessage,
 * username, password, query or Auth request. One deadline covers TCP/DNS and TLS.
 * @param {import('node:net').Socket} socket
 * @param {ReturnType<import('./trusted-ca.mjs').trustedTLS>} options
 * @param {number} [timeoutMs]
 */
export function verifyPostgresTLS(socket, options, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let tls;
    let finished = false;
    const timer = setTimeout(fail, Math.min(5000, Math.max(1, timeoutMs)));
    function cleanup() {
      clearTimeout(timer);
      // Retain error handlers during destruction; never leak raw TLS diagnostics.
      // A TLSSocket owns the underlying transport after wrapping. Destroy only
      // that owner; destroying both during a failed handshake races on Windows.
      if (tls) tls.destroy();
      else socket.destroy();
    }
    function fail() {
      if (finished) return;
      finished = true; cleanup(); reject(new TLSProbeError());
    }
    socket.on("error", fail);
    socket.once("close", () => { if (!finished) fail(); });
    if (options.rejectUnauthorized !== true || options.checkServerIdentity !== checkServerIdentity ||
        options.minVersion !== "TLSv1.2" || !options.ca || !options.servername) return fail();
    socket.once("data", data => {
      if (data.length !== 1 || data[0] !== 83) return fail(); // Exactly 'S'; no plaintext fallback.
      try {
        tls = connectTLS({ ...options, socket });
        tls.on("error", fail);
        tls.once("close", () => { if (!finished) fail(); });
        tls.once("secureConnect", () => {
          try {
            const protocol = tls.getProtocol();
            if (!tls.authorized || checkServerIdentity(options.servername, tls.getPeerCertificate()) ||
                !["TLSv1.2", "TLSv1.3"].includes(protocol)) return fail();
            finished = true; cleanup();
            resolve(Object.freeze({ tls: "verified", protocol,
              databaseAuthentication: "not-attempted", applicationAccess: "disabled" }));
          } catch { fail(); }
        });
      } catch { fail(); }
    });
    const requestSSL = () => {
      const request = Buffer.alloc(8);
      request.writeInt32BE(8, 0); request.writeInt32BE(80877103, 4);
      socket.write(request);
    };
    if (socket.connecting) socket.once("connect", requestSSL);
    else requestSSL();
  });
}
