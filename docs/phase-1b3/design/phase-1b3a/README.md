# Phase 1B.3a — report research and visual concepts

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

17 October 2026. **Ready for concept approval. Research and isolated visual design only.**

Recommended direction: **C — Hybrid Professional Report**. Its first page explains the actual scope, recorded exceptions and missing information before a reader enters the room records. A new reader can trace an observation to its assessment and photograph without confusing an unanswered item with a satisfactory one. It combines A's completeness with B's more direct reading flow.

## Open the deliverables

- [Side-by-side visual comparison](comparison.html): covers and representative kitchen pages, tradeoffs and links to both scenarios.
- [Interactive concept viewer](index.html): A, B and C, each with “Að mestu í lagi” and “Nokkur frávik”. Open the HTML directly in a browser; no application installation or server is needed. The toolbar switches local query parameters only.
- [Competitor comparison, sources and page references](competitor-research.md).
- [Actual product review, A–D data map and minimum additions](data-requirements.md).
- [Accessibility and A4 findings](validation.md), layout measurements (not distributed; historical local reference), accessibility results (not distributed; historical local reference).
- [Curated representative screenshots](../../EVIDENCE.md) and [comparison image](../../evidence/original-comparison.png). The original full width/A4 QA set remains local.
- [Synthetic asset prompts and provenance](assets/PROVENANCE.md).

Everything is confined to this new folder. The current app, report schema, storage and inspection workflow are unchanged. No dependencies or lockfiles were changed. No finalization, PDF generator/export, backend, authentication, permanent photo storage or payments were implemented. No commit, push, merge or deployment was performed.

## The concepts

| | A — Formal Inspection Report | B — Modern Digital Report | C — Hybrid Professional Report |
| --- | --- | --- | --- |
| Composition | Serif cover; separate summary; full-width ruled assessment register; photographs below | Large image-led opening; editorial summary; photographs in left rail and narrative observations at right | Identity and executive overview on page one; room narrative and image rail; compact complete answer register |
| Best quality | Precise reference lookup and conventional printed reading | Image prominence and item-by-item digital reading | Early comprehension plus room-level traceability |
| Cost | Slow opening; register visually heavy | Cover postpones findings; more vertical reading | Denser room pages require controlled pagination |
| Mobile | Table turns into labelled vertical observation groups | Image rail precedes continuous observations | Narrative, photos and complete answer list become a single reading column |
| Fixture page count | 6 | 6 | 5 |
| Suitability | Useful alternative if formal table lookup wins user testing | Useful if photo-led reading wins; weakest executive opening | Recommended starting point for landlord, tenant and manager audiences |

The page counts describe a deliberately bounded 3-room, 15-item fixture, **not a target or estimate for a full apartment**. None loses satisfactory observations to make an attractive exception-only report. A real report must grow with content and maintain font size. Recommendation is expert judgment, not measured user preference.

## Proposed final section outline

1. **Identity and status:** property/unit, inspection type, stable report/version identity, draft/issued state, actual visit date, separately labelled handover/return date when relevant, attributed recorder.
2. **Executive overview:** scope, factual unique-item exception counts, normal wear, unanswered/uninspected/untested observations and missing evidence; no global safety grade.
3. **Reading guide:** room index, page/observation/photo references and concise meanings of condition, function, cleaning and unknown states.
4. **Room records:** scope and access; each checklist item with its three distinct assessment dimensions; precise descriptions, neutral notes and supporting images; include satisfactory and N/A items.
5. **Limitations and unresolved information:** omitted areas, unavailable tests, missing answers/evidence and optional keys/meters/handover data, only where supplied.
6. **Participation and version record:** attendance separately from review; actual submitted positions/disputes and status, when workflows support them; absence of response never acceptance.
7. **Evidence/source index:** unique photo IDs, target, contributor/source and capture-time uncertainty; version/amendment record when available. Do not duplicate every large photograph in a second album.

In C, sections 1–3 share the first page in this small example. Sections 5–7 share its last page. Larger reports need continuation pages rather than smaller text.

## Sequence after concept approval

1. **Agree content and run reader tasks.** Choose the composition, test Icelandic terminology with a landlord, tenant and manager. Ask each to find A09's missing image, explain A08's untested function, distinguish wear from a defect, and identify whether the tenant approved anything. Record task success and misunderstandings; no user testing is claimed yet.
2. **Approve a report data contract.** Define the minimal C inputs, scope/limitation structure, unknown/null semantics, initial/final/independent labels, exclusion of inactive retained descriptions, compound finding references and draft/issued distinctions. Review privacy and any legal wording separately. No schema mutation is part of this deliverable.
3. **Add the smallest approved capture changes.** Recorder, actual inspection date, scope and optional limitations; optional handover modules only when needed. Preserve explicit assessments, local draft safety and precise correction navigation.
4. **Build durable evidence and authorship foundations.** Private media, reliable upload status, source metadata, access checks and retention rules before any permanent-evidence claim. Preserve unknown timing and missing originals honestly.
5. **Implement an attributed version snapshot and participant states.** Define freeze/amendment rules and reference stability. Keep attendance, invitation, review, acknowledgement and signatures separate. A draft report can precede participant workflows if it accurately states their absence; issued-report behavior requires its own approved scope.
6. **Implement the approved renderer in a separately scoped phase.** Render the same snapshot to accessible HTML and A4 output; implement true variable-length pagination, repeated identity, bookmarks/links, source indexes and original-image access. Only then implement and test a PDF generator. Do not rely on a screenshot of a page as an accessible PDF.
7. **Verify end to end and pilot.** Long descriptions, many rooms/photos, absent originals, untested equipment, print/grayscale, font embedding, Unicode, tagged PDF structure, screen readers, Safari/Firefox, real phones and physical A4 printing. Regression-test inspection and correction workflows. Initial/final comparison follows separately.

## Technical isolation and reproducibility

Inspected base: `2313f55278f2957f4d417e6965ebc3a40441f10f` on local `main`, tracking `https://github.com/Dermir92/astandsskraning.git`. Source files in `src/`, package files and existing docs were read only. New HTML/CSS/classic JavaScript use only synthetic `data.js`, packaged images and URL parameters; no app imports, storage calls, network fetches or export actions.

Raw QA scripts and generated records remain local. Use the [current package preview instructions](../../README.md#preview-the-preserved-designs). The publication retains the original HTML/CSS/JavaScript, fixtures and required images.
