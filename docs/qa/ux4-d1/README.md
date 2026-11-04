# UX4-D1 visual and focused QA evidence

Captured 4 November 2026 in Chromium. All records are synthetic. The `synthetic-wall-damage.png` fixture shown in the additional photo captures is illustrative test media, not evidence of an actual property.

The before captures were taken from approved main `ad23255c48606721eefdda92e1c34aedf9030424` before application edits. Before/after pairs use the same synthetic report and open Veggir defect editor, with no photos. The after captures use the production build.

| Width | Before | After | Additional temporary-photo case |
| --- | --- | --- | --- |
| 390 px | [Before](before-390.png) | [After](after-390.png) | [With synthetic previews](after-demo-photos-390.png) |
| 1440 px | [Before](before-1440.png) | [After](after-1440.png) | [With synthetic previews](after-demo-photos-1440.png) |
| 320 px | — | [Reflow](after-320.png) | [With synthetic previews](after-demo-photos-320.png) |

Visually reviewed the 390/1440 layouts and the 320 px reflow. No horizontal overflow or clipped controls in the checked states. Temporary storage limits are visible beside both room and item media. Additional legacy fields and retained application navigation account for differences from the standalone design prototype.

## Results

- UX4-D1: **39 passed** across 1440, 390 and 320 px (13 focused cases at each width), including last-room navigation.
- Existing shared-editor/navigation regression: **39 passed** (desktop), including all BUG-01 cases and the existing focused BUG-02 persistence scenario.
- Axe: zero violations in the screened open-defect views at all three widths; primary close action meets the 44 px target.
- `npm run build`: passed with the default Turbopack production build.
- `npm run typecheck`, `npm run lint` and `git diff --check`: passed after the final edits.

Initial development-server runs exposed CSS cascade conflicts (fixed) and intermittent startup stalls while sharing a dependency junction. An isolated `npm ci` and production build removed that test-environment problem; production runs passed without retries. The full unrelated application regression was not run because model/store/persistence and other room implementations were not changed.

See [implementation and limitations](../../UX4_D1_STOFA.md).
