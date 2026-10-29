"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export type InspectionSection = "inspection-room" | "fire-safety" | "meter-readings";
const sections: InspectionSection[] = ["inspection-room", "fire-safety", "meter-readings"];

export function useInspectionSections(root: RefObject<HTMLDivElement | null>, ready: boolean) {
  const [active, setActive] = useState<InspectionSection>("inspection-room");
  const roomFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const page = root.current;
    if (!ready || !page) return;
    const bar = page.querySelector<HTMLElement>("[data-inspection-sections]");
    if (!bar) return;
    let frame = 0;
    const offset = () => {
      const height = Math.ceil(bar.getBoundingClientRect().height);
      const available = window.visualViewport?.height ?? innerHeight;
      const title = bar.querySelector("strong");
      const enlarged = title && parseFloat(getComputedStyle(title).fontSize) > 18;
      // Enlarged text or a short keyboard viewport needs the work area more
      // than a pinned toolbar. Keep the same links mounted in document flow.
      bar.dataset.flow = enlarged || available <= 500 || height > available / 4 ? "true" : "false";
      const pinned = getComputedStyle(bar).position === "sticky";
      page.style.setProperty("--inspection-section-offset", `${pinned ? height + 16 : 16}px`);
    };
    const observer = new ResizeObserver(offset);
    observer.observe(bar);
    offset();
    const update = () => {
      const bottom = getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect().bottom : 0;
      const passed = sections.filter(id => (page.querySelector<HTMLElement>(`#${id}`)?.getBoundingClientRect().top ?? Infinity) <= bottom + 32);
      setActive(passed.at(-1) ?? "inspection-room");
    };
    const focus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("#inspection-room")) roomFocus.current = target;
      // Only a focus change can request this correction. Typing/answer updates
      // never move focus or scroll, and no component is mounted/unmounted here.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!target.isConnected || document.activeElement !== target || bar.contains(target)) return;
        const bottom = getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect().bottom : 0;
        const box = target.getBoundingClientRect();
        if (box.top < bottom + 8) window.scrollBy({ top: box.top - bottom - 16, behavior: "instant" });
      });
    };
    const resize = () => { offset(); update(); };
    page.addEventListener("focusin", focus);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    update();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      page.removeEventListener("focusin", focus);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      page.style.removeProperty("--inspection-section-offset");
    };
  }, [root, ready]);

  function reveal(target: HTMLElement | null) {
    if (!target) return;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start", behavior: "instant" });
  }
  function returnToRoom() {
    setActive("inspection-room");
    const previous = roomFocus.current;
    const visible = previous?.isConnected && previous.getClientRects().length && !previous.closest("[hidden]") && !previous.matches(":disabled");
    const fallback = root.current?.querySelector<HTMLElement>(".checklist-item-open .checklist-toggle")
      ?? root.current?.querySelector<HTMLElement>(".room-heading h2")
      ?? root.current?.querySelector<HTMLElement>("#inspection-room") ?? null;
    reveal(visible ? previous : fallback);
  }
  return {
    active,
    open: (id: InspectionSection) => {
      if (id === "inspection-room") { returnToRoom(); return; }
      const page = root.current;
      const target = page?.querySelector<HTMLElement>(`#${id}`) ?? null;
      if (target instanceof HTMLDetailsElement) target.open = true;
      setActive(id);
      reveal(target instanceof HTMLDetailsElement ? target.querySelector<HTMLElement>(":scope > summary") : target);
    },
    returnToRoom,
  };
}
