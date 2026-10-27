// Disposable LOCAL PostgreSQL tests only. No hosted target, password, Auth users,
// image download, existing stack access, or persistent Docker volume.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, '../../..');
const name = 'h1b2-offline-' + crypto.randomBytes(6).toString('hex');
const image = 'public.ecr.aws/supabase/postgres:17.11.0.004';
const expectedEmptyTriggerHash = crypto.createHash('sha256').update('[]').digest('hex');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const cli = path.join(repo, 'node_modules/supabase/bin/supabase.exe');
const baselinePath = 'supabase/migrations/20261024000100_c1_owner_inspections.sql';
const companionPath = 'supabase/migrations/20261027000100_c1_hosted_acl_hardening.sql';
const baseline = fs.readFileSync(path.join(repo, baselinePath), 'utf8');
const hardening = fs.readFileSync(path.join(repo, companionPath), 'utf8');
check(sha(baseline) === '6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8', 'Approved baseline hash changed');
check(sha(hardening) === '6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62', 'Approved canonical companion hash changed');
const template = fs.readFileSync(path.join(dir, 'BOOTSTRAP.NOT_EXECUTED.sql'), 'utf8');
const gateD = fs.readFileSync(path.join(dir, 'GATE_D.sql'), 'utf8');
const authorized = template.replace('v_execution_authorized boolean := false;', 'v_execution_authorized boolean := true;')
  .replace("v_operator_project_ref text := 'UNCONFIRMED';", "v_operator_project_ref text := 'ozcxjphzzwekpwsbglaf';")
  .replace("v_approved_event_trigger_fingerprint text := 'UNREVIEWED';", `v_approved_event_trigger_fingerprint text := '${expectedEmptyTriggerHash}';`);
const results = [];
const gateB2 = process.argv.includes('--gate-b2');
const gateB2SqlChecks = new Set([
  'default review artifact refuses execution and rolls back',
  'atomic bootstrap passes all application and history assertions',
  'database history receipts match both canonical source hashes',
  'duplicate attempt refuses replay and preserves exactly two records',
  'failure in hardening rolls back baseline, role, metadata and receipts',
  'failed postcondition rolls back all DDL and history',
  'concurrent approved attempts commit exactly one bootstrap',
]);
let containerCreated = false;
let localProxy;
let denyProxy;
const tunnels = new Set();
let blockedHttpAttempts = 0;
let cliLocalPort;
const runtime = path.join(repo, 'artifacts/h1b2', name);
fs.mkdirSync(runtime, { recursive: true });

