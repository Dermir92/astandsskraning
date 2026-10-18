import { expect, test } from "@playwright/test";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { detailIssues, isReportList, reportStats, reportStatus } from "../src/lib/model";
import { hasRentalInformation, hasRetainedRentalInformation, leaseDateWarning, rentalInformationIssues, representativeName } from "../src/lib/rental-information";
import { legacyCoreReport } from "./inspection-core-fixtures";
import { extendedRentalDocument, rentalInformation, rentalReport } from "./rental-information-fixtures";

test("rental relevance is explicit and metadata never changes room progress or status", () => {
  const report = rentalReport(); const before = JSON.stringify(report);
  for (const context of [undefined, "", "standalone", "residential_rental"] as const) {
    for (const inspectionType of ["", "initial", "final", "independent"] as const) {
      const changed = { ...report, details: { ...report.details, inspectionContext: context, inspectionType } };
      expect(rentalInformationIssues(changed.details).map(issue => issue.field)).toEqual(context === "residential_rental" ? ["rentalLandlordNames", "rentalTenantNames", "rentalPremisesDescription", "rentalLeaseReference"] : []);
      expect(reportStats(changed)).toEqual(reportStats(report)); expect(reportStatus(changed)).toBe(reportStatus(report));
    }
  }
  expect(JSON.stringify(report)).toBe(before);
  expect(rentalInformationIssues(rentalReport(rentalInformation).details)).toEqual([]);
});

test("lease association accepts either factual value, independently of an invalid supplied date", () => {
  const details = rentalReport(rentalInformation).details;
  for (const [leaseDate, leaseReference, fields] of [
    ["", "", ["rentalLeaseReference"]], ["", " \n ", ["rentalLeaseReference"]],
    ["2024-02-29", "", []], ["2099-12-31", "", []], ["", "REF 001", []],
    ["2026-02-30", "REF 001", ["rentalLeaseDate"]],
    ["2026-02-30", "", ["rentalLeaseReference", "rentalLeaseDate"]],
  ] as const) {
    const d = { ...details, rentalInformation: { ...rentalInformation, leaseDate, leaseReference } };
    expect(rentalInformationIssues(d).map(issue => issue.field)).toEqual(fields); expect(isReportList([{ ...rentalReport(), details: d }])).toBe(true);
  }
  for (const value of ["2026-02-29", "0000-01-01", "2026-10-01T00:00:00Z", "garbled"]) expect(leaseDateWarning(value)).toBeTruthy();
  expect(leaseDateWarning("2099-01-01")).toBeUndefined();
  expect(rentalInformationIssues({ ...details, rentalInformation: { ...rentalInformation, landlordNames: " \n ", tenantNames: "\t", premisesDescription: " " } }).map(i => i.field)).toEqual(["rentalLandlordNames", "rentalTenantNames", "rentalPremisesDescription"]);
});

test("representation requires an explicit source; alternative names and recorder identity are separate", () => {
  const d = rentalReport(rentalInformation).details;
  const rep = { ...d, role: "representative" as const };
  expect(representativeName(rep)).toBeUndefined();
  expect(rentalInformationIssues(rep).map(i => i.field)).toEqual(["rentalRepresentativeNameSource", "rentalRepresentedParty"]);
  const referenced = { ...rep, rentalInformation: { ...rentalInformation, representation: { nameSource: "recorder" as const, name: "Retained alternative", representedParty: "tenant" as const } } };
  expect(representativeName(referenced)).toBe(d.recorderName); expect(rentalInformationIssues(referenced)).toEqual([]);
  expect(representativeName({ ...referenced, recorderName: "New recorder" })).toBe("New recorder");
  expect(representativeName({ ...referenced, rentalInformation: { ...referenced.rentalInformation, representation: { ...referenced.rentalInformation.representation, nameSource: "other" } } })).toBe("Retained alternative");
  expect(rentalInformationIssues({ ...referenced, role: "tenant" }).map(i => i.kind)).toEqual(["inconsistent"]);
  const unnamed = { ...referenced, recorderName: "" };
  expect(rentalInformationIssues(unnamed)).toEqual([]); expect(detailIssues(unnamed).map(i => i.field)).toContain("recorderName");
  const other = { ...d, rentalInformation: { ...rentalInformation, representation: { nameSource: "other" as const, name: " " } } };
  expect(rentalInformationIssues(other).map(i => i.field)).toEqual(["rentalRepresentedParty", "rentalRepresentativeName"]);
});

