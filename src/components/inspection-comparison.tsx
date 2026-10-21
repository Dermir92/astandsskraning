"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildInspectionComparison, comparisonStateLabel, contentFingerprint, initialEligible, sourceContent, type ComparedField, type ComparedItem, type InspectionComparison } from "@/lib/inspection-comparison";
import { buildReportPreview, type DeepReadonly, type PreviewRecord } from "@/lib/report-preview";
import type { Report } from "@/lib/model";
import { inspectionHref } from "@/lib/inspection-navigation";
import { useDemo, type PreviewPhoto } from "./demo-provider";
import { EvidenceGallery } from "./evidence-gallery";
import styles from "./inspection-comparison.module.css";

const boundary = "Samanburður skráðra svara er ekki niðurstaða um ábyrgð, orsök, fullnaðarfrágang eða sannreynda atburðarás.";
function useComparison(report: Report) {
  const { state: { reports } } = useDemo();
  const [resolved, setResolved] = useState<{ report: Report; reports: Report[]; value: InspectionComparison | null; failed: boolean } | null>(null);
  useEffect(() => {
    if (!report.linkedInitial) return;
    let active = true;
    buildInspectionComparison(report, reports).then(value => { if (active) setResolved({ report, reports, value, failed: false }); }, () => { if (active) setResolved({ report, reports, value: null, failed: true }); });
    return () => { active = false; };
  }, [report, reports]);
  const current = resolved?.report === report && resolved.reports === reports;
  return { pending: !!report.linkedInitial && !current, value: current ? resolved.value : null, failed: current && resolved.failed };
}
export function LinkedFinalCreate({ report }: { report: Report }) {
  const { store, state } = useDemo();
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<{ fingerprint: string; operation: string } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const start = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirmation) cancel.current?.focus(); }, [confirmation]);
  if (!initialEligible(report)) return null;
  const begin = async () => {
    if (working.current) return;
    working.current = true; setBusy(true); setMessage("");
    try { setConfirmation({ fingerprint: await contentFingerprint(sourceContent(report)), operation: crypto.randomUUID() }); }
    catch { setMessage("Ekki tókst að undirbúa tenginguna. Engin skýrsla var stofnuð."); }
    finally { working.current = false; setBusy(false); }
  };
  const create = async () => {
    if (!confirmation || working.current) return;
    working.current = true; setBusy(true); setMessage("");
    try {
      const id = await store.createLinkedFinal(report.id, confirmation.fingerprint, confirmation.operation);
      if (id) router.push(`/skyrslur/${encodeURIComponent(id)}/upplysingar`);
      else { setConfirmation(null); setMessage("Lokaskoðun var ekki stofnuð. Upphafsgögn kunna að hafa breyst eða vistunarvernd/hámark hindraði aðgerðina. Skoðaðu stöðuna og reyndu aftur."); }
    } catch { setMessage("Ekki tókst að stofna lokaskoðun. Reyndu aftur; engin vistunarstaðfesting liggur fyrir."); }
    finally { working.current = false; setBusy(false); }
  };
  return <section className={styles.create} aria-label="Hefja tengda lokaskoðun">
    {!confirmation ? <button ref={start} type="button" className="text-button" disabled={busy || state.status === "read-error" || state.status === "loading"} onClick={begin}>Hefja lokaskoðun</button> : <div className={styles.confirm}>
      <h2>Stofna lokaskoðun úr þessari upphafsskráningu?</h2><p><strong>{report.details.address || report.title} · {report.details.unit || "Íbúð óskráð"}</strong></p>
      <p>Rými og gátlisti verða endurnotuð ásamt eignarupplýsingum og viðeigandi uppgefnum leiguupplýsingum. Farið verður yfir þær í nýjum drögum. Öll ástandssvör, dagsetningar, skráningaraðili, fyrirsvar, umfang, athugasemdir, húsgagnamat, brunavarnir, hitasvör, mælar og myndir byrja óskráð.</p>
      <p>Með stofnun velur þú tengingu við sömu eign og sama skoðunar-/leigutilvik. Þetta staðfestir ekki réttmæti upplýsinganna eða að skoðun hafi farið fram.</p>
      <div className={styles.actions}><button ref={cancel} className="button button-secondary" type="button" disabled={busy} onClick={() => { setConfirmation(null); setMessage(""); requestAnimationFrame(() => start.current?.focus()); }}>Hætta við</button><button className="button button-primary" type="button" disabled={busy} onClick={create}>Stofna tengda lokaskoðun</button></div>
    </div>}
    <p role="status">{busy ? "Undirbý tengda lokaskoðun…" : message}</p>
  </section>;
}
function Facts({ record }: { record: DeepReadonly<PreviewRecord> }) {
  return <div className={styles.facts}>
    {record.status ? <p>{record.status}</p> : null}
    <dl>{record.fields.map(f => <div key={f.key}><dt>{f.label}</dt><dd>{f.value}{f.qualification ? <p>{f.qualification}</p> : null}</dd></div>)}</dl>
    {record.issues.length ? <ul>{record.issues.map(i => <li key={i.id}>{i.label}</li>)}</ul> : null}
    {record.retained.length ? <details><summary>Varðveitt gögn utan núverandi svars</summary><p>Ekki núverandi niðurstaða eða staðfest saga.</p><dl>{record.retained.map(f => <div key={f.key}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl></details> : null}
    {record.children.map((r, index) => <section key={index}><h4>{r.title}</h4><Facts record={r} /></section>)}
    {record.notes.map((n, index) => <p key={index}>{n}</p>)}
  </div>;
}
function Reconfirm({ comparison }: { comparison: InspectionComparison }) {
  const { store, state } = useDemo();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  return <details className={styles.confirm}><summary>Yfirfara breytt samanburðarviðmið</summary>
    <p>Fyrri útgáfa upphafsgagnanna er ekki varðveitt. Hér velur þú núverandi upphafsskráningu og núverandi eignar-/leigusamhengi sem viðmið. Lokasvör og eldri atriðatengingar breytast ekki.</p>
    <Link className="text-link" href={`/skyrslur/${encodeURIComponent(comparison.initial!.id)}/forskodun`}>Lesa núverandi upphafsskráningu</Link>
    <button className="button button-secondary" type="button" disabled={busy || state.status === "read-error"} onClick={async event => {
      if (working.current) return; working.current = true; setBusy(true);
      const landing = event.currentTarget.closest<HTMLElement>("section[tabindex]");
      try { const accepted = await store.reconfirmInitial(comparison.final.id, comparison.sourceFingerprint!, comparison.finalContextFingerprint!); setMessage(accepted ? "Núverandi viðmið valið. Engin ástandssvör voru afrituð." : "Gögn breyttust eða ekki var hægt að staðfesta. Skoðaðu stöðuna aftur."); if (accepted) requestAnimationFrame(() => { landing?.focus(); landing?.scrollIntoView({ block: "nearest" }); }); }
      catch { setMessage("Ekki tókst að staðfesta viðmiðið. Engin vistunarstaðfesting liggur fyrir."); }
      finally { working.current = false; setBusy(false); }
    }}>Nota núverandi upphafsskráningu og samhengi</button><p role="status">{busy ? "Athuga viðmið…" : message}</p>
  </details>;
}
function PairedFields({ fields }: { fields: readonly ComparedField[] }) {
  return <dl className={styles.paired}>{fields.map(f => <div className={styles.field} key={f.label}><dt>{f.label}</dt><dd><span>Upphaf</span>{f.initial}</dd><dd><span>Lok</span>{f.final}</dd><dd className={styles.result}>{comparisonStateLabel(f.state)}</dd></div>)}</dl>;
}
function Photos({ photos, context }: { photos: PreviewPhoto[]; context: string }) {
  return <div><h4>{context}</h4>{photos.length ? <EvidenceGallery photos={photos} context={context} /> : <p>Engar tengdar myndir tiltækar í þessari setu. Fyrri myndasaga er ekki þekkt.</p>}</div>;
}
function safePhotos(preview: ReturnType<typeof buildReportPreview>, roomId?: string, itemId?: string) {
  return preview.photos.filter(p => p.source.kind === "item" && "roomId" in p.source && p.source.roomId === roomId && p.source.itemId === itemId).map(p => ({ id: p.sourcePhotoId, url: p.url, name: p.name }));
}
function ComparisonItem({ item, initialPreview, finalPreview, reading }: { item: ComparedItem; initialPreview: ReturnType<typeof buildReportPreview>; finalPreview: ReturnType<typeof buildReportPreview>; reading: boolean }) {
  const facts = !!item.initialItem?.kind || !!item.finalItem?.kind || !item.initialItem || !item.finalItem;
  const initialRecord = facts ? initialPreview.rooms.find(r => r.source.kind === "room" && r.source.roomId === item.initialRoom?.id)?.items.find(i => "itemId" in i.source && i.source.itemId === item.initialItem?.id) : undefined;
  const finalRecord = facts ? finalPreview.rooms.find(r => r.source.kind === "room" && r.source.roomId === item.finalRoom?.id)?.items.find(i => "itemId" in i.source && i.source.itemId === item.finalItem?.id) : undefined;
  return <section className={styles.item}>
    <h3>{item.finalRoom?.name ?? item.initialRoom?.name} · {item.finalItem?.name ?? item.initialItem?.name}</h3>
    {item.initialRoom && item.finalRoom && (item.initialRoom.name !== item.finalRoom.name || item.initialItem?.name !== item.finalItem?.name) ? <p>Upphaf: {item.initialRoom.name} · {item.initialItem?.name}. Heiti hafa breyst; tengingin fylgir auðkennum.</p> : null}
    <ul className={styles.labels}>{item.labels.map(label => <li key={label}>{label}</li>)}</ul>
    <PairedFields fields={item.fields} />
    {item.text.length ? <><p>Textamunur lýsir skráningu, ekki sjálfkrafa breytingu á eign.</p><PairedFields fields={item.text} /></> : null}
    {facts ? <div className={styles.columns}><div><h4>Upphaf · skráðar staðreyndir</h4>{initialRecord ? <Facts record={initialRecord} /> : <p>Óskráð</p>}</div><div><h4>Lok · skráðar staðreyndir</h4>{finalRecord ? <Facts record={finalRecord} /> : <p>Óskráð</p>}</div></div> : null}
    <details><summary>Tímabundnar myndir við þetta atriði</summary><p>Myndir eru sýndar við raunverulegar setutengingar. Tökutími, samsvarandi sjónarhorn og myndasaga eru óstaðfest. Enginn myndsamanburður er vistaður.</p><div className={styles.columns}>
      <Photos context="Upphaf · tímabundnar myndir" photos={safePhotos(initialPreview, item.initialRoom?.id, item.initialItem?.id)} /><Photos context="Lok · tímabundnar myndir" photos={safePhotos(finalPreview, item.finalRoom?.id, item.finalItem?.id)} />
    </div></details>
    {item.finalRoom && item.finalItem ? <Link className="text-link" href={reading ? `/skyrslur/${encodeURIComponent(finalPreview.id)}/yfirferd#comparison` : inspectionHref(finalPreview.id, { roomId: item.finalRoom.id, itemId: item.finalItem.id }, { roomId: item.finalRoom.id, itemId: item.finalItem.id })}>{reading ? "Leiðrétta í yfirferð" : "Breyta lokasvari"}<span className="sr-only"> · {item.finalRoom.name} · {item.finalItem.name}</span></Link> : null}
  </section>;
}
export function InspectionComparisonPanel({ report, reading = false, compact = false }: { report: Report; reading?: boolean; compact?: boolean }) {
  const { state } = useDemo();
  const { value, pending, failed } = useComparison(report);
  const today = new Date().toISOString().slice(0, 10);
  const initialPreview = useMemo(() => value?.initial && (value.status === "ready" || value.status === "changed") ? buildReportPreview({ report: value.initial, photos: state.photos, reports: state.reports, today }) : null, [value, state.photos, state.reports, today]);
  const finalPreview = useMemo(() => value?.status === "ready" ? buildReportPreview({ report, photos: state.photos, reports: state.reports, today }) : null, [value, report, state.photos, state.reports, today]);
  if (!report.linkedInitial) return null;
  return <section id={compact ? "linked-context" : "comparison"} className={styles.panel} aria-label="Samanburður upphafs og loka" tabIndex={-1}>
    <h2>{compact ? "Tengd lokaskoðun" : "Samanburður upphafs og loka"}</h2>
    <p role="status">{pending ? "Athuga tengingu og samanburðarviðmið…" : failed ? "Ekki tókst að staðfesta samanburðarviðmið. Enginn samanburður er birtur." : value?.reason}</p>
    {compact ? <p>Afritaðar eignar- og leiguupplýsingar eru uppgefnar og þarfnast yfirferðar. Lokasvör eru sjálfstæð.</p> : null}
    {value?.initial ? <p>Upphaf: {value.initial.details.address || value.initial.title} · {value.initial.details.inspectionDate || "Dagsetning óskráð"}. Lok: {report.details.address || report.title} · {report.details.inspectionDate || "Dagsetning óskráð"}. Dagsetningar eru uppgefnar.</p> : null}
    {value?.initial && value.status === "ready" ? <Link className="text-link" href={`/skyrslur/${encodeURIComponent(value.initial.id)}/forskodun`}>Lesa upphafsskráningu</Link> : null}
    {value?.dateNotice.startsWith("Skoðunardagsetningu") || value?.dateNotice.startsWith("Uppgefin lokadagsetning") ? <p>{value.dateNotice}</p> : null}
    <p>Skráður munur er ekki niðurstaða um orsök eða ábyrgð. Lokasvör eru sjálfstæð.</p>
    <details><summary>Um viðmið og takmarkanir samanburðar</summary><p>Upphafstilvísun: {report.linkedInitial.initialReportId}. Afritaðar eignar- og leiguupplýsingar eru uppgefnar og þarfnast yfirferðar.</p><p>{boundary}</p><p>{value?.dateNotice ?? "Röð og dagsetningar skoðana eru óstaðfestar."}</p><p>Viðmiðið er núverandi staðbundin skráning. Fyrri útgáfur, allar millibreytingar og breytingar í öðrum gluggum eru ekki sannreyndar.</p></details>
    {value?.status === "changed" ? reading ? <Link className="text-link" href={`/skyrslur/${encodeURIComponent(report.id)}/yfirferd#comparison`}>Yfirfara breytt viðmið í yfirferð</Link> : <><details><summary>Núverandi upphafsgögn · ekki fyrri útgáfa</summary>{initialPreview ? <><Facts record={initialPreview.property} />{initialPreview.rental ? <Facts record={initialPreview.rental} /> : null}</> : null}</details><Reconfirm comparison={value} /></> : null}
    {!compact && value?.status === "ready" && initialPreview && finalPreview ? <>
      <p>{value.items.filter(i => i.changed).length} atriði með skráðum mun · {value.items.filter(i => i.same).length} atriði með sömu skráðu svörum. Aðrir reitir geta verið ófullgerðir eða ósamanburðarhæfir. Þetta er ekki framvinda eða gæðaeinkunn.</p>
      {!value.items.length ? <p>Engin atriði til samanburðar. Tómar skráningar staðfesta enga niðurstöðu.</p> : <details className={styles.records}><summary>Skoða öll samanburðaratriði ({value.items.length})</summary>{value.items.map((item, index) => <ComparisonItem key={`${item.key}:${index}`} item={item} initialPreview={initialPreview} finalPreview={finalPreview} reading={reading} />)}</details>}
      <details><summary>Brunavarnir og mælar · aðskildar skráningar</summary><p>Enginn sjálfvirkur dómur um breytingu á brunavörnum. Mælagögn eru sjálfstæðir álestir; tilgangur og fyrirkomulag verða að vera staðfest í hvorri skráningu. Engin notkun, mismunur eða aflestrarsaga er reiknuð.</p><div className={styles.columns}>
        <div><h3>Upphaf · brunavarnir</h3><Facts record={initialPreview.fire} /><h3>Upphaf · mælar</h3><Facts record={initialPreview.meters} /></div><div><h3>Lok · brunavarnir</h3><Facts record={finalPreview.fire} /><h3>Lok · mælar</h3><Facts record={finalPreview.meters} /></div>
      </div></details>
    </> : null}
  </section>;
}
export function PreviousInspectionAnswer({ report, roomId, itemId }: { report: Report; roomId: string; itemId: string }) {
  const { state } = useDemo();
  const { value, pending, failed } = useComparison(report);
  const heading = useId();
  if (!report.linkedInitial) return null;
  const pair = value?.status === "ready" ? value.items.find(i => i.finalRoom?.id === roomId && i.finalItem?.id === itemId) : undefined;
  const preview = value?.status === "ready" && value.initial ? buildReportPreview({ report: value.initial, photos: state.photos, reports: state.reports, today: new Date().toISOString().slice(0, 10) }) : null;
  const record = preview?.rooms.find(r => "roomId" in r.source && r.source.roomId === pair?.initialRoom?.id)?.items.find(i => "itemId" in i.source && i.source.itemId === pair?.initialItem?.id);
  return <details className={styles.reference}><summary id={heading}>Upphafssvar · aðeins til viðmiðunar</summary><p>{pending ? "Athuga viðmið…" : failed ? "Viðmið ekki staðfest." : value?.reason}</p>
    {record && preview ? <><p>{preview.title} · {pair?.initialRoom?.name} · {record.title}. Sjálfskráð gögn, ekki staðfest fyrri útgáfa.</p><Facts record={record} /><Photos context="Upphaf · tímabundnar myndir" photos={safePhotos(preview, pair?.initialRoom?.id, pair?.initialItem?.id)} /></> : <p>Ekkert ótvírætt, virkt samanburðarviðmið er tiltækt við þetta atriði. Lokasvarið er sjálfstætt.</p>}
  </details>;
}
