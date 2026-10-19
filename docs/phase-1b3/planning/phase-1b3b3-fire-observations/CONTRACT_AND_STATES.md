# Proposed contract and state meanings

**Owner-approved contract, including the clarifications below.** This contract stores factual answers, not compliance, chronology or verified professional results. Its types are intentionally independent of room assessment enums.

## Exact proposed TypeScript

```ts
export type FireExamination =
  | "examined"
  | "partly_examined"
  | "not_examined"
  | "unknown";

export type FirePresence = "observed" | "none_observed" | "unknown";

export type FireVisibleCondition =
  | "no_visible_issue_observed"
  | "visible_issue_observed"
  | "not_examined"
  | "unknown";

export interface FireScope {
  examination?: FireExamination;
  examinedDescription?: string;
  unexaminedDescription?: string;
  note?: string;
}

export interface FireEquipmentEntry {
  id: string; // Stable local row ID, created only by an explicit user edit/add.
  location?: string; // Described location/set, independent of room IDs.
  observedCount?: string; // Raw user input; missing/blank is not zero.
  visibleCondition?: FireVisibleCondition;
  visibleIssueDescription?: string;
  note?: string;
}

export interface BasicDetectorTest {
  performance?: "performed" | "not_performed" | "unknown";
  testedScopeDescription?: string; // Which detector(s) this result concerns.
  result?: "response_observed" | "no_response_observed" | "unknown";
}

export interface SmokeDetectorEntry extends FireEquipmentEntry {
  basicTest?: BasicDetectorTest;
}

export interface ExtinguisherServiceLabel {
  status?: "readable" | "none_observed" | "unreadable"
    | "not_examined" | "unknown";
  observedText?: string; // Literal legible text/date(s), not a validity date.
}

export interface ExtinguisherEntry extends FireEquipmentEntry {
  serviceLabel?: ExtinguisherServiceLabel;
}

export interface FireEquipmentGroup<T extends FireEquipmentEntry>
  extends FireScope {
  presence?: FirePresence;
  entries?: T[];
}

export interface VisibleEscapeRoutes extends FireScope {
  obstruction?: "observed" | "none_observed" | "unknown";
  affectedLocation?: string;
  obstructionDescription?: string;
}

export interface ResidentialFireObservations {
  smokeDetectors?: FireEquipmentGroup<SmokeDetectorEntry>;
  extinguishers?: FireEquipmentGroup<ExtinguisherEntry>;
  escapeRoutes?: VisibleEscapeRoutes;
}

// Sole additive member in the EXISTING ApartmentDetails interface:
// fireSafety?: ResidentialFireObservations;
// Existing Report/details/rental/room/observation members remain unchanged.
```

All optional enum omissions mean **not recorded**, not unknown. Do not introduce empty-string enum values; UI “Hreinsa svar” explicitly removes only the selected known answer. Optional raw strings may be absent or `""`; whitespace-only strings are missing for presentation but are not normalized on save. Unknown JSON extension fields are retained at every level even though these public types do not enumerate them.

No stored `complete`, `safe`, `compliant`, `testedAll`, `maintenanceValid`, timestamp, grade, readiness count, photo key or activation flag. Reuse explicitly supplied inspection date/name as report context, without claiming a separate fire-test timestamp. Entered labels and observations are the recorder's unverified account.

## Scope and location rules

`examined` means the recorder examined the described accessible scope; it does not mean every device, room or building route was covered. `partly_examined` explicitly states that some intended scope could not be examined. `not_examined` states no examination for that group. `unknown` states that whether examination happened cannot be established by the recorder.

Equipment rows describe observed equipment within a location or clearly bounded set. They are not a complete asset inventory. One undivided row supports the simplest case; add rows only to distinguish locations, results or labels. Counts describe equipment **seen in that row**, not devices tested or legally needed. Multiple rows are never automatically summed: scopes may overlap, be unknown or omit equipment. Location prose is not synchronized with room names, reordered rooms or deletion of a room.

