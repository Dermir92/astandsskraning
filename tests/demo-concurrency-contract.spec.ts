import { expect, test } from "@playwright/test";
import { DemoStore } from "../src/components/demo-provider";
import { browserDemoEnvironment, DEMO_RECOVERY_KEY, STORAGE_KEY } from "../src/lib/demo-storage";
import { CloudRequestError, CloudStore, type CloudTransport } from "../src/lib/cloud/store";
import type { SaveReceipt } from "../src/lib/cloud/contracts";
import { buildInspectionComparison, contentFingerprint, sourceContent } from "../src/lib/inspection-comparison";
import { EMPTY_OBSERVATION, type Report } from "../src/lib/model";
import { prepareAssessmentChange } from "../src/components/assessment-change";
import { legacyCoreReport } from "./inspection-core-fixtures";
import { linkedInitialFixture, linkedPair } from "./inspection-comparison-fixtures";
import { ControlledLocks, deferred, demoTab, MemoryStorage } from "./demo-store-helpers";

const stores: DemoStore[] = [];
const documentOf = (reports: Report[]) => JSON.stringify({ version: 1, extension: { keep: [0, false, null] }, reports }, null, 2);
function open(tab: ReturnType<typeof demoTab>) { const store = new DemoStore(undefined, tab.env); stores.push(store); store.hydrate(); return store; }
function setup(reports = [legacyCoreReport()]) {
  const tab = demoTab(); tab.local.values.set(STORAGE_KEY, documentOf(reports));
  return { ...tab, store: open(tab), report: reports[0] };
}
function edit(store: DemoStore, id: string, title: string) { return store.updateReport(id, report => ({ ...report, title })); }
function raw(local: MemoryStorage) { return local.getItem(STORAGE_KEY); }
test.afterEach(() => { stores.splice(0).forEach(store => store.disconnectDemo()); });

test("T01 same report: reader cannot overwrite a writer, including direct mutation calls", () => {
  const a = setup(); const b = open(demoTab(a.local, a.locks));
  expect(a.store.editingAllowed).toBe(true); expect(b.editingAllowed).toBe(false);
  a.store.updateReport(a.report.id, r => ({ ...r, details: { ...r.details, address: "Sýni A" } }));
  const saved = raw(a.local), count = a.local.writes.length;
  expect(b.updateReport(a.report.id, r => ({ ...r, details: { ...r.details, municipality: "Sýni B" } }))).toBe(false);
  expect(raw(a.local)).toBe(saved); expect(a.local.writes).toHaveLength(count);
  expect(b.getSnapshot().status).toBe("read-only");
  expect(JSON.parse(saved!).reports[0].details.address).toBe("Sýni A");
});

test("T02 handoff reads the writer's latest data before granting editing rights", async () => {
  const a = setup(); const b = open(demoTab(a.local, a.locks));
  a.store.updateReport(a.report.id, r => ({ ...r, details: { ...r.details, address: "Sýni A" } }));
  a.store.disconnectDemo(); await Promise.resolve();
  a.locks.paused = true; b.retryDemoAccess(); await Promise.resolve(); await Promise.resolve();
  expect(b.editingAllowed).toBe(false);
  await expect.poll(() => a.locks.pending.length).toBe(1);
  a.locks.grant(); await b.whenReady();
  expect(b.getSnapshot().reports[0].details.address).toBe("Sýni A");
  expect(b.updateReport(a.report.id, r => ({ ...r, details: { ...r.details, municipality: "Sýni B" } }))).toBe(true);
  expect(JSON.parse(raw(a.local)!).reports[0].details).toMatchObject({ address: "Sýni A", municipality: "Sýni B" });
});

