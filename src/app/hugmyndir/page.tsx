import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import s from "@/components/inspection-concepts/concept.module.css";

export const metadata: Metadata = { title: "Phase 1B · Samanburður hugmynda" };
export default function Concepts() {
  return <div className={s.hub}>
    <p className={s.kicker}>ÁFANGI 1B · HUGMYNDIR TIL SAMÞYKKTAR</p>
    <h1>Tvær leiðir í gegnum skoðun</h1>
    <p className={s.hubIntro}>Sama íbúð, sömu 46 skoðunaratriði og sömu skráningarreglur. Prófaðu báðar leiðir með tilbúnum gögnum áður en útfærsla er valin.</p>
    <p className={s.hubNote}><FlaskConical size={18} aria-hidden="true" />Aðskildar sýnilotur. Engar breytingar á skýrslum þínum.</p>
    <div className={s.comparison}>
      <article className={s.conceptPreview}><p className={s.kicker}>HUGMYND A</p><h2>Verkefnamiðuð skoðun</h2><p>Eitt atriði í forgrunni. Skýr svör, lítil truflun og meðvituð færsla í næsta atriði.</p><Link href="/hugmyndir/a" className={s.primary}>Prófa hugmynd A<ArrowRight size={18} aria-hidden="true" /></Link><iframe className={s.previewFrame} src="/hugmyndir/a" title="Gagnvirk farsímaforskoðun á hugmynd A" loading="lazy" /></article>
      <article className={s.conceptPreview}><p className={s.kicker}>HUGMYND B</p><h2>Þéttur gátlisti</h2><p>Yfirsýn yfir rýmið. Skýr flýtisvör fyrir hvert atriði og nánari skráning þegar þörf er á.</p><Link href="/hugmyndir/b" className={s.primary}>Prófa hugmynd B<ArrowRight size={18} aria-hidden="true" /></Link><iframe className={s.previewFrame} src="/hugmyndir/b" title="Gagnvirk farsímaforskoðun á hugmynd B" loading="lazy" /></article>
    </div>
    <h2>Samanburður við sömu verkefni</h2>
    <table className={s.hubTable}><caption className="sr-only">Áætlaður fjöldi virkjana, án textainnsláttar, skrolls og myndavals stýrikerfis</caption><thead><tr><th scope="col">Verkefni</th><th scope="col">A</th><th scope="col">B</th></tr></thead><tbody>
      <tr><th scope="row">Veggir í lagi, færa sig áfram</th><td>2</td><td>1 á atriði</td></tr>
      <tr><th scope="row">Gluggar í lagi, virka og hreinir</th><td>3 svör + næsta</td><td>3 svör úr röð</td></tr>
      <tr><th scope="row">46 atriði, allt skoðað og í lagi</th><td>144</td><td>103</td></tr>
      <tr><th scope="row">Styrkur</th><td>Einbeiting og leiðsögn</td><td>Yfirsýn og færri færslur</td></tr>
      <tr><th scope="row">Málamiðlun</th><td>Fleiri næstu-skref aðgerðir</td><td>Meiri upplýsingar á skjánum</td></tr>
    </tbody></table>
    <p className={s.smallPrint}>Áætlanir út frá stýringum, ekki mældur vinnutími. 99 sjálfstæð svör í báðum leiðum. A bætir við 45 færslum; B við 4 rýmaskiptum. Ekkert atriði verður sjálfkrafa „Í lagi“.</p>
    <section className={s.hubRecommendation}><h2>Ráðlegging: þróa hugmynd B áfram</h2><p>Gátlistinn heldur rýminu sýnilegu og fækkar leiðsagnaraðgerðum um 41 í dæmigerðri fimm rýma skoðun. Nánari skráning nýtir skýra svaraframsetningu úr A.</p><p>Samþykkja þarf leiðina, hegðun flýtisvars og myndaaðgerðir áður en þær fara inn í almenna skráningu. Báðar hugmyndir eru enn einangraðar sýnilotur.</p></section>
  </div>;
}
