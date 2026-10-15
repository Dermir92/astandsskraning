import type { Metadata } from "next";
import { NewReportScreen } from "@/components/screens/new-report-screen";
export const metadata: Metadata = { title: "Ný skýrsla" };
export default function Page() {
  return <NewReportScreen />;
}
