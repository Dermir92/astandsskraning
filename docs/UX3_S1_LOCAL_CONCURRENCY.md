# UX3-S1 — staðbundin vistun með einum breytingarflipa

Grunnur: `ee03e4b2402ff57c4bd9e7062f5baf5f9b65176c`, tree `b2f72af9aa5166f59f03206dbfb16210e8d22e32`.
Samþykkt hönnun: UX3-S1 tækniskýrsla frá 2. nóvember 2026, lausn D.

## Vandinn og niðurstaðan

F04 varð vegna þess að hver DemoStore skrifaði allt skýrslusafnið úr sínu minni. Eldri flipi gat því eytt nýrri breytingum annars flipa, jafnvel við breytingu á annarri skýrslu. `setItem` án villu var ranglega nægilegt til að sýna „Vistað“.

Nú fær aðeins einn flipi breytingarétt á **öllu safninu**. Aðrir flipar eru í lesham. Þegar fyrri flipanum hefur verið lokað má reyna breytingarétt aftur; ný gögn eru lesin og sannreynd áður en reitir verða virkir. Venjulegur innsláttur og mutation-köll haldast samstillt. Gilt drag getur áfram verið samþykkt í minni við vistunarbilun; boolean/ID niðurstaða er ekki vistunarstaðfesting.

## Öryggissamningur

- Eitt stöðugt exclusive Web Lock nafn, `astandsskraning:demo-v1:collection-writer`, fyrir allan canonical lykilinn `astandsskraning-demo-v1`. Conditional acquisition; engin `steal`, timestamp-lease eða óvarin fallback.
- Raunverulegt lock-callback heldur rétti meðan Promise þess bíður. Acquisition og cleanup hafa eigin lease-epoch; domain-aðgerðir og UI-staðfestingar hafa mutation-epoch.
- Fyrir hvert canonical skrif þarf virkan writer-rétt og nákvæman samanburð `getItem(STORAGE_KEY) === baseRaw`. `null` er missing-grunnur, ekki wildcard. Engin async glufa er milli samanburðar og skrifa.
- Mismunandi grunnur leiðir til núll canonical skrifa. Gilt candidate helst í minni og checkpoint er reynt. Retry sniðgengur ekki vörnina. Lestrarbilun er ekki túlkuð sem tóm geymsla.
- BaseRaw breytist aðeins eftir heppnuð skrif eða sérstaklega heimilaðan ferskan lestur. Ekki er settur nýr grunnur undir gamla candidate til að þvinga það í gegn.
- Saved fyrir candidate kemur aðeins eftir heppnað canonical `setItem`. Checkpoint, boolean mutation-result, lock-grant eða endurheimt ein og sér gefa ekki saved. Bookkeeping kemur á undan listener-tilkynningu; listener-villa eftir commit veldur ekki fölsku storage-error eða endurspilun.
- Initial loading-mörkin haldast þar til acquisition hefur verið afgreitt. Leiðréttingarfókus má ekki keyra gegn reitum sem eru enn tímabundið óvirkir.
- Pagehide/cleanup tekur rétt samstillt af store áður en læsing losnar. Endurkoma og StrictMode setup bíða eftir að fyrri raunveruleg request hafi lokið. Úrelt linked-final/reconfirm/undo getur ekki lifað ownership-epoch.
- `pageshow.persisted` ógildir fyrri rétt skilyrðislaust, jafnvel án undanfarandi pagehide. Opnar staðfestingar fyrir lokaskoðun, rýmiseyðingu og mælasamhengi verða úreltar yfir epoch-skipti; þær má yfirfara að nýju. Ósend UI-drög halda working view sínu ef fyrri grunnur var óstaðfestur, jafnvel þótt nýtt gildi sé null.
- Gagnasnið canonical safnsins er enn `version: 1`; Report-líkanið er óbreytt. Óþekkt gild envelope- og nested svið varðveitast. Lestur endurskrifar ekki gögn og skemmd/óstudd gögn verða ekki skipt út fyrir fixtures.

## Endurheimt og viðmót

