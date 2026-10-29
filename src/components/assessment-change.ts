import { EMPTY_OBSERVATION, type Observation } from "@/lib/model";
import type { DemoStore } from "./demo-provider";

type Target = { reportId: string; roomId: string; itemId: string };
export interface AssessmentChange { dispose(): void; apply(): AssessmentChange | null }
const assessmentKeys: (keyof Observation)[] = ["condition", "functionality", "cleanliness"];
const locked = (status: string) => ["loading", "read-error", "conflict", "refresh-required"].includes(status);
const context = (value: object, omit: string[]) => JSON.stringify(Object.fromEntries(Object.entries(value).filter(([key]) => !omit.includes(key))));

function current(store: DemoStore, target: Target) {
  const snapshot = store.getSnapshot();
  const report = snapshot.reports.find(r => r.id === target.reportId);
  const room = report?.rooms.find(r => r.id === target.roomId);
  const item = room?.items.find(i => i.id === target.itemId);
  if (locked(snapshot.status) || !report || report.assetType !== "apartment" || report.sampleReviewed || !room || !item || item.kind === "space_heating") return null;
  return { report, room, item, observation: room.observations[item.id] ?? EMPTY_OBSERVATION };
}

// A short-lived UI transaction, never a persisted history or a replacement writer.
// Observe intervening changes too: A → B → A must invalidate an old confirmation/undo.
export function prepareAssessmentChange(store: DemoStore, target: Target, patch: Partial<Observation>, watchKeys = assessmentKeys): AssessmentChange | null {
  const start = current(store, target);
  if (!start) return null;
  const reportContext = (report: typeof start.report) => context(report, ["rooms", "updatedAt"]);
  const roomContext = (room: typeof start.room) => context(room, ["observations", "items"]);
  const expectedReport = reportContext(start.report), expectedRoom = roomContext(start.room);
  const keys = (Object.keys(patch) as (keyof Observation)[]).filter(key => !Object.is(start.observation[key], patch[key]));
  if (!keys.length) return null;
  let valid = true;
  const matches = () => {
    const live = current(store, target);
    return !!live && live.report.details === start.report.details && live.report.linkedInitial === start.report.linkedInitial &&
      reportContext(live.report) === expectedReport && roomContext(live.room) === expectedRoom &&
      live.room.items === start.room.items && live.item === start.item &&
      watchKeys.every(key => Object.is(live.observation[key], start.observation[key]));
  };
  const unsubscribe = store.subscribe(() => { if (!matches()) valid = false; });
  const dispose = () => { valid = false; unsubscribe(); };
  return {
    dispose,
    apply() {
      if (!valid || !matches()) { dispose(); return null; }
      const live = current(store, target)!;
      const next = { ...live.observation };
      const previous: Partial<Observation> = {};
      for (const key of keys) {
        Object.assign(previous, { [key]: live.observation[key] });
        if (patch[key] === undefined) delete next[key];
        else Object.assign(next, { [key]: patch[key] });
      }
      dispose();
      store.updateObservation(target.reportId, target.roomId, target.itemId, next);
      // Valid drafts can remain in memory on a write error. Do not claim acceptance
      // when the real store rejected the change or lost authorization.
      if (current(store, target)?.observation !== next) return null;
      return prepareAssessmentChange(store, target, previous, keys);
    },
  };
}
