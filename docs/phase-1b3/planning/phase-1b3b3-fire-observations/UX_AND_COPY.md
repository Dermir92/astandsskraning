# Workflow, Icelandic copy and review

**Owner-approved UX arrangement, including the clarifications below.** Wireframes show information arrangement, not new production screens or a redesign of approved Concept C.

## Placement decision

| Option | Benefit | Cost | Recommendation |
| --- | --- | --- | --- |
| A. One property section with flat group answers | Fewest navigation concepts. | One positive/negative test or label cannot accurately describe different devices without carefully scoped detail. | Useful starting arrangement, insufficient as the entire information model. |
| B. Fire questions in relevant rooms | Immediate location context. | Repeated questions; ambiguity for shared routes; answers disappear when a room is absent; would tie fire facts to room editing/removal and existing assessment enums. | Reject for this phase. |
| C. Compact property summary plus optional location rows | One question set, mixed findings retained, independent of room list and four-step navigation. | A small repeatable-row editor for users with differing observations. | **Recommend.** Default to one undivided observation row; additional rows only when useful. |

Place Brunavarnir after overall room-item progress and before the room navigation/editor in existing Skráning. Its three statuses are readable without opening it. Keep it outside `RoomInspection key={room.id}` and outside the sidebar: it applies to the property and must remain reachable on mobile and with no rooms. Keep existing room navigation, next-incomplete behavior and room progress independent. The zero-room message should appear alongside the reachable fire section, not return early before it renders.

Upplýsingar retains its approved rental panel; no additional administrative form goes there. Yfirferð links to exact fire fields in Skráning. Ordinary entry leaves the property disclosure closed; a fire correction opens the necessary ancestors. Open/close state is local UI state, never an observation or localStorage default. Do not open the disclosure automatically again after every keystroke or room change.

## Mobile capture wireframes

At 360–390 CSS px, the first view adds one ordinary white section with thin dividers. Labels and status text wrap; there is no horizontal table, sticky fire toolbar or colorful safety card.

```text
Upplýsingar — Rými — Skráning — Yfirferð
Ástandsskráning
[Yfirferð]

18 af 42 atriðum skráð                 [room-item progress]
▸ Ófullskráð atriði (24)

▸ Brunavarnir
  Reykskynjarar · Óskráð
  Slökkvitæki · Óskráð
  Sýnilegar flóttaleiðir · Óskráð
  Skráðu það sem þú sást eða prófaðir.

Velja rými [1. Forstofa                  v]
Forstofa
Skoðunaratriði ...
```

On opening Brunavarnir, show the short observation-limit text and three group disclosures. No answer is selected. Group summaries include the primary concern or limitation even when closed.

```text
▾ Brunavarnir
  Skráning athugana staðfestir ekki að eignin uppfylli
  brunavarnakröfur eða að fagleg brunaúttekt hafi farið fram.

▾ Reykskynjarar · Sást · ekki prófað
  Voru reykskynjarar skoðaðir?
  ( ) Skoðað  ( ) Skoðað að hluta
  ( ) Ekki skoðað  ( ) Óvíst hvort skoðað var

  Sáust reykskynjarar á skoðuðu svæði?
  ( ) Reykskynjari sást
  ( ) Enginn reykskynjari sást  ( ) Óvíst

  Búnaður sem sást
  Sýnilegt ástand [choice group]
  Var einföld prófun gerð? [choice group]
  ▸ Staðsetning, fjöldi og athugasemdir
  [+ Bæta við staðsetningu]
  ▸ Umfang og takmarkanir

▸ Slökkvitæki · Óskráð
▸ Sýnilegar flóttaleiðir · Ekki skoðað
```

The visible “Búnaður sem sást” row is a form placeholder until an explicit edit. Additional rows are location details, not repeated group-level examination/presence questions. Start count/location/note disclosures closed; open one for direct correction or when its entered content needs attention. Test scope/result appears immediately only for a performed test. Service text appears only for a readable label. Obstruction details appear only when an obstruction was observed.

If several devices have different responses or labels, **Bæta við staðsetningu** adds a separate row. Announce and focus its heading once. Keep existing rows mounted while editing. Do not copy answers from the previous row, current room or a positive example. Explain that location rows are not a whole-property inventory. No batch pass, row merge, reorder or remove-row control is needed in this minimum slice; individual answers remain clearable.