Óvistað candidate fer í eigin tab-local `sessionStorage` lykil, `astandsskraning-demo-recovery-v1`, þegar canonical skrif bregðast eða grunnárekstur greinist. Afritið hefur eigin version/purpose, fullan candidateRaw, expected baseRaw og generation. Myndir, blob-URL og óstofnuð UI-drög eru ekki í því. Gild óþekkt eða óstudd recovery-gögn eru ekki hljóðlega hreinsuð eða yfirskrifuð.

Reload les afritið til skoðunar án sjálfvirkrar vistunar. Ef það er nákvæmlega þegar vistað canonical skjal er það ekki endurspilað. Annars þarf notandi að velja framhald sérstaklega. „Halda áfram með endurheimtardrag“ krefst writer-réttar og sama canonical grunns og upphaflega candidate. Mismunandi grunnur heimilar ekki merge eða force-overwrite.

Notandi getur sótt endurheimtarafrit og síðan, með staðfestingu bundinni við nákvæma núverandi generation/epoch, sótt nýjustu vistuðu gögn til skoðunar. Eldra candidate helst áfram í recovery og nýja working view er í lesham þar til afrit hefur verið varðveitt og candidate afgreitt sérstaklega. Ekki er hægt að yfirskrifa óafgreitt eldra recovery-candidate með nýju error-dragi. Fyrir afgreiðslu er canonical grunnurinn sannreyndur aftur. Niðurhalssmellur er ekki sönnun um diskvistun.

Við checkpoint-bilun kemur skýr viðvörun um að afrit sé aðeins í minni og að sækja þurfi það fyrir reload/lokun. `beforeunload` er viðbótarviðvörun, ekki varðveislutrygging. Óstofnað rýmisheiti helst á skjánum við árekstur og blokkar skipti á working view; það þarf að afrita/afgreiða sérstaklega. Engin sjálfvirk reload/remount hreinsar innslátt.

Núverandi SaveStatus, warning-svæði, litir og button-stílar eru notuð. Nýir samhæfingar-/leshamir gera mutation-stýringar óvirkar; store sjálft er alltaf authoritative. Fyrirliggjandi `read-error` sýnigagnareitir í upplýsingum, rýmum og almennu atriðamati halda eldri hegðun: innsláttartilraun er hafnað af store og fyrra gildi helst, án skrifa eða minnisbreytingar. Þetta varðveitir líka óbreyttu read-protection regressjónirnar. Skoðun, leiðsögn og niðurhal haldast tiltæk. Myndaforskoðanir eru áfram tímabundnar; árekstur eða höfnun revokar ekki fyrirliggjandi myndir.

## C1-einangrun

CloudStore heldur sínum synchronous memory mutations og eigin database revision/operation-ID/ack/replay/retry/reload samningi. Demo-lifecycle er aðeins tengt í Demo-mode. Browser API-aðgangur er lazy og engin Demo-læsing er nauðsynleg fyrir CloudStore. Nýtt T23 próf lætur öll Demo environment-köll kasta villu meðan CloudStore pending/conflict/recovery keyrir með tilbúnum transport. Eldri C1-store prófin keyra líka eingöngu með tilbúnum transport; hvorki hosted né local gagnagrunnur er ræstur eða tengdur.

## Acceptance baseline T01–T25

`tests/demo-concurrency-contract.spec.ts` hefur eitt nafngreint próf fyrir hvert T01–T25, með stýrðum locks/storage og Deferred/barriers. `tests/demo-concurrency.spec.ts` bætir ellefu raunverulegum Chromium-vafraprófum við, með tveimur síðum í sama browser context/origin og stýrðu release/reacquire meðan staðfestingar eru opnar. Tilvikin nota ekki handahófskenndar biðir til að framkalla árekstur.

