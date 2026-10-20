"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { is } from "@/lib/locale/is";
import styles from "./report-preview.module.css";

export function ReportPreviewEntry({ reportId }: { reportId: string }) {
  const entry = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (window.location.hash !== "#report-preview-entry") return;
    const frame = requestAnimationFrame(() => { entry.current?.focus({ preventScroll: true }); entry.current?.scrollIntoView({ block: "center", behavior: "instant" }); });
    return () => cancelAnimationFrame(frame);
  }, []);
  return <div className={styles.entry}><Link ref={entry} id="report-preview-entry" className="button button-primary" href={`/skyrslur/${encodeURIComponent(reportId)}/forskodun`}><FileText size={17} aria-hidden="true" />{is.preview.open}</Link><p>{is.preview.readOnly}</p></div>;
}
