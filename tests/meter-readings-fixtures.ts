import type { MeterCapturePurpose, PropertyMeterReading, PropertyMeterReadings, Report } from "../src/lib/model";
import { legacyCoreReport } from "./inspection-core-fixtures";

export const recordedMeter = (overrides: Partial<PropertyMeterReading> = {}): PropertyMeterReading => ({ optionalCapture: true, applicability: "separate", factsApplicability: "separate", readingStatus: "recorded", readingValue: "00123,40", unit: " kWh ", readingDate: " 2026-10-19 ", meterIdentifier: "00042", note: "Sýnigögn\nÖnnur lína", ...overrides });
export function meterSet(mode: MeterCapturePurpose = "optional"): PropertyMeterReadings {
  return { mode, factsPurpose: mode, electricity: recordedMeter() };
}
export function meterReport(meters?: PropertyMeterReadings): Report {
  const report = legacyCoreReport();
  return { ...report, id: "meter-case", details: { ...report.details, inspectionContext: "standalone", inspectionDate: "2026-10-19", recorderName: "Sýniskráning", scopeDescription: "Sýnilegir hlutar íbúðar", ...(meters === undefined ? {} : { meterReadings: meters }) } };
}
export function extendedMeterReport(): Report {
  const report = meterReport({ ...meterSet(), rootExtension: { keep: [0, false, { raw: "001,20" }] }, hotWater: { optionalCapture: false, applicability: "shared", factsApplicability: "shared", readingStatus: "recorded", readingValue: " 000,50 ", unit: "m³", readingDate: "2026-10-18", future: { keep: [false, 0] } } } as PropertyMeterReadings);
  Object.assign(report.details.meterReadings!.electricity!, { future: { keep: [0, false, { text: "óbreytt" }] } });
  Object.assign(report.details, { detailsExtension: { preserve: true } });
  return report;
}
