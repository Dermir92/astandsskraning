# UX3-U1B — room action accessibility

The custom-room submit button now retains its visible Icelandic label and native accessible name throughout the tablet breakpoint interval. Room deletion from either the quantity minus button or a room's trash button reveals the existing inline warning and initially focuses **Hætta við**. No modal or persistence change is introduced.

Base: `3c9d461c598e045301c51d86a9f18d1ad443644c`, tree `ab47d8e4090cb4c51acec6d6470e6b6b0f8773bb`. Implementation uses the previously isolated `codex/ux3-u1a-investigation` branch/worktree.

## Behavior and safety

- The CSS no longer hides “Bæta við” at 641–1000 px. The input remains flexible; the button keeps room for its label.
- Both removal entry points keep their existing target selection and distinction between an empty room and a room with observations or temporary photos. Only the latter requires explicit confirmation.
- The confirmation is a named group. Its warning remains an alert message and describes the initially focused Cancel button; the stale-epoch explanation is also associated when present.
- Opening centers the warning/actions and keeps the focused control visible if a long warning exceeds the viewport. Scoped scroll margins accommodate sticky content. Actions wrap at enlarged text sizes; long room names can wrap.
- Cancel returns to the actual originating control if available, otherwise the selected-rooms heading. After list deletion, focus goes to the next room name, then previous room, then that heading. After quantity deletion, the minus button is preferred, then its plus button, then the heading.
- Focus work is synchronous after the relevant DOM commit and consumed once. Saving, typing, ownership changes and ordinary rerenders do not renew the request or move focus again.
- The pending `{id, epoch}` snapshot, disabled condition, explicit epoch guard and stale warning remain. Writer loss/reacquisition cannot renew or execute an old confirmation. Cancel and a new explicit request are required.
- Store acceptance still differs from successful saving: quota failures retain the accepted candidate and recovery checkpoint, leave canonical bytes unchanged, and continue to show the existing failed-save status. No store, recovery, Web Lock or exact-base algorithm changed.

## Before/after evidence

These are actual Chromium screenshots of the same new regression cases on the approved baseline and implementation. Viewport differences between F01 and F02 are intentional: F01 is 768 × 950; both F02 cases are 390 × 800. The top-minus and direct-list scenarios were tested independently.

| Scenario | Approved baseline | Implementation |
|---|---|---|
| F01 at 768 px | [Icon-only, empty native AX name](evidence/f01-768-before.png) | [Visible label and native name](evidence/f01-768-after.png) |
| F02 quantity minus | [Confirmation below the viewport; focus on minus](evidence/f02-quantity-390-before.png) | [Target warning visible; Cancel focused](evidence/f02-quantity-390-after.png) |
| F02 list trigger at viewport edge | [No focus transfer or reveal](evidence/f02-list-390-before.png) | [Target warning visible; Cancel focused](evidence/f02-list-390-after.png) |

Safety captures show the retained stale confirmation and disabled destructive action after ownership cycling: [quantity trigger](evidence/stale-quantity.png), [list trigger](evidence/stale-list.png). The automated assertions also verify byte preservation after stale activation and require fresh review before deletion.

Before editing application code, three focused regression cases failed as expected: Chromium reported an empty button name at 768, and both F02 cases failed their Cancel-focus assertion. Their screenshots, native AX/axe attachments and traces are preserved.

During test authoring, one intermediate check failed after recursively enlarging already inherited text sizes in an open confirmation. That fixture was corrected to apply a fixed 200% style before opening, and a separate long-name/short-viewport case was added. This was a new-test correction; existing regression assertions, retries, skips and timeouts were not changed.

## Validation

- Targeted tests: **105 passed**, across desktop, mobile-360 and mobile-390 projects. Each runs 35 new tests.
- F01 widths: **320, 360, 390, 640, 641, 768, 800, 1000, 1001 and 1440 CSS px**. Tests inspect CDP's native accessibility tree, axe `button-name`, actual label visibility, focus, keyboard submission, validation and overflow. A second writer's disabled form is checked at every width.
- F02: both entry points at 320/360/390/768/1440, edge-positioned list triggers, focus/viewport geometry, keyboard order, cancel restoration, surviving/final-room focus, data preservation, temporary-photo-only confirmation, empty-room removal, quota failure, changed-base rejection, real Web Lock release/reacquisition and stale activation.
- Full WCAG-tagged axe checks cover the room layout with the confirmation open. Sticky-header and 200% text fixtures check reveal; a long unbroken room name at 320 × 600 checks wrapping and focused-action visibility.
- Lint, typecheck and production build passed.

Commands use the existing package scripts. The targeted runner imports the unchanged default Playwright config and isolates only origin, reporter and output paths. The complete regression uses the existing `playwright.ui2a.config.ts`, which inherits the default suite/projects/retries/timeouts/skips and runs against this worktree's local production build on port 3222.

Complete regression: **1,259 passed, 35 skipped, 2 timed out**, across 1,296 executions, with retries still zero. All **120 S1 project executions** and all **105 new room-accessibility executions** passed. The existing 35 skips and existing assertions/timeouts were unchanged. The full run is **not reported as green**.

The two failures were in the unchanged `tests/fire-observations-capture.spec.ts`, mobile-390:

- Line 212, **every group and row correction opens its ancestors after reload without writing data**: overall 90-second timeout, reported while awaiting focus on the fire-row note.
- Line 236, **context switches retain fire facts and extensions without imposing rental tasks outside rental**: overall 45-second timeout.

Both traces show overlapping browser operations taking about **156 seconds** (155,466 ms and 155,906 ms) in the same interval, with no operation error; their overall deadlines had elapsed afterward. Neither case visits the room-selection screen. A shared environment stall is the inference; its underlying cause was not verified. Both tests then passed **unchanged**, in their original mobile-390 configuration with two workers and no retries or timeout edits: **2 passed in 7.8 seconds** (individual cases 6.1 and 2.6 seconds). Original failures, screenshots and traces remain preserved separately from this targeted rerun. No fire code or tests were changed.

Machine-readable runs are `targeted-final/results.json`, `full/results.json`, `full/summary.json`, `full/trace-analysis.json` and `fire-rerun/results.json` under the evidence root below. The full suite took about one hour. This timing exception and the lack of an entirely green full run require attention during independent review.

## Preserved evidence and limits

Full machine-readable results, logs, traces and all per-width screenshots are isolated at:

`C:/Users/Danni/.codex/investigations/ux3-u1b-20261102/`

The original U1A evidence remains at `C:/Users/Danni/.codex/investigations/ux3-u1a-20261102/`. The original checkout's 786 inventoried files, six pre-existing tracked modifications and 48 untracked QA files are hash-checked against that manifest. Existing branch/worktree records and PR #19 are checked separately before delivery.

Environment: Windows, headless Chromium 156.0.8078.4, Playwright 1.64.1 and axe-core 4.13.0. Mobile projects emulate touch/viewport settings; they are not physical devices. Text enlargement uses scoped CSS fixtures, not an OS screen-reader or real-device session. Ownership tests dispatch controlled lifecycle events while using actual Chromium Web Locks. Firefox, WebKit, manual assistive-technology speech output and real BFCache restoration were not tested. Real C1 database integration remains unverified.

Demo mode only, synthetic browser data, no copied dotenv files or credentials. No Supabase/Docker command, database/Auth operation, backend/migration/deployment change or PR #19 mutation occurred. F03/F05/F06/F07/F08/F09 remain out of scope. Delivery must remain a **Draft PR**, pending independent review and explicit merge approval.
