# UI1 · samþætting A2.2

Grunnur: `08a9b39420a86e8c5a4b584bddb4f002df1a742a`. Einangrað vinnusvæði og grein `codex/ui1-a22-inspection`. Viðmið: `design/mobile-inspection-2026-10-28/a22-final/`; lesin gögn og SHA-256 eru í [upprunaskrá](design-reference.json).

Þéttur gátlisti, ljós eignarhaus, dökkur rýmishaus og hliðstætt mat á desktop fylgja A2.2. „Ástand í lagi“ birtist við ósvarað atriði og breytir eingöngu ástandi. Þrif og virkni krefjast eigin svara. Fullskráð frávik heldur fráviksmerkingu. Fullgerð frávik birta samantekt og stærri fyrstu mynd á undan lýsingunni; allar átta myndir eru aðgengilegar.

Við breytingu á virku fráviki þarf staðfestingu. Hún og afturköllun lesa lifandi mark, svör og læsingar aftur; milliliggjandi breyting á sama reit ógildir eldra val, líka A → B → A. Aðeins staðfestur reitur breytist. Hreinsun svara krefst einnig staðfestingar og varðveitir myndir og óþekkt svið.

| Breyttar skrár | Hlutverk |
| --- | --- |
| `src/components/observation-editor.tsx`, `inspection-checklist.module.css` | Raðir, afleiddar stöður, ritill, samantekt, staðfesting, afturköllun og skjástærðir. |
| `src/components/assessment-change.ts` | Tímabundin UI-vörn yfir núverandi store; engin ný vistun eða breytingasaga. |
| `src/components/screens/inspection-screen.tsx` | Eignarhaus og samhengi valins atriðis í rýmishaus. |
| `src/components/photo-preview.tsx`, `evidence-gallery.tsx`, `evidence.module.css` | Valfrjáls stærri fyrsta mynd; sömu myndalyklar, auðkenni, röð, forskoðun og fjarlægingarvörn. |
| `tests/ui1-assessment.spec.ts`, `ui1-visual.spec.ts`, `inspection-ui-helpers.ts` | Ný samþættingar-, varðveislu-, fókus- og skjámyndapróf. |
| Eldri checklist/navigation/evidence/comparison/prototype/fire/readability-próf og `tests/c1/ui.spec.ts` | Aðlöguð að hnappatexta, eignarhaus, samantekt og staðfestingu; C1-breytingin er aðeins textaval prófs. |
| `scripts/ui1-review-evidence.mjs`, þessi QA-mappa | Endurgeranleg varðveislusönnun, niðurstöður og samanburðarmyndir. |

**Sjálfvirk staðfesting:** 972 próftilvik staðfest, 27 sleppt samkvæmt prófastillingum; engin óleyst prófunarvilla. Heildarlotan skilaði 969 staðist og þremur föllum sama læsileikaprófs, sem beið eftir reitum áður en nýja frávikssamantektin hafði verið opnuð. Prófið var aðlagað að „Breyta fráviki“ og öll níu læsileikaprófin stóðust í endurkeyrslu. Appkóðinn og framleiðslubyggingin voru óbreytt milli þessara keyrslna. [Prófaniðurstöður](test-results.json) varðveita bæði upphaflega niðurstöðu og endurkeyrslu, auk samantekinnar lokastöðu.

Typecheck (`npm run typecheck`), lint (`npm run lint`) og framleiðslubygging (`npm run build`) stóðust. Sérstök UI1-/skjámyndalota: **45/45 staðist**, þar af þrjár skjástærðir með myndatöku. Heildarlotan keyrði gegn `next start` á localhost með tilbúnum gögnum; sértækar C1/H1A/H1B-bakendastillingar voru utan lotunnar.

**Skjámyndir:** [samanburðarsafn](gallery.html) og [myndaskrá með SHA-256](screenshots.json): 18 myndir við 1440 × 1000, 360 × 800 og 390 × 844 skjásvæði, bæði heilsíður og skjásýn; sömu tilbúnu skýrslugögn og sama tilbúna myndin fyrir/eftir. „Fyrir“ er raunverulegt app á staðfestu main; „eftir“ er samþætta appið, ekki sýnisfrumgerðin.

| Sýn | Fyrir | Eftir |
| --- | --- | --- |
| Desktop, gátlisti | [mynd](screenshots/before-desktop-checklist.png) | [mynd](screenshots/after-desktop-checklist.png) |
| Desktop, frávik | [mynd](screenshots/before-desktop-defect.png) | [mynd](screenshots/after-desktop-defect.png) |
| Sími 360, frávik | [mynd](screenshots/before-mobile-360-defect-viewport.png) | [mynd](screenshots/after-mobile-360-defect-viewport.png) |
| Sími 390, frávik | [mynd](screenshots/before-mobile-390-defect-viewport.png) | [mynd](screenshots/after-mobile-390-defect-viewport.png) |

**Varðveisla:** [86 varðveittar skrár](preservation.json) samsvara main samkvæmt SHA-256, með línuendum eins og við checkout á Windows. Þar á meðal eru model/domain-rökfræði, DemoStore/CloudStore, leiðsaga, SaveStatus/AppShell, hitaíhlutir, brunavarnir, mælar, samanburður, yfirferð/forskoðun, Supabase og stillingar. Ný próf bera saman öll skýrslugögn og óþekkt svið, bytes/timestamps við hætta-við/Escape/no-op, nýrri athugasemd við afturköllun, sömu myndauðkenni og sama lifandi myndainntak yfir fimm skjábreiddir. Lesvilla skrifar ekki yfir frumgögn; vistunarvilla varðveitir minni og venjulegt retry.

**Áhætta og óstaðfest handpróf:** Afturköllun er tímabundið UI-ástand í rýmisvinnusvæðinu og hverfur við rýmisskipti, brottför eða endurhleðslu. Myndir haldast áfram aðeins í sýnisetu. Prófa þarf raunverulegt iOS/Safari og Android/Chrome með lyklaborði, myndavél/myndasafni, stórum kerfistexta og breytilegri vafrastiku; VoiceOver/TalkBack/NVDA; raunverulegan 200–400% vafraaðdrátt og snertinotkun með einni hendi. Sjálfvirkur aukinn texti/styttur gluggi jafngildir ekki þeim prófum. Raunveruleg geymsluþrengsli og cloud/C1-vistun, árekstrar og endurtenging voru ekki handprófuð. Óháð sjónræn yfirferð þarf einnig að meta desktop-röðunina og skjálesaramerkingu CSS `display: contents`.

Engar aðgerðir voru gerðar á PR #19 eða D1. Engar breytingar á Auth, Supabase, Docker, migrations, hýsingu eða deployment. Hosted Gate C = **CLOSED**; Gate E = **UNRESOLVED**. Afhending er eingöngu draft PR; bíður óháðrar yfirferðar og skýrs samþykkis fyrir frekari skrefum.
