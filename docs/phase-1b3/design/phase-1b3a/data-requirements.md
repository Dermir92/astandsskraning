# Product review and report data requirements

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

Inspected sanitized `main`, commit `2313f55` (full ID recorded in README). Research/prototypes only; no schema changes are proposed as implemented.

## Product evidence

- [`PRODUCT_DECISIONS.md`](../../../PRODUCT_DECISIONS.md): explicit choices; three assessment dimensions; no liability engine; no-response is not acceptance; durable evidence and formal participant review remain future requirements.
- [`astandsskraning-mvp-v1.md`](../../../astandsskraning-mvp-v1.md): asset/case/inspection distinction, initial/final/independent types, optional handover information and future versioned reports. This is direction, not proof of implementation.
- [`src/lib/model.ts`](../../../../src/lib/model.ts): actual `Report`, `ApartmentDetails`, `Room`, `ChecklistItem`, `Observation`, completion/attention/deviation functions and status derivation.
- [`PHASE_1B2A_INSPECTION_CHECKLIST.md`](../../../PHASE_1B2A_INSPECTION_CHECKLIST.md), [`PHASE_1B2B_INSPECTION_NAVIGATION.md`](../../../PHASE_1B2B_INSPECTION_NAVIGATION.md), [`PHASE_1B2C_EVIDENCE_REVIEW.md`](../../../PHASE_1B2C_EVIDENCE_REVIEW.md), and current inspection/review/editor/gallery/store code: compact Concept B checklist, explicit condition controls, separate required subsidiary answers, exact correction destinations, temporary photos, neutral notes and retained inactive descriptions.

The approved **inspection checklist Concept B** is unrelated to choosing **report concept B** here. No checklist redesign is requested or performed.

The current review correctly surfaces missing details, unanswered/attention items, missing room overviews, missing damage photos, findings and notes. It includes optional photographs for satisfactory and unanswered items. It is a mutable draft correction screen, with editor/return links, not a standalone immutable report. Its navigation metadata describes UI position, not evidence history.

`observationComplete` means the required fields are answered. It can count explicit “uninspected” or “untested” as recorded. `needsAttention` separately identifies incomplete/uninspected/untested observations. `roomStats.deviations` counts an item once if it requires defect details or cleaning. Photos neither satisfy nor change those answer statistics. A report renderer must not turn “recorded” into “satisfactory”, “fully inspected”, “reviewed” or “signed”.

## A–D classification

**A** stored in current report JSON; **B** reliably derived from existing data, without claiming historical immutability; **C** absent information requiring user input; **D** future infrastructure/workflows. Temporary in-memory photos are explicitly distinguished from stored report data.

