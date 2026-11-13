import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
// Refuse D1 before dependency/CLI resolution, runtime reads or any side effect.
// Every legacy entry point, including stop/reset, must pass this same guard.
const config = await readFile(path.join(root, "supabase/config.toml"), "utf8");
if (!/^project_id = "astandsskodun-c1"\r?$/m.test(config) ||
    !/^port = 55421\r?$/m.test(config) || !/^port = 55422\r?$/m.test(config)) {
  throw new Error("Legacy C1 commands are disabled for this configuration. Use d1:check; D1 Auth/app setup is not enabled.");
}
if (process.argv.length !== 3 && process.argv[2] !== "test") throw new Error("Unexpected C1 arguments");
const runtimePath = path.join(root, "artifacts/c1-local/runtime.json");
const run = promisify(execFile);
const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve("supabase/package.json")), "bin", process.platform === "win32" ? "supabase.exe" : "supabase");
const command = process.argv[2];
if (command === "start") {
  console.log("Starting the C1 Supabase stack at local API/database ports 55421/55422…");
  try { await run(cli, ["start"], { cwd: root, maxBuffer: 16 * 1024 * 1024 }); }
  catch { throw new Error("C1 local stack could not start. Check Docker and port availability; no hosted project is used."); }
  console.log("Local C1 stack started. Use c1:prepare next. Privileged CLI status values were not printed.");
} else if (command === "prepare") {
  const { default: postgres } = await import("postgres");
  const { createClient } = await import("@supabase/supabase-js");
  // Read local-only status directly into memory. Never log its privileged keys.
  const { stdout } = await run(cli, ["status", "--output", "json"], { cwd: root });
  const status = JSON.parse(stdout);
  if (status.API_URL !== "http://127.0.0.1:55421" || !status.DB_URL?.includes("127.0.0.1:55422/")) throw new Error("Only the configured local Supabase stack is permitted");
  const databasePassword = randomBytes(32).toString("hex");
  const sql = postgres(status.DB_URL, { max: 1 });
  try {
    // Generated hex only, not user input. A SQL parameter cannot replace a
    // password literal in ALTER ROLE. Do not log this statement or the URL.
    await sql.unsafe(`alter role c1_executor login password '${databasePassword}'`);
  } finally { await sql.end(); }
  const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error("Cannot list local fictional accounts");
  const accounts = [];
  for (const letter of ["a", "b"]) {
    const email = `c1-owner-${letter}@example.test`, password = randomBytes(18).toString("hex");
    const existing = data.users.find(user => user.email === email);
    const result = existing ? await admin.auth.admin.updateUserById(existing.id, { password }) : await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (result.error || !result.data.user) throw new Error("Cannot provision local fictional account");
    accounts.push({ id: result.data.user.id, email, password });
  }
  const db = new URL(status.DB_URL); db.username = "c1_executor"; db.password = databasePassword;
  await mkdir(path.dirname(runtimePath), { recursive: true });
  await writeFile(runtimePath, JSON.stringify({ apiUrl: status.API_URL, anonKey: status.ANON_KEY, databaseUrl: db.toString(), accounts }, null, 2), { mode: 0o600 });
  console.log("C1 local executor and two fictional owners prepared. Local-only credentials are in ignored artifacts/c1-local/runtime.json; no hosted project was contacted.");
} else if (command === "stop" || command === "reset") {
  await run(cli, command === "stop" ? ["stop", "--project-id", "astandsskodun-c1"] : ["db", "reset", "--local"], { cwd: root });
} else if (command === "serve" || command === "test") {
  const runtime = JSON.parse(await readFile(runtimePath, "utf8"));
  if (runtime.apiUrl !== "http://127.0.0.1:55421") throw new Error("Hosted projects are not supported in C1");
  const env = { ...process.env, C1_LOCAL_PROOF: "1", C1_SUPABASE_URL: runtime.apiUrl, C1_ANON_KEY: runtime.anonKey, C1_DATABASE_URL: runtime.databaseUrl };
  const args = command === "serve" ? ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3101"] : ["node_modules/@playwright/test/cli.js", "test", "--config", "playwright.c1.config.ts", ...process.argv.slice(3)];
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: "inherit", windowsHide: true });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
  child.on("exit", code => process.exit(code ?? 1));
} else throw new Error("Use start, stop, reset, prepare, serve or test");
