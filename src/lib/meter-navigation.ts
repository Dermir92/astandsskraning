import { METER_FIELDS, type MeterField, type MeterUtility } from "./meter-readings";
export const meterFieldId = (utility: MeterUtility, field: MeterField) => `meter-${utility}-${field}`;
export const METER_REVIEW_ID = "review-meter-readings";
const tokens = { electricity: "rafmagn", hotWater: "heitt-vatn" };
export function meterCorrectionHref(id: string, utility: MeterUtility = "electricity", field: MeterField = "applicability") {
  return `/skyrslur/${encodeURIComponent(id)}/skraning?${new URLSearchParams({ maelar: tokens[utility], maelaReitur: field, fra: "yfirferd" })}`;
}
export function resolveMeterCorrection(id: string, params: URLSearchParams) {
  const fire = ["hluti", "flokkur", "rad", "reitur"].some(k => params.has(k));
  const active = !fire && ["maelar", "maelaReitur"].some(k => params.has(k));
  const base = { active, valid: false, utility: undefined as MeterUtility | undefined, field: undefined as MeterField | undefined, focusId: "meter-readings", reviewHref: `/skyrslur/${encodeURIComponent(id)}/yfirferd#${METER_REVIEW_ID}` };
  if (!active || ["maelar", "maelaReitur", "fra"].some(k => params.getAll(k).length !== 1) || [...params.keys()].some(k => !["maelar", "maelaReitur", "fra"].includes(k)) || params.get("fra") !== "yfirferd") return base;
  const utility = (Object.keys(tokens) as MeterUtility[]).find(k => tokens[k] === params.get("maelar"));
  const field = METER_FIELDS.find(f => f === params.get("maelaReitur"));
  if (!utility || !field) return base;
  return { ...base, valid: true, utility, field, focusId: meterFieldId(utility, field) };
}
