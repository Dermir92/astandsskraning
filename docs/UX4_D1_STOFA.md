# UX4-D1: Stofa photo-first inspection

Base: `ad23255c48606721eefdda92e1c34aedf9030424` (merged BUG-01 / PR #27).
Branch: `codex/ux4-d1-stofa`.

## Implementation

Only rooms with the existing `living` (Stofa) type receive the new interface. Other room types retain their existing editor and photo controls. The approved UX4-A2 reference and its four implementation refinements were inspected before implementation.

- Compact property navigation and room context, explicit progress, flat checklist and adjacent desktop / inline mobile editor.
- Room overview photos appear before the checklist. Camera and gallery have separate labelled controls; item photos retain the existing report/room/item associations, limits, validation, enlargement and removal confirmation.
- The simple choices are Í lagi / Frávik / Á ekki við / Ekki skoðað. No answer is preselected. Choosing Í lagi changes **condition only**.
- Existing six-value condition, functionality and cleanliness assessments remain editable in **Ítarlegt mat**. Legacy `damaged` and `wear` values are retained. Review correction links reveal a required detailed answer and restore review context.
- One short defect description is prominent; existing type/location and optional notes remain accessible. Typing through invalid/valid states keeps the active editor mounted.
- **Loka ritli** collapses presentation and restores focus, preserving the record and photos. **Ljúka atriði** is available only when existing validation is complete and the save state is confirmed. It collapses the editor; it adds no new persisted completion flag. Room progress still follows the existing model. Previous/next/review navigation remains available for drafts, with unconfirmed saves identified.

The existing store, Web Locks, recovery, confirmation/undo, conflict detection, persistence and model validation are reused. No schema, persistence, PDF, Supabase or Docker files were changed. PR #19 was not accessed or changed. No merge, deployment or rollout was performed.

## Data-model constraints and limitations

1. **Optional description conflict:** the current model requires defect type, location and description for completion. Temporary visual evidence cannot replace durable text safely. Those requirements remain; no inferred metadata or automatic field filling was introduced. The additional note is optional.
2. **Detailed answers:** functionality and cleanliness remain separate and can still be required for completion. A good visible condition does not assert working or clean. N/A preserves hidden detailed answers and defect prose. Changes away from an active finding retain the existing confirmation and undo protections.
3. **Photos:** Demo previews disappear on reload/close and never reach persistent storage. The existing C1 branch continues to state that media is unavailable and renders no capture inputs. C1/Supabase integration was not exercised in this UI task.
4. **Navigation:** this is a room inspection, not property completion. Existing property navigation, fire and meter workflows remain accessible. The broader app shell remains in place, so the integration includes more navigation than the standalone UX4-A2 prototype.
5. **Accessibility:** automated WCAG A/AA screening and reflow checks are evidence, not full WCAG 2.2 AA certification. Physical camera permissions, phone keyboards and assistive technology still need real-device review.
6. **BUG-02:** the tested editing/navigation/reload paths pass. This does not establish a root cause or resolution for the wider unconfirmed report.

## Verification

Production build and focused browser verification use local Demo fixtures only. No real inspection data is used.

```powershell
npm ci
npm run build
npm run typecheck
npm run lint
$env:UX4_PRODUCTION_TEST='1'
npx playwright test --config playwright.ux4.config.ts tests/ux4-d1-stofa.spec.ts
npx playwright test --config playwright.ux4.config.ts tests/ux4-c-editing.spec.ts tests/ui1-assessment.spec.ts tests/inspection-navigation.spec.ts --project desktop
```

New coverage includes condition-only changes, unknown-field preservation at envelope/report/room/item/observation levels, legacy broken/dirty assessments, continuous typing, closing/editing/completing, navigation and reload, last-room review, temporary photo association/validation, failed-save retry, Web Locks, an external canonical conflict, review correction focus, axe and overflow checks.

Final results are recorded with the [screenshots and QA evidence](qa/ux4-d1/README.md).
