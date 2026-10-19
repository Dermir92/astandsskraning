"use client";

import { useId, useRef, type ReactNode } from "react";
import type { ChecklistItem, HeatingObservation, Observation } from "@/lib/model";
import { EMPTY_OBSERVATION } from "@/lib/model";
import { HEATING_KINDS, hasHeatingExtensions, heatingAnswered, heatingState } from "@/lib/heating";
import { navigationTargetId } from "@/lib/inspection-navigation";
import { is } from "@/lib/locale/is";
import { useDemo } from "./demo-provider";
import { PhotoPreview } from "./photo-preview";
import styles from "./heating.module.css";

const t = is.heating;
function Choices<T extends string>({ field, label, options, value, change, prefix }: { field: string; label: string; options: Record<T, string>; value?: T; change: (value?: T) => void; prefix: string }) {
  return <fieldset data-question={field} className={styles.choices} tabIndex={-1}>
    <legend>{label}</legend><div className={styles.options}>
      {(Object.entries(options) as [T, string][]).map(([key, text]) => <label key={key} className={styles.option}><input type="radio" name={`${prefix}-${field}`} value={key} checked={value === key} onChange={() => change(key)} /><span>{text}</span></label>)}
    </div>{value !== undefined ? <button className={styles.clear} type="button" onClick={() => change(undefined)} aria-label={`Hreinsa svar: ${label}`}>Hreinsa svar</button> : null}
  </fieldset>;
}
function Text({ field, label, value, change, prefix, hint }: { field: string; label: string; value?: string; change: (value: string) => void; prefix: string; hint?: string }) {
  return <div data-question={field} className={styles.field} tabIndex={-1}><label htmlFor={`${prefix}-${field}`}>{label}</label><textarea id={`${prefix}-${field}`} rows={2} value={value ?? ""} onChange={e => change(e.target.value)} aria-describedby={hint ? `${prefix}-${field}-hint` : undefined} />{hint ? <p id={`${prefix}-${field}-hint`} className={styles.hint}>{hint}</p> : null}</div>;
}
function Retained({ children }: { children: ReactNode }) {
  return <details className={styles.retained}><summary>Varðveitt gögn um hita</summary><p>Núverandi svör gera þessi gögn óvirk. Þau eru ekki núverandi niðurstaða; þeim má breyta án þess að virkja þau.</p>{children}</details>;
}
export function HeatingObservationEditor({ item, observation, reportId, roomId, roomName, index, open, onToggle, onClose, nextAction }: {
  item: ChecklistItem; observation?: Observation; reportId: string; roomId: string; roomName: string; index: number; open: boolean; onToggle: () => void; onClose: () => void; nextAction: ReactNode;
}) {
  const { store, state } = useDemo(); const prefix = useId(); const heading = useRef<HTMLButtonElement>(null); const o = observation ?? EMPTY_OBSERVATION; const h = o.heating ?? {}; const status = heatingState(o);
  const update = (patch: (current: Observation) => Observation) => store.updateRoom(reportId, roomId, room => ({ ...room, observations: { ...room.observations, [item.id]: patch(room.observations[item.id] ?? EMPTY_OBSERVATION) } }));
  const set = <K extends keyof HeatingObservation>(key: K, value: HeatingObservation[K]) => update(current => {
    const heating = { ...current.heating, [key]: value }; if (value === undefined) delete heating[key];
    return { ...current, heating };
  });
  const shared = (key: "note" | "damageType" | "location" | "description", value: string) => update(current => ({ ...current, [key]: value }));
  const visibility = h.visibility === "visible_parts" || h.visibility === "reported_concealed";
  const equipment = <fieldset data-question="equipment" className={styles.choices} tabIndex={-1}><legend>Búnaður sem skráningin á við</legend><div className={styles.options}>{HEATING_KINDS.map(kind => <label className={styles.option} key={kind}><input type="checkbox" checked={h.equipment?.includes(kind) ?? false} onChange={e => set("equipment", e.target.checked ? [...h.equipment ?? [], kind] : h.equipment?.filter(k => k !== kind))} /><span>{t.equipment[kind]}</span></label>)}</div><p className={styles.hint}>Tilgreindu sýnilega hluta hér eða í afmörkun. Val á búnaði staðfestir ekki að hann hafi verið skoðaður.</p></fieldset>;
  const scope = <><Text prefix={prefix} field="scope" label={t.scope} value={h.scope} change={v => set("scope", v)} hint={t.scopeHelp} /><Text prefix={prefix} field="informationSource" label={t.source} value={h.informationSource} change={v => set("informationSource", v)} hint="Fyrir uppgefinn búnað sem sást ekki þarf bæði lýsingu og heimild. Við blandaða sýnileika skal greina slíkar upplýsingar frá því sem sást." /></>;
  const condition = <Choices prefix={prefix} field="visibleCondition" label="Sýnilegt ástand" options={t.condition} value={h.visibleCondition} change={v => set("visibleCondition", v)} />;
  const attempt = <><Text prefix={prefix} field="action" label="Hvað var reynt og á hvaða búnaði?" value={h.action} change={v => set("action", v)} hint="Lýstu venjulegri notkun og tilgreindu hvaða hlutar voru reyndir. Ekki þarf að taka búnað í sundur." /><Choices prefix={prefix} field="response" label="Hvert var viðbragðið?" options={t.response} value={h.response} change={v => set("response", v)} /><Text prefix={prefix} field="responseDescription" label="Lýstu því sem þú varðst var við" value={h.responseDescription} change={v => set("responseDescription", v)} hint="Greindu ólík viðbrögð og óvissu eftir hlutum. Ekkert viðbragð á athugunartímanum er ekki sjálfkrafa galli eða viðgerðarþörf." /></>;
  const defect = <><Text prefix={prefix} field="damageType" label="Tegund skemmdar / galla" value={o.damageType} change={v => shared("damageType", v)} /><Text prefix={prefix} field="location" label="Staðsetning fráviks" value={o.location} change={v => shared("location", v)} /><Text prefix={prefix} field="description" label="Lýsing á fráviki" value={o.description} change={v => shared("description", v)} /></>;
  return <section className={`checklist-item ${open ? "checklist-item-open" : ""} ${styles.editor}`} data-item={item.id} data-kind="space_heating" data-state={!heatingAnswered(o) ? "unanswered" : !status.complete ? "incomplete" : status.defect ? "deviation" : "recorded"} id={navigationTargetId("inspection", roomId, item.id)} tabIndex={-1} aria-labelledby={`${prefix}-title`}>
    <h3><button ref={heading} className="checklist-toggle" id={`${prefix}-title`} data-navigation-heading aria-expanded={open} aria-controls={`${prefix}-body`} onClick={onToggle}><span className="item-completion">{index + 1}</span><span><span className="item-title">Hiti</span><span className={styles.status}>{status.status}{status.defect ? " · Skráð frávik" : ""}{status.limitations.length ? " · Skráð takmörkun" : ""}</span></span><span aria-hidden="true">{open ? "−" : "+"}</span></button></h3>
    <div id={`${prefix}-body`} className={`observation-body ${styles.body}`} hidden={!open}>
      {open ? <><p className={styles.hint}>{t.limit}</p><fieldset className={styles.editable} disabled={state.status === "loading" || state.status === "read-error"}><legend className="sr-only">Hitaskráning</legend>
        <Choices prefix={prefix} field="visibility" label="Hvað sást?" options={t.visibility} value={h.visibility} change={v => set("visibility", v)} />
        {visibility ? <>{equipment}<details className={styles.scope} open={h.visibility === "reported_concealed" || undefined}><summary>Afmörkun og heimild</summary>{scope}</details></> : h.equipment?.length || h.scope || h.informationSource ? <Retained>{equipment}{scope}</Retained> : null}
        {h.visibility === "visible_parts" ? condition : h.visibleCondition ? <Retained>{condition}</Retained> : null}
        <Choices prefix={prefix} field="operation" label="Var venjuleg notkun reynd?" options={t.operation} value={h.operation} change={v => set("operation", v)} />
        {h.operation === "tried" ? attempt : h.action || h.response || h.responseDescription ? <Retained>{attempt}</Retained> : null}
        {status.defect ? <div className="damage-fields">{defect}</div> : o.damageType || o.location || o.description ? <Retained>{defect}</Retained> : null}
        <Text prefix={prefix} field="note" label="Athugasemd um hita" value={o.note} change={v => shared("note", v)} />
      </fieldset>{hasHeatingExtensions(h) ? <p className={styles.hint}>Önnur varðveitt gögn fylgja hitaskráningunni og haldast við breytingar.</p> : null}
      <PhotoPreview photoKey={`${reportId}:${roomId}:${item.id}`} context={`${roomName} · Hiti`} title="Myndir við atriði" item detail={status.defect} />
      <div className={styles.footer}>{nextAction}<button className="text-button" type="button" onClick={() => { heading.current?.focus({ preventScroll: true }); onClose(); }}>Loka atriði</button></div></> : null}
    </div>
  </section>;
}

