# Ástandsskráning

**Staða — 3. nóvember 2026 (`main` við PR #25):** Staðbundin íslensk frumgerð fyrir ástandsskráningu íbúðarhúsnæðis við afhendingu og skil. Íbúðarflæðið er útfært frá stofnun draga að yfirferð, ásamt leiguupplýsingum, brunavörnum, kyndingu, mælastöðum, lesútgáfu skýrslu og tengdri lokaskoðun með samanburði. Aðskilin þróunarleið (Supabase C1) sannreynir eigandabundna vistun í staðbundnum gagnagrunni. Ekkert hefur verið gefið út eða sett í hýsingu.

Vöruforskriftin er í [docs/astandsskraning-mvp-v1.md](docs/astandsskraning-mvp-v1.md). Kerfið skráir ástand og afstöðu aðila en **kveður aldrei upp úrskurð um ábyrgð á tjóni**.

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 og Playwright. Lestu `AGENTS.md` áður en kóða er breytt: uppsett Next-útgáfa víkur frá eldri venjum.

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

Fjögur skref: **Upplýsingar → Rými → Skráning → Yfirferð**.

1. **Mínar skýrslur** (`/`): sex tilbúnar færslur, leit, stöðusíur, eignategund og röðun. Aðeins íbúðarhúsnæði er virkt; bíll, geymsla og atvinnuhúsnæði eru sýnd sem „Í undirbúningi“.
2. **Upplýsingar** (`/skyrslur/[id]/upplysingar`): tegund skoðunar (upphaf, lok eða sjálfstæð), heimilisfang og grunnreitir. Í leigusamhengi bætast við leigusalar, leigjendur, leigusamningur, fasteignanúmer og lýsing á húsnæði. Drög mega vera ófullgerð.
3. **Rými** (`/skyrslur/[id]/rymi`): fjölgun, nafnabreyting, sérsniðin rými og fjarlæging með sýnilegri staðfestingu þegar rými hefur svör eða myndir.
4. **Skráning** (`/skyrslur/[id]/skraning`): eitt rými í einu með aðskildu ástandi, virkni og þrifum, frávikum, athugasemdum og myndaforskoðun. Kynding er skráð eftir rýmum; brunavarnir og mælastöður eftir eign. Engin svör eru sjálfkrafa „Í lagi“ og „ekki skoðað“ er aðskilið frá „á ekki við“.
5. **Yfirferð** (`/skyrslur/[id]/yfirferd`): ófullgerð svör, óskoðuð atriði, frávik og myndir sem vantar, með beinum tenglum aftur á nákvæman reit.
6. **Forskoða skýrslu** (`/skyrslur/[id]/forskodun`): lesútgáfa (Concept C) með niðurstöðum, ástandsfærslum og myndum í samhengi. Engin PDF-útgáfa eða prentun.
7. **Hefja lokaskoðun**: úr yfirferð upphafsskoðunar má stofna sjálfstæð lokadrög með sömu rýmum og atriðum. Upphafssvar birtist aðeins til viðmiðunar og yfirferð sýnir samanburð hlið við hlið. Samanburðurinn lýsir mismun, ekki ábyrgð.

Fljótleg prófun: opnaðu **Sýnigötu 14**, eða veldu **Ný skýrsla → Velja íbúð** og farðu í gegnum öll skrefin. `/hugmyndir` varðveitir eldri A/B-hönnunarsamanburð; hann lýsir ekki virka flæðinu.

## Sýnihamur og vistun

- Eingöngu tilbúin, óviðkvæm sýnigögn. Engar raunverulegar persónuupplýsingar.
- Texti, rými og svör vistast í `localStorage` undir `astandsskraning-demo-v1` (útgáfa 1). Þetta er **ekki örugg geymsla úttektargagna** og gögnin eru bundin við vafra og slóð/port.
- **Einn breytingarflipi:** aðeins einn flipi í senn fær breytingarétt á öllu safninu (Web Lock); aðrir flipar eru í lesham. Áður gat eldri flipi skrifað yfir nýrri breytingar annars flipa.
- „Vistað í þessum vafra“ birtist aðeins eftir heppnuð skrif. Ef vistun bregst eða árekstur greinist fer óvistað drag í endurheimtarafrit í `sessionStorage` (`astandsskraning-demo-recovery-v1`) og notandi velur sjálfur framhaldið. Skemmd gögn eru ekki hljóðlega skipt út fyrir sýnigögn.
- Myndir eru staðbundnar `blob:`-forskoðanir sem **hverfa við endurhleðslu eða lokun gluggans**. JPG, PNG og WebP, mest 10 MB á mynd og átta myndir á svæði.
- „Yfirfarið · sýni“ á tilbúnum færslum er dæmistaða, ekki frágengin úttekt.

Til að byrja aftur með upprunalegum sýnigögnum: opnaðu síðuna í einkaglugga. Einnig má fjarlægja eingöngu lykilinn hér að ofan í þróunartólum vafrans; það eyðir staðbundnum sýnidrögum.

## Supabase C1 — staðbundin gagnagrunnsprófun

C1 er aðskilin þróunarleið á **http://127.0.0.1:3101** sem vistar skoðanir eiganda í staðbundnum Supabase-gagnagrunni (PostgreSQL 17) með RLS, atómískum skrifum og útgáfuvörn. Krefst Docker og Supabase CLI sem fylgir verkefninu; engin hýst tenging eða innskráning í Supabase þarf.

```powershell
npm run c1:start
npm run c1:reset
npm run c1:prepare
npm run dev:c1
```

`npm run test:c1` keyrir C1-prófin og `npm run c1:stop` stöðvar staðbundna stakkinn. C1 hefur hvorki myndir, boð né innflutning úr sýniham. Nánar í [docs/SUPABASE_C1.md](docs/SUPABASE_C1.md).

**Hýst Supabase:** H1a/H1b útfæra aðeins undirbúning og ótengda forathugun ([H1a](docs/SUPABASE_H1A.md), [H1b.1](docs/SUPABASE_H1B1.md), [Gate C ákvörðunarpakki](docs/review/H1B3_GATE_C_RELEASE_DECISION.md)). **Gate C er LOKAÐ:** engin hýst SQL-keyrsla, uppsetning eða gagnaaðgangur er heimilaður.

## Gæðapróf

```powershell
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm test
```

`npm test` keyrir sýnihamssvítuna í Chromium við 1440 × 1000, 360 × 800 og 390 × 844, með axe-athugunum gegn WCAG A/AA. C1-, H1a- og H1b-prófin hafa eigin stillingar (`npm run test:c1`, `test:h1a`, `test:h1b`). Síðasta skráða heildarkeyrsla (PR #24, 3. nóvember 2026): **1.309 stóðust, 35 viljandi sleppt, 0 féllu**. Niðurstöður fara í `test-results/` og `playwright-report/`.

Sjálfvirkar athuganir eru ekki full WCAG-vottun.

## Takmarkanir

- **Ekki útfært:** innskráning í sýniham, boð og einnota kóðar, þátttaka mótaðila, ágreiningur, óbreytanlegur frágangur, varanleg myndageymsla, PDF, greiðslur og rafræn undirritun.
- **Ekki sannreynt:** raunveruleg iOS/Android-tæki, skjálesarar, 200–400% aðdráttur, myndavél/myndasafn í síma og aðrir vafrar en Chromium.
- Gátlisti íbúðar styðst við HMS-úttektir en hefur ekki verið sannreyndur sjálfstætt gegn núverandi framkvæmd HMS.
- Við uppsetningu 3. nóvember 2026 sýndi `npm audit` 16 færslur af miðlungsalvarleika; þær hafa ekki verið yfirfarnar.

## Verklag

Hver áfangi er afmarkaður og þarf skýrt samþykki eiganda áður en hafist er handa, og aftur áður en sameinað er í `main`. Vinna fer fram á eigin grein, fer í gegnum óháða yfirferð og fulla prófunarsvítu og er sameinuð með squash. Engin dreifing hefur verið heimiluð.

## Skjöl

- Vara og ákvarðanir: [MVP-forskrift](docs/astandsskraning-mvp-v1.md), [vöruákvarðanir](docs/PRODUCT_DECISIONS.md), [birting og samfella þróunar](docs/PUBLICATION.md).
- Íbúðarflæði: [gátlisti 1B.2a](docs/PHASE_1B2A_INSPECTION_CHECKLIST.md), [leiðsögn 1B.2b](docs/PHASE_1B2B_INSPECTION_NAVIGATION.md), [sönnunargögn 1B.2c](docs/PHASE_1B2C_EVIDENCE_REVIEW.md), [leiguupplýsingar](docs/PHASE_1B3B2_RENTAL_INFORMATION_REVIEW.md), [brunavarnir](docs/PHASE_1B3B3_FIRE_OBSERVATIONS_REVIEW.md), [kynding](docs/PHASE_1B3B4_HEATING_REVIEW.md), [mælastöður](docs/PHASE_1B3B5_METER_READINGS_REVIEW.md), [lesútgáfa skýrslu](docs/PHASE_1B3B6_REPORT_PREVIEW_REVIEW.md), [tengd lokaskoðun](docs/PHASE_1B3B7A_LINKED_COMPARISON_REVIEW.md).
- Gagnaöryggi: [staðbundin gagnavernd 1B.1a](docs/PHASE_1B1A_LOCAL_DATA_SAFETY.md), [einn breytingarflipi UX3-S1](docs/UX3_S1_LOCAL_CONCURRENCY.md).
- Hönnun og lesanleiki: [UX/UI-afhending](docs/UX_UI_HANDOFF.md), [lesanleiki og litastefna](docs/readability-and-colour.md), [hugmyndasafn](docs/PHASE_1B_CONCEPTS.md).
- Eldri áfangar og afhendingar ([1A](docs/afangi-1a.md), [PROJECT_HANDOFF](docs/PROJECT_HANDOFF.md), [IMPLEMENTATION_NEXT_STEPS](docs/IMPLEMENTATION_NEXT_STEPS.md)) eru varðveittar sögulegar heimildir og lýsa ekki núverandi stöðu.
