"use client";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { resolveMeterCorrection } from "@/lib/meter-navigation";

export function useMeterCorrection(id: string, ready: boolean) {
  const query = useSearchParams().toString();
  const correction = resolveMeterCorrection(id, new URLSearchParams(query));
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!correction.active) { handled.current = null; return; }
    if (!ready || handled.current === query) return;
    const frame = requestAnimationFrame(() => {
      const group = correction.utility ? document.querySelector(`[data-meter-utility="${correction.utility}"]`) : null;
      const factTarget = correction.valid && correction.field !== "applicability" && correction.field !== "optionalCapture";
      const participatingTarget = group?.getAttribute("data-meter-participating") === "true";
      const purpose = factTarget && participatingTarget ? document.getElementById("meter-purpose-guard") : null;
      const guard = factTarget ? group?.querySelector<HTMLElement>("[data-meter-confirm]") : null;
      const element = purpose ?? guard ?? document.getElementById(correction.focusId) ?? document.getElementById(`${correction.focusId}-retained`) ?? document.getElementById("meter-readings");
      if (!element) return;
      handled.current = query;
      if (element instanceof HTMLDetailsElement) element.open = true;
      for (let p = element.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
      const target = element.matches("fieldset") ? element.querySelector<HTMLElement>('input:checked:not(:disabled)') ?? element.querySelector<HTMLElement>('input:not(:disabled)') ?? element : element;
      target.focus({ preventScroll: true }); target.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, query, correction.active, correction.valid, correction.focusId, correction.utility, correction.field]);
  return correction;
}
