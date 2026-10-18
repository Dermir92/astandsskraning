import { isCalendarDate, type ApartmentDetails } from "./model";
import { is } from "./locale/is";

export const RENTAL_FIELD_IDS = [
  "rentalLandlordNames", "rentalTenantNames", "rentalLeaseDate", "rentalLeaseReference",
  "rentalPropertyNumber", "rentalPremisesDescription", "rentalIncludedAreasDescription",
  "rentalExcludedAreasDescription", "rentalRepresentativeNameSource", "rentalRepresentativeName",
  "rentalRepresentedParty", "rentalRepresentationBasis",
] as const;
export type RentalFieldId = (typeof RENTAL_FIELD_IDS)[number];
export interface RentalInformationIssue {
  field: RentalFieldId | "role";
  kind: "missing" | "invalid" | "inconsistent";
  label: string;
}

export function leaseDateWarning(value?: string) {
  return value && !isCalendarDate(value) ? is.rental.leaseDateError : undefined;
}
export function hasLeaseAssociation(d: ApartmentDetails) {
  const rental = d.rentalInformation;
  return !!rental?.leaseReference?.trim() || !!(rental?.leaseDate && isCalendarDate(rental.leaseDate));
}
export function representationClaimed(d: ApartmentDetails) {
  return d.role === "representative" || !!d.rentalInformation?.representation?.nameSource;
}
export function representativeName(d: ApartmentDetails) {
  const r = d.rentalInformation?.representation;
  return r?.nameSource === "recorder" ? d.recorderName : r?.nameSource === "other" ? r.name : undefined;
}
// Include unknown extension keys when deciding whether retained data is discoverable.
function hasContent(value: unknown): boolean {
  if (typeof value === "string") return !!value.length;
  if (value && typeof value === "object") return Object.values(value).some(hasContent);
  return value !== undefined && value !== null;
}
export function hasRentalInformation(d: ApartmentDetails) {
  return hasContent(d.rentalInformation) || hasRentalExtensions(d);
}
export function hasRetainedRentalInformation(d: ApartmentDetails) {
  return hasRentalInformation(d) || !!(d.deliveryDate || d.furnished);
}
export function hasRentalExtensions(d: ApartmentDetails) {
  const r = d.rentalInformation;
  if (!r) return false;
  const known = new Set(["landlordNames", "tenantNames", "leaseDate", "leaseReference", "propertyNumber", "premisesDescription", "includedAreasDescription", "excludedAreasDescription", "representation"]);
  const representationKeys = new Set(["nameSource", "name", "representedParty", "basisDescription"]);
  return Object.keys(r).some(key => !known.has(key)) || !!(r.representation && Object.keys(r.representation).some(key => !representationKeys.has(key)));
}
export function rentalInformationIssues(d: ApartmentDetails): RentalInformationIssue[] {
  if (d.inspectionContext !== "residential_rental") return [];
  const r = d.rentalInformation;
  const labels = is.rental.missing;
  const issues: RentalInformationIssue[] = [];
  const missing = (field: RentalFieldId, absent: boolean, label: string) => {
    if (absent) issues.push({ field, kind: "missing", label });
  };
  missing("rentalLandlordNames", !r?.landlordNames?.trim(), labels.landlord);
  missing("rentalTenantNames", !r?.tenantNames?.trim(), labels.tenant);
  missing("rentalPremisesDescription", !r?.premisesDescription?.trim(), labels.premises);
  missing("rentalLeaseReference", !hasLeaseAssociation(d), labels.lease);
  if (leaseDateWarning(r?.leaseDate)) issues.push({ field: "rentalLeaseDate", kind: "invalid", label: labels.leaseDate });
  if (representationClaimed(d)) {
    const rep = r?.representation;
    missing("rentalRepresentativeNameSource", !rep?.nameSource, labels.nameSource);
    missing("rentalRepresentedParty", !rep?.representedParty, labels.representedParty);
    missing("rentalRepresentativeName", rep?.nameSource === "other" && !rep.name?.trim(), labels.representativeName);
    if (rep?.nameSource === "recorder" && d.role !== "representative") issues.push({ field: "role", kind: "inconsistent", label: labels.role });
  }
  return issues;
}