The initial blank equipment row is a UI placeholder only. The first explicit row edit allocates an ID and stores only that input. “Bæta við staðsetningu” may explicitly store an ID-only row; it asserts no observation. Keep IDs stable thereafter. No bulk fill, split/merge, row deletion or reordering UI is proposed in this slice. Fields can be individually cleared. Rows with no selected known answer, nonblank known prose/count or unknown extension payload are ignored in review and completeness; ID-only rows, blank strings and empty nested test/label objects are not meaningful content. Extension-only rows get a passive retained-data disclosure and no inferred observation.

Different detector test results need separate rows. A positive result means a response was observed for the **described basic test**, not that a detector senses smoke correctly, all detectors work or coverage is adequate. `testedScopeDescription` identifies the actually tested subset even if the row's observed count is larger. Never infer “all tested” from count, location or row membership. A negative result means no response was observed during that test; do not diagnose the cause or certify that a device is unusable.

Extinguishers have no functional-test field. Record only visible condition and service-label facts. `observedText` can contain partial dates, several stamps or other legible wording exactly as entered. Do not parse it into a certified service event, expiry date, overdue finding or automatic maintenance schedule.

## State dictionary

| Required distinction | Exact representation | Reader-facing meaning |
| --- | --- | --- |
| Not recorded | Missing object/member; optional empty prose; no relevant answer | **Óskráð**. No assertion about examination, presence or test. |
| Explicitly unknown | Relevant enum `unknown` | **Óvíst**. An explicit answer and a visible knowledge limitation. |
| Not examined | Group `examination: "not_examined"` | **Ekki skoðað**. Not missing, not absent, not a pass. |
| Partially examined | `examination: "partly_examined"` | **Skoðað að hluta**; show examined and unexamined areas. |
| Examined, present | Active examined/partly-examined group + `presence: "observed"` | **Búnaður sást** within the described scope; operation remains separate. |
| Examined, not present | Active examined/partly-examined group + `presence: "none_observed"` | **Enginn búnaður sást á skoðuðu svæði**; no claim about unseen areas. |
| Tested, observed working response | Active observed row + `performance: "performed"`, `result: "response_observed"` | **Viðbragð sást eða heyrðist við prófun**, qualified by tested scope. |
| Tested, observed not working response | Same, `result: "no_response_observed"` | **Ekkert viðbragð sást eða heyrðist við prófun**; concern, cause undetermined. |
| Test performed, result unknown | `performance: "performed"`, `result: "unknown"` | **Prófun gerð · niðurstaða óviss**. |
| Present, not tested | Active observed row + `performance: "not_performed"` | **Sást · ekki prófað**. Explicit limitation. |
| Testing not recorded / uncertain | Missing performance / `performance: "unknown"` | **Prófun óskráð** / **Óvíst hvort prófað var**; distinct states. |
| No visible issue | `visibleCondition: "no_visible_issue_observed"` | **Enginn sýnilegur annmarki sást**; no functional or technical assurance. |
| No visible obstruction | Examined route + `obstruction: "none_observed"` | **Engin sýnileg hindrun sást á skoðaðri leið**; no design/egress certification. |
| Not applicable | Intentionally absent from these three groups | Missing equipment is `none_observed`; inaccessible/out-of-scope routes are `not_examined`/partial, never N/A. |

N/A could be justified for a future *specific optional* check whose precondition does not exist, for example inspection of an optional fire blanket when none is supplied. It would need an explicit applicability/reason contract. F21 is deferred, so no speculative N/A field or optional-equipment requirement is added here.

## Active answers, retained values and draft completeness

Known fields may be structurally valid together yet semantically incomplete or inconsistent. Do not reject such drafts at the storage boundary. Derive issues without writing fixes.

