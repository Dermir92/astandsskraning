import type { Report } from "./model";
import { FIRE_FIELDS, FIRE_GROUPS, fireGroupIssues, type FireField, type FireGroupId } from "./fire-observations";

const tokens: Record<FireGroupId, string> = { smokeDetectors: "reykskynjarar", extinguishers: "slokkvitæki", escapeRoutes: "flottaleidir" };
const common: readonly FireField[] = ["examination", "examinedDescription", "unexaminedDescription", "note"];
export const FIRE_ROW_FIELDS: readonly FireField[] = ["location", "observedCount", "visibleCondition", "visibleIssueDescription", "testPerformance", "testedScopeDescription", "testResult", "labelStatus", "labelText"];
export const fireFieldId = (group: FireGroupId, field: FireField, rowId?: string) => `fire-${group}-${rowId === undefined ? "group" : `row-${encodeURIComponent(rowId)}`}-${field}`;
export function fireCorrectionHref(id: string, group: FireGroupId = "smokeDetectors", field: FireField = "examination", rowId?: string) {
  const params = new URLSearchParams({ hluti: "brunavarnir", flokkur: tokens[group], reitur: field, fra: "yfirferd" });
  if (rowId) params.set("rad", rowId);
  return `/skyrslur/${encodeURIComponent(id)}/skraning?${params}`;
}
export function resolveFireCorrection(report: Report, params: URLSearchParams) {
  const active = ["hluti", "flokkur", "rad", "reitur"].some(k => params.has(k));
  const reviewHref = `/skyrslur/${encodeURIComponent(report.id)}/yfirferd#review-fire-safety`;
  const fallback = { active, valid: false, stale: false, group: undefined as FireGroupId | undefined, field: undefined as FireField | undefined, rowId: undefined as string | undefined, focusId: "fire-safety", reviewHref, fromReview: params.getAll("fra").length === 1 && params.get("fra") === "yfirferd" };
  if (!active) return fallback;
  const allowed = ["hluti", "flokkur", "rad", "reitur", "fra"];
  if ([...params.keys()].some(k => !allowed.includes(k)) || allowed.some(k => params.getAll(k).length > 1) || params.get("hluti") !== "brunavarnir" || !fallback.fromReview) return fallback;
  const group = FIRE_GROUPS.find(g => tokens[g] === params.get("flokkur"));
  const field = FIRE_FIELDS.find(f => f === params.get("reitur"));
  if (!group || !field) return fallback;
  const rowField = FIRE_ROW_FIELDS.includes(field);
  const testField = ["testPerformance", "testedScopeDescription", "testResult"].includes(field);
  const labelField = ["labelStatus", "labelText"].includes(field);
  if (group === "escapeRoutes" ? ![...common, "obstruction", "affectedLocation", "obstructionDescription"].includes(field) : ![...common, "presence", ...FIRE_ROW_FIELDS].includes(field) || (testField && group !== "smokeDetectors") || (labelField && group !== "extinguishers")) return fallback;
  const requested = params.get("rad");
  if (params.has("rad") && (!requested || group === "escapeRoutes" || (!rowField && field !== "note"))) return fallback;
  const rows = group !== "escapeRoutes" ? report.details.fireSafety?.[group]?.entries ?? [] : [];
  const stale = !!requested && rows.filter(r => r.id === requested).length !== 1;
  const firstMissing = stale ? fireGroupIssues(report.details.fireSafety, group).find(i => i.kind === "missing") : undefined;
  const destinationField = stale ? firstMissing?.field ?? "examination" : field;
  const rowId = stale ? firstMissing?.rowId : requested ?? (rowField ? rows[0]?.id : undefined);
  return { ...fallback, valid: true, stale, group, field: destinationField, rowId, focusId: fireFieldId(group, destinationField, rowId) };
}
