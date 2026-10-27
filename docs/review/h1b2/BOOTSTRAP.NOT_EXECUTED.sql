-- H1b.2 EXACT PROPOSED BOOTSTRAP. NOT EXECUTED ON HOSTED.
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
  select encode(extensions.digest(convert_to(coalesce(jsonb_agg(jsonb_build_object(
      'name', e.evtname, 'event', e.evtevent, 'tags', e.evttags,
      'enabled', e.evtenabled, 'owner', pg_get_userbyid(e.evtowner),
      'function', format('%I.%I()', n.nspname, p.proname),
      'function_owner', pg_get_userbyid(p.proowner),
      'definition_sha256', encode(extensions.digest(convert_to(pg_get_functiondef(p.oid), 'UTF8'), 'sha256'), 'hex')
    ) order by e.evtname), '[]'::jsonb)::text, 'UTF8'), 'sha256'), 'hex')
    into v_actual_fingerprint from pg_event_trigger e join pg_proc p on p.oid = e.evtfoid join pg_namespace n on n.oid = p.pronamespace
    where e.evtenabled <> 'D';
  if v_actual_fingerprint is distinct from v_approved_event_trigger_fingerprint then
    raise exception 'H1B2_STOP: enabled event-trigger inventory is unreviewed or changed';
  end if;
  select jsonb_build_object(
    'database_acl', (select datacl::text from pg_database where datname = current_database()),
    'global_defaults', (select coalesce(jsonb_agg(to_jsonb(d) order by d.defaclrole, d.defaclobjtype), '[]'::jsonb)
      from pg_default_acl d where d.defaclnamespace = 0))::text into v_boundary;
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

-- BEGIN ORIGINAL C1 BYTES (SHA-256 6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8)
-- C1 is an owner-only draft proof. There are deliberately no public write RPCs.
create schema c1_private;
revoke all on schema c1_private from public, anon, authenticated;

create role c1_executor nologin nosuperuser nocreatedb nocreaterole noinherit;
grant usage on schema c1_private to c1_executor;

create table public.c1_inspections (
  owner_id uuid not null references auth.users(id),
  id text not null,
  document jsonb not null,
  document_version integer not null default 1 check (document_version = 1),
  revision bigint not null check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id),
  check (jsonb_typeof(document) = 'object' and document->>'id' = id)
);
alter table public.c1_inspections enable row level security;
revoke all on public.c1_inspections from public, anon, authenticated, c1_executor;
grant select on public.c1_inspections to authenticated;
create policy c1_owner_read on public.c1_inspections for select to authenticated
  using (owner_id = (select auth.uid()));

-- Receipts are retry acknowledgements, not an inspection history. They expire
-- after 24 hours; the original request is rejected after that window even if a
-- receipt has been removed. Only a digest and result revision are retained.
create table c1_private.operation_receipts (
  owner_id uuid not null references auth.users(id),
  operation_id uuid not null,
  request_hash text not null,
  inspection_id text not null,
  result_revision bigint not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (owner_id, operation_id)
);
alter table c1_private.operation_receipts enable row level security;
revoke all on c1_private.operation_receipts from public, anon, authenticated, c1_executor;

