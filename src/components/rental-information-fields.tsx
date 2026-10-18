"use client";

import type { ReactNode } from "react";
import { Field } from "./form-field";
import { is } from "@/lib/locale/is";
import { detailIssues, isCalendarDate, rentalRequirements, type ApartmentDetails, type RentalRepresentation, type ResidentialRentalInformation } from "@/lib/model";
import { hasLeaseAssociation, hasRentalExtensions, hasRentalInformation, hasRetainedRentalInformation, leaseDateWarning, rentalInformationIssues, representationClaimed } from "@/lib/rental-information";

export type UpdateDetails = (update: (details: ApartmentDetails) => ApartmentDetails) => void;
type Props = { details: ApartmentDetails; updateDetails: UpdateDetails };

function Disclosure({ title, status, children, open }: { title: string; status?: string; children: ReactNode; open?: boolean }) {
  return <details className="rental-disclosure" open={open}>
    <summary><span>{title}</span>{status ? <span className="rental-disclosure-status">{status}</span> : null}</summary>
    <div className="rental-disclosure-body">{children}</div>
  </details>;
}

export function HandoverFields({ details: d, updateDetails }: Props) {
  const required = rentalRequirements(d);
  return <>
    <Field id="deliveryDate" label="Dagsetning afhendingar" optional={!required.deliveryDate} hint="Aðskilin frá dagsetningu skoðunar.">
      <input id="deliveryDate" type={d.deliveryDate && !isCalendarDate(d.deliveryDate) ? "text" : "date"} value={d.deliveryDate} onChange={e => updateDetails(d => ({ ...d, deliveryDate: e.target.value }))} aria-describedby="deliveryDate-hint" />
    </Field>
    <fieldset className="choice-field rental-furniture">
      <legend>Fylgja húsgögn? {required.furnished ? <><span className="required-mark" aria-hidden="true">*</span><span className="sr-only">Má fylla út síðar</span></> : <span className="optional-label">Valfrjálst</span>}</legend>
      <div className="radio-options radio-compact">
        {([["yes", "Já"], ["no", "Nei"], ["partly", "Að hluta"]] as const).map(([value, label]) => <label key={value} className={`radio-option ${d.furnished === value ? "radio-selected" : ""}`}>
          <input id={value === "yes" ? "furnished" : undefined} type="radio" name="furnished" checked={d.furnished === value} onChange={() => updateDetails(d => ({ ...d, furnished: value }))} /><span>{label}</span>
        </label>)}
      </div>
    </fieldset>
  </>;
}

