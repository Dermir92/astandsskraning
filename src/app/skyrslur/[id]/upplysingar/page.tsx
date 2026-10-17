import type { Metadata } from "next";
import { DetailsScreen } from "@/components/screens/details-screen";
import { Suspense } from "react";
export const metadata: Metadata = { title: "Upplýsingar um íbúð" };
export default function Page() {
  return <Suspense fallback={<p role="status">Hleð upplýsingum…</p>}><DetailsScreen /></Suspense>;
}