## Exact Icelandic labels and help

All choice labels below map to the [contract](CONTRACT_AND_STATES.md). Legends use normal language; internal enum strings never appear in product copy. Native radios start unselected. An explicit **Hreinsa svar** action returns a selected enum to unrecorded; “Óvíst” is a separate selectable answer, not a placeholder.

### Common section and examination

| Purpose | Proposed Icelandic copy |
| --- | --- |
| Section | **Brunavarnir** |
| Optional section | **Brunavarnir · valfrjáls skráning** |
| Intro | **Skráðu það sem þú sást eða prófaðir. Óskráð svar merkir ekki að búnaður hafi verið skoðaður.** |
| Persistent limit | **Skráning athugana staðfestir ekki að eignin uppfylli brunavarnakröfur eða að fagleg brunaúttekt hafi farið fram.** |
| Saveable draft hint | **Má fylla út síðar. Ófullgerð svör hindra ekki vistun draga.** |
| Examination legend: detectors / extinguishers / routes | **Voru reykskynjarar skoðaðir?** / **Voru slökkvitæki skoðuð?** / **Voru sýnilegar og aðgengilegar flóttaleiðir skoðaðar?** |
| Examination choices | **Skoðað** / **Skoðað að hluta** / **Ekki skoðað** / **Óvíst hvort skoðað var** |
| Examined area | **Hvaða svæði voru skoðuð?** |
| Examined route | **Hvaða leiðir voru skoðaðar?** |
| Unrecorded examined area | **Skoðað svæði óskráð**; keep any absence/no-issue statement limited to the examined area. |
| Unexamined area | **Hvað var ekki skoðað?** |
| Scope help | **Lýstu aðeins því svæði eða þeim búnaði sem þú skoðaðir. Þú getur skráð takmarkað aðgengi og svæði utan skoðunar hér.** |
| Unknown / unrecorded | **Óvíst** / **Óskráð** |
| Retained values disclosure | **Varðveittar upplýsingar utan núverandi svars** |
| Retained help | **Þessar upplýsingar eru varðveittar en falla ekki undir núverandi val. Þær eru ekki sýndar sem núverandi niðurstaða.** |
| Unknown extension notice | **Önnur varðveitt gögn**; no raw JSON editor or invented interpretation. |

### Reykskynjarar

| Prompt | Choices / help |
| --- | --- |
| **Sáust reykskynjarar á skoðuðu svæði?** | **Reykskynjari sást** (`observed`); **Enginn reykskynjari sást** (`none_observed`); **Óvíst**. Singular choice permits multiple units; count is separate. |
| **Staðsetning eða afmarkaður hópur** | **T.d. skynjari í forstofu. Skráðu fleiri staðsetningar sérstaklega ef niðurstöður eru ólíkar.** |
| **Fjöldi sem sást** | **Skráðu fjölda aðeins ef hann er þekktur. Fjöldinn staðfestir ekki nægjanlega dreifingu eða virkni.** Blank hint: **Fjöldi óskráður**. |
| **Sýnilegt ástand** | **Enginn sýnilegur annmarki sást** / **Sýnilegur annmarki sást** / **Ekki skoðað** / **Óvíst**. |
| **Lýsing á sýnilegum annmarka** | **Lýstu því sem sást; ekki þarf að greina orsök.** |
| **Var einföld prófun gerð?** | **Já, prófun var gerð** / **Nei, ekki prófað** / **Óvíst hvort prófað var**. |
| Test help | **Skráðu aðeins prófun sem þú framkvæmdir. Fylgdu leiðbeiningum framleiðanda og prófaðu aðeins ef það er öruggt. Notaðu ekki eld eða reyk til prófunar.** |
| **Hvaða skynjari eða skynjarar voru prófaðir?** | **Afmarkaðu hvaða búnað niðurstaðan á við. Ekki gera ráð fyrir að allir skynjarar sem sáust hafi verið prófaðir.** |
| **Hvað kom fram við prófunina?** | **Viðbragð sást eða heyrðist** / **Ekkert viðbragð sást eða heyrðist** / **Niðurstaða óviss**. |
| Test-result limit | **Viðbragð við einfaldri prófun staðfestir ekki fulla virkni eða nægjanlega brunaviðvörun.** |
| **Athugasemdir** | **Valfrjálst.** |

