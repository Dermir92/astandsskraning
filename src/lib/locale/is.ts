import type {
  AssetType,
  Cleanliness,
  Condition,
  Functionality,
  ReportStatus,
  RoomType,
} from "../model";

// Screen copy lives separately from the domain model. Add another locale behind this interface later.
export const is = {
  appName: "Ástandsskráning",
  reports: "Mínar skýrslur",
  newReport: "Ný skýrsla",
  demo: "Sýnihamur",
  demoNotice:
    "Aðeins til prófunar. Drög vistast í þessum vafra. Notaðu eingöngu tilbúin gögn.",
  assets: {
    apartment: "Íbúðarhúsnæði",
    vehicle: "Ökutæki",
    storage: "Geymsla / bílskúr",
    commercial: "Atvinnuhúsnæði",
  } satisfies Record<AssetType, string>,
  assetDescriptions: {
    apartment: "Skráðu ástand íbúðar, eitt rými í einu.",
    vehicle: "Yfirbygging, búnaður og ástand ökutækis.",
    storage: "Rými, aðgengi, læsingar og rakamerki.",
    commercial: "Skrifstofur, verslanir og önnur vinnurými.",
  } satisfies Record<AssetType, string>,
  statuses: {
    draft: "Drög",
    active: "Í skráningu",
    reviewed: "Yfirfarið · sýni",
  } satisfies Record<ReportStatus, string>,
  conditions: {
    good: "Í lagi",
    wear: "Notkunarmerki",
    defect: "Slit / galli",
    damaged: "Skemmt",
    uninspected: "Ekki skoðað",
    na: "Á ekki við",
  } satisfies Record<Condition, string>,
  conditionHelp: {
    good: "Engin frávik sjást.",
    wear: "Eðlileg ummerki um notkun.",
    defect: "Slit eða galli sem þarf að lýsa.",
    damaged: "Sýnileg skemmd sem þarf að lýsa.",
    uninspected: "Atriðið var ekki skoðað.",
    na: "Atriðið er ekki til staðar eða á ekki við.",
  } satisfies Record<Condition, string>,
  functionality: {
    works: "Virkar",
    broken: "Virkar ekki",
    untested: "Ekki prófað",
    na: "Á ekki við",
  } satisfies Record<Functionality, string>,
  cleanliness: {
    clean: "Hreint",
    dirty: "Þarfnast þrifa",
    uninspected: "Ekki skoðað",
    na: "Á ekki við",
  } satisfies Record<Cleanliness, string>,
  rooms: {
    entry: "Forstofa / gangur",
    living: "Stofa",
    kitchen: "Eldhús",
    bedroom: "Svefnherbergi",
    bathroom: "Baðherbergi",
    laundry: "Þvottahús",
    storage: "Geymsla",
    balcony: "Svalir / pallur",
    custom: "Sérsniðið rými",
  } satisfies Record<RoomType, string>,
  inspectionTypes: {
    initial: "Upphafsskráning",
    final: "Lokaskráning",
    independent: "Sjálfstæð skráning",
  },
  roles: {
    landlord: "Leigusali",
    tenant: "Leigjandi",
    representative: "Fulltrúi",
  },
  steps: ["Upplýsingar", "Rými", "Skráning", "Yfirferð"],
  save: {
    loading: "Hleð drögum…",
    pending: "Vista í vafra…",
    saved: "Vistað í þessum vafra",
    error: "Ekki tókst að vista í vafra",
    "read-error": "Staðbundin gögn læst til verndar",
    "validation-error": "Breytingu hafnað · gögn óbreytt",
    memory: "Sýnigögn tilbúin",
  },
};
