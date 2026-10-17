import type { Report } from "../src/lib/model";

// Deliberately literal pre-extension v1 data: do not use EMPTY_DETAILS here.
export function legacyCoreReport(): Report {
  return {
    id: "core-legacy", assetType: "apartment", title: "Tilbúin íbúð", subtitle: "Sýnigögn",
    updatedAt: "2026-09-01T12:34:56.000Z",
    details: {
      inspectionType: "initial", address: "Prófunargata 42", postalCode: "101",
      municipality: "Reykjavík", unit: "0201", role: "tenant", deliveryDate: "2026-10-16",
      furnished: "partly", notes: "Varðveita eldri athugasemd óbreytta.\nÖnnur lína.",
    },
    rooms: [{ id: "legacy-room", type: "living", name: "Stofa", items: [{ id: "walls", name: "Veggir" }],
      observations: { walls: { condition: "wear", damageType: "", location: "", description: "", note: "Varðveitt athugasemd" } } }],
  };
}
export const coreFields = ["inspectionContext", "inspectionDate", "recorderName", "scopeDescription", "scopeLimitations"] as const;
