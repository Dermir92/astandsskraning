import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { contentFingerprint, sourceContent } from "../../src/lib/inspection-comparison";
import { draft, operation, runtime, token } from "./helpers";
import type { SaveOperation } from "../../src/lib/cloud/contracts";

async function connection() { return postgres((await runtime()).databaseUrl, { max: 8, connect_timeout: 5 }); }
async function administrator() {
  const binary = path.resolve("node_modules/supabase/bin", process.platform === "win32" ? "supabase.exe" : "supabase");
  const { stdout } = await promisify(execFile)(binary, ["status", "--output", "json"]);
  const status = JSON.parse(stdout);
  if (!status.DB_URL?.includes("127.0.0.1:55422/")) throw new Error("Local C1 database required");
  return postgres(status.DB_URL, { max: 2, connect_timeout: 5 });
}
async function save(sql: ReturnType<typeof postgres>, owner: string, op: SaveOperation) {
  const rows = await sql`select c1_private.save_inspection(${owner}::uuid, ${op.document.id}, ${op.expectedRevision}, ${sql.json(op.document as unknown as postgres.JSONValue)}, ${op.operationId}::uuid, ${op.issuedAt}::timestamptz) as result`;
  return rows[0].result;
}

test("real PostgreSQL retains legacy IDs, unknown fields, incomplete drafts and version-1 fingerprints", async ({ request }) => {
  const auth = await token(); const sql = await connection();
  const report = { ...draft(), extension: { nested: [null, "óþekkt", { yes: true }] } };
  Object.assign(report.details, { inspectionDate: "2026-02-30", recorderName: "", futureDetail: { raw: "001,25" } });
  const before = await contentFingerprint(sourceContent(report));
  try {
    const saved = await save(sql, auth.account.id, operation(report));
    expect(saved.revision).toBe(1);
    const response = await request.get(`/api/c1/inspections`, { headers: { Authorization: `Bearer ${auth.token}` } });
    expect(response.status()).toBe(200);
    const restored = (await response.json()).records.find((r: { id: string }) => r.id === report.id);
    expect(restored.document).toEqual(report);
    expect(await contentFingerprint(sourceContent(restored.document))).toBe(before);
    expect(restored.document).not.toHaveProperty("owner_id"); expect(restored.document).not.toHaveProperty("revision");
  } finally { await sql.end(); }
});

test("genuine concurrent database updates with the same revision produce exactly one winner", async () => {
  const config = await runtime(), sql = await connection(), owner = config.accounts[0].id, report = draft();
  try {
    await save(sql, owner, operation(report));
    for (let revision = 1; revision <= 6; revision++) {
      const outcomes = await Promise.allSettled([
        save(sql, owner, operation({ ...report, title: `A ${revision}` }, revision)),
        save(sql, owner, operation({ ...report, title: `B ${revision}` }, revision)),
      ]);
      expect(outcomes.filter(r => r.status === "fulfilled")).toHaveLength(1);
      const rejected = outcomes.find(r => r.status === "rejected") as PromiseRejectedResult;
      expect(rejected.reason.code).toBe("P0001");
      const accepted = outcomes.find(r => r.status === "fulfilled") as PromiseFulfilledResult<{ revision: number }>;
      expect(accepted.value.revision).toBe(revision + 1);
    }
  } finally { await sql.end(); }
});

test("different inspections and identical legacy IDs owned by different users update independently", async () => {
  const config = await runtime(), sql = await connection(), a = draft(), b = draft(a.id);
  try {
    const created = await Promise.all([save(sql, config.accounts[0].id, operation(a)), save(sql, config.accounts[1].id, operation(b))]);
    expect(created.map(r => r.revision)).toEqual([1, 1]);
    const other = draft(); await save(sql, config.accounts[0].id, operation(other));
    const changed = await Promise.all([
      save(sql, config.accounts[0].id, operation({ ...a, title: "A einkaskýrsla" }, 1)),
      save(sql, config.accounts[1].id, operation({ ...b, title: "B einkaskýrsla" }, 1)),
      save(sql, config.accounts[0].id, operation({ ...other, title: "Önnur A skýrsla" }, 1)),
    ]);
    expect(changed.map(r => r.revision)).toEqual([2, 2, 2]);
  } finally { await sql.end(); }
});

