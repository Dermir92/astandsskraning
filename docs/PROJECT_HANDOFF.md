# Project handoff — 14 October 2026

> **Historical handoff.** This document preserves the earlier project checkpoint. Later Phase 1A.2, 1B.1a and 1B.2a work is integrated. Start from [the current README](../README.md) and [publication/development continuity](PUBLICATION.md); do not treat earlier pending-work statements below as current implementation status.

> **Accepted baseline update — 15 October 2026:** Phase 1A and Phase 1A.1 are implemented and accepted by the user as the local development baseline. Read [PHASE_1A_BASELINE.md](PHASE_1A_BASELINE.md), [the final review](PHASE_1A_FINAL_REVIEW.md) and [the portable QA index](qa/phase-1a/README.md) first. The 14 October handoff below is preserved as historical context: its statements that the approved layout is unimplemented or Git is absent describe that earlier snapshot. Do not repeat the completed implementation plan. Phase 1A.2 and Phase 1B are not authorized or started.

## Read first and status precedence

This handoff records the local workspace at `.`. Read this file, [product decisions](PRODUCT_DECISIONS.md), [UX/UI handoff](UX_UI_HANDOFF.md), [next implementation task](IMPLEMENTATION_NEXT_STEPS.md) and [artifact index](DESIGN_ARTIFACTS.md) before continuing.

**Current state:** phase 1A is a functioning Icelandic, local-only residential inspection frontend. Navy/petrol/teal colour and readability improvements are implemented. The fundamental layout redesign exists only in standalone prototypes. The user's latest handoff request **approves Concept 2 on desktop with a simpler Concept 1-inspired mobile experience**, limited to the shared shell and “Mínar skýrslur”. This supersedes the assistant's previous recommendation of Concept 1 and historical “awaiting approval” wording in the prototype review/gallery. No redesign was implemented during this documentation task.

Authority: latest explicit user instructions take precedence over historical recommendations. The original [MVP specification](astandsskraning-mvp-v1.md) describes the broader product; [phase 1A notes](afangi-1a.md) describe the narrower implemented prototype. Their historical content is preserved. The old README's suggested user-study next step is superseded by [the approved implementation plan](IMPLEMENTATION_NEXT_STEPS.md).

## Product, market and scope

An independent condition-reporting platform documents assets at handover and return. Users record photographs and observations, invite counterparties, compare initial/final conditions and generate traceable final documentation. The platform does not determine liability for damage.

The initial market is Icelandic individuals renting assets, landlords and tenants, rental businesses, vehicle rental operators and businesses handing over premises. Working name: Ástandsskráning; final name, domain and brand remain unresolved. One platform supports asset-specific templates for residential rental properties, rental vehicles, storage spaces/garages and commercial properties.

The broader MVP includes secure invitations, counterparty evidence/disputes, immutable finalized versions, initial/final comparison and PDF export. **These are product direction, not delivered capabilities.** Phase 1A delivers the residential draft → rooms → observations → review path only. Initial, final and standalone inspection types are selectable metadata; selecting final does not implement comparison.

## Verified implementation

| Screen/route | Current behaviour |
| --- | --- |
| `/` | Six fixture reports; search, status/asset filters, sorting and a resume panel |
| `/skyrslur/ny` | Four asset choices; only residential creation is active |
| `/skyrslur/[id]/upplysingar` | Apartment details, inspection type, role/date/furnishing/notes; incomplete drafts allowed |
| `/skyrslur/[id]/rymi` | Add/remove/rename rooms and quantities; confirm removal when evidence/answers exist |
| `/skyrslur/[id]/skraning` | Room-based checklist, separate condition/function/cleanliness, deviation fields, comments and temporary photos |
| `/skyrslur/[id]/yfirferd` | Missing information/answers/photos, deviations and links back to rooms; sample-only summaries for fixture records |

No positive default answers. “Not inspected” differs from “not applicable”. Relevant completion requirements are calculated in `model.ts`; recorded count does not mean satisfactory condition. Sample apartment Sýnigata 14 has six rooms and 53 items. Other fixture titles are Dæmishlíð 8, Sýnibíll · SB-000, Sýnigeymsla 03, Sýniskrifstofa and Dæmisgata 22. “Yfirfarið · sýni” is illustrative, not a finalized report. New records remain drafts/in registration.

## Stack and structure

`package.json` declares Next.js 16.4.0 App Router, React/React DOM 19.3.0, TypeScript ^5, Tailwind CSS 4.3.3, lucide-react 1.57.0 and local Manrope fonts. Node 22+ is the documented runtime. Tests use Playwright 1.64.1 and @axe-core/playwright ^4.11.1. Exact dependency resolution is preserved in `package-lock.json`. Inter is vendored only for the standalone layout prototypes; it is not yet the production font.

