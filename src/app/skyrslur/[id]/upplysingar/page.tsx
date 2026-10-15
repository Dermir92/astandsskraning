import type { Metadata } from "next";
import { DetailsScreen } from "@/components/screens/details-screen";
export const metadata: Metadata = { title: "Upplýsingar um íbúð" };
export default function Page() {
  return <DetailsScreen />;
}
