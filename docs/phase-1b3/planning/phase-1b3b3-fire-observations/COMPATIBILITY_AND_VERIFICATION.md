# Compatibility, affected files and verification plan

**Approved implementation plan.** The original file map records the planning baseline; actual implementation and verification are recorded in the Phase 1B.3b.3 review package.

Implementation QA exposed one narrow shared-UI dependency: native photo-dialog close can restore focus before queued React cleanup, which could steal a subsequent keyboard focus move. The failure was reproduced against the unchanged `ContextDialog`; its cleanup now preserves an already visible focus target outside the closed dialog. This adds a small `src/components/context-dialog.tsx` accessibility fix to the original file map, with a deterministic regression and the original photo/report-dialog tests retained. Photo associations, storage, target formats and session-only behavior are unchanged.

## Current implementation reviewed

| Area | Current evidence | Consequence for this phase |
| --- | --- | --- |
| `src/lib/model.ts` | `ApartmentDetails` has optional common metadata and `rentalInformation`; `Report` has details, rooms and existing sample marker. No dedicated fire fields. | One optional `details.fireSafety` member; no new report state or inferred defaults. |
| Templates and statistics | `common`/`extra`, `makeRoom`, `initialRooms`; condition/function/cleanliness helpers drive `observationComplete`, `needsAttention`, room/report statistics. | Keep templates and enums intact. Fire facts use separate pure helpers; room-item progress retains its denominator and meaning. |
| Inspection screen | Property-wide room progress, sidebar/mobile selector, keyed room editor; early return on no rooms. | Render the fire section once above room selection and outside keyed room content, including zero-room drafts. No repeated room questions. |
| Navigation | `InspectionPosition` represents real room/item IDs; independent position storage; room effect canonicalizes URL, focuses and remembers position. | Fire correction needs a separate selector/helper and a narrow guard before room canonicalization. Do not fake a room or change position-storage format. |
| Review | Combines core/rental issues, room attention and missing photos; separate core/rental summaries and safe correction anchors. | Add factual fire summary and relevance-aware issues to `hasAttention`; no “all fields answered = safe.” Preserve other groups. |
| Store loading | `DemoStore.hydrate`, `isReportList`: all-or-nothing read, legacy fields checked explicitly, read errors lock edits/create/retry and preserve raw bytes. | Extend only optional fire-shape checks. No cleanup, partial load or rewrite on read. |
| Envelope/retry | `DemoStore` retains the validated envelope and serializes `{ ...this.envelope, version: 1, reports }`; valid failed writes retain pending in-memory reports and support retry. | The prior envelope fix is already implemented at this baseline. Retain it; do not reimplement or normalize it. |
| Evidence | `PreviewPhoto { id, url, name }`, session-only map. `addPhoto` accepts only existing apartment room overview/item targets; keys include report/room/item identity. | No fire uploader in this slice; no copying/rekeying existing photos, synthetic item creation or service-label photo permanence claim. |
| Retained observation data | `hasRetainedDefect` and review distinguish inactive descriptions from current defects; notes/photos remain associated. | Apply equivalent presentation separation to inactive fire branches without touching room observations or assigning chronology. |
| Next.js guidance | Package Next.js 16.4.0; repository `AGENTS.md` requires bundled docs before code. Relevant installed `01-app/01-getting-started/05-server-and-client-components.md` read. | Future controls/localStorage remain in existing client boundaries. No implementation or dev server start in this task. |

The existing `deliveryDate`, furniture rules, date/name/scope metadata, party names, lease association and representation are not replaced or broadened. A recorder role remains self-declared; `independent` inspection type does not establish a professional examiner. Sample-reviewed and unsupported asset pages stay read-only.

## Additive storage strategy

Keep **`astandsskraning-demo-v1`**, envelope **`{ version: 1, reports }`** plus retained extension keys, and existing v1 drafts. Do not add the fire member to `EMPTY_DETAILS`, fixtures or legacy reports merely because the application now knows it. A new draft also starts without recorded fire facts; displayed blank controls are not stored answers.

