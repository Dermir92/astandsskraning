# UX4-D1 visual and focused QA evidence

Baseline captured 4 November 2026 in Chromium; after captures refreshed 5 November for the targeted refinement. All records are synthetic. The `synthetic-wall-damage.png` fixture shown in the additional photo captures is illustrative test media, not evidence of an actual property.

The before captures were taken from approved main `ad23255c48606721eefdda92e1c34aedf9030424` before application edits. Before/after pairs use the same synthetic report and open Veggir defect editor, with no photos. The after captures use the production build.

| Width | Before | After | Additional temporary-photo case |
| --- | --- | --- | --- |
| 390 px | [Before](before-390.png) | [After](after-390.png) | [With synthetic previews](after-demo-photos-390.png) |
| 1440 px | [Before](before-1440.png) | [After](after-1440.png) | [With synthetic previews](after-demo-photos-1440.png) |
| 320 px | — | [Reflow](after-320.png) | [With synthetic previews](after-demo-photos-320.png) |

Visually reviewed the 390/1440 layouts and the 320 px reflow. No horizontal overflow or clipped controls in the checked states. Temporary storage limits are visible beside both room and item media. Additional legacy fields and retained application navigation account for differences from the standalone design prototype.

The targeted refinement shows named missing-answer actions and a retained legacy defect indicator, with direct focus into the required detailed group: [390 px](refinement-390.png) · [1440 px](refinement-1440.png). These actions change presentation and focus only; they do not infer or save answers.

## Targeted refinement results, 5 November 2026

- **42 focused Stofa cases passed**, without retries, against the production build at 1440, 390 and 320 px. No broader regression suite was run for this refinement.
- Required missing answers are named in collapsed rows, and keyboard/pointer actions reveal and focus the correct detailed group without altering the stored document or choosing answers. Prompts disappear when answered and respect existing N/A/required-field rules.
- Retained legacy prose remains visibly indicated after confirmed changes, undo/reconfirmation, room navigation and reload; canonical data is preserved.
- Existing Stofa BUG-01, failed-save retry, Web Locks, conflict and review-navigation cases passed. Axe found zero violations in the additional refinement views, with no horizontal overflow.
- The production build (including TypeScript), scoped ESLint on the changed component/test and `git diff --check` passed. Existing validation and photo limitations are unchanged.

## Initial implementation results, 4 November 2026

- UX4-D1: **39 passed** across 1440, 390 and 320 px (13 focused cases at each width), including last-room navigation.
- Existing shared-editor/navigation regression: **39 passed** (desktop), including all BUG-01 cases and the existing focused BUG-02 persistence scenario.
- Axe: zero violations in the screened open-defect views at all three widths; primary close action meets the 44 px target.
- `npm run build`: passed with the default Turbopack production build.
- `npm run typecheck`, `npm run lint` and `git diff --check`: passed after the final edits.

Initial development-server runs exposed CSS cascade conflicts (fixed) and intermittent startup stalls while sharing a dependency junction. An isolated `npm ci` and production build removed that test-environment problem; production runs passed without retries. The full unrelated application regression was not run because model/store/persistence and other room implementations were not changed.

See [implementation and limitations](../../UX4_D1_STOFA.md).
