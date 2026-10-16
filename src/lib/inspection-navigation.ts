import { observationComplete, requiresDamage, roomStats, type ChecklistItem, type Observation, type Report, type Room } from "./model";

export const POSITION_PREFIX = "astandsskraning-navigation-v1:";
export type InspectionPosition = { roomId: string; itemId: string | null };
export type PositionEntry = { position: InspectionPosition | null; unavailable: boolean };
type PositionStorage = Pick<Storage, "getItem" | "setItem">;
const MAX_POSITION_LENGTH = 4096;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export const positionKey = (reportId: string) => `${POSITION_PREFIX}${encodeURIComponent(reportId)}`;

export function decodePosition(raw: string): InspectionPosition | null {
  if (raw.length > MAX_POSITION_LENGTH) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== 1 || typeof value.roomId !== "string" || !value.roomId ||
      !(value.itemId === null || (typeof value.itemId === "string" && !!value.itemId)) ||
      Object.keys(value).some(key => !["version", "roomId", "itemId"].includes(key))) return null;
    return { roomId: value.roomId, itemId: value.itemId };
  } catch { return null; }
}

function uniqueRoom(report: Report, id: string) {
  const rooms = report.rooms.filter(room => room.id === id);
  return rooms.length === 1 ? rooms[0] : undefined;
}
function uniqueItem(room: Room, id: string | null) {
  const items = room.items.filter(item => item.id === id);
  return items.length === 1 ? items[0] : undefined;
}
export function validPosition(report: Report, position?: InspectionPosition | null): InspectionPosition | null {
  if (!position) return null;
  const room = uniqueRoom(report, position.roomId);
  return room ? { roomId: room.id, itemId: uniqueItem(room, position.itemId)?.id ?? null } : null;
}

// Independent from DemoStore: this adapter never receives a report mutation callback.
// Storage is injected so its failures and raw-data protection can be tested directly.
export class InspectionPositions {
  private snapshot: Record<string, PositionEntry> = {};
  private listeners = new Set<() => void>();
  private blocked = new Set<string>();
  constructor(private storage: () => PositionStorage) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(id: string, entry: PositionEntry) {
    this.snapshot = { ...this.snapshot, [id]: entry };
    this.listeners.forEach(listener => listener());
  }
  load(reportId: string) {
    if (Object.hasOwn(this.snapshot, reportId)) return;
    try {
      const key = positionKey(reportId);
      if (key.length > MAX_POSITION_LENGTH) throw new Error("position-key-too-long");
      const raw = this.storage().getItem(key);
      const position = raw === null ? null : decodePosition(raw);
      if (raw !== null && !position) throw new Error("invalid-position");
      this.emit(reportId, { position, unavailable: false });
    } catch {
      // Do not overwrite an unreadable or unsupported source entry in this session.
      this.blocked.add(reportId);
      this.emit(reportId, { position: null, unavailable: true });
    }
  }
  remember(report: Report, candidate: InspectionPosition) {
    this.load(report.id);
    const position = validPosition(report, candidate);
    if (!position || position.itemId !== candidate.itemId) return;
    const previous = this.snapshot[report.id];
    if (previous.position?.roomId === position.roomId && previous.position.itemId === position.itemId) return;
    let unavailable = this.blocked.has(report.id);
    if (!unavailable) {
      try {
        const raw = JSON.stringify({ version: 1, ...position });
        if (raw.length > MAX_POSITION_LENGTH) throw new Error("position-too-long");
        this.storage().setItem(positionKey(report.id), raw);
      } catch { unavailable = true; }
    }
    this.emit(report.id, { position, unavailable });
  }
}

