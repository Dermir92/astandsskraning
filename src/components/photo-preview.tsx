"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { useDemo } from "./demo-provider";
import { DEMO_PHOTO_NOTICE } from "@/lib/demo-photos";
import { EvidenceGallery } from "./evidence-gallery";
import styles from "./evidence.module.css";
import stofa from "./stofa-inspection.module.css";

export function PhotoPreview({ photoKey, targetId, title = "Yfirlitsmyndir rýmis", detail = false, context, item = false, featured = false, compact = false }: {
  photoKey: string;
  targetId?: string;
  title?: string;
  detail?: boolean;
  context: string;
  item?: boolean;
  featured?: boolean;
  compact?: boolean;
}) {
  const { state, store, mode, demoReadOnly } = useDemo();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const activeUpload = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const controlsRef = useRef<HTMLDetailsElement>(null);
  const restoreUploadFocus = useRef(false);
  const previousFeatured = useRef(featured);
  const pendingFeaturedDisclosure = useRef(false);
  // Use the initial disclosure choice: adding a photo must not close the
  // focused file input or move the next keyboard action.
  const [initialControlsOpen] = useState(() => !featured || !state.photos[photoKey]?.length);
  const inputId = useId();
  const photos = state.photos[photoKey] ?? [];
  useEffect(() => {
    if (pending || !restoreUploadFocus.current) return;
    restoreUploadFocus.current = false;
    // Disabling the picker during decoding can leave focus on the body.
    // Respect any later explicit focus move, including typing in another field.
    if (document.activeElement !== document.body && document.activeElement !== document.documentElement) return;
    const target = activeUpload.current?.disabled ? compact ? titleRef.current : controlsRef.current?.querySelector("summary") : activeUpload.current ?? inputRef.current;
    target?.focus({ preventScroll: true });
  }, [pending, photos.length, compact]);
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (previousFeatured.current !== featured) {
      previousFeatured.current = featured;
      pendingFeaturedDisclosure.current = featured;
      if (!featured) {
        controls.open = true;
        return;
      }
    }
    // A newly completed defect uses the same default as reopening it. Defer
    // during decoding, and preserve an active control or explicit user choice.
    if (!pendingFeaturedDisclosure.current || pending) return;
    pendingFeaturedDisclosure.current = false;
    if (photos.length && !controls.contains(document.activeElement)) controls.open = false;
  }, [featured, pending, photos.length]);
  const locked = demoReadOnly || mode === "cloud" || state.status === "loading" || state.status === "read-error" || state.local?.dirty || state.local?.recovery || state.photoStorage?.status !== "ready";
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || locked) return;
    const epoch = store.mutationEpoch;
    activeUpload.current = document.activeElement === cameraRef.current ? cameraRef.current : inputRef.current;
    restoreUploadFocus.current = (featured || compact) && document.activeElement === activeUpload.current;
    const selected = Array.from(files);
    setError("");
    setAnnouncement("");
    setPending(count => count + 1);
    const errors: string[] = [];
    let accepted = 0;
    try {
      for (const file of selected) {
        if ((store.getSnapshot().photos[photoKey]?.length ?? 0) >= 8) {
          errors.push("Hámark er átta myndir á hverju myndasvæði.");
          break;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          errors.push(`${file.name}: veldu JPG, PNG eða WebP. HEIC er ekki stutt.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: hámarksstærð er 10 MB.`);
          continue;
        }
        let url: string | undefined;
        try {
          const bitmap = await createImageBitmap(file);
          bitmap.close();
          url = URL.createObjectURL(file);
          // The store checks the live target and limit after asynchronous decoding.
          // It owns URL cleanup for rejected additions as well as accepted photos.
          if (await store.addPhoto(photoKey, { id: crypto.randomUUID(), name: file.name, url }, file, epoch)) accepted++;
          else errors.push(`${file.name}: myndin var ekki vistuð. Athugaðu myndageymslu, breytingarétt og átta mynda hámark. Varðveittu frumritið og veldu myndina aftur.`);
        } catch {
          if (url) URL.revokeObjectURL(url);
          errors.push(`${file.name}: ekki tókst að lesa myndina.`);
        }
      }
    } finally {
      setError(previous => [previous, ...new Set(errors)].filter(Boolean).join(" "));
      setAnnouncement(`${accepted} ${accepted === 1 ? "mynd vistuð" : "myndir vistaðar"} í þessum vafra.`);
      setPending(count => count - 1);
    }
  };
  const removePhoto = async (id: string) => {
    const removed = await store.removePhoto(photoKey, id);
    if (removed) setAnnouncement("Mynd fjarlægð úr þessum vafra.");
    else requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".photo-storage-warning button")?.focus({ preventScroll: true }));
    return removed;
  };
  if (mode === "cloud") return <section id={targetId} tabIndex={-1} className={`photo-preview ${styles.capture}`} aria-label={title}><p><strong>Myndir eru óvirkar í C1.</strong> Þessi prófun vistar aðeins texta og svör. Engin myndageymsla eða tímabundin myndaforskoðun er virk hér.</p></section>;
  if (compact) return <section id={targetId} tabIndex={-1} className={stofa.photos} aria-label={title} aria-busy={pending > 0}>
    <div className={stofa.photoHeading}><h3><span ref={titleRef} tabIndex={-1}>{title}</span></h3><span>{photos.length}/8 · Í þessum vafra</span></div>
    <p className={stofa.photoLimit}>{DEMO_PHOTO_NOTICE}</p>
    <div className={stofa.photoStrip}>
      <EvidenceGallery photos={photos} context={context}
        onRemove={locked ? undefined : removePhoto}
        onEmpty={() => inputRef.current?.focus({ preventScroll: true })} />
      {!photos.length ? <span className={stofa.emptyPhoto}><Camera size={20} aria-hidden="true" /><span>Engar myndir</span></span> : null}
      <div className={stofa.photoButtons}>
        <label className="button button-secondary photo-upload" htmlFor={`${inputId}-camera`}>
          <Camera size={16} aria-hidden="true" />Mynd
          <input className="file-input" id={`${inputId}-camera`} ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
            aria-label={`${title}: taka mynd`} disabled={pending > 0 || photos.length >= 8 || locked}
            onChange={event => { void addPhotos(event.target.files); event.target.value = ""; }} />
        </label>
        <label className="button button-secondary photo-upload" htmlFor={inputId}>
          <ImagePlus size={16} aria-hidden="true" />Úr safni
          <input className="file-input" id={inputId} ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
            aria-label={`${title}: velja myndir`} disabled={pending > 0 || photos.length >= 8 || locked}
            onChange={event => { void addPhotos(event.target.files); event.target.value = ""; }} />
        </label>
      </div>
    </div>
    <details className={stofa.photoHelp}><summary>Um myndir</summary><p>{context}. {detail ? "Taktu nærmynd og mynd sem sýnir staðsetningu fráviks." : item ? "Myndir tengjast aðeins þessu atriði." : "Taktu yfirlitsmynd úr dyrum og frá gagnstæðu horni."} JPG, PNG eða WebP, að hámarki 10 MB. HEIC er ekki stutt. Aðgangur að myndavél fer eftir tæki og vafra.</p></details>
    <p role="status">{pending ? "Les mynd…" : announcement}</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
  </section>;
  return <section id={targetId} tabIndex={-1} className={`photo-preview ${styles.capture} ${featured ? styles.featuredCapture : ""} ${detail ? "photo-preview-detail" : ""}`} aria-label={title} aria-busy={pending > 0}>
    <div className="photo-heading">
      <span className="photo-title" ref={titleRef} tabIndex={-1}><Camera size={18} aria-hidden="true" />{title}</span>
      <span className="preview-only-label">Í þessum vafra</span>
    </div>
    {!featured ? <><p>{context}</p><p>{detail ? "Taktu nærmynd og mynd sem sýnir staðsetningu skemmdar í rýminu."
      : item ? "Myndir tengjast atriðinu. Þær breyta ekki svörum eða staðfesta tiltekið ástand."
      : "Taktu yfirlitsmynd úr dyrum og aðra frá gagnstæðu horni. Hafðu góða lýsingu."}</p></> : null}
    <EvidenceGallery photos={photos} context={context} featured={featured}
      onRemove={locked ? undefined : removePhoto}
      onEmpty={() => {
        pendingFeaturedDisclosure.current = false;
        if (controlsRef.current) controlsRef.current.open = true;
        const target = inputRef.current?.disabled
          ? featured ? controlsRef.current?.querySelector("summary") : titleRef.current
          : inputRef.current;
        target?.focus({ preventScroll: true });
      }} />
    <details ref={controlsRef} className={styles.captureControls} open={!featured || initialControlsOpen || undefined}>
    <summary hidden={!featured} onClick={() => { pendingFeaturedDisclosure.current = false; }}>Myndaaðgerðir</summary>
    {featured ? <><p>{context}</p><p>{detail ? "Taktu nærmynd og mynd sem sýnir staðsetningu skemmdar í rýminu."
      : item ? "Myndir tengjast atriðinu. Þær breyta ekki svörum eða staðfesta tiltekið ástand."
      : "Taktu yfirlitsmynd úr dyrum og aðra frá gagnstæðu horni. Hafðu góða lýsingu."}</p></> : null}
    <div className="photo-actions">
      <label className={`button button-secondary photo-upload ${pending || photos.length >= 8 || locked ? "upload-disabled" : ""}`} htmlFor={inputId}>
        <ImagePlus size={17} aria-hidden="true" />{pending ? "Les mynd…" : "Velja myndir"}
        <input className="file-input" id={inputId} ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
          aria-label={`${title}: velja myndir`} disabled={pending > 0 || photos.length >= 8 || locked}
          onChange={event => { void addPhotos(event.target.files); event.target.value = ""; }} />
      </label>
      <span>{photos.length}/8 myndir · JPG, PNG, WebP · Hámark 10 MB</span>
    </div>
    <p className="photo-storage-note">{DEMO_PHOTO_NOTICE}</p>
    <p className="field-hint">HEIC er ekki stutt. Á iPhone fer aðgangur að myndavél og myndasafni eftir vafra og stillingum símans; veldu JPG, PNG eða WebP.</p>
    </details>
    <p className="field-hint" role="status">{announcement}</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
  </section>;
}
