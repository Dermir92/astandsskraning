# Concept C - final PDF review corrections

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

17 October 2026. Ready for final design approval. This review supersedes the earlier 26/31-page diagnostics. Production implementation has not started.

- [Corrected large-inspection PDF](downloads/astandsskodun-syniskyrsla-a4.pdf).
- [Corrected long-description PDF](downloads/astandsskodun-langar-lysingar-a4.pdf).
- [Curated final A4 pages and complete PDFs](../../EVIDENCE.md); the full 54-render set remains local.
- Before/after measurements are retained below; the full comparison gallery remains local.
- [Interactive prototype](index.html?fixture=large).

## Before / after

MB uses decimal bytes, consistent with the original 69.6 MB report.

| Check | Large before | Large corrected | Long before | Long corrected |
| --- | ---: | ---: | ---: | ---: |
| Native A4 pages | 26 | **25** | 31 | **29** |
| PDF size | 69.59 MB | **9.44 MB** | 66.66 MB | **9.12 MB** |
| Size reduction | - | **86.43%** | - | **86.32%** |
| Local file links | 23 | **0** | 22 | **0** |
| Valid internal navigation links | 48 | **65** | 49 | **69** |
| Complete inspection items | 84 | **84** | 84 | **84** |
| Embedded available photos | 23 | **23** | 22 | **22** |
| Deviation links on cover | 3 examples | **All 9** | 3 examples | **All 9** |
| Minimum text size | 9 pt | **9 pt** | 9 pt | **9 pt** |

The long fixture deliberately retains 23 media references with one unavailable file (M018). Its placeholder and index entry explicitly disclose that absence. The separate defect without a supporting photo is also retained; these are different limitations.

## File links and portability

The cause was the prototype wrapping each embedded photograph in an anchor to its image file. When Chrome printed a `file:` page, these became absolute local file-opening actions. The photo wrappers are now ordinary figures with embedded images. No image file link is emitted by the report, whether printed from disk or served over loopback.

Internal report links remain live: all nine cover findings, the room guide, continuation-page links to each room's scope, missing-information references, and every media-index entry. The native PDF audit checks all link destinations against their intended source and destination pages, rather than merely checking that a destination exists.

The final object audit walks the catalog, named destinations, metadata and all in-use objects. It checks PDF strings and rendered text for local paths and user-profile paths; rejects file specifications, attachments, external URI actions, Launch, GoToR, GoToE and JavaScript actions; and resolves every link. Both deliverables contain zero unintended paths or actions. No post-export removal of all annotations or flattening was used.

## Image size and visual quality

The original large PDF contained **69,146,463 bytes of image streams**, all 23 at 1536 x 1024 pixels using lossless Flate compression. Images accounted for over 99% of the document. Simply compressing the PDF container would not address the dominant cost well.

The isolated prototype now uses export derivatives: JPEG quality 94, full 4:4:4 chroma, optimized progressive encoding, **no resizing, no cropping, and no source metadata copied**. All 23 original PNGs remain byte-identical. The derivatives total 9.01 MB; the PDF adds fonts, text, tags and navigation. At the 90-94 mm evidence widths, retained source resolution exceeds 400 pixels per inch horizontally.

Native-pixel comparisons were inspected for the small countertop chip, loose window seal and shower joint. Their edges, texture and context remain visible; no material detail loss was apparent in these synthetic examples or their A4 renders. JPEG is lossy and is not a forensic replacement for an original. The minimum full-image RGB PSNR across derivatives is 40.94 dB; this is a supporting measurement, not proof of evidential adequacy. Original files remain the reference. Exact parameters, sizes and hashes (not distributed; historical local reference).

The existing download URL now serves the corrected large PDF, preventing the earlier link from continuing to distribute the unsafe export. The original PDFs and a copy of the original prototype sources remain in ignored local review artifacts for comparison.

## Pagination findings

Room scope now sits beside the overview photograph, replacing repeated introductory text above it. Continuations link back to that scope. A new room shares an ending page only if its heading, overview and first complete observation fit together, with a visible gap between rooms. Final dedicated room pages can rebalance whole observations without changing record order, detaching photographs, or moving partial long-text fragments.

| Original review target | Corrected location | Result |
| --- | --- | --- |
| Page 4, end of entry hall | Pages 3-4 | Entry-hall records use space on page 3; page 4 also starts the living room with its overview and first record. |
| Page 6, end of living room | Page 5 | The living-room detail photo and remaining records fit together after reducing repeated room framing. |
| Page 9, extractor hood | Page 8 | Four complete observations now share the page, including the hood and its photo. |
| Page 13, bedroom 2 ending | Pages 11-12 | Whole records balance the two pages; page 12 holds seven ordinary records. |
| Page 21, storage detail | Page 20 | Three preceding records now accompany the storage observation and photo. |

