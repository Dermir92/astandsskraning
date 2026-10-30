# UI2A-F1 · afmörkuð leiðrétting til óháðrar endurrýni

<!-- RECOMMENDATION:start -->
READY FOR INDEPENDENT RE-REVIEW
<!-- RECOMMENDATION:end -->

<!-- DELIVERY:start -->
F1-leiðréttingin stenst markvissu prófin og öll áskilin sannprófun stóðst í lokasvítunni. Fyrri tímamörk og staðfest flökt í sérendurtekningu óbreytts forsíðuprófs eru áfram skráð hér að neðan. Aðeins F1-kóði, ný regressjón og þessi gögn eru innan commit-/push-heimildarinnar. PR #21 helst Draft til óháðrar endurrýni.
<!-- DELIVERY:end -->

Aðeins fyrirliggjandi Draft PR #21; engin sameining, mark-ready, deployment eða UI2B.

Grunnur þessarar breytingar er yfirfarna PR-head f2d85affca579ebc0791984ffdc73ab922695ea7. GitHub main var sótt og staðfest óbreytt: 96e5150c2cba36378928caf8219e5aebfbee6d79, tré b18a0c2d895913f3415953a08a1f1a02eff01055. PR #21 var OPEN / Draft. PR #19 og Docker/D1 voru áfram á 88ac8e785c449aa3579b525f6a0b3b75ca7c627a.

## Breytingin

UI2A-F1 endurheimti réttan fókusreit en skrunaði reitnum einum að efri brún. Því gat merki Athugasemdar verið hálfhulið og Ástand-fyrirsögn alveg undir hlutastikunni.

Eina breytingin á keyrslukóða er í src/components/use-inspection-sections.ts, reveal(): fókus helst á sama DOM-eintaki með preventScroll. Skrunmarkið tekur nú merki/legend og valinn reit með í reikninginn, notar fyrirliggjandi mælt CSS-skrunbil og raunverulega visualViewport-hæð og offsetTop.

- Ef allur spurningarhópurinn rúmast birtist hann frá upphafi.
- Ef hópurinn er of hár en fyrirsögn og valinn reitur rúmast saman birtist það samhengi.
- Ef sú vegalengd rúmast ekki fær sýnilegur fókusreitur og eigin svartexti forgang.

Fyrirliggjandi focusin-handler var skoðaður og er óbreyttur. Endurkomuprófin staðfesta að hann hylur ekki nýja skrunmarkið aftur. Leiðréttingin bætir engum hlustara við innslátt eða svör og kallar aðeins á skrun við fyrirliggjandi skýra hluta-/endurkomuaðgerð. Engin CSS-breyting, nýr ritill, ný React-lyklun, slóðabreyting eða ný virkni bættist við.

## Rauð/græn prófun og heildarsannprófun

<!-- RESULTS:start -->
**Fyrir: 30 fallin / 6 staðist. Eftir: 36/36 staðist. Heildarsvíta: 1036 staðist, 35 skilyrt sleppt, 0 mistókust, 0 flokkuð flaky af Playwright (retries=0).** Heildartími 16.8 mínútur. Allar 36 F1-regressjónir stóðust í heildarlotunni. Aðskilin endurtekning fyrirliggjandi forsíðuprófs: 1 staðist / 2 mistókust; þessi þekkti óstöðugleiki er ekki felldur inn í núllið fyrir sjálfvirk retries. Lint, typecheck og framleiðslubygging standast.
<!-- RESULTS:end -->

Tvær heildartilraunir með trace-upptöku, fyrst tveimur workers og síðan einum, voru stöðvaðar eftir 180 sekúndna tímamark í óbreyttu prófi inspection-evidence: five-width visual, accessibility and 200 percent text verification. Engin fullyrðing um nýja hegðun féll þar. Síðari rakningin sýnir að tímamarkið rann út við lok síðustu breiddar og lokun vafrasamhengis, eftir að efnislegar fullyrðingar höfðu staðist. Trace-safnið var um 44 MB þjappað. Þetta bendir til upptökuálags en staðfestir ekki almennt að trace sé eina orsök.

