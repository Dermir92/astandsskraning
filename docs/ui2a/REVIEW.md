# UI2A · Heildarupplifun Skráningar í síma

**Hönnunartillaga til óháðrar samþykktar · 29. október 2026.** Ein aðaltillaga. Engin UI2-innleiðing í appinu, PR, sameining eða birting.

Viðmið: GitHub main `96e5150c2cba36378928caf8219e5aebfbee6d79`, tré `b18a0c2d895913f3415953a08a1f1a02eff01055`. Bæði voru staðfest; `git ls-remote origin refs/heads/main` skilaði sama commit. Nýtt, einangrað vinnutré: `C:/Users/Danni/.codex/worktrees/ui2a-mobile-design/Ástandskoðun`. Allar nýjar skrár eru undir `docs/ui2a/`.

[Samanburðarsafn](index.html) · [Samhliða fyrir/eftir](comparison.html) · [Gagnvirk hönnunarfrumgerð](prototype/index.html) · [Mælingar fyrir](screenshots/before-metrics.json) / [eftir](screenshots/after-metrics.json) · [Leiðsagnarprófanir](screenshots/prototype-checks.json) · [Myndaskrá og SHA-256](evidence.json).

## Niðurstaða

Mælt er með **rýmisgátlista fyrst, með sýnilegum hlutatenglum og sjálfstæðri stöðu brunavarna og mæla**. Einn þéttur eignarhaus, fjögur skref, ein afmörkuð framvindutalning og síðan vinnusvæðið. Brunavarnir og mælar haldast á sömu síðu fyrir neðan rýmið. Hlutatengill opnar réttan kafla í einni aðgerð; endurkomutengill fer aftur að sama rými og opna atriði.

Þetta er tillaga um upplýsingaskipan og leiðsögn. Samþykkt A2.2-hönnun einstakra atriða er viðmiðið áfram.

## Raunverulegt UI1 · það sem skoðunin sýndi

Skoðað var óbreytt app af samþykktum grunni á loopback, í sýniham. Aðalsamanburðurinn notar sömu innbyggðu sýniskýrsluna, **Sýnigötu 14 → Stofu**, með **24 af 53 rýmisatriðum skráð**, 29 óloknum, einu fullskráðu fráviki í Stofu, óskráðu leigusamhengi og óvirkri mælaskráningu. Engar viðskiptavinaupplýsingar eða myndir voru notaðar.

| Breidd × hæð | Fyrsta atriði frá síðutoppi, UI1 | UI2A | Munur | Heilsíðumyndir |
|---|---:|---:|---:|---|
| 360 × 800 | 769 px | 471 px | 298 px / 39% ofar | [Fyrir](screenshots/before-360-full.jpg) · [Eftir](screenshots/after-360-full.jpg) |
| 390 × 844 | 769 px | 471 px | 298 px / 39% ofar | [Fyrir](screenshots/before-390-full.jpg) · [Eftir](screenshots/after-390-full.jpg) |
| 1440 × 1000 | 777 px | 465 px | 312 px / 40% ofar | [Fyrir](screenshots/before-1440-full.jpg) · [Eftir](screenshots/after-1440-full.jpg) |

Tölur eru námundaðar CSS-mælingar á DOM eftir hleðslu leturs. Á 390 px sést fyrsta UI1-röðin aðeins að hluta við síðutopp; í tillögunni sjást fjórar heilar raðir. Þetta er rúmfræðileg breyting, ekki mæling á vinnutíma eða niðurstaða notendarannsóknar. Heildarhæð frumgerðar inniheldur líka skýringar fyrir hönnunarrýni; ekki er fullyrt að öll síðan sé 39% styttri.

Skjástærðirnar vísa til staðfests `innerWidth/innerHeight` í vafranum. JPEG-útflutningur vafratólsins sleppir innfæddum ramma/skrunstiku; raunverulegar bitmap-stærðir fylgja hverri mynd í myndaskránni. Heilsíðumyndir ná yfir alla skjalhæð. Myndirnar voru ekki stækkaðar, minnkaðar eða lagfærðar eftir myndatöku.

**Mikilvæg leiðrétting á upphafsforsendu:** UI1 hoppar þegar að rýminu á síma. [Raunveruleg lending við 390 px](screenshots/before-390-landing.jpg) sýnir það. Því væri rangt að segja að hver skoðunarmaður þurfi alltaf að fletta 769 px áður en hann getur byrjað. Vandinn er bæði hæðin fyrir ofan listann og að eignarsamhengi, heildarstaða, brunavarnir og mælar verða eftir fyrir ofan lendinguna. Desktop lendir oftar við topp þar sem fyrsta röð rúmast þegar á skjánum.