| Concern | Required later implementation behavior |
| --- | --- |
| Legacy/no-fire drafts | Missing member, `{}`, missing groups and missing optional fields load. Readiness/render-time fallbacks do not mutate report JSON, `updatedAt`, photos or storage. No migration/version bump/backfill. |
| Known structure | Present fire/group/test/label values must be plain objects; known enums use exact listed values; optional prose/count/label text must be strings; `entries` must be an array of plain objects with nonblank stable unique string IDs within its group. Validate optional nested members even if their branch is inactive. |
| Bounded data | Propose at most 100 entries per equipment group as an application storage/editing bound, not an equipment requirement. `[]` is valid. Do not truncate arrays. Keep 500-report, 100-room/report and 100-item/room limits and existing quota behavior. |
| Structural versus semantic validation | Wrong known shapes, scalar types, duplicate/blank IDs, unsupported enums or over-limit arrays enter the existing protected read-error path; reject corresponding new invalid mutations without replacing good pending edits. Missing answers, partial prose, count-format problems and active contradictions remain saveable drafts with derived issues. |
| Reserved-key collision/future values | Older arbitrary extension named `fireSafety` with an incompatible known shape, or a future unsupported enum, protects the whole raw document. No silent dropping, guessing, downgrade to unknown or fallback overwrite. Separate recovery decision required. |
| Unknown extension fields | Preserve unknown JSON at envelope, report, details, rental/representation, fire root, each group, row, test/label, room, item and observation. Unknown branches remain opaque; never JSON-whitelist the known schema into a replacement. |
| Nested updates | Spread every changed ancestor and the existing edited row/test/label; update the row by stable ID. Preserve other rows, unrelated report properties and all unrelated reports. A real explicit edit changes its chosen value plus the existing `updatedAt`. |
| Clear/branch change | Clear one enum by removing only that known member; string clearing writes `""`. Do not delete a group/object or its siblings/extensions. Changing examination, presence, test performance or label status makes dependent facts inactive; preserve them and expose a retained-data disclosure. Re-selecting the branch reveals its values without creating new ones. |
| Context switches | Changing rental→standalone→unknown→rental changes only context and normal edit timestamp. All fire, rental, handover, room and evidence values survive. No population from rooms, floor area, notes or lease metadata. |
| Reads/navigation | Hydration, summaries, issue derivation, disclosure toggles, correction/review and row-placeholder display cause zero writes to report storage and preserve its exact bytes/timestamps. Fire correction also leaves remembered room-position storage untouched. |
| Failed writes/retry | Keep all pending valid edits and retained envelope in memory. Save status reports success only after a successful storage write. Retry includes latest valid fire edits and every retained extension; invalid attempts cannot replace pending valid state. |
| Unreadable source | Protected fallback is read-only; fire controls cannot create a replacement report, mutate fallback or authorize a retry. Preserve original raw string, even malformed JSON or an unsupported version. No reset/repair/recovery control added. |

Count strings are raw data; only display/issue logic interprets them. A service label is raw observed text, not a parsed service date. No new calendar normalization is needed. Omitted/blank values stay missing; zero is never invented for an absent answer. A protected invalid document is a structural safety boundary, distinct from a valid but incomplete fire draft.

Existing clients accept unknown detail fields and spread-based edits may carry them, but this is not a guarantee about every old writer. Keep the current limits: synchronous browser-local whole-document storage, no cross-tab merge, no server backup; eviction/clearing/older clients may lose data. No new cross-tab strategy or durability claim is added.

## Proposed application and test files

Paths below are relative to the repository root. The implementation review records the final changes to this originally proposed file map.

| File | Later responsibility |
| --- | --- |
| `src/lib/model.ts` | Optional fire types/member and additive structural validation; no enum, template, default, room-stat or report-status changes. |
| `src/lib/fire-observations.ts` — new | Pure active/retained/readiness/concern helpers, row selection and semantic count checks; no writes, mutation or legal grading. |
| `src/lib/locale/is.ts` | Approved Icelandic labels/help/status/warnings. Narrow existing rental boundary copy only if it currently describes *all* fire capture as unavailable; retain physical/formal limitations and heating/meter gaps. |
| `src/components/fire-observation-fields.tsx` — new | One property group editor, conditional fields, optional location rows and safe nested patches. |
| `src/components/fire-observation-summary.tsx` — new | Read-only group findings/limitations/missing facts; stable `review-fire-safety` anchor; optional-context display. |
| `src/components/use-fire-correction.ts` — new | Parse allowlisted fire selectors, reveal/focus once, fixed review return and read-only fallback for malformed/stale targets. |
| `src/components/screens/inspection-screen.tsx` | Place fire section outside keyed room editor, including zero rooms; coordinate fire corrections and existing room controls. |
| `src/components/use-inspection-navigation.ts` | Narrowly suspend room canonicalization/remember/focus while a fire correction is active; ordinary explicit room navigation resumes existing behavior. Preserve old correction/resume flows. |
| `src/components/screens/review-screen.tsx` | Add fire summary, three issue categories and context-sensitive attention integration without changing room statistics. |
| `src/app/globals.css` or a new scoped `src/components/fire-observations.module.css` | Small wrapping/disclosure/focus styles reusing current tokens; no redesign or new dependency. Choose the scoped module if styles are specific to the new controls. |
| `tests/fire-observations-fixtures.ts` — new | Literal old v1/current rental fixtures plus fire/mixed/extension/invalid cases; no new defaults disguised as legacy data. |
| `tests/fire-observations-compatibility.spec.ts` — new | Structural/semantic distinction, applicability, raw read preservation, extensions and store recovery. |
| `tests/fire-observations-capture.spec.ts` — new | Capture/review/correction, context/branch switches, safe copy, keyboard/reflow and concerns. |
| `tests/inspection-navigation.spec.ts` | Fire-selector isolation, remembered-room invariance, mixed-selector fallback and existing room correction regression. |
| Existing `tests/local-data-safety.spec.ts`, `tests/rental-information-{capture,compatibility}.spec.ts`, `tests/inspection-core-{capture,compatibility}.spec.ts`, `tests/inspection-evidence.spec.ts`, `tests/inspection-checklist.spec.ts` | Run unchanged where possible. Add assertions only where needed to prove preservation; never weaken or remove existing checks. |

