import { createServer } from "node:http";
import { hostedConfiguration } from "../src/lib/cloud/hosted-config.mjs";
import { assertHostedLoopback, bindHostedLoopback, HOSTED_BINDING } from "../src/lib/cloud/loopback-binding.mjs";

// The listener is created and attested before loading/preparing the framework.
// This process still has NO hosted Auth/API/database transport.
let app;
let handle;
const server = createServer((req, res) => {
  try {
    assertHostedLoopback(server);
    if (req.socket.localAddress !== HOSTED_BINDING.host || !handle) throw new Error();
    Promise.resolve(handle(req, res)).catch(() => { res.destroy(); });
  } catch { res.writeHead(503); res.end(); }
});
try {
  if (process.argv.length !== 2) throw new Error();
  hostedConfiguration();
  await bindHostedLoopback(server);
  const { default: next } = await import("next");
  // Webpack supports Next's WASM fallback when Windows blocks the native SWC
  // binary. This changes only the isolated preparation server's bundler.
  app = next({ dev: true, webpack: true, hostname: HOSTED_BINDING.host, port: HOSTED_BINDING.port, httpServer: server });
  await app.prepare();
  assertHostedLoopback(server);
  handle = app.getRequestHandler();
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => {
    handle = undefined;
    server.closeAllConnections();
    server.close();
    await app.close();
    process.exit(0);
  });
  console.log("H1a preparation listening on 127.0.0.1:3101. Hosted application access disabled.");
} catch {
  console.error("H1a local server unavailable. Hosted application access disabled.");
  server.closeAllConnections(); server.close();
  if (app) await app.close();
  process.exitCode = 1;
}