function check(value, message) { if (!value) throw new Error(message); }
function docker(args, input, allowFailure = false) {
  const r = spawnSync('docker', ['--context', 'desktop-linux', ...args], {
    input, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 30000,
  });
  if (!allowFailure && r.status !== 0) throw new Error('Local Docker operation failed: ' + (r.stderr || r.error?.message || '').slice(0, 1800));
  return r;
}
function sql(text, asOwner = true, database = 'postgres', allowFailure = false) {
  return docker(['exec','-i',name,'psql','-X','-v','ON_ERROR_STOP=1','-U','local_bootstrap_admin','-h','/tmp','-d',database,'-At','-f','-'],
    (asOwner ? 'set session authorization postgres;\n' : '') + text, allowFailure);
}
async function test(label, fn) {
  if (gateB2 && !label.startsWith('canonical preparation:') && !gateB2SqlChecks.has(label)) return;
  await fn(); results.push(label); console.log('PASS ' + label);
}
const generatedNames = ['BOOTSTRAP.NOT_EXECUTED.sql','GATE_D.sql','PRE_EXECUTION_INVENTORY.sql','RECOVERY_HISTORY.sql','manifest.json'];
function outputBytes(root) {
  return generatedNames.map(n => fs.readFileSync(path.join(root,'docs/review/h1b2',n)));
}
function equalOutputs(before, root) {
  check(before.every((b,i) => b.equals(outputBytes(root)[i])), 'Failed verification changed generated files');
}
function prep(root, args = []) {
  return spawnSync(process.execPath,[path.join(root,'docs/review/h1b2/prepare.mjs'),...args],
    { cwd:root,encoding:'utf8',timeout:15000,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_LAZY_FETCH:'1'} });
}
function fixture(label) {
  const root=path.join(runtime,'canonical-fixtures',label);
  fs.mkdirSync(path.join(root,'docs/review/h1b2'),{recursive:true});
  fs.mkdirSync(path.join(root,'supabase/migrations'),{recursive:true});
  fs.mkdirSync(path.join(root,'node_modules/supabase/bin'),{recursive:true});
  for (const n of fs.readdirSync(dir)) fs.copyFileSync(path.join(dir,n),path.join(root,'docs/review/h1b2',n));
  for (const p of [baselinePath,companionPath]) fs.copyFileSync(path.join(repo,p),path.join(root,p));
  // Read-only hardlink avoids duplicating the large executable. It is never executed/changed here.
  fs.linkSync(cli,path.join(root,'node_modules/supabase/bin/supabase.exe'));
  return root;
}
function rejectedPrep(root,args,message) {
  const before=outputBytes(root),r=prep(root,args);
  check(r.status!==0 && r.stderr.includes(message),'Expected offline preparation refusal: '+message+' '+r.stderr);
  equalOutputs(before,root);
}
async function preparationChecks() {
  const canonicalMappings=[
    {version:'20261024000100',name:'c1_owner_inspections',source:baselinePath,sha256:sha(baseline)},
    {version:'20261027000100',name:'c1_hosted_acl_hardening',source:companionPath,sha256:sha(hardening)},
  ];
  await test('canonical preparation: both approved canonical files generate disabled SQL',()=>{
    const root=fixture('correct'),r=prep(root);
    check(r.status===0,'Valid canonical preparation failed: '+r.stderr);
    const b=fs.readFileSync(path.join(root,'docs/review/h1b2/BOOTSTRAP.NOT_EXECUTED.sql'),'utf8');
    check(b.includes('v_execution_authorized boolean := false;') && b.includes("v_operator_project_ref text := 'UNCONFIRMED';")
      && b.includes("v_approved_event_trigger_fingerprint text := 'UNREVIEWED';"),'Disabled guards changed');
  });
  for (const [label,p,change,message] of [
    ['missing companion',companionPath,'remove','missing approved canonical source'],
    ['mismatched companion hash',companionPath,'tamper','approved source hash mismatch'],
    ['missing original baseline',baselinePath,'remove','missing approved canonical source'],
    ['modified original baseline',baselinePath,'tamper','approved source hash mismatch'],
    ['review copy cannot override canonical source','docs/review/h1b2/HARDENING.sql','tamper','approved source hash mismatch'],
  ]) await test('canonical preparation: '+label+' fails without output writes',()=>{
    const root=fixture(label.replaceAll(' ','-')),target=path.join(root,p);
    if(change==='remove')fs.unlinkSync(target);else fs.appendFileSync(target,'\n-- offline fixture alteration\n');
    rejectedPrep(root,[],message);
  });
  await test('canonical preparation: both canonical files map to exact recorded source chunks',()=>{
    const root=fixture('mapping');check(prep(root).status===0,'Mapping fixture generation failed');
    const m=JSON.parse(fs.readFileSync(path.join(root,'docs/review/h1b2/manifest.json'),'utf8'));
    check(JSON.stringify(m.versions)===JSON.stringify(canonicalMappings),'Canonical manifest mapping differs');
    const b=fs.readFileSync(path.join(root,'docs/review/h1b2/BOOTSTRAP.NOT_EXECUTED.sql'),'utf8');
    for(const [tag,source] of [['$h1b2_baseline_source$',baseline],['$h1b2_hardening_source$',hardening]]) {
      check(b.split(tag)[1]===source,'History chunk is not the exact canonical file');
    }
    check(b.slice(b.indexOf('\n',b.indexOf('-- BEGIN ORIGINAL C1 BYTES'))+1,b.indexOf('-- END ORIGINAL C1 BYTES'))===baseline,'Executable baseline changed');
    check(b.slice(b.indexOf('\n',b.indexOf('-- BEGIN COMPANION HARDENING'))+1,b.indexOf('-- END COMPANION HARDENING'))===hardening,'Executable companion changed');
  });
  await test('canonical preparation: regeneration is deterministic and check mode validates it',()=>{
    const root=fixture('deterministic');check(prep(root).status===0,'First generation failed');
    const before=outputBytes(root);check(prep(root).status===0,'Second generation failed');equalOutputs(before,root);
    check(prep(root,['--check']).status===0,'Generated integrity check failed');
  });
  await test('canonical preparation: modified generated SQL is rejected without rewriting it',()=>{
    const root=fixture('modified-sql');check(prep(root).status===0,'Fixture generation failed');
    fs.appendFileSync(path.join(root,'docs/review/h1b2/BOOTSTRAP.NOT_EXECUTED.sql'),'-- fixture drift\n');
    rejectedPrep(root,['--check'],'generated SQL/manifest is stale or modified');
  });
  const approvedRevision=spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).stdout.trim();
  // Synthetic negative-test attestations. These are NOT real human approval.
  const attestation={schemaVersion:1,approvalReference:'SYNTHETIC_OFFLINE_NEGATIVE_TEST_ONLY',
    canonicalFilesReviewed:true,gateCExecutionApproved:true,executionMethodApprovedAndVerified:true,
    executionMethod:'psql-single-session-explicit-transaction-on-error-stop',approvedGitRevision:approvedRevision,
    canonicalMigrations:canonicalMappings};
  for(const [label,modify,message] of [
    ['missing explicit canonical review',a=>{a.canonicalFilesReviewed=false;},'explicit canonical review'],
    ['missing Gate C approval',a=>{a.gateCExecutionApproved=false;},'explicit canonical review'],
    ['unverified execution method',a=>{a.executionMethodApprovedAndVerified=false;},'explicit canonical review'],
    ['legacy SQL Editor method',a=>{a.executionMethod='supabase-sql-editor-single-batch-one-connection';},'explicit canonical review'],
    ['legacy SQL Editor approval field',a=>{delete a.executionMethodApprovedAndVerified;a.sqlEditorExecutionMethodApprovedAndVerified=true;},'explicit canonical review'],
    ['incorrect canonical approval mapping',a=>{a.canonicalMigrations[1].sha256='0'.repeat(64);},'canonical filename/version/hash mapping differs'],
    ['different approved revision',a=>{a.approvedGitRevision='0'.repeat(40);},'approved Git revision must equal'],
    ['uncommitted release-source changes',()=>{},'release source absent from approved revision'],
  ]) await test('canonical preparation: release check rejects '+label,()=>{
    const a=structuredClone(attestation);modify(a);
    const approvalPath=path.join(runtime,label.replaceAll(' ','-')+'.json');fs.writeFileSync(approvalPath,JSON.stringify(a));
    rejectedPrep(repo,['--verify-release',approvalPath],message);
  });
  await test('canonical preparation: no option enables or emits executable release SQL',()=>{
    rejectedPrep(repo,['--enable'],'use no arguments');
    check(fs.readFileSync(path.join(dir,'BOOTSTRAP.NOT_EXECUTED.sql'),'utf8').includes('v_execution_authorized boolean := false;'),'Real review bundle became enabled');
  });
  await test('canonical preparation: psql file retains one explicit transaction and no reconnect/meta-commands',()=>{
    check((template.match(/^begin;$/gm)||[]).length===1 && (template.match(/^commit;$/gm)||[]).length===1,'Explicit transaction boundary changed');
    check(!/^\s*\\/m.test(template),'Unexpected psql meta-command/reconnect path');
  });
}
function reset(extra = '') {
  sql(`drop database postgres with (force);
drop role if exists c1_executor;
drop role if exists fixture_bridge;
revoke pg_read_all_data from anon, authenticated, authenticator, service_role, postgres;
revoke authenticated from service_role;
create database postgres owner postgres;`, false, 'template1');
  sql(`create schema auth authorization local_bootstrap_admin;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
grant usage on schema auth to postgres, authenticated;
grant references on auth.users to postgres;
grant execute on function auth.uid() to postgres, authenticated;
create schema extensions authorization local_bootstrap_admin;
create extension pgcrypto with schema extensions;
grant usage on schema extensions to postgres;
grant execute on function extensions.digest(bytea,text) to postgres;
alter default privileges for role postgres in schema public grant truncate,references,trigger,maintain on tables to anon,authenticated,service_role;
${extra}`, false);
}
function absent() {
  const r = sql("select to_regnamespace('c1_private') is null and to_regrole('c1_executor') is null and to_regnamespace('supabase_migrations') is null and to_regclass('public.c1_inspections') is null;", false);
  check(r.stdout.trim() === 't', 'Failed bootstrap left objects/role/history behind');
}
function reject(bundle, message) {
  const r = sql(bundle, true, 'postgres', true);
  check(r.status !== 0 && r.stderr.includes(message), 'Expected rejection ' + message + ': ' + r.stderr.slice(0, 1300));
}
function beforeAssertions(extra) {
  return authorized.replace('-- BEGIN COMPANION HARDENING\n', '-- BEGIN COMPANION HARDENING\n')
    .replace('-- END COMPANION HARDENING', extra + '\n-- END COMPANION HARDENING');
}
function cliRun(args, cwd) {
  // No inherited tokens, DB settings, credential paths, or linked project config.
  // HTTP(S) update checks terminate at a local deny proxy; DB goes only to the
  // loopback stdio tunnel into the network-disabled disposable container.
  const env = {};
  for (const key of ['SystemRoot','WINDIR','PATH','TEMP','TMP']) if (process.env[key]) env[key] = process.env[key];
  const proxyUrl = `http://127.0.0.1:${denyProxy.address().port}`;
  Object.assign(env, { HTTP_PROXY: proxyUrl, HTTPS_PROXY: proxyUrl, ALL_PROXY: proxyUrl,
    NO_PROXY: '127.0.0.1,localhost', CI: 'true', NO_COLOR: '1',
    SUPABASE_ACCESS_TOKEN: '', SUPABASE_DB_PASSWORD: '', XDG_CONFIG_HOME: runtime });
  return new Promise(resolve => {
    const child = spawn(cli, args, { cwd, env, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', e => resolve({ status: -1, stdout, stderr: e.message }));
    const timer = setTimeout(() => child.kill(), 25000);
    child.on('close', status => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
  });
}
function cliWorkspace(suffix, files) {
  const cwd = path.join(runtime, suffix);
  fs.mkdirSync(path.join(cwd,'supabase/migrations'), { recursive: true });
  fs.writeFileSync(path.join(cwd,'supabase/config.toml'), `project_id = "h1b2-disposable-offline"\n[db]\nport = ${cliLocalPort}\nmajor_version = 17\n`);
  for (const [file, content] of Object.entries(files)) fs.writeFileSync(path.join(cwd,'supabase/migrations',file),content);
  return cwd;
}
function sqlAsync(text) {
  return new Promise(resolve => {
    const child = spawn('docker', ['--context','desktop-linux','exec','-i',name,'psql','-X','-v','ON_ERROR_STOP=1','-U','local_bootstrap_admin','-h','/tmp','-d','postgres','-At','-f','-']);
    let stderr = '';
    child.stdout.resume(); child.stderr.on('data', d => { stderr += d; });
    child.on('close', status => resolve({ status, stderr }));
    child.stdin.end('set session authorization postgres;\n' + text);
  });
}

try {
  if (!process.argv.includes('--native-only')) await preparationChecks();
  if (process.argv.includes('--files-only')) {
    const reportPath=path.join(dir,'OFFLINE_VERIFICATION.md'),marker='<!-- BEGIN H1B2_EXECUTION_METHOD_REVIEW_RESULTS -->';
    const historical=fs.readFileSync(reportPath,'utf8').split(marker)[0].trimEnd();
    const current=`${marker}\n\n## Execution-method review — 2026-10-27\n\n${results.length} file-only preparation checks passed. No Docker operation, psql invocation, SQL, database/Auth connection, credential access or hosted operation occurred. Canonical source/hash, deterministic generation, release refusal and unchanged transaction-boundary checks only.\n\n${results.map(x=>'- PASS '+x).join('\n')}\n\nLegacy SQL Editor method/approval fields are refused; the proposed psql method still requires explicit human authorization, approved Git source and final artifact integrity. Both canonical migrations and Gate D/security assertion sources remain unchanged. Historical Gate B.1 and B.2 database/CLI evidence above was not rerun and is not evidence that the new proposed psql/profile/timeouts have been tested against hosted Supabase.\n`;
    fs.writeFileSync(reportPath,historical+'\n\n'+current);
    console.log('ALL '+results.length+' FILE-ONLY CHECKS PASSED');
    process.exit(0);
  }
  const endpoint = docker(['context','inspect','--format','{{.Endpoints.docker.Host}}']).stdout.trim();
  check(endpoint === 'npipe:////./pipe/dockerDesktopLinuxEngine', 'Only the local Docker Desktop engine is permitted');
  const imageId = docker(['image','inspect','--format','{{.Id}}',image]).stdout.trim();
  docker(['run','--detach','--pull','never','--name',name,'--network','none','--read-only',
    '--cap-drop','ALL','--security-opt','no-new-privileges','--memory','1g','--cpus','1','--pids-limit','128',
    '--tmpfs','/review:rw,nosuid,noexec,size=256m,uid=100,gid=101',
    '--tmpfs','/tmp:rw,nosuid,noexec,size=64m,uid=100,gid=101',
    '--user','100:101','--entrypoint','/bin/bash',image,'-c',
    "initdb -D /review/pgdata -U local_bootstrap_admin --auth=trust --no-instructions >/review/init.log && exec postgres -D /review/pgdata -k /tmp -h 127.0.0.1 -c shared_preload_libraries='' -c log_statement=none"]);
  containerCreated = true;
  for (let n = 0; ; n++) {
    const r = docker(['exec',name,'pg_isready','-h','/tmp','-U','local_bootstrap_admin'],undefined,true);
    if (r.status === 0) break;
    if (n > 60) throw new Error('Disposable PostgreSQL did not become ready');
    await new Promise(resolve => setTimeout(resolve,100));
  }
  sql(`create role postgres login nosuperuser createrole nocreatedb noinherit nobypassrls noreplication;
create role anon nologin nosuperuser;
create role authenticated nologin nosuperuser;
create role service_role nologin nosuperuser bypassrls;
create role authenticator nologin nosuperuser noinherit;
grant anon,authenticated,service_role to authenticator with inherit false, set true;`, false);
  check(sql('select current_setting(\'server_version\');',false).stdout.trim() === '17.11', 'Wrong local PostgreSQL version');

  if (!process.argv.includes('--native-only')) {
  await test('default review artifact refuses execution and rolls back', () => { reset(); reject(template,'NOT AUTHORIZED'); absent(); });
  await test('wrong project attestation refuses execution', () => { reset(); reject(authorized.replace("v_operator_project_ref text := 'ozcxjphzzwekpwsbglaf'", "v_operator_project_ref text := 'wrong-project'"),'attestation'); absent(); });
  await test('unexpected effective/session role refuses execution', () => {
    reset(); const r = sql(authorized,false,'postgres',true); check(r.status !== 0 && r.stderr.includes('unexpected database'),'Identity guard did not fail'); absent();
  });
  await test('unreviewed event-trigger fingerprint refuses execution', () => {
    reset(); reject(authorized.replace(expectedEmptyTriggerHash,'UNREVIEWED'),'event-trigger'); absent();
  });
  await test('changed enabled DDL event trigger refuses execution', () => {
    reset("create function public.fixture_ddl() returns event_trigger language plpgsql as $$ begin null; end $$; create event trigger fixture_ddl on ddl_command_end execute function public.fixture_ddl();");
    reject(authorized,'event-trigger'); absent();
  });
  await test('reviewed trigger fingerprint is stable across inspection/bootstrap search paths', () => {
    reset("create function public.fixture_ddl() returns event_trigger language plpgsql as $$ begin null; end $$; create event trigger fixture_ddl on ddl_command_end execute function public.fixture_ddl();");
    const inventory=fs.readFileSync(path.join(dir,'PRE_EXECUTION_INVENTORY.sql'),'utf8');
    const start=inventory.indexOf('select encode(');
    const query=inventory.slice(start,inventory.indexOf(';',start)+1);
    const fingerprint=sql(query,false).stdout.trim();
    check(/^[a-f0-9]{64}$/.test(fingerprint),'Invalid local trigger fingerprint');
    sql(authorized.replace(expectedEmptyTriggerHash,fingerprint)); sql(gateD);
  });
  await test('standalone type collision refuses bootstrap without replacing it', () => {
    reset('create type public.c1_inspections as (id text);'); reject(authorized,'collision');
    check(sql("select to_regnamespace('c1_private') is null and to_regrole('c1_executor') is null and to_regnamespace('supabase_migrations') is null;",false).stdout.trim()==='t','Collision caused partial bootstrap');
    check(sql("select to_regtype('public.c1_inspections') is not null;",false).stdout.trim() === 't','Collision was modified');
  });
  await test('pre-existing metadata schema refuses bootstrap', () => {
    reset('create schema supabase_migrations;'); reject(authorized,'metadata schema');
    check(sql("select to_regnamespace('c1_private') is null and to_regrole('c1_executor') is null;",false).stdout.trim() === 't','Unexpected application objects');
  });
  await test('original baseline retains exactly the reported service_role Dxtm', () => {
    reset(); sql('begin;\n'+baseline+'\ncommit;');
    const r = sql("select string_agg(has_table_privilege('service_role','public.c1_inspections',p)::text,',' order by n) from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) with ordinality v(p,n);",false);
    check(r.stdout.trim() === 'false,false,false,false,true,true,true,true','Unexpected baseline privilege prediction: '+r.stdout);
  });
  await test('atomic bootstrap passes all application and history assertions', () => { reset(); sql(authorized); sql(gateD); });
  await test('database history receipts match both canonical source hashes',()=>{
    const r=sql("select version || ':' || encode(extensions.digest(convert_to(statements[1],'UTF8'),'sha256'),'hex') from supabase_migrations.schema_migrations order by version;",false);
    check(r.stdout.trim()==='20261024000100:'+sha(baseline)+'\n20261027000100:'+sha(hardening),'Recorded source hashes differ from canonical sources');
  });
  await test('duplicate attempt refuses replay and preserves exactly two records', () => {
    reject(authorized,'metadata schema');
    check(sql('select count(*) from supabase_migrations.schema_migrations;',false).stdout.trim() === '2','Duplicate altered ledger');
  });
  await test('PUBLIC TEMP remains true, executor remains NOLOGIN, Auth fixture has no users', () => {
    const r=sql("select has_database_privilege('c1_executor','postgres','TEMP') and not (select rolcanlogin from pg_roles where rolname='c1_executor') and (select count(*)=0 from auth.users);",false);
    check(r.stdout.trim()==='t','TEMP/login/Auth boundary changed');
  });
  await test('lost acknowledgement recovery uses a fresh connection and matching receipts', () => {
    sql(fs.readFileSync(path.join(dir,'RECOVERY_INVENTORY.sql'),'utf8'));
    const r=sql(fs.readFileSync(path.join(dir,'RECOVERY_HISTORY.sql'),'utf8'));
    check((r.stdout.match(/MATCH/g)||[]).length===2 && !r.stdout.includes('STOP_'),'Recovery receipt mismatch'); sql(gateD);
  });

  const mutations = [
    ['MAINTAIN grant','grant maintain on public.c1_inspections to service_role;'],
    ['column grant','grant select(owner_id) on public.c1_inspections to service_role;'],
    ['inherited read access','grant pg_read_all_data to service_role with inherit true;'],
    ['SET ROLE escalation','grant c1_executor to service_role with inherit false, set true;'],
    ['executor LOGIN','alter role c1_executor login;'],
    ['FORCE RLS','alter table public.c1_inspections force row level security;'],
    ['owner policy widening','alter policy c1_owner_read on public.c1_inspections using (true);'],
    ['column default drift','alter table public.c1_inspections alter column document_version set default 2;'],
    ['definer search_path','alter function c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz) set search_path=public;'],
    ['definer owner','alter function c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz) owner to service_role;'],
    ['history source corruption',"update supabase_migrations.schema_migrations set statements=array['altered'] where version='20261024000100';"],
    ['metadata column grant','grant select(version) on supabase_migrations.schema_migrations to service_role;'],
  ];
  for (const [label, mutation] of mutations) await test('Gate D rejects '+label+' and rolls back mutation', () => {
    const r=sql('begin;\n'+mutation+'\nset local role postgres;\n'+gateD+'\ncommit;',false,'postgres',true);
    check(r.status!==0 && r.stderr.includes('H1B2_STOP'),'Mutation escaped: '+label+' '+r.stderr); sql(gateD);
  });
  await test('failure in hardening rolls back baseline, role, metadata and receipts', () => {
    reset(); reject(authorized.replace('-- BEGIN COMPANION HARDENING','select 1/0;\n-- BEGIN COMPANION HARDENING'),'division by zero'); absent();
  });
  await test('failed postcondition rolls back all DDL and history', () => {
    reset(); reject(beforeAssertions('grant maintain on public.c1_inspections to service_role;'),'H1B2_STOP'); absent();
  });
  await test('unintended inherited grants fail closed without broad corrective revokes', () => {
    reset('grant pg_read_all_data to service_role with inherit true;'); reject(authorized,'H1B2_STOP'); absent();
  });
  await test('scoped hardening removes private/global service defaults while preserving defaults', () => {
    reset(`alter default privileges for role postgres grant execute on functions to service_role;
alter default privileges for role postgres grant usage on schemas to service_role;
alter default privileges for role postgres grant select on tables to service_role;`);
    sql(authorized); sql(gateD);
  });
  await test('concurrent approved attempts commit exactly one bootstrap', async () => {
    reset(); const pair=await Promise.all([sqlAsync(authorized),sqlAsync(authorized)]);
    check(pair.filter(r=>r.status===0).length===1 && pair.filter(r=>r.stderr.includes('metadata schema')).length===1,'Concurrent outcome unexpected'); sql(gateD);
  });
  }

  if (!gateB2) {
  denyProxy=http.createServer((req,res)=>{ blockedHttpAttempts++; res.writeHead(403);res.end('Offline local test: outbound HTTP denied'); });
  denyProxy.on('connect',(req,socket)=>{blockedHttpAttempts++;socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');});
  await new Promise(resolve=>denyProxy.listen(0,'127.0.0.1',resolve));
  localProxy=net.createServer(socket=>{
    const tunnel=spawn('docker',['--context','desktop-linux','exec','-i',name,'/usr/bin/nc','127.0.0.1','5432']);
    tunnels.add(tunnel); tunnel.stderr.resume(); socket.pipe(tunnel.stdin); tunnel.stdout.pipe(socket);
    tunnel.stdin.on('error',()=>socket.destroy());
    tunnel.on('close',()=>{tunnels.delete(tunnel);socket.destroy();});
    socket.on('error',()=>tunnel.kill()); socket.on('close',()=>tunnel.kill());
  });
  await new Promise(resolve=>localProxy.listen(0,'127.0.0.1',resolve));
  cliLocalPort=localProxy.address().port;
  // Native --local uses only the loopback port in the isolated config. No URL.
  const normalFiles={'20261024000100_c1_owner_inspections.sql':baseline,'20261027000100_c1_hosted_acl_hardening.sql':hardening};
  await test('installed CLI executable reports pinned version 2.76.10', async () => {
    const r=await cliRun(['--version'],runtime);
    check(r.status===0 && r.stdout.trim()==='2.76.10','CLI executable version differs from package pin');
  });
  await test('native CLI two-file failure leaves first migration committed and Dxtm present', async () => {
    reset();
    const cwd=cliWorkspace('native-failure',{...normalFiles,'20261027000100_c1_hosted_acl_hardening.sql':'select 1/0;\n'+hardening});
    const r=await cliRun(['db','push','--local','--yes'],cwd);
    fs.writeFileSync(path.join(runtime,'native-failure.txt'),r.stdout+r.stderr);
    check(r.status!==0 && (r.stdout+r.stderr).includes('division by zero'),'CLI failure proof did not reach second file: '+r.stderr.slice(0,1800));
    check(sql("select count(*)=1 and min(version)='20261024000100' from supabase_migrations.schema_migrations;",false).stdout.trim()==='t','CLI did not commit baseline separately');
    check(sql("select has_table_privilege('service_role','public.c1_inspections','TRUNCATE') and has_table_privilege('service_role','public.c1_inspections','MAINTAIN');",false).stdout.trim()==='t','CLI test missing retained Dxtm');
  });
  await test('native CLI list and push accept explicit bootstrap history and skip both sources', async () => {
    reset(); sql(authorized);
    const cwd=cliWorkspace('future-compatibility',normalFiles);
    const list=await cliRun(['migration','list','--local'],cwd);
    check(list.status===0 && list.stdout.includes('20261024000100') && list.stdout.includes('20261027000100'),'CLI list rejected metadata: '+list.stderr);
    const push=await cliRun(['db','push','--local','--yes'],cwd);
    check(push.status===0 && /up to date/i.test(push.stdout+push.stderr),'CLI replayed or rejected matching migrations: '+push.stderr);
    const fetchDir=cliWorkspace('fetch-compatibility',{});
    const fetch=await cliRun(['migration','fetch','--local','--yes'],fetchDir);
    check(fetch.status===0,'CLI fetch rejected statements shape: '+fetch.stderr);
    for(const [file,content] of Object.entries(normalFiles)) {
      const fetched=path.join(fetchDir,'supabase/migrations',file);
      check(fs.existsSync(fetched),'CLI fetch missing '+file);
      check(fs.readFileSync(fetched,'utf8').includes(content.trimEnd()),'CLI fetch changed source text in '+file);
    }
    // Add a harmless future migration only in the ignored disposable workspace.
    fs.writeFileSync(path.join(cwd,'supabase/migrations/20261027000200_fixture_future.sql'),"select 'offline_future_migration';\n");
    const future=await cliRun(['db','push','--local','--yes'],cwd);
    check(future.status===0,'CLI future migration failed: '+future.stderr);
    check(sql("select count(*)=3 and max(version)='20261027000200' from supabase_migrations.schema_migrations;",false).stdout.trim()==='t','Future migration history mismatch');
  });
  }

  const report=`# H1b.2 offline verification — 2026-10-27\n\nNOT EXECUTED ON HOSTED. ${results.length} focused checks passed.\n\n- PostgreSQL: 17.11, cached image \`${image}\`, ID \`${imageId}\`.\n- Disposable container: network none, read-only root, tmpfs data, no volumes, passwords or Auth users.\n- Application SQL executes as non-superuser postgres with CREATEROLE; fixture administrator initializes only the disposable cluster.\n- Native Windows CLI package: 2.76.10; executable SHA-256 \`${sha(fs.readFileSync(cli))}\`.\n- CLI database transport: host loopback stdio tunnel into the same network-disabled container; no password, project link or hosted target. Outbound HTTP directed to a local deny proxy (${blockedHttpAttempts} blocked requests).\n- Lost acknowledgement test discards the prior response and verifies state from fresh connections; it does not inject a physical network fault at COMMIT.\n- This fixture models the reported grants and minimal Auth signatures; it is not a hosted Supabase/GoTrue/PostgREST integration certification.\n\n${results.map(x=>'- PASS '+x).join('\n')}\n\nNative CLI result: baseline commits before second-file failure; one history row and service_role TRUNCATE/MAINTAIN survive. Explicit bootstrap result: failure rolls back both files and metadata; CLI list, no-op push, fetch and a later migration accept the initialized history.\n\nThe disposable container is removed by the test harness; existing project containers/volumes are not modified. Raw local-only CLI failure evidence stays under ignored artifacts/h1b2/.\n`;
  if(gateB2) {
    const reportPath=path.join(dir,'OFFLINE_VERIFICATION.md'),marker='<!-- BEGIN H1B2_GATE_B2_RESULTS -->';
    const historical=fs.readFileSync(reportPath,'utf8').split(marker)[0].trimEnd();
    const focused=`${marker}\n\n## Gate B.2 canonical migration/release safety — 2026-10-27\n\nNOT EXECUTED ON HOSTED. ${results.length} focused checks passed. Historical Gate B.1 results above are retained; native CLI compatibility checks were not rerun.\n\n${results.map(x=>'- PASS '+x).join('\n')}\n\nBoth canonical source hashes and recorded source chunks match the approved values. Generator negative cases use copied fixtures only; the real baseline/canonical sources were not altered. Read-only Git revision checks reject the current uncommitted release inputs. Synthetic JSON attestations in negative tests are not human approval. No command enables SQL.\n\nAtomic rollback and concurrency were rechecked in disposable PostgreSQL 17.11 (${imageId}), using a network-disabled container and no credentials/Auth users. SQL Editor execution method and hosted behavior remain unverified/unapproved. The exact metadata format stays pinned to CLI 2.76.10 and its previously recorded compatibility proof.\n`;
    fs.writeFileSync(reportPath,historical+'\n\n'+focused);
  } else fs.writeFileSync(process.argv.includes('--native-only')?path.join(runtime,'NATIVE_PROOF.md'):path.join(dir,'OFFLINE_VERIFICATION.md'),report);
  console.log('ALL '+results.length+' CHECKS PASSED');
} finally {
  if(localProxy) localProxy.close();
  if(denyProxy) denyProxy.close();
  for(const tunnel of tunnels) tunnel.kill();
  if(containerCreated && /^h1b2-offline-[a-f0-9]{12}$/.test(name)) docker(['rm','--force',name]);
}
