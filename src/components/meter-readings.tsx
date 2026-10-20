"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ApartmentDetails, MeterCapturePurpose, PropertyMeterReading, Report } from "@/lib/model";
import { is } from "@/lib/locale/is";
import { activeMeterPurpose, confirmMeterArrangement, confirmMeterPurpose, hasMeterExtensions, hasReadingFacts, meterContextCurrent, meterDateWarning, meterParticipates, meterSnapshot, meterState, meterUtilityStatus, METER_UTILITIES, needsPurposeCorrection, patchMeter, plausibleMeterValue, purposeAvailable, readingCapable, selectMeterPurpose, type MeterField, type MeterUtility } from "@/lib/meter-readings";
import { meterCorrectionHref, meterFieldId, METER_REVIEW_ID } from "@/lib/meter-navigation";
import { useReport } from "./report-context";
import { Field } from "./form-field";
import styles from "./meter-readings.module.css";

const t = is.meters;
const textKeys = ["readingValue", "unit", "readingDate", "meterIdentifier", "note"] as const;
type TextKey = typeof textKeys[number];
type PendingPurpose = { target: MeterCapturePurpose; selected: MeterUtility[]; snapshot: string };

function focusMeterField(utility: MeterUtility, field: MeterField) {
  requestAnimationFrame(() => {
    const element = document.getElementById(meterFieldId(utility, field));
    for (let parent = element?.parentElement; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
    const target = element?.matches("fieldset") ? element.querySelector<HTMLElement>('input:checked:not(:disabled)') ?? element.querySelector<HTMLElement>('input:not(:disabled)') ?? element : element;
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "center", behavior: "instant" });
  });
}

function Choices({ utility, field, label, choices, value, onChange, retained = false }: { utility: MeterUtility; field: "applicability" | "readingStatus"; label: string; choices: Record<string, string>; value?: string; onChange: (value: string | undefined) => void; retained?: boolean }) {
  const question = useRef<HTMLFieldSetElement>(null);
  const id = retained ? `${meterFieldId(utility, field)}-retained` : meterFieldId(utility, field);
  return <fieldset ref={question} className={styles.choices} id={id} tabIndex={-1} aria-describedby={!retained && field === "applicability" ? `${id}-hint` : undefined}>
    <legend>{label}</legend>
    <div className={styles.options}>{Object.entries(choices).map(([key, copy]) => <label className={styles.option} key={key}>
      <input type="radio" name={id} value={key} checked={value === key} onChange={() => onChange(key)} /><span>{copy}</span>
    </label>)}</div>
    {value !== undefined ? <button type="button" className={styles.textButton} onClick={() => {
      const fallback = question.current?.closest("[data-meter-utility]")?.querySelector<HTMLElement>(":scope > summary");
      onChange(undefined);
      requestAnimationFrame(() => {
        const target = question.current?.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)') ?? question.current ?? fallback;
        if (target?.isConnected) target.focus({ preventScroll: !!question.current });
      });
    }}>{t.clear}<span className="sr-only"> · {label}</span></button> : null}
  </fieldset>;
}

function TextInput({ utility, field, entry, onChange, retained = false }: { utility: MeterUtility; field: TextKey; entry?: PropertyMeterReading; onChange: (field: MeterField, value: string) => void; retained?: boolean }) {
  const id = `${meterFieldId(utility, field)}${retained ? "-retained" : ""}`;
  const value = entry?.[field] ?? "";
  const error = !retained && field === "readingValue" && value.trim() && !plausibleMeterValue(value) ? t.valueWarning : !retained && field === "readingDate" ? meterDateWarning(value) : undefined;
  const hint = field === "readingValue" ? t.valueHint : field === "unit" ? t.unitHint : field === "readingDate" ? t.dateHint : undefined;
  const props = { id, value, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field, e.target.value), "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined };
  return <div className={styles.field}><Field id={id} label={t.fields[field]} optional={retained || field === "note" || field === "meterIdentifier"} hint={hint} error={error}>
    {field === "note" ? <textarea {...props} rows={2} /> : <input {...props} type="text" inputMode={field === "readingValue" ? "decimal" : undefined} autoComplete="off" placeholder={field === "readingDate" ? "ÁÁÁÁ-MM-DD" : undefined} />}
  </Field></div>;
}

