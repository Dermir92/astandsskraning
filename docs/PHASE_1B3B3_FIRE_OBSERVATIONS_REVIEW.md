# Phase 1B.3b.3 — Residential fire observations: implementation review

Residential inspections now record smoke-detector observations and basic tests, visible extinguisher/label facts, and visible escape-route observations in one property-level **Brunavarnir** section in **Skráning**. The four-step workflow is retained. **Yfirferð** separates required-answer gaps, contextual limitations and active concerns; it never produces a fire-safety pass.

The owner approved the [contract and UX package](phase-1b3/planning/phase-1b3b3-fire-observations/README.md), authorized this implementation and deferred heating. Both approval clarifications are included in the planning documents and production behavior. This is an uncommitted review package against `main` at `8719157ac0981329110961fe3d248c3bf8b90f9b`; origin is `https://github.com/Dermir92/astandsskraning.git`.

## Focused correction pass — 18 October 2026

Only two production files changed in this pass: `use-fire-correction.ts` and the scoped fire stylesheet. A fieldset correction now focuses its checked enabled radio, falling back to its first enabled radio and then the fieldset itself. Focus never selects an answer. Leaving fire-correction mode clears the handled-query ref, so correction A → ordinary same-document entry → correction A reveals all ancestors and focuses again. Within the same correction entry, typing, successful saves, failed saves and retries retain one-time focus behavior.

The fire-review heading can wrap its flex row; the heading cannot shrink or break inside its word. At 320/360/390 CSS px with 200% text, **Brunavarnir** stays intact and the edit link moves below it. This is scoped to the fire summary.

Two focused regressions reproduce both navigation defects against the previous production build, then pass on desktop and both mobile projects after the fix (**6 passed**). Coverage includes an already-selected non-first answer, an unanswered group with its first radio disabled, exact report-byte preservation during correction entry, same-document re-entry with closed disclosures, and typing/saves/failure/retry. Existing fire-focus assertions now expect the selected radio. Enlarged-text audits assert a single heading line, a link below it, no horizontal overflow and zero axe violations at all three narrow widths. The complete suite below was rerun against the corrected production build, with retries disabled.

Review packaging also no longer leaves loose source copies inside the repository's broad TypeScript include. An initial typecheck found the previous generated staging directory; all 49 files were verified byte-for-byte in the existing ZIP before removing that redundant directory. The refreshed archive is written directly, without changing TypeScript configuration or application scope. [Correction scope verification](../artifacts/phase-1b3b3/correction-pass/scope-verification.json) checks the previous review inventory: only the two production files, fire browser tests and this report changed; the other 17 source/planning files are identical.

## Owner clarifications implemented

**Optional omissions are contextual information.** Missing equipment counts, locations and equipment examined-area descriptions remain visible in facts and the limitations list. They produce no required-field task, no task link and no action-count increment. Conditional required descriptions—such as a claimed test's scope or an observed obstruction—retain their approved minimums. Every valid incomplete draft remains saveable. Explicitly not examined/untested/unknown answers remain visible physical or knowledge limitations, distinct from unanswered questions.

**Active concerns take summary precedence across all rows.** The deterministic order is: no detector response; visible route obstruction; no equipment observed; visible equipment issue; missing/unreadable service label; invalid entered count. Ties retain fixed group order and stored row order. A later failed detector row outranks an earlier positive, untested or incomplete row. Inactive retained values do not create current concerns. After concerns, group summaries show missing required answers, then non-contextual limitations, then generic answered status.

Action counts include active concerns and, only in rental context, required-answer gaps. Limitations are not added to those counts. No aggregate of these categories is a safety score.

## Capture, review and navigation

Brunavarnir initially stays closed with three visible group statuses. Examination answers reveal presence and factual device details; one undivided row supports the simple case, with optional location rows for differing observations. No answer, count, date, location, test or result is filled automatically. Radio choices have explicit clear actions. The placeholder row is never persisted by viewing it; its first explicit edit creates a stable local ID while preserving focus.

Rental drafts always expose the three groups. Standalone/unknown contexts expose optional capture without rental missing-answer tasks. Context changes retain all values. Active concerns remain visible in any context. Zero-room drafts can record fire facts without creating a synthetic room or altering room-item progress.

Review shows all active rows and their scope, unknowns and limitations. Old results, descriptions and label text made inactive by a parent answer are available in a separate retained-data disclosure, without a current-finding or chronology claim. No extinguisher activation test or service-validity calculation is offered. A basic detector response is an observation, not technical certification.

