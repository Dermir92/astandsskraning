import { detailIssues, formatDate, inspectionDateWarning, isCalendarDate, needsAttention, observationComplete, reportStats, reportTitle, requiresDamage, roomStats, type Report } from "./model";
import { itemProgress, missingAnswers, reviewHref } from "./inspection-navigation";
import { hasRetainedDefect } from "./inspection-evidence";
import { HEATING_FIELDS, hasHeatingExtensions, heatingState } from "./heating";
import { FIRE_GROUPS, fireExamined, fireGroupStatus, fireState, hasFireData, hasFireExtensions, meaningfulFireRow, type EquipmentEntry } from "./fire-observations";
import { activeMeterPurpose, hasMeterExtensions, meterContextCurrent, meterParticipates, meterState, METER_UTILITIES, readingCapable } from "./meter-readings";
import { hasRentalExtensions, hasRentalInformation, leaseDateWarning, rentalInformationIssues, representativeName } from "./rental-information";
import { is } from "./locale/is";

export type DeepReadonly<T> = T extends readonly (infer V)[] ? readonly DeepReadonly<V>[] : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
export type PreviewSource =
  | { kind: "property" | "rental"; reportId: string }
  | { kind: "meters"; reportId: string; utility?: typeof METER_UTILITIES[number] }
  | { kind: "fire"; reportId: string; group: typeof FIRE_GROUPS[number]; rowId?: string }
  | { kind: "room" | "item" | "orphan"; reportId: string; roomId: string; itemId?: string; roomIndex: number; itemIndex?: number };
export interface PreviewField {
  key: string;
  label: string;
  value: string;
  raw?: string;
  state: "supplied" | "unanswered" | "not_requested";
  qualification?: string;
}
export type IssueCategory = "missing" | "limitation" | "concern" | "data_review";
export interface PreviewIssue {
  id: string;
  field: string;
  label: string;
  context: string;
  categories: IssueCategory[];
  task: boolean;
  anchor: string;
  priority: number;
}
export interface PreviewRecord {
  anchor: string;
  source: PreviewSource;
  title: string;
  ref?: string;
  status?: string;
  reviewHref?: string;
  fields: PreviewField[];
  retained: PreviewField[];
  children: PreviewRecord[];
  photoKeys: string[];
  issues: PreviewIssue[];
  notes: string[];
}
export interface PreviewItem extends PreviewRecord {
  kind: "ordinary" | "heating";
  complete: boolean;
  attention: boolean;
  deviation: boolean;
  limited: boolean;
  wear: boolean;
  progress: ReturnType<typeof itemProgress>;
}
export interface PreviewRoom extends PreviewRecord {
  stats: ReturnType<typeof roomStats>;
  items: PreviewItem[];
}
export interface PreviewPhoto {
  key: string;
  ref: string;
  sourcePhotoId: string;
  source: PreviewSource;
  name: string;
  url: string;
  anchor: string;
  recordAnchor: string;
  context: string;
  alt: string;
}
interface PreviewData {
  id: string;
  title: string;
  context: string;
  inspectionType: string;
  date: string;
  recorder: string;
  stats: ReturnType<typeof reportStats>;
  limitedItems: number;
  wearItems: number;
  property: PreviewRecord;
  rental: PreviewRecord | null;
  rentalActive: boolean;
  fire: PreviewRecord;
  meters: PreviewRecord;
  rooms: PreviewRoom[];
  photos: PreviewPhoto[];
  issues: PreviewIssue[];
  findings: PreviewItem[];
  responses: PreviewItem[];
  unassignedPhotos: { name: string; target: string }[];
}
export type ReportPreview = DeepReadonly<PreviewData>;
export const previewAnchor = (...parts: (string | number)[]) => `preview-${encodeURIComponent(JSON.stringify(parts))}`;
const text = (v?: string) => !!v?.trim();
const displayDate = (v?: string) => v && isCalendarDate(v) ? formatDate(v) : v;
const label = (labels: Record<string, string>, value?: string) => value ? labels[value] : undefined;
const unknown = is.core.unknown;
const makeField = (key: string, title: string, raw?: string, value = raw): PreviewField => ({ key, label: title, raw, value: text(value) ? value! : unknown, state: text(raw) ? "supplied" : "unanswered" });
function record(source: PreviewSource, title: string, anchor: string, href?: string): PreviewRecord {
  return { source, title, anchor, reviewHref: href, fields: [], retained: [], children: [], photoKeys: [], issues: [], notes: [] };
}
const extensionNotice = "Önnur varðveitt gögn fylgja skráningunni. Óþekkt gögn eru ekki túlkuð sem niðurstaða.";

