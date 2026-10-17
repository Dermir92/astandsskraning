# Recommended Phase 1B.3b implementation scope

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

**Proposal only, pending final design approval and a separate implementation instruction.**

Implement a **read-only Concept C draft report preview** for the existing residential inspection. Its purpose is to let a landlord or tenant understand the complete current record, including gaps, without having taken part in the inspection. It must not imply an issued or legally accepted report.

## Included in a bounded implementation

1. **Define and approve the presentation contract first.** Map the existing report, room, item and observation model through an adapter, with explicit unknown/applicability handling. Reuse existing completion/attention/deviation rules. Exclude inactive retained defect descriptions from current findings. Preserve item IDs and source associations; do not mutate a report by opening its preview.
2. **Use the approved Concept C composition.** First-page identity/overview/limitations, a size-appropriate reading guide, complete room observations with local photographs, optional handover information only when supplied, honest participation/unknown state and an evidence index. Typography and image size stay readable as records grow.
3. **Implement robust variable-length layout.** Use the design experiment to specify behaviors, not as a production library to copy unchanged. Preserve text and images, keep caption/context with each photograph, repeat identity and continuation labels, avoid lonely headings and define behavior for very long individual paragraphs. No fixed report page count or shrinking-to-fit.
4. **Keep the current evidence boundary truthful.** The existing application has temporary image previews. A preview may show those while the session lasts, with a clear disclosure. Reload-lost or unavailable images remain missing; no “permanently saved” or verified-provenance claim.
5. **Keep the preview read only and accessible.** Provide logical reading order, semantic labels, keyboard navigation and full-image access without losing context. Test phone reflow, text enlargement, real assistive technology and actual A4 output. Preserve the current precise review-to-editor correction behavior rather than creating a second editing workflow inside the report.

## Metadata: a separately approved part of 1B.3b

The existing model cannot produce an attributable professional report by itself. Approve a small capture/schema change explicitly before implementing it: actual inspection date, recorder display name and scope/limitations, reusing the existing creator role. Keep all three unknown in an incomplete draft; do not backfill from `updatedAt`, a handover date or a logged-in display name without the appropriate contract.

If that change is excluded from the initial slice, ship only the draft preview with honest **Óskráð** labels. Do not invent values to make the page look finished. Inspection time/range and attendance remain optional. Keys/meters are optional modules and should wait until there is a clear user need and approved capture design.

## Explicitly excluded

- Issued/finalized reports, legally binding completion or signatures.
- Participant invitations, OTP, approval/dispute submissions or inference from silence.
- Authentication/backend, private permanent photo storage and provenance verification.
- A production PDF export/generator or payment flow. Browser-native print diagnostics in this design task are not authorization to build that feature.
- Initial/final comparison, liability or damage-causation logic, automatic positive answers, broad checklist redesign or changes to Concepts A/B.

## Acceptance evidence

- Previewing leaves serialized report bytes, assessment values, timestamps, storage keys, photos and inspection-navigation metadata unchanged.
- Complete, incomplete, N/A, normal wear, cleaning-only, defect and untested cases match the existing model; missing required subsidiary answers never appear as “not applicable”.
- The 84-item / 23-image fixture and a long-prose/unavailable-file case preserve every description and association. Add boundary examples approaching 100 items and 40 photographs when the production adapter is implemented, rather than treating this single fixture as comprehensive load coverage.
- 360, 390, 768 and 1440 px, text enlargement, keyboard/screen-reader tasks, Safari/Firefox/Chrome, native A4 pagination and physical print are verified with the production implementation.
- No field claims finalized status, verified authorship, permanent evidence or participant acceptance until the corresponding infrastructure exists and is explicitly in scope.

Choose this as a bounded draft-preview phase; durable evidence, version snapshots, participant submissions and a professional PDF export then receive their own contracts and acceptance criteria.
