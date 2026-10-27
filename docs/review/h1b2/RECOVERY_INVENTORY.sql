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
-- A lost connection before, during or after COMMIT leaves the outcome uncertain.
-- First resolve the prior execution/backend/transaction, or STOP further execution.
-- No automatic retry, reconnect-and-replay, or hosted backend cancel/terminate.
-- All-absent alone is NOT rollback proof: an older transaction may still commit.
-- Only after the prior transaction has definitively ended, recheck in a fresh
-- authorized session. All-absent then supports no commit of this first bootstrap;
-- investigation and separate retry approval are still required.
-- All present: require exact RECOVERY_HISTORY.sql receipts AND full Gate D.
-- Mixed state, unexpected project/role/version, or unexpected inventory: STOP.
