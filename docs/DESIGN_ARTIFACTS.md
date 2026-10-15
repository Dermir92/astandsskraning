# Preserved artifact index — 14 October 2026

Paths below are real, local files relative to this document. **Selected next implementation:** Concept 2 desktop + simpler Concept 1-inspired mobile, scoped to shared shell/reports. Approval is newer than the historical gallery/review recommendation of Concept 1. No artifact was deleted or recreated for the handoff.

| Artifact | Meaning/status |
| --- | --- |
| [Layout gallery](../artifacts/layout-concepts/index.html) | Historical desktop/mobile comparison; old approval-pending/Concept 1 recommendation retained |
| [Concept 1 HTML](../artifacts/layout-concepts/concept-1.html) | Interactive standalone top-navigation/report-table design; mobile inspiration |
| [Concept 1 desktop](../artifacts/layout-concepts/screenshots/concept-1-desktop.png) | 1440 px historical capture |
| [Concept 1 mobile viewport](../artifacts/layout-concepts/screenshots/concept-1-mobile-viewport.png) | 390 px visible screen |
| [Concept 1 full mobile list](../artifacts/layout-concepts/screenshots/concept-1-mobile.png) | 390 px full-page capture |
| [Concept 1 at 360 px](../artifacts/layout-concepts/screenshots/concept-1-mobile-360.png) | Narrow-width review |
| [Concept 2 HTML](../artifacts/layout-concepts/concept-2.html) | Standalone rail/register/context design; selected desktop foundation |
| [Concept 2 desktop](../artifacts/layout-concepts/screenshots/concept-2-desktop.png) | 1440 px historical capture |
| [Concept 2 mobile viewport](../artifacts/layout-concepts/screenshots/concept-2-mobile-viewport.png) | 390 px with bottom navigation; not the finalized hybrid mobile direction |
| [Concept 2 full mobile list](../artifacts/layout-concepts/screenshots/concept-2-mobile.png) | 390 px full-page capture |
| [Concept 2 at 360 px](../artifacts/layout-concepts/screenshots/concept-2-mobile-360.png) | Narrow-width review |
| [Comparison desktop image](../artifacts/layout-concepts/screenshots/comparison-desktop.png), [mobile image](../artifacts/layout-concepts/screenshots/comparison-mobile.png) | Gallery captures of both concepts |
| [Historical layout review](../artifacts/layout-concepts/review.md) | Design decisions/tradeoffs, manual review and earlier recommendation |
| [Layout QA results](../artifacts/layout-concepts/qa-results.json), [gallery/hover QA](../artifacts/layout-concepts/comparison-qa.json) | Confirmed 17 states / contrast / axe and gallery/hover evidence |
| [Exact prototype reports](../artifacts/layout-concepts/reports.json), [protected-file baseline](../artifacts/layout-concepts/source-before.json) | Fixture-derived content and original source hashes |
| [Colour gallery](../artifacts/color-comparison/index.html) | A/B on the earlier actual application layout |
| [A desktop](../artifacts/color-comparison/a-desktop.png), [A mobile](../artifacts/color-comparison/a-mobile.png) | Preferred navy/petrol/teal |
| [B desktop](../artifacts/color-comparison/b-desktop.png), [B mobile](../artifacts/color-comparison/b-mobile.png) | Evergreen/warm alternative, not selected |
| [Colour checks](../artifacts/color-comparison/checks.json), [colour/readability review](readability-and-colour.md) | Earlier candidate accessibility and production contrast improvement documentation |
| [Production contrast summary](../artifacts/readability/summary.json) | 3,072 historical computed checks |
| [Playwright HTML report](../playwright-report/index.html), [last-run status](../test-results/.last-run.json) | Preserved earlier application browser test evidence |

Additional actual files are individually inventoried in [HANDOFF_MANIFEST.json](HANDOFF_MANIFEST.json): six production screenshots (`reports`, `new`, `details`, `rooms`, `inspection`, `review`) in each of `artifacts/screenshots/desktop`, `mobile-390`, `mobile-360`; per-viewport `contrast-audit.json`, `operational-contrast.json`, `damage.png`, `validation.png`, `disabled.png` in `artifacts/readability/{desktop,mobile-390,mobile-360}`; and layout report-dialog captures named `concept-1-desktop-report.png`, `concept-1-mobile-report.png`, `concept-1-mobile-360-report.png`, `concept-2-mobile-report.png`, `concept-2-mobile-360-report.png`.

No separate Concept 2 desktop-dialog screenshot is expected: desktop uses the persistent contextual panel captured in `concept-2-desktop.png`. No hybrid approved-layout screenshot exists because that layout has not yet been implemented. No separate pre-readability original UI snapshot was located; earlier composition is recoverable from code, colour captures and user instructions, not from an invented historical image.

## Source/provenance and reproduction

Original specification: [root source](../astandsskraning-mvp-v1.md), [byte-identical docs copy](astandsskraning-mvp-v1.md). Preserved exact user input copies: [phase 1A request](handoff-inputs/phase-1a-request.txt), [layout rethink](handoff-inputs/layout-rethink-request.txt), [latest handoff/approval](handoff-inputs/project-handoff-request.txt). The additional text-readability requirement was provided directly in chat and is summarized in [UX_UI_HANDOFF.md](UX_UI_HANDOFF.md); no separate attachment for it was available.

Standalone local HTML uses `concepts.css`, `prototype.js`, embedded JSON and vendored Inter files with `assets/FONT-LICENSE.txt`. It does not persist data; registration links require the unmodified app at localhost port 3000. Optional rendering server: `node artifacts/layout-concepts/serve.mjs` (localhost 4174), followed in another terminal by `node artifacts/layout-concepts/render.mjs`, `qa.mjs` or `check-comparison.mjs` with their full artifact-relative paths. `build.mjs` regenerates fixture-derived HTML. Regeneration overwrites files, so preserve historical evidence and use a separate future QA location when appropriate.

All artifacts remain local. This workspace has no Git metadata and `.gitignore` excludes artifacts/test reports. Copy `docs/`, `artifacts/`, application source/config/lockfile and original specification when moving the project. Dependencies/build caches are reproducible and are not substitutes for the artifacts. No remote backup or Git tracking is claimed.
