# Stafræn ástandsskráning — MVP-vöruforskrift v1.0

**Staða:** Vinnuskjal til hönnunar og skipulagðrar þróunar, 14. október 2026  
**Vöruheiti:** Óákveðið (vinnuheiti: Ástandsskráning)  
**Markmið:** Sjálfstæð stafræn þjónusta sem varðveitir ástand eignar við afhendingu og skil, gerir tveimur aðilum kleift að skrá sína afstöðu og framleiðir rekjanlega samanburðarskýrslu.

> Þetta er vara- og tækniforskrift fyrir MVP, ekki staðfesting á lagalegu gildi úttektar eða undirritunar. Lagalega þætti, persónuvernd og endanlega verðmerkingu þarf að yfirfara fyrir opinbera notkun.

## 1. Vörustefna

**Kjarnafyrirheit:** Ein eign, tvær eða fleiri tímabundnar ástandsskráningar, samanburður og varðveitt afstaða þátttakenda. Lausnin kveður ekki upp úrskurð um ábyrgð á tjóni.

**Upphaflegar eignategundir:**

| Eignategund | Umfang í MVP |
|---|---|
| Íbúðarhúsnæði | Ítarlegt snið eftir rýmum, byggt með hliðsjón af opinberu HMS-úttektareyðublaði |
| Bílar | Ítarlegt snið fyrir afhendingu og skil, með staðsetningu skemmda og myndaleiðsögn |
| Geymslur/bílskúrar | Einfaldara sérsniðið snið fyrir rými, læsingar, raka, þrif og aðgengi |
| Atvinnuhúsnæði | Almennt snið þar sem notandi setur upp rými og viðeigandi skoðunaratriði; ekki sérhæfðar öryggisúttektir |

Fyrsta útgáfan er **eitt kerfi með sniðmátum**, ekki fjögur aðskilin forrit. Sniðmát geta verið misítarleg án þess að öll eignamót falli í einn ósveigjanlegan lista.

**Markhópar:** Einstaklingar sem leigja út eða taka á leigu, minni og stærri leiguaðilar, bílaleigur og fyrirtæki sem afhenda eignir eða rými til notkunar annarra.

## 2. Grundvallarreglur sem eru samþykktar

1. **Mótaðili þarf ekki reikning.** Hann fær boð á tilgreint netfang og staðfestir aðgang með tímabundnum einnota kóða. Hlekkur einn nægir aldrei til að sjá efnið.
2. **Stofnandi er innskráður.** Hann á yfirlit yfir eignir, skýrslur og boð. Hægt er að skoða gestaaðgang síðar fyrir einfalda stofnun, en ekki í MVP.
3. **Báðir aðilar geta bætt við gögnum og athugasemdum.** Hvorugur getur breytt eða eytt eldri, frágengnum athugasemdum hins.
4. **Að skoða ≠ að samþykkja.** „Engin svörun“ ≠ samþykki. Ekki er sjálfkrafa gefin niðurstaða um fjárhagslega ábyrgð.
5. **Frágengnum gögnum er ekki breytt hljóðlega.** Viðbætur og leiðréttingar eru rekjanlegar með útgáfum.
6. **Myndir hafa uppruna.** Skrá hvenær skráin barst kerfinu; upptökutími er aðeins kynntur með réttri fyrirvara. Innfluttar eldri myndir eru merktar sem slíkar.
7. **Engin opin myndageymsla eða almenn skýrsluslóð.** Aðgangur að myndum og PDF er auðkenndur og takmarkaður.
8. **Sjálfvirk vistun, ekki fölsk vistunarstaðfesting.** Hleðsluvillur og ósamstillt gögn birtast skýrt.
9. **Aðgengi er grunnkrafa.** WCAG 2.2 AA er markmið við hönnun og prófanir.
10. **MVP á að líta út eins og fagleg vara.** Ekki almenn AI-dashboard sniðmát; viðmót er verkefnamiðað og símafyrst.

## 3. Upplýsingaskipan og kjarnahugtök