-- Only the trusted server executor can call this function. The server verifies
-- Auth with GoTrue and validates the unchanged TypeScript domain contract first.
-- The definer bypasses RLS, so every table predicate explicitly scopes p_owner.
create function c1_private.save_inspection(
  p_owner uuid, p_id text, p_expected_revision bigint, p_document jsonb,
  p_operation uuid, p_issued_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_receipt c1_private.operation_receipts%rowtype;
  v_revision bigint;
begin
  if p_owner is null or p_operation is null or p_id is null or
     p_expected_revision is null or p_expected_revision < 0 or
     p_issued_at is null or p_issued_at < now() - interval '24 hours' or
     p_issued_at > now() + interval '1 minute' then
    raise exception 'invalid_or_expired_operation' using errcode = '22023';
  end if;
  if jsonb_typeof(p_document) is distinct from 'object' or
     p_document->>'id' is distinct from p_id or
     p_document->>'assetType' is distinct from 'apartment' or
     p_document#>>'{details,inspectionType}' is distinct from 'independent' or
     p_document ? 'linkedInitial' or coalesce((p_document->>'sampleReviewed')::boolean, false) then
    raise exception 'unsupported_c1_document' using errcode = '22023';
  end if;
  v_hash := encode(extensions.digest(convert_to(
    jsonb_build_array(p_id, p_expected_revision, p_document, p_issued_at)::text,
    'UTF8'), 'sha256'), 'hex');
  -- Only identical operation IDs serialize here; different inspections do not
  -- acquire a per-owner or collection lock. Hash collisions only add waiting.
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text || p_operation::text, 0));
  select * into v_receipt from c1_private.operation_receipts
    where owner_id = p_owner and operation_id = p_operation;
  if found then
    if v_receipt.request_hash <> v_hash then
      raise exception 'operation_reused_with_different_request' using errcode = '22023';
    end if;
    return jsonb_build_object('id', p_id, 'revision', v_receipt.result_revision,
      'document', p_document, 'replayed', true);
  end if;
  if p_expected_revision = 0 then
    -- The current domain list contract is bounded at 500. Serialize creation
    -- only (not edits) so concurrent tabs cannot exceed the readable collection.
    perform pg_advisory_xact_lock(hashtextextended('c1-create:' || p_owner::text, 0));
    if (select count(*) from public.c1_inspections where owner_id = p_owner) >= 500 then
      raise exception 'inspection_limit_reached' using errcode = '54000';
    end if;
    insert into public.c1_inspections(owner_id, id, document, revision)
      values (p_owner, p_id, p_document, 1)
      on conflict (owner_id, id) do nothing returning revision into v_revision;
  else
    update public.c1_inspections set document = p_document,
      revision = revision + 1, updated_at = now()
      where owner_id = p_owner and id = p_id and revision = p_expected_revision
      returning revision into v_revision;
  end if;
  if v_revision is null then
    raise exception 'revision_conflict' using errcode = 'P0001';
  end if;
  delete from c1_private.operation_receipts
    where owner_id = p_owner and expires_at < now();
  insert into c1_private.operation_receipts values
    (p_owner, p_operation, v_hash, p_id, v_revision, p_issued_at, p_issued_at + interval '24 hours');
  return jsonb_build_object('id', p_id, 'revision', v_revision,
    'document', p_document, 'replayed', false);
end;
$$;
revoke all on function c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)
  from public, anon, authenticated;
grant execute on function c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)
  to c1_executor;
alter default privileges in schema c1_private revoke execute on functions from public;
-- END ORIGINAL C1 BYTES

-- BEGIN COMPANION HARDENING
-- H1b.2 proposed companion migration. NOT EXECUTED ON HOSTED.
-- Proposed version: 20261027000100, name: c1_hosted_acl_hardening.
-- Apply only after the unchanged C1 baseline, in the SAME reviewed transaction.
-- Object-scoped only. No database privileges or global defaults are changed.
revoke all on table
  public.c1_inspections,
  c1_private.operation_receipts
from service_role;

revoke all on schema c1_private from service_role;

revoke all on function
  c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)
from service_role;
-- END COMPANION HARDENING

