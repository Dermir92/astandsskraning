# Phase 1B — Inspection workflow concepts

> **Archived design comparison.** The A/B prototypes are preserved demonstrations, separate from the active application. Phase 1B.1a and the bounded Phase 1B.2a checklist are now integrated. The original dated decisions, measurements and pending-implementation language below are historical. See [the current implementation](PHASE_1B2A_INSPECTION_CHECKLIST.md) and [publication notes](PUBLICATION.md).

15 October 2026 · **Concept B approved as the residential UX direction. Implementation has not started.**

The user's selection and approved principles are recorded in [Concept B approval and proposed first slice](PHASE_1B_CONCEPT_B_APPROVAL.md). Concept A remains a preserved comparison prototype and will not become a separate permanent inspection mode. The separate Phase 1B.1a fixes for **F03 and F13 must be completed and verified before integration**; the first inspection slice is still proposed for review. The comparison and measurements below are preserved design-review evidence.

**Selected direction: Concept B, with its focused expanded item editor.** It preserves explicit inspection decisions while removing 41 navigation activations from the default five-room all-good path. This activation comparison is not a measured inspection-time saving. Concept A offers stronger concentration and a more predictable one-item sequence, but does not reduce the audited activation count. A field trial should validate the tradeoff between B's scrolling and A's repeated next actions.

Both concepts are implemented in isolated routes. No existing application file, inspection rule, production persistence schema, report register or shared shell was changed. No commit, merge, push or deployment occurred.

## Open and compare

