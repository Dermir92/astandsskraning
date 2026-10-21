import { EMPTY_DETAILS, EMPTY_OBSERVATION, type Report } from "../src/lib/model";
import { contentFingerprint, copiedFinal, finalContext, initialAssociations, sourceContent } from "../src/lib/inspection-comparison";

export function linkedInitialFixture(): Report {
  return {
    id: "link-initial", assetType: "apartment", title: "Sýnigata 71", subtitle: "Tilbúin upphafsskráning", updatedAt: "2026-10-18T12:00:00.000Z",
    details: { ...EMPTY_DETAILS, inspectionType: "initial", inspectionContext: "residential_rental", address: "Sýnigata 71", postalCode: "101", municipality: "Reykjavík", unit: "0101", recorderName: "Sýniskrásetjari", role: "representative", inspectionDate: "2026-10-01", deliveryDate: "2026-10-02", scopeDescription: "Skoðaðir sýnilegir veggir og gluggi í stofu.", scopeLimitations: "Ekki prófað loftræstikerfi.", furnished: "partly", notes: "Ekki flytja þennan texta.",
      rentalInformation: { landlordNames: "Sýnileigusali", tenantNames: "Sýnileigjandi", leaseDate: "2026-09-01", leaseReference: "SÝNI-71", propertyNumber: "SÝNI", premisesDescription: "Íbúð 0101", includedAreasDescription: "Stofa og sameiginlegur gangur", excludedAreasDescription: "Læst geymsla", representation: { nameSource: "recorder", representedParty: "landlord", basisDescription: "Ósannreynt fyrirsvar" } },
      fireSafety: { smokeDetectors: { examination: "not_examined" } }, meterReadings: { mode: "rental_initial", factsPurpose: "rental_initial", electricity: { applicability: "separate", factsApplicability: "separate", readingStatus: "recorded", readingValue: "00123,40", unit: "kWh", readingDate: "2026-10-01" } } },
    rooms: [{ id: "initial-room", name: "Stofa", type: "living", items: [{ id: "walls", name: "Veggir" }, { id: "windows", name: "Gluggar", functionality: true, cleanliness: true }, { id: "heat", name: "Hiti", kind: "space_heating" }],
      observations: { walls: { ...EMPTY_OBSERVATION, condition: "damaged", damageType: "Rispa", location: "Við hurð", description: "Löng lýsing á sýnirispu.\nÖnnur lína.", note: "Sýniathugasemd" }, windows: { ...EMPTY_OBSERVATION, condition: "good", functionality: "works", cleanliness: "clean" }, heat: { ...EMPTY_OBSERVATION, heating: { visibility: "not_examined", operation: "not_tried" } } } }],
  };
}
export async function linkedPair(complete = false) {
  const initial = linkedInitialFixture(); let count = 0;
  const final = copiedFinal(initial, "link-final", "2026-10-20T12:00:00.000Z", () => `final-target-${++count}`);
  final.linkedInitial = { version: 1, initialReportId: initial.id, sourceFingerprint: await contentFingerprint(sourceContent(initial)), finalContextFingerprint: await contentFingerprint(finalContext(final)), rooms: initialAssociations(initial, final) };
  if (complete) {
    final.details.inspectionDate = "2026-10-20";
    final.rooms[0].items.forEach((item, index) => { final.rooms[0].observations[item.id] = structuredClone(initial.rooms[0].observations[initial.rooms[0].items[index].id]); });
  }
  return { initial, final };
}
export async function largeLinkedPair() {
  const initial = linkedInitialFixture();
  initial.rooms = Array.from({ length: 10 }, (_, r) => ({ id: `large-room-${r}`, name: `Sýnirými ${r + 1}`, type: "custom" as const,
    items: Array.from({ length: 10 }, (_, i) => ({ id: `item-${i}`, name: `Sýniatriði ${i + 1}`, functionality: i % 2 === 0, cleanliness: i % 3 === 0 })),
    observations: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`item-${i}`, { ...EMPTY_OBSERVATION, condition: "good", ...(i % 2 === 0 ? { functionality: "works" } : {}), ...(i % 3 === 0 ? { cleanliness: "clean" } : {}), note: `Sýniskráning ${r}/${i}. ` .repeat(8) }])) }));
  let count = 0; const final = copiedFinal(initial, "link-large-final", "2026-10-20T12:00:00Z", () => `large-final-${++count}`);
  final.linkedInitial = { version: 1, initialReportId: initial.id, sourceFingerprint: await contentFingerprint(sourceContent(initial)), finalContextFingerprint: await contentFingerprint(finalContext(final)), rooms: initialAssociations(initial, final) };
  final.rooms.forEach((room, r) => room.items.forEach((item, i) => { if (i % 3 !== 0) room.observations[item.id] = structuredClone(initial.rooms[r].observations[`item-${i}`]); }));
  return { initial, final };
}