test("duplicate concurrent requests and a replay after lost acknowledgement commit only once", async () => {
  const config = await runtime(), sql = await connection(), report = draft(), op = operation(report);
  try {
    const a = config.accounts[0].id;
    const results = await Promise.all([save(sql, a, op), save(sql, a, op)]);
    expect(results.map(r => r.revision)).toEqual([1, 1]); expect(results.filter(r => r.replayed)).toHaveLength(1);
    const replay = await save(sql, a, op); expect(replay.revision).toBe(1); expect(replay.replayed).toBe(true);
    await expect(save(sql, a, { ...op, document: { ...report, title: "Illicit changed retry" } })).rejects.toMatchObject({ code: "22023" });
    const admin = await administrator();
    try {
      const rows = await admin`select revision from public.c1_inspections where owner_id = ${a}::uuid and id = ${report.id}`;
      expect(Number(rows[0].revision)).toBe(1);
      const receipts = await admin`select count(*)::integer as count from c1_private.operation_receipts where owner_id = ${a}::uuid and operation_id = ${op.operationId}::uuid`;
      expect(receipts[0].count).toBe(1);
    } finally { await admin.end(); }
  } finally { await sql.end(); }
});

test("receipt window rejects expired or future operations and rolls back failed work", async () => {
  const config = await runtime(), sql = await connection(), report = draft(), op = operation(report);
  try {
    await expect(save(sql, config.accounts[0].id, { ...op, issuedAt: new Date(Date.now() - 25 * 3600000).toISOString() })).rejects.toMatchObject({ code: "22023" });
    await expect(save(sql, config.accounts[0].id, { ...op, issuedAt: new Date(Date.now() + 300000).toISOString() })).rejects.toMatchObject({ code: "22023" });
    expect((await save(sql, config.accounts[0].id, op)).revision).toBe(1);
    await expect(save(sql, config.accounts[0].id, operation({ ...report, title: "Stale" }, 0))).rejects.toMatchObject({ code: "P0001" });
    expect((await save(sql, config.accounts[0].id, operation({ ...report, title: "Valid after failure" }, 1))).revision).toBe(2);
  } finally { await sql.end(); }
});

test("real PostgreSQL and HTTP replay the original receipt after a newer commit without rewriting the head", async ({ request }) => {
  const auth = await token(), report = draft(), first = operation(report), headers = { Authorization: `Bearer ${auth.token}` };
  const post = (op: SaveOperation) => request.post("/api/c1/inspections", { headers, data: op });
  const committed = await post(first); expect(committed.status()).toBe(200);
  expect(await committed.json()).toMatchObject({ revision: 1, replayed: false });
  const newer = { ...report, title: "Nýrri útgáfa frá öðrum biðlara" };
  const second = await post(operation(newer, 1)); expect(second.status()).toBe(200);
  expect(await second.json()).toMatchObject({ revision: 2, replayed: false });
  const replay = await post(first); expect(replay.status()).toBe(200);
  expect(await replay.json()).toEqual({ id: report.id, revision: 1, document: report, replayed: true });
  const read = await request.get("/api/c1/inspections", { headers }); expect(read.status()).toBe(200);
  expect((await read.json()).records.find((r: { id: string }) => r.id === report.id)).toEqual({ id: report.id, revision: 2, document: newer });
  const admin = await administrator();
  try {
    const rows = await admin`select revision, document from public.c1_inspections where owner_id = ${auth.account.id}::uuid and id = ${report.id}`;
    expect(Number(rows[0].revision)).toBe(2); expect(rows[0].document).toEqual(newer);
    const receipts = await admin`select count(*)::integer as count from c1_private.operation_receipts where owner_id = ${auth.account.id}::uuid and operation_id = ${first.operationId}::uuid`;
    expect(receipts[0].count).toBe(1);
  } finally { await admin.end(); }
});

test("RLS isolates two owners; anonymous access and direct insert/update/upsert/delete are denied", async ({ request }) => {
  const a = await token(0), b = await token(1), sql = await connection(), report = draft();
  try { await save(sql, a.account.id, operation(report)); } finally { await sql.end(); }
  const endpoint = `${a.config.apiUrl}/rest/v1/c1_inspections?id=eq.${encodeURIComponent(report.id)}`;
  const headers = { apikey: a.config.anonKey, Authorization: `Bearer ${a.token}` };
  const own = await request.get(endpoint, { headers }); expect(own.status()).toBe(200); expect((await own.json())[0].document).toEqual(report);
  const other = await request.get(endpoint, { headers: { ...headers, Authorization: `Bearer ${b.token}` } }); expect(other.status()).toBe(200); expect(await other.json()).toEqual([]);
  const anon = await request.get(endpoint, { headers: { apikey: a.config.anonKey } }); expect([401, 403]).toContain(anon.status());
  const row = { owner_id: a.account.id, id: report.id, document: report, revision: 999 };
  for (const method of ["POST", "PATCH", "DELETE"]) {
    const result = await request.fetch(endpoint, { method, headers: { ...headers, Prefer: "resolution=merge-duplicates" }, data: row });
    expect([401, 403]).toContain(result.status());
  }
  const read = await request.get(endpoint, { headers }); expect(Number((await read.json())[0].revision)).toBe(1);
});

