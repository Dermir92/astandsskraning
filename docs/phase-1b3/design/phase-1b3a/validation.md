# Accessibility, usability and print review

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

17 October 2026. Results apply to these isolated synthetic concepts, not the application or a future exported PDF.

## Executed checks

| Check | Final result / scope |
| --- | --- |
| Requested widths | **24 screen instances**: 3 concepts × 2 scenarios × 360, 390, 768 and 1440 px. No horizontal document overflow. |
| Text enlargement | **6 additional instances**, every concept/scenario at 390 px and 200% of each element's original computed font size. No horizontal document overflow. This is text enlargement, not a claim of physical-device zoom testing. |
| Links and assets | No duplicate IDs, missing internal destinations or broken photographs in the 24 screen instances. |
| Runtime | No page errors in the layout run. No API, storage or production-app operations occur. |
| Automated accessibility | **24 axe-core 4.10.3 audits**, WCAG A/AA, 2.1 AA and 2.2 AA tags: **0 violations and 0 unresolved checks**. This includes automated rendered-text contrast checks. |
| Keyboard | Tab reveals the skip link and Enter moves focus to the report in all 24 audited instances. Native links/select and visible focus outlines retained. No modal or custom keyboard widget introduced. |
| A4 layout | **6 report instances / 34 sheets**, CSS print media at 210 × 297 mm. No measured page-content overflow or footer collision. Explicit page break after each sheet except the last; repeated identity/footer on every page. |
| Screenshots | 61 report images: opening/kitchen at each requested width, quiet kitchen at 390 px, and every sheet in print styling. Comparison captures are additional. |
| Visual review | All print sheets checked in contact sheets; detailed cover, summary, kitchen, bathroom and limitation pages reviewed; mobile kitchen and opening layouts reviewed. Findings below distinguish design judgment from user testing. |

Machine records: layout measurements (not distributed; historical local reference), axe and keyboard results (not distributed; historical local reference), comparison audit (not distributed; historical local reference). The records identify the actual installed Chrome version. Early diagnostic runs using an older Chromium were replaced by the completed installed-Chrome runs.

## Findings and refinements

- **360 / 390 px:** A's table becomes vertical groups with visible condition/function/cleaning labels. B's photograph rail and observations stack. C stacks narrative, full images and the complete item register. No desktop table is squeezed to phone width. Working narrative text is 14–16 px; small reference/provenance text is 12 px in mobile reading mode.
- **768 px:** Paper padding narrows, keeping the register and image rail readable without horizontal scrolling. Long captions wrap. Tablet mode remains a document, not a miniature dashboard.
- **1440 px:** The viewer centers an A4-proportioned document with restrained page separation. A's serif opening, B's image-led opening and C's combined identity/summary have distinct compositions. Screen pages may grow vertically; A4 limits apply only in print styling.
- **A4:** Main running text uses 10.5 pt, principal table/narrative detail approximately 9 pt, repeated identity/source metadata approximately 8–9 pt. C's compact register preserves 9 pt assessment values and observation notes. No meaningful text is hidden to force the fixture onto a sheet. Repeated labels in C's desktop/print register are visually suppressed after the first row but remain in the semantic definition lists; mobile restores labels on every item.
- **Print corrections:** Initial denser kitchen pages overflowed. Removed redundant no-photo statements on every satisfactory item; reduced repeated dimension headings, tightened row spacing and bounded image height. Kept actual defect descriptions, assessment distinctions, N/A, missing evidence and participation disclosures. Final measured sheets fit. This fixture-specific pagination is not a solution for arbitrary-length reports.
- **Photographs:** Full, uncropped image contents are shown; the missing hood photograph stays missing. M01 is explicitly room/context evidence, not proof of every item. B gives photos the most space; C's printed photo rail is smaller. Its chip is visible, but close reading benefits from the linked full image. A high-detail defect in a real report should get an enlarged evidence block/continuation page, never a smaller caption. Generated photographs were visually inspected and are labelled synthetic throughout.
- **Contrast and grayscale interpretation:** Navy/petrol body text, dark teal labels and dark brown warning text pass the automated contrast audit. Every state has a word label; unknown states also use dotted underlining. Warnings use a border and text. Removing colour does not remove the finding, reference or missing-evidence message. Physical grayscale printer output has not been tested.
- **Reader without inspection context:** Cover identifies the asset/unit, type and draft state. Visit date is separate from handover. Unknown attendance is explicit. Summaries explain missing information; every item has a reference and a complete answer record. No percentages, green safety scores or inferred approvals are used.
- **Wording refinement before implementation:** “Ekki metin í þessum lið” means the checklist does not collect that subsidiary dimension; it is different from “Ekki prófað” and “Á ekki við”. Validate this distinction with readers. “Eðlileg notkunarmerki” is the recorder's assessment, not a legal conclusion.

## Practical reader tasks for approval testing

1. Find the hood observation, explain each of its three states and identify the missing photograph.
2. Explain why an intact-looking oven is not described as proven functional.
3. Identify the uninspected surface and the unanswered ceiling item; explain the difference.
4. Find a satisfactory item and the normal-wear observation without relying on colour.
5. State the actual inspection date, the separately proposed handover date, scope and participant review status.
6. In the quiet scenario, explain why zero recorded defects does not establish a fully inspected property.

No landlord, tenant or manager sessions have been run in this phase; these are proposed tasks, not success-rate claims.

## Boundaries of validation

The A4 captures are **CSS print-media layout checks**, not exported PDFs or proof of a browser/printer's final pagination. No PDF generator or PDF export was built. Native print-preview/spool output, physical A4/grayscale print, arbitrary-length pagination, font embedding and tagged PDF/accessibility remain future acceptance work. The zero-overflow result applies to the provided fixtures at 100% A4 scale.

No manual screen-reader session, actual iOS/Android device, Safari or Firefox run was performed. Mobile viewport emulation is not physical-device evidence. Axe and the bounded keyboard checks are not full WCAG certification. A future renderer must preserve native table semantics through reflow and be checked with real assistive technology, particularly A's transformed table and C's definition-list reading order.
