# Room inspection UI refinement

Based on the completed competitive UI audit of `main` at
`e4bb7dafec4b1ef3d02fd0a8aff368856f994db4` (5 November 2026).
The competitive investigation was not repeated. Implementation and verification:
13 November 2026.

## Scope

Application changes are limited to four existing CSS modules:

- `inspection-screen.module.css`: shared white/petrol room headers, 26px room
  titles, 20px property titles, aligned 44px room arrows, a 176px desktop room
  sidebar, light surfaces and matching footer treatment. Section navigation now
  stays in document flow in every room, following Stofa; the previously sticky
  strip could partially obscure a compacted row during keyboard navigation.
- `inspection-checklist.module.css`: compact rows with single dividers,
  consistent type weights and editor headings. Completed-defect details use
  the full editor width instead of a fixed 144/176px photo column.
- `stofa-inspection.module.css`: overview and defect gallery tiles grow from
  84px-wide cards with 56px images to responsive cards up to 200px wide. Photo
  captions, counters and empty states are readable; the photo-help target is
  at least 44px high. The desktop overview header and warning align with the
  gallery without the old stretched grid row.
- `evidence.module.css`: shared gallery cards grow to 200px, featured defect
  photos to 320px. Images use a 4:3 frame and `object-fit: contain`, preserving
  the whole photograph. Review uses one reading surface with divided sections
  instead of repetitive rounded cards. Room/finding headings are stronger,
  metadata spacing is tighter and the attention sidebar has a light divider.
  On mobile the long photo-count label spans the spare metric column.

There are no application TypeScript/JSX, workflow, content, warning, persistence,
authentication, database, report-adapter, report-preview or PDF-source changes.
The existing demo-photo notice is preserved verbatim.

## Before/after screenshots

The same synthetic report and existing `synthetic-wall-damage.png` are used in
both stages. The fixture contains all nine supported room types (ten rooms,
including the two existing bedrooms). Overview and defect associations are
separate. Screenshots are full-page; 390px viewport height is 844px and 1440px
viewport height is 1000px. All images were decoded before capture.

| Screen | Before 390px | After 390px | Before 1440px | After 1440px |
|---|---|---|---|---|
| Stofa: overview and open defect | [Before](before/stofa-defect-390.png) | [After](after/stofa-defect-390.png) | [Before](before/stofa-defect-1440.png) | [After](after/stofa-defect-1440.png) |
| Kitchen: open defect and overview disclosure | [Before](before/kitchen-defect-390.png) | [After](after/kitchen-defect-390.png) | [Before](before/kitchen-defect-1440.png) | [After](after/kitchen-defect-1440.png) |
| Review | [Before](before/review-390.png) | [After](after/review-390.png) | [Before](before/review-1440.png) | [After](after/review-1440.png) |

Before captures come from the unmodified audited `main` snapshot. After captures
come from the production Webpack build of this branch. The capture test compares
the complete `main.textContent` and the ordered controls' text, accessible labels,
destinations and disabled attributes with the baseline. All six comparisons pass.
The manifests retain SHA-256 fingerprints and lengths/counts of the compared
data, together with document heights:

- [Before 390px](before/manifest-390.json) / [After 390px](after/manifest-390.json)
- [Before 1440px](before/manifest-1440.json) / [After 1440px](after/manifest-1440.json)
- [Validation summary](validation.json)

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build -- --webpack`: passed.
- 34 targeted production-browser checks: passed at 390px and 1440px.
- 11 report-preview adapter/storage contract checks: passed.
- Full test suite was not run.

Browser checks cover all room types, unchanged controls and raw report storage,
gallery expansion, photo persistence/deletion, preview focus trapping/restoration,
review correction and Back/Forward navigation, defect editing, failed-save retry,
WCAG 2/2.1/2.2 A/AA axe checks, enlarged-text reflow, source-to-preview parity,
and the six before/after evidence states.

Targeted production command (PowerShell):

```powershell
$env:CI = '1'
$env:UX4_PRODUCTION_TEST = '1'
$env:ROOM_UI_CAPTURE = 'after'
npx playwright test --config playwright.ux4.config.ts tests/ui-room-refinement.spec.ts tests/ux4-c-editing.spec.ts tests/ux4-d1-stofa.spec.ts tests/inspection-navigation.spec.ts tests/demo-photo-persistence.spec.ts tests/report-preview.spec.ts tests/inspection-evidence.spec.ts --project=desktop --project=mobile-390 --grep 'room presentation|photos remain usable|capture comparable|BUG-01: typing|BUG-02 focused|failed autosave|concise defect edit|accessible flat|review corrections reveal|keyboard photo controls|confirmed deletion persists|review editing returns|navigation targets preserve|four-step entry|source links preserve|review includes good|keyboard preview traps'
```

Preview contracts:

```powershell
npx playwright test --config playwright.ux4.config.ts tests/report-preview-contract.spec.ts --project=desktop
```

Run the two commands sequentially: they share the configured server port.
To regenerate before evidence, run the capture test with `ROOM_UI_CAPTURE=before`
against the unmodified baseline; do not overwrite baseline evidence with branch
styles.

## Remaining differences and limits

- Stofa retains its existing inline camera/gallery controls and compact
  assessments. Other rooms retain their overview disclosure and detailed
  assessments; the heating editor retains its own radio groups. Their shared
  visual frame is consistent, while these workflow-dependent control layouts
  remain different.
- Larger photographs and preserved warnings make the open Stofa page somewhat
  taller. Review's repeated framing and spacing are reduced without hiding data.
- Verification used Chromium; native iOS/Android camera behavior and an
  independent PDF export were not exercised. Report/PDF source files are unchanged.
- Dependencies were shared through a junction in the isolated feature worktree.
  Default Turbopack cannot resolve that external dependency root. The documented
  `--webpack` production build passed, and browser checks ran against that build.

An intermediate accessibility run exposed a partially obscured target beneath
the old sticky strip; the in-flow strip resolves it. An overlapping test-server
run was discarded, and the final production run was executed in isolation.
