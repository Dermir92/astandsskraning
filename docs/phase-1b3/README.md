# Phase 1B.3 approved design and requirements baseline

17 October 2026. The owner approved the HMS/legal requirements audit as the **requirements-analysis baseline for Ástandsskoðun**. The approved refined **Concept C report design remains unchanged**. This package preserves that decision and the completed research for review in a Draft Pull Request targeting `main`.

Approval of the audit accepts its analysis as the baseline. It does not resolve every open legal question, approve every proposed field, or authorize Phase 1B.3b implementation. The [field catalogue](research/phase-1b3-hms-audit-2026-10-17/FIELD_REQUIREMENTS.md), [open decisions](research/phase-1b3-hms-audit-2026-10-17/DECISIONS_AND_QUESTIONS.md), and [bounded scope recommendation](research/phase-1b3-hms-audit-2026-10-17/PHASE_1B3B_RECOMMENDATION.md) retain their proposal status.

## Approved product boundaries

1. **Standalone inspections must not inherit irrelevant residential-rental requirements.** Lease parties, lease identifiers, national IDs, handover keys or meters must not become universal prerequisites for an unrelated standalone draft. Relevance and unknown states must remain explicit.
2. **Independent standalone inspection is not equivalent to an agreed impartial examiner under Article 69.** The current `independent` inspection type describes a standalone record. It does not prove appointment, agreement, authority, impartiality or qualification under the statutory route.
3. **Fire-safety observations must not imply professional fire-safety certification.** Detector presence, an ordinary test-button result, a visible service label or an unobstructed visible route does not establish technical adequacy or a whole-property safety pass.
4. **Legal obligations and proposed software fields must remain distinct.** A/B/C/D legal/advisory classifications in the audit differ from product priorities, proposed field readiness rules and the earlier existing/derived/capture/infrastructure classification. A duty does not automatically prescribe an app field, layout, grade or schema.
5. **Lack of an in-app response must not be presented as having no legal consequences under Icelandic law.** The app may state that it has recorded no explicit approval. It must not promise that silence has no effect on statutory objections, notice deadlines or rights. A saved draft comment is not proof of notice sent or received. Historical prototype phrases such as “no response is not consent” express an app-state intention only and are not approved legal assurances. Narrowed wording remains a separately reviewed implementation task; the approved design artifacts are preserved unchanged.
6. **Do not claim HMS approval or statutory-compliance certification.** The audit identifies sources, conflicts and gaps. Neither the audit, report design nor an eventual preview is HMS-endorsed, legally certified, registered with HMS or professionally safety-certified.

## Deliverables

| Completed work | Publication entry point |
| --- | --- |
| Phase 1B.3a competitor research | [Comparison, page references and publisher URLs](design/phase-1b3a/competitor-research.md); [source identification hashes](design/phase-1b3a/source-references.json) |
| Original Concepts A, B and C | [Side-by-side comparison](design/phase-1b3a/comparison.html); [interactive viewer](design/phase-1b3a/index.html); [design findings](design/phase-1b3a/README.md) |
| Approved refined Concept C | [Interactive design](design/phase-1b3a-c-refinement/index.html?fixture=large); [A4/PDF review entry](design/phase-1b3a-c-refinement/a4.html) |
| Final design findings and information contract | [PDF corrections](design/phase-1b3a-c-refinement/PDF_REVIEW_CORRECTIONS.md); [information contract](design/phase-1b3a-c-refinement/INFORMATION_CONTRACT.md); [earlier refinement findings](design/phase-1b3a-c-refinement/REVIEW.md) |
| Curated synthetic visual evidence | [Selected screenshots, synthetic assets, provenance and final PDFs](EVIDENCE.md) |
| HMS/legal requirements audit | [Audit overview](research/phase-1b3-hms-audit-2026-10-17/README.md); [legal and Concept C analysis](research/phase-1b3-hms-audit-2026-10-17/LEGAL_AND_CONCEPT_C.md) |
| Full 40-row gap matrix | [G01-G40 matrix](research/phase-1b3-hms-audit-2026-10-17/GAP_MATRIX.md); [CSV](research/phase-1b3-hms-audit-2026-10-17/gap-matrix.csv) |
| Authoritative source references | [Dated source register and form-version issues](research/phase-1b3-hms-audit-2026-10-17/SOURCES.md); [reference URLs and hashes](research/phase-1b3-hms-audit-2026-10-17/source-files.json) |
| Proposed field requirements | [Field catalogue and context-sensitive readiness](research/phase-1b3-hms-audit-2026-10-17/FIELD_REQUIREMENTS.md) |
| Open legal and product decisions | [Owner decisions and HMS/lawyer questions](research/phase-1b3-hms-audit-2026-10-17/DECISIONS_AND_QUESTIONS.md) |
| Recommended bounded Phase 1B.3b scope | [Current audit-informed recommendation](research/phase-1b3-hms-audit-2026-10-17/PHASE_1B3B_RECOMMENDATION.md); [earlier design-stage proposal](design/phase-1b3a-c-refinement/PHASE_1B3B_SCOPE.md) |

