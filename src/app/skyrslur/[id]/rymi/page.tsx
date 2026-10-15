import type { Metadata } from "next";
import { RoomsScreen } from "@/components/screens/rooms-screen";
export const metadata: Metadata = { title: "Velja rými" };
export default function Page() {
  return <RoomsScreen />;
}
