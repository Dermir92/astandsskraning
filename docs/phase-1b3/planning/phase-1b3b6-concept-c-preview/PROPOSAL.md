# Phase 1B.3b.6 — Read-only Concept C report preview

**Proposal for approval · 20 October 2026 · planning and architecture only.**

Verified checkout: `main`, HEAD `88f1c6ea3a36f4166dcb77fd79d4d8b93198997e`, exactly the requested canonical baseline. The starting working tree and index were clean. `AGENTS.md` was read. This proposal is the only file created or changed by this task. No application, schema, dependency, fixture, test or approved design change is authorized here. No commit, push, PR, merge or deployment is part of this task.

## 1. Executive recommendation and bounded scope

Build, only after approval, a **read-only, responsive Concept C reading view of the current residential draft**, opened with **Forskoða skýrslu** from **Yfirferð**. Retain **Upplýsingar → Rými → Skráning → Yfirferð**, with Yfirferð remaining the active fourth step. The preview is a reading destination within that step, not a fifth step or an indication of completion.

Use a small pure presentation adapter over the actual `Report` and the current provider's temporary photo associations. It must call the existing domain helpers, retain exact source references and prose, and distinguish active facts, missing answers, explicit limitations, inactive retained answers and unsupported capabilities. Do not change the report schema or storage version. No unavoidable capture/schema gap prevents this bounded preview.

Preserve Concept C's identity masthead, ruled summary, complete linked findings, conspicuous limitations, reading guide, complete room records with separate assessments, contextual photographs and evidence index. Add the implemented rental, fire, heating and meter information in that language. Do not use the static A4 pagination experiment as a production renderer, copy its synthetic data into live records, or introduce a dashboard/KPI-card design.

The preview answers what is recorded, where it belongs and what cannot be established. It does not certify what physically happened. A reader may use the draft without having participated in capture, but this phase adds no sharing, invitation or remote access service. The record remains bound to this browser/origin; photographs remain bound to this application session.

**Recommended product decisions for approval:**

1. A separate `/skyrslur/[id]/forskodun` reading route under the existing root provider; one prominent entry on Yfirferð, available even for incomplete or zero-room residential drafts.
2. Responsive document presentation, with continuous flow and section/record anchors rather than A4 page simulation or page numbers.
3. All room deviations linked from the opening summary; separate property concerns and data-review issues, without a combined safety/quality score.
4. Full current records, including satisfactory, wear, N/A, unanswered and untested records; inactive source text remains accessible in clearly separated read-only disclosures.
5. Corrections return through Yfirferð and its existing precise editor links. The preview contains no editor, uploader, removal control or context-confirmation action.
6. Preserve the approved report typography separately from shell typography; the documented difference and screen sizing recommendation appear in §5.
7. Keep absent meter capture and unselected optional utilities free of new tasks; disclose their factual coverage limits where relevant. Do not retroactively alter approved module readiness rules.

**Approval of this document must precede implementation.** The implementation sequence below is proposed work, not work performed by this planning task.

## 2. Existing-code and approved-design findings

### 2.1 Sources and precedence

The current user instruction sets this phase's boundary. The approved Concept C composition and the approved audit's product boundaries remain authoritative. Later approved module contracts and the merged implementation supersede their earlier descriptions of missing capture. Code establishes what is actually representable; genuine inconsistencies are documented below rather than resolved by inventing data.

| Evidence reviewed | Finding relevant to this proposal |
| --- | --- |
| [Concept C package](../../design/phase-1b3a-c-refinement/README.md), [information contract](../../design/phase-1b3a-c-refinement/INFORMATION_CONTRACT.md), [historical preview scope](../../design/phase-1b3a-c-refinement/PHASE_1B3B_SCOPE.md) | Findings first, distinct assessments, honest unknowns, contextual evidence, source references and no implied execution. The historic three-field capture gap has since been implemented. |
| [Final PDF corrections](../../design/phase-1b3a-c-refinement/PDF_REVIEW_CORRECTIONS.md), [earlier review](../../design/phase-1b3a-c-refinement/REVIEW.md), `report.js`, `report.css`, `fixtures.js`, `index.html` and `a4.html` in that package | All nine large-fixture deviations are linked; text is not shortened to fit; images remain uncropped; reader media numbering follows first appearance while source IDs remain unchanged. The final 25/29-page results supersede 26/31-page diagnostics. |
| [Large sample PDF](../../design/phase-1b3a-c-refinement/downloads/astandsskodun-syniskyrsla-a4.pdf), [long-text sample PDF](../../design/phase-1b3a-c-refinement/downloads/astandsskodun-langar-lysingar-a4.pdf), their fixture/renderer sources and [curated evidence](../../EVIDENCE.md) | Design reference: small examples have 3 rooms/15 items/1 or 3 photos; large has 10/84/23; long case retains 23 references with 22 available images. Cover, kitchen and mobile cover/room evidence were visually inspected. These are synthetic sample reports, not current application report data or fresh PDF verification. |
| [Approved audit boundaries](../../README.md), [HMS/legal analysis](../../research/phase-1b3-hms-audit-2026-10-17/LEGAL_AND_CONCEPT_C.md), [gap matrix](../../research/phase-1b3-hms-audit-2026-10-17/GAP_MATRIX.md), [field requirements](../../research/phase-1b3-hms-audit-2026-10-17/FIELD_REQUIREMENTS.md), [open confirmations](../../research/phase-1b3-hms-audit-2026-10-17/DECISIONS_AND_QUESTIONS.md), [recommendation](../../research/phase-1b3-hms-audit-2026-10-17/PHASE_1B3B_RECOMMENDATION.md) | Preserve context gating, distinct event dates, modest observation claims and execution exclusions. This proposal applies the dated approved analysis; it performs no new legal audit and makes no new legal-compliance determination. |
| [Actual model](../../../../src/lib/model.ts), [store/provider](../../../../src/components/demo-provider.tsx), capture screens and [review screen](../../../../src/components/screens/review-screen.tsx) | Common metadata, rental, fire, room heating and meters are present. The current review is a correction workspace and does not show every item as a complete reader-facing record. |
| Core capture commit `02e2035`, `CoreCaptureSummary`, `details-screen.tsx`, `use-details-correction.ts`, `inspection-core-{capture,compatibility}.spec.ts` | Core implementation includes optional context/date/name/scope fields, contextual requirements and legacy-safe reading. There is no dedicated merged Phase 1B.3b.1 implementation-review document in this checkout; commit/code/tests are the available primary implementation evidence. |
| [Rental implementation review](../../../PHASE_1B3B2_RENTAL_INFORMATION_REVIEW.md) and [approved contract](../PHASE_1B3B2_RENTAL_INFORMATION_APPROVED.md) | Rental minimums apply only to explicit rental context. Representation is one self-declared claim; recorder-source names resolve live. Invalid supplied lease dates receive attention even if a reference exists. |
| [Fire implementation review](../../../PHASE_1B3B3_FIRE_OBSERVATIONS_REVIEW.md) and [approved contract package](../phase-1b3b3-fire-observations/README.md) | Required gaps, contextual omissions, limitations and concerns are distinct. Active concerns outrank incomplete/untested rows. Fire capture has no photo target. |
| [Heating implementation review](../../../PHASE_1B3B4_HEATING_REVIEW.md) and [approved contract](../phase-1b3b4-heating/PROPOSAL.md) | Heating is identified by `kind: "space_heating"`, not its name/ID. No response/mixed response is factual and does not automatically become a defect. Legacy rooms are not backfilled. |
| [Meter implementation review](../../../PHASE_1B3B5_METER_READINGS_REVIEW.md), [R1/R2 corrections](../../../PHASE_1B3B5_R1_R2_CORRECTIONS_REVIEW.md), [contract](../phase-1b3b5-meter-readings/PROPOSAL.md) | Participation and purpose are explicit. `factsPurpose`/`factsApplicability` guard reuse. R1 prevents no-op writes; R2 restores clear-answer focus. The supplemental clean 772-pass/20-skip run is historical evidence, not a test result of this planning task. |
| `inspection-navigation.ts`, `use-inspection-navigation.ts`, fire/meter navigation, evidence/gallery/dialog components, `globals.css`, `layout.tsx`, `ui.tsx` | Room position has independent localStorage keys. Capture navigation can remember a position on mounting. Root layout holds the session media provider. Existing read-only galleries can be used without removal callbacks, but need report-scale references and unavailable-image handling. |
| Installed Next 16.4.0 guides: `node_modules/next/dist/docs/01-app/01-getting-started/{03-layouts-and-pages,04-linking-and-navigating,05-server-and-client-components}.md` | A route wrapper plus a client reading screen fits the installed routing/provider model. Browser-local report/media access belongs on the client. Use the existing Suspense convention where URL hooks require it; recheck relevant installed API guides before implementation. |

### 2.2 Current architecture and preservation facts

- `DemoStore.hydrate()` validates the complete v1 envelope and performs no write. Unknown envelope keys survive later genuine writes. `astandsskraning-demo-v1` remains the only report storage key; inspection positions use `astandsskraning-navigation-v1:` separately.
- `updateReport` updates `updatedAt` even if its caller only intended a presentation change. None of its methods belong in the preview adapter or renderer. `InspectionPositions.remember` is also excluded from preview behavior.
- `state.photos` is an in-memory map, not part of report JSON. Each `PreviewPhoto` has only `id`, `url`, `name`. Capture accepts JPG/PNG/WebP, up to 8 per target and 10 MB per file; 40 images can therefore be substantial on a phone.
- Exact current target keys are `${report.id}:${room.id}:overview` and `${report.id}:${room.id}:${item.id}`. There is no property, fire-row or meter photo attachment target. Heating uses its real item target.
- The root `DemoProvider` must stay mounted during client transitions. A hard reload or a new tab loses the originating session's photos. The preview does not create, copy, revoke or renew blob URLs.
- `reportStats`/`roomStats` concern checklist items, including tagged heating. They do not include rental fields, fire rows or meters. `recorded` means the conditional answer contract is satisfied; it does not mean physically examined or satisfactory.
- `reportStatus` is a mutable workflow indicator. `sampleReviewed` is synthetic. Neither can establish approval, issue, locking, identity or legal completion.
- `isReportList` protects structural shapes but allows incomplete/invalid semantic strings, unknown extensions and some ambiguous nested identifiers. The reader must not silently normalize these into good data.

