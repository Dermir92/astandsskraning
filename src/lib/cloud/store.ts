"use client";

import { DemoStore } from "../../components/demo-provider";
import { EMPTY_DETAILS, initialRooms, isReportList, MAX_REPORTS, type Report } from "../model";
import { isCloudDocument, isCloudRecord, type CloudRecord, type SaveOperation, type SaveReceipt } from "./contracts";

export class CloudRequestError extends Error {
  constructor(public status: number) { super(`cloud_request_${status}`); }
}
export interface CloudTransport {
  list(token: string, signal: AbortSignal): Promise<{ ownerId: string; records: CloudRecord[] }>;
  save(token: string, operation: SaveOperation, signal: AbortSignal): Promise<SaveReceipt>;
}
export const httpTransport: CloudTransport = {
  async list(token, signal) {
    const response = await fetch("/api/c1/inspections", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(25_000)]) });
    if (!response.ok) throw new CloudRequestError(response.status);
    return response.json();
  },
  async save(token, operation, signal) {
    const response = await fetch("/api/c1/inspections", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(operation), signal: AbortSignal.any([signal, AbortSignal.timeout(25_000)]) });
    if (!response.ok) throw new CloudRequestError(response.status);
    return response.json();
  },
};
type Entry = { revision: number; edits: number; dirty: boolean; blocked?: "error" | "conflict" | "replay"; operation?: SaveOperation; sentEdits?: number; sending?: boolean };
export type ReloadResult = { status: "reloaded" | "failed" | "superseded" | "changed" | "busy" | "unavailable" };

function validCollection(result: unknown, owner: string): result is { ownerId: string; records: CloudRecord[] } {
  if (!result || typeof result !== "object" || !("ownerId" in result) || result.ownerId !== owner ||
    !("records" in result) || !Array.isArray(result.records) || !result.records.every(isCloudRecord)) return false;
  return isReportList(result.records.map(record => record.document));
}

