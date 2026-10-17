import { requiresDamage, type Observation } from "./model";

// Presentation only: the draft has no chronology or assessment-at-attachment data.
export function hasRetainedDefect(observation?: Observation): boolean {
  return !!observation && !requiresDamage(observation) &&
    [observation.damageType, observation.location, observation.description].some(value => value.trim());
}
