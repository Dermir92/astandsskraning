# Phase 1B.3b.5 — Mælastaða við afhendingu

**Revised proposal for review · 19 October 2026 · planning only.** Baseline remains merged `main`, `3b090748ed7b2689e95b317c53446238bda36479`. AGENTS.md and the relevant current implementation were read again. Only this proposal is revised; application source, tests, schemas, fixtures, dependencies and persistence are unchanged.

**Final contract review:** approved in principle; the two context-transition safeguards below resolve the remaining data-integrity decisions. The contract is implementation-ready, subject to a separate implementation instruction. This final review adds no legal claims or scope beyond those safeguards and their acceptance criteria.

Recommend one small property-level module with independent **Rafmagn** and **Heitt vatn** entries. Activation is explicit; readings are literal records, with no consumption calculations or technical assessment. Existing drafts acquire neither records nor missing-answer penalties when this module is absent.

## Basis and current source check

Traceability: approved audit [G28](../../research/phase-1b3-hms-audit-2026-10-17/GAP_MATRIX.md), [F22, F01/F02 and event-date precision](../../research/phase-1b3-hms-audit-2026-10-17/FIELD_REQUIREMENTS.md), and [bounded recommendation, item 5](../../research/phase-1b3-hms-audit-2026-10-17/PHASE_1B3B_RECOMMENDATION.md). These exact fields and completion rules remain product proposals.

Source check **19 October 2026, Atlantic/Reykjavik**. The law and lease were reopened for this revision; the index result below is retained from the original same-day check:

| Authoritative source | Verified scope and consequence |
| --- | --- |
| [Húsaleigulög nr. 36/1994, Article 6, item 5](https://www.althingi.is/lagas/nuna/1994036.html) | Current compilation displays 1 October 2026, edition 158a. The lease must state electricity/hot-water readings at delivery when the corresponding meter is separate for the rented premises, and the reading date. This concerns lease contents; recording a draft here does not establish entry into a lease. The paragraph does not establish a universal additional move-out reading requirement. |
| [HMS residential lease, §6, physical/printed p. 4](https://assets.ctfassets.net/8k0h54kbe6bj/28hOipmGJso6ylesdW3fxJ/df32d6e7412f728cc64e836a84796477/Leigusamningur.pdf) | Reopened: independent electricity and hot-water number, reading and date fields at lease commencement. Meter identity is useful form guidance; the cited statutory item specifies readings/date. An explicit unit is our product requirement for an interpretable record. |
| [HMS forms index](https://island.is/s/hms/umsoknir-og-eydublod) | Web reader failed; direct public HTTP retrieval returned 200 and its links still point to the lease above and the audit's condition/fire extract. Publication provenance is confirmed, without treating every form sentence as current law. |

No new claim about historical lease cohorts, mandatory software fields, HMS endorsement or legal completion is proposed. Move-out and other uses are factual product support. No automatic transfer into the lease, provider notification or proof of receipt is implied.

## Placement and availability

Keep **Upplýsingar → Rými → Skráning → Yfirferð**. Put one collapsed property panel after Brunavarnir and before room navigation in Skráning, reachable with zero rooms; put its summary after fire and before rooms in Yfirferð. Preserve room-level heating, fire behavior and the approved petrol/teal palette, Manrope typography, white panels and disclosures. No fifth step, new route or report/PDF redesign.

| Context | Entry and activation |
| --- | --- |
| Residential rental + initial inspection | Offer **Skrá mælastöður við afhendingu**, setting `mode: "rental_initial"`. Explain before activation that this deliberately asks applicability for both utilities. |
| Residential rental + final inspection | Offer **Skrá mælastöður við skil**, setting `mode: "rental_return"`. This is optional return documentation; deliberate activation asks applicability for both utilities as a product rule, not an Article 6(5) move-out mandate. |
| Optional capture, available in any editable apartment context | Offer **Skrá aðeins rafmagn** and **Skrá aðeins heitt vatn**, including as an alternative to paired rental capture. Start `mode: "optional"` with only the selected utility participating. Within optional mode, independent checkboxes can add/remove either utility. No tenant, lease or handover-date prerequisite. |
| Other asset types / reviewed samples | No new editor or requirements; preserve existing behavior. |

Entry actions initialize empty capture or resume its associated purpose. With retained reading facts, a different purpose must pass the inline same-event/new-event decision below; it is never a direct mode assignment.

Absent module: **Mælastöður hafa ekki verið skráðar í þessum drögum.**, with entry actions but zero warnings/tasks/penalties. This does not assert that no separate meter exists. New drafts also start without the module; expansion creates nothing. Unselected optional utilities say **Ekki valið til skráningar**, with zero tasks.

## Exact proposed model additions

Add only the following optional contract alongside the existing property data, if approved later. These declarations are documentation, not edits to `src/lib/model.ts`.

```ts
export type MeterApplicability =
  | "separate" | "shared" | "no_meter"
  | "unknown" | "not_examined";

export type MeterReadingStatus =
  | "recorded" | "not_read" | "unreadable" | "inaccessible" | "unknown";

export type MeterCapturePurpose =
  | "optional" | "rental_initial" | "rental_return";

export interface PropertyMeterReading {
  optionalCapture?: boolean;
  applicability?: MeterApplicability;
  factsApplicability?: MeterApplicability;
  readingStatus?: MeterReadingStatus;
  readingValue?: string;
  unit?: string;
  readingDate?: string;
  meterIdentifier?: string;
  note?: string;
}

export interface PropertyMeterReadings {
  mode?: MeterCapturePurpose | "inactive";
  factsPurpose?: MeterCapturePurpose;
  electricity?: PropertyMeterReading;
  hotWater?: PropertyMeterReading;
}

// One addition inside the existing ApartmentDetails interface:
meterReadings?: PropertyMeterReadings;
```

One entry per utility; no inventory, room/media/provider links or new timestamps. `optionalCapture` adds one boolean per utility: true opts in under optional mode; false/absent opts out. Paired modes ignore this retained flag and deliberately ask both applicability questions. Object/text presence never implies participation. Undefined answers differ from explicit unknown/unexamined; partial objects remain saveable.

The final safeguards add only **two optional enum members**: `factsPurpose` binds the one reading set to its stated purpose; each utility's `factsApplicability` binds its retained facts to their meter arrangement. They are current context associations, not verification, timestamps or history. A separate confirmation boolean or pending-record collection is unnecessary. An absent association never means “confirmed”; reads and unrelated edits must not supply one.

### Applicability and optional shared readings

Use mutually exclusive operational meanings:

- `separate`: a meter serving only this dwelling. If a dedicated submeter and shared upstream meter both exist, record the dedicated one in this small module.
- `shared`: a meter serving this dwelling and others, with no separate dwelling meter. Its reading is a shared total.
- `no_meter`: neither a separate nor shared meter serves this utility for the dwelling, according to the supplied information. This replaces the overlapping “no separate meter” answer. Not seeing a meter does not establish this answer; use unknown/unexamined as appropriate.
- `unknown` / `not_examined`: the arrangement is uncertain / has not been examined.

**Permit an optional shared reading in either capture mode.** Selecting `shared` alone completes applicability. Its optional disclosure offers the same reading-status choices; selecting `recorded` activates value/unit/date minimums without another flag. Every shared reading displays **Sameiginlegur mælir — álestur nær einnig til annarra**; it never represents dwelling-specific consumption or satisfies a separate-meter claim. This slice cannot record both dedicated and upstream shared meters for one utility.

### Raw text, dates and minimal plausibility

All text is stored exactly as entered, including whitespace, leading zeros, decimal commas and unit spelling: `"00123,40"`, `"0"`, `"m³"`. Use text inputs; the reading may offer `inputMode="decimal"`, but never `type="number"`, `Number`, `parseFloat`, rounding or comma replacement. Unit starts blank and is explicitly transcribed; do not infer `kWh` or `m³` from utility kind, another entry or meter identity.

`readingDate` is user-supplied date-only text in `YYYY-MM-DD` form. Use a text input so incomplete/invalid input remains representable; show a format hint, not a default date. Validate a temporary trimmed copy as a calendar date, without timezone conversion or rewriting stored text. Never populate it from today, `updatedAt`, `deliveryDate`, `inspectionDate` or the other utility's date. Invalid/future dates remain saved with a review issue and cannot complete an actual reading.

Check a temporary trimmed copy of nonblank `readingValue`: digits with optional comma/dot fraction; also three-digit space groups (ordinary/NBSP/narrow NBSP), or Icelandic dot groups with optional comma fraction. No conversion, magnitude/range check, separator interpretation or unit inference. Exact proposed pattern:

```text
^(?:[0-9]+(?:[.,][0-9]+)?|[0-9]{1,3}(?:[ \u00A0\u202F][0-9]{3})+(?:[.,][0-9]+)?|[0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?)$
```

`00123,40`, `0`, ` 12 345,60 `, `1.234,50` and `123.45` pass unchanged. `abc`, `123 kWh`, `12,`, `12 34`, `1e3` and `-1` get **Mælastöðuna þarf að yfirfara. Gildið er varðveitt óbreytt og drögin má áfram vista.** Blank values get only a missing-answer issue. Nonblank failures stay visibly qualified **Þarfnast yfirferðar** and cannot complete an ordinary reading. Some legitimate unusual formats remain incomplete drafts; no coercion or override field is added. Unit needs only nonblank raw text; neither its correctness nor physical reading accuracy is verified.

## Conditional completion and retained data

Participation is derived only for editable apartments:

| Stored mode | Participating utilities |
| --- | --- |
| `rental_initial` + rental context + initial type | Both; explicit activation promises to answer both applicability questions. |
| `rental_return` + rental context + final type | Both; the same deliberate product minimum, with return wording. |
| `optional` | Only entries with `optionalCapture === true`. Starting electricity leaves hot water untouched, and vice versa. Both flags absent/false means zero participants and zero tasks. |
| Mode absent, `inactive`, or rental mode mismatched to context/type | None; existing values are retained, with zero tasks. |

For an empty module, paired activation writes only the mode; optional activation also selects the intended utility, leaving the other absent. With existing facts, changing purpose follows the same-event/new-event rule below instead of directly writing mode. Entering optional mode explicitly selects utilities: set existing unselected flags false without creating absent entries or changing retained answers/extensions. Within optional mode, toggling changes only that utility's flag. Thus old flags cannot silently reactivate another utility. Starting paired capture warns that both applicability questions apply. No activation supplies factual answers or text defaults.

For each participating utility, evaluate reading-dependent answers only when both context associations match. If reuse requires confirmation, show that issue instead of treating the old status as current or inventing dependent missing-value tasks.

| Active answer | Completion rule | Review meaning |
| --- | --- | --- |
| Applicability absent | Applicability answer missing; do not infer it from retained text. | Missing answer. |
| Reading facts held by a context mismatch in a current `separate`/`shared` entry | Confirm their arrangement and, if necessary, correct the set's purpose before reuse. | Explicit context-confirmation issue; retained facts do not complete or describe the new context. |
| `no_meter` | Applicability answered; no reading requirements. | Recorded applicability fact, not an inferred zero. |
| `shared`, reading status absent | Applicability answered; a shared reading is optional. | Shared arrangement recorded; no missing reading-status task. |
| `unknown` / `not_examined` | Applicability answered; no further required fields. | Recorded limitation, distinct from an unanswered question. |
| `separate`, reading status absent | Reading-status answer missing. | Missing answer. |
| `separate` or `shared` + `recorded` | Require a nonblank plausible `readingValue`, nonblank `unit`, and valid, nonfuture `readingDate`. Validation uses temporary copies only. | Missing answers and format/date review issues remain distinct. Explicit `"0"` is a value; blank is not zero. |
| `separate` or `shared` + `not_read` / `unreadable` / `inaccessible` / `unknown` | Reading-status answered; no value/unit/date requirements. | Recorded limitation; no reading claimed. |

`meterIdentifier` and `note` are always optional, in every branch. Their absence creates no required marker, issue, correction link or action-count increase. No explanatory note becomes mandatory after a limitation answer.

Utilities never copy or satisfy each other's answers. With participants and zero missing/review issues, show **Völdum mælaspurningum svarað**, possibly alongside **Skráðar takmarkanir**. With none, show no completed label. Missing answers, format/date/context-confirmation issues and limitations stay separate. **Unresolved active meter issues must OR into the existing review `hasAttention` decision**, not merely appear in a local list. Count a set-level purpose issue once, not once per utility, and do not duplicate dependent missing-field issues while confirmation is blocking them. Inactive/context-mismatched modules, unselected optional utilities and non-reading applicability branches add zero meter tasks/attention. Current, context-matched limitation-only answers also add zero. A held old limitation awaiting confirmation is not a current limitation-only answer. Other existing review issues may still require attention. Room statistics, defects, next-incomplete traversal and report-status enums remain unchanged.

Closed summaries prioritize each utility's limitations/issues over a generic answered label. Preserve raw values, e.g. **00123,40 kWh · 2026-10-19**, alongside another utility's **Mælir óaðgengilegur**, rather than “readings complete.”

Changing participation, applicability, status, context or type never clears child data. Context/type changes affect derived relevance only, never stored mode, flags or associations; a mismatched rental mode retains its original event label. Value/unit/date are current claimed facts only for participating `separate/shared + recorded` with matching associations; failed checks keep them qualified. Other values remain under **Varðveittar upplýsingar utan núverandi svars**, excluded from findings/completion. On a context mismatch, retain identifiers, notes and unknown extensions with the old bundle rather than presenting them as facts about the newly selected arrangement/event. Optional identifiers/notes alone never create a confirmation task.

**Taka mælaskráningu úr notkun** sets mode to `inactive`; deselecting an optional utility sets only its flag false. Both retain all answers, associations and extensions. Reactivation in the original purpose/arrangement can reuse the existing associations; choosing a different purpose follows the correction rule below. Restoring the original rental context/type reactivates the same record without rewriting its purpose. Disclosures, summaries and navigation never edit report data; **Hreinsa svar** clears that answer alone, not its siblings or context associations.

### Final safeguards for the two context transitions

**Binding invariant.** Reading facts comprise any explicit `readingStatus` or nonempty raw `readingValue`, `unit` or `readingDate` (including whitespace-only input). First deliberate fact capture into an empty utility may initialize an absent `factsApplicability` to its selected `separate/shared` arrangement; first fact capture into an empty set may initialize an absent `factsPurpose` to its active purpose. Existing associations are never overwritten by ordinary fact edits; existing unbound facts require confirmation, not automatic binding. Reads/unrelated edits initialize neither. Opaque extension data is preserved without interpretation; identifiers/notes remain optional. Known facts are usable only when `factsPurpose === mode` and `factsApplicability === applicability`, as well as the existing participation/context rules.

**1. Applicability change.** Save the new applicability answer, preserving every other field and its old `factsApplicability`. If reading facts exist and the association differs or is absent, hold the entire prior bundle inactive under its original arrangement label (or “unconfirmed context”). Do not preselect the retained reading status as an answer for the new arrangement. Show its raw facts and one inline action: **Staðfesta að varðveittar upplýsingar eigi við valið mælafyrirkomulag**. That deliberate action updates only `factsApplicability` to the displayed selection, preserving all raw strings, other fields and nested extensions. It neither confirms purpose nor makes an invalid reading complete. No modal dialog; no confirmation for an empty bundle or return to its already-associated arrangement. `no_meter`/`unknown`/`not_examined` keep old reading facts inactive with no reading/reuse task. A participating reading-capable entry with held reading facts has one confirmation issue until resolved; changing away and back cannot silently bind them to a different arrangement. If the facts actually concern a different meter rather than a mistaken arrangement choice, leave them retained and use a separate ordinary report for that different record.

**2. Purpose change.** Once the set has reading facts or a `factsPurpose`, stage a purpose different from `factsPurpose` inline; keep stored mode, association, raw facts and participation unchanged until the user chooses what the change means. `inactive` is not a purpose: explicit reactivation matching `factsPurpose` needs no same-event correction. Show the original and candidate purpose and both utilities' retained facts, including unselected entries. **Leiðrétta rangt val á tilgangi — sami atburður** expressly asserts that this is the same underlying event and the earlier purpose choice was mistaken. In one deliberate update, change `mode` and `factsPurpose` to that purpose and apply the explicitly chosen optional participation (or paired minimum); preserve all facts, dates, extensions and utility arrangement associations. This does not confirm a pending arrangement change. Labels/readiness use only stored, associated purpose, never the uncommitted candidate. Dismissal or reload abandons the candidate without a data write. If pre-existing facts lack a purpose association, require the same explicit whole-set review rather than inferring it.

For **Nýr atburður — önnur drög**, use the existing new-report flow, without copying the old meter set or changing the source report. A genuinely new delivery/return/other event belongs in separate ordinary draft capture, not a same-event correction. This includes rental-to-optional and optional-to-rental changes: “optional” is not a bypass for event reassignment. Date corrections remain editable; they never change associations or bypass a purpose decision. The app does not infer event identity from dates or verify the user's same-event assertion. An empty, never-bound module may change purpose directly. No new route, lifecycle, duplicate set, record history or backend. Confirmations always concern the currently displayed facts/target and must not apply a stale preview after another edit.

## Icelandic copy and compact mobile wireframe

| Control / state | Exact proposed copy |
| --- | --- |
| Initial / return / optional title | **Mælastaða við afhendingu** / **Mælastaða við skil** / **Mælastöður · valfrjáls skráning** |
| Paired activation help | Initial: **Spurt verður um rafmagn og heitt vatn við afhendingu. Má fylla út síðar.** Return: **Valfrjáls skráning við skil. Ef þú byrjar verður spurt um rafmagn og heitt vatn. Má fylla út síðar.** |
| Intro | **Skráðu rafmagn og heitt vatn hvort í sínu lagi. Óskráð svar merkir ekki að lesið hafi verið af mæli.** |
| Optional entry actions | **Skrá aðeins rafmagn** / **Skrá aðeins heitt vatn** |
| Optional participation / off state | **Skrá rafmagn** / **Skrá heitt vatn** / **Ekki valið til skráningar** |
| Applicability legend | **Hvernig er mælingu háttað fyrir þessa íbúð?** |
| Applicability choices, in model order | **Mælir eingöngu fyrir þessa íbúð** / **Mælir fyrir þessa íbúð og fleiri** / **Enginn mælir fyrir þessa veitu** / **Óvíst** / **Ekki kannað** |
| Shared reading disclosure / persistent qualification | **Álestur af sameiginlegum mæli · valfrjálst** / **Sameiginlegur mælir — álestur nær einnig til annarra** |
| Reading-status legend | **Var lesið af mælinum?** |
| Reading-status choices, in model order | **Já, álestur skráður** / **Ekki lesið af mæli** / **Mælir ólæsilegur** / **Mælir óaðgengilegur** / **Óvíst hvort lesið var** |
| Reading fields | **Mælastaða** / **Eining** / **Aflestrardagur** |
| Reading / unit help | **Skráðu stöðuna eins og hún var lesin. Komma og núll fremst varðveitast.** / **Skráðu eininguna sem stendur við álesturinn. Ekki giska á einingu.** |
| Date help | **Dagurinn sem lesið var af mælinum. Skráðu á forminu ÁÁÁÁ-MM-DD.** |
| Optional disclosure / fields | **Mælisnúmer og athugasemdir · valfrjálst** / **Mælisnúmer eða auðkenni** / **Athugasemd** |
| Missing answers | **Svar um mælafyrirkomulag vantar** / **Svar um álestur vantar** / **Mælastöðu vantar** / **Einingu vantar** / **Aflestrardag vantar** |
| Invalid / future date | **Aflestrardagur er ekki gild dagsetning. Drögin má áfram vista.** / **Aflestrardagur er í framtíðinni. Yfirfarðu dagsetninguna; drögin má áfram vista.** |
| Retained / inactive help | **Upplýsingarnar eru varðveittar en eru ekki hluti af núverandi mælaskráningu.** |
| Unconfirmed context | **Samhengi varðveittra upplýsinga óstaðfest** |
| Changed applicability / explicit reuse | **Mælafyrirkomulagi hefur verið breytt. Varðveittar upplýsingar eru ekki virkar undir nýja valinu.** / **Staðfesta að varðveittar upplýsingar eigi við valið mælafyrirkomulag** |
| Purpose correction help / action | **Á upplýsingasettið við sama atburð og áður? Leiðrétting á tilgangi skráir ekki nýjan atburð.** / **Leiðrétta rangt val á tilgangi — sami atburður** |
| New event / abandon candidate | **Nýr atburður — önnur drög** / **Hætta við breytingu** |
| Initial draft boundary | **Má fylla út síðar. Skráning hér staðfestir ekki að upplýsingarnar hafi verið færðar í leigusamning.** |
| Return / optional draft boundary | **Má fylla út síðar. Drögin skrá aðeins þær upplýsingar sem þú hefur fært inn.** |
| Correction / stale-target notice | **Breyta mælaskráningu** / **Aftur í yfirferð** / **Tilvísaður reitur er ekki tiltækur. Mælaskráning er opin.** |

Optional electricity-only arrangement at 360 CSS px; synthetic values, never defaults:

```text
Upplýsingar — Rými — Skráning — Yfirferð
Ástandsskráning                  [Yfirferð]
… existing room progress …
▸ Brunavarnir
▾ Mælastöður · valfrjáls skráning
  ☑ Skrá rafmagn
  ☐ Skrá heitt vatn
  Rafmagn · Álestur skráður
  Heitt vatn · Ekki valið til skráningar

  ▾ Rafmagn
    Hvernig er mælingu háttað fyrir þessa íbúð?
    ● Mælir eingöngu fyrir þessa íbúð
    ○ Mælir fyrir þessa íbúð og fleiri
    ○ Enginn mælir fyrir þessa veitu
    ○ Óvíst  ○ Ekki kannað
    Var lesið af mælinum?
    ● Já, álestur skráður
    ○ Ekki lesið af mæli
    ○ Mælir ólæsilegur
    ○ Mælir óaðgengilegur
    ○ Óvíst hvort lesið var
    Mælastaða       [00123,40           ]
    Eining          [kWh                ]
    Aflestrardagur  [2026-10-19         ]
    ▸ Mælisnúmer og athugasemdir · valfrjálst
  Heitt vatn · Ekki valið til skráningar
  Má fylla út síðar. …
Velja rými [Forstofa                    ▾]
… existing room editor / footer …
```

Fields stack; no horizontal table or sticky toolbar. Paired rental capture replaces participation checkboxes with its initial/return title and both utility disclosures. Shared capture uses the optional reading disclosure and persistent qualification. Reading fields appear for participating `separate/shared + recorded`; optional identity/notes and retained data remain reachable. Opening/closing never activates capture or selects an answer.

## Correction navigation against current main

Checked the [fire resolver](../../../../src/lib/fire-navigation.ts), [fire focus hook](../../../../src/components/use-fire-correction.ts), [room hooks](../../../../src/components/use-inspection-navigation.ts), [position helpers](../../../../src/lib/inspection-navigation.ts), [screen](../../../../src/components/screens/inspection-screen.tsx) and [review-anchor focus](../../../../src/components/fire-observation-summary.tsx). Fire claims any `hluti`/`flokkur`/`rad`/`reitur` key, even invalid combinations. Room effects load/remember position, replace URLs and focus controls unless suspended by the current fire guard. A distinct namespace alone is insufficient.

Propose only a sibling correction path within existing `skraning`:

```text
/skyrslur/<encoded-id>/skraning?maelar=rafmagn&maelaReitur=readingValue&fra=yfirferd
```

- Allow exactly one each of `maelar` (`rafmagn` / `heitt-vatn`), `maelaReitur` (known user-facing utility field, including `optionalCapture`) and `fra=yfirferd`; no other keys or arbitrary return URL. Context-association members are not URL-editable targets. Either meter key identifies correction intent, including malformed links.
- Fire keys retain precedence: mixed fire/meter links use existing fire invalid-link fallback with no competing meter focus. Meter/room mixtures and other malformed meter links fall back to the meter heading. No URL repair, data writes or activation.
- Extend the current screen/hook suspension narrowly to meter correction: bypass room load/remember, URL replacement, focus effects and room-readiness waiting. Preserve fire behavior and navigation-storage bytes; allow zero rooms. Explicit room selection exits correction through the existing handler and may remember the chosen position normally.
- Open ancestors and focus once per entry/re-entry: checked enabled radio, otherwise first enabled radio, or text/checkbox control. A blocked fact target reveals its context explanation and focuses the inline confirmation affordance instead of pretending the old fact is current; a set-level purpose issue uses that same meter panel. No refocus on typing/save/retry/rerender. Inactive targets open retained data if available, otherwise focus the heading. Never instantiate records, confirm context or select answers for a URL.
- Correction entry pushes a normal Link entry. **Aftur í yfirferð** uses fixed `/skyrslur/<encoded-id>/yfirferd#review-meter-readings` with current property-correction `replace` semantics, bypassing room `returnToReview`. Mirror existing review-anchor focus for a visible, focusable meter heading even after issues disappear. No guessed `router.back()`, new history framework or store. Verify Back/Forward and direct/reloaded links separately.

## Focused acceptance criteria for later implementation

| Area | Required evidence |
| --- | --- |
| Read-only preservation | Open/reload pre-core/core/rental/fire/heating drafts, absent module and samples; view summaries, expand disclosures and follow corrections: no report-storage writes, changed report bytes, answers or timestamps. Meter correction also leaves room-position storage unchanged. Ordinary room navigation may maintain its existing separate position metadata, without mutating report data. An absent module always adds zero tasks. |
| Genuine edits / legacy data | An unrelated real edit may update `updatedAt` and reserialize storage through the normal store. Require deep equality and identical key presence/raw string values for pre-existing meter data, nested fields and extensions; an absent module stays absent. Do not require whole-envelope byte equality after legitimate writes. No backfill, activation, reset or transformation; only the intended unrelated fields/normal metadata change. |
| Independent participation | Optional electricity-only and hot-water-only leave the other absent/unselected with zero tasks, including entry from paired/inactive mode with old true flags. Deselect/reselect retains answers/extensions. Paired initial/return capture deliberately asks both applicability questions. Shared/no-meter meanings are disjoint; shared applicability alone needs no reading, and claimed shared readings carry their qualification. |
| Claim completion / retention | Exercise each applicability/status branch, missing value/unit/date individually, explicit zero and blank/whitespace. Format/date issues differ from missing answers and recorded limitations. Optional identifiers/notes add zero tasks. Toggle context, initial/final type, mode, participation and applicability away/back: retain all data, never relabel initial readings as return readings or infer units/dates. |
| Context-transition safeguards | Run the focused cases below; association mismatches never count retained facts as current. Confirmations change only the expressly confirmed scope and preserve the other guard. |
| Raw text / plausibility | Round-trip all passing/failing examples above, ordinary/NBSP/narrow-NBSP grouping, incomplete dates and arbitrary original unit/identifier/note strings. Format failures remain saveable, clearly qualified and incomplete. Neither checks nor display rewrite raw text; summaries preserve zeros/commas and shared scope. |
| Local data safety | Preserve the existing store contract: `astandsskraning-demo-v1`, envelope version 1, protected reads and failed-write retry. Later additive structural validation accepts absent/partial members, checks known boolean/string/enum types, and keeps format/completion failures saveable. Nested immutable edits retain unknown extensions at every level and unrelated reports. Malformed known structures retain protected-read behavior and never overwrite source storage with fixtures. No migration/new persistence mechanism. |
| Navigation / regression | Test the correction contract above, malformed/duplicate/mixed keys, stale/inactive/absent targets, zero rooms, reload, revisit of the same correction after ordinary entry, Back/Forward and return after resolving an issue. Assert unchanged remembered room/item and no competing focus or URL rewrite. Keep room-next-incomplete, four routes, heating, fire corrections and session-only photo associations unchanged. |
| Accessibility / visual language | Native fieldsets/legends, separately named utility radio groups and labelled optional-participation checkboxes; explicit clear actions; hints/errors linked with `aria-describedby`; format/date issues use `aria-invalid`. Keyboard and manual screen-reader checks cover activation, shared qualification, conditional/retained disclosures and correction/return focus. No focus theft or color-only meaning. Preserve contrast, visible focus, 44 px targets and approved styling. Check 320/360/390/768/1440 px, 200% text, long labels/raw values, whitespace-preserving wrapping and axe. |

These are proposed checks, not executed application verification. The preservation distinction follows the current [store](../../../../src/components/demo-provider.tsx): hydration reads without rewriting, whereas genuine `updateReport` calls update normal report metadata. A later approved implementation should run normal lint/type/build checks and relevant core/rental/fire/heating/navigation/storage regressions.

### Focused acceptance tests for the final safeguards

These are test specifications in this document only; no test files or application code are added.

| Case | Expected result |
| --- | --- |
| Arrangement A → B | Seed an associated separate reading with `00123,40`, padded original unit/date text, status, identifier, note and nested unknown extensions. Change to shared: only applicability changes; old association/raw data remain, the old status is not selected as a shared answer, and no shared reading is claimed. One active confirmation issue contributes to review attention. Reload/navigation/unrelated edits preserve that state. Explicit confirmation changes only `factsApplicability`; the reading can then appear with its shared qualification if its other checks pass. Repeat shared → separate. |
| Arrangement round trips / independent guard | A → B → A without confirmation restores only the original associated context. After confirming B, returning to A requires confirmation again. Clearing/reselecting applicability or editing a retained value never auto-rebinds facts. Arrangement confirmation cannot resolve a missing/mismatched `factsPurpose`, and purpose correction cannot resolve an arrangement mismatch. No bulk confirmation, default zero, inferred date or unit. |
| Non-reading / optional states | Switch to `no_meter`, `unknown` or `not_examined`, deselect the optional utility, or make the module inactive/context-mismatched: retained facts/associations/extensions survive and contribute zero meter tasks/attention. A context-matched `not_read`, `unreadable`, `inaccessible` or `unknown` status is a completed limitation-only answer with zero tasks. An old held status under a different reading-capable arrangement is unconfirmed, not an active limitation-only answer. Optional identifier/note-only data add no task. |
| All purpose changes | Cover all six directed transitions among optional, initial delivery and return, in compatible contexts. With an existing set, selecting a candidate changes no stored mode, association, flags or facts; summaries keep the original event label. Dismiss/reload leaves source storage/timestamps unchanged. For a deliberately mistaken purpose, confirm **sami atburður**: mode/set association and intentional participation change atomically; raw strings, dates, utility associations and all unknown fields survive. Rental capture still deliberately asks both applicability questions. |
| Genuine new event | Select the new-event action instead of same-event correction. Existing report and associations remain unchanged, including unselected/inactive utility data. The ordinary new-report flow starts without meter facts/associations. Neither initial → return nor an intermediate optional mode can copy/reclassify the old set as a new event. Editing a date changes neither purpose/arrangement associations nor the pending purpose decision; do not pretend to detect actual event identity from that edit. |
| Unbound and stale facts | Load a structurally valid partial module with reading facts but absent context associations: no inference/backfill. In a participating reading-capable branch, required context confirmation appears instead of a completed reading. A purpose issue is counted once across utilities; dependent arrangement/value issues wait for its resolution. Fresh capture may initialize absent associations only when no prior facts are being reused. A stale confirmation preview must not confirm facts/targets changed by a later edit. |
| Review integration / nonmutation | With all unrelated review causes controlled, active missing answers, plausibility/date failures and required context confirmations set the meter contribution to `hasAttention` and expose correction links. Resolving them removes that contribution; inactive, unselected, non-reading and current limitation-only states add none. Preserve other review reasons. Read-only disclosure/correction focus never writes association defaults or timestamps. Confirmations are deliberate meter edits and may update normal report metadata; preserve failed-write retry and nested extensions. |

## Changed decisions and residual trade-offs

| Review finding | Revised decision and remaining cost |
| --- | --- |
| 1. Independent participation | One optional boolean per utility; optional capture asks only selected utilities. Paired rental capture intentionally asks both applicability questions. This adds two simple selection controls, while preserving the stronger minimum only after a clear paired action. |
| 2. Applicability / shared readings | Replace overlapping `no_separate_meter` with `no_meter`; allow an explicitly claimed, clearly labelled shared reading with the same fields. Knowing there is no relevant meter is a stronger assertion; uncertain users have unknown/unexamined answers. One utility cannot hold both dedicated and upstream shared readings. |
| 3. Initial versus return | Separate `rental_initial`/`rental_return` modes and Icelandic titles; context mismatch suspends the old mode. No move-out legal mandate or additional lifecycle. One report holds one purpose/set; automatic initial/final pairing and dual-event capture remain excluded. |
| 4. Legacy preservation | Require byte/timestamp nonmutation for report reads; genuine edits may update ordinary metadata, while preserving meter members/absence and nested extensions. This preserves information rather than promising identical JSON formatting after every save. |
| 5. Plausibility | A small character/grouping check qualifies implausible reading text without coercion or blocked draft saving. Some legitimate international/signed/scientific formats remain review issues; passing syntax proves neither numeric meaning nor meter accuracy. |
| 6. Navigation / accessibility | Keep separate meter keys; suspend all conflicting room effects, preserve existing fire precedence and use fixed property-review return/focus. This needs a narrow future screen/hook integration, not just a new link, but adds no route, navigation store or history framework. |
| Final: applicability integrity | One per-utility arrangement association holds old facts inactive across a changed choice until explicit inline reuse. Returning to the original association needs no extra confirmation. This records a self-declared correction, not proof of meter identity. |
| Final: purpose integrity | One set-level purpose association survives deactivation. A purpose correction explicitly means the same event; a genuinely new event uses ordinary separate report creation without copying facts. No histories or event-detection algorithm; the same-event assertion remains user-supplied. |

Scope ends at local factual capture and review. Exclude provider integrations, billing, consumption/delta calculations, new physical measurements, meter testing/calibration, photos, keys/inventory, backend work, report export and all other features. **The two remaining contract concerns are resolved; the proposal is implementation-ready. Stop here: this planning-only turn does not authorize implementation, which needs a separate instruction.** No commit, push, merge or deployment.
