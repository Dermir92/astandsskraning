// Offline generation/release-prerequisite verification only. No database/network.
// Subprocesses are limited to read-only Git queries, with optional locks/fetch off.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(dir, '../../..');
const baselinePath = 'supabase/migrations/20261024000100_c1_owner_inspections.sql';
const companionPath = 'supabase/migrations/20261027000100_c1_hosted_acl_hardening.sql';
const expectedBaseline = '6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8';
const expectedCompanion = '6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const args = process.argv.slice(2);
const mode = args.length === 0 ? 'generate' : args.length === 1 && args[0] === '--check' ? 'check'
  : args.length === 2 && args[0] === '--verify-release' ? 'verify-release' : null;
if (!mode) throw new Error('STOP: use no arguments, --check, or --verify-release <approval-json>');
function approvedBytes(relativePath, expectedHash) {
  const absolutePath = path.join(repo, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new Error('STOP: missing approved canonical source: ' + relativePath);
  }
  const bytes = fs.readFileSync(absolutePath);
  if (sha(bytes) !== expectedHash) throw new Error('STOP: approved source hash mismatch: ' + relativePath);
  return bytes;
}
// Validate BOTH canonical sources before writing ANY generated output.
const baselineBytes = approvedBytes(baselinePath, expectedBaseline);
const companionBytes = approvedBytes(companionPath, expectedCompanion);
const reviewCopy = approvedBytes('docs/review/h1b2/HARDENING.sql', expectedCompanion);
if (!reviewCopy.equals(companionBytes)) throw new Error('STOP: review/canonical companion bytes differ');
const baseline = baselineBytes.toString('utf8');
const hardening = companionBytes.toString('utf8');
const canonicalMigrations = [
  { version: '20261024000100', name: 'c1_owner_inspections', source: baselinePath, sha256: expectedBaseline },
  { version: '20261027000100', name: 'c1_hosted_acl_hardening', source: companionPath, sha256: expectedCompanion },
];
const releaseSourcePaths = [...canonicalMigrations.map(m => m.source),
  'docs/review/h1b2/prepare.mjs', 'docs/review/h1b2/GATE_D.template.sql',
  'docs/review/h1b2/HISTORY_ASSERTIONS.template.sql', 'docs/review/h1b2/HARDENING.sql',
  'docs/review/h1b2/EXECUTION_METHOD_REVIEW.md', 'docs/review/h1b2/README.md',
  'docs/review/h1b2/RECOVERY_INVENTORY.sql'];
function git(...gitArgs) {
  try {
    return execFileSync('git', gitArgs, { cwd: repo, encoding: null,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1' },
      stdio: ['ignore','pipe','pipe'], maxBuffer: 2 * 1024 * 1024 });
  } catch { return null; }
}
// Git identity is live release evidence, not deterministic generated content.
// Ordinary generation/checking depends only on the pinned source bytes.
let sourceGitRevision = null;
let releaseApproval = null;
if (mode === 'verify-release') {
  const gitRoot = git('rev-parse','--show-toplevel')?.toString().trim();
  const gitRootMatches = gitRoot !== undefined && path.resolve(gitRoot).toLowerCase() === repo.toLowerCase();
  sourceGitRevision = gitRootMatches ? git('rev-parse','--verify','HEAD')?.toString().trim() ?? null : null;
  try { releaseApproval = JSON.parse(fs.readFileSync(path.resolve(args[1]),'utf8')); }
  catch { throw new Error('STOP: release approval JSON is missing or invalid'); }
  if (releaseApproval?.schemaVersion !== 1 || releaseApproval.canonicalFilesReviewed !== true
      || releaseApproval.gateCExecutionApproved !== true
      || releaseApproval.executionMethodApprovedAndVerified !== true
      || releaseApproval.executionMethod !== 'psql-single-session-explicit-transaction-on-error-stop'
      || typeof releaseApproval.approvalReference !== 'string' || !releaseApproval.approvalReference.trim()) {
    throw new Error('STOP: explicit canonical review, Gate C and verified execution-method attestations required');
  }
  if (!Array.isArray(releaseApproval.canonicalMigrations) || releaseApproval.canonicalMigrations.length !== 2
      || !canonicalMigrations.every((migration, index) => Object.entries(migration)
        .every(([key,value]) => releaseApproval.canonicalMigrations[index]?.[key] === value))) {
    throw new Error('STOP: approved canonical filename/version/hash mapping differs');
  }
  if (!gitRootMatches || !sourceGitRevision || !/^[a-f0-9]{40}$/.test(releaseApproval.approvedGitRevision ?? '')
      || releaseApproval.approvedGitRevision !== sourceGitRevision) {
    throw new Error('STOP: approved Git revision must equal this exact repository HEAD');
  }
  for (const source of releaseSourcePaths) {
    const blob = git('cat-file','blob',sourceGitRevision + ':' + source);
    if (blob === null || !blob.equals(fs.readFileSync(path.join(repo,source)))) {
      throw new Error('STOP: release source absent from approved revision or differs from it: ' + source);
    }
  }
}
const functionBody = baseline.match(/as \$\$([\s\S]*?)\$\$;/)?.[1];
if (!functionBody) throw new Error('STOP: original function body not found');
for (const [source, tag] of [[baseline, '$h1b2_baseline_source$'], [hardening, '$h1b2_hardening_source$']]) {
  if (source.includes(tag)) throw new Error('STOP: source dollar-quote collision');
}
const applicationAssertions = fs.readFileSync(path.join(dir, 'GATE_D.template.sql'), 'utf8')
  .replaceAll('__FUNCTION_BODY_SHA256__', sha(functionBody));
