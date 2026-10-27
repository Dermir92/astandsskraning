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
       and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '__BASELINE_SHA256__')
     or not exists (select 1 from supabase_migrations.schema_migrations where version = '20261027000100'
       and name = 'c1_hosted_acl_hardening' and cardinality(statements) = 1
       and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '__HARDENING_SHA256__') then
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