test("T03 different reports are serialized at collection scope", async () => {
  const first = legacyCoreReport(), second = { ...legacyCoreReport(), id: "other" };
  const a = setup([first, second]), b = open(demoTab(a.local, a.locks));
  edit(a.store, first.id, "A"); expect(edit(b, second.id, "B")).toBe(false);
  a.store.disconnectDemo(); await Promise.resolve(); b.retryDemoAccess(); await b.whenReady();
  expect(edit(b, second.id, "B")).toBe(true);
  expect(JSON.parse(raw(a.local)!).reports.map((r: Report) => r.title)).toEqual(["A", "B"]);
});

test("T04 controlled simultaneous admission grants exactly one writer in either order", async () => {
  for (const order of [0, 1]) {
    const local = new MemoryStorage(), locks = new ControlledLocks(); locks.paused = true;
    local.values.set(STORAGE_KEY, documentOf([legacyCoreReport()]));
    const pair = [open(demoTab(local, locks)), open(demoTab(local, locks))];
    expect(pair.filter(store => store.editingAllowed)).toHaveLength(0);
    expect(pair.map(store => store.getSnapshot().status)).toEqual(["loading", "loading"]);
    locks.grant(order); locks.grant(); await Promise.all(pair.map(store => store.whenReady()));
    expect(pair.filter(store => store.editingAllowed)).toHaveLength(1);
    expect(pair[order].createReport()).toBeTruthy(); expect(pair[1 - order].createReport()).toBeNull();
    expect(local.writes).toHaveLength(1); expect(locks.maxOwners).toBe(1);
  }
});

test("T05 stale create cannot erase a newly created report", async () => {
  const a = setup(), b = open(demoTab(a.local, a.locks));
  const first = a.store.createReport(); expect(b.createReport()).toBeNull();
  a.store.disconnectDemo(); await Promise.resolve(); b.retryDemoAccess(); await b.whenReady();
  const second = b.createReport(); const ids = JSON.parse(raw(a.local)!).reports.map((r: Report) => r.id);
  expect(ids).toContain(first); expect(ids).toContain(second); expect(new Set(ids).size).toBe(3);
});

test("T06 deletion never resurrects a stale room, item or missing report", async () => {
  const a = setup(), b = open(demoTab(a.local, a.locks)), room = a.report.rooms[0];
  a.store.removeRoom(a.report.id, room.id); b.removeRoom(a.report.id, room.id);
  a.store.disconnectDemo(); await Promise.resolve(); b.retryDemoAccess(); await b.whenReady();
  const count = a.local.writes.length;
  expect(b.updateRoom(a.report.id, room.id, r => ({ ...r, name: "Resurrect" }))).toBe(false);
  b.updateObservation(a.report.id, room.id, "walls", { ...EMPTY_OBSERVATION, note: "Stale" });
  expect(edit(b, "missing", "Resurrect")).toBe(false); expect(a.local.writes).toHaveLength(count);
  expect(JSON.parse(raw(a.local)!).reports[0].rooms).toEqual([]);
  b.disconnectDemo(); await Promise.resolve();
  class FixtureWriter extends DemoStore { replace(reports: Report[]) { return this.persist(reports); } }
  const deletion = new FixtureWriter(undefined, demoTab(a.local, a.locks).env); stores.push(deletion); deletion.hydrate();
  expect(deletion.replace([])).toBe(true); deletion.disconnectDemo(); await Promise.resolve();
  b.hydrate(); await b.whenReady(); const afterDeletion = a.local.writes.length;
  expect(b.getSnapshot().reports).toEqual([]); expect(edit(b, a.report.id, "Resurrect deleted report")).toBe(false);
  expect(a.local.writes).toHaveLength(afterDeletion);
  const c = setup(); c.store.updateRoom(c.report.id, c.report.rooms[0].id, r => ({ ...r, items: [] }));
  const before = raw(c.local); c.store.updateObservation(c.report.id, c.report.rooms[0].id, "walls", EMPTY_OBSERVATION); expect(raw(c.local)).toBe(before);
});

