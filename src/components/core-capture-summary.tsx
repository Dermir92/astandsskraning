"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { formatDate, inspectionDateWarning, isCalendarDate, type Report } from "@/lib/model";
import { is } from "@/lib/locale/is";
import { detailsCorrectionHref } from "./use-details-correction";

export function CoreCaptureSummary({ report }: { report: Report }) {
  useEffect(() => {
    if (window.location.hash !== "#review-core-details") return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById("review-core-details");
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const d = report.details;
  const dateWarning = inspectionDateWarning(d.inspectionDate);
  return (
    <section className="panel review-property core-summary" id="review-core-details" tabIndex={-1} aria-labelledby="core-summary-title">
      <div className="panel-heading">
        <h2 id="core-summary-title">Skoðun og umfang</h2>
        <Link className="text-link" href={detailsCorrectionHref(report.id)}><Pencil size={14} aria-hidden="true" />Breyta skoðun og umfangi</Link>
      </div>
      <dl className="property-details">
        <div><dt>Tengsl við íbúðarleigu</dt><dd>{d.inspectionContext ? is.inspectionContexts[d.inspectionContext] : is.core.unknown}</dd></div>
        <div><dt>Dagsetning skoðunar</dt><dd>{d.inspectionDate ? isCalendarDate(d.inspectionDate) ? formatDate(d.inspectionDate) : d.inspectionDate : is.core.unknown}{dateWarning ? <span className="field-error">{dateWarning}</span> : null}</dd></div>
        <div><dt>Skráningaraðili</dt><dd>{d.recorderName?.trim() ? d.recorderName : is.core.unknown}<span>{d.role ? is.roles[d.role] : "Hlutverk óskráð"}</span></dd></div>
        <div className="field-full"><dt>Umfang skoðunar</dt><dd className="core-prose">{d.scopeDescription?.trim() ? d.scopeDescription : is.core.unknown}</dd></div>
        <div className="field-full"><dt>Takmarkanir skoðunar</dt><dd className="core-prose">{d.scopeLimitations?.trim() ? d.scopeLimitations : is.core.limitationsUnknown}</dd></div>
      </dl>
      <p className="field-hint">{is.core.attribution}</p>
      {d.inspectionContext === "residential_rental" ? <p className="core-rental-note">{is.core.rentalLimit}</p> : null}
      {d.inspectionType === "independent" ? <p className="field-hint">{is.core.examinerHint}</p> : null}
    </section>
  );
}