const historyAssertions = fs.readFileSync(path.join(dir, 'HISTORY_ASSERTIONS.template.sql'), 'utf8')
  .replaceAll('__BASELINE_SHA256__', sha(baselineBytes)).replaceAll('__HARDENING_SHA256__', sha(hardening));
const gateD = applicationAssertions + '\n' + historyAssertions + `
select 'PASS_NOLOGIN_BOOTSTRAP_ONLY' as gate_d_catalog_result,
       'BLOCKED_PUBLIC_TEMPORARY_REQUIRES_GATE_E_DECISION' as executor_admission;
`;
if (/__[A-Z_]+__/.test(gateD)) throw new Error('STOP: unresolved assertion input');

const eventFingerprint = `select encode(extensions.digest(convert_to(coalesce(jsonb_agg(jsonb_build_object(
      'name', e.evtname, 'event', e.evtevent, 'tags', e.evttags,
      'enabled', e.evtenabled, 'owner', pg_get_userbyid(e.evtowner),
      'function', format('%I.%I()', n.nspname, p.proname),
      'function_owner', pg_get_userbyid(p.proowner),
      'definition_sha256', encode(extensions.digest(convert_to(pg_get_functiondef(p.oid), 'UTF8'), 'sha256'), 'hex')
    ) order by e.evtname), '[]'::jsonb)::text, 'UTF8'), 'sha256'), 'hex')
    from pg_event_trigger e join pg_proc p on p.oid = e.evtfoid join pg_namespace n on n.oid = p.pronamespace
    where e.evtenabled <> 'D'`;
const boundarySnapshot = `select jsonb_build_object(
    'database_acl', (select datacl::text from pg_database where datname = current_database()),
    'global_defaults', (select coalesce(jsonb_agg(to_jsonb(d) order by d.defaclrole, d.defaclobjtype), '[]'::jsonb)
      from pg_default_acl d where d.defaclnamespace = 0))::text`;

const preflight = `-- H1b.2 supplementary pre-execution inventory. SELECT ONLY. NOT EXECUTED ON HOSTED.
-- Independent project identity must be checked in Dashboard; SQL cannot prove it.
-- Run ONE SELECT at a time, inspect its result, then decide whether to continue.
select current_database() as database_name, current_user as effective_role,
       session_user as session_identity, current_setting('server_version') as server_version,
       current_setting('createrole_self_grant') as creator_membership_options,
       to_regnamespace('supabase_migrations') as history_schema,
       to_regclass('supabase_migrations.schema_migrations') as history_table;

-- Review enabled DDL event triggers and pin this fingerprint only after approval.
${eventFingerprint};

select e.evtname, e.evtevent, e.evttags, e.evtenabled,
       pg_get_userbyid(e.evtowner) as owner, e.evtfoid::regprocedure as handler,
       encode(extensions.digest(convert_to(pg_get_functiondef(p.oid), 'UTF8'), 'sha256'), 'hex') as handler_sha256
from pg_event_trigger e join pg_proc p on p.oid = e.evtfoid where e.evtenabled <> 'D'
order by e.evtname;

-- Full defaults for the actual creator, including GLOBAL schema/function defaults.
select pg_get_userbyid(d.defaclrole) as creator, coalesce(n.nspname, '(global)') as schema_name,
       d.defaclobjtype, d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace
where d.defaclrole = to_regrole('postgres') order by schema_name, d.defaclobjtype;

-- All non-system schemas: inspect effective schema access and any metadata schema.
select n.nspname, pg_get_userbyid(n.nspowner) as owner, n.nspacl
from pg_namespace n where n.nspname !~ '^pg_' and n.nspname <> 'information_schema'
order by n.nspname;

select m.member::regrole as member, m.roleid::regrole as granted_role,
       m.admin_option, m.inherit_option, m.set_option
from pg_auth_members m order by 1, 2;
`;

