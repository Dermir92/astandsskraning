import { isReportList, type Report } from "./model";

export const STORAGE_KEY = "astandsskraning-demo-v1";
export const DEMO_LOCK_NAME = "astandsskraning:demo-v1:collection-writer";
export const DEMO_RECOVERY_KEY = "astandsskraning-demo-recovery-v1";
export type DemoDocument = { version: 1; reports: Report[] } & Record<string, unknown>;
export type DemoRecovery = {
  version: 1;
  purpose: "demo-recovery-only-no-automatic-import";
  baseRaw: string | null;
  candidateRaw: string;
  generation: number;
};
type StorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;
// Lazy access keeps browser APIs out of SSR and the inherited CloudStore path.
export interface DemoEnvironment {
  local(): StorageAccess;
  session(): StorageAccess;
  locks(): Pick<LockManager, "request"> | null;
  secure(): boolean;
  listen(type: "storage" | "pagehide" | "pageshow" | "beforeunload", listener: EventListener): () => void;
}
export const browserDemoEnvironment: DemoEnvironment = {
  local: () => window.localStorage,
  session: () => window.sessionStorage,
  locks: () => navigator.locks ?? null,
  secure: () => window.isSecureContext,
  listen(type, listener) {
    window.addEventListener(type, listener);
    return () => window.removeEventListener(type, listener);
  },
};
export function readDemoDocument(raw: string): DemoDocument {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    !("version" in value) || value.version !== 1 ||
    !("reports" in value) || !isReportList(value.reports)) throw new Error("invalid-local-data");
  return value as DemoDocument;
}
export function readDemoRecovery(raw: string): DemoRecovery {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    !("version" in value) || value.version !== 1 ||
    !("purpose" in value) || value.purpose !== "demo-recovery-only-no-automatic-import" ||
    !("baseRaw" in value) || !(value.baseRaw === null || typeof value.baseRaw === "string") ||
    !("candidateRaw" in value) || typeof value.candidateRaw !== "string" ||
    !("generation" in value) || !Number.isSafeInteger(value.generation) || (value.generation as number) < 1)
    throw new Error("invalid-demo-recovery");
  if (value.baseRaw !== null) readDemoDocument(value.baseRaw);
  readDemoDocument(value.candidateRaw);
  return value as DemoRecovery;
}