test("T07 failed write retains the exact draft and guarded retry is the only saved transition", () => {
  const a = setup(), before = raw(a.local), statuses: string[] = [];
  a.store.subscribe(() => statuses.push(a.store.getSnapshot().status)); a.local.failWrite = true;
  expect(edit(a.store, a.report.id, "Óvistað" )).toBe(true);
  expect(raw(a.local)).toBe(before); expect(statuses).not.toContain("saved");
  expect(a.store.getSnapshot().status).toBe("error"); expect(a.session.getItem(DEMO_RECOVERY_KEY)).toContain("Óvistað");
  const candidate = a.store.getSnapshot().reports; a.local.failWrite = false; a.store.retrySave();
  expect(a.store.getSnapshot().reports).toBe(candidate); expect(a.store.getSnapshot().status).toBe("saved");
  expect(JSON.parse(raw(a.local)!).reports[0].title).toBe("Óvistað"); expect(a.session.getItem(DEMO_RECOVERY_KEY)).toBeNull();
});

test("T08 retry after any changed base performs zero canonical writes", () => {
  for (const changed of [documentOf([{ ...legacyCoreReport(), title: "Newer" }]), null, "{broken", '{"version":999}']) {
    const a = setup(); a.local.failWrite = true; edit(a.store, a.report.id, "Keep candidate"); a.local.failWrite = false;
    if (changed === null) a.local.values.delete(STORAGE_KEY); else a.local.values.set(STORAGE_KEY, changed);
    const count = a.local.writes.length; a.store.retrySave();
    expect(a.local.writes).toHaveLength(count); expect(raw(a.local)).toBe(changed);
    expect(a.store.getSnapshot().status).toBe("conflict"); expect(a.store.getSnapshot().reports[0].title).toBe("Keep candidate");
  }
});

test("T09 reentrant listeners see the committed base; listener failures do not masquerade as failed writes", () => {
  const a = setup(); let nested = false;
  const unsubscribe = a.store.subscribe(() => { if (!nested) { nested = true; edit(a.store, a.report.id, "Nested" ); } });
  edit(a.store, a.report.id, "Outer"); unsubscribe();
  expect(JSON.parse(raw(a.local)!).reports[0].title).toBe("Nested"); expect(a.store.getSnapshot().reports[0].title).toBe("Nested");
  const stop = a.store.subscribe(() => { throw Error("Synthetic listener"); });
  expect(() => edit(a.store, a.report.id, "Committed" )).toThrow("Synthetic listener"); stop();
  expect(a.store.getSnapshot().status).toBe("saved"); const count = a.local.writes.length; a.store.retrySave(); expect(a.local.writes).toHaveLength(count);
});

test("T10 reload restores a conflict checkpoint without replaying or merging it", async () => {
  const a = setup(); a.local.failWrite = true; edit(a.store, a.report.id, "Recovery candidate"); a.local.failWrite = false;
  const newer = documentOf([{ ...a.report, title: "New canonical" }]); a.local.values.set(STORAGE_KEY, newer);
  a.store.retrySave(); a.store.disconnectDemo(); await Promise.resolve();
  const count = a.local.writes.length, reload = open(demoTab(a.local, a.locks, a.session));
  expect(reload.getSnapshot().reports[0].title).toBe("Recovery candidate"); expect(reload.getSnapshot().status).toBe("recovery");
  expect(reload.editingAllowed).toBe(false); expect(raw(a.local)).toBe(newer); expect(a.local.writes).toHaveLength(count);
  expect(reload.resumeDemoRecovery(reload.demoRecoveryToken())).toBe(false); expect(reload.demoRecoveryJSON()).toContain("Recovery candidate");
});

