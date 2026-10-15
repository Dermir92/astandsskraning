import {
  EMPTY_DETAILS,
  EMPTY_OBSERVATION,
  makeRoom,
  type Report,
  type Room,
} from "./model";

function sampleRoom(
  type: Room["type"],
  name: string,
  id: string,
  recorded = 0,
): Room {
  const room = makeRoom(type, name, id);
  room.items.slice(0, recorded).forEach((item) => {
    room.observations[item.id] = {
      ...EMPTY_OBSERVATION,
      condition: "good",
      ...(item.functionality ? { functionality: "works" as const } : {}),
      ...(item.cleanliness ? { cleanliness: "clean" as const } : {}),
    };
  });
  return room;
}
export function demoReports(): Report[] {
  const entry = sampleRoom("entry", "Forstofa", "demo-entry", 7);
  const living = sampleRoom("living", "Stofa", "demo-living", 6);
  living.observations.floor = {
    ...EMPTY_OBSERVATION,
    condition: "wear",
    cleanliness: "clean",
    note: "Lítil notkunarmerki á parketi við svalahurð.",
  };
  living.observations.walls = {
    ...EMPTY_OBSERVATION,
    condition: "damaged",
    damageType: "Rispa",
    location: "Við dyr að forstofu",
    description: "Um 8 cm löng rispa á vegg, neðarlega við dyrakarm.",
  };
  const kitchen = sampleRoom("kitchen", "Eldhús", "demo-kitchen", 8);
  kitchen.observations.counter = {
    ...EMPTY_OBSERVATION,
    condition: "defect",
    cleanliness: "clean",
    damageType: "Slit",
    location: "Við vask",
    description: "Yfirborð borðplötu er slitið meðfram brún vasks.",
  };
  kitchen.observations.windows = {
    ...kitchen.observations.windows,
    cleanliness: "dirty",
    note: "Gler þarf að þrífa að innan.",
  };
  const bathroom = sampleRoom("bathroom", "Baðherbergi", "demo-bathroom", 2);
  bathroom.observations.ventilation = {
    ...EMPTY_OBSERVATION,
    condition: "uninspected",
    functionality: "untested",
    note: "Loftræsting verður prófuð við næstu heimsókn.",
  };
  const details = {
    ...EMPTY_DETAILS,
    inspectionType: "initial" as const,
    address: "Sýnigata 14",
    postalCode: "101",
    municipality: "Reykjavík",
    unit: "0201 · 2. hæð",
    role: "landlord" as const,
    deliveryDate: "2026-10-16",
    furnished: "partly" as const,
    notes: "Tilbúin sýniíbúð. Ísskápur og uppþvottavél fylgja.",
  };
  const shell = {
    details: { ...EMPTY_DETAILS },
    rooms: [],
    updatedAt: "2026-10-12T10:00:00Z",
  };
  return [
    {
      id: "syni-ibud",
      assetType: "apartment",
      title: "Sýnigata 14",
      subtitle: "101 Reykjavík · Íbúð 0201",
      updatedAt: "2026-10-14T09:42:00Z",
      details,
      rooms: [
        entry,
        living,
        kitchen,
        sampleRoom("bedroom", "Svefnherbergi 1", "demo-bedroom-1"),
        sampleRoom("bedroom", "Svefnherbergi 2", "demo-bedroom-2"),
        bathroom,
      ],
    },
    {
      ...shell,
      id: "syni-hlid",
      assetType: "apartment",
      title: "Dæmishlíð 8",
      subtitle: "200 Kópavogur · Íbúð 0102",
      details: {
        ...EMPTY_DETAILS,
        address: "Dæmishlíð 8",
        postalCode: "200",
        municipality: "Kópavogur",
        inspectionType: "final",
      },
      rooms: [
        sampleRoom("living", "Stofa", "hlid-living"),
        sampleRoom("kitchen", "Eldhús", "hlid-kitchen"),
        sampleRoom("bathroom", "Baðherbergi", "hlid-bathroom"),
      ],
    },
    {
      ...shell,
      id: "syni-bill",
      assetType: "vehicle",
      title: "Sýnibíll · SB-000",
      subtitle: "Fólksbíll · Afhending",
      sampleReviewed: true,
    },
    {
      ...shell,
      id: "syni-geymsla",
      assetType: "storage",
      title: "Sýnigeymsla 03",
      subtitle: "Dæmisbraut 6 · 12 m²",
      sampleReviewed: true,
      updatedAt: "2026-10-09T14:10:00Z",
    },
    {
      ...shell,
      id: "syni-atvinna",
      assetType: "commercial",
      title: "Sýniskrifstofa",
      subtitle: "Dæmisgarður 2 · 80 m²",
      sampleReviewed: true,
      updatedAt: "2026-10-07T11:25:00Z",
    },
    {
      ...shell,
      id: "syni-lokid",
      assetType: "apartment",
      title: "Dæmisgata 22",
      subtitle: "220 Hafnarfjörður · Íbúð 0301",
      sampleReviewed: true,
      updatedAt: "2026-10-05T16:30:00Z",
    },
  ];
}