test("explicit represented parties require a source while cleared declarations and other contexts stay optional", () => {
  const retained = { name: "Retained alternative", basisDescription: "Self-declared only", future: { keep: true } };
  for (const role of ["landlord", "tenant"] as const) {
    for (const representedParty of ["landlord", "tenant"] as const) {
      const report = rentalReport({ ...rentalInformation, representation: { ...retained, representedParty } });
      report.details.role = role;
      const original = structuredClone(report);
      expect(rentalInformationIssues(report.details).map(({ field, kind }) => ({ field, kind }))).toEqual([{ field: "rentalRepresentativeNameSource", kind: "missing" }]);
      expect(representativeName(report.details)).toBeUndefined();
      expect(isReportList([report])).toBe(true);
      for (const nameSource of ["", "other"] as const) {
        const details = { ...report.details, rentalInformation: { ...rentalInformation, representation: { ...retained, representedParty, nameSource } } };
        expect(rentalInformationIssues(details).map(issue => issue.field)).toEqual(nameSource === "other" ? [] : ["rentalRepresentativeNameSource"]);
        expect(rentalInformationIssues({ ...details, rentalInformation: { ...rentalInformation, representation: { ...retained, representedParty: "", nameSource } } }).map(issue => issue.field)).toEqual(nameSource === "other" ? ["rentalRepresentedParty"] : []);
      }
      expect(rentalInformationIssues({ ...report.details, rentalInformation: { ...rentalInformation, representation: { ...retained, representedParty, nameSource: "other", name: "" } } }).map(issue => issue.field)).toEqual(["rentalRepresentativeName"]);
      for (const inspectionContext of [undefined, "", "standalone"] as const) {
        const switched = { ...report.details, inspectionContext };
        expect(rentalInformationIssues(switched)).toEqual([]);
        expect(rentalInformationIssues({ ...switched, inspectionContext: "residential_rental" }).map(issue => issue.field)).toEqual(["rentalRepresentativeNameSource"]);
      }
      expect(report).toEqual(original);
    }
  }
});

test("optional shapes are additive; wrong known types/enums are protected while invalid date strings load", () => {
  for (const report of [legacyCoreReport(), rentalReport(), rentalReport({}), rentalReport({ representation: {} }), rentalReport({ leaseDate: "invalid", propertyNumber: "000-F 001", leaseReference: "arbitrary reference" })]) expect(isReportList([report])).toBe(true);
  const wrongValues = [null, 42, false, [], {}];
  for (const key of ["landlordNames", "tenantNames", "leaseDate", "leaseReference", "propertyNumber", "premisesDescription", "includedAreasDescription", "excludedAreasDescription"]) {
    for (const value of wrongValues) expect(isReportList([rentalReport({ [key]: value } as never)])).toBe(false);
  }
  for (const value of [null, 42, "", false, [], new Date()]) {
    expect(isReportList([rentalReport(value as never)])).toBe(false);
    expect(isReportList([rentalReport({ representation: value as never })])).toBe(false);
  }
  for (const key of ["name", "basisDescription", "nameSource", "representedParty"]) {
    for (const value of wrongValues) expect(isReportList([rentalReport({ representation: { [key]: value } as never })])).toBe(false);
  }
  for (const [key, value] of [["nameSource", "verified"], ["representedParty", "both"]]) expect(isReportList([rentalReport({ representation: { [key]: value } as never })])).toBe(false);
  const extended = extendedRentalDocument(); expect(isReportList(extended.reports)).toBe(true);
  expect(hasRentalInformation({ ...rentalReport().details, rentalInformation: { future: {} } as never })).toBe(true);
  expect(hasRetainedRentalInformation({ ...rentalReport().details, rentalInformation: {}, deliveryDate: "", furnished: "" })).toBe(false);
});

