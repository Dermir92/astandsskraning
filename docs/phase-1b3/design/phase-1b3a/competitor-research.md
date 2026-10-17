# Competitive report research

> Curated publication, 17 October 2026. The owner approved the HMS/legal audit as the requirements-analysis baseline and retained refined Concept C. Historical review/approval status below records the earlier authoring stage. [Current approval, product boundaries and publication scope](../../README.md) govern this package. Phase 1B.3b is not authorized by this publication. Generated QA records and raw research downloads remain local.

17 October 2026. Design references only; these UK documents do not establish Icelandic legal requirements. Findings concern these samples, not every output of each supplier.

## Sources, access and page conventions

- [Inventory Insight sample](https://inventoryinsight.co.uk/wp-content/uploads/2026/02/Sample-Inventory-Report-Demo-Anonymised.pdf): 67 pages declared. Its first page is malformed: Poppler reports an invalid page object and produces unusable renders. PDFium recovered body pages; pdfplumber extracted 66 body pages. **The cover cannot be assessed reliably.** Page references below follow the visible printed numbering, checked against PDFium renders. Do not infer the cover from the other supplier's template.
- [InventoryBase sample](https://inventorybase.co.uk/wp-content/uploads/ib/2022/09/Sample-Report.pdf): **48 physical pages**, including an unnumbered cover and 47 numbered pages. References below use **physical PDF page numbers**. Thus PDF p. 3 is printed p. 2. This difference matters when navigating a downloaded file.
- Requested [Inventory Hive beta sample](https://beta.inventoryhive.co.uk/documents/sample_reports/inventory.pdf?v=7): hostname did not resolve. Inspected the publisher's [working www sample](https://www.inventoryhive.co.uk/documents/sample_reports/inventory.pdf?v=7), also linked from its [official website](https://www.inventoryhive.co.uk/). It has **52 pages**; physical and printed numbers agree. This is a substitute source, not a verified byte-identical copy of the inaccessible beta URL.

All available text was extracted. Representative pages were rendered and visually inspected: Insight pp. 2–4, 8–9, 17, 24, 63–67; Base pp. 1–6, 8, 18, 45–48; Hive pp. 1–4, 8–9, 14, 48–52. Extra text checks covered Hive pp. 5–7 and 20, Base pp. 17–25 and 46, and Insight pp. 5–7. Local source PDFs, text, individual renders and contact sheets stay under ignored `artifacts/phase-1b3a/research/`; they are not prototype assets. [Source identification hashes and access limitations](source-references.json) identify the inspected downloads. No competitor text or personal details are copied into the fictional reports.

## Comparison

| Aspect | Inventory Insight | InventoryBase | Inventory Hive |
| --- | --- | --- | --- |
| Cover / identification | Cover inaccessible. Body uses numbered pages (p. 8). | Photo, address, inspection date, inspector, commissioning party (p. 1). | Address, visit/start dates, parties and gallery links (p. 1). |
| Executive overview | Room condition/cleanliness schedule; repeated generic prose (p. 4). | Contents (p. 2); cleanliness schedule rather than exception summary (p. 3). | Room overview repeats reassuring prose (p. 5), despite item-level exceptions. |
| Room organization | Numbered items then separate room galleries (pp. 8–9, 24). | Numbered sections, continued tables, subsequent photo grids (pp. 8–11, 17–25). | Numbered rooms, assessment tables then galleries (pp. 8–9). |
| Three assessment dimensions | Separate condition/cleanliness columns; functionality in prose (pp. 8, 24). | Condition/free text mixes wear, cleaning and tests (pp. 8, 18). | Separate condition/cleanliness; functionality remains narrative (p. 14). |
| Defects and photographs | Short descriptions, thumbnail counts, later full images (pp. 17, 24). | Located marks/chips in condition cells; nearby referenced images (pp. 8–11). | Localized defects and tenant disagreement text coexist (p. 14). |
| Photo references / provenance | Hierarchical refs; added and claimed capture dates distinguished (p. 9). | Repeated item refs identify groups, not individual images (pp. 10–11). | Unique photo refs; contributor/capture method shown (pp. 9, 20). |
| Uninspected / missing evidence | General exclusions in disclaimer, detached from item ratings (p. 64). | Explicit untested equipment and unseen certificate (pp. 18, 46). | Untested functions explained mainly in disclaimer (p. 49). |
| Inspector / participants / completion | Presence question and signed declaration with metadata (p. 63). | Named inspector on cover; blank declaration lines (pp. 1, 48). | Visit distinct from tenancy date; signatures/presence at end (pp. 1, 48). |
| Density / repetition | Dense tables, many gallery pages, long closing guidance (pp. 24, 64–67). | Long narrow description cells; repeated image refs; sparse ending (pp. 18, 47–48). | Dense tables contrast with spacious galleries; four closing guidance pages (pp. 14, 49–52). |
| Digital / A4 reading | Linked galleries help digitally; print references must stand alone. | Repeated address/date and ruled A4 tables help print; zoom needed on phones. | Clickable image galleries help digital use; fixed tables remain small on phones. |

## Practices to adopt

1. **Repeated document identity.** Base repeats address/date through room pages. Add report ID, draft/version status and page x/y as well, so a detached printed page remains identifiable.
2. **A short orientation layer.** Base's contents and Hive's first-page metadata help a new reader. Combine identity, scope, actual inspection date and a truthful exception overview before details.
3. **Separate assessment dimensions.** Preserve the clearer condition/cleanliness split in Insight/Hive and give functionality an equally explicit field, matching our product.
4. **Stable room, observation and photograph references.** Use readable labels backed by immutable identifiers; each photograph needs its own reference, unlike Base's repeated item-only labels.
5. **Local descriptions.** Record what was observed, where, and which test was performed. A photograph supports a description; it does not replace it.
6. **Visible evidence origin and uncertainty.** Hive p. 20 distinguishes tenant evidence; Insight p. 9 distinguishes capture claims from upload dates. Keep those concepts separate in future infrastructure.
7. **Explicit limits and participation.** State what was not accessed/tested, whether attendance is known, and whether anyone actually reviewed. Keep limitations near the affected observation as well as in closing notes.

## Weaknesses to avoid

1. **A reassuring room summary hiding exceptions.** No automatic room-level “good”, percentage grade or compliance mark. List missing answers separately from defects.
2. **Silence treated as acceptance.** Insight p. 65 and Hive p. 50 contain acceptance-by-no-additional-notes language. This conflicts with our agreed principle; do not adopt it.
3. **Generic substitute photographs presented as evidence.** Insight p. 4 explicitly warns that some images illustrate typical rooms. Our report must identify the actual scope and source of each image; these prototypes instead label every image synthetic.
4. **Photographs far from their observation.** Separate galleries make readers repeatedly switch pages. Put relevant images beside, or immediately after, the affected room/observation; preserve print references.
5. **Overloaded condition text.** Base's free text and the other samples' narrative testing make “looks intact” easy to confuse with “works”. Show untested functionality explicitly.
6. **Repeated boilerplate and tiny columns.** Avoid repeating generic all-good paragraphs and full provenance blocks on every image. Keep unique facts, readable type, a compact provenance key and a full source record when infrastructure exists.
7. **Unnecessary personal metadata.** Insight's purportedly anonymised declaration still includes contact/network metadata. Do not reproduce it. Future exports need an explicit privacy/redaction policy; names, emails and IP addresses are not interchangeable report essentials.
8. **Assumed approvals and decorative signatures.** Base's blank fields do not establish completion; neither does an attractive seal. Display actual review status without fabricated ticks, signatures or qualifications.

## Design consequences

A tests the traditional register's strongest qualities. B tests immediate visual comprehension and a continuous reading flow. C combines a useful first-page overview with a complete room record and local images. All include satisfactory items, normal wear, N/A, uninspected and unanswered observations; missing evidence remains visible in both scenarios. [Compare the actual concepts](comparison.html).

These are expert design findings, not measured user preference or inspection-time results. The samples show no basis for claiming Icelandic legal compliance, professional certification, damage causation or liability.
