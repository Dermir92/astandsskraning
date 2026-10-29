"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Observation } from "@/lib/model";
import { hasRetainedDefect } from "@/lib/inspection-evidence";
import type { PreviewPhoto } from "./demo-provider";
import { ContextDialog } from "./context-dialog";
import styles from "./evidence.module.css";

export function RetainedDefectDetails({ observation }: { observation?: Observation }) {
  if (!hasRetainedDefect(observation)) return null;
  return <details className={styles.retained}>
    <summary>Varðveitt frávikslýsing</summary>
    <p>Þessi texti er varðveittur í drögunum. Núverandi svör kalla ekki á frávikslýsingu; textinn er ekki sýndur sem núverandi frávik.</p>
    <dl>
      {observation!.damageType ? <><dt>Tegund</dt><dd>{observation!.damageType}</dd></> : null}
      {observation!.location ? <><dt>Staðsetning</dt><dd>{observation!.location}</dd></> : null}
      {observation!.description ? <><dt>Lýsing</dt><dd>{observation!.description}</dd></> : null}
    </dl>
  </details>;
}

export function EvidenceGallery({ photos, context, onRemove, onEmpty, featured = false }: {
  photos: PreviewPhoto[];
  context: string;
  onRemove?: (id: string) => void;
  onEmpty?: () => void;
  featured?: boolean;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const removeTrigger = useRef<HTMLButtonElement | null>(null);
  const preview = photos.find(photo => photo.id === previewId);
  const removal = photos.find(photo => photo.id === removeId);
  useEffect(() => {
    if (removeId) cancelRef.current?.focus({ preventScroll: true });
  }, [removeId]);
  if (!photos.length) return null;
  const thumbnail = (photo: PreviewPhoto) => {
    const position = photos.indexOf(photo) + 1;
    return <li key={photo.id}>
      <button type="button" className={styles.thumbnail} data-photo-id={photo.id}
        aria-label={`Forskoða ${context}, mynd ${position} af ${photos.length}: ${photo.name}`}
        onClick={() => setPreviewId(photo.id)}>
        {/* Blob URLs are local session previews; they must not go through an image service. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={`Staðbundin forskoðun: ${photo.name}`} width={96} height={72} />
        <span>{featured && position === 1 ? "Stækka mynd" : `${position}. ${photo.name}`}</span>
      </button>
      {onRemove ? <button type="button" className={styles.remove}
        aria-label={`Fjarlægja mynd ${position}: ${photo.name} · ${context}`}
        onClick={event => { removeTrigger.current = event.currentTarget; setRemoveId(photo.id); }}>
        <X size={16} aria-hidden="true" /><span>Fjarlægja</span>
      </button> : null}
    </li>;
  };
  return <div className={`${styles.gallery} ${featured ? styles.featured : ""}`} ref={galleryRef} role="group" aria-label={`Myndir: ${context}`}>
    <p className={styles.caption}>{photos.length} {photos.length === 1 ? "mynd" : "myndir"} · Aðeins tímabundin forskoðun</p>
    <ul className={styles.thumbnails}>{photos.slice(0, featured ? 1 : 2).map(thumbnail)}</ul>
    {photos.length > (featured ? 1 : 2) ? <details className={styles.more}>
      <summary>Sjá allar myndir ({photos.length})</summary>
      <ul className={styles.thumbnails}>{photos.slice(featured ? 1 : 2).map(thumbnail)}</ul>
    </details> : null}
    {removal && onRemove ? <div className={styles.confirmation} role="group" aria-label="Staðfesta fjarlægingu myndar">
      <p>Fjarlægja mynd {photos.indexOf(removal) + 1}: <strong>{removal.name}</strong> úr {context}? Ekki er hægt að afturkalla fjarlæginguna.</p>
      <div>
        <button type="button" className="button button-secondary" ref={cancelRef}
          onClick={() => { setRemoveId(null); removeTrigger.current?.focus({ preventScroll: true }); }}>Hætta við</button>
        <button type="button" className="button button-secondary" onClick={() => {
          const controls = [...(galleryRef.current?.querySelectorAll<HTMLButtonElement>("button[data-photo-id]") ?? [])];
          const index = controls.findIndex(control => control.dataset.photoId === removal.id);
          const neighbour = [...controls.slice(index + 1), ...controls.slice(0, index).reverse()]
            .find(control => control.getClientRects().length);
          if (neighbour) neighbour.focus({ preventScroll: true }); else onEmpty?.();
          setRemoveId(null);
          onRemove(removal.id);
        }}>Fjarlægja mynd</button>
      </div>
    </div> : null}
    {preview ? <ContextDialog title={context} closeLabel="Loka myndaforskoðun" onClose={() => setPreviewId(null)}>
      <div className={styles.preview}>
        <p>Mynd {photos.indexOf(preview) + 1} af {photos.length} · Aðeins tímabundin forskoðun</p>
        <p>{preview.name}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview.url} alt={`Forskoðun: ${context} · ${preview.name}`} />
        <p>Myndir hverfa við endurhleðslu og eru ekki vistaðar varanlega.</p>
      </div>
    </ContextDialog> : null}
  </div>;
}
