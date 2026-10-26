"use client";

import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { useReport, MissingReport } from "../report-context";
import { BackLink, FlowFooter, PageHeading, Stepper } from "../ui";
import { Field } from "../form-field";
import { SampleSummary } from "./sample-summary";
import { SaveStatus } from "../app-shell";
import { useDetailsCorrection } from "../use-details-correction";
import { is } from "@/lib/locale/is";
import { inspectionDateWarning, isCalendarDate, rentalRequirements, type ApartmentDetails } from "@/lib/model";
import Link from "next/link";
import { RentalInformationFields, type UpdateDetails } from "../rental-information-fields";
import { InspectionComparisonPanel } from "../inspection-comparison";

export function DetailsScreen() {
  const { report, id, store, state, mode } = useReport();
  const router = useRouter();
  const { fromReview, reviewSection } = useDetailsCorrection(state.status !== "loading" && !!report);
  if (state.status === "loading" || !report)
    return <MissingReport loading={state.status === "loading"} />;
  if (report.sampleReviewed || report.assetType !== "apartment")
    return <SampleSummary report={report} />;
  const d = report.details;
  const required = rentalRequirements(d);
  const change = <K extends keyof ApartmentDetails>(key: K, value: ApartmentDetails[K]) =>
    store.updateReport(id, (r) => ({ ...r, details: { ...r.details, [key]: value } }));
  const updateDetails: UpdateDetails = update => store.updateReport(id, r => ({ ...r, details: update(r.details) }));
  const postalError = d.postalCode !== "" && !/^\d{3}$/.test(d.postalCode)
    ? "Póstnúmer þarf að vera þrír tölustafir, t.d. 101." : undefined;
  const dateError = inspectionDateWarning(d.inspectionDate);
  const preservedDate = !!d.inspectionDate && !isCalendarDate(d.inspectionDate);
  const reviewHref = `/skyrslur/${encodeURIComponent(id)}/yfirferd#${reviewSection}`;
  return (
    <div className="form-page core-details">
      <BackLink />
      <Stepper reportId={id} step={0} />
      <PageHeading title="Upplýsingar um íbúð" description="Grunnur að skýrri skráningu. Þú getur fyllt út það sem vantar síðar." />
      <InspectionComparisonPanel report={report} compact />
      {fromReview ? <Link className="text-link core-return" href={reviewHref}>Aftur í yfirferð</Link> : null}
      <form noValidate onSubmit={(e) => { e.preventDefault(); router.push(fromReview ? reviewHref : `/skyrslur/${id}/rymi`); }}>
        <section className="panel form-panel">
          <div className="panel-heading"><h2>Skráning og eign</h2><p>* Má fylla út síðar</p></div>
          <Field id="inspectionContext" label="Tengsl við íbúðarleigu" className="core-context">
            <select id="inspectionContext" value={d.inspectionContext ?? ""} onChange={e => change("inspectionContext", e.target.value as ApartmentDetails["inspectionContext"])}>
              <option value="">Óskráð</option>
              {Object.entries(is.inspectionContextChoices).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <fieldset className="choice-field" aria-describedby={d.inspectionType === "independent" ? "independent-hint" : undefined}>
            <legend>Tegund skráningar <span className="required-mark">*</span></legend>
            <div className="radio-options">
              {Object.entries(is.inspectionTypes).map(([value, label]) => (
                <label className={`radio-option ${d.inspectionType === value ? "radio-selected" : ""}`} key={value}>
                  <input id={value === "initial" ? "inspectionType" : undefined} type="radio" name="inspectionType" value={value} disabled={mode === "cloud" && value !== "independent"} checked={d.inspectionType === value} onChange={() => change("inspectionType", value as ApartmentDetails["inspectionType"])} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {d.inspectionType === "independent" ? <p id="independent-hint" className="field-hint">{is.core.examinerHint}</p> : null}
            {mode === "cloud" ? <p className="field-hint">C1 prófar aðeins sjálfstæða skráningu. Upphafs- og lokaskoðanir eru ekki virkar í þessum ham.</p> : null}
          </fieldset>
          <div className="form-grid">
            <Field id="address" label="Heimilisfang" className="field-full">
              <input id="address" value={d.address} onChange={e => change("address", e.target.value)} placeholder="T.d. Sýnigata 14" autoComplete="off" />
            </Field>
            <Field id="postalCode" label="Póstnúmer" error={postalError}>
              <input id="postalCode" value={d.postalCode} onChange={e => change("postalCode", e.target.value)} inputMode="numeric" maxLength={3} placeholder="101" aria-invalid={!!postalError} aria-describedby={postalError ? "postalCode-error" : undefined} autoComplete="off" />
            </Field>
            <Field id="municipality" label="Sveitarfélag">
              <input id="municipality" value={d.municipality} onChange={e => change("municipality", e.target.value)} placeholder="T.d. Reykjavík" autoComplete="off" />
            </Field>
            <Field id="unit" label="Íbúðarnúmer / hæð" optional className="field-full">
              <input id="unit" value={d.unit} onChange={e => change("unit", e.target.value)} placeholder="T.d. 0201 · 2. hæð" autoComplete="off" />
            </Field>
          </div>
        </section>
        <section className="panel form-panel">
          <div className="panel-heading"><h2>Skoðun og skráningaraðili</h2></div>
          <div className="form-grid">
            <Field id="inspectionDate" label="Dagsetning skoðunar" hint={is.core.dateHint} error={dateError}>
              <input id="inspectionDate" type={preservedDate ? "text" : "date"} value={d.inspectionDate ?? ""} onChange={e => change("inspectionDate", e.target.value)} aria-invalid={!!dateError} aria-describedby={dateError ? "inspectionDate-error" : "inspectionDate-hint"} autoComplete="off" />
            </Field>
            <Field id="recorderName" label="Nafn skráningaraðila">
              <input id="recorderName" value={d.recorderName ?? ""} onChange={e => change("recorderName", e.target.value)} autoComplete="off" aria-describedby="recorder-attribution" />
            </Field>
            <Field id="role" label="Hlutverk stofnanda" optional={!required.role}>
              <select id="role" value={d.role} onChange={e => change("role", e.target.value as ApartmentDetails["role"])} aria-describedby="recorder-attribution">
                <option value="">Óskráð</option>
                {Object.entries(is.roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>
          <p id="recorder-attribution" className="field-hint core-attribution">{is.core.attribution}</p>
        </section>
        <RentalInformationFields details={d} updateDetails={updateDetails} />
        <section className="panel form-panel">
          <div className="panel-heading"><h2>Umfang og takmarkanir</h2></div>
          <div className="form-grid">
            <Field id="scopeDescription" label="Hvað var skoðað?" hint={is.core.scopeHint} className="field-full">
              <textarea id="scopeDescription" rows={2} value={d.scopeDescription ?? ""} onChange={e => change("scopeDescription", e.target.value)} aria-describedby="scopeDescription-hint" />
            </Field>
            <Field id="scopeLimitations" label="Takmarkanir skoðunar" optional hint={is.core.limitationsHint} className="field-full">
              <textarea id="scopeLimitations" rows={2} value={d.scopeLimitations ?? ""} onChange={e => change("scopeLimitations", e.target.value)} aria-describedby="scopeLimitations-hint" />
            </Field>
          </div>
        </section>
        <details className="panel form-panel core-notes">
          <summary><span>Aðrar athugasemdir</span>{d.notes.trim() ? <span className="core-extras-count">Athugasemd varðveitt · skoða og breyta</span> : null}</summary>
          <div className="core-extras-body">
            <Field id="notes" label="Athugasemdir um íbúð eða afhendingu" optional>
              <textarea id="notes" rows={2} value={d.notes} onChange={e => change("notes", e.target.value)} />
            </Field>
          </div>
        </details>
        <div className="info-note"><Info size={18} aria-hidden="true" /><p>{mode === "cloud" ? "Drög vistast í staðbundnum gagnagrunni þegar vistun er staðfest. Fylgstu með vistunarstöðunni." : "Drög vistast í þessum vafra þegar vistun tekst. Fylgstu með vistunarstöðunni."}</p></div>
        <FlowFooter backHref={fromReview ? reviewHref : "/"} nextText={fromReview ? "Aftur í yfirferð" : "Velja rými"}>
          <Link href="/" className="draft-link">Fara í yfirlit draga</Link>
        </FlowFooter>
        <div className="local-save"><SaveStatus /></div>
      </form>
    </div>
  );
}
