import { test, expect } from "@playwright/test";
import { buildReportPreview, type ReportPreview } from "../src/lib/report-preview";
import { CONDITIONS, FUNCTIONALITIES, CLEANLINESS, EMPTY_OBSERVATION, isReportList, reportStats, requiresDamage, observationComplete, needsAttention, type Report } from "../src/lib/model";
import { itemProgress, missingAnswers } from "../src/lib/inspection-navigation";
import { heatingState } from "../src/lib/heating";
import { fireState } from "../src/lib/fire-observations";
import { meterState, meterContextCurrent } from "../src/lib/meter-readings";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { legacyCoreReport } from "./inspection-core-fixtures";
import { previewReport, previewDate, freezePreviewInput, longPreviewText } from "./report-preview-fixtures";

const build = (report: Report, photos = {}) => buildReportPreview({ report: freezePreviewInput(report), photos: freezePreviewInput(photos), today: previewDate });
const all = (p: ReportPreview) => [p.property, ...(p.rental ? [p.rental] : []), p.fire, p.meters, ...p.rooms, ...p.rooms.flatMap(r => r.items)];

test("adapter preserves frozen source bytes, legacy unknowns, real metadata and complete source prose", () => {
  for (const report of [legacyCoreReport(), previewReport(), previewReport("incomplete"), previewReport("limited")]) {
    const before = JSON.stringify(report); const p = build(report);
    expect(JSON.stringify(report)).toBe(before);
    expect(p.stats).toEqual(reportStats(report));
    expect(p.rooms.flatMap(r => r.items)).toHaveLength(p.stats.total);
    expect(p.findings).toHaveLength(p.stats.deviations);
    if (report.id === "core-legacy") { expect(p.date).toBe("Óskráð"); expect(p.recorder).toBe("Óskráð"); expect(p.rentalActive).toBe(false); expect(p.property.fields.find(f => f.key === "inspectionContext")?.state).toBe("unanswered"); expect(p.property.fields.find(f => f.key === "scopeLimitations")?.state).toBe("unanswered"); }
    else if (report.details.inspectionDate) expect(p.date).toBe("18. okt. 2026");
  }
  expect(JSON.stringify(build(previewReport()))).toContain(longPreviewText.replaceAll("\n", "\\n"));
});

test("all ordinary assessments retain domain parity including out-of-checklist values and N/A", () => {
  const r = previewReport(); r.rooms = [r.rooms[0]]; r.rooms[0].items = [{ id: "item", name: "Atriði", functionality: true, cleanliness: true }];
  const item = r.rooms[0].items[0];
  for (const condition of [undefined, ...CONDITIONS]) for (const functionality of [undefined, ...FUNCTIONALITIES]) for (const cleanliness of [undefined, ...CLEANLINESS]) {
    const o = { ...EMPTY_OBSERVATION, condition, functionality, cleanliness, description: "Varðveitt lýsing", note: "Hlutlaus athugasemd" };
    const report = structuredClone(r); report.rooms[0].observations = { item: o };
    const p = build(report); const row = p.rooms[0].items[0];
    expect(row.complete).toBe(observationComplete(item, o)); expect(row.attention).toBe(needsAttention(item, o)); expect(row.progress).toBe(itemProgress(item, o));
    expect(p.findings).toHaveLength(reportStats(report).deviations);
    expect(row.issues.filter(i => i.categories.includes("missing")).map(i => i.field)).toEqual(missingAnswers(item, o).map(i => i.key));
    expect(row.fields.some(f => f.key === "description")).toBe(requiresDamage(o, item));
    if (condition === "na") expect(row.fields.filter(f => f.key === "functionality" || f.key === "cleanliness").every(f => f.value === "Á ekki við")).toBe(true);
  }
  const unusual = structuredClone(r); unusual.rooms[0].items[0] = { id: "item", name: "Atriði" }; unusual.rooms[0].observations.item = { ...EMPTY_OBSERVATION, condition: "good", functionality: "broken", cleanliness: "dirty" };
  const p = build(unusual); expect(p.stats.deviations).toBe(1); expect(p.rooms[0].items[0].fields.find(f => f.key === "functionality")?.qualification).toContain("utan matsþátta");
});