### 2.3 Superseded statements and genuine conflicts

| Earlier statement or edge | Current evidence and proposed resolution |
| --- | --- |
| Core date/name/scope, rental/fire/heating/meters are not captured | Superseded by merged Phases 1B.3b.1–5. Map real fields; keep them unknown only when absent/empty. Do not add the old proposed fields again. |
| Some historical READMEs/reviews say the phase has not started or work is uncommitted | Historical publication/authoring state. Current canonical Git history is the baseline; do not rewrite those documents. |
| Audit recommended deliberate conditional rental meter handling; older wording can sound like automatic required capture | Later approved meter behavior explicitly leaves an absent module and unselected optional utilities without tasks. Preserve that behavior. A rental-initial preview may disclose unrecorded meter coverage without manufacturing two missing-answer tasks or claiming handover completion. |
| A4 native-print checks appear in historical preview acceptance | Production export is explicitly excluded now. Preserve the composition/readability lessons. This phase would verify the responsive reader, not create pagination, print controls, frozen page references or a PDF service. |
| Concept C's report uses Arial/Segoe UI; the current shell uses Manrope | A real design difference, not permission for an implicit typography replacement. §5 recommends retaining each in its respective surface, with readable relative screen sizing. |
| Generic helpers consider stored `broken`/`dirty` values even when an item's corresponding checklist flag is false | Flags govern requested dimensions and completion, but `requiresDamage` and `roomStats.deviations` do not gate all supplied values by those flags. Do not quietly reimplement a flag-filtered finding definition. For such unusual valid records, show the supplied answer with “Svar varðveitt utan matsþátta gátlista”, keep helper parity and identify the inconsistency. Approval of this proposal accepts this qualified presentation, not a domain-rule fix. A different activity rule needs a separately reviewed helper change and regression scope. |
| `hasRetainedDefect` has no item argument and therefore is not heating-aware | Use it for ordinary items only. Heating active/retained defect prose is governed by `heatingState(o).defect` and heating visibility/operation rules. |
| Review's current photo count uses report-key prefix matching | Preview must enumerate actual targets and compare exact keys, not split/prefix-guess IDs. This avoids stale/orphan/colliding associations entering the wrong room or total. Preserve existing review behavior in this slice; document any discovered mismatch rather than silently changing it. |
| Historical prototype says broadly that silence is not consent | Retain only a narrow app-state statement. The preview must not assure that silence has no legal consequences. Use the audit boundaries and the specific factual copy in §6. |

## 3. Exact report-data mapping contract

### 3.1 Adapter boundary and proposed presentation types

Proposed module: `src/lib/report-preview.ts`, with no React, DOM, localStorage, network, random ID, mutator or browser-history dependency. Its inputs are borrowed from one current store snapshot; outputs contain no mutation functions and are recursively readonly. Freeze source inputs in future tests to enforce nonmutation, including nested arrays/maps; do not normalize or clone them back into the store.

The following is a **documentation sketch of presentation types**, not a new persisted model or production implementation. `Report`, `PreviewPhoto`, `DetailField`, `RentalFieldId`, `FireGroupId`, `FireField`, `MeterUtility` and `MeterField` refer to existing types; `PreviewPhoto` can be imported as a type only.

```ts
type DeepReadonly<T> = T extends readonly (infer V)[]
  ? readonly DeepReadonly<V>[]
  : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

type SourceRef =
  | { kind: "report"; reportId: string }
  | { kind: "detail"; reportId: string; field: DetailField | RentalFieldId }
  | { kind: "item"; reportId: string; roomId: string; itemId: string }
  | { kind: "room"; reportId: string; roomId: string }
  | { kind: "fire"; reportId: string; group: FireGroupId;
      rowId?: string; field: FireField }
  | { kind: "meter"; reportId: string; utility?: MeterUtility;
      field: MeterField | "purpose" };

type Cell<T> =
  | { state: "supplied"; raw: T; source: SourceRef;
      validation: "unchecked" | "valid" | "needs_review" }
  | { state: "unanswered"; source: SourceRef }
  | { state: "not_requested"; source: SourceRef }
  | { state: "retained"; raw: T; source: SourceRef; reason: string };
// Explicit unknown/unexamined/N/A answers remain typed supplied enum values.
// They never collapse into unanswered or not_requested.

type PreviewIssue = {
  id: string; source: SourceRef;
  categories: readonly ("missing" | "limitation" | "concern" | "data_review")[];
  label: string;
  task: boolean;                 // Existing domain relevance, not legal duty.
  recordAnchor: string;          // In-preview source record.
  reviewHref?: string;           // Existing Yfirferð destination, never a writer.
};
type PreviewPhotoRecord = {
  key: string; readerRef: string; // Association-scoped session identity / M001.
  source: Extract<SourceRef, { kind: "item" | "room" }>;
  sourcePhotoId: string; name: string; url: string;
  anchor: string; caption: string; alt: string;
  provenance: "temporary_session_unverified";
};
type PreviewItem = {
  source: Extract<SourceRef, { kind: "item" }>;
  readerRef: string; name: string;
  progress: ReturnType<typeof import("./inspection-navigation").itemProgress>;
  complete: boolean; needsAttention: boolean; deviation: boolean;
  issueIds: readonly string[]; photoKeys: readonly string[];
  record: {
    kind: "ordinary"; condition: Cell<NonNullable<import("./model").Observation["condition"]>>;
    functionality: Cell<NonNullable<import("./model").Observation["functionality"]>>;
    cleanliness: Cell<NonNullable<import("./model").Observation["cleanliness"]>>;
    damageType: Cell<string>; location: Cell<string>;
    description: Cell<string>; note: Cell<string>;
  } | {
    kind: "heating";
    fields: Readonly<Partial<Record<import("./heating").HeatingField,
      Cell<string | readonly string[]>>>>;
    damageType: Cell<string>; location: Cell<string>;
    description: Cell<string>; note: Cell<string>;
  };
};
type PreviewSection = {
  key: "property" | "rental" | "fire" | "meters";
  state: "current" | "optional_unrecorded" | "retained";
  facts: readonly { label: string; value: Cell<string | readonly string[]> }[];
  issueIds: readonly string[];
};
type ReportPreview = DeepReadonly<{
  reportId: string; status: "draft"; title: string;
  sourceUpdatedAt: string;       // Only “Síðast breytt”, never inspection date.
  stats: ReturnType<typeof import("./model").reportStats>;
  findingItemRefs: SourceRef[]; propertyConcernIds: string[];
  issues: PreviewIssue[];
  sections: PreviewSection[];
  rooms: { source: Extract<SourceRef, { kind: "room" }>; readerRef: string;
    name: string; type: import("./model").RoomType; items: PreviewItem[] }[];
  photos: PreviewPhotoRecord[];
  capabilityLimits: { key: string; label: string }[];
}>;
declare function buildReportPreview(input: {
  readonly report: Readonly<Report>; // Actual helper-compatible Report; borrowed.
  readonly photos: Readonly<Record<string, readonly Readonly<PreviewPhoto>[]>>;
  readonly today: string;           // Explicit UTC calendar date for warnings only.
}): ReportPreview;
```

`Readonly<Report>` is shallow so existing helper signatures remain usable; deep-freeze/nonmutation assertions and the absence of writer capabilities enforce nested input preservation. The returned value is deeply readonly. Implement typed row/group structures inside `PreviewSection` as necessary for fire/meter discriminants; never flatten away the source group, row ID, parent state or meter context. The matrices below are normative for that refinement.

Additional field identity within an item uses the item source plus the actual field name. Heating fields use the existing `HeatingField` union; raw equipment arrays retain their enum values. Source paths are structured values, never concatenated strings later parsed by splitting `:`. Render identifiers encode JSON tuples. Future duplicate-ID fallback uses view ordinals solely to render/describe ambiguity (§8); it does not manufacture a valid correction destination.

No `today`, current clock, `updatedAt`, URL, filename or role fills in an event, identity, photo date or reading. All supported source text is retained verbatim, including newlines, accents, leading zeros and units. Trimming is only a temporary emptiness/validation check. No HTML interpretation of user prose; React text rendering supplies escaping.

**Data classes used below:** **P** = captured factual input in the report JSON shape (possibly pending only in memory after a write failure), **D** = reliable derivation, **U** = missing/unknown, **R** = retained outside the active answer/context, **I** = capability requiring new capture/infrastructure. “P” means supplied, not true, externally verified or safely backed up.

### 3.2 A — Property identification and inspection context

| Exact input | Class | Presentation and relevance |
| --- | --- | --- |
| `Report.id` | P/D | Show full local draft reference, wrapping if needed. Do not substitute fixture labels or invent an issued version. R/A/M reader locators are separate (§4.3). |
| `assetType` | P | This phase supports `apartment` only. Other assets and `sampleReviewed` summaries keep their existing destinations and do not gain an apparently completed residential report. |
| `details.address`, `postalCode`, `municipality`, `unit` | P/U | Show exact supplied values under explicit labels. Blank/whitespace is Óskráð/Ekki tilgreint. Use `detailIssues` for required/format issues. Optional unit absence is visible but not a new task. |
| `title`, `subtitle`; `reportTitle(report)` | P/D | A navigation/title fallback, never a replacement factual address. If address is absent, primary property field still says Heimilisfang óskráð. |
| `details.inspectionContext` | P/U | Display standalone/rental using `is.inspectionContexts`. Missing/empty means context unknown; never infer rental from role/type, or a waiver of rental obligations from standalone selection. |
| `details.inspectionType` | P/U | Preserve initial/final/independent distinctly. `independent` means Sjálfstæð skráning, not an agreed impartial examiner. A final record has no associated baseline/comparison capability. |
| `updatedAt` | P/D | Optional secondary “Síðast breytt” only. Never visit, reading, issue, review or completion date. |
| `sampleReviewed`, `reportStatus` | P/D, limited | Used for eligibility/workflow context only. Every eligible preview is DRÖG. No green completed/certified/approved state is derived from these values. |

Property number is not in the common property model; it is `rentalInformation.propertyNumber` and follows rental relevance below. Address is not registry verification. Rooms/checklist membership describe the record, not the legal premises boundary or performed inspection scope.

### 3.3 B — Actual date, recorder and stated scope