test("T11 stale checkpoint after successful save is not replayed when cleanup fails", async () => {
  const a = setup(); a.local.failWrite = true; edit(a.store, a.report.id, "Committed after retry");
  a.local.failWrite = false; a.session.failRemove = true; a.store.retrySave();
  expect(a.store.getSnapshot().status).toBe("saved"); expect(a.session.getItem(DEMO_RECOVERY_KEY)).not.toBeNull();
  const count = a.local.writes.length; a.store.disconnectDemo(); await Promise.resolve();
  const reload = open(demoTab(a.local, a.locks, a.session));
  expect(reload.getSnapshot().status).toBe("saved"); expect(reload.demoRecoveryJSON()).toBeNull(); expect(a.local.writes).toHaveLength(count);
});

test("T12 checkpoint failure is visible and never grants a stale recovery confirmation", () => {
  const a = setup(); a.local.failWrite = true; a.session.failWrite = true;
  edit(a.store, a.report.id, "Memory only");
  expect(a.store.getSnapshot().local?.checkpointFailed).toBe(true); expect(a.store.getSnapshot().warning).toContain("Afrit er aðeins í minni");
  const token = a.store.demoRecoveryToken(); edit(a.store, a.report.id, "New memory text");
  expect(a.store.reloadDemoLatest(token)).toBe(false); expect(a.store.demoRecoveryJSON()).toContain("New memory text");
  expect(a.store.getSnapshot().status).toBe("error"); expect(a.session.getItem(DEMO_RECOVERY_KEY)).toBeNull();
});

test("T13 missing, denied, insecure and invalid locks fail closed", async () => {
  for (const variant of ["missing", "denied", "insecure", "invalid"] as const) {
    const tab = demoTab(); tab.local.values.set(STORAGE_KEY, documentOf([legacyCoreReport()]));
    if (variant === "missing") tab.env.locks = () => null;
    if (variant === "insecure") tab.env.secure = () => false;
    if (variant === "denied") tab.locks.fail = true;
    if (variant === "invalid") tab.env.locks = () => ({ request: ((_name: string, _options: unknown, callback: (lock: Lock) => unknown) => Promise.resolve(callback({ name: "wrong", mode: "shared" } as Lock))) as LockManager["request"] });
    const store = open(tab); await store.whenReady();
    expect(store.editingAllowed).toBe(false); expect(store.getSnapshot().status).toBe("unsupported"); expect(store.createReport()).toBeNull();
    expect(edit(store, "core-legacy", "Forbidden")).toBe(false); store.retrySave(); expect(await store.createLinkedFinal("core-legacy", "x", "unsupported")).toBeNull();
    expect(tab.local.writes).toEqual([]);
  }
});

test("T14 corrupt, unsupported and unreadable storage never authorizes replacement", () => {
  for (const value of ["", "{broken", '{"version":2,"reports":[]}', documentOf([{ ...legacyCoreReport(), rooms: undefined } as unknown as Report])]) {
    const tab = demoTab(); tab.local.values.set(STORAGE_KEY, value); const store = open(tab);
    expect(store.getSnapshot().status).toBe("read-error"); expect(store.createReport()).toBeNull(); store.retrySave();
    expect(tab.local.writes).toEqual([]); expect(raw(tab.local)).toBe(value);
  }
  const a = setup(); a.local.failRead = true; expect(edit(a.store, a.report.id, "Retained" )).toBe(true);
  expect(a.store.editingAllowed).toBe(false); expect(a.store.getSnapshot().status).toBe("error");
  a.local.failRead = false; a.store.retrySave(); expect(a.store.getSnapshot().status).toBe("saved");
  const malformedRecovery = setup(); malformedRecovery.store.disconnectDemo(); malformedRecovery.session.values.set(DEMO_RECOVERY_KEY, '{"version":9}');
  const reload = open(demoTab(malformedRecovery.local, new ControlledLocks(), malformedRecovery.session));
  expect(reload.editingAllowed).toBe(false); expect(malformedRecovery.session.getItem(DEMO_RECOVERY_KEY)).toBe('{"version":9}');
});

