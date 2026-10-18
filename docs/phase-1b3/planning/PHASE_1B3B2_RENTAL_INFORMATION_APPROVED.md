# Phase 1B.3b.2 — Residential Rental Information

**Approved planning specification · 17 October 2026.** The owner separately approved implementation and, after independent review of the report and screenshot package, Draft PR publication. Proposal-era approval checkpoints below describe the planning stage.

Publication copy of the unchanged local planning specification, SHA-256 `17e3ffabe1a4a13c88578f99dcd3959cff9ba93334893df9868d9138247e4ca5`. Only approval/provenance and machine-specific repository metadata are adjusted; the proposed contract, requirements, acceptance criteria and boundaries below are unchanged. Existing research/design links point to the curated Phase 1B.3 baseline already in main.
Recommend one compact, conditional **Íbúðarleiga** panel within Upplýsingar. Keep the four existing steps. Capture factual rental context, keep rented extent separate from inspected extent, and show missing information in Yfirferð without blocking drafts. Preserve refined Concept C unchanged; this phase does not build its production adapter or PDF output.

## 1. Evidence and repository baseline

Reviewed against:

- [Approved field catalogue](../research/phase-1b3-hms-audit-2026-10-17/FIELD_REQUIREMENTS.md), especially F05–F12.
- [Gap matrix](../research/phase-1b3-hms-audit-2026-10-17/GAP_MATRIX.md), especially G02–G15 and G31–G36.
- [Owner/legal questions](../research/phase-1b3-hms-audit-2026-10-17/DECISIONS_AND_QUESTIONS.md), O1/O3/O5/O8 and L-Q1/L-Q4/L-Q5/L-Q7.
- [Approved phased recommendation](../research/phase-1b3-hms-audit-2026-10-17/PHASE_1B3B_RECOMMENDATION.md), item 3.
- [Concept C information contract](../design/phase-1b3a-c-refinement/INFORMATION_CONTRACT.md) and [approved product boundaries](../README.md#approved-product-boundaries).
- Current [model](../../../src/lib/model.ts), [store](../../../src/components/demo-provider.tsx), capture/review components and Phase 1B.3b.1 compatibility/capture tests.

Planning repository baseline: `astandsskraning`; origin: `https://github.com/Dermir92/astandsskraning.git`; branch: `main`. HEAD, local main, cached origin/main and the live GitHub main branch resolved to `02e2035f44cadbf5cef1948472f6fd2102bc5b5a` at the planning checkpoint.

At entry, tracked files were clean; only `docs/design/` and `docs/research/` were untracked. A read-only SHA-256 baseline covers 385 existing files: those originals, the curated Phase 1B.3 package, preservation records and ZIP archives found under `artifacts/` and `tmp/`. This proposal is a separate new file; no existing document or asset is rewritten.

### Requirement classification

The approved audit remains the requirements baseline. A targeted check of the current [Húsaleigulög, Articles 6 and 69–72](https://www.althingi.is/lagas/nuna/1994036.html) supports the distinctions below; it does not resolve the audit's open legal questions.

| Class | Relevant basis | Consequence for this phase |
| --- | --- | --- |
| Binding lease requirements | Article 6 specifies parties, premises and property identifiers in the lease. | Reuse existing property fields. This app is not preparing or replacing the lease; do not duplicate its personal identifiers. |
| Conditional declaration requirements | Article 71 identifies premises, ancillary property, lease date and parties in the examiner/declaration route. Article 72 concerns execution/copies. | Factual fields are useful now. Do not promise the formal route; its application to ordinary party-led records remains an open legal question. |
| Binding duty, distinct from field capture | Article 69 addresses inspection and recording principal results in the lease for applicable leases. | Entering a lease date/reference does not establish incorporation or fulfilment. |
| Official guidance/forms | Audit sources H1 §1–2 and H3 header illustrate party, premises, lease and representation information; versions differ. | Guidance informs labels/grouping, not a compulsory software form. Preserve the audit's form-version caveat. |
| Product decisions proposed here | Rental-only readiness, either date or reference, progressive disclosure, optional property number and one representative record. | Require owner approval. These are not statutory compliance tests. |

## 2. Small additive data contract

Proposed TypeScript only; all members are optional for existing reports and incomplete drafts:

```ts
export interface RentalRepresentation {
  nameSource?: "" | "recorder" | "other";
  name?: string; // Used only when nameSource === "other"; retain otherwise.
  representedParty?: "" | "landlord" | "tenant";
  basisDescription?: string; // User-declared description; never verified authority.
}

export interface ResidentialRentalInformation {
  landlordNames?: string;
  tenantNames?: string;
  leaseDate?: string; // Raw date-only input; assess calendar validity separately.
  leaseReference?: string;
  propertyNumber?: string; // Preserve exactly as entered; no numeric conversion.
  premisesDescription?: string;
  includedAreasDescription?: string;
  excludedAreasDescription?: string;
  representation?: RentalRepresentation;
}

// Add this member to ApartmentDetails; retain all existing members:
export interface ApartmentDetails {
  rentalInformation?: ResidentialRentalInformation;
}

// These correction targets are UI identifiers, not persisted fields:
export type RentalFieldId =
  | "rentalLandlordNames"
  | "rentalTenantNames"
  | "rentalLeaseDate"
  | "rentalLeaseReference"
  | "rentalPropertyNumber"
  | "rentalPremisesDescription"
  | "rentalIncludedAreasDescription"
  | "rentalExcludedAreasDescription"
  | "rentalRepresentativeNameSource"
  | "rentalRepresentativeName"
  | "rentalRepresentedParty"
  | "rentalRepresentationBasis";

export interface RentalInformationIssue {
  field: RentalFieldId | "role";
  kind: "missing" | "invalid" | "inconsistent";
  label: string;
}
```

Use one optional namespace rather than adding rental keys to every legacy detail object. Do not initialize it on creation, hydration, rendering, disclosure opening or context selection. Create only the particular path the user explicitly edits. `landlordNames`/`tenantNames` accept persons or organizations, including multiple names on separate lines; avoid a participant list, generated identities and per-person contact records.

Reuse `address`, `postalCode`, `municipality`, `unit`, `role`, `recorderName`, `inspectionDate`, `deliveryDate`, `furnished` and `notes`. Keep the existing `scopeDescription` and `scopeLimitations` solely about what was actually inspected. No automatic copying between these fields and the rental object.

## 3. Relevance, readiness and unknowns

**All new readiness rules apply only when `inspectionContext === "residential_rental"`.** An absent or empty context is unknown, not an assertion that rental duties do not apply. Standalone/unknown reports have no new rental requirements. Existing Phase 1B.3b.1 common and context-specific rules remain unchanged.

**M** below means a proposed product minimum for describing these rental drafts; **C** means conditional product information; **O** means optional. None blocks creation, saving, navigation or review.

| Information | Rule in active rental context | Unknown/validation behavior |
| --- | --- | --- |
| Landlord names; tenant names | M: both supplied | Absent, empty or whitespace-only means missing. Names remain self-declared regardless of recorder role. |
| Rented-premises description | M: short, precise description | A selected-room list or inspection scope cannot satisfy it automatically. A room rental may identify the private room and shared use. |
| Lease date/reference | M at group level: a valid calendar date **or** nonblank reference | Neither supplied produces one group issue targeting the reference field. Either is sufficient for this product rule. This does not replace a date where a formal declaration requires one. |
| Property number | O in this draft slice; legally conditional in the associated lease/declaration package | Unknown stays unknown. It is not a registry check. Existing unit/address fields are not duplicated. |
| Included ancillary/shared areas; excluded areas | O, useful where needed to clarify the rented extent | Blank means not recorded, never “none.” Users may explicitly describe no included/excluded areas if accurate. |
| Representation | C when the recorder's role is representative, or a representative is explicitly selected in this rental object | Require `nameSource` and `representedParty`; require `name` only for `other`. A missing recorder name remains the existing common issue for `recorder`, not a duplicate name issue. |
| Representation basis | O, only within the representation group | Blank means basis not recorded. No upload, validation, mandate status or claim of authority. |

For names, descriptions and references, use trimming to assess emptiness without modifying stored prose. Preserve accents, line breaks and long values. Do not add arbitrary truncation or destructive length limits.

`undefined` and `""` display as **Óskráð**; a whitespace-only value is also incomplete. Preserve their original representations until an explicit edit. No `null`, sentinel date, zero or automatic “N/A” is written. Non-applicability is derived from context or a conditional branch; missing data is never converted into a factual “does not exist.”

Lease dates use `isCalendarDate` for real `YYYY-MM-DD` dates, without timezone conversion. Malformed strings remain visible/editable, with a nonblocking warning. A future lease date is permitted: it is not the actual inspection date. Do not impose an ordering rule against inspection/handover dates or infer historical legal applicability. An invalid supplied date still receives an attention warning even if the reference satisfies the association minimum.

Identifiers remain raw strings. Whitespace is unknown; numeric/object/null values are structurally invalid storage. This slice establishes no authoritative identifier-format or registry validator, so it must not declare a string valid/invalid by an unverified regex, remove formatting, reject leading zeros, or describe a reference as verified. Incorrect identifiers remain correctable user claims; stronger validation is deferred. Neither identifier is a safe link to open automatically.

Selecting `nameSource: "recorder"` is an explicit user instruction to display the current `recorderName` as representative; do not duplicate it into `name`. Explain this live association. Switching to `other` reveals the separately retained `name`; switching away retains it outside the current summary. Never infer this choice from matching names or `role`.

If `nameSource === "recorder"` conflicts with a non-representative/unknown recorder role, show **Hlutverk og fyrirsvar þarfnast yfirferðar** and offer correction; do not silently change either value. Other representatives can be recorded without changing the recorder's role. Support one declared representative for one party only in this slice; multiple/dual representation needs a later contract.

## 4. Icelandic labels and contextual copy

| Field/group | Label | Hint or choices, shown when useful |
| --- | --- | --- |
| Rental panel | **Íbúðarleiga** | Header note: **Má fylla út síðar.** |
| `landlordNames` | **Leigusali** | **Nafn eða nöfn leigusala.** |
| `tenantNames` | **Leigjandi** | **Nafn eða nöfn leigjanda.** |
| Party group | **Aðilar leigusamnings** | One group hint: **Nöfn eru sjálfskráð; auðkenni er ekki staðfest.** |
| `premisesDescription` | **Hvað er leigt?** | **Lýstu húsnæðinu sem leigan nær til, óháð því hvað var skoðað.** |
| Lease disclosure | **Leigusamningur** | Incomplete summary: **Dagsetningu eða tilvísun vantar.** |
| `leaseDate` | **Dagsetning leigusamnings** | **Dagsetning samningsins, ekki skoðunar eða afhendingar.** |
| `leaseReference` | **Tilvísun í leigusamning** | **T.d. auðkenni samnings eða önnur stutt tilvísun. Dagsetning eða tilvísun nægir hér.** |
| Property disclosure | **Fasteignanúmer og afmörkun** | Summary shows entered number or **Valfrjálst**. |
| `propertyNumber` | **Fasteignanúmer** | **Ef það liggur fyrir. Skráðu númerið eins og það kemur fram í samningi eða fasteignaskrá.** |
| `includedAreasDescription` | **Fylgirými og sameiginleg afnot** | **T.d. geymsla, stæði eða aðgangur að þvottahúsi.** |
| `excludedAreasDescription` | **Svæði utan leigunnar** | **Tilgreindu svæði sem eru undanskilin, ef við á.** |
| Representation disclosure | **Fyrirsvar** | Offered optionally; expanded when the user selects the recorder role Fulltrúi. |
| `nameSource` | **Hver kemur fram sem fulltrúi?** | **Óskráð / Skráningaraðili / Annar aðili**. No selected factual default. |
| `name` | **Nafn fulltrúa** | Only for Annar aðili. For recorder source show **Nafn fulltrúa er sótt í nafn skráningaraðila.** |
| `representedParty` | **Fyrir hönd hvers?** | **Óskráð / Leigusala / Leigjanda**. |
| `basisDescription` | **Uppgefin heimild til fyrirsvars** | **Stutt lýsing, ef hún liggur fyrir. Heimild hefur ekki verið staðfest.** |

Example missing links: **Nafn leigusala**, **Nafn leigjanda**, **Lýsing á hinu leigða**, **Dagsetning eða tilvísun í leigusamning**, **Aðili sem fulltrúi kemur fram fyrir**. Invalid-date copy: **Dagsetningin er ekki gild. Leiðréttu hana eða hreinsaðu reitinn; drögin má áfram vista.**

Keep legal explanation out of routine capture. Optional help within Leigusamningur may say **Tilvísunin tengir drögin við samning en staðfestir ekki að niðurstöður hafi verið færðar í hann.** Keep the existing rental draft limitation in review: **Þetta eru drög að grunnskráningu, ekki fullbúin leiguúttekt.**

## 5. Upplýsingar arrangement

Recommended order and default disclosure state:

```text
Upplýsingar → Rými → Skráning → Yfirferð       (unchanged)

Skráning og eign                             existing common fields
Skoðun og skráningaraðili                    existing date/name/role
Íbúðarleiga                                 only active rental context
  Leigusali                                 compact name input
  Leigjandi                                 compact name input
  Hvað er leigt?                            short textarea
  ▸ Leigusamningur · [association status]
  ▸ Fasteignanúmer og afmörkun · Valfrjálst
  ▸ Fyrirsvar                               conditional/optional
  ▸ Afhending og húsgögn · [existing status]
Umfang og takmarkanir                        what was actually inspected
▸ Aðrar athugasemdir                         common notes
[Velja rými]                                existing navigation/save status
```

The rental panel is an ordinary section, not an additional workflow step or modal. Only three new inputs are exposed initially. Use textareas that start compact and grow for multiple party names and prose. The lease disclosure can stay closed with a visible missing badge; correction links open it directly. Keep sibling disclosures independent, with their current state preserved while typing. Do not auto-collapse them after each saved edit.

Move the existing `deliveryDate`/`furnished` controls into **Afhending og húsgögn** rather than retaining a second open handover form. Preserve their current conditional requirements. Give its closed summary the relevant missing count. Keep general `notes` in the common optional disclosure; they are not rental data. Each existing control is rendered once.

For standalone or unknown context, show no new panel when there is no retained content. If rental fields or existing handover/furniture values are retained, show one closed **Varðveittar leiguupplýsingar · skoða og breyta** disclosure with **Valfrjálsar upplýsingar í þessu samhengi.** Opening permits viewing, editing and explicit clearing, with no rental required marks, missing counts or readiness penalty. Unknown extension-only content gets a passive **Önnur varðveitt gögn** notice; preserve it opaquely without a generic data editor or destructive reset.

Maintain distinct headings and hints for **Hvað er leigt?** versus **Hvað var skoðað?** The user may describe different extents. Do not offer a checkbox that treats them as identical or copy selected rooms automatically.

| Alternative | Tradeoff | Recommendation |
| --- | --- | --- |
| All rental fields appended and expanded | Easy to scan on desktop; substantial mobile form length and repeated handover section. | Reject. |
| Entire rental section collapsed initially | Shortest screen; hides essential party/extent inputs and makes missing information easy to miss. | Reserve for retained information outside rental context. |
| Fifth workflow step | Separates a future large lease/participant workflow; adds navigation and progress complexity for this small slice. | Defer; three visible inputs plus disclosures fit the existing flow. |

Use current Manrope typography, white panels, petrol ink `#172f40`, teal `#17635d`, paper `#f3f6f5` and focus `#006b7a`. Match existing spacing and restrained warning treatment. No new dashboard cards, gradients, status scores or decorative legal badges.

## 6. Yfirferð and correction navigation

Add a compact **Íbúðarleiga** summary after **Skoðun og umfang** and before rooms. Show names, rented description and lease association; disclose optional property/extent/representation details without truncating entered text. With recorder-source representation, resolve the displayed name read-only and label it self-declared. Party names do not establish attendance, agreement or approval.

In the attention area, keep **Grunnupplýsingar vantar** for existing common issues and add **Leiguupplýsingar vantar** for applicable new minimums. Show malformed supplied dates and inconsistent representation separately as **Leiguupplýsingar til að yfirfara**. Missing optional values display **Óskráð** in their relevant detail view, without becoming required tasks. An association with neither date nor reference produces one missing issue, not two.

Readiness is derived, never persisted. Rental metadata can add to the overall attention state, but must not change `reportStats`, `roomStats`, item completion, room progress or `reportStatus`/`sampleReviewed`. When information is supplied, say **Leiguupplýsingar skráðar**, never fullgild, samþykkt or löglega lokið. Existing fire/meter/execution limits still apply even with every new field filled.

Outside rental context, show retained values in a neutral optional disclosure, including malformed strings, with a correction action. They do not generate rental attention/readiness issues. Viewing and following correction links never writes data.

Extend the allowlisted correction targets to `DetailField | RentalFieldId`; keep existing flat detail targets and URLs working. A rental link opens **all** containing disclosures, then focuses the exact input after hydration. Current `closest("details")` handling is insufficient for nested retained groups. Lease-group missing links focus `rentalLeaseReference`; date errors focus `rentalLeaseDate`.

Use a fixed, allowlisted return to `#review-rental-details` for rental corrections; keep `#review-core-details` for existing corrections. Reload/back navigation must retain the intended target. Reject duplicate/unknown query parameters and external return destinations as today. Do not refocus or scroll while the user types. UI focus/disclosure state is not report data.

## 7. Persistence, compatibility and preservation

Keep `astandsskraning-demo-v1` and `{ version: 1, reports }`. No migration, bulk rewrite or version bump is needed for optional additions. Old loaders already allow unknown detail keys, so they can carry this object through ordinary spread-based edits; that is not a guarantee about every older client or concurrent tab.

| Concern | Required implementation behavior after approval |
| --- | --- |
| Existing v1 and Phase 1B.3b.1 reports | Accept missing rental object, empty object, missing representation and missing optional members. Use render-time fallbacks; do not persist defaults. Missing rental minimums are readiness issues only in active rental context. |
| Structural validation | Extend `isReportList` with optional plain-object/string/enum checks at the two new object levels. Null, arrays, wrong scalar types and unsupported known enums follow the existing protected read-error path; no cleanup or selective dropping. |
| Semantics versus storage validity | Calendar-invalid strings and unknown identifier text remain loadable/saveable drafts. Presence requirements are derived outside the storage validator and never make an incomplete draft structurally invalid. |
| Newly reserved key collision | An older arbitrary extension already named `rentalInformation` with an incompatible shape becomes protected unreadable data, not an excuse to overwrite it. Report the issue; repair/replacement still needs a separate decision. |
| Extension data | Preserve unknown JSON keys at envelope, report, details, rental, representation, room, item and observation levels. Patch using spreads at every changed ancestor; do not serialize a whitelist of known fields. Inactive alternative names/prose remain stored. |
| Existing envelope gap | `DemoStore.persist` currently reconstructs only `{ version: 1, reports }`, losing unknown envelope keys on an edit. Include a narrowly scoped fix: retain the validated parsed envelope and spread it when writing, explicitly overriding `version` and `reports` last. Preserve this retained envelope across failed writes/retries. Hydration still performs zero writes. |
| Explicit edits | A real report edit changes its selected field and existing `updatedAt` only, preserving unrelated reports and all unrelated values. Serialization formatting need not be byte-identical after edits. Explicit clear writes `""` to that field; never deletes the whole object or other branches. |
| Non-mutating reads | Hydrate, readiness, review, route correction, disclosure changes and derived representative names must leave stored bytes, report values and timestamps unchanged. |
| Context/role/source changes | Retain all rental values, handover/furniture, inactive representative name and extensions. Only update the explicitly selected context/role/source. On return to rental, re-evaluate existing values rather than reset or populate them. |
| Recovery | Preserve all-or-nothing loading, raw unreadable bytes, locked fallback edits, retry protections and rejection of structurally invalid mutations. Do not add reset, repair, replacement or partial-load behavior. |
| Existing limits | Preserve 500 reports, 100 rooms/report and 100 items/room, quota/write-error behavior, in-memory pending edits and successful-save reporting only after a successful write. |

Storage remains synchronous, local to one browser/origin, with whole-document writes and no cross-tab conflict resolution, private shared access, server backup or durable evidence. Browser clearing/eviction or an older writer can still lose data. Photos remain session-only previews and disappear on reload. Preserve the current concise save-status guidance; no new guarantees, backend, authentication or database.

## 8. Likely application and test files

This is a future change map, not authorization to edit these files now.

| File | Planned responsibility |
| --- | --- |
| `src/lib/model.ts` | Optional types/member, structural validation; retain existing metadata and observation semantics. |
| `src/lib/rental-information.ts` — new | Pure relevance/readiness helpers, rental correction IDs and read-only representative display resolution. Keep these separate from room statistics. |
| `src/lib/locale/is.ts` | Approved Icelandic labels, issue messages and contextual hints. |
| `src/components/screens/details-screen.tsx` | Integrate compact conditional panel and move existing handover controls without duplicating them. |
| `src/components/rental-information-fields.tsx` — new | Rental controls/disclosures and safe nested field patches. |
| `src/components/screens/review-screen.tsx` | Separate rental attention/missing groups and neutral retained-data behavior. |
| `src/components/rental-information-summary.tsx` — new | Read-only rental/retained summary and rental return-focus anchor. |
| `src/components/use-details-correction.ts` | Extend allowlist, open ancestor disclosures and support fixed rental return anchor. |
| `src/components/demo-provider.tsx` | Preserve envelope extension keys across edits/retries; maintain protections. |
| `src/app/globals.css` | Small styles scoped to new panel/review, reusing existing tokens. |
| `tests/rental-information-fixtures.ts` — new | Literal pre-extension v1, Phase 1B.3b.1 and rental cases; no new defaults disguised as legacy fixtures. |
| `tests/rental-information-compatibility.spec.ts` — new | Storage/readiness/preservation cases below. |
| `tests/rental-information-capture.spec.ts` — new | Capture, review, correction and accessibility flows below. |
| Existing `tests/inspection-core-{capture,compatibility}.spec.ts` and `tests/local-data-safety.spec.ts` | Retain regression coverage; adjust only intentional placement/copy assertions and extend envelope checks where appropriate. |

No planned change to routes, four-step navigation, room/checklist templates, observation enums, evidence storage, dependencies or approved `docs/design/`, `docs/research/` and `docs/phase-1b3/design/` assets. Shared Field/UI components need no redesign; use existing optional/nonblocking-required treatment.

## 9. Accessibility and mobile acceptance

Target [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/); automated results alone do not establish conformance.

- Reflow at 320, 360, 390, 768 and 1440 CSS px with long Icelandic names/prose; verify 200% text and 400% browser zoom without loss or horizontal page scrolling.
- Label every input; use legends for grouped choices and native disclosure semantics. Required marks mean **Má fylla út síðar**, with no draft-blocking browser validation.
- Keep visible keyboard focus, logical tab order and focus clear of sticky content. Correction links open hidden ancestors and focus the named field.
- Use at least 44 px interactive targets as a product standard, exceeding WCAG's 24 px minimum. Keep disclosure summaries and correction links easy to activate.
- Maintain text contrast of 4.5:1, or 3:1 for qualifying large text, and 3:1 for relevant non-text boundaries/states. Pair warning color with text.
- Associate errors/hints programmatically, expose expanded state and preserve `lang="is"`. Announce save failures politely; avoid repetitive per-keystroke announcements.
- Verify keyboard-only and a real screen-reader correction flow, including name-source selection, unknown states and retained data. No hover-only guidance, automatic focus theft or hidden required controls.

## 10. Regression and end-to-end plan

After implementation approval, run the new focused Playwright specs, then `npm run typecheck`, `npm run lint`, `npm run build` and the full `npm test` suite. Do not claim these have run for this planning task. Use isolated browser storage and synthetic data throughout.

| Area | Cases and required evidence |
| --- | --- |
| Relevance/readiness | Cross absent/empty/standalone/rental contexts with absent/initial/final/independent type. No rental issues outside rental; each minimum missing case; date-only/reference-only/both/neither; optional blanks excluded; room statistics/status identical. |
| Representation | Role alone never fills any field. Recorder-source resolves only after selection; other-source needs a name; missing represented party visible. Source/role changes preserve alternatives; contradictory role/source gives a correctable warning. Changing recorder name updates its explicit live reference only. |
| Dates/identifiers | Leap days, impossible dates, malformed strings, future lease date, date-order differences, whitespace, leading zeros/prefixes/formatting and arbitrary lease references. No registry-verification claim or automatic normalization. |
| V1 compatibility | Literal pre-1B.3b.1 and current 1B.3b.1 documents hydrate unchanged. Missing/empty rental objects work. Read/review/focus/disclosure leave raw bytes and timestamps identical. One field edit and reload preserve every unrelated value. |
| Extensions/recovery | Seed unknown envelope/report/detail/rental/representation/room/item/observation keys. Preserve them through edits, context/source changes, failed write and retry. Wrong known shapes/enums, malformed JSON, unsupported version and reserved-key collision lock raw data; fallback edits/create/retry never replace it. |
| Store limits/failures | Existing 499→500/501 and over-limit read protections. Simulated quota and blocked storage: complete pending rental edits remain in memory and retry saves exactly those values plus extensions. |
| Main capture flow | Create draft → choose rental → enter parties, rented extent and association → keep distinct inspection scope → select rooms → record an item → review → correct a rental field → return → reload. Existing observations/evidence associations remain intact. |
| Retained-context flow | Fill every rental field plus old handover/furniture, switch rental→standalone→unknown→rental, reload between switches and edit retained values. No erasure, required badges or rental penalties outside rental context; ordinary notes stay accessible. Empty standalone adds no rental form. |
| Correction/navigation | Every new target, including nested retained disclosures, opens and focuses after reload; typing keeps focus. Test old targets, fixed return anchors, back navigation, unknown/duplicated targets and attempted external return values. |
| Presentation/accessibility | Test the width/text/zoom matrix, long multiline values, keyboard disclosures, invalid-date text fallback and axe WCAG 2.2 tags. Manually verify screen-reader reading order and focus. Capture rental empty/filled/representation/retained states with existing petrol/teal styling. |
| Existing behavior | Run checklist, navigation, evidence, local-data-safety, report register, sample read-only and core-capture regressions. Preserve inactive evidence/prose, all existing progress meanings, temporary-photo disclosures and approved Concept C assets. |

## 11. Boundaries and decisions before coding

**Safe to implement after approval:** the proposed optional rental object; existing property/date/recorder reuse; unverified party names; distinct rented extent; either-date-or-reference association; optional property number/areas; one explicitly declared representative; conditional review/correction; additive validation and the scoped envelope-preservation fix.

**Recommend deferring recording mode in this slice.** A three-state user declaration could be represented truthfully, but adds little to these factual fields and can be confused with attendance or agreement. Do not add a mode field/enum now. Names and recorder role must not generate “parties together” or “one party only” claims. Concept C participation remains unknown. Reconsider a declared mode separately when its use in review is defined.

**Defer pending legal clarification:** stronger declaration/compliance claims, obligatory identifiers on a formal declaration, annex incorporation, historical-law applicability and authority sufficiency (audit L-Q1/L-Q4/L-Q5/L-Q7). **Defer to future workflows/infrastructure:** agreed examiner, verified attendance/identity/authority, participant-controlled submissions, approval, signatures, notices, execution/copies and frozen issued versions. Ordinary factual capture does not require those questions to be resolved first.

Fire observations, heating changes, meters, keys, inventory, permanent photos, HMS integration, payments and production PDF generation are separate phases. Filling this panel must not hide those limitations or imply a completed rental-inspection package.

Approve or amend these five product decisions before a separate implementation instruction:

1. **Minimum:** landlord names, tenant names, rented-premises description and either lease date or reference are rental product-readiness minimums; every draft remains saveable.
2. **Arrangement:** three visible new inputs, secondary disclosures, handover controls integrated once, and optional retained-data access outside rental context; no fifth step.
3. **Representation:** one user-declared representative for one party, an explicit recorder-name reference, optional basis, no verification and no recording-mode field.
4. **Contract:** the optional nested types above, unchanged v1, no automatic population/migration, with the narrow envelope-extension preservation fix included.
5. **Boundary:** draft factual context only; optional raw property number, no new personal identifiers/contacts, no formal legal completion or Concept C design change.

Planning verification: all 385 baseline files remain SHA-256 identical; tracked and staged diffs are empty; local document links resolve. Application tests were not run because this task changes only this specification.

**Stop here for owner approval. No production code, schema, persistence, tests or approved design assets have been modified; no commit, push, merge or deployment is part of this task.**