- **Eign (Asset):** Húsnæði, geymsla eða ökutæki, með tegund og lýsigögnum.
- **Ástandsmál (Case):** Samhangandi afhendingarferli fyrir eign og leigutilvik/afhendingu; getur tengt upphafs- og lokaskráningu.
- **Skoðun (Inspection):** Upphaf, lok eða sjálfstæð skoðun; með dagsetningu, þátttakendum, stöðu og útgáfu.
- **Sniðmát (Template):** Útgáfumerkt safn rýma/svæða og skoðunaratriða eftir eignategund.
- **Rými eða svæði (Area):** Stofa, eldhús, þak bíls, geymsluhurð o.s.frv.
- **Skoðunaratriði (Checklist item):** Hverju er verið að svara um þetta svæði.
- **Skráning (Observation):** Ástand, virkni, þrif, texti, frávik og hver skráði.
- **Mynd/skjal (Media):** Tengist ákveðinni skráningu eða svæði, hefur eiganda/uppruna og stöðu hleðslu.
- **Þátttakandi (Participant):** Hlutverk, heimild og stöðu aðgangs.
- **Boð (Invitation):** Tiltekinn viðtakandi, aðgangssvið, gildistími, afturköllun, staðfestingarkröfur.
- **Yfirferð (Review):** Viðbrögð við atriði eða skýrslu, athugasemd/ágreiningur, tímastimplar.
- **Atvikaskrá og útgáfur (Audit event/version):** Rekjanlegar breytingar, frágangur, innsend svör og leiðréttingar.
- **Útflutningur (Export):** Versionuð samantekt/PDF með uppruna og stöðu þátttakenda.
- **Réttindi/inneign (Entitlement):** Tilbúinn grunnur undir gjaldtöku og kynningu síðar.

**Mikilvægt:** Ekki geyma ágreining, boðsstaðfestingu, greiðslustöðu og skoðunarstöðu sem eitt stöðugildi. Þetta eru aðskildar víddir.

## 4. Helsta UX-flæði — sameiginlegur grunnur

1. **Mínar eignir / skýrslur.** Notandi sér drög, virkar skoðanir, bíður mótaðila, lokið, ágreining.
2. **Ný skýrsla.** Velja eignategund, tegund skoðunar (upphaf/lok/sjálfstæð), og grunnupplýsingar.
3. **Velja rými eða svæði.** Kerfið leggur til rétta kafla; hægt að breyta og bæta við sérsniðnum atriðum.
4. **Skrá ástand.** Yfirlitsmyndir, atriði og skilyrtar spurningar ef galli eða óvirkur búnaður er merktur.
5. **Afhendingarupplýsingar.** Lyklar, fylgibúnaður, mælir/akstur, orka/eldsneyti og annað eftir tegund.
6. **Yfirfara áður en lokað er.** Óskoðuð atriði, myndir sem vantar, ágreiningsatriði og hvort skýrsla telst fullskráð.
7. **Fráganga og boð.** Stofnandi festir sína útgáfu og býður mótaðila; hægt að bjóða fyrr án þess að afmá vinnuferil.
8. **Örugg yfirferð mótaðila.** Einnota kóði á skráð netfang; sýnileg atriði, myndir, samþykki á afmörkuðum staðreyndum, eigin athugasemdir og ágreiningur.
9. **Lokaskoðun.** Tengist sama máli/eign; sýnir fyrri gögn og leiðbeinir um sambærilegar myndir og athuganir.
10. **Samanburður og útflutningur.** Sýnir skráðan mismun og skilyrði samanburðar; PDF með réttri stöðu yfirferðar, aldrei sjálfvirkri ábyrgðarályktun.

**Önnur flæði sem þarf að styðja:** Mótaðili svarar ekki; boð rennur út; innflutt eldri gögn; upphafsskoðun vantar; annar bætir við nýju atriði; notandi lokar skoðun með skilgreindum frávikum og merktum ófullnægjandi upplýsingum.

## 5. Íbúðarhúsnæði — sniðmát v1

### 5.1 Grunnreitir

- Tegund: upphaf/lok/sjálfstæð (skylda).
- Heimilisfang, póstnúmer, sveitarfélag (skylda við frágang; drög mega vera ófullgerð).
- Íbúðarnúmer/hæð (valfrjálst), innra heiti (valfrjálst).
- Hlutverk stofnanda (skylda); mótaðili valfrjáls á upphafsstigi, nauðsynlegur aðeins þegar senda á boð.
- Dagsetning afhendingar/skila (skylda fyrir frágang).
- Húsgögnum fylgir: já/nei/að hluta.
- Tilvísun í leigusamning (valfrjáls); engin krafa um kennitölu, tryggingarfjárhæð eða afrit samnings í MVP.

