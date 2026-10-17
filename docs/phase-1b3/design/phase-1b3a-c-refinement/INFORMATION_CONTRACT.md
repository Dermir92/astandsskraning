# Concept C information contract

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

17 October 2026. This audits the refined isolated prototype against production [`src/lib/model.ts`](../../../../src/lib/model.ts), [`DemoStore`](../../../../src/components/demo-provider.tsx), the current review/editor/gallery, [`PRODUCT_DECISIONS.md`](../../../PRODUCT_DECISIONS.md) and the [Phase 1B.2c evidence implementation](../../../PHASE_1B2C_EVIDENCE_REVIEW.md). No production schema or persistence change is made.

**A = existing report fields. B = reliable presentation derivation. C = proposed additional capture. D = future infrastructure/workflow.** “Available” distinguishes persistent report JSON from temporary photo previews. Synthetic fixture values are never evidence that production captures a field.

| Displayed information | Class | Exact contract / refined behavior |
| --- | --- | --- |
| Address, postcode, municipality and unit | A | `Report.details.address/postalCode/municipality/unit`. Values in this prototype are fictional. An absent real value must remain unknown. |
| Asset and inspection type | A | `assetType`, `details.inspectionType`. This fixture is independent. Initial, final and independent remain distinct; final without baseline does not become a comparison. |
| Furniture and creator capacity | A | `details.furnished`, `details.role`. The report displays the fictional representative role. A role does not identify a person. |
| Proposed handover date | A | `details.deliveryDate`, labelled **Áætluð afhending · sýnigildi**, not an actual visit timestamp. Current model calls it delivery date, not an inspection date. A standalone inspection need not imply a handover. |
| Actual inspection date / time | C | **Óskráður** / omitted throughout. No substitution of `updatedAt`, local clock, file timestamp or handover date. Time/range remains optional, even after date capture is added. |
| Recorder / inspector display name | C | **Óskráður**. A typed name/capacity would provide self-declared attribution; it would not prove identity or professional qualification. No fictional inspector is filled into this refinement. |
| Verified identity / organization / qualification | D | Not displayed as verified. Needs authenticated attribution or a separately justified verification workflow; no mandatory license or national ID is recommended. |
| Human-readable report reference | A / B / D | Current `Report.id` exists. `SÝNI-C-084` and other sample labels are fixed fixture IDs; readable labels can be derived for a draft. A frozen export/version reference is D. No issued-version number, signature seal or completion timestamp is invented. |
| Page numbers, reading guide, room-to-page destinations | B | Derived after layout. Recalculated when fixture/content changes. A page number is a locator in one rendering, not an immutable finding ID. |
| Room names/order/type and item names | A | `rooms[]`, `Room.items[]`. The synthetic 84-item list is design material, not a proposed production checklist update or validation against HMS. |
| Room/observation references | A / B / D | Existing `Report.id + Room.id + ChecklistItem.id` gives the proper compound association; item IDs repeat between rooms. Fixture `R01` / `A001` labels are stable within these synthetic examples only. Durable references across published versions require D. |
| Condition, function and cleanliness | A | Separate `Observation` values, interpreted with checklist applicability flags. “Ekki metin í liðnum” describes a dimension outside that item's checklist; “Óskráð” describes a missing requested answer. N/A overrides subsidiary display but does not delete retained data. |
| Defect type, location, description and neutral note | A | Existing `damageType`, `location`, `description`, `note`. Long descriptions are retained without truncation. Only active `requiresDamage` fields form current defect details; inactive retained descriptions must stay outside current findings. |
| Counts of affected, wear, unanswered and unexamined items | B | Count unique items within each set; sets may overlap. This prototype uses the existing deviation meaning (damage/defect/broken function/dirty), plus explicit unknown states. No property grade or whole-property assurance. Production integration must call or parity-test the existing helpers; the fixture functions are not a replacement model. |
| Draft / “skráning ófullgerð” | B, limited | Draft label is truthful for the isolated mutable sample. Incomplete answers and unknown identity/date are visible. `reportStatus` does not establish finalized/reviewed/signed status; `sampleReviewed` remains a synthetic marker. |
| Scope at report and room level | C | Fixture-supplied **proposed capture**, not reliably derivable from checklist presence. Item membership identifies which items exist, not that someone performed visual inspection or a particular test. Current free notes can carry prose, but no typed scope exists. |
| Access limitations and test method/reason | A / C | Existing notes can store an explicit statement; a structured reason/scope is C. Rendering cannot infer inaccessible areas, safety-test scope or reasons from silence. Missing reasons may remain unknown in drafts. |
| Photo filenames, preview URLs, IDs and target | Temporary, not persistent A | `PreviewPhoto {id,url,name}` exists only in the current session, associated with report/room/item or overview. Report JSON does not store media. Do not imply reload recovery or durable evidence. |
| Photograph captions / alt text | B / C | A safe context fallback can use room/item names (B). Semantic descriptions of visible content require actual supplied content/manual input (C), not confident inference from a filename. This prototype has explicit synthetic captions and alt text. |
| Photo numbers and item/room/page associations | B / D | M001–M023 are fixture-specific references, each rendered once with its caption. View-local numbering is B; immutable media IDs and published reference mapping are D. Never imply a capture chronology from numbering. |
| Original images, capture date, contributor, upload/verification status and provenance | D, with optional C claims | Packaged AI images are labelled **Tölvugerð sýnimynd · Ekki frá raunverulegri skoðun**. Real contributor/upload attribution, private originals and verified provenance require infrastructure. An explicitly user-claimed capture date could be C, but must be distinguished from system upload time and verified capture. Neither is fabricated here. |
| Missing supporting photo / unavailable file | B, bounded | No current attachment is detectable, but cannot reveal whether a past upload failed, was removed or was lost on reload. Stress fixture M018 explicitly has an unavailable asset; its reference and missing-image disclosure remain. No invented historical cause. |
| Presence / absence of landlord or tenant | C | **Ekki skráð**. Physical attendance is separate from review and approval. Never infer it from creator role. |
| Review, approval, disputes, signatures and finalization | D | **Ekki skráð; engin staðfesting liggur fyrir**. There is no verified review or finalization model. Reading is not acceptance; no response is not consent. No signature image, issue time or legally binding state is added. |
| Keys, quantities, meters, serials, readings and units | C | Optional new structured input. Sample keys/readings are visibly **sýnigildi**; handover is unconfirmed. Meter serial, reading date and supporting image stay missing. No national ID, contract scan or mandatory meter form. |
| Inspection comparison and cause / liability | D / excluded | No baseline is linked; no “before/after”, dating of defects or responsibility determination is produced. |