Do not require access equipment, battery removal, disassembly or a particular physical procedure. The prompt records a user-performed basic test; the application supplies no professional testing protocol. If uncertain, the user can select not performed or unknown.

### Slökkvitæki

| Prompt | Choices / help |
| --- | --- |
| **Sáust slökkvitæki á skoðuðu svæði?** | **Slökkvitæki sást** / **Ekkert slökkvitæki sást** / **Óvíst**. |
| Location/count/visible condition | Reuse the labels above with **T.d. slökkvitæki við útihurð** as the location example. |
| **Þjónustumiði** | **Miði sást og var læsilegur** / **Enginn þjónustumiði sást** / **Miði var ólæsilegur** / **Miði ekki skoðaður** / **Óvíst**. |
| **Texti eða dagsetning á miða** | **Skráðu aðeins það sem þú gast lesið, eins og það stendur á miðanum. Ekki giska á óskýran texta.** |
| Service limit | **Upplýsingar af miða staðfesta ekki að viðhald sé gilt eða að tækið uppfylli kröfur.** |
| Safe prompt, always visible in this group | **Ekki tæma eða virkja slökkvitæki til að prófa það. Skráðu aðeins það sem sést.** |

A missing label, unreadable label and unexamined label are separate answers. No “expired/current” badges, annual countdown or maintenance-validity inference.

### Sýnilegar flóttaleiðir

| Prompt | Choices / help |
| --- | --- |
| Scope help | **Skoðaðu aðeins sýnilegar og aðgengilegar leiðir. Ekki opna læst svæði eða fara inn á hættulegt svæði vegna skráningarinnar.** |
| **Sást hindrun á skoðaðri leið?** | **Sýnileg hindrun sást** / **Engin sýnileg hindrun sást** / **Óvíst**. |
| **Hvar sást hindrun?** | Free text, not a mandatory room association. |
| **Lýsing á hindrun** | **Lýstu því sem þú sást, t.d. hlutum á gönguleið.** |
| **Leiðir eða svæði sem voru ekki skoðuð** | Free text; scope exclusion is not N/A. |
| Route limit | **Þetta er skráning sýnilegra aðstæðna, ekki faglegt mat á flóttaleiðum hússins.** |

### Warning and correction copy

Use the existing restrained warning text/border, paired with words. These are observation prompts, not legal findings or messages sent to another person.

| Trigger | Proposed copy |
| --- | --- |
| No detector observed | **Enginn reykskynjari sást á skoðuðu svæði. Þarf athygli.** |
| No extinguisher observed | **Ekkert slökkvitæki sást á skoðuðu svæði. Þarf athygli.** |
| No test response | **Ekkert viðbragð skráð við prófun. Láttu kanna búnaðinn.** |
| Obstruction | **Sýnileg hindrun skráð á flóttaleið. Þarf athygli.** |
| Visible equipment issue | **Sýnilegur annmarki skráður. Þarf athygli.** |
| Missing/unreadable label | **Þjónustuupplýsingar ekki læsilegar eða miði sást ekki. Láttu kanna viðhald tækisins.** |
| Count format/contradiction | **Yfirfarðu fjöldann. Skráðu heila tölu stærri en núll fyrir búnað sem sást, eða hreinsaðu reitinn ef fjöldinn er óþekktur. Drögin má áfram vista.** |
| Missing test scope | **Lýsingu á því hvaða skynjari var prófaður vantar.** |
| Missing partial scope | **Lýsingu á svæðum eða búnaði sem var ekki skoðaður vantar.** |
| Unknown outside rental | **Valfrjáls skráning í þessu samhengi. Skráðar athuganir og takmarkanir eru varðveittar.** |

No instructions to operate/discharge extinguishers, assess smoke/fire doors technically, test alarm audibility throughout a building or certify device placement. No general emergency banner is necessary for this observation form.

## Yfirferð

Place one read-only property section after `CoreCaptureSummary` and `RentalInformationSummary`, before **Rými og niðurstöður**. At mobile widths put the short fire attention information in document flow before room findings, with the existing fuller attention area retaining correction links. Do not bury concerns below all room records or duplicate the whole narrative in two places.