export function HeatingFacts({ observation }: { observation?: Observation }) {
  const h = observation?.heating ?? {}; const s = heatingState(observation); const visible = h.visibility === "visible_parts"; const scoped = visible || h.visibility === "reported_concealed";
  const data = (label: string, value?: string) => value ? <div><dt>{label}</dt><dd>{value}</dd></div> : null;
  return <div className={styles.facts}>
    <p className={styles.primary}>{s.status}</p>
    <dl>{data("Sýnileiki", h.visibility ? t.visibility[h.visibility] : "Óskráð")}
      {scoped ? <>{data("Búnaður sem skráningin á við", h.equipment?.map(k => t.equipment[k]).join(", "))}{data("Afmörkun", h.scope)}{data("Heimild uppgefins búnaðar", h.informationSource)}</> : null}
      {visible ? data("Sýnilegt ástand tilgreindra hluta", h.visibleCondition ? t.condition[h.visibleCondition] : "Óskráð") : null}
      {data("Venjuleg notkun reynd", h.operation ? t.operation[h.operation] : "Óskráð")}
      {h.operation === "tried" ? <>{data("Hvað var reynt", h.action)}{data("Viðbragð", h.response ? t.response[h.response] : "Óskráð")}{data("Það sem varð vart", h.responseDescription)}</> : null}
      {s.defect ? <>{data("Skráð frávik", observation?.damageType)}{data("Staðsetning fráviks", observation?.location)}{data("Lýsing á fráviki", observation?.description)}</> : null}
      {data("Athugasemd um hita", observation?.note)}
    </dl>
    {s.missing.length ? <div data-heating-incomplete><strong>Ófullskráð svör</strong><ul>{s.missing.map(i => <li key={i.key}>{i.label}</li>)}</ul></div> : null}
    {s.limitations.length ? <div data-heating-limitations><strong>Skráðar takmarkanir</strong><ul>{s.limitations.map((v, i) => <li key={i}>{v}</li>)}</ul></div> : null}
    {s.defect ? <p data-heating-defect><strong>Skráð frávik á sýnilegum hluta</strong></p> : null}
    {(!scoped && (h.equipment?.length || h.scope || h.informationSource)) || (!visible && h.visibleCondition) || (h.operation !== "tried" && (h.action || h.response || h.responseDescription)) || (!s.defect && (observation?.damageType || observation?.location || observation?.description)) ? <Retained><dl>
      {!scoped ? <>{data("Búnaður", h.equipment?.map(k => t.equipment[k]).join(", "))}{data("Afmörkun", h.scope)}{data("Heimild", h.informationSource)}</> : null}
      {!visible ? data("Varðveitt ástandsmat", h.visibleCondition ? t.condition[h.visibleCondition] : undefined) : null}
      {h.operation !== "tried" ? <>{data("Varðveitt tilraun", h.action)}{data("Varðveitt viðbragð", h.response ? t.response[h.response] : undefined)}{data("Varðveitt lýsing", h.responseDescription)}</> : null}
      {!s.defect ? <>{data("Varðveitt tegund fráviks", observation?.damageType)}{data("Varðveitt staðsetning", observation?.location)}{data("Varðveitt frávikslýsing", observation?.description)}</> : null}
    </dl></Retained> : null}
    <p className={styles.hint}>{t.limit}</p>
  </div>;
}
