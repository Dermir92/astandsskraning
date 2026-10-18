# Phase 1B.3b.2 — Residential rental information

Residential rental drafts now capture landlord and tenant names, rented premises, a lease date/reference and explicitly declared representation within the existing four-step workflow. Upplýsingar initially exposes three new fields; secondary information uses disclosures. Yfirferð separates missing rental minimums from supplied information needing attention and offers exact correction links. Every incomplete draft remains saveable.

The owner approved the UX/UI after independently reviewing the implementation report and screenshot package. This change is prepared for independent code review as a **Draft PR targeting main**, based on `02e2035f44cadbf5cef1948472f6fd2102bc5b5a`.

## Approved specification

The [approved planning specification](phase-1b3/planning/PHASE_1B3B2_RENTAL_INFORMATION_APPROVED.md) is a publication copy. Its contract, requirements, acceptance criteria and boundaries are unchanged; approval/provenance and machine-specific repository metadata are adjusted. The original planning file, implementation report and visual review package remain unchanged locally. Existing research/design references resolve to the curated Phase 1B.3 baseline already in main.

## Exact changed-file inventory

| Status | File | Responsibility |
| --- | --- | --- |
| Added | [docs/phase-1b3/planning/PHASE_1B3B2_RENTAL_INFORMATION_APPROVED.md](phase-1b3/planning/PHASE_1B3B2_RENTAL_INFORMATION_APPROVED.md) | Approved requirements with publication-safe metadata. |
| Added | [docs/PHASE_1B3B2_RENTAL_INFORMATION_REVIEW.md](PHASE_1B3B2_RENTAL_INFORMATION_REVIEW.md) | Curated implementation and final verification summary. |
| Modified | [src/app/globals.css](../src/app/globals.css) | Scoped rental/disclosure/review styles, focus spacing and label wrapping. |
| Modified | [src/components/demo-provider.tsx](../src/components/demo-provider.tsx) | Retain unknown v1 envelope keys across writes and retries. |
| Added | [src/components/rental-information-fields.tsx](../src/components/rental-information-fields.tsx) | Rental capture, retained-data disclosure and reused handover controls. |
| Added | [src/components/rental-information-summary.tsx](../src/components/rental-information-summary.tsx) | Read-only rental summary and exact correction links. |
| Modified | [src/components/screens/details-screen.tsx](../src/components/screens/details-screen.tsx) | Integrate capture and separate common notes; fixed correction return. |
| Modified | [src/components/screens/review-screen.tsx](../src/components/screens/review-screen.tsx) | Rental summary and distinct missing/attention groups. |
| Modified | [src/components/use-details-correction.ts](../src/components/use-details-correction.ts) | Extend target allowlist, open every ancestor disclosure and use fixed return anchors. |
| Modified | [src/lib/locale/is.ts](../src/lib/locale/is.ts) | Icelandic labels, hints and issue copy. |
| Modified | [src/lib/model.ts](../src/lib/model.ts) | Optional rental types/member and additive structural validation. |
| Added | [src/lib/rental-information.ts](../src/lib/rental-information.ts) | Pure relevance/readiness, retained-data and representative-name helpers. |
| Modified | [tests/inspection-core-capture.spec.ts](../tests/inspection-core-capture.spec.ts) | Follow the intended disclosures while retaining existing preservation assertions. |
| Modified | [tests/prototype.spec.ts](../tests/prototype.spec.ts) | Open handover disclosure in the existing creation-to-review workflow. |
| Added | [tests/rental-information-capture.spec.ts](../tests/rental-information-capture.spec.ts) | Capture/review/context/representation/focus/photo/retry/accessibility flows, including final Icelandic singular copy. |
| Added | [tests/rental-information-compatibility.spec.ts](../tests/rental-information-compatibility.spec.ts) | Readiness, optional validation, legacy/raw-read preservation and recovery. |
| Added | [tests/rental-information-fixtures.ts](../tests/rental-information-fixtures.ts) | Synthetic legacy/current/rental/extension fixtures. |