| Exact input/helper | Class | Presentation and safeguards |
| --- | --- | --- |
| `inspectionDate`; `isCalendarDate`, `inspectionDateWarning` | P/D/U | “Dagsetning skoðunar”. Calendar-valid values can use deterministic `formatDate`; invalid raw text remains visible with the existing warning. A future date is qualified as supplied future information, never a performed inspection. No timezone conversion or backfill. |
| `recorderName`, `role` | P/U | Display the supplied name and existing role separately, with the existing self-declared-attribution wording. Missing name stays unknown despite a selected role. No inferred landlord/tenant identity, employer, qualification or neutral appointment. |
| `scopeDescription` | P/U | Full “Uppgefið umfang skoðunar”. Missing scope is a `detailIssues` gap. Do not insert the static fixture's visual-inspection/testing scope, or synthesize a room scope from checklist names. |
| `scopeLimitations` | P/U | Full declared limitations. Blank says “Takmarkanir óskráðar”, not “Engar takmarkanir”. It is optional and does not add a required-answer task. |
| `notes` | P/U | Full unattributed general draft note; never recast as a tenant objection, notice, expert conclusion or party submission. |
| Actual time/range, attendance, appointment, verified identity | U/I | No structured records exist. Use one capability/verification disclosure, not invented names/times or universal missing-field tasks. |

`detailIssues(details, today)` supplies the existing common and contextual issue set. Do not create a competing required-metadata checklist. Dates from inspection, lease, handover and meter reading remain separately labelled even if equal.

### 3.4 C — Residential lease information

Current source: `details.rentalInformation`, `rentalInformationIssues`, `hasLeaseAssociation`, `representationClaimed`, `representativeName`, `hasRentalInformation`, `hasRetainedRentalInformation`, `hasRentalExtensions`, `rentalRequirements`, and the merged rental summary/capture.

| Exact input | Class | Presentation/activation |
| --- | --- | --- |
| `landlordNames`, `tenantNames` | P/U/R | Current rental context only when `inspectionContext === "residential_rental"`. Preserve full plural/free-text names. These are stated parties, not verified identities or attendance. Missing required party information uses existing rental issues. |
| `premisesDescription` | P/U/R | Rented extent, distinct from actual inspection scope/room count. Current rental minimum; show complete text. |
| `leaseDate`, `leaseReference` | P/D/U/R | Either a calendar-valid date or nonblank reference satisfies existing association minimum. A reference alone leaves date Óskráð. An invalid supplied date remains raw and receives its separate issue even with a valid reference. No automatic lease lookup or incorporation claim. |
| `propertyNumber`, `includedAreasDescription`, `excludedAreasDescription` | P/U/R | Optional declared property/extent context, not registry data. No new task for omission. Outside rental, preserve under retained rental information rather than importing into the primary property identity. |
| `representation.nameSource`, `.name` | P/D/U/R | `recorder` resolves live through `representativeName(details)`; do not copy it. `other` uses the exact supplied name. Unselected alternative name stays retained and cannot appear as the current representative. |
| `representation.representedParty`, `.basisDescription` | P/U/R | Explicitly stated party/basis; no proof of authority. Apply `representationClaimed`/`rentalInformationIssues`, including role/source inconsistency. Missing optional basis is not a new task. |
| `deliveryDate`, `furnished` | P/U | Reuse existing contextual rules. Delivery is an entered handover-context date, never proof of an actual handover or the inspection date. The furnished flag is not an inventory or proof that fitted equipment is absent. |
| Rental object when context is standalone/unknown | R | Read-only “Varðveittar leiguupplýsingar utan núverandi samhengis”. No rental tasks, current party/lease claims or deletion. Existing delivery/furniture values may also be shown as optional supplied context, clearly without asserting a rental handover. |
| Verified lease link, party approval, representation verification, full inventory/keys | I | Unsupported. Do not render the prototype's synthetic keys, signatures or participation tables as live facts. |

One representation for one party is the current model. Do not parse name prose into extra participants or infer dual representation. Unknown extension data stays untouched; an extension notice is informational rather than a dump of unrecognized fields.

### 3.5 D — Fire observations

Source: `details.fireSafety.{smokeDetectors,extinguishers,escapeRoutes}`. Reuse `FIRE_GROUPS`, `fireExamined`, `meaningfulFireRow`, `fireGroupIssues`, `primaryFireIssue`, `fireGroupStatus`, `fireState`, `validObservedCount` and extension detection. Preserve the existing deterministic concern order across every row, including a later failed detector overriding an earlier positive row.

Rental context exposes all three groups and relevant missing answers. In standalone/unknown context with no fire data, show one “Brunavarnir óskráðar” coverage statement without rental tasks or an assertion that fire inspection was excluded. With supplied data, show the active records; active concerns remain visible in every context. Optional missing answers can be identified as unrecorded without becoming rental-required tasks.

| Exact field/parent | Current facts, gaps and retained boundaries |
| --- | --- |
| Each group's `examination` | Blank = unanswered. `examined`/`partly_examined` enables current subordinate observation facts. `not_examined`/`unknown` is a recorded limitation, not N/A or a positive inspection. Completion of the answer never establishes actual performance. |
| `examinedDescription`, `unexaminedDescription`, group `note` | Show full declared area when examined; otherwise examined-area prose is retained. Preserve explicit unexamined-area prose and neutral scope notes as such, without inferring a reason/method. Partial examination requires its unexamined description per helper. Missing equipment examined-area description is contextual only; missing escape-route examined description follows its existing required rule. |
| Equipment `presence` | Current only under an examined/partly examined group. `none_observed` is an active concern scoped to the examined area; it is not “no equipment exists anywhere” or N/A. `unknown` is a limitation; blank is missing. Do not turn absence into a fabricated numeric zero. |
| Equipment `entries[]` and stable `entry.id` | Render meaningful rows in stored order only when group is examined and presence is `observed`. Do not create a placeholder row or infer a room ID from free-text location. Parent-inactive rows remain separately readable retained data. |
| `location`, `observedCount` | Exact supplied text. Missing values are optional contextual limitations, no task/action-count increment. Blank count is unknown, never 0. Invalid supplied positive-count text receives the helper's concern and stays raw; no rounding/summing/area-sufficiency judgment. |
| `visibleCondition`, `visibleIssueDescription`, row `note` | Explicit visible issue is current only in an active row; its description is required by helper. Description under a different condition is retained, not a finding. Unknown/not examined visible condition is a limitation; missing condition is unanswered. Neutral note stays with its row. |
| Detector `basicTest.performance`, `.testedScopeDescription`, `.result` | Current result/scope only if row is active and performance is `performed`. Missing claimed-test scope/result is a gap. `not_performed`/`unknown` is a test limitation; retained old positive/negative result is not a current test. `no_response_observed` is a concern; positive response is only that observed test response, never certified coverage/function of all detectors. |
| Extinguisher `serviceLabel.status`, `.observedText` | Literal text current only for an active row with `readable` status. Do not parse a date into service validity. No/unreadable label follows helper concern AND limitation semantics; render once with both category tags. Unknown/not examined is a limitation; missing status or readable text is a gap. Old label text is retained when not readable. |
| Escape `obstruction`, `affectedLocation`, `obstructionDescription` | Current obstruction only when examined/partly examined. An observed obstruction is a concern requiring location/description. Old obstruction details under a different answer are retained. `none_observed` means none on the stated route, not a whole-building egress pass. |

`fireState.actionCount = concerns.length + (rental ? missing.length : 0)` is an existing action measure, not a room-item/defect total or safety grade. Contextual omissions/limitations are not added to it. Issues intentionally in two categories have one source identity (§4.2). No fire photograph association exists; do not relabel a room photo as detector/label proof. Fire evidence association would require separately approved capture support.

### 3.6 E — Heating within the relevant room

Select only actual `room.items` with `kind === "space_heating"`. Use the real item ID, `room.observations[item.id]`, `heatingAnswered`, `heatingState` and heating extension detection. Never infer heating from an `oven`/“Ofn” cooking item, free text, or an ID pattern.

| Exact field | Presentation and activity rule |
| --- | --- |
| `observation.heating.visibility` | Explicitly show visible parts / reported concealed / none visible / not examined / unknown. Missing visibility is unanswered. “Enginn hitabúnaður sást” is not a claim that the property has no heating system. |
| `equipment[]`, `scope`, `informationSource` | Current when visibility is `visible_parts` or `reported_concealed`; otherwise retained. Visible parts need equipment OR scope. Entirely reported concealed equipment needs scope AND information source. Do not infer a source from prose/equipment. |
| Mixed visibility | `visible_parts` with a nonblank active information source carries the existing “Uppgefinn búnaður sem sást ekki” limitation. It is complete if other minima are satisfied, with no added defect or task. |
| `visibleCondition` | Current only for `visible_parts`, applying solely to the specified visible parts. Unknown/uninspected is a limitation. Other visibility states retain old grades without current findings. |
| `operation`, `action`, `response`, `responseDescription` | Operation is independent of visibility. Action/response/description are current only for `tried`; all three are required then. `not_tried`/`unknown` is a limitation; old attempt text/results remain retained. `none_observed`/`mixed` is factual prominent response text, never an automatic defect, broken answer, repair task or missing-photo task. |
| Shared `damageType`, `location`, `description` | Active only if `heatingState(o).defect` (explicit defect/damaged visible parts). Then use existing required subsidiary answers and photo-attention parity. Otherwise all such prose is retained. Ignore dormant generic observation condition/function/cleanliness as current heating grades. |
| Shared `note`, item photos | Neutral note remains complete and associated; real item-associated photos remain available independently of current defect. A changed answer does not reclassify a photo as historical proof. |
| No tagged item in a legacy room | “Sérstök hitaskráning er ekki í gátlista þessa rýmis.” Coverage limitation only; no new unanswered item, task, count, heating default or inferred successful test. |

All heating counts remain part of existing room-item totals. A room item can be complete and limited, defective and incomplete, or complete with a factual no-response observation. Show these distinctions without merging them into a single failure status.

### 3.7 F — Electricity/hot-water readings and handover context

Source: `details.meterReadings`, containing `mode`, `factsPurpose`, and independent `electricity`/`hotWater` entries. Call `activeMeterPurpose`, `meterParticipates`, `readingCapable`, `hasReadingFacts`, `meterContextCurrent`, `meterState(details, today)`, `meterDateWarning`, `plausibleMeterValue` and extension detection. Match `meterUtilityStatus` presentation; if passing `today` through status formatting becomes necessary, reuse `meterState`'s result or make a separately tested optional-argument presentation change rather than duplicate its date/readiness rules.