Sama próf stóðst sérstaklega á um 132 sekúndum án trace-upptöku, með sömu 180 sekúndna mörkum. Endanlega öll svítan var því keyrð með tveimur workers og CLI-valinu --trace=off. Aðeins upptaka rakningar var sleppt; próf, tímamörk, væntingar, aðgengisreglur, skjáskot og hráar F1-skimanir eru óbreytt. Markvissa rauða/græna F1-keyrslan hélt upphaflegu trace-stillingunni.

[Fyrsta tilraunin](concurrent-attempt.txt) og [villugögn hennar](concurrent-timeout.md), [síðari tilraunin](serial-attempt.txt) og [villugögn hennar](serial-timeout.md), ásamt [sérkeyrslunni sem stóðst](evidence-isolated.txt), eru varðveitt. Lokaniðurstaðan hér að ofan er úr heilli nýrri keyrslu, ekki samsetning úr hluta fyrri lotna. Stöðugleiki stórprófsins með trace-upptöku er áfram þekkt takmörkun prófunarumhverfisins.

Önnur trace-laus tilraun var stöðvuð eftir að mobile-refinement.spec.ts:196 féll á forsíðunni. [Úttakið](fast-attempt.txt), [nákvæm villa og síðusnapshot](report-list-race.md) og [þrjár aðskildar endurtekningar](report-list-repeat.txt) eru varðveitt. Endurtekningarnar gáfu 1 staðist / 2 fallin með óbreyttum kóða og prófi. Þetta er þekktur óstöðugleiki þótt lokasvítan kunni að gefa aðra niðurstöðu. Engin önnur heildarkeyrsla verður gerð til að elta græna niðurstöðu.

Prófunarhindrunin endurskapast á forsíðunni við 768 × 900 CSS px. Prófið opnar „Yfirlit: Sýnigata 14“, lokar með Escape, staðfestir endurheimtan fókus og les svo body.style.overflow tafarlaust. Fallna gildið er hidden. [Upprunalegt villuskjáskot](report-list-race.png) sýnir lokaðan glugga og endurheimtan fókus; sjálft overflow-gildið kemur úr prófinu. Fyrirliggjandi ContextDialog lokar native dialog fyrst; React onClose-hreinsun endurstillir overflow síðar. Mismunandi tímasetning þeirrar hreinsunar er líkleg skýring. Kóði gluggans, forsíðunnar og prófsins er Git-blob-óbreyttur frá f2d85aff; F1-fallið er ekki notað á þessari síðu. Varanleg skrunlæsing er ekki staðfest með þessari athugun.

Minnsta mögulega prófunarleiðrétting til sérstakrar samþykktar er að bíða sérstaklega eftir lokun gluggans og endurstillingu overflow, með sjálfvirkri endurmælingu sem fellur áfram ef það gerist ekki. Ekki fjarlægja fullyrðinguna, lengja tímamörk eða breyta appinu til að þóknast prófinu. Sú breyting er utan F1 og var ekki framkvæmd.

<!-- PUBLICATION:start -->
Lokasvítan þarf enga breytingu á þessu prófi til að standast. Sérendurtekningin sýnir engu að síður þekktan óstöðugleika, sem skal meta sérstaklega í óháðri rýni; engin fullyrðing er gerð um að hann sé lagaður.
<!-- PUBLICATION:end -->

Prófunarskráin er nákvæmlega sú sama fyrir og eftir lagfæringu. SHA-256 í before-provenance og evidence staðfestir það. Fyrir-lotan keyrði með óbreyttum src á yfirfarna head og fyrri framleiðslubyggingu; eftir-lotan keyrði nýja framleiðslubyggingu. Engin dev/HMR-keyrsla er notuð sem sönnun.

Fyrir-lotan féll í öllum 24 venjulegu/200%-endurkomunum og 6 tilvikum þar sem heill hópur rúmaðist ekki en fyrirsögn og valinn reitur gátu rúmast. Sex þrengstu tilvikin, þar sem hvorugt gat rúmast saman, varðveittu þegar sýnilegan svarreit og stóðust líka fyrir breytinguna. Sömu 36 tilvik standast nú.

Þróunarskoðun notaði fyrst 500 px hæð fyrir of háan hóp. Við 360/390 px rúmaðist hópurinn þá; endanlega samanburðarprófið notar því 400 px og 300 px. Sú afmörkun var gerð áður en keyrslukóða var breytt. Aðeins endanlegu, eins prófin eru notuð sem rauð/græn sönnun.