// Reuses the existing synchronous domain mutations, not the localStorage adapter.
// A mutation is accepted into memory immediately; only a database acknowledgement
// can mark it saved. One request at a time per inspection retains newer typing.
export class CloudStore extends DemoStore {
  private owner: string | null = null;
  private token = "";
  private authorized = false;
  private generation = 0;
  private controller = new AbortController();
  private reloadController: AbortController | null = null;
  private activity = 0;
  private entries = new Map<string, Entry>();
  private recoveries = new Map<string, Report[]>();
  constructor(private transport: CloudTransport = httpTransport) { super([]); }
  override hydrate = () => {};
  get ownerId() { return this.authorized ? this.owner : null; }
  get hasUnsaved() { return [...this.entries.values()].some(entry => entry.dirty); }
  get hasRecoverable() { return this.hasUnsaved || [...this.recoveries.values()].some(reports => reports.length > 0); }
  get hasRecovery() { return !!this.ownerId && !!this.recoveries.get(this.ownerId)?.length; }
  get reloading() { return this.reloadController !== null; }
  recoveryJSON = () => {
    if (!this.ownerId) return null;
    const current = this.snapshot.reports.filter(report => this.entries.get(report.id)?.dirty);
    return JSON.stringify({ version: 1, purpose: "c1-recovery-only-no-automatic-import", ownerId: this.ownerId,
      reports: current, previousSession: this.recoveries.get(this.ownerId) ?? [] }, null, 2);
  };
  async activate(owner: string | null, token = "") {
    if (owner === this.owner && this.authorized) { this.token = token; return; }
    if (this.owner && this.authorized) this.archiveCandidate(this.owner);
    const generation = ++this.generation;
    this.reloadController?.abort(); this.reloadController = null;
    this.controller.abort(); this.controller = new AbortController();
    this.owner = owner; this.token = token; this.authorized = false; this.entries.clear();
    this.emit({ reports: [], photos: {}, status: "loading", warning: "" });
    if (!owner) return;
    try {
      const result = await this.transport.list(token, this.controller.signal);
      if (generation !== this.generation) return;
      if (!validCollection(result, owner)) throw new Error("invalid_cloud_response");
      result.records.forEach(record => this.entries.set(record.id, { revision: record.revision, edits: 0, dirty: false }));
      this.authorized = true;
      this.emit({ reports: result.records.map(record => record.document), photos: {}, status: "saved", warning: "" });
    } catch {
      if (generation !== this.generation) return;
      this.emit({ reports: [], photos: {}, status: "read-error", warning: "Ekki tókst að sækja drög úr staðbundnum gagnagrunni. Engin sýnigögn koma í þeirra stað. Reyndu innskráningu eða tengingu aftur." });
    }
  }
  retryLoad = () => { if (!this.authorized && this.owner) void this.activate(this.owner, this.token); };
  private archiveCandidate(owner: string) {
    const candidate = this.snapshot.reports.filter(report => this.entries.get(report.id)?.dirty);
    if (candidate.length) this.recoveries.set(owner, [...(this.recoveries.get(owner) ?? []), ...candidate]);
  }
  protected override canEdit() { return this.authorized && !!this.owner; }
  protected override persist(reports: Report[]) {
    if (!this.canEdit()) return false;
    if (!isReportList(reports) || !reports.every(isCloudDocument)) {
      this.emit({ ...this.snapshot, warning: "Breytingin var ekki samþykkt. C1 styður aðeins sjálfstæð íbúðardrög; fyrri gögn eru varðveitt." });
      return false;
    }
    for (const report of reports) {
      if (this.snapshot.reports.find(previous => previous.id === report.id) === report) continue;
      const entry = this.entries.get(report.id) ?? { revision: 0, edits: 0, dirty: false };
      entry.edits++; entry.dirty = true; this.entries.set(report.id, entry);
    }
    this.activity++;
    this.emit({ ...this.snapshot, reports, status: "pending" }); this.status();
    for (const report of reports) void this.flush(report.id);
    return true;
  }
  override createReport = () => {
    if (!this.canEdit() || this.snapshot.reports.length >= MAX_REPORTS) return null;
    const report: Report = { id: crypto.randomUUID(), assetType: "apartment", title: "Ónefnd íbúð", subtitle: "Sjálfstæð C1-prófdrög",
      updatedAt: new Date().toISOString(), details: { ...EMPTY_DETAILS, inspectionType: "independent" }, rooms: initialRooms({ includeHeating: true }) };
    return this.persist([report, ...this.snapshot.reports]) ? report.id : null;
  };
  override createLinkedFinal = async () => null;
  override reconfirmInitial = async () => false;
  override addPhoto = (_key: string, photo: { url: string }) => { URL.revokeObjectURL(photo.url); return false; };
  private status() {
    const entries = [...this.entries.values()];
    const status = entries.some(e => e.blocked === "conflict") ? "conflict" : entries.some(e => e.blocked === "replay") ? "refresh-required" : entries.some(e => e.blocked === "error") ? "error" : entries.some(e => e.dirty) ? "pending" : "saved";
    const warning = status === "conflict" ? "Nýrri útgáfa er vistuð. Þínar breytingar eru enn í minni og voru ekki skrifaðar yfir hana. Sæktu endurheimtarafrit áður en þú sækir nýjustu drögin." :
      status === "refresh-required" ? "Fyrri vistun er staðfest, en ekki er staðfest að þessi drög séu nýjustu gögnin. Frekari vistun þessara draga bíður. Sæktu endurheimtarafrit og síðan nýjustu vistuðu drögin til yfirferðar." :
      status === "error" ? "Vistun er óstaðfest. Breytingar eru enn í minni; hafðu gluggann opinn. Endurtekning notar sömu aðgerð og skrifar ekki sjálfkrafa yfir nýrri gögn." : "";
    this.emit({ ...this.snapshot, status, warning });
  }
  private async flush(id: string, retry = false) {
    const entry = this.entries.get(id);
    if (!this.canEdit() || !entry?.dirty || entry.sending || (entry.blocked && !retry) || entry.blocked === "conflict" || entry.blocked === "replay") return;
    const report = this.snapshot.reports.find(report => report.id === id)!;
    entry.operation ??= { operationId: crypto.randomUUID(), issuedAt: new Date().toISOString(), expectedRevision: entry.revision, document: JSON.parse(JSON.stringify(report)) };
    entry.sentEdits ??= entry.edits;
    entry.sending = true; entry.blocked = undefined; this.status();
    this.activity++;
    const generation = this.generation;
    try {
      const saved = await this.transport.save(this.token, entry.operation, this.controller.signal);
      if (generation !== this.generation) return;
      // Value equality across JSONB key ordering; this is not a baseline hash.
      if (!isCloudRecord(saved) || typeof saved.replayed !== "boolean" || saved.id !== id || saved.revision !== entry.operation.expectedRevision + 1 ||
        canonicalJSON(saved.document) !== canonicalJSON(entry.operation.document)) throw new Error("invalid_save_response");
      entry.revision = saved.revision;
      // Replays confirm an earlier commit. A later writer may already exist;
      // preserve the candidate and require an explicit read, without rewriting.
      entry.dirty = saved.replayed || entry.edits !== entry.sentEdits;
      if (saved.replayed) entry.blocked = "replay";
      entry.operation = undefined; entry.sentEdits = undefined;
      // Keep local object identity and newer edits. Server metadata is separate.
    } catch (error) {
      if (generation !== this.generation) return;
      entry.blocked = error instanceof CloudRequestError && error.status === 409 ? "conflict" : "error";
    } finally {
      if (generation === this.generation) { entry.sending = false; this.status(); if (!entry.blocked) void this.flush(id); }
    }
  }
  override retrySave = () => { for (const [id, entry] of this.entries) if (entry.blocked === "error") void this.flush(id, true); };
  // Fetch first. Only a valid, same-generation response may replace a candidate
  // that has not changed or started another write while the request was pending.
  async reloadLatest(): Promise<ReloadResult> {
    if (!this.ownerId) return { status: "unavailable" };
    if (this.reloading || [...this.entries.values()].some(e => e.sending)) return { status: "busy" };
    const owner = this.ownerId, generation = this.generation, activity = this.activity;
    const controller = new AbortController(); this.reloadController = controller;
    this.emit({ ...this.snapshot });
    const current = () => generation === this.generation && owner === this.ownerId && this.reloadController === controller;
    try {
      const result = await this.transport.list(this.token, controller.signal);
      if (!current()) return { status: "superseded" };
      if (!validCollection(result, owner)) throw new Error("invalid_cloud_response");
      if (activity !== this.activity) return { status: "changed" };
      const entries = new Map(result.records.map(record => [record.id, { revision: record.revision, edits: 0, dirty: false }]));
      this.archiveCandidate(owner);
      this.entries = entries;
      this.emit({ ...this.snapshot, reports: result.records.map(record => record.document), status: "saved", warning: "" });
      return { status: "reloaded" };
    } catch {
      return { status: current() ? "failed" : "superseded" };
    } finally {
      if (this.reloadController === controller) { this.reloadController = null; this.emit({ ...this.snapshot }); }
    }
  }
}
function canonicalJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonicalJSON(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
