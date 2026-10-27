# H1b.3 — Gate C Release Decision Package

2026-10-27. **DRAFT TIL ÓHÁÐRAR YFIRFERÐAR. GATE C: CLOSED.**
Skjalið er offline ákvörðunargagn. Fullgerð skjöl, PASS-niðurstöður eða merge á
þessu skjali merkja ekki að Gate C sé READY eða að framkvæmd sé heimil.

## 1. Ákvörðunarblað fyrir eiganda

Kóðinn fyrir fyrstu gagnagrunnsuppsetningu er yfirfarinn en ókeyrður á hosted.
Þú þarft ekki að slá neinar skipanir inn núna.

| Spurning | Staða og merking |
| --- | --- |
| Hvað er tilbúið? | Samþykkt source eftir PR #16, atomic uppsetningaráætlun, öryggisathuganir og offline-prófunargögn. |
| Hvað er óstaðfest? | Endanlegt target/branch, tengiprofile, routing-notandanafn og CA-/release-slóðir. Endanlegt framkvæmdarafrit og hash þess eru ekki til. |
| Hvaða áhætta stendur eftir? | Keyrslutími og raunveruleg timeout-expiry eru óprófuð. COMMIT getur hafa tekist þótt lokasvarið vanti. Handvirk history-skráning verður að vera nákvæm. |
| Hvenær stöðvum við? | Við rangt target, breytt source/hash, ósamþykkt inntak, villu, timeout, óvissa niðurstöðu eða fall í eftirathugunum. Engin sjálfvirk ný tilraun. |
| Hvað ef COMMIT er óvíst? | Frysta frekari tilraunir. Fyrst leysa stöðu fyrri keyrslu eða halda STOP. Síðan þarf nýja heimilaða tengingu, history-receipts og fullar eftirathuganir. |

Eftirfarandi samþykki eru aðskilin og liggja ekki fyrir með þessu verkefni:

1. **Release-undirbúningur:** afmörkuð heimild til að útbúa og yfirfara endanlegt
   afrit. Heimild til enabled afrits þarf að vera skýr; hér er ekkert slíkt útbúið.
2. **Framkvæmd:** sérstök Gate C heimild bundin við samþykkt Git revision, client,
   target/profile, skipun, tímamörk og endanlegt release-hash. Hún þarf sérstaklega
   að ná til stofnunar og skrifa á migration-history töflunni.
3. **Staðfesting/recovery:** heimildir fyrir eftirathugunum og rannsókn óvissrar
   niðurstöðu. Seinni credentials-/profile-uppsetning þarf sitt samþykki.

**Mikilvægt val:** eldri runbook nefnir development branch, en fyrri Dashboard-
skjámynd sýndi Supabase `main / PRODUCTION`. Eigandi þarf að samþykkja nákvæman
gagnagrunn/branch áður en framkvæmd kemur til greina. Samþykkt Git `main` er ekki
samþykki fyrir SQL á Supabase `main`. Engin branch-breyting er lögð til hér.

Tæknilegt PASS staðfestir prófunar-/heilleikaskilyrði. Mannlegt samþykki heimilar
aðgerð. Næsta ákvörðun er yfirferð á pakkanum og hugsanlegum release-undirbúningi.
PUBLIC TEMPORARY er áfram Gate E-mál; executor LOGIN, Auth-notendur, deployment
og hosted application admission haldast lokuð.

## 2. Framkvæmdaráætlun, STOP og recovery

Þetta er lýsing á seinni, sérstaklega heimilaðri framkvæmd. Engin hosted athugun
eða keyrsla fer fram við gerð skjalsins.

1. **Samþykkja forsendur.** Festa nákvæmt execution-revision og byte-identical
   release-input skrár, target/branch, client, non-secret profile-skilyrði, CA,
   tímamörk og ábyrgðaraðila. Skrá hvort óprófuð expiry/COMMIT-rofshegðun sé
   samþykkt takmörkun eða kalli á sérstaklega heimilaða frekari prófun.
2. **Undirbúa afrit eftir sérstöku samþykki.** Halda disabled source óbreyttu.
   Endanlegt afrit á að vera utan canonical migrations og `h1b2` source-möppunnar.
   Einu leyfðu frávikin frá samþykktu bootstrap eru þrjú yfirfarin release-inntök:
   execution-heimild, project-ref og samþykktur event-trigger fingerprint.
   Óháður yfirlesari þarf að samþykkja nákvæmt diff og SHA-256 alls afritsins.
