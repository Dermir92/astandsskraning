"use client";

import Link from "next/link";
import { useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, Camera } from "lucide-react";
import { ContextDialog } from "./context-dialog";
import { is } from "@/lib/locale/is";
import type { DeepReadonly, PreviewField, PreviewIssue, PreviewPhoto, PreviewRecord, ReportPreview } from "@/lib/report-preview";
import styles from "./report-preview.module.css";

const t = is.preview;
type Availability = "available" | "unavailable";
type Photo = DeepReadonly<PreviewPhoto>;
type PhotoStates = Readonly<Record<string, { url: string; status: Availability }>>;
type UpdatePhoto = (photo: Photo, status: Availability) => void;

function followAnchor(event: MouseEvent<HTMLAnchorElement>) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const href = event.currentTarget.getAttribute("href");
  if (!href?.startsWith("#preview-")) return;
  const target = document.getElementById(decodeURIComponent(href.slice(1)));
  if (!target) return;
  for (let p = target.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
  requestAnimationFrame(() => { target.focus({ preventScroll: true }); target.scrollIntoView({ block: "start", behavior: "instant" }); });
}
function Jump({ anchor, children, className }: { anchor: string; children: React.ReactNode; className?: string }) {
  return <a className={className} href={`#${encodeURIComponent(anchor)}`} onClick={followAnchor}>{children}</a>;
}
function Fields({ fields, assessments = false }: { fields: readonly DeepReadonly<PreviewField>[]; assessments?: boolean }) {
  if (!fields.length) return null;
  return <dl className={assessments ? styles.assessments : styles.fields}>{fields.map(field => <div key={field.key} className={/description|scope|note|included|excluded|premises|Names/i.test(field.key) ? styles.proseField : undefined}>
    <dt>{field.label}</dt><dd data-value={field.raw} className={field.state !== "supplied" ? styles.unknown : undefined}>{field.value}</dd>
    {field.qualification ? <dd className={styles.qualification}>{field.qualification}</dd> : null}
  </div>)}</dl>;
}
function Retained({ fields, context }: { fields: readonly DeepReadonly<PreviewField>[]; context?: string }) {
  if (!fields.length) return null;
  return <details className={styles.retained}><summary>{t.retained}</summary>{context ? <p><strong>{context}</strong></p> : null}<p className={styles.small}>{t.retainedHelp}</p><Fields fields={fields} /></details>;
}
function PhotoFigure({ photo, status, update, open }: { photo: Photo; status?: Availability; update: UpdatePhoto; open: (photo: Photo) => void }) {
  return <figure id={photo.anchor} tabIndex={-1} className={styles.figure} data-preview-photo={photo.ref}>
    <div className={styles.imageFrame}>
      {/* Browser-local blob URLs must not be sent to an image service. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.alt} loading="lazy" width={960} height={640} hidden={status === "unavailable"} onLoad={() => update(photo, "available")} onError={() => update(photo, "unavailable")} />
      {status === "unavailable" ? <p className={styles.imageError}>{t.imageUnavailable}</p> : null}
    </div>
    <figcaption><strong>{photo.ref} · {photo.context}</strong><span className={styles.filename}>{photo.name}</span><span>{t.imageLabel} · {status === "available" ? "birt í þessari setu" : status === "unavailable" ? "ekki tiltæk" : "birting óstaðfest"}</span></figcaption>
    <button type="button" className={styles.imageButton} onClick={() => open(photo)}>Skoða mynd {photo.ref}<span className="sr-only"> · {photo.context}</span><ArrowUpRight size={15} aria-hidden="true" /></button>
  </figure>;
}
function RecordView({ record, level, photoMap, states, update, open, ordinary = false, item = false }: {
  record: DeepReadonly<PreviewRecord>; level: 2 | 3 | 4 | 5; photoMap: ReadonlyMap<string, Photo>; states: PhotoStates; update: UpdatePhoto; open: (photo: Photo) => void; ordinary?: boolean; item?: boolean;
}) {
  const Heading = `h${level}` as "h2" | "h3" | "h4" | "h5";
  const images = record.photoKeys.map(key => photoMap.get(key)).filter((p): p is Photo => !!p);
  const assessments = ordinary ? record.fields.filter(f => ["condition", "functionality", "cleanliness"].includes(f.key)) : [];
  const remaining = ordinary ? record.fields.filter(f => !assessments.includes(f)) : record.fields;
  // Entirely inactive rows are kept inside the retained disclosure, including their title.
  const inactive = !record.fields.length && !record.issues.length && record.retained.length > 0;
  return <section id={record.anchor} tabIndex={-1} aria-labelledby={`${record.anchor}-title`} className={item ? styles.item : styles.record} data-preview-record={record.ref ?? record.anchor}>
    <Heading id={`${record.anchor}-title`} className={styles.recordTitle}>{record.ref ? <span className={styles.reference}>{record.ref}</span> : null}{inactive ? "Varðveittar upplýsingar" : record.title}</Heading>
    {record.status ? <p className={styles.recordStatus}>{record.status}</p> : null}
    <Fields fields={assessments} assessments />
    <div className={images.length ? styles.recordWithPhotos : undefined}>
      <div><Fields fields={remaining} />
        {record.issues.length ? <ul className={styles.recordIssues}>{record.issues.map(i => <li key={i.id} data-preview-issue={i.field}>
          <span className={styles.issueKind}>{i.categories.includes("concern") ? "Athugun til yfirferðar" : i.categories.includes("missing") ? "Ófullskráð" : i.categories.includes("data_review") ? "Þarfnast yfirferðar" : "Takmörkun"}</span>{i.label}
        </li>)}</ul> : null}
        <Retained fields={record.retained} context={inactive ? record.title : undefined} />
      </div>
      {images.length ? <div className={styles.figures}>{images.slice(0, 2).map(photo => <PhotoFigure key={photo.key} photo={photo} status={states[photo.key]?.url === photo.url ? states[photo.key].status : undefined} update={update} open={open} />)}</div> : null}
    </div>
    {images.length > 2 ? <div className={styles.extraFigures}>{images.slice(2).map(photo => <PhotoFigure key={photo.key} photo={photo} status={states[photo.key]?.url === photo.url ? states[photo.key].status : undefined} update={update} open={open} />)}</div> : null}
    {record.children.map(child => <RecordView key={child.anchor} record={child} level={Math.min(5, level + 1) as 3 | 4 | 5} photoMap={photoMap} states={states} update={update} open={open} />)}
    {record.notes.length ? <div className={styles.recordNotes}>{record.notes.map((note, index) => <p key={index}>{note}</p>)}</div> : null}
    {record.reviewHref ? <Link className={styles.correct} href={record.reviewHref}>{t.correct}<span className="sr-only"> · {record.ref} {record.title}</span><ArrowUpRight size={14} aria-hidden="true" /></Link> : null}
  </section>;
}
function IssueIndex({ issues }: { issues: readonly DeepReadonly<PreviewIssue>[] }) {
  const groups = new Map<string, { context: string; issues: typeof issues[number][] }>();
  for (const i of issues) {
    const existing = groups.get(i.anchor);
    if (existing) existing.issues.push(i); else groups.set(i.anchor, { context: i.context, issues: [i] });
  }
  return <ul className={styles.issueIndex}>{[...groups].map(([anchor, group]) => <li key={anchor}><Jump anchor={anchor}><strong>{group.context}</strong><span>{group.issues.length === 1 ? group.issues[0].label : `${group.issues.length} skráð atriði · sjá nánar`}</span></Jump></li>)}</ul>;
}

export function ReportPreviewDocument({ preview, comparison }: { preview: ReportPreview; comparison?: ReactNode }) {
  const [states, setStates] = useState<PhotoStates>({});
  const [opened, setOpened] = useState<string | null>(null);
  const update = useCallback<UpdatePhoto>((photo, status) => setStates(previous => previous[photo.key]?.url === photo.url && previous[photo.key].status === status ? previous : { ...previous, [photo.key]: { url: photo.url, status } }), []);
  const open = useCallback((photo: Photo) => setOpened(photo.key), []);
  const photoMap = new Map(preview.photos.map(p => [p.key, p]));
  const shown = preview.photos.filter(p => states[p.key]?.url === p.url && states[p.key].status === "available").length;
  const unavailable = preview.photos.filter(p => states[p.key]?.url === p.url && states[p.key].status === "unavailable").length;
  const pending = preview.photos.length - shown - unavailable;
  const selected = opened ? photoMap.get(opened) : undefined;
  const concerns = preview.issues.filter(i => i.categories.includes("concern")).toSorted((a, b) => a.priority - b.priority);
  const gaps = preview.issues.filter(i => i.task && (i.categories.includes("missing") || i.categories.includes("data_review")));
  const incomplete = preview.stats.recorded < preview.stats.total || gaps.some(i => i.categories.includes("missing"));
  const limits = preview.issues.filter(i => i.categories.includes("limitation") && !i.categories.includes("concern"));
  const props = { photoMap, states, update, open };
  const sections = [preview.property, ...(preview.rental ? [preview.rental] : []), preview.fire];
  return <article className={styles.document} id="preview-report" aria-labelledby="preview-document-title">
    <header className={styles.masthead}>
      <div><p className={styles.eyebrow}>{preview.context} · {preview.inspectionType}</p><h1 id="preview-document-title" tabIndex={-1}>{t.document}<strong>{preview.property.fields.find(f => f.key === "address")?.state === "supplied" ? preview.title : "Heimilisfang óskráð"}</strong></h1>
        <p className={styles.location}>{preview.property.fields.filter(f => ["unit", "postalCode", "municipality"].includes(f.key) && f.state === "supplied").map(f => f.value).join(" · ") || "Staðsetning óskráð"}</p>
      </div>
      <div className={styles.identity}><span className={styles.draft}>{t.draft}</span><span>Staðbundin tilvísun</span><strong>{preview.id}</strong><span>{preview.rooms.length} rými · {preview.stats.total} atriði</span></div>
    </header>
    <section className={styles.overview} aria-labelledby="preview-overview">
      <p className={styles.eyebrow}>01 · {t.overview}</p>
      <h2 id="preview-overview" tabIndex={-1}>{!preview.stats.total ? t.noItems : preview.findings.length ? `${preview.findings.length} atriði með skráðu fráviki${incomplete ? ` · ${t.incomplete.toLocaleLowerCase("is")}` : ""}` : incomplete ? t.incomplete : t.noFindings}</h2>
      {preview.stats.total > 0 && incomplete && !preview.findings.length ? <p>{t.noFindings}</p> : null}
      <p>{preview.stats.recorded} af {preview.stats.total} atriðum uppfylla skráningarreglur. Skráð svör staðfesta ekki að allt hafi verið skoðað.</p>
      <dl className={styles.metrics}><div><dt>skoðunaratriði</dt><dd>{preview.stats.total}</dd></div><div><dt>atriði með fráviki</dt><dd>{preview.stats.deviations}</dd></div><div><dt>ófullskráð atriði</dt><dd>{preview.stats.total - preview.stats.recorded}</dd></div><div><dt>atriði með skráðar takmarkanir</dt><dd>{preview.limitedItems}</dd></div></dl>
      <p className={styles.small}>{t.overlap}</p>
      <dl className={styles.metadata}><div><dt>Dagsetning skoðunar</dt><dd>{preview.date}</dd></div><div><dt>Skráningaraðili · sjálfskráð nafn</dt><dd>{preview.recorder}</dd></div></dl>
      {preview.wearItems ? <p>{preview.wearItems} atriði með skráðum notkunarmerkjum. Þetta er uppgefið mat á ástandi.</p> : null}
      {preview.findings.length ? <><h3 className={styles.subheading}>{t.findings}</h3><ul className={styles.findings}>{preview.findings.map(item => <li key={item.anchor}><Jump anchor={item.anchor}><span className={styles.reference}>{item.ref}</span><span>{"roomIndex" in item.source ? `${preview.rooms[item.source.roomIndex].title} · ` : ""}{item.title}</span><ArrowUpRight size={14} aria-hidden="true" /></Jump></li>)}</ul></> : null}
      {concerns.length ? <div className={styles.concernSummary}><h3>{t.concerns}</h3><IssueIndex issues={concerns} /></div> : null}
      {preview.responses.length ? <div className={styles.responses}><h3>{t.otherResponses}</h3><ul>{preview.responses.map(r => <li key={r.anchor}><Jump anchor={r.anchor}>{r.ref} · {r.title} · {r.status}</Jump></li>)}</ul></div> : null}
    </section>
    <section className={styles.gaps} id="preview-gaps" tabIndex={-1} aria-labelledby="preview-gaps-title"><h2 id="preview-gaps-title">{t.gaps}</h2>
      {gaps.length ? <><h3>{t.missing}</h3><IssueIndex issues={gaps} /></> : <p>Engin ófullgerð svör merkt til yfirferðar samkvæmt núverandi skráningarreglum.</p>}
      {limits.length ? <><h3>{t.limitations}</h3><IssueIndex issues={limits} /></> : null}
      <p className={styles.mediaNotice}><Camera size={17} aria-hidden="true" />{t.temporary}</p>
      <p className={styles.availability} role="status" aria-live="polite">{preview.photos.length} myndatengingar · {shown} birtar · {unavailable} ekki tiltækar · {pending} með óstaðfesta birtingu</p>
      {unavailable ? <p><Jump anchor="preview-evidence">Sjá myndir sem ekki er hægt að birta í myndaskrá.</Jump></p> : null}
    </section>
    <p className={styles.statusNotice}>{t.unverified}</p>
    {comparison}
    <nav className={styles.guide} aria-label={t.guide}><details><summary>{t.guide}</summary><ol>
      <li><Jump anchor="preview-overview">Yfirlit og frávik</Jump></li><li><Jump anchor="preview-gaps">{t.gaps}</Jump></li>
      {comparison ? <li><a href="#comparison">Samanburður upphafs og loka</a></li> : null}
      {sections.map(s => <li key={s.anchor}><Jump anchor={s.anchor}>{s.title}</Jump></li>)}
      {preview.rooms.map(r => <li key={r.anchor}><Jump anchor={r.anchor}>{r.ref} · {r.title}</Jump></li>)}
      <li><Jump anchor={preview.meters.anchor}>{preview.meters.title}</Jump></li><li><Jump anchor="preview-evidence">{t.evidence}</Jump></li><li><Jump anchor="preview-verification">{t.verification}</Jump></li>
    </ol></details></nav>
    {sections.map((s, index) => <div key={s.anchor} className={styles.majorSection}><p className={styles.eyebrow}>{String(index + 2).padStart(2, "0")} · Upplýsingar og athuganir</p><RecordView record={s} level={2} {...props} /></div>)}
    <section className={styles.rooms} aria-labelledby="preview-rooms-title"><h2 id="preview-rooms-title">{t.rooms}</h2>{!preview.rooms.length ? <p>Engin rými valin. Engar niðurstöður um rými liggja fyrir.</p> : null}
      {preview.rooms.map(room => <section className={styles.room} key={room.anchor} aria-label={`${room.ref} ${room.title}`}>
        <RecordView record={room} level={3} {...props} />
        <p className={styles.roomCount}>{room.stats.recorded} af {room.stats.total} atriðum skráð · {room.stats.deviations} atriði með fráviki</p>
        {room.items.map(item => <RecordView key={item.anchor} record={item} level={4} ordinary={item.kind === "ordinary"} item {...props} />)}
      </section>)}
    </section>
    <div className={styles.majorSection}><RecordView record={preview.meters} level={2} {...props} /></div>
    <section id="preview-evidence" tabIndex={-1} className={styles.majorSection} aria-labelledby="preview-evidence-title"><h2 id="preview-evidence-title">{t.evidence}</h2><p className={styles.small}>M-númer vísa í myndatengingar í birtingarröð þessarar forskoðunar. Þau eru ekki varanleg auðkenni eða tímaröð ljósmynda.</p>
      {!preview.photos.length ? <p>{t.noPhotos}</p> : <ol className={styles.ledger}>{preview.photos.map(photo => <li key={photo.key}>
        <Jump anchor={photo.anchor}><strong>{photo.ref}</strong><span>{photo.context}<span className={styles.filename}>{photo.name}</span></span></Jump><span>{states[photo.key]?.url === photo.url && states[photo.key].status === "available" ? t.imageAvailable : states[photo.key]?.url === photo.url && states[photo.key].status === "unavailable" ? t.imageUnavailable : t.imagePending}</span>
      </li>)}</ol>}
      {preview.unassignedPhotos.length ? <details className={styles.retained}><summary>{t.unassigned}</summary><p>Ekki er hægt að nota þessar myndatengingar sem myndgögn við núverandi atriði.</p><ul>{preview.unassignedPhotos.map((p, index) => <li key={index}>{p.name} · {p.target}</li>)}</ul></details> : null}
    </section>
    <section id="preview-verification" tabIndex={-1} className={styles.verification} aria-labelledby="preview-verification-title"><h2 id="preview-verification-title">{t.verification}</h2><p>{t.execution}</p><p>{comparison ? "Tenging við upphafsskráningu er valin af notanda. Gildi viðmiðs og takmarkanir eru sýnd í samanburðarkafla; engin sannreynd útgáfusaga liggur fyrir." : t.baseline}</p><p>Þessi skráning er ekki fagleg öryggisvottun, staðfesting HMS eða staðfesting á að skyldum samkvæmt leigusamningi hafi verið lokið.</p></section>
    <footer className={styles.documentFooter}><span>{preview.id} · {t.draft}</span><Jump anchor="preview-document-title">Efst í skýrslu</Jump></footer>
    {selected ? <ContextDialog title={`${selected.ref} · ${selected.context}`} closeLabel={t.closeImage} onClose={() => setOpened(null)}><div className={styles.fullImage}><p>{selected.name}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={selected.url} alt={selected.alt} onLoad={() => update(selected, "available")} onError={() => update(selected, "unavailable")} hidden={states[selected.key]?.status === "unavailable"} />
      {states[selected.key]?.status === "unavailable" ? <p>{t.imageUnavailable}</p> : null}<p>{t.temporary}</p>
    </div></ContextDialog> : null}
  </article>;
}

export function PreviewBackLink({ reportId }: { reportId: string }) {
  return <Link className={styles.back} href={`/skyrslur/${encodeURIComponent(reportId)}/yfirferd#report-preview-entry`}><ArrowLeft size={17} aria-hidden="true" />{t.back}</Link>;
}
