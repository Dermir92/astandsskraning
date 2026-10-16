import { EMPTY_DETAILS, EMPTY_OBSERVATION, makeRoom, type Report } from "../src/lib/model";

// Synthetic only. These fixtures are never written into an existing browser profile.
export function checklistReport(mixed = false): Report {
  const entry = makeRoom("entry", "Forstofa", "checklist-entry");
  if (mixed) {
    entry.observations = {
      floor: { ...EMPTY_OBSERVATION, condition: "good", note: "Fyrirliggjandi athugasemd" },
      walls: { ...EMPTY_OBSERVATION, condition: "damaged", damageType: "Rispa", location: "Við karm", description: "Tilbúin 8 cm rispa" },
      ceiling: { ...EMPTY_OBSERVATION, condition: "na" },
      windows: { ...EMPTY_OBSERVATION, condition: "uninspected", functionality: "untested", cleanliness: "uninspected" },
      doors: { ...EMPTY_OBSERVATION, condition: "wear", functionality: "works" },
      lights: { ...EMPTY_OBSERVATION, condition: "good", functionality: "broken", damageType: "Óvirkur búnaður", location: "Við dyr", description: "Tilbúinn rofi virkar ekki" },
    };
  }
  return {
    id: "checklist-report", assetType: "apartment", title: "Prófunarskýrsla B", subtitle: "Tilbúin prófunargögn", updatedAt: "2026-10-16T08:00:00Z",
    details: { ...EMPTY_DETAILS, inspectionType: "initial", address: "Prófunargata B", postalCode: "101", municipality: "Reykjavík", role: "tenant", deliveryDate: "2026-10-16", furnished: "no" },
    rooms: [entry, makeRoom("living", "Stofa", "checklist-living"), makeRoom("bedroom", "Svefnherbergi", "checklist-bedroom")],
  };
}
