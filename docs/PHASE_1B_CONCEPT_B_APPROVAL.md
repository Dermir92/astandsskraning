# Phase 1B — Concept B approval and proposed first residential slice

> **Archived approval record.** This records the earlier Concept B selection and proposed scope. The prerequisite Phase 1B.1a fixes and the bounded Phase 1B.2a checklist are now integrated. The broader proposal below is not a claim that exact-item continuation or optional photos for every condition have been implemented. See [the implementation review](PHASE_1B2A_INSPECTION_CHECKLIST.md) and [publication notes](PUBLICATION.md).

15 October 2026. **UX direction approved; implementation scope proposed for review only.**

The product owner selected **Concept B — Þéttur gátlisti** as the primary residential inspection workflow. Preserve its compact room checklist and focused expanded item editor. **Concept A will remain a comparison prototype, not a separate permanent inspection mode.** This approval does not authorize starting the full implementation.

## Approved behavior

- An explicit one-tap **“Í lagi”** records condition only. No satisfactory defaults, inferred answers, bulk positive action or automatic completion of other dimensions.
- Functionality and cleanliness remain separate explicit decisions where required. All six existing condition choices remain clearly discoverable. A clearly labelled alternative-condition action must be visible on each row with comparable prominence to the neutral quick answer; a chevron alone is insufficient. Positive styling reflects an actual selection, not a suggested answer.
- Resume the exact room/item and navigate directly to incomplete findings, with useful focus in the relevant answer group. Navigation itself supplies no answers.
- Support optional item photos and notes for relevant condition states, including satisfactory, wear and cleaning-only observations. Preserve existing associations, required deviation fields and photo/completion rules.
- Keep recorded, incomplete, attention-required and deviation states distinct. Retain existing applicability/unknown-answer behavior and petrol/teal identity, mobile-first layout, readable working text and accessibility target.

The measured **144 versus 103 activations** concern one all-good five-room path with 99 explicit answers. The 28.5% difference is **not a measured reduction in inspection time**. Photographs remain temporary previews that disappear on reload; mutable draft corrections are not immutable audit history.

## Prerequisite: separate Phase 1B.1a

**Do not integrate the new inspection flow until F03 and F13 have been addressed and verified in their separate bounded recovery task.** Inspection of the current source confirms that both remain open at this checkpoint. No recovery fix is implemented in this documentation task.

| Finding | Current source behavior | Required evidence before the inspection slice |
| --- | --- | --- |
| **F03 — corrupt-storage retry overwrites the source** | [DemoStore](../src/components/demo-provider.tsx) rejects invalid stored data and shows fallback fixtures, but `retrySave` passes that fallback to `persist`. | Loading invalid raw data and pressing retry must preserve the original bytes. Recovery must not silently replace them with samples. Ordinary write-failure retry must still save the user's valid in-memory edits and report success only after a successful write. |
| **F13 — save/load collection-limit mismatch** | `createReport` can prepend to a 500-report list; [isReportList](../src/lib/model.ts) rejects more than 500 on reload. | At the existing 500-report boundary, creation must not produce an unloadable 501-report save or a ghost draft. Existing reports remain editable and reloadable. Save/mutation limits must agree with validation; do not weaken validation, silently raise limits or discard an over-limit raw document. |

Phase 1B.1a does not implicitly include cross-tab conflict resolution, durable media, a new storage schema or the inspection redesign. The later inspection work must retain its recovery regression tests.

## Proposed first slice

**Outcome:** integrate B's room checklist into the existing editable residential inspection route, using the current report/store/model, with exact continuation and precise correction navigation. Keep the shared shell, report register, report creation/details, room setup and existing asset templates unchanged. Reuse the concept as a design reference; do not move its synthetic scenarios or sandbox session store into the application.

| Component / boundary | Proposed change |
| --- | --- |
| [inspection-screen.tsx](../src/components/screens/inspection-screen.tsx) | Replace the inspection-body composition with compact room rows, an explicit condition action and a focused expanded editor; retain room orientation, progress, incomplete-item access and room navigation. |
| [observation-editor.tsx](../src/components/observation-editor.tsx) | Present the neutral quick answer beside clearly named access to alternative choices. Reuse native answer groups, separate required dimensions, existing deviation fields and item notes. Keep all conditions editable without a positive default. |
| [photo-preview.tsx](../src/components/photo-preview.tsx) and editor placement | Reuse the current temporary preview control for relevant item states, keeping existing `report:room:item` keys and room-overview keys. Keep limits, validation, truthful temporary-media disclosures and missing-evidence flags. No media bytes/URLs in persistent report data. |
| [review-screen.tsx](../src/components/screens/review-screen.tsx) | Add precise room/item/answer-group destinations to incomplete and attention findings. Limit changes to finding access and correction navigation; no general review-page redesign. |
| Small new inspection-position adapter | Store only navigation metadata separately from the report document, keyed by report ID. Resolve explicit item links first, then valid saved position, then a safe existing-item fallback. Deleted/stale targets or unavailable metadata storage must not alter report data or falsely claim a position was saved. The existing register Continue link can remain; the inspection route resolves its position. |
| Inspection-scoped styles, [Icelandic labels](../src/lib/locale/is.ts), regression coverage | Match approved colors, typography, touch targets, focus and responsive behavior. Add production-flow tests; preserve concept tests and evidence. Avoid global shell/register restyling. |

