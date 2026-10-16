# Public publication and development continuity

Prepared 16 October 2026 for the proposed public GitHub repository `Dermir92/astandsskraning`. Repository creation and push require the owner's final publication approval. No open-source LICENSE is included, as requested.

## Current implementation and preserved archives

The active residential flow includes Phase 1A/1A.1, Phase 1A.2 refinements, Phase 1B.1a safety fixes and the bounded Phase 1B.2a checklist. The current inspection screen and observation editor remain unchanged. Exact room/item continuation and broader optional photo access are later work, as recorded in [the implementation review](PHASE_1B2A_INSPECTION_CHECKLIST.md).

The three `/hugmyndir` routes and `src/components/inspection-concepts/` preserve the A/B design archive. All thirteen formerly untracked concept/approval files are included together. They retain their original prototype code, tests, scripts and synthetic image; only documentation has been sanitized or clarified. Historical prototype messages and broader design proposals do not define the current application scope.

Historical documents retain their dated decisions and test evidence. Paths under `artifacts/`, `local-archive/` and `archived-worktrees/` describe separately preserved local evidence, not extra files distributed in a normal clone. Full generated QA reports, environment files, dependencies and build output remain ignored. The small curated Phase 1A evidence set under `docs/qa/phase-1a/` remains tracked. Historical handoff-manifest hashes refer to the original preserved files before documentation sanitization, not the current README or privacy-edited documents.

## Sanitized history

The four original commits are reconstructed in their original order with the original messages and author/committer timestamps. Both author and committer use `Dermir92 <208407465+Dermir92@users.noreply.github.com>`. This identity follows [GitHub's documented ID-based noreply format](https://docs.github.com/en/account-and-profile/reference/email-addresses-reference) and the authenticated account ID and login. No account settings or global Git settings were changed.

Personal filesystem roots and local usernames are removed from every historical documentation revision. Repository file links are relative; external HTTP links are preserved. Application, test, script, asset and dependency blobs match their corresponding original commits. The publication repository was created afresh and contains no original private commit objects, backup refs or origin pointing to the original checkout.

| Preserved original commit ID | Sanitized commit ID | Original subject |
| --- | --- | --- |
| `c8e921660db76e3ee78939ca304166c3e3d9e071` | `a49b2a25209ace1e87f04af109ed6227bf705412` | chore: establish approved phase 1a baseline |
| `5997b9348aef17a689f3034a1905487b5a3e1631` | `6bf3e627c48a825bfec124471fe839aebfdd759b` | fix: complete phase 1a2 ux refinements |
| `d5c0615946caa385f591061705b1234adc3ef1dc` | `ea9b8909b5a34640425464d3eafb650284bd7ecc` | fix: protect local drafts and enforce save validation |
| `968a846907ec97a439fa220af905dbb82b3b8c8e` | `5473063a775f3b17e21aaf648a32da86aec6de95` | feat: integrate approved Phase 1B.2a inspection checklist |

Original IDs in historical prose refer to this map. Those IDs alone do not include the old commit contents in the public repository. A fifth repository-hygiene commit adds all thirteen concept/approval files, the reviewed ignore rules and these documentation clarifications. No functional application changes are part of publication preparation.

## Continue from one canonical history

After publication, use this sanitized repository or a fresh clone of `https://github.com/Dermir92/astandsskraning.git` for all future development. Create new feature branches and worktrees from its sanitized `main`. Use the repository-local noreply identity for every commit.

Keep the original repository, its feature worktrees, raw backup and original Git bundle as a local historical archive. Its merged feature work is already represented by the four sanitized commits and must not be merged or cherry-picked a second time. Do not add the old repository as a publishing remote, merge its ancestry into the sanitized repository, or push its branches, tags, backup refs or a mirror. This prevents the original private metadata from becoming reachable again.

If new work is made in an original worktree after the preservation checkpoint, review and port only the new file changes as a patch onto a branch based on sanitized `main`; review documentation and identities and scan again before committing. Never merge the old ancestry. The preservation inventory and private old/new mapping remain outside the public repository.

Only sanitized `main` is intended for the first push: `git push --set-upstream origin main:main`. Later publication must use a normal first push, without force, mirror or all-ref options. This establishes a single canonical development history while leaving the original archive intact.

## Candidate verification

The isolated candidate passed `npm ci`, route-type generation, `npm run typecheck`, `npm run lint` and `npm run build` using the unchanged lockfile and Next.js 16.4.0. The full unchanged Chromium suite passed against this candidate's production server on a separate local port: **190 passed, 2 expected skips, zero failures and zero flaky tests**. The two skips are the existing intermediate-width test duplicated in the mobile projects.

| Project | Passed | Expected skips |
| --- | ---: | ---: |
| desktop | 64 | 0 |
| mobile-360 | 63 | 1 |
| mobile-390 | 63 | 1 |

All contexts use synthetic test data and disposable browser storage. The original application, concept code, tests, scripts, assets, package files and runtime configuration are byte-identical to the preserved checkout. The same application/test/script/asset blobs are preserved in each of the four historical commits. This verifies the exercised Chromium flows; the historical physical-device and other-browser limitations remain unchanged.

The final all-history secret/privacy scans, complete Git-object inventory and original-worktree preservation checks are recorded in the separate local review archive, alongside the tested HEAD identity. Build/test reports remain ignored. Publication requires a passing final report and the owner's final approval; no GitHub repository is created and nothing is pushed during preparation.