| Report information | Class | Actual source or requirement |
| --- | --- | --- |
| Property address, postal code, municipality, unit, furnishing | A | `Report.details`; missing values stay “Óskráð”, not inferred. |
| Initial/final/independent type | A | `details.inspectionType`; no linked lifecycle exists. |
| Creator's role | A | `details.role`; **not a person's identity**. |
| Handover/return date | A | `details.deliveryDate`; not an actual visit date. |
| Actual inspection date; optional time/range | C | New explicit visit date; time only if useful. Never substitute `updatedAt` or handover date. |
| Inspector/recorder's display name and capacity | C | Minimum attributable self-declared name/role. No mandatory qualification number or national ID. |
| Verified author identity/organization | D | Authentication and attributable write records; a typed name does not establish verified identity. |
| Rooms, room names/order, checklist items and IDs | A | `rooms[]`, item flags and IDs. Custom room names preserved. |
| Condition, functionality and cleanliness | A | Separate optional fields on `Observation`. No positive defaults. |
| Current defect type/location/description and neutral note | A | Existing strings. Only active `requiresDamage` data may become current defect details. |
| Inactive retained defect description | A / B | Stored strings, but `hasRetainedDefect` identifies inactive context. Exclude from current finding summaries; not a historical finding or proof of chronology. |
| Recorded, unanswered, attention and deviation counts | B | Existing helpers, with clear labels and denominators. Do not sum overlapping sets. |
| Room summaries / “mostly satisfactory” | B, bounded | Derive counts/factual text from explicit answers. No safety score, liability or unqualified whole-property verdict. |
| Inspection scope, access limitations, test methods | C | Short structured scope plus optional per-item limitations/reason. Existing notes can hold text but provide no reliable typed scope. Unknown remains unknown. |
| Reason an item was not inspected/tested | C | Can be entered as a note today; no required typed reason exists. Recommend a light optional reason prompt; do not fabricate. |
| Report/room/item references for a draft rendering | B | Map `Report.id + Room.id + ChecklistItem.id` to labels. Item IDs alone repeat between rooms. Sorting must not change an existing published reference. |
| Frozen finding refs, version identity and issue time | D | A version snapshot and stable reference mapping, not mutable array positions or `updatedAt`. Generate internally; no user input needed. |
| Preview photo name, ID, target and URL | Temporary, not A | `PreviewPhoto {id,url,name}` in `DemoStore.snapshot.photos`, keyed to report/room/item or overview. No photo bytes, media records or references persist in report JSON. |
| Durable photo references, originals and provenance | D | Private media storage, immutable media IDs, checksums, contributor, upload time, claimed capture time/source, status, failures and uncertainty. A filename is not a capture date. |
| Missing image in the present session | B, bounded | Can detect no current preview at a known target. Cannot distinguish never supplied, lost on reload, deleted or failed historical upload. Say unavailable, not a guessed cause. |
| Physical presence of landlord/tenant | C | Separate self-declared attendance, absence or unknown, independent of review. Optional participant identities only when needed. |
| Invitations, submitted review, disputes and signatures | D | Participant workflow and version binding; never derive from a visit, viewing, local comments or `sampleReviewed`. |
| Mutable draft / active status | B | `reportStatus` reflects current answers. `sampleReviewed` is a synthetic fixture flag, not proof of review. |
| Completion / finalization / amendment history | D | No finalization model or immutable history exists. Until then, label report outputs as drafts and disclose gaps. |
| Keys, access cards, meter readings and handover items | C | Optional new structured input if within scope. Do not parse free notes into verified handover facts. |
| Comparison to a prior inspection | D, outside phase | Needs linked inspections and comparable evidence. No current-image “before/after” assumptions. |

## Minimum additional input, after approval

For a useful attributable standalone draft: **recorder's name/capacity, actual inspection date, and a short explicit scope with limitations**. Reuse the existing role and notes where appropriate; do not add mandatory organization, license, email, national ID, property area, contract scan or participant account fields. Prompt for a reason when something was not accessed/tested, but permit “reason not recorded” and saveable drafts.

Do not require a handover date for a purely standalone inspection merely to populate a report: it is optional for that purpose. Initial and final inspections should label their respective handover/return dates explicitly. Their actual visit dates remain separate. A final inspection without an initial baseline must state that comparison is unavailable. Full initial/final comparison remains outside this phase.

A trustworthy final report additionally depends on **D** capabilities: durable private photos, immutable snapshots, stable references, accountable authorship and truthful participant states. These are infrastructure prerequisites, not extra mandatory form fields. They must not be simulated by a name field or a drawn signature.

## How synthetic fields are used here

The fixture supplies a fictional recorder and a fictional visit date/time **to test their placement**, not to imply the current application captures them. All participants' attendance is “Ekki skráð”; counterparty review has not occurred; signatures are absent. All pages say draft/sample. Photo IDs M01–M03 and observation labels A01–A15 are design fixture references, not a new production reference scheme.

The two scenarios are separate fictional inspections at the same fictional address, not a timeline. “Að mestu í lagi” has zero recorded defects plus wear and gaps; “Nokkur frávik” has three unique affected items, one also needing cleaning. Each has 14/15 answer-complete items, three not fully examined items and one missing condition answer. The scenario with defects has a missing supporting photo for A09; both lack two room overviews. These limitations remain visible without claiming all evidence is permanently saved.
