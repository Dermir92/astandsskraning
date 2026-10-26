import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:3201";
const results = [];
for (const [path, method] of [["/api/c1/config", "GET"], ["/api/c1/inspections", "GET"], ["/api/c1/inspections", "POST"]]) {
  const response = await fetch(base + path + "?C1_LOCAL_PROOF=1", { method,
    headers: { "Content-Type": "application/json", Cookie: "C1_LOCAL_PROOF=1", Authorization: "Bearer intentionally-invalid-test-token" },
    ...(method === "POST" ? { body: "{}" } : {}) });
  assert.equal(response.status, 404); results.push({ path, method, status: response.status });
}
const response = await fetch(base), html = await response.text();
assert.equal(response.status, 200); assert.ok(html.includes("Sýnivinnusvæði")); assert.ok(!html.includes("Skrá inn í C1"));
const runtime = JSON.parse(await readFile("artifacts/c1-local/runtime.json", "utf8"));
const secretValues = [runtime.databaseUrl, new URL(runtime.databaseUrl).password, ...runtime.accounts.map(a => a.password)];
const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]))];
for (const url of scripts) {
  const asset = await fetch(new URL(url, base)); assert.equal(asset.status, 200);
  const text = await asset.text(); assert.ok(secretValues.every(secret => !text.includes(secret)));
}
const evidence = { checkedAt: new Date().toISOString(), framework: "16.4.3", process: "next start with C1_LOCAL_PROOF=1 and production NODE_ENV",
  endpointChecks: results, defaultDemoRoot: "passed", clientAssetsChecked: scripts.length, privilegedCredentialMatches: 0,
  limitation: "HTTP/build/served-asset probes; not an exploit test or independent security approval." };
await writeFile("artifacts/c1-review-revisions/production-guard.json", JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence));
