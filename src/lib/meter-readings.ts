import type { ApartmentDetails, MeterApplicability, MeterCapturePurpose, PropertyMeterReading, PropertyMeterReadings } from "./model";
import { isCalendarDate } from "./model";
import { is } from "./locale/is";

export const METER_UTILITIES = ["electricity", "hotWater"] as const;
export type MeterUtility = typeof METER_UTILITIES[number];
export const METER_FIELDS = ["optionalCapture", "applicability", "readingStatus", "readingValue", "unit", "readingDate", "meterIdentifier", "note"] as const;
export type MeterField = typeof METER_FIELDS[number];
const purposes: MeterCapturePurpose[] = ["optional", "rental_initial", "rental_return"];
const arrangements: MeterApplicability[] = ["separate", "shared", "no_meter", "unknown", "not_examined"];
const statuses = ["recorded", "not_read", "unreadable", "inaccessible", "unknown"];
const textFields = ["readingValue", "unit", "readingDate", "meterIdentifier", "note"] as const;
const rawFields = ["readingValue", "unit", "readingDate"] as const;
const plausible = /^(?:[0-9]+(?:[.,][0-9]+)?|[0-9]{1,3}(?:[ \u00A0\u202F][0-9]{3})+(?:[.,][0-9]+)?|[0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?)$/u;
const t = is.meters;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const choice = (v: unknown, choices: readonly string[]) => v === undefined || typeof v === "string" && choices.includes(v);
const nonblank = (v?: string) => !!v?.trim();
export const readingCapable = (a?: MeterApplicability) => a === "separate" || a === "shared";
export const hasReadingFacts = (m?: PropertyMeterReading) => !!m && (m.readingStatus !== undefined || rawFields.some(k => !!m[k]?.length));
export const hasMeterFacts = (m?: PropertyMeterReadings) => METER_UTILITIES.some(k => hasReadingFacts(m?.[k]));
export const plausibleMeterValue = (v: string) => plausible.test(v.trim());

export function validMeterReadings(value: unknown): boolean {
  if (value === undefined) return true;
  if (!object(value) || !choice(value.mode, [...purposes, "inactive"]) || !choice(value.factsPurpose, purposes)) return false;
  return METER_UTILITIES.every(k => {
    const m = value[k];
    return m === undefined || object(m) && (m.optionalCapture === undefined || typeof m.optionalCapture === "boolean") && choice(m.applicability, arrangements) && choice(m.factsApplicability, arrangements) && choice(m.readingStatus, statuses) && textFields.every(f => m[f] === undefined || typeof m[f] === "string");
  });
}
export function hasMeterExtensions(m?: PropertyMeterReadings): boolean {
  if (!m) return false;
  return Object.keys(m).some(k => !["mode", "factsPurpose", ...METER_UTILITIES].includes(k)) || METER_UTILITIES.some(k => !!m[k] && Object.keys(m[k]!).some(f => ![...METER_FIELDS, "factsApplicability"].includes(f)));
}
export function purposeAvailable(d: ApartmentDetails, purpose: MeterCapturePurpose) {
  return purpose === "optional" || d.inspectionContext === "residential_rental" && d.inspectionType === (purpose === "rental_initial" ? "initial" : "final");
}
export function activeMeterPurpose(d: ApartmentDetails): MeterCapturePurpose | undefined {
  const mode = d.meterReadings?.mode;
  return mode && mode !== "inactive" && purposeAvailable(d, mode) ? mode : undefined;
}
export const meterParticipates = (d: ApartmentDetails, k: MeterUtility) => !!activeMeterPurpose(d) && (d.meterReadings?.mode !== "optional" || d.meterReadings[k]?.optionalCapture === true);
export function meterContextCurrent(d: ApartmentDetails, k: MeterUtility) {
  const m = d.meterReadings;
  return !!m && m.factsPurpose === activeMeterPurpose(d) && !!m[k]?.factsApplicability && m[k]!.factsApplicability === m[k]!.applicability;
}
export function meterDateWarning(raw = "", today = new Date().toISOString().slice(0, 10)): string | undefined {
  if (!raw.trim()) return undefined;
  if (!isCalendarDate(raw.trim())) return t.invalidDate;
  if (raw.trim() > today) return t.futureDate;
}
export interface MeterIssue { utility?: MeterUtility; field: MeterField | "purpose"; kind: "missing" | "review" | "confirmation"; label: string }
export function meterState(d: ApartmentDetails, today?: string) {
  const m = d.meterReadings;
  const participating = METER_UTILITIES.filter(k => meterParticipates(d, k));
  const issues: MeterIssue[] = [];
  const limitations: { utility: MeterUtility; label: string }[] = [];
  const needsPurpose = participating.some(k => readingCapable(m?.[k]?.applicability) && hasReadingFacts(m?.[k])) && m?.factsPurpose !== activeMeterPurpose(d);
  if (needsPurpose) issues.push({ field: "purpose", kind: "confirmation", label: t.confirmPurposeIssue });
  for (const k of participating) {
    const entry = m?.[k];
    const add = (field: MeterField, label: string, kind: MeterIssue["kind"] = "missing") => issues.push({ utility: k, field, kind, label });
    if (!entry?.applicability) { add("applicability", t.missing.applicability); continue; }
    if (entry.applicability === "no_meter") continue;
    if (!readingCapable(entry.applicability)) { limitations.push({ utility: k, label: t.applicability[entry.applicability] }); continue; }
    if (needsPurpose) continue;
    if (hasReadingFacts(entry) && !meterContextCurrent(d, k)) { add("readingStatus", t.confirmArrangementIssue, "confirmation"); continue; }
    if (!entry.readingStatus) {
      if (entry.applicability === "separate") add("readingStatus", t.missing.readingStatus);
      continue;
    }
    if (entry.readingStatus !== "recorded") { limitations.push({ utility: k, label: t.status[entry.readingStatus] }); continue; }
    if (!nonblank(entry.readingValue)) add("readingValue", t.missing.readingValue);
    else if (!plausibleMeterValue(entry.readingValue!)) add("readingValue", t.valueWarning, "review");
    if (!nonblank(entry.unit)) add("unit", t.missing.unit);
    if (!nonblank(entry.readingDate)) add("readingDate", t.missing.readingDate);
    else {
      const warning = meterDateWarning(entry.readingDate, today);
      if (warning) add("readingDate", warning, "review");
    }
  }
  return { participating, issues, limitations, hasAttention: issues.length > 0, actionCount: issues.length };
}
export function meterUtilityStatus(d: ApartmentDetails, k: MeterUtility) {
  if (!meterParticipates(d, k)) return d.meterReadings?.mode === "optional" ? t.unselected : d.meterReadings ? t.retained : t.absent;
  const state = meterState(d);
  const issue = state.issues.find(i => i.utility === k || i.field === "purpose");
  if (issue) return issue.label;
  const m = d.meterReadings?.[k];
  const limitation = state.limitations.find(i => i.utility === k);
  if (limitation) return limitation.label;
  if (m?.readingStatus === "recorded" && meterContextCurrent(d, k) && readingCapable(m.applicability)) return t.status.recorded;
  return m?.applicability ? t.applicability[m.applicability] : t.unrecorded;
}

// Snapshots are transient confirmation guards, never persisted or treated as history.
export const meterSnapshot = (d: ApartmentDetails) => JSON.stringify([d.meterReadings, d.inspectionContext, d.inspectionType]);
export function patchMeter<K extends MeterField>(d: ApartmentDetails, utility: MeterUtility, field: K, value: PropertyMeterReading[K]): ApartmentDetails {
  const before = d.meterReadings;
  const old = before?.[utility];
  if (old?.[field] === value) return d;
  const entry: PropertyMeterReading = { ...old, [field]: value };
  const next: PropertyMeterReadings = { ...before, [utility]: entry };
  const purpose = activeMeterPurpose(d);
  if (purpose && (field === "readingStatus" || rawFields.some(k => k === field)) && hasReadingFacts(entry)) {
    // Once all real facts are deliberately cleared, unused tags must not obstruct fresh input.
    if (!hasReadingFacts(old) && readingCapable(entry.applicability)) entry.factsApplicability = entry.applicability;
    if (!hasMeterFacts(before)) next.factsPurpose = purpose;
  }
  return { ...d, meterReadings: next };
}
export const needsPurposeCorrection = (d: ApartmentDetails, target: MeterCapturePurpose) => hasMeterFacts(d.meterReadings) && d.meterReadings?.factsPurpose !== target;
function applyPurpose(d: ApartmentDetails, target: MeterCapturePurpose, selected: readonly MeterUtility[], correction: boolean): ApartmentDetails {
  const before = d.meterReadings;
  const participationChanged = target === "optional" && METER_UTILITIES.some(k => (before?.[k]?.optionalCapture === true) !== selected.includes(k));
  if (before?.mode === target && !participationChanged && (!correction || before.factsPurpose === target)) return d;
  const next: PropertyMeterReadings = { ...d.meterReadings, mode: target };
  if (target === "optional") for (const k of METER_UTILITIES) {
    if (selected.includes(k)) next[k] = { ...next[k], optionalCapture: true };
    else if (next[k]?.optionalCapture === true) next[k] = { ...next[k], optionalCapture: false };
  }
  if (correction) next.factsPurpose = target;
  return { ...d, meterReadings: next };
}
export function selectMeterPurpose(d: ApartmentDetails, target: MeterCapturePurpose, selected: readonly MeterUtility[] = []): ApartmentDetails {
  if (!purposeAvailable(d, target) || needsPurposeCorrection(d, target)) return d;
  return applyPurpose(d, target, selected, false);
}
export function confirmMeterPurpose(d: ApartmentDetails, target: MeterCapturePurpose, selected: readonly MeterUtility[], expected: string): ApartmentDetails {
  if (meterSnapshot(d) !== expected || !purposeAvailable(d, target)) return d;
  if (!hasMeterFacts(d.meterReadings)) return applyPurpose(d, target, selected, false);
  if (!needsPurposeCorrection(d, target)) return d;
  return applyPurpose(d, target, selected, true);
}
export function confirmMeterArrangement(d: ApartmentDetails, k: MeterUtility, expected: string): ApartmentDetails {
  const entry = d.meterReadings?.[k];
  if (meterSnapshot(d) !== expected || !meterParticipates(d, k) || !entry || !readingCapable(entry.applicability) || !hasReadingFacts(entry) || entry.factsApplicability === entry.applicability) return d;
  return { ...d, meterReadings: { ...d.meterReadings, [k]: { ...entry, factsApplicability: entry.applicability } } };
}
