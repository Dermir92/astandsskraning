# Phase 1B.3b.4 — Hiti: implementation review

Room inspection now supports one **Hiti** observation for space heating and visible controls. The owner-approved [scope, model, completion rules and copy](phase-1b3/planning/phase-1b3b4-heating/PROPOSAL.md) include all three clarifications. Base is `8e99f2a74c2f1d0debcbb1b76afb94bb8ee9674a`; work is uncommitted on `codex/phase-1b3b4-heating`.

## Resulting behavior

New residential room creation explicitly requests a heating item after lights/switches. Initial new reports have 51 unanswered items; old templates and stored rooms are unchanged. New rooms added to an older report receive the new item. **Bæta við hitaskráningu** is the only path to adding it to an existing room or balcony; it preserves existing items and observation keys, avoids ID collisions and creates no answers. Cooking appliances remain untouched.

Some relevant equipment being visible uses `visible_parts`. Equipment OR scope identifies what was observed. A visual grade applies only to visible, identified parts; reported concealed equipment and its source remain distinguished in scope. Wholly supplied information uses `reported_concealed` and requires both description and source. The separate `informationSource` input implements the source-completion clarification without a per-device data structure or natural-language source inference. No equipment/scope requirement leaks into other visibility states.

The mixed-visibility correction keeps **Uppgefinn búnaður sem sást ekki** as a recorded visibility limitation when `visible_parts` has a nonblank active `informationSource`. It changes one derivation line in `src/lib/heating.ts`, the two heating regression files and these two documents relative to the previous review package. There are no UI component, model, template, persistence or dependency changes in this correction. No prose or equipment inference is involved. Inactive retained source information does not add a current limitation; fully reported concealed equipment retains its existing limitation. Completion and explicit defects are unchanged, with no new required-field task, broken-function answer or repair task.

An attempted operation needs its actual action/equipment scope, response and factual description. No observed response and mixed responses get factual summary precedence but never automatically become a defect, broken-function answer, photo requirement or repair task. Review separates incomplete items, recorded limitations and explicit visible defects. Only active explicit visual defects require the existing defect details and contribute to defect counts. All incomplete but structurally valid drafts remain saveable.

Nested immutable updates retain unknown extensions and all unrelated reports. Inactive scope/source/equipment, visual condition, operation facts and defect prose remain editable in retained-data disclosures, without current-finding claims. No hydration, viewing, disclosure or navigation operation supplies answers, changes report bytes or timestamps. The existing v1 storage key/envelope/version, protected reads, pending-write retry, four steps, room navigation and session-only photo behavior remain intact.

## Exact application changes

| File | Change |
| --- | --- |
| `src/lib/model.ts` | Optional heating contract/tag; explicit template opt-in; heating-aware completion, status, statistics, defects and additive validation. |
| `src/lib/heating.ts` — new | Structural validation, conditional missing answers, factual/limitation/defect derivation, extension detection and collision-safe item creation. |
| `src/lib/locale/is.ts` | Plain Icelandic labels, prompts, source/visibility help and certification boundary. |
| `src/lib/inspection-navigation.ts` | Heating-aware partial/missing-answer routing; existing room URL contract retained. |
| `src/components/heating-observation.tsx` — new | Native room editor, retained controls, independent scope-source field and factual review facts. |
| `src/components/heating.module.css` — new | Scoped wrapping, 44 px controls, visible focus and existing palette. |
| `src/components/demo-provider.tsx` | Explicit new-report template opt-in and guarded explicit add; persistence/retry code unchanged. |
| `src/components/screens/rooms-screen.tsx` | Opt in only newly created predefined/custom rooms. |
| `src/components/screens/inspection-screen.tsx` | Tagged editor dispatch and explicit add within existing room inspection. |
| `src/components/use-inspection-navigation.ts` | Reveal heating field disclosures and focus native controls without selecting answers. |
| `src/components/screens/review-screen.tsx` | Per-room facts/retained values; distinct heating counts; legacy absence disclosure without backfill. |
| `src/components/report-overview.tsx` | Include only explicit active heating defects in existing defect previews/counts. |

New tests are `tests/heating-fixtures.ts`, `tests/heating-compatibility.spec.ts` and `tests/heating-capture.spec.ts`. They use synthetic data. In `tests/prototype.spec.ts`, three new-report scenarios now assert the approved new template totals (51 initial items, 66 after adding the two indoor rooms). The last-item scenario explicitly answers Hiti as not examined/not tried and verifies 8 of 51 recorded with the selected room unchanged. No assertion was removed or weakened; all other pre-existing regression files are unchanged.

## Verification

**Corrected production regression: 555 passed, 18 intentional skips, zero failures and zero flaky tests (573 executions).** Heating-specific coverage contributes 64 passes and two duplicate-audit skips; all 491 pre-existing regression cases pass with their original 16 intentional skips. Desktop passes 191 cases; each touch project passes 182 with nine intentional skips. Retries are disabled. The two source-limitation assertions reproduced the bug before the derivation change. All 11 focused domain cases pass after the correction.

`npm run build`, `npm run typecheck`, source/test ESLint and repository-wide `npm run lint` all passed on the final source. This laptop has none of the desktop-only QA/temp scripts that produced the previous fire review's 41 existing lint errors; no unrelated lint scripts or policy were changed.

Focused regressions now cover complete mixed visibility with both observed and mixed responses, one recorded visibility limitation, zero defects and no next-incomplete task. They correct the former zero-limitations expectation, cover blank/whitespace/absent sources and prove that prose/equipment do not imply a source. Switching visibility preserves source bytes without leaking that source into current findings. The browser scenarios also preserve the no-response case and verify separate review counts, correction navigation and reload nonmutation.

All 19 screenshots were regenerated against the corrected production build, including editor/review at 320/360/390/768/1440 px and 200% text at the three narrow widths. The mixed-visibility review now shows one item with a recorded limitation, zero incomplete heating items and zero explicit heating defects. Axe and target-size/reflow checks passed. Thirteen affected editor/review images changed; the six unrelated scenario screenshots are byte-for-byte identical to the prior review.

The verified story is explicit UI input → immutable existing store update → validated v1 localStorage → reload → factual review/correction. No API/backend is involved. Tests use installed Chrome, a fresh production server on port 3104, the original two workers, no retries, synthetic contexts and external output directories. Existing tests' relative screenshots and their synthetic upload fixture are isolated outside the checkout. No personal browser drafts are used.

The local review package includes a screenshot gallery, final results, exact file inventory/hashes, supporting diff and checksum manifest. Generated screenshots, logs, archives and loose staging copies remain outside this checkout. Evidence filenames are plain text because those files are not part of a source publication.

## Limits and scope

Automated axe/keyboard/reflow checks and screenshot inspection do not establish complete WCAG conformance. Physical devices, actual 400% browser zoom, manual NVDA/VoiceOver, Safari and Firefox are not verified. Text and claimed information sources remain user-supplied and unverified; a short observation cannot establish heating-system adequacy or professional certification. Existing local synchronous storage/cross-tab/older-writer limits and session-only photos remain.

Meter readings, plant service, measurements, other features and deployment are excluded. No commit, push, merge or deployment is authorized by this review package.