1. Missing examination: one missing group answer. Do not produce a cascade of hidden presence/test/label errors.
2. Examination `unknown` or `not_examined`: answer recorded; limitation remains. Subsidiary presence, rows and results are inactive retained values, separately viewable/editable.
3. Examination `examined`/`partly_examined`: require explicit presence for equipment; require obstruction and nonblank `examinedDescription` for routes. Unknown presence/obstruction is an explicit answer with a limitation. Partial examination also needs `unexaminedDescription`; blank produces one correctable description gap, never a save block.
4. Active equipment `none_observed`: answer recorded and concern shown. No equipment rows, test or label answers are required. Count remains unstored; do not backfill `"0"`. Retained rows are not presented as current equipment.
5. Active equipment `observed`: require at least one row with known content. Each such row needs an explicit visible-condition answer; smoke additionally needs test performance, and extinguishers a label status. Missing count/location stays visibly unknown without a product-minimum penalty. Missing examined area in equipment scope is also a disclosed scope limitation, without a compulsory additional form field.
6. Active test `performed`: require explicit result and nonblank tested scope. Unknown result is permitted and remains a limitation. Active `not_performed`/`unknown` needs no result; any stored result/scope remains retained and cannot imply a current test. Never invent a scope to satisfy readiness.
7. Visible issue: require a short description; unknown location is disclosed. Readable label: require observed text; other label states need no text. Inactive description/label text is retained separately, without current-finding status.
8. Route obstruction `observed`: require affected location and factual description. Blanks remain missing; the user can describe uncertainty honestly. `unknown` obstruction remains a limitation. `none_observed` never means “safe escape route.”
9. A nonblank count is interpretable only as a positive base-10 safe integer. Retain `0`, negative, decimal, nonnumeric and excessively large strings with a nonblocking attention message; do not round or normalize. `"0"` conflicts with active presence observed. Counts have no sufficiency algorithm.

There is no enforcement that a layperson undertake a test. A user can choose not examined/not performed/unknown, or leave a draft incomplete. For a reported test whose method or result cannot be described confidently, keep the uncertainty visible.

Derive three nonexclusive lists: **missing**, **limitations**, **concerns**. Unknowns, partial scope, not examined, untested, unreadable/unexamined labels and unrecorded optional counts/locations are limitations, without converting all optional detail omissions into required tasks. Missing group/conditional answers are gaps. No equipment observed, no detector response, visible issues and obstructions are concerns; unreadable/missing labels also need factual follow-up, not a legal-service verdict. Invalid counts and active contradictions require correction. Show one concise primary status per group plus all relevant details. No total of these overlapping lists is a safety metric.

## Synthetic example states

Values below are fictional specifications, never defaults. Each object is the proposed `details.fireSafety` value. Other groups left out remain **Óskráð**, even if one group has a complete answer.

### Empty / older draft

```json
{}
```

Also accept the entire `fireSafety` member being absent. Rental review shows three missing group answers. No viewing, opening or hydration writes `{}` into the draft.

### Partially examined

```json
{
  "smokeDetectors": {
    "examination": "partly_examined",
    "examinedDescription": "Forstofa",
    "unexaminedDescription": "Svefnherbergi læst",
    "presence": "observed",
    "entries": [{
      "id": "example-smoke-1",
      "location": "Forstofa",
      "observedCount": "1",
      "visibleCondition": "no_visible_issue_observed",
      "basicTest": { "performance": "not_performed" }
    }]
  }
}
```

Review: detector seen in entry; bedroom not examined; test not performed. This group has explicit answers **and** limitations. No inference about detector presence in the bedroom.

### Equipment absent in examined scope

```json
{
  "extinguishers": {
    "examination": "examined",
    "examinedDescription": "Íbúðin; sameign ekki skoðuð",
    "presence": "none_observed"
  }
}
```

Review: **Ekkert slökkvitæki sást á skoðuðu svæði**; attention remains. Do not create a zero count, N/A, test or label date.

### Present but untested

```json
{
  "smokeDetectors": {
    "examination": "examined",
    "presence": "observed",
    "entries": [{
      "id": "example-smoke-2",
      "visibleCondition": "unknown",
      "basicTest": { "performance": "not_performed" }
    }]
  }
}
```

Review: presence recorded; count/location/examined area unknown; no test; visible condition uncertain. All minimum answer choices can be supplied without inventing any of these facts.

