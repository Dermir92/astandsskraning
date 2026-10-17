# Proposed capture and field requirements

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

**Proposal only. No schema or workflow was changed.** Legal/advisory bases are detailed in [the gap matrix](GAP_MATRIX.md) and [sources](SOURCES.md). Field names below describe information concepts, not an approved database schema.

## Mandatory does not mean blocking a draft

- **M:** proposed minimum for an attributable, adequately described condition record. This is a product-readiness rule, not a declaration that the Act prescribes this exact field.
- **C:** required only for the stated circumstance or claim; hide irrelevant inputs.
- **O:** optional improvement.
- **Future:** needs an approved identity/evidence/execution contract, not merely a text box.

Every draft can be saved with unknown values. Unknown is distinct from zero, not present, no objection, not applicable, not examined and declined. A recorded “not tested” answer can complete a form answer while preventing an assertion that the equipment was tested or found safe. The product currently has no legally finalized state; these proposals do not create one.

## Small common core

Reuse existing address/postal code/municipality/unit, inspection type, creator role and ordinary observation fields. The minimum proposed additions are **four information groups**:

1. **Residential use context:** standalone or connected to a residential lease. This controls relevance; it does not waive legal duties.
2. **Actual inspection date:** expressly supplied, separate from handover, lease, update and export dates.
3. **Recorder display name:** self-declared attribution, using existing role/capacity where adequate.
4. **Scope and limitations:** concise included/excluded premises and methods actually performed.

These remain unknown in old/incomplete drafts. Do not backfill from `updatedAt`, today's clock, a handover date, a filename or a logged-in profile. A statement selected from a scope prompt must be confirmed as true; default copy must not assert tests that never happened.

## Field catalogue

| ID | Proposed information | Why / source | Inspection contexts | Mandatory rule | Priority / dependency |
| --- | --- | --- | --- | --- | --- |
| F01 | Residential use context | Gates lease duties while protecting standalone use; L1 Arts. 1-2,69; D UX | All current residential records | M before applying purpose-specific readiness; unknown drafts allowed | P0 semantics / P1 capture |
| F02 | Actual inspection date | Attributable event; H3 p. 2, D documentation; distinguishes L1 Art. 69 event from lease date | Standalone, rental initial/final/other | M for attributable record; not required merely to save | P0 / Core |
| F03 | Recorder display name | A role is not a person; H3 p. 2, L1 Art. 69(5) context, D attribution | All | M for attributable record; self-declared label | P0 / Core |
| F04 | Scope, exclusions and test limitations | Detailed condition record and honest coverage; L1 Art. 71; D structure | All | M short statement for attributable report; per-item limitations C when known | P0 / Core |
| F05 | Property number; sufficiently precise unit/extent | L1 Art. 6(4) lease and Art. 71 identification | Rental; standalone when useful | C for lease/declaration package; O unrelated standalone. Existing address alone must not be described as registry-verified | P1 / Rental |
| F06 | Description of rented premises and included ancillary/shared use | L1 Art. 6(2),(4),71; H1 §2 | Rental | C when documenting a lease/declaration; can remain prose. Distinguish leased extent from inspected extent | P1 / Rental; reuse prose where practical |
| F07 | Landlord and tenant names | L1 Art. 71 identifies parties; Art. 6(1) identifies lease parties | Rental, especially declaration route | C for attributable lease/declaration package; never M unrelated standalone | P1 / Rental |
| F08 | Lease reference and lease date | L1 Art. 71; connects L1 Art. 69 initial results | Rental initial/final/other | C for formal declaration; reference useful whenever lease-linked. Lease date is not inspection date | P1 / Rental |
| F09 | Renewal/extension or older-lease context | L3 Art. 10, L4 Art. 20; J1 | Rental when asserting applicable historical requirements | C only if a cohort-sensitive legal claim is made; otherwise unknown/manual review. No requirement to implement a historical legal engine | P2 capture; P0 avoid unsupported claim |
| F10 | Party postal address / national ID / contact details | L1 Art. 6(1),(13) requires these in the **lease**; H1/H3 form fields | Lease preparation or formally agreed declaration format | C in lease, not universally mandatory in a separate report. Prefer reliable lease association over duplicating identifiers without need. Phone/email O unless used for a justified delivery workflow | P1 policy decision; future protected processing |
| F11 | Recording mode: own record, parties together, agreed examiner, unknown | Distinguishes standalone type from L1 Art. 69 examiner role | Rental; O for standalone | C when describing who performed inspection. Never infer joint/independent mode from creator role | P1 / Rental; declared status only |
| F12 | Representative name, represented party and stated authority basis | L1 Arts. 6(13),7,71 | Any represented rental participant | C if representation is claimed. No universal power-of-attorney upload or verified-authority label | P1 / Rental; verification future |
| F13 | Examiner name/capacity; requested/agreed/disputed appointment | L1 Art. 69(1),(3),71 | Requested/agreed examiner route | C to describe that route. Unknown/disputed cannot become “agreed.” No universal professional-license-number requirement established | P1 / formal-route gate; legal review |
| F14 | Attendance per party/representative; source of statement | L1 Art. 71 presence requirement in examiner route | Examiner-led rental; O elsewhere | C for claiming attended formal inspection. Separate self-report/transcription from participant-confirmed event; absence is not waiver | P1 data concept; verified participation future |
| F15 | Attributed remark/objection, target and requested remedy | L1 Arts. 71,16; H1/H2 separate remarks | Rental; optional invited input elsewhere | C when an objection exists; explicit “not recorded” if unknown. Actor, role, note, target and source required for an attributed entry. Do not silently transcribe as a party's own submission | P1 capture concept; participant-controlled submissions future |
| F16 | Supplied inventory: name, quantity, location, condition / discrepancy | L1 Arts. 14(3),63,71 | Rental with supplied items; optional standalone inventory | C where supplied inventory is part of the declaration/return; O elsewhere. Furniture flag does not replace inventory | P1 optional module; may follow 1B.3b |
| F17 | Fire section scope and explicit status | L1 Art. 69(1); R1; H1 §12.B | Residential rental; O standalone unless included in scope | C rental readiness: all selected fire prompts need an explicit answer/status. “Not examined” remains a visible limitation, not fulfillment of physical inspection duties | P0 missing-state rule; P1 capture |
| F18 | Detectors: found/not found/not examined; count/location; ordinary test performed and result/unknown | L1 Art. 14; R1 Art. 7; H1 fire section | Residential fire block | C when fire block applies; actual test result only if performed safely. Zero means observed none, not unanswered. Never infer adequate coverage from count/area alone | P1 / fire capture; specialist adequacy excluded |
| F19 | Extinguisher: presence/location/count; visible condition; readable service label date or unknown/illegible | R1 Art. 7(2); R3 Arts. 5-8 | Residential fire block | C explicit presence/observation status. Label date only if observed; professional-service validity not inferred. No discharge test requested | P1 / fire capture |
| F20 | Visible exit/escape-route obstruction and examination limit | R1 Art. 5; H1 §12.B | Residential fire block | C explicit observed/not-examined status. Do not claim building-wide egress compliance | P1 / fire capture |
| F21 | Blanket and other relevant optional safety observations | H1/H2 optional blanket and grid prompts | If present/relevant | O; not a universal checklist mandate from the reviewed form | P2 |
| F22 | Meter applicability by kind; number, value, unit, reading date | L1 Art. 6(5); H1 §6 | Rental handover, separate electricity/hot-water meters; O elsewhere | C value/date where legally relevant; number is practical identification/form guidance. No reading if no separate meter; unknown does not mean shared meter. Photo O | P1 / conditional handover module |
| F23 | Access device type/count, transfer context/date and discrepancies | L1 Art. 67 conditional return; D handover practice | Rental handover/return or requested standalone module | C all keys if changed locks must be returned; count fields otherwise O. Do not capture secret codes or imply verified receipt | P1 useful module / can defer |
| F24 | Earlier inspection/document reference or explicit baseline absent | L1 Art. 63 relevance; D linking | Final/comparison records | C if comparing. A factual final record may proceed without baseline with clear limit; no invented earlier condition | P1 external reference; automatic pairing P2/future |
| F25 | Forwarding/notice address or pointer to separately supplied address | L1 Art. 68 | Tenant moving out | C legal communication duty; not universal app field. Scope whether app merely notes an address or actually communicates it | P2 capture; delivery future |
| F26 | Signature/version/receipt/provenance event records | L1 Arts. 13,72; product privacy/history decisions | Actual formal execution or secure evidence service | Future; based on real events, not creator-editable “signed/approved” toggles | Future infrastructure + lawyer-approved contract |

