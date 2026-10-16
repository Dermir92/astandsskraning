export type AssetType = "apartment" | "vehicle" | "storage" | "commercial";
export type Condition =
  "good" | "wear" | "defect" | "damaged" | "uninspected" | "na";
export type Functionality = "works" | "broken" | "untested" | "na";
export type Cleanliness = "clean" | "dirty" | "uninspected" | "na";
export type RoomType =
  | "entry"
  | "living"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "laundry"
  | "storage"
  | "balcony"
  | "custom";

export interface Observation {
  condition?: Condition;
  functionality?: Functionality;
  cleanliness?: Cleanliness;
  damageType: string;
  location: string;
  description: string;
  note: string;
}
export interface ChecklistItem {
  id: string;
  name: string;
  functionality?: boolean;
  cleanliness?: boolean;
}
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  items: ChecklistItem[];
  observations: Record<string, Observation>;
}
export interface ApartmentDetails {
  inspectionType: "" | "initial" | "final" | "independent";
  address: string;
  postalCode: string;
  municipality: string;
  unit: string;
  role: "" | "landlord" | "tenant" | "representative";
  deliveryDate: string;
  furnished: "" | "yes" | "no" | "partly";
  notes: string;
}
export interface Report {
  id: string;
  assetType: AssetType;
  title: string;
  subtitle: string;
  updatedAt: string;
  sampleReviewed?: boolean;
  details: ApartmentDetails;
  rooms: Room[];
}
export const MAX_REPORTS = 500;
export const EMPTY_OBSERVATION: Observation = {
  damageType: "",
  location: "",
  description: "",
  note: "",
};
export const EMPTY_DETAILS: ApartmentDetails = {
  inspectionType: "",
  address: "",
  postalCode: "",
  municipality: "",
  unit: "",
  role: "",
  deliveryDate: "",
  furnished: "",
  notes: "",
};
export const CONDITIONS: Condition[] = [
  "good",
  "wear",
  "defect",
  "damaged",
  "uninspected",
  "na",
];
export const FUNCTIONALITIES: Functionality[] = [
  "works",
  "broken",
  "untested",
  "na",
];
export const CLEANLINESS: Cleanliness[] = [
  "clean",
  "dirty",
  "uninspected",
  "na",
];
export const ROOM_TYPES: RoomType[] = [
  "entry",
  "living",
  "kitchen",
  "bedroom",
  "bathroom",
  "laundry",
  "storage",
  "balcony",
  "custom",
];

