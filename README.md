# Ástandsskráning

**Current implementation — 16 October 2026:** Phase 1A/1A.1, the approved Phase 1A.2 refinements, Phase 1B.1a local-data safety fixes, and the bounded Phase 1B.2a residential checklist are integrated. The active inspection implementation is in `src/components/screens/inspection-screen.tsx` and `src/components/observation-editor.tsx`. See [the implementation review](docs/PHASE_1B2A_INSPECTION_CHECKLIST.md) and [publication and development continuity](docs/PUBLICATION.md).

**Archived concepts:** `/hugmyndir`, `/hugmyndir/a` and `/hugmyndir/b` preserve the earlier A/B design comparison. Their scenario data and session storage are isolated demonstrations; their UI and historical approval language do not describe the active inspection workflow. The [concept archive](docs/PHASE_1B_CONCEPTS.md) and [approval record](docs/PHASE_1B_CONCEPT_B_APPROVAL.md) remain available. Exact item continuation and broader optional photo access remain outside the integrated Phase 1B.2a slice.

Earlier Phase 1A test counts, audit results and next-step recommendations below are historical. Use the dated publication verification for the current candidate.

Staðbundin íslensk framendafrumgerð í Next.js App Router, TypeScript og Tailwind CSS. Hún styður samfellda leið frá stofnun íbúðardraga, gegnum rýmaval og ástandsskráningu, að yfirferð.

## Ræsing

Notaðu Node.js 22 eða nýrra. Opnaðu PowerShell í verkefnamöppunni:

```powershell
npm ci
npm run dev
```

Opnaðu **http://127.0.0.1:3000**. `npm ci` er aðeins nauðsynlegt við fyrstu uppsetningu eða eftir breytingu á pökkum. Stöðvaðu með `Ctrl+C`.

Til að prófa staðbundið build:

```powershell
npm run build
npm run start
```

## Það sem má prófa

1. **Mínar skýrslur:** sex tilbúnar færslur, leit, stöðusíur, eignategund og röðun.
2. **Ný skýrsla:** allar fjórar eignategundir sýndar. Íbúð er virk; aðrar tegundir eru merktar „Í undirbúningi“.
3. **Upplýsingar um íbúð:** upphaf, lok eða sjálfstæð skráning; heimilisfang, póstnúmer, sveitarfélag, íbúð/hæð, hlutverk, dagsetning, húsgögn og athugasemdir. Drög mega vera ófullgerð.
4. **Velja rými:** breyta fjölda rýma, endurnefna, bæta við sérsniðnu rými og fjarlægja. Þegar rými hefur svör eða myndaforskoðanir þarf að staðfesta fjarlægingu.
5. **Ástandsskráning:** eitt rými í einu, sex ástandssvör, aðskilin virkni og þrif, frávikalýsing, athugasemdir og myndaforskoðun. Svör eru aldrei sjálfkrafa „Í lagi“.
6. **Yfirferð:** samantekt, ófullgerð svör, óskoðuð atriði, athugasemdir, frávik og myndir sem vantar; tenglar til baka í viðeigandi rými.

Fljótleg prófun: opnaðu **Sýnigötu 14**, íbúð með sex rýmum og 53 skoðunaratriðum. Eða veldu **Ný skýrsla → Velja íbúð** og farðu í gegnum öll fjögur skrefin. Breytingar halda sér þegar farið er milli skjáa og við endurhleðslu, ef vafrinn leyfir vistun.

## Sýnihamur og vistun

- Eingöngu tilbúin, óviðkvæm sýnigögn. Heimilisföng og ökutæki eru dæmi; engar raunverulegar persónuupplýsingar eru notaðar.
- Texti, rými og svör vistast í `localStorage` undir `astandsskraning-demo-v1`. Þetta er **ekki örugg geymsla úttektargagna**. Gögnin eru bundin við viðkomandi vafra og slóð/port.
- Vistunarstaða verður „Vistað í þessum vafra“ aðeins þegar `localStorage.setItem` tekst. Bilun birtir viðvörun og aðgerð til að reyna aftur; breytingar haldast í minni gluggans.
- Myndir eru staðbundnar `blob:`-forskoðanir, bundnar við rými eða atriði. Þær fara ekki á þjón, vistast ekki í `localStorage` og **hverfa við endurhleðslu eða lokun gluggans**. Stuðningur er við JPG, PNG og WebP, mest 10 MB á mynd og átta myndir á svæði.
- „Yfirfarið · sýni“ á tilbúnum yfirlitsfærslum er sýnd dæmistaða. Þær færslur eru ekki frágengnar úttektir. Nýjar skráningar haldast alltaf í drögum eða skráningu.
- Engin innskráning, gagnagrunnur, Supabase, tölvupóstur, boð, OTP, greiðsla, rafræn undirritun eða óafturkræfur frágangur. Engin dreifing forritsins fylgir þessum þróunargrunni.

