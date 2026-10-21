# Phase 1B.3b.7a — Linked final inspection and ordinary checklist comparison

21 October 2026. Implemented from canonical `main` at `3d4ddc94cc7134874862b33f03ecdf15d64d8e56`, under the owner's explicit implementation approval in this chat. All changes remain uncommitted for independent review. No branch switch, commit, push, PR, merge, deployment or subsequent phase is included.

## Result

An eligible, editable residential initial report exposes **Hefja lokaskoðun** in Yfirferð. A deliberate confirmation creates one independent final draft with fresh report, room and item IDs. Repeated activation of the same creation operation returns the same draft, including when a storage write failed. Creation uses the existing validated whole-document persistence operation; no placeholder report is persisted first.

The four steps remain **Upplýsingar → Rými → Skráning → Yfirferð**. The active item can disclose **Upphafssvar · aðeins til viðmiðunar**. Final Yfirferð and the existing Concept C reader contain a responsive paired-value comparison; mobile stacks the labelled source and final values. The approved checklist, original report records and correction/return contracts remain available. No new route or workflow step is introduced.

## Exact copy contract

The source whitelist is declared and tested in `src/lib/inspection-comparison.ts`.

- Property: `address`, `postalCode`, `municipality`, `unit`, `inspectionContext`.
- Only in active `residential_rental` context: `landlordNames`, `tenantNames`, `leaseDate`, `leaseReference`, `propertyNumber`, `premisesDescription`, `includedAreasDescription`, `excludedAreasDescription`.
- Structure: room `name` and `type`; item `name`, optional `kind`, `functionality` and `cleanliness` flags. IDs are fresh and explicitly associated at creation.
- Display metadata: the source `Report.title` is reused as its property label; the new subtitle is **Lokaskoðun · drög**. The report ID and edit timestamp are newly generated and do not establish an inspection event.
- New `inspectionType` is `final`. Recorder name, role, representation, event/handover dates, performed scope, limitations, notes and furnishing answers remain empty. Fire and meter objects are absent. Every room starts with an empty observations object, including heating. No media, navigation metadata, meter confirmation guard, unknown source extension or other source field is copied.

Copied property/lease context is labelled user-supplied and requiring review. Source unknown extensions and all source facts stay untouched in the original report. A new draft does not claim that an initial or final inspection physically occurred.

## Association, change detection and preservation

The optional `Report.linkedInitial` block has version 1, the initial report ID, SHA-256 source-content and final-context fingerprints, and explicit room/item pairs. The report envelope remains version 1 under the existing key. The new block is optional for all legacy records; opening data never adds it.

The source fingerprint uses canonical JSON with sorted object keys and preserved array order. It covers stored source content and unknown extensions, excluding only top-level `updatedAt`. It does not include session media. No content snapshot, inspection chronology, issued version or audit trail is stored. Final-context guarding covers the selected property, type/context and active whitelisted rental facts.

Creation builds associations over the just-constructed structural clone. Subsequent reading, renaming, reordering and reconfirmation resolve IDs only; names and positions never rematch targets. Final room/item deletion permanently retires the corresponding association through the existing immutable update path. Restoring/reusing an ID, reloading and reconfirming do not reactivate it. New targets remain unmatched.

Relevant source/context differences immediately hide all comparison classifications while asynchronous guard checking is pending. A mismatch leaves capture usable and exposes deliberate reconfirmation outside the reader. Reconfirmation revalidates the currently displayed source/context, retains all final answers and pair metadata, and never rebuilds associations. Missing, ambiguous, ineligible or inactive source/type combinations do not produce a guessed comparison.

Existing storage-read protection, unknown envelope fields, pending-write errors, maximum report count and retry semantics remain. A valid failed write keeps exactly one final draft in memory and says so. Reading comparison/reference/media does not call report, navigation or media writers. Unsupported link shapes retain the established protected-read policy; raw data are not replaced.

## Comparison meaning

Condition, functionality and cleanliness compare independently only when requested/applicable on both sides. Missing answers, N/A, explicit unexamined/untested answers and incomplete supporting information remain distinct. Equal negative answers retain the current negative finding. Whole-item agreement is withheld for incomplete, limited or noncomparable assessments. Explicit final `wear` remains the recorder's assessment, including where other dimensions differ.

Active supporting-prose/note differences are labelled textual differences for review. They do not establish physical change, cause or liability. Inactive retained defect text remains outside current findings and can still be read through the existing qualified source records.

