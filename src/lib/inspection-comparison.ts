import { EMPTY_DETAILS, isCalendarDate, observationComplete, requiresDamage, type ApartmentDetails, type ChecklistItem, type Observation, type Report, type Room } from "./model";
import { is } from "./locale/is";

export interface LinkedItem { initialItemId: string; finalItemId: string; retired?: boolean }
export interface LinkedRoom { initialRoomId: string; finalRoomId: string; retired?: boolean; items: LinkedItem[] }
export interface LinkedInitial {
  version: 1;
  initialReportId: string;
  sourceFingerprint: string;
  finalContextFingerprint: string;
  rooms: LinkedRoom[];
}
// Only these declared facts are reused. No broad spread of source details or observations.
export const COPIED_PROPERTY_FIELDS = ["address", "postalCode", "municipality", "unit", "inspectionContext"] as const;
export const COPIED_RENTAL_FIELDS = ["landlordNames", "tenantNames", "leaseDate", "leaseReference", "propertyNumber", "premisesDescription", "includedAreasDescription", "excludedAreasDescription"] as const;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const id = (v: unknown) => typeof v === "string" && v.length > 0;
const fingerprint = (v: unknown) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
export function validLinkedInitial(v: unknown): boolean {
  if (v === undefined) return true;
  return object(v) && v.version === 1 && id(v.initialReportId) && fingerprint(v.sourceFingerprint) && fingerprint(v.finalContextFingerprint) &&
    Array.isArray(v.rooms) && v.rooms.length <= 100 && v.rooms.every(r => object(r) && id(r.initialRoomId) && id(r.finalRoomId) && (r.retired === undefined || typeof r.retired === "boolean") &&
      Array.isArray(r.items) && r.items.length <= 100 && r.items.every(i => object(i) && id(i.initialItemId) && id(i.finalItemId) && (i.retired === undefined || typeof i.retired === "boolean")));
}
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (object(v)) return `{${Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v) ?? "null";
}
export async function contentFingerprint(v: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(v)));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
export function sourceContent(report: Report) {
  // updatedAt is mutable metadata, not an inspection date or revision identity.
  const data = { ...report } as Partial<Report>;
  delete data.updatedAt;
  return data;
}
export function finalContext(report: Report) {
  const d = report.details;
  return { assetType: report.assetType, inspectionType: d.inspectionType,
    ...Object.fromEntries(COPIED_PROPERTY_FIELDS.map(k => [k, d[k]])),
    rental: d.inspectionContext === "residential_rental" ? Object.fromEntries(COPIED_RENTAL_FIELDS.map(k => [k, d.rentalInformation?.[k]])) : undefined };
}
function unique<T extends { id: string }>(rows: readonly T[], value: string): T | undefined {
  const found = rows.filter(r => r.id === value);
  return found.length === 1 ? found[0] : undefined;
}
export function initialEligible(report: Report): boolean {
  return !!report.id && report.assetType === "apartment" && !report.sampleReviewed && !report.linkedInitial && report.details.inspectionType === "initial" &&
    new Set(report.rooms.map(r => r.id)).size === report.rooms.length && report.rooms.every(r => !!r.id && r.items.every(i => !!i.id) && new Set(r.items.map(i => i.id)).size === r.items.length);
}
export function copiedFinal(initial: Report, reportId: string, now: string, uuid: () => string): Report {
  const details: ApartmentDetails = { ...EMPTY_DETAILS, inspectionType: "final" };
  for (const key of COPIED_PROPERTY_FIELDS) Object.assign(details, { [key]: initial.details[key] ?? "" });
  if (details.inspectionContext === "residential_rental" && initial.details.rentalInformation) {
    details.rentalInformation = {};
    for (const key of COPIED_RENTAL_FIELDS) if (initial.details.rentalInformation[key] !== undefined) details.rentalInformation[key] = initial.details.rentalInformation[key];
  }
  const rooms = initial.rooms.map(room => ({ id: uuid(), name: room.name, type: room.type,
    items: room.items.map(item => ({ id: uuid(), name: item.name, ...(item.kind ? { kind: item.kind } : {}),
      ...(item.functionality !== undefined ? { functionality: item.functionality } : {}), ...(item.cleanliness !== undefined ? { cleanliness: item.cleanliness } : {}) })), observations: {} }));
  return { id: reportId, assetType: "apartment", title: initial.title, subtitle: "Lokaskoðun · drög", updatedAt: now, details, rooms };
}
export function initialAssociations(initial: Report, final: Report): LinkedRoom[] {
  // Only at deliberate creation, over the structure just constructed above. Never on reconfirmation.
  return initial.rooms.map((r, index) => ({ initialRoomId: r.id, finalRoomId: final.rooms[index].id,
    items: r.items.map((item, n) => ({ initialItemId: item.id, finalItemId: final.rooms[index].items[n].id })) }));
}
export function retireMissingAssociations(before: Report, after: Report): Report {
  if (!before.linkedInitial || !after.linkedInitial) return after;
  const rooms = after.linkedInitial.rooms.map(pair => {
    const old = before.linkedInitial!.rooms.find(r => r.finalRoomId === pair.finalRoomId);
    const room = unique(after.rooms, pair.finalRoomId);
    const retired = pair.retired || old?.retired || !room;
    return { ...pair, ...(retired ? { retired: true } : {}), items: pair.items.map(item => {
      const wasRetired = old?.items.find(i => i.finalItemId === item.finalItemId)?.retired;
      return retired || item.retired || wasRetired || !unique(room?.items ?? [], item.finalItemId) ? { ...item, retired: true } : item;
    }) };
  });
  return { ...after, linkedInitial: { ...after.linkedInitial, rooms } };
}

export type AssessmentState = "same" | "changed" | "missing" | "limited" | "not_comparable";
export interface ComparedField { label: string; initial: string; final: string; state: AssessmentState }
export interface ComparedItem {
  key: string; initialRoom?: Room; finalRoom?: Room; initialItem?: ChecklistItem; finalItem?: ChecklistItem;
  fields: ComparedField[]; text: ComparedField[]; labels: string[]; changed: boolean; same: boolean;
}
export interface InspectionComparison {
  status: "ready" | "changed" | "unavailable" | "inactive";
  reason: string; initial?: Report; final: Report; sourceFingerprint?: string; finalContextFingerprint?: string;
  items: ComparedItem[]; dateNotice: string;
}
const supplied = (v?: string) => !!v?.trim();
const stateLabels: Record<AssessmentState, string> = { same: "Engin breyting skráð", changed: "Skráður munur til yfirferðar", missing: "Upplýsingar vantar", limited: "Óskoðað eða óprófað", not_comparable: "Ekki samanburðarhæft" };
export const comparisonStateLabel = (state: AssessmentState) => stateLabels[state];
export function compareOrdinary(initialItem: ChecklistItem, finalItem: ChecklistItem, a?: Observation, b?: Observation) {
  const fields: ComparedField[] = [];
  for (const key of ["condition", "functionality", "cleanliness"] as const) {
    const requestedA = key === "condition" || !!initialItem[key], requestedB = key === "condition" || !!finalItem[key];
    const av = a?.[key], bv = b?.[key];
    const labels = key === "condition" ? is.conditions : key === "functionality" ? is.functionality : is.cleanliness;
    let state: AssessmentState;
    if (!requestedA || !requestedB || a?.condition === "na" || b?.condition === "na" || av === "na" || bv === "na") state = "not_comparable";
    else if (!av || !bv) state = "missing";
    else if (av === "uninspected" || av === "untested" || bv === "uninspected" || bv === "untested") state = "limited";
    else state = av === bv ? "same" : "changed";
    if (requestedA || requestedB || av || bv) fields.push({ label: { condition: "Ástand", functionality: "Virkni", cleanliness: "Þrif" }[key],
      initial: !requestedA ? "Utan matsþátta gátlista" : key !== "condition" && a?.condition === "na" ? "Á ekki við" : av ? (labels as Record<string, string>)[av] : "Óskráð",
      final: !requestedB ? "Utan matsþátta gátlista" : key !== "condition" && b?.condition === "na" ? "Á ekki við" : bv ? (labels as Record<string, string>)[bv] : "Óskráð", state });
  }
  const incomplete = !observationComplete(initialItem, a) || !observationComplete(finalItem, b);
  const textAssessmentState = fields.find(f => f.state === "missing")?.state ?? fields.find(f => f.state === "limited")?.state ?? fields.find(f => f.state === "not_comparable")?.state ?? (incomplete ? "missing" : undefined);
  const text: ComparedField[] = [];
  for (const key of ["damageType", "location", "description", "note"] as const) {
    const applicableA = key === "note" || requiresDamage(a, initialItem), applicableB = key === "note" || requiresDamage(b, finalItem);
    const av = applicableA ? a?.[key] : undefined, bv = applicableB ? b?.[key] : undefined;
    // Missing assessments are not text changes; inactive defect prose is not a required answer.
    const state: AssessmentState = !a?.condition || !b?.condition ? "missing" : !applicableA || !applicableB ? "not_comparable" : textAssessmentState ?? (av === bv ? "same" : "changed");
    if (supplied(av) || supplied(bv)) text.push({ label: { damageType: "Tegund fráviks", location: "Staðsetning", description: "Lýsing", note: "Athugasemd" }[key],
      initial: a?.condition && !applicableA ? "Á ekki við" : supplied(av) ? av! : "Óskráð", final: b?.condition && !applicableB ? "Á ekki við" : supplied(bv) ? bv! : "Óskráð", state });
  }
  const changed = fields.some(f => f.state === "changed") || text.some(f => f.state === "changed");
  const same = !incomplete && fields.every(f => f.state === "same") && !text.some(f => f.state === "changed");
  const labels = [...new Set(fields.filter(f => f.state !== "same").map(f => stateLabels[f.state]))];
  if (incomplete && !labels.includes(stateLabels.missing)) labels.push("Skráning ófullgerð");
  if (text.some(f => f.state === "changed")) labels.push("Textamunur til yfirferðar · ekki niðurstaða um breytingu á eign");
  if (b?.condition === "wear") labels.push("Notkunarmerki · mat skráningaraðila");
  if (requiresDamage(b, finalItem) || b?.condition !== "na" && b?.cleanliness === "dirty") labels.push("Frávik skráð í lokaskoðun");
  if (same) labels.unshift(stateLabels.same);
  return { fields, text, labels, changed, same };
}
export async function buildInspectionComparison(final: Report, reports: readonly Report[]): Promise<InspectionComparison | null> {
  const link = final.linkedInitial;
  if (!link) return null;
  const result: InspectionComparison = { status: "unavailable", reason: "Ekki er hægt að bera saman þessar skráningar.", final, items: [], dateNotice: "Dagsetningar og röð skoðana eru uppgefnar, ekki sannreyndar. Breytingadagsetning er ekki skoðunardagur." };
  if (!validLinkedInitial(link)) return result;
  const initial = unique(reports, link.initialReportId);
  if (final.assetType !== "apartment" || final.sampleReviewed || final.details.inspectionType !== "final") return { ...result, status: "inactive", reason: "Tenging varðveitt utan lokaskoðunar. Enginn samanburður er reiknaður." };
  if (!initial || initial.id === final.id || !initialEligible(initial)) return { ...result, reason: "Valin upphafsskoðun er ekki tiltæk eða hefur ekki ótvíræð auðkenni og rétta tegund." };
  result.initial = initial;
  const [source, context] = await Promise.all([contentFingerprint(sourceContent(initial)), contentFingerprint(finalContext(final))]);
  result.sourceFingerprint = source; result.finalContextFingerprint = context;
  if (source !== link.sourceFingerprint || context !== link.finalContextFingerprint) return { ...result, status: "changed", reason: "Samanburður í bið: upphafsgögn eða eignar-/leigusamhengi hafa breyst. Skoðaðu núverandi gögn og staðfestu viðmiðið sérstaklega." };
  result.status = "ready"; result.reason = "Samanburður núverandi draga · tenging valin af notanda, ekki sannreynd.";
  const ad = initial.details.inspectionDate, bd = final.details.inspectionDate;
  if (!ad || !bd || !isCalendarDate(ad) || !isCalendarDate(bd)) result.dateNotice = "Skoðunardagsetningu vantar eða hún er ógild. Röð atburða er óstaðfest.";
  else if (bd < ad) result.dateNotice = "Uppgefin lokadagsetning er á undan upphafsdagsetningu. Röð atburða þarfnast yfirferðar.";
  const usedInitial = new Set<string>(), usedFinal = new Set<string>();
  const roomPairs = link.rooms;
  for (const p of roomPairs) {
    if (p.retired) continue;
    const ar = unique(initial.rooms, p.initialRoomId), br = unique(final.rooms, p.finalRoomId);
    const roomUnique = roomPairs.filter(r => !r.retired && (r.initialRoomId === p.initialRoomId || r.finalRoomId === p.finalRoomId)).length === 1;
    if (!ar || !br || !roomUnique) continue;
    for (const q of p.items) {
      if (q.retired || p.items.filter(i => !i.retired && (i.initialItemId === q.initialItemId || i.finalItemId === q.finalItemId)).length !== 1) continue;
      const ai = unique(ar.items, q.initialItemId), bi = unique(br.items, q.finalItemId);
      if (!ai || !bi) continue;
      const keyA = JSON.stringify([ar.id, ai.id]), keyB = JSON.stringify([br.id, bi.id]);
      usedInitial.add(keyA); usedFinal.add(keyB);
      const ordinary = !ai.kind && !bi.kind;
      const facts = ordinary ? compareOrdinary(ai, bi, ar.observations[ai.id], br.observations[bi.id]) : { fields: [], text: [], labels: ["Hiti eða ósamrýmanlegt atriði · aðskildar skráningar, enginn sjálfvirkur samanburðardómur"], changed: false, same: false };
      result.items.push({ key: keyB, initialRoom: ar, finalRoom: br, initialItem: ai, finalItem: bi, ...facts });
    }
  }
  for (const [report, side, used] of [[initial, "initial", usedInitial], [final, "final", usedFinal]] as const) for (const room of report.rooms) for (const item of room.items) {
    const key = JSON.stringify([room.id, item.id]);
    if (!used.has(key)) result.items.push({ key: `${side}:${key}`, ...(side === "initial" ? { initialRoom: room, initialItem: item } : { finalRoom: room, finalItem: item }), fields: [], text: [], labels: ["Ekki samanburðarhæft", side === "initial" ? "Aðeins í upphafsskráningu · ekki staðfest fjarlæging" : "Aðeins í lokaskráningu · ekki staðfest viðbót við eign"], changed: false, same: false });
  }
  return result;
}
