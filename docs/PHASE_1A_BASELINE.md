# Accepted Phase 1A / 1A.1 baseline — 15 October 2026

The user accepted Phase 1A and Phase 1A.1 as the local development baseline and separately authorized a verified external filesystem backup and initial local Git commit on `main`. The initial commit captures the existing implementation. No application behavior, domain rules, fixture data, persistence or dependencies were changed while establishing version control. Phase 1A.2 and Phase 1B have not begun.

## Approved UX/UI decisions

- Desktop uses Concept 2: compact petrol rail, grouped report register and live selected-report context. Preserve this approved layout.
- Mobile uses the simplified Concept 1-inspired hybrid: compact demo/save header, one prominent creation CTA, direct search, accessible “Sía og raða” disclosure and a separated report list.
- Report titles open contextual details on mobile; separately labelled continuation, draft and sample actions open the existing report destinations directly. The native bottom sheet contains focus, closes with Escape and restores its trigger.
- Retain the deep blue/petrol identity and teal accents. Prioritize readable text, clear status, visible focus, adequate targets and WCAG 2.2 AA as the target. Automated checks do not constitute full conformance.
- Scope remains the shared shell and “Mínar skýrslur”; other screen contents retain their existing behavior. No backend, authentication, payment, PDF or deployment feature was added.
- Local storage retains `astandsskraning-demo-v1` and its versioned schema. Text, rooms and answers persist locally. Photo previews remain temporary in-memory data and disappear on reload.

## Acceptance evidence and known backlog

The [Phase 1A implementation review](PHASE_1A_IMPLEMENTATION_REVIEW.md), [Phase 1A.1 review](PHASE_1A_1_REVIEW.md) and [final review](PHASE_1A_FINAL_REVIEW.md) remain preserved. The latest review recorded 85 passing tests, two expected skips, passing lint/typecheck/build, no tested axe/contrast failures and a 1440 px screenshot pixel-identical to both approved desktop baselines.

Six minor findings were accepted as a backlog rather than silently implemented: explain grouping during mobile name sorting; restore focus after no-results reset; improve small working text; avoid duplicate unfiltered counts; clarify the title-preview cue; label the two-of-three deviation preview. Actual screen-reader, physical-device, Firefox/Safari, native browser zoom and OS/browser text-scaling validation remain outstanding. These items require separately scoped approval before implementation.

[Portable curated QA evidence](qa/phase-1a/README.md) is included in Git. Larger historical screenshots, generated reports, full test artifacts and prototypes remain in ignored `artifacts/`, `playwright-report/` and `test-results/` directories. The historical reviews reference those original paths; a clone contains only the curated evidence unless the archive is restored.

## External backup and Git boundary

Before any baseline preparation changes, 795 existing files (77,223,620 bytes) were copied and individually SHA-256 verified at:

`local-archive/backups/phase-1a-2026-10-15_101742Z/`

`project/` contains the source, configuration, lockfile, documents and complete existing QA evidence. `backup-manifest.json` records paths, sizes and hashes. Reproducible `node_modules/`, `.next/`, `out/`, `coverage/` and Git metadata were excluded. This backup is outside the repository and Git history. It is a local copy on the same physical drive, not an off-device disaster-recovery backup.

The local repository starts on `main`. Its initial commit contains source, tests, scripts, configuration, lockfile, documentation and the curated evidence. `.gitignore` excludes local environment files, credentials/key material, deployment state, dependencies, build/cache output, full generated reports, local logs and editor/OS files. `.env.example` is allowed only as a reviewed, secret-free template; none is currently present. Ignore rules are an additional guard, not a substitute for reviewing future staged changes.

No remote repository was created or configured. Nothing was pushed or deployed. Use `git log -1` and `git status --short --branch` to identify the baseline and current work; do not infer current state from the historical pre-Git handoff. Any future remote setup or product development requires its own authorization.