-- Store exact source text, one complete source chunk per statements array.
-- CLI compares version IDs; statements/name also support migration fetch.
insert into supabase_migrations.schema_migrations (version, name, statements) values
 ('20261024000100', 'c1_owner_inspections', array[$h1b2_baseline_source$-- C1 is an owner-only draft proof. There are deliberately no public write RPCs.
create schema c1_private;
revoke all on schema c1_private from public, anon, authenticated;

create role c1_executor nologin nosuperuser nocreatedb nocreaterole noinherit;
grant usage on schema c1_private to c1_executor;

create table public.c1_inspections (
  owner_id uuid not null references auth.users(id),
  id text not null,
  document jsonb not null,
  document_version integer not null default 1 check (document_version = 1),
  revision bigint not null check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id),
  check (jsonb_typeof(document) = 'object' and document->>'id' = id)
);
alter table public.c1_inspections enable row level security;
revoke all on public.c1_inspections from public, anon, authenticated, c1_executor;
grant select on public.c1_inspections to authenticated;
create policy c1_owner_read on public.c1_inspections for select to authenticated
  using (owner_id = (select auth.uid()));

-- Receipts are retry acknowledgements, not an inspection history. They expire
-- after 24 hours; the original request is rejected after that window even if a
-- receipt has been removed. Only a digest and result revision are retained.
create table c1_private.operation_receipts (
  owner_id uuid not null references auth.users(id),
  operation_id uuid not null,
  request_hash text not null,
  inspection_id text not null,
  result_revision bigint not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (owner_id, operation_id)
);
alter table c1_private.operation_receipts enable row level security;
revoke all on c1_private.operation_receipts from public, anon, authenticated, c1_executor;

-- Only the trusted server executor can call this function. The server verifies
-- Auth with GoTrue and validates the unchanged TypeScript domain contract first.
-- The definer bypasses RLS, so every table predicate explicitly scopes p_owner.
create function c1_private.save_inspection(
  p_owner uuid, p_id text, p_expected_revision bigint, p_document jsonb,
  p_operation uuid, p_issued_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_receipt c1_private.operation_receipts%rowtype;
  v_revision bigint;
begin
  if p_owner is null or p_operation is null or p_id is null or
     p_expected_revision is null or p_expected_revision < 0 or
     p_issued_at is null or p_issued_at < now() - interval '24 hours' or
     p_issued_at > now() + interval '1 minute' then
    raise exception 'invalid_or_expired_operation' using errcode = '22023';
  end if;
  if jsonb_typeof(p_document) is distinct from 'object' or
     p_document->>'id' is distinct from p_id or
     p_document->>'assetType' is distinct from 'apartment' or
     p_document#>>'{details,inspectionType}' is distinct from 'independent' or
     p_document ? 'linkedInitial' or coalesce((p_document->>'sampleReviewed')::boolean, false) then
    raise exception 'unsupported_c1_document' using errcode = '22023';
  end if;
  v_hash := encode(extensions.digest(convert_to(
    jsonb_build_array(p_id, p_expected_revision, p_document, p_issued_at)::text,
    'UTF8'), 'sha256'), 'hex');
  -- Only identical operation IDs serialize here; different inspections do not
  -- acquire a per-owner or collection lock. Hash collisions only add waiting.
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text || p_operation::text, 0));
  select * into v_receipt from c1_private.operation_receipts
    where owner_id = p_owner and operation_id = p_operation;
  if found then
    if v_receipt.request_hash <> v_hash then
      raise exception 'operation_reused_with_different_request' using errcode = '22023';
    end if;
    return jsonb_build_object('id', p_id, 'revision', v_receipt.result_revision,
      'document', p_document, 'replayed', true);
  end if;
  if p_expected_revision = 0 then
    -- The current domain list contract is bounded at 500. Serialize creation
    -- only (not edits) so concurrent tabs cannot exceed the readable collection.
    perform pg_advisory_xact_lock(hashtextextended('c1-create:' || p_owner::text, 0));
    if (select count(*) from public.c1_inspections where owner_id = p_owner) >= 500 then
      raise exception 'inspection_limit_reached' using errcode = '54000';
    end if;
    insert into public.c1_inspections(owner_id, id, document, revision)
      values (p_owner, p_id, p_document, 1)
      on conflict (owner_id, id) do nothing returning revision into v_revision;
  else
    update public.c1_inspections set document = p_document,
      revision = revision + 1, updated_at = now()
      where owner_id = p_owner and id = p_id and revision = p_expected_revision
      returning revision into v_revision;
  end if;
  if v_revision is null then
    raise exception 'revision_conflict' using errcode = 'P0001';
  end if;
  delete from c1_private.operation_receipts
    where owner_id = p_owner and expires_at < now();
  insert into c1_private.operation_receipts values
    (p_owner, p_operation, v_hash, p_id, v_revision, p_issued_at, p_issued_at + interval '24 hours');
  return jsonb_build_object('id', p_id, 'revision', v_revision,
    'document', p_document, 'replayed', false);