test("context and dates never invent events, rental identities, required optional fields or lease association", () => {
  for (const context of [undefined, "", "standalone", "residential_rental"] as const) for (const type of ["", "initial", "final", "independent"] as const) {
    const r = previewReport(); r.details.inspectionContext = context; r.details.inspectionType = type; r.details.inspectionDate = "2099-01-01"; r.details.recorderName = "";
    r.details.rentalInformation = { leaseDate: "2026-02-30", leaseReference: "Valid reference", representation: { nameSource: "recorder", name: "Inactive alternative", representedParty: "tenant" } };
    const p = build(r);
    expect(p.date).toBe("1. jan. 2099"); expect(p.recorder).toBe("Óskráð");
    expect(p.issues.find(i => i.field === "inspectionDate")?.categories).toContain("data_review");
    expect(p.rentalActive).toBe(context === "residential_rental");
    expect(p.rental!.fields.some(f => f.key === "landlordNames")).toBe(context === "residential_rental");
    expect(p.rental!.retained.find(f => f.key === "representation.alternativeName")?.raw).toBe("Inactive alternative");
    expect(p.rental!.issues.some(i => i.field === "rentalLeaseDate")).toBe(context === "residential_rental");
    expect(p.rental!.issues.some(i => i.field === "rentalLeaseReference")).toBe(false);
  }
});

test("fire parent gates, mixed rows, optional omissions and issue categories follow existing helpers", () => {
  for (const examination of [undefined, "examined", "partly_examined", "not_examined", "unknown"] as const) for (const presence of [undefined, "observed", "none_observed", "unknown"] as const) {
    const r = previewReport(); const g = r.details.fireSafety!.smokeDetectors!; g.examination = examination; g.presence = presence;
    const p = build(r); const s = fireState(r.details);
    expect(p.issues.filter(i => i.categories.includes("concern"))).toHaveLength(s.concerns.length);
    const group = p.fire.children[0];
    const row = group.children[1];
    expect(row.fields.some(f => f.key === "testResult")).toBe((examination === "examined" || examination === "partly_examined") && presence === "observed");
  }
  const r = previewReport(); const first = r.details.fireSafety!.smokeDetectors!.entries![0]; delete first.location; delete first.observedCount; delete r.details.fireSafety!.smokeDetectors!.examinedDescription;
  r.details.fireSafety!.extinguishers!.entries![0].serviceLabel = { status: "unreadable", observedText: "Retained label" };
  const p = build(r); const concerns = p.issues.filter(i => i.categories.includes("concern")).toSorted((a,b) => a.priority-b.priority);
  expect(concerns[0].field).toBe("testResult");
  expect(p.issues.filter(i => ["observedCount", "location", "examinedDescription"].includes(i.field) && i.categories.includes("limitation")).every(i => !i.task)).toBe(true);
  expect(p.issues.filter(i => i.field === "labelStatus")).toHaveLength(1);
  expect(p.issues.find(i => i.field === "labelStatus")!.categories).toEqual(expect.arrayContaining(["concern", "limitation"]));
  expect(p.fire.children[1].children[0].retained.find(f => f.key === "labelText")!.raw).toBe("Retained label");
});

test("heating visibility, source, operation and factual responses never create automatic defects", () => {
  for (const visibility of [undefined, "visible_parts", "reported_concealed", "none_visible", "not_examined", "unknown"] as const) for (const operation of [undefined, "tried", "not_tried", "unknown"] as const) for (const response of [undefined, "observed", "none_observed", "mixed", "unknown"] as const) {
    const r = previewReport("limited"); const room = r.rooms[0]; const item = room.items.find(i => i.kind === "space_heating")!;
    const o = { ...EMPTY_OBSERVATION, description: "Inactive defect", heating: { visibility, operation, response, equipment: ["radiators" as const], visibleCondition: "good" as const, scope: "Visible part", informationSource: "Self-declared source", action: "Turned control", responseDescription: "Factual response" } };
    room.observations[item.id] = o; const p = build(r); const row = p.rooms[0].items.find(i => i.kind === "heating")!; const h = heatingState(o);
    expect(row.complete).toBe(h.complete); expect(row.deviation).toBe(h.defect); expect(row.limited).toBe(h.limitations.length > 0);
    expect(row.fields.some(f => f.key === "response")).toBe(operation === "tried");
    expect(row.fields.some(f => f.key === "informationSource")).toBe(visibility === "visible_parts" || visibility === "reported_concealed");
    expect(row.retained.some(f => f.key === "description")).toBe(true);
  }
});

