# C1 independent review corrections

Current status, 26 October 2026: [the final regression correction](C1_FINAL_REGRESSION_FIX.md)
supersedes the approval hold below. Complete regression: 930 passed, 24 existing
skips, zero failures; C1: 77 passed. Independent approval remains pending in a
Draft PR. The dated findings, inventories and uncommitted-state descriptions
below are retained as history. Generated screenshots and detailed reports remain
local rather than being included in the PR.

25 October 2026. Candidate for independent approval; changes remain uncommitted.
Baseline HEAD/main: `d44b8e79c76357512c606f79d0111e9d47b0ad1a`.
The existing C1 work was preserved. No SQL migration, hosted project, C2, Phase
7b, photographs, sharing, import or automatic merging was added.

**Approval hold:** the complete regression has unresolved ordinary demo
navigation/focus failures. See [current findings](qa/supabase-c1-review/REGRESSION_FINDINGS.md).
Passing C1 checks and isolated demo rechecks do not establish that default mode
is verified unchanged, or grant approval. The full-run failures remain in the
primary reports and aggregate.

## Recovery reload integrity

The finding is confirmed. Previously `CloudStore.reloadLatest()` called
`activate(null)` and then `activate(owner, token)`. The first call archived dirty
documents but immediately cleared the active reports and revision map and hid
owner-scoped recovery. A failed second fetch left the owner unauthorized, an empty
working collection and recovery unavailable in the interface. In addition,
`C1Panel` unconditionally displayed a success message after awaiting a method
that returned no result. A same-page candidate could be retained internally but
still be inaccessible to the user. This was a demonstrated defect, not a claim
that PostgreSQL records had been deleted.

`reloadLatest()` now fetches without calling `activate()` or clearing the working
collection. The same full collection validator is used by activation and reload:
matching owner, supported documents, safe positive revisions, matching document
IDs, unique collection IDs and the existing domain/collection limits. The store
returns an explicit result: `reloaded`, `failed`, `superseded`, `changed`, `busy`
or `unavailable`.

Only a valid response for the same owner and account generation can replace the
collection. The candidate is archived for that owner immediately before the
synchronous replacement, and the revision map is replaced from the validated
records. A request marker prevents an old request's cleanup from affecting a new
request. Account changes abort recovery reads and invalidate their results,
including a sign-out/sign-in back to the same account. Aborting a browser request
is not assumed to cancel work at the server.

Editing and recovery downloads remain available during a delayed read. An
activity counter detects any accepted edit or newly started write after the read
began. In that case the fetched collection is discarded, the newer candidate
remains active and renewed confirmation is required. Fetch or validation failure
preserves the current owner, documents, blocked states, revision metadata and
downloads. Reload is refused while a write or another reload is in flight.

The panel reports progress, failure, changed-candidate and success separately.
Success text is set only for `reloaded`. Account-superseded results are ignored by
the old panel. The reload button exposes its busy state, controls retain native
keyboard behavior, and successful replacement moves focus from the removed
button to the persistent live result. Error and progress results use the same
polite, atomic live region. Approved layouts and inspection navigation are kept.

## Idempotent replay freshness

The database receipt behavior was correct: an identical owner/operation request
returns the original committed revision and `replayed: true`, without repeating
the write. A newer independent operation can already have advanced the head.
The client previously ignored `replayed`, marked an unchanged candidate saved,
or started sending newer local typing using the earlier revision. CAS still
protected the later head, but the interface could communicate a misleading save
state before a subsequent conflict. No additional database receipt or head-read
mechanism is necessary for the correction.

The transport now declares and validates `SaveReceipt.replayed`. A replay always
puts that inspection into `refresh-required`: the earlier commit is confirmed,
but the latest state is unknown. Its candidate remains downloadable, further
saves for that inspection are blocked, and explicit confirmed reload is required.
The original operation is acknowledged and cleared, never submitted as a new
operation. Newer typing is retained rather than automatically queued past this
boundary. Ordinary fresh acknowledgements still preserve and queue newer typing.

This intentionally requires a read after every replay, even if no other writer
actually exists. It is the smallest conservative solution with no extra SQL,
polling, subscriptions, merging, head-revision query or synchronization service.
Other inspections can still save independently. A successful ordinary save or
reload is a point-in-time acknowledgement/read, never proof that another tab
cannot subsequently commit. The Icelandic save label explicitly distinguishes
an earlier acknowledgement requiring review from a fresh save acknowledgement.

## Security dependency change

The original manifest pinned Next.js 16.4.0. Official 14 October advisories cover
two critical RCE issues and a high Server Actions DoS; the patched 16.x floor is
16.4.1. The stable npm `latest` release and official latest 16.x release checked
on 25 October are 16.4.3. That patch release includes the security fixes and later
bug fixes without moving to another minor/major or a canary.

The isolated dependency change pins Next.js and `eslint-config-next` to 16.4.3,
and aligns React/React DOM to 19.3.1. The installed/locked image dependency is
sharp 0.35.5, meeting the advisory's required floor. React's RSC advisory identifies
19.3.1 as its patched release; fixing Next's bundled server implementation remains
essential and is not replaced by updating the public React packages alone.

