# UX/UI handoff — 14 October 2026

## Latest approval and current implementation

**User-approved next direction: Concept 2 desktop foundation, simpler Concept 1-inspired mobile list, contextual details in an accessible drawer/bottom sheet where useful.** Refine the details panel to essential information. Only the shared application shell and “Mínar skýrslur” are authorized for immediate redesign. Preserve all existing functionality and keep the remaining screen contents out of redesign scope.

Approval is explicit in the [latest user handoff request](handoff-inputs/project-handoff-request.txt). It supersedes the assistant's earlier Concept 1 recommendation and the historical approval-pending text in `artifacts/layout-concepts/index.html` and `review.md`. Those files are intentionally preserved as historical evidence. No hybrid production implementation exists yet: `app-shell.tsx` still has the large sidebar, and `reports-screen.tsx` still has `resume-panel` and the table container.

## Design journey

1. Phase 1A produced the working residential frontend. The original dashboard composition was rejected for looking like a generic AI-generated SaaS interface: oversized dark sidebar, excessive cards/containers and whitespace, large highlighted progress panel, weak product identity and faint secondary text.
2. Colour comparison used the actual reports interface with the same data/layout in both options. **A:** deep navy/petrol + refined teal. **B:** evergreen + restrained warm terracotta. Option A became the preferred starting point and was applied with stronger text, opaque disabled states, darker control boundaries and visible focus. Brown/gold is not desired as a prominent brand accent. The specification's original warm-gold experiment is historical, not current direction.
3. The user clarified that recolouring had not solved the composition problem. Two fundamentally different standalone HTML/CSS layouts were created; production was left intact.
4. **Concept 1:** compact top navigation, reports-first flat table, inline unfinished work and straightforward separated mobile list. **Concept 2:** 64 px rail, grouped reports register and selected-report room/deviation context. No giant resume card, KPI tiles or outer table card in either concept. Both use the exact same six application fixtures.
5. The assistant recommended Concept 1 for immediate phase 1A simplicity. The latest user request now selects **Concept 2 desktop + Concept 1-inspired mobile**, which is the controlling decision.

## Visual and interaction direction

Professional Nordic B2B language: task-led composition, restrained spacing, clear report hierarchy and useful inspection content. Avoid decorative widgets, excessive tinting/containers, huge headings, gradients and unnecessary shadows. Keep reports the main workspace. Do not invent new navigation destinations or business features.

Existing palette: primary `#172F40`, secondary `#405463`, petrol `#142E3D`, teal `#17635D`, focus `#006B7A`, form boundary `#71858E`. Prototype backgrounds are mostly white; current app background is `#F3F6F5`. Warm accents are reserved sparingly for semantic warnings/damage. Validate actual combinations instead of assuming token-level compliance.

Production uses Manrope; the standalone concepts explore Inter. That font change is a prototype decision to evaluate for the approved shell/list, not evidence of implementation or permission to restyle all forms. Concepts use 15–16 px report names, 13–14 px secondary information and no transparent meaningful text. Prototype CSS/JS is reference material, not production business logic to copy wholesale.

Desktop: economical labelled/icon navigation, an efficient report register and a contextual panel for the selected actual report. Mobile: simple readable list, clear next actions, restrained controls and accessible contextual interaction. Preserve actual save status, sample notice and retry warnings even though static prototypes do not simulate them. Active, draft and reviewed sample states must remain distinct and understandable without colour alone.

## Confirmed historical accessibility evidence

| Scope and source | Verified preserved results |
| --- | --- |
| [Colour comparison checks](../artifacts/color-comparison/checks.json) | A/B desktop/mobile: empty axe violation arrays and no overflow |
| [Existing app contrast summary](../artifacts/readability/summary.json) | 3,072 checks; 2,022 text checks; minimum text 5.981547962168809:1 and relevant non-text 3.3096671563997053:1 |
| [Layout prototype QA](../artifacts/layout-concepts/qa-results.json) | Two concepts, six viewport instances (1440×1000, 390×844, 360×800), 17 states; 1,575 contrast checks / 1,184 text checks; zero axe, contrast or type/opacity failures |
| Same prototype report | Minimum text 6.378399617979921:1; minimum non-text 3.854800722998102:1; no overflow; visible 3 px focus; original 43 protected files unchanged during prototype creation |
| [Gallery/hover checks](../artifacts/layout-concepts/comparison-qa.json) | No gallery axe/contrast failures; no mobile gallery overflow; six tested hover selectors across the concepts had no contrast failures |
| [Preserved application Playwright report](../playwright-report/index.html) | Embedded report JSON independently read for this handoff: 48 total, 46 expected passes, 2 skipped, 0 unexpected/flaky, `ok: true`; last-run status also passed |

Rendered screenshots were manually reviewed during the earlier phase. A mobile title/count/button collision was corrected at 360/390 px; sample-mode help became available on mobile; desktop selection focus restoration was fixed. Existing evidence is indexed in [DESIGN_ARTIFACTS.md](DESIGN_ARTIFACTS.md). Screenshots are historical captures, not freshly regenerated for this documentation task.

Targets remain WCAG 2.2 AA: normal text ≥4.5:1, large text and relevant non-text elements ≥3:1, stronger operational contrast preferred. Check every date, placeholder, label, description, status, navigation item and disabled state, plus keyboard/focus and hover. No colour-only status. Readability over a working day matters beyond nominal contrast.

These results validate tested historical Chromium states, not the future approved hybrid or full WCAG certification. Repeat visual/accessibility checks after implementation. Manual screen-reader, real-device, additional browser and zoom testing remain outstanding.