### 5.2 Sjálfgefin rými

Forstofa/gangur, stofa, eldhús, svefnherbergi (breytilegur fjöldi), baðherbergi, þvottahús, geymsla, svalir/pallur. Notandi getur bætt við, breytt heiti og sameinað rými.

### 5.3 Atriði og svör

| Rými | Lágmarksatriði |
|---|---|
| Almenn rými | Gólfefni, veggir, loft, gluggar, hurðir/læsingar, ljós/rofar, skápar þar sem við á |
| Eldhús | Innréttingar, borðplötur, vaskur, kranar, eldavél/helluborð, ofn, vifta, ísskápur, uppþvottavél ef til staðar |
| Baðherbergi | Gólf, veggir, loft, salerni, sturta/bað, vaskur, kranar, frárennsli, loftræsting, rakamerki |
| Þvottahús | Gólf, veggir, lagnir/afrennsli, þvottavél/þurrkari ef til staðar |
| Geymsla/svalir | Gólf, veggir, hurðir, læsing, raka- og þrifamerki, handrið/frárennsli ef við á |
| Afhending | Lyklar/kort/fjarstýringar, mælastöður og myndir ef við á, lausamunir, þrif, brunavarnir sem sýnilegar athuganir |

Svarmöguleikar fyrir **ástand:** Í lagi; eðlileg notkunarmerki; slit/galli; skemmt; ekki skoðað; á ekki við.  
Sérstök svör fyrir **virkni:** virkar; virkar ekki; ekki prófað; á ekki við.  
Sérstök svör fyrir **þrif:** hreint; þarfnast þrifa; ekki skoðað; á ekki við.

HMS-matskóða má varðveita sem sérstök lýsigögn/leiðbeiningar þegar skýr samsvörun liggur fyrir. Ekki búa til villandi sjálfvirka 1:1 vörpun.

### 5.4 Myndir og skemmdir

- Fullskráð rými: að minnsta kosti ein yfirlitsmynd og yfirferð viðeigandi atriða. Mælt með tveimur yfirlitsmyndum.
- Þegar skemmd er valin: sýna tegund, staðsetningu, lýsingu, nærmynd og samhengi; leyfa að vista án myndar með skýrri athugasemd um að mynd vanti.
- Myndir eru tengdar atriði/rými, ekki aðeins safnaðar í eitt myndaalbúm.
- Sýnilegar kröfur mega aldrei týnast í flóknu formi eða koma í veg fyrir að notandi visti drög.

## 6. Ökutæki — sniðmát v1

**Grunnreitir:** Skráningarnúmer, tegund/gerð, innra/bókunarauðkenni (valfrjálst), afhendingar-/skiladagsetning, staður, kílómetrar og eldsneyti/rafhlöðustaða.

**Skoðunarsvæði:** Framendi, afturendi, vinstri/hægri hlið, þak, rúður/ljós, felgur/dekk, innrétting, farangursrými, undirhlutir aðeins ef skoðaðir, fylgibúnaður og hreinlæti.

**Skemmd:** Svæði, nánari staðsetning, tegund (rispa/dæld/steinkast/brot/annað), ljósmynd, athugasemd, hvort fyrirliggjandi á fyrri skýrslu. Merking á mynd eða einfaldri teikningu bíls er gagnleg viðbót, en má ekki tefja fyrstu nothæfu gerðina.

**Sérstök notendaþörf:** Hraðari skoðun en fyrir íbúð, góð myndaleiðsögn, fyrr og nú sýnt hlið við hlið.

## 7. Geymslur og atvinnuhúsnæði

### Geymslur/bílskúrar

Skrá gólf, veggi, loft, hurð/læsingu, sýnilegan raka/leka, lýsingu/rafmagn ef til staðar, hreinlæti, aðgengi, afhenta lykla og ljósmyndir. Snið er stutt og á að vera hægt að ljúka án óviðkomandi spurninga.

### Atvinnuhúsnæði

