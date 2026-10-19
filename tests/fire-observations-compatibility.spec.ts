import { expect, test } from "@playwright/test";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { fireGroupIssues, fireGroupStatus, fireState, hasFireExtensions, meaningfulFireRow, patchFireGroup, patchFireRow } from "../src/lib/fire-observations";
import { fireCorrectionHref, resolveFireCorrection } from "../src/lib/fire-navigation";
import { isReportList, reportStats, reportStatus, type Report, type ResidentialFireObservations } from "../src/lib/model";
import { legacyCoreReport } from "./inspection-core-fixtures";
import { extendedFireDocument, fireReport, mixedFire } from "./fire-observations-fixtures";

test("optional omissions are contextual limitations, never required tasks or action counts", () => {
  const fire: ResidentialFireObservations = {
    smokeDetectors: { examination: "examined", presence: "observed", entries: [{ id: "s", visibleCondition: "no_visible_issue_observed", basicTest: { performance: "not_performed" } }] },
    extinguishers: { examination: "examined", presence: "observed", entries: [{ id: "e", visibleCondition: "no_visible_issue_observed", serviceLabel: { status: "not_examined" } }] },
    escapeRoutes: { examination: "not_examined" },
  };
  const report = fireReport(fire); const before = fireState(report.details);
  expect(before.missing).toEqual([]); expect(before.concerns).toEqual([]); expect(before.actionCount).toBe(0);
  expect(before.limitations.filter(i => i.contextual)).toHaveLength(6);
  for (const g of ["smokeDetectors", "extinguishers"] as const) {
    fire[g]!.examinedDescription = "Sýnissvæði";
    Object.assign(fire[g]!.entries![0], { location: "Sýnistæki", observedCount: "2" });
  }
  report.details.fireSafety = fire;
  expect(fireState(report.details).actionCount).toBe(before.actionCount);
  expect(fireState(report.details).missing).toEqual(before.missing);
});

test("collapsed status prioritizes active concerns across mixed rows and incomplete answers deterministically", () => {
  const fire = mixedFire();
  fire.smokeDetectors!.entries!.unshift({ id: "partial" });
  for (const rows of [fire.smokeDetectors!.entries!, [...fire.smokeDetectors!.entries!].reverse()]) {
    fire.smokeDetectors!.entries = rows;
    expect(fireGroupStatus(fire, "smokeDetectors")).toBe("Ekkert viðbragð skráð við prófun");
    expect(fireState(fireReport(fire).details).status).toBe("Ekkert viðbragð skráð við prófun");
  }
  const ext = fire.extinguishers!.entries![0]; ext.visibleCondition = "visible_issue_observed";
  expect(fireGroupStatus(fire, "extinguishers")).toBe("Sýnilegur annmarki skráður");
  expect(fireGroupStatus(fire, "escapeRoutes")).toBe("Sýnileg hindrun skráð á flóttaleið");
});

test("inactive failures, label text and route details are retained without active conclusions", () => {
  const fire = mixedFire();
  fire.smokeDetectors!.entries![1].basicTest!.performance = "not_performed";
  expect(fireGroupIssues(fire, "smokeDetectors").filter(i => i.kind === "concern")).toEqual([]);
  expect(fire.smokeDetectors!.entries![1].basicTest!.result).toBe("no_response_observed");
  fire.extinguishers!.presence = "none_observed";
  expect(fireGroupIssues(fire, "extinguishers").filter(i => i.kind === "concern").map(i => i.field)).toEqual(["presence"]);
  fire.escapeRoutes!.examination = "not_examined";
  expect(fireGroupIssues(fire, "escapeRoutes")).toEqual([expect.objectContaining({ kind: "limitation", field: "examination" })]);
  fire.smokeDetectors!.examination = "unknown";
  expect(fireGroupIssues(fire, "smokeDetectors")).toEqual([expect.objectContaining({ kind: "limitation" })]);
});

test("all not examined answers leave three limitations and no software gaps or action tasks", () => {
  const report = fireReport({ smokeDetectors: { examination: "not_examined" }, extinguishers: { examination: "not_examined" }, escapeRoutes: { examination: "not_examined" } });
  const state = fireState(report.details);
  expect(state.missing).toEqual([]); expect(state.actionCount).toBe(0); expect(state.limitations).toHaveLength(3); expect(state.hasAttention).toBe(true);
  expect(state.status).toContain("ekkert af þessum þremur sviðum skoðað");
});

