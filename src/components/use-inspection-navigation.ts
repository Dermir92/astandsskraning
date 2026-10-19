"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InspectionPositions, inspectionHref, missingAnswers, navigationTargetId, resolveInspection, reviewHref, reviewOrigin, type InspectionPosition, type PositionEntry } from "@/lib/inspection-navigation";
import type { Report } from "@/lib/model";

const EMPTY: Record<string, PositionEntry> = {};
let browserPositions: InspectionPositions | undefined;
function positions() {
  // Never create mutable per-user state on the server.
  return browserPositions ??= new InspectionPositions(() => window.localStorage);
}
const subscribe = (listener: () => void) => positions().subscribe(listener);
const snapshot = () => positions().getSnapshot();
const serverSnapshot = () => EMPTY;

export function useInspectionPositions(reports: Report[], enabled: boolean) {
  const entries = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    if (enabled) reports.forEach(report => positions().load(report.id));
  }, [reports, enabled]);
  return entries;
}

// A one-use, same-document proof of the preceding review entry. Reloaded or
// externally opened links use a fixed review URL instead of guessing at history.
let reviewTrip: { inspection: string; review: string } | null = null;
let initialInspectionResolved = false;
function reveal(target: HTMLElement | null, focus: boolean) {
  if (!target) return;
  if (focus) target.focus({ preventScroll: true });
  const box = target.getBoundingClientRect();
  if (box.top < 110 || box.bottom > window.innerHeight - 48) target.scrollIntoView({ block: "nearest", behavior: "instant" });
}
function inspectionFocus(root: HTMLElement | null, key?: string) {
  const group = root?.querySelector<HTMLElement>(key ? `[data-question="${key}"]` : "[data-navigation-heading]");
  if (root?.dataset.kind === "space_heating" && group && key) {
    for (let parent = group.parentElement; parent && parent !== root; parent = parent.parentElement) if (parent instanceof HTMLDetailsElement) parent.open = true;
    return group.querySelector<HTMLElement>('input:checked:not(:disabled)') ?? group.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled)') ?? group;
  }
  return group ??
    (key ? root?.querySelector<HTMLElement>(".damage-fields") : null) ?? root;
}

