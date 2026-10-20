import { expect, test } from "@playwright/test";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { isReportList, reportStats, reportStatus, type ApartmentDetails, type MeterApplicability, type MeterCapturePurpose, type MeterReadingStatus, type PropertyMeterReadings } from "../src/lib/model";
import { confirmMeterArrangement, confirmMeterPurpose, hasMeterExtensions, hasMeterFacts, meterContextCurrent, meterDateWarning, meterSnapshot, meterState, needsPurposeCorrection, patchMeter, plausibleMeterValue, selectMeterPurpose } from "../src/lib/meter-readings";
import { METER_FIELDS } from "../src/lib/meter-readings";
import { meterCorrectionHref, resolveMeterCorrection } from "../src/lib/meter-navigation";
import { resolveFireCorrection } from "../src/lib/fire-navigation";
import { legacyCoreReport } from "./inspection-core-fixtures";
import { extendedMeterReport, meterReport, meterSet, recordedMeter } from "./meter-readings-fixtures";

const purposes: MeterCapturePurpose[] = ["optional", "rental_initial", "rental_return"];
function compatible(d: ApartmentDetails, target: MeterCapturePurpose): ApartmentDetails { return { ...d, inspectionContext: "residential_rental", inspectionType: target === "rental_return" ? "final" : "initial" }; }