export function MeterFacts({ details: d, utility: k, retained = false }: { details: ApartmentDetails; utility: MeterUtility; retained?: boolean }) {
  const set = d.meterReadings;
  const entry = set?.[k];
  if (!entry) return <p className={styles.hint}>{t.unrecorded}</p>;
  const arrangement = retained ? entry.factsApplicability : entry.applicability;
  const showReading = retained || entry.readingStatus === "recorded" && meterContextCurrent(d, k) && readingCapable(entry.applicability);
  return <>
    {retained ? <p className={styles.hint}>{set?.factsPurpose ? t.titles[set.factsPurpose] : t.unconfirmed} · {arrangement ? t.applicability[arrangement] : t.unconfirmed}</p> : null}
    {arrangement === "shared" ? <p className={styles.qualification}>{t.shared}</p> : null}
    <dl className={styles.facts}>
      {entry.readingStatus && (retained || meterContextCurrent(d, k)) ? <div><dt>{t.statusQuestion}</dt><dd>{t.status[entry.readingStatus]}</dd></div> : null}
      {textKeys.filter(field => (showReading || field === "meterIdentifier" || field === "note") && entry[field] !== undefined && entry[field] !== "").map(field => <div key={field}><dt>{t.fields[field]}</dt><dd>{entry[field]}</dd></div>)}
    </dl>
  </>;
}

function PurposeActions({ details: d, choose }: { details: ApartmentDetails; choose: (target: MeterCapturePurpose, selected: MeterUtility[]) => void }) {
  return <div className={styles.purposeActions}>
    {purposeAvailable(d, "rental_initial") ? <div><p className={styles.hint}>{t.initialHelp}</p><button type="button" className="button button-secondary" onClick={() => choose("rental_initial", [])}>{t.startInitial}</button></div> : null}
    {purposeAvailable(d, "rental_return") ? <div><p className={styles.hint}>{t.returnHelp}</p><button type="button" className="button button-secondary" onClick={() => choose("rental_return", [])}>{t.startReturn}</button></div> : null}
    <div className={styles.buttons}>{METER_UTILITIES.map(k => <button key={k} type="button" className={styles.textButton} onClick={() => choose("optional", [k])}>{t.only[k]}</button>)}</div>
  </div>;
}

function RetainedEntry({ details: d, utility: k, edit }: { details: ApartmentDetails; utility: MeterUtility; edit: <K extends MeterField>(field: K, value: PropertyMeterReading[K]) => void }) {
  const entry = d.meterReadings?.[k];
  return <details className={styles.retained}><summary>{t.retained}</summary>
    <p className={styles.hint}>{t.retainedHint}</p><MeterFacts details={d} utility={k} retained />
    <details className={styles.subdetails}><summary>Skoða og breyta varðveittum svörum</summary>
      <Choices utility={k} field="readingStatus" label={`${t.statusQuestion} · varðveitt svar`} choices={t.status} value={entry?.readingStatus} retained onChange={value => edit("readingStatus", value as PropertyMeterReading["readingStatus"])} />
      {textKeys.map(field => <TextInput key={field} utility={k} field={field} entry={entry} retained onChange={(f, value) => edit(f, value)} />)}
    </details>
  </details>;
}

