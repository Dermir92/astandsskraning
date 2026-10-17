import { test, expect } from "@playwright/test";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { detailIssues, inspectionDateWarning, isCalendarDate, isReportList, reportStats, rentalRequirements } from "../src/lib/model";
import { coreFields, legacyCoreReport } from "./inspection-core-fixtures";

test("date readiness checks calendar and future values without deriving an event", () => {
  for (const date of ["2024-02-29", "2026-10-17", "2000-02-29"]) expect(isCalendarDate(date)).toBe(true);
  for (const date of ["", "2026-02-29", "2026-02-30", "2026-13-01", "2026-00-01", "0000-01-01", "not a date", "2026-10-17T23:00:00Z"]) expect(isCalendarDate(date)).toBe(false);
  expect(inspectionDateWarning("", "2026-10-17")).toBeUndefined();
  expect(inspectionDateWarning("2026-10-17", "2026-10-17")).toBeUndefined();
  expect(inspectionDateWarning("2026-10-18", "2026-10-17")).toContain("framtíðinni");
  expect(inspectionDateWarning("2026-02-30", "2026-10-17")).toContain("ekki gild");
});

test("metadata relevance is explicit for every context/type combination, separate from item progress", () => {
  const report = legacyCoreReport(); const original = JSON.stringify(report); const stats = reportStats(report);
  for (const context of [undefined, "", "standalone", "residential_rental"] as const) {
    for (const type of ["", "initial", "final", "independent"] as const) {
      const details = { ...report.details, inspectionContext: context, inspectionType: type, role: "" as const, deliveryDate: "", furnished: "" as const };
      const required = rentalRequirements(details);
      expect(required.role).toBe(context === "residential_rental");
      expect(required.furnished).toBe(context === "residential_rental");
      expect(required.deliveryDate).toBe(context === "residential_rental" && (type === "initial" || type === "final"));
      const missing = detailIssues(details, "2026-10-17").map(i => i.field);
      expect(missing.includes("inspectionContext")).toBe(!context);
      expect(missing.includes("role")).toBe(required.role);
      expect(missing.includes("deliveryDate")).toBe(required.deliveryDate);
      expect(missing.includes("furnished")).toBe(required.furnished);
      expect(missing).toEqual(expect.arrayContaining(["inspectionDate", "recorderName", "scopeDescription"]));
      expect(missing).not.toContain("scopeLimitations");
      expect(reportStats({ ...report, details })).toEqual(stats);
    }
  }
  expect(JSON.stringify(report)).toBe(original);
  const full = { ...report.details, inspectionContext: "standalone" as const, inspectionDate: "2026-10-16", recorderName: "Sýni", scopeDescription: "Veggir í stofu." };
  expect(detailIssues(full, "2026-10-17")).toEqual([]);
  expect(detailIssues({ ...full, recorderName: " \n ", scopeDescription: "\t" }).map(i => i.field)).toEqual(["recorderName", "scopeDescription"]);
  expect(detailIssues({ ...full, inspectionDate: "2099-01-01" }, "2026-10-17").map(i => i.field)).toEqual(["inspectionDate"]);
});

test.describe("additive v1 store contract", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let values: Map<string, string>; let writes: string[]; let failWrite: boolean;
  test.beforeEach(() => {
    values = new Map(); writes = []; failWrite = false;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { if (failWrite) throw new Error("Synthetic quota failure"); writes.push(value); values.set(key, value); },
    } });
  });
  test.afterEach(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });

  test("loading legacy bytes adds no fields or writes; an explicit edit preserves all unrelated data", () => {
    const first = { ...legacyCoreReport(), preservedExtension: { note: "Keep unknown data" } };
    const second = { ...legacyCoreReport(), id: "another-report" };
    const raw = JSON.stringify({ version: 1, reports: [first, second] }, null, 2); values.set(STORAGE_KEY, raw);
    const store = new DemoStore(); store.hydrate();
    expect(writes).toEqual([]); expect(values.get(STORAGE_KEY)).toBe(raw);
    expect(store.getSnapshot().reports).toEqual([first, second]);
    for (const field of coreFields) expect(Object.hasOwn(store.getSnapshot().reports[0].details, field)).toBe(false);
    detailIssues(store.getSnapshot().reports[0].details);
    expect(writes).toEqual([]);
    expect(store.updateReport(first.id, r => ({ ...r, details: { ...r.details, recorderName: "Sýni Þór" } }))).toBe(true);
    const saved = JSON.parse(values.get(STORAGE_KEY)!);
    expect(saved.version).toBe(1); expect(saved.reports[1]).toEqual(second);
    expect(saved.reports[0]).toEqual({ ...first, updatedAt: expect.any(String), details: { ...first.details, recorderName: "Sýni Þór" } });
    expect(saved.reports[0].details).not.toHaveProperty("inspectionDate");
    const reload = new DemoStore(); reload.hydrate(); expect(reload.getSnapshot().reports).toEqual(saved.reports);
  });

  test("all five optional fields accept absence/empty strings and reject wrong shapes without replacement", () => {
    const report = legacyCoreReport(); expect(isReportList([report])).toBe(true);
    for (const field of coreFields) {
      expect(isReportList([{ ...report, details: { ...report.details, [field]: "" } }])).toBe(true);
      for (const value of [null, 42, false, {}, []]) {
        const bad = { ...report, details: { ...report.details, [field]: value } };
        expect(isReportList([bad])).toBe(false);
        const raw = JSON.stringify({ version: 1, reports: [bad] }); values.set(STORAGE_KEY, raw);
        const store = new DemoStore(); store.hydrate(); expect(store.getSnapshot().status).toBe("read-error");
        store.createReport(); store.retrySave(); store.updateReport(report.id, r => ({ ...r, details: { ...r.details, recorderName: "Blocked" } }));
        expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
      }
    }
    expect(isReportList([{ ...report, details: { ...report.details, inspectionContext: "examiner" } }])).toBe(false);
    expect(isReportList([{ ...report, details: { ...report.details, inspectionDate: "2026-02-30" } }])).toBe(true);
  });

  test("failed writes retain complete pending edits and retry after a rejected invalid mutation", () => {
    const report = legacyCoreReport(); const raw = JSON.stringify({ version: 1, reports: [report] }); values.set(STORAGE_KEY, raw);
    const store = new DemoStore(); store.hydrate(); failWrite = true;
    const additions = { inspectionContext: "standalone" as const, inspectionDate: "2099-01-01", recorderName: "Sýni", scopeDescription: "Veggir", scopeLimitations: "" };
    expect(store.updateReport(report.id, r => ({ ...r, details: { ...r.details, ...additions } }))).toBe(true);
    expect(values.get(STORAGE_KEY)).toBe(raw); expect(store.getSnapshot().status).toBe("error");
    expect(store.updateReport(report.id, r => ({ ...r, details: { ...r.details, inspectionContext: "bad" as never } }))).toBe(false);
    expect(store.getSnapshot().status).toBe("error"); failWrite = false; store.retrySave();
    expect(store.getSnapshot().status).toBe("saved"); expect(JSON.parse(values.get(STORAGE_KEY)!).reports[0].details).toEqual({ ...report.details, ...additions });
  });
});