test("absent modules never gain tasks, records, dates or changed room statistics", () => {
  for (const inspectionContext of [undefined, "", "standalone", "residential_rental"] as const) for (const inspectionType of ["", "initial", "final", "independent"] as const) {
    const r = meterReport(); Object.assign(r.details, { inspectionContext, inspectionType });
    const raw = JSON.stringify(r), stats = reportStats(r), status = reportStatus(r);
    expect(meterState(r.details)).toMatchObject({ issues: [], limitations: [], actionCount: 0, hasAttention: false });
    expect(JSON.stringify(r)).toBe(raw); expect(reportStats(r)).toEqual(stats); expect(reportStatus(r)).toBe(status);
  }
});
test("optional participation is independent and old true flags cannot silently reactivate an unselected utility", () => {
  for (const utility of ["electricity", "hotWater"] as const) {
    let d = selectMeterPurpose(meterReport().details, "optional", [utility]);
    expect(meterState(d).issues).toEqual([expect.objectContaining({ utility, field: "applicability" })]);
    expect(d.meterReadings).not.toHaveProperty(utility === "electricity" ? "hotWater" : "electricity");
    d = patchMeter(d, utility, "optionalCapture", false); expect(meterState(d).actionCount).toBe(0);
  }
  const d = selectMeterPurpose({ ...meterReport().details, meterReadings: { mode: "inactive", electricity: { optionalCapture: true }, hotWater: { optionalCapture: true, note: "varðveita" } } }, "optional", ["electricity"]);
  expect(d.meterReadings!.hotWater).toEqual({ optionalCapture: false, note: "varðveita" });
});
test("identical purpose and participation preserve identity, including absent and false optional flags", () => {
  for (const hotWater of [undefined, { optionalCapture: false, note: "varðveita" }]) {
    const d = meterReport({ ...meterSet(), ...(hotWater ? { hotWater } : {}) }).details;
    expect(selectMeterPurpose(d, "optional", ["electricity"])).toBe(d);
  }
  for (const mode of ["rental_initial", "rental_return"] as const) {
    const d = compatible(meterReport(meterSet(mode)).details, mode);
    expect(selectMeterPurpose(d, mode)).toBe(d);
  }
  const d = extendedMeterReport().details;
  const changed = selectMeterPurpose(d, "optional", ["hotWater"]);
  expect(changed).not.toBe(d);
  expect(changed.meterReadings).toMatchObject({ electricity: { optionalCapture: false }, hotWater: { optionalCapture: true } });
  expect(selectMeterPurpose(changed, "optional", ["hotWater"])).toBe(changed);
});
test("same-mode purpose confirmation still binds real unbound facts and rejects a stale snapshot", () => {
  const d = extendedMeterReport().details; delete d.meterReadings!.factsPurpose;
  const snapshot = meterSnapshot(d);
  expect(selectMeterPurpose(d, "optional", ["electricity"])).toBe(d);
  const changed = patchMeter(d, "electricity", "readingValue", "000,75");
  expect(confirmMeterPurpose(changed, "optional", ["electricity"], snapshot)).toBe(changed);
  const confirmed = confirmMeterPurpose(d, "optional", ["electricity"], snapshot);
  expect(confirmed).not.toBe(d); expect(confirmed.meterReadings!.factsPurpose).toBe("optional");
  expect(confirmed.meterReadings!.electricity).toEqual(d.meterReadings!.electricity);
  expect(selectMeterPurpose(confirmed, "optional", ["electricity"])).toBe(confirmed);
});
for (const mode of ["rental_initial", "rental_return"] as const) test(`${mode} deliberately asks both utilities only in its compatible context`, () => {
  let d = compatible(meterReport().details, mode); d = selectMeterPurpose(d, mode);
  expect(meterState(d).issues.map(i => i.utility)).toEqual(["electricity", "hotWater"]);
  expect(d.meterReadings).toEqual({ mode });
  const changed = { ...d, inspectionType: mode === "rental_initial" ? "final" as const : "initial" as const };
  expect(meterState(changed).issues).toEqual([]); expect(changed.meterReadings).toBe(d.meterReadings);
});
for (const applicability of ["no_meter", "unknown", "not_examined", "shared"] as const) test(`${applicability} alone requires no reading and never invents zero`, () => {
  const d = meterReport({ mode: "optional", electricity: { optionalCapture: true, applicability } }).details;
  expect(meterState(d).issues).toEqual([]); expect(meterState(d).limitations).toHaveLength(applicability === "unknown" || applicability === "not_examined" ? 1 : 0);
  expect(d.meterReadings!.electricity).not.toHaveProperty("readingValue");
});
for (const status of ["recorded", "not_read", "unreadable", "inaccessible", "unknown"] as MeterReadingStatus[]) test(`conditional reading status ${status}`, () => {
  for (const applicability of ["separate", "shared"] as const) {
    const d = meterReport({ mode: "optional", factsPurpose: "optional", electricity: recordedMeter({ applicability, factsApplicability: applicability, readingStatus: status, readingValue: "", unit: "", readingDate: "" }) }).details;
    expect(meterState(d).actionCount).toBe(status === "recorded" ? 3 : 0);
    expect(meterState(d).limitations).toHaveLength(status === "recorded" ? 0 : 1);
    expect(meterState(d).hasAttention).toBe(status === "recorded");
  }
});
test("raw plausible values pass unchanged; text, incomplete forms and whitespace stay saveable review issues", () => {
  const pass = ["0", "00123,40", " 12 345,60 ", "12\u00A0345,60", "12\u202F345,60", "1.234,50", "123.45"];
  const fail = ["abc", "123 kWh", "12,", "12 34", "1e3", "-1", ".5", "1,234.50", "", " "];
  for (const value of [...pass, ...fail]) {
    const r = meterReport(meterSet()); r.details.meterReadings!.electricity!.readingValue = value;
    expect(plausibleMeterValue(value)).toBe(pass.includes(value)); expect(isReportList([r])).toBe(true);
    const issues = meterState(r.details).issues; expect(issues).toHaveLength(pass.includes(value) ? 0 : 1);
    if (issues.length) expect(issues[0].kind).toBe(value.trim() ? "review" : "missing");
    expect(r.details.meterReadings!.electricity!.readingValue).toBe(value);
  }
});
test("actual reading dates are explicit, calendar-valid, nonfuture and never rewritten", () => {
  for (const [date, invalid] of [["2024-02-29", false], ["2026-02-29", true], ["2026-10-20", true], ["2026-10-19", false], [" 2026-10-19 ", false], ["0000-01-01", true], ["2026-1", true]] as const) {
    expect(!!meterDateWarning(date, "2026-10-19")).toBe(invalid);
    const r = meterReport(meterSet()); r.details.meterReadings!.electricity!.readingDate = date;
    expect(isReportList([r])).toBe(true); expect(meterState(r.details, "2026-10-19").actionCount).toBe(invalid ? 1 : 0);
    expect(r.details.meterReadings!.electricity!.readingDate).toBe(date);
  }
  const d = patchMeter(meterReport({ mode: "optional", electricity: { optionalCapture: true, applicability: "separate" } }).details, "electricity", "readingStatus", "recorded");
  expect(d.meterReadings!.electricity).not.toHaveProperty("readingDate"); expect(d.meterReadings!.electricity).not.toHaveProperty("unit");
});
test("arrangement changes hold raw facts, status and extensions until exact explicit confirmation", () => {
  for (const [from, to] of [["separate", "shared"], ["shared", "separate"]] as const) {
    const d = extendedMeterReport().details; Object.assign(d.meterReadings!.electricity!, { applicability: from, factsApplicability: from });
    const changed = patchMeter(d, "electricity", "applicability", to);
    expect(changed.meterReadings!.electricity).toEqual({ ...d.meterReadings!.electricity, applicability: to });
    expect(meterState(changed).issues).toEqual([expect.objectContaining({ kind: "confirmation", field: "readingStatus" })]);
    expect(meterContextCurrent(changed, "electricity")).toBe(false);
    const confirmed = confirmMeterArrangement(changed, "electricity", meterSnapshot(changed));
    expect(confirmed.meterReadings!.electricity).toEqual({ ...changed.meterReadings!.electricity, factsApplicability: to });
    expect(meterState(confirmed).actionCount).toBe(0); expect(confirmed.meterReadings!.hotWater).toEqual(d.meterReadings!.hotWater);
    const back = patchMeter(changed, "electricity", "applicability", from); expect(meterState(back).actionCount).toBe(0);
    expect(meterState(patchMeter(confirmed, "electricity", "applicability", from)).actionCount).toBe(1);
  }
});
test("non-reading branches and unselected/inactive captures retain mismatched facts without tasks", () => {
  const d = extendedMeterReport().details;
  for (const applicability of ["no_meter", "unknown", "not_examined", undefined] as (MeterApplicability | undefined)[]) {
    const next = patchMeter(d, "electricity", "applicability", applicability);
    expect(meterState(next).actionCount).toBe(applicability === undefined ? 1 : 0);
    expect(next.meterReadings!.electricity!.readingValue).toBe("00123,40");
  }
  expect(meterState(patchMeter(d, "electricity", "optionalCapture", false)).actionCount).toBe(0);
  expect(meterState({ ...d, meterReadings: { ...d.meterReadings, mode: "inactive" } }).actionCount).toBe(0);
});
for (const from of purposes) for (const to of purposes.filter(p => p !== from)) test(`same-event purpose correction ${from} → ${to} is explicit, atomic and keeps arrangement associations`, () => {
  const d = compatible(meterReport(meterSet(from)).details, to); const snapshot = meterSnapshot(d);
  expect(needsPurposeCorrection(d, to)).toBe(true); expect(selectMeterPurpose(d, to, ["electricity"])).toBe(d);
  const next = confirmMeterPurpose(d, to, ["electricity"], snapshot);
  expect(next.meterReadings).toMatchObject({ mode: to, factsPurpose: to, electricity: d.meterReadings!.electricity });
  expect(next.meterReadings!.electricity!.factsApplicability).toBe("separate");
  expect(d.meterReadings!.mode).toBe(from); expect(meterSnapshot(d)).toBe(snapshot);
});
test("stale purpose and arrangement previews reject writes and neither guard resolves the other", () => {
  const d = compatible(extendedMeterReport().details, "rental_initial"); const snapshot = meterSnapshot(d);
  const changed = patchMeter(d, "electricity", "readingValue", "999,99");
  expect(confirmMeterPurpose(changed, "rental_initial", [], snapshot)).toBe(changed);
  const pending = patchMeter(d, "electricity", "applicability", "shared");
  expect(confirmMeterArrangement(pending, "electricity", snapshot)).toBe(pending);
  const corrected = confirmMeterPurpose(pending, "rental_initial", [], meterSnapshot(pending));
  expect(corrected.meterReadings!.electricity!.factsApplicability).toBe("separate");
  expect(meterState(corrected).issues.some(i => i.kind === "confirmation")).toBe(true);
  const unbound = { ...d, meterReadings: { ...pending.meterReadings, factsPurpose: undefined } };
  const arrangement = confirmMeterArrangement(unbound, "electricity", meterSnapshot(unbound));
  expect(arrangement.meterReadings!.factsPurpose).toBeUndefined(); expect(meterState(arrangement).issues.filter(i => i.field === "purpose")).toHaveLength(1);
});
test("unbound known facts fail closed, purpose issues deduplicate and ordinary edits never repair real retained facts", () => {
  let d = meterReport({ mode: "optional", electricity: recordedMeter({ factsApplicability: undefined }), hotWater: recordedMeter({ factsApplicability: undefined }) }).details;
  expect(meterState(d).issues).toEqual([expect.objectContaining({ field: "purpose" })]);
  d = patchMeter(d, "electricity", "readingDate", "2026-10-18");
  expect(d.meterReadings!.factsPurpose).toBeUndefined(); expect(d.meterReadings!.electricity!.factsApplicability).toBeUndefined();
});
test("cleared actual facts leave tags/data intact but do not obstruct empty purpose or arrangement edits", () => {
  let d = extendedMeterReport().details;
  // Clear every actual fact in both selected and retained unselected utilities deliberately.
  for (const k of ["electricity", "hotWater"] as const) for (const field of ["readingStatus", "readingValue", "unit", "readingDate"] as const) d = patchMeter(d, k, field, field === "readingStatus" ? undefined : "");
  expect(hasMeterFacts(d.meterReadings)).toBe(false);
  const before = structuredClone(d.meterReadings);
  d = selectMeterPurpose(compatible(d, "rental_return"), "rental_return");
  expect(d.meterReadings!.factsPurpose).toBe("optional"); expect(d.meterReadings!.electricity).toEqual(before!.electricity);
  d = patchMeter(d, "electricity", "applicability", "shared");
  expect(d.meterReadings!.electricity!.factsApplicability).toBe("separate"); expect(meterState(d).issues.some(i => i.kind === "confirmation")).toBe(false);
  d = patchMeter(d, "electricity", "readingStatus", "not_read");
  expect(d.meterReadings).toMatchObject({ factsPurpose: "rental_return", electricity: { factsApplicability: "shared", meterIdentifier: "00042", note: before!.electricity!.note } });
  expect(hasMeterExtensions(d.meterReadings)).toBe(true);
});
test("remaining whitespace or facts on an unselected utility still prevent a silent purpose rebind", () => {
  const d = meterReport({ mode: "optional", factsPurpose: "optional", electricity: { optionalCapture: false, readingValue: " " } }).details;
  expect(needsPurposeCorrection(d, "rental_initial")).toBe(true);
});
test("new meter data uses additive structural validation without requiring completeness", () => {
  const valid: (PropertyMeterReadings | undefined)[] = [undefined, {}, { mode: "optional" }, { electricity: {} }, meterSet(), { electricity: { readingValue: "nonsense" } }];
  for (const value of valid) expect(isReportList([meterReport(value)])).toBe(true);
  for (const value of [null, [], "bad", { mode: "handover" }, { factsPurpose: false }, { electricity: [] }, { electricity: { optionalCapture: "yes" } }, { hotWater: { readingValue: 0 } }, { electricity: { factsApplicability: "new" } }]) expect(isReportList([meterReport(value as PropertyMeterReadings)])).toBe(false);
});
test("meter correction allowlists UI fields; mixed fire links preserve fire precedence and no parser mutates", () => {
  for (const field of METER_FIELDS) for (const k of ["electricity", "hotWater"] as const) expect(resolveMeterCorrection("meter-case", new URL(meterCorrectionHref("meter-case", k, field), "http://test").searchParams)).toMatchObject({ active: true, valid: true, field, utility: k });
  for (const q of ["maelar=rafmagn", "maelaReitur=readingStatus", "maelar=rafmagn&maelaReitur=factsApplicability&fra=yfirferd", "maelar=rafmagn&maelaReitur=readingStatus&fra=yfirferd&rymi=legacy-room", "maelar=rafmagn&maelaReitur=readingStatus&fra=yfirferd&maelar=heitt-vatn"]) expect(resolveMeterCorrection("meter-case", new URLSearchParams(q))).toMatchObject({ active: true, valid: false });
  const params = new URLSearchParams("maelar=rafmagn&maelaReitur=readingStatus&fra=yfirferd&hluti=brunavarnir");
  expect(resolveMeterCorrection("meter-case", params).active).toBe(false); expect(resolveFireCorrection(meterReport(), params)).toMatchObject({ active: true, valid: false });
});