Almennur kjarni með sérsniðnum rýmum, t.d. skrifstofa, verslunarrými, verkstæði eða lager. Hægt að skrá gólf, veggi, loft, hurðir, ljós, innréttingar, sýnilegar skemmdir og fylgibúnað. Ekki krefjast sérhæfðra iðnaðar-, raf- eða brunavarnaprófana. Skýrt þarf að koma fram þegar atriði var ekki prófað af fagaðila.

## 8. Yfirferð mótaðila

- Stofnandi getur boðið mótaðila snemma, en útgáfa sem er send til formlegrar yfirferðar er fryst.
- Netfang mótaðila + tímabundinn boðshlekkur; aðgangur aðeins eftir einnota kóða til skráðs netfangs. Engin krafa um stofnun reiknings.
- Mótaðili sér aðeins tengt mál/skoðun; fær ekki almenna leit eða aðgang að eignum annarra.
- Aðgerðir: skoða; engar athugasemdir; bæta við athugasemd/myndum; skrá ágreining; bæta við nýju atriði; ljúka yfirferð.
- Þátttakandi getur lokið yfirferð án þess að samþykkja að bera bótaábyrgð. Sýna afmörkunina við lokun.
- Engin svörun er sjálfstæð staða. Öðrum aðila er ekki heimilt að stöðva útgáfu PDF að eilífu með þögn.
- Hægt er að svara ágreiningi og skrá sameiginlega niðurstöðu með nýrri færslu, án þess að eyða eldri afstöðu.
- Afturköllun aðgangs hindrar framtíðaraðgang en eyðir ekki sjálfkrafa rekjanlegum sögulegum gögnum.

## 9. Lokaskoðun og samanburður

- Tengja lokaskoðun við sömu eign og sama mál; nota fyrri rými/atriði sem upphafspunkt.
- Sýna fyrri myndir ásamt leiðbeiningu um sambærilegt sjónarhorn; notandi tekur nýjar myndir og gefur nýtt ástandsmat.
- Samanburður sýnir: engin breyting skráð, eðlileg notkunarmerki (mat aðila), breyting til yfirferðar, ekki hægt að bera saman.
- Sýna bæði samræmi og ágreining í yfirferð; kerfið finnur ekki sjálfkrafa sekt eða ábyrgð.
- Ef upphafsgögn vantar: leyfa sjálfstæða lokaskoðun; ef eldri gögn eru flutt inn: merkja uppruna og viðeigandi óvissu.
- Stutt, rekjanleg viðhaldsfærsla á milli skoðana er leyfileg; ekki byggja fullbúið viðhaldskerfi í MVP.

## 10. PDF og verðhugmynd

**Samsett lokaskýrsla inniheldur:** auðkenni eignar, tímabil/skoðanir, aðila og hlutverk, hvað var skoðað/ekki skoðað, upphafs- og lokaástand, myndir með uppruna, samanburð, afstöðu þátttakenda, ágreining og útgáfu-/atvikaupplýsingar.

**Vinnuverð, óstaðfest:** 1.990 kr. fyrir samsetta lokaskýrslu/PDF fyrir einstaklinga. Upphafsskráning og aðgangur/þátttaka mótaðila ókeypis. Fyrirtækjaáskriftir eru vinnutilgátur frá 4.900 kr./mán. með hærri þrepum eftir notkun. **Kynningartilboð:** stefnt að um 70 ókeypis skýrslum eða inneignum; ekki ákveðið hvort miðað sé við fyrstu 70 fullbúnu lokaskýrslurnar eða fyrstu 70 gjaldgenga notendurna. Ákvörðun og skilmálar síðar.

**Fyrir MVP:** Engin raunveruleg gjaldtaka. Byggja gagnalíkan með réttindum/inneign til að greiðsluvirkni geti bæst síðar. Ekki setja upp falskar greiðslur, tilbúið takmarkað tilboð eða yfirstrikað „fyrra verð“ sem hefur ekki raunverulega sögu. Aldrei læsa notanda úti frá eigin skráðum upplýsingum vegna greiðslu.

## 11. Viðmót og hönnunarkerfi

**Útlitsstefna:** Vandaður, traustvekjandi norrænn B2B-hugbúnaður. Verkefnamiðað viðmót, sýnileg upplýsingastigskipting, töflur þegar við á, hóflegt bil, alvöru stöðumerkingar. Ekki risastór KPI-kort, fjólubláir gradientar, óþarfar skrautmyndir, einsleit hlutlaus AI-sniðmát eða of mikil kortanotkun.