end;
$$;
revoke all on function c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)
  from public, anon, authenticated;
grant execute on function c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)
  to c1_executor;
alter default privileges in schema c1_private revoke execute on functions from public;
$h1b2_baseline_source$]),
 ('20261027000100', 'c1_hosted_acl_hardening', array[$h1b2_hardening_source$-- H1b.2 proposed companion migration. NOT EXECUTED ON HOSTED.
-- Proposed version: 20261027000100, name: c1_hosted_acl_hardening.
-- Apply only after the unchanged C1 baseline, in the SAME reviewed transaction.
-- Object-scoped only. No database privileges or global defaults are changed.
revoke all on table
  public.c1_inspections,
  c1_private.operation_receipts
from service_role;

revoke all on schema c1_private from service_role;

revoke all on function
  c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)
from service_role;
$h1b2_hardening_source$]);

-- H1b.2 fail-closed Gate D assertions. NOT EXECUTED ON HOSTED.
-- prepare.mjs pins the original function-body hash. Run the generated GATE_D.sql.
-- No DDL/DML, application function execution, Auth records, or credentials.
-- These assertions certify the NOLOGIN bootstrap only; TEMP still blocks Gate E.
do $h1b2_gate_d$
declare
  v_owner oid := to_regrole('postgres');
  v_executor oid := to_regrole('c1_executor');
  v_inspections oid := to_regclass('public.c1_inspections');
  v_receipts oid := to_regclass('c1_private.operation_receipts');
  v_function oid := to_regprocedure('c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)');
  v_private oid := to_regnamespace('c1_private');
  v_auth_users oid := to_regclass('auth.users');
  v_role record;
  v_relation record;
  v_column record;
  v_privilege text;
  v_expected boolean;
  v_actual text[];
  v_expected_constraints text[];
