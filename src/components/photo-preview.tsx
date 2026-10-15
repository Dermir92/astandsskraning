"use client";

import { useId, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { useDemo } from "./demo-provider";

export function PhotoPreview({
  photoKey,
  title = "Yfirlitsmyndir rýmis",
  detail = false,
}: {
  photoKey: string;
  title?: string;
  detail?: boolean;
}) {
  const { state, store } = useDemo();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  const photos = state.photos[photoKey] ?? [];
  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setError("");
    setBusy(true);
    const errors: string[] = [];
    let count = photos.length;
    for (const file of Array.from(files)) {
      if (count >= 8) {
        errors.push("Hámark er átta myndir á hverju myndasvæði.");
        break;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        errors.push(`${file.name}: veldu JPG, PNG eða WebP.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: mynd þarf að vera minni en 10 MB.`);
        continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        store.addPhoto(photoKey, {
          id: crypto.randomUUID(),
          name: file.name,
          url,
        });
        count++;
      } catch {
        URL.revokeObjectURL(url);
        errors.push(`${file.name}: ekki tókst að lesa myndina.`);
      }
    }
    setError(errors.join(" "));
    setBusy(false);
  };
  return (
    <section
      className={`photo-preview ${detail ? "photo-preview-detail" : ""}`}
      aria-label={title}
    >
      <div className="photo-heading">
        <span className="photo-title">
          <Camera size={18} aria-hidden="true" />
          {title}
        </span>
        <span className="preview-only-label">Aðeins forskoðun</span>
      </div>
      <p>
        {detail
          ? "Taktu nærmynd og mynd sem sýnir staðsetningu skemmdar í rýminu."
          : "Taktu yfirlitsmynd úr dyrum og aðra frá gagnstæðu horni. Hafðu góða lýsingu."}
      </p>
      {photos.length ? (
        <ul className="photo-list">
          {photos.map((photo) => (
            <li key={photo.id}>
              <a
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Opna forskoðun: ${photo.name}`}
              >
                {/* Blob URLs are session-only local previews, not remotely optimized media. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Staðbundin forskoðun: ${photo.name}`}
                  width={120}
                  height={90}
                />
              </a>
              <span>{photo.name}</span>
              <button
                className="photo-remove icon-button"
                aria-label={`Fjarlægja mynd: ${photo.name}`}
                onClick={() => store.removePhoto(photoKey, photo.id)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="photo-actions">
        <label
          className={`button button-secondary photo-upload ${busy || photos.length >= 8 ? "upload-disabled" : ""}`}
          htmlFor={inputId}
        >
          <ImagePlus size={17} aria-hidden="true" />
          {busy ? "Les mynd…" : "Velja myndir"}
          <input
            className="file-input"
            id={inputId}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            aria-label={`${title}: velja myndir`}
            disabled={busy || photos.length >= 8}
            onChange={(e) => {
              void addPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <span>{photos.length}/8 myndir · JPG, PNG, WebP</span>
      </div>
      <p className="photo-storage-note">
        Myndir fara ekki á þjón og hverfa við endurhleðslu. Texti og svör
        vistast sér í vafranum.
      </p>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