- [Interactive side-by-side comparison](http://127.0.0.1:3112/hugmyndir)
- [Concept A — Verkefnamiðuð skoðun](http://127.0.0.1:3112/hugmyndir/a)
- [Concept B — Þéttur gátlisti](http://127.0.0.1:3112/hugmyndir/b)
- [Offline screenshot comparison and complete screenshot index](../artifacts/phase-1b-concepts/comparison.html)
- [Side-by-side 390 px image](../artifacts/phase-1b-concepts/comparison-390.png)

The local preview runs on port 3112. The existing port 3000 process was left running. Screenshots and the offline gallery remain usable after the concept server stops. To restart the local preview from this checkout:

```powershell
npm run build
npm run start -- --port 3112
```

These are throwaway synthetic-data sessions, separate from report data. Text and exact room/item position use **sessionStorage in this tab**, separately for A and B. There is no promise of recovery after closing the tab, device synchronization or offline reopening. Uploaded photos use in-memory blob URLs and disappear on reload. A warning reports their loss; review then shows missing evidence. The included labelled AI image is a static synthetic fixture loaded only by the damage scenario, not a user-media store.

## Evidence and scope

Primary evidence is the completed [Phase 1B read-only audit](../local-archive/phase-1b-audit/AUDIT_REPORT.md), especially its mobile interaction analysis and findings about answer visibility, item navigation, exact resume, review destinations, working type and repeated screen chrome. Source inspection confirmed the same issues in the accepted `5997b9348aef17a689f3034a1905487b5a3e1631` baseline.

This is a design demonstration of the requested inspection loop. It does not implement the audit's production recovery, concurrency, durable media, authentication or backend recommendations. The local synthetic pilot decision in the current request supersedes the audit's earlier proposed implementation order.

| Audited issue | Concept response |
| --- | --- |
| First answer below the mobile viewport | A's first condition target starts around 489 px and B's first row answer around 451 px at both 360 and 390 px widths. The complete first target is initially visible. |
| Repeated navigation/status/guidance delays work | A compact property/room/task hierarchy replaces inspection-body stage chrome. The existing shared shell is reused unchanged. Photo guidance appears with the photo control. |
| About 144 activations for 46 items | A replaces accordion openings with deliberate next actions, retaining 144. B exposes per-item condition answers, reaching 103. Both retain all 99 independent answers. |
| Unnecessary item navigation | A has consistent previous/next item actions. B offers direct row answers and expandable rows, with optional next-item navigation inside details. |
| Return does not identify last work | Both store the exact last item in the separate demo session; pause/reload/continue returns there, including a missing subsidiary answer. |
| Review links return only to a room | Both open the exact item and focus the missing condition/function/cleanliness group. Room-overview findings open and focus the correct photo input. |
| Small operational type | Answer labels, controls, statuses, missing-work messages and persistence disclosures are 14–16 px; primary titles are larger. Small concept badges remain secondary. |
| Earlier inspection form feels less polished than register | Shared petrol/teal tokens and Manrope, restrained borders, one work surface, compact rows and consistent touch controls. No shared-shell redesign. |

## The two approaches

| Dimension | A — task-focused | B — compact checklist |
| --- | --- | --- |
| Main interaction | One current item with all six condition choices | Several room items visible; explicit “Í lagi” on each row; row opens all other choices |
| Dependent questions | Shown after a condition is selected, when applicable | A quick condition answer opens the required function/cleanliness questions; none are filled automatically |
| Moving onward | Deliberate Next item; crosses rooms at the last item | Answer a visible row; open a row to investigate; explicit room navigation |
| Expanded details | Condition and required dimensions remain prominent | Previously chosen good condition can fold into a labelled summary; “Breyta” exposes all six choices |
| Damage | Required type, location and description; contextual temporary photos | Same requirements and photo behavior in an expanded row |
| Orientation | Room and current item remain in a sticky work header | Room and expanded item remain in the sticky header while the checklist scrolls |
| Incomplete work | Global queue plus exact review links; next remains available | Same queue/review; missing subsidiary answers leave the row visibly incomplete |
| Progress | Existing completion rules; no positive defaults | Identical rules; quick good does not complete multi-dimension items |
| Main strength | Low distraction, clear sequence, suitable for guided work | Efficient room scanning, easy corrections, fewer navigation activations |
| Main weakness | Many next actions; weaker overview of adjacent items | Expanded complex rows still require scrolling; more competing targets; quick answers need field validation |
| Desktop | Room list beside a focused editor | Room list beside the checklist and its expanded editor |

Neither concept bulk-answers items, advances just because a radio changes, assumes unseen items are good, or equates “recorded” with satisfactory. “Ekki skoðað” and “Ekki prófað” keep the existing recorded/attention distinction. N/A retains the existing applicability behavior. Photos remain a separate review concern rather than a new completion requirement.

## Evaluate the nine required states

Each concept includes a **“Prófunarsenur og ný sýnilota”** disclosure below the work area. Its labelled buttons deliberately replace only that concept's synthetic session; they announce that behavior. Normal screenshots intentionally use a prepared two-answer fixture. **“Opna rými” resets to all 46 unanswered items**, which is the real blank start and the basis for measured full-inspection counts.

| State | A | B |
| --- | --- | --- |
| 1. Open a room | Open A; Forstofa → Gólfefni is current, with no selection | Open B; Forstofa lists seven unanswered items |
| 2. Satisfactory item | “Í lagi” scene shows the wall answered; blank walls can be answered once | Click “Í lagi: Veggir” to explicitly record condition in one activation |
| 3. Function and cleanliness | “Virkni og þrif” shows good/working windows with cleanliness unanswered; choose Hreint | Same scene opens the window row, keeps condition folded and cleanliness unanswered |
| 4. Damage and photographs | “Frávik með mynd” shows an 8 cm scratch by the door, type/location/description and a labelled synthetic preview; choose files to add previews | Same content in the expanded wall row; multiple previews work |
| 5. Return to incomplete | Ólokið → target item, or Yfirferð → exact missing answer | Same, reopening the specific checklist row |
| 6. Next item | Næsta atriði; no answer is supplied by navigating | Click the next row/its explicit answer, or Næsta atriði in the open panel |
| 7. Change rooms | Room picker → Eldhús, or desktop room list; Next room at room end | Same picker/list, with Next room available from the room checklist |
| 8. Resume interruption | Gera hlé → reload → Halda áfram; exact room/item and recorded answers return | Same; the expanded row and missing subsidiary answer return |
| 9. Review | Yfirferð: Ófullskráð, Athygli, Öll atriði; each row is a precise correction target | Same review contract; return reopens the correct item rather than the first item |

Additional useful probes: change damage to good and inspect the labelled retained prior description; change back and verify the text survives. Reload after adding a photo: text returns, photo loss is disclosed, and the missing-photo warning returns. These are demo behaviors to assess, not production history/recovery infrastructure.

## Interaction costs

Counts mean control activations, not elapsed time. Text characters, scrolling, browser navigation, camera/picker gestures and opening the concept URL are excluded. A native select choice is counted as one control entry in the damage example; OS-specific gestures can differ. No decision is batched. The full 46-item costs were reproduced through actual Chromium interactions at 390 × 844, not just inferred from source.

| Common task and starting point | Existing audited UI | A | B |
| --- | --- | --- | --- |
| Plain wall good, answer already open / row visible | 1; +1 if accordion closed | 1 answer | 1 explicit row answer |
| Move from that completed item to the next decision | 1 accordion opening | 1 Next item | 0 additional navigation when using the next row's answer; 1 to open its full choices |
| Floor good and clean, current item / visible row | 2 answers; +opening if needed | 2 answers | 2 answers; condition opens cleanliness |
| Window good, works, clean, current item / visible row | 3 answers; +opening | 3 answers | 3 answers; subsidiary questions remain explicit |
| Wall damage with type/location/description | 4 control entries; +opening | 4 control entries from current item | 5 from a collapsed row, including opening it |
| Open photo picker after damage fields | 1, plus OS picker | 1, plus OS picker | 1, plus OS picker |
| Return via incomplete queue | No direct item queue | 2: queue + item | 2: queue + item |
| Correct an incomplete answer from inspection via review | Room-level review return may require another item opening | 2: review + item | 2: review + item |
| Switch to a chosen room by picker | Open + select | 2 | 2 |
| Next room | 1 | 1 at room end | 1 from checklist |
| Continue a deliberately paused inspection | No exact persisted item | 1 Continue; exact item | 1 Continue; exact row |
| All-good default five-room loop | 99 answers + 41 item openings + 4 room changes = **144** | 99 answers + 45 next actions = **144** | 99 answers + 4 room changes = **103** |

The full-loop totals end with the last answered item. Entering final review adds one activation to either concept. B removes **41 / 144 = 28.5%** of activations on this path; it does not establish a 28.5% time saving. Damage-heavy inspections, hidden rows, scrolling and text/photo entry reduce the relative importance of the all-good result. See [machine-measured traversal](../artifacts/phase-1b-concepts/interaction-costs.json) and [reproducible traversal script](../scripts/measure-concept-interactions.mjs).

## Screenshots

Required widths: **360 × 800, 390 × 844, 768 × 1000 and 1440 × 1000**. The complete gallery includes opening, normal, incomplete full page and working viewport, assessment, damage full page and working viewport, attention review, incomplete review, resume, room picker and synthetic 200% text.

“Working” screenshots show the scrolled operational area with the persistent room/item header. Full-page screenshots preserve the real sticky navigation; a viewport capture is provided alongside them to show the actual field/photo interaction without relying on a tall image.

| Width | A normal | A incomplete | A deviation | B normal | B incomplete | B deviation |
| --- | --- | --- | --- | --- | --- | --- |
| 360 px | [Normal](../artifacts/phase-1b-concepts/screenshots/360/a/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/360/a/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/360/a/05-deviation-working.png) | [Normal](../artifacts/phase-1b-concepts/screenshots/360/b/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/360/b/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/360/b/05-deviation-working.png) |
| 390 px | [Normal](../artifacts/phase-1b-concepts/screenshots/390/a/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/390/a/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/390/a/05-deviation-working.png) | [Normal](../artifacts/phase-1b-concepts/screenshots/390/b/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/390/b/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/390/b/05-deviation-working.png) |
| 768 px | [Normal](../artifacts/phase-1b-concepts/screenshots/768/a/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/768/a/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/768/a/05-deviation-working.png) | [Normal](../artifacts/phase-1b-concepts/screenshots/768/b/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/768/b/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/768/b/05-deviation-working.png) |
| 1440 px | [Normal](../artifacts/phase-1b-concepts/screenshots/1440/a/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/1440/a/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/1440/a/05-deviation-working.png) | [Normal](../artifacts/phase-1b-concepts/screenshots/1440/b/02-normal.png) | [Incomplete](../artifacts/phase-1b-concepts/screenshots/1440/b/03-incomplete-working.png) | [Deviation](../artifacts/phase-1b-concepts/screenshots/1440/b/05-deviation-working.png) |

## Validation and isolation

- Optimized Next.js production build, TypeScript and ESLint pass. No dependencies added.
- Full Chromium suite: **127 passed, 2 expected skips**. This includes the unchanged 106-test application baseline and 21 concept executions across desktop/360/390 projects. Expected skips are the existing duplicated intermediate-width cases in mobile projects.
- Concept coverage includes explicit/no-default answers, dependent dimensions, normal/damage/unknown/N/A states, next-item navigation, room changes, exact missing-answer focus, pause/reload/resume, review destinations, separate A/B sessions, untouched report storage, malformed image rejection, temporary image loss, storage failure and keyboard modal focus/escape/restoration.
- **96 concept captures** have no recorded runtime errors or horizontal page/dialog overflow. **88 standard-size states** have no axe violations with WCAG A/AA, 2.1 AA and 2.2 AA tags. Eight enlarged-text captures test layout separately. The comparison page also passes axe and overflow checks at all four widths, including its interactive phone previews. Core choices are native radios, with verified keyboard arrow changes and visible focus; controls use 44–48 px targets. Working answer labels/statuses/inputs are 14–16 px.
- Visual review covers normal, incomplete and deviation states at all four requested widths, including compact row alignment, wrapping, field readability, persistent orientation and photograph previews.
- All **97 pre-existing tracked files remain byte-identical** to the initial manifest. The fresh **1440 px register screenshot has the same SHA-256** as the approved Phase 1A.2 capture (`449b3a09a53fd5095325d14a5a4d89db1cd368ca75655f18d3e4f49cc883191d`). The new CSS is module-scoped. Existing application routes have no links into the concepts.

Evidence: [verification summary](../artifacts/phase-1b-concepts/verification-summary.json), [capture metrics/axe results](../artifacts/phase-1b-concepts/capture-evidence.json), [test JSON](../artifacts/phase-1b-concepts/test-results.json), [test log](../artifacts/phase-1b-concepts/tests.log), [HTML test report](../artifacts/phase-1b-concepts/playwright-report/index.html), [source preservation manifest](../artifacts/phase-1b-concepts/source-before.json). Capture regeneration: `node scripts/capture-inspection-concepts.mjs http://127.0.0.1:3112`; gallery regeneration: `node scripts/render-concept-gallery.mjs`.

Limits: Chromium desktop/mobile emulation and expert visual review are not a field usability study or WCAG conformance certification. Physical iOS/Android camera and virtual-keyboard behavior, Safari/Firefox, screen-reader operation, native zoom/OS text scaling and mobile tab eviction remain unverified. Synthetic 200% text enlargement checks reflow, not every browser zoom behavior. The approved application's storage/recovery issues remain outside these isolated concepts.

## Historical product-decision proposal

This table records the proposal presented before selection. The [approval record](PHASE_1B_CONCEPT_B_APPROVAL.md) now governs: B is selected, no permanent A mode is planned, and the approved quick-answer, alternative-choice, resume, evidence and status principles do not require another selection decision. Broader correction/deletion policy remains separately scoped.

| Decision | Recommended selection and consequence |
| --- | --- |
| **1. Primary workflow** | Choose **B** for the main room loop, retaining its focused expanded item editor. Choose A if field testing shows its deliberate sequence materially improves inspection quality. Do not implement both as permanent modes without a demonstrated need. |
| **2. Quick-good behavior** | Approve condition-only explicit row answers, opening any required subsidiary questions. Keep no auto-advance, no bulk positive answer and no good defaults. Decide whether to retain the folded condition summary in expanded rows. |
| **3. Resume and precise return** | Approve exact last-worked room/item as the continuation destination, even if earlier items are incomplete. Keep the incomplete queue and review links as deliberate alternatives. Define production persistence separately; same-tab sessionStorage is only the demonstration. |
| **4. Optional evidence access** | Approve optional item photos/notes for satisfactory, wear and cleaning-only items as well as deviations, with room-overview access below the inspection controls. This extends access beyond the current damage-only item photo control; it does not change mandatory evidence/completion rules. |
| **5. Progress and review language** | Retain “Skráð” as answer completeness, with unknown/untested and evidence flags separately visible. Do not introduce finalization or new required explanations/photo counts during the UX implementation. |
| **6. Corrections and retained evidence** | Decide the production behavior for changing damage to good, undoing deletion and displaying retained prior descriptions/media. The demo visibly retains prior text and temporary previews; it is not an audit history. |
| **7. Next acceptance slice** | After choosing the direction, implement only the residential inspection-body loop, exact navigation/resume and review return, preserving the register/shell/model. Agree a short physical-device field test. Media durability and infrastructure remain separately scoped work. |

**Selection recorded:** Concept B is approved as the primary residential direction. Both prototypes and their review evidence remain preserved. No integration is authorized by this document; Phase 1B.1a (F03/F13) is a prerequisite and the proposed first residential slice awaits review.

## Files and generated asset

- Routes: `src/app/hugmyndir/page.tsx`, `src/app/hugmyndir/a/page.tsx`, `src/app/hugmyndir/b/page.tsx`.
- Concept-only implementation: `src/components/inspection-concepts/concept-workbench.tsx`, `concept-model.ts`, `concept.module.css`.
- Existing reused definitions: `src/lib/model.ts`, `src/lib/locale/is.ts`, `src/components/context-dialog.tsx`; all unchanged.
- QA: `tests/inspection-concepts.spec.ts` and the three `scripts/*concept*.mjs` capture/measurement/gallery scripts. Generated evidence is in ignored `artifacts/phase-1b-concepts/`.
- Synthetic fixture: [public/concepts/synthetic-wall-damage.png](../public/concepts/synthetic-wall-damage.png), generated with the built-in ImageGen tool. The UI labels it **“Tilbúin sýnimynd · AI”**.

ImageGen prompt: “Use case: photorealistic-natural. Create one realistic, plain smartphone inspection photograph for a fictional Icelandic apartment UX demo, landscape 4:3. A matte pale warm-grey painted interior wall beside a white painted door frame and oak skirting, a clearly visible approximately 8 cm diagonal scratch with slight paint chipping low on the wall close to the door frame. Neutral overcast daylight, realistic modest apartment, documentary field photo rather than editorial aesthetic, no people, no text, no watermark, no logos, no collage. Frame enough of the white door jamb, wall and wooden floor to locate the damage. This is synthetic demonstration evidence only. Save the generated image as an output file for use in the local project.”