`DemoStore` should not need a functional change: its existing generic report updater, envelope retention, read locks and retries cover the proposed object. Verify this rather than rebuilding the persistence layer. `src/lib/inspection-navigation.ts`, its position format, `use-details-correction.ts`, `details-screen.tsx`, `ReportOverview`, room editors/templates, evidence store and fixtures should not need functional changes. If implementation exposes an actual dependency, explain it before broadening scope.

No backend, authentication, payments, durable photos, signatures, notifications, dependencies, route additions, production Concept C rendering or PDF work. No changes to approved design/research/archive assets.

## Accessibility acceptance plan

Target WCAG 2.2 AA and the requested 44 px product target standard, using [the official recommendation](https://www.w3.org/TR/WCAG22/). Automated checks complement, not replace, real assistive-technology review.

| Check | Required later evidence |
| --- | --- |
| Mobile/reflow | Capture and review at 320, 360, 390, 768 and 1440 CSS px; long Icelandic locations/prose, 100 rows, expanded hints and warnings. No horizontal page scrolling, clipped summaries or obscured controls. |
| Text/zoom | 200% text, actual 400% browser zoom to a narrow viewport, and WCAG text-spacing overrides. Preserve content, choices, correction and save status. |
| Keyboard | Tab order through disclosure summaries, radios, fields and add/clear/correction actions; arrow-key radio behavior; Enter/Space disclosures; visible, unobscured focus. No focus traps outside existing photo modal. |
| Screen reader | Real NVDA with Chrome/Edge: empty rental, unknown versus unrecorded, examined→present→test, failed result, service-label choices, partial-route scope, row addition and return to review. Confirm legends, name/role/value, headings and hints/errors. |
| Focus stability | Add row focuses its heading once; correction opens all ancestors/focuses the named field; ordinary input/save/retry/context rendering causes no unsolicited refocus. Sticky room headings cannot cover focus. |
| Contrast/targets | Measure existing token combinations in the new states: 4.5:1 normal text, 3:1 qualifying large text and relevant non-text boundaries/states. At least 44 × 44 CSS px actionable targets; text accompanies warnings. |
| Automated audit | Axe with WCAG 2.2 tags in expanded/closed, missing/unknown/failed, optional and retained contexts; no hidden required controls or nested interactive summary content. |
| Safe input/status | Unknown/not tested is not an invalid field. Associate actual active errors/hints programmatically, keep clear actions labelled and announce save failure/row addition without per-keystroke chatter. |

Record any unperformed screen-reader, physical-device, Firefox/Safari or actual zoom checks as remaining limitations rather than claiming conformance.

## Regression and end-to-end plan after approval

Use synthetic data and isolated browser storage. Run focused new specs, then `npm run typecheck`, `npm run lint`, `npm run build` and the full `npm test`. Follow existing project/browser setup; do not repeat broad runs once passing unless subsequent changes/failures justify it.

| Area | Required cases |
| --- | --- |
| Explicit relevance | Cross context absent/empty/standalone/rental with initial/final/independent types. Only explicit rental triggers rental fire minimums; type/role/lease data must not infer context, examiner status or observation. |
| Full state matrix | Empty; partial; none observed; present untested; performed positive/negative/unknown result; examination unknown/not examined; visible condition missing/unknown/unexamined/issue; all five label states plus missing. No pass, sufficiency or maintenance verdict. |
| Conditional gaps | Parent unanswered emits one missing group, not hidden-child cascades. Present with no meaningful row; missing visual/test/label answer; performed result/scope missing; partial scope missing; readable label text missing; route scope/obstruction/detail missing. Every valid partial draft survives reload. |
| Mixed scope/results | Tested and untested detectors in different locations; count larger than tested subset; differing extinguisher labels; partial route with obstruction and inaccessible area. No total count, all-tested inference or building-wide assurance. |
| Counts/text | Blank, whitespace, leading zero, `0`, negative, decimal, nonnumeric and oversized count strings; partial/ambiguous/multiple service dates; long multiline prose. Exact entered strings round-trip, issues remain nonblocking. |
| Active/retained | Change examined→not examined/unknown→examined, presence observed→none→observed, performed→not performed→performed, readable→unreadable→readable. Retain all subsidiary values/extensions; exclude inactive facts from current conclusions and re-show them on explicit return. |
| Context preservation | Fill all fire/rental/common fields and room observations, then rental→standalone→unknown→rental with reloads. No silent clear/populate; optional missing answers carry no rental penalty; known concerns stay discoverable. |
| Legacy read | Literal pre-core v1, core-only, merged rental, absent/empty fire and empty groups/arrays. Hydrate, review, open disclosures, follow corrections and show placeholders with exact report bytes/timestamps unchanged and no stored defaults. |
| Extensions | Unknown JSON at every old/new nested level and unrelated reports survives one-field edits, branch/context changes, clears, write failure and retry. Extend labels/tests without overwriting unknown siblings. |
| Protected storage | Malformed JSON, unsupported envelope version, fire-key collisions (`null`, string, array), wrong known enums/types, duplicate row IDs, 101 rows. Raw source remains unchanged; edits/create/retry/photo operations cannot replace fallback or source. |
| Store boundaries/retry | 100/101 fire rows; existing report/room/item limits. Quota/blocked writes retain pending valid edits and envelope; a rejected invalid mutation cannot erase them; retry saves the latest correct state. |
| Navigation | Every group/field/row correction, zero rooms, stale/missing/duplicate IDs, duplicate/unknown query selectors, mixed room/fire selectors, attempted external returns, reload and Back/Forward. No canonicalization loss, room-position write, report write, focus theft or redirect. |
| Main flow | Create rental draft → common/rental info → rooms → fire partial facts → ordinary room item → review concern/gap → exact fire correction → fixed review return → reload. Both room progress and fire limitations remain accurate. |
| Evidence | Attach room overview/item previews, change fire facts/context/room names, navigate and review. Same original photo keys and associations; reload loses only existing session previews and retains fire text. Fire fields offer no uploader or inferred label photo. |
| Existing contracts | Compare `roomStats`, `reportStats`, `observationComplete`, `needsAttention`, `reportStatus` and sample rendering before/after fire-only edits. Full checklist/navigation/evidence/register/core/rental regression; approved Concept C fixtures/assets unchanged. |

No test result in this table is claimed for the present planning task.

## Original planning-only verification (before implementation approval)

Repository/origin/current-main checks are recorded in [the package index](README.md#repository-baseline). Before writing this package, a SHA-256 manifest captured 533 existing tracked/untracked source/package files, and a second manifest covered existing ignored `artifacts/` content. `artifacts/phase-1b3b2/server.log` was locked by another process and could not be hashed; it was not opened for writing or otherwise operated on. Manifests were written to temporary storage, outside the repository.

Completed document-only checks:

- Five new Markdown documents; 19 local links/anchors resolve; all code fences balance.
- Six complete JSON examples parse and typecheck against the exact proposed contract using the installed TypeScript compiler, strict/no-emit, entirely in memory. Zero diagnostics and zero emitted application/test files. Inline edge-case snippets were reviewed as specification prose, not claimed as executed tests.
- Tracked and staged diffs remain empty; `git diff --check` passes. The only new repository path is this planning-package directory; all four pre-existing untracked status entries remain present. Tool mutations were limited to creating/editing these five new documents and the temporary manifests.
- Full before/after SHA-256 comparison is **not claimed**: the tool's temporary sandbox directories were not retained between calls, so the initial manifests could not be reopened. The locked server log was also unhashable. No pre-existing document/archive/application/test was targeted by a write, delete or move.

Application tests/build/lint were intentionally not run for this specification. No application schema or test was modified to verify a planning artifact. No development server, commit, push, merge or deployment was started by this task.


## Owner approval — implementation authorized

18 October 2026: the owner approved this contract and UX arrangement, deferred heating, and authorized implementation without commit, push, merge or deployment. Optional equipment counts, locations and equipment-scope descriptions remain contextual limitations only: no required-field task or action-count increase. Required answers, limitations and concerns remain separate. Collapsed summaries always prioritize active concerns (including a failed detector response in any mixed row) over generic answered, incomplete or untested statuses. Deterministic ordering and verification are recorded in the implementation review. This approval supersedes earlier planning-only stop language for the authorized implementation slice.
