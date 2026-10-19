import type { ApartmentDetails, BasicDetectorTest, ExtinguisherEntry, FireEquipmentGroup, FireScope, ResidentialFireObservations, SmokeDetectorEntry, VisibleEscapeRoutes } from "./model";
import { is } from "./locale/is";

export const FIRE_GROUPS = ["smokeDetectors", "extinguishers", "escapeRoutes"] as const;
export type FireGroupId = typeof FIRE_GROUPS[number];
export type EquipmentGroupId = Exclude<FireGroupId, "escapeRoutes">;
export type EquipmentEntry = SmokeDetectorEntry & ExtinguisherEntry;
export const FIRE_FIELDS = ["examination", "examinedDescription", "unexaminedDescription", "presence", "location", "observedCount", "visibleCondition", "visibleIssueDescription", "testPerformance", "testedScopeDescription", "testResult", "labelStatus", "labelText", "obstruction", "affectedLocation", "obstructionDescription", "note"] as const;
export type FireField = typeof FIRE_FIELDS[number];
export const FIRE_MAX_ENTRIES = 100;
const t = is.fire;
const text = (v?: string) => !!v?.trim();
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const strings = (v: Record<string, unknown>, keys: readonly string[]) => keys.every(k => v[k] === undefined || typeof v[k] === "string");
const choice = (v: unknown, choices: object) => v === undefined || (typeof v === "string" && Object.hasOwn(choices, v));
const scopeKeys = ["examination", "examinedDescription", "unexaminedDescription", "note"];
const rowKeys = ["id", "location", "observedCount", "visibleCondition", "visibleIssueDescription", "note"];
export function validFireSafety(value: unknown): boolean {
  if (value === undefined) return true;
  if (!object(value)) return false;
  return FIRE_GROUPS.every(key => {
    const group = value[key];
    if (group === undefined) return true;
    if (!object(group) || !strings(group, scopeKeys.slice(1)) || !choice(group.examination, t.examination)) return false;
    if (key === "escapeRoutes") return choice(group.obstruction, t.obstruction) && strings(group, ["affectedLocation", "obstructionDescription"]);
    if (!choice(group.presence, t.smokePresence)) return false;
    if (group.entries === undefined) return true;
    if (!Array.isArray(group.entries) || group.entries.length > FIRE_MAX_ENTRIES) return false;
    const ids = new Set<string>();
    return group.entries.every(row => {
      if (!object(row) || typeof row.id !== "string" || !row.id.trim() || ids.has(row.id) || !strings(row, ["location", "observedCount", "visibleIssueDescription", "note"]) || !choice(row.visibleCondition, t.condition)) return false;
      ids.add(row.id);
      const detail = key === "smokeDetectors" ? row.basicTest : row.serviceLabel;
      if (detail === undefined) return true;
      return object(detail) && (key === "smokeDetectors"
        ? choice(detail.performance, t.performance) && choice(detail.result, t.result) && strings(detail, ["testedScopeDescription"])
        : choice(detail.status, t.label) && strings(detail, ["observedText"]));
    });
  });
}