| Tilvik | Athugun | Viðbótar vafrapróf |
|---|---|---|
| T01 | Sami report; lesflipi hafnar líka beinum store-köllum | Raunveruleg Web Locks, tveir flipar |
| T02 | Handoff les ferskan grunn áður en innsláttur verður virkur | Heimilisfang A og sveitarfélag B lifa reload |
| T03 | Ólíkar skýrslur eru samhæfðar á safnstigi | Eldri flipi getur ekki stofnað/skrifað yfir safnið |
| T04 | Samtímis admission í báðum röðum; aðeins einn writer | Raunveruleg Web Lock sem stýrð barrier, síðan tvær acquisition tilraunir |
| T05 | Ný skýrsla úr eldri flipa eyðir ekki nýrri skýrslu | Stale create er óvirkt; fresh handoff varðveitir allt safnið |
| T06 | Eyðing rýmis/atriðis/report í fixture; engin endurvakning | Opin rýmiseyðing verður úrelt eftir release/reacquire, ásamt eldri rýmis-/atriðaflæðum |
| T07 | Misheppnað skrif, óbreytt canonical raw, sama candidate við retry | Error → checkpoint → reload → meðvitað resume |
| T08 | Retry eftir nýjan, eyddan, skemmdan eða óstuddan grunn skrifar ekkert | Nýrri canonical gögn eru ekki yfirskrifuð |
| T09 | Reentrant listener og listener-villa eftir commit | Store-contract |
| T10 | Reload endurheimtir candidate án replay/merge | Raunveruleg sessionStorage reload |
| T11 | Checkpoint cleanup bilar eftir heppnað commit; ekkert duplicate/replay | Store-contract |
| T12 | Bæði canonical og checkpoint skrif bregðast; newest candidate í minni | Skýr viðvörun, engin saved staða eða óheimiluð endursókn |
| T13 | Vantar API, óöruggt context, synjun og ógilt grant | Navigator án Web Locks, engin fallback-vistun |
| T14 | Skemmd/óstudd canonical og recovery-gögn; lestrarbilun | Fyrirliggjandi read-protection próf í fullri svítu |
| T15 | Unknown envelope, revision-sentinel og nested gildi | Fyrirliggjandi compatibility-próf í fullri svítu |
| T16 | Missing/null, remove/clear og seinkuð/óviðkomandi events | Storage-event á milli raunverulegra flipa |
| T17 | Deferred hash, ownership-epoch og linked-final idempotency | Opin linked-final staðfesting verður úrelt eftir release/reacquire |
| T18 | Deferred reconfirm, lesandi comparison og association-varðveisla | Fyrirliggjandi comparison/retirement-próf í fullri svítu |
| T19 | Samstilltar breytingar, undo og failed-save/validation varðveisla | Fyrirliggjandi single-tab og UI1/UI2A regressjónir |
| T20 | StrictMode, cleanup, pagehide/pageshow, pageshow án undanfarandi pagehide, tvö store í sama tab og óvænt lock loss | React StrictMode, reload/handoff og opin eyðingar-/mælasamhengisstaðfesting yfir epoch-skipti |
| T21 | Ósend UI-drög loka á view-skipti og kalla á unload-viðvörun | 320/360/390/768/1440 px, textavarðveisla, axe og overflow |
| T22 | Fyrirliggjandi photo-URL ekki revokað við höfnun/conflict; ekki í export | Fyrirliggjandi myndaforskoðunarpróf í fullri svítu |
| T23 | CloudStore notar engin Demo API | Default Demo API-isolation próf; C1-store fake transport sérkeyrsla |
| T24 | Legacy-skrifari hunsar læsingu; næsta protected skrif greinist | Tilbúið legacy-skrif meðan raunveruleg læsing er haldin |
| T25 | Eitt óafgreitt recovery-hólf; stale afgreiðsla og nýrri canonical útgáfa hafnað | Endursókn heldur candidate og lesham þar til það er afgreitt |

Eldri domain/compatibility próf nota áfram raunverulegan DemoStore með injected synthetic storage og lock/session adapter. Hvert þeirra módelerar sjálfstæða ritunarsetu; þau gera ekki kröfu um tvö samhliða browser-tilvik. Nýju concurrency-prófin deila locks sérstaklega og raunverulegu vafraprófin deila browser context. Engum eldri assertions, tímamörkum, retries eða skilyrtum skips var breytt.

