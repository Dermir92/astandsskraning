"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { Report } from "@/lib/model";
import { fireFieldId, resolveFireCorrection } from "@/lib/fire-navigation";

export function useFireCorrection(report: Report, ready: boolean) {
  const query = useSearchParams().toString();
  const correction = resolveFireCorrection(report, new URLSearchParams(query));
  const handled = useRef<string | null>(null);
  const { active, focusId, group } = correction;
  useEffect(() => {
    if (!active) {
      handled.current = null;
      return;
    }
    if (!ready || handled.current === query) return;
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(focusId) ?? (group ? document.getElementById(fireFieldId(group, "examination")) : null) ?? document.getElementById("fire-safety");
      if (!element) return;
      handled.current = query;
      if (element instanceof HTMLDetailsElement) element.open = true;
      for (let parent = element.parentElement; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
      const target = element.matches("fieldset")
        ? element.querySelector<HTMLInputElement>('input[type="radio"]:checked:not(:disabled)')
          ?? element.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)')
          ?? element
        : element;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, ready, query, focusId, group]);
  return correction;
}