Total: **17 files: 9 modified, 8 added**. No raw QA logs, screenshots/galleries, ZIPs, preservation archives or unrelated research files are published.

## Data contract and compatibility

`ApartmentDetails` gains only optional `rentalInformation?: ResidentialRentalInformation`; existing members remain intact. The rental object contains optional raw strings `landlordNames`, `tenantNames`, `leaseDate`, `leaseReference`, `propertyNumber`, `premisesDescription`, `includedAreasDescription`, `excludedAreasDescription`, and optional `representation`:

```ts
interface RentalRepresentation {
  nameSource?: "" | "recorder" | "other";
  name?: string;
  representedParty?: "" | "landlord" | "tenant";
  basisDescription?: string;
}
```

Storage stays at `astandsskraning-demo-v1`, version 1. Legacy drafts, missing rental objects and missing optional members load without migration, normalization, added defaults or writes on read. Known wrong shapes/types/enums, malformed JSON, unsupported versions and incompatible previously reserved-key content enter the existing protected read-error state; exact unreadable bytes remain protected from edits, creation and retry. Dates/identifiers remain raw strings; malformed calendar strings are editable drafts with nonblocking warnings.

Rental minimums apply only in explicit residential rental context: both parties, a rented-premises description and either a calendar-valid date or nonblank lease reference. A reference alone leaves the date Óskráð; an invalid supplied date still receives attention. Optional missing values do not become tasks. Standalone/unknown contexts retain optional view/edit access and all stored values without rental required marks or rental readiness penalties. Inspection extent remains distinct from rented extent; room/item progress and report status semantics are unchanged.

Representation is one explicit declaration for one party. Recorder-source names resolve live from `recorderName`, without copying into `representation.name`; the alternative name and unknown extension data survive source/role/context changes. Missing recorder names use the existing common issue; inconsistent recorder role/source combinations receive a correction link. Identity, attendance, agreement and authority are not inferred.

## Envelope-preservation fix

Previously `DemoStore.persist` rebuilt only `{ version: 1, reports }`, dropping unknown top-level envelope fields. Hydration now retains the validated envelope; serialization spreads it and then overrides the known `version` and `reports` members. Reads still perform zero writes. Existing nested spread updates preserve unknown report/detail/rental/representation/room/item/observation fields and unrelated reports. A failed write keeps complete pending edits in memory and the retained envelope available; successful retry saves both. Rejected invalid mutations cannot replace those pending valid edits or unreadable source bytes.

## Initial verification — reviewed commit `9d7b26d`

| Check | Final result |
| --- | --- |
| Fresh complete production regression | **402 passed, 12 intentionally skipped, 0 failed, 0 flaky**, 414 executions across desktop 1440, touch 360 and touch 390; 5.1 minutes. Retries remain disabled. |
| Desktop | 138 passed / 0 skipped. |
| Mobile 360 | 132 passed / 6 skipped. |
| Mobile 390 | 132 passed / 6 skipped. |
| Rental-specific executions | 59 passed / 4 intentionally skipped across all three projects. |
| Final Icelandic copy | Singular `1 upplýsing vantar` assertion passed in the complete final run on all three projects. |
| TypeScript | `npm run typecheck` passed. |
| Production build | `npm run build` passed with Next.js 16.4.0. |
| Scoped lint | Local ESLint passed over all 14 changed application/test TypeScript/TSX files. |
| Git whitespace | Working-tree and proposed staged diff checks passed. |
| Existing-file preservation | **1330 / 1330** baseline files SHA-256 unchanged, including original research, design, planning, preservation records/archives, prior screenshots/report and review ZIP. |
| Publication audit | Only the explicit 17-file allowlist; no credentials/private keys, personal email addresses, absolute local filesystem paths or generated artifacts found. Fixture data is synthetic. |

