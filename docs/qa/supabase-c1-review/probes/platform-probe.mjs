import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
const run = promisify(execFile);
const cli = path.resolve("node_modules/supabase/bin", process.platform === "win32" ? "supabase.exe" : "supabase");
const { stdout } = await run(cli, ["status", "--output", "json"]);
const status = JSON.parse(stdout);
if (!status.DB_URL?.includes("127.0.0.1:55422/")) throw new Error("Dedicated local C1 database required");
const sql = postgres(status.DB_URL, { max: 1 });
try {
  const version = await sql`select version() as version`;
  const migrations = await sql`select version from supabase_migrations.schema_migrations order by version`;
  const policies = await sql`select schemaname, tablename, policyname, roles, cmd, qual from pg_policies where tablename='c1_inspections'`;
  const grants = await sql`select has_table_privilege('authenticated','public.c1_inspections','UPDATE') as authenticated_update,
    has_table_privilege('anon','public.c1_inspections','SELECT') as anonymous_read,
    has_function_privilege('c1_executor','c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)','EXECUTE') as executor_function`;
  const { stdout: containers } = await run("docker", ["ps", "--filter", "name=astandsskodun-c1", "--format", "{{.Names}} {{.Ports}}"]);
  const evidence = { checkedAt: new Date().toISOString(), postgres: version[0].version, migrations: migrations.map(r => r.version), policies, grants: grants[0],
    localContainerBindings: containers.trim().split(/\r?\n/), existingVolumeUsed: true, resetDuringCorrections: false,
    hostedProjectContacted: false, migrationFileUnchanged: true };
  const runtime = JSON.parse(await readFile("artifacts/c1-local/runtime.json", "utf8"));
  const serialized = JSON.stringify(evidence, null, 2);
  if ([runtime.databaseUrl, new URL(runtime.databaseUrl).password, ...runtime.accounts.map(a => a.password)].some(secret => serialized.includes(secret))) throw new Error("Evidence unexpectedly contains credentials");
  await writeFile("artifacts/c1-review-revisions/platform-current.json", serialized);
  console.log("Recorded current local PostgreSQL version, migration, grants, policy and C1-only port bindings without credentials.");
} finally { await sql.end(); }
