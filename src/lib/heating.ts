import type { ChecklistItem, HeatingObservation, Observation, Room } from "./model";
import { is } from "./locale/is";

export const HEATING_KINDS = ["radiators", "underfloor", "thermostat", "other"] as const;
export const HEATING_FIELDS = ["equipment", "visibility", "scope", "informationSource", "visibleCondition", "operation", "action", "response", "responseDescription"] as const;
export type HeatingField = typeof HEATING_FIELDS[number];
const t = is.heating;
const text = (value?: string) => !!value?.trim();
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const choice = (value: unknown, choices: object) => value === undefined || typeof value === "string" && Object.hasOwn(choices, value);

export function validHeating(value: unknown): boolean {
  if (value === undefined) return true;
  if (!object(value)) return false;
  return (value.equipment === undefined || Array.isArray(value.equipment) && value.equipment.length <= 4 && new Set(value.equipment).size === value.equipment.length && value.equipment.every(k => HEATING_KINDS.includes(k))) &&
    choice(value.visibility, t.visibility) && choice(value.visibleCondition, t.condition) && choice(value.operation, t.operation) && choice(value.response, t.response) &&
    ["scope", "informationSource", "action", "responseDescription"].every(k => value[k] === undefined || typeof value[k] === "string");
}
export function hasHeatingExtensions(value?: HeatingObservation) {
  return !!value && Object.keys(value).some(k => !(HEATING_FIELDS as readonly string[]).includes(k));
}
export function heatingAnswered(o?: Observation) {
  const h = o?.heating;
  return !!h && HEATING_FIELDS.some(k => Array.isArray(h[k]) ? h[k].length > 0 : typeof h[k] === "string" && !!h[k].trim()) ||
    !!o && [o.note, o.damageType, o.location, o.description].some(text);
}
export function heatingState(o?: Observation) {
  const h = o?.heating ?? {};
  const missing: { key: string; label: string }[] = [];
  const limitations: string[] = [];
  const need = (key: string, absent: boolean, label: string) => { if (absent) missing.push({ key, label }); };
  need("visibility", !h.visibility, "Svar um það sem sást vantar");
  if (h.visibility === "visible_parts") {
    need("equipment", !h.equipment?.length && !text(h.scope), "Tilgreina þarf sýnilegan búnað eða lýsa honum í afmörkun");
    need("visibleCondition", !h.visibleCondition, "Svar um sýnilegt ástand vantar");
    if (text(h.informationSource)) limitations.push(t.visibility.reported_concealed);
    if (h.visibleCondition === "unknown" || h.visibleCondition === "uninspected") limitations.push(t.condition[h.visibleCondition]);
  } else if (h.visibility) {
    limitations.push(t.visibility[h.visibility]);
    if (h.visibility === "reported_concealed") {
      need("scope", !text(h.scope), "Lýsingu á uppgefnum búnaði vantar");
      need("informationSource", !text(h.informationSource), "Heimild upplýsinga vantar");
    }
  }
  need("operation", !h.operation, "Svar um venjulega notkun vantar");
  if (h.operation === "tried") {
    need("action", !text(h.action), "Lýsingu á því sem var reynt vantar");
    need("response", !h.response, "Svar um viðbragð vantar");
    need("responseDescription", !text(h.responseDescription), "Lýsingu á því sem varð vart vantar");
    if (h.response === "unknown") limitations.push("Viðbragð óvíst eftir tilraun");
  } else if (h.operation) limitations.push(t.operation[h.operation]);
  const defect = h.visibility === "visible_parts" && (h.visibleCondition === "defect" || h.visibleCondition === "damaged");
  if (defect) {
    need("damageType", !text(o?.damageType), "Tegund fráviks vantar");
    need("location", !text(o?.location), "Staðsetningu vantar");
    need("description", !text(o?.description), "Lýsingu á fráviki vantar");
  }
  const factualResponse = h.operation === "tried" && (h.response === "none_observed" || h.response === "mixed") ? t.response[h.response] : undefined;
  const status = defect ? t.condition[h.visibleCondition as "defect" | "damaged"] : factualResponse ?? (missing.length ? heatingAnswered(o) ? "Ófullskráð" : "Óskráð" : limitations.length ? limitations.join(" · ") : "Skráð");
  return { missing, limitations, defect, status, complete: missing.length === 0 };
}
export function heatingItem(room: Room): ChecklistItem | null {
  if (room.items.some(i => i.kind === "space_heating") || room.items.length >= 100) return null;
  let id = "space-heating";
  while (room.items.some(i => i.id === id) || Object.hasOwn(room.observations, id)) id = `space-heating-${crypto.randomUUID()}`;
  return { id, name: "Hiti", kind: "space_heating" };
}
