import { EMPTY_DETAILS, EMPTY_OBSERVATION, type ChecklistItem, type Observation, type Report, type Room } from "../src/lib/model";

export const previewDate = "2026-10-20";
export const longPreviewText = Array.from({ length: 5 }, (_, n) => `Athugun ${n + 1}. Þétting hefur losnað við neðri brún gluggakarms. Aðgengi aftan við fasta innréttingu var takmarkað. Eingöngu var skoðað sýnilegt yfirborð án þess að opna byggingarhluta. Engin rakamæling fór fram; orsök og ástand undirliggjandi efna eru óstaðfest.`).join("\n\n");
export function previewReport(scenario: "complete" | "incomplete" | "limited" | "large" | "expanded" = "complete"): Report {
  const counts = scenario === "large" ? [9, 9, 9, 9, 8, 8, 8, 8, 8, 8] : scenario === "expanded" ? Array(10).fill(10) as number[] : [5, 5, 5];
  const names = ["Forstofa", "Stofa", "Eldhús", "Svefnherbergi 1", "Svefnherbergi 2", "Vinnuherbergi", "Baðherbergi", "Þvottahús", "Geymsla", "Svalir"];
  const labels = ["Gólfefni", "Veggir", "Loft", "Gluggar", "Hurðir og læsingar", "Ljós og rofar", "Hiti", "Innréttingar", "Borðplata", "Loftræsting"];
  const ids = ["floor", "walls", "ceiling", "windows", "doors", "lights", "space-heating", "cabinets", "counter", "ventilation"];
  const rooms: Room[] = counts.map((count, ri) => {
    const items: ChecklistItem[] = Array.from({ length: count }, (_, j) => {
      const heating = j === (count <= 6 ? count - 1 : 6);
      return { id: heating ? "space-heating" : ids[j], name: heating ? "Hiti" : labels[j], ...(heating ? { kind: "space_heating" as const } : { functionality: j === 3 || j === 4, cleanliness: j === 0 || j === 3 }) };
    });
    const observations: Record<string, Observation> = {};
    if (scenario !== "incomplete") for (const item of items) observations[item.id] = item.kind === "space_heating" ? {
      ...EMPTY_OBSERVATION, heating: { equipment: ["radiators", "thermostat"], visibility: "visible_parts", visibleCondition: "good", operation: "tried", action: "Hitastilli snúið á ofni í rýminu.", response: "observed", responseDescription: "Hlýja fannst við ofn meðan athugun stóð." },
    } : { ...EMPTY_OBSERVATION, condition: "good", ...(item.functionality ? { functionality: "works" as const } : {}), ...(item.cleanliness ? { cleanliness: "clean" as const } : {}) };
    return { id: `preview-room-${ri}`, name: names[ri], type: ri === 0 ? "entry" : ri === 2 ? "kitchen" : "living", items, observations };
  });
  const report: Report = {
    id: "preview-report", assetType: "apartment", title: "Tilbúin íbúð", subtitle: "Sýnigögn", updatedAt: "2026-10-19T11:22:33.000Z", details: {
      ...EMPTY_DETAILS, inspectionContext: "residential_rental", inspectionType: "initial", address: "Sýnigata 24", postalCode: "101", municipality: "Reykjavík", unit: "0201 · 2. hæð", role: "landlord", inspectionDate: "2026-10-18", deliveryDate: "2026-11-01", furnished: "partly", recorderName: "Sýni Þór Jónsdóttir", scopeDescription: "Skráning sýnilegra og aðgengilegra flata í tilgreindum rýmum. Virkni aðeins prófuð þar sem það er sérstaklega skráð.", scopeLimitations: "Sameign og lokaðir byggingarhlutar voru ekki skoðaðir. Þetta er ekki tæknileg öryggisúttekt.",
      rentalInformation: { landlordNames: "Sýnileiga ehf.", tenantNames: "Sýni Dæmisson og Sýna Dæmisdóttir", premisesDescription: "Íbúð 0201 ásamt afmarkaðri geymslu. Skoðað umfang er skráð sérstaklega.", leaseReference: "SÝNI-LEIGA-024", leaseDate: "2026-10-01", propertyNumber: "F0000000", includedAreasDescription: "Afnot af sameiginlegum garði.", excludedAreasDescription: "Læst geymsla í sameign." },
      fireSafety: {
        smokeDetectors: { examination: "examined", examinedDescription: "Gangur við svefnherbergi", presence: "observed", entries: [{ id: "detector", location: "Við svefnherbergi", observedCount: "1", visibleCondition: "no_visible_issue_observed", basicTest: { performance: "performed", testedScopeDescription: "Skynjari á gangi", result: "response_observed" } }] },
        extinguishers: { examination: "examined", examinedDescription: "Eldhús", presence: "observed", entries: [{ id: "extinguisher", location: "Við útidyr", observedCount: "1", visibleCondition: "no_visible_issue_observed", serviceLabel: { status: "readable", observedText: "Sýnilegur texti á miða: 2026-02. Gildi viðhalds ekki staðfest." } }] },
        escapeRoutes: { examination: "examined", examinedDescription: "Gangur að útidyrum", obstruction: "none_observed" },
      }, meterReadings: { mode: "rental_initial", factsPurpose: "rental_initial", electricity: { applicability: "separate", factsApplicability: "separate", readingStatus: "recorded", readingValue: "0012,50", unit: "kWh", readingDate: "2026-10-18", meterIdentifier: "SÝNI-E-001", note: "Álestur skráður af notanda; ekki sannreyndur." }, hotWater: { applicability: "shared", factsApplicability: "shared", note: "Mælir í læstu rými sameignar." } },
    }, rooms,
  };
  if (scenario === "incomplete") {
    report.details = { ...EMPTY_DETAILS, address: "", notes: "Ófullgerð skráning · sýnigögn" };
    rooms[0].name = "";
  } else if (scenario === "limited") {
    rooms[0].observations.floor.condition = "uninspected";
    rooms[1].observations.windows.functionality = "untested";
    rooms[2].observations["space-heating"].heating = { visibility: "not_examined", operation: "not_tried" };
    report.details.fireSafety!.smokeDetectors!.entries![0].basicTest = { performance: "not_performed" };
    report.details.meterReadings!.electricity = { applicability: "unknown" };
  } else {
    rooms[0].observations.windows = { ...rooms[0].observations.windows, condition: "defect", damageType: "Laus þétting", location: "Neðri brún gluggakarms", description: longPreviewText };
    rooms[1].observations.floor = { ...rooms[1].observations.floor, condition: "damaged", cleanliness: "dirty", damageType: "Yfirborðsskemmd", location: "Við inngang í stofu", description: "Djúp rispa á gólfi við þröskuld. Umfang undir yfirborði óstaðfest.", note: "Athugasemd skráningaraðila, ekki staðfest athugasemd mótaðila." };
    report.details.fireSafety!.smokeDetectors!.entries!.push({ id: "detector-second", location: "Forstofa", observedCount: "1", visibleCondition: "no_visible_issue_observed", basicTest: { performance: "performed", testedScopeDescription: "Skynjari við útidyr", result: "no_response_observed" } });
  }
  return report;
}

export function freezePreviewInput<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freezePreviewInput); Object.freeze(value); }
  return value;
}
