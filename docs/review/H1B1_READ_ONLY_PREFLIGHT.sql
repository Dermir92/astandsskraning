-- REVIEW ARTIFACT ONLY. NOT EXECUTED. Never put this in supabase/migrations.
-- SELECT/catalog inspection only, no user records, secrets, DDL or DML.
-- Run only after separate approval, using the intended bootstrap identity in
-- the approved project. Dashboard identity must be checked independently.
-- Results describe catalog state; they do not prove permission to perform DDL.

select current_database() as database_name, current_user as inspection_identity,
       current_setting('server_version') as server_version;

select r.rolname, r.rolsuper, r.rolcreaterole, r.rolcreatedb, r.rolcanlogin,
       r.rolinherit, r.rolbypassrls,
       has_database_privilege(r.oid, current_database(), 'CONNECT') as db_connect,
       has_database_privilege(r.oid, current_database(), 'CREATE') as db_create,
       has_database_privilege(r.oid, current_database(), 'TEMP') as db_temp
from pg_roles r
where r.rolname in (current_user, 'postgres', 'anon', 'authenticated',
                   'authenticator', 'service_role', 'c1_executor');

select e.extname, e.extversion, n.nspname as extension_schema,
       pg_get_userbyid(e.extowner) as extension_owner
from pg_extension e join pg_namespace n on n.oid = e.extnamespace
where e.extname = 'pgcrypto';

select to_regclass('auth.users') as auth_users,
       to_regprocedure('auth.uid()') as auth_uid,
       to_regprocedure('extensions.digest(bytea,text)') as digest,
       has_schema_privilege(current_user, to_regnamespace('auth'), 'USAGE') as auth_usage,
       has_table_privilege(current_user, to_regclass('auth.users'), 'REFERENCES') as auth_references,
       has_schema_privilege(current_user, to_regnamespace('extensions'), 'USAGE') as extensions_usage,
       has_function_privilege(current_user, to_regprocedure('extensions.digest(bytea,text)'), 'EXECUTE') as digest_execute;

-- These must be absent BEFORE bootstrap. Unexpected objects/roles mean STOP.
select to_regnamespace('c1_private') as private_schema,
       to_regclass('public.c1_inspections') as inspections,
       to_regclass('c1_private.operation_receipts') as receipts,
       to_regprocedure('c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)') as save_function,
       to_regrole('c1_executor') as executor,
       to_regclass('supabase_migrations.schema_migrations') as migration_history;
-- Only if the migration-history table exists, inspect its version column:
-- select version from supabase_migrations.schema_migrations order by version;

-- Existing/project defaults, including PUBLIC and service_role. Schema-specific
-- defaults ADD to global defaults; a schema revoke cannot remove global EXECUTE.
select pg_get_userbyid(d.defaclrole) as creator,
       coalesce(n.nspname, '(global)') as schema_name,
       d.defaclobjtype, d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace
where d.defaclrole = (select oid from pg_roles where rolname = current_user)
   or n.nspname in ('public', 'c1_private');

select n.nspname, pg_get_userbyid(n.nspowner) as owner, n.nspacl,
       r.rolname,
       has_schema_privilege(r.oid, n.oid, 'USAGE') as effective_usage,
       has_schema_privilege(r.oid, n.oid, 'CREATE') as effective_create
from pg_namespace n cross join pg_roles r
where n.nspname in ('public', 'c1_private', 'extensions')
  and r.rolname in (current_user, 'anon', 'authenticated', 'authenticator', 'service_role', 'c1_executor');

-- These queries are also suitable for separately approved POST-bootstrap checks.
select n.nspname, c.relname, pg_get_userbyid(c.relowner) as owner,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls, c.relacl
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname = 'c1_inspections')
   or (n.nspname = 'c1_private' and c.relname = 'operation_receipts');

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename = 'c1_inspections')
   or (schemaname = 'c1_private' and tablename = 'operation_receipts');

select n.nspname, c.relname, r.rolname, p.privilege,
       has_table_privilege(r.oid, c.oid, p.privilege) as effective_privilege
from pg_class c join pg_namespace n on n.oid = c.relnamespace
cross join pg_roles r
cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                   ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) p(privilege)
where ((n.nspname = 'public' and c.relname = 'c1_inspections')
    or (n.nspname = 'c1_private' and c.relname = 'operation_receipts'))
  and r.rolname in ('anon', 'authenticated', 'authenticator', 'service_role', 'c1_executor');

-- Column ACLs can confer access even when a table-level privilege is absent.
select n.nspname, c.relname, a.attname, a.attacl, r.rolname, p.privilege,
       has_column_privilege(r.oid, c.oid, a.attnum, p.privilege) as effective_privilege
from pg_class c join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
cross join pg_roles r cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES')) p(privilege)
where ((n.nspname = 'public' and c.relname = 'c1_inspections')
    or (n.nspname = 'c1_private' and c.relname = 'operation_receipts'))
  and r.rolname in ('anon', 'authenticated', 'authenticator', 'service_role', 'c1_executor');

select p.oid::regprocedure as function_identity, pg_get_userbyid(p.proowner) as owner,
       p.prosecdef as security_definer, p.proconfig, p.proacl,
       pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'c1_private';

select p.oid::regprocedure as function_identity, r.rolname,
       has_function_privilege(r.oid, p.oid, 'EXECUTE') as effective_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace cross join pg_roles r
where n.nspname = 'c1_private'
  and r.rolname in ('anon', 'authenticated', 'authenticator', 'service_role', 'c1_executor');

select member_role.rolname as member, granted.rolname as granted_role,
       m.admin_option, m.inherit_option, m.set_option
from pg_auth_members m
join pg_roles member_role on member_role.oid = m.member
join pg_roles granted on granted.oid = m.roleid
where member_role.rolname = 'c1_executor' or granted.rolname = 'c1_executor';

-- Includes transitive membership, inherited access and SET ROLE capability.
select r.rolname as reachable_role,
       pg_has_role(e.oid, r.oid, 'MEMBER') as member,
       pg_has_role(e.oid, r.oid, 'USAGE') as inherited,
       pg_has_role(e.oid, r.oid, 'SET') as can_set_role
from pg_roles e cross join pg_roles r
where e.rolname = 'c1_executor' and r.oid <> e.oid
  and (pg_has_role(e.oid, r.oid, 'MEMBER') or pg_has_role(e.oid, r.oid, 'SET'));

-- Executor must own no database, schema, relation or function. This list covers
-- every ownership dependency, including objects outside the application schemas.
select d.dbid, d.classid::regclass as catalog, d.objid, d.objsubid, d.deptype
from pg_shdepend d join pg_roles r on r.oid = d.refobjid
where d.refclassid = 'pg_authid'::regclass and r.rolname = 'c1_executor' and d.deptype = 'o';