The audit-informed recommendation takes precedence over the earlier three-field proposal when planning a later phase. Its upper bound is context-aware residential draft capture and a read-only preview, with individually approved common metadata, conditional rental data, modest fire observations and deliberate meter handling. Exact field/persistence changes require separate authorization. Signatures, formal execution, durable media, actual legal notices, registration, production PDF export and other asset types remain outside that recommended slice.

## Preservation and publication scope

The verified home checkout was on sanitized `main` at `2313f55278f2957f4d417e6965ebc3a40441f10f`, matching remote `main`, with origin `https://github.com/Dermir92/astandsskraning.git`. Only `docs/design/` and `docs/research/` were untracked; tracked files were unchanged. The publication branch is `codex/phase-1b3-design-research`.

All 296 existing design/research files were copied into a verified local preservation archive before preparation. Their original working files remain untouched and untracked. Only this new curated `docs/phase-1b3/` package is intended for staging. No production source, schema, persistence, dependencies, routes or workflows are changed.

Prototype HTML/CSS/JavaScript, fixtures, selected screenshots, required image assets and both final synthetic PDFs are copied byte-for-byte. Documentation copies add publication context, repair relative links and remove machine-specific provenance references. Supporting gallery navigation is curated for the published evidence set. The refined viewer already uses JPEG derivatives; its redundant full-size source PNGs are retained locally rather than redistributed.

Third-party PDFs, downloaded source HTML, extracted text, raw research page renders, complete QA runs, logs, backups and preservation archives are excluded. Publisher source URLs and selected identification hashes are retained instead. The two included PDFs are our fictional synthetic design reports, with text, fonts, images and internal navigation; they are the complete final report examples, not third-party redistributions. They are retained despite their approximately 9 MB sizes because representative screenshots cannot preserve the complete long-report design. [Exact file inventory and exclusions](FILES.md).

Historical review documents describe the checks performed during design/research and retain their limitations. They are not fresh production verification or legal advice. Physical printing, real screen-reader reading order, cross-browser/other-viewer behavior, reader testing and the unresolved legal confirmations remain open. Source claims are preserved as the dated approved analysis; publication does not constitute a new legal audit.

## Preview the preserved designs

GitHub displays the documentation and images; clone the branch to run the isolated static HTML viewers. From the repository root:

```powershell
python -m http.server 4382 --bind 127.0.0.1 --directory docs/phase-1b3
```

Open `http://127.0.0.1:4382/design/phase-1b3a-c-refinement/index.html?fixture=large` or `http://127.0.0.1:4382/design/phase-1b3a/comparison.html`. Only fictional packaged data are used. The static review files are not a production report export feature.

Stop after the Draft PR is prepared. Do not merge, deploy or begin Phase 1B.3b.