Ein eldri UI1-prófunaruppsetning gerði ráð fyrir að annað app-tilvik gæti skrifað á meðan fyrra var opið. Það er einmitt hegðunin sem S1 lokar á. Hún hermir nú sérstaklega eftir legacy-skrifara með beinu synthetic `setItem`, eftir nýja assertion um að hinn flipinn sé í lesham. Allar fyrri assertions um external bytes, óbreytta working view og cancellation án skrifa eru varðveittar.

## Keyrsla og niðurstöður

Full Demo-regressjón er keyrð með `node node_modules/@playwright/test/cli.js test --config playwright.ux3.config.ts --reporter=list,json`. Config erfir sömu þrjú viewport-project, workers=2, retries=0 og tímamörk og upprunalega config; aðeins eigið Demo-port 3103, engin server-endurnotkun, óvirkir C1/hosted fánar og aðskilin artifact-mappa eru afmörkuð.

Store-/compatibility- og C1 fake-transport prófin má endurtaka án server eða gagnagrunns með `node node_modules/@playwright/test/cli.js test --config playwright.ux3-unit.config.ts`. TestMatch er explicit allowlist; C1 database/UI próf eru ekki hluti hennar. Niðurstöður og test-output hafa eigin artifact-möppur svo keyrslur yfirskrifi ekki trace-gögn annarra svíta.

Staðfest 2. nóvember 2026 með Node 22.22.2, Next 16.4.3 og Playwright 1.64.1:

| Athugun | Niðurstaða |
|---|---|
| Full Demo-regressjón, þrjú viewport-project, workers=2, retries=0 | **1143 staðist, 35 sleppt, 1 tímamarksfall**, 32,2 mínútur |
| T01–T25 acceptance í heilu svítunni | 75/75 staðist (25 × 3 project) |
| Ný raunveruleg Chromium-vafrapróf í heilu svítunni | 33/33 staðist (11 × 3 project) |
| Offline store/compatibility/C1 fake-transport | 146/146 staðist, þar af 17 C1-store-próf |
| Markkeyrsla concurrency/UI1 eftir aðlögun legacy-uppsetningar | 29 staðist, 1 fyrirliggjandi skjámyndaprófi sleppt |
| Lint, typecheck og production build | Allt staðist; engin deployment |
| Óbreytt sérstök endurkeyrsla eina tímamarksfallsins | 1/1 staðist, um 2,1 mínúta, sömu assertions og 180 sekúndna mörk, retries=0 |

Heila lokakeyrslan er **ekki alveg græn**: `tests/inspection-evidence.spec.ts:388`, „five-width visual, accessibility and 200 percent text verification“, fór yfir fyrirliggjandi 180 sekúndna tímamark (180189 ms), án sértæks assertion-falls í skýrslunni. Sama próf hafði staðist í fyrri heilli keyrslu á 178097 ms og stóðst síðan óbreytt í sérkeyrslu. Orsök tímabreytileikans er ekki fullstaðfest; þetta er opið prófunaróstöðugleikaatriði til rýni, ekki tilefni til að hækka tímamörk eða fela fallið. Trace/JSON úr heilu keyrslunni og sérkeyrslunni eru varðveitt í aðskildum artifact-möppum.

Fyrsta heila keyrslan lauk með 1141 staðist, 35 sleppt og 3 föllum: sama eldra UI1-prófið reyndi að nota seinni app-flipa sem writer í öllum þremur projectum. Uppsetning þess var síðan aðlöguð eins og lýst er hér að ofan. Fyrri hlutakeyrslur fundu líka upphafsfókus-/read-error-regressjónir sem voru leiðréttar án breytinga á assertions. Þær keyrslur eru ekki lagðar saman við lokatölurnar.

Sjálfstæð AST-yfirferð staðfesti öll 1642 fyrri expect-/prófstýringarköll í 11 breyttum eldri spec-skrám. SHA-256 af 159 kóða-, prófunar- og config-skrám var óbreytt meðan lokaheila svítan keyrði. 35 skips eru fyrirliggjandi skilyrt próf; engum skip-skilyrðum, retries eða tímamörkum var breytt.

