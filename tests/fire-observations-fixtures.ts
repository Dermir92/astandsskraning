import type { Report, ResidentialFireObservations, SmokeDetectorEntry } from "../src/lib/model";
import { extendedRentalDocument, rentalInformation, rentalReport } from "./rental-information-fixtures";

export const detector = (id: string, result: "response_observed" | "no_response_observed" = "response_observed"): SmokeDetectorEntry => ({
  id, location: `Sýnisvæði ${id}`, observedCount: "1", visibleCondition: "no_visible_issue_observed",
  basicTest: { performance: "performed", testedScopeDescription: `Prófunarhnappur á sýniskynjara ${id}`, result },
});
export function mixedFire(): ResidentialFireObservations {
  return {
    smokeDetectors: { examination: "examined", examinedDescription: "Forstofa og stofa · sýnigögn", presence: "observed", entries: [
      { ...detector("untested"), location: "Stofa", basicTest: { performance: "not_performed" } },
      { ...detector("failed", "no_response_observed"), location: "Forstofa" },
    ] },
    extinguishers: { examination: "examined", examinedDescription: "Forstofa", presence: "observed", entries: [
      { id: "ext-1", location: "Við útihurð", observedCount: "1", visibleCondition: "no_visible_issue_observed", serviceLabel: { status: "readable", observedText: "Sýnigögn · 09/2025; næst 09/2026" } },
    ] },
    escapeRoutes: { examination: "partly_examined", examinedDescription: "Gangur að útihurð", unexaminedDescription: "Kjallari óaðgengilegur", obstruction: "observed", affectedLocation: "Við útihurð", obstructionDescription: "Sýnikassar á gönguleið" },
  };
}
export function fireReport(fireSafety?: ResidentialFireObservations): Report {
  const report = rentalReport(rentalInformation);
  return { ...report, id: "fire-case", details: { ...report.details, ...(fireSafety === undefined ? {} : { fireSafety: structuredClone(fireSafety) }) } };
}
export function extendedFireDocument() {
  const document = extendedRentalDocument();
  const original = document.reports[0];
  return { ...document, reports: [{ ...original, id: "fire-case", details: { ...original.details, fireSafety: {
    ...mixedFire(), rootExtra: [0, false, "keep"],
    smokeDetectors: { ...mixedFire().smokeDetectors, groupExtra: { keep: true }, entries: [
      { ...detector("failed", "no_response_observed"), rowExtra: ["keep"], basicTest: { ...detector("failed").basicTest, result: "no_response_observed" as const, testExtra: { keep: true } } },
    ] },
    extinguishers: { ...mixedFire().extinguishers, entries: [{ ...mixedFire().extinguishers!.entries![0], serviceLabel: { status: "readable" as const, observedText: "Sýnimiði 2025", labelExtra: false } }] },
    escapeRoutes: { ...mixedFire().escapeRoutes, routeExtra: 7 },
  } } }, document.reports[1]] };
}
