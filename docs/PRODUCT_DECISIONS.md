# Product decisions — 14 October 2026

Sources: the preserved [MVP specification](astandsskraning-mvp-v1.md), [phase 1A scope](afangi-1a.md), inspected application code and the user's [latest handoff instruction](handoff-inputs/project-handoff-request.txt). “Approved direction” does not mean implemented. Latest user instructions override prior assistant recommendations.

| Decision | Current status |
| --- | --- |
| One shared platform with asset-specific templates for housing, vehicles, storage/garages and commercial premises | Approved direction; shared asset types and fixture list exist, residential creation only |
| Icelandic HMS residential inspection practices are a reference, without automatic legal-compliance claims or misleading code mappings | Approved direction; residential checklist is a prototype, not independently validated against current HMS practice |
| Guided room/area checklists with no positive default answers | Implemented for residential drafts |
| Condition, cleanliness and functionality recorded separately where appropriate | Implemented with applicability/completion rules |
| Initial and final reports, with standalone inspections where needed | Type selection implemented; linked inspection lifecycle/comparison unimplemented |
| Photos attached to rooms, items and observations, with origin information | Temporary room/item previews implemented; durable storage and provenance pending |
| Incomplete drafts remain saveable; missing answers/evidence are surfaced honestly | Implemented locally; no immutable finalization |
| Counterparties participate without mandatory account creation | Approved direction, unimplemented |
| Invitation link alone never grants access; one-time email codes and scoped access required | Approved direction, unimplemented; email verification is not a legal signature |
| Server-side access checks, private media/PDF storage, expiry/revocation and OTP abuse controls | Approved direction, unimplemented |
| Counterparties can comment, add photos, dispute individual findings and record their own evidence | Approved direction, unimplemented; local draft comments are not counterparty participation |
| Parties cannot silently alter each other's submitted evidence | Approved direction, unimplemented; local mutable drafts do not provide evidence isolation |
| Finalized versions preserve history; amendments are attributable, traceable new records | Approved direction, unimplemented |
| Viewing a report does not equal accepting liability; no response never equals acceptance | Approved product rule; actual invitation/review workflow unimplemented |
| Platform does not determine responsibility for damage | Approved product rule; no liability engine exists |
| Professional PDF comparison reports, preserving missing evidence, provenance and disputes | Planned, unimplemented |
| Mobile-first inspection workflows and accessibility as a core requirement | Implemented responsive draft workflow and measured contrast improvements; full WCAG verification remains outstanding |

Creators are expected to authenticate in a future real MVP. Guest participation must be scoped to its particular inspection/case, with no general asset search. Formal review submissions freeze the version sent; revocation prevents future access without silently deleting historical evidence. Imported evidence must disclose source/uncertainty. Comparison categories describe observations rather than deciding fault. Final privacy, retention/deletion and legal wording require a separate review before real data is introduced. These are requirements to design later, not features to add during the immediate UI task.

## Pricing hypotheses — not launch commitments

- Initial inspections and counterparty participation are intended to be free.
- Proposed individual combined final report/PDF price: **ISK 1,990**; not finalized or implemented.
- Business subscription pricing remains provisional. The old specification mentions tiers starting around ISK 4,900/month; this is a historical hypothesis, not an approved tariff.
- Approximately **70 free reports or credits** are under consideration. Eligibility, allocation, qualifying unit and duration are unresolved. Do not assume “first 70 users” or “first 70 reports”.
- No real payment processing is authorized. No fake scarcity, fictitious former prices or locking people out of their own evidence because of payment.

## Current design authorization

Navy/petrol/teal Option A is the preferred starting point and is already applied to the existing UI. The newly approved layout is Concept 2 for desktop with simpler Concept 1-inspired mobile interaction, limited immediately to shared shell and “Mínar skýrslur”. Contextual details should emphasize essential inspection information and use an accessible mobile drawer/bottom sheet where appropriate. See [UX/UI handoff](UX_UI_HANDOFF.md). The layout is approved but not implemented.

Open decisions: final product name/domain/logo, exact template content, final type/spacing details, pricing and promotion, retention/deletion/privacy, legal signature requirements and B2B permissions/integrations. These do not authorize scope expansion in the next implementation task.