export function MeterReadingFields({ report, invalidCorrection = false }: { report: Report; invalidCorrection?: boolean }) {
  const { store, state } = useReport();
  const d = report.details;
  const set = d.meterReadings;
  const result = meterState(d);
  const [pending, setPending] = useState<PendingPurpose | null>(null);
  const [notice, setNotice] = useState("");
  const locked = state.status === "loading" || state.status === "read-error";
  const update = (fn: (details: ApartmentDetails) => ApartmentDetails) => store.updateMeters(report.id, fn);
  const choose = (target: MeterCapturePurpose, selected: MeterUtility[]) => {
    setNotice("");
    if (needsPurposeCorrection(d, target)) {
      setPending({ target, selected, snapshot: meterSnapshot(d) });
      requestAnimationFrame(() => document.getElementById("meter-purpose-preview")?.focus());
    }
    else {
      const accepted = update(latest => selectMeterPurpose(latest, target, selected));
      setPending(null);
      if (accepted) focusMeterField(selected[0] ?? "electricity", "applicability");
    }
  };
  const purposeIssue = result.issues.find(i => i.field === "purpose");
  const active = activeMeterPurpose(d);
  const titleMode = set?.mode ?? (d.inspectionContext === "residential_rental" && d.inspectionType === "initial" ? "rental_initial" : d.inspectionContext === "residential_rental" && d.inspectionType === "final" ? "rental_return" : "optional");
  const stale = !!pending && pending.snapshot !== meterSnapshot(d);
  return <details className={`panel ${styles.section} ${!set ? styles.empty : ""}`} id="meter-readings" tabIndex={-1}>
    <summary><span className={styles.title}>{set ? t.titles[titleMode] : "Mælastöður"}</span>{set ? <span className={styles.statuses}>
      {METER_UTILITIES.map(k => <span key={k}>{t.utilities[k]} · {meterUtilityStatus(d, k)}</span>)}
    </span> : null}</summary>
    <div className={styles.body}>
      <p className={styles.hint}>{t.intro}</p>
      {invalidCorrection ? <p role="status">{t.invalidTarget}</p> : null}
      <fieldset disabled={locked} className={styles.controls} aria-label="Mælaskráning">
        {!active ? <><p className={styles.hint}>{set ? t.retainedHint : t.absent}</p><PurposeActions details={d} choose={choose} /></> : null}
        {purposeIssue && active ? <div className={styles.warning}><p>{purposeIssue.label}</p><button id="meter-purpose-guard" type="button" className={styles.textButton} onClick={() => choose(active, [...result.participating])}>{t.correctPurpose}</button></div> : null}
        {pending ? <section className={styles.warning} aria-label={t.changePurpose}>
          <h3 id="meter-purpose-preview" tabIndex={-1}>{t.changePurpose}</h3><p>{t.previous}: {set?.factsPurpose ? t.titles[set.factsPurpose] : t.unconfirmed}</p><p>{t.proposed}: {t.titles[pending.target]}</p>
          <p>{t.purposeHelp}</p><p>{t.confirmSet}</p>
          {METER_UTILITIES.map(k => <div key={k}><h4>{t.utilities[k]}</h4><MeterFacts details={d} utility={k} retained /></div>)}
          {stale ? <><p role="status">{t.stale}</p><button type="button" className={styles.textButton} onClick={() => setPending({ ...pending, snapshot: meterSnapshot(d) })}>{t.refresh}</button></> : null}
          <div className={styles.buttons}><button type="button" className="button button-secondary" disabled={stale} onClick={() => {
            const accepted = update(latest => confirmMeterPurpose(latest, pending.target, pending.selected, pending.snapshot));
            if (accepted) { setPending(null); focusMeterField(pending.selected[0] ?? "electricity", "applicability"); } else setNotice(t.stale);
          }}>{t.correctPurpose}</button><button type="button" className={styles.textButton} onClick={() => { setPending(null); document.getElementById("meter-readings")?.focus(); }}>{t.cancel}</button></div>
          <Link className={styles.textButton} href="/skyrslur/ny">{t.newEvent}</Link>
        </section> : null}
        {notice ? <p role="status">{notice}</p> : null}
        {set?.mode === "optional" ? <div className={styles.participation}>{METER_UTILITIES.map(k => <label key={k} className={styles.option}>
          <input id={meterFieldId(k, "optionalCapture")} type="checkbox" checked={set[k]?.optionalCapture === true} onChange={e => update(latest => patchMeter(latest, k, "optionalCapture", e.target.checked))} /><span>{t.participate[k]}</span>
        </label>)}</div> : null}
        {METER_UTILITIES.map(k => {
          const entry = set?.[k];
          const participates = meterParticipates(d, k);
          const hasFacts = hasReadingFacts(entry);
          const blocked = readingCapable(entry?.applicability) && (hasFacts && !meterContextCurrent(d, k) || !!purposeIssue);
          const retained = !!entry && (!participates || blocked || !readingCapable(entry.applicability) || entry.readingStatus !== "recorded" && textKeys.slice(0, 3).some(f => !!entry[f]?.length));
          const edit = <K extends MeterField>(field: K, value: PropertyMeterReading[K]) => { update(latest => patchMeter(latest, k, field, value)); };
          const statusFields = <>
            <Choices utility={k} field="readingStatus" label={t.statusQuestion} choices={t.status} value={entry?.readingStatus} onChange={value => edit("readingStatus", value as PropertyMeterReading["readingStatus"])} />
            {entry?.readingStatus === "recorded" ? textKeys.slice(0, 3).map(field => <TextInput key={field} utility={k} field={field} entry={entry} onChange={(f, value) => edit(f, value)} />) : null}
          </>;
          return <details key={k} className={styles.utility} data-meter-utility={k} data-meter-participating={participates}>
            <summary><strong>{t.utilities[k]}</strong><span className={styles.statuses}>{meterUtilityStatus(d, k)}</span></summary>
            {participates ? <>
              <Choices utility={k} field="applicability" label={t.applicabilityQuestion} choices={t.applicability} value={entry?.applicability} onChange={value => edit("applicability", value as PropertyMeterReading["applicability"])} />
              <p className={styles.hint} id={`${meterFieldId(k, "applicability")}-hint`}>{t.arrangementHelp}</p>
              {blocked ? <div className={styles.warning}><p>{purposeIssue ? t.confirmPurposeIssue : t.arrangementChanged}</p>{!purposeIssue ? <button data-meter-confirm type="button" className={styles.textButton} onClick={() => {
                const expected = meterSnapshot(d);
                if (!update(latest => confirmMeterArrangement(latest, k, expected))) setNotice(t.stale);
                else focusMeterField(k, "readingStatus");
              }}>{t.confirmArrangement}</button> : null}</div> : null}
              {!blocked && entry?.applicability === "separate" ? statusFields : null}
              {!blocked && entry?.applicability === "shared" ? <><p className={styles.qualification}>{t.shared}</p><details className={styles.subdetails}><summary>{t.sharedDisclosure}</summary>{statusFields}</details></> : null}
              {!blocked ? <details className={styles.subdetails}><summary>{t.optionalDetails}</summary>{(["meterIdentifier", "note"] as const).map(field => <TextInput key={field} utility={k} field={field} entry={entry} onChange={(f, value) => edit(f, value)} />)}</details> : null}
            </> : null}
            {retained ? <RetainedEntry details={d} utility={k} edit={edit} /> : null}
          </details>;
        })}
        {hasMeterExtensions(set) ? <p className={styles.hint}>{t.extension}</p> : null}
        {set ? <details className={styles.subdetails}><summary>{t.changePurpose}</summary><PurposeActions details={d} choose={choose} />{set.mode !== "inactive" ? <button type="button" className={styles.textButton} onClick={() => { update(latest => ({ ...latest, meterReadings: { ...latest.meterReadings, mode: "inactive" } })); setPending(null); }}>{t.deactivate}</button> : null}</details> : null}
      </fieldset>
      <p className={styles.hint}>{active === "rental_initial" ? t.initialBoundary : t.boundary}</p>
    </div>
  </details>;
}

