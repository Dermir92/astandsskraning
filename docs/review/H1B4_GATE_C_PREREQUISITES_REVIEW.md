# H1b.4 — Offline yfirferð á forsendum Gate C

2026-10-28. **DRAFT TIL ÓHÁÐRAR YFIRFERÐAR. GATE C: CLOSED.**
Grunnur: staðfest Git `main` eftir merged PR #17,
`7ba3ae2165a0a8711909642f5401b8e8fec674ca`.

Þetta viðbótarskjal útfærir aðeins tvö ólokin atriði í
[H1b.3 ákvörðunarpakkanum](H1B3_GATE_C_RELEASE_DECISION.md): samþykkisröð og
aðferð til að staðfesta tómar C1-töflur. Það byggir á
[samþykktri H1b.2 yfirferð](H1B2_OFFLINE_READINESS_REVIEW.md),
[runbook](h1b2/README.md) og [framkvæmdaraðferð](h1b2/EXECUTION_METHOD_REVIEW.md).
Eldri texti um óskilgreindu atriðin lýsir stöðu við H1b.3; þessi tillaga bíður
enn óháðrar yfirferðar og samþykkis. Skjölun eða merge opnar hvorki Gate C né
heimilar release-undirbúning, tengingu, eftirathuganir eða framkvæmd.

## A. Samþykkisröð og hringháðni

Röðin hér að neðan er tillaga að verklagi fyrir seinna, sérstaklega heimilað verk.
Skrá þarf hver samþykkir, dagsetningu og tilvísun í raunverulega heimild við hvert
samþykkisskref. Tæknilegt PASS kemur aldrei í stað mannlegs samþykkis.

| Röð | Ákvörðun eða aðgerð | Skilyrði áður en haldið er áfram |
| --- | --- | --- |
| 1 | Eigandi samþykkir nákvæmt target/branch og execution Git revision. | Festa Supabase project-ref, branch-auðkenni og production/development stöðu, database, endpoint/port/session-routing og nákvæmt 40-stafa Git HEAD með öllum committed release-input skrám. Samþykkt Git `main` velur ekki Supabase branch. |
| 2 | Samþykkja client/profile, framkvæmdaraðferð, tímamörk og recovery-áætlun. | Festa client-útgáfu/hash/slóð, non-secret profile/routing-user, TLS/CA/slóðir, nákvæma psql-skipun, eina session og explicit transaction. Halda lock 5s/statement 60s og samþykkja fyrirhuguð session-mörk idle 30s/transaction 180s. Ákveða ábyrgðaraðila, STOP, lokastaðfestingu og meðferð óviss COMMIT. Óprófuð timeout-expiry, heildarkeyrslutími og physical COMMIT-rof þarfnast skráðrar áhættusamþykktar eða sérstaklega heimilaðrar frekari prófunar. Credentials-/profile-uppsetning og allar tengiprófanir þurfa eigin heimild. |
| 3 | Veita sérstaka, afmarkaða heimild til undirbúnings endanlegs release-afrits. | Heimildin þarf skýrt að ná til enabled afrits utan canonical migrations og `h1b2` source-möppunnar. Aðeins þrjú release-inntök mega breytast: execution-literal, project-ref og samþykktur event-trigger fingerprint. Disabled source helst óbreytt. Literal í afriti veitir enga execution-heimild. |
| 4 | Óháður yfirlesari samþykkir nákvæmt release-diff og SHA-256 alls endanlega afritsins. | Bera afritið saman við bootstrap úr samþykktu revision-i; engin önnur byte-frávik. Tengja yfirferð við revision, target, öll þrjú inntök, afritsslóð og hash. Eftir þetta má ekki breyta afritinu án nýrrar yfirferðar. |
| 5 | Eigandi veitir sérstaka Gate C execution-heimild fyrir nákvæmlega þetta afrit. | Heimild vísar í skref 1–4, release-hash, client/profile/skipun/tímamörk og nær sérstaklega til stofnunar/skrifa á migration-history. Framkvæmd er skilyrt við raunverulegt PASS í skrefi 6 og óbreyttar forsendur rétt fyrir keyrslu. Sérstakar heimildir fyrir nauðsynlegum eftirathugunum í skrefi 7 verða að liggja fyrir áður en bootstrap er keyrt. |
| 6 | Skrá raunverulegar attestations og keyra `--verify-release` eftir execution-heimild. | Approval JSON verður aðeins til eftir raunverulegt samþykki. `gateCExecutionApproved` og `executionMethodApprovedAndVerified` mega aðeins lýsa gefinni heimild og raunverulega samþykktri/staðfestri aðferð. Fyrirhuguð profile-staðfesting telst ekki þegar framkvæmd. Keyra validator á nákvæmlega samþykktu HEAD; fall þýðir STOP. |
| 7 | Keyra aðeins sérstaklega heimilaðar eftirathuganir; recovery samkvæmt eigin heimild. | Eftir staðfest exit 0 og COMMIT-svar þarf fresh-session athuganir: nákvæm history-receipts, full Gate D og aðferð B. Óviss niðurstaða leiðir í STOP og sérstaklega heimilaða recovery-rannsókn. Heimild til migration er ekki heimild til ótilgreindra athugana eða inngripa. |

