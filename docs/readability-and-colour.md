# Readability and colour review — 14 October 2026

## Selected direction

**Option A: deep navy/petrol with teal accents.** The same actual “Mínar skýrslur” interface was rendered with both candidate palettes before the selected palette was applied throughout the application. There is no product theme switch and no second application theme.

Open the [desktop/mobile comparison](../artifacts/color-comparison/index.html). Both candidates use the same content, layout and stronger typography. Full-size screenshots and the candidate axe results are stored beside that HTML file. The comparison can be regenerated with the development server running:

```powershell
node scripts/compare-colors.mjs
```

| Direction | Professionalism and identity | Clarity | Accessibility |
| --- | --- | --- | --- |
| A: navy/petrol + teal | Precise, restrained; equally suitable for housing, vehicles and commercial assets | Navigation has a separate navy anchor; teal identifies actions | Secondary/white 7.88:1; white/action 7.05:1; no axe violations on either candidate viewport |
| B: evergreen + restrained terracotta | Calm, warmer and distinctive | Evergreen navigation is closer in hue to positive statuses | Secondary/white 8.54:1; white/action 7.48:1; no axe violations on either candidate viewport |

Both can meet the contrast targets. A was recommended for its operational clarity and broad product identity. Brown/gold were removed from the logo, active navigation, ordinary focus rings, demo labels and decorative accents. Warm colours remain only for semantic warnings and damage descriptions.

## What changed

- Primary text `#172F40`, secondary text `#405463`, petrol navigation `#142E3D`, teal actions `#17635D`, background `#F3F6F5`.
- Body text is 15 px with Manrope weight 500. No visible meaningful text is below 12 px. Addresses, dates and report metadata are 14 px; status labels are 13 px; mobile form values and search input are 16 px.
- Labels, placeholders, descriptions, dates, navigation, footer copy and supporting instructions use opaque colours. The two native inputs with `opacity: 0` are hidden file/radio controls whose visible labels remain fully opaque.
- Control outlines are darker (`#71858E`), with visible hover states. Relevant boundaries are distinct from the lighter, decorative table separators.
- Keyboard focus uses a 3 px outline with an offset. Sidebar focus uses a light mint outline against petrol. Search and radio focus are drawn around the visible control container.
- Disabled actions retain dark text/icons on a solid light background, a clear border and native disabled semantics. Counts and explanatory empty-state text provide context.
- Background fades were removed from buttons: changing to a disabled state previously produced a brief low-contrast intermediate colour.
- Mobile report filters form an intentional two-column grid. Larger text does not create horizontal page scrolling.
- Status words, check marks, radio indicators, warnings and selected-tab underlines remain available independently of colour.

## Contrast evidence

The automated audit reads computed styles from the actual browser DOM, composites transparent backgrounds, and evaluates each visible text node. It also covers placeholders even when their fields contain values, disabled text, control borders against their inside and outside backgrounds, interface icons, radio indicators and progress fills.

| Measurement | Result |
| --- | --- |
| Rendered contrast checks | 3,072 across 27 screen/state instances |
| Text/placeholder checks | 2,022, including repeated shared components across viewports |
| Lowest measured text contrast | 5.9815:1 |
| Lowest measured relevant non-text contrast | 3.3097:1 |
| Secondary text on white | 7.88:1 |
| Secondary text on page background | 7.24:1 |
| White primary-button text | 7.05:1 |
| Control border on white | 3.85:1 |
| Main focus outline on page background | 5.71:1 |
| Contrast/type-opacity failures | 0 |

The thresholds follow [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): 4.5:1 for ordinary text, 3:1 for large text and relevant non-text controls. The product's disabled states were checked against these targets as well, even though WCAG exempts inactive controls.

See [the computed summary](../artifacts/readability/summary.json) and per-viewport JSON evidence under `artifacts/readability/`. The lowest ratios are computed without rounding before comparison to the required threshold. Typography was manually reviewed as well: nominal colour compliance alone does not make small, thin text comfortable to read.

## Verification performed

- **46 Playwright tests passed**, with 2 intentional skips of the duplicate intermediate-width test. Existing creation, room editing, answer editing, draft persistence and review flows still pass.
- All six main screens were rendered at 1440 × 1000, 360 × 800 and 390 × 844, with axe WCAG A/AA checks. Open damage fields were checked too. No axe violations were found.
- The contrast audit covers all six screens plus open damage fields, invalid postal-code messages, custom-room errors, and disabled actions after removing all rooms.
- Hover, keyboard focus, and the skip-to-content interaction were tested. The main focus ring is also checked numerically against its surrounding background.
- No horizontal page overflow was found at 360, 390, 641, 768, 1024, 1280 or 1440 px.
- Rendered screenshots were manually reviewed on desktop and mobile, including table metadata, placeholders, labels, supporting text, warnings and disabled controls. Main screenshots are in `artifacts/screenshots/`; operational-state screenshots are in `artifacts/readability/`.
- TypeScript, ESLint and the production build were checked separately.

This verifies the implemented contrast requirements in the tested Chromium screens and states. Full WCAG certification, screen-reader testing, physical-device testing and observation of extended real-world use remain outside this review. The local-only scope, browser draft storage and temporary photo previews are unchanged.