const common: ChecklistItem[] = [
  { id: "floor", name: "Gólfefni", cleanliness: true },
  { id: "walls", name: "Veggir" },
  { id: "ceiling", name: "Loft" },
  { id: "windows", name: "Gluggar", functionality: true, cleanliness: true },
  { id: "doors", name: "Hurðir og læsingar", functionality: true },
  { id: "lights", name: "Ljós og rofar", functionality: true },
];
const extra: Partial<Record<RoomType, ChecklistItem[]>> = {
  entry: [
    { id: "closets", name: "Skápar", functionality: true, cleanliness: true },
  ],
  bedroom: [
    {
      id: "closets",
      name: "Fataskápar",
      functionality: true,
      cleanliness: true,
    },
  ],
  kitchen: [
    {
      id: "cabinets",
      name: "Innréttingar",
      functionality: true,
      cleanliness: true,
    },
    { id: "counter", name: "Borðplötur", cleanliness: true },
    {
      id: "sink",
      name: "Vaskur og krani",
      functionality: true,
      cleanliness: true,
    },
    { id: "stove", name: "Helluborð", functionality: true, cleanliness: true },
    { id: "oven", name: "Ofn", functionality: true, cleanliness: true },
    { id: "hood", name: "Eldhúsvifta", functionality: true, cleanliness: true },
    { id: "fridge", name: "Ísskápur", functionality: true, cleanliness: true },
    {
      id: "dishwasher",
      name: "Uppþvottavél",
      functionality: true,
      cleanliness: true,
    },
  ],
  bathroom: [
    { id: "toilet", name: "Salerni", functionality: true, cleanliness: true },
    {
      id: "shower",
      name: "Sturta eða bað",
      functionality: true,
      cleanliness: true,
    },
    {
      id: "sink",
      name: "Vaskur og krani",
      functionality: true,
      cleanliness: true,
    },
    { id: "drain", name: "Frárennsli", functionality: true, cleanliness: true },
    { id: "ventilation", name: "Loftræsting", functionality: true },
    { id: "moisture", name: "Sýnileg rakamerki" },
  ],
  laundry: [
    { id: "drain", name: "Lagnir og frárennsli", functionality: true },
    { id: "washer", name: "Þvottavél", functionality: true, cleanliness: true },
    { id: "dryer", name: "Þurrkari", functionality: true, cleanliness: true },
  ],
  storage: [{ id: "moisture", name: "Sýnileg rakamerki" }],
  balcony: [
    { id: "railing", name: "Handrið" },
    { id: "drain", name: "Frárennsli", functionality: true },
  ],
};
export function makeRoom(
  type: RoomType,
  name: string,
  id = crypto.randomUUID(),
): Room {
  const base =
    type === "balcony"
      ? common.filter((i) => ["floor", "walls", "doors"].includes(i.id))
      : common;
  return {
    id,
    type,
    name,
    items: [...base, ...(extra[type] ?? [])].map((i) => ({ ...i })),
    observations: {},
  };
}
export function initialRooms(): Room[] {
  return [
    makeRoom("entry", "Forstofa"),
    makeRoom("living", "Stofa"),
    makeRoom("kitchen", "Eldhús"),
    makeRoom("bedroom", "Svefnherbergi"),
    makeRoom("bathroom", "Baðherbergi"),
  ];
}
export function requiresDamage(o?: Observation): boolean {
  return (
    !!o &&
    o.condition !== "na" &&
    (o.condition === "damaged" ||
      o.condition === "defect" ||
      o.functionality === "broken")
  );
}
export function observationComplete(
  item: ChecklistItem,
  o?: Observation,
): boolean {
  if (!o?.condition) return false;
  if (o.condition === "na") return true;
  if (item.functionality && !o.functionality) return false;
  if (item.cleanliness && !o.cleanliness) return false;
  return (
    !requiresDamage(o) ||
    !!(o.damageType.trim() && o.location.trim() && o.description.trim())
  );
}
export function needsAttention(item: ChecklistItem, o?: Observation): boolean {
  if (!observationComplete(item, o)) return true;
  if (o?.condition === "na") return false;
  return (
    o?.condition === "uninspected" ||
    o?.functionality === "untested" ||
    o?.cleanliness === "uninspected"
  );
}
export function roomStats(room: Room) {
  return {
    total: room.items.length,
    recorded: room.items.filter((i) =>
      observationComplete(i, room.observations[i.id]),
    ).length,
    unanswered: room.items.filter((i) => !room.observations[i.id]?.condition)
      .length,
    attention: room.items.filter((i) =>
      needsAttention(i, room.observations[i.id]),
    ).length,
    deviations: room.items.filter((i) => {
      const o = room.observations[i.id];
      return (
        requiresDamage(o) ||
        (o?.condition !== "na" && o?.cleanliness === "dirty")
      );
    }).length,
  };
}
export function reportStats(report: Report) {
  return report.rooms.reduce(
    (sum, r) => {
      const s = roomStats(r);
      return {
        total: sum.total + s.total,
        recorded: sum.recorded + s.recorded,
        unanswered: sum.unanswered + s.unanswered,
        attention: sum.attention + s.attention,
        deviations: sum.deviations + s.deviations,
      };
    },
    { total: 0, recorded: 0, unanswered: 0, attention: 0, deviations: 0 },
  );
}
export type ReportStatus = "draft" | "active" | "reviewed";
export function reportStatus(report: Report): ReportStatus {
  if (report.sampleReviewed) return "reviewed";
  return report.rooms.some((r) =>
    Object.values(r.observations).some((o) => o.condition),
  )
    ? "active"
    : "draft";
}
export function missingDetails(d: ApartmentDetails): string[] {
  return [
    !d.inspectionType && "Tegund skráningar",
    !d.address.trim() && "Heimilisfang",
    !/^\d{3}$/.test(d.postalCode) && "Póstnúmer (3 tölustafir)",
    !d.municipality.trim() && "Sveitarfélag",
    !d.role && "Hlutverk stofnanda",
    !/^\d{4}-\d{2}-\d{2}$/.test(d.deliveryDate) && "Dagsetning afhendingar",
    !d.furnished && "Hvort húsgögn fylgi",
  ].filter((v): v is string => !!v);
}
export function reportTitle(report: Report) {
  return report.details.address.trim() || report.title || "Ónefnd íbúð";
}
export function formatDate(date: string) {
  // Chromium and Node do not always ship the same Icelandic ICU locale data.
  // A deterministic formatter keeps Icelandic copy and SSR hydration identical.
  const parsed = new Date(date);
  const months = [
    "jan.",
    "feb.",
    "mar.",
    "apr.",
    "maí",
    "jún.",
    "júl.",
    "ágú.",
    "sep.",
    "okt.",
    "nóv.",
    "des.",
  ];
  return `${parsed.getUTCDate()}. ${months[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
}

// Validate the complete local document before loading it. Untrusted browser data never enters the UI unchecked.
function record(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function stringFields(v: Record<string, unknown>, keys: string[]) {
  return keys.every((k) => typeof v[k] === "string");
}
function optionalChoice(v: unknown, choices: string[]) {
  return v === undefined || (typeof v === "string" && choices.includes(v));
}
export function isReportList(value: unknown): value is Report[] {
  if (!Array.isArray(value) || value.length > MAX_REPORTS) return false;
  return (
    value.every((r: unknown) => {
      if (
        !record(r) ||
        !stringFields(r, ["id", "title", "subtitle", "updatedAt"]) ||
        !optionalChoice(r.assetType, [
          "apartment",
          "vehicle",
          "storage",
          "commercial",
        ]) ||
        !r.assetType ||
        Number.isNaN(Date.parse(r.updatedAt as string))
      )
        return false;
      if (
        r.sampleReviewed !== undefined &&
        typeof r.sampleReviewed !== "boolean"
      )
        return false;
      const d = r.details;
      if (
        !record(d) ||
        !stringFields(d, Object.keys(EMPTY_DETAILS)) ||
        !["", "initial", "final", "independent"].includes(
          d.inspectionType as string,
        ) ||
        !["", "landlord", "tenant", "representative"].includes(
          d.role as string,
        ) ||
        !["", "yes", "no", "partly"].includes(d.furnished as string)
      )
        return false;
      return (
        Array.isArray(r.rooms) &&
        r.rooms.length <= 100 &&
        r.rooms.every((room: unknown) => {
          if (
            !record(room) ||
            !stringFields(room, ["id", "name", "type"]) ||
            !ROOM_TYPES.includes(room.type as RoomType) ||
            !Array.isArray(room.items) ||
            room.items.length > 100 ||
            !record(room.observations)
          )
            return false;
          const itemsValid = room.items.every(
            (i: unknown) =>
              record(i) &&
              stringFields(i, ["id", "name"]) &&
              (i.functionality === undefined ||
                typeof i.functionality === "boolean") &&
              (i.cleanliness === undefined ||
                typeof i.cleanliness === "boolean"),
          );
          const observationsValid = Object.values(room.observations).every(
            (o) =>
              record(o) &&
              stringFields(o, [
                "damageType",
                "location",
                "description",
                "note",
              ]) &&
              optionalChoice(o.condition, CONDITIONS) &&
              optionalChoice(o.functionality, FUNCTIONALITIES) &&
              optionalChoice(o.cleanliness, CLEANLINESS),
          );
          return itemsValid && observationsValid;
        })
      );
    }) && new Set(value.map((r) => r.id)).size === value.length
  );
}
