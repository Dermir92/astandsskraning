# Supabase C1 — owner-only local persistence proof

Updated 25 October 2026 after independent changes requested. Experimental
engineering only; fictional data. See [review corrections and current evidence](SUPABASE_C1_REVIEW_CORRECTIONS.md).

Current status, 26 October 2026: the final navigation/focus corrections passed
the complete regression (930 passed, 24 existing skips, zero failures) and all
77 C1 checks. See [the final regression report](C1_FINAL_REGRESSION_FIX.md) and
its source-integrity/validation records. This candidate is prepared for independent
review through a Draft PR; independent approval remains pending.

The dated evidence below and the 24/25 October review records describe earlier
snapshots. Their approval holds, file counts and statements about uncommitted
work are historical. Generated screenshots, detailed Playwright reports, logs
and review ZIPs remain local and are excluded from the PR; compact summaries,
security evidence and final verification records are retained.

Base: clean `main` / `origin/main` at `d44b8e79c76357512c606f79d0111e9d47b0ad1a`.
The accepted baseline was 924 passed, 24 skipped. Changes remain uncommitted.

## What this implements

The normal demonstration still uses its original localStorage collection and
session photographs. C1 is a separate development process at
`http://127.0.0.1:3101`, selected only by a server environment flag AND
`NODE_ENV=development`. Its API/database addresses are fixed to the dedicated
local Supabase ports 55421/55422. Hosted URLs are rejected. Production C1 API
requests return 404, including when someone supplies the development flag.

C1 starts with an authenticated owner's database records, never demonstration
fixtures or imported browser records. It reuses the four screens and Concept C
preview. Newly created records are independent apartment drafts. Initial/final
type controls and photographs are explicitly unavailable. There is no import,
linked-final creation/comparison parity, guest access, registration, offline
synchronization, automatic merging, issuance, signatures or production PDF.
Phase 7b and Web Locks remain unimplemented.

The reproduced localStorage cross-tab defect remains in default demo mode.
Continue strategy A there: one application tab/window per browser profile for
the entire collection, moderated testing and fictional disposable data only.
C1 protection must not be described as a fix applied to that demonstration mode.

## Database and permission boundary

`supabase/migrations/20261024000100_c1_owner_inspections.sql` is the complete C1
migration. The local project configuration is version-controlled. PostgreSQL 17
is selected; no rooms, checklist answers or residential modules are normalized.

- `public.c1_inspections`: composite `(owner_id uuid, id text)` primary key,
  full domain `document jsonb`, document version, revision and server timestamps.
  Text IDs retain non-UUID identities. Ownership and concurrency metadata stay
  outside the document. The domain's `updatedAt` is not a concurrency token.
- `c1_private.operation_receipts`: owner/operation key, request digest,
  inspection ID, committed revision and expiry. No domain snapshots or general
  event/history system are added.
- Authenticated users have SELECT only, protected by owner RLS. Anonymous users
  have no inspection grants. Browser roles have no INSERT, UPDATE, DELETE,
  upsert or private-function execution path. `c1_private` is not API-exposed.
- The local `c1_executor` login can execute only the narrow private save function
  and cannot directly read/write either table. Preparation generates its password
  locally. The function is elevated and therefore explicitly scopes every
  relevant predicate by owner; RLS is not claimed to protect a definer bypass.
  Its search path is empty and PUBLIC/anon/authenticated execution is revoked.
- Every protected Next route verifies the bearer token with local GoTrue's user
  endpoint. The server derives the owner from that verified response and runs
  the existing domain validator before calling the private function. It never
  takes ownership from a request body, report party, role or browser session ID.
  Reads forward the user token through RLS. Responses are private/no-store.
- There are two locally provisioned, confirmed fictional email/password accounts.
  Global Auth signup is disabled. The email-provider switch remains enabled so
  existing owners can sign in; direct public-signup denial is integration-tested.

The trusted application server is part of the security boundary. Its executor
must never be distributed to a browser. This phase does not claim that possession
of that server credential is constrained to one owner by RLS.

## Atomic writes and bounded retry semantics

For an existing inspection, one UPDATE matches owner, ID AND expected revision,
then writes and increments the revision. Concurrent stale writes cannot both
commit. Revision zero means create-only; an existing ID is never upserted over.
Creation alone takes an owner-scoped lock to enforce the existing 500-record
domain limit under concurrent tabs. Ordinary edits to different inspections do
not take a collection/owner lock.

An operation UUID, issued-at timestamp, expected revision and immutable document
form a request. A transaction lock serializes duplicates of the same owner/op;
the document update and receipt commit together. The database computes a request
digest (separate from the existing comparison fingerprint algorithm). A repeated
key with different content is rejected. An identical retry returns the original
committed revision without performing the write again.

Retries are accepted for 24 hours from the original issued-at time, with at most
one minute of future clock tolerance. Old requests are rejected even if their
receipt is gone. Expired receipts are removed lazily on a later successful owner
write; this is a bounded retry window, not a guaranteed physical deletion job.
There is no cross-day offline replay. A replay acknowledges the original commit;
it does not assert that no later writer has changed the inspection.

The client has one in-flight write per inspection and coalesces subsequent edits.
An older fresh acknowledgement advances the known revision without replacing newer
typing. A failed request retains its original operation/body for explicit retry.
A replay acknowledges the earlier commit but requires explicit refresh before
further saves for that inspection; it does not establish current freshness.
A fresh acknowledgement can queue newer edits. A conflict freezes automatic
saves for that inspection. It is never retried with a freshly guessed revision.
All in-memory changes remain available for an explicit recovery download.

