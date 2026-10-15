# Áfangi 1A — útfærsla og forsendur

## Afmörkun

Notandabeiðnin um áfanga 1A þrengir víðari MVP-forskriftina. Þess vegna eru samanburður, afhendingarkafli með lyklum/mælum, boð, reikningar, PDF og frágangur ekki innleidd í þessari frumgerð.

Forskriftin fannst fyrst sem `astandsskraning-mvp-v1.md` í rótinni. Upprunalega skjalið var lesið og varðveitt; óbreytt afrit er undir `docs/` á þeirri slóð sem verkefnabeiðnin tilgreindi.

## Hönnun og hegðun

- Dökk petrol-aðalvalmynd, blágrænar aðgerðir og ljós bakgrunnur með dökkum, skýrum aukatexta. Hlýir litir eru aðeins notaðir í frávikamerkingum. Engir gradientar, dashboard-sniðmát eða stór KPI-kort. Sjá [birtuskilayfirferð og samanburð litastefna](readability-and-colour.md).
- Manrope-letur er hýst með verkefninu, með íslenskum stöfum. Engar ytri leturbeiðnir.
- Skýrslur birtast í þéttri töflu á tölvu og aðlagast lista á síma. Ástandsskráning hefur rýmalista á tölvu, rýmaval á síma og aðgerðir neðst á skjánum.
- Allir ástandsmöguleikar byrja óvaldir. „Ekki skoðað“ og „Á ekki við“ eru ólík gildi.
- „Atriði skráð“ telur fullgerð svör við ástandi, virkni og þrifum eftir því sem við á, ásamt frávikalýsingu ef hún er nauðsynleg. Það jafngildir ekki því að atriði sé í lagi.
- „Ekki skoðað“, „Ekki prófað“ og ófullgerð svör birtast sérstaklega sem atriði til athugunar í yfirferð.
- Þegar ástand er „Á ekki við“ eru virkni og þrif ekki krafa. Eldri svör eru varðveitt í drögum ef ástandinu er síðar breytt til baka.
- „Slit / galli“, „Skemmt“ og „Virkar ekki“ sýna tegund, staðsetningu, lýsingu og myndasvæði. Ófullgerð frávik má vista; yfirferð sýnir það sem vantar.
- Skortur á yfirlitsmynd eða frávikamynd kemur fram óháð fjölda svaraðra atriða. Engin skýrsla er merkt endanlega fullskráð eða læst.
- Venjuleg athugasemd er valfrjáls. Upplýsingar sem krafist er fyrir fulla skráningu eru merktar; engin slík krafa hindrar vistun draga eða framhald.
- Ný íbúð fær fimm rými. Sýniíbúðin hefur tvö svefnherbergi og samtals sex rými. Sérsniðin rými fá almennan lista; fjölgun heldur svörum fyrirliggjandi rýma.
- Rými er ekki skipt sjálfkrafa þegar síðasta atriðinu er svarað. Notandinn velur næsta rými.
- Dagsetningar í yfirlitinu eru sniðnar á íslensku án þess að reiða sig á mismunandi ICU-stuðning vafra og Node.

## Kóðaskipan

| Slóð | Ábyrgð |
| --- | --- |
| `src/app` | App Router-slóðir, metadata, skel og CSS-hönnunarkerfi með Tailwind-grunni |
| `src/components/screens` | Sex aðalskjáir og afmarkað yfirlit tilbúinna sýnifærslna |
| `src/components/ui.tsx` | Hnappar, stöðumerki, framvinda, skref og fyrirsagnir |
| `src/components/observation-editor.tsx` | Ástand, virkni, þrif, frávik og athugasemdir |
| `src/components/photo-preview.tsx` | Staðbundin og tímabundin myndaforskoðun, stærðar-/tegundarathugun |
| `src/components/demo-provider.tsx` | Vafrageymsla, villumeðhöndlun og minnisbundnar myndir |
| `src/lib/model.ts` | Tegundir, rýmasniðmát, tölur, reglur og staðfesting geymdra gagna |
| `src/lib/fixtures.ts` | Eingöngu tilbúin íslensk sýnigögn |
| `src/lib/locale/is.ts` | Íslensk merki og orðabók; stöðug innri auðkenni óháð tungumáli |
| `tests/prototype.spec.ts` | Vafrapróf með Playwright og aðgengisathuganir með axe |

Gagnalíkanið notar stöðug auðkenni sem eru óháð íslenskum heitum. Þannig er hægt að bæta við enskri orðabók síðar; flytja þarf einnig samfellda skjátexta í orðabók þegar fleiri tungumál eru innleidd. Engin þýðingarþjónusta eða óumbeðinn tungumálarofi er settur upp nú.

`useSyncExternalStore` heldur stöðugu fyrsta SSR-ástandi og uppfærir frá vafrageymslu eftir hleðslu. Aðeins gild, útgáfumerkt staðbundin gögn fara í viðmótið. Misheppnaður lestur yfirskrifar ekki eldri gögn; skýr viðvörun útskýrir hvenær ný breyting eða endurtilraun getur skrifað þau.

Next.js þjónninn þjónar viðmótinu og leiðsögn. Engir gagnagrunns-, auðkenningar- eða viðskipta-API-endapunktar eru til staðar.

## Opnir gæðapunktar

- Próf í Safari, Firefox og raunverulegum snertitækjum.
- Handvirk skjálesaraprófun og full WCAG 2.2 AA-yfirferð, þar á meðal notkun við 200–400% stækkun.
- Notendaprófun á skráningarlengd og fjölda svara við virkni/þrifum.
- Staðfesting á endanlegu heiti, vörumerki og nákvæmum atriðalistum.
- Samstilling og varanleg myndavistun verða aðeins hannaðar með raunverulegum aðgangs- og varðveislureglum í næsta tæknilega áfanga.

## Prófanir

Keyrsluskipanir, umfang og takmarkanir eru í README. `playwright-report/index.html` geymir niðurstöðu síðustu vafraprófunar. Skjámyndir af sex aðalskjám við þrjár skjástærðir eru myndaðar af prófunum; sjónræn yfirferð þeirra er viðbót við sjálfvirku athuganirnar.
