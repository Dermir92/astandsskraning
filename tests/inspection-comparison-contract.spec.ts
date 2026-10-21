import { test, expect } from "@playwright/test";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { EMPTY_OBSERVATION, MAX_REPORTS, isReportList, reportStats, makeRoom, type Observation, type Report } from "../src/lib/model";
import { COPIED_PROPERTY_FIELDS, COPIED_RENTAL_FIELDS, buildInspectionComparison, compareOrdinary, contentFingerprint, initialEligible, sourceContent, validLinkedInitial } from "../src/lib/inspection-comparison";
import { linkedInitialFixture, linkedPair } from "./inspection-comparison-fixtures";
import { legacyCoreReport } from "./inspection-core-fixtures";

test("exact whitelist copies declared context and structure, never assessments or unsupported extensions", async () => {
  const { initial, final } = await linkedPair();
  expect(COPIED_PROPERTY_FIELDS).toEqual(["address", "postalCode", "municipality", "unit", "inspectionContext"]);
  expect(COPIED_RENTAL_FIELDS).toEqual(["landlordNames", "tenantNames", "leaseDate", "leaseReference", "propertyNumber", "premisesDescription", "includedAreasDescription", "excludedAreasDescription"]);
  for (const key of COPIED_PROPERTY_FIELDS) expect(final.details[key]).toBe(initial.details[key]);
  for (const key of COPIED_RENTAL_FIELDS) expect(final.details.rentalInformation?.[key]).toBe(initial.details.rentalInformation?.[key]);
  expect(final.details.inspectionType).toBe("final");
  for (const key of ["role", "recorderName", "inspectionDate", "deliveryDate", "scopeDescription", "scopeLimitations", "notes", "furnished"] as const) expect(final.details[key]).toBe("");
  expect(final.details.rentalInformation?.representation).toBeUndefined(); expect(final.details.fireSafety).toBeUndefined(); expect(final.details.meterReadings).toBeUndefined();
  expect(final.rooms[0].observations).toEqual({}); expect(reportStats(final).recorded).toBe(0);
  expect(final.rooms[0].items.map(i => [i.name, i.kind, i.functionality, i.cleanliness])).toEqual(initial.rooms[0].items.map(i => [i.name, i.kind, i.functionality, i.cleanliness]));
  expect(final.rooms[0].id).not.toBe(initial.rooms[0].id); expect(final.rooms[0].items.every(i => !initial.rooms[0].items.some(a => a.id === i.id))).toBe(true);
  expect(isReportList([initial, final])).toBe(true);
});

test("fingerprint is deterministic, ignores only top-level edit timestamp and detects facts and unknown content", async () => {
  const initial = linkedInitialFixture();
  const before = await contentFingerprint(sourceContent(initial));
  expect(await contentFingerprint(sourceContent({ ...initial, updatedAt: "2026-10-21T10:00:00Z" }))).toBe(before);
  expect(await contentFingerprint({ b: 2, a: { y: 3, x: 4 } })).toBe(await contentFingerprint({ a: { x: 4, y: 3 }, b: 2 }));
  for (const mutate of [(r: Report) => { r.rooms.reverse(); r.details.notes += "!"; }, (r: Report) => { Object.assign(r, { unknown: { retain: true } }); }, (r: Report) => { r.rooms[0].observations.walls.description += "!"; }]) {
    const changed = structuredClone(initial); mutate(changed); expect(await contentFingerprint(sourceContent(changed))).not.toBe(before);
  }
});

test("comparison preserves six meanings and unchanged negative assessments without merging dimensions", () => {
  const item = { id: "a", name: "A", functionality: true, cleanliness: true };
  const complete = { ...EMPTY_OBSERVATION, condition: "damaged" as const, functionality: "broken" as const, cleanliness: "dirty" as const, damageType: "Rispa", location: "Vegg", description: "Sama frávik" };
  const same = compareOrdinary(item, item, complete, complete); expect(same.same).toBe(true); expect(same.labels).toContain("Frávik skráð í lokaskoðun");
  const missing = compareOrdinary(item, item, complete, undefined); expect(missing.same).toBe(false); expect(missing.fields.every(f => f.state === "missing")).toBe(true);
  const limited = compareOrdinary(item, item, complete, { ...complete, condition: "uninspected", functionality: "untested", cleanliness: "uninspected" }); expect(limited.fields.every(f => f.state === "limited")).toBe(true);
  const na = compareOrdinary(item, item, complete, { ...complete, condition: "na" }); expect(na.fields.every(f => f.state === "not_comparable")).toBe(true);
  const wear = compareOrdinary(item, item, complete, { ...complete, condition: "wear", functionality: "works", cleanliness: "clean" }); expect(wear.changed).toBe(true); expect(wear.labels).toContain("Notkunarmerki · mat skráningaraðila");
  expect(compareOrdinary(item, { ...item, functionality: false }, complete, complete).fields.find(f => f.label === "Virkni")?.state).toBe("not_comparable");
  const text = compareOrdinary(item, item, complete, { ...complete, description: "Breyttur texti" }); expect(text.changed).toBe(true); expect(text.labels.join(" ")).toContain("ekki niðurstaða um breytingu á eign");
  const incomplete = compareOrdinary(item, item, complete, { ...complete, description: "" }); expect(incomplete.same).toBe(false); expect(incomplete.labels).toContain("Skráning ófullgerð");
  expect(compareOrdinary(item, item, complete, { ...complete, condition: "defect", description: "" }).changed).toBe(true);
});

