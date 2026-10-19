"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import type { FireScope, Report, VisibleEscapeRoutes } from "@/lib/model";
import { FIRE_GROUPS, fireExamined, fireGroupStatus, fireState, hasFireData, hasFireExtensions, meaningfulFireRow, type EquipmentEntry, type EquipmentGroupId, type FireIssue } from "@/lib/fire-observations";
import { fireCorrectionHref } from "@/lib/fire-navigation";
import { is } from "@/lib/locale/is";
import styles from "./fire-observations.module.css";

const t = is.fire;
const prose = (value?: string, fallback = t.unrecorded) => value?.trim() ? value : fallback;
function Entry({ label, children }: { label: string; children: ReactNode }) { return <div><dt>{label}</dt><dd>{children}</dd></div>; }
function Retained({ children }: { children: ReactNode }) { return <details className={styles.subdetails}><summary>{t.retained}</summary><p>{t.retainedHelp}</p>{children}</details>; }
function Row({ row, group }: { row: EquipmentEntry; group: EquipmentGroupId }) {
  const test = row.basicTest; const label = row.serviceLabel;
  return <div className={styles.row}>
    <dl>
      <Entry label={t.location}>{prose(row.location, "Staðsetning óskráð")}</Entry>
      <Entry label={t.count}>{prose(row.observedCount, "Fjöldi óskráður")}</Entry>
      <Entry label={t.visibleCondition}>{row.visibleCondition ? t.condition[row.visibleCondition] : t.unrecorded}</Entry>
      {row.visibleCondition === "visible_issue_observed" ? <Entry label={t.visibleIssue}>{prose(row.visibleIssueDescription)}</Entry> : null}
      {group === "smokeDetectors" ? <>
        <Entry label="Prófun">{test?.performance ? t.performance[test.performance] : "Prófun óskráð"}</Entry>
        {test?.performance === "performed" ? <>
          <Entry label="Prófaður búnaður">{prose(test.testedScopeDescription)}</Entry>
          <Entry label="Niðurstaða prófunar">{test.result ? t.result[test.result] : t.unrecorded}</Entry>
        </> : null}
      </> : <>
        <Entry label={t.serviceLabel}>{label?.status ? t.label[label.status] : t.unrecorded}</Entry>
        {label?.status === "readable" ? <Entry label={t.labelText}>{prose(label.observedText)}</Entry> : null}
      </>}
      {row.note ? <Entry label={t.note}>{row.note}</Entry> : null}
    </dl>
    {(row.visibleCondition !== "visible_issue_observed" && row.visibleIssueDescription) || (group === "smokeDetectors" && test?.performance !== "performed" && (test?.result || test?.testedScopeDescription)) || (group === "extinguishers" && label?.status !== "readable" && label?.observedText) ? <Retained><dl>
      {row.visibleCondition !== "visible_issue_observed" && row.visibleIssueDescription ? <Entry label={t.visibleIssue}>{row.visibleIssueDescription}</Entry> : null}
      {group === "smokeDetectors" && test?.performance !== "performed" ? <>
        {test?.testedScopeDescription ? <Entry label="Prófaður búnaður">{test.testedScopeDescription}</Entry> : null}
        {test?.result ? <Entry label="Varðveitt svar um prófun">{t.result[test.result]}</Entry> : null}
      </> : null}
      {group === "extinguishers" && label?.status !== "readable" && label?.observedText ? <Entry label={t.labelText}>{label.observedText}</Entry> : null}
    </dl></Retained> : null}
  </div>;
}
function Scope({ value, examined }: { value: FireScope; examined: boolean }) {
  return <>
    {examined ? <p><strong>Skoðað svæði: </strong>{prose(value.examinedDescription, "Skoðað svæði óskráð")}</p> : value.examinedDescription ? <Retained><p>{value.examinedDescription}</p></Retained> : null}
    {value.unexaminedDescription ? <p className="core-prose"><strong>Ekki skoðað: </strong>{value.unexaminedDescription}</p> : null}
    {value.note ? <p className="core-prose"><strong>{t.note}: </strong>{value.note}</p> : null}
  </>;
}
export function FireIssueList({ reportId, issues, links }: { reportId: string; issues: FireIssue[]; links?: boolean }) {
  return <ul>{issues.map((issue, index) => <li key={`${issue.group}-${issue.rowId}-${issue.field}-${index}`}>
    {links ? <Link className={styles.edit} href={fireCorrectionHref(reportId, issue.group, issue.field, issue.rowId)}>{t.groups[issue.group]} · {issue.label}</Link> : <>{t.groups[issue.group]} · {issue.label}</>}
  </li>)}</ul>;
}
export function FireObservationSummary({ report }: { report: Report }) {
  useEffect(() => {
    if (window.location.hash !== "#review-fire-safety") return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById("review-fire-safety") ?? document.getElementById("review-core-details");
      target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const d = report.details; const fire = d.fireSafety; const state = fireState(d);
  const rental = d.inspectionContext === "residential_rental";
  const show = rental || hasFireData(fire);
  return <section className={`panel ${styles.section} ${styles.summary}`} id="review-fire-safety" tabIndex={-1} aria-labelledby="review-fire-title">
    <div className="panel-heading"><h2 id="review-fire-title">{t.title}</h2><Link className={styles.edit} href={fireCorrectionHref(report.id)}>{t.edit}</Link></div>
    {!rental ? <p>{t.optional}</p> : null}
    <p className={state.concerns.length ? styles.concern : undefined} data-fire-overall-status>{show ? state.status : t.empty}</p>
    {show ? <>
      {FIRE_GROUPS.map(group => {
        const g = fire?.[group]; const examined = fireExamined(g);
        if (group === "escapeRoutes") {
          const route: VisibleEscapeRoutes | undefined = fire?.escapeRoutes;
          const details = <dl><Entry label="Sýnileg hindrun">{route?.obstruction ? t.obstruction[route.obstruction] : t.unrecorded}</Entry>
            {route?.obstruction === "observed" ? <><Entry label={t.affectedLocation}>{prose(route.affectedLocation)}</Entry><Entry label={t.obstructionDescription}>{prose(route.obstructionDescription)}</Entry></> : null}
          </dl>;
          return <div className={styles.group} key={group} data-fire-review-group={group}>
            <h3>{t.groups[group]}</h3><p data-fire-status={group}>{fireGroupStatus(fire, group)}</p>
            {route ? <Scope value={route} examined={examined} /> : null}
            {examined ? details : route?.obstruction ? <Retained>{details}</Retained> : null}
            {route?.obstruction !== "observed" && (route?.affectedLocation || route?.obstructionDescription) ? <Retained><dl><Entry label={t.affectedLocation}>{prose(route.affectedLocation)}</Entry><Entry label={t.obstructionDescription}>{prose(route.obstructionDescription)}</Entry></dl></Retained> : null}
          </div>;
        }
        const equipment = fire?.[group];
        const rows = equipment?.entries?.filter(row => meaningfulFireRow(row, group)) ?? [];
        const details = <>
          <p>{equipment?.presence ? (group === "smokeDetectors" ? t.smokePresence : t.extinguisherPresence)[equipment.presence] : "Búnaður sem sást: óskráð"}</p>
          {rows.map(row => <Row key={row.id} row={row} group={group} />)}
        </>;
        return <div className={styles.group} key={group} data-fire-review-group={group}>
          <h3>{t.groups[group]}</h3><p data-fire-status={group}>{fireGroupStatus(fire, group)}</p>
          {g ? <Scope value={g} examined={examined} /> : null}
          {examined ? <>
            <p>{equipment?.presence ? (group === "smokeDetectors" ? t.smokePresence : t.extinguisherPresence)[equipment.presence] : "Búnaður sem sást: óskráð"}</p>
            {equipment?.presence === "observed" ? rows.map(row => <Row key={row.id} row={row} group={group} />) : rows.length ? <Retained>{rows.map(row => <Row key={row.id} row={row} group={group} />)}</Retained> : null}
          </> : equipment?.presence || rows.length ? <Retained>{details}</Retained> : null}
        </div>;
      })}
      {(["concerns", "missing", "limitations"] as const).map(kind => state[kind].length ? <div className={styles.issues} key={kind} data-fire-issues={kind}>
        <h3>{t[kind]}</h3><FireIssueList reportId={report.id} issues={state[kind]} links={kind !== "limitations"} />
      </div> : null)}
      {hasFireExtensions(fire) ? <p className={styles.hint}>{t.extension}</p> : null}
    </> : null}
    <p className={styles.hint}>{t.limit}</p>
  </section>;
}