test("T15 unknown envelope and nested data survive ordinary writes and retry", () => {
  const report = legacyCoreReport();
  Object.assign(report, { extension: [false, 0, null, ""] }); Object.assign(report.details, { future: { keep: true } });
  Object.assign(report.rooms[0], { future: { raw: [0, false] } }); Object.assign(report.rooms[0].items[0], { extension: null });
  Object.assign(report.rooms[0].observations.walls, { future: { raw: "" } });
  const a = setup([report, { ...legacyCoreReport(), id: "unrelated" }]);
  const doc = JSON.parse(raw(a.local)!); doc.revision = { future: "Not our revision" }; a.store.disconnectDemo();
  const local = new MemoryStorage(); local.values.set(STORAGE_KEY, JSON.stringify(doc, null, 2)); const b = open(demoTab(local));
  const before = raw(local); expect(local.writes).toEqual([]); expect(raw(local)).toBe(before);
  local.failWrite = true; edit(b, report.id, "Changed"); local.failWrite = false; b.retrySave();
  const saved = JSON.parse(raw(local)!); expect(saved.revision).toEqual(doc.revision); expect(saved.extension).toEqual(doc.extension);
  expect(saved.reports[1]).toEqual(doc.reports[1]); const expected = { ...doc.reports[0], title: "Changed", updatedAt: saved.reports[0].updatedAt };
  expect(saved.reports[0]).toEqual(expected);
});

test("T16 missing is an exact base; storage notifications cannot authorize writes", () => {
  const tab = demoTab(), store = open(tab); expect(store.getSnapshot().status).toBe("memory"); expect(tab.local.writes).toEqual([]);
  const foreign = documentOf([legacyCoreReport()]); tab.local.values.set(STORAGE_KEY, foreign);
  expect(store.createReport()).toBeTruthy(); expect(store.getSnapshot().status).toBe("conflict"); expect(raw(tab.local)).toBe(foreign); expect(tab.local.writes).toEqual([]);
  const a = setup(), before = a.store.getSnapshot(); a.storageEvent(STORAGE_KEY); expect(a.store.getSnapshot()).toBe(before);
  a.local.values.delete(STORAGE_KEY); a.storageEvent("unrelated"); expect(a.store.getSnapshot()).toBe(before);
  a.storageEvent(null); expect(a.store.editingAllowed).toBe(false); expect(a.store.getSnapshot().status).toBe("refresh-required"); expect(a.local.writes).toEqual([]);
});

test("T17 suspended linked-final cannot survive an ownership epoch, repeated creation stays idempotent", async () => {
  const report = linkedInitialFixture(), a = setup([report]), expected = await contentFingerprint(sourceContent(report));
  const gate = deferred(), digest = crypto.subtle.digest.bind(crypto.subtle);
  const descriptor = Object.getOwnPropertyDescriptor(crypto.subtle, "digest");
  Object.defineProperty(crypto.subtle, "digest", { configurable: true, value: async (...args: Parameters<typeof digest>) => { const value = await digest(...args); await gate.promise; return value; } });
  try {
    const pending = a.store.createLinkedFinal(report.id, expected, "stale");
    a.store.disconnectDemo(); a.store.hydrate(); await a.store.whenReady(); expect(a.store.editingAllowed).toBe(true);
    gate.resolve(); expect(await pending).toBeNull(); expect(a.local.writes).toEqual([]);
  } finally { if (descriptor) Object.defineProperty(crypto.subtle, "digest", descriptor); else Reflect.deleteProperty(crypto.subtle, "digest"); }
  const [one, two] = await Promise.all([a.store.createLinkedFinal(report.id, expected, "same"), a.store.createLinkedFinal(report.id, expected, "same")]);
  expect(one).toBeTruthy(); expect(two).toBe(one); expect(a.local.writes).toHaveLength(1);
});