**Tilraunalitir, ekki endanlegir:** djúpblár `#18334A`, blágrænn `#276C82`, hlýr áherslulitur `#E6AD53`, ljós bakgrunnur `#F5F4F0`, hvítir fletir. Prófa birtuskil allra samsetninga áður en þær eru festar. Ekki nota lit eina og sér til að miðla stöðu.

**Tölva:** Skýrt yfirlit, leit og síur, þéttar töflur, hliðarslá fyrir rými og stór myndasamanburður.  
**Sími:** Fyrst og fremst skráningarflæði á staðnum; sýnilegur framvinduvísir, myndatöku-/upphleðsluaðgerð, fáir reitir í einu, skýr vistunarstaða, stórir snertifletir.  
**Aðgengi:** WCAG 2.2 AA sem markmið, lyklaborð, fókus, formvillur og skjálesaranöfn, birtuskil, læsilegur texti, ekki litamerking eingöngu. Prófa í farsíma og tölvu.

**UX-reglur:** Engin jákvæð sjálfgefin svör; aðskilin „ekki skoðað“ og „á ekki við“; drög mega vera ófullgerð; aðeins fullnægjandi skoðun fær „fullskráð“ merkingu; ágreiningur á alltaf að vera sýnilegur; engin sjálfvirk ábyrgðarályktun.

## 12. Tæknileg grunnstefna til yfirferðar fyrir Codex

**Ráðlögð frumstefna, ekki endanlegt samþykki fyrir uppsetningu:** Next.js + TypeScript fyrir vef, PostgreSQL/Supabase fyrir gagnagrunn og auðkenningu, lokuð hlutageymsla fyrir myndir, þjónustulag fyrir aðgangsprófanir, Vercel fyrir hýsingu. Þessi stakkur hentar verkefninu en þarf að yfirfara gegn kostnaði, íslenskum persónuverndarkröfum og raunverulegri rekstraráætlun.

**Ekki treysta einungis á framendann fyrir heimildir.** Aðgangsstýring skal athuguð á þjóninum/gagnagrunni og allar myndasendingar verndaðar. Vernda OTP gegn ágiskun með takmörkun tilrauna, gildistíma, rate limit, og endurnýjun setu/boðs. Skjöl og myndir í lokuðum geymslum; ekki óvarin public bucket.

**Útgáfustýring:** Drögum má breyta; við frágang myndast óbreytanleg úttektarútgáfa. Síðari athugasemdir/leiðréttingar eru nýjar færslur. Velja aðferð við síðar skráaréttindi, persónuvernd og eyðingu sem samrýmist þessari kröfu. Skilgreina varðveislutíma, lögmætan tilgang og eyðingarferli áður en alvöru gögn koma inn.

**Gagnasamkvæmni:** Óloknar upphleðslur mega ekki sjást sem fullbúnar; tryggja idempotent inngjafir fyrir stofnun boða, frágang og PDF-gerð þar sem við á. Samtímis breytingar þurfa útgáfuvörn.

**Lagaleg mörk:** Vara þessi er ekki sjálfkrafa formleg úttekt, auðkenning með tölvupósti er ekki sama og fullgild rafræn undirritun, og ástandsmat jafngildir ekki faglegri öryggisúttekt. Fá lögfræðilega yfirferð áður en lögmætisfullyrðingar eru birtar.

## 13. Framkvæmdaáætlun fyrir Codex

### Áfangi 0 — Samræming áður en kóðun hefst
- Yfirfara þessa forskrift og merkja opnar ákvarðanir.
- Ákveða heiti/verkkóða, geymslustað og repository uppsetningu.
- Skilgreina samþykktarviðmið og dæmisögu fyrir heila íbúðaúttekt.

### Áfangi 1 — Hönnunarkerfi og nothæf framendafrumgerð
- Setja upp ramma með faglegu útliti og aðgengi frá fyrsta degi.
- Innleiða „Mínar skýrslur“, „Ný skýrsla“, „Velja rými“, skráningarskjá, yfirferð, lokaskoðun, samanburð.
- Nota skýrt merkt sýnigögn; engin viðkvæm persónugögn.
- Prófa 360px farsíma, spjaldtölvu og tölvu; sjónrænar og aðgengislegar yfirferðir.
- Engar raunverulegar öryggisfullyrðingar á meðan raunveruleg innskráning er óinnleidd.

