"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { demoReports } from "@/lib/fixtures";
import { heatingItem } from "@/lib/heating";
import { browserDemoEnvironment, DEMO_LOCK_NAME, DEMO_RECOVERY_KEY, readDemoDocument, readDemoRecovery, STORAGE_KEY, type DemoEnvironment, type DemoRecovery } from "@/lib/demo-storage";
import { buildInspectionComparison, contentFingerprint, copiedFinal, finalContext, initialAssociations, initialEligible, retireMissingAssociations, sourceContent } from "@/lib/inspection-comparison";
import {
  EMPTY_DETAILS,
  initialRooms,
  isReportList,
  MAX_REPORTS,
  type Observation,
  type Report,
  type Room,
  type ApartmentDetails,
} from "@/lib/model";

export { STORAGE_KEY } from "@/lib/demo-storage";
const WRITE_FAILURE_WARNING =
  "Breytingar eru aðeins í minni. Vafrinn gat ekki vistað drögin; hafðu gluggann opinn og reyndu aftur.";
export interface PreviewPhoto {
  id: string;
  url: string;
  name: string;
}
export type SaveStatus =
  | "loading"
  | "saved"
  | "error"
  | "read-error"
  | "validation-error"
  | "pending"
  | "conflict"
  | "refresh-required"
  | "read-only"
  | "unsupported"
  | "recovery"
  | "memory";
export interface LocalSaveState {
  access: "initializing" | "writer" | "reader" | "unsupported" | "inactive";
  epoch: number;
  dirty: boolean;
  recovery: boolean;
  viewingLatest: boolean;
  checkpointFailed: boolean;
  recoveryUnreadable: boolean;
  unsubmitted: boolean;
}
export interface Snapshot {
  reports: Report[];
  status: SaveStatus;
  warning: string;
  photos: Record<string, PreviewPhoto[]>;
  local?: LocalSaveState;
}

