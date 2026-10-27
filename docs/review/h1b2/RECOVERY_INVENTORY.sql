-- SELECT ONLY. NOT EXECUTED ON HOSTED. First recovery step; run this alone.
-- Database name/role do NOT authenticate the Supabase project. Check Dashboard.
select current_database() as database_name, current_user as effective_role,
       session_user as session_identity, current_setting('server_version') as server_version,
       to_regnamespace('supabase_migrations') as history_schema,
       to_regclass('supabase_migrations.schema_migrations') as history_table,
       to_regnamespace('c1_private') as c1_schema,
       to_regclass('public.c1_inspections') as inspections,
       to_regclass('c1_private.operation_receipts') as receipts,
       to_regprocedure('c1_private.save_inspection(uuid,text,bigint,jsonb,uuid,timestamptz)') as save_function,
       to_regrole('c1_executor') as executor;
-- All C1 identities + history schema/table absent: uncommitted bootstrap rolled back.
-- All present: ONLY THEN inspect RECOVERY_HISTORY.sql and run Gate D.
-- Mixed state, unexpected project/role/version, or unexpected inventory: STOP.