Prófið tests/ui2a-context-visibility.spec.ts nær yfir 320/360/390 CSS px, bæði Brunavarnir og Mæla, varðveitt Skemmt-svar og textarea með fyrirliggjandi texta, venjulegan texta og 200% hermun, Tab/Shift+Tab, sama tengda DOM-eintak, sama gildi, óbreytta slóð og skýrslugögn. Innsláttur eftir endurkomu heldur fókus og skrunstöðu.

[Prófanir og skilyrtar sleppingar](results.json) · [Fail-before úttak](fail-before.txt) · [Pass-after úttak](pass-after.txt) · [Heildarsvíta](full-suite.txt). Óbreytt JSON-úttak Playwright er varðveitt í before-results.json.gz, after-results.json.gz og full-results.json.gz; gzip er venjuleg Node/Python-þjöppun.

## Myndir og nákvæmar mælingar

[Opna fyrir/eftir-samanburðinn](index.html). Sami tilbúni Stofa → Veggir-fixture og sama síðasta fókusmark eru notuð. Myndir eru beinar PNG-vaframyndir, ekki lagfærðar eða stækkaðar eftir töku. Til að opna safnið má keyra:

    node docs/qa/ui2a-f1/serve.mjs

Síðan opna http://127.0.0.1:3233/. Þjónninn les eingöngu þessa rýnimöppu á loopback. Stöðva með Ctrl+C.

Vaframyndir af samanburðarsíðunni: [320 px, venjulegur texti](comparison-320.jpg) og [320 px, 200% hermun](comparison-320-200.jpg). Þær sýna sömu upprunalegu PNG-myndir hlið við hlið; fullar myndir allra breidda eru í screenshots/before og screenshots/after.

### Venjulegur texti

Tölur eru CSS px í sjónsvæðinu. Merki merkir legend Ástands eða label Athugasemdar. Reitur og merki eru bæði innan sjónsvæðis eftir leiðréttingu.

<!-- NORMAL:start -->
| Breidd | Fókus | Merki fyrir: y | Merki eftir: y | Sýnileg efri brún | Reitur eftir: y |
|---|---|---:|---:|---:|---:|
| 320 | radio | 8.23 | 120.23–145.83 | 103.92 | 230.83–278.83 |
| 320 | textarea | 90.31 | 120.31–142.70 | 103.92 | 149.70–216.48 |
| 360 | radio | 10.80 | 101.80–127.39 | 85.08 | 192.39–240.39 |
| 360 | textarea | 73.03 | 102.03–124.42 | 85.08 | 131.42–198.20 |
| 390 | radio | 10.00 | 102.00–127.59 | 85.08 | 192.59–240.59 |
| 390 | textarea | 72.23 | 102.23–124.63 | 85.08 | 131.63–198.41 |
<!-- NORMAL:end -->

### 200% hermdur texti — sér niðurstaða

200% er tvöföldun reiknaðrar leturstærðar í tímabundnu prófunarsamhengi, ekki browser zoom. Stikan fer rétt í venjulegt síðuflæði. Merki og reitur rúmast nú líka saman þegar þau áður skrunuðu ofan við sjónsvæðið.

<!-- ENLARGED:start -->
| Breidd | Fókus | Merki fyrir: y | Merki eftir: y | Sýnileg efri brún | Reitur eftir: y |
|---|---|---:|---:|---:|---:|
| 320 | radio | -217.55 | 16.45–67.64 | 0.00 | 248.64–364.64 |
| 320 | textarea | -80.72 | 16.28–105.88 | 0.00 | 112.88–224.47 |
| 360 | radio | -169.22 | 15.78–66.97 | 0.00 | 199.97–315.97 |
| 360 | textarea | -35.66 | 16.34–61.14 | 0.00 | 68.14–179.73 |
| 390 | radio | -169.09 | 15.91–67.09 | 0.00 | 200.09–316.09 |
| 390 | textarea | -35.53 | 16.47–61.27 | 0.00 | 68.27–179.86 |
<!-- ENLARGED:end -->

