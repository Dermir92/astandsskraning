import type { Metadata } from "next";
import { Suspense } from "react";
import { InspectionScreen } from "@/components/screens/inspection-screen";
export const metadata: Metadata = { title: "Ástandsskráning" };
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Hleð skráningu…</p>}>
      <InspectionScreen />
    </Suspense>
  );
}
