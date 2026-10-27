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