Sértækar niðurstöður:

- Á síma taka bakleiðin og stóra skrefabirtingin um 114 px áður en eignarhausinn byrjar. „Mínar skýrslur“ tvítekur aðgang sem vörumerkistengillinn veitir þegar.
- Eignarhaus og talning/ófullskráður listi eru tvö lóðrétt svæði, 73 og 89 px. Talningin „24 af 53 atriðum“ segir ekki að hún nái aðeins til rýma.
- Lokaðar brunavarnir taka 112 px og lokaðir mælar 51 px auk bila. Þrjár óskráðar brunavarnastöður eru mikilvægar, en þurfa ekki allar að standa fyrir ofan hvert rými.
- Rýmisval sýnir „Stofa (6/6)“, síðan kemur „Stofa“, „6 af 6 skráð“, framvindulína og „0 ósvarað · 0 ófullskráð“. Sama samhengi er endurtekið í 46 + 84 + 42 px svæðum.
- „Ófullskráð atriði“ nær aðeins til rýmisatriða. Það er gagnlegt en er ekki listi yfir alla mögulega vinnu í eigninni. Óvirkir mælar hafa engan stöðutexta í lokaðri yfirskrift.
- Á síma er fyrra/næsta rými aðeins neðan við allan listann. Hlutatenglar að brunavörnum og mælum fylgja ekki vinnusvæðinu.
- UI1 felur þegar tvítekinn eignar-eyebrow. Ekki er lagt til að „laga“ sýnilegan tvítekinn eignartitil sem er ekki til staðar.

## Ein aðaltillaga · upplýsingaskipan

1. **Þéttur apphaus.** Vörumerkistengill að skýrslum, raunverulegur `SaveStatus` og hjálp. Desktop heldur núverandi aðalvalmynd. Sýnihamur og geymsluviðvaranir haldast skýrar; villur og óstaðfest vistun mega ekki hverfa inn í upplýsingavalmynd.
2. **Einn eignarhaus.** Heimilisfang, stutt tegund/eining og textatengill í Yfirferð. Í leiðréttingarferð verður hann „Aftur í yfirferð“.
3. **Fjögur skref í þéttri röð.** Upplýsingar → Rými → Skráning → Yfirferð. Fyrri skref fá ekki hak sem hægt væri að túlka sem fullgerð gögn. Þau eru áfram aðgengileg.
4. **„24 af 53 rýmisatriðum skráð · 29 eftir“.** Ein fellanleg samantekt. Hún telur rýmisatriði; inni í henni eru einnig skýrir tenglar og sjálfstæð staða brunavarna og mæla.
5. **Hlutar: Rými / Brunavarnir / Mælar.** Staðan stendur við heitið. Þetta eru venjulegir síðutenglar, ekki faldir flipar. Stikan helst efst við flettingu; aðeins þessi stika er föst, ekki mörg lög af hausum eða botnstika.
6. **Rýmisstýring og UI1-listi.** Rýmisnúmer, innbyggt rýmisval, fyrra/næsta og ein stöðulína. Rýmisvalið fær heila línu í síma svo raunverulegt heiti eins og „Svefnherbergi 1“ klippist ekki. Tvítekinn „Skoðunaratriði / 0 / 0“-haus hverfur sjónrænt en fyrirsögnin helst aðgengileg. Ósvarað og ófullskráð birtist í stöðulínunni þegar talan er yfir núlli.
7. **Brunavarnir og mælar á eftir rýminu.** Fyrirliggjandi eyðublöð og matsreglur haldast. Hlutatengill opnar rétta `details`-einingu og færir fókus þangað. Tengill fyrir neðan hvern kafla fer til baka í rýmisvinnuna. Síðasta rými leiðir áfram í Yfirferð; fyrsta rými heldur leið að rýmisuppsetningu.

Tillagan lætur áskilið mat ekki hverfa. Staða þess er sýnileg í hlutatenglinum og samantektinni áður en eyðublaðið er opnað. Kaflarnir eru líka áfram í eðlilegri lesröð síðunnar. Áskilið, ósvarað brunavarnamat er sýnt sérstaklega í [leiguskoðunardæminu](prototype/index.html?scenario=rental).

## Merking stöðu · óbreyttar reglur, skýrari texti