export function RentalInformationFields({ details: d, updateDetails }: Props) {
  const active = d.inspectionContext === "residential_rental";
  const retained = hasRetainedRentalInformation(d);
  const showRental = active || hasRentalInformation(d);
  const r = d.rentalInformation;
  const rep = r?.representation;
  const t = is.rental;
  const change = <K extends keyof ResidentialRentalInformation>(key: K, value: ResidentialRentalInformation[K]) =>
    updateDetails(d => ({ ...d, rentalInformation: { ...d.rentalInformation, [key]: value } }));
  const changeRepresentative = <K extends keyof RentalRepresentation>(key: K, value: RentalRepresentation[K]) =>
    updateDetails(d => ({ ...d, rentalInformation: { ...d.rentalInformation, representation: { ...d.rentalInformation?.representation, [key]: value } } }));
  const dateWarning = leaseDateWarning(r?.leaseDate);
  const representativeIssues = rentalInformationIssues(d).filter(issue => issue.field.startsWith("rentalRepresent") || issue.kind === "inconsistent");
  const handoverIssues = detailIssues(d).filter(issue => issue.field === "deliveryDate" || issue.field === "furnished").length;
  const body = <>
    {!active && retained ? <p className="field-hint">{t.retainedHint}</p> : null}
    {showRental ? <>
    <fieldset className="rental-parties" aria-describedby="rental-party-attribution">
      <legend className="sr-only">{t.parties}</legend>
      <div className="form-grid">
        <Field id="rentalLandlordNames" label={t.landlord} optional={!active} hint={t.landlordHint}>
          <textarea id="rentalLandlordNames" rows={1} value={r?.landlordNames ?? ""} onChange={e => change("landlordNames", e.target.value)} aria-describedby="rentalLandlordNames-hint rental-party-attribution" autoComplete="off" />
        </Field>
        <Field id="rentalTenantNames" label={t.tenant} optional={!active} hint={t.tenantHint}>
          <textarea id="rentalTenantNames" rows={1} value={r?.tenantNames ?? ""} onChange={e => change("tenantNames", e.target.value)} aria-describedby="rentalTenantNames-hint rental-party-attribution" autoComplete="off" />
        </Field>
      </div>
      <p className="field-hint" id="rental-party-attribution">{t.attribution}</p>
    </fieldset>
    <Field id="rentalPremisesDescription" label={t.premises} optional={!active} hint={t.premisesHint}>
      <textarea id="rentalPremisesDescription" rows={2} value={r?.premisesDescription ?? ""} onChange={e => change("premisesDescription", e.target.value)} aria-describedby="rentalPremisesDescription-hint" />
    </Field>
    <div className="rental-disclosures">
      <Disclosure title={t.lease} status={active && !hasLeaseAssociation(d) ? t.leaseMissing : r?.leaseReference?.trim() ? "Tilvísun skráð" : r?.leaseDate ? "Dagsetning skráð" : t.optional}>
        <div className="form-grid">
          <Field id="rentalLeaseDate" label={t.leaseDate} optional hint={t.leaseDateHint} error={dateWarning}>
            <input id="rentalLeaseDate" type={r?.leaseDate && !isCalendarDate(r.leaseDate) ? "text" : "date"} value={r?.leaseDate ?? ""} onChange={e => change("leaseDate", e.target.value)} aria-invalid={!!dateWarning} aria-describedby={dateWarning ? "rentalLeaseDate-error" : "rentalLeaseDate-hint"} />
          </Field>
          <Field id="rentalLeaseReference" label={t.leaseReference} optional hint={t.leaseReferenceHint}>
            <input id="rentalLeaseReference" value={r?.leaseReference ?? ""} onChange={e => change("leaseReference", e.target.value)} aria-describedby="rentalLeaseReference-hint" autoComplete="off" />
          </Field>
        </div>
        <p className="field-hint">{t.leaseHelp}</p>
      </Disclosure>
      <Disclosure title={t.property} status={r?.propertyNumber?.trim() || t.optional}>
        <div className="form-grid">
          <Field id="rentalPropertyNumber" label={t.propertyNumber} optional hint={t.propertyNumberHint}>
            <input id="rentalPropertyNumber" value={r?.propertyNumber ?? ""} onChange={e => change("propertyNumber", e.target.value)} aria-describedby="rentalPropertyNumber-hint" autoComplete="off" />
          </Field>
          <Field id="rentalIncludedAreasDescription" label={t.includedAreas} optional hint={t.includedAreasHint} className="field-full">
            <textarea id="rentalIncludedAreasDescription" rows={2} value={r?.includedAreasDescription ?? ""} onChange={e => change("includedAreasDescription", e.target.value)} aria-describedby="rentalIncludedAreasDescription-hint" />
          </Field>
          <Field id="rentalExcludedAreasDescription" label={t.excludedAreas} optional hint={t.excludedAreasHint} className="field-full">
            <textarea id="rentalExcludedAreasDescription" rows={2} value={r?.excludedAreasDescription ?? ""} onChange={e => change("excludedAreasDescription", e.target.value)} aria-describedby="rentalExcludedAreasDescription-hint" />
          </Field>
        </div>
      </Disclosure>
      <Disclosure title={t.representation} status={representativeIssues.length ? "Þarfnast yfirferðar" : rep?.nameSource ? "Sjálfskráð" : t.optional} open={active && d.role === "representative"}>
        <div className="form-grid">
          <Field id="rentalRepresentativeNameSource" label={t.nameSource} optional={!active || !representationClaimed(d)}>
            <select id="rentalRepresentativeNameSource" value={rep?.nameSource ?? ""} onChange={e => changeRepresentative("nameSource", e.target.value as RentalRepresentation["nameSource"])}>
              <option value="">{is.core.unknown}</option>
              {Object.entries(t.nameSources).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field id="rentalRepresentedParty" label={t.representedParty} optional={!active || !representationClaimed(d)}>
            <select id="rentalRepresentedParty" value={rep?.representedParty ?? ""} onChange={e => changeRepresentative("representedParty", e.target.value as RentalRepresentation["representedParty"])}>
              <option value="">{is.core.unknown}</option>
              {Object.entries(t.representedParties).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          {rep?.nameSource === "other" ? <Field id="rentalRepresentativeName" label={t.representativeName} optional={!active} className="field-full">
            <input id="rentalRepresentativeName" value={rep.name ?? ""} onChange={e => changeRepresentative("name", e.target.value)} autoComplete="off" />
          </Field> : null}
          {rep?.nameSource === "recorder" ? <p className="field-hint field-full"><strong>{d.recorderName?.trim() ? d.recorderName : is.core.unknown}</strong><br />{t.recorderReference}</p> : null}
          <Field id="rentalRepresentationBasis" label={t.basis} optional hint={t.basisHint} className="field-full">
            <textarea id="rentalRepresentationBasis" rows={2} value={rep?.basisDescription ?? ""} onChange={e => changeRepresentative("basisDescription", e.target.value)} aria-describedby="rentalRepresentationBasis-hint" />
          </Field>
        </div>
      </Disclosure>
    </div>
    </> : null}
    {showRental ? <Disclosure title={t.handover} status={handoverIssues ? `${handoverIssues} ${handoverIssues === 1 ? "upplýsing" : "upplýsingar"} vantar` : d.deliveryDate || d.furnished ? "Upplýsingar varðveittar" : t.optional}>
      <HandoverFields details={d} updateDetails={updateDetails} />
    </Disclosure> : <HandoverFields details={d} updateDetails={updateDetails} />}
    {hasRentalExtensions(d) ? <p className="field-hint rental-extension">{t.extensionNotice}</p> : null}
  </>;
  return active ? <section className="panel form-panel rental-panel" aria-labelledby="rental-fields-title">
    <div className="panel-heading"><h2 id="rental-fields-title">{t.title}</h2><p>Má fylla út síðar</p></div>{body}
  </section> : <details className={`panel form-panel core-extras rental-panel ${retained ? "rental-retained" : "rental-legacy-extras"}`}>
    <summary><span>{retained ? t.retainedTitle : "Aðrar upplýsingar"}</span><span className="core-extras-count">{retained ? t.retainedAction : "Afhending og húsgögn · valfrjálst"}</span></summary>
    <div className="core-extras-body">{body}</div>
  </details>;
}