| Exact field/state | Preview contract |
| --- | --- |
| No meter object | “Mælastöður hafa ekki verið skráðar í þessum drögum.” Zero meter tasks. For rental-initial context this remains a visible coverage limit, not a statement that no separate meter exists or legal handover is complete. |
| `mode: optional` and utility `optionalCapture` | Only utilities explicitly selected with `true` participate. Unselected says “Ekki valið til skráningar”, with no missing reading/applicability task. Retain supplied inactive data separately. |
| `rental_initial`, `rental_return`, `inactive`, incompatible context/type | Purpose is current only as determined by `activeMeterPurpose`. Paired rental modes require the existing applicability answers for both utilities after deliberate activation. Inactive/unavailable purpose does not become current merely because values exist. Initial and return labels remain distinct; no actual handover is inferred. |
| `applicability` missing | Participating utility has the existing missing applicability issue. It is not “Enginn mælir”. |
| `separate` | Current separate-meter arrangement. The existing reading-status answer is required; a recorded reading has the conditional fields below. |
| `shared` | Explicit qualifier “Sameiginlegur mælir — álestur nær einnig til annarra”. Reading is optional; no reading-status gap if none was supplied. A supplied recorded reading follows normal conditional fields and must not be presented as this unit's individual consumption. |
| `no_meter` | Explicit arrangement answer, not a zero reading. No reading requirement. Old reading facts remain retained; never display them as current. |
| `unknown`, `not_examined` | Explicit knowledge/physical limitations, not no-meter/N/A. No required-reading task is invented. Old readings remain retained. |
| `factsPurpose`, entry `factsApplicability` | Guard tags, not event history or provenance. For current readings, utility must participate, be reading-capable, and pass `meterContextCurrent`; purpose/arrangement confirmation issues from `meterState` take precedence. Unbound/mismatched facts stay retained even if their value looks plausible. No implicit confirmation on opening/reading the report. |
| `readingStatus` | Current only in matching active context. `recorded` is the user's reading claim; other statuses are specific limitations: not read, unreadable, inaccessible, unknown. Missing separate-meter status is a gap. An old recorded value under a non-recorded status is retained. |
| `readingValue`, `unit`, `readingDate` | Current only with an active, context-matching `recorded` status. Preserve all raw strings. Missing values, implausible values and invalid/future dates have existing helper issues. An incomplete claim can be shown labelled “Álestur skráður · upplýsingar ófullgerðar”; never display an unqualified complete reading. Do not infer/convert units, parse consumption, strip zeros, normalize decimals or borrow another date/value. |
| `meterIdentifier`, `note` | Optional exact context text; no tasks for absence. Follow current/retained bundle treatment of `MeterFacts`/summary, without asserting identity verification. Do not move a retained identifier/note into a current reading simply to populate the layout. |
| Purpose mismatch affecting the set | Present one set-level confirmation issue, with links to affected utility records. Do not count it once for each utility or bypass the existing guard. Returning to an already matching original context follows the helper outcome; preview adds no new confirmation requirement. |

The preview has **no** calls to `patchMeter`, `selectMeterPurpose`, `confirmMeterPurpose`, `confirmMeterArrangement`, `updateMeters` or their snapshots/confirmation UI. Confirmation remains in Skráning via Yfirferð. The current R3 informational caveat remains: a manually constructed meter field correction URL may prioritize a context guard before identifier/note input. Do not bypass that guard or refactor it within preview work.

There is one set per report, no meter history or initial/final comparison, no meter-photo target, no proof of delivery/receipt and no transfer into a lease/provider system.

### 3.8 G — Rooms, checklist items and assessments

| Exact source/helper | Contract |
| --- | --- |
| `rooms[]`, `room.id/name/type`, `items[]`, item `id/name/kind` | Preserve source order and full names. Blank names get an explicit display fallback with a missing-name issue; the source stays blank. No synthetic room/item added. Preserve zero-room and zero-item states separately. |
| `room.observations[item.id]` | Missing object means unanswered, not `EMPTY_OBSERVATION` written into storage. Iterate checklist membership, not all observation keys as if each were a live item. Orphan observations are not findings for invented items (§8). |
| Ordinary `condition` | Show exact localized supplied answer: good, wear, defect, damaged, uninspected, N/A; blank stays Óskráð. A wear answer is a stated assessment, not an adjudication of normal wear or responsibility. |
| `functionality`/`cleanliness` and item flags | Requested-and-blank = Óskráð. A dimension outside the checklist = “Ekki metin í liðnum”, not a supplied N/A answer. Explicit unknown/uninspected/untested values remain distinct. Supplied out-of-checklist values follow the qualified helper-parity treatment in §2.3. |
| `condition === "na"` | Existing completion and active-defect override applies. Show explicit “Á ekki við”. Subsidiary grades and defect prose remain retained, never a current positive/negative assessment. Neutral note and associated photographs remain accessible. |
| `requiresDamage(o, item)` | Single current defect predicate including tagged heating. Generic defect/damaged/broken calls for the existing full `damageType/location/description`; missing components stay visible. A missing condition can coexist with an active broken-function finding; never fill in a condition to reconcile them. |
| `cleanliness === "dirty"` on a non-N/A ordinary item | A cleaning deviation, included once in existing deviation count, even if the same item also has damage/broken function. No invented damage type/location, mandatory damage narrative or damage-photo task for cleaning-only records. |
| `note` | Full neutral note, separate from active defect description and inactive retained text; not an attributed participant statement. |
| `observationComplete`, `needsAttention`, `itemProgress`, `missingAnswers`, `roomStats`, `reportStats` | Call the real helpers. Distinguish answer completeness, unanswered/partial progress, review attention and deviation. `needsAttention` is not a generic defect test: an otherwise complete ordinary defect may not be in that set; an explicit heating defect is. |

### 3.9 H — Available temporary photographic evidence

1. Enumerate exact live room-overview and item targets from the current report. Join with `state.photos[exactKey]`; do not use report-prefix matching, filename matching, item-name matching or colon splitting. Include good, wear, N/A, incomplete and heating items' photos, not just defect photos.
2. Source association identity is the full report/room/overview-or-item tuple plus local `PreviewPhoto.id`. A reader reference such as M001 is a temporary presentation locator. Room/item IDs repeat across rooms and require compound identity.
3. Number references in first reading appearance: room overview, then source-order items and each target's photo-array order. Render one canonical figure per association; the final index links to it and does not embed a second copy. Each figure carries source room/item reference, filename, neutral context caption and session disclosure.
4. Use context/filename-based fallback alt text such as “Tímabundin mynd við R03 / A023, Eldhús · Borðplata, [nafn]”. It describes association, not claimed image content. No automatic defect diagnosis, EXIF date, contributor or generated semantic caption exists.
5. Blob display readiness is **view state**, outside the pure adapter: `pending → available | unavailable` from actual image load/error. Do not preload/decode every image in the adapter. Keep the same reference, source and caption on error, with “Mynd ekki tiltæk í þessari setu; myndinnihald ekki staðfest”. Do not revoke a failed URL, delete its entry or claim why it failed.
6. Distinguish (a) no current attachment, (b) a present association whose image fails, and (c) reload leaving no associations at all. After reload the application cannot know which past images existed; it must not fabricate M018 or a lost-photo history. The long design fixture can model known-unavailable media only when a corresponding session association is actually present in a future synthetic test.
7. Counts separately identify linked session associations, successfully loaded images, unavailable images and still-unattempted images. Never label all references “available” before loading. Lazy images are pending, not missing. Opening a full-image view attempts that image immediately.
8. An empty exact target creates the existing room-overview/active-damage-photo coverage attention where applicable. A present but unavailable image gets a separate availability limitation; it must not silently satisfy “available photographic evidence”. Do not add its error to the old missing-attachment task count, or count an N/A/cleaning-only/heating-no-response record as requiring a damage photo.
9. Multiple attachments of the same file are associations, not independently verified distinct photographs. Do not deduplicate by filename/URL or merge unrelated targets. Unexpected duplicate IDs/key collisions require qualified counts/association handling (§8); never guess their identity.

One conspicuous report notice and one short evidence-section notice explain: **“Myndir eru aðeins tiltækar í þessari setu. Þær hverfa við endurhleðslu eða lokun og eru ekki vistaðar varanlega.”** Figure captions may use a short “Tímabundin mynd” label; do not repeat the full warning under every item. Text saved in localStorage and images available in memory have different lifetimes.

Durable originals, capture/contributor identity, trusted provenance, persistent captions, remote delivery and verified evidence are **I**, not silently derivable fields. Existing AI-generated design assets stay labelled synthetic in design/test contexts; they are not a fallback gallery for an empty real draft.

### 3.10 I — Missing information and factual limitations

The adapter builds one issue registry with source/category keys. Required gaps come from `detailIssues`, `rentalInformationIssues`, `missingAnswers`, `fireState`, `heatingState` and `meterState`. Room structure and session-evidence gaps use the exact existing review conditions, with the explicit image-availability extension above. Optional omitted metadata is visible context, not automatically a correction task.

Capability limits—unverified attribution, no participant execution, no durable photographs and no linked baseline—are a separate set. They do not inflate missing-answer totals or block opening an incomplete draft. Explicit uninspected/untested/unknown answers are recorded limitations even when their answer-completeness check passes.

## 4. Information hierarchy, counts and source references

### 4.1 Reading order