begin
  if current_database() <> 'postgres' or current_user <> 'postgres'
     or current_setting('server_version_num')::integer <> 170011 then
    raise exception 'H1B2_STOP: unexpected Gate D database, effective owner or PostgreSQL version';
  end if;
  if v_owner is null or v_executor is null or v_inspections is null
     or v_receipts is null or v_function is null or v_private is null or v_auth_users is null then
    raise exception 'H1B2_STOP: required application identity missing';
  end if;
  if (select count(*) from pg_roles where rolname in
      ('anon','authenticated','authenticator','service_role')) <> 4 then
    raise exception 'H1B2_STOP: required API role missing';
  end if;
  if exists (select 1 from pg_roles where oid = v_executor and
      (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit
       or rolbypassrls or rolreplication)) then
    raise exception 'H1B2_STOP: executor attributes exceed NOLOGIN bootstrap';
  end if;
  if exists (select 1 from pg_auth_members where member = v_executor) then
    raise exception 'H1B2_STOP: executor has outgoing role membership';
  end if;
  -- PG17 may grant the creator ADMIN on the new role. Direction matters.
  if exists (select 1 from pg_auth_members where roleid = v_executor and
      (member <> v_owner or not admin_option or inherit_option or set_option)) then
    raise exception 'H1B2_STOP: unexpected executor member or membership options';
  end if;
  if exists (select 1 from pg_roles r where r.oid <> v_executor and
      (pg_has_role(v_executor, r.oid, 'MEMBER') or pg_has_role(v_executor, r.oid, 'SET'))) then
    raise exception 'H1B2_STOP: executor can reach another role';
  end if;
  if exists (select 1 from pg_shdepend where refclassid = 'pg_authid'::regclass
      and refobjid = v_executor and deptype = 'o') then
    raise exception 'H1B2_STOP: executor owns an object';
  end if;
  if not has_database_privilege(v_executor, current_database(), 'CONNECT')
     or has_database_privilege(v_executor, current_database(), 'CREATE') then
    raise exception 'H1B2_STOP: unexpected executor database CONNECT/CREATE';
  end if;
  -- Deliberately no TEMP revoke. This observed capability is a Gate E blocker.
  if not has_database_privilege(v_executor, current_database(), 'TEMP') then
    raise exception 'H1B2_STOP: TEMP differs from the approved unchanged baseline';
  end if;
  if exists (select 1 from pg_namespace n where n.nspname !~ '^pg_(temp|toast_temp)_'
      and has_schema_privilege(v_executor, n.oid, 'CREATE')) then
    raise exception 'H1B2_STOP: executor has persistent schema CREATE';
  end if;
  if (select nspowner from pg_namespace where oid = v_private) <> v_owner then
    raise exception 'H1B2_STOP: private schema owner mismatch';
  end if;
  if exists (select 1 from pg_namespace n,
      lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
      where n.oid = v_private and (a.grantee not in (v_owner, v_executor)
      or (a.grantee = v_executor and (a.privilege_type <> 'USAGE' or a.is_grantable)))) then
    raise exception 'H1B2_STOP: unexpected private schema ACL, including PUBLIC';
  end if;
  if (select count(*) from pg_proc where pronamespace = v_private) <> 1
     or exists (select 1 from pg_class where relnamespace = v_private
       and relname not in ('operation_receipts', 'operation_receipts_pkey'))
     or exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname ~ '^c1_'
       and c.relname not in ('c1_inspections', 'c1_inspections_pkey')) then
    raise exception 'H1B2_STOP: unexpected C1 relations/routines';
  end if;
  if not exists (select 1 from pg_proc p where p.oid = v_function
      and p.proowner = v_owner and p.prosecdef and p.prokind = 'f'
      and p.prorettype = 'jsonb'::regtype
      and p.pronargdefaults = 0 and p.proargmodes is null
      and not p.proisstrict and not p.proleakproof
      and p.provolatile = 'v' and p.proparallel = 'u'
      and p.prolang = (select oid from pg_language where lanname = 'plpgsql')
      and p.proconfig = array['search_path=""']::text[]
      and p.proargnames = array['p_owner','p_id','p_expected_revision','p_document','p_operation','p_issued_at']::text[]
      and encode(extensions.digest(convert_to(p.prosrc, 'UTF8'), 'sha256'), 'hex') = '76575b94dead07df3a880975cd9327f903600543408c3a338f12b3e25fc97a05') then
    raise exception 'H1B2_STOP: definer owner, signature, configuration or original body mismatch';
  end if;
  if exists (select 1 from pg_proc p,
      lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      where p.oid = v_function and (a.grantee not in (v_owner, v_executor)
      or (a.grantee = v_executor and (a.privilege_type <> 'EXECUTE' or a.is_grantable)))) then
    raise exception 'H1B2_STOP: unexpected function ACL, including PUBLIC';
  end if;
  if not has_schema_privilege(v_owner, 'auth', 'USAGE')
     or not has_table_privilege(v_owner, v_auth_users, 'REFERENCES')
     or not has_schema_privilege(v_owner, 'extensions', 'USAGE')
     or not has_function_privilege(v_owner, 'extensions.digest(bytea,text)', 'EXECUTE')
     or not has_schema_privilege('authenticated', 'public', 'USAGE')
     or not has_schema_privilege('authenticated', 'auth', 'USAGE')
     or not has_function_privilege('authenticated', 'auth.uid()', 'EXECUTE') then
    raise exception 'H1B2_STOP: owner/Auth/digest prerequisite changed';
  end if;

  for v_relation in select c.* from pg_class c where c.oid in (v_inspections, v_receipts) loop
    if v_relation.relowner <> v_owner or v_relation.relkind <> 'r'
       or not v_relation.relrowsecurity or v_relation.relforcerowsecurity
       or v_relation.relpersistence <> 'p' or v_relation.relispartition then
      raise exception 'H1B2_STOP: table owner, RLS or relation shape mismatch';
    end if;
    if exists (select 1 from aclexplode(coalesce(v_relation.relacl,
        acldefault('r', v_relation.relowner))) a where a.grantee <> v_owner and not
        (v_relation.oid = v_inspections and a.grantee = to_regrole('authenticated')
         and a.privilege_type = 'SELECT' and not a.is_grantable)) then
      raise exception 'H1B2_STOP: unexpected table ACL, including PUBLIC or MAINTAIN';
    end if;
    if exists (select 1 from pg_attribute a, lateral aclexplode(a.attacl) acl
        where a.attrelid = v_relation.oid and not a.attisdropped and acl.grantee <> v_owner) then
      raise exception 'H1B2_STOP: unexpected direct column ACL';
    end if;
    if exists (select 1 from pg_trigger where tgrelid = v_relation.oid and not tgisinternal)
       or exists (select 1 from pg_rewrite where ev_class = v_relation.oid)
       or exists (select 1 from pg_inherits where inhrelid = v_relation.oid or inhparent = v_relation.oid) then
      raise exception 'H1B2_STOP: unexpected application trigger or rewrite rule';
    end if;
    select array_agg(format('%s:%s:%s:%s:%s:%s', attname, atttypid::regtype,
        attnotnull, atthasdef, attidentity, attgenerated) order by attnum)
      into v_actual from pg_attribute where attrelid = v_relation.oid and attnum > 0 and not attisdropped;
    if v_relation.oid = v_inspections then
      if v_actual is distinct from array[
          'owner_id:uuid:t:f::', 'id:text:t:f::', 'document:jsonb:t:f::',
          'document_version:integer:t:t::', 'revision:bigint:t:f::',
          'created_at:timestamp with time zone:t:t::', 'updated_at:timestamp with time zone:t:t::']::text[] then
        raise exception 'H1B2_STOP: inspections columns mismatch';
      end if;
      v_expected_constraints := array[
        'CHECK (((jsonb_typeof(document) = ''object''::text) AND ((document ->> ''id''::text) = id)))',
        'CHECK ((document_version = 1))', 'CHECK ((revision > 0))',
        'FOREIGN KEY (owner_id) REFERENCES auth.users(id)', 'PRIMARY KEY (owner_id, id)'];
    else
      if v_actual is distinct from array[
          'owner_id:uuid:t:f::', 'operation_id:uuid:t:f::', 'request_hash:text:t:f::',
          'inspection_id:text:t:f::', 'result_revision:bigint:t:f::',
          'issued_at:timestamp with time zone:t:f::', 'expires_at:timestamp with time zone:t:f::']::text[] then
        raise exception 'H1B2_STOP: receipts columns mismatch';
      end if;
      v_expected_constraints := array[
        'FOREIGN KEY (owner_id) REFERENCES auth.users(id)', 'PRIMARY KEY (owner_id, operation_id)'];
    end if;
    select array_agg(pg_get_constraintdef(oid) order by pg_get_constraintdef(oid) collate "C")
      into v_actual from pg_constraint where conrelid = v_relation.oid;
    if v_actual is distinct from v_expected_constraints or exists
       (select 1 from pg_constraint where conrelid = v_relation.oid and
        (not convalidated or condeferrable or condeferred)) then
      raise exception 'H1B2_STOP: original table constraints mismatch';
    end if;
    select coalesce(array_agg(a.attname || ':' || pg_get_expr(d.adbin,d.adrelid) order by a.attnum), array[]::text[])
      into v_actual from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
      where d.adrelid = v_relation.oid;
    if (v_relation.oid = v_inspections and v_actual is distinct from
        array['document_version:1','created_at:now()','updated_at:now()']::text[])
       or (v_relation.oid = v_receipts and cardinality(v_actual) <> 0) then
      raise exception 'H1B2_STOP: original column defaults mismatch';
    end if;
    for v_role in select oid, rolname from pg_roles where rolname in
        ('anon','authenticated','authenticator','service_role','c1_executor') loop
      foreach v_privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] loop
        v_expected := v_relation.oid = v_inspections and v_role.rolname = 'authenticated' and v_privilege = 'SELECT';
        if has_table_privilege(v_role.oid, v_relation.oid, v_privilege) is distinct from v_expected
           or has_table_privilege(v_role.oid, v_relation.oid, v_privilege || ' WITH GRANT OPTION') then
          raise exception 'H1B2_STOP: effective/inherited table privilege mismatch: %, %', v_role.rolname, v_privilege;
        end if;
      end loop;
      for v_column in select attnum from pg_attribute where attrelid = v_relation.oid
          and attnum > 0 and not attisdropped loop
        foreach v_privilege in array array['SELECT','INSERT','UPDATE','REFERENCES'] loop
          v_expected := v_relation.oid = v_inspections and v_role.rolname = 'authenticated' and v_privilege = 'SELECT';
          if has_column_privilege(v_role.oid, v_relation.oid, v_column.attnum, v_privilege) is distinct from v_expected
             or has_column_privilege(v_role.oid, v_relation.oid, v_column.attnum, v_privilege || ' WITH GRANT OPTION') then
            raise exception 'H1B2_STOP: effective/inherited column privilege mismatch';
          end if;
        end loop;
      end loop;
    end loop;
  end loop;
  if (select count(*) from pg_policy where polrelid in (v_inspections,v_receipts)) <> 1
     or not exists (select 1 from pg_policy where polrelid = v_inspections
       and polname = 'c1_owner_read' and polcmd = 'r' and polpermissive
       and polroles = array[to_regrole('authenticated')::oid] and polwithcheck is null
       and regexp_replace(pg_get_expr(polqual,polrelid), '\s+', '', 'g') = '(owner_id=(SELECTauth.uid()ASuid))') then
    raise exception 'H1B2_STOP: owner-only SELECT policy mismatch';
  end if;
  for v_role in select oid, rolname from pg_roles where rolname in
      ('anon','authenticated','authenticator','service_role','c1_executor') loop
    v_expected := v_role.rolname = 'c1_executor';
    if has_schema_privilege(v_role.oid, v_private, 'USAGE') is distinct from v_expected
       or has_schema_privilege(v_role.oid, v_private, 'CREATE')
       or has_schema_privilege(v_role.oid, v_private, 'USAGE WITH GRANT OPTION')
       or has_function_privilege(v_role.oid, v_function, 'EXECUTE') is distinct from v_expected
       or has_function_privilege(v_role.oid, v_function, 'EXECUTE WITH GRANT OPTION') then
      raise exception 'H1B2_STOP: effective/inherited private schema or function access mismatch';
    end if;
    if v_role.oid <> v_executor and
       (pg_has_role(v_role.oid, v_executor, 'SET') or pg_has_role(v_role.oid, v_owner, 'SET')) then
      raise exception 'H1B2_STOP: API role can SET ROLE to executor or application owner';
    end if;
  end loop;
