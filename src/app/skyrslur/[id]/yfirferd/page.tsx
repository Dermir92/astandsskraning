import type { Metadata } from "next";
import { ReviewScreen } from "@/components/screens/review-screen";
import { Suspense } from "react";
export const metadata: Metadata = { title: "Yfirferð skráningar" };
export default function Page() {
  return <Suspense fallback={<p role="status">Hleð yfirferð…</p>}><ReviewScreen /></Suspense>;
}
