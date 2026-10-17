# Implemented product versus specification and Concept C

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

This is a source audit of the sanitized checkout, **not verification of a live production deployment**. “Implemented” below means present in `src/`. The code is a residential front-end draft workflow with local browser storage; it is not the full future SaaS described in the specification.

## Evidence register

| ID | Repository source and relevant lines | Verified behavior |
| --- | --- | --- |
| I01 | [model.ts](../../../../src/lib/model.ts), lines 1-58 and 66-101 | Asset enums include four categories. Observation separates condition/function/cleanliness and prose. Apartment details contain type, address, postal code, municipality, unit, creator role, delivery date, furnished flag and notes. Report has ID, update timestamp and sample marker. No lease/party/inspection-event/fire/handover/signature structures. |
| I02 | [model.ts](../../../../src/lib/model.ts), lines 110-208 | Six common room items plus room-specific additions. Initial five rooms total 46 items. Optional room creation exists. No dedicated heating item, smoke detector, extinguisher, escape route, meter or key item. |
| I03 | [model.ts](../../../../src/lib/model.ts), lines 210-294 | Defect/broken functionality requires type/location/description. Dirty cleanliness also counts as a deviation. N/A bypasses subsidiary completion. Uninspected/untested can be recorded answers but still require attention. Completion is not legal completion or an assurance of condition. |
| I04 | [demo-provider.tsx](../../../../src/components/demo-provider.tsx), lines 24-42, 65-94, 121-168, 191-221 | Text/report data persist in localStorage with validation and read-error safeguards. Changes update `updatedAt`; it is not an inspection timestamp. Photos remain a separate in-memory map keyed by report/room/item or overview. They are not serialized into report JSON. |
| I05 | [photo-preview.tsx](../../../../src/components/photo-preview.tsx), lines 25-58 and 66-92 | Decodes JPG/PNG/WebP previews; max eight photos per target, ten MB per file, no HEIC. Blob URLs and file names, no author/capture/upload provenance. Explicitly discloses loss on reload and no server upload. |
| I06 | [details-screen.tsx](../../../../src/components/screens/details-screen.tsx), lines 38-160; [new-report-screen.tsx](../../../../src/components/screens/new-report-screen.tsx), lines 17-75 | Residential-only creation. Details may remain incomplete. “Required for full registration” is UI/completion behavior; it is not statutory validation. Delivery date is currently requested even for the standalone type. |
| I07 | [rooms-screen.tsx](../../../../src/components/screens/rooms-screen.tsx), lines 12-57 and 102-140 | Add/rename/remove rooms, including named custom rooms. A custom room gets the standard common checklist. No arbitrary item-add UI was found. Generic notes/custom rooms therefore do not equal support for missing specialist items or inventory. |
| I08 | [observation-editor.tsx](../../../../src/components/observation-editor.tsx), lines 120-143, 302-410; [inspection-evidence.ts](../../../../src/lib/inspection-evidence.ts) | Explicit answers, N/A handling, active defect details, per-item notes/photos. Retained defect prose can remain after a change and is distinguished from active defect data. There is no submitted counterparty author or append-only correction history. |
| I09 | [review-screen.tsx](../../../../src/components/screens/review-screen.tsx), lines 40-70, 82-102 and ending review-scope/footer; [inspection-navigation.ts](../../../../src/lib/inspection-navigation.ts) | Local pre-review surfaces missing details/answers, absent overview and defect previews, untested items and routes back to the exact editor context. Drafts remain mutable. No invitations, participant submissions, signatures or finalization. A cleaning-only deviation does not trigger the same damage-description/photo requirement as a damage/broken-function response. |
| I10 | [locale/is.ts](../../../../src/lib/locale/is.ts), lines 74-83; [model.ts](../../../../src/lib/model.ts), lines 276-294 | `independent` is “Sjálfstæð skráning,” not verified statutory independence. `sampleReviewed` can produce a sample reviewed badge; it is fixture state, not a real party review. No authenticated identity is established by a role selector. |
| I11 | [PRODUCT_DECISIONS.md](../../../PRODUCT_DECISIONS.md) and [MVP specification](../../../astandsskraning-mvp-v1.md), especially §§2, 5, 8-10, 12 | Product direction includes private media, OTP access, independent counterparty remarks, frozen versions, keys/meters, visible fire observations and linked initial/final comparisons. These are specifications, not implemented capabilities. The spec's HMS reference is not validation of current form coverage. |
| I12 | [Concept C report](../../design/phase-1b3a-c-refinement/report.js), especially photo/overview/limitations/handover/index; [fixtures](../../design/phase-1b3a-c-refinement/fixtures.js), lines 56-63 | Isolated synthetic HTML and native-print diagnostics. The fixture has scope, unknown actual date/recorder, optional sample keys/meters and sample heating items that the app model/template does not supply. It has no dedicated fire section, lease parties or formal submission records. |
| I13 | [Concept C information contract](../../design/phase-1b3a-c-refinement/INFORMATION_CONTRACT.md), [prior Phase 1B.3b proposal](../../design/phase-1b3a-c-refinement/PHASE_1B3B_SCOPE.md), [PDF correction review](../../design/phase-1b3a-c-refinement/PDF_REVIEW_CORRECTIONS.md) | Correctly separates existing, derived, proposed capture and infrastructure. Prior minimum was inspection date, recorder and scope; this audit adds context-sensitive rental requirements. C's approved 25/29-page outputs remain untouched. |

## Actual template coverage

The common set is floor, walls, ceiling, windows, doors/locks and lights/switches. The table below counts default items, not a verified HMS completeness score.

| Room type | Item count | Added coverage / limitation |
| --- | ---: | --- |
| Entry | 7 | Closets |
| Living | 6 | Common items only |
| Bedroom | 7 | Closets |
| Kitchen | 14 | Cabinets, countertop, sink/tap, hob, oven, hood, refrigerator, dishwasher |
| Bathroom | 12 | Toilet, shower/bath, sink/tap, drain, ventilation, visible moisture |
| Laundry | 9 | Pipes/drain, washer, dryer |
| Storage | 7 | Visible moisture |
| Balcony | 5 | Floor/walls/door plus railing and drain; excludes common ceiling/window/light items |
| Custom room | 6 | Common checklist; its name does not add custom items |

Important partial coverage: electrical outlets are not separately captured; heating is absent from the implemented template despite appearing in Concept C's synthetic example; mirrors and separately supplied loose inventory lack dedicated records. Water/drain observations cover some fixtures but do not establish a complete pipe or potable-water assessment. The furnished flag does not list what was supplied and does not mean fitted equipment is absent when “no furniture” is selected.

## Existing / derived / proposed / infrastructure boundary

- **Existing:** property prose and identity fields above; creator role; explicit per-item answers, defect prose and notes; temporary linked previews; local edit and review navigation.
- **Reliably derived, within limits:** item/room/media display references, page numbers, counts of explicit answers and missing current attachments. Do not infer attendance, physical examination, chronology or permanently saved media from these counts.
- **Proposed capture:** actual event date, recorder name, scope, rental context/lease association, parties/representation, explicit fire observations, keys/meters/inventory and self-reported participation facts.
- **Future infrastructure:** authenticated identity/authorization, private durable originals, capture/upload provenance, participant-controlled submissions, notified objections, signed immutable versions, evidence of distribution and secure exports. None can be supplied merely by adding more text inputs.

No build, migration, application mutation or feature implementation was needed for this analysis.
