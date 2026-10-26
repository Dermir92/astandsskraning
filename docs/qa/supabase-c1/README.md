# C1 verification and review evidence

Current candidate: [26 October final regression report](../../C1_FINAL_REGRESSION_FIX.md),
with 930 regression passes, 24 existing skips, zero failures and 77 C1 passes.
Independent approval is pending. This document retains the 24 October snapshot;
its screenshot links refer to local evidence intentionally excluded from the Draft PR.

Historical 24 October record. For the corrections requested by independent
review, patched dependencies and newly executed tests, see
[25 October evidence](../supabase-c1-review/README.md). The counts and unresolved
advisory description below refer to the original snapshot, not the corrected one.

24 October 2026. Base: `d44b8e79c76357512c606f79d0111e9d47b0ad1a`.
See [implementation and reproduction notes](../../SUPABASE_C1.md) and the
[exact changed-file inventory](CHANGED_FILES.md).

## Final results

| Check | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| C1 local integration/state/browser suite | 50 | 0 | 0 |
| Complete default-demo regression | 927 | 0 | 24 |
| Production API guard with C1 flag explicitly enabled | 3 | 0 | 0 |

Both Playwright suites reported zero flaky results and zero global errors.
The demo total is the accepted 924 passing cases plus three new production-mode
isolation executions. No existing assertion or intentional skip was weakened.
C1 integration has a separate explicit configuration because it requires the
local Supabase stack; it is not silently included in the ordinary demo command.

Typecheck and lint passed. The final production build exited 0. Next.js 16.4.0
reported its existing security advisory and initially stopped builds to issue a
reminder; the same build was retried without changing/disabling that safeguard.
The final build also retried slow prerenders internally before completing. The
framework advisory remains an unresolved prerequisite for deployment, not a C1
security fix or production-readiness claim.

Machine-readable, sanitized evidence:

- [Validation counts, timing and production feature gate](validation.json).
- [Actual PostgreSQL version, migration and permission checks](platform-evidence.json).

The C1 suite contains nine real database/API tests, six controlled state tests
and seven browser scenarios at each of five viewport widths. The database is
PostgreSQL 17.6, migration `20261024000100`. Two fresh local resets successfully
reapplied the migration. Dedicated API/database ports avoid the unrelated local
project already using the standard Supabase ports.

## What was exercised

- Actual database round-trips preserve legacy text IDs, unknown fields,
  incomplete documents and the existing source fingerprint.
- Separate database connections race expected revisions; exactly one writer
  commits. Different inspections owned by the same owner update independently.
- Two owners, anonymous callers, direct table writes/upserts and private-function
  execution permissions are tested. Public account signup is denied.
- Duplicate/concurrent operation IDs, mismatched retry content, expired/future
  operations and rolled-back writes are checked. Concurrent creation respects
  the existing 500-record contract without hiding a saved 501st record.
- Browser tests cover the four-step workflow, Concept C, reload and corrections;
  real two-tab conflict; an actual commit whose acknowledgement is deliberately
  lost; a simulated rejection before commit; read failure; account switching
  while a request is delayed; and owner-scoped recovery downloads.
- New controls are exercised with Enter/Space and visible keyboard focus.
  Login error, details, capture, preview, conflict and error states are checked
  for overflow and axe WCAG 2/2.1/2.2 A/AA tags as applicable.
- A pre-existing demo collection with unknown envelope data remains byte-for-byte
  unchanged through C1 creation, navigation, preview, reload and editing.
- The production server returned 404 for all C1 operations even with the C1 flag
  set. Public config exposes only an anonymous key; the loaded browser assets
  were checked against the actual local executor URL/password and contained
  neither value. No privileged credential is included in this evidence.

## Curated screenshots

The five preview screenshots show the actual application at the stated CSS width
and 900 px height, after a saved inspection was reloaded and corrected.

| Width | Concept C preview |
| ---: | --- |
| 320 | [Preview](preview-320.png) |
| 360 | [Preview](preview-360.png) |
| 390 | [Preview](preview-390.png) |
| 768 | [Preview](preview-768.png) |
| 1440 | [Preview](preview-1440.png) |

Additional unedited browser captures:

- [Details at 320](details-320.png), [capture at 320](capture-320.png),
  [complete Concept C document at 320](preview-full-320.png).
- [Conflict at 320](conflict-320.png), [conflict at 1440](conflict-1440.png).
- [Pending acknowledgement](pending-320.png), [unconfirmed save](failed-save-320.png).
- [Protected read failure](read-failure-320.png), [keyboard-correctable login error](login-error-320.png).

The orange Next.js development “Insight” overlay visible in some captures comes
from the framework advisory. It is not a new inspection interface element and
was not removed from the evidence. The original Concept B/C presentation is
retained beneath the explicit C1 development controls.

## Interpretation and limitations

All testing is automated, including browser walkthroughs and keyboard events.
Controlled state/network failures are simulations. Real local Auth, RLS,
PostgreSQL transactions, HTTP commits and cross-tab conflicts were exercised;
this is not real human usability testing, physical-device testing, a complete
screen-reader audit, hosted Supabase validation or a WCAG certification.

Recovery candidates remain in page memory until exported; the download is manual
plaintext JSON, with no automatic merge/import. C1 is online-only and does not
provide an offline journal or inspection history. Local Docker-published ports
need host/network isolation; the application server itself binds to loopback.
The existing demo P1 remains subject to strategy A's single-tab restriction.

Recommendation: ready for independent C1 engineering review, with these limits
explicit. Not approved for real evidence, deployment or a field pilot. The next
hosted dependency is a separately authorized synthetic owner/auth/RLS/concurrency
parity check after this review and resolution of the framework security issue.
