-- H1b.2 supplementary pre-execution inventory. SELECT ONLY. NOT EXECUTED ON HOSTED.
-- Independent project identity must be checked in Dashboard; SQL cannot prove it.
-- Run ONE SELECT at a time, inspect its result, then decide whether to continue.
select current_database() as database_name, current_user as effective_role,
       session_user as session_identity, current_setting('server_version') as server_version,
       current_setting('createrole_self_grant') as creator_membership_options,
       to_regnamespace('supabase_migrations') as history_schema,
       to_regclass('supabase_migrations.schema_migrations') as history_table;

-- Review enabled DDL event triggers and pin this fingerprint only after approval.
select encode(extensions.digest(convert_to(coalesce(jsonb_agg(jsonb_build_object(
      'name', e.evtname, 'event', e.evtevent, 'tags', e.evttags,
      'enabled', e.evtenabled, 'owner', pg_get_userbyid(e.evtowner),
      'function', format('%I.%I()', n.nspname, p.proname),
      'function_owner', pg_get_userbyid(p.proowner),
      'definition_sha256', encode(extensions.digest(convert_to(pg_get_functiondef(p.oid), 'UTF8'), 'sha256'), 'hex')
    ) order by e.evtname), '[]'::jsonb)::text, 'UTF8'), 'sha256'), 'hex')
    from pg_event_trigger e join pg_proc p on p.oid = e.evtfoid join pg_namespace n on n.oid = p.pronamespace
    where e.evtenabled <> 'D';

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
from pg_auth_members m order by member::text, granted_role::text;