test.describe("rental v1 store and recovery", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let values: Map<string, string>; let writes: string[]; let failWrite: boolean;
  test.beforeEach(() => {
    values = new Map([["unrelated-key", "unchanged"]]); writes = []; failWrite = false;
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { if (failWrite) throw new Error("Synthetic quota failure"); writes.push(value); values.set(key, value); },
    } });
  });
  test.afterEach(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });

  test("legacy/new drafts add no rental defaults; non-mutating reads preserve exact bytes", () => {
    for (const report of [legacyCoreReport(), rentalReport()]) {
      const raw = JSON.stringify({ version: 1, envelopeExtension: ["keep"], reports: [report] }, null, 2); values.set(STORAGE_KEY, raw);
      const store = new DemoStore(); store.hydrate(); rentalInformationIssues(store.getSnapshot().reports[0].details);
      expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
      expect(store.getSnapshot().reports[0].details).not.toHaveProperty("rentalInformation");
    }
    const store = new DemoStore(); store.hydrate(); const id = store.createReport();
    expect(store.getSnapshot().reports.find(r => r.id === id)!.details).not.toHaveProperty("rentalInformation");
  });

  test("successful edits preserve unknown keys at every level and all unrelated reports", () => {
    const original = extendedRentalDocument(); values.set(STORAGE_KEY, JSON.stringify(original, null, 2));
    const store = new DemoStore(); store.hydrate();
    store.updateReport("rental-case", r => ({ ...r, details: { ...r.details, rentalInformation: { ...r.details.rentalInformation, representation: { ...r.details.rentalInformation?.representation, nameSource: "recorder" } } } }));
    store.updateReport("rental-case", r => ({ ...r, details: { ...r.details, inspectionContext: "standalone" } }));
    store.updateReport("rental-case", r => ({ ...r, details: { ...r.details, rentalInformation: { ...r.details.rentalInformation, landlordNames: "" } } }));
    const saved = JSON.parse(values.get(STORAGE_KEY)!);
    const expected = structuredClone(original);
    Object.assign(expected.reports[0].details, { inspectionContext: "standalone" });
    expected.reports[0].details.rentalInformation!.representation!.nameSource = "recorder";
    expected.reports[0].details.rentalInformation!.landlordNames = "";
    expected.reports[0].updatedAt = saved.reports[0].updatedAt;
    expect(saved).toEqual(expected); expect(values.get("unrelated-key")).toBe("unchanged");
    const reload = new DemoStore(); reload.hydrate(); expect(reload.getSnapshot().reports).toEqual(saved.reports);
  });

  test("failed writes, rejected mutations and retry retain the envelope and complete pending edits", () => {
    const original = extendedRentalDocument(); const raw = JSON.stringify(original); values.set(STORAGE_KEY, raw);
    const store = new DemoStore(); store.hydrate(); failWrite = true;
    store.updateReport("rental-case", r => ({ ...r, details: { ...r.details, rentalInformation: { ...r.details.rentalInformation, leaseReference: "PENDING 0007" } } }));
    expect(store.getSnapshot().status).toBe("error"); expect(values.get(STORAGE_KEY)).toBe(raw);
    expect(store.updateReport("rental-case", r => ({ ...r, details: { ...r.details, rentalInformation: null as never } }))).toBe(false);
    expect(store.getSnapshot().status).toBe("error"); failWrite = false; store.retrySave();
    const saved = JSON.parse(values.get(STORAGE_KEY)!); const expected = structuredClone(original);
    expected.reports[0].details.rentalInformation!.leaseReference = "PENDING 0007"; expected.reports[0].updatedAt = saved.reports[0].updatedAt;
    expect(saved).toEqual(expected); expect(store.getSnapshot().status).toBe("saved");
  });

  test("malformed, unsupported and reserved-key collisions preserve raw data through every recovery attempt", () => {
    for (const raw of ["{bad", "", JSON.stringify({ version: 2, reports: [], future: true }), ...[null, "old extension", [], { representation: { nameSource: "verified" } }, { leaseDate: 42 }].map(rentalInformation => JSON.stringify({ version: 1, reports: [{ ...rentalReport(), details: { ...rentalReport().details, rentalInformation } }], envelopeExtension: ["keep"] }))]) {
      values.set(STORAGE_KEY, raw); const store = new DemoStore(); store.hydrate(); expect(store.getSnapshot().status).toBe("read-error");
      expect(store.createReport()).toBeNull(); store.retrySave();
      expect(store.updateReport("rental-case", r => ({ ...r, details: { ...r.details, rentalInformation: {} } }))).toBe(false);
      expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toEqual([]);
    }
  });
});