Vinnan er einangruð á `codex/ux3-s1-local-concurrency-safety`. Varðveisluyfirferð staðfesti allar 786 fyrirliggjandi skrár í aðalvinnusvæðinu, sömu SHA-256 gildi og sama Git-status/HEAD/tree, ásamt óbreyttum fyrri branch-/remote-refs og worktrees. Þar með eru sex fyrirliggjandi tracked M-slóðir og 48 untracked QA-skrár varðveittar. Eitt innra Codex snapshot-ref, `refs/codex/turn-diffs/captures/1793613348249/1854d909-66dc-45cf-abce-b8fa96ed5c7b/base`, var ekki lengur til við lokasamanburð (upphafsgildi `5d078f8e08255d09a1ffbbdf4a5fc78d674992cb`); verkefnið gaf enga skipun um að eyða því og reynir ekki að endurstilla innri app-stöðu. Öll önnur 55 fyrri refs héldust. PR #19 / Docker/D1 er ósnert.

## Takmarkanir og áhætta

- **Eldri skrifarar eru utan tryggingar.** Web Locks er samvinnusamningur. Óuppfærður flipi eða annar kóði sem skrifar beint í sama localStorage-lykil getur hunsað læsinguna. Exact baseRaw greinir breytingu sem er orðin, en lokar ekki framtíðarskrifum ólæsts kóða. Ekki fullyrða fulla tryggingu við slíka sambúð.
- Frumgerðin er fyrir uppfært, afmarkað vafraumhverfi með eldri app-flipa lokaða og tilbúnum gögnum eingöngu. Mismunandi origin/profile/tæki hafa aðskilda gagnageymslu. Vélræn legacy-einangrun með nýju origin/namespace og gagnayfirfærslu væri sérstakt verkefni.
- Einn writer á öllu safninu er meðvituð UX-takmörkun. Bakgrunnsflipi getur haldið læsingunni; enginn timeout eða force-takeover er í boði. Tvær samtímis breytingasetur á ólíkum reports eru ekki studdar.
- SessionStorage er setugeymsla og getur brugðist eða horfið. Ekki er lofað varðveislu við tab-lokun, browser-/OS-bilun, geymslueyðingu eða diskbilun. Myndir eru ekki varanlega vistaðar.
- Exact raw er innihaldssamanburður, ekki monotonic revision eða sögugagnagrunnur; JSON-endursniðun getur valdið varfærnum árekstri. Engin almenn lossless-JSON eða audit-log trygging er kynnt.
- Chromium er prófað. Firefox/WebKit keyrslur og raunveruleg Safari/iOS tæki eru óstaðfest í þessu umhverfi; hvorki binaries þeirra né tæki voru aðgengileg. Viewport-próf eru ekki sönnun um keyrslu á farsímastýrikerfi.
- Lifecycle-próf stjórna pagehide/pageshow-atburðum, meðal annars með raunverulegri Web Lock í Chromium. Raunveruleg BFCache-inntaka/eviction og endurkoma á Safari/iOS eru ekki sjálfstætt staðfest.
- Engin backend-, auth-, greiðslu-, migration-, credential-, Docker/D1-, PR #19- eða deployment-breyting er í umfangi. Gate C/E eða framleiðsluheimildir breytast ekki.

## Leiðbeiningar fyrir óháða rýni

Rýna sérstaklega allar canonical skrifaleiðir í DemoStore, authority/epoch cleanup og exact baseRaw-samanburðinn. Staðfesta að retry/resume/afgreiðsla recovery hafi enga force-overwrite leið, að nýrri UI-/candidate-generation ógildi gamla staðfestingu og að retained recovery hverfi ekki við skipti á working view.

Lesa T01–T25 ásamt raunverulegu tveggja-flipa prófunum; prófa að endurtaka race með Deferred/gates fremur en sleep. Skoða einnig upphafs-loading mörkin og óbreyttar fókus-assertions. Athuga Demo-only UI-læsingar og að `CloudStore` hafi áfram sínar heimildir og acknowledgment-hegðun. Þetta er Draft-innleiðing til óháðrar yfirferðar; engin merge/deployment heimild fylgir.