```text
Brunavarnir                         [Breyta brunavörnum]
Skráning athugana · drög

Reykskynjarar
Sást í forstofu · fjöldi sem sást: 1
Prófað: prófunarhnappur á skynjara í forstofu
Ekkert viðbragð sást eða heyrðist · Þarf athygli
Stofa: sást · ekki prófað

Slökkvitæki
Ekkert slökkvitæki sást á skoðuðu svæði · Þarf athygli

Sýnilegar flóttaleiðir
Ekki skoðað · Takmörkun skoðunar

Upplýsingar vantar
  ...only missing applicable answers...       [correct]
Takmarkanir skoðunar
  Stofa: ekki prófað; flóttaleiðir ekki skoðaðar.
Atriði sem þarfnast athygli
  Ekkert viðbragð í forstofu; slökkvitæki sást ekki.

Skráð svör staðfesta ekki að eignin uppfylli
brunavarnakröfur eða að lögbundinni úttekt sé lokið.
```

Render every active row in its group, including no-issue, unknown and untested rows. Show entered prose in full with normal wrapping; do not suppress negative/limited findings in a collapsed “details” list. Optional blank count/location display **Fjöldi óskráður / Staðsetning óskráð**. A failed test's absent location is a limitation, never an invented room. Inactive retained values have their own neutral disclosure; do not mix them into current findings or invent when they were recorded.

| State | Header/status and attention behavior |
| --- | --- |
| Empty rental | **Brunavarnarupplýsingar vantar**; three group correction links. |
| Some missing answers | **Brunavarnir · skráning ófullgerð**; known concerns/limitations still precede optional prose. |
| Minimum choices supplied | **Brunavarnarspurningum svarað**; no green check, pass or compliance conclusion. |
| All three not examined | **Brunavarnarspurningum svarað · ekkert af þessum þremur sviðum skoðað**; three explicit limitations, overall rental attention remains. |
| Optional no data | Short **Brunavarnir · engar athuganir skráðar** with optional capture link; no rental gap list. |
| Optional entered data | Same factual summary, labelled optional; gaps/limitations local to that section, known concerns also in attention. |

For rental, any fire missing answer, limitation or concern participates in the review attention state. Outside rental, no missing optional answer creates a rental readiness task; actual concerns still do. Never make all choices answered suppress physical limitations, optional unknowns or other remaining rental/meter/execution gaps.

## Correction navigation

Use a separate fire correction helper on the existing `/skyrslur/[id]/skraning` route. Proposed example:

`/skyrslur/{id}/skraning?hluti=brunavarnir&flokkur=reykskynjarar&rad={rowId}&reitur=testResult&fra=yfirferd`

Allowlist `hluti=brunavarnir`, the three group tokens `reykskynjarar`, `slokkvitæki` and `flottaleidir`, and actual field targets. Encode values with `URLSearchParams`; keep human labels separate from tokens. Known field targets are `examination`, `examinedDescription`, `unexaminedDescription`, `presence`, `location`, `observedCount`, `visibleCondition`, `visibleIssueDescription`, `testPerformance`, `testedScopeDescription`, `testResult`, `labelStatus`, `labelText`, `obstruction`, `affectedLocation`, `obstructionDescription`, and `note`. Only accept targets valid for their group/row.

Accept zero or one row ID, and only an existing uniquely identified row for that group/report. Missing-row links go to the relevant group's first unanswered prompt and announce **Staðsetningin fannst ekki lengur. Viðeigandi flokkur er opinn.** Never create a row by following a link. Reject duplicate/malformed query selectors and external return values; fall back to the visible fire heading without a mutation. A group correction without rows focuses its examination choice or its visible placeholder's first missing field.

Fire selectors must be handled before the current room-resolution/canonicalization effect; otherwise it strips fire parameters, can focus a room and can remember an unrelated room. Do not extend `InspectionPosition` or store a fake fire room in `astandsskraning-navigation-v1:*`. A fire correction must neither readjust remembered room position nor call room `remember`. Reject a URL mixing fire and room/item selectors as ambiguous and reveal the fire heading safely. Existing valid room links retain their exact behavior.

After hydration, open all containing disclosures and focus once on the exact radio/input or group heading; preserve focus while typing and during saves/retries. **Aftur í yfirferð** returns to the fixed `/skyrslur/{id}/yfirferd#review-fire-safety` anchor, never a supplied URL. Review must focus that visible section, even if the edited answer/context removed its former issue; if no fire section can render, fall back to visible core information. Test reload, Back/Forward, zero rooms, protected storage and existing room/core/rental correction flows. Opening or returning from a correction writes no report fields, timestamps or navigation storage.