test("T18 comparison is read-only and suspended reconfirm cannot survive reacquisition", async () => {
  const pair = await linkedPair(true), a = setup([pair.initial, pair.final]);
  edit(a.store, pair.initial.id, "Changed source");
  const final = a.store.getSnapshot().reports[1]; const comparison = await buildInspectionComparison(final, a.store.getSnapshot().reports);
  expect(comparison?.status).toBe("changed"); const count = a.local.writes.length;
  const gate = deferred(), digest = crypto.subtle.digest.bind(crypto.subtle), descriptor = Object.getOwnPropertyDescriptor(crypto.subtle, "digest");
  Object.defineProperty(crypto.subtle, "digest", { configurable: true, value: async (...args: Parameters<typeof digest>) => { const value = await digest(...args); await gate.promise; return value; } });
  try {
    const pending = a.store.reconfirmInitial(final.id, comparison!.sourceFingerprint!, comparison!.finalContextFingerprint!);
    a.store.disconnectDemo(); a.store.hydrate(); await a.store.whenReady(); gate.resolve();
    expect(await pending).toBe(false); expect(a.local.writes).toHaveLength(count);
  } finally { if (descriptor) Object.defineProperty(crypto.subtle, "digest", descriptor); else Reflect.deleteProperty(crypto.subtle, "digest"); }
  expect(await a.store.reconfirmInitial(final.id, comparison!.sourceFingerprint!, comparison!.finalContextFingerprint!)).toBe(true);
  const linked = a.store.getSnapshot().reports[1].linkedInitial; expect(linked?.rooms).toEqual(pair.final.linkedInitial?.rooms);
});

test("T19 single-tab synchronous acceptance, undo and pending validation remain intact", () => {
  const a = setup(), room = a.report.rooms[0];
  const change = prepareAssessmentChange(a.store, { reportId: a.report.id, roomId: room.id, itemId: "walls" }, { condition: "good" });
  expect(change).toBeTruthy(); const undo = change!.apply(); expect(undo).toBeTruthy(); expect(a.store.getSnapshot().reports[0].rooms[0].observations.walls.condition).toBe("good");
  undo!.apply()?.dispose(); expect(a.store.getSnapshot().reports[0].rooms[0].observations.walls.condition).toBe("wear");
  const created = a.store.createReport(); expect(a.store.getSnapshot().reports[0].id).toBe(created);
  a.local.failWrite = true; edit(a.store, a.report.id, "Valid pending"); const candidate = a.store.getSnapshot().reports;
  expect(a.store.updateReport(a.report.id, r => ({ ...r, rooms: Array.from({ length: 101 }, () => room) }))).toBe(false);
  expect(a.store.getSnapshot().reports).toBe(candidate); expect(a.store.getSnapshot().status).toBe("error");
});

test("T20 StrictMode, page transitions and unexpected lock loss never retain authority", async () => {
  const a = setup(); expect(a.listenerCount()).toBe(4); a.store.disconnectDemo(); expect(a.store.editingAllowed).toBe(false); expect(a.listenerCount()).toBe(0);
  a.store.hydrate(); expect(a.store.editingAllowed).toBe(false); await a.store.whenReady(); expect(a.store.editingAllowed).toBe(true);
  expect(a.listenerCount()).toBe(4);
  a.transition("pagehide"); expect(a.store.editingAllowed).toBe(false); a.transition("pageshow"); await a.store.whenReady(); expect(a.store.editingAllowed).toBe(true);
  const epoch = a.store.mutationEpoch;
  a.transition("pageshow"); expect(a.store.editingAllowed).toBe(false);
  await a.store.whenReady(); expect(a.store.editingAllowed).toBe(true); expect(a.store.mutationEpoch).toBeGreaterThan(epoch);
  a.locks.lose(); await expect.poll(() => a.store.editingAllowed).toBe(false);
  expect(edit(a.store, a.report.id, "Cannot write" )).toBe(false);
  const tab = demoTab(); tab.locks.paused = true; const stale = open(tab); stale.disconnectDemo(); tab.locks.grant(); await stale.whenReady(); expect(stale.editingAllowed).toBe(false); expect(tab.local.writes).toEqual([]);
  const sameTab = demoTab(), one = open(sameTab), two = open(sameTab);
  expect(one.editingAllowed).toBe(true); expect(two.editingAllowed).toBe(false); expect(sameTab.listenerCount()).toBe(8);
  one.disconnectDemo(); expect(sameTab.listenerCount()).toBe(4); two.disconnectDemo(); expect(sameTab.listenerCount()).toBe(0);
});

