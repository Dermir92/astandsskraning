// Check the real listening socket, independently of HTTP Host/Origin headers.
export const HOSTED_BINDING = Object.freeze({ host: "127.0.0.1", port: 3101 });

/** @param {import('node:net').Server} server */
export function assertHostedLoopback(server) {
  const address = server.address();
  if (!server.listening || !address || typeof address === "string" ||
      address.address !== HOSTED_BINDING.host || address.port !== HOSTED_BINDING.port) {
    throw new Error("hosted_loopback_required");
  }
}

/** @param {import('node:net').Server} server */
export async function bindHostedLoopback(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(HOSTED_BINDING.port, HOSTED_BINDING.host, () => {
      server.removeListener("error", reject);
      resolve(undefined);
    });
  });
  assertHostedLoopback(server);
}