| Order | Reader content | Composition/empty behavior |
| --- | --- | --- |
| 1 | Report identity and DRÖG | Concept C masthead: property, unit/location, local reference, context/type, actual supplied date/name and current-draft explanation. Unknowns remain labelled. No issue/version seal. |
| 2 | Important findings and deviations | All current affected room items, each linked once to its full record; separate fire/property concerns. Within fire use domain priority, not a new severity algorithm. Factual heating no/mixed response may have a separate “Aðrar skráðar athuganir” line without a defect count. |
| 3 | Missing information and limitations | Short grouped entries for required gaps, recorded scope/test limits and evidence coverage. Link to canonical facts; keep missing answers distinct from known limitations and unsupported verification. |
| 4 | Property and inspection details | Complete declared identity/scope/notes and attribution qualification; optional modification time labelled separately. |
| 5 | Residential rental context, where relevant | Current parties, premises/lease association and representation; optional details can use native disclosures. Inactive rental context appears only in the retained section. |
| 6 | Fire/property-level observations | Complete current three-group facts, scoped concerns, unexamined/unknown/test limits and retained disclosures. No new “other safety” category inferred from notes. |
| 7 | Room-by-room condition records | Source room order; overview image/scope coverage, every item and full supported prose. Satisfactory records are as reachable as defects. |
| 8 | Heating in the relevant room | Tagged item's actual position within its room, with its distinctive fields. It is not repeated as a second property-wide heating record. |
| 9 | Meter/handover context, where applicable | Current purpose/participation, both utilities' arrangement/reading facts, limitations and retained bundles. Reuse delivery context, not a duplicate event-date field. No synthetic keys/inventory. |
| 10 | Photographic evidence and references | Compact index linking to contextual figures; missing/unavailable/temporary boundary. No duplicate gallery or chronology claim. Verification/unsupported-capability statement and retained-information links complete the reading guide. |

A compact “Efnisyfirlit” after the opening findings/limits provides property/module/room/evidence links. On large screens it may also appear as a small side navigation. It is a locator, not an extra report section full of repeated narrative. The ten content priorities above need not become ten equally weighted cards or ten form steps.

### 4.2 Count contract and avoiding duplicate warnings

- Preserve `reportStats` exactly for room-item totals, recorded answers and deviations. Affected-item set uses the same `requiresDamage(o,item)` OR ordinary active dirty predicate and is parity-tested against `stats.deviations`. One item with damage, broken function and dirty counts once.
- Opening ruled metrics: **skoðunaratriði**, **atriði með fráviki**, **ófullskráð atriði** (`total - recorded`), **atriði með skráðar takmarkanir** (unique items with active explicit limits). The fourth is a separate labelled set, not `stats.attention`. Zero total shows no percentage or implied completion.
- Exact item-limit set: an ordinary item with `condition !== "na"` and any explicit `condition === "uninspected"`, `functionality === "untested"` or `cleanliness === "uninspected"`; or a tagged heating item whose `heatingState(o).limitations.length > 0`. Supplied out-of-checklist answers retain the qualification in §2.3. Missing answers, missing photographs, absent legacy heating items, property/module limits and global capability notices are excluded from this item-only metric. This presentation set must be parity-tested against those explicit helper states; it is not a second completion/attention definition.
- `stats.unanswered` mixes ordinary missing primary condition and heating `!heatingAnswered`; it is not a universal “missing condition” count or `itemProgress === "unanswered"` count. Do not reuse it under a misleading heading. Expose its exact meaning only if needed in detailed progress.
- Normal wear uses ordinary active `condition === "wear"` and active heating visible wear, counted once per real item, with the explicit qualification that this is the entered assessment. It is not added to deviations or subtracted to calculate “good”.
- Fire concerns, rental/core missing fields and meter review/confirmation issues remain separate labelled categories. No sum of field issues, items, fire rows and photographs is called “total defects” or “all tasks”. Existing module action counts retain their exact domain meaning.
- Issue identity is an encoded tuple of domain/report/source/group-or-room/row-or-item/field; categories are flags on that issue. Merge duplicates of the same source fact. An unreadable extinguisher label can have concern and limitation tags but one explanation; the secondary summary links to that same explanation. Separate facts at one item remain separate issues.
- The opening summary is an index of short factual labels and links. Full description lives once in the canonical record. Scope prose lives in its full scope section; opening limitations link to it. A room record can display its literal supplied grade and a missing-detail prompt without repeating the entire warning paragraph.
- Provide one global draft/unverified statement and one global temporary-media statement. Do not add a separate legal/temporary warning to every satisfactory row.

With no deviations use **“Engin frávik skráð í núverandi svörum.”** Never “Eignin er í lagi” or “Skoðun lokið”. With zero items prefer **“Engin skoðunaratriði skráð.”** If limits/gaps remain, name them directly beside that statement. No rooms still permits meaningful property/fire/meter reading; an empty room says **“Engin skoðunaratriði í þessu rými.”** No photo says no current session images, not no past evidence.

### 4.3 Traceability contract

- Local draft reference is the real `Report.id`. Room R01… and global item A001… follow current source order; photo M001… follows first presentation appearance. These are navigation aids for this live preview, not stable issued identifiers.
- Every presentation record retains its source IDs. A display label never replaces the compound `(reportId, roomId, itemId)` or `(reportId, fireGroup, rowId)` association. Item IDs such as `floor` recur across rooms.
- DOM anchors encode tuples, with a prefix distinct from existing `review`/`inspection` anchors. Findings, reading guide and photo index link to the intended canonical record/figure, with no duplicate IDs or hidden clone destinations.
- Sorting/reordering source rooms can change R/A/M labels; no frozen-reference promise exists. Reopening after an explicit correction rebuilds from current state. Do not persist numbering, store preview snapshots or claim historical comparisons.
- Fire free-text locations and meter identifiers do not resolve to room/item/photo associations. No heuristic joins.

## 5. Desktop/mobile UX structure and visual contract

### 5.1 Responsive document, not a production A4 renderer

Use a combination: Concept C's **document composition** in a **responsive reading layout**. At desktop a restrained white document surface, approximately 56rem maximum width, may sit next to a roughly 12rem reading guide inside the existing shell. Paragraphs target 65–75 characters per line. At narrow widths remove decorative outer paper gutters and flow one readable column. Never render a fixed 210mm canvas that must be horizontally panned or shrunk.

Do not calculate page breaks, page numbers, A4 continuation fragments or printed page destinations. The approved 25/29-page counts establish content growth and source preservation, not a screen-length target. Browser-native print remains whatever the browser provides; this phase offers no print/PDF control, export promise or print acceptance claim. Future export needs its own contract and approval.

Concept C invariants: strong property masthead, teal section labels, navy rules, restrained amber for issues, complete linked findings, distinct assessment columns/labels, full narrative and uncropped evidence beside its record. No card grid, score gauge, confetti, gradient header, oversized decorative status tiles or fabricated executive prose.

### 5.2 Typography and tokens

| Surface | Baseline and recommendation |
| --- | --- |
| Existing application chrome/actions | Keep imported `Manrope Variable`, Segoe UI fallback, existing weights/focus/control conventions and product tokens. No new font dependency. |
| Concept C document body | Approved `report.css` uses Arial, Segoe UI, sans-serif. Retain that stack within the reading document; do not silently assume the prototype used Manrope. Screen body/descriptions at least 1rem (normally 16px), about 1.5 line height; secondary labels/captions at least .875rem, scalable with user preferences. These are screen adaptations, not a new printed type scale. |
| Heading hierarchy | Preserve relative Concept C hierarchy: large address, smaller document title/context, clear section and room headings; use relative units, wrapping and content-driven height. No fixed single-line headings. |
| Printed reference | Preserve the historical 11pt body / 10.5pt description / 10pt assessment / minimum 9pt metadata requirements for a future export discussion; do not use those small print values as mobile screen sizes. |
| Shared colours | Reuse `--ink #172f40`, `--navy #142e3d`, `--teal #17635d`, `--muted #405463`, `--surface #fff`, `--paper #f3f6f5`, `--line #cbd6da`, `--focus #006b7a`, `--warning-text #783b17`, `--warning-bg #fff0e4`. The older report's slightly different line/soft/warning shades are reference values; proposed UI integration uses approved current tokens and must recheck contrast. |

Use scoped preview CSS, not broad global heading/form overrides. Underline reading links; the app's global anchor reset must not make prose links ambiguous. Status has words and, where useful, an icon as well as colour. A good answer can use teal text but never a whole-property approval treatment.

### 5.3 Desktop layout, approximately 1440px

```text
Existing compact product shell / storage status and truthful warning
Upplýsingar → Rými → Skráning → [Yfirferð]
[Aftur í yfirferð]                        Forskoðun · aðeins lestur

Reading guide         WHITE DOCUMENT SURFACE
Yfirlit                Ástandsskýrsla            local reference
Gögn og takmarkanir     [full property/address]  DRÖG
Eign og skoðun          unit · postcode · context/type
Leiga (if relevant)     supplied event date / recorder (or Óskráð)
Brunavarnir             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rými + room links      Findings — every affected item links to record
Mælastöður              Property concerns — distinct from item counts
Myndaskrá               Missing information / limitations — grouped links
                        ruled metrics + overlap explanation
                        ─────────────────────────────────────────
                        Complete property / rental / fire facts
                        R01 ROOM — overview + declared coverage
                        A001 item | Ástand | Virkni | Þrif
                        full narrative              contextual image
                        neutral note                M001 + association
                        … all records; heating within its own room …
                        meter facts; evidence index; verification limits
                        [Leiðrétta í yfirferð] / [Aftur í yfirferð]
```

Guide is sticky only if it fits; otherwise regular flow. It never overlays document text/focus. No nested document scrolling region. Long findings lists extend naturally; never show only the first three deviations. Reading-guide entries and source correction navigation are visually distinct.

### 5.4 Mobile at 360px (also reflows at 320/390)

```text
Existing product shell
four-step navigation, still four
[Aftur í yfirferð]
Forskoðun · aðeins lestur
──────────────────────────────
Ástandsskýrsla          DRÖG
Full address, wrapping
unit / location
local draft reference
context · supplied date/name
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skráð frávik
A023 Eldhús · Borðplata →
A027 Eldhús · Eldhúsvifta →
Brunavarnir · [concern] →
Gögn og takmarkanir
[missing information] →
[known test/access limits] →
ruled metrics, two columns;
one column at enlarged text
[Efnisyfirlit ▾] (native)
… property / rental / fire …
R03 Eldhús
A023 Borðplata
Ástand: Skemmt
Virkni: Ekki metin í liðnum
Þrif: Hreint
Full defect type/location/prose
[uncropped image, full width]
M007 · R03/A023 · filename
[Skoða mynd M007]
[Leiðrétta í yfirferð]
… remaining complete records …
```

No persistent bottom toolbar; browser zoom/text enlargement can use the whole reading width. At 360px normal text, short assessment values may share three labelled columns if they fit; stack label/value rows at 320px, long values or 200% text. Use one semantic DOM order, not separate duplicate mobile records. Main findings and gaps are visible before room narratives, even on phones.

