import type { Report } from "./model";

export const DEMO_PHOTO_DB = "astandsskraning-demo-photos-v1";
export const DEMO_PHOTO_CHANNEL = "astandsskraning:demo-photos-v1";
export const DEMO_PHOTO_NOTICE = "Myndir vistast aðeins í þessum vafra á þessu tæki. Þær eru ekki afritaðar, samstilltar eða sendar á þjón. Hreinsun vafragagna, einkahamur eða rýming vafrans getur eytt þeim. Varðveittu frumritin.";
export type PhotoTarget = { reportId: string; roomId: string; itemId: string | null };
export type StoredDemoPhoto = { version: 1; id: string; target: PhotoTarget; name: string; blob: Blob; order: number };
export type PhotoChange = { add: Omit<StoredDemoPhoto, "order"> } | { remove: string };
export interface DemoPhotoRepository {
  read(): Promise<StoredDemoPhoto[]>;
  change(change: PhotoChange, check: () => void, signal: AbortSignal): Promise<StoredDemoPhoto[]>;
}
export const photoKey = (target: PhotoTarget) => `${target.reportId}:${target.roomId}:${target.itemId ?? "overview"}`;
export const samePhotoTarget = (a: PhotoTarget, b: PhotoTarget) => a.reportId === b.reportId && a.roomId === b.roomId && a.itemId === b.itemId;
export function photoTargets(reports: Report[], key: string): PhotoTarget[] {
  return reports.flatMap(report => report.assetType !== "apartment" || report.sampleReviewed ? [] : report.rooms.flatMap(room => {
    const targets: PhotoTarget[] = [{ reportId: report.id, roomId: room.id, itemId: null }, ...room.items.map(item => ({ reportId: report.id, roomId: room.id, itemId: item.id }))];
    return targets.filter(target => photoKey(target) === key);
  }));
}
export function validPhotoTarget(reports: Report[], target: PhotoTarget) {
  const matches = photoTargets(reports, photoKey(target));
  return matches.length === 1 && samePhotoTarget(matches[0], target);
}
function validatePhotos(value: unknown): StoredDemoPhoto[] {
  if (!Array.isArray(value)) throw Error("invalid-photo-data");
  const ids = new Set<string>();
  for (const row of value) {
    if (!row || row.version !== 1 || typeof row.id !== "string" || !row.id || ids.has(row.id) ||
      !row.target || typeof row.target.reportId !== "string" || typeof row.target.roomId !== "string" ||
      !(row.target.itemId === null || typeof row.target.itemId === "string") || typeof row.name !== "string" ||
      !(row.blob instanceof Blob) || !["image/jpeg", "image/png", "image/webp"].includes(row.blob.type) ||
      row.blob.size === 0 || row.blob.size > 10 * 1024 * 1024 || !Number.isSafeInteger(row.order) || row.order < 0) throw Error("invalid-photo-data");
    ids.add(row.id);
  }
  return (value as StoredDemoPhoto[]).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
function openPhotos(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DEMO_PHOTO_DB, 1);
    let abandoned = false;
    request.onupgradeneeded = () => {
      // A blocked/failed open must never upgrade or replace existing evidence.
      if (abandoned) { request.transaction?.abort(); return; }
      request.result.createObjectStore("photos", { keyPath: "id" });
    };
    request.onblocked = () => { abandoned = true; reject(Error("photo-open-blocked")); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (abandoned) db.close(); else resolve(db);
    };
  });
}
async function transaction(change?: PhotoChange, check = () => {}, signal?: AbortSignal): Promise<StoredDemoPhoto[]> {
  const db = await openPhotos();
  try {
    return await new Promise<StoredDemoPhoto[]>((resolve, reject) => {
      const tx = db.transaction("photos", change ? "readwrite" : "readonly", { durability: "strict" });
      let rows: StoredDemoPhoto[] = [], failure: unknown;
      const abort = () => { try { tx.abort(); } catch { /* Already committed/aborted. */ } };
      signal?.addEventListener("abort", abort, { once: true });
      tx.oncomplete = () => { signal?.removeEventListener("abort", abort); resolve(rows); };
      tx.onabort = () => { signal?.removeEventListener("abort", abort); reject(failure ?? tx.error ?? Error("photo-transaction-aborted")); };
      if (signal?.aborted) { abort(); return; }
      const store = tx.objectStore("photos");
      if (store.keyPath !== "id" || store.autoIncrement) { failure = Error("unsupported-photo-schema"); abort(); return; }
      const read = store.getAll();
      read.onsuccess = () => {
        try {
          rows = validatePhotos(read.result);
          if (!change) return;
          check();
          let write: IDBRequest;
          if ("add" in change) {
            if (rows.filter(row => samePhotoTarget(row.target, change.add.target)).length >= 8) throw Error("photo-limit");
            const row = { ...change.add, order: Math.max(-1, ...rows.map(row => row.order)) + 1 };
            validatePhotos([...rows, row]);
            // add(), never put(): a colliding ID aborts rather than overwrites.
            write = store.add(row); rows = [...rows, row];
          } else {
            if (!rows.some(row => row.id === change.remove)) throw Error("photo-missing");
            write = store.delete(change.remove); rows = rows.filter(row => row.id !== change.remove);
          }
          write.onsuccess = () => { try { check(); } catch (error) { failure = error; abort(); } };
        } catch (error) { failure = error; abort(); }
      };
    });
  } finally { db.close(); }
}
// Browser APIs are touched lazily; CloudStore never opens this database.
export const browserDemoPhotos: DemoPhotoRepository = {
  read: () => transaction(),
  change: (change, check, signal) => transaction(change, check, signal),
};