Raunverulegur bootstrap-batch kemur aðeins eftir skref 6, fyrirliggjandi heimildir
fyrir eftirathugunum og endurstaðfestingu source/client/profile/CA/release-hash.
Hann er einn samþykktur batch samkvæmt H1b.2, áður en skref 7 hefst.

**Hugsanlegur hringur:** skref 3 í eldri runbook tengir release-undirbúning við
release-validator. En [validatorinn](h1b2/prepare.mjs) krefst
`gateCExecutionApproved`, og execution-heimild þarf yfirfarið endanlegt afrit/hash.
Krafa um validator-PASS áður en afrit má útbúa myndi því skapa hring:
validator → undirbúningur → hash-yfirferð → execution-heimild → validator.
Röðin 3 → 4 → 5 → 6 rýfur hringinn: undirbúningsheimild er sjálfstæð og
execution-heimild gerir síðara PASS að skilyrði fyrir keyrslu. Hún krefst ekki
fyrirfram-PASS. Engum validator eða öryggisvörnum er breytt eða sleppt.

Fyrir skref 5 má nota offline `--check` til heilleikastaðfestingar; það er ekki
`--verify-release` og veitir enga heimild. Validatorinn hvorki gerir SQL enabled
né staðfestir sjálfkrafa sjálfstæða release-afritið, client/profile eða mannlegt
samþykki. Sérstök diff/hash-/profile-yfirferð stendur áfram. Breytt HEAD, jafnvel
eftir docs-merge, krefst samþykkis á nýju revision-i og endurnýjaðra háðra
yfirferða/heimilda; breytt target, afrit/hash eða aðferð stöðvar ferlið þar til
viðeigandi samþykki og athuganir hafa verið endurtekin.

Heimild til eftirathugana skal afmarka aðferð B, history og Gate D sérstaklega,
þótt þær séu samþykktar samhliða skrefi 5. Recovery-áætlun í skrefi 2 er ekki
heimild til cancel/terminate, retry, repair eða skrifa. Áður en recovery-tenging
eða rannsókn hefst þarf sérstaka heimild sem nær til hennar.

## B. Tillaga að read-only staðfestingu á tómum C1-töflum

**Aðeins aðferðarlýsing til yfirferðar. Engin keyranleg hosted SQL-skrá fylgir.**
Eigandi og óháður yfirlesari þurfa síðar að samþykkja nákvæman athugunartexta,
niðurstöðusnið, client/profile, tímamörk og heimild áður en nokkur tenging er gerð.
Bein takmörkuð metadata-/existence-athugun í nýrri `postgres` session er tillagan;
engin application RPC, Auth-fyrirspurn eða app-aðgangsprófun er hluti hennar.