export function resolveInspection(report: Report, params: URLSearchParams, saved?: InspectionPosition | null) {
  const explicit = params.has("rymi") || params.has("atridi");
  const position = explicit ? {
    roomId: params.get("rymi") ?? "",
    itemId: params.get("atridi"),
  } : saved;
  const malformed = explicit && (params.getAll("rymi").length !== 1 || params.getAll("atridi").length > 1 ||
    !params.get("rymi") || (params.has("atridi") && !params.get("atridi")));
  const requestedRoom = position && !malformed ? uniqueRoom(report, position.roomId) : undefined;
  const room = requestedRoom ?? report.rooms.find(room => roomStats(room).recorded < room.items.length) ?? report.rooms[0];
  const item = requestedRoom ? uniqueItem(requestedRoom, position?.itemId ?? null) : undefined;
  return {
    room, item,
    invalid: !!position && (!!malformed || !requestedRoom || (!!position.itemId && !item)),
    position: room ? { roomId: room.id, itemId: item?.id ?? null } : null,
  };
}

export function inspectionHref(reportId: string, position?: InspectionPosition | null, origin?: InspectionPosition | null) {
  const params = new URLSearchParams();
  if (position) {
    params.set("rymi", position.roomId);
    if (position.itemId !== null) params.set("atridi", position.itemId);
  }
  if (origin) {
    params.set("fra", "yfirferd");
    params.set("yfirferdRymi", origin.roomId);
    if (origin.itemId !== null) params.set("yfirferdAtridi", origin.itemId);
  }
  return `/skyrslur/${encodeURIComponent(reportId)}/skraning${params.size ? `?${params}` : ""}`;
}
export function reviewOrigin(params: URLSearchParams): InspectionPosition | null {
  if (params.getAll("fra").length !== 1 || params.get("fra") !== "yfirferd" ||
    params.getAll("yfirferdRymi").length !== 1 || !params.get("yfirferdRymi") || params.getAll("yfirferdAtridi").length > 1) return null;
  return { roomId: params.get("yfirferdRymi")!, itemId: params.get("yfirferdAtridi") || null };
}
export function reviewHref(reportId: string, position?: InspectionPosition | null) {
  const params = new URLSearchParams();
  if (position) {
    params.set("rymi", position.roomId);
    if (position.itemId !== null) params.set("atridi", position.itemId);
  }
  return `/skyrslur/${encodeURIComponent(reportId)}/yfirferd${params.size ? `?${params}` : ""}`;
}
export const navigationTargetId = (prefix: "inspection" | "review", roomId: string, itemId: string | null = null) =>
  `${prefix}-${encodeURIComponent(JSON.stringify([roomId, itemId]))}`;

export function itemProgress(item: ChecklistItem, observation?: Observation) {
  if (observationComplete(item, observation)) return "recorded";
  return observation && Object.values(observation).some(value => typeof value === "string" && !!value.trim()) ? "partial" : "unanswered";
}
export function missingAnswers(item: ChecklistItem, o?: Observation): { key: string; label: string }[] {
  if (o?.condition === "na") return [];
  const missing: { key: string; label: string }[] = [];
  if (!o?.condition) missing.push({ key: "condition", label: "Ástand vantar" });
  if (item.functionality && !o?.functionality) missing.push({ key: "functionality", label: "Virkni vantar" });
  if (item.cleanliness && !o?.cleanliness) missing.push({ key: "cleanliness", label: "Þrif vantar" });
  if (requiresDamage(o)) {
    if (!o?.damageType.trim()) missing.push({ key: "damageType", label: "Tegund fráviks vantar" });
    if (!o?.location.trim()) missing.push({ key: "location", label: "Staðsetningu vantar" });
    if (!o?.description.trim()) missing.push({ key: "description", label: "Lýsingu vantar" });
  }
  return missing;
}
export function inspectionItems(report: Report) {
  return report.rooms.flatMap(room => room.items.map(item => ({ room, item, observation: room.observations[item.id], position: { roomId: room.id, itemId: item.id } })));
}
export function nextIncomplete(report: Report, current: InspectionPosition) {
  const rows = inspectionItems(report);
  const index = rows.findIndex(row => row.room.id === current.roomId && row.item.id === current.itemId);
  const start = index < 0 ? rows.findIndex(row => row.room.id === current.roomId) : index + 1;
  for (let offset = 0; offset < rows.length; offset++) {
    const row = rows[((Math.max(0, start) + offset) % rows.length)];
    if (row.room.id === current.roomId && row.item.id === current.itemId) continue;
    if (!observationComplete(row.item, row.observation)) return row.position;
  }
  return null;
}