Unmatched records say only that they appear in one recording. They do not assert physical removal/addition. Renamed paired targets show both names. Incompatible item kinds receive no automatic verdict. Supplied dates remain qualified; missing/invalid and reversed dates receive explicit notices. Edit timestamps never establish event dates/order. Comparison counts are separate from unchanged domain progress/status helpers and are not a completion or quality score.

## Heating, fire, meters and photographs

Heating definitions are reused, but all final heating answers start unknown. Paired heating facts are shown independently with their existing helper-derived missing/limitation/defect semantics and no automatic change verdict. Fire and meter source records are separately labelled. Utility type alone does not establish identical meters; no delta, consumption or reading history is calculated. Existing purpose/arrangement/participation/confirmation rules remain unchanged.

Initial/final galleries borrow only the existing exact, qualified session associations supplied by the report adapter. They have no removal callbacks in comparison. No URL is created, persisted, copied into the final report or rebound. Each side is labelled; no capture date, viewpoint equivalence or image history is inferred. Reload removes both session galleries and displays an honest absence state. Durable photographic comparison remains excluded.

## Exact changed-file inventory

Nine modified existing files:

| File | Change |
| --- | --- |
| `src/lib/model.ts` | Optional link type and bounded link validation; existing assessment/completion/statistics helper bodies unchanged. |
| `src/components/demo-provider.tsx` | Guarded idempotent creation/reconfirmation and permanent association retirement on final edits. |
| `src/components/observation-editor.tsx` | Optional read-only reference slot. |
| `src/components/heating-observation.tsx` | Optional read-only reference slot; heating capture contract unchanged. |
| `src/components/screens/inspection-screen.tsx` | Supplies reference only to the deliberately opened item. |
| `src/components/screens/details-screen.tsx` | Compact link/context notice and guarded reconfirmation. |
| `src/components/screens/review-screen.tsx` | Initial creation action and final comparison section. |
| `src/components/report-preview.tsx` | Optional comparison reading section and truthful linked-source disclosure; original records retained. |
| `src/components/screens/report-preview-screen.tsx` | Supplies the comparison with reading-only behavior. |

Seven new files:

| File | Purpose |
| --- | --- |
| `src/lib/inspection-comparison.ts` | Exact whitelist, fingerprints, validation, structural cloning, associations, retirement and nonmutating comparison. |
| `src/components/inspection-comparison.tsx` | Creation, reference, guard/reconfirmation and read-only paired records/galleries. |
| `src/components/inspection-comparison.module.css` | Scoped petrol/teal presentation, labelled desktop pairs, stacked mobile values, reflow/focus/44 px controls. |
| `tests/inspection-comparison-fixtures.ts` | Synthetic initial/final and 100-item fixtures. |
| `tests/inspection-comparison-contract.spec.ts` | Domain, source identity, copy contract, compatibility, data safety and store regressions. |
| `tests/inspection-comparison.spec.ts` | End-to-end browser journeys, media, five-width accessibility and large-record coverage. |
| `docs/PHASE_1B3B7A_LINKED_COMPARISON_REVIEW.md` | This independent-review handoff. |

Total: **16 files: 9 modified, 7 new**. Existing tests, dependencies, configuration and historical approved design/research/evidence remain unchanged. Generated `.next` and ignored `tsconfig.tsbuildinfo` are normal build/typecheck output.

## Verification

Final production build, TypeScript and repository lint passed without warnings. The focused suite passed **64 tests, 2 intentional duplicate-width skips, zero failures**, with two workers and retries disabled. It includes 48 contract executions and 16 browser executions.

**Complete final production regression: 903 passed, 24 skipped, zero failures and zero flaky tests**, in 703.5 seconds (11.7 minutes), retries disabled. All 839 previously accepted passes and all 22 previous skips remain represented; the new scope adds 64 passing executions and two duplicate-width skips.

| Project | Passed | Intentional skips | Failures |
| --- | ---: | ---: | ---: |
| Desktop, 1440 × 1000 | 309 | 0 | 0 |
| Touch emulation, 360 × 800 | 297 | 12 | 0 |
| Touch emulation, 390 × 844 | 297 | 12 | 0 |

Final evidence: [HTML regression report](C:/Users/Danni/.codex/visualizations/2026/10/20/01a15aed-4e05-7bb2-b8ad-d28ae81b09d0/phase-1b3b7a-review/full-final-01/html/index.html), [complete result JSON](C:/Users/Danni/.codex/visualizations/2026/10/20/01a15aed-4e05-7bb2-b8ad-d28ae81b09d0/phase-1b3b7a-review/full-final-01/results.json), [screenshot gallery](C:/Users/Danni/.codex/visualizations/2026/10/20/01a15aed-4e05-7bb2-b8ad-d28ae81b09d0/phase-1b3b7a-review/gallery.html).

