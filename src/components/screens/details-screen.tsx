"use client";

import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { useReport, MissingReport } from "../report-context";
import { BackLink, FlowFooter, PageHeading, Stepper } from "../ui";
import { Field } from "../form-field";
import { SampleSummary } from "./sample-summary";
import { SaveStatus } from "../app-shell";
import { is } from "@/lib/locale/is";
import type { ApartmentDetails } from "@/lib/model";
import Link from "next/link";

export function DetailsScreen() {
  const { report, id, store, state } = useReport();
  const router = useRouter();
  if (state.status === "loading" || !report)
    return <MissingReport loading={state.status === "loading"} />;
  if (report.sampleReviewed || report.assetType !== "apartment")
    return <SampleSummary report={report} />;
  const d = report.details;
  const change = <K extends keyof ApartmentDetails>(
    key: K,
    value: ApartmentDetails[K],
  ) =>
    store.updateReport(id, (r) => ({
      ...r,
      details: { ...r.details, [key]: value },
    }));
  const postalError =
    d.postalCode !== "" && !/^\d{3}$/.test(d.postalCode)
      ? "Póstnúmer þarf að vera þrír tölustafir, t.d. 101."
      : undefined;
  return (
    <div className="form-page">
      <BackLink />
      <Stepper reportId={id} step={0} />
      <PageHeading
        title="Upplýsingar um íbúð"
        description="Skráðu grunnupplýsingarnar. Þú getur haldið áfram með ófullgerð drög."
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/skyrslur/${id}/rymi`);
        }}
      >
        <section className="panel form-panel">
          <div className="panel-heading">
            <h2>Skráning og eign</h2>
            <p>
              <span className="required-mark">*</span> Nauðsynlegt fyrir fulla
              skráningu
            </p>
          </div>
          <fieldset className="choice-field">
            <legend>
              Tegund skráningar <span className="required-mark">*</span>
            </legend>
            <div className="radio-options">
              {Object.entries(is.inspectionTypes).map(([value, label]) => (
                <label
                  className={`radio-option ${d.inspectionType === value ? "radio-selected" : ""}`}
                  key={value}
                >
                  <input
                    type="radio"
                    name="inspectionType"
                    value={value}
                    checked={d.inspectionType === value}
                    onChange={() =>
                      change(
                        "inspectionType",
                        value as ApartmentDetails["inspectionType"],
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-grid">
            <Field id="address" label="Heimilisfang" className="field-full">
              <input
                id="address"
                value={d.address}
                onChange={(e) => change("address", e.target.value)}
                placeholder="T.d. Sýnigata 14"
                autoComplete="off"
              />
            </Field>
            <Field id="postalCode" label="Póstnúmer" error={postalError}>
              <input
                id="postalCode"
                value={d.postalCode}
                onChange={(e) => change("postalCode", e.target.value)}
                inputMode="numeric"
                maxLength={3}
                placeholder="101"
                aria-invalid={!!postalError}
                aria-describedby={postalError ? "postalCode-error" : undefined}
                autoComplete="off"
              />
            </Field>
            <Field id="municipality" label="Sveitarfélag">
              <input
                id="municipality"
                value={d.municipality}
                onChange={(e) => change("municipality", e.target.value)}
                placeholder="T.d. Reykjavík"
                autoComplete="off"
              />
            </Field>
            <Field
              id="unit"
              label="Íbúðarnúmer / hæð"
              optional
              className="field-full"
            >
              <input
                id="unit"
                value={d.unit}
                onChange={(e) => change("unit", e.target.value)}
                placeholder="T.d. 0201 · 2. hæð"
              />
            </Field>
          </div>
        </section>
        <section className="panel form-panel">
          <div className="panel-heading">
            <h2>Afhending</h2>
            <p>Hvað á að skrá og hvenær?</p>
          </div>
          <div className="form-grid">
            <Field id="role" label="Hlutverk stofnanda">
              <select
                id="role"
                value={d.role}
                onChange={(e) =>
                  change("role", e.target.value as ApartmentDetails["role"])
                }
              >
                <option value="">Veldu hlutverk</option>
                {Object.entries(is.roles).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="deliveryDate" label="Dagsetning afhendingar">
              <input
                id="deliveryDate"
                type="date"
                value={d.deliveryDate}
                onChange={(e) => change("deliveryDate", e.target.value)}
              />
            </Field>
          </div>
          <fieldset className="choice-field">
            <legend>
              Fylgja húsgögn? <span className="required-mark">*</span>
            </legend>
            <div className="radio-options radio-compact">
              {(
                [
                  ["yes", "Já"],
                  ["no", "Nei"],
                  ["partly", "Að hluta"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`radio-option ${d.furnished === value ? "radio-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="furnished"
                    checked={d.furnished === value}
                    onChange={() => change("furnished", value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field
            id="notes"
            label="Athugasemdir um íbúð eða afhendingu"
            optional
          >
            <textarea
              id="notes"
              rows={3}
              value={d.notes}
              onChange={(e) => change("notes", e.target.value)}
              placeholder="T.d. hvaða búnaður eða húsgögn fylgja."
            />
          </Field>
        </section>
        <div className="info-note">
          <Info size={18} aria-hidden="true" />
          <p>
            Breytingar vistast sem drög í þessum vafra þegar vistun tekst.
            Fylgstu með vistunarstöðunni. Reitir sem vantar birtast í
            yfirferðinni.
          </p>
        </div>
        <FlowFooter backHref="/" nextText="Velja rými">
          <Link href="/" className="draft-link">
            Fara í yfirlit draga
          </Link>
        </FlowFooter>
        <div className="local-save">
          <SaveStatus />
        </div>
      </form>
    </div>
  );
}