### Failed basic test with another untested detector

```json
{
  "smokeDetectors": {
    "examination": "examined",
    "examinedDescription": "Forstofa og stofa",
    "presence": "observed",
    "entries": [
      {
        "id": "example-smoke-3",
        "location": "Forstofa",
        "observedCount": "1",
        "visibleCondition": "no_visible_issue_observed",
        "basicTest": {
          "performance": "performed",
          "testedScopeDescription": "Prófunarhnappur á skynjara í forstofu",
          "result": "no_response_observed"
        }
      },
      {
        "id": "example-smoke-4",
        "location": "Stofa",
        "observedCount": "1",
        "visibleCondition": "unknown",
        "basicTest": { "performance": "not_performed" }
      }
    ]
  }
}
```

Review shows the failed observed response and untested living-room detector separately. It does not label every detector broken or tested. A working-response variant changes only the first result to `response_observed`; scope and other limitations remain.

### Explicitly not examined

```json
{
  "smokeDetectors": { "examination": "not_examined" },
  "extinguishers": { "examination": "not_examined" },
  "escapeRoutes": {
    "examination": "not_examined",
    "unexaminedDescription": "Engin vettvangsskoðun fór fram"
  }
}
```

Review: **Brunavarnarspurningum svarað · ekkert af þessum þremur sviðum skoðað**. Three examination limitations remain; no equipment presence/absence, passed tests or completed physical inspection is implied.

### Label and route edge cases

Readable label example: `serviceLabel: { status: "readable", observedText: "Yfirfarið 09/2025; næsta skoðun 09/2026" }`. Show that literal text, without calculating validity. Distinct alternatives are `{ status: "none_observed" }`, `{ status: "unreadable" }`, `{ status: "not_examined" }`, `{ status: "unknown" }` and no member (**Óskráð**).

Route example: `examination: "partly_examined"`, `examinedDescription: "Gangur frá íbúð að útihurð"`, `obstruction: "observed"`, `affectedLocation: "Við útihurð"`, `obstructionDescription: "Kassar á gönguleið"`, `unexaminedDescription: "Kjallari óaðgengilegur"`. Both obstruction and incomplete coverage remain visible; no building-wide conclusion follows.


## Owner approval — implementation authorized

18 October 2026: the owner approved this contract and UX arrangement, deferred heating, and authorized implementation without commit, push, merge or deployment. Optional equipment counts, locations and equipment-scope descriptions remain contextual limitations only: no required-field task or action-count increase. Required answers, limitations and concerns remain separate. Collapsed summaries always prioritize active concerns (including a failed detector response in any mixed row) over generic answered, incomplete or untested statuses. Deterministic ordering and verification are recorded in the implementation review. This approval supersedes earlier planning-only stop language for the authorized implementation slice.

## Approved clarification: optional omissions and summary precedence

Optional equipment count, location and examined-area descriptions are contextual limitations only. They remain visible in the read-only facts/limitations list, have no required-field issue or correction-task link, and contribute zero to the action count. Required route/test scope and explicitly conditional descriptions retain the approved minimums. Missing required answers, limitations and concerns remain separate lists; no combined count is a safety metric. Outside rental, optional missing answers never become rental tasks.

Collapsed group and section summaries scan **all active rows** before selecting a label. Deterministic concern priority is: (1) no observed detector-test response, (2) visible route obstruction, (3) no equipment observed, (4) visible equipment issue, (5) missing/unreadable service label, (6) invalid or contradictory entered count. Ties use fixed group order (detectors, extinguishers, routes), then stored row order. Every active concern precedes missing-answer/incomplete and generic answered/untested labels. After concerns, group summaries show required-answer gaps, then non-contextual limitations, then answered. Inactive retained values never win concern precedence or count as current findings. Mixed positive, untested and failed rows must retain the failed response in the collapsed summary.

Action counts include active concerns and, only in rental, missing required answers. Limitations do not add action tasks. Rental review can still flag an actual not-examined/untested/unknown limitation without turning an optional count/location/scope omission into a task or attention-count increase.