1. **Staðfesta target fyrir heimilaða tengingu.** Bera samþykkt
   project-/branch-auðkenni saman við eigandastaðfest connection routing og
   non-secret client/profile-/TLS-gögn. Database/role/version og project-ref
   literal sanna ekki Supabase project/branch; vanti sjálfstæða tengingu við
   samþykkt target er STOP. Engin fallback eða sjálfvirk reconnect.
2. **Nota nýja session og eina afmarkaða read-only transaction.** Hefja hana með
   `REPEATABLE READ, READ ONLY` áður en fyrsta catalog-/data-query er gerð og
   staðfesta transaction-stillingarnar. Í henni þarf
   `current_database() = postgres`, `session_user = postgres`,
   `current_user = postgres` og server-version `17.11`, samkvæmt samþykktum grunni.
   Staðfesta session-auðkenni (`pg_backend_pid`) og TLS-readback þessarar tengingar;
   engin gögn um aðrar sessions eru sótt. Engin `SET ROLE` eða reconnect.
   Óvænt eða NULL identity/stilling er STOP áður en áfram er haldið.
   Nota aðeins yfirfarin catalog-SELECT og
   tilvistarathuganir; engin DDL/DML, temp objects, functions með skrifum eða
   stillingabreyting utan session/transaction. Tímamörk þurfa eigið samþykki;
   engin sjálfvirk hækkun. Báðar töflur eru þannig athugaðar í sama snapshot-i.
   Þetta sannar tómleika á þeim tíma, ekki fjarveru seinni eða ócommit-aðra skrifa.
   [PostgreSQL 17 lýsir read-only og snapshot-mörkunum](https://www.postgresql.org/docs/17/sql-set-transaction.html).
3. **Staðfesta báðar raunverulegar töflur og ósíaða sýn.** Nota schema-qualified
   `pg_catalog` athuganir á nákvæmlega `public.c1_inspections` og
   `c1_private.operation_receipts`. Báðar verða að finnast sem varanlegar ordinary
   tables (`relkind = r`, `relpersistence = p`), án partition/inheritance, með
   eiganda-OID sama og effective `postgres`, RLS enabled og FORCE RLS off eins og
   samþykktur grunnur krefst. Staðfesta schema-USAGE, table-SELECT og að
   `pg_catalog.row_security_active` sé nákvæmlega false fyrir báðar töflur í
   þessari session. Eigandi sér fram hjá RLS þegar FORCE er off; ekki gera ráð
   fyrir superuser eða nýjum BYPASSRLS/grants. `anon`, `authenticated`, executor
   og `service_role` eru ekki staðgenglar fyrir þessa heimild.
   [Owner/RLS-reglur](https://www.postgresql.org/docs/17/ddl-rowsecurity.html) og
   [privilege-/RLS-athuganir](https://www.postgresql.org/docs/17/functions-info.html)
   styðja þessa tillögu. Vanti réttindi eða forsendu er STOP; ekkert er lagað hosted.
4. **Stöðva frekar en að fá síaða niðurstöðu.** Nota transaction-local
   `row_security = off` og staðfesta gildið áður en tilvistarathuganir fara fram.
   Þetta veitir ekki RLS-bypass: það veldur villu ef fyrirspurn myndi sæta
   RLS-síun. Það er viðbótarvörn við staðfesta eigandaheimild í skrefi 3.
   [PostgreSQL 17 row_security](https://www.postgresql.org/docs/17/runtime-config-client.html#GUC-ROW-SECURITY).
   Ekki slökkva á RLS/FORCE á töflum eða breyta ACL/policies.
5. **Athuga aðeins hvort raðir séu til.** Fyrir hvora töflu þarf ósíað
   `EXISTS` yfir `SELECT 1` án WHERE/pagination/owner-skilyrðis. Nota eingöngu
   fully qualified töfluheiti og skila einu boolean, `has_rows`, fyrir hvora
   töflu. PASS krefst tveggja staðfestra taflna og nákvæmlega false fyrir bæði.
   Vantað/null/auka svar, true, permission-villa, timeout eða annað frávik þýðir
   STOP strax; ekki halda áfram í næstu athugun eða endurtaka sjálfvirkt.
   Ekki nota `reltuples`, statistics eða Data API niðurstöðu sem tómleikasönnun.
6. **Ljúka og varðveita aðeins lágmarksgögn.** Loka read-only transaction með
   rollback og staðfesta eðlileg process-lok; rof eða villa við lok þýðir ólokna
   staðfestingu. Skrá aðeins heimildartilvísun, samþykkt revision/release-hash,
   target-/session-metadata, UTC-tíma, tvö table-present/tvö has-rows boolean og
   PASS/STOP. Hvorki velja né birta row-gildi, UUID, document/payload, receipts-
   efni, Auth-gögn eða credentials. Engin row-sýni, export eða ítarlegt error-detail
   sem gæti borið gögn; aðeins yfirfarið villuauðkenni/SQLSTATE og STOP.

Öll tilskilin gildi eru borin saman við nákvæm væntigildi áður en næsta skref
hefst. Fail-on-error client og yfirfarin niðurstöðustýring þurfa að stöðva bæði við
SQL-villu og óvænt boolean/metadata; exit 0 eitt og sér er ekki PASS. RLS-síuð
núll-niðurstaða er aldrei samþykkt. Engin persónugildi eru sótt til client.

App-/Auth-aðgangur og aðrar migrations/DDL/skrif verða að vera stöðvuð með
samþykktri rekstraráætlun meðan lokastaðfesting fer fram; aðferðin lokar þeim ekki
sjálf. Ef ekki er hægt að staðfesta þá forsendu er STOP. Engin automatic repair,
cleanup eða delete fylgir óvæntum röðum.

**Gate D er áfram aðskilið.** [GATE_D.sql](h1b2/GATE_D.sql) og templates haldast
óbreytt; þau staðfesta catalog/metadata/öryggissamning en ekki tómleika. Aðferð B
kemur heldur ekki í stað fulls Gate D eða nákvæmra history-receipts. Lokastaðfesting
krefst allra þriggja frá heimiluðum fresh sessions eftir staðfest COMMIT.
Við recovery gildir fyrst [stöðvun og lausn fyrri transaction](h1b2/README.md#failure-rollback-and-lost-acknowledgement),
síðan sérstaklega heimiluð inventory/history, Gate D og B þegar allar töflur eru
til staðar. All-absent meðan gömul transaction gæti commit-ast sannar ekki rollback;
mixed/uncertain state þýðir STOP. Tómleikapróf leysir ekki óvissa COMMIT-niðurstöðu.

## C. Afhending og ákvarðanir sem bíða

Útfærsla beggja atriða liggur nú fyrir til yfirferðar; samþykki og hosted-sönnun
liggja ekki fyrir. Eigandi þarf enn að samþykkja röð A og aðferð/heimild B, velja
nákvæmt Supabase target/branch, samþykkja execution-revision, client/profile og
áhættu/tímamörk/recovery. Eftir það þarf sérstaka release-undirbúningsheimild,
óháða diff/hash-yfirferð, execution-heimild, raunverulegt validator-PASS og
sérstakar heimildir fyrir eftirathugunum/recovery samkvæmt A.

Þessi breyting er ein ný Markdown-skrá. Engin hosted tenging/SQL, credentials,
Supabase-breyting, enabled release SQL eða approval JSON er hluti verksins.
Canonical migrations, bootstrap, validator/öryggisvarnir, Gate D, app-kóði og eldri
QA-gögn haldast óbreytt. Offline diff-/tilvísana-/heilleika- og varðveislustaðfesting
er skráð í Draft PR; fyrri prófunarniðurstöður eru söguleg gögn, ekki endurkeyrð
hosted-sönnun. **PUBLIC TEMPORARY helst Gate E-mál. Gate C helst CLOSED.**
PR bíður óháðrar yfirferðar; Ready/merge þarf sérstakt samþykki.