See [the isolated dependency diff and audit record](qa/supabase-c1-review/SECURITY.md).
The existing Supabase/tar override is unchanged. No audit suppression, new
security exception, `audit fix --force` or unrelated dependency upgrade was used.

## Verification and file inventory

See [current executed evidence](qa/supabase-c1-review/README.md),
[machine-readable validation](qa/supabase-c1-review/validation.json), and
[the affected-file inventory](qa/supabase-c1-review/CHANGED_FILES.md).
The evidence separates state simulations, real local PostgreSQL/Auth/HTTP tests,
intercepted browser failures and default-demo regression results. Historical
24 October results are not reused as passing evidence for these corrections.

The pre-correction state run executed the six existing tests and eleven new
cases: six passed and eleven failed. Some new cases initially fail on the missing
explicit-result/busy contract before later preservation assertions are reached;
this run is not represented as eleven separate observed data-loss events. The
old source and reload ordering establish the active-candidate/recovery-access
failure; the corrected failure tests assert preservation and retry explicitly.

The first typecheck also discovered generated source copies from the previous
ZIP staging area under `artifacts`. Excluding that generated directory from
TypeScript input mirrors ESLint's existing exclusion and prevents baseline copies
and temporary verification configs from entering the application build. Original
review artifacts and the earlier ZIP remain available and unchanged.

Two default-demo test drivers also needed correction after reproducible failures
in the first, subsequently stopped regression attempt. The linked workflow test
could act on the previous screen because its comparison-ready text is shared
between review and preview. It now checks the destination URL, heading and final
inspection navigation before acting. Its disclosure helper ensures `open` rather
than blindly toggling an already-open comparison. The photo test now opens the
real file chooser and selects the identical synthetic file through that chooser;
direct synthetic `setInputFiles` did not deliver a change event in the failing
diagnostic, whereas the chooser exercised decoding and attachment successfully.
All original preservation/reload assertions and fixture bytes remain. No waits,
timeouts, retries, skips or demo implementation rules were relaxed. Both cases
passed two consecutive targeted executions before the complete suite restarted.
The interrupted attempts are not represented as completed full regression runs.
The comparison width audit also waits for the actual preview URL, heading and
document title before running axe; the shared comparison-ready text alone could
match the prior screen during navigation. A third pre-existing demo driver (the
fire correction matrix) queried radio counts before local hydration, selected the
wrong expected focus target and failed. It now waits for that field to be visible
before deciding which control should have focus. Its original focus and storage
assertions remain. No demo navigation or focus implementation was changed.

The battery-interrupted run exposed additional driver assumptions. Read-protected
navigation now waits for its protected state before following the fallback link;
the shared filter helper waits for hydration before selecting sort/filter values.
Rapid checklist answers target the selected item's condition group and assert
that item is recorded. The expanded preview helper waits for the selected room
and uses its native file chooser with the same synthetic buffers/counts. These
seven supporting demo test files/helpers retain every original preservation,
focus, progress and accessibility assertion. Eighteen focused executions across
all three regression viewports passed after these corrections.

The full regression is verified using two non-overlapping executions under the
ordinary configuration, isolating the large visual matrix at one worker under
its existing timeout. The combined outcome is valid only after every execution
identity matches a fresh full-suite list, with no missing or overlapping cases.
The derived aggregate is labeled accordingly and both primary reports are kept.
See [execution method](qa/supabase-c1-review/REGRESSION_METHOD.md).

Two controlled probes against the exact archived original source also reproduce
the findings: failed reload leaves no active collection/accessible recovery, and
a replayed receipt produces a saved state without freshness qualification. These
observe expected bad historical behavior, not database deletion or two additional
corrected-code successes. Original preimages are included for direct comparison.

## Remaining limitations and approval

Recovery is owner-scoped page memory plus an explicit plaintext JSON download,
not durable recovery storage or an import mechanism. A destroyed page/process
can still lose unexported candidates. Account isolation does not securely erase
another owner's in-process memory. Download completion and a checkbox cannot
prove that a user has retained a backup. Browser aborts do not roll back commits.

Validation is automated Chromium at CSS viewports and controlled local services.
It is not human usability testing, physical-phone testing, a complete screen-reader
audit, production outage testing, exploit verification or hosted Supabase parity.
A clean npm audit means no findings in that registry report, not a security
guarantee. Local Docker ports remain published beyond loopback by the CLI; use
trusted isolated development hosts and fictional data only.

The default demo's localStorage cross-tab limitation remains: one application
tab/window per browser profile, fictional disposable records, moderated testing.
C1 remains development-only and separate from demo records and session photos.
No shared data contract, comparison fingerprint or baseline reconfirmation rule
was migrated. SQL/RLS/receipt definitions remain exactly as previously reviewed.

Independent approval must explicitly review the corrected reload/replay paths,
the isolated dependency diff, current executed test evidence and these limits.
Pass counts and package checksums do not grant C1 approval. Do not merge or deploy
before the requested independent decision. No commit, push, PR, merge, deployment
or hosted Supabase operation is part of this work.