### Áfangi 2 — Gagnalíkan og öruggur grunnur
- Setja upp gagnagrunn, eignir, mál, skoðanir, sniðmát, svæði, atriði, myndir, útgáfur og atvikaskrá.
- Innskráning stofnanda; ströng aðgangsstýring á þjóninum/RLS þar sem við á.
- Lokuð myndageymsla, upphleðslur, villumeðhöndlun og varðveisluáætlun.
- Sjálfvirk vistun og áreiðanleg staða á vistun.

### Áfangi 3 — Boð, yfirferð og frágangur
- Boð/OTP án stofnunar reiknings fyrir mótaðila.
- Athugasemdir, ný atriði, eigin myndir, ágreiningur, afturköllun og útgáfur.
- Frágangur sem verður ekki hljóðlega yfirskrifaður.
- Öryggispróf á því að gagnaleit, eignanúmer og myndaslóðir leki ekki efni milli aðila.

### Áfangi 4 — Lokaskoðun, samanburður og PDF
- Tenging upphafs- og lokaskoðunar, myndapör og merktir samanburðarflokkar.
- Stuðningur við innflutt gögn og sjálfstæða lokaskoðun.
- PDF með uppruna, tímalínu, athugasemdum og óleystum ágreiningi.
- Aðskilja fullbúinn útflutning frá tilraunagerð/greiðslulíkingu.

### Áfangi 5 — Prófanir og undirbúningur kynningar
- Yfirfara verðmerkingu og lagatexta; ákveða 70 skýrslna/inneigna reglu.
- Skilgreina framtíðar greiðsluþjónustu og viðskiptapróf án þess að rukka í MVP.
- Prófa heildarferli og gera UX-prófun með raunhæfum en tilbúnum gögnum.

## 14. Lágmarkssamþykktarviðmið

- Notandi getur stofnað íbúð, valið rými, skráð myndir og atriði og haldið áfram í drögum.
- Vantar upplýsingar: skýrt ástand í stað þögullar ágiskunar eða „allt í lagi“.
- Boðshlekkur einn nægir ekki til að opna skýrslu; staðfesting viðtakanda er nauðsynleg.
- Mótaðili getur skráð athugasemd og ágreining án reiknings; stofnandi getur ekki yfirskrifað þau gögn.
- Lokaskoðun notar fyrri gögn og myndir en aðgreinir framkominn mismun frá niðurstöðu um ábyrgð.
- PDF birtir ófullnægjandi gögn, uppruna mynda og stöðu mótaðila rétt.
- Útrunnið boð, afturkallað boð og engin svörun eru prófuð.
- Afmarkaður aðgangur er prófaður gegn IDOR/óheimilum gagnabeiðnum og opinberum myndaslóðum.
- Farsíma- og tölvuviðmót stenst handvirka UX-yfirferð og aðgengisprófanir; ekki aðeins lint/build.
- Ekki er raunveruleg greiðsla, tilbúin rafræn undirskrift eða villandi staðhæfing um lögformlega úttekt.

## 15. Opnar ákvarðanir (skulu ekki tefja fyrstu framendafrumgerð)

1. Endanlegt nafn, lén og merki.
2. Nákvæm litasamsetning, letur og útfærsla hönnunarkerfis.
3. Lokaverð og fyrirtækjaþrep; nákvæm skilgreining einnar „skýrslu“ og „afhendingar“.
4. Hvernig kynning fyrstu 70 skýrslna/inneigna er útfærð, gildistími og réttindaúthlutun.
5. Hvort og hvernig lögformleg undirritun verður hluti af seinni útgáfu.
6. Endanleg persónuverndarskjöl, varðveislutími og eyðingarferli.
7. Sérstakir B2B-verkferlar, hópheimildir og samþættingar við bókunar-/eignakerfi.

**Næsta verk:** Byrja á áfanga 1 sem sérstöku, afmörkuðu Codex-verkefni með þessum skjölum sem viðmiði. Ekki innleiða backend eða greiðslur í sama verkhluta nema það sé sérstaklega samþykkt.
