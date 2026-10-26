import { expect, test } from "@playwright/test";
import { spawn, execFile, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixture, testCA } from "./fixtures";

test.setTimeout(120_000);

let child: ChildProcess;
let directory: string;
let caFile: string;
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "astandsskodun-h1a-"));
  caFile = join(directory, "public-test-ca.crt");
  await writeFile(caFile, testCA); // Public CA only; no credential file.
  child = spawn(process.execPath, ["scripts/h1a-hosted.mjs", "serve"], {
    env: { ...process.env, ...fixture(), H1A_DB_CA_FILE: caFile, C1_LOCAL_PROOF: "0",
      HOSTNAME: "0.0.0.0", PORT: "9999", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  child.stdout?.resume(); child.stderr?.resume();
  await expect.poll(async () => {
    if (child.exitCode !== null) throw new Error("H1a local launcher exited");
    return fetch("http://127.0.0.1:3101/api/h1a/preparation").then(r => r.status, () => 0);
  }, { timeout: 90_000, intervals: [1000] }).toBe(200);
});
test.afterAll(async () => {
  if (child?.pid && child.exitCode === null) {
    if (process.platform === "win32") await promisify(execFile)("taskkill", ["/pid", String(child.pid), "/t", "/f"]);
    else child.kill("SIGTERM");
  }
  if (directory) {
    await rm(caFile, { force: true });
    await rmdir(directory); // Only our single public certificate was created here.
  }
});

test("H1a serves only redacted status; C1 operations remain unavailable", async ({ request }) => {
  const status = await request.get("http://127.0.0.1:3101/api/h1a/preparation");
  expect(status.status()).toBe(200);
  expect(await status.json()).toEqual({ mode: "h1a-hosted", configuration: "valid", access: "disabled" });
  expect(status.headers()["cache-control"]).toContain("no-store");
  for (const path of ["config", "inspections"]) {
    expect((await request.get(`http://127.0.0.1:3101/api/c1/${path}`)).status()).toBe(404);
  }
  expect((await request.post("http://127.0.0.1:3101/api/c1/inspections", { data: {} })).status()).toBe(404);
  expect((await request.get("http://127.0.0.1:3101/api/h1a/preparation", { headers: { Host: "localhost:3101" } })).status()).toBe(403);
  expect((await request.get("http://127.0.0.1:3101/api/h1a/preparation", { headers: { Origin: "https://evil.test" } })).status()).toBe(403);
});

test("preparation page has no Auth UI, credentials or outbound browser requests", async ({ page }) => {
  const external: string[] = [];
  await page.route("**/*", route => {
    if (new URL(route.request().url()).origin !== "http://127.0.0.1:3101") {
      external.push("external request blocked"); return route.abort();
    }
    return route.continue();
  });
  await page.goto("http://127.0.0.1:3101");
  await expect(page.getByText("Stillingar staðfestar staðbundið.", { exact: true })).toBeVisible();
  await expect(page.locator("input")).toHaveCount(0);
  const html = await page.content();
  expect(html).not.toContain(fixture().H1A_PUBLISHABLE_KEY);
  expect(html).not.toContain("synthetic-unusable-fixture");
  expect(html).not.toContain(fixture().H1A_POOLER_HOST);
  for (const src of await page.locator("script[src]").evaluateAll(nodes => nodes.map(node => (node as HTMLScriptElement).src))) {
    const bundle = await (await page.request.get(src)).text();
    expect(bundle).not.toContain(fixture().H1A_PUBLISHABLE_KEY);
    expect(bundle).not.toContain("synthetic-unusable-fixture");
  }
  expect(external).toEqual([]);
});

test("missing trust material produces only a generic failure status", async ({ request }) => {
  await rm(caFile);
  try {
    const response = await request.get("http://127.0.0.1:3101/api/h1a/preparation");
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ mode: "h1a-hosted", configuration: "invalid", access: "disabled" });
  } finally { await writeFile(caFile, testCA); }
});
