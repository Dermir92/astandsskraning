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
  type Observation,
  type Report,
  type Room,
} from "@/lib/model";

export const STORAGE_KEY = "astandsskraning-demo-v1";
export interface PreviewPhoto {
  id: string;
  url: string;
  name: string;
}
type SaveStatus = "loading" | "saved" | "error" | "memory";
interface Snapshot {
  reports: Report[];
  status: SaveStatus;
  warning: string;
  photos: Record<string, PreviewPhoto[]>;
}

class DemoStore {
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
      if (raw) {
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
        status: "error",
        warning:
          "Ekki tókst að lesa staðbundin drög. Sýnigögn eru sýnd. Fyrri gögn verða ekki yfirskrifuð fyrr en þú breytir skráningu.",
      });
    }
  };
  private persist(reports: Report[]) {
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
        warning:
          "Breytingar eru aðeins í minni. Vafrinn gat ekki vistað drögin; hafðu gluggann opinn og reyndu aftur.",
      });
    }
  }
  retrySave = () => this.persist(this.snapshot.reports);
  createReport = () => {
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
    this.persist([report, ...this.snapshot.reports]);
    return id;
  };
  updateReport = (id: string, update: (report: Report) => Report) => {
    this.persist(
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
    this.updateReport(reportId, (r) => ({
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
  addPhoto = (key: string, photo: PreviewPhoto) =>
    this.emit({
      ...this.snapshot,
      photos: {
        ...this.snapshot.photos,
        [key]: [...(this.snapshot.photos[key] ?? []), photo],
      },
    });
  removePhoto = (key: string, id: string) => {
    const photo = this.snapshot.photos[key]?.find((p) => p.id === id);
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
    Object.keys(this.snapshot.photos)
      .filter((k) => k.startsWith(`${reportId}:${roomId}:`))
      .forEach((key) => {
        this.snapshot.photos[key].forEach((p) => this.removePhoto(key, p.id));
      });
    this.updateReport(reportId, (r) => ({
      ...r,
      rooms: r.rooms.filter((room) => room.id !== roomId),
    }));
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
