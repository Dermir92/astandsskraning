import type { Report, ResidentialRentalInformation } from "../src/lib/model";
import { legacyCoreReport } from "./inspection-core-fixtures";

export const rentalInformation: ResidentialRentalInformation = {
  landlordNames: "Sýnileiga ehf.", tenantNames: "Sýnidís Jónsdóttir\nSýnifélagi Guðmundsson",
  leaseDate: "2026-10-01", leaseReference: "SÝNI-2026-14", propertyNumber: "F0012345",
  premisesDescription: "Íbúð 0201 ásamt geymslu.", includedAreasDescription: "Geymsla 03 og sameiginlegt þvottahús.",
  excludedAreasDescription: "Stæði í bílakjallara.",
};
export function rentalReport(information?: ResidentialRentalInformation): Report {
  const report = legacyCoreReport();
  return { ...report, id: "rental-case", details: { ...report.details,
    inspectionContext: "residential_rental", inspectionDate: "2026-10-16", recorderName: "Sýni Þór",
    scopeDescription: "Aðgengilegir veggir í stofu.", scopeLimitations: "Geymsla var ekki skoðuð.",
    ...(information === undefined ? {} : { rentalInformation: structuredClone(information) }),
  } };
}
export function extendedRentalDocument() {
  const first = rentalReport(rentalInformation);
  return { version: 1, envelopeExtension: { source: "synthetic", nested: [false, 0, "Óbreytt"] },
    reports: [{ ...first, reportExtension: ["varðveita"], details: { ...first.details, detailExtension: { keep: true },
      rentalInformation: { ...first.details.rentalInformation, rentalExtension: ["óbreytt"],
        representation: { nameSource: "other" as const, name: "Annar Sýnifulltrúi", representedParty: "landlord" as const, basisDescription: "Sjálfskráð heimild.", representationExtension: { keep: true } },
      },
    }, rooms: first.rooms.map(room => ({ ...room, roomExtension: 1,
      items: room.items.map(item => ({ ...item, itemExtension: false })),
      observations: Object.fromEntries(Object.entries(room.observations).map(([id, observation]) => [id, { ...observation, observationExtension: ["keep"] }])),
    })) }, { ...legacyCoreReport(), id: "untouched-report" }],
  };
}