export class DemoStore {
  protected initial: Snapshot = {
    reports: demoReports(),
    status: "loading",
    warning: "",
    photos: {},
  };
  protected snapshot = this.initial;
  constructor(reports?: Report[], private environment: DemoEnvironment = browserDemoEnvironment) {
    if (reports) this.initial = { ...this.initial, reports };
    this.snapshot = this.initial;
  }
  private listeners = new Set<() => void>();
  private connected = false;
  private loaded = false;
  private ownsLock = false;
  private access: LocalSaveState["access"] = "initializing";
  private epoch = 0;
  private leaseEpoch = 0;
  private releaseLock?: () => void;
  private lockTask?: Promise<void>;
  private ready: Promise<void> = Promise.resolve();
  private finishReady?: () => void;
  private cleanups: (() => void)[] = [];
  private baseRaw: string | null = null;
  private verified = false;
  private seenDocument = false;
  private blocked: "changed" | "read" | "recovery" | null = null;
  private dirty = false;
  private localGeneration = 0;
  private recovery: DemoRecovery | null = null;
  private checkpointRaw: string | null | undefined;
  private checkpointFailed = false;
  private recoveryUnreadable = false;
  private viewingLatest = false;
  private uiDrafts = new Map<string, string>();
  private uiGeneration = 0;
  // Retain the validated envelope's extension keys without rewriting on read.
  private envelope: object = {};
  private linkedCreations = new Map<string, { sourceId: string; pending: Promise<string | null> }>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => this.initial;
  protected emit(snapshot: Snapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((l) => l());
  }
  private publish(snapshot: Snapshot) {
    this.emit({ ...snapshot, local: {
      access: this.access, epoch: this.epoch, dirty: this.dirty,
      recovery: !!this.recovery, viewingLatest: this.viewingLatest,
      checkpointFailed: this.checkpointFailed, recoveryUnreadable: this.recoveryUnreadable,
      unsubmitted: this.uiDrafts.size > 0,
    } });
  }
  get editingAllowed() { return this.canEdit(); }
  get mutationEpoch() { return this.epoch; }
  whenReady = () => this.ready;
  demoRecoveryToken = () => JSON.stringify([this.epoch, this.localGeneration, this.uiGeneration, this.recovery, this.viewingLatest]);
  setDemoUiDraft = (key: string, value: string) => {
    if (this.uiDrafts.get(key) === value || (!value && !this.uiDrafts.has(key))) return;
    if (value) this.uiDrafts.set(key, value); else this.uiDrafts.delete(key);
    this.uiGeneration++;
    this.publish({ ...this.snapshot });
  };
  private readCurrent() {
    const raw = this.environment.local().getItem(STORAGE_KEY);
    if (raw !== null) this.seenDocument = true;
    const document = raw === null ? { version: 1 as const, reports: this.seenDocument ? [] : this.initial.reports } : readDemoDocument(raw);
    return { raw, document };
  }
  private loadInitial() {
    let current: ReturnType<DemoStore["readCurrent"]> | undefined;
    try { current = this.readCurrent(); } catch { /* Never substitute fixtures for unreadable storage. */ }
    try {
      this.checkpointRaw = this.environment.session().getItem(DEMO_RECOVERY_KEY);
      if (this.checkpointRaw !== null) this.recovery = readDemoRecovery(this.checkpointRaw);
    } catch { this.recoveryUnreadable = true; this.checkpointFailed = true; }
    this.loaded = true;
    if (current) {
      this.baseRaw = current.raw; this.envelope = current.document; this.verified = true;
      this.snapshot = { ...this.snapshot, reports: current.document.reports };
    }
    if (this.recovery && current?.raw === this.recovery.candidateRaw) {
      this.recovery = null;
      this.clearCheckpoint();
    } else if (this.recovery) {
      this.baseRaw = this.recovery.baseRaw;
      const candidate = readDemoDocument(this.recovery.candidateRaw);
      this.envelope = candidate;
      this.snapshot = { ...this.snapshot, reports: candidate.reports };
      this.localGeneration = this.recovery.generation; this.dirty = true; this.blocked = "recovery";
    }
    this.publish({ ...this.snapshot,
      // Keep the original loading boundary until admission has completed. Focus
      // corrections must not mount against temporarily disabled editor fields.
      status: !current ? "read-error" : "loading",
      warning: !current ? this.readWarning() : this.recovery ? this.recoveryWarning() : "",
    });
  }
  hydrate = () => {
    if (this.connected) return;
    this.connected = true;
    this.cleanups = [
      this.environment.listen("storage", event => this.storageChanged(event as StorageEvent)),
      this.environment.listen("pagehide", () => { this.invalidateLease(); this.publish({ ...this.snapshot }); }),
      this.environment.listen("pageshow", event => {
        if ((event as PageTransitionEvent).persisted) {
          // Never trust a restored ownership flag, even if pagehide was missed.
          this.invalidateLease(); this.publish({ ...this.snapshot }); this.retryDemoAccess();
        } else if (this.access === "inactive") this.retryDemoAccess();
      }),
      this.environment.listen("beforeunload", event => {
        if (this.dirty || this.recovery || this.uiDrafts.size) { event.preventDefault(); (event as BeforeUnloadEvent).returnValue = ""; }
      }),
    ];
    if (!this.loaded) this.loadInitial();
    this.retryDemoAccess();
  };
  disconnectDemo = () => {
    this.connected = false;
    this.cleanups.splice(0).forEach(cleanup => cleanup());
    this.invalidateLease();
    this.publish({ ...this.snapshot });
  };
  private invalidateLease() {
    this.ownsLock = false; this.access = "inactive"; this.epoch++; this.leaseEpoch++;
    const release = this.releaseLock; this.releaseLock = undefined;
    release?.(); this.finishReady?.();
  }
  retryDemoAccess = () => {
    if (!this.connected || this.ownsLock) return;
    const leaseEpoch = ++this.leaseEpoch; this.epoch++;
    this.access = "initializing";
    this.ready = new Promise(resolve => { this.finishReady = resolve; });
    const finish = this.finishReady!;
    this.publish({ ...this.snapshot });
    const start = () => {
      if (!this.connected || leaseEpoch !== this.leaseEpoch) { finish(); return; }
      let locks: ReturnType<DemoEnvironment["locks"]>;
      try { locks = this.environment.secure() ? this.environment.locks() : null; } catch { locks = null; }
      if (!locks) { this.access = "unsupported"; this.publishAccess(); finish(); return; }
      try {
        this.lockTask = Promise.resolve(locks.request(DEMO_LOCK_NAME, { mode: "exclusive", ifAvailable: true }, lock => {
          if (!this.connected || leaseEpoch !== this.leaseEpoch) { finish(); return; }
          if (!lock) { this.access = "reader"; this.publishAccess(); finish(); return; }
          if (lock.name !== DEMO_LOCK_NAME || lock.mode !== "exclusive") throw new Error("invalid-writer-lock");
          const held = new Promise<void>(resolve => { this.releaseLock = resolve; });
          this.ownsLock = true; this.access = "writer";
          this.refreshWithLease(); finish();
          return held;
        })).then(() => {
          if (leaseEpoch === this.leaseEpoch && this.connected) {
            this.ownsLock = false; this.releaseLock = undefined; this.access = "reader"; this.publishAccess();
          }
        }, () => {
          if (leaseEpoch === this.leaseEpoch && this.connected) {
            this.ownsLock = false; this.epoch++;
            const release = this.releaseLock; this.releaseLock = undefined; release?.();
            this.access = "unsupported"; this.publishAccess();
          }
        }).finally(finish);
      } catch { this.ownsLock = false; this.access = "unsupported"; this.publishAccess(); finish(); }
    };
    // StrictMode setup must wait for the old request to release its actual lock.
    if (this.lockTask) void this.lockTask.then(start, start); else start();
  };
  private refreshWithLease() {
    let current: ReturnType<DemoStore["readCurrent"]>;
    try { current = this.readCurrent(); }
    catch {
      this.verified = false; this.blocked = "read";
      this.invalidateLease(); this.access = "reader";
      this.publish({ ...this.snapshot, status: "read-error", warning: this.readWarning() }); return;
    }
    if (this.recovery || this.dirty || this.recoveryUnreadable) {
      this.blocked = "recovery"; this.publishAccess(); return;
    }
    if (this.uiDrafts.size && (!this.verified || current.raw !== this.baseRaw)) {
      this.blocked = "changed"; this.publish({ ...this.snapshot, status: "refresh-required", warning: "Geymd gögn hafa breyst. Ósendur innsláttur er enn hér; afritaðu hann áður en þú sækir nýjustu gögnin." }); return;
    }
    if (current.raw !== this.baseRaw || !this.verified) this.snapshot = { ...this.snapshot, reports: current.document.reports };
    this.baseRaw = current.raw; this.envelope = current.document; this.verified = true; this.blocked = null;
    this.publish({ ...this.snapshot, status: current.raw === null ? "memory" : "saved", warning: "" });
  }
  private publishAccess() {
    const status = this.snapshot.status === "read-error" ? "read-error" : this.recovery || this.recoveryUnreadable ? "recovery" : this.blocked === "changed" ? "refresh-required" : this.access === "unsupported" ? "unsupported" : "read-only";
    const warning = status === "read-error" ? this.readWarning() : status === "recovery" ? this.recoveryWarning() : status === "refresh-required" ? "Geymd gögn hafa breyst. Sæktu nýjustu vistuðu gögnin áður en þú heldur áfram." : this.access === "unsupported" ? "Örugg vistun er ekki í boði í þessum vafra. Gögnin eru aðeins til skoðunar; engar breytingar eru vistaðar." : "Annar flipi kann að hafa breytingarétt á safninu. Þessi flipi er í lesham. Lokaðu fyrri breytingarflipa og reyndu breytingarétt aftur.";
    this.publish({ ...this.snapshot, status, warning });
  }
  private readWarning() {
    return "Ekki tókst að lesa staðbundin drög. Gögnin eru óaðgengileg eða á ógildu eða óstuddu sniði. Upprunalegum gögnum er ekki breytt. Sýnigögn eru aðeins til skoðunar; breytingar og vistun eru læstar. Endurheimt eða útskipti gagnanna þarf að ákveða sérstaklega." + (this.recovery ? ` ${this.recoveryWarning()}` : "");
  }
  private recoveryWarning() {
    if (this.recoveryUnreadable) return "Ekki tókst að lesa endurheimtarafrit eða snið þess er óstutt. Afritinu er ekki breytt; frekari breytingar eru læstar.";
    return `Óvistað endurheimtardrag er varðveitt hér. Það er ekki sjálfkrafa vistað eða sameinað nýrri gögnum. Endurheimtarafrit getur verið eldra en nýjasta heppnaða vistun. Skoðaðu nýjustu vistuðu gögnin áður en þú velur framhald. ${this.checkpointFailed ? "Afrit er aðeins í minni. Sæktu það áður en þú endurhleður eða lokar flipanum." : "Sæktu endurheimtarafrit áður en þú lokar flipanum. Setuafrit er ekki varanleg gagnageymsla."}${this.access === "unsupported" ? " Örugg vistun er ekki í boði í þessum vafra; breytingar eru læstar." : this.access === "reader" ? " Þessi flipi hefur ekki breytingarétt; reyndu hann aftur þegar fyrri breytingarflipa hefur verið lokað." : ""}`;
  }
  private storageChanged(event: StorageEvent) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea && event.storageArea !== this.environment.local()) return;
      if (this.environment.local().getItem(STORAGE_KEY) === this.baseRaw) return;
      this.epoch++;
      this.blocked = "changed";
      if (this.dirty && !this.viewingLatest) this.checkpoint();
      this.publish({ ...this.snapshot, status: this.dirty ? "conflict" : this.recovery ? "recovery" : "refresh-required", warning: this.dirty ? this.conflictWarning() : `Geymd gögn hafa breyst í öðrum flipa. Þessi skoðunarmynd er óbreytt; sæktu nýjustu gögnin sérstaklega.${this.recovery ? ` ${this.recoveryWarning()}` : ""}` });
    } catch {
      this.epoch++;
      this.blocked = "read";
      this.publish({ ...this.snapshot, status: this.dirty ? "error" : "refresh-required", warning: "Ekki tókst að sannreyna vistuð gögn. Innsláttur er varðveittur hér; frekari breytingar bíða öruggs endurlesturs." });
    }
  }
  protected canEdit() {
    return (
      this.connected && this.ownsLock && this.verified && !this.blocked && !this.recoveryUnreadable && !this.viewingLatest &&
      this.snapshot.status !== "loading" &&
      !["read-error", "conflict", "refresh-required", "recovery", "read-only", "unsupported"].includes(this.snapshot.status)
    );
  }
  private rejectMutation(warning: string) {
    const pendingWrite = this.snapshot.status === "error";
    this.publish({
      ...this.snapshot,
      status: pendingWrite ? "error" : "validation-error",
      warning: pendingWrite ? `${warning} ${WRITE_FAILURE_WARNING}` : warning,
    });
  }
  protected persist(reports: Report[]) {
    // Never turn fallback fixtures into a replacement for unreadable source data.
    if (!this.canEdit()) return false;
    if (!isReportList(reports)) {
      this.rejectMutation(
        "Ekki var hægt að samþykkja breytinguna: gögnin uppfylla ekki skilyrði fyrir vistun og endurhleðslu. Fyrri gögn eru óbreytt.",
      );
      return false;
    }
    let candidateRaw: string;
    try { candidateRaw = JSON.stringify({ ...this.envelope, version: 1, reports }); readDemoDocument(candidateRaw); }
    catch { this.rejectMutation("Ekki var hægt að undirbúa gilt vistunarskjal. Fyrri gögn eru óbreytt."); return false; }
    this.localGeneration++; this.dirty = true;
    this.recovery = { version: 1, purpose: "demo-recovery-only-no-automatic-import", baseRaw: this.baseRaw, candidateRaw, generation: this.localGeneration };
    let status: SaveStatus = "saved", warning = "";
    // No await or user callback between the exact check and the single write.
    try {
      const storage = this.environment.local();
      let raw: string | null;
      try { raw = storage.getItem(STORAGE_KEY); }
      catch { this.blocked = "read"; throw new Error("verification-failed"); }
      if (raw !== this.baseRaw) { this.blocked = "changed"; status = "conflict"; }
      else {
        storage.setItem(STORAGE_KEY, candidateRaw);
        this.baseRaw = candidateRaw; this.seenDocument = true; this.dirty = false;
        this.recovery = null; this.clearCheckpoint();
      }
    } catch { status = "error"; }
    if (this.dirty) {
      this.checkpoint();
      warning = status === "conflict" ? this.conflictWarning() : this.blocked === "read" ? `Ekki tókst að sannreyna vistuð gögn. ${this.recoveryWarning()}` : `${WRITE_FAILURE_WARNING} ${this.recoveryWarning()}`;
    }
    // Listener failures are outside the storage try/catch. Bookkeeping is ready
    // before notification, including when a listener accepts another mutation.
    this.publish({ ...this.snapshot, reports, status, warning });
    // A valid draft remains usable in memory when the storage write fails.
    return true;
  }
  retrySave = () => {
    if (this.blocked === "read" && this.ownsLock && this.dirty && !this.viewingLatest) this.blocked = null;
    if (this.snapshot.status === "error") this.persist(this.snapshot.reports);
  };
  private conflictWarning() {
    return `Önnur útgáfa hefur verið vistuð í þessum vafra. Þínar breytingar voru ekki vistaðar yfir hana. ${this.recoveryWarning()}`;
  }
  private checkpoint() {
    if (!this.recovery || this.recoveryUnreadable || this.viewingLatest) return;
    try {
      const storage = this.environment.session();
      if (this.checkpointRaw === undefined || storage.getItem(DEMO_RECOVERY_KEY) !== this.checkpointRaw) throw new Error("recovery-changed");
      const raw = JSON.stringify(this.recovery);
      storage.setItem(DEMO_RECOVERY_KEY, raw); this.checkpointRaw = raw; this.checkpointFailed = false;
    } catch { this.checkpointFailed = true; }
  }
  private clearCheckpoint() {
    if (this.checkpointRaw === null) return true;
    try {
      const storage = this.environment.session();
      if (this.checkpointRaw === undefined || storage.getItem(DEMO_RECOVERY_KEY) !== this.checkpointRaw) return false;
      storage.removeItem(DEMO_RECOVERY_KEY); this.checkpointRaw = null; this.checkpointFailed = false; return true;
    } catch { this.checkpointFailed = true; return false; }
  }
  demoRecoveryJSON = () => this.recovery ? JSON.stringify({ ...this.recovery, note: "Óvistað drag; enginn sjálfvirkur innflutningur. Tímabundnar myndir og óstofnuð UI-drög eru ekki í afritinu." }, null, 2) : null;
  reloadDemoLatest = (expected: string) => {
    if (!this.connected || expected !== this.demoRecoveryToken() || this.uiDrafts.size || this.recoveryUnreadable) return false;
    let current: ReturnType<DemoStore["readCurrent"]>;
    try { current = this.readCurrent(); } catch { return false; }
    this.epoch++; // Domain confirmations expire; lease lifetime is tracked separately.
    this.envelope = current.document; this.baseRaw = current.raw; this.verified = true;
    this.viewingLatest = !!this.recovery; this.dirty = false;
    this.blocked = this.recovery ? "recovery" : null;
    this.publish({ ...this.snapshot, reports: current.document.reports,
      status: this.recovery ? "recovery" : this.ownsLock ? current.raw === null ? "memory" : "saved" : "read-only",
      warning: this.recovery ? this.recoveryWarning() : this.ownsLock ? "" : "Gögn sótt til skoðunar. Reyndu breytingarétt aftur til að vinna með þau.",
    });
    return true;
  };
  resumeDemoRecovery = (expected: string) => {
    if (!this.connected || !this.ownsLock || !this.recovery || this.recoveryUnreadable || this.uiDrafts.size || expected !== this.demoRecoveryToken()) return false;
    const candidate = this.recovery;
    try { if (this.readCurrent().raw !== candidate.baseRaw) return false; } catch { return false; }
    this.envelope = readDemoDocument(candidate.candidateRaw); this.baseRaw = candidate.baseRaw;
    this.verified = true; this.blocked = null; this.viewingLatest = false;
    this.snapshot = { ...this.snapshot, status: "error", reports: readDemoDocument(candidate.candidateRaw).reports };
    return this.persist(this.snapshot.reports);
  };
  finishDemoRecovery = (expected: string) => {
    if (!this.connected || !this.recovery || !this.viewingLatest || this.uiDrafts.size || expected !== this.demoRecoveryToken()) return false;
    // A second writer may have changed storage since the user viewed "latest".
    // Never clear the retained candidate or label that known-stale view saved.
    try { if (this.readCurrent().raw !== this.baseRaw) return false; } catch { return false; }
    if (!this.clearCheckpoint()) return false;
    this.recovery = null; this.blocked = null; this.dirty = false; this.viewingLatest = false; this.localGeneration++;
    this.publish({ ...this.snapshot, status: this.ownsLock ? this.baseRaw === null ? "memory" : "saved" : "read-only", warning: this.ownsLock ? "" : "Gögnin eru í lesham. Reyndu breytingarétt aftur til að vinna með þau." });
    return true;
  };
  createReport = () => {
    if (!this.canEdit()) return null;
    if (this.snapshot.reports.length >= MAX_REPORTS) {
      this.rejectMutation(
        `Hámarki ${MAX_REPORTS} skýrslna í þessum vafra er náð. Engin ný skýrsla var stofnuð og fyrri skýrslur eru óbreyttar. Þú getur áfram breytt þeim.`,
      );
      return null;
    }
    const id = crypto.randomUUID();
    const report: Report = {
      id,
      assetType: "apartment",
      title: "Ónefnd íbúð",
      subtitle: "Ný upphafsdrög",
      updatedAt: new Date().toISOString(),
      details: { ...EMPTY_DETAILS },
      rooms: initialRooms({ includeHeating: true }),
    };
    return this.persist([report, ...this.snapshot.reports]) ? id : null;
  };
  createLinkedFinal = (sourceId: string, expectedSource: string, operationId: string): Promise<string | null> => {
    const prior = this.linkedCreations.get(operationId);
    if (prior) return prior.sourceId === sourceId ? prior.pending : Promise.resolve(null);
    const pending = this.createLinkedFinalOnce(sourceId, expectedSource);
    this.linkedCreations.set(operationId, { sourceId, pending });
    return pending;
  };
  private async createLinkedFinalOnce(sourceId: string, expectedSource: string) {
    const epoch = this.epoch;
    const source = this.snapshot.reports.find(r => r.id === sourceId);
    if (!this.canEdit() || !source || !initialEligible(source)) return null;
    const sourceFingerprint = await contentFingerprint(sourceContent(source));
    if (epoch !== this.epoch || !this.canEdit() || this.snapshot.reports.find(r => r.id === sourceId) !== source || sourceFingerprint !== expectedSource) return null;
    if (this.snapshot.reports.length >= MAX_REPORTS) {
      this.rejectMutation(`Hámarki ${MAX_REPORTS} skýrslna er náð. Engin lokaskoðun var stofnuð.`);
      return null;
    }
    const report = copiedFinal(source, crypto.randomUUID(), new Date().toISOString(), () => crypto.randomUUID());
    report.linkedInitial = { version: 1, initialReportId: source.id, sourceFingerprint, finalContextFingerprint: await contentFingerprint(finalContext(report)), rooms: initialAssociations(source, report) };
    if (epoch !== this.epoch || !this.canEdit() || this.snapshot.reports.find(r => r.id === sourceId) !== source) return null;
    return this.persist([report, ...this.snapshot.reports]) ? report.id : null;
  }
  reconfirmInitial = async (id: string, expectedSource: string, expectedContext: string) => {
    const epoch = this.epoch;
    if (!this.canEdit()) return false;
    const report = this.snapshot.reports.find(r => r.id === id);
    if (!report?.linkedInitial) return false;
    const reports = this.snapshot.reports;
    const comparison = await buildInspectionComparison(report, reports);
    if (epoch !== this.epoch || !this.canEdit() || this.snapshot.reports !== reports || comparison?.status !== "changed" || comparison.sourceFingerprint !== expectedSource || comparison.finalContextFingerprint !== expectedContext) return false;
    return this.updateReport(id, r => ({ ...r, linkedInitial: { ...r.linkedInitial!, sourceFingerprint: expectedSource, finalContextFingerprint: expectedContext } }));
  };
  updateReport = (id: string, update: (report: Report) => Report) => {
    if (!this.canEdit() || !this.snapshot.reports.some(report => report.id === id)) return false;
    return this.persist(
      this.snapshot.reports.map((r) =>
        r.id === id ? { ...retireMissingAssociations(r, update(r)), updatedAt: new Date().toISOString() } : r,
      ),
    );
  };
  updateMeters = (id: string, update: (details: ApartmentDetails) => ApartmentDetails) => {
    if (!this.canEdit()) return false;
    const report = this.snapshot.reports.find(r => r.id === id);
    if (!report || report.assetType !== "apartment" || report.sampleReviewed) return false;
    const details = update(report.details);
    // Rejected/stale confirmations do not write even normal report metadata.
    if (details === report.details) return false;
    return this.updateReport(id, r => ({ ...r, details }));
  };
  updateRoom = (
    reportId: string,
    roomId: string,
    update: (room: Room) => Room,
  ) => {
    if (!this.snapshot.reports.find(report => report.id === reportId)?.rooms.some(room => room.id === roomId)) return false;
    return this.updateReport(reportId, (r) => ({
      ...r,
      rooms: r.rooms.map((room) => (room.id === roomId ? update(room) : room)),
    }));
  };
  updateObservation = (
    reportId: string,
    roomId: string,
    itemId: string,
    observation: Observation,
  ) => {
    if (!this.snapshot.reports.find(report => report.id === reportId)?.rooms.find(room => room.id === roomId)?.items.some(item => item.id === itemId)) return;
    this.updateRoom(reportId, roomId, (room) => ({
      ...room,
      observations: { ...room.observations, [itemId]: observation },
    }));
  };
  addHeating = (reportId: string, roomId: string): string | null => {
    if (!this.canEdit()) return null;
    const report = this.snapshot.reports.find(r => r.id === reportId);
    const room = report?.rooms.find(r => r.id === roomId);
    if (!room || report?.assetType !== "apartment" || report.sampleReviewed) return null;
    const item = heatingItem(room);
    if (!item) return null;
    return this.updateRoom(reportId, roomId, r => ({ ...r, items: [...r.items, item] })) ? item.id : null;
  };
  addPhoto = (key: string, photo: PreviewPhoto) => {
    const targetExists = this.snapshot.reports.some(report =>
      report.assetType === "apartment" && !report.sampleReviewed && report.rooms.some(room =>
        key === `${report.id}:${room.id}:overview` ||
        room.items.some(item => key === `${report.id}:${room.id}:${item.id}`),
      ),
    );
    if (!this.canEdit() || !targetExists || (this.snapshot.photos[key]?.length ?? 0) >= 8) {
      URL.revokeObjectURL(photo.url);
      return false;
    }
    this.emit({
      ...this.snapshot,
      photos: {
        ...this.snapshot.photos,
        [key]: [...(this.snapshot.photos[key] ?? []), photo],
      },
    });
    return true;
  };
  removePhoto = (key: string, id: string) => {
    if (!this.canEdit()) return;
    const photo = this.snapshot.photos[key]?.find((p) => p.id === id);
    if (!photo) return;
    if (photo) URL.revokeObjectURL(photo.url);
    this.emit({
      ...this.snapshot,
      photos: {
        ...this.snapshot.photos,
        [key]: (this.snapshot.photos[key] ?? []).filter((p) => p.id !== id),
      },
    });
  };
  removeRoom = (reportId: string, roomId: string) => {
    if (
      !this.updateReport(reportId, (r) => ({
        ...r,
        rooms: r.rooms.filter((room) => room.id !== roomId),
      }))
    )
      return;
    Object.keys(this.snapshot.photos)
      .filter((k) => k.startsWith(`${reportId}:${roomId}:`))
      .forEach((key) => {
        this.snapshot.photos[key].forEach((p) => this.removePhoto(key, p.id));
      });
  };
}
const DemoContext = createContext<{ state: Snapshot; store: DemoStore; mode: "demo" | "cloud"; navigationScope: string } | null>(
  null,
);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new DemoStore());
  return <InspectionStoreProvider store={store}>{children}</InspectionStoreProvider>;
}
export function InspectionStoreProvider({ store, children, mode = "demo", navigationScope = "" }: { store: DemoStore; children: ReactNode; mode?: "demo" | "cloud"; navigationScope?: string }) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useEffect(() => {
    store.hydrate();
    if (mode === "demo") return store.disconnectDemo;
  }, [store, mode]);
  return (
    <DemoContext.Provider value={{ state, store, mode, navigationScope }}>
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider is missing");
  return { ...value, demoReadOnly: value.mode === "demo" && !value.store.editingAllowed };
}
