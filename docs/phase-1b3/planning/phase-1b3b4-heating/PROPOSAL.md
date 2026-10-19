# Phase 1B.3b.4 — Hiti: approved scope and contract

The owner approved the room-level proposal and three clarifications: mixed visibility remains one record; visible equipment OR scope identifies the observed parts; wholly reported concealed equipment needs both its description and source. No observed response or mixed responses are factual observations, never automatic defects, broken-function answers or repair tasks. Implementation is authorized for review only; no commit, push, merge, deployment or meter work.

Base: `8e99f2a74c2f1d0debcbb1b76afb94bb8ee9674a` (merged PR #6). Traceability: [audit G20](../../research/phase-1b3-hms-audit-2026-10-17/GAP_MATRIX.md) and [fire-package heating follow-up](../phase-1b3b3-fire-observations/SOURCES_AND_DECISIONS.md#heating-recommendation). The kitchen `oven` / **Ofn** remains a cooking appliance.

## Placement and templates

One **Hiti** checklist item after **Ljós og rofar**, using the existing single expanded room editor, four steps, room progress, correction/return routes and petrol/teal visual language. New residential rooms explicitly opt into the new template: entry, living, kitchen, bedroom, bathroom, laundry, storage and custom each receive one unanswered tagged item. New reports therefore start with 51 items instead of 46. Balconies have no default heating item. Legacy template callers and sample fixtures retain their original templates.

Existing rooms are never regenerated or backfilled. **Bæta við hitaskráningu** explicitly appends one unanswered item, opens it and preserves all other items/observations. ID collisions, including orphan observation keys, receive a new ID without replacing data. A newly added room in an older report uses the new template; older rooms remain unchanged. Review discloses the lack of a dedicated heating item without changing legacy totals or creating a missing-answer penalty.

## Additive contract

`ChecklistItem.kind?: "space_heating"` identifies the new editor independently of names or IDs. `Observation.heating?: HeatingObservation` contains:

```ts
interface HeatingObservation {
  equipment?: ("radiators" | "underfloor" | "thermostat" | "other")[];
  visibility?: "visible_parts" | "reported_concealed" | "none_visible"
    | "not_examined" | "unknown";
  scope?: string;
  informationSource?: string;
  visibleCondition?: Exclude<Condition, "na"> | "unknown";
  operation?: "tried" | "not_tried" | "unknown";
  action?: string;
  response?: "observed" | "none_observed" | "mixed" | "unknown";
  responseDescription?: string;
}
```

`informationSource` is the minimal addition to the original proposal: a separate scope-source input permits a real completion check for both supplied facts and their source, without trying to infer a source from arbitrary prose. It is not a per-device subsystem or verification of the stated source. The existing observation's note and defect type/location/description fields are reused. Shared assessment enums remain unchanged; no heating value is silently mapped to generic `functionality`.

## Completion and factual semantics

All records need explicit visibility and ordinary-operation answers before counting as recorded. For `visible_parts`, equipment selections OR nonblank scope identify the observed parts, and an explicit visible-condition answer is needed. Some relevant equipment being visible means `visible_parts`, even when other equipment is concealed; scope must distinguish reported concealed equipment and its information source. A visual grade applies only to the identified visible parts.

For `visible_parts`, a nonblank active `informationSource` records the visibility limitation **Uppgefinn búnaður sem sást ekki**. Derive this only from the structured source field; equipment selections and prose do not imply it. It adds no required answer or defect. In `none_visible`, `not_examined`, `unknown` or absent visibility, retained source information adds no current finding; `reported_concealed` retains its own existing visibility limitation.

For `reported_concealed`, both scope and informationSource are needed. Other visibility states add no equipment/scope/source requirements. `none_visible` means only that no heating equipment was seen, not that heating is absent or inapplicable. `not_examined` and `unknown` stay explicit limitations.

For `tried`, require the action and its equipment/scope, explicit response, and factual response description. The description can record uncertainty and a short observation window; no temperature, pressure or precise-duration measurement is required. `not_tried` and `unknown` are answered limitations. All incomplete, contradictory or uncertain structurally valid records remain saveable drafts.

Only active visible-condition `defect`/`damaged` answers produce a defect count and the existing defect-detail requirements. `none_observed` and `mixed` may lead a factual summary but create no automatic defect, “Virkar ekki”, missing-defect-photo requirement or repair task. Review separately counts incomplete items, items with recorded limitations and items with explicit defects. The categories may overlap; no total is a heating safety score.

Changing parent answers preserves inactive equipment/scope/source, visual grades, attempted-operation facts and defect prose in separate retained-data disclosures. They do not affect current completion/defect counts. Reads, disclosure changes and navigation never mutate reports or event timestamps.

## Copy and mobile arrangement

Use **Hiti**, **Ofnar**, **Gólfhiti**, **Hitastillir**, **Annað**. Visibility choices are **Sýnilegir hlutar**, **Uppgefinn búnaður sem sást ekki**, **Enginn hitabúnaður sást**, **Ekki skoðað**, **Óvíst**. Ordinary operation is **Var venjuleg notkun reynd? — Já / Nei, ekki prófað / Óvíst**. Responses distinguish observed, none during the observation, mixed and unknown.

Help: **Skráðu aðeins það sem sást og það sem var reynt. Hitun getur tekið tíma. Þetta er ekki fagleg úttekt á hitakerfi.**

```text
Skráning · Stofa
Ljós og rofar                  Skráð
Hiti                        Óskráð +
  Hvað sást? [explicit radio choices]
  Búnaður: □ Ofnar □ Gólfhiti □ Hitastillir □ Annað
  Afmörkun og heimild [disclosure]
  Sýnilegt ástand [when visible]
  Var venjuleg notkun reynd? ○ Já ○ Nei ○ Óvíst
  [If tried: what was done + response + description]
  [If explicit visible defect: existing defect fields]
  Athugasemd um hita
  Næsta ófullskráða atriði          Loka atriði
```

## Acceptance boundary

Verify old/new templates and explicit add, OR versus AND completion, mixed visibility, concealed/no-visible/unexamined/unknown states, factual response precedence, explicit defects, retained values and unknown extensions. Preserve v1 envelope/version/storage key, protected reads and failed-write retry. Test correction focus and return, navigation-only nonmutation, existing item photo associations and session-only reload behavior. Audit keyboard controls, clear actions, 44 px targets, axe, 320/360/390/768/1440 CSS px and 200% text. Run normal checks and existing fire/core/rental/room/storage regressions.

No boiler servicing, pressure/temperature measurements, electrical/combustion/chimney checks, maintenance validity, professional certification, durable media, report/PDF redesign, backend, meter readings or other implementation phase.