const bootstrap = `-- H1b.2 EXACT PROPOSED BOOTSTRAP. NOT EXECUTED ON HOSTED.
-- Generated from BOTH hash-verified canonical supabase/migrations source files.
-- SQL cannot prove local Git presence/approval: mandatory offline release check.
-- Review/approve the exact release copy and fail-on-error psql method separately.
-- THIS FILE FAILS CLOSED by default. Three release inputs require independent review.
-- A project-ref literal is an OPERATOR ATTESTATION, not server identity evidence.
-- Submit the complete approved batch on ONE connection. Never run a selection.
begin;
set local search_path = pg_catalog;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(68412027, 2);

do $h1b2_pre$
declare
  v_execution_authorized boolean := false; -- RELEASE INPUT: separate Gate C authorization.
  v_operator_project_ref text := 'UNCONFIRMED'; -- RELEASE INPUT: Dashboard attestation.
  v_approved_event_trigger_fingerprint text := 'UNREVIEWED'; -- RELEASE INPUT: reviewed SELECT inventory.
  v_actual_fingerprint text;
  v_boundary text;
begin
  if not v_execution_authorized then
    raise exception 'H1B2_STOP: review artifact is NOT AUTHORIZED for execution';
  end if;
  if v_operator_project_ref <> 'ozcxjphzzwekpwsbglaf' then
    raise exception 'H1B2_STOP: independent project attestation missing';
  end if;
  if current_database() <> 'postgres' or current_user <> 'postgres' or session_user <> 'postgres'
     or current_setting('server_version_num')::integer <> 170011 then
    raise exception 'H1B2_STOP: unexpected database, session/effective role or PostgreSQL version';
  end if;
  if not exists (select 1 from pg_roles where rolname = current_user and rolcreaterole and not rolsuper)
     or current_setting('createrole_self_grant') <> ''
     or not has_database_privilege(current_user, current_database(), 'CREATE')
     or not has_schema_privilege(current_user, 'public', 'CREATE') then
    raise exception 'H1B2_STOP: migration-owner capability or creator membership mismatch';
  end if;
  if to_regnamespace('supabase_migrations') is not null
     or exists (select 1 from pg_namespace where nspname ~ '^c1_')
     or exists (select 1 from pg_roles where rolname ~ '^c1_')
     or exists (select 1 from pg_class where relname ~ '^c1_')
     or exists (select 1 from pg_type where typname ~ '^c1_')
     or exists (select 1 from pg_proc where proname ~ '^c1_' or proname = 'save_inspection') then
    raise exception 'H1B2_STOP: C1 collision or pre-existing migration metadata schema; do not reuse/drop/repair';
  end if;
  if (select count(*) from pg_roles where rolname in
      ('anon','authenticated','authenticator','service_role')) <> 4
     or to_regclass('auth.users') is null or to_regprocedure('auth.uid()') is null
     or to_regprocedure('extensions.digest(bytea,text)') is null then
    raise exception 'H1B2_STOP: dependency missing';
  end if;
  if not exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace
      where e.extname = 'pgcrypto' and e.extversion = '1.3' and n.nspname = 'extensions')
     or not has_schema_privilege(current_user, 'auth', 'USAGE')
     or not has_table_privilege(current_user, 'auth.users', 'REFERENCES')
     or not has_schema_privilege(current_user, 'extensions', 'USAGE')
     or not has_function_privilege(current_user, 'extensions.digest(bytea,text)', 'EXECUTE')
     or not has_language_privilege(current_user, 'plpgsql', 'USAGE')
     or not has_schema_privilege('authenticated', 'auth', 'USAGE')
     or not has_function_privilege('authenticated', 'auth.uid()', 'EXECUTE') then
    raise exception 'H1B2_STOP: dependency privilege mismatch';
  end if;
  if exists (select 1 from pg_namespace n,
      lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
      where a.grantee = 0 and a.privilege_type = 'CREATE') then
    raise exception 'H1B2_STOP: PUBLIC has schema CREATE';
  end if;
  if (select count(*) from pg_database d,
      lateral aclexplode(coalesce(d.datacl, acldefault('d', d.datdba))) a
      where d.datname = current_database() and a.grantee = 0
      and a.privilege_type in ('CONNECT','TEMPORARY')) <> 2
     or exists (select 1 from pg_database d,
       lateral aclexplode(coalesce(d.datacl, acldefault('d', d.datdba))) a
       where d.datname = current_database() and a.grantee = 0 and a.privilege_type = 'CREATE') then
    raise exception 'H1B2_STOP: PUBLIC database ACL differs from reviewed CONNECT/TEMP';
  end if;
  ${eventFingerprint.replace('\n    from pg_event_trigger', '\n    into v_actual_fingerprint from pg_event_trigger')};
  if v_actual_fingerprint is distinct from v_approved_event_trigger_fingerprint then
    raise exception 'H1B2_STOP: enabled event-trigger inventory is unreviewed or changed';
  end if;
  ${boundarySnapshot.replace(')::text', ')::text into v_boundary')};
  perform set_config('h1b2.boundary_snapshot', v_boundary, true);
end
$h1b2_pre$;

-- Pinned CLI 2.76.10-compatible metadata shape. No IF NOT EXISTS or status repair.
create schema supabase_migrations authorization postgres;
revoke all on schema supabase_migrations from public, anon, authenticated, service_role;
create table supabase_migrations.schema_migrations (
  version text not null primary key,
  statements text[],
  name text
);
revoke all on table supabase_migrations.schema_migrations from public, anon, authenticated, service_role;

-- BEGIN ORIGINAL C1 BYTES (SHA-256 ${expectedBaseline})
${baseline}-- END ORIGINAL C1 BYTES

-- BEGIN COMPANION HARDENING
${hardening}-- END COMPANION HARDENING

-- Store exact source text, one complete source chunk per statements array.
-- CLI compares version IDs; statements/name also support migration fetch.
insert into supabase_migrations.schema_migrations (version, name, statements) values
 ('20261024000100', 'c1_owner_inspections', array[$h1b2_baseline_source$${baseline}$h1b2_baseline_source$]),
 ('20261027000100', 'c1_hosted_acl_hardening', array[$h1b2_hardening_source$${hardening}$h1b2_hardening_source$]);

${gateD}

do $h1b2_boundary$
declare
  v_boundary text;
begin
  ${boundarySnapshot.replace(')::text', ')::text into v_boundary')};
  if v_boundary is distinct from current_setting('h1b2.boundary_snapshot') then
    raise exception 'H1B2_STOP: database ACL or global defaults changed';
  end if;
end
$h1b2_boundary$;

-- Only this COMMIT makes application objects, hardening and both receipts visible.
commit;
-- A pre-COMMIT PASS result is provisional. A lost acknowledgement requires recovery.
`;

