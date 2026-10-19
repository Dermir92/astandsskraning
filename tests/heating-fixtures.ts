import type { HeatingObservation, Observation, Report } from "../src/lib/model";
import { EMPTY_OBSERVATION } from "../src/lib/model";
import { legacyCoreReport } from "./inspection-core-fixtures";
export const triedHeating = (response: HeatingObservation["response"] = "none_observed"): HeatingObservation => ({ visibility: "visible_parts", equipment: ["radiators", "thermostat"], visibleCondition: "good", operation: "tried", action: "Sneri sýnihitastilli á ofni í stofu", response, responseDescription: "Engin breyting fannst á meðan stutt athugun stóð." });
export function heatingReport(heating?: HeatingObservation): Report {
  const report = legacyCoreReport();
  return { ...report, id: "heating-case", rooms: [{ ...report.rooms[0], items: [...report.rooms[0].items, { id: "space-heating", name: "Hiti", kind: "space_heating" }], observations: { ...report.rooms[0].observations, ...(heating ? { "space-heating": { ...EMPTY_OBSERVATION, heating } } : {}) } }] };
}
export const heatingObservation = (heating: HeatingObservation): Observation => ({ ...EMPTY_OBSERVATION, heating });