Allowlisted correction links reveal/focus the exact group/row/input, including retained fields, once per correction entry, and return to the fixed visible fire-review anchor. Radio fieldsets focus the existing checked enabled answer or the first enabled option without selecting it. Leaving correction mode resets entry handling; saves and retries within the entry do not. Missing/stale/ambiguous links fall back safely. Fire corrections suspend the room-only canonicalization/focus/remember effect, leaving remembered room position and report data untouched. Ordinary room, core and rental navigation retain their existing contracts.

## Data and preservation

The only additive details member is optional `fireSafety?: ResidentialFireObservations`, using the approved independent types. Known nested shapes/enums/row IDs are validated; missing answers and semantic inconsistencies remain editable drafts. Raw counts and literal label text are preserved, with nonblocking semantic warnings. No migration, version bump or default backfill occurs; new drafts also start without fire facts.

`astandsskraning-demo-v1`, the existing v1 envelope, rental contract, `DemoStore` envelope retention, protected reads, failed-write pending state and retry implementation are unchanged. Nested patches preserve unknown fields at every old/new level and all unrelated reports. Unsupported shapes or reserved-key collisions protect the entire unreadable source, without cleanup or partial loading. Viewing, analysis, disclosure changes and corrections do not update report bytes or timestamps.

No photo target/uploader is added. Existing report/room/item preview associations stay intact during client navigation and fire edits; reload still loses only the existing session previews. There is no durable-photo claim.

## Changed application and test files

| File | Change |
| --- | --- |
| [src/lib/model.ts](../src/lib/model.ts) | Optional approved types/member and additive fire validator call. |
| [src/lib/fire-observations.ts](../src/lib/fire-observations.ts) — new | Validation, active/retained semantics, three issue categories, contextual omissions, deterministic summary precedence and immutable patches. |
| [src/lib/fire-navigation.ts](../src/lib/fire-navigation.ts) — new | Pure correction URL construction/parsing and collision-safe field IDs. |
| [src/lib/locale/is.ts](../src/lib/locale/is.ts) | Icelandic fire labels, safe prompts, explicit states and warnings. |
| [src/components/fire-observation-fields.tsx](../src/components/fire-observation-fields.tsx) — new | Property-level editor, optional location rows, retained controls and explicit edits only. |
| [src/components/fire-observation-summary.tsx](../src/components/fire-observation-summary.tsx) — new | Factual review summary, separated issue lists and correction links. |
| [src/components/fire-observations.module.css](../src/components/fire-observations.module.css) — new | Scoped petrol/teal styles, wrapping, focus and 44 px targets. |
| [src/components/use-fire-correction.ts](../src/components/use-fire-correction.ts) — new | One-time ancestor reveal/focus per entry, selected-radio focus, ordinary-entry reset and safe fallback. |
| [src/components/use-inspection-navigation.ts](../src/components/use-inspection-navigation.ts) | Narrow guard for fire corrections; existing room behavior retained. |
| [src/components/context-dialog.tsx](../src/components/context-dialog.tsx) | Preserve a later visible focus target when native dialog close precedes queued React cleanup; no evidence/data changes. |
| [src/components/screens/inspection-screen.tsx](../src/components/screens/inspection-screen.tsx) | Single fire section outside the keyed room editor; zero-room access. |
| [src/components/screens/review-screen.tsx](../src/components/screens/review-screen.tsx) | Fire summary and context-sensitive attention integration. |
| [tests/fire-observations-fixtures.ts](../tests/fire-observations-fixtures.ts) — new | Synthetic legacy/current/mixed/extension data. |
| [tests/fire-observations-compatibility.spec.ts](../tests/fire-observations-compatibility.spec.ts) — new | Semantics, precedence, optional omissions, validation, raw-data protection and retry preservation. |
| [tests/fire-observations-capture.spec.ts](../tests/fire-observations-capture.spec.ts) — new | Capture/review, every correction field, context/retained/zero-room/photo flows, mobile/keyboard/axe and screenshots. |

Existing application/test files changed: **6**. New application/test files: **9**. All five fire planning documents now record approval and both clarifications. This implementation review is new. No existing regression test or assertion was removed or weakened.

## Verification results

