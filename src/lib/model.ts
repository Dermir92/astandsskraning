import { validFireSafety } from "./fire-observations";
import { heatingAnswered, heatingState, validHeating } from "./heating";
import { validMeterReadings } from "./meter-readings";
import { validLinkedInitial, type LinkedInitial } from "./inspection-comparison";

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
  heating?: HeatingObservation;
  condition?: Condition;
  functionality?: Functionality;
  cleanliness?: Cleanliness;
  damageType: string;
  location: string;
  description: string;
  note: string;
}
export interface ChecklistItem {
  kind?: "space_heating";
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
export interface HeatingObservation {
  equipment?: ("radiators" | "underfloor" | "thermostat" | "other")[];
  visibility?: "visible_parts" | "reported_concealed" | "none_visible" | "not_examined" | "unknown";
  scope?: string;
  informationSource?: string;
  visibleCondition?: Exclude<Condition, "na"> | "unknown";
  operation?: "tried" | "not_tried" | "unknown";
  action?: string;
  response?: "observed" | "none_observed" | "mixed" | "unknown";
  responseDescription?: string;
}
export interface RentalRepresentation {
  nameSource?: "" | "recorder" | "other";
  name?: string;
  representedParty?: "" | "landlord" | "tenant";
  basisDescription?: string;
}
export interface ResidentialRentalInformation {
  landlordNames?: string;
  tenantNames?: string;
  leaseDate?: string;
  leaseReference?: string;
  propertyNumber?: string;
  premisesDescription?: string;
  includedAreasDescription?: string;
  excludedAreasDescription?: string;
  representation?: RentalRepresentation;
}
export type FireExamination =
  | "examined"
  | "partly_examined"
  | "not_examined"
  | "unknown";

export type FirePresence = "observed" | "none_observed" | "unknown";

export type FireVisibleCondition =
  | "no_visible_issue_observed"
  | "visible_issue_observed"
  | "not_examined"
  | "unknown";

export interface FireScope {
  examination?: FireExamination;
  examinedDescription?: string;
  unexaminedDescription?: string;
  note?: string;
}

export interface FireEquipmentEntry {
  id: string; // Stable local row ID, created only by an explicit user edit/add.
  location?: string; // Described location/set, independent of room IDs.
  observedCount?: string; // Raw user input; missing/blank is not zero.
  visibleCondition?: FireVisibleCondition;
  visibleIssueDescription?: string;
  note?: string;
}

export interface BasicDetectorTest {
  performance?: "performed" | "not_performed" | "unknown";
  testedScopeDescription?: string; // Which detector(s) this result concerns.
  result?: "response_observed" | "no_response_observed" | "unknown";
}

export interface SmokeDetectorEntry extends FireEquipmentEntry {
  basicTest?: BasicDetectorTest;
}

export interface ExtinguisherServiceLabel {
  status?: "readable" | "none_observed" | "unreadable"
    | "not_examined" | "unknown";
  observedText?: string; // Literal legible text/date(s), not a validity date.
}

export interface ExtinguisherEntry extends FireEquipmentEntry {
  serviceLabel?: ExtinguisherServiceLabel;
}

export interface FireEquipmentGroup<T extends FireEquipmentEntry>
  extends FireScope {
  presence?: FirePresence;
  entries?: T[];
}

export interface VisibleEscapeRoutes extends FireScope {
  obstruction?: "observed" | "none_observed" | "unknown";
  affectedLocation?: string;
  obstructionDescription?: string;
}

export interface ResidentialFireObservations {
  smokeDetectors?: FireEquipmentGroup<SmokeDetectorEntry>;
  extinguishers?: FireEquipmentGroup<ExtinguisherEntry>;
  escapeRoutes?: VisibleEscapeRoutes;
}


export type MeterApplicability = "separate" | "shared" | "no_meter" | "unknown" | "not_examined";
export type MeterReadingStatus = "recorded" | "not_read" | "unreadable" | "inaccessible" | "unknown";
export type MeterCapturePurpose = "optional" | "rental_initial" | "rental_return";
export interface PropertyMeterReading {
  optionalCapture?: boolean;
  applicability?: MeterApplicability;
  factsApplicability?: MeterApplicability;
  readingStatus?: MeterReadingStatus;
  readingValue?: string;
  unit?: string;
  readingDate?: string;
  meterIdentifier?: string;
  note?: string;
}
export interface PropertyMeterReadings {
  mode?: MeterCapturePurpose | "inactive";
  factsPurpose?: MeterCapturePurpose;
  electricity?: PropertyMeterReading;
  hotWater?: PropertyMeterReading;
}
export interface ApartmentDetails {
  meterReadings?: PropertyMeterReadings;
  fireSafety?: ResidentialFireObservations;
  rentalInformation?: ResidentialRentalInformation;
  inspectionContext?: "" | "standalone" | "residential_rental";
  inspectionDate?: string;
  recorderName?: string;
  scopeDescription?: string;
  scopeLimitations?: string;
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
  linkedInitial?: LinkedInitial;
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
  inspectionContext: "",
  inspectionDate: "",
  recorderName: "",
  scopeDescription: "",
  scopeLimitations: "",
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
  options: { includeHeating?: boolean } = {},
): Room {
  const base =
    type === "balcony"
      ? common.filter((i) => ["floor", "walls", "doors"].includes(i.id))
      : common;
  return {
    id,
    type,
    name,
    items: [...base, ...(options.includeHeating && type !== "balcony" ? [{ id: "space-heating", name: "Hiti", kind: "space_heating" as const }] : []), ...(extra[type] ?? [])].map((i) => ({ ...i })),
    observations: {},
  };
}
export function initialRooms(options: { includeHeating?: boolean } = {}): Room[] {
  return [
    makeRoom("entry", "Forstofa", undefined, options),
    makeRoom("living", "Stofa", undefined, options),
    makeRoom("kitchen", "Eldhús", undefined, options),
    makeRoom("bedroom", "Svefnherbergi", undefined, options),
    makeRoom("bathroom", "Baðherbergi", undefined, options),
  ];
}
export function requiresDamage(o?: Observation, item?: ChecklistItem): boolean {
  if (item?.kind === "space_heating") return heatingState(o).defect;
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
  if (item.kind === "space_heating") return heatingState(o).complete;
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
  if (item.kind === "space_heating") { const h = heatingState(o); return !h.complete || h.limitations.length > 0 || h.defect; }
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
    unanswered: room.items.filter((i) => i.kind === "space_heating" ? !heatingAnswered(room.observations[i.id]) : !room.observations[i.id]?.condition)
      .length,
    attention: room.items.filter((i) =>
      needsAttention(i, room.observations[i.id]),
    ).length,
    deviations: room.items.filter((i) => {
      const o = room.observations[i.id];
      return (
        requiresDamage(o, i) ||
        (i.kind !== "space_heating" && o?.condition !== "na" && o?.cleanliness === "dirty")
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
    Object.values(r.observations).some(o => o.condition) || r.items.some(i => i.kind === "space_heating" && heatingAnswered(r.observations[i.id])),
  )
    ? "active"
    : "draft";
}
export function missingDetails(d: ApartmentDetails): string[] {
  return detailIssues(d).map(issue => issue.label);
}

export const DETAIL_FIELDS = ["inspectionContext", "inspectionType", "address", "postalCode", "municipality", "unit", "inspectionDate", "recorderName", "role", "scopeDescription", "scopeLimitations", "deliveryDate", "furnished", "notes"] as const;
export type DetailField = (typeof DETAIL_FIELDS)[number];
export function rentalRequirements(d: ApartmentDetails) {
  const rental = d.inspectionContext === "residential_rental";
  return { role: rental, furnished: rental, deliveryDate: rental && (d.inspectionType === "initial" || d.inspectionType === "final") };
}
// Date-only values are never interpreted in the browser's local timezone.
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function inspectionDateWarning(value = "", today = new Date().toISOString().slice(0, 10)): string | undefined {
  if (!value) return undefined;
  if (!isCalendarDate(value)) return "Dagsetningin er ekki gild. Leiðréttu hana eða hreinsaðu reitinn; drögin má áfram vista.";
  if (value > today) return "Dagsetningin er í framtíðinni. Hún er varðveitt í drögum en staðfestir ekki að skoðun hafi farið fram.";
}
export function detailIssues(d: ApartmentDetails, today?: string): { field: DetailField; label: string }[] {
  const required = rentalRequirements(d);
  const issues: { field: DetailField; label: string }[] = [];
  const add = (field: DetailField, missing: boolean, label: string) => { if (missing) issues.push({ field, label }); };
  add("inspectionContext", !d.inspectionContext, "Tengsl við íbúðarleigu");
  add("inspectionType", !d.inspectionType, "Tegund skráningar");
  add("address", !d.address.trim(), "Heimilisfang");
  add("postalCode", !/^\d{3}$/.test(d.postalCode), "Póstnúmer (3 tölustafir)");
  add("municipality", !d.municipality.trim(), "Sveitarfélag");
  add("inspectionDate", !d.inspectionDate || !!inspectionDateWarning(d.inspectionDate, today), d.inspectionDate ? "Dagsetning skoðunar þarfnast yfirferðar" : "Dagsetning skoðunar");
  add("recorderName", !d.recorderName?.trim(), "Nafn skráningaraðila");
  add("scopeDescription", !d.scopeDescription?.trim(), "Umfang skoðunar");
  add("role", required.role && !d.role, "Hlutverk stofnanda");
  add("deliveryDate", required.deliveryDate && !isCalendarDate(d.deliveryDate), "Dagsetning afhendingar");
  add("furnished", required.furnished && !d.furnished, "Hvort húsgögn fylgi");
  return issues;
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
function plainRecord(v: unknown): v is Record<string, unknown> {
  return record(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
}
function validRentalInformation(value: unknown): boolean {
  if (value === undefined) return true;
  if (!plainRecord(value) || ![
    "landlordNames", "tenantNames", "leaseDate", "leaseReference", "propertyNumber",
    "premisesDescription", "includedAreasDescription", "excludedAreasDescription",
  ].every(key => value[key] === undefined || typeof value[key] === "string")) return false;
  const representative = value.representation;
  return representative === undefined || (
    plainRecord(representative) &&
    optionalChoice(representative.nameSource, ["", "recorder", "other"]) &&
    optionalChoice(representative.representedParty, ["", "landlord", "tenant"]) &&
    ["name", "basisDescription"].every(key => representative[key] === undefined || typeof representative[key] === "string")
  );
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
        !r.assetType || !validLinkedInitial(r.linkedInitial) ||
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
        // Keep the legacy contract independent of defaults for new drafts.
        !stringFields(d, ["inspectionType", "address", "postalCode", "municipality", "unit", "role", "deliveryDate", "furnished", "notes"]) ||
        !optionalChoice(d.inspectionContext, ["", "standalone", "residential_rental"]) ||
        !["inspectionDate", "recorderName", "scopeDescription", "scopeLimitations"].every(key => d[key] === undefined || typeof d[key] === "string") ||
        !validRentalInformation(d.rentalInformation) ||
        !validFireSafety(d.fireSafety) ||
        !validMeterReadings(d.meterReadings) ||
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
              optionalChoice(i.kind, ["space_heating"]) &&
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
          const heatingValid = Object.values(room.observations).every(o => record(o) && validHeating(o.heating));
          return itemsValid && observationsValid && heatingValid;
        })
      );
    }) && new Set(value.map((r) => r.id)).size === value.length
  );
}