end
$h1b2_gate_d$;


-- H1b.2 initial-bootstrap history assertions. NOT EXECUTED ON HOSTED.
-- prepare.mjs inserts approved source hashes. Included in generated GATE_D.sql.
-- This exact-two-record check is for initial admission/recovery, before later migrations.
do $h1b2_history$
declare
  v_history oid := to_regclass('supabase_migrations.schema_migrations');
  v_schema oid := to_regnamespace('supabase_migrations');
  v_owner oid := 'postgres'::regrole;
  v_role record;
  v_privilege text;
  v_shape text[];
begin
  if v_history is null or v_schema is null then
    raise exception 'H1B2_STOP: migration metadata missing';
  end if;
  select array_agg(format('%s:%s:%s:%s', attname, atttypid::regtype, attnotnull, atthasdef) order by attnum)
    into v_shape from pg_attribute where attrelid = v_history and attnum > 0 and not attisdropped;
  if v_shape is distinct from array['version:text:t:f','statements:text[]:f:f','name:text:f:f']::text[]
     or (select count(*) from pg_constraint where conrelid = v_history) <> 1
     or not exists (select 1 from pg_constraint where conrelid = v_history
       and contype = 'p' and convalidated and not condeferrable and not condeferred
       and pg_get_constraintdef(oid) = 'PRIMARY KEY (version)') then
    raise exception 'H1B2_STOP: CLI-compatible metadata shape mismatch';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations) <> 2
     or not exists (select 1 from supabase_migrations.schema_migrations where version = '20261024000100'
       and name = 'c1_owner_inspections' and cardinality(statements) = 1
       and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8')
     or not exists (select 1 from supabase_migrations.schema_migrations where version = '20261027000100'
       and name = 'c1_hosted_acl_hardening' and cardinality(statements) = 1
       and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62') then
    raise exception 'H1B2_STOP: migration history/source mismatch';
  end if;
  if (select nspowner from pg_namespace where oid = v_schema) <> v_owner
     or not exists (select 1 from pg_class where oid = v_history and relowner = v_owner
       and relkind = 'r' and relpersistence = 'p' and not relrowsecurity and not relispartition)
     or exists (select 1 from pg_namespace n,
       lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
       where n.oid = v_schema and a.grantee <> v_owner)
     or exists (select 1 from pg_class c,
       lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
       where c.oid = v_history and a.grantee <> v_owner)
     or exists (select 1 from pg_attribute a, lateral aclexplode(a.attacl) acl
       where a.attrelid = v_history and not a.attisdropped and acl.grantee <> v_owner)
     or exists (select 1 from pg_trigger where tgrelid = v_history and not tgisinternal)
     or exists (select 1 from pg_policy where polrelid = v_history)
     or exists (select 1 from pg_rewrite where ev_class = v_history) then
    raise exception 'H1B2_STOP: migration metadata owner/ACL/behavior mismatch';
  end if;
  for v_role in select oid from pg_roles where rolname in
      ('anon','authenticated','authenticator','service_role','c1_executor') loop
    if has_schema_privilege(v_role.oid, v_schema, 'USAGE')
       or has_schema_privilege(v_role.oid, v_schema, 'CREATE') then
      raise exception 'H1B2_STOP: effective metadata schema access';
    end if;
    foreach v_privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] loop
      if has_table_privilege(v_role.oid, v_history, v_privilege) then
        raise exception 'H1B2_STOP: effective metadata table access';
      end if;
    end loop;
    foreach v_privilege in array array['SELECT','INSERT','UPDATE','REFERENCES'] loop
      if has_any_column_privilege(v_role.oid, v_history, v_privilege) then
        raise exception 'H1B2_STOP: effective metadata column access';
      end if;
    end loop;
  end loop;
end
$h1b2_history$;

select 'PASS_NOLOGIN_BOOTSTRAP_ONLY' as gate_d_catalog_result,
       'BLOCKED_PUBLIC_TEMPORARY_REQUIRES_GATE_E_DECISION' as executor_admission;


do $h1b2_boundary$
declare
  v_boundary text;
begin
  select jsonb_build_object(
    'database_acl', (select datacl::text from pg_database where datname = current_database()),
    'global_defaults', (select coalesce(jsonb_agg(to_jsonb(d) order by d.defaclrole, d.defaclobjtype), '[]'::jsonb)
      from pg_default_acl d where d.defaclnamespace = 0))::text into v_boundary;
  if v_boundary is distinct from current_setting('h1b2.boundary_snapshot') then
    raise exception 'H1B2_STOP: database ACL or global defaults changed';
  end if;
end
$h1b2_boundary$;

-- Only this COMMIT makes application objects, hardening and both receipts visible.
commit;
-- A pre-COMMIT PASS result is provisional. A lost acknowledgement requires recovery.