### 5.5 Three content-state examples (illustrative, not fixtures or implementation)

**Multiple deviations:** opening summary lists A023 countertop damage, A027 hood broken/dirty and any further affected items, all linked. A027 counts once although it has three negative dimensions. A failed detector test appears in its own property-concern group, not as another room item. At A023 the full description/location remains next to M007; at A027 its full record remains next to its own photos. The guide/index never makes the reader reconcile the prototype's old source M006 with reader M008.

```text
Skráð frávik: 2 atriði       Brunavarnir: 1 skráð athugun til yfirferðar
A023 · Borðplata →            Reykskynjari · ekkert viðbragð skráð →
A027 · Eldhúsvifta →
Gögn og takmarkanir: A023 · stoðmynd vantar → [if actually empty]
```

**Incomplete report:** address/date/recorder/scope unknown, one room unnamed, two items unanswered and no available photos. Top property identity says Heimilisfang óskráð, with the real local reference. Missing common information and room structure are grouped before the body. Rental/fire gaps appear only under their existing relevance rules. “0 frávik” is not the headline; use “Skráning ófullgerð” and “Engin frávik skráð í núverandi svörum”. Every actual item is visible with Óskráð, with no N/A or positive default. Zero rooms is a variation showing property-level data and “Engin rými valin”, not an empty successful report.

**No deviations, recorded limitations:** headline “Engin frávik skráð í núverandi svörum”; beside it “3 atriði með skráðar takmarkanir”. An oven explicitly untested, inaccessible surface and heating not tried remain complete answers where allowed, visibly limited. The body shows what was not examined/tested. A normal-wear answer remains a stated condition. No “passed”, “all inspected” or “ready for signature” language. If fire/meter data are absent/limited, those coverage statements remain even with zero room defects.

## 6. Missing, unknown, inactive and unverified semantics

| Meaning | Reader wording/behavior | Task/claim consequence |
| --- | --- | --- |
| No requested answer | Óskráð / Svar vantar | Existing conditional missing rule only. Never N/A, zero, good or negative inspection. |
| Explicit knowledge uncertainty | Óvíst, using the actual module label | Recorded uncertainty. Not a missing field merely because uncertain; dependent requirements still follow the real helper. |
| Explicitly not examined/tested | Ekki skoðað / Ekki prófað / Ekki kannað | Known physical/method limitation. May be answer-complete, never successful inspection/test. |
| Dimension not requested | Ekki metin í liðnum | Checklist applicability only. Distinct from explicit “Á ekki við”. |
| Explicit item N/A | Á ekki við | Honor the parent override; no inferred successful function/cleanliness. |
| Supplied malformed/future value | Exact raw value + existing data-review warning | Saveable draft, no silent correction or completed-event claim. |
| Inactive retained answer | Varðveitt gögn utan núverandi svars/samhengis | Read-only disclosure with full known source text, outside current findings/counts. No inferred chronology, removal, reactivation or approval. |
| Absent optional module/participation | Óskráð / Ekki valið til skráningar | Coverage context, no invented required task or factual absence of equipment. |
| No current photo association | Engin mynd tiltæk við þetta atriði í þessari setu | Attachment coverage known; prior upload/removal/loss cause unknown. |
| Associated image fails | Mynd ekki tiltæk í þessari setu | Keep ref/association; content unverified. Pending lazy images are not failed. |
| Unsupported authenticated/workflow event | Ekki skráð í kerfinu / Kerfið staðfestir þetta ekki | Capability limit, not a draft field the user is expected to fill. |

Recommended concise global status text:

> Drög · Upplýsingarnar eru skráðar af notanda og hafa ekki verið sannreyndar af kerfinu. Forskoðun breytir ekki skráningunni.

Recommended factual execution boundary:

> Kerfið skráir ekki viðveru eða samþykki aðila, undirritun eða staðfestan frágang þessara draga. Lestur forskoðunar staðfestir ekkert af þessu. Athugasemdir í drögunum eru ekki staðfestar sendingar til gagnaðila.

For a final inspection:

> Engin fyrri skoðun er tengd í kerfinu. Hér er aðeins sýnd núverandi skráning; enginn samanburður liggur fyrir.

These statements describe this application, not a finding that outside approvals/signatures/events never happened. Do not offer legal deadlines, automatic notice effects, independent certification, HMS endorsement or a statement that the preview discharges lease obligations. Any later legally operative copy/process remains separately approved.

## 7. Navigation and accessibility contract

### 7.1 Entry, return and correction

- Add one **Forskoða skýrslu** action near Yfirferð's heading, with short explanation **Aðeins lestur · sýnir núverandi drög**. Never disable because answers/photos are incomplete. Keep existing continuation/list actions.
- Use normal Next client navigation, preserving the root provider and its temporary photos. Keep the stepper's four entries with `step={3}`; preview is identified by page title and “Forskoðun”, not a new step/status.
- The preview screen reads `{ state, report, id }` via `useReport` after hydration. It does not pass `store` to its children. Loading shows a status, missing report uses `MissingReport`, unsupported/sample records return to their existing summary, and `read-error` blocks previewing the fallback fixtures as the user's report.
- **Aftur í yfirferð** has a fixed safe same-report destination. A small in-memory same-document return proof may restore the actual launching review URL/scroll/focused entry link; direct/reloaded/new-tab entries fall back to `/skyrslur/{encodedId}/yfirferd#report-preview-entry`. The review entry needs that stable focus target. No localStorage/sessionStorage preference or inspection-position record is written.
- Source correction links are **Leiðrétta í yfirferð**, not implicit editing. Room/item links use existing `reviewHref(report.id, position)` and `useReviewNavigation` to reveal the exact source row. Core/rental/fire/meter links use their existing review anchors: `review-core-details`, `review-rental-details`, `review-fire-safety`, `review-meter-readings`. Retained/removed rental context uses a visible core fallback if the rental section does not exist.
- From Yfirferð the existing `detailsCorrectionHref`, `fireCorrectionHref`, `meterCorrectionHref` and ordinary inspection links perform their current precise editor/focus/return behavior. Do not add preview query parameters to those strictly allowlisted URLs. After an explicit correction the user returns to Yfirferð and can reopen the freshly derived preview.
- Opening/reading/exiting preview, internal anchor navigation, disclosure changes and image viewing never call `useInspectionNavigation`, `.remember`, `.activate`, `navigation.leave`, report mutations or meter confirmations. Explicit later entry into Skráning retains its established remember behavior; that action is separate from reading.
- Do not use `reportHref` to return from preview: its continuation choice can lead to capture and thereby remember/canonicalize a room. Do not auto-mount capture editors or correction hooks to obtain labels/facts.
- Preserve actual shared storage warnings. In preview only, recommend the smallest `AppShell` branch that replaces its **Reyna vistun aftur** writer control with a link back to Yfirferð. Retrying remains available in the existing correction workspace. Reading the preview never retries a failed write automatically or turns pending-only data into saved data. New/list navigation in the shell remains ordinary navigation.

Two-hop correction is a deliberate small-scope trade-off. It uses the existing workflow without expanding every correction parser and return contract to support a second editing origin. Direct preview-to-editor return can be considered later if reader testing demonstrates the need.

### 7.2 Accessibility and reading interaction

- Keep the existing `lang="is"`, shell skip link and single `<main>`. The preview contains a labelled `<article>` and one H1, then meaningful H2/H3/H4 order. A labelled reading-guide `<nav>` is distinct from the stepper/main navigation.
- Use `dl/dt/dd` for assessment and context values, semantic lists for findings and index entries, `figure/figcaption` for photographs. Desktop assessment columns must keep programmatic labels; mobile exposes those labels visually. No layout-only table that requires two-dimensional reading on a phone.
- Link text names the room/item/destination, including for screen readers. Internal anchor activation moves focus to a `tabIndex={-1}` target and reveals any containing native disclosure. It does not change form answers or a remembered inspection position. Sticky offsets must keep target headings and focus visible.
- Native `<details>/<summary>` supports the reading guide and retained/secondary records. Current findings and material limitations are not hidden in a closed accordion. Do not use separate hidden desktop/mobile copies or virtualize text, because find-in-page, anchors and assistive technology need all records.
- Full-image viewing uses the existing `ContextDialog` focus/Escape/restore contract, with a preview-specific read-only figure if needed. Provide an accessible name, caption and close button, keep focus contained while modal, and restore the originating M-reference trigger. A failed/removed trigger falls back to its source heading. No removal/download/upload controls are added.
- Support keyboard reading/navigation without hover or swipe requirements. Visible focus remains 3px token-based; interactive controls/summary/image triggers target at least 44px where practical. No sticky element may obscure focus or consume the reading viewport at enlarged text.
- Verify normal text contrast ≥4.5:1 and relevant large text/non-text ≥3:1, including links, labels, warnings and focus. Do not rely on colour or “?” icons alone. Existing colour measurements do not automatically certify the new combinations.
- Respect 200% text enlargement, browser zoom/reflow, user spacing and reduced motion. `overflow-wrap:anywhere` is a last-resort break for long IDs/URLs/names; ordinary Icelandic words wrap naturally. Preserve paragraphs with `white-space: pre-wrap` or equivalent, no line clamp/fixed record height.
- Announce image errors politely without a cascade of alerts. Use one aggregate availability status when necessary; keep per-image failure text discoverable in context. Do not announce every image loading event or rerender the entire article as a live region.
- Axe and keyboard tests are necessary, not complete WCAG 2.2 AA proof. Manual NVDA/VoiceOver tasks, real mobile/browser zoom and other engines must be recorded as done or outstanding, never inferred from previous phases.

## 8. Compatibility, preservation and risk analysis