3. **Fá framkvæmdarheimild fyrir það afrit.** Aðeins eftir raunverulegt samþykki má
   skrá það í raunverulegt approval JSON og keyra `--verify-release` á nákvæmu
   samþykktu HEAD. Aldrei búa til jákvæð samþykkisflögg til að fá PASS fyrirfram.
   Validatorinn sannreynir ekki enabled afritið, client eða profile sjálfkrafa;
   sérstök hash-/inntaksstaðfesting á þessum hlutum er áfram nauðsynleg.
4. **Athuga rétt fyrir framkvæmd.** Staðfesta Git/source og canonical hash, client,
   raunverulegar profile-/CA-/release-slóðir og release-hash að nýju. Engin credentials
   eða credential-bearing URI mega fara í Git, argv, logs eða command history.
   Tryggja að engin önnur migration/DDL-keyrsla sé samhliða. Þessar athuganir eru
   ekki beiðni um að endurtaka eldri TLS- eða tengipróf.
5. **Keyra einn samþykktan batch.** Nota eina psql-session og allt samþykkta afritið.
   Innbyggður transaction-lás og preflight staðfesta meðal annars database/session/
   effective role, nákvæma PG-útgáfu, forsendur, fjarveru C1/history og yfirfarna
   event triggers. Frávik þýðir STOP; ekki lagfæra hosted stöðu eða sleppa assertion.
   Project-ref er operator-staðfesting, ekki sjálfstæð server-sönnun um project.
6. **Staðfesta niðurstöðu.** Skrá process-exit strax og lokasvar við COMMIT. Eftir
   staðfest COMMIT þarf sérstaklega heimilaða fresh-session athugun í sama target:
   rétt history-receipts og full [Gate D](h1b2/GATE_D.sql). PASS fyrir COMMIT er
   bráðabirgðaniðurstaða. Fall eftir commit merkir STOP á aðgangi/frekari vinnu,
   ekki sjálfvirkt rollback á þegar commit-uðum breytingum.

| Niðurstaða | Nauðsynleg gögn | Viðbragð |
| --- | --- | --- |
| Staðfest uppsetning | Exit 0 og COMMIT-svar, síðan réttar tvær history-færslur og full Gate D frá nýrri tengingu. | Skrá niðurstöðuna. Engin sjálfvirk opnun Gate E eða application access. |
| Staðfest misheppnuð keyrsla fyrir COMMIT | Staðfest villa fyrir commit, fyrri transaction örugglega lokið og fresh inventory sýnir enga hluta þessarar fyrstu uppsetningar. | Rannsaka orsök; ný tilraun þarf nýtt samþykki. Engin history-repair eða endurkeyrsla frá miðju. |
| Óviss niðurstaða | Rof, timeout, óútskýrður nonzero exit, vantar COMMIT-svar eða ósamræmi í gögnum. | STOP og recovery. Exit-code eða all-absent eitt og sér sannar ekki rollback. |

