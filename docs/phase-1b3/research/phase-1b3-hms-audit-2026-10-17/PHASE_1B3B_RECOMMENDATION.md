# Revised tightly scoped Phase 1B.3b recommendation

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

**Proposed scope only. Requires owner approval and a separate implementation instruction.** This document does not modify the earlier proposal or start implementation.

## Outcome

Deliver a **context-aware, attributable residential draft record and read-only Concept C preview**. Preserve the approved composition. Supply honest information needed for ordinary residential recording without claiming signed completion, technical certification, HMS endorsement or complete performance of lease law.

The previous three-field minimum (actual date, recorder, scope) remains useful but is not enough to describe an ordinary residential lease inspection. The new source audit justifies purpose gating, fire observations and lease association. The implementation should remain limited to those factual needs.

## Included, in a controlled sequence

1. **Approve the information contract.** Use [field catalogue F01-F04](FIELD_REQUIREMENTS.md) for the common core; retain existing address/unit/type/role and separate assessments. Clarify standalone versus lease context and app-state language. No generic “legally complete” state.
2. **Add only the common attribution capture.** Actual event date, recorder display name, explicit scope/limitations and residential use context. Unknown existing drafts remain unknown. Review the existing handover-date/furnished completeness requirements so they do not become irrelevant standalone blockers.
3. **Add a compact conditional rental information block.** Property number/leased extent where relevant, landlord/tenant names, lease date/reference; representation detail only if claimed. This is self-declared factual context, not verified appointment, identity or authority. Do not duplicate a whole lease or make national IDs universally required.
4. **Add the narrow residential fire-observation block.** Detector, extinguisher/service-label and visible exit/route observations, with explicit absent/not-examined/not-tested states. Document the capture semantics before changing enums. An observed count or test-button result never becomes a whole-property safety pass. Include a modest heating/visible-control observation as the specific identified template omission; do not redesign the entire room checklist or add all HMS grid cells.
5. **Handle conditional meters deliberately.** If rental handover support is included in the approved slice, use two applicability-aware rows for separate electricity/hot-water readings, units/date and useful meter identity. If deferred, disclose this missing support and do not present the output as a completed lease handover/lease inspection package. A general key/inventory module can wait.
6. **Build a read-only adapter into Concept C.** Map existing and newly approved data without mutation. Preserve all current answers/prose, inactive retained evidence treatment, room/item associations and temporary-image disclosures. Show lease/fire/participation omissions where relevant. Supply principal findings suitable for manual use in the lease inspection section; do not assert that a copied reference or attached PDF completes incorporation.
7. **Verify the new content at A4 and on small screens.** Keep the existing typography, photograph dimensions, internal reference rules and derivative-only image policy. Content may add pages; no arbitrary cap or reduction in type. The design harness is a reference, not a production renderer to copy unchanged.

This is the upper bound of the recommended residential draft slice. The owner may approve common capture plus preview first, but that narrower outcome must retain explicit rental/fire/meter gaps. It must not be relabeled a complete residential lease-inspection workflow.

## Excluded

- Examiner appointment/agreement workflow, verified attendance and participant-controlled objections.
- Authentication, invitations/OTP, protected participant access and private durable evidence storage.
- Signatures, legal execution, immutable issued versions and proof of distribution/receipt.
- Actual statutory notices, deadline calculators, legal claims, causation, compensation or liability decisions.
- Lease drafting, HMS registration/integration or automatic confirmation that findings are in a signed lease section.
- Automatic initial/final pairing, comparison of evidence or a general inventory/maintenance system.
- A production PDF generator/export feature or payment flow. Static design PDFs remain review artifacts.
- Other asset categories, new commercial/vehicle inspection rules or redesign of Concepts A/B/C.

Real signatures may eventually occur through an approved external paper/digital process; exclusion from this phase does not mean the law requires our future authentication stack specifically. It means the present application does not implement or verify that process.

## Approval gates before coding

| Gate | Required decision |
| --- | --- |
| Product boundary | Owner accepts draft-record/preview outcome and conditional rental requirements. |
| Data contract | Owner approves exact fields, relevance, unknown states, personal-data minimization and persistence implications. Schema changes need explicit authorization; this audit is not that authorization. |
| Compatibility | Plan versioned local-data validation/migration without silently replacing unreadable drafts. Existing raw data and design work must be preserved. |
| Legal copy | Approve narrowed no-response/notice wording. Leave disputed Art. 71/72 execution claims out until confirmed. |
| Fire wording | Confirm observation limits, safe prompts and no area-only sufficiency algorithm. Specialist/legal approval is needed for any stronger claim. |

## Acceptance criteria for a later implementation

- Previewing changes no serialized answers, timestamps, photo associations, local storage or navigation state.
- Standalone case requires no tenant, lease, national ID, key or meter merely to save or view its draft. Rental context does not silently bypass missing fire/lease information.
- Existing drafts remain readable and saveable, with unknown new metadata and safe migration behavior. No date/name/scope is guessed.
- Explicit absent equipment differs from N/A; not tested differs from working. No active fire or normal-wear answer implies certification or a legal conclusion.
- Relevant meter kinds/readings/dates are distinguished from handover date and from non-separate/unknown meter applicability.
- All existing source descriptions and available photos remain associated with intended items; unavailable media remain disclosed. No participant attendance/approval/signature or verified provenance appears without a supporting record.
- Cover findings and missing-information summary include applicable lease/fire gaps. Anonymous creator notes cannot be shown as authenticated counterparty statements.
- Existing 10-room/84-item/23-photo and long-description cases remain intact. Add synthetic cases for new fields, long party/property names, mixed representation, missing fire data, explicit absent devices, shared/unknown meters and missing baseline. Test a broader approximately 100-item/40-photo case in implementation.
- Verify native A4, repeated identification/page references, no local file-launch actions, image quality/size, mobile reflow, enlarged text, keyboard and real screen-reader reading order. Physical print and other browsers/viewers remain actual implementation checks, not claims completed by this source audit.
- No irreversible finalization, automatic legal notice, lease-registration success or statutory signature status is produced.

## Later priorities

**P0:** truthful scope/status/identity, conspicuous material gaps, separation of app review from legal notice effects. **P1:** factual rental identity, appropriate room/fixture/fire coverage, conditional meter/handover data, attributed remarks and attendance concepts. **P2:** richer inventory/keys, original HMS-code import, external baseline references and optional time/detail. **Future infrastructure:** authenticated participant records, secure originals/provenance, frozen versions, real execution and delivery.

The [questions for HMS and a lawyer](DECISIONS_AND_QUESTIONS.md) should be commissioned before claiming formal declaration/execution support. They need not prevent an explicitly limited draft preview from being designed and separately approved.

**Stop for owner approval. No implementation has begun.**
