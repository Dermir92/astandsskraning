import type { ApartmentDetails } from "@/lib/model";
import { FIRE_GROUPS, fireGroupStatus, fireState } from "@/lib/fire-observations";
import { METER_UTILITIES, activeMeterPurpose, meterState, meterUtilityStatus } from "@/lib/meter-readings";
import { is } from "@/lib/locale/is";

// Presentation of existing business states, never a new completion predicate.
export function inspectionSectionStatus(details: ApartmentDetails) {
  const fire = fireState(details);
  const rental = details.inspectionContext === "residential_rental";
  const context = !details.inspectionContext ? "Samhengi óstaðfest" : rental ? "Leiguskoðun" : "Valfrjálst";
  const unanswered = FIRE_GROUPS.filter(group => !details.fireSafety?.[group]?.examination).length;
  const fireAnswer = fire.concerns.length ? "Þarf athygli" : unanswered === FIRE_GROUPS.length
    ? rental ? `${unanswered} flokkar ósvaraðir` : "Ósvarað"
    : fire.missing.length ? "Ófullskráð" : fire.limitations.some(issue => !issue.contextual) ? "Takmörkun skráð" : "Svör skráð";
  const meter = meterState(details);
  const purpose = activeMeterPurpose(details);
  const missing = meter.issues.filter(issue => issue.kind === "missing").length;
  const meterAnswer = !purpose ? details.meterReadings ? "Varðveitt skráning" : "Ekki hafið"
    : meter.issues.some(issue => issue.kind === "confirmation") ? "Þarf staðfestingu"
    : meter.issues.some(issue => issue.kind === "review") ? "Þarf yfirferð"
    : missing ? `${missing} ${missing === 1 ? "svar vantar" : "svör vantar"}`
    : !meter.participating.length ? "Ekkert valið"
    : meter.limitations.length ? "Takmörkun skráð"
    : meter.participating.every(utility => meterUtilityStatus(details, utility) === is.meters.status.recorded) ? "Álestrar skráðir"
    : "Fyrirkomulag skráð";
  return {
    fire: {
      short: rental ? fireAnswer : `${context} · ${fireAnswer.toLocaleLowerCase("is")}`,
      context,
      details: FIRE_GROUPS.map(group => `${is.fire.groups[group]} · ${fireGroupStatus(details.fireSafety, group)}`),
    },
    meters: {
      short: purpose === "optional" ? `Valfrjálst · ${meterAnswer.toLocaleLowerCase("is")}` : meterAnswer,
      context: purpose ? is.meters.titles[purpose] : details.meterReadings ? "Óvirk eða utan núverandi samhengis" : "Tilgangur óvalinn",
      details: METER_UTILITIES.map(utility => `${is.meters.utilities[utility]} · ${meterUtilityStatus(details, utility)}`),
    },
  };
}
