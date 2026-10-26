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