test("context and inspection type do not infer facts, change progress or impose optional missing tasks", () => {
  for (const context of [undefined, "", "standalone", "residential_rental"] as const) for (const inspectionType of ["", "initial", "final", "independent"] as const) {
    const r = fireReport(); Object.assign(r.details, { inspectionContext: context, inspectionType });
    const raw = JSON.stringify(r), stats = reportStats(r), status = reportStatus(r);
    expect(fireState(r.details).actionCount).toBe(context === "residential_rental" ? 3 : 0);
    r.details.fireSafety = mixedFire();
    expect(fireState(r.details).concerns.length).toBeGreaterThan(0);
    expect(reportStats(r)).toEqual(stats); expect(reportStatus(r)).toBe(status);
    delete r.details.fireSafety; expect(JSON.stringify(r)).toBe(raw);
  }
});

test("labels, unknowns, incomplete prose and malformed raw counts stay distinct saveable facts", () => {
  for (const count of ["", " ", "0", "-1", "1.5", "tvö", "999999999999999999999", "0002"]) {
    const fire = mixedFire(); fire.smokeDetectors!.entries![0].observedCount = count;
    expect(isReportList([fireReport(fire)])).toBe(true);
    const issue = fireGroupIssues(fire, "smokeDetectors").find(i => i.rowId === "untested" && i.field === "observedCount");
    expect(issue?.kind).toBe(!count.trim() ? "limitation" : count === "0002" ? undefined : "concern");
  }
  for (const status of [undefined, "readable", "none_observed", "unreadable", "not_examined", "unknown"] as const) {
    const fire = mixedFire(); fire.extinguishers!.entries![0].serviceLabel = { status, observedText: "Óljós sýnidagsetning 9/25" };
    expect(isReportList([fireReport(fire)])).toBe(true);
    expect(fireGroupIssues(fire, "extinguishers").filter(i => i.kind === "concern")).toHaveLength(status === "none_observed" || status === "unreadable" ? 1 : 0);
  }
  expect(meaningfulFireRow({ id: "blank", basicTest: {}, location: " " }, "smokeDetectors")).toBe(false);
  expect(hasFireExtensions(extendedFireDocument().reports[0].details.fireSafety)).toBe(true);
});

test("additive structural validation protects incompatible shapes without rejecting incomplete drafts", () => {
  for (const fire of [undefined, {}, { smokeDetectors: {} }, { extinguishers: { entries: [] } }, mixedFire()]) expect(isReportList([fireReport(fire)])).toBe(true);
  const invalid = [null, [], "extension collision", { smokeDetectors: null }, { escapeRoutes: { examination: "safe" } }, { smokeDetectors: { entries: [{ id: "" }] } }, { smokeDetectors: { entries: [{ id: "a" }, { id: "a" }] } }, { smokeDetectors: { entries: [{ id: "x", basicTest: { result: "works" } }] } }, { extinguishers: { entries: [{ id: "x", serviceLabel: { status: "expired" } }] } }, { smokeDetectors: { entries: [{ id: "x", observedCount: 2 }] } }, { smokeDetectors: { entries: Array.from({ length: 101 }, (_, i) => ({ id: String(i) })) } }];
  for (const fire of invalid) expect(isReportList([fireReport(fire as never)])).toBe(false);
  expect(isReportList([fireReport({ smokeDetectors: { entries: Array.from({ length: 100 }, (_, i) => ({ id: String(i) })) } })])).toBe(true);
});