// Presentation only. No store, storage, DOM, clock, URL lifecycle or writer dependency.
// Inputs are borrowed; every returned record/array is newly constructed.
export function buildReportPreview({ report, photos, today, reports = [report] }: {
  readonly report: Readonly<Report>;
  readonly photos: Readonly<Record<string, readonly { readonly id: string; readonly url: string; readonly name: string }[]>>;
  readonly today: string;
  readonly reports?: readonly Report[];
}): ReportPreview {
  const d = report.details;
  const base = reviewHref(report.id);
  const review = (section: string) => `${base}#${section}`;
  const registry = new Map<string, PreviewIssue>();
  function issue(r: PreviewRecord, field: string, category: IssueCategory, message: string, task = false, priority = 10) {
    const id = previewAnchor(r.anchor, field);
    const previous = registry.get(id);
    if (previous) {
      if (!previous.categories.includes(category)) previous.categories.push(category);
      previous.task ||= task;
      if (priority < previous.priority) { previous.label = message; previous.priority = priority; }
      return;
    }
    const next: PreviewIssue = { id, field, label: message, context: [r.ref, r.title].filter(Boolean).join(" · "), categories: [category], task, anchor: r.anchor, priority };
    registry.set(id, next); r.issues.push(next);
  }
  function add(r: PreviewRecord, key: string, title: string, raw?: string, value = raw, active = true, always = true) {
    if (!active) { if (raw !== undefined && raw !== "") r.retained.push(makeField(key, title, raw, value)); }
    else if (always || raw !== undefined && raw !== "") r.fields.push(makeField(key, title, raw, value));
  }
  function suppliedNote(r: PreviewRecord, key: string, title: string, value?: string, active = true) { add(r, key, title, value, value, active, false); }

  const property = record({ kind: "property", reportId: report.id }, "Eign og skoðun", "preview-property", review("review-core-details"));
  const context = label(is.inspectionContexts, d.inspectionContext) ?? unknown;
  const type = label(is.inspectionTypes, d.inspectionType) ?? unknown;
  for (const [key, title, raw, value] of [
    ["address", "Heimilisfang", d.address], ["postalCode", "Póstnúmer", d.postalCode], ["municipality", "Sveitarfélag", d.municipality], ["unit", "Íbúð / hæð", d.unit],
    ["inspectionContext", "Tengsl við íbúðarleigu", d.inspectionContext, context], ["inspectionType", "Tegund skráningar", d.inspectionType, type],
    ["inspectionDate", "Dagsetning skoðunar", d.inspectionDate, displayDate(d.inspectionDate)], ["recorderName", "Skráningaraðili", d.recorderName], ["role", "Hlutverk", d.role, label(is.roles, d.role)],
    ["scopeDescription", "Uppgefið umfang skoðunar", d.scopeDescription], ["scopeLimitations", "Takmarkanir skoðunar", d.scopeLimitations, text(d.scopeLimitations) ? d.scopeLimitations : is.core.limitationsUnknown],
  ]) add(property, key!, title!, raw, value);
  const dateWarning = inspectionDateWarning(d.inspectionDate, today);
  if (dateWarning) property.fields.find(f => f.key === "inspectionDate")!.qualification = dateWarning;
  suppliedNote(property, "notes", "Almenn athugasemd í drögum", d.notes);
  add(property, "updatedAt", "Síðast breytt", report.updatedAt, formatDate(report.updatedAt));
  property.notes.push(is.core.attribution);
  if (d.inspectionType === "independent") property.notes.push(is.core.examinerHint);
  for (const i of detailIssues(d, today)) issue(property, i.field, i.field === "inspectionDate" && text(d.inspectionDate) || i.field === "postalCode" && text(d.postalCode) ? "data_review" : "missing", i.label, true);
  if (text(d.scopeLimitations)) issue(property, "scopeLimitations", "limitation", "Uppgefnar takmarkanir skoðunar");
  else issue(property, "scopeLimitations", "limitation", is.core.limitationsUnknown);

  const rentalActive = d.inspectionContext === "residential_rental";
  const rental = rentalActive || hasRentalInformation(d) ? record({ kind: "rental", reportId: report.id }, rentalActive ? is.rental.title : "Varðveittar leiguupplýsingar utan núverandi samhengis", "preview-rental", review(rentalActive || hasRentalInformation(d) ? "review-rental-details" : "review-core-details")) : null;
  if (rental) {
    const r = d.rentalInformation;
    const t = is.rental;
    for (const [key, title, raw] of [
      ["landlordNames", t.landlord, r?.landlordNames], ["tenantNames", t.tenant, r?.tenantNames], ["premisesDescription", t.premises, r?.premisesDescription], ["leaseDate", t.leaseDate, r?.leaseDate], ["leaseReference", t.leaseReference, r?.leaseReference], ["propertyNumber", t.propertyNumber, r?.propertyNumber], ["includedAreasDescription", t.includedAreas, r?.includedAreasDescription], ["excludedAreasDescription", t.excludedAreas, r?.excludedAreasDescription],
    ]) add(rental, key!, title!, raw, raw, rentalActive);
    const leaseWarning = leaseDateWarning(r?.leaseDate);
    if (leaseWarning) [...rental.fields, ...rental.retained].find(f => f.key === "leaseDate")!.qualification = leaseWarning;
    const rep = r?.representation;
    add(rental, "representation.nameSource", t.nameSource, rep?.nameSource, label(t.nameSources, rep?.nameSource), rentalActive);
    add(rental, "representation.name", t.representativeName, representativeName(d), representativeName(d), rentalActive);
    if (rep?.nameSource !== "other") add(rental, "representation.alternativeName", "Annað varðveitt nafn fulltrúa", rep?.name, rep?.name, false);
    add(rental, "representation.representedParty", t.representedParty, rep?.representedParty, label(t.representedParties, rep?.representedParty), rentalActive);
    suppliedNote(rental, "representation.basisDescription", t.basis, rep?.basisDescription, rentalActive);
    rental.notes.push(t.attribution, t.basisHint, t.leaseHelp);
    if (hasRentalExtensions(d)) rental.notes.push(extensionNotice);
    for (const i of rentalInformationIssues(d)) issue(rental, i.field, i.kind === "missing" ? "missing" : "data_review", i.label, true);
  }
  const handover = rentalActive ? rental! : property;
  if (rentalActive || d.deliveryDate) add(handover, "deliveryDate", "Uppgefin dagsetning afhendingar", d.deliveryDate);
  if (rentalActive || d.furnished) add(handover, "furnished", "Húsgögn", d.furnished, label({ yes: "Fylgja", no: "Fylgja ekki", partly: "Fylgja að hluta" }, d.furnished));
  if (d.deliveryDate) handover.notes.push("Uppgefin afhendingardagsetning staðfestir ekki að afhending hafi farið fram.");

  const fire = record({ kind: "property", reportId: report.id }, "Brunavarnir", "preview-fire", review("review-fire-safety"));
  const fs = fireState(d);
  if (!rentalActive && !hasFireData(d.fireSafety)) {
    fire.status = "Brunavarnir óskráðar";
    issue(fire, "coverage", "limitation", fire.status);
  } else {
    for (const group of FIRE_GROUPS) {
      const g = d.fireSafety?.[group];
      const active = fireExamined(g);
      const gr = record({ kind: "fire", reportId: report.id, group }, is.fire.groups[group], previewAnchor("fire", group), fire.reviewHref);
      gr.status = fireGroupStatus(d.fireSafety, group); fire.children.push(gr);
      add(gr, "examination", "Skoðun", g?.examination, label(is.fire.examination, g?.examination));
      add(gr, "examinedDescription", "Skoðað svæði", g?.examinedDescription, g?.examinedDescription, active);
      suppliedNote(gr, "unexaminedDescription", "Ekki skoðað / afmörkun", g?.unexaminedDescription);
      suppliedNote(gr, "note", is.fire.note, g?.note);
      if (group === "escapeRoutes") {
        const route = d.fireSafety?.escapeRoutes;
        add(gr, "obstruction", "Sýnileg hindrun", route?.obstruction, label(is.fire.obstruction, route?.obstruction), active);
        suppliedNote(gr, "affectedLocation", is.fire.affectedLocation, route?.affectedLocation, active && route?.obstruction === "observed");
        suppliedNote(gr, "obstructionDescription", is.fire.obstructionDescription, route?.obstructionDescription, active && route?.obstruction === "observed");
      } else {
        const equipment = d.fireSafety?.[group];
        add(gr, "presence", "Búnaður sem sást", equipment?.presence, label(group === "smokeDetectors" ? is.fire.smokePresence : is.fire.extinguisherPresence, equipment?.presence), active);
        for (const row of equipment?.entries?.filter(row => meaningfulFireRow(row, group)) ?? []) {
          const current = active && equipment?.presence === "observed";
          const entry: EquipmentEntry = row;
          const rr = record({ kind: "fire", reportId: report.id, group, rowId: row.id }, text(row.location) ? row.location! : "Staðsetning óskráð", previewAnchor("fire", group, row.id), gr.reviewHref);
          gr.children.push(rr);
          add(rr, "location", is.fire.location, row.location, row.location, current);
          add(rr, "observedCount", is.fire.count, row.observedCount, row.observedCount, current);
          add(rr, "visibleCondition", is.fire.visibleCondition, row.visibleCondition, label(is.fire.condition, row.visibleCondition), current);
          suppliedNote(rr, "visibleIssueDescription", is.fire.visibleIssue, row.visibleIssueDescription, current && row.visibleCondition === "visible_issue_observed");
          if (group === "smokeDetectors") {
            const test = entry.basicTest;
            add(rr, "testPerformance", "Prófun", test?.performance, label(is.fire.performance, test?.performance), current);
            add(rr, "testedScopeDescription", "Prófaður búnaður", test?.testedScopeDescription, test?.testedScopeDescription, current && test?.performance === "performed");
            add(rr, "testResult", "Niðurstaða prófunar", test?.result, label(is.fire.result, test?.result), current && test?.performance === "performed");
          } else {
            const service = entry.serviceLabel;
            add(rr, "labelStatus", is.fire.serviceLabel, service?.status, label(is.fire.label, service?.status), current);
            add(rr, "labelText", is.fire.labelText, service?.observedText, service?.observedText, current && service?.status === "readable");
          }
          suppliedNote(rr, "note", is.fire.note, row.note, current);
        }
      }
      for (const i of fs.issues.filter(i => i.group === group)) {
        const target = i.rowId ? gr.children.find(r => r.source.kind === "fire" && r.source.rowId === i.rowId) ?? gr : gr;
        issue(target, i.field, i.kind, i.label, i.kind === "concern" || i.kind === "missing" && rentalActive, i.priority);
      }
    }
  }
  fire.notes.push(is.fire.limit);
  if (hasFireExtensions(d.fireSafety)) fire.notes.push(extensionNotice);

  const ms = meterState(d, today);
  const set = d.meterReadings;
  const purpose = activeMeterPurpose(d);
  const meters = record({ kind: "meters", reportId: report.id }, purpose ? is.meters.titles[purpose] : "Mælastöður", "preview-meters", review("review-meter-readings"));
  if (!set) { meters.status = is.meters.absent; issue(meters, "coverage", "limitation", is.meters.absent); }
  else {
    meters.status = purpose ? undefined : is.meters.retainedHint;
    if (set.mode) add(meters, "mode", "Tilgangur skráningar", set.mode, is.meters.titles[set.mode], !!purpose);
    for (const k of METER_UTILITIES) {
      const m = set[k];
      const participates = meterParticipates(d, k);
      const capable = readingCapable(m?.applicability);
      const current = participates && capable && meterContextCurrent(d, k);
      const mr = record({ kind: "meters", reportId: report.id, utility: k }, is.meters.utilities[k], previewAnchor("meter", k), meters.reviewHref);
      meters.children.push(mr);
      const error = ms.issues.find(i => i.utility === k || i.field === "purpose");
      const limit = ms.limitations.find(i => i.utility === k);
      mr.status = !participates ? set.mode === "optional" ? is.meters.unselected : is.meters.retained : error?.label ?? limit?.label ?? (current && m?.readingStatus === "recorded" ? is.meters.status.recorded : label(is.meters.applicability, m?.applicability) ?? unknown);
      add(mr, "applicability", "Mælafyrirkomulag", m?.applicability, label(is.meters.applicability, m?.applicability), participates);
      add(mr, "readingStatus", "Álestur", m?.readingStatus, label(is.meters.status, m?.readingStatus), current || participates && capable && !m?.readingStatus);
      for (const key of ["readingValue", "unit", "readingDate", "meterIdentifier", "note"] as const) {
        const active = current && (m?.readingStatus === "recorded" || key === "meterIdentifier" || key === "note");
        add(mr, key, is.meters.fields[key], m?.[key], m?.[key], active, key !== "note" && key !== "meterIdentifier" && current && m?.readingStatus === "recorded");
      }
      if (mr.retained.length && m?.factsApplicability) add(mr, "factsApplicability", "Samhengi varðveittra upplýsinga", m.factsApplicability, is.meters.applicability[m.factsApplicability], false);
      if (participates && m?.applicability === "shared") mr.notes.push(is.meters.shared);
      for (const i of ms.issues.filter(i => i.utility === k)) issue(mr, i.field, i.kind === "missing" ? "missing" : "data_review", i.label, true);
      if (limit) issue(mr, "limitation", "limitation", limit.label);
    }
    if (set.factsPurpose && (!purpose || meters.children.some(r => r.retained.length))) add(meters, "factsPurpose", "Tilgangur varðveittra upplýsinga", set.factsPurpose, is.meters.titles[set.factsPurpose], false);
    for (const i of ms.issues.filter(i => !i.utility)) issue(meters, i.field, "data_review", i.label, true);
  }
  meters.notes.push(purpose === "rental_initial" ? is.meters.initialBoundary : is.meters.boundary);
  if (hasMeterExtensions(set)) meters.notes.push(extensionNotice);

  const targetRecords = new Map<string, PreviewRecord[]>();
  // Include other reports when detecting delimiter/key collisions; never infer ownership by prefix.
  const targetOwners = new Map<string, string[]>();
  for (const candidate of reports) for (const room of candidate.rooms) {
    for (const key of [`${candidate.id}:${room.id}:overview`, ...room.items.map(i => `${candidate.id}:${room.id}:${i.id}`)]) targetOwners.set(key, [...targetOwners.get(key) ?? [], candidate.id]);
  }
  const bind = (key: string, r: PreviewRecord) => targetRecords.set(key, [...targetRecords.get(key) ?? [], r]);
  const rooms: PreviewRoom[] = [];
  let ordinal = 0;
  const roomIdCounts = new Map<string, number>();
  report.rooms.forEach(r => roomIdCounts.set(r.id, (roomIdCounts.get(r.id) ?? 0) + 1));
  for (const [ri, room] of report.rooms.entries()) {
    const uniqueRoom = roomIdCounts.get(room.id) === 1;
    const rr: PreviewRoom = { ...record({ kind: "room", reportId: report.id, roomId: room.id, roomIndex: ri }, room.name.trim() || "Ónefnt rými", previewAnchor("room", room.id, ri), uniqueRoom ? reviewHref(report.id, { roomId: room.id, itemId: null }) : undefined), ref: `R${String(ri + 1).padStart(2, "0")}`, stats: roomStats(room), items: [] };
    rooms.push(rr);
    bind(`${report.id}:${room.id}:overview`, rr);
    if (!text(room.name)) issue(rr, "name", "missing", "Heiti rýmis vantar", true);
    if (!uniqueRoom) issue(rr, "identity", "data_review", "Auðkenni rýmis er ekki ótvírætt. Tengsl og leiðréttingartilvísanir eru takmarkaðar.");
    if (!room.items.length) issue(rr, "items", "limitation", "Engin skoðunaratriði í þessu rými.");
    if (!room.items.some(i => i.kind === "space_heating")) issue(rr, "heatingCoverage", "limitation", "Sérstök hitaskráning er ekki í gátlista þessa rýmis.");
    const itemIdCounts = new Map<string, number>();
    room.items.forEach(i => itemIdCounts.set(i.id, (itemIdCounts.get(i.id) ?? 0) + 1));
    for (const [ii, item] of room.items.entries()) {
      const o = room.observations[item.id];
      const heat = item.kind === "space_heating";
      const hs = heat ? heatingState(o) : undefined;
      const defect = requiresDamage(o, item);
      const unique = uniqueRoom && itemIdCounts.get(item.id) === 1;
      const ir: PreviewItem = { ...record({ kind: "item", reportId: report.id, roomId: room.id, itemId: item.id, roomIndex: ri, itemIndex: ii }, item.name.trim() || "Ónefnt atriði", previewAnchor("item", room.id, ri, item.id, ii), unique ? reviewHref(report.id, { roomId: room.id, itemId: item.id }) : undefined), ref: `A${String(++ordinal).padStart(3, "0")}`, kind: heat ? "heating" : "ordinary", complete: observationComplete(item, o), attention: needsAttention(item, o), progress: itemProgress(item, o), deviation: defect || !heat && o?.condition !== "na" && o?.cleanliness === "dirty", limited: heat ? !!hs?.limitations.length : o?.condition !== "na" && (o?.condition === "uninspected" || o?.functionality === "untested" || o?.cleanliness === "uninspected"), wear: heat ? o?.heating?.visibility === "visible_parts" && o.heating.visibleCondition === "wear" : o?.condition === "wear" };
      rr.items.push(ir); bind(`${report.id}:${room.id}:${item.id}`, ir);
      if (!unique) issue(ir, "identity", "data_review", "Auðkenni atriðis er ekki ótvírætt. Engin nákvæm leiðréttingartilvísun er mynduð.");
      if (heat) {
        const h = o?.heating;
        const scoped = h?.visibility === "visible_parts" || h?.visibility === "reported_concealed";
        ir.status = hs!.status;
        add(ir, "visibility", "Sýnileiki", h?.visibility, label(is.heating.visibility, h?.visibility));
        add(ir, "equipment", "Búnaður sem skráningin á við", h?.equipment?.join(", "), h?.equipment?.map(k => is.heating.equipment[k]).join(", "), scoped, false);
        add(ir, "scope", "Afmörkun", h?.scope, h?.scope, scoped, false);
        add(ir, "informationSource", "Heimild uppgefins búnaðar", h?.informationSource, h?.informationSource, scoped, false);
        add(ir, "visibleCondition", "Sýnilegt ástand tilgreindra hluta", h?.visibleCondition, label(is.heating.condition, h?.visibleCondition), h?.visibility === "visible_parts");
        add(ir, "operation", "Venjuleg notkun reynd", h?.operation, label(is.heating.operation, h?.operation));
        add(ir, "action", "Hvað var reynt", h?.action, h?.action, h?.operation === "tried");
        add(ir, "response", "Viðbragð", h?.response, label(is.heating.response, h?.response), h?.operation === "tried");
        add(ir, "responseDescription", "Það sem varð vart", h?.responseDescription, h?.responseDescription, h?.operation === "tried");
        for (const key of ["condition", "functionality", "cleanliness"] as const) if (o?.[key]) add(ir, `generic.${key}`, `Varðveitt svar: ${key === "condition" ? "ástand" : key === "functionality" ? "virkni" : "þrif"}`, o[key], label(key === "condition" ? is.conditions : key === "functionality" ? is.functionality : is.cleanliness, o[key]), false);
        hs!.limitations.forEach((v, index) => issue(ir, `heatingLimit.${index}`, "limitation", v));
        ir.notes.push(is.heating.limit);
        if (hasHeatingExtensions(h)) ir.notes.push(extensionNotice);
      } else {
        add(ir, "condition", "Ástand", o?.condition, label(is.conditions, o?.condition));
        for (const [key, title, choices] of [["functionality", "Virkni", is.functionality], ["cleanliness", "Þrif", is.cleanliness]] as const) {
          if (o?.condition === "na") {
            ir.fields.push({ key, label: title, value: is.conditions.na, state: "not_requested" });
            add(ir, key, title, o[key], label(choices, o[key]), false);
          } else if (item[key] || o?.[key]) {
            add(ir, key, title, o?.[key], label(choices, o?.[key]));
            if (!item[key] && o?.[key]) ir.fields.at(-1)!.qualification = "Svar varðveitt utan matsþátta gátlista";
          } else ir.fields.push({ key, label: title, value: "Ekki metin í liðnum", state: "not_requested" });
        }
        if (ir.limited) for (const key of ["condition", "functionality", "cleanliness"] as const) if (o?.[key] === "uninspected" || o?.[key] === "untested") issue(ir, key, "limitation", `${key === "condition" ? "Ástand" : key === "functionality" ? "Virkni" : "Þrif"}: ${label(key === "condition" ? is.conditions : key === "functionality" ? is.functionality : is.cleanliness, o[key])}`);
      }
      for (const [key, title] of [["damageType", "Tegund fráviks"], ["location", "Staðsetning fráviks"], ["description", "Lýsing á fráviki"]] as const) add(ir, key, title, o?.[key], o?.[key], defect, defect);
      // Ordinary retained detection deliberately uses the existing helper; heating uses its own state.
      if (!heat && !defect && !hasRetainedDefect(o)) ir.retained = ir.retained.filter(f => !["damageType", "location", "description"].includes(f.key));
      suppliedNote(ir, "note", "Athugasemd við atriði", o?.note);
      for (const i of missingAnswers(item, o)) issue(ir, i.key, "missing", i.label, true);
    }
    for (const [key, o] of Object.entries(room.observations)) if (!itemIdCounts.has(key)) {
      const orphan = record({ kind: "orphan", reportId: report.id, roomId: room.id, itemId: key, roomIndex: ri }, `Varðveitt gögn án virks skoðunaratriðis · ${key}`, previewAnchor("orphan", ri, key));
      const orphanLabels = { damageType: "Tegund fráviks", location: "Staðsetning", description: "Lýsing", note: "Athugasemd", condition: "Ástand", functionality: "Virkni", cleanliness: "Þrif" };
      for (const field of ["damageType", "location", "description", "note", "condition", "functionality", "cleanliness"] as const) add(orphan, field, orphanLabels[field], o[field], field === "condition" ? label(is.conditions, o[field]) : field === "functionality" ? label(is.functionality, o[field]) : field === "cleanliness" ? label(is.cleanliness, o[field]) : o[field], false);
      const heatingLabels = { equipment: "Hitabúnaður", visibility: "Sýnileiki", scope: "Afmörkun", informationSource: "Heimild upplýsinga", visibleCondition: "Sýnilegt ástand", operation: "Venjuleg notkun reynd", action: "Hvað var reynt", response: "Viðbragð", responseDescription: "Það sem varð vart" };
      if (o.heating) for (const field of HEATING_FIELDS) {
        const value = o.heating[field];
        if (typeof value === "string" || Array.isArray(value)) add(orphan, `heating.${field}`, heatingLabels[field], Array.isArray(value) ? value.join(", ") : value, undefined, false);
      }
      if (hasHeatingExtensions(o.heating)) orphan.notes.push(extensionNotice);
      rr.children.push(orphan);
    }
  }
  if (!rooms.length) issue(property, "rooms", "missing", "Engin rými valin", true);

  const photoList: PreviewPhoto[] = [];
  const unassignedPhotos: PreviewData["unassignedPhotos"] = [];
  for (const [key, targets] of targetRecords) {
    const images = photos[key] ?? [];
    const owners = targetOwners.get(key) ?? [];
    if (targets.length !== 1 || owners.length !== 1) {
      if (images.length) {
        issue(targets[0], "photoAssociation", "limitation", "Ekki er hægt að tengja myndir ótvírætt við þetta svæði.");
        if (owners.every(id => id === report.id)) images.forEach(p => unassignedPhotos.push({ name: p.name, target: key }));
      }
      continue;
    }
    const target = targets[0];
    const ids = new Map<string, number>(); images.forEach(p => ids.set(p.id, (ids.get(p.id) ?? 0) + 1));
    for (const [pi, p] of images.entries()) {
      const photoKey = previewAnchor("media", key, p.id, pi);
      const ref = `M${String(photoList.length + 1).padStart(3, "0")}`;
      const room = rooms.find(r => r.source.kind === "room" && target.source.kind !== "property" && "roomIndex" in target.source && r.source.roomIndex === target.source.roomIndex)!;
      const context = `${room.ref} ${room.title} · ${target === room ? "Yfirlitsmynd" : `${target.ref} ${target.title}`}`;
      photoList.push({ key: photoKey, ref, sourcePhotoId: p.id, source: { ...target.source }, name: p.name, url: p.url, anchor: previewAnchor("photo", photoKey), recordAnchor: target.anchor, context, alt: `Tímabundin mynd við ${context} · ${p.name}` });
      target.photoKeys.push(photoKey);
      if (ids.get(p.id)! > 1) issue(target, "duplicatePhoto", "limitation", "Endurtekið myndauðkenni; hver myndatenging er sýnd sérstaklega.");
    }
    if (!images.length) {
      if (target.source.kind === "room") issue(target, "overviewPhoto", "limitation", "Yfirlitsmynd rýmis vantar í þessari setu", true);
      if (target.source.kind === "item" && "deviation" in target) {
        const src = target.source;
        const original = report.rooms[src.roomIndex];
        const item = original.items[src.itemIndex!];
        if (requiresDamage(original.observations[item.id], item)) issue(target, "damagePhoto", "limitation", "Stoðmynd við skráð frávik vantar í þessari setu", true);
      }
    }
  }
  // Known orphan keys can be attributed by exact construction, never by prefix.
  for (const room of report.rooms) for (const key of Object.keys(room.observations)) {
    const target = `${report.id}:${room.id}:${key}`;
    if (!targetRecords.has(target) && !targetOwners.has(target)) (photos[target] ?? []).forEach(p => unassignedPhotos.push({ name: p.name, target }));
  }
  const items = rooms.flatMap(r => r.items);
  return {
    id: report.id, title: text(d.address) ? d.address : reportTitle(report), context, inspectionType: type, date: displayDate(d.inspectionDate) || unknown, recorder: text(d.recorderName) ? d.recorderName! : unknown,
    stats: { ...reportStats(report) }, limitedItems: items.filter(i => i.limited).length, wearItems: items.filter(i => i.wear).length,
    property, rental, rentalActive, fire, meters, rooms, photos: photoList, issues: [...registry.values()], findings: items.filter(i => i.deviation), responses: items.filter(i => i.kind === "heating" && !i.deviation && i.fields.some(f => f.key === "response" && (f.raw === "none_observed" || f.raw === "mixed"))), unassignedPhotos,
  };
}