The save indicator distinguishes pending, durable acknowledgement, unconfirmed
failure and conflict. Normal autosaves do not insert recovery controls above a
focused field. Blocked work offers a JSON recovery copy and an explicit checked
confirmation before loading saved records. There is no destructive clearing
before a successful validated read. Failed reads retain
the active candidate and recovery access. Edits during a read invalidate replacement.
There is no automatic conflict merge
or recovery import. Recovery copies remain owner-scoped in page memory when
signing out and are exposed only after that owner is verified again. Requests
from a previous account generation are aborted/ignored; they cannot populate the
new account. An already accepted request may still commit to its original owner.

This is UI/account isolation, not secure erasure of an earlier owner's page
memory. A shared-device production recovery/retention policy is still needed.

## Preservation and limits

Existing validators, draft semantics and comparison fingerprints are reused.
JSON-compatible unknown fields, non-UUID report IDs, missing observations,
incomplete date text and raw meter strings are not normalized or filled in.
The database round-trip/fingerprint test checks this against actual PostgreSQL.

Navigation uses separate owner-scoped C1 keys. Existing demo navigation keys and
the demo collection are unchanged. C1 never reads that collection, even when a
valid collection with unknown envelope fields is present on its browser origin.
No photograph is accepted in C1, so no session preview can be mistaken for a
persistent upload. The original demo photograph behaviour is retained.

This proof has a 5 MiB JSON request limit and the existing 500-inspection domain
limit. It offers no durable offline journal or history. A recovery download is
plaintext local JSON; an unexported candidate can be lost if the page/process is
destroyed despite the leave warning. Valid inspection data is durable only after
database acknowledgement. Invalid/unreadable cloud reads never substitute demo
fixtures.

## Reproduce locally

Requirements verified here: Node 22, a running Docker Linux engine and the pinned
project Supabase CLI. No Supabase login, project link, hosted project or production
credential is required.

```text
npm ci
npm run c1:start
npm run c1:reset
npm run c1:prepare
npm run dev:c1
```

`c1:reset` destroys only this local C1 project's fictional database and reapplies
the migration. Run preparation after a reset. Preparation provisions fictional
owners and the restricted executor, then stores local-only credentials in ignored
`artifacts/c1-local/runtime.json`. Do not publish that file. Read the fictional
account credentials locally to sign in; no account password is embedded in UI
code or committed fixtures. The CLI's privileged status values are consumed in
memory and not printed by the preparation/start wrappers.

In another terminal, with the C1 development server running:

```text
npm run test:c1
```

The C1 suite also knows how to launch the dev server. Current verification uses
the patched framework and an explicitly running C1 development server. A failed
server start must never be treated as a passing integration run.

The latest CLI executable tested (2.122.0) was blocked by Windows application
control on this machine. The official 2.76.10 CLI is pinned and works here; its
archive dependency is overridden to patched tar 7.5.22. Next.js and its ESLint
config are now pinned to 16.4.3; React/React DOM to 19.3.1; sharp resolves to
0.35.5. The current full npm audit reports zero findings. See the isolated
[security dependency record](qa/supabase-c1-review/SECURITY.md).

The application launcher binds 127.0.0.1. The Supabase CLI's Docker ports are
published on 0.0.0.0/[::] on this host; localhost URLs do not themselves restrict
that binding. Use a trusted, host-isolated development environment with fictional
data. No machine-wide firewall or unrelated Docker project settings were changed.
This is a recorded local-environment limitation, not production network isolation.

Stop only this local stack with `npm run c1:stop`. Docker volumes retain fictional
records across stop/start. Keep the default demonstration on its normal server;
it does not need Supabase and does not inherit C1 mode.

## Validation record

Current test counts and evidence are recorded in
`qa/supabase-c1-review/README.md`. `qa/supabase-c1/README.md` remains the historical
24 October record. Local detailed reports are ignored artifacts:

- `artifacts/c1-local/report/index.html` and `results.json`: explicit C1 suite.
- `artifacts/c1-local/regression.json`: complete default-mode regression.
- `artifacts/c1-local/test-results/`: automated screenshots and failure traces.

All validation here is automated. PostgreSQL, Auth, RLS, HTTP and two-tab writes
are real local integrations. Controlled state tests and network interception
simulate failures/delays; they do not establish real human usability, physical
phone behaviour, screen-reader compatibility or production outage recovery.

## Review decision and next hosted dependency

This is a candidate for independent C1 engineering review only. Do not use it for
real residential evidence or a field pilot. The previously identified Next.js
advisories have been addressed by the pinned dependency correction; this is not
deployment approval. Further review is needed for hosted pooling/TLS,
clock skew, token/session policy, secrets management, backups/restoration, privacy,
durable photographs, linked operations and eventual sharing. None is represented
as solved by this proof.

After C1 approval, the first step that actually needs a hosted development project
is a separately authorized, synthetic-data owner/auth/RLS/concurrency parity check
against a hosted Supabase instance. It requires reviewed configuration and secret
provisioning because C1 deliberately rejects hosted URLs. It does not authorize
local-data migration, a pilot, linked parity, photographs, sharing or Phase 7b.

No hosted project was created or configured. No commit, push, PR, merge or
deployment is part of this package.