The final run used Chrome **155.0.8059.85** and production build `C-yvBtbCcclmP11NQWjDH`. All **103 source/test files** match the hashes recorded before the complete run. The original 280-file preservation inventory has **271 files identical in both content and modification time**, the nine explicitly authorized source changes, and zero missing files. Seven new files are listed above. The index remains empty and HEAD remains the canonical baseline. [Preservation audit](C:/Users/Danni/.codex/visualizations/2026/10/20/01a15aed-4e05-7bb2-b8ad-d28ae81b09d0/phase-1b3b7a-review/preservation-final.json), [exact changed-file hashes](C:/Users/Danni/.codex/visualizations/2026/10/20/01a15aed-4e05-7bb2-b8ad-d28ae81b09d0/phase-1b3b7a-review/changed-file-manifest.json).

Verification uses installed Chrome, a local production server on `127.0.0.1:3137`, and disposable synthetic contexts. An external configuration preserves the repository's projects, viewports, workers, timeouts, assertions and existing skip rules. It changes output locations and Chrome executable selection only. The unchanged concept-upload fixture is copied into the external working directory; historical relative screenshots/logs are generated there rather than overwriting repository evidence.

The initial focused browser run exposed incorrect new selectors (the labelled quick answer, two legitimate review destinations) and a nonwaiting step-count assertion. Those test setups were corrected; production assertions were not weakened. The corrected six-execution targeted run passed. New control focus was explicitly implemented for creation cancellation and successful reconfirmation. Screenshot inspection prompted a more compact disclosure for repetitive limitations; important guard/date warnings remain visible. Preliminary and interrupted diagnostics remain preserved separately.

## Accessibility, screenshots and bounded existing-journey checkpoint

The matrix covers 320/360/390/768/1440 CSS px in capture/reference, review, Concept C comparison and independent module facts, with long descriptions, incomplete/untested states and doubled computed text. It checks axe WCAG A/AA, 2.1 AA and 2.2 AA tags, rendered text/placeholder contrast and document overflow. Keyboard/focus tests cover cancellation, source reading, reconfirmation landing, precise correction/return and existing remembered-item resume. Final screenshots include changed, incomplete, modified-baseline, reconfirmed, memory-only and 100-item cases.

The bounded journey checkpoint exercises linked create → fresh capture → read-only reference → review → preview → correct → list/reload → exact resume. Separate source-edit/reconfirmation, failed-save/retry and real session uploads verify the store-to-storage-to-render boundaries. Existing full regressions retain the original fresh residential creation and standalone/no-rental-blocking scenarios.

A supplemental 390 px observation typed a final note with the initial-answer disclosure open: focus stayed on the note for every character, with **zero scroll movement** and a constant input position. The diagnostic's first selector omitted the existing optional-field label hint; the corrected selector completed without any production change. [Observed samples](C:/Users/Danni/.codex/visualizations/2026/10/20/01a15aed-4e05-7bb2-b8ad-d28ae81b09d0/phase-1b3b7a-review/typing-reference-observation.json). This is one browser observation, not a physical virtual-keyboard claim.

**Not claimed:** manual NVDA/VoiceOver announcements; physical iOS/Android camera, picker or virtual-keyboard behavior; Safari/Firefox; actual 200%/400% browser zoom or operating-system text scaling; human landlord/tenant reader testing. Standard Firefox/NVDA paths checked on this host were absent, but that is not an exhaustive software inventory. Computed text doubling and CSS viewport reflow are distinct from actual browser zoom. These remain open verification limitations rather than blanket blockers on unrelated prototype development. No new manual/device defect is claimed from an unperformed check.

## Remaining risks and exclusions

- Current-content fingerprints do not reconstruct earlier source versions or detect every historical edit, including edits restored to identical content. They are not signatures, tamper-proof identity or verified chronology.
- Browser-local synchronous storage retains quota/eviction, older-writer and cross-tab constraints. Multiple deliberate final drafts can refer to one initial; there is no verified property/case entity or unique finalization event.
- Copied lease/property context remains self-declared. Manual target remapping and linking existing final reports are Phase 7b follow-up work, not included here.
- Heating/fire/meter scope-aware verdicts remain deferred. Photos remain temporary, source-qualified illustrations without provenance/history guarantees.
- No backend, authentication, sharing, durable media, production PDF, payment, signatures, legal notices or issuing/locking/history system is added.

Implementation stops here for independent review. No Phase 1B.3b.7b work has begun.