Til að byrja aftur með upprunalegum sýnigögnum: opnaðu síðuna í einkaglugga. Einnig má fjarlægja eingöngu þennan lykil í þróunartólum vafrans; það eyðir staðbundnum sýnidrögum.

## Gæðapróf

```powershell
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm test
```

Playwright-prófin keyra í Chromium við 1440 × 1000, 360 × 800 og 390 × 844. Þau prófa stofnun og yfirferð, leit og síur, breytingar á rýmum og svörum, frávik, myndaforskoðun, endurhleðslu, vistunarbilun, skemmd staðbundin gögn, lyklaborðsfókus og óþekktar slóðir. Axe athugar alla sex aðalskjáina og opna frávikareiti gegn WCAG A/AA-reglum. Skjámyndir, villur og HTML-prófunarskýrsla fara í `test-results/` og `playwright-report/`.

Þessar sjálfvirku athuganir eru ekki full WCAG-vottun. Handvirk skjálesaraprófun og prófun í raunverulegum iOS/Android-tækjum eru eftir.

Síðasta keyrsla, 14. október 2026: **46 vafrapróf stóðust, 2 viljandi sleppt** (sama millibreiddapróf endurtekið í farsímaverkefnum). Engin axe-brot fundust á sex aðalskjáum eða opnum frávikareitum. Ekkert lárétt skroll fannst við 360, 390, 641, 768, 1024, 1280 og 1440 px. Skjámyndir voru teknar af öllum sex skjám á tölvu og báðum farsímastærðum; tölvu- og símaútlit var einnig yfirfarið sjónrænt. Afrit af skjámyndunum eru undir `artifacts/screenshots/`.

## Takmarkanir og næsta skref

- Engin samstilling milli glugga, tækja eða notenda. Ef sama dragi er breytt í tveimur gluggum getur síðari vistun yfirskrifað fyrri breytingu.
- Myndaforskoðun er tímabundin; HEIC, myndamerkingar og eiginleg myndavistun eru ekki útfærð.
- Staða mótaðila, lokaskoðun með samanburði og PDF eru utan áfanga 1A.
- `npm audit --omit=dev` finnur engar veikleikatilkynningar. Fullt `npm audit` skilar fimm `high` færslum í þróunarverkfærakeðju Next/ESLint vegna `braces`/glob. Engin leiðrétt útgáfa `braces` var tiltæk við innleiðingu; ekki var farið í ósamhæfa lækkun Next/ESLint til að fela niðurstöðuna.

Næsta afmarkaða skref: notendaprófa skráningu einnar íbúðar á síma, sérstaklega svör við virkni/þrifum, myndaleiðsögn og ófullgerðum drögum. Laga það sem kemur fram áður en öruggur gagnagrunns- og myndageymslugrunnur er hannaður í sér áfanga.

Grunnforskriftin er í [docs/astandsskraning-mvp-v1.md](docs/astandsskraning-mvp-v1.md). Upprunalega skjalið í rótinni er varðveitt óbreytt. Forsendur og tækniskipan eru í [docs/afangi-1a.md](docs/afangi-1a.md).

## Lesanleiki og litastefna

Litastefna A (dökk petrol og blágrænar áherslur) var valin eftir samanburð á raunverulega skýrsluyfirlitinu. Texti og merkingar eru dekkri og stærri, með ógegnsæjum óvirkum aðgerðum og skýrum fókus. Lægstu mældu birtuskil eru 5,98:1 fyrir texta og 3,31:1 fyrir prófaðar stjórneiningar. Samanburður, mælingar og prófunarumfang eru í [docs/readability-and-colour.md](docs/readability-and-colour.md).