| Risk | Proposed containment and acceptance evidence |
| --- | --- |
| Reading route writes `updatedAt`/draft JSON | Pure adapter, no mutation props/mount effects; freeze source inputs. Spy on all store writers and storage writes; serialized envelope/report bytes and timestamps must be identical before/after reading. |
| Capture navigation mounted indirectly changes remembered position | Reader uses no capture navigation hooks. Compare exact valid, stale, malformed and unavailable position-key bytes before/after every preview-only operation, Back/Forward and reload. |
| Read failure displays fallback demo data as the user's report | Gate `state.status === "read-error"` before lookup/render. Preserve protected bytes, explanatory warning and safe return. No partial salvage, retry/write or auto-replacement. |
| Pending valid edits hidden or falsely called saved | Render current valid in-memory snapshot, preserve warning/status and pending data. Do not reread stale localStorage into another preview store. Explicit retry remains in Yfirferð. |
| Retained data becomes a current finding | Explicit parent-state gates for N/A, rental, fire, heating and both meter guard tags. Full known retained source text only in labelled noncurrent disclosures. Context switching for preview never patches source. |
| Helper drift or “missing = N/A” | Direct helper reuse plus differential/parity assertions over existing fixtures and states. No independent safety/readiness predicate or positive defaults. Document unusual supplied-outside-flag records (§2.3). |
| Double counting findings/warnings | Set of unique source items for room deviations; separate module issue registries and category labels; one canonical full explanation/figure. Do not add overlapping counts into a total. |
| Wrong room/item/photo association | Enumerate full exact target keys. Item/source/DOM keys encode full tuples. Tests deliberately repeat `floor`, room names and filenames across different rooms/reports. No fuzzy matching. |
| Nested duplicate IDs or ambiguous legacy media keys | Validator does not guarantee unique room IDs or item IDs within each room. Render each source occurrence with view-only ordinal disambiguation and an association warning; do not create a guessed unique correction link. Build a target-key-to-source-candidates map; a photo key matching more than one candidate is not assigned to either. Show its known metadata in an unassigned session-evidence disclosure, excluded from assigned counts. Never rewrite IDs or change the validator/schema in this slice. |
| Orphan observations/media/extensions | Do not present orphan observation keys as live checklist items or attach orphan photos to a similarly named item. Known orphan observation prose may appear under “Varðveitt gögn án virks skoðunaratriðis” with its original key; no active finding/count/correction destination. Unmatched session media is qualified only where report ownership is unambiguous; never expose another report's photos by prefix. Unknown extension values remain untouched and get an informational unsupported-data notice, not guessed semantics or unsafe raw HTML/JSON. |
| Report identity/date assumptions | Separate date fields and supplied/unverified attribution; missing identity remains missing. Same dates do not merge events. `independent` and creator role do not prove examiner appointment or attendance. |
| Large photo memory/decode cost | Keep only existing object URLs; no data-URL copies, canvas transforms or all-image `Promise.all(decode)`. Lazy-load contextual thumbnails with reserved aspect-ratio space; full view loads on request. Do not impose new media persistence/processing infrastructure. |
| Long report inaccessible or slow | Linear adapter/index construction; memoize by relevant report/photo references and explicit validation date. Full text remains in DOM; photos load lazily. No quadratic per-issue scans, text virtualization or fixed-height A4 measurement/rebalancing. |
| Shared CSS/shell changes regress capture | Preview-scoped styles and a narrowly tested shell retry branch. Preserve existing route/editor/parser/model/store behavior. Run unchanged full regressions after a future implementation. |
| Read-only mistaken for immutable/issued | Always DRÖG with present-state explanation. No saved preview snapshot, approval event, lock, signature space, issued reference or share/export button. |

The storage envelope/key/version, extension retention, protected malformed/unsupported reads, failed-write pending state, retry semantics and unrelated reports must remain intact. No hydration backfill, migration, room regeneration, default heating insertion or meter activation. Exact blob IDs/URLs/names/array associations remain unchanged across client preview visits; only explicit current view load/error state may change.

Cross-tab/older-client overwrite risk, browser quota/eviction and lack of shared media remain existing limits. This phase does not solve them or imply synchronised/frozen reports. A live provider snapshot is not an immutable record; explicit edits elsewhere may cause a new render, with no new history or provenance claim.

## 9. Implementation sequence and likely affected files

Only perform this sequence after owner approval and a fresh baseline/state check. Re-read applicable installed Next API documentation before coding. The list is an estimate for a bounded implementation, not authorization to modify these files now.

| Step | Likely files | Work and stopping condition |
| --- | --- | --- |
| 1 | New `src/lib/report-preview.ts`; future `tests/report-preview-contract.spec.ts` / fixture support | Implement typed pure mapping/source registry and helper parity first. Deep-freeze all inputs; confirm domain/date/retained cases before rendering. No edits to persisted interfaces or validators. |
| 2 | New `src/app/skyrslur/[id]/forskodun/page.tsx`; `src/components/screens/report-preview-screen.tsx` | Follow existing route wrapper/Suspense/client pattern. Use root store snapshot, loading/not-found/read-error/sample guards, no second provider or server-local data fetch. |
| 3 | New `src/components/report-preview.tsx` and `report-preview.module.css`; optionally one narrowly scoped photo figure module | Render identity/findings/limits, complete sections/rooms, in-context heating/meters, retained data and evidence index. Keep all text and source associations. Avoid fragmenting into an unnecessary component framework. |
| 4 | `src/components/screens/review-screen.tsx`; optional tiny `src/lib/report-preview-navigation.ts` | Add entry/fallback focus target and safe read-only return/source-to-review navigation. Reuse current review destinations. Do not alter correction query contracts or stepper definitions. |
| 5 | `src/components/app-shell.tsx`; `src/lib/locale/is.ts` | Localize preview wording, maintain truthful warnings and replace only preview-route retry writer with a review link. Keep all other shell behavior/style unchanged. |
| 6 | Future `tests/report-preview.spec.ts`, contract cases and synthetic fixture support | Browser preservation, all content states, responsive/a11y/image behavior. Existing domain/compatibility/browser suites remain meaningful and unchanged unless an approved layout legitimately changes a selector. |
| 7 | New phase-specific implementation review/evidence, outside historical designs | Run lint/typecheck/build, focused then full regression, inspect new screenshots and manual accessibility tasks. Report failures/limitations honestly; stop for the requested review/publication approval. |

Prefer the adapter over reusing whole `CoreCaptureSummary`, `RentalInformationSummary`, `FireObservationSummary` or `MeterReadingSummary` components: they contain correction UI, focus effects and workspace composition. Reuse their **domain facts/helpers and semantics**, not their writer/editor dependencies. `HeatingFacts`/`EvidenceGallery` can be reused only if they meet the adapter/source-reference/read-only contracts; otherwise small presentation components are justified without changing domain rules. No production PDF dependencies.

Expected untouched production areas: report model/schema/validators, `DemoStore`, local-data hydration/persistence, room templates, inspection editors, existing correction hooks/parsers, archived concept code and approved design package. If implementation demonstrates an unavoidable semantic gap, stop and present the specific gap and smallest separately approved change; do not widen scope silently.

## 10. Acceptance criteria and detailed verification matrix

These are **future implementation requirements**, not results of this planning task. No test or production build was run here; those commands can create unrelated/generated files and are unnecessary to verify a single planning document. This task's verification is source/design review and final Git/file-scope inspection.

### 10.1 Product and architecture acceptance

1. An eligible draft can open a usable preview from Yfirferð at any completion level. Exactly four steps remain, and all existing entry/continuation/correction flows work.
2. The entire renderer receives read-only presentation data and no store writers. Opening, reading, return, anchors, disclosures and full-image viewing perform no report/storage/navigation/media mutation.
3. Header/findings/limits/complete records visibly follow refined Concept C. No fabricated inspection/date/name/role extension, property grade, legal pass, verified photo or participant event appears.
4. Every actual checklist item occurs once as a full current record, including good/wear/N/A/unanswered/limited records; heating stays within its source room. Full supported active and retained text is reachable without truncation.
5. All active room deviations and property concerns are discoverable from the opening summary. Counts have explicit populations and parity with existing helpers; missing/limited/concern states are distinguishable.
6. Rental/fire/heating/meter mappings exactly follow §3. Unknown optional data does not become a new required task; inactive data cannot become a current finding or reading.
7. Photos remain associated with their actual source target, are uncropped/readable, and have consistent M references, local full-image access, honest availability and temporary-session disclosure. One figure per association; index links do not duplicate evidence.
8. Long reports reflow without document-level horizontal scroll, lost text, hidden warnings or obscured focus across the specified widths/text sizes. All records remain accessible through semantic navigation and find-in-page.
9. No preview-only operation changes serialized report bytes, `updatedAt`, unknown extensions, unrelated data, media arrays/URLs or remembered inspection position. Existing valid pending edits and protected read errors remain protected.
10. No PDF/print-export, finalization, approval, share/invitation, backend/auth, durable media, payment, comparison or notification feature is introduced.

### 10.2 Domain/data matrix