test("meter purpose, arrangement, participation, raw values and current-context safeguards are exact", () => {
  for (const mode of [undefined, "inactive", "optional", "rental_initial", "rental_return"] as const) for (const arrangement of [undefined, "separate", "shared", "no_meter", "unknown", "not_examined"] as const) for (const selected of [false, true]) {
    const r = previewReport("limited");
    r.details.meterReadings = { mode, factsPurpose: "rental_initial", electricity: { optionalCapture: selected, applicability: arrangement, factsApplicability: "separate", readingStatus: "recorded", readingValue: " 001,20 ", unit: " kWh ", readingDate: "2026-02-30", meterIdentifier: "Optional ID" } };
    const p = build(r); const m = meterState(r.details, previewDate); const row = p.meters.children[0];
    expect(row.source).toMatchObject({ kind: "meters", reportId: r.id, utility: "electricity" });
    expect(p.meters.children[1].source).toMatchObject({ utility: "hotWater" });
    expect(p.issues.filter(i => i.anchor === p.meters.anchor || p.meters.children.some(r => r.anchor === i.anchor)).filter(i => i.task)).toHaveLength(m.issues.length);
    const expected = m.participating.includes("electricity") && (arrangement === "separate" || arrangement === "shared") && meterContextCurrent(r.details, "electricity");
    expect(row.fields.some(f => f.key === "readingValue")).toBe(expected);
    expect([...row.fields, ...row.retained].find(f => f.key === "readingValue")!.raw).toBe(" 001,20 ");
  }
  for (const status of [undefined, "recorded", "not_read", "unreadable", "inaccessible", "unknown"] as const) {
    const r = previewReport(); r.details.meterReadings!.electricity!.readingStatus = status;
    const p = build(r); const row = p.meters.children[0]; expect(row.fields.some(f => f.key === "readingValue")).toBe(status === "recorded");
  }
  const r = previewReport(); delete r.details.meterReadings; expect(build(r).meters.issues.filter(i => i.task)).toEqual([]);
});

test("an explicit heating defect is indexed once while nondefect response observations remain distinct", () => {
  for (const visibleCondition of ["good", "damaged"] as const) {
    const r = previewReport("limited");
    r.rooms[0].observations["space-heating"] = { ...EMPTY_OBSERVATION, damageType: "Sýnileg skemmd", location: "Við ofn", description: "Uppgefin lýsing á sýnilegu yfirborði", heating: { visibility: "visible_parts", equipment: ["radiators"], visibleCondition, operation: "tried", action: "Hitastilli snúið", response: "mixed", responseDescription: "Ólík viðbrögð við skráða tilraun" } };
    const p = build(r);
    expect(p.findings).toHaveLength(visibleCondition === "damaged" ? 1 : 0);
    expect(p.responses).toHaveLength(visibleCondition === "damaged" ? 0 : 1);
    expect(p.rooms[0].items.find(i => i.kind === "heating")!.fields.find(f => f.key === "response")?.raw).toBe("mixed");
  }
});

test("photos use exact compound associations and first appearance references without altering URLs", () => {
  const r = previewReport(); const key = `${r.id}:${r.rooms[0].id}:overview`; const key2 = `${r.id}:${r.rooms[1].id}:floor`;
  const photos = { [key]: [{ id: "one", name: "same.png", url: "blob:one" }], [key2]: [{ id: "two", name: "same.png", url: "blob:two" }], [`${r.id}-other:room:floor`]: [{ id: "wrong", name: "wrong.png", url: "blob:wrong" }] };
  const p = build(r, photos); expect(p.photos.map(p => [p.ref, p.url])).toEqual([["M001", "blob:one"], ["M002", "blob:two"]]);
  expect(p.photos[1].source).toMatchObject({ reportId: r.id, roomId: r.rooms[1].id, itemId: "floor" });
  expect(p.photos[0].alt).not.toMatch(/skemmd|sýnir|mynd af/i);
  expect(p.photos.every(p => !Object.hasOwn(p, "available"))).toBe(true);
});

