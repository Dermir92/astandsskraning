"use client";

import { useId, useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { useDemo } from "./demo-provider";
import { EvidenceGallery } from "./evidence-gallery";
import styles from "./evidence.module.css";

export function PhotoPreview({ photoKey, title = "Yfirlitsmyndir rýmis", detail = false, context, item = false }: {
  photoKey: string;
  title?: string;
  detail?: boolean;
  context: string;
  item?: boolean;
}) {
  const { state, store, mode } = useDemo();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const inputId = useId();
  const photos = state.photos[photoKey] ?? [];
  const locked = mode === "cloud" || state.status === "loading" || state.status === "read-error";
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || locked) return;
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
          if (store.addPhoto(photoKey, { id: crypto.randomUUID(), name: file.name, url })) accepted++;
          else errors.push(`${file.name}: myndasvæðið er óaðgengilegt eða átta mynda hámarki náð.`);
        } catch {
          if (url) URL.revokeObjectURL(url);
          errors.push(`${file.name}: ekki tókst að lesa myndina.`);
        }
      }
    } finally {
      setError(previous => [previous, ...new Set(errors)].filter(Boolean).join(" "));
      setAnnouncement(`${accepted} myndum bætt við tímabundna forskoðun.`);
      setPending(count => count - 1);
    }
  };
  if (mode === "cloud") return <section className={`photo-preview ${styles.capture}`} aria-label={title}><p><strong>Myndir eru óvirkar í C1.</strong> Þessi prófun vistar aðeins texta og svör. Engin myndageymsla eða tímabundin myndaforskoðun er virk hér.</p></section>;
  return <section className={`photo-preview ${styles.capture} ${detail ? "photo-preview-detail" : ""}`} aria-label={title} aria-busy={pending > 0}>
    <div className="photo-heading">
      <span className="photo-title" ref={titleRef} tabIndex={-1}><Camera size={18} aria-hidden="true" />{title}</span>
      <span className="preview-only-label">Aðeins forskoðun</span>
    </div>
    <p>{context}</p>
    <p>{detail ? "Taktu nærmynd og mynd sem sýnir staðsetningu skemmdar í rýminu."
      : item ? "Myndir tengjast atriðinu. Þær breyta ekki svörum eða staðfesta tiltekið ástand."
      : "Taktu yfirlitsmynd úr dyrum og aðra frá gagnstæðu horni. Hafðu góða lýsingu."}</p>
    <EvidenceGallery photos={photos} context={context}
      onRemove={locked ? undefined : id => { store.removePhoto(photoKey, id); setAnnouncement("Mynd fjarlægð úr tímabundinni forskoðun."); }}
      onEmpty={() => {
        const target = inputRef.current?.disabled ? titleRef.current : inputRef.current;
        target?.focus({ preventScroll: true });
      }} />
    <div className="photo-actions">
      <label className={`button button-secondary photo-upload ${pending || photos.length >= 8 || locked ? "upload-disabled" : ""}`} htmlFor={inputId}>
        <ImagePlus size={17} aria-hidden="true" />{pending ? "Les mynd…" : "Velja myndir"}
        <input className="file-input" id={inputId} ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
          aria-label={`${title}: velja myndir`} disabled={pending > 0 || photos.length >= 8 || locked}
          onChange={event => { void addPhotos(event.target.files); event.target.value = ""; }} />
      </label>
      <span>{photos.length}/8 myndir · JPG, PNG, WebP · Hámark 10 MB</span>
    </div>
    <p className="photo-storage-note">Myndir fara ekki á þjón og hverfa við endurhleðslu eða lokun. Þær eru ekki vistaðar varanlega. Texti og svör vistast sér í vafranum.</p>
    <p className="field-hint">HEIC er ekki stutt. Á iPhone fer aðgangur að myndavél og myndasafni eftir vafra og stillingum símans; veldu JPG, PNG eða WebP.</p>
    <p className="field-hint" role="status">{announcement}</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
  </section>;
}