export function useInspectionNavigation(report: Report, canRemember: boolean, fireCorrection = false) {
  const router = useRouter();
  const query = useSearchParams().toString();
  const entries = useInspectionPositions([report], canRemember && !fireCorrection);
  const entry = Object.hasOwn(entries, report.id) ? entries[report.id] : undefined;
  const ready = fireCorrection || !canRemember || !!entry;
  const params = new URLSearchParams(query);
  const destination = resolveInspection(report, params, canRemember ? entry?.position : null);
  const origin = reviewOrigin(params);
  const returnHref = reviewHref(report.id, origin);
  const [editor, setEditor] = useState<{ query: string; itemId: string | null } | null>(null);
  const [notice, setNotice] = useState("");
  const [focusRequest, setFocusRequest] = useState<{ query: string; position: InspectionPosition; token: number } | null>(null);
  const requestSequence = useRef(0);
  const focusedRequest = useRef(0);
  const localQuery = useRef<string | null>(null);
  const lastDestination = useRef("");
  const directReview = useRef<string | null>(null);
  const mounted = useRef(false);
  const itemId = editor?.query === query ? editor.itemId : destination.item?.id ?? null;
  const canonical = inspectionHref(report.id, destination.position, origin);
  if (!fireCorrection && ready && destination.invalid && !notice) setNotice("Staðsetningin fannst ekki lengur. Tiltækt rými er opið.");

  useEffect(() => {
    if (fireCorrection || !ready || !destination.position) return;
    const signature = `${query}|${destination.position.roomId}|${destination.position.itemId}`;
    if (lastDestination.current === signature) return;
    const first = !mounted.current;
    mounted.current = true;
    if (first && reviewTrip?.inspection === `${window.location.pathname}${window.location.search}`) {
      directReview.current = reviewTrip.review;
      reviewTrip = null;
    }
    const nextQuery = canonical.split("?")[1] ?? "";
    lastDestination.current = `${nextQuery}|${destination.position.roomId}|${destination.position.itemId}`;
    if (canRemember) positions().remember(report, destination.position);
    const local = localQuery.current === query;
    localQuery.current = null;
    const pageNavigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // Navigation Timing describes the original document, including later client
    // visits. Only preserve reload focus on that original entry, not a new edit trip.
    const wasReload = first && !initialInspectionResolved && !directReview.current && pageNavigation?.type === "reload" && pageNavigation.name === window.location.href;
    if (first) initialInspectionResolved = true;
    // Next copies its internal fields itself; passing __NA would bypass URL-hook updates.
    if (`${window.location.pathname}${window.location.search}` !== canonical) window.history.replaceState(null, "", canonical);
    if (local) return;
    requestAnimationFrame(() => {
      if (`${window.location.pathname}${window.location.search}` !== canonical) return;
      const root = document.getElementById(navigationTargetId("inspection", destination.position!.roomId, destination.position!.itemId));
      const missing = destination.item ? missingAnswers(destination.item, destination.room?.observations[destination.item.id])[0] : null;
      const target = inspectionFocus(root, missing?.key);
      reveal(target ?? null, !wasReload);
    });
  }, [ready, query, canonical, destination, canRemember, report, fireCorrection]);

  useEffect(() => {
    if (fireCorrection || !focusRequest || focusRequest.query !== query || focusedRequest.current === focusRequest.token) return;
    const { position } = focusRequest;
    const root = document.getElementById(navigationTargetId("inspection", position.roomId, position.itemId));
    if (!root) return;
    focusedRequest.current = focusRequest.token;
    const room = report.rooms.find(room => room.id === position.roomId);
    const item = room?.items.find(item => item.id === position.itemId);
    const missing = item ? missingAnswers(item, room?.observations[item.id])[0] : null;
    reveal(inspectionFocus(root, missing?.key), true);
  }, [focusRequest, query, report, fireCorrection]);

  function activate(position: InspectionPosition, open: boolean, focus = false) {
    setNotice("");
    const href = inspectionHref(report.id, position, origin);
    const nextQuery = href.split("?")[1] ?? "";
    localQuery.current = nextQuery;
    setEditor({ query: nextQuery, itemId: open ? position.itemId : null });
    if (canRemember) positions().remember(report, position);
    if (`${window.location.pathname}${window.location.search}` !== href) window.history.replaceState(null, "", href);
    if (focus) setFocusRequest({ query: nextQuery, position, token: ++requestSequence.current });
  }
  return {
    ...destination, ready, itemId, notice,
    unavailable: canRemember && entry?.unavailable,
    roomHref: (roomId: string) => inspectionHref(report.id, { roomId, itemId: null }, origin),
    itemHref: (position: InspectionPosition) => inspectionHref(report.id, position, origin),
    activate,
    // A quick answer may already have replaced the URL during this same event.
    close: () => { setEditor({ query: new URLSearchParams(window.location.search).toString(), itemId: null }); },
    returnHref,
    fromReview: !!origin,
    returnToReview: (event: { preventDefault: () => void }) => {
      if (directReview.current === returnHref) { event.preventDefault(); router.back(); }
    },
  };
}

export function useReviewNavigation(report?: Report) {
  const query = useSearchParams().toString();
  useEffect(() => {
    if (!report) return;
    const params = new URLSearchParams(query);
    if (!params.has("rymi") && !params.has("atridi")) return;
    const resolved = resolveInspection(report, params);
    const requestedRoom = params.get("rymi");
    const room = resolved.room?.id === requestedRoom ? resolved.room : undefined;
    const target = room ? document.getElementById(navigationTargetId("review", room.id, resolved.item?.id ?? null)) : document.getElementById("review-rooms-title");
    const details = target?.closest("details");
    if (details) details.open = true;
    // Let the browser finish Back/Forward viewport restoration before revealing
    // the source link. This is one visibility correction, not pixel restoration.
    const frame = requestAnimationFrame(() => {
      if (target?.isConnected) reveal(target, true);
    });
    return () => cancelAnimationFrame(frame);
  }, [query, report]);
  return {
    itemHref: (position: InspectionPosition) => inspectionHref(report!.id, position, position),
    leave: (position: InspectionPosition) => {
      const review = reviewHref(report!.id, position);
      window.history.replaceState(null, "", review);
      reviewTrip = { inspection: inspectionHref(report!.id, position, position), review };
    },
  };
}
