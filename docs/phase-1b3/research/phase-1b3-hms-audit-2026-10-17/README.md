# Phase 1B.3 - HMS and residential-inspection requirements audit

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

**Research only. Approved by the owner as the requirements-analysis baseline on 17 October 2026. Phase 1B.3b has not started.**

Concept C can remain the visual direction. Its hierarchy, complete room records, contextual evidence, limitations and reference structure are suitable foundations. The main gaps are the information captured and the meaning of report states, not a need for a new visual design. It is currently an honest synthetic draft prototype, not a complete statutory residential lease-inspection process.

## Read the deliverables

1. [Authoritative sources, applicable dates and form-version issues](SOURCES.md).
2. [Legal/HMS requirements comparison and Concept C assessment](LEGAL_AND_CONCEPT_C.md).
3. [Detailed field-by-field gap matrix](GAP_MATRIX.md) and [CSV version](gap-matrix.csv).
4. [Minimum capture changes and mandatory/conditional/optional field catalogue](FIELD_REQUIREMENTS.md).
5. [Owner decisions and questions for HMS / an Icelandic lawyer](DECISIONS_AND_QUESTIONS.md).
6. [Revised bounded Phase 1B.3b recommendation](PHASE_1B3B_RECOMMENDATION.md).
7. [Repository evidence and implemented-versus-planned inventory](PRODUCT_EVIDENCE.md).
8. [Publication scope and file inventory](../../FILES.md). Preservation and generated audit-package logs remain local.

## Principal findings

- **Fire protection is a substantive gap.** Current [Art. 69(1)](https://www.althingi.is/lagas/nuna/1994036.html) expressly includes it. The implemented residential templates and Concept C fixture have no dedicated smoke-detector, extinguisher or escape-route records. A general safety disclaimer cannot supply missing observations.
- **Lease context matters.** The initial findings belong in the lease's inspection section under current Art. 69(1); merely generating or attaching a separate PDF is not shown to satisfy that requirement. The app has no lease reference, lease date, rental-party records or associated-results mechanism.
- **Independent/standalone and impartial examiner are different concepts.** The existing `independent` type means “Sjálfstæð skráning.” It does not prove appointment of an agreed independent examiner under Art. 69.
- **Arts. 71-72 add a formal route that the product does not implement.** Agreed examiner, attendance/representation, detailed declaration, supplied fixtures, lease identity, signatures and copies require separate treatment. Article 70 is repealed. A checkbox or typed name cannot manufacture these events.
- **Meter readings are conditional rather than universally optional.** [Art. 6(5)](https://www.althingi.is/lagas/nuna/1994036.html) requires relevant separate electricity/hot-water readings and their reading date in the lease at handover. The Concept C handover panel is only synthetic; the application has no capture module.
- **Published forms are not conclusive law.** The current official index links a three-page extract from a lease; a legacy HMS page links a different two-page declaration. Published documents contain dated registration wording and cross-references. The exact layout and A-G grading are not established as mandatory software requirements. [Source verification](SOURCES.md).
- **Silence needs precise wording.** The app may truthfully say it does not record approval without an explicit response. It should not promise that silence never has legal consequences: [Art. 16](https://www.althingi.is/lagas/nuna/1994036.html) governs timely objections to premises condition. Existing Concept C wording should be narrowed in a separately authorized implementation.
- **The minimum three metadata fields remain useful, but are not the complete rental-workflow requirement.** Add context-sensitive rental metadata and a modest fire-observation block when the product is intended to support residential lease inspections. Keep standalone reports free of irrelevant lease administration.

## Classification and interpretation

| Class | Meaning |
| --- | --- |
| **A** | Binding requirement within the applicable residential rental/legal context. It is not automatically a mandatory field in this app. |
| **B** | Binding requirement triggered by circumstances: e.g. agreed examiner route, separate meters, a relevant lease cohort or changed locks. The trigger is specified in the matrix. |
| **C** | Official guidance, published form design or recommended practice. Publication alone does not establish compulsory use. |
| **D** | Our proposed product/UX/data decision or inference. “Mandatory for a complete report” is a proposed product rule, not an invented legal command. |

Priorities are separate from legal classification: **P0** prevents misleading or materially incomplete documentation; **P1** supports a credible residential workflow; **P2** can wait; **Future infrastructure** covers identity, controlled access, durable evidence, signatures and immutable versions. Drafts remain saveable at every stage.

This audit distinguishes explicit statutory text from interpretation. Older lease cohorts, the reach of Art. 72 outside an examiner-led inspection, electronic distribution of the three copies, and the sufficiency of a referenced annex need legal/HMS confirmation before related compliance claims. None is presented as resolved by this software.

## Recommended later implementation decision

Approve a **context-aware residential draft-capture and preview** scope, not a legally finalized inspection service. Reuse the existing checklist and correction flow. Propose four small common additions: residential use context, actual inspection date, recorder display name, and explicit scope/limitations. Add the justified rental-only identity/lease association, modest fire observations and conditional meter data as individually bounded slices. If any slice is deferred, keep its missing state visible and keep the document labeled draft/incomplete.

No national ID, lease upload, counterparty account, signature, key inventory or meter reading should become a universal prerequisite for an unrelated standalone report. The future vehicle/storage/commercial directions are preserved without implementing them.

The revised scope and field catalogue are **proposals requiring owner approval**, not permission to edit the application. No HMS approval, legal certification, technical safety clearance or replacement of an appropriately qualified professional is claimed.

## Workspace boundary

Repository verified: `Dermir92/astandsskraning`, branch `main` tracking `origin/main`, HEAD `2313f55278f2957f4d417e6965ebc3a40441f10f`. Initial Git status: only `?? docs/design/`; tracked files unchanged. This audit adds only this research folder and ignored source-evidence artifacts. Existing application/specification/design files were hashed before and after. No production code, schema, persistence, workflow, approved Concept C layout, prior design artifact or PDF was edited. No commit, push, merge, reset, clean or deployment.

**Audit approval is recorded. Stop at the Draft PR; implementation remains separately authorized.**
