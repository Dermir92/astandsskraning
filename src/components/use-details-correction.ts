"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DETAIL_FIELDS, type DetailField } from "@/lib/model";

export function detailsCorrectionHref(id: string, field: DetailField = "inspectionContext") {
  return `/skyrslur/${encodeURIComponent(id)}/upplysingar?fra=yfirferd&reitur=${field}`;
}

export function useDetailsCorrection(ready: boolean) {
  const params = useSearchParams();
  const field = params.getAll("reitur").length === 1 ? params.get("reitur") : null;
  const fromReview = params.getAll("fra").length === 1 && params.get("fra") === "yfirferd";
  const target = fromReview && DETAIL_FIELDS.includes(field as DetailField) ? field : null;
  useEffect(() => {
    if (!ready || !target) return;
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(target);
      const disclosure = element?.closest("details");
      if (disclosure) disclosure.open = true;
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, target]);
  return fromReview;
}
