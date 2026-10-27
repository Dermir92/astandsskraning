-- SELECT ONLY. NOT EXECUTED ON HOSTED.
-- Run ONLY after RECOVERY_INVENTORY.sql confirms the expected history table exists.
-- Both rows must match, count must be two, then GATE_D.sql must pass independently.
-- Zero/one/extra rows, wrong shape/hash/owner, or any error: STOP; no repair/retry.
select version, name, cardinality(statements) as source_chunks,
       encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') as source_sha256,
       case
         when version = '20261024000100' and name = 'c1_owner_inspections'
           and cardinality(statements) = 1 and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8' then 'MATCH'
         when version = '20261027000100' and name = 'c1_hosted_acl_hardening'
           and cardinality(statements) = 1 and encode(extensions.digest(convert_to(statements[1], 'UTF8'), 'sha256'), 'hex') = '6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62' then 'MATCH'
         else 'STOP_MISMATCH'
       end as source_check
from supabase_migrations.schema_migrations order by version;

select count(*) = 2 as exactly_two_rows,
       (select nspowner = 'postgres'::regrole from pg_namespace where oid = 'supabase_migrations'::regnamespace) as schema_owner_matches,
       (select relowner = 'postgres'::regrole from pg_class where oid = 'supabase_migrations.schema_migrations'::regclass) as table_owner_matches
from supabase_migrations.schema_migrations;
