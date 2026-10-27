import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, readdir, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { X509Certificate } from "node:crypto";
import { createServer, connect, type Socket } from "node:net";
import { createSecureContext, TLSSocket } from "node:tls";
import { APPROVED_TLS_TARGET } from "../../src/lib/cloud/hosted-tls-preflight.mjs";

// Synthetic keys are generated into a temporary directory, never committed or
// printed. Windows Git ships OpenSSL; other platforms use OpenSSL from PATH.
export async function certificates() {
  const dir = await mkdtemp(join(tmpdir(), "astandsskodun-h1b-"));
  const openssl = process.platform === "win32" ? "C:/Program Files/Git/usr/bin/openssl.exe" : "openssl";
  const run = promisify(execFile);
  const command = async (args: string[]) => {
    try { await run(openssl, args, { cwd: dir, windowsHide: true }); }
    catch { throw new Error("Synthetic TLS fixture generation failed."); }
  };
  const cleanup = async () => {
    for (const name of await readdir(dir)) await unlink(join(dir, name));
    await rmdir(dir);
  };
  try {
    await command(["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", "root.key", "-out", "root.crt",
      "-days", "2", "-subj", "/CN=H1b Synthetic Root", "-addext", "basicConstraints=critical,CA:TRUE",
      "-addext", "keyUsage=critical,keyCertSign,cRLSign"]);
    await command(["req", "-new", "-newkey", "rsa:2048", "-nodes", "-keyout", "leaf.key", "-out", "leaf.csr",
      "-subj", `/CN=${APPROVED_TLS_TARGET.host}`]);
    await writeFile(join(dir, "leaf.ext"), `basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:${APPROVED_TLS_TARGET.host}\n`);
    await command(["x509", "-req", "-in", "leaf.csr", "-CA", "root.crt", "-CAkey", "root.key", "-set_serial", "2",
      "-days", "2", "-out", "leaf.crt", "-extfile", "leaf.ext"]);
    await writeFile(join(dir, "index.txt"), "");
    await writeFile(join(dir, "serial"), "03\n");
    await writeFile(join(dir, "ca.cnf"), `[ca]\ndefault_ca=fixture\n[fixture]\ndatabase=index.txt\nserial=serial\nnew_certs_dir=.\ndefault_md=sha256\npolicy=policy\n[policy]\ncommonName=supplied\n[server_ext]\n${await readFile(join(dir, "leaf.ext"), "utf8")}`);
    await command(["ca", "-batch", "-notext", "-config", "ca.cnf", "-keyfile", "root.key", "-cert", "root.crt",
      "-in", "leaf.csr", "-out", "expired.crt", "-extensions", "server_ext",
      "-startdate", "20200101000000Z", "-enddate", "20200102000000Z"]);
    const ca = await readFile(join(dir, "root.crt"), "utf8");
    return { ca, caFile: join(dir, "root.crt"), fingerprint: new X509Certificate(ca).fingerprint256.replaceAll(":", ""),
      cert: await readFile(join(dir, "leaf.crt")), expiredCert: await readFile(join(dir, "expired.crt")),
      key: await readFile(join(dir, "leaf.key")), cleanup };
  } catch (error) { await cleanup(); throw error; }
}

export async function postgresPeer(material: Awaited<ReturnType<typeof certificates>>, reply = "S", maxVersion?: "TLSv1.1" | "TLSv1.2") {
  const sockets = new Set<Socket>();
  const requests: Buffer[] = [], applicationData: Buffer[] = [];
  const server = createServer(socket => {
    sockets.add(socket);
    socket.on("error", () => {});
    socket.once("close", () => sockets.delete(socket));
    // Accumulate TCP chunks: PostgreSQL's SSLRequest is exactly eight bytes.
    let request = Buffer.alloc(0);
    const receive = (chunk: Buffer) => {
      request = Buffer.concat([request, chunk]);
      if (request.length < 8) return;
      socket.removeListener("data", receive);
      requests.push(request);
      if (reply === "silent") return;
      socket.write(reply === "stall-tls" ? "S" : reply);
      if (reply !== "S") return;
      const tls = new TLSSocket(socket, { isServer: true,
        secureContext: createSecureContext({ key: material.key, cert: material.cert,
          ...(maxVersion ? { maxVersion } : {}) }) });
      sockets.delete(socket); // Ownership transferred to TLS.
      sockets.add(tls);
      tls.on("error", () => {});
      tls.once("close", () => sockets.delete(tls));
      tls.on("data", data => applicationData.push(data));
    };
    socket.on("data", receive);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing synthetic listener");
  return { socket: () => connect(address.port, "127.0.0.1"), requests, applicationData,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>(resolve => server.close(() => resolve()));
    } };
}