test("ambiguous IDs, delimiter collisions, repeated photo IDs and orphan facts cannot be guessed", () => {
  const r = previewReport(); r.rooms.push(structuredClone(r.rooms[0]));
  const key = `${r.id}:${r.rooms[0].id}:overview`;
  const p = build(r, { [key]: [{ id: "p", url: "blob:x", name: "ambiguous.png" }] });
  expect(p.photos).toHaveLength(0); expect(p.unassignedPhotos).toHaveLength(1); expect(p.rooms[0].reviewHref).toBeUndefined();
  const normal = previewReport(); normal.rooms[0].observations.orphan = { ...EMPTY_OBSERVATION, description: "Retained orphan text", heating: Object.assign({ scope: "Retained known scope" }, { unknownFutureField: "Not interpreted" }) };
  const q = build(normal, { [`${normal.id}:${normal.rooms[0].id}:orphan`]: [{ id: "o", url: "blob:o", name: "orphan.png" }] });
  expect(q.stats.total).toBe(15); expect(q.rooms[0].children[0].retained.find(f => f.key === "description")?.raw).toBe("Retained orphan text"); expect(q.unassignedPhotos).toHaveLength(1);
  expect(q.rooms[0].children[0].retained.find(f => f.key === "heating.scope")?.raw).toBe("Retained known scope");
  expect(q.rooms[0].children[0].retained.some(f => f.raw === "Not interpreted")).toBe(false);
  expect(q.rooms[0].children[0].notes.join(" ")).toContain("Óþekkt gögn");
  const cross = previewReport(); cross.id = "preview-report:preview-room-0"; cross.rooms[0].id = "overview";
  // Actual cross-report collision, built from both reports' target tuples.
  const collisionReport = structuredClone(normal);
  collisionReport.rooms[0].items.push({ id: "overview:overview", name: "Delimiter item" });
  const collision = `${collisionReport.id}:${collisionReport.rooms[0].id}:overview:overview`;
  const crossResult = buildReportPreview({ report: collisionReport, reports: [collisionReport, cross], photos: { [collision]: [{ id: "secret", name: "other-report.png", url: "blob:secret" }] }, today: previewDate });
  expect(crossResult.photos.some(p => p.url === "blob:secret")).toBe(false); expect(crossResult.unassignedPhotos.some(p => p.name === "other-report.png")).toBe(false);
});

test("zero rooms/items and large records preserve totals, complete text, unique anchors and bounded adapter work", () => {
  for (const scenario of ["complete", "limited", "large", "expanded"] as const) {
    const r = previewReport(scenario); expect(isReportList([r])).toBe(true);
    const start = performance.now(); const p = build(r); const elapsed = performance.now() - start;
    expect(p.stats.total).toBe(scenario === "large" ? 84 : scenario === "expanded" ? 100 : 15);
    expect(p.findings).toHaveLength(p.stats.deviations); expect(new Set(all(p).map(r => r.anchor)).size).toBe(all(p).length);
    test.info().annotations.push({ type: "adapter-ms", description: `${scenario}: ${elapsed.toFixed(2)}` });
    if (scenario === "limited") { expect(p.findings).toHaveLength(0); expect(p.limitedItems).toBe(3); expect(p.stats.recorded).toBe(p.stats.total); }
  }
  const r = previewReport(); r.rooms = []; const p = build(r); expect(p.stats.total).toBe(0); expect(p.issues.find(i => i.field === "rooms")).toBeTruthy();
  const empty = previewReport(); empty.rooms = empty.rooms.slice(0,1); empty.rooms[0].items = []; expect(build(empty).rooms[0].issues.some(i => i.field === "items")).toBe(true);
});

test("store hydration and pure preview preserve raw envelope, unrelated data, extensions and pending writes", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const r = previewReport(); const raw = JSON.stringify({ version: 1, extension: { keep: true }, reports: [r, { ...legacyCoreReport(), id: "unrelated" }] }, null, 2);
  let stored = raw; let writes = 0; let fail = false;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => key === STORAGE_KEY ? stored : null, setItem: (_key: string, value: string) => { writes++; if (fail) throw Error("Synthetic quota"); stored = value; } } });
  try {
    const store = new DemoStore(); store.hydrate(); build(store.getSnapshot().reports[0]); expect(writes).toBe(0); expect(stored).toBe(raw);
    fail = true; store.updateReport(r.id, report => ({ ...report, details: { ...report.details, recorderName: "Pending edit" } }));
    const before = JSON.stringify(store.getSnapshot()); const count = writes;
    build(store.getSnapshot().reports[0]); expect(JSON.stringify(store.getSnapshot())).toBe(before); expect(stored).toBe(raw); expect(writes).toBe(count);
    fail = false; store.retrySave(); expect(store.getSnapshot().status).toBe("saved"); expect(JSON.parse(stored).extension).toEqual({ keep: true });
  } finally { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else Reflect.deleteProperty(globalThis, "localStorage"); }
});