const negative: Observation = { ...EMPTY_OBSERVATION, condition: "damaged", functionality: "broken", cleanliness: "dirty", damageType: "Rispa", location: "Við hurð", description: "Sama frávik" };
const good: Observation = { ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean" };
const textDifference = "Textamunur til yfirferðar · ekki niðurstaða um breytingu á eign";
const classificationCases = [
  { name: "complete initial damage and entirely unanswered final", initial: negative, final: { ...EMPTY_OBSERVATION }, fields: ["missing", "missing", "missing"], text: ["missing", "missing", "missing"], labels: ["Upplýsingar vantar"], changed: false, same: false },
  { name: "initial good with a note and absent final", initial: { ...good, note: "Upphafsathugasemd" }, final: undefined, fields: ["missing", "missing", "missing"], text: ["missing"], labels: ["Upplýsingar vantar"], changed: false, same: false },
  { name: "final damage with incomplete supporting description", initial: negative, final: { ...negative, description: "" }, fields: ["same", "same", "same"], text: ["missing", "missing", "missing"], labels: ["Skráning ófullgerð", "Frávik skráð í lokaskoðun"], changed: false, same: false },
  { name: "initial damage to explicitly good final without applicable defect prose", initial: negative, final: good, fields: ["changed", "changed", "changed"], text: ["not_comparable", "not_comparable", "not_comparable"], labels: ["Skráður munur til yfirferðar"], changed: true, same: false },
  { name: "complete compatible answers with genuinely different active notes", initial: { ...good, note: "Upphafsathugasemd" }, final: { ...good, note: "Lokaathugasemd" }, fields: ["same", "same", "same"], text: ["changed"], labels: [textDifference], changed: true, same: false },
  { name: "two complete identical negative assessments", initial: negative, final: negative, fields: ["same", "same", "same"], text: ["same", "same", "same"], labels: ["Engin breyting skráð", "Frávik skráð í lokaskoðun"], changed: false, same: true },
];
for (const scenario of classificationCases) {
  test(`ordinary classification: ${scenario.name}`, async () => {
    const { initial, final } = await linkedPair(true);
    const initialItem = initial.rooms[0].items[0], finalItem = final.rooms[0].items[0];
    Object.assign(initialItem, { functionality: true, cleanliness: true }); Object.assign(finalItem, { functionality: true, cleanliness: true });
    initial.rooms[0].observations[initialItem.id] = structuredClone(scenario.initial);
    if (scenario.final) final.rooms[0].observations[finalItem.id] = structuredClone(scenario.final);
    else delete final.rooms[0].observations[finalItem.id];
    final.linkedInitial!.sourceFingerprint = await contentFingerprint(sourceContent(initial));
    const direct = compareOrdinary(initialItem, finalItem, scenario.initial, scenario.final);
    expect(direct.fields.map(f => f.label)).toEqual(["Ástand", "Virkni", "Þrif"]);
    expect(direct.fields.map(f => f.state)).toEqual(scenario.fields);
    expect(direct.text.map(f => f.label)).toEqual(scenario.name.includes("note") ? ["Athugasemd"] : ["Tegund fráviks", "Staðsetning", "Lýsing"]);
    expect(direct.text.map(f => f.state)).toEqual(scenario.text);
    expect(direct.labels).toEqual(scenario.labels); expect(direct.changed).toBe(scenario.changed); expect(direct.same).toBe(scenario.same);
    if (scenario.final === good) expect(direct.text.map(f => f.final)).toEqual(["Á ekki við", "Á ekki við", "Á ekki við"]);
    const comparison = await buildInspectionComparison(final, [initial, final]);
    expect(comparison?.status).toBe("ready");
    expect(comparison?.items.find(i => i.finalItem?.id === finalItem.id)).toMatchObject(direct);
    expect(comparison?.items.filter(i => i.changed)).toHaveLength(scenario.changed ? 1 : 0);
    expect(comparison?.items.filter(i => i.same)).toHaveLength(scenario.same ? 2 : 1);
  });
}

test("unlinked, inactive, missing and ambiguous sources never manufacture comparisons", async () => {
  const { initial, final } = await linkedPair();
  expect(await buildInspectionComparison(initial, [initial])).toBeNull();
  expect((await buildInspectionComparison(final, []))?.status).toBe("unavailable");
  expect((await buildInspectionComparison(final, [initial, initial]))?.status).toBe("unavailable");
  const inactive = structuredClone(final); inactive.details.inspectionType = "independent";
  expect((await buildInspectionComparison(inactive, [initial, inactive]))?.status).toBe("inactive");
  initial.rooms[0].items.push(initial.rooms[0].items[0]); expect(initialEligible(initial)).toBe(false);
  expect((await buildInspectionComparison(final, [initial, final]))?.items).toEqual([]);
});

test("source and context changes suppress all classifications; reads preserve source bytes and timestamps", async () => {
  const { initial, final } = await linkedPair(true); const before = JSON.stringify([initial, final]);
  expect((await buildInspectionComparison(final, [initial, final]))?.status).toBe("ready"); expect(JSON.stringify([initial, final])).toBe(before);
  initial.rooms[0].observations.walls.condition = "good";
  const changed = await buildInspectionComparison(final, [initial, final]); expect(changed?.status).toBe("changed"); expect(changed?.items).toEqual([]);
  final.linkedInitial!.sourceFingerprint = changed!.sourceFingerprint!;
  final.details.rentalInformation!.leaseReference = "OTHER";
  expect((await buildInspectionComparison(final, [initial, final]))?.status).toBe("changed");
});

test("names and order do not rematch; unmatched targets and heating stay explicit", async () => {
  const { initial, final } = await linkedPair(true); final.rooms[0].name = "Endurnefnd stofa"; final.rooms[0].items.reverse();
  const data = await buildInspectionComparison(final, [initial, final]); expect(data?.items.find(i => i.finalItem?.name === "Veggir")?.same).toBe(true);
  expect(data?.items.find(i => i.finalItem?.kind)?.same).toBe(false);
  final.rooms.push(makeRoom("living", "Stofa", "new-room"));
  const added = await buildInspectionComparison(final, [initial, final]); expect(added?.items.filter(i => i.finalRoom?.id === "new-room").every(i => !i.initialItem && !i.same)).toBe(true);
});

test("dates qualify comparison rather than claiming verified event order", async () => {
  const { initial, final } = await linkedPair(true);
  final.details.inspectionDate = "2026-01-01"; expect((await buildInspectionComparison(final, [initial, final]))?.dateNotice).toContain("á undan");
  final.details.inspectionDate = "invalid"; expect((await buildInspectionComparison(final, [initial, final]))?.dateNotice).toContain("ógild");
  final.details.inspectionDate = ""; expect((await buildInspectionComparison(final, [initial, final]))?.dateNotice).toContain("vantar");
});

test("matching unexamined and N/A are never unchanged; retained prose is not a current difference", () => {
  const item = { id: "item", name: "Atriði" };
  for (const condition of ["na", "uninspected"] as const) { const observation = { ...EMPTY_OBSERVATION, condition }; expect(compareOrdinary(item, item, observation, observation).same).toBe(false); }
  for (const [condition, state] of [["na", "not_comparable"], ["uninspected", "limited"]] as const) {
    const a = { ...EMPTY_OBSERVATION, condition, note: "Fyrri athugasemd" };
    const result = compareOrdinary(item, item, a, { ...a, note: "Ný athugasemd" });
    expect(result.text[0].state).toBe(state); expect(result.changed).toBe(false); expect(result.same).toBe(false);
  }
  const untested = { ...good, functionality: "untested" as const, note: "Fyrri athugasemd" };
  const limited = compareOrdinary({ ...item, functionality: true }, { ...item, functionality: true }, untested, { ...untested, note: "Ný athugasemd" });
  expect(limited.text[0].state).toBe("limited"); expect(limited.changed).toBe(false); expect(limited.same).toBe(false);
  const a = { ...EMPTY_OBSERVATION, condition: "good" as const, description: "Óvirkur texti A" };
  expect(compareOrdinary(item, item, a, { ...a, description: "Óvirkur texti B" }).changed).toBe(false);
  expect(compareOrdinary({ ...item, functionality: true }, { ...item, functionality: true }, { ...a, functionality: "na" }, { ...a, functionality: "na" }).same).toBe(false);
});

test.describe("validated linked store", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let values: Map<string, string>, writes: number, fail: boolean;
  test.beforeEach(() => { values = new Map(); writes = 0; fail = false; Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { writes++; if (fail) throw Error("Synthetic quota"); values.set(k, v); } } }); });
  test.afterEach(() => { if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else Reflect.deleteProperty(globalThis, "localStorage"); });
  function storeWith(reports = [linkedInitialFixture()]) { values.set(STORAGE_KEY, JSON.stringify({ version: 1, extension: { sentinel: "keep" }, reports }, null, 2)); const store = new DemoStore(); store.hydrate(); return store; }
  test("atomic creation is idempotent under concurrent repeated activation and preserves unknown data", async () => {
    const source = linkedInitialFixture(); Object.assign(source, { extra: { x: true } }); Object.assign(source.details, { extra: "not copied" });
    const store = storeWith([source]); const hash = await contentFingerprint(sourceContent(source)); const before = JSON.stringify(store.getSnapshot().reports[0]);
    const [a,b] = await Promise.all([store.createLinkedFinal(source.id, hash, "operation"), store.createLinkedFinal(source.id, hash, "operation")]);
    expect(a).toBeTruthy(); expect(b).toBe(a); expect(writes).toBe(1); expect(store.getSnapshot().reports).toHaveLength(2);
    expect(JSON.stringify(store.getSnapshot().reports[1])).toBe(before); expect(JSON.parse(values.get(STORAGE_KEY)!).extension).toEqual({ sentinel: "keep" });
    expect(store.getSnapshot().reports[0]).not.toHaveProperty("extra"); expect(store.getSnapshot().reports[0].details).not.toHaveProperty("extra");
    const reload = new DemoStore(); reload.hydrate(); expect(reload.getSnapshot().status).toBe("saved"); expect(writes).toBe(1);
  });
  test("legacy reads and unrelated edits do not migrate reports or manufacture links", async () => {
    const store = storeWith([legacyCoreReport()]); const raw = values.get(STORAGE_KEY); expect(writes).toBe(0); expect(values.get(STORAGE_KEY)).toBe(raw);
    const report = store.getSnapshot().reports[0]; expect(report.linkedInitial).toBeUndefined();
    const id = await store.createLinkedFinal(report.id, await contentFingerprint(sourceContent(report)), "legacy"); expect(id).toBeTruthy(); expect(JSON.stringify(store.getSnapshot().reports[1])).toBe(JSON.stringify(report));
  });
  test("failed writes retain exactly one memory draft and retry the same association", async () => {
    const store = storeWith(); const source = store.getSnapshot().reports[0]; const raw = values.get(STORAGE_KEY); fail = true;
    const id = await store.createLinkedFinal(source.id, await contentFingerprint(sourceContent(source)), "quota"); expect(id).toBeTruthy(); expect(store.getSnapshot().status).toBe("error"); expect(values.get(STORAGE_KEY)).toBe(raw);
    const pending = JSON.stringify(store.getSnapshot().reports); const count = writes;
    await buildInspectionComparison(store.getSnapshot().reports[0], store.getSnapshot().reports); expect(writes).toBe(count); expect(store.getSnapshot().status).toBe("error");
    fail = false; store.retrySave(); expect(store.getSnapshot().status).toBe("saved"); expect(JSON.stringify(store.getSnapshot().reports)).toBe(pending);
  });
  test("protected, capped and stale-source creation does not write a partial report", async () => {
    values.set(STORAGE_KEY, "broken"); const protectedStore = new DemoStore(); protectedStore.hydrate(); expect(await protectedStore.createLinkedFinal("x", "x", "protected")).toBeNull(); expect(values.get(STORAGE_KEY)).toBe("broken"); expect(writes).toBe(0);
    const source = linkedInitialFixture(); const capped = storeWith(Array.from({ length: MAX_REPORTS }, (_, i) => ({ ...source, id: `initial-${i}` })));
    expect(await capped.createLinkedFinal("initial-0", await contentFingerprint(sourceContent(capped.getSnapshot().reports[0])), "capped")).toBeNull(); expect(writes).toBe(0);
    const store = storeWith(); const before = values.get(STORAGE_KEY); expect(await store.createLinkedFinal(source.id, "0".repeat(64), "stale")).toBeNull(); expect(values.get(STORAGE_KEY)).toBe(before);
  });
  test("reconfirmation uses a current guard, preserves final answers and never rebuilds associations", async () => {
    const pair = await linkedPair(true); const store = storeWith([pair.initial, pair.final]);
    store.updateReport(pair.initial.id, r => ({ ...r, details: { ...r.details, notes: "Changed source" } }));
    const report = store.getSnapshot().reports.find(r => r.id === pair.final.id)!; const maps = JSON.stringify(report.linkedInitial!.rooms), answers = JSON.stringify(report.rooms);
    const compare = await buildInspectionComparison(report, store.getSnapshot().reports); const count = writes;
    expect(await store.reconfirmInitial(report.id, "0".repeat(64), compare!.finalContextFingerprint!)).toBe(false); expect(writes).toBe(count);
    expect(await store.reconfirmInitial(report.id, compare!.sourceFingerprint!, compare!.finalContextFingerprint!)).toBe(true);
    const after = store.getSnapshot().reports.find(r => r.id === report.id)!; expect(JSON.stringify(after.linkedInitial!.rooms)).toBe(maps); expect(JSON.stringify(after.rooms)).toBe(answers);
  });
  test("deleting then recreating the same final IDs permanently retires associations", async () => {
    const pair = await linkedPair(true); const store = storeWith([pair.initial, pair.final]); const room = pair.final.rooms[0], item = room.items[0];
    store.updateRoom(pair.final.id, room.id, r => ({ ...r, items: r.items.filter(i => i.id !== item.id) }));
    store.updateRoom(pair.final.id, room.id, r => ({ ...r, items: [...r.items, item] }));
    let final = store.getSnapshot().reports.find(r => r.id === pair.final.id)!;
    expect(final.linkedInitial!.rooms[0].items[0].retired).toBe(true); expect((await buildInspectionComparison(final, store.getSnapshot().reports))?.items.find(i => i.finalItem?.id === item.id)?.initialItem).toBeUndefined();
    store.removeRoom(final.id, room.id); store.updateReport(final.id, r => ({ ...r, rooms: [...r.rooms, room] })); final = store.getSnapshot().reports.find(r => r.id === pair.final.id)!;
    expect(final.linkedInitial!.rooms[0].retired).toBe(true); expect((await buildInspectionComparison(final, store.getSnapshot().reports))?.items.every(i => !i.initialItem || !i.finalItem)).toBe(true);
    store.updateReport(pair.initial.id, r => ({ ...r, details: { ...r.details, notes: "Current source" } }));
    const changed = await buildInspectionComparison(final, store.getSnapshot().reports);
    expect(await store.reconfirmInitial(final.id, changed!.sourceFingerprint!, changed!.finalContextFingerprint!)).toBe(true);
    const reload = new DemoStore(); reload.hydrate(); final = reload.getSnapshot().reports.find(r => r.id === pair.final.id)!;
    expect(final.linkedInitial!.rooms[0].retired).toBe(true); expect((await buildInspectionComparison(final, reload.getSnapshot().reports))?.items.every(i => !i.initialItem || !i.finalItem)).toBe(true);
  });
  test("unknown link, pair and observation extensions survive ordinary edits and reconfirmation", async () => {
    const pair = await linkedPair(true); Object.assign(pair.final.linkedInitial!, { extension: { keep: "link" } }); Object.assign(pair.final.linkedInitial!.rooms[0], { extension: "room" }); Object.assign(pair.final.linkedInitial!.rooms[0].items[0], { extension: "item" });
    const store = storeWith([pair.initial, pair.final]); const initialBytes = JSON.stringify(store.getSnapshot().reports[0]);
    store.updateReport(pair.final.id, r => ({ ...r, details: { ...r.details, notes: "Fresh final note" } }));
    expect(JSON.stringify(store.getSnapshot().reports[0])).toBe(initialBytes);
    const reload = new DemoStore(); reload.hydrate(); const final = reload.getSnapshot().reports.find(r => r.id === pair.final.id)!;
    expect(final.linkedInitial).toEqual(pair.final.linkedInitial);
  });
  test("link validators reject unsupported shape without overwriting raw storage", async () => {
    const pair = await linkedPair(); expect(validLinkedInitial(pair.final.linkedInitial)).toBe(true);
    expect(validLinkedInitial({ ...pair.final.linkedInitial, version: 2 })).toBe(false);
    const invalid = { ...pair.final, linkedInitial: { ...pair.final.linkedInitial, sourceFingerprint: "invalid" } };
    const raw = JSON.stringify({ version: 1, reports: [invalid] }); values.set(STORAGE_KEY, raw); const store = new DemoStore(); store.hydrate(); expect(store.getSnapshot().status).toBe("read-error"); expect(values.get(STORAGE_KEY)).toBe(raw); expect(writes).toBe(0);
  });
});
