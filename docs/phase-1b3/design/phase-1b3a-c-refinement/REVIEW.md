# Final Concept C design review

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

> Historical initial refinement review. The final PDF correction pass supersedes the page counts and export checks below: [current corrections and verification](PDF_REVIEW_CORRECTIONS.md).
17 October 2026. Expert design review and automated checks, **not** a claim of landlord/tenant user testing or accessibility certification.

## Before / after findings

| Earlier Concept C | Refined Concept C |
| --- | --- |
| Three-room / 15-item fixture with a fixed five-page composition | 10 rooms / 84 items / 23 photographs; measured flow creates 26 pages, with no artificial cap |
| Important observations repeated above a separate complete answer register | One complete observation record: three distinct assessments, description, location and contextual evidence |
| Dense compact-register details and small printed photo rail | 10.5 pt descriptions, 10 pt assessment values, minimum 9 pt metadata/captions; uncropped evidence frames approximately 90 × 53 mm |
| Long content could outgrow a manually assigned room page | Long prose gains labelled continuations, retains paragraphs and prefers nearby sentence/paragraph boundaries; every source word is preserved |
| Large empty areas when a short ending forced a new room/page | Next-room heading, overview and first observation may share an ending page when all fit; evidence index can share an ending section |
| Fictional name/visit time demonstrated their intended position | Actual inspection date/time and recorder identity remain unknown; attendance, review and completion are not fabricated |
| A4 evidence was CSS print-media screenshots | Native Chrome print pagination checked, text/page references verified, complete pages rendered with Poppler at 150 dpi and reviewed at full resolution |

The first-page executive overview, complete room records, contextual photographs, explicit limits and references remain. Concepts A and B and the original Concept C are unchanged.

The small mostly satisfactory example still takes five pages; the small defects example now takes six. The larger type and local image blocks cost space. That is a visible tradeoff for approval, not a claim that fewer pages always mean a better report. Some room continuations retain whitespace to keep meaningful observations and photographs together. Do not shrink type to recover a page count.

## Large example and stress case

The realistic large fixture has **10 rooms, 84 items, 23 distinct associated synthetic images, 9 affected items and 10 normal-wear observations**. Two condition answers are missing, nine items are unexamined/untested in at least one dimension, and one affected item lacks its supporting photograph. Keys and a meter reading appear only as optional synthetic, unconfirmed handover information. Meter number, reading date and supporting photo remain unknown.

The stress variant uses the same inspection associations and IDs, much longer window/shower descriptions and an unavailable M018. It produces **31 pages**. Repeated paragraphs deliberately stress data-preserving flow; they are not recommended editorial copy for an actual inspection. The main example uses ordinary varied observations and one longer defect description. Images were generated independently, so visual material/furnishing consistency is not evidence of a real capture session.

Scope coverage is a realistic point inside the requested range, not an exhaustive benchmark of every 8–12-room / 60–100-item / 20–40-photo combination. Boundary cases near 100 items and 40 images should join the production implementation's acceptance suite.

## Verification performed

| Check | Final evidence |
| --- | --- |
| Four fixtures / screen widths | 16 report states at 360, 390, 768 and 1440 px; zero horizontal document overflow |
| Text enlargement | Four additional 390 px states at 200% original computed text size; zero horizontal overflow |
| Automated accessibility | 16 axe-core 4.10.3 audits using WCAG A/AA, 2.1 AA and 2.2 AA tags: zero violations and zero unresolved checks, including contrast |
| Keyboard | Skip link revealed with Tab and moves focus to report on Enter in every audited state; native controls/links retain visible focus |
| Completeness | Zero missing or changed normalized description text; zero duplicate IDs or broken internal anchors; all source items and unique image references retained |
| A4 layout geometry | No page-body overflow or footer collision; figures/records remain inside their assigned pages |
| Actual native pagination | **68 native pages total:** 5 / 6 / 26 / 31; each output's actual page count matches its plan; no blank pages |
| Identity and references in native output | Header and footer numbering present on every native page; every item found; photo-page references match native page locations; no replacement glyphs |
| Printed type and margins | Minimum extracted non-whitespace font size **9 pt**; body descriptions 10.5 pt, running text 11 pt; 14 mm side, 13 mm top and 11 mm bottom design margins |
| Full-size visual review | Representative complete native pages at **150 dpi / 1240 × 1754 px**, opened at original image detail: cover, kitchen/counter evidence, long-prose continuations and unavailable-photo handling; all-page contact sheets used separately for global rhythm |
| Browser / runtime | Installed Chrome 155.0.8059.80; zero page errors in the completed report run |
| Preservation | All 285 pre-existing tracked/design/research files byte-identical; archive's 144 design/research entries match their source hashes |

See screen/layout/semantic results (not distributed; historical local reference), native print results (not distributed; historical local reference), current screenshot selection (not distributed; historical local reference), and preservation verification (not distributed; historical local reference). Native page geometry is approximately 209.89 × 297.01 mm due to Chrome's paper rounding, within 0.2 mm of A4. Text bounds remain within the planned margins. All meaningful statuses have words; grayscale interpretation does not depend on teal/brown alone.

The hosted viewer/gallery check (not distributed; historical local reference) separately verified 390 and 1440 px: all 23 large-example assets available, no HTTP errors, no overflow and no axe violations or unresolved checks. This confirms that sibling preserved assets load through the loopback preview as well as when opening the prototype directly from disk.

## Remaining usability and print limitations

- This is a static design stress harness, with a client-side measured page planner and fixture-specific IDs. It is not a production pagination library, immutable report model or export service. Production fonts/content changes require fresh pagination tests.
- Larger photos improve recognition of the sample chip/seal, but fine cracks, meter digits or large damage extents may need an enlarged evidence block or dedicated continuation. The frame is a starting size, not a rule that every photograph must fit it.
- Caption/context travels with continuation photographs. A very long observation can still span several pages; inspect the 31-page case to judge the repeated headings and reading rhythm. Arbitrary hostile/very large documents and every media aspect ratio are not exhaustively covered.
- Native A4 output was tested in installed Chrome, at 100% scale with browser headers/footers disabled and backgrounds enabled. Safari, Firefox, alternate print drivers, user-added printer headers, physical A4/grayscale printing and printer-specific nonprintable margins remain unverified.
- Synthetic PNGs and native print diagnostics are intentionally unoptimized and can be tens of megabytes. Responsive image delivery, memory/performance testing on real phones and controlled print-image compression belong in implementation; these files are design evidence, not production delivery-size examples.
- Report pages are labelled and semantically structured, but no manual screen-reader, physical phone, PDF/UA or tagged-PDF reading-order audit was performed. A tagged browser diagnostic PDF does not establish accessible production export.
- The interaction is read only. Full-image links open local PNGs; a production image viewer should preserve the reader's context and focus. No production correction workflow was changed.
- Unknown inspector/date, unconfirmed handover and unrecorded participant status remain intentional. Readable output must not be mistaken for an attributable issued report until the missing capture/infrastructure contract is implemented.
- No landlord, tenant or property manager participated in a test session. Before implementation approval, ask each to locate a missing photo, distinguish untested from defective, find a satisfactory item and state whether anyone approved the report. Expert review cannot substitute for those results.

## Recommendation for final approval

Approve the refined Concept C **composition and readability rules**, including larger type/images, content-driven continuation, complete records and explicit unknowns. Retain the page-count/whitespace tradeoff as a review decision. Then separately approve [the bounded Phase 1B.3b draft-preview scope](PHASE_1B3B_SCOPE.md); do not treat this design decision as authorization for schema, backend, finalization or PDF export work.