| Ástand gagna | Birting / regla |
|---|---|
| Ósvarað rýmisatriði | „Ósvarað“. Ekkert svar, virkni eða þrif er fyllt sjálfkrafa. |
| Byrjað en skyldusvör vantar | „Ófullskráð“. Aðskilið frá ósvaraðri skráningu. |
| Fullskráð frávik | Bæði „Fullskráð“ og „Frávik“ haldast. Skráð jafngildir ekki góðu ástandi. |
| „Ekki skoðað“ / „Á ekki við“ | Fyrirliggjandi gild svör og takmarkanir haldast; þau verða ekki sjálfkrafa „Í lagi“. |
| Brunavarnir utan staðfests leigusamhengis | „Valfrjálst · ósvarað“ þegar ekkert hefur verið skráð. Valfrjálst jafngildir ekki fullgerðu. Skráðir annmarkar eru áfram sýnilegir þótt kaflinn sé valfrjáls. |
| Brunavarnir í leiguskoðun, engin svör | „3 flokkar ósvaraðir“. Þrír flokkar eru ekki lagðir saman við 29 rýmisatriði. Við hlutaskráningu er áfram notuð forgangsröðun `fireGroupStatus` / `fireState` fyrir annmarka, vöntun og takmarkanir. |
| Mælar ekki virkjaðir | „Ekki hafið“; í nánari samantekt „tilgangur óvalinn“. Ekkert grænt hak og engin fullyrðing um fullgerða eign. Tilgangsval helst meðvitað val. |
| Virkir mælar með ósvarað fyrirkomulag beggja veitna | „2 svör vantar“. [Dæmið](prototype/index.html?scenario=meters) notar raunverulega UI1-birtingu úr sýnigögnum. |
| Mælar með breytt samhengi, takmörkun eða varðveitt gögn | Fyrirliggjandi staðfestingar, takmarkanir og „varðveitt“ staða halda sér. Staðfestingarþörf má ekki endurnefna almennt sem vantað svar. |
| Valfrjálst mælisnúmer, athugasemd eða myndir | Fara ekki í skyldusvarateljara. Fyrirliggjandi myndaviðvaranir í Yfirferð haldast sjálfstæðar frá `roomStats`. |

Engin ein prósenta eða „allt búið“-merking er sett yfir öll gögn eignarinnar. Grunnupplýsingar, gögn sem þurfa yfirferð, myndir og takmarkanir geta enn þarfnast vinnu þótt öll rýmisatriði séu skráð.

## Leiðsögn og endurkomusamhengi

Ráðlögð sjálfgefin fyrsta koma er við þétta síðutoppinn með núverandi rými sýnilegt strax. Við áframhald úr vistuðum stað, djúptengil eða leiðréttingu ræður viðkomandi markstaður áfram. Sjálfvirk endurfókusun má ekki keyra við hvert svar eða stela fókus frá textainnslætti.

Rýmisleiðir halda `rymi`, `atridi`, `fra=yfirferd`, `yfirferdRymi` og `yfirferdAtridi`. Brunavarnir halda sérstöku `hluti/flokkur/rad/reitur`-leiðinni og endurkomu að `#review-fire-safety`. Mælar halda `maelar/maelaReitur` og `#review-meter-readings`. **Ekki má bæta almennum hluta- eða rýmisparametrum á þessar sérleiðir:** núverandi sannprófun hafnar óþekktum query-lyklum. Ný stika þarf að nota fyrirliggjandi leiðsagnarhjálpara.

Við opnun kafla úr rýmisvinnu þarf að muna opið atriði í minni viðmótsins. Endurkoma sýnir og fókusar sama markstað; engin ný loforð eru gefin um nákvæma endurheimt pixlastöðu. Back/Forward, endurhleðsla, ógild eða úrelt skotmörk og upprunatengill úr Yfirferð þurfa sérstök innleiðingarpróf.

Frumgerðin sýnir leiðréttingarferðina með einföldu Yfirferðarviðmiði, ekki nýrri hönnun Yfirferðar. `scenario`-slóðir og einföld leiðsagnarlíking hennar tilheyra eingöngu rýnigögnum; þær eru ekki nýr slóðasamningur fyrir appið.

## Aðgengi og sannprófun

Staðfest var í desktop-vafra með stærðarhermun: birting við 360, 390 og 1440 px; engin lárétt síðuskrollun þar né í 320 CSS px aukaprófun; rýmisval; Enter á fyrra/næsta; Tab frá innbyggðu rýmisvali; sleppitengill; opnun brunavarna; fókus aftur í sama atriði; leiðrétting og endurkoma að upprunatengli í Yfirferð. Niðurstöður og fókusmæling eru í [prófunarskránni](screenshots/prototype-checks.json). Engar villur sáust í lesnum villuloggi frumgerðarvafrans. Þetta er afmörkuð prófun á hönnunarfrumgerð.

