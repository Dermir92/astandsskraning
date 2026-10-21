"use client";

import { useMemo } from "react";
import Link from "next/link";
import { buildReportPreview } from "@/lib/report-preview";
import { is } from "@/lib/locale/is";
import { useReport, MissingReport } from "../report-context";
import { Stepper } from "../ui";
import { SampleSummary } from "./sample-summary";
import { ReportPreviewDocument, PreviewBackLink } from "../report-preview";
import styles from "../report-preview.module.css";
import { InspectionComparisonPanel } from "../inspection-comparison";

export function ReportPreviewScreen() {
  const { state, report, id } = useReport();
  // Only warning calculations use today's UTC date; it never fills an event field.
  const today = new Date().toISOString().slice(0, 10);
  const preview = useMemo(() => state.status !== "loading" && state.status !== "read-error" && report && report.assetType === "apartment" && !report.sampleReviewed ? buildReportPreview({ report, photos: state.photos, reports: state.reports, today }) : null, [report, state.photos, state.reports, state.status, today]);
  if (state.status === "loading") return <MissingReport loading />;
  if (state.status === "read-error") return <section><h1>{is.preview.readError}</h1><p>{is.preview.readErrorHelp}</p><Link className="text-link" href="/">Mínar skýrslur</Link></section>;
  if (!report) return <MissingReport />;
  if (!preview) return <SampleSummary report={report} />;
  return <div className={`core-review ${styles.workspace}`}><Stepper reportId={id} step={3} /><div className={styles.toolbar}><PreviewBackLink reportId={id} /><p>{is.preview.readOnly}</p></div><ReportPreviewDocument preview={preview} comparison={report.linkedInitial ? <InspectionComparisonPanel report={report} reading /> : undefined} /><div className={styles.toolbar}><PreviewBackLink reportId={id} /></div></div>;
}