400 px háa sjónsvæðið prófar hóp sem er of hár en fyrirsögn og valinn reitur rúmast. 300 px tilvikið prófar öruggt fallbak á valinn svarreit þegar hvorugt getur rúmast saman. Mælirinn prófar bæði innri og ytri sýnileika óháð Axe.

[Allar 72 fyrir/eftir-mælingarnar](measurements.json) innihalda brún stikunnar, visual viewport, merki, fókusreit og hóp. Brunavarnir og Mælar eru bæði skráð; töflurnar sýna Brunavarnir til að endurtaka ekki sömu tölur.

## Axe og varðveisla

Allt upprunalega Axe-reglusettið og tests/inspection-accessibility.ts eru óbreytt. Ósíað Axe-úttak er tekið áður en hjálparinn má færa sjónsvæðið til endurmælingar. Fullt upprunalegt JSON hvers samanburðartilviks er í [axe-raw.json.gz](axe-raw.json.gz), ásamt SHA-256. Það inniheldur 72 hráar skimanir, einnig allar upprunalegar violations og incomplete færslur. Engri reglu eða undanþágu var breytt til að ná grænum prófum.

Axe er ekki notað sem sönnun fyrir fókus-/merkisýnileika: sjálfstæðar rúmfræðilegar fullyrðingar mæla bæði reit og merki áður en endurmæling á sér stað. Hráar skimanir fullrar heildarlotu eru einnig varðveittar í staðbundnum Playwright-úttaksmöppum.

Fyrir-lotan hefur engar hráar violations, þótt rúmfræðilegu prófin finni F1. Eftir-lotan hefur sex hráar target-size færslur: „Breyta mati“-summary ofan Ástands er að hluta undir stikunni við endurkomu í valinn reit. Þetta summary hefur ekki fókus. Óbreyttur hjálpari birtir hvert summary og endurkeyrir sama reglusettið á því; allar sex endurmælingar hafa engar violations. [Ósíað yfirlit og allar sex endurmælingar](axe-resampling.json) varðveita þessar niðurstöður. Incomplete-færslur Axe eru áfram í hráa gagnasafninu og teljast ekki staðfest samræmi.

Eftirfarandi eru varðveitt óbreytt í kóða og sannprófuð með heildarsvítunni: samþykkt UI2A-upplýsingaskipan og útlit, UI1/A2.2-ritlar, rýmisval og varðveitt staðsetning, djúptenglar og leiðréttingar úr Yfirferð, myndaforskoðanir og tímabundið ástand, afturköllun, óstaðfest mælatilgangsskipti, gagnalíkön, viðskiptareglur, SaveStatus og persistence.

[evidence.json](evidence.json) skráir óbreytt Git-blob lykilskráa, myndahösh og uppruna. [file-inventory.json](file-inventory.json) er nákvæmur listi F1-breytinga miðað við yfirfarna PR-head, ekki endurútgáfa fyrri UI2A-skráalistans.

## Mörk og stöðvun

- Engin fullyrðing um WCAG 2.2 AA-samræmi.
- Raunverulegur vafraaðdráttur við 200–400%, VoiceOver, TalkBack og NVDA eru óprófuð.
- Raunverulegt iOS Safari, Android-vafrar, sýndartakkaborð og visualViewport-breytingar rauntækja eru óprófuð; þröngt/stutt prófunarsjónsvæði kemur ekki í stað þeirra.
- Myndavél, myndasafn og kerfisheimildir eru óstaðfest á rauntækjum. Myndir eru áfram tímabundnar sýni-forskoðanir.
- Cross-tab concurrency er áfram óútkljáð.
- Full venjuleg svíta var keyrð; sértækar C1/H1A/H1B-innviðastillingar voru áfram utan hennar og ekki ræstar.
- Gate C er CLOSED. Gate E / PUBLIC TEMPORARY er UNRESOLVED.
- Aðeins tilbúin gögn. Appið er ekki samþykkt fyrir raunveruleg viðskiptavinagögn.

Engin breyting á PR #19, D1, Docker, Supabase, Auth, migrations, hýsingu eða deployment. PR #21 helst Draft. Stöðvað fyrir óháða mannlega endurrýni; engin sameining, mark-ready eða UI2B.