test("T21 unsubmitted UI text blocks view replacement and beforeunload warns", async () => {
  const a = setup(), initialToken = a.store.demoRecoveryToken(); a.store.setDemoUiDraft("custom-room", "Óstofnað rými");
  const before = a.store.getSnapshot().reports; a.local.values.set(STORAGE_KEY, documentOf([])); a.storageEvent(STORAGE_KEY);
  expect(a.store.reloadDemoLatest(a.store.demoRecoveryToken())).toBe(false); expect(a.store.getSnapshot().reports).toBe(before);
  const event = new Event("beforeunload", { cancelable: true }); a.events.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
  a.store.setDemoUiDraft("custom-room", ""); expect(a.store.demoRecoveryToken()).not.toBe(initialToken);
  expect(a.store.reloadDemoLatest(a.store.demoRecoveryToken())).toBe(true); expect(a.store.getSnapshot().reports).toEqual([]);
  const unreadable = demoTab(); unreadable.local.values.set(STORAGE_KEY, "broken"); const fallback = open(unreadable);
  fallback.setDemoUiDraft("custom-room", "Keep unsubmitted fallback text");
  const fixtures = fallback.getSnapshot().reports; unreadable.local.values.delete(STORAGE_KEY);
  unreadable.transition("pageshow"); await fallback.whenReady();
  expect(fallback.getSnapshot().reports).toBe(fixtures); expect(fallback.getSnapshot().local?.unsubmitted).toBe(true);
  expect(fallback.editingAllowed).toBe(false); expect(unreadable.local.writes).toEqual([]);
});

test("T22 conflict and rejected mutations preserve existing temporary photos and export excludes them", () => {
  const a = setup(), key = `${a.report.id}:${a.report.rooms[0].id}:overview`, photo = { id: "photo", url: "blob:synthetic-photo", name: "Sýnismynd" };
  expect(a.store.addPhoto(key, photo)).toBe(true);
  a.local.failWrite = true; edit(a.store, a.report.id, "Candidate"); a.local.failWrite = false;
  a.local.values.set(STORAGE_KEY, documentOf([])); a.storageEvent(STORAGE_KEY);
  const before = a.store.getSnapshot().photos, originalRevoke = URL.revokeObjectURL, revoked: string[] = [];
  URL.revokeObjectURL = url => { revoked.push(url); };
  try {
    a.store.removeRoom(a.report.id, a.report.rooms[0].id); a.store.removePhoto(key, photo.id);
    expect(revoked).toEqual([]);
    expect(a.store.addPhoto(key, { ...photo, id: "rejected", url: "blob:rejected" })).toBe(false);
    expect(revoked).toEqual(["blob:rejected"]);
    revoked.length = 0;
    const deletion = setup(); expect(deletion.store.addPhoto(key, photo)).toBe(true);
    deletion.local.values.set(STORAGE_KEY, documentOf([{ ...deletion.report, title: "Newer canonical" }]));
    deletion.store.removeRoom(deletion.report.id, deletion.report.rooms[0].id);
    expect(deletion.store.getSnapshot().status).toBe("conflict");
    expect(deletion.store.getSnapshot().reports[0].rooms).toEqual([]);
    expect(deletion.store.getSnapshot().photos[key]).toEqual([photo]); expect(revoked).toEqual([]);
  } finally { URL.revokeObjectURL = originalRevoke; }
  expect(a.store.getSnapshot().photos).toBe(before); expect(a.store.demoRecoveryJSON()).not.toContain(photo.url);
  expect(a.store.getSnapshot().photos[key]).toEqual([photo]);
});

