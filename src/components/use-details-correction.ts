"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DETAIL_FIELDS, type DetailField } from "@/lib/model";
import { RENTAL_FIELD_IDS, type RentalFieldId } from "@/lib/rental-information";

export type DetailCorrectionTarget = DetailField | RentalFieldId;
const correctionTargets: readonly string[] = [...DETAIL_FIELDS, ...RENTAL_FIELD_IDS];
export function detailsCorrectionHref(id: string, field: DetailCorrectionTarget = "inspectionContext", section?: "rental") {
  const rental = section === "rental" || (RENTAL_FIELD_IDS as readonly string[]).includes(field);
  return `/skyrslur/${encodeURIComponent(id)}/upplysingar?fra=yfirferd&reitur=${field}${rental ? "&hluti=leiga" : ""}`;
}

export function useDetailsCorrection(ready: boolean) {
  const params = useSearchParams();
  const field = params.getAll("reitur").length === 1 ? params.get("reitur") : null;
  const fromReview = params.getAll("fra").length === 1 && params.get("fra") === "yfirferd";
  const target = fromReview && field && correctionTargets.includes(field) ? field : null;
  const rentalReturn = !!target && ((RENTAL_FIELD_IDS as readonly string[]).includes(target) || (params.getAll("hluti").length === 1 && params.get("hluti") === "leiga"));
  useEffect(() => {
    if (!ready || !target) return;
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(target);
      for (let parent = element?.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, target]);
  return { fromReview, reviewSection: rentalReturn ? "review-rental-details" : "review-core-details" };
}