The complete suite includes legacy v1 compatibility, exact raw read bytes, unknown fields at every level, failed writes/pending edits/retry, rejected mutations, rental/standalone/unknown context switching, representative name/role changes, missing-versus-attention semantics, every nested correction target, keyboard focus/return behavior, and existing register/inspection/room/item/photo workflows. Existing tests were not weakened or changed during final verification. The two prior regression-file edits only follow the approved new disclosure placement and retain their previous preservation assertions.

Verification used the unchanged repository suite with an ignored local configuration selecting installed Chrome and a fresh production server on port 3001. Output was isolated so prior evidence was preserved. The first attempt exposed two existing concept-upload tests expecting a fixture relative to the working directory; copying that existing fixture byte-for-byte fixed the harness. The complete final rerun above ran unchanged tests. The 12 intentional skips are duplicate desktop-only accessibility/width audits in the two touch projects; no exclusions were added during final verification.

## Accessibility findings and remaining limits

Native disclosures support keyboard operation; summaries/correction links have at least 44 px targets. Rental correction URLs use an allowlist and fixed review anchors, open all containing disclosures after hydration, focus the exact input and preserve focus while typing. If context/clearing removes the rental summary, return focuses the visible core summary. Existing correction links and Back/reload behavior remain covered.

Automated axe checks with WCAG 2.2 tags cover rental/standalone/unknown contexts, capture/review screens and 320/360/390/768/1440 px widths. Long content and expanded fields reflow at 200% text at 320 CSS px; the earlier optional-label overflow fix is retained. Manual NVDA/VoiceOver reading, Safari/Firefox, physical devices and actual browser zoom UI were not tested. Automated checks do not certify complete WCAG conformance.

Local synchronous storage, quota/eviction, whole-document writes, older-client and cross-tab limitations remain. Photos remain temporary session previews; no durability, backup, formal completion or verified authority is promised. One representative for one party is supported; multiple/dual representation is deferred.

## Unchanged boundaries

**Concept C and its approved designs/PDF assets are unchanged.** Routes, dependencies, repository Playwright configuration, observation enums, checklist/evidence implementations and existing progress meanings are unchanged. Fire/heating/meters/keys/inventory, backend/database/authentication, participants/signatures/authority verification, notices/formal execution, durable media, HMS integration, payments and production PDF/Concept C adapter infrastructure remain excluded. No Phase 1B.3b.3 work is included. Publication stops at a Draft PR; no merge or deployment is requested or performed.

## Independent review follow-up — 18 October 2026

Both findings from review of `9d7b26d7df18e5b5ff19ad38c95e8a9f90b33b1b` are addressed with two production-line changes. The information contract, approved layout, locale strings, storage and excluded infrastructure are unchanged.

- An explicitly selected represented party now activates the existing representation checks, including a missing name-source issue. Names and recorder roles are never inferred or changed. Clearing both selections leaves representation optional for ordinary roles, while inactive alternative names, basis text and extensions remain stored. Standalone/unknown contexts still have no rental readiness penalty; returning to rental restores the relevant issue. Drafts remain saveable and no verified-authority claim is introduced.
- An invalid supplied lease date takes priority in the collapsed Leigusamningur status, using the existing restrained status style and warning copy. A valid reference still satisfies the association minimum; the invalid date remains a separate attention/correction issue, which clears after repair.

The new tests reproduced both defects against the reviewed implementation before the fix. Final focused verification: **12 passed / 0 failed**, across desktop, mobile-360 and mobile-390. Fresh complete production regression: **414 passed / 12 intentionally skipped / 0 failed / 0 flaky**, 426 executions in 5.2 minutes with retries disabled. All previous cases and intentional skips remain; existing assertions were not removed or weakened. TypeScript, production build, scoped lint on the four changed TypeScript/TSX files and Git whitespace checks passed. **1709 / 1709** existing untracked/design/research/planning/evidence/archive files remain SHA-256 identical. The earlier manual accessibility/browser and local-storage/photo limitations still apply. Publication updates PR #5 only and stops for final review; no merge, deployment or subsequent-phase work is included.