test("T23 CloudStore keeps its own acknowledgement, conflict and recovery without any Demo APIs", async () => {
  const originals = { ...browserDemoEnvironment }, receipt = deferred<SaveReceipt>();
  const report = { ...legacyCoreReport(), details: { ...legacyCoreReport().details, inspectionType: "independent" as const } };
  const transport: CloudTransport = { list: async () => ({ ownerId: "synthetic-owner", records: [{ id: report.id, revision: 1, document: report }] }), save: async () => receipt.promise };
  try {
    for (const key of Object.keys(browserDemoEnvironment) as (keyof typeof browserDemoEnvironment)[]) Object.assign(browserDemoEnvironment, { [key]: () => { throw Error("Demo API touched by cloud"); } });
    const store = new CloudStore(transport); store.hydrate(); await store.activate("synthetic-owner", "synthetic-token");
    expect(store.getSnapshot().status).toBe("saved"); edit(store, report.id, "Cloud candidate"); expect(store.getSnapshot().status).toBe("pending");
    receipt.reject(new CloudRequestError(409)); await expect.poll(() => store.getSnapshot().status).toBe("conflict");
    expect(store.recoveryJSON()).toContain("Cloud candidate"); expect((await store.reloadLatest()).status).toBe("reloaded");
    expect(store.getSnapshot().local).toBeUndefined(); expect(store.recoveryJSON()).toContain("Cloud candidate");
  } finally { Object.assign(browserDemoEnvironment, originals); }
});

test("T24 legacy writes ignore the lock; next protected write detects the changed base", () => {
  const a = setup(); expect(a.store.editingAllowed).toBe(true);
  const legacy = documentOf([{ ...a.report, title: "Legacy can still write" }]); a.local.values.set(STORAGE_KEY, legacy);
  expect(edit(a.store, a.report.id, "Do not overwrite" )).toBe(true); expect(a.local.writes).toEqual([]);
  expect(raw(a.local)).toBe(legacy); expect(a.store.getSnapshot().status).toBe("conflict"); expect(a.store.editingAllowed).toBe(false);
});

test("T25 an unresolved recovery slot cannot be overwritten by the next editing session", () => {
  const a = setup(); a.local.failWrite = true; edit(a.store, a.report.id, "Candidate one"); a.local.failWrite = false;
  const checkpoint = a.session.getItem(DEMO_RECOVERY_KEY), oldToken = a.store.demoRecoveryToken();
  expect(a.store.reloadDemoLatest(oldToken)).toBe(true); expect(a.store.getSnapshot().local?.viewingLatest).toBe(true);
  expect(a.store.createReport()).toBeNull(); expect(edit(a.store, a.report.id, "Forbidden candidate two")).toBe(false);
  expect(a.session.getItem(DEMO_RECOVERY_KEY)).toBe(checkpoint); expect(a.store.finishDemoRecovery(oldToken)).toBe(false);
  const confirmation = a.store.demoRecoveryToken();
  a.local.values.set(STORAGE_KEY, documentOf([{ ...a.report, title: "Another newer version" }]));
  expect(a.store.finishDemoRecovery(confirmation)).toBe(false); expect(a.session.getItem(DEMO_RECOVERY_KEY)).toBe(checkpoint);
  a.storageEvent(STORAGE_KEY); expect(a.store.demoRecoveryToken()).not.toBe(confirmation);
  expect(a.store.reloadDemoLatest(a.store.demoRecoveryToken())).toBe(true);
  expect(a.store.finishDemoRecovery(a.store.demoRecoveryToken())).toBe(true); expect(a.store.editingAllowed).toBe(true);
  a.local.failWrite = true; edit(a.store, a.report.id, "Candidate two after explicit disposal");
  expect(a.store.demoRecoveryJSON()).toContain("Candidate two after explicit disposal"); expect(a.store.demoRecoveryJSON()).not.toContain("Candidate one");
});
