import { expect, test } from "@playwright/test";
import { CloudRequestError, CloudStore, type CloudTransport } from "../../src/lib/cloud/store";
import type { CloudRecord, SaveOperation, SaveReceipt } from "../../src/lib/cloud/contracts";
import { draft } from "./helpers";

function deferred<T>() { let resolve!: (value: T) => void, reject!: (error: unknown) => void; const promise = new Promise<T>((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; }
function setup() {
  const report = draft("store-legacy");
  const requests: { operation: SaveOperation; token: string; result: ReturnType<typeof deferred<SaveReceipt>> }[] = [];
  const transport: CloudTransport = {
    list: async token => ({ ownerId: token, records: [{ id: report.id, revision: 1, document: structuredClone(report) }] }),
    save: async (token, operation) => { const result = deferred<SaveReceipt>(); requests.push({ token, operation: structuredClone(operation), result }); return result.promise; },
  };
  const store = new CloudStore(transport);
  const accept = (index: number, replayed = false) => { const r = requests[index]; r.result.resolve({ id: r.operation.document.id, revision: r.operation.expectedRevision + 1, document: structuredClone(r.operation.document), replayed }); };
  return { store, report, requests, transport, accept };
}

test("pending never reports saved; older acknowledgement retains newer typing and queues the correct revision", async () => {
  const { store, report, requests, accept } = setup(); await store.activate("A", "A");
  const statuses: string[] = []; store.subscribe(() => statuses.push(store.getSnapshot().status));
  store.updateReport(report.id, r => ({ ...r, details: { ...r.details, address: "Fyrsta útgáfa" } }));
  expect(store.getSnapshot().status).toBe("pending"); expect(statuses).not.toContain("saved");
  store.updateReport(report.id, r => ({ ...r, details: { ...r.details, address: "Nýrri innsláttur" } }));
  expect(requests).toHaveLength(1); accept(0);
  await expect.poll(() => requests.length).toBe(2);
  expect(store.getSnapshot().reports[0].details.address).toBe("Nýrri innsláttur");
  expect(store.getSnapshot().status).toBe("pending"); expect(requests[1].operation.expectedRevision).toBe(2);
  accept(1); await expect.poll(() => store.getSnapshot().status).toBe("saved");
});

test("uncertain failure retries the exact operation before sending newer edits", async () => {
  const { store, report, requests, accept } = setup(); await store.activate("A", "A");
  store.updateReport(report.id, r => ({ ...r, title: "Fyrra" }));
  requests[0].result.reject(new Error("simulated response lost after commit"));
  await expect.poll(() => store.getSnapshot().status).toBe("error");
  store.updateReport(report.id, r => ({ ...r, title: "Nýrra" }));
  expect(requests).toHaveLength(1); store.retrySave();
  expect(requests[1].operation).toEqual(requests[0].operation); accept(1);
  await expect.poll(() => requests.length).toBe(3);
  expect(requests[2].operation.document.title).toBe("Nýrra"); expect(requests[2].operation.expectedRevision).toBe(2);
  accept(2); await expect.poll(() => store.getSnapshot().status).toBe("saved");
});

test("conflict freezes automatic saves and retains an owner-only recovery candidate after explicit refresh", async () => {
  const { store, report, requests } = setup(); await store.activate("A", "A");
  store.updateReport(report.id, r => ({ ...r, title: "Óvistað og varðveitt" }));
  requests[0].result.reject(new CloudRequestError(409));
  await expect.poll(() => store.getSnapshot().status).toBe("conflict");
  store.retrySave(); expect(requests).toHaveLength(1);
  expect(store.recoveryJSON()).toContain("Óvistað og varðveitt");
  await store.reloadLatest(); expect(store.getSnapshot().reports[0].title).toBe(report.title);
  expect(store.recoveryJSON()).toContain("Óvistað og varðveitt");
  await store.activate("B", "B"); expect(store.recoveryJSON()).not.toContain("Óvistað og varðveitt");
  await store.activate("A", "A"); expect(store.hasRecovery).toBe(true);
});

test("sign-out and account changes discard late responses without discarding the former owner's recovery", async () => {
  const { store, report, requests, accept } = setup(); await store.activate("A", "A");
  store.updateReport(report.id, r => ({ ...r, title: "A einkadrög" }));
  await store.activate(null); expect(store.getSnapshot().reports).toEqual([]);
  await store.activate("B", "B"); accept(0); await Promise.resolve();
  expect(store.getSnapshot().reports[0].title).toBe(report.title); expect(store.ownerId).toBe("B");
  expect(store.recoveryJSON()).not.toContain("A einkadrög"); expect(requests).toHaveLength(1);
  await store.activate("A", "A"); expect(store.recoveryJSON()).toContain("A einkadrög");
});

test("late list responses and wrong-owner responses cannot populate a different account or fixtures", async () => {
  const a = deferred<{ ownerId: string; records: CloudRecord[] }>();
  const store = new CloudStore({ list: async token => token === "A" ? a.promise : { ownerId: "B", records: [] }, save: async () => { throw new Error("unused"); } });
  const pending = store.activate("A", "A"); await store.activate("B", "B");
  a.resolve({ ownerId: "A", records: [{ id: "a", revision: 1, document: draft("a") }] }); await pending;
  expect(store.ownerId).toBe("B"); expect(store.getSnapshot().reports).toEqual([]);
  await store.activate("C", "B"); expect(store.getSnapshot().status).toBe("read-error"); expect(store.getSnapshot().reports).toEqual([]);
});

test("unsupported mutations fail closed while valid incomplete documents and extensions survive", async () => {
  const { store, report, requests, accept } = setup(); await store.activate("A", "A");
  expect(store.updateReport(report.id, r => ({ ...r, details: { ...r.details, inspectionType: "initial" } }))).toBe(false);
  expect(requests).toHaveLength(0);
  store.updateReport(report.id, r => ({ ...r, extra: { future: ["á", null, 3] }, details: { ...r.details, inspectionDate: "2026-02-30", recorderName: "" } }));
  expect(requests[0].operation.document).toHaveProperty("extra.future", ["á", null, 3]);
  accept(0); await expect.poll(() => store.getSnapshot().status).toBe("saved");
  expect(store.getSnapshot().reports[0].details.inspectionDate).toBe("2026-02-30");
  expect(await store.createLinkedFinal()).toBeNull(); expect(await store.reconfirmInitial()).toBe(false);
});

async function conflicted() {
  const fixture = setup(); await fixture.store.activate("A", "A");
  fixture.store.updateReport(fixture.report.id, r => ({ ...r, title: "Varðveitt einkadrög", extension: { raw: "001,25" } }));
  fixture.requests[0].result.reject(new CloudRequestError(409));
  await expect.poll(() => fixture.store.getSnapshot().status).toBe("conflict");
  return fixture;
}

test("failed recovery keeps the active candidate, owner, blocked state and download; a subsequent reload succeeds", async () => {
  const { store, transport, report } = await conflicted(), candidate = store.getSnapshot().reports;
  transport.list = async () => { throw new Error("simulated GET failure"); };
  expect(await store.reloadLatest()).toEqual({ status: "failed" });
  expect(store.ownerId).toBe("A"); expect(store.getSnapshot().reports).toBe(candidate);
  expect(store.getSnapshot().status).toBe("conflict"); expect(store.recoveryJSON()).toContain("001,25");
  expect(store.reloading).toBe(false);
  transport.list = async () => ({ ownerId: "A", records: [{ id: report.id, revision: 9, document: report }] });
  expect(await store.reloadLatest()).toEqual({ status: "reloaded" });
  expect(store.getSnapshot().reports[0]).toEqual(report); expect(store.hasRecovery).toBe(true);
});

for (const [name, value] of [
  ["null", null], ["missing records", { ownerId: "A" }],
  ["invalid revision", { ownerId: "A", records: [{ id: "bad", revision: 0, document: draft("bad") }] }],
  ["duplicate IDs", { ownerId: "A", records: [1, 2].map(revision => ({ id: "duplicate", revision, document: draft("duplicate") })) }],
  ["wrong owner", { ownerId: "B", records: [] }],
] as const) {
  test(`malformed recovery (${name}) cannot replace or hide the candidate`, async () => {
    const { store, transport } = await conflicted(), candidate = store.getSnapshot().reports;
    transport.list = async () => value as unknown as Awaited<ReturnType<CloudTransport["list"]>>;
    expect(await store.reloadLatest()).toEqual({ status: "failed" });
    expect(store.getSnapshot().reports).toBe(candidate); expect(store.ownerId).toBe("A");
    expect(store.recoveryJSON()).toContain("Varðveitt einkadrög"); expect(store.hasUnsaved).toBe(true);
  });
}

test("delayed recovery keeps downloads and edits available, rejects duplicate reloads and cannot discard newer edits", async () => {
  const { store, transport, report } = await conflicted(), result = deferred<Awaited<ReturnType<CloudTransport["list"]>>>();
  transport.list = async () => result.promise;
  const pending = store.reloadLatest(); expect(store.reloading).toBe(true);
  expect(store.getSnapshot().reports[0].title).toBe("Varðveitt einkadrög"); expect(store.ownerId).toBe("A");
  expect(await store.reloadLatest()).toEqual({ status: "busy" });
  store.updateReport(report.id, r => ({ ...r, title: "Ný innsláttur á meðan beðið er" }));
  result.resolve({ ownerId: "A", records: [{ id: report.id, revision: 8, document: report }] });
  expect(await pending).toEqual({ status: "changed" });
  expect(store.recoveryJSON()).toContain("Ný innsláttur á meðan beðið er"); expect(store.reloading).toBe(false);
});

test("successful recovery archives the candidate and installs only validated replacement revisions", async () => {
  const { store, transport, report, requests } = await conflicted();
  transport.list = async () => ({ ownerId: "A", records: [{ id: report.id, revision: 21, document: { ...report, title: "Nýjust sóttu drög", extension: { future: true } } }] });
  expect(await store.reloadLatest()).toEqual({ status: "reloaded" });
  expect(store.getSnapshot().status).toBe("saved"); expect(store.hasUnsaved).toBe(false);
  expect(store.recoveryJSON()).toContain("Varðveitt einkadrög"); expect(store.getSnapshot().reports[0]).toHaveProperty("extension.future", true);
  store.updateReport(report.id, r => ({ ...r, title: "Næsta breyting" }));
  expect(requests[1].operation.expectedRevision).toBe(21);
});

for (const returnToA of [false, true]) {
  test(`account switch during recovery ignores a late response${returnToA ? " even after the original owner signs in again" : ""}`, async () => {
    const { store, transport, report } = await conflicted(), response = deferred<Awaited<ReturnType<CloudTransport["list"]>>>();
    transport.list = async () => response.promise; const pending = store.reloadLatest();
    transport.list = async token => ({ ownerId: token, records: [] });
    await store.activate("B", "B");
    expect(store.recoveryJSON()).not.toContain("Varðveitt einkadrög");
    if (returnToA) await store.activate("A", "A");
    response.resolve({ ownerId: "A", records: [{ id: report.id, revision: 7, document: report }] });
    expect(await pending).toEqual({ status: "superseded" });
    expect(store.ownerId).toBe(returnToA ? "A" : "B"); expect(store.getSnapshot().reports).toEqual([]);
    if (!returnToA) await store.activate("A", "A");
    expect(store.hasRecovery).toBe(true); expect(store.recoveryJSON()).toContain("Varðveitt einkadrög");
  });
}

test("a replay acknowledges an earlier commit without claiming freshness or automatically sending newer typing", async () => {
  const { store, report, requests, accept } = setup(); await store.activate("A", "A");
  store.updateReport(report.id, r => ({ ...r, title: "Fyrri vistun" }));
  requests[0].result.reject(new Error("lost acknowledgement"));
  await expect.poll(() => store.getSnapshot().status).toBe("error");
  store.updateReport(report.id, r => ({ ...r, title: "Nýr óvistaður texti" })); store.retrySave();
  expect(requests[1].operation).toEqual(requests[0].operation); accept(1, true);
  await expect.poll(() => store.getSnapshot().status).toBe("refresh-required");
  expect(store.getSnapshot().warning).toContain("Fyrri vistun er staðfest");
  expect(store.getSnapshot().warning).toContain("nýjustu");
  expect(requests).toHaveLength(2); store.retrySave(); expect(requests).toHaveLength(2);
  store.updateReport(report.id, r => ({ ...r, title: "Enn nýrri texti" })); expect(requests).toHaveLength(2);
  expect(store.recoveryJSON()).toContain("Enn nýrri texti");
});
