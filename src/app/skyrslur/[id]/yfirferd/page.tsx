import type { Metadata } from "next";
import { ReviewScreen } from "@/components/screens/review-screen";
export const metadata: Metadata = { title: "Yfirferð skráningar" };
export default function Page() {
  return <ReviewScreen />;
}