test("private function grants deny anonymous/authenticated roles and the executor cannot bypass its function", async () => {
  const admin = await administrator(), executor = await connection();
  try {
    const permissions = await admin`select has_table_privilege('authenticated', 'public.c1_inspections', 'UPDATE') as update,
      has_table_privilege('anon', 'public.c1_inspections', 'SELECT') as anon_read,
      has_function_privilege('authenticated', 'c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)', 'EXECUTE') as authenticated_execute,
      has_function_privilege('anon', 'c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)', 'EXECUTE') as anon_execute`;
    expect(permissions[0]).toMatchObject({ update: false, anon_read: false, authenticated_execute: false, anon_execute: false });
    await expect(executor`select * from public.c1_inspections`).rejects.toMatchObject({ code: "42501" });
    await expect(executor`update public.c1_inspections set revision = revision + 1`).rejects.toMatchObject({ code: "42501" });
    await expect(executor`select * from c1_private.operation_receipts`).rejects.toMatchObject({ code: "42501" });
    for (const role of ["anon", "authenticated"]) {
      await expect(admin.begin(async tx => {
        await tx.unsafe(`set local role ${role}`);
        await tx`select c1_private.save_inspection(null, null, null, null, null, null)`;
      })).rejects.toMatchObject({ code: "42501" });
    }
  } finally { await admin.end(); await executor.end(); }
});

test("concurrent creation respects the 500-inspection domain limit without hiding a saved record", async () => {
  const admin = await administrator(), executor = await connection(), owner = crypto.randomUUID(), report = draft();
  try {
    await admin`insert into auth.users(id, email) values (${owner}::uuid, ${`quota-${owner}@example.test`})`;
    await admin`insert into public.c1_inspections(owner_id, id, document, revision)
      select ${owner}::uuid, 'quota-' || n, jsonb_set(${admin.json(report as unknown as postgres.JSONValue)}, '{id}', to_jsonb('quota-' || n)), 1 from generate_series(1,499) n`;
    const results = await Promise.allSettled([save(executor, owner, operation(draft())), save(executor, owner, operation(draft()))]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect((results.find(r => r.status === "rejected") as PromiseRejectedResult).reason.code).toBe("54000");
    const counts = await admin`select count(*)::integer as count from public.c1_inspections where owner_id = ${owner}::uuid`;
    expect(counts[0].count).toBe(500);
  } finally {
    await admin`delete from c1_private.operation_receipts where owner_id = ${owner}::uuid`;
    await admin`delete from public.c1_inspections where owner_id = ${owner}::uuid`;
    await admin`delete from auth.users where id = ${owner}::uuid`;
    await admin.end(); await executor.end();
  }
});

test("server verifies authentication, ignores ownership spoofing and rejects excluded cloud workflows", async ({ request }) => {
  expect((await request.get("/api/c1/inspections")).status()).toBe(401);
  expect((await request.get("/api/c1/inspections", { headers: { Authorization: "Bearer forged-token" } })).status()).toBe(401);
  const a = await token(), b = (await runtime()).accounts[1];
  const signup = await request.post(`${a.config.apiUrl}/auth/v1/signup`, { headers: { apikey: a.config.anonKey }, data: { email: "no-public-signup@example.test", password: "NotAnEnabledSignup123!" } });
  expect([400, 403, 422]).toContain(signup.status());
  const headers = { Authorization: `Bearer ${a.token}` }, report = draft();
  const saved = await request.post("/api/c1/inspections", { headers: { ...headers, Origin: "http://127.0.0.1:3101" }, data: { ...operation(report), owner_id: b.id } });
  expect(saved.status()).toBe(200);
  const read = await request.get("/api/c1/inspections", { headers });
  expect((await read.json()).ownerId).toBe(a.account.id);
  for (const inspectionType of ["initial", "final"]) {
    const result = await request.post("/api/c1/inspections", { headers, data: operation({ ...draft(), details: { ...report.details, inspectionType: inspectionType as "initial" | "final" } }) });
    expect(result.status()).toBe(400);
  }
  const crossOrigin = await request.post("/api/c1/inspections", { headers: { ...headers, Origin: "https://untrusted.example" }, data: operation(draft()) });
  expect(crossOrigin.status()).toBe(403);
  const clientRpc = await request.post(`${a.config.apiUrl}/rest/v1/rpc/save_inspection`, { headers: { apikey: a.config.anonKey, Authorization: `Bearer ${a.token}` }, data: {} });
  expect([403, 404]).toContain(clientRpc.status());
});