## Minimum additional capture

For an attributable professional report, the minimum new information is:

1. **Actual inspection date**, explicitly entered/confirmed; optional time only if useful.
2. **Recorder display name**, with the existing creator role reused. Distinguish self-declared name from verified identity.
3. **Explicit scope and limitations**, as a short editable statement, with optional per-item access/test reasons. A checked list does not establish what was physically examined.

Allow incomplete drafts and an honest unknown value. These become requirements for an attributable issued report later, not mandatory blockers on saving a draft. Do not require organization, qualification number, national ID, participant account, phone, email, keys or meter readings just to create a draft.

Attendance and optional handover details improve context when supplied; they are not minimum prerequisites for every standalone inspection. Durable media, participant submissions and frozen versions are **D dependencies**, not more form fields. A local text field must not be used to simulate them.

## Remaining contract questions for Phase 1B.3b

- Approve the exact scope/limitations structure and when unknown metadata blocks an **issued** report; drafts remain editable/saveable.
- Decide how draft IDs map to future immutable finding and image references.
- Preserve explicit applicability and incomplete subsidiary answers in the report adapter; never infer positive answers.
- Keep the current session-only evidence boundary visible until private durable media exists.
- Treat draft correction as current state, not evidence history. Exclude inactive retained defect descriptions from current summaries.
- Define an initial/final adapter separately; the independent sample must not silently promise a comparison.


## Final PDF review correction: media references

Source media IDs remain unchanged. Reader-facing M references are derived from first appearance in the generated report and are used consistently in captions and the image index. M006/M007/M008 now refer to kitchen cabinets/countertop/hood in reading order, mapped to source M008/M007/M006. This is reliably derived presentation information, not a new capture field, verified provenance, or a persistent media identifier. A future frozen report would need to retain its generated reference mapping. All nine recorded deviations are derived from existing explicit answers and now link directly from the cover. See [the correction review](PDF_REVIEW_CORRECTIONS.md).