type ExtensionKind = "root" | FireGroupId | "smokeRow" | "extinguisherRow" | "test" | "label";
export function hasFireExtensions(value: unknown, kind: ExtensionKind = "root"): boolean {
  if (!object(value)) return false;
  const keys = kind === "root" ? FIRE_GROUPS : kind === "test" ? ["performance", "testedScopeDescription", "result"] : kind === "label" ? ["status", "observedText"] : kind === "smokeRow" ? [...rowKeys, "basicTest"] : kind === "extinguisherRow" ? [...rowKeys, "serviceLabel"] : kind === "escapeRoutes" ? [...scopeKeys, "obstruction", "affectedLocation", "obstructionDescription"] : [...scopeKeys, "presence", "entries"];
  if (Object.keys(value).some(k => !(keys as readonly string[]).includes(k))) return true;
  if (kind === "root") return FIRE_GROUPS.some(k => hasFireExtensions(value[k], k));
  if (kind === "smokeDetectors" || kind === "extinguishers") return Array.isArray(value.entries) && value.entries.some(row => hasFireExtensions(row, kind === "smokeDetectors" ? "smokeRow" : "extinguisherRow"));
  return kind === "smokeRow" ? hasFireExtensions(value.basicTest, "test") : kind === "extinguisherRow" ? hasFireExtensions(value.serviceLabel, "label") : false;
}
export function meaningfulFireRow(row: EquipmentEntry, group: EquipmentGroupId): boolean {
  return [row.location, row.observedCount, row.visibleIssueDescription, row.note].some(text) || !!row.visibleCondition || (group === "smokeDetectors"
    ? !!row.basicTest?.performance || !!row.basicTest?.result || text(row.basicTest?.testedScopeDescription)
    : !!row.serviceLabel?.status || text(row.serviceLabel?.observedText));
}
export function hasFireData(fire?: ResidentialFireObservations): boolean {
  if (!fire) return false;
  return hasFireExtensions(fire) || FIRE_GROUPS.some(k => {
    const g = fire[k];
    return !!g && (!!g.examination || [g.examinedDescription, g.unexaminedDescription, g.note].some(text) || (k === "escapeRoutes"
      ? !!fire.escapeRoutes?.obstruction || [fire.escapeRoutes?.affectedLocation, fire.escapeRoutes?.obstructionDescription].some(text)
      : !!fire[k]?.presence || fire[k]?.entries?.some(r => meaningfulFireRow(r, k))));
  });
}
export const fireExamined = (g?: FireScope) => g?.examination === "examined" || g?.examination === "partly_examined";
export const validObservedCount = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
export interface FireIssue { group: FireGroupId; rowId?: string; field: FireField; kind: "missing" | "limitation" | "concern"; label: string; priority: number; contextual?: boolean }
export function fireGroupIssues(fire: ResidentialFireObservations | undefined, group: FireGroupId): FireIssue[] {
  const g = fire?.[group]; const issues: FireIssue[] = [];
  const add = (kind: FireIssue["kind"], field: FireField, label: string, priority = 10, rowId?: string, contextual = false) => issues.push({ group, rowId, field, kind, label, priority, contextual });
  const missing = (field: FireField, label: string, absent: boolean, rowId?: string) => { if (absent) add("missing", field, label, 10, rowId); };
  if (!g?.examination) { add("missing", "examination", "Svar um skoðun vantar"); return issues; }
  if (!fireExamined(g)) { add("limitation", "examination", t.examination[g.examination], g.examination === "not_examined" ? 0 : 1); return issues; }
  if (g.examination === "partly_examined") {
    add("limitation", "unexaminedDescription", "Skoðað að hluta", 2);
    missing("unexaminedDescription", "Lýsingu á því sem var ekki skoðað vantar", !text(g.unexaminedDescription));
  }
  if (group === "escapeRoutes") {
    const route = g as VisibleEscapeRoutes;
    missing("examinedDescription", "Lýsingu á skoðaðri leið vantar", !text(route.examinedDescription));
    missing("obstruction", "Svar um sýnilega hindrun vantar", !route.obstruction);
    if (route.obstruction === "observed") {
      add("concern", "obstruction", "Sýnileg hindrun skráð á flóttaleið", 1);
      missing("affectedLocation", "Staðsetningu hindrunar vantar", !text(route.affectedLocation));
      missing("obstructionDescription", "Lýsingu á hindrun vantar", !text(route.obstructionDescription));
    } else if (route.obstruction === "unknown") add("limitation", "obstruction", "Óvíst hvort hindrun sást", 4);
    return issues;
  }
  const equipment = g as FireEquipmentGroup<EquipmentEntry>;
  if (!text(g.examinedDescription)) add("limitation", "examinedDescription", "Skoðað svæði óskráð", 20, undefined, true);
  missing("presence", "Svar um búnað sem sást vantar", !equipment.presence);
  if (equipment.presence === "none_observed") add("concern", "presence", group === "smokeDetectors" ? "Enginn reykskynjari sást á skoðuðu svæði" : "Ekkert slökkvitæki sást á skoðuðu svæði", 2);
  if (equipment.presence === "unknown") add("limitation", "presence", "Óvíst hvort búnaður sást", 3);
  if (equipment.presence !== "observed") return issues;
  const rows = equipment.entries?.filter(r => meaningfulFireRow(r, group)) ?? [];
  if (!rows.length) { add("missing", "visibleCondition", "Upplýsingar um búnað sem sást vantar"); return issues; }
  for (const row of rows) {
    if (!text(row.location)) add("limitation", "location", "Staðsetning óskráð", 20, row.id, true);
    if (!text(row.observedCount)) add("limitation", "observedCount", "Fjöldi óskráður", 20, row.id, true);
    else if (!validObservedCount(row.observedCount!)) add("concern", "observedCount", "Fjöldi þarfnast yfirferðar", 5, row.id);
    missing("visibleCondition", "Svar um sýnilegt ástand vantar", !row.visibleCondition, row.id);
    if (row.visibleCondition === "visible_issue_observed") {
      add("concern", "visibleCondition", "Sýnilegur annmarki skráður", 3, row.id);
      missing("visibleIssueDescription", "Lýsingu á sýnilegum annmarka vantar", !text(row.visibleIssueDescription), row.id);
    } else if (row.visibleCondition === "unknown" || row.visibleCondition === "not_examined") add("limitation", "visibleCondition", `Sýnilegt ástand: ${t.condition[row.visibleCondition]}`, 6, row.id);
    if (group === "smokeDetectors") {
      const test: BasicDetectorTest | undefined = row.basicTest;
      missing("testPerformance", "Svar um prófun vantar", !test?.performance, row.id);
      if (test?.performance === "performed") {
        missing("testResult", "Niðurstöðu prófunar vantar", !test.result, row.id);
        missing("testedScopeDescription", "Lýsingu á því hvaða skynjari var prófaður vantar", !text(test.testedScopeDescription), row.id);
        if (test.result === "no_response_observed") add("concern", "testResult", "Ekkert viðbragð skráð við prófun", 0, row.id);
        if (test.result === "unknown") add("limitation", "testResult", "Prófun gerð · niðurstaða óviss", 4, row.id);
      } else if (test?.performance) add("limitation", "testPerformance", test.performance === "not_performed" ? "Sást · ekki prófað" : "Óvíst hvort prófað var", 3, row.id);
    } else {
      const label = row.serviceLabel;
      missing("labelStatus", "Svar um þjónustumiða vantar", !label?.status, row.id);
      if (label?.status === "readable") missing("labelText", "Texta af læsilegum miða vantar", !text(label.observedText), row.id);
      else if (label?.status) {
        add("limitation", "labelStatus", t.label[label.status], 5, row.id);
        if (label.status === "none_observed" || label.status === "unreadable") add("concern", "labelStatus", t.label[label.status], 4, row.id);
      }
    }
  }
  return issues;
}
// Lowest number first; ties retain group/row/field insertion order (never row outcome).
export function primaryFireIssue(issues: FireIssue[], kind: FireIssue["kind"]) {
  return issues.filter(i => i.kind === kind).reduce<FireIssue | undefined>((first, i) => !first || i.priority < first.priority ? i : first, undefined);
}
export function fireGroupStatus(fire: ResidentialFireObservations | undefined, group: FireGroupId): string {
  const issues = fireGroupIssues(fire, group);
  return primaryFireIssue(issues, "concern")?.label ?? (issues.some(i => i.kind === "missing") ? fire?.[group]?.examination ? t.incomplete : t.unrecorded : undefined)
    ?? primaryFireIssue(issues.filter(i => !i.contextual), "limitation")?.label ?? t.answered;
}
export function fireState(d: ApartmentDetails) {
  const issues = FIRE_GROUPS.flatMap(g => fireGroupIssues(d.fireSafety, g));
  const missing = issues.filter(i => i.kind === "missing");
  const limitations = issues.filter(i => i.kind === "limitation");
  const concerns = issues.filter(i => i.kind === "concern");
  const rental = d.inspectionContext === "residential_rental";
  const actionCount = concerns.length + (rental ? missing.length : 0);
  const status = primaryFireIssue(issues, "concern")?.label
    ?? (missing.length ? t.incomplete : FIRE_GROUPS.every(k => d.fireSafety?.[k]?.examination === "not_examined") ? t.allUnexamined : t.answered);
  return { issues, missing, limitations, concerns, actionCount, status,
    hasAttention: concerns.length > 0 || (rental && (missing.length > 0 || limitations.some(i => !i.contextual))) };
}

export function patchFireGroup<G extends FireGroupId>(d: ApartmentDetails, group: G, patch: (value: NonNullable<ResidentialFireObservations[G]>) => NonNullable<ResidentialFireObservations[G]>): ApartmentDetails {
  return { ...d, fireSafety: { ...d.fireSafety, [group]: patch(d.fireSafety?.[group] ?? {}) } };
}
export function patchFireRow(d: ApartmentDetails, group: EquipmentGroupId, rowId: string | undefined, patch: (row: EquipmentEntry) => EquipmentEntry): ApartmentDetails {
  return patchFireGroup(d, group, g => {
    const rows = g.entries ?? [];
    if (rowId) return { ...g, entries: rows.map(row => row.id === rowId ? patch(row) : row) };
    if (rows.length >= FIRE_MAX_ENTRIES) return g;
    return { ...g, entries: [...rows, patch({ id: crypto.randomUUID() })] };
  });
}