const recoveryHistory = `-- SELECT ONLY. NOT EXECUTED ON HOSTED.
-- Run ONLY after RECOVERY_INVENTORY.sql confirms the expected history table exists.
-- Both rows must match, count must be two, then GATE_D.sql must pass independently.
-- Zero/one/extra rows, wrong shape/hash/owner, or any error: STOP; no repair/retry.
select version, name, cardinality(statements) as source_chunks,
       encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') as source_sha256,
       case
         when version = '20261024000100' and name = 'c1_owner_inspections'
           and cardinality(statements) = 1 and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '${sha(baselineBytes)}' then 'MATCH'
         when version = '20261027000100' and name = 'c1_hosted_acl_hardening'
           and cardinality(statements) = 1 and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '${sha(hardening)}' then 'MATCH'
         else 'STOP_MISMATCH'
       end as source_check
from supabase_migrations.schema_migrations order by version;

select count(*) = 2 as exactly_two_rows,
       (select nspowner = 'postgres'::regrole from pg_namespace where oid = 'supabase_migrations'::regnamespace) as schema_owner_matches,
       (select relowner = 'postgres'::regrole from pg_class where oid = 'supabase_migrations.schema_migrations'::regclass) as table_owner_matches
from supabase_migrations.schema_migrations;
`;
const outputs = {
  'GATE_D.sql': gateD,
  'PRE_EXECUTION_INVENTORY.sql': preflight,
  'BOOTSTRAP.NOT_EXECUTED.sql': bootstrap,
  'RECOVERY_HISTORY.sql': recoveryHistory,
};

