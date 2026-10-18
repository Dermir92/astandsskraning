"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { type Report } from "@/lib/model";
import { is } from "@/lib/locale/is";
import { hasRentalExtensions, hasRentalInformation, leaseDateWarning, rentalInformationIssues, representativeName } from "@/lib/rental-information";
import { detailsCorrectionHref, type DetailCorrectionTarget } from "./use-details-correction";

function Entry({ report, field, label, value }: { report: Report; field: DetailCorrectionTarget; label: string; value?: string }) {
  return <div className="rental-entry">
    <dt><Link href={detailsCorrectionHref(report.id, field, "rental")} aria-label={`Breyta: ${label}`}>{label}<Pencil size={12} aria-hidden="true" /></Link></dt>
    <dd className="core-prose">{value?.trim() ? value : is.core.unknown}</dd>
  </div>;
}

export function RentalInformationSummary({ report }: { report: Report }) {
  useEffect(() => {
    if (window.location.hash !== "#review-rental-details") return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById("review-rental-details") ?? document.getElementById("review-core-details");
      const disclosure = target?.querySelector("details");
      if (disclosure) disclosure.open = true;
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const d = report.details;
  const active = d.inspectionContext === "residential_rental";
  if (!active && !hasRentalInformation(d)) return null;
  const r = d.rentalInformation;
  const rep = r?.representation;
  const t = is.rental;
  const body = <>
    <div className="panel-heading"><p className="field-hint">{active ? t.attribution : t.retainedHint}</p><Link className="text-link" href={detailsCorrectionHref(report.id, "rentalLandlordNames")}>{t.edit}</Link></div>
    <dl className="property-details rental-summary-fields">
      <Entry report={report} field="rentalLandlordNames" label={t.landlord} value={r?.landlordNames} />
      <Entry report={report} field="rentalTenantNames" label={t.tenant} value={r?.tenantNames} />
      <Entry report={report} field="rentalPremisesDescription" label={t.premises} value={r?.premisesDescription} />
      <Entry report={report} field="rentalLeaseDate" label={t.leaseDate} value={r?.leaseDate} />
      <Entry report={report} field="rentalLeaseReference" label={t.leaseReference} value={r?.leaseReference} />
    </dl>
    {leaseDateWarning(r?.leaseDate) ? <p className="field-error">{t.leaseDateError}</p> : null}
    <details className="rental-disclosure">
      <summary>{t.property}</summary>
      <dl className="property-details rental-disclosure-body">
        <Entry report={report} field="rentalPropertyNumber" label={t.propertyNumber} value={r?.propertyNumber} />
        <Entry report={report} field="rentalIncludedAreasDescription" label={t.includedAreas} value={r?.includedAreasDescription} />
        <Entry report={report} field="rentalExcludedAreasDescription" label={t.excludedAreas} value={r?.excludedAreasDescription} />
      </dl>
    </details>
    <details className="rental-disclosure">
      <summary>{t.representation}</summary>
      <dl className="property-details rental-disclosure-body">
        <Entry report={report} field="rentalRepresentativeNameSource" label={t.nameSource} value={rep?.nameSource ? t.nameSources[rep.nameSource] : undefined} />
        <Entry report={report} field={rep?.nameSource === "other" ? "rentalRepresentativeName" : rep?.nameSource === "recorder" ? "recorderName" : "rentalRepresentativeNameSource"} label={t.representativeName} value={representativeName(d)} />
        <Entry report={report} field="rentalRepresentedParty" label={t.representedParty} value={rep?.representedParty ? t.representedParties[rep.representedParty] : undefined} />
        <Entry report={report} field="rentalRepresentationBasis" label={t.basis} value={rep?.basisDescription} />
      </dl>
      {rep?.nameSource === "recorder" ? <p className="field-hint">{t.recorderReference}</p> : null}
      <p className="field-hint">{t.basisHint}</p>
    </details>
    {hasRentalExtensions(d) ? <p className="field-hint">{t.extensionNotice}</p> : null}
    {active && !rentalInformationIssues(d).length ? <p className="rental-readiness">{t.recorded}</p> : null}
  </>;
  return <section className="panel review-property core-summary rental-summary" id="review-rental-details" tabIndex={-1} aria-labelledby="rental-summary-title">
    {active ? <><div className="panel-heading"><h2 id="rental-summary-title">{t.title}</h2></div>{body}</> : <details>
      <summary><h2 id="rental-summary-title">{t.retainedTitle}</h2></summary>
      <div className="rental-disclosure-body">{body}</div>
    </details>}
  </section>;
}
