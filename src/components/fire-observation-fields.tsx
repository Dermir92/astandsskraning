"use client";

import { useRef, useState, type ReactNode } from "react";
import type { ApartmentDetails, BasicDetectorTest, ExtinguisherServiceLabel, FireEquipmentGroup, FireScope, Report, VisibleEscapeRoutes } from "@/lib/model";
import { FIRE_GROUPS, FIRE_MAX_ENTRIES, fireExamined, fireGroupIssues, fireGroupStatus, fireState, hasFireExtensions, patchFireGroup, patchFireRow, validObservedCount, type EquipmentEntry, type EquipmentGroupId, type FireField, type FireGroupId } from "@/lib/fire-observations";
import { fireFieldId, type resolveFireCorrection } from "@/lib/fire-navigation";
import { is } from "@/lib/locale/is";
import { useDemo } from "./demo-provider";
import styles from "./fire-observations.module.css";

const t = is.fire;
type GroupValue = FireEquipmentGroup<EquipmentEntry> & VisibleEscapeRoutes;
type GroupChange = <K extends keyof GroupValue>(group: FireGroupId, key: K, value: GroupValue[K]) => void;
type RowChange = (group: EquipmentGroupId, id: string | undefined, patch: (row: EquipmentEntry) => EquipmentEntry) => void;
function setField<T extends object, K extends keyof T>(value: T, key: K, field: T[K]): T {
  const next = { ...value, [key]: field };
  if (field === undefined) delete next[key];
  return next;
}
function Choice<T extends string>({ id, label, options, value, onChange, hint }: { id: string; label: string; options: Record<T, string>; value?: T; onChange: (value: T | undefined) => void; hint?: string }) {
  return <fieldset className={styles.choices} id={id} tabIndex={-1} aria-describedby={hint ? `${id}-hint` : undefined}>
    <legend>{label}</legend>
    <div className={styles.options}>{(Object.entries(options) as [T, string][]).map(([key, text]) => <label className={styles.option} key={key}>
      <input type="radio" name={id} value={key} checked={value === key} onChange={() => onChange(key)} /><span>{text}</span>
    </label>)}</div>
    {hint ? <p className={styles.hint} id={`${id}-hint`}>{hint}</p> : null}
    {value !== undefined ? <button type="button" className={styles.clear} onClick={() => onChange(undefined)} aria-label={`${t.clear}: ${label}`}>{t.clear}</button> : null}
  </fieldset>;
}
function TextField({ id, label, value, onChange, hint, count, error }: { id: string; label: string; value?: string; onChange: (value: string) => void; hint?: string; count?: boolean; error?: string }) {
  const described = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    {count ? <input id={id} value={value ?? ""} inputMode="numeric" onChange={e => onChange(e.target.value)} aria-describedby={described} aria-invalid={error ? true : undefined} /> : <textarea id={id} rows={2} value={value ?? ""} onChange={e => onChange(e.target.value)} aria-describedby={described} />}
    {hint ? <span id={`${id}-hint`} className={styles.hint}>{hint}</span> : null}
    {error ? <span id={`${id}-error`} className={styles.warning}>{error}</span> : null}
  </div>;
}
function Retained({ children }: { children: ReactNode }) {
  return <details className={styles.subdetails}><summary>{t.retained}</summary><p className={styles.hint}>{t.retainedHelp}</p>{children}</details>;
}
function ScopeFields({ group, value, change }: { group: FireGroupId; value: FireScope; change: GroupChange }) {
  return <details className={styles.subdetails} open={value.examination === "partly_examined" || undefined}>
    <summary>{t.scopeDisclosure}</summary>
    <TextField id={fireFieldId(group, "examinedDescription")} label={group === "escapeRoutes" ? t.routesExamined : t.examined} value={value.examinedDescription} onChange={v => change(group, "examinedDescription", v)} hint={t.scopeHelp} />
    <TextField id={fireFieldId(group, "unexaminedDescription")} label={t.unexamined} value={value.unexaminedDescription} onChange={v => change(group, "unexaminedDescription", v)} />
    <TextField id={fireFieldId(group, "note")} label={t.note} value={value.note} onChange={v => change(group, "note", v)} />
  </details>;
}
function EquipmentRow({ group, row, index, change, forceField, rowRef }: { group: EquipmentGroupId; row: EquipmentEntry; index: number; change: RowChange; forceField?: FireField; rowRef?: (node: HTMLElement | null) => void }) {
  const id = row.id || undefined;
  const fieldId = (field: FireField) => fireFieldId(group, field, field === "note" && !id ? "placeholder" : id);
  const set = <K extends keyof EquipmentEntry>(key: K, value: EquipmentEntry[K]) => change(group, id, current => setField(current, key, value));
  const test = row.basicTest;
  const setTest = <K extends keyof BasicDetectorTest>(key: K, value: BasicDetectorTest[K]) => change(group, id, current => ({ ...current, basicTest: setField(current.basicTest ?? {}, key, value) }));
  const label = row.serviceLabel;
  const setLabel = <K extends keyof ExtinguisherServiceLabel>(key: K, value: ExtinguisherServiceLabel[K]) => change(group, id, current => ({ ...current, serviceLabel: setField(current.serviceLabel ?? {}, key, value) }));
  const testFields = <>
    <TextField id={fieldId("testedScopeDescription")} label={t.testScope} value={test?.testedScopeDescription} onChange={v => setTest("testedScopeDescription", v)} hint={t.testScopeHelp} />
    <Choice id={fieldId("testResult")} label={t.testResult} options={t.result} value={test?.result} onChange={v => setTest("result", v)} hint={t.testLimit} />
  </>;
  const labelText = <TextField id={fieldId("labelText")} label={t.labelText} value={label?.observedText} onChange={v => setLabel("observedText", v)} hint={t.labelHelp} />;
  const issueText = <TextField id={fieldId("visibleIssueDescription")} label={t.visibleIssue} value={row.visibleIssueDescription} onChange={v => set("visibleIssueDescription", v)} />;
  return <section className={styles.row} data-fire-row={row.id || "placeholder"}>
    <h4 tabIndex={-1} ref={rowRef}>{row.location?.trim() ? row.location : `${t.row}${index ? ` · ${index + 1}` : ""}`}</h4>
    <Choice id={fieldId("visibleCondition")} label={t.visibleCondition} options={t.condition} value={row.visibleCondition} onChange={v => set("visibleCondition", v)} />
    {row.visibleCondition === "visible_issue_observed" ? issueText : row.visibleIssueDescription || forceField === "visibleIssueDescription" ? <Retained>{issueText}</Retained> : null}
    {group === "smokeDetectors" ? <>
      <Choice id={fieldId("testPerformance")} label={t.testQuestion} options={t.performance} value={test?.performance} onChange={v => setTest("performance", v)} hint={t.testHelp} />
      {test?.performance === "performed" ? testFields : test?.result || test?.testedScopeDescription || forceField === "testResult" || forceField === "testedScopeDescription" ? <Retained>{testFields}</Retained> : null}
    </> : <>
      <Choice id={fieldId("labelStatus")} label={t.serviceLabel} options={t.label} value={label?.status} onChange={v => setLabel("status", v)} />
      {label?.status === "readable" ? labelText : label?.observedText || forceField === "labelText" ? <Retained>{labelText}</Retained> : null}
      <p className={styles.hint}>{t.serviceLimit}</p>
    </>}
    <details className={styles.subdetails}>
      <summary>{t.rowDetails}</summary>
      <TextField id={fieldId("location")} label={t.location} value={row.location} onChange={v => set("location", v)} hint={t.locationHelp} />
      <TextField id={fieldId("observedCount")} label={t.count} value={row.observedCount} onChange={v => set("observedCount", v)} count hint={t.countHelp} error={row.observedCount?.trim() && !validObservedCount(row.observedCount) ? t.countWarning : undefined} />
      <TextField id={fieldId("note")} label={t.note} value={row.note} onChange={v => set("note", v)} />
    </details>
    {hasFireExtensions(row, group === "smokeDetectors" ? "smokeRow" : "extinguisherRow") ? <p className={styles.hint}>{t.extension}</p> : null}
  </section>;
}

