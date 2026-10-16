# Phase 1B.2b — Curated acceptance evidence

16 October 2026. Synthetic data only. This small evidence set accompanies the approved Phase 1B.2b implementation. The full generated QA output remains ignored. These relative links work in a clean checkout of the feature branch.

Implementation context: sanitized main base `e8d838aa73a40ed7a866e247b6cb3081d1e0f308`, branch `codex/phase-1b2b-inspection-navigation`. Verification was captured before the feature commit. See the [implementation and acceptance record](../../PHASE_1B2B_INSPECTION_NAVIGATION.md) and [machine-readable summary](verification-summary.json).

## Representative screenshots

| File | Viewport | Source and purpose |
| --- | --- | --- |
| [360-checklist.jpg](360-checklist.jpg) | 360 × 800 | Supervised in-app Chromium walkthrough: first row actions remain visible with a long synthetic address. |
| [360-resume.jpg](360-resume.jpg) | 360 × 800 | Supervised walkthrough: reload reopens the exact window item with the explicitly supplied answers and note retained. |
| [390-incomplete-editor.jpg](390-incomplete-editor.jpg) | 390 × 844 | Supervised walkthrough: Back reaches the earlier room/item despite newer continuation metadata, with neutral condition-group focus and no selected answer. |
| [390-review-return.jpg](390-review-return.jpg) | 390 × 844 | Supervised walkthrough: return from editing restores a fully visible, focused source-item link in review. |
| [768-incomplete-list.png](768-incomplete-list.png) | 768 × 1000 | Automated disposable fixture capture: room grouping, entirely unanswered and partially recorded items. |
| [1440-checklist.png](1440-checklist.png) | 1440 × 1000 | Automated disposable fixture capture: approved Concept B composition and separate recorded, incomplete, deviation and attention states. |

The four JPEGs and two PNGs are unmodified browser screenshots. They show the viewport rather than cropped or annotated compositions. The in-app browser exports scaled JPEGs: 345 × 767 pixels from the 360 × 800 CSS viewport, and 375 × 812 pixels from the 390 × 844 CSS viewport. The automated PNGs retain their exact viewport pixel dimensions. No image resampling or cropping was performed by this task. The two sources use different synthetic reports and therefore intentionally show different progress counts. Encoded image sizes, CSS viewports and SHA-256 hashes are recorded in the summary. There are no real inspection photographs, user data, environment files, full browser traces or personal filesystem paths in this curated set.

## Supervised walkthrough

The agent operated visible browser controls and inspected screenshots/accessibility state, separately from the automated test suite:

1. Created a new synthetic residential draft; visited apartment details and default room setup.
2. Started inspection at 360 px. Used quick-good on the floor, supplied cleanliness separately, and used condition-only quick-good on a wall. Neither action advanced the room or item automatically.
3. Opened the window alternatives, explicitly chose wear and working functionality, and typed a synthetic note while leaving cleanliness unanswered.
4. Reloaded: the same report/room/item reopened, with the original choices and note retained and no new answer supplied.
5. At 390 px, opened incomplete items, distinguished the partial window from untouched items, selected a window in another room, and used explicit next-incomplete. Selection collapsed the list. Neutral group focus did not focus a text input.
6. Confirmed Tab focuses a radio without selecting it; only explicit click/arrow input selected answers.
7. Entered review, edited an exact item, supplied its missing answers and returned to its stable item-index link after the old flagged finding disappeared.
8. Repeated review visits after a document reload against the corrected build. Confirmed neutral missing-group/completed-row focus and fully visible return focus.
9. Browser Back restored the preceding explicit room/item rather than the newer saved position. A further Back left inspection for room setup, without replaying individual checklist interactions. Forward restored the inspection target.
10. Rechecked 360 px room-only selection and exact reload continuation on the final build. The browser viewport override was reset after the walkthrough.

Two confirmed focus issues were fixed: overly broad reload suppression and a review return target clipped by native history viewport restoration. The correction uses an initial-document guard and one post-restoration animation frame; it adds no new navigation UI or scroll-history subsystem.

## Automated verification and limits

The summary records final lint, typecheck, production-build, full-suite and four-width capture results. The full suite includes Phase 1B.1a storage protection/retry/limit regressions and archived concepts. Navigation-only scenarios compare report JSON bytes and timestamps and verify unrelated storage remains intact. The capture run checks axe WCAG A/AA, 2.1 AA and 2.2 AA tags, overflow and runtime errors across 28 states, including enlarged text.

The original ignored logs, full HTML/JSON reports, traces, capture harness and all 56 screenshots exist only in local QA output. This curated directory is the portable review evidence; it does not pretend to contain those full reports.

This is desktop Chromium viewport testing and an agent-supervised walkthrough, not a physical-device field study or manual screen-reader session. Actual iOS/Android keyboard/camera behavior, Safari and Firefox remain unverified. Browser metadata remains best-effort; photographs remain temporary previews. Review restores an item/room anchor rather than an exact historical pixel offset.