For fire observations, a presence dimension cannot safely be disguised as condition N/A. Existing room answer enums do not fully express all proposed presence/count/service facts. Approve a small capture contract before implementation; do not smuggle new semantics into existing values merely to avoid a schema discussion. The rest of the residential template should remain unchanged except justified omissions such as heating.

**Meter and event-date precision:** Art. 6(5)'s express meter requirement concerns the lease's readings at initial delivery. End-of-term readings are useful product/contract practice, not a universal additional mandate established by that paragraph. Keep any actual return/handover event date distinct from a planned date and the actual inspection date. The existing `deliveryDate` does not establish which event happened or prove it; do not calculate or assert compliance with notice deadlines from it.

## Avoid unnecessary administration

Suggested flow is: identify purpose/property/date/recorder; select rooms; record condition and the relevant short fire block; show handover/inventory modules only if applicable; review missing information and the complete draft. Keep lease details in one compact conditional section. Reuse a reliably associated lease's identity information when a future integration permits it, rather than asking users to enter the whole lease twice.

Existing `deliveryDate` and `furnished` completeness rules should be reviewed in context: a standalone property observation need not involve handover or supplied furniture. Removing irrelevant requirements is a proposed later workflow change, not an action taken in this audit.

## Readiness examples

| Example | Proposed requirements / honest result |
| --- | --- |
| Owner's standalone condition record | Common attribution and scope; no compulsory tenant, lease, meters, keys or signatures. If fire protection is excluded, say so without a safety conclusion. |
| Joint residential move-in | Common core, lease/party/property association, supplied fixtures, explicit fire observations and relevant separate meter/date data. A complete draft remains distinct from a signed/legally executed declaration and lease-section entry. |
| Residential move-out without baseline | Common core plus rental context, return findings and relevant handover information. Explicit absence of baseline; no inferred new damage, fault or liability. |
| Agreed examiner's declaration | Requires the relevant Art. 71/72 route, real appointment/attendance/remarks/execution/copies. This is **not supported merely by the recommended draft-preview phase**. |
| Draft with no visit yet | No actual inspection date or claim of performed inspection. Permit saving and show unknown/not-yet-recorded information; no fabricated timestamp or completed status. |

No vehicle, commercial, garage-asset or storage-asset workflow is added. A storage room within the current residential inspection remains within existing scope.
