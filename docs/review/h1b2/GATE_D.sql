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