Nýir aðalstýrifletir miða við 44 px snertihæð. AA-lágmark SC 2.5.8 er 24 × 24 CSS px með tilgreindum undanþágum; 44 px er hér vinnuvistfræðilegt viðmið, ekki röng tilvitnun í AA. [W3C: markstærð](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Fókus er sýnilegur, innbyggt `select` og `details` halda venjulegri lyklaborðshegðun og virk staðsetning er merkt með `aria-current`. Petrol/navy/teal-litakerfi, Manrope-letur og orðaðar stöður halda sér. Staða er ekki eingöngu sýnd með lit. [W3C: endurflæði](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Sticky-stikan hefur aðeins eitt lag og kaflar fá skrunbil fyrir fókus. Í athuguðu endurkomutilviki var fókusmarkið við 214 px og neðri brún stikunnar við 84 px. Við skjáhæð 500 px eða minni verður stikan kyrr í frumgerðinni. Aðlögun að raunverulegu sjónsvæði við opið símatakkaborð er enn innleiðingar- og tækjaprófun. [W3C: fókus má ekki hyljast](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

**Ekki er lýst yfir WCAG 2.2 AA-samræmi.** Rauntæki, skjálesari, raunverulegur vafraaðdráttur, 200% textastækkun, símatakkaborð, kamera/myndasafn og langt frjálst rýmisheiti eru enn óprófuð. 320 CSS px mynd jafngildir ekki prófun á raunverulegum 400% aðdrætti. Matsstýringar frumgerðar eru óvirkar og geta ekki sannað aðgengi eða virkni raunverulegra ritla.

## Varðveisla og afturhvarfsáhætta

Raunverulegu `src/`-skrárnar, reglur og geymsla eru óbreytt. Frumgerðin endurnýtir afrit af birtu UI1-DOM og stílum; hún flytur ekki UI2 inn í keyrslu appsins. Virkni og þrif eru áfram sjálfstætt mat. Skilyrtar hraðaðgerðir á ástandi, örugg fráviksbreyting og takmörkuð afturköllun þarf að varðveita óbreytt við síðari innleiðingu.

| Áhætta við síðari innleiðingu | Vörn / áskilið próf |
|---|---|
| Færð eyðublöð eða nýir wrapperar endursetja ritla | Færa fyrirliggjandi einingar með stöðug auðkenni; sannreyna að hlutatenglar endursetji ekki mat, varðveitt svið, myndir eða tímabundin staðfestingarsnapshot. |
| Sticky-stika hylur reit, mótal eða villu | Mæla raunhæð, laga skrunbil, prófa bæði fókusstefnur, aðdrátt og opið takkaborð. Aðeins stikan festist. |
| Vöntun er falin eða valfrjálst talið skyldugildi | Endurnýta `itemProgress`, `missingAnswers`, `fireState`, `fireGroupStatus`, `meterState` og `meterUtilityStatus`; ekki nýtt almennt completion-boolean. |
| Leiðrétting missir uppruna eða röng eining tekur fókus | Varðveita aðskildar room/fire/meter-leiðir, query-sannprófun og föst fallback-skotmörk. Prófa líka Back/Forward og úrelt row-id. |
| Vistunarvandi hverfur í þéttum haus | Nota raunverulegan `SaveStatus` og óbreyttar viðvaranir/retry-stýringar. Literal „Sýnigögn tilbúin“ í rýnifrumgerð er ekki staðgengill þeirra. |
| Önnur hegðun brotnar við óvart endurgerð atriða | Halda `ObservationEditor`, `HeatingObservationEditor`, `PhotoPreview`, fire/meter-einingum, tengdum upphafs-/lokaskoðunum, samanburði og skýrsluforskoðun utan UI2A-útlitsbreytinga. |

Engin ný vistunar- eða samhliða ritunarvörn er til staðar. Myndir haldast tímabundnar sýni-forskoðanir. Frumgerðin hefur enga bakenda, auðkenningu, gagnagrunn eða nýja viðskiptavinageymslu.

## Áfangaskipt innleiðing eftir samþykkt

1. **Stöðusamningur.** Samþykkja röðun, fyrstu lendingu og texta í töflunni. Skrá cases fyrir óskráð leigusamhengi, áskildar brunavarnir, óvirka/valfrjálsa/virka mæla, takmarkanir og staðfestingarskyldu. Engin gögn eða viðskiptaregla breytist.
2. **Skjáskel Skráningar.** Þétta haus og skref aðeins innan samþykkts umfangs. Merkja rýmisframvindu skýrt. Nota raunverulega vistunarstöðu; halda villum sýnilegum. Sjónræn rýni við 360/390/1440 áður en næsta skref byrjar.
3. **Hlutatenglar og rýmisstýring.** Færa núverandi fire/meter-einingar niður, tengja stiku og endurkomu án afritunar ritla. Varðveita staðsetningu, item-opnun og leiðréttingarhjálpara. Samræma fyrstu/síðustu rýmisaðgerð.
4. **Markviss afturhvarfsprófun.** Keyra viðeigandi UI1-, inspection-navigation-, fire-, meter-, heating-, evidence-, comparison- og report-preview-próf. Bæta prófum aðeins þar sem ný röðun eða fókushegðun skapar nýja áhættu. Prófa að breytt mat endursetji ekki scroll/fókus og að myndir lifi hlutaferð innan sömu lotu.
5. **Mannauðsprófun og óháð rýni.** Raunverulegur sími, skjálesari, aðdráttur, símatakkaborð og kamera/myndasafn; síðan sjálfstætt samþykki áður en framleiðslutengd vinna er rædd.

Þessi lota keyrði ekki heila bakenda- eða framleiðslubyggingarprófun: engum keyrslukóða appsins var breytt. JavaScript-frumgerð og staðbundnir hjálparar voru setningafræðiprófuð; nýjar leiðsagnaraðgerðir voru skoðaðar í vafra. Óbreyttar source-skrár eru ekki staðgengill fullrar afturhvarfslotu þegar UI2 er síðar innleitt.

## Ákvarðanir sem bíða samþykktar

1. **Rýmisgátlisti á undan eyðublöðum brunavarna og mæla.** Mælt með þessari röðun, með alltaf sýnilegri orðaðri stöðu og eins skrefs aðgangi að báðum köflum. Áskilið brunavarnamat í leiguskoðun má aldrei fá valfrjálsa merkingu.
2. **Fyrsta lending.** Mælt með þéttum síðutoppi í nýrri ferð; áframhald, djúptenglar og leiðréttingar halda nákvæmari markstað. Þessi breyting þarf meðvitað samþykki vegna núverandi sjálfvirka hops.
3. **Stöðutexti og mörk mælaskráningar.** Samþykkja „rýmisatriði“, „valfrjálst · ósvarað“, „3 flokkar ósvaraðir“ og „ekki hafið / tilgangur óvalinn“. Tillagan virkjar ekki mæla sjálfkrafa og tekur ekki ákvörðun um nýja skyldu til mælaskráningar.

**Stöðvað hér til óháðrar samþykktar.** Main, PR #19 og Docker/D1-vinnutréð voru ekki breytt. Fyrirliggjandi staðbundnar breytingar og órekjanlegar skrár voru ekki færðar eða hreinsaðar. Supabase, Auth, migrations, persistence, hýsing og deployment eru óbreytt. Hosted Gate C er **CLOSED**. Gate E / PUBLIC TEMPORARY er **UNRESOLVED**. Cross-tab concurrency er áfram óleyst. Engin PR, sameining eða birting var gerð.

## Kóðaslóðir sem réðu niðurstöðum

- `src/components/screens/inspection-screen.tsx`: núverandi röðun, heildartalning, mobile-room-select, rýmisstýring og footer.
- `src/components/inspection-checklist.module.css`: A2.2/UI1-stílar, þéttir listar, desktop-ritill og fókusbil.
- `src/components/app-shell.tsx` / `src/components/ui.tsx`: apphaus, `SaveStatus`, skref og viðvaranir.
- `src/lib/model.ts` / `src/lib/inspection-navigation.ts`: fullskráning, vöntun og sjálfstæð room-talning.
- `src/components/use-inspection-navigation.ts`: núverandi sjálfvirk lending, fókus, varðveitt staðsetning og Yfirferðarferð.
- `src/lib/fire-observations.ts`, `fire-navigation.ts`, `meter-readings.ts`, `meter-navigation.ts` og samsvarandi correction-hooks: skilyrt staða og sérleiðir sem þarf að halda óbreyttum.

Öll stíl-, letur-, mynda- og JavaScript-gögn fylgja `prototype/index.html` staðbundið. Staðfest forskoðun notaði afmarkaðan HTTP-þjón; ekki var hægt að sannprófa `file:`-opnun í innbyggða vafranum. Til að opna safnið aftur má keyra `node docs/ui2a/serve.mjs` og fara á `http://127.0.0.1:3213/`. Prófunarþjónarnir voru stöðvaðir við frágang. Engin skráning eða útgáfa er tengd þeim þjóni.