## Mapping into approved Concept C later

This phase specifies information only. It does not change the approved design files, implement a Concept C adapter or render/export PDFs.

| Concept C information area | Future mapping |
| --- | --- |
| Identity and scope | Existing explicit inspection date/recorder/scope; group-specific examined/unexamined prose adds limitations, never an inferred visit date. |
| Cover principal findings | Explicit absent equipment, observed failed response, visible issue and obstruction; concise factual scope. No whole-property grade. |
| Missing-information/limitations summary | Missing fire groups in rental; unexamined areas, tests not performed, unknown results and label limitations kept distinct from missing fields. |
| Detailed record | One property-level Brunavarnir block with group/row details, independent of room items; full prose and unknowns preserved. |
| Counts/references | Room statistics retain existing semantics. Fire records get separate view-local references from report/group/row ID, never fabricated room/item IDs or a safety score. |
| Evidence and participation | Existing temporary room/item photo associations stay in their original targets. No automatic fire-photo match, fabricated media reference, certified service event, attendance or signature. |

Keep Concept C's petrol/teal hierarchy, restrained findings list, full-length narrative and print typography. Future content may occupy more space; do not shrink type or impose a page cap to hide material limitations.

## Accessibility interaction requirements

Use native `details`/`summary`, labelled inputs, `fieldset`/`legend` and ordinary links/buttons; no custom tab/radiogroup widget is necessary. Radios use arrow keys, disclosures Enter/Space, all actions have visible focus and a minimum 44 × 44 CSS px target under the product standard. State is never conveyed by color alone.

Associate hints/errors with `aria-describedby`; use `aria-invalid` only for active malformed input, not for an honest unknown/untested answer. Do not use browser `required` to block drafts. On explicit row addition focus the new heading and announce once; no focus shifts on selection/save/room switch unless the user requested navigation. Respect reduced motion. Keep `lang="is"`, logical headings and a reading order matching mobile layout.

Reuse current Manrope, ink `#172f40`, teal `#17635d`, paper `#f3f6f5`, focus `#006b7a` and restrained warning tokens; verify actual contrasts in implementation. At 320 CSS px, labels, input values, disclosure summaries and long location prose must wrap. No fixed-height summaries or horizontally scrolling choice rows.


## Owner approval — implementation authorized

18 October 2026: the owner approved this contract and UX arrangement, deferred heating, and authorized implementation without commit, push, merge or deployment. Optional equipment counts, locations and equipment-scope descriptions remain contextual limitations only: no required-field task or action-count increase. Required answers, limitations and concerns remain separate. Collapsed summaries always prioritize active concerns (including a failed detector response in any mixed row) over generic answered, incomplete or untested statuses. Deterministic ordering and verification are recorded in the implementation review. This approval supersedes earlier planning-only stop language for the authorized implementation slice.

## Approved clarification: optional omissions and summary precedence

Optional equipment count, location and examined-area descriptions are contextual limitations only. They remain visible in the read-only facts/limitations list, have no required-field issue or correction-task link, and contribute zero to the action count. Required route/test scope and explicitly conditional descriptions retain the approved minimums. Missing required answers, limitations and concerns remain separate lists; no combined count is a safety metric. Outside rental, optional missing answers never become rental tasks.

Collapsed group and section summaries scan **all active rows** before selecting a label. Deterministic concern priority is: (1) no observed detector-test response, (2) visible route obstruction, (3) no equipment observed, (4) visible equipment issue, (5) missing/unreadable service label, (6) invalid or contradictory entered count. Ties use fixed group order (detectors, extinguishers, routes), then stored row order. Every active concern precedes missing-answer/incomplete and generic answered/untested labels. After concerns, group summaries show required-answer gaps, then non-contextual limitations, then answered. Inactive retained values never win concern precedence or count as current findings. Mixed positive, untested and failed rows must retain the failed response in the collapsed summary.

Action counts include active concerns and, only in rental, missing required answers. Limitations do not add action tasks. Rental review can still flag an actual not-examined/untested/unknown limitation without turning an optional count/location/scope omission into a task or attention-count increase.
