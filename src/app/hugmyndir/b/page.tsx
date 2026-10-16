import type { Metadata } from "next";
import { ConceptWorkbench } from "@/components/inspection-concepts/concept-workbench";

export const metadata: Metadata = { title: "Hugmynd B · Þéttur gátlisti" };
export default function ConceptB() { return <ConceptWorkbench concept="b" />; }