The full story is **explicit UI input → existing immutable store update → validated v1 localStorage → reload → derived factual review/correction**. There is no API/backend boundary in this slice. Browser verification uses installed Chrome and a fresh production server on local port 3103. Outputs and old tests' relative screenshot destinations are isolated under the new phase directory; the existing synthetic concept-upload fixture was copied byte-for-byte into that isolated working directory.

| Check | Result |
| --- | --- |
| TypeScript | Passed `npm run typecheck`. |
| Production build | Passed `npm run build`, Next.js 16.4.0, against the correction pass. The permitted local build was used for the browser regressions. |
| Source/test lint | Passed `npx eslint src tests`, without warnings. |
| Repository-wide lint | **41 pre-existing** `npm run lint` failures in preserved `docs/design/**/qa/*.cjs` and `tmp/*.cjs` (`no-require-imports`); no unrelated scripts or lint policy changed. |
| Full production regression | **491 passed / 16 intentionally skipped / 0 failed / 0 flaky**, 507 executions across desktop 1440, touch 360 and touch 390; retries disabled. Includes unchanged room/core/rental navigation, mobile and accessibility regressions. |
| New domain/store contracts | All 11 domain/store contracts passed in the complete regression. Fire-specific total: **77 passed / 4 intentionally skipped**, including capture and QA. |
| Mobile/accessibility | Passed at 320/360/390/768/1440 CSS px; zero axe violations in the width/scenario audits. 200% text at 320/360/390 px verifies an intact heading and stacked edit link. Native keyboard radio/correction flows and 44 px targets pass. |
| Preservation | **1838 baseline files identical; only 11 authorized existing files changed; none missing.** One previously locked server log could not be hashed and was not modified by this task. |

The initial retry browser test used an incorrect button name, corrected to the existing **Reyna vistun aftur**. The photo regression initially used full-document navigation, which correctly discards session previews; it now verifies client navigation followed by an explicit reload. Complete regression also found a fire/core CSS-class overlap; the new section was given its own scoped styling and the unchanged core date assertion now passes. The existing 360 px compactness check exposed an 18 px overflow below the viewport; the closed fire panel's spacing was tightened, preserving all three status lines, readable text and 44 px controls. Its unchanged assertion now passes at all three project widths. A late mobile photo-dialog focus failure was reproduced deterministically against the unchanged shared dialog: native close restored focus before React cleanup, which could then steal a subsequent focus move. A narrow cleanup guard preserves an already visible focus target outside the closed dialog. The new reproduction and original keyboard tests verify it; no photo/evidence data behavior changed. Automatic retries remain disabled.

## Screenshots and accessibility scope

The [local screenshot gallery](../artifacts/phase-1b3b3/review-gallery.html) contains 18 current images, all refreshed against the corrected build. [Machine-readable results](../artifacts/phase-1b3b3/verification-summary.json), [the current full acceptance report](../artifacts/phase-1b3b3/correction-acceptance/results.json) and [the complete change patch](../artifacts/phase-1b3b3/changes.patch) accompany this review. It includes empty rental capture, mixed failed/untested devices, optional omissions, retained values, all-not-examined, zero rooms, desktop review and doubled-text review at 320/360/390 px. The narrow enlarged-text fire heading was also visually inspected. Images use synthetic data.

Native controls/disclosures, labelled groups, explicit unknown/clear answers, correction focus, keyboard radio operation, 44 px targets and five-width reflow are checked. Automated axe checks use WCAG 2.2 tags, including expanded correction and retained states. Source/test lint and TypeScript supplement the React review: stable component boundaries, event-only mutations, immutable updates, primitive effect dependencies and stable keys were reviewed.

**Limits:** automated checks and manual screenshot inspection do not establish full WCAG conformance. Real NVDA/VoiceOver reading, physical devices, Safari/Firefox and actual browser 400% zoom were not tested; 320 CSS px reflow and 200% text were tested. Storage remains local, synchronous and subject to quota/eviction/older writers and cross-tab limitations. Fire answers remain unverified observations, never proof of legal compliance.

Heating remains deferred. Approved Concept C assets/rendering/PDF, room templates/enums/progress, backend, authentication, durable media, participant execution, payments and deployment remain outside this change. No commit, push, merge or deploy was performed.

The 16 skips comprise 12 existing duplicate desktop-only audits and four new duplicate width/gallery audits on the two touch projects. No regression assertions were changed or weakened. Final generated logs and failed exploratory-run evidence remain isolated in this phase's local artifact directory.