export function FireObservationFields({ report, correction }: { report: Report; correction: ReturnType<typeof resolveFireCorrection> }) {
  const { store, state } = useDemo();
  const [announcement, setAnnouncement] = useState("");
  const added = useRef<string | null>(null);
  const fire = report.details.fireSafety;
  const summary = fireState(report.details);
  const rental = report.details.inspectionContext === "residential_rental";
  const update = (patch: (d: ApartmentDetails) => ApartmentDetails) => store.updateReport(report.id, current => ({ ...current, details: patch(current.details) }));
  const changeGroup: GroupChange = (group, key, value) => update(d => patchFireGroup(d, group, current => setField(current as GroupValue, key, value)));
  const changeRow: RowChange = (group, id, patch) => update(d => patchFireRow(d, group, id, patch));
  const add = (group: EquipmentGroupId) => {
    const id = crypto.randomUUID();
    const accepted = update(d => patchFireGroup(d, group, g => (g.entries?.length ?? 0) >= FIRE_MAX_ENTRIES ? g : { ...g, entries: [...g.entries ?? [], { id }] }));
    if (accepted) { added.current = id; setAnnouncement(`Nýrri staðsetningu bætt við. Röð ${(report.details.fireSafety?.[group]?.entries?.length ?? 0) + 1}.`); }
  };
  return <details className={`panel ${styles.section}`} id="fire-safety" tabIndex={-1}>
    <summary><span className={styles.title}>{t.title}{!rental ? <span className={styles.optionalLabel}>{t.optionalLabel}</span> : null}</span><span className={styles.statuses}>
      {FIRE_GROUPS.map(group => <span key={group} data-fire-status={group} className={summary.concerns.some(i => i.group === group) ? styles.concern : undefined}>{t.groups[group]} · {fireGroupStatus(fire, group)}</span>)}
    </span></summary>
    <div className={styles.body}>
      <p>{t.intro}</p><p>{t.limit}</p><p className={styles.hint}>{t.draft}</p>
      {!rental ? <p className={styles.hint}>{t.optional}{!report.details.inspectionContext ? ` ${t.contextUnknown}` : ""}</p> : null}
      {correction.active && (!correction.valid || correction.stale) ? <p className={styles.warning} role="status">{correction.stale ? t.unknownTarget : t.invalidTarget}</p> : null}
      <fieldset className={styles.readonly} disabled={state.status === "read-error" || state.status === "loading"}><legend className="sr-only">{t.title}</legend>
        {FIRE_GROUPS.map(group => {
          const g: GroupValue = fire?.[group] ?? {};
          const examined = fireExamined(g);
          const groupIssues = fireGroupIssues(fire, group);
          const rows = g.entries ?? [];
          const equipmentGroup = group === "escapeRoutes" ? null : group;
          const renderRows = (key: EquipmentGroupId) => <>
            {(rows.length ? rows : [{ id: "" }]).map((row, index) => <EquipmentRow key={index === 0 ? "primary" : `row:${row.id}`} group={key} row={row} index={index} change={changeRow} forceField={correction.group === key && (!correction.rowId || correction.rowId === row.id) ? correction.field : undefined} rowRef={node => { if (node && added.current === row.id) { added.current = null; requestAnimationFrame(() => { node.focus(); node.scrollIntoView({ block: "center", behavior: "instant" }); }); } }} />)}
            {rows.length > 0 && rows.length < FIRE_MAX_ENTRIES ? <button type="button" className="button button-secondary" onClick={() => add(key)}>{t.add}</button> : null}
          </>;
          const presence = equipmentGroup ? <>
            <Choice id={fireFieldId(group, "presence")} label={group === "smokeDetectors" ? "Sáust reykskynjarar á skoðuðu svæði?" : "Sáust slökkvitæki á skoðuðu svæði?"} options={group === "smokeDetectors" ? t.smokePresence : t.extinguisherPresence} value={g.presence} onChange={v => changeGroup(group, "presence", v)} />
            {g.presence === "observed" ? renderRows(equipmentGroup) : rows.length ? <Retained>{renderRows(equipmentGroup)}</Retained> : null}
          </> : null;
          const routeFields = <>
            <Choice id={fireFieldId(group, "obstruction")} label={t.routeQuestion} options={t.obstruction} value={g.obstruction} onChange={v => changeGroup(group, "obstruction", v)} />
            {g.obstruction === "observed" ? <>
              <TextField id={fireFieldId(group, "affectedLocation")} label={t.affectedLocation} value={g.affectedLocation} onChange={v => changeGroup(group, "affectedLocation", v)} />
              <TextField id={fireFieldId(group, "obstructionDescription")} label={t.obstructionDescription} value={g.obstructionDescription} onChange={v => changeGroup(group, "obstructionDescription", v)} />
            </> : g.affectedLocation || g.obstructionDescription || ["affectedLocation", "obstructionDescription"].includes(correction.group === group ? correction.field ?? "" : "") ? <Retained>
              <TextField id={fireFieldId(group, "affectedLocation")} label={t.affectedLocation} value={g.affectedLocation} onChange={v => changeGroup(group, "affectedLocation", v)} />
              <TextField id={fireFieldId(group, "obstructionDescription")} label={t.obstructionDescription} value={g.obstructionDescription} onChange={v => changeGroup(group, "obstructionDescription", v)} />
            </Retained> : null}
          </>;
          return <details className={styles.group} key={group} data-fire-group={group}>
            <summary><span className={styles.groupTitle}>{t.groups[group]}</span><span className={`${styles.groupStatus} ${groupIssues.some(i => i.kind === "concern") ? styles.concern : ""}`}>{fireGroupStatus(fire, group)}</span></summary>
            {group === "extinguishers" ? <p className={styles.hint}>{t.extinguisherHelp}</p> : group === "escapeRoutes" ? <p className={styles.hint}>{t.routeHelp}</p> : null}
            <Choice id={fireFieldId(group, "examination")} label={t.questions[group]} options={t.examination} value={g.examination} onChange={v => changeGroup(group, "examination", v)} />
            {examined ? equipmentGroup ? presence : routeFields : g.presence || rows.length || g.obstruction || g.affectedLocation || g.obstructionDescription ? <Retained>{equipmentGroup ? presence : routeFields}</Retained> : null}
            <ScopeFields group={group} value={g} change={changeGroup} />
            {group === "escapeRoutes" ? <p className={styles.hint}>{t.routeLimit}</p> : null}
            {groupIssues.filter(i => i.kind === "concern").map((issue, index) => <p className={styles.warning} key={`${issue.rowId}-${issue.field}-${index}`}>{issue.label}. {issue.field === "testResult" ? "Láttu kanna búnaðinn." : "Þarf athygli."}</p>)}
          </details>;
        })}
      </fieldset>
      {hasFireExtensions(fire) ? <p className={styles.hint}>{t.extension}</p> : null}
      <p className="sr-only" role="status">{announcement}</p>
    </div>
  </details>;
}