| Path | Responsibility |
| --- | --- |
| `src/app/` | Routes, root layout, global CSS, metadata/icon and not-found screen |
| `src/components/app-shell.tsx` | Existing sidebar, top bar, sample notice, save state and storage warning |
| `src/components/screens/` | Six main screens plus sample summary |
| `src/components/demo-provider.tsx` | Shared store, hydration, draft persistence and in-memory photos |
| `src/components/report-context.tsx` | Resolve active report for report routes |
| `src/components/observation-editor.tsx`, `photo-preview.tsx`, `ui.tsx`, `form-field.tsx` | Reusable editing, preview and UI controls |
| `src/lib/model.ts` | Domain types, templates, completion/validation rules and stored-data validation |
| `src/lib/fixtures.ts`, `src/lib/locale/is.ts` | Synthetic demo reports and Icelandic labels |
| `tests/` | Browser regression tests, readability tests and computed contrast helpers |
| `scripts/compare-colors.mjs` | Historical actual-interface colour comparison |
| `artifacts/` | Preserved screenshots, standalone layouts and accessibility evidence |

`AGENTS.md` requires checking this installed Next version's documentation before coding. No business API routes, database, real authentication, email, OTP, payments, signatures, finalization, PDF or comparison engine are implemented. Supabase/PostgreSQL/private storage/Vercel appear as proposed future architecture only; provisioning is not authorized by this handoff.

## Persistence and known limitations

The shared store uses `useSyncExternalStore` and validates versioned data after hydration. Text, rooms and observations are saved to browser `localStorage`, key `astandsskraning-demo-v1`, payload `{version:1,reports:[...]}`. Saving is reported successful only after `setItem` succeeds. Failed writes keep changes in memory and expose a warning/retry. Invalid stored data shows fixtures and a warning rather than silently overwriting the old payload on read.

Photos are in-memory `blob:` previews attached to room/item contexts, not durable media. They disappear on reload/closing, are not sent to a server or saved in localStorage. JPG/PNG/WebP are supported, maximum 10 MB per file and eight photos per area; HEIC/annotations are absent. Drafts are origin/browser-specific, with no user isolation, cross-device sync or concurrent-tab protection; later saves can overwrite earlier edits. This is not secure storage for actual inspection evidence.

Outstanding: approved layout implementation; screen-reader, Firefox/Safari, physical iOS/Android and 200–400% zoom review; real-world inspection usability; final brand/template content; future security/retention architecture. README records five historical high-severity development-chain audit entries involving braces/glob and zero production-dependency entries at its prior check. That security status was not freshly audited in this documentation task and may have changed.

## Local run and checks

```powershell
cd '.'
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`; stop with Ctrl+C. `npm ci` is for dependency installation; existing `node_modules` is already present. For production-mode local verification use `npm run build` then `npm run start`.

```powershell
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm test
```

Playwright starts/reuses the localhost dev server per `playwright.config.ts`. Tests use 1440×1000, 360×800 and 390×844 viewports. No service is required to open the layout HTML prototypes directly; optional preview/QA instructions are in the [artifact index](DESIGN_ARTIFACTS.md).

## Evidence and repository preservation

On 14 October 2026, `git status --short --branch`, `git branch --show-current` and `git rev-parse HEAD` each returned “not a git repository”. No `.git` exists in this workspace. Branch, commit, tracked/untracked and staged/unstaged status are **not applicable**, rather than clean. No Git init, reset, commit, push or deployment was performed. New handoff documents and design artifacts are local filesystem files, not version-controlled. `.gitignore` excludes `artifacts/`, test reports and build/dependency caches; a later Git setup must explicitly decide how to preserve/transfer artifacts.

The original specification in the root and its docs copy are byte-identical. Existing documents/prototypes/screenshots are preserved, including historical recommendations. [HANDOFF_MANIFEST.json](HANDOFF_MANIFEST.json) records actual paths, sizes and SHA-256 hashes; [handoff verification](HANDOFF_VERIFICATION.json) records document/link checks and historical report evidence. QA numbers describe preserved earlier runs, not new application tests executed for this handoff. No customer data or secrets are needed to resume.

The embedded JSON in the preserved Playwright HTML report was independently decoded during handoff: 48 total tests, 46 expected passes, 2 skips, zero unexpected/flaky results, `ok: true`. Separate stdout logs proving prior lint/typecheck/build and dependency-audit runs were not recovered; their historical results are reported in the README/earlier conversation, not freshly verified here. There is no separate original pre-readability screenshot or completed approved hybrid layout to recover. The documented prototype/browser limitations remain open.

Proceed with the approved shell/reports redesign only, then validate behaviour and accessibility. Backend, invitations, media storage, comparison and PDF need separately scoped future phases. Do not redesign the other screen contents now.