Use the existing `observationComplete`, `needsAttention`, `requiresDamage`, room/report statistics and report JSON schema as unchanged behavioral contracts. Preserve existing observation values and associations when toggling condition/applicability. Do not add new clearing/deletion behavior, rewrite retained evidence, or present retained draft values as a historical record. Broader undo/deletion/history policy is outside this slice.

## Regression risks and acceptance criteria

| Risk | Acceptance criteria for the future implementation |
| --- | --- |
| Quick-good hides meaningful decisions | New items start unanswered. Quick-good changes condition only; windows still require explicit function and cleanliness answers. Alternative conditions are visibly named and keyboard accessible on every row. All six choices are usable without a visually favored default. No bulk answer or answer-triggered advance. |
| Existing drafts change meaning or lose data | Existing IDs, answers, notes, deviation text, room order, photo associations and report serialization survive edits and reload unchanged except for the user's explicit changes. Model/statistics and the separately verified F03/F13 guarantees remain intact. |
| Resume opens the wrong item or steals an explicit destination | Reload and Continue from the register return to the exact current room/item, even when earlier items are incomplete. Review/incomplete links override saved position, expand the target and focus the relevant control. Stale/deleted positions fall back safely; browser navigation remains usable. |
| New photo access implies durability or changes requirements | Optional photos/notes work for relevant satisfactory, wear, cleaning and deviation states. Required damage text and existing completion/evidence rules remain. Reload retains text, honestly loses previews, and surfaces missing evidence; no “saved” claim implies permanent media. |
| Recorded is mistaken for satisfactory | Unknown/uninspected/untested answers retain the existing recorded/attention distinction; missing subsidiary answers remain incomplete. N/A retains existing applicability behavior. Counts and review flags match the unchanged model. |
| Dense rows harm field use or accessibility | At 360 and 390 px the first condition action is visible initially, room/current-item orientation remains clear while scrolling, and touch targets are at least 44 px. Review 768/1440 px and normal/incomplete/deviation/resume states too. Verify 14–16 px working text, contrast, native radio keyboard behavior and clearly visible focus, dialog focus restoration, text enlargement and no horizontal overflow. WCAG 2.2 AA remains the target. |
| Wider application regression | Existing application, Phase 1B.1a recovery and concept tests pass, alongside new integration tests. Keep the approved register/shell visual baseline. Capture fresh screenshots at all four widths; include physical-device camera/keyboard checks in acceptance and document anything still unverified. |

Explicit exclusions: permanent A mode, backend/authentication/payments, permanent media storage, new asset templates, new inspection business rules, finalization/signing/export, immutable audit history, broad recovery/concurrency work and unrelated register/shell redesign. Any expansion needs separate scope review.

## Git and preservation checkpoint

- Inspected `main` at **`5997b9348aef17a689f3034a1905487b5a3e1631`**. All **97 tracked files were unchanged**; the concept work was **12 untracked files** and **206 ignored QA/evidence files**. An ordinary Git commit/status does not preserve the ignored evidence.
- Before updating documentation, created a separate [preservation archive](../local-archive/phase-1b-approval-preservation-20261015T122241656Z/concepts-and-evidence-before-approval.zip) and [manifest](../local-archive/phase-1b-approval-preservation-20261015T122241656Z/preservation-manifest.json). **All 218 archive entries were checked against their source SHA-256 hashes and lengths.** This includes both prototypes, the original preselection report, asset, QA scripts/tests, screenshots and review evidence.
- Both prototype implementations and all existing evidence remain in place and unchanged. Only this approval record and the concept report's current-status annotations were written. Copies of the final decision documents are retained beside the archive.
- No branch switch, stash, reset, clean, commit, merge, push or deployment occurred. Before a future branch change, preserve these untracked files and the separately ignored evidence; never rely on a plain stash to capture both. This checkpoint does not authorize changing branches.

The historical validation remains **127 passed, 2 expected skips**, with 96 concept captures; it is not a new test run for this documentation-only task. No application implementation or recovery fix was started. **Stop here for review of the proposed first slice; integration remains dependent on completed Phase 1B.1a.**