const files = [baselinePath, companionPath, ...fs.readdirSync(dir).filter(name => name !== 'manifest.json' && name !== 'OFFLINE_VERIFICATION.md')
  .map(name => 'docs/review/h1b2/' + name)].sort();
const manifest = {
  status: 'REVIEW_ONLY_NOT_EXECUTED_ON_HOSTED',
  projectRef: 'ozcxjphzzwekpwsbglaf',
  expectedPostgresVersion: '17.11',
  cliVersion: '2.76.10',
  cliExecutableSha256: sha(fs.readFileSync(path.join(repo, 'node_modules/supabase/bin/supabase.exe'))),
  strategy: 'explicit_single_transaction_with_two_history_rows',
  versions: canonicalMigrations,
  canonicalReviewCopy: { source: 'docs/review/h1b2/HARDENING.sql', sha256: sha(reviewCopy), matchesCanonical: true },
  releasePrerequisites: {
    gitRevisionValidation: 'LIVE_EXACT_HEAD_AND_COMMITTED_SOURCE_BYTES_REQUIRED_BY_VERIFY_RELEASE',
    approvedGitRevision: null,
    actualCanonicalFilesReviewRequired: true,
    committedReleaseSourcePaths: releaseSourcePaths,
    gateCExecutionApproved: false,
    proposedExecutionMethod: 'psql-single-session-explicit-transaction-on-error-stop',
    executionMethodApprovedAndVerified: false,
    sqlCannotVerifyLocalGitOrHumanApproval: true,
    readinessCommand: 'node docs/review/h1b2/prepare.mjs --verify-release <approval-json>',
    readinessCheckEnablesExecution: false,
  },
  originalFunctionBodySha256: sha(functionBody),
  releaseInputs: ['execution_authorized=false', 'operator_project_ref=UNCONFIRMED', 'event_trigger_fingerprint=UNREVIEWED'],
  files: files.map(name => {
    const generated = outputs[path.basename(name)];
    const bytes = name === baselinePath ? baselineBytes : name === companionPath ? companionBytes
      : name.startsWith('docs/review/h1b2/') && generated !== undefined
        ? Buffer.from(generated) : fs.readFileSync(path.join(repo, name));
    return { path: name, bytes: bytes.length, sha256: sha(bytes) };
  }),
};
outputs['manifest.json'] = JSON.stringify(manifest, null, 2) + '\n';
// Recheck canonical inputs at the output boundary as well as before rendering.
approvedBytes(baselinePath, expectedBaseline);
approvedBytes(companionPath, expectedCompanion);
approvedBytes('docs/review/h1b2/HARDENING.sql', expectedCompanion);
if (mode === 'generate') {
  for (const [name, value] of Object.entries(outputs)) fs.writeFileSync(path.join(dir,name),value);
  console.log('Prepared disabled review SQL from both approved canonical sources. No connection or execution.');
} else {
  for (const [name, value] of Object.entries(outputs)) {
    if (!fs.existsSync(path.join(dir,name)) || !fs.readFileSync(path.join(dir,name)).equals(Buffer.from(value))) {
      throw new Error('STOP: generated SQL/manifest is stale or modified: ' + name);
    }
  }
  console.log(mode === 'check' ? 'PASS: canonical hashes, generated SQL and manifest match; execution stays disabled.'
    : JSON.stringify({ result: 'PASS_LOCAL_RELEASE_PREREQUISITES_ATTESTED', approvedGitRevision: sourceGitRevision,
      canonicalMigrations, executionStillDisabled: true,
      notice: 'Approval fields are human attestations, not independent authorization. Verify source evidence and the final release-copy hash; no SQL was enabled or executed.' }));
}
