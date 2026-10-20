import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportPreviewScreen } from "@/components/screens/report-preview-screen";

export const metadata: Metadata = { title: "Forskoðun skýrslu" };
export default function Page() {
  return <Suspense fallback={<p role="status">Hleð forskoðun…</p>}><ReportPreviewScreen /></Suspense>;
}
