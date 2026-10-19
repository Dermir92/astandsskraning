# Phase 1B.3b.3 — Residential fire-safety observations

**Approved specification · 18 October 2026 · implementation authorized with the clarifications below.**

Recommend **C: one compact property-level Brunavarnir section in Skráning, with optional location details**. Record detectors, extinguishers and visible escape routes separately. All answers describe observations within a stated scope; none establishes a professional fire inspection, compliant premises or completed statutory inspection. Every incomplete draft remains saveable and editable.

## Review package

| Document | Contents |
| --- | --- |
| [Contract and states](CONTRACT_AND_STATES.md) | Exact proposed TypeScript, applicability, missing/unknown semantics, conditional completeness and synthetic examples. |
| [UX and Icelandic copy](UX_AND_COPY.md) | Placement alternatives, mobile wireframes, capture prompts, review, correction navigation and future Concept C mapping. |
| [Compatibility and verification](COMPATIBILITY_AND_VERIFICATION.md) | Current-code findings, storage protections, affected files, accessibility and regression acceptance plan. |
| [Sources and decisions](SOURCES_AND_DECISIONS.md) | Official-source classification, audit traceability, heating recommendation and owner approval decisions. |

These four documents and this index are the entire proposed package. TypeScript and JSON fences are specifications, not application files or executable migrations. Existing design, research, review and archive packages are retained.

The authorized implementation and its final verification are recorded in the [Phase 1B.3b.3 implementation review](../../../PHASE_1B3B3_FIRE_OBSERVATIONS_REVIEW.md).

## Recommended arrangement

Keep **Upplýsingar → Rými → Skráning → Yfirferð**. In Skráning, place a single property-level disclosure after the existing overall room-item progress and before the room selector/sidebar. Its heading and the three group statuses remain visible when closed. The property section is outside the keyed room editor, so changing rooms cannot create repeated fire answers or lose editing state.

Opening Brunavarnir exposes three independent disclosures: **Reykskynjarar**, **Slökkvitæki**, **Sýnilegar flóttaleiðir**. Initially each asks only whether it was examined. Presence and equipment facts appear only after an examination answer makes them relevant. There is no whole-section “Í lagi” choice, automatic positive answer or fifth step.

For present equipment, start with one compact observation row for the equipment described. Location/count details and additional rows are optional. Rows can describe one unit or a clearly bounded set with the same observations; a different test result or service label needs its own row. The test scope explicitly identifies what was tested. Do not sum rows into a property inventory or claim every observed detector was tested.

| Context | Capture | Yfirferð and attention |
| --- | --- | --- |
| `residential_rental` | Brunavarnir always appears, initially closed with visible group status. All three groups are product-readiness prompts. | Missing answers, limitations and observed concerns remain conspicuous; answering “not examined” removes an unanswered question but leaves an examination limitation. |
| `standalone` | Same location, labelled **Brunavarnir · valfrjáls skráning**. No stored opt-in flag; opening alone writes nothing. | No rental missing-answer penalty. Supplied observations/limitations stay visible; observed physical concerns still receive factual attention. |
| Absent/empty context | Same optional section, with **Tengsl við íbúðarleigu eru óskráð.** | No inferred rental requirements. Existing missing-context issue remains; entered fire facts and concerns remain visible. |
| Any context switch | Change only the explicitly selected context and the existing edit timestamp. | Re-evaluate relevance without deleting, resetting, completing or copying fire/rental values. Returning to rental restores its missing-answer checks. |

The optional section costs one compact row outside rental; this is preferable to hiding existing fire data or requiring a persisted activation switch. Optional missing answers do not become rental obligations. A recorded failed test or obstruction remains relevant regardless of context.

## Minimal additive contract

Add only proposed `ApartmentDetails.fireSafety?: ResidentialFireObservations`, containing optional `smokeDetectors`, `extinguishers` and `escapeRoutes` groups. Do not add `Report` state, checklist items, template defaults, legal grades or a second persistence envelope. The [exact contract](CONTRACT_AND_STATES.md) separates:

- No answer from explicitly unknown or not examined.
- Equipment observed from none observed in the examined area.
- A test actually performed from a test not performed.
- An observed response from no observed response or an unknown result.
- A readable service label from no label observed, unreadable, unexamined or unknown.

No core group offers N/A: absent equipment and inaccessible routes have truthful dedicated answers. Existing `Condition`, `Functionality` and `Cleanliness` retain their current meanings.

## Review outcome

Add a compact **Brunavarnir** summary after rental/core context and before rooms. Show each group, its observed findings and scope, unrecorded values and explicit limitations. A separate attention group distinguishes **Upplýsingar vantar**, **Takmarkanir skoðunar** and **Atriði sem þarfnast athygli**. Categories may overlap and are not a safety score.

“Brunavarnarspurningum svarað” means applicable software prompts have explicit answers. It must always coexist with any not-examined/untested/unknown limitations and concerns. Do not change room progress, `reportStats`, `reportStatus` or `sampleReviewed`. Do not claim this draft fulfills physical duties, signing, distribution or lease incorporation.

## Scope recommendation and approval stop

**Defer heating to a separate small follow-up.** The approved audit identifies a real heating/visible-control gap, but adding it here would also change room-template scope. [The proposed follow-up and its limits](SOURCES_AND_DECISIONS.md#heating-recommendation) require a separate owner decision; no heating implementation is included.

The owner approved the seven decisions in [Sources and decisions](SOURCES_AND_DECISIONS.md#owner-approved-implementation-decisions): placement, exact contract, conditional answer minimums, optional-context treatment, compatibility, evidence boundary and heating deferral. The owner also instructed implementation of this slice, with heating deferred and no commit, push, merge or deployment.

## Repository baseline

Repository: the canonical sanitized checkout; origin: `https://github.com/Dermir92/astandsskraning.git`; branch: `main`. Local HEAD, local `main`, cached `origin/main` and a successful read-only `git ls-remote origin refs/heads/main` all resolve to **`8719157ac0981329110961fe3d248c3bf8b90f9b`**. The initial sandboxed network attempt failed; the permitted read-only network check succeeded. No fetch or branch change was needed.

Initial tracked and staged diffs were empty. Pre-existing untracked entries were `docs/PHASE_1B3B2_RENTAL_INFORMATION.md`, `docs/design/`, `docs/phase-1b3/planning/PHASE_1B3B2_RENTAL_INFORMATION.md` and `docs/research/`. They are source material to preserve, not cleanup targets. Preservation verification is recorded in [Compatibility and verification](COMPATIBILITY_AND_VERIFICATION.md#original-planning-only-verification-before-implementation-approval).

**Implementation is authorized for this approved slice. Concept C rendering/PDF, heating and the other excluded infrastructure remain outside scope. No commit, push, merge or deployment is authorized.**


## Owner approval — implementation authorized

18 October 2026: the owner approved this contract and UX arrangement, deferred heating, and authorized implementation without commit, push, merge or deployment. Optional equipment counts, locations and equipment-scope descriptions remain contextual limitations only: no required-field task or action-count increase. Required answers, limitations and concerns remain separate. Collapsed summaries always prioritize active concerns (including a failed detector response in any mixed row) over generic answered, incomplete or untested statuses. Deterministic ordering and verification are recorded in the implementation review. This approval supersedes earlier planning-only stop language for the authorized implementation slice.