After balancing, the large report's room pages use approximately 67-99% of the measured body height. This measure includes headings and spacing and is not a target. Remaining whitespace accommodates intact evidence blocks and coherent section starts. Support material retains deliberate separation from room records.

Oversized prose now uses available space before continuing on a fresh page. The stress fixture preserves all original words and paragraphs across 88 measured description fragments, with repeated room/item identity and contextual photo continuations. There is no font-shrinking fallback or page-count cap. The observed 25/29 pages result from these fixtures.

## Reference clarity

Source media IDs are immutable fixture keys. Reader-facing M references are derived once from first appearance in report order and are used consistently in captions and the media index. They are stable for the generated report and are explicitly described as report-scoped references, not persistent media identity or provenance.

| Reader reference | Intended item | Underlying source ID |
| --- | --- | --- |
| M006 | A022, kitchen cabinet overview | M008 |
| M007 | A023, countertop chip | M007 |
| M008 | A027, extractor hood | M006 |

The underlying mapping remains in QA records; the reader is not asked to reconcile two numbering systems. A persisted/frozen report would need to retain its generated mapping in a future implementation. This refinement introduces no schema or capture fields. The small fixtures' kitchen overview was also correctly labeled as an overview rather than as a floor-item attachment.

## Verification results

- **All four fixtures:** 5, 6, 25 and 29 native pages; 65 native A4 pages checked, including all 54 pages of the requested large/stress pair.
- **Content:** all 84 items in each large fixture; source descriptions match in full after whitespace normalization; all 84/88 description fragments also appear in the corresponding native PDF pages. No truncation, missing glyphs, blank pages or duplicate HTML IDs.
- **Evidence:** every available photo is embedded once, in its intended room/item context. Embedded JPEG streams match the approved derivative hashes. Unavailable M018 and the separate missing supporting photo remain disclosed. All captions and media-index page references match native output.
- **Navigation:** all 65/69 final PDF links resolve to their intended pages; zero filesystem paths, external file actions, unintended external URLs or attachments. All nine deviations are directly reachable from each cover.
- **Print:** A4 dimensions, headers/footers and page counts match the measured layout. No page-body overflow or footer overlap. Body/description/assessment/metadata sizes remain 11/10.5/10/9 pt; photographs remain uncropped at their existing frame size.
- **Responsive reading:** four widths (360, 390, 768, 1440 px) for each of four fixtures; 16 axe audits with zero violations or unresolved checks. Four additional 200% text-size checks pass. Keyboard skip navigation passes. Six hosted-page audits (viewer, gallery and comparison at 390/1440 px) also pass. Both actual download controls return files whose SHA-256 hashes match the audited PDFs.
- **Visual review:** every final page rendered at 150 dpi and inspected in complete-page contact sheets; representative full-size pages include the cover, shared room transition, kitchen M006-M008, sparse-page corrections, long-text continuations, missing-file placeholder, handover and media index. Native-pixel source/derivative defect crops were also inspected.
- **Preservation:** all 285 earlier preserved files, all 85 original A/B/C design files and all 23 source PNGs remain byte-identical. The prior prototype sources were separately archived and verified. Only the existing isolated Concept C prototype, its test workflow and review artifacts were edited. No production source, dependencies, persistence, schema or inspection workflows changed. No commit, push, merge or deployment.

Machine evidence: browser/content checks (not distributed; historical local reference), native PDF object/content checks (not distributed; historical local reference), download hashes (not distributed; historical local reference), hosted pages and download-button checks (not distributed; historical local reference), preservation (not distributed; historical local reference).

## Remaining limits and approval boundary

Verification uses installed Chrome 155 and Poppler, with synthetic images. Physical-printer output, real-world evidence compression choices, manual screen-reader reading order, other PDF viewers and other browsers remain untested. The PDF remains a tagged design diagnostic, not an approved accessible or production export. Full source pixels help zooming; they do not make an originally unclear photograph reliable.

The pagination harness is fixture-based. Production needs deterministic rendering with explicit missing-value behavior and regression fixtures, plus a distinct, reviewed PDF export stage if authorized. A future exporter must apply the same link policy, derivative-only image processing and native PDF object checks. No change to the previously proposed Phase 1B.3b data-capture scope is required by these corrections.

**Stop here for final design approval.** No implementation, commit, push, merge or deployment is authorized by this review.

## Publication reproduction boundary

The authoring scripts, baseline snapshots, full render sets and generated QA records remain local. The [published package instructions](../../README.md#preview-the-preserved-designs) open the preserved static viewer; the [curated evidence index](../../EVIDENCE.md) provides representative final renders and complete final PDFs. The publication does not regenerate the approved PDFs.
