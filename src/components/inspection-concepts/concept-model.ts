import {
  EMPTY_OBSERVATION, makeRoom, needsAttention, observationComplete, requiresDamage,
  type ChecklistItem, type Observation, type Room,
} from "@/lib/model";

export type Concept = "a" | "b";
export type Position = { roomId: string; itemId: string };
export type DemoState = { rooms: Room[]; position: Position; paused: boolean };
export type DemoPhoto = { id: string; url: string; name: string; synthetic?: boolean };
export type PhotoMap = Record<string, DemoPhoto[]>;
export type Scenario = "opening" | "normal" | "assessment" | "damage" | "incomplete" | "resume";

export const SESSION_PREFIX = "astandsskraning-concept-session-";
export const photoKey = (position: Position) => `${position.roomId}:${position.itemId}`;
export const overviewKey = (roomId: string) => `${roomId}:overview`;

export function newDemo(): DemoState {
  // Existing residential definitions, stable sandbox IDs, no new asset template.
  const rooms = [
    makeRoom("entry", "Forstofa", "concept-entry"),
    makeRoom("living", "Stofa", "concept-living"),
    makeRoom("kitchen", "Eldhús", "concept-kitchen"),
    makeRoom("bedroom", "Svefnherbergi", "concept-bedroom"),
    makeRoom("bathroom", "Baðherbergi", "concept-bathroom"),
  ];
  return { rooms, position: { roomId: rooms[0].id, itemId: "floor" }, paused: false };
}

export function scenarioState(scenario: Scenario): { state: DemoState; photos: PhotoMap } {
  const state = newDemo();
  const entry = state.rooms[0];
  const photos: PhotoMap = {};
  if (scenario !== "opening") {
    entry.observations.floor = { ...EMPTY_OBSERVATION, condition: "good", cleanliness: "clean" };
    state.position.itemId = "walls";
  }
  if (scenario === "normal") entry.observations.walls = { ...EMPTY_OBSERVATION, condition: "good" };
  if (scenario === "assessment" || scenario === "incomplete" || scenario === "resume") {
    entry.observations.windows = { ...EMPTY_OBSERVATION, condition: "good", functionality: "works" };
    state.position.itemId = "windows";
  }
  if (scenario === "damage") {
    entry.observations.walls = {
      ...EMPTY_OBSERVATION, condition: "damaged", damageType: "Rispa",
      location: "Neðarlega við dyrakarm", description: "Um 8 cm löng rispa í málningu við dyrakarm. Undirlag sést á hluta rispunnar.",
    };
    photos[photoKey(state.position)] = [{ id: "synthetic-wall", url: "/concepts/synthetic-wall-damage.png", name: "Rispa við dyrakarm", synthetic: true }];
  }
  state.paused = scenario === "resume";
  return { state, photos };
}

export function observationFor(room: Room, itemId: string): Observation {
  return room.observations[itemId] ?? EMPTY_OBSERVATION;
}

export function missingAnswers(item: ChecklistItem, o: Observation): string[] {
  if (!o.condition) return ["Ástand vantar"];
  if (o.condition === "na") return [];
  return [
    item.functionality && !o.functionality && "Virkni vantar",
    item.cleanliness && !o.cleanliness && "Þrif vantar",
    requiresDamage(o) && !o.damageType.trim() && "Tegund fráviks vantar",
    requiresDamage(o) && !o.location.trim() && "Staðsetningu vantar",
    requiresDamage(o) && !o.description.trim() && "Lýsingu vantar",
  ].filter((value): value is string => !!value);
}

export function itemStatus(item: ChecklistItem, o: Observation) {
  if (!o.condition) return { label: "Óskráð", tone: "empty" };
  if (!observationComplete(item, o)) return { label: "Ófullskráð", tone: "warning" };
  if (needsAttention(item, o)) return { label: "Þarf athygli", tone: "warning" };
  if (requiresDamage(o) || (o.condition !== "na" && o.cleanliness === "dirty")) return { label: "Frávik skráð", tone: "warning" };
  return { label: o.condition === "na" ? "Á ekki við" : "Skráð", tone: "complete" };
}

export function reviewReasons(item: ChecklistItem, o: Observation, photos: DemoPhoto[]) {
  const missing = missingAnswers(item, o);
  if (o.condition !== "na") {
    if (o.condition === "uninspected") missing.push("Ekki skoðað");
    if (o.functionality === "untested") missing.push("Virkni ekki prófuð");
    if (o.cleanliness === "uninspected") missing.push("Þrif ekki skoðuð");
    if (requiresDamage(o)) missing.push(photos.length ? "Frávik með mynd" : "Mynd af fráviki vantar");
    if (o.cleanliness === "dirty") missing.push("Þarfnast þrifa");
  }
  return missing;
}