export function MeterReadingSummary({ report }: { report: Report }) {
  useEffect(() => {
    if (window.location.hash !== `#${METER_REVIEW_ID}`) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(METER_REVIEW_ID);
      target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const d = report.details;
  const set = d.meterReadings;
  const result = meterState(d);
  return <section className={`panel ${styles.review}`} id={METER_REVIEW_ID} tabIndex={-1} aria-labelledby="meter-review-title">
    <div className="panel-heading"><h2 id="meter-review-title">{set?.mode ? t.titles[set.mode] : "Mælastöður"}</h2><Link className={styles.textButton} href={meterCorrectionHref(report.id)}>{t.edit}</Link></div>
    {!set ? <p>{t.absent}</p> : <>
      {result.participating.length > 0 && !result.hasAttention ? <p>{t.answered}</p> : null}
      {METER_UTILITIES.map(k => {
        const entry = set[k];
        const current = meterParticipates(d, k) && readingCapable(entry?.applicability) && meterContextCurrent(d, k);
        return <div key={k} className={styles.reviewUtility}><h3>{t.utilities[k]}</h3><p className={styles.hint}>{meterUtilityStatus(d, k)}</p>
          {current ? <MeterFacts details={d} utility={k} /> : null}
          {entry && (!current || entry.readingStatus !== "recorded" && textKeys.slice(0, 3).some(f => !!entry[f]?.length)) ? <details className={styles.retained}><summary>{t.retained}</summary><MeterFacts details={d} utility={k} retained /></details> : null}
        </div>;
      })}
      {result.issues.length ? <div className={styles.warning}><h3>{t.issues}</h3><ul>{result.issues.map((issue, index) => <li key={index}><Link href={meterCorrectionHref(report.id, issue.utility ?? result.participating[0], issue.field === "purpose" ? "readingStatus" : issue.field)}>{issue.utility ? `${t.utilities[issue.utility]} · ` : ""}{issue.label}</Link></li>)}</ul></div> : null}
      {result.limitations.length ? <div className={styles.limitations}><h3>{t.limitations}</h3><ul>{result.limitations.map((l, index) => <li key={index}>{t.utilities[l.utility]} · {l.label}</li>)}</ul></div> : null}
      {hasMeterExtensions(set) ? <p className={styles.hint}>{t.extension}</p> : null}
    </>}
    <p className={styles.hint}>{activeMeterPurpose(d) === "rental_initial" ? t.initialBoundary : t.boundary}</p>
  </section>;
}