test("correction parsing allowlists real targets, preserves compound IDs and never invents rows", () => {
  const report = fireReport(mixedFire()); const raw = JSON.stringify(report);
  for (const field of ["testPerformance", "testedScopeDescription", "testResult", "location", "observedCount", "visibleIssueDescription", "note"] as const) {
    const url = new URL(fireCorrectionHref(report.id, "smokeDetectors", field, "failed"), "http://example.test");
    expect(resolveFireCorrection(report, url.searchParams)).toMatchObject({ active: true, valid: true, rowId: "failed", field });
  }
  for (const query of ["hluti=brunavarnir", "hluti=brunavarnir&hluti=brunavarnir", "hluti=brunavarnir&flokkur=unknown&reitur=examination&fra=yfirferd", "hluti=brunavarnir&flokkur=reykskynjarar&reitur=labelText&fra=yfirferd", "hluti=brunavarnir&flokkur=reykskynjarar&reitur=examination&fra=https://example.com", "hluti=brunavarnir&flokkur=reykskynjarar&reitur=examination&fra=yfirferd&rymi=room"]) expect(resolveFireCorrection(report, new URLSearchParams(query))).toMatchObject({ active: true, valid: false, focusId: "fire-safety" });
  const stale = new URL(fireCorrectionHref(report.id, "smokeDetectors", "testResult", "deleted"), "http://example.test");
  expect(resolveFireCorrection(report, stale.searchParams)).toMatchObject({ valid: true, stale: true, field: "examination" });
  expect(JSON.stringify(report)).toBe(raw);
});

test.describe("fire v1 store preservation and retry", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let values: Map<string, string>; let writes: string[]; let fail: boolean;
  test.beforeEach(() => {
    values = new Map(); writes = []; fail = false;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { if (fail) throw new Error("synthetic quota"); values.set(k, v); writes.push(v); } } });
  });
  test.afterEach(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });
  test("legacy hydration and analysis preserve exact bytes; new drafts get no defaults", () => {
    for (const r of [legacyCoreReport(), fireReport(), fireReport({})]) {
      const raw = JSON.stringify({ version: 1, extra: false, reports: [r] }, null, 2); values.set(STORAGE_KEY, raw);
      const store = new DemoStore(); store.hydrate(); fireState(store.getSnapshot().reports[0].details);
      expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
    }
    const store = new DemoStore(); store.hydrate(); const id = store.createReport();
    expect(store.getSnapshot().reports.find(r => r.id === id)!.details).not.toHaveProperty("fireSafety");
  });
  test("nested edits, context switches and retry preserve unknown fields at every level", () => {
    const original = extendedFireDocument(); values.set(STORAGE_KEY, JSON.stringify(original));
    const store = new DemoStore(); store.hydrate(); fail = true;
    const change = (patch: (r: Report) => Report) => store.updateReport("fire-case", patch);
    change(r => ({ ...r, details: patchFireRow(r.details, "smokeDetectors", "failed", row => ({ ...row, basicTest: { ...row.basicTest, performance: "not_performed" } })) }));
    for (const inspectionContext of ["standalone", "", "residential_rental"] as const) change(r => ({ ...r, details: { ...r.details, inspectionContext } }));
    change(r => ({ ...r, details: patchFireGroup(r.details, "extinguishers", group => ({ ...group, presence: "none_observed" })) }));
    expect(store.getSnapshot().status).toBe("error");
    expect(change(r => ({ ...r, details: { ...r.details, fireSafety: null as never } }))).toBe(false);
    fail = false; store.retrySave(); const saved = JSON.parse(values.get(STORAGE_KEY)!); const expected = structuredClone(original);
    expected.reports[0].details.fireSafety!.smokeDetectors!.entries![0].basicTest!.performance = "not_performed";
    expected.reports[0].details.fireSafety!.extinguishers!.presence = "none_observed";
    expected.reports[0].updatedAt = saved.reports[0].updatedAt;
    expect(saved).toEqual(expected); expect(store.getSnapshot().status).toBe("saved");
  });
  test("unreadable source cannot be replaced through edits, creation or retry", () => {
    for (const raw of ["{bad", JSON.stringify({ version: 9, reports: [] }), ...[null, "old", [], { smokeDetectors: { examination: "future" } }].map(fireSafety => JSON.stringify({ version: 1, extra: false, reports: [fireReport(fireSafety as never)] }))]) {
      values.set(STORAGE_KEY, raw); const store = new DemoStore(); store.hydrate();
      expect(store.getSnapshot().status).toBe("read-error"); expect(store.createReport()).toBeNull(); store.retrySave();
      expect(store.updateReport("fire-case", r => ({ ...r, details: { ...r.details, fireSafety: {} } }))).toBe(false);
      expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
    }
  });
});
