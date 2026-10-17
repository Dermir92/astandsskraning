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
import {
  EMPTY_DETAILS,
  initialRooms,
  isReportList,
  MAX_REPORTS,
  type Observation,
  type Report,
  type Room,
} from "@/lib/model";

export const STORAGE_KEY = "astandsskraning-demo-v1";
const WRITE_FAILURE_WARNING =
  "Breytingar eru aðeins í minni. Vafrinn gat ekki vistað drögin; hafðu gluggann opinn og reyndu aftur.";
export interface PreviewPhoto {
  id: string;
  url: string;
  name: string;
}
type SaveStatus =
  | "loading"
  | "saved"
  | "error"
  | "read-error"
  | "validation-error"
  | "memory";
interface Snapshot {
  reports: Report[];
  status: SaveStatus;
  warning: string;
  photos: Record<string, PreviewPhoto[]>;
}

export class DemoStore {
  private initial: Snapshot = {
    reports: demoReports(),
    status: "loading",
    warning: "",
    photos: {},
  };
  private snapshot = this.initial;
  private listeners = new Set<() => void>();
  private hydrated = false;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => this.initial;
  private emit(snapshot: Snapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((l) => l());
  }
  hydrate = () => {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const saved: unknown = JSON.parse(raw);
        if (
          !saved ||
          typeof saved !== "object" ||
          !("version" in saved) ||
          saved.version !== 1 ||
          !("reports" in saved) ||
          !isReportList(saved.reports)
        )
          throw new Error("invalid-local-data");
        this.emit({
          ...this.snapshot,
          reports: saved.reports,
          status: "saved",
        });
      } else {
        this.emit({ ...this.snapshot, status: "memory" });
      }
    } catch {
      this.emit({
        ...this.snapshot,
        status: "read-error",
        warning:
          "Ekki tókst að lesa staðbundin drög. Gögnin eru óaðgengileg eða á ógildu eða óstuddu sniði. Upprunalegum gögnum er ekki breytt. Sýnigögn eru aðeins til skoðunar; breytingar og vistun eru læstar. Endurheimt eða útskipti gagnanna þarf að ákveða sérstaklega.",
      });
    }
  };
  private canEdit() {
    return (
      this.snapshot.status !== "loading" &&
      this.snapshot.status !== "read-error"
    );
  }
  private rejectMutation(warning: string) {
    const pendingWrite = this.snapshot.status === "error";
    this.emit({
      ...this.snapshot,
      status: pendingWrite ? "error" : "validation-error",
      warning: pendingWrite ? `${warning} ${WRITE_FAILURE_WARNING}` : warning,
    });
  }
  private persist(reports: Report[]) {
    // Never turn fallback fixtures into a replacement for unreadable source data.
    if (!this.canEdit()) return false;
    if (!isReportList(reports)) {
      this.rejectMutation(
        "Ekki var hægt að samþykkja breytinguna: gögnin uppfylla ekki skilyrði fyrir vistun og endurhleðslu. Fyrri gögn eru óbreytt.",
      );
      return false;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, reports }),
      );
      this.emit({ ...this.snapshot, reports, status: "saved", warning: "" });
    } catch {
      this.emit({
        ...this.snapshot,
        reports,
        status: "error",
        warning: WRITE_FAILURE_WARNING,
      });
    }
    // A valid draft remains usable in memory when the storage write fails.
    return true;
  }
  retrySave = () => {
    if (this.snapshot.status === "error") this.persist(this.snapshot.reports);
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
      rooms: initialRooms(),
    };
    return this.persist([report, ...this.snapshot.reports]) ? id : null;
  };
  updateReport = (id: string, update: (report: Report) => Report) => {
    if (!this.canEdit()) return false;
    return this.persist(
      this.snapshot.reports.map((r) =>
        r.id === id ? { ...update(r), updatedAt: new Date().toISOString() } : r,
      ),
    );
  };
  updateRoom = (
    reportId: string,
    roomId: string,
    update: (room: Room) => Room,
  ) => {
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
    this.updateRoom(reportId, roomId, (room) => ({
      ...room,
      observations: { ...room.observations, [itemId]: observation },
    }));
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
const DemoContext = createContext<{ state: Snapshot; store: DemoStore } | null>(
  null,
);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new DemoStore());
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useEffect(() => {
    store.hydrate();
  }, [store]);
  return (
    <DemoContext.Provider value={{ state, store }}>
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider is missing");
  return value;
}
