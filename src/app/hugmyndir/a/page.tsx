import type { Metadata } from "next";
import { ConceptWorkbench } from "@/components/inspection-concepts/concept-workbench";

export const metadata: Metadata = { title: "Hugmynd A · Verkefnamiðuð skoðun" };
export default function ConceptA() { return <ConceptWorkbench concept="a" />; }