test.describe("meter v1 storage and nested preservation", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let values: Map<string, string>; let writes: string[]; let fail: boolean;
  test.beforeEach(() => { values = new Map(); writes = []; fail = false; Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { if (fail) throw Error("synthetic quota"); values.set(k, v); writes.push(v); } } }); });
  test.afterEach(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });
  test("reselecting the same purpose and utility never persists, changes updatedAt or rewrites extensions", () => {
    const r = extendedMeterReport();
    const raw = JSON.stringify({ version: 1, envelope: { keep: [0, false] }, reports: [r] }, null, 2);
    values.set(STORAGE_KEY, raw); const store = new DemoStore(); store.hydrate();
    const before = store.getSnapshot(); const report = before.reports[0];
    expect(store.updateMeters(r.id, d => selectMeterPurpose(d, "optional", ["electricity"]))).toBe(false);
    expect(store.getSnapshot()).toBe(before); expect(store.getSnapshot().reports[0]).toBe(report);
    expect(store.getSnapshot().reports[0].updatedAt).toBe(r.updatedAt);
    expect(store.getSnapshot().reports[0].details.meterReadings).toBe(report.details.meterReadings);
    expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
    // An identical selection must also leave a failed, pending genuine edit intact.
    fail = true; store.updateMeters(r.id, d => patchMeter(d, "electricity", "readingValue", "000,75"));
    const pending = store.getSnapshot();
    expect(store.updateMeters(r.id, d => selectMeterPurpose(d, "optional", ["electricity"]))).toBe(false);
    expect(store.getSnapshot()).toBe(pending); expect(writes).toEqual([]);
    fail = false; store.retrySave();
    expect(JSON.parse(values.get(STORAGE_KEY)!).reports[0].details.meterReadings).toEqual({ ...r.details.meterReadings, electricity: { ...r.details.meterReadings!.electricity, readingValue: "000,75" } });
    expect(writes).toHaveLength(1);
  });
  test("legacy reads, summaries and new reports never backfill; genuine unrelated edits only change intended data/metadata", () => {
    for (const r of [legacyCoreReport(), meterReport(), extendedMeterReport()]) {
      const document = { version: 1, extra: { keep: [0, false] }, reports: [r, { ...legacyCoreReport(), id: "other" }] };
      const raw = JSON.stringify(document, null, 2); values.set(STORAGE_KEY, raw); writes = [];
      const store = new DemoStore(); store.hydrate(); meterState(store.getSnapshot().reports[0].details);
      expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
      store.updateReport(r.id, report => ({ ...report, title: "Nýr titill" }));
      const saved = JSON.parse(values.get(STORAGE_KEY)!);
      expect(saved.reports[0].details).toEqual(r.details); expect(saved.reports[1]).toEqual(document.reports[1]); expect(saved.extra).toEqual(document.extra);
      expect(saved.reports[0].updatedAt).not.toBe(r.updatedAt);
    }
    const store = new DemoStore(); values.delete(STORAGE_KEY); store.hydrate(); const id = store.createReport();
    expect(store.getSnapshot().reports.find(r => r.id === id)!.details).not.toHaveProperty("meterReadings");
  });
  test("pending writes and nested extensions survive edits, failure/retry, confirmation rejection and reload", () => {
    const r = extendedMeterReport(); values.set(STORAGE_KEY, JSON.stringify({ version: 1, envelope: { keep: [0, false] }, reports: [r] }));
    const store = new DemoStore(); store.hydrate(); const original = values.get(STORAGE_KEY); fail = true;
    store.updateMeters(r.id, d => patchMeter(d, "electricity", "readingValue", "000,75"));
    expect(values.get(STORAGE_KEY)).toBe(original); expect(store.getSnapshot().status).toBe("error");
    const pending = store.getSnapshot().reports[0];
    expect(store.updateMeters(r.id, d => confirmMeterArrangement(d, "electricity", "stale"))).toBe(false); expect(store.getSnapshot().reports[0]).toBe(pending);
    fail = false; store.retrySave(); const saved = JSON.parse(values.get(STORAGE_KEY)!);
    expect(saved.reports[0].details.meterReadings.electricity.future).toEqual({ keep: [0, false, { text: "óbreytt" }] });
    expect(saved.reports[0].details.meterReadings.hotWater).toEqual(r.details.meterReadings!.hotWater); expect(saved.envelope).toEqual({ keep: [0, false] });
    const reloaded = new DemoStore(); reloaded.hydrate(); expect(reloaded.getSnapshot().reports[0].details.meterReadings).toEqual(saved.reports[0].details.meterReadings);
  });
  test("malformed data is protected from capture, confirmations and retry", () => {
    const raw = '{"version":1,"reports":['; values.set(STORAGE_KEY, raw); const store = new DemoStore(); store.hydrate();
    expect(store.updateMeters("missing", d => selectMeterPurpose(d, "optional", ["electricity"]))).toBe(false); store.retrySave(); expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
  });
});
