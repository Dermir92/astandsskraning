import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hostedConfiguration } from "../src/lib/cloud/hosted-config.mjs";

// No .env loading, CLI status, provisioning, network client or credential output.
const command = process.argv[2];
const env = { ...process.env, NODE_ENV: "development", H1A_HOSTED_PREPARATION: "1" };
try {
  if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") throw new Error();
  if (process.argv.length !== 3 || !["check", "serve"].includes(command)) throw new Error();
  hostedConfiguration(env);
  if (command === "check") {
    console.log("H1a configuration valid. Hosted access remains disabled; no connection attempted.");
  } else {
    const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3101"], {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env: { ...env, HOSTNAME: "127.0.0.1", PORT: "3101" }, stdio: "inherit", windowsHide: true,
    });
    for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
    child.on("error", () => { console.error("H1a local server unavailable."); process.exitCode = 1; });
    child.on("exit", code => process.exit(code ?? 1));
  }
} catch {
  console.error("H1a configuration unavailable. No server or hosted connection started.");
  process.exitCode = 1;
}