| ID | Cases | Required assertion |
| --- | --- | --- |
| D01 | Literal legacy v1; current complete; current partial; optional modules absent | No default backfill; all missing actual metadata unknown; byte-identical read, no current module invented. |
| D02 | All context/type combinations, including missing context | Exact contextual metadata/rental/fire/meter relevance; independent is not agreed examiner; no implicit rental or exemption claim. |
| D03 | Empty/whitespace/multiline/long property, recorder and scope strings | Full supplied text preserved; emptiness via helper, no normalization; optional limitations absence not “none”. |
| D04 | Leap day, malformed and future inspection date; different lease/delivery/meter/update dates | Existing warnings, no date substitution/timezone shift or fabricated performed event. Supply deterministic `today` to tests. |
| D05 | Rental missing parties/premises; reference only; valid date only; invalid date + valid reference | Exact rental minimums and independent invalid-date attention; no false completed lease/verified identity. |
| D06 | Representation source recorder/other/none; missing recorder; role inconsistency; retained alternative; context changes | Live name resolution, one stated representative, preserved inactive text/extensions; no copied identity/attendance/authority. |
| D07 | Every fire examination/presence state; absent groups; partly examined with/without explanation | No absence=N/A; inactive subordinate rows excluded; current scope/unknown/limitations match helpers. |
| D08 | Multiple fire rows, later failed detector, untested/unknown result, missing claimed-test scope | Concern priority matches existing helper independent of row outcome order; only performed result active. |
| D09 | Missing optional fire area/count/location; invalid count; blank/0 count text | Contextual omissions do not add actions; invalid supplied count stays raw; no inferred numeric zero/sufficiency. |
| D10 | All extinguisher label states and old label text; route obstruction/no/unknown with retained details | Exact current/retained boundaries; dual-category label explanation counted once per fact; no service-validity or egress certification. |
| D11 | Heating absent/tagged/collision-safe ID; cooking oven; no rooms | Only real tag produces heating record; no backfill or fake item. |
| D12 | All heating visibility/operation/response branches; mixed visible/source; wholly reported concealed | Same missing/complete/limited/defect outcomes as `heatingState`; source only active under correct visibility. |
| D13 | Heating no response/mixed response, explicit visible defect, inactive generic grades/prose | No automatic defect/broken/photo requirement from response; exact active defect predicate and retained text. |
| D14 | Meter absent/inactive; optional none/electricity/hot-water/both; both rental modes | Independent participation, zero absent/unselected tasks; purpose available only in supported context/type. |
| D15 | Each utility: separate/shared/no-meter/unknown/not-examined/missing | Separate status minimum, optional shared reading, explicit shared qualifier, no fabricated value/absence. |
| D16 | Every reading status; missing raw value/unit/date; zeros/commas/grouping/spaces/unusual strings | Original bytes displayed; existing plausibility/date issues only; no unit/default/number normalization. |
| D17 | All six purpose transitions, incompatible context/type, separate↔shared, missing guard tags, restoration to original tags | Unbound/mismatched reading facts never current; one set-level purpose issue; no confirmation or rebind on read. |
| D18 | Meter facts on an unselected utility; whitespace facts; metadata-only cleared sets; pending stale confirmation | Follow latest merged guard semantics; no shortcut association or old preview snapshot used as history. |
| D19 | Every ordinary condition/function/cleanliness combination and conditional missing damage field | Exact `observationComplete`, `needsAttention`, `itemProgress`, `missingAnswers`, `requiresDamage`, room/report stats parity. Include missing condition + broken and good + retained defect prose. |
| D20 | Damage+broken+dirty same item; cleaning-only; wear+dirty; explicit N/A with old fields/photos | Unique affected-item count; no invented cleaning damage/photo requirement; N/A suppresses subsidiary current facts, note/photos remain. |
| D21 | Supplied subsidiary answer outside false checklist flag; orphan observation; unknown extensions | Qualified truthful display/helper parity; no hidden explanation for a counted finding; no invented checklist membership, task or extension semantics. |
| D22 | Zero rooms; zero-item room; unnamed room; complete but limited; no deviations | Useful honest empty statements, no divide-by-zero/100% assurance; known limits still prominent. |

### 10.3 Evidence/navigation/preservation matrix

| ID | Exercise | Required assertion |
| --- | --- | --- |
| P01 | Repeat item IDs/names/filenames across rooms/reports; overview vs item; heating photos | Exact source tuple and M-to-figure association, no leakage/prefix/fuzzy joins. |
| P02 | 0/1/8 images per target, portrait/landscape, missing attachment, failed blob, lazy pending | All references reachable; uncropped image/context; no pending=missing, invented lost-upload reason or duplicate figure. |
| P03 | Duplicate nested IDs, delimiter-containing IDs, ambiguous media key, orphan media | Qualified source occurrence; no guessed association/correction, no rewritten IDs or data. |
| P04 | Preview open/back/reopen; internal links; retained disclosures; full-image Escape/close | Zero writer/remember calls; exact before/after localStorage strings, timestamps, extension keys, other reports and blob associations. |
| P05 | Back/Forward, direct/reloaded URL, stale target/missing report, unsupported/sample, new tab | Safe fixed same-report fallback; correct focus; no fixture substitution under read-error or claim of shared session photos. |
| P06 | Valid/malformed/stale/unreadable position key | Preview doesn't read-repair/write it; preserve exact bytes and actual previous continuation behavior. |
| P07 | Pending write error, memory-only draft, validation error, corrupt JSON/version/read failure | Current valid pending data and warnings survive; no auto-save/retry/backfill/normalization; protected bytes untouched. |
| P08 | Preview→Yfirferð source→core/rental/fire/meter/heating/ordinary editor→return→preview | Existing exact input/radio/guard focus and source return; deliberate edit only causes expected save; refreshed preview shows edit. |
| P09 | Current finding disappears after deliberate edit; item/room reordered/removed | Updated live mapping, no stale anchor/photo association, safe missing-source navigation; refs remain explicitly view-local. |
| P10 | Normal before/after comparison of four-step capture, list/resume, evidence, storage retry and context guards | Existing unchanged regression suites pass. Shell preview-only retry branch cannot affect normal editor retry or pending-state preservation. |

### 10.4 Layout, scale, performance and assistive-technology matrix

| Scenario | Required coverage |
| --- | --- |
| Small reports | Zero-room; 1 room; both 3-room/15-item Concept C-like cases (quiet and defects), adapted to actual current model rather than importing the static fixture blindly. |
| Representative large | 10 rooms / exactly 84 actual checklist items including whichever heating items the fixture explicitly contains / 23 photo associations; every item, description and reference retained. No false claimed parity with the different static 84-item checklist. |
| Long/unavailable | Same scale, multiple very long paragraphs/lines and Icelandic names, one known session image failure plus a separate missing supporting attachment; preserve all text and distinguish both evidence limits. |
| Expanded boundary | Approximately 100 items / 40 photographs, all module types, up to 8 images on one real target, long party/property/lease strings. Measure with real accepted-format synthetic files; do not add all 40 to one target. |
| Widths | 320, 360, 390, 768, 1440 CSS px; every principal empty/defect/incomplete/limited state, reading guide, retained disclosure and full-image view. |
| Enlarged text/reflow | Repeat those widths at 200% computed text sizing; supplement real 200% browser zoom and 400% reflow checks on desktop. No lost text/control or horizontal document overflow. No promise that CSS text doubling alone proves browser zoom support. |
| Keyboard | Skip to main; reach guide/findings; follow item/photo/source links; reveal retained data; open/close image; return to review; no focus traps except intended modal; focus visible/unobscured. |
| Screen reader | Manual NVDA with an appropriate Windows browser and VoiceOver/Safari where available: identify draft/property, find defect, distinguish untested from missing, find a satisfactory row, interpret shared/stale reading, find failed photo and return from image/correction. State any unperformed platform explicitly. |
| Automated accessibility | Axe WCAG A/AA, 2.1 AA, 2.2 AA; computed text/link/focus/non-text contrast; names/labels/landmarks/headings; no duplicate IDs or broken anchors. Inspect manual/automated evidence separately. |
| Browser/device | Installed Chrome plus available Firefox and Safari/real phone checks; record versions/environment and remaining gaps. Do not inherit previous phases' untested-browser claims as passed. |
| Performance | Measure adapter time, first text presentation, long tasks, scroll/keyboard responsiveness and image decode/memory behavior on the expanded case. Proposed target: adapter/index <50ms on the documented development machine after warm-up; investigate repeated mapping tasks >50ms. Treat device-specific timing as measured evidence, not a universal SLA. |
| Image loading | Initial text/links must not wait for all 40 images. Offscreen images use lazy loading/reserved geometry; full view requests only its image. No duplicate image buffers, all-at-once decode or URL revocation on unmount. Record limitations with large/high-resolution files and throttle/device tests. |
| Visual comparison | Inspect fresh desktop/360px/200%-text screenshots against preserved Concept C masthead, ruled summary, complete findings and contextual room evidence. Record justified responsive/content extensions, not pixel parity with fixed A4 pages. |

For an approved implementation run the existing lint, typecheck, production build and full regression suite, plus the new focused tests. Use disposable synthetic browser contexts and new evidence output locations; never clear personal drafts or overwrite historical QA. Preserve original assertions/skip rules and report clean-run versus isolated-rerun outcomes accurately. No hardcoded inherited pass count is an acceptance substitute.

## 11. Exclusions, unresolved decisions and trade-offs

### Explicit exclusions

No production PDF generation/download/export or pagination engine; report issuing/locking/signatures; account authentication/invitations/participant permissions; permanent/private image storage or verified provenance; backend/database; payment; legal notice/deadline/approval/dispute execution; lease drafting/registration/result transfer; initial/final pairing or comparison; inventory/keys; new property/fire/meter media capture; other asset-category workflows; broad checklist/domain/status redesign; modification of approved historical concepts/designs.

No commits, pushes, PRs, merges or deployment are authorized by this planning task. No production renderer, test/fixture addition or schema change is made here.

### Decisions and implementation gates

| Decision/trade-off | Recommended disposition |
| --- | --- |
| Route versus inline/modal preview | Approve the dedicated reading route. It provides headings, browser navigation, responsive reading and space for long records; keep the provider at root so client navigation retains photos. No new inspection step. |
| Responsive reading versus simulated A4 | Approve continuous responsive flow. Preserve composition and evidence context; page numbers/export must wait for a separately approved renderer. Historical native-print acceptance is not silently claimed. |
| Report typography versus shell typography | Approve the scoped Arial/Segoe document + existing Manrope chrome recommendation. If a unified Manrope report is preferred, review that as an explicit design decision before visual implementation, without altering approved historical assets. |
| Correction navigation | Approve the two-hop source→Yfirferð→existing editor approach. It adds a navigation step but avoids changing the precise existing return/guard contracts. |
| Inactive information visibility | Approve full supported retained text in labelled native disclosures, outside current findings. It preserves source fidelity while keeping the main report readable; no history/provenance is implied. |
| Supplied outside-checklist subsidiary answers | Approve qualified display with existing helper parity (§2.3), or separately decide a domain correction before implementation. Do not silently suppress values/counts or classify them as inactive against the current helpers. |
| Photo size/performance | Approve lazy browser-local display and no new processing stack. Full-resolution session files can remain expensive; device measurements may justify a later separately scoped derivative strategy, not replacement/loss of originals in this phase. |
| Module absence versus rental readiness | Preserve current approved module activation/task behavior; make coverage omissions legible. Changing absent-meter or optional-fire task rules requires its own approved domain decision. |
| Ambiguous legacy associations | Qualify and avoid guessing; no schema repair. If realistic legacy examples demonstrate that safe rendering is impossible, present the specific case for separate approval. |
| Manual accessibility/reader understanding | Treat unperformed platform checks as outstanding, not implicit compliance. Include landlord/tenant reader tasks when available; no user-research claim is made by these wireframes. |
| Formal legal/examiner/notice/lease obligations | Remain unresolved as recorded in the approved audit. They do not block an explicitly bounded draft reader, but block stronger execution/compliance promises. |

This proposal is ready for product/architecture review. **Stop here and obtain approval before implementation.**