Recovery fylgir [núverandi runbook](h1b2/README.md#failure-rollback-and-lost-acknowledgement):
frysta frekari tilraunir; ábyrgðaraðili leysir stöðu gömlu execution/backend/
transaction eða heldur STOP. **All-absent meðan eldri transaction gæti enn commit-ast
er ekki rollback-sönnun.** Hvorki bið í 180s né lok psql á client sanna ein og sér
að server-transaction sé lokið. Engin sjálfvirk reconnect-and-replay, cancel eða terminate.
Hosted rannsókn/inngrip þurfa sérstaka heimild; pakkanum fylgir engin slík sjálfvirkni.

Eftir að eldri transaction hefur örugglega lokið: staðfesta target/identity aftur
og nota [RECOVERY_INVENTORY.sql](h1b2/RECOVERY_INVENTORY.sql) eitt og sér í fresh
heimilaðri session. All-absent styður þá að fyrsta uppsetningin hafi ekki commit-ast,
en orsök og ný tilraun þurfa yfirferð. All-present krefst
[RECOVERY_HISTORY.sql](h1b2/RECOVERY_HISTORY.sql), nákvæmra receipts og fulls Gate D.
Mixed/uncertain state, röng/auka/vantar receipt eða query-villa þýðir STOP.

## 3. Tæknileg skilgreining, gögn og óleyst atriði

Samþykktur tæknilegur grunnur er [866f6efce021c4ac430c636c6fd809f506b19dd6](https://github.com/Dermir92/astandsskraning/tree/866f6efce021c4ac430c636c6fd809f506b19dd6).
Ef seinna execution-workspace hefur annað HEAD, t.d. eftir docs-merge, þarf
sérstakt samþykki fyrir því revision-i. Gamalt samþykki færist ekki sjálfkrafa á nýtt HEAD.

| Canonical source / history-version og name | SHA-256 |
| --- | --- |
| [20261024000100_c1_owner_inspections.sql](../../supabase/migrations/20261024000100_c1_owner_inspections.sql); `20261024000100`, `c1_owner_inspections` | `6d372060e7ba6cbd82e3d83890273da7b238394c8c7236c8231fc04b609383c8` |
| [20261027000100_c1_hosted_acl_hardening.sql](../../supabase/migrations/20261027000100_c1_hosted_acl_hardening.sql); `20261027000100`, `c1_hosted_acl_hardening` | `6947af89fd026db15c6e32e94983d0dd13ace65ba1304e974ae858a502fb6e62` |

Bootstrap geymir báðar canonical skrár óbreyttar sem SQL og history-source. Sama
BEGIN/COMMIT nær yfir schema/role, hardening, metadata og assertions. Advisory-lás
`(68412027, 2)` raðar samvinnu-keyrslum; hann útilokar ekki aðra admin-DDL.

| Samþykkt review-artifact | SHA-256 |
| --- | --- |
| Allt [BOOTSTRAP.NOT_EXECUTED.sql](h1b2/BOOTSTRAP.NOT_EXECUTED.sql), enn disabled | `27e29e1a3604a402ae0a6373a6a3b0505f2beff4f45381c409a6f1ce5ac17ed7` |
| Sami bootstrap frá BEGIN og áfram, áður en release-inntök eru breytt | `88541fbf2ba3b815a5544828202e0203e6f3d26b2debc2c9e325c56b869f816a` |
| [GATE_D.sql](h1b2/GATE_D.sql) | `d336d9f516d4d2785d5460a09d6bc988b1cf249625da12944e2640fa52ba87f4` |

Þessi bootstrap-hash eru ekki fyrir óútbúið framtíðar-release-afrit. Það fær eigið hash.
Migration-history [samningurinn](h1b2/README.md#manual-metadata-contract-and-risks)
krefst postgres-owned `supabase_migrations.schema_migrations`, réttrar shape/ACL og
nákvæmlega tveggja færslna með réttum version/name og einum canonical source-texta
í hvoru array. Existing metadata er hafnað, aldrei endurnýtt/repair-að sjálfkrafa.
Samhæfni er bundin við prófað Supabase CLI 2.76.10. Venjulegt `supabase db push`
kemur ekki í stað atomic keyrslunnar.

Gate D sannreynir NOLOGIN, ownership, SECURITY DEFINER/body/search_path, RLS/policy,
shape, raw/effective/inherited ACL, column-leyfi, MAINTAIN og history eftir
[application](h1b2/GATE_D.template.sql)- og [history assertions](h1b2/HISTORY_ASSERTIONS.template.sql).
Þetta eru catalog-/metadata-athuganir, ekki Auth-/app-próf. Runbook krefst einnig
unused taflna; Gate D telur ekki raðir í app-töflum. Aðferð og heimild þeirrar
staðfestingar eru enn óútfærð.

| Fyrirhuguð client-/session-skilyrði | Staða |
| --- | --- |
| PostgreSQL 17 psql, `C:\Program Files\PostgreSQL\17\bin\psql.exe` | Fyrri offline `--version` í samtali gaf 17.11; ekki endurkeyrt hér. File-hash staðfest offline í H1b.3: `c290c7f0a3335f290f8c18011a1e5afa03ee3cdd628697a5f3e767e5f1d3d10d`. Þetta er psql-hash, ekki Supabase CLI-hash í manifesti. |
| Project / host / port / mode | `ozcxjphzzwekpwsbglaf`; `aws-1-eu-west-3.pooler.supabase.com:5432`; session pooler. Endanleg branch og routing-user/profile eru ósamþykkt. |
| Database / session og effective role / server | `postgres` / `postgres` / PostgreSQL 17.11; bootstrap hafnar öðru og athugar creator-capabilities. Database/role/version staðfesta ekki project eitt og sér. |
| TLS / CA | `sslmode=verify-full`, explicit samþykkt CA og TLS 1.2 eða nýrra. CA X.509 SHA-256 fingerprint: `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`; það er ekki hash á PEM-skrá. CA-slóð og raunverulegt profile þurfa yfirferð. |
| Tímamörk | Óbreytt transaction-local lock 5s, statement 60s á statement; fyrirhuguð session-only idle-in-transaction 30s og transaction 180s. Heildartími inniheldur client-bið/netbil og event triggers. Engin sjálfvirk hækkun eftir timeout. |

Target/CA-forsendur eru skráðar í [H1b.1 preflight](../SUPABASE_H1B1.md);
aðferðin í [execution-method review](h1b2/EXECUTION_METHOD_REVIEW.md).
Samþykktur event-trigger fingerprint samkvæmt fyrirliggjandi review er
`c15af4bafb248aa9901781363b5bba51d6cefd55af7a9268ed13421b2065b352`.
Bootstrap athugar hann við eventual keyrslu; breyting þýðir STOP, ekki sjálfvirka uppfærslu.

Skipunarform eingöngu til yfirferðar — **EKKI KEYRA**. Óvirkar slóðir eru viljandi;
þetta er Markdown-textadæmi, ekki keyrsluskrá eða útbúið service profile:

```text
& "<OSAMTHYKKT_PSQL_EXE_SLOD>" -X -w -v ON_ERROR_STOP=on -v ON_ERROR_ROLLBACK=off -d "service=OSAMTHYKKT_SERVICE" -c "SET idle_in_transaction_session_timeout='30s'; SET transaction_timeout='180s';" -f "<OSAMTHYKKT_RELEASE_SQL_SLOD>"
```

Einn process/session; startup-skrár óvirkar og engin password-prompt. `-w` útilokar
ekki credentials úr öðrum libpq-heimildum. Endanlegar profile-/environment-stillingar
þurfa yfirferð án birtingar leyndarmála. Eigin BEGIN/COMMIT er varðveitt; ekki bæta
við `--single-transaction`/`-1`, skipta batch, reconnect/retry eða nota SQL Editor í staðinn.

Offline heilleikahamur, ekki framkvæmdarheimild: `node docs/review/h1b2/prepare.mjs --check`.
Seinni release-staðfesting hefur þetta óvirka dæmiform og er **ekki keyrð hér**:

```text
node docs/review/h1b2/prepare.mjs --verify-release "<EKKI_TILBUID_APPROVAL_JSON>"
```

[prepare.mjs](h1b2/prepare.mjs) og [manifest.json](h1b2/manifest.json) skilgreina
canonical pins, allar committed release-input slóðir og kröfuna um samþykkt HEAD.
JSON er human attestation; það sannar ekki að samþykki hafi verið gefið. Remote SQL
getur hvorki sannað staðbundna Git-presence né mannlegt samþykki.

| Gögn | Hvað þau staðfesta og hvað þau staðfesta ekki |
| --- | --- |
| H1b.3 offline sannprófun | Hash, tilvísanir, source-varðveisla og read-only `--check`; niðurstöður í afhendingu/PR. Engin runtime-/hosted-sönnun. |
| [27 file-only próf](H1B2_OFFLINE_READINESS_REVIEW.md) | Fyrri deterministic commit/merge, canonical pins og release-refusals í einangruðu Git. Ekki endurkeyrð hér. |
| [33/23/19 athuganir](h1b2/OFFLINE_VERIFICATION.md) | Aðskildar sögulegar keyrslur. Local fixture-/CLI-samhæfni vottar ekki hosted. Lost-ack prófið faldi svar, ekki raunverulegt tengingarrof. |
| Hosted niðurstöður frá operator | PG 17.11, psql, verify-full/TLS 1.3 og 30s/180s readback. Engin endurprófun; expiry, heildartími og physical COMMIT-rof eru óprófuð. Eyðing credential-gagna var tilkynnt, ekki endurskoðuð hér. |

Óleyst atriði/misræmi eru skráð hér, en eldri skjöl og kóði eru ekki leiðrétt hljóðlega:

- **Target/branch:** orðalag um development branch í H1b.2 runbook og fyrri
  `main / PRODUCTION` skjámynd þarf að samræma með skýrri target-ákvörðun, ekki ályktun.
- **Samþykkisröð:** runbook tengir release-undirbúning og `--verify-release` í sama
  skrefi, en kóðinn krefst `gateCExecutionApproved` áður en validator stenst.
  Röðin í kafla 2 setur hash-yfirferð fyrir lokaheimild og validator eftir hana;
  sú túlkun þarfnast yfirferðar. Engum guard er breytt eða hann sniðgenginn.
- **Sögulegur texti:** eldri baseline og þá ólokin review/merge-/CA-skilyrði í eldri
  skjölum veita hvorki nýja framkvæmdarheimild né sönnun um núverandi profile.
- **Eftirathuganir:** catalog-PASS leysir ekki óútfærða unused-table staðfestingu
  eða Auth/app-prófun. Þessum atriðum er ekki bætt við Gate D með skjölunarbreytingu.

Enginn hluti pakkans opnar Gate C eða breytir Auth, LOGIN, PUBLIC TEMPORARY eða
öðrum öryggisheimildum. Næsta afmarkaða skref er óháð yfirferð og ákvörðun um
aðeins sérstaklega skilgreindan release-undirbúning; framkvæmd krefst nýrrar heimildar.
