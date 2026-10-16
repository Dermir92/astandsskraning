"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, ChevronDown, ChevronRight, ClipboardCheck, CornerDownLeft, ImagePlus, ListChecks, MessageSquare, Pause, Play, RotateCcw, TriangleAlert, X } from "lucide-react";
import { CLEANLINESS, CONDITIONS, EMPTY_DETAILS, FUNCTIONALITIES, isReportList, observationComplete, requiresDamage, roomStats, type ChecklistItem, type Observation, type Room } from "@/lib/model";
import { is } from "@/lib/locale/is";
import { ContextDialog } from "@/components/context-dialog";
import { itemStatus, missingAnswers, newDemo, observationFor, overviewKey, photoKey, reviewReasons, scenarioState, SESSION_PREFIX, type Concept, type DemoPhoto, type DemoState, type PhotoMap, type Position, type Scenario } from "./concept-model";
import s from "./concept.module.css";

function AnswerGroup<T extends string>({ label, values, labels, value, onChange, question }: {
  label: string; values: T[]; labels: Record<T, string>; value?: T;
  onChange: (value: T) => void; question: string;
}) {
  const name = useId();
  return <fieldset className={s.answerGroup} data-question={question}>
    <legend>{label}</legend>
    <div className={question === "condition" ? s.conditionGrid : s.answerGrid}>
      {values.map(option => <label key={option} className={`${s.answer} ${value === option ? s.selected : ""}`}>
        <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
        <span className={s.radioDot} aria-hidden="true">{value === option ? <Check size={13} /> : null}</span>
        <span>{labels[option]}</span>
      </label>)}
    </div>
  </fieldset>;
}

function PhotoField({ photos, onAdd, onRemove, title }: {
  photos: DemoPhoto[]; onAdd: (files: FileList) => Promise<string>; onRemove: (id: string) => void; title: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    setBusy(true);
    setError(await onAdd(files));
    setBusy(false);
    if (input.current) input.current.value = "";
  }
  return <section className={s.photoArea} aria-label={title}>
    <div className={s.sectionLabel}><Camera size={18} aria-hidden="true" /><h3>{title}</h3><span>{photos.length}/8</span></div>
    {photos.length ? <ul className={s.photoList}>{photos.map(photo => <li key={photo.id}>
      <a href={photo.url} target="_blank" rel="noreferrer" aria-label={`Opna mynd: ${photo.name}`}>
        {/* Local blobs and a labelled synthetic fixture; no upload or remote optimization. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.synthetic ? "Tilbúin sýnimynd: rispa við hvítan dyrakarm" : `Tímabundin forskoðun: ${photo.name}`} width={180} height={120} />
      </a>
      <div><span>{photo.synthetic ? "Tilbúin sýnimynd · AI" : photo.name}</span><button type="button" aria-label={`Fjarlægja mynd: ${photo.name}`} onClick={() => { onRemove(photo.id); requestAnimationFrame(() => input.current?.focus()); }}><X size={18} aria-hidden="true" /></button></div>
    </li>)}</ul> : null}
    <label className={s.upload}>
      <ImagePlus size={18} aria-hidden="true" />{busy ? "Les myndir…" : "Velja myndir"}
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label={`${title}: velja myndir`} disabled={busy || photos.length >= 8} onChange={event => void choose(event)} />
    </label>
    <p>JPG, PNG eða WebP · mest 10 MB á mynd.<br />Aðeins forskoðun. Myndir hverfa við endurhleðslu.</p>
    {error ? <p role="alert" className={s.error}>{error}</p> : null}
  </section>;
}

function ItemEditor({ room, item, photos, onChange, onAdd, onRemove, compact = false }: {
  room: Room; item: ChecklistItem; photos: DemoPhoto[]; onChange: (patch: Partial<Observation>) => void;
  onAdd: (files: FileList) => Promise<string>; onRemove: (id: string) => void; compact?: boolean;
}) {
  const o = observationFor(room, item.id);
  const damage = requiresDamage(o);
  const complete = observationComplete(item, o);
  const prefix = useId();
  const [showPhotos, setShowPhotos] = useState(photos.length > 0);
  const [showNote, setShowNote] = useState(!!o.note);
  const [foldCondition] = useState(() => compact && o.condition === "good");
  const retained = !damage && (!!o.description || !!o.damageType || !!o.location);
  const conditions = <AnswerGroup label="Ástand" question="condition" values={CONDITIONS} labels={is.conditions} value={o.condition} onChange={condition => onChange({ condition })} />;
  return <div className={s.editor} data-editor={`${room.id}:${item.id}`}>
    {foldCondition ? <details className={s.foldedCondition}><summary><strong>Ástand</strong><span>{o.condition ? is.conditions[o.condition] : "Óskráð"}</span><span>Breyta</span></summary>{conditions}</details> : conditions}
    {!o.condition ? <p className={s.answerHint}>Veldu eftir skoðun. Ekkert svar er forvalið.</p> : null}
    {o.condition && o.condition !== "na" && (item.functionality || item.cleanliness) ? <div className={s.secondary}>
      {item.functionality ? <AnswerGroup label="Virkni" question="functionality" values={FUNCTIONALITIES} labels={is.functionality} value={o.functionality} onChange={functionality => onChange({ functionality })} /> : null}
      {item.cleanliness ? <AnswerGroup label="Þrif" question="cleanliness" values={CLEANLINESS} labels={is.cleanliness} value={o.cleanliness} onChange={cleanliness => onChange({ cleanliness })} /> : null}
    </div> : o.condition === "na" ? <p className={s.answerHint}>Virkni og þrif eru ekki krafa þegar atriðið á ekki við.</p> : null}
    {damage ? <section className={s.damageFields} aria-label="Lýsing á fráviki">
      <div className={s.sectionLabel}><TriangleAlert size={18} aria-hidden="true" /><h3>Lýsing á fráviki</h3></div>
      <div className={s.fieldGrid}>
        <label htmlFor={`${prefix}-type`}>Tegund fráviks<select id={`${prefix}-type`} value={o.damageType} onChange={event => onChange({ damageType: event.target.value })}>
          <option value="">Veldu tegund</option>{["Rispa", "Slit", "Brot", "Dæld", "Raki / leki", "Óvirkur búnaður", "Annað"].map(type => <option key={type}>{type}</option>)}
        </select></label>
        <label htmlFor={`${prefix}-location`}>Staðsetning<input id={`${prefix}-location`} value={o.location} placeholder="T.d. neðarlega við dyrakarm" onChange={event => onChange({ location: event.target.value })} /></label>
        <label className={s.fullField} htmlFor={`${prefix}-description`}>Lýsing<textarea id={`${prefix}-description`} rows={3} value={o.description} placeholder="Hvað sést? Lýstu stærð og umfangi." onChange={event => onChange({ description: event.target.value })} /></label>
      </div>
      <p className={s.answerHint}>Drög eru leyfð. Tegund, staðsetning og lýsing þurfa að fylgja fráviki.</p>
    </section> : null}
    {retained ? <details className={s.retained}><summary>Fyrri frávikslýsing varðveitt</summary><p>{o.damageType} · {o.location}</p><p>{o.description}</p><p>Telst ekki virkt frávik með núverandi svari.</p></details> : null}
    <div className={s.evidenceActions}>
      {!damage ? <button type="button" aria-expanded={showPhotos} onClick={() => setShowPhotos(!showPhotos)}><Camera size={18} aria-hidden="true" />Myndir{photos.length ? ` (${photos.length})` : ""}</button> : null}
      <button type="button" aria-expanded={showNote} onClick={() => setShowNote(!showNote)}><MessageSquare size={18} aria-hidden="true" />Athugasemd{o.note ? " skráð" : ""}</button>
    </div>
    {damage || showPhotos ? <PhotoField title={damage ? "Myndir af fráviki" : "Myndir af atriði"} photos={photos} onAdd={async files => { setShowPhotos(true); return onAdd(files); }} onRemove={onRemove} /> : null}
    {damage && !photos.length ? <p className={s.missingPhoto}><TriangleAlert size={16} aria-hidden="true" />Mynd af fráviki vantar. Svör geta samt verið fullskráð.</p> : null}
    {showNote ? <label className={s.noteField} htmlFor={`${prefix}-note`}>Athugasemd <span>(valfrjálst)</span><textarea id={`${prefix}-note`} value={o.note} rows={2} onChange={event => onChange({ note: event.target.value })} /></label> : null}
    <div className={`${s.itemFeedback} ${complete ? s.recorded : ""}`} role="status" aria-live="polite">
      {complete ? <><Check size={17} aria-hidden="true" />Svör skráð{o.condition === "uninspected" || o.functionality === "untested" || o.cleanliness === "uninspected" ? " · Þarf athygli í yfirferð" : damage ? " · Frávik fylgir" : ""}</> : missingAnswers(item, o).join(" · ")}
    </div>
  </div>;
}

function readSession(concept: Concept): { state: DemoState; hadPhotos: boolean } | null {
  const raw = sessionStorage.getItem(`${SESSION_PREFIX}${concept}`);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  const state = parsed?.state;
  // Reuse the existing full room/observation validator without changing its schema.
  const valid = state && isReportList([{ id: "sandbox", title: "", subtitle: "", updatedAt: "2026-10-15T00:00:00Z", assetType: "apartment", details: EMPTY_DETAILS, rooms: state.rooms }]);
  const room = valid && state.rooms.find((r: Room) => r.id === state.position?.roomId);
  if (!room || !room.items.some((i: ChecklistItem) => i.id === state.position?.itemId) || typeof state.paused !== "boolean") throw new Error("invalid-concept-session");
  return { state, hadPhotos: parsed.hadPhotos === true };
}

export function ConceptWorkbench({ concept }: { concept: Concept }) {
  const [demo, setDemo] = useState(newDemo);
  const [photos, setPhotos] = useState<PhotoMap>({});
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [lostPhotos, setLostPhotos] = useState(false);
  const [view, setView] = useState<"inspect" | "review">("inspect");
  const [dialog, setDialog] = useState<"rooms" | "incomplete" | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"incomplete" | "attention" | "all">("incomplete");
  const [openId, setOpenId] = useState<string | null>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [message, setMessage] = useState("");
  const pendingFocus = useRef<string | null>(null);
  const blobs = useRef(new Set<string>());
  const photoRef = useRef<PhotoMap>({});
  const latestDemo = useRef(demo);
  const photoGeneration = useRef({ value: 0 });
  const allRows = demo.rooms.flatMap(room => room.items.map(item => ({ room, item, o: observationFor(room, item.id), position: { roomId: room.id, itemId: item.id } })));
  const room = demo.rooms.find(r => r.id === demo.position.roomId)!;
  const item = room.items.find(i => i.id === demo.position.itemId)!;
  const roomIndex = demo.rooms.indexOf(room);
  const itemIndex = room.items.indexOf(item);
  const stats = roomStats(room);
  const recorded = allRows.filter(row => observationComplete(row.item, row.o)).length;
  const incomplete = allRows.filter(row => !observationComplete(row.item, row.o));
  const attention = allRows.filter(row => !!row.o.condition && reviewReasons(row.item, row.o, photos[photoKey(row.position)] ?? []).length > 0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = readSession(concept);
        if (saved) { latestDemo.current = saved.state; setDemo(saved.state); setLostPhotos(saved.hadPhotos); setOpenId(saved.state.position.itemId); }
      } catch { setStorageError("Ekki tókst að lesa sýnilotu. Ný sýnigögn eru sýnd; upprunalega lotan er ósnert þar til þú breytir henni."); }
      setReady(true);
    });
    const urls = blobs.current;
    const generation = photoGeneration.current;
    return () => { cancelAnimationFrame(frame); generation.value++; urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [concept]);

  useEffect(() => {
    if (!pendingFocus.current || dialog || demo.paused) return;
    const question = pendingFocus.current;
    pendingFocus.current = null;
    const frame = requestAnimationFrame(() => {
      const editor = document.querySelector<HTMLElement>(`[data-editor="${photoKey(demo.position)}"]`);
      const target = (question === "overview" ? document.querySelector<HTMLElement>(`[data-overview="${demo.position.roomId}"] input[type="file"]`) : question !== "heading" ? editor?.querySelector<HTMLElement>(`[data-question="${question}"] input`) : null) ?? document.getElementById(`item-${demo.position.roomId}-${demo.position.itemId}`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [demo.position, demo.paused, openId, dialog, view, overviewOpen]);

  function commit(next: DemoState, nextPhotos = photoRef.current) {
    latestDemo.current = next;
    setDemo(next);
    try {
      sessionStorage.setItem(`${SESSION_PREFIX}${concept}`, JSON.stringify({ state: next, hadPhotos: Object.values(nextPhotos).some(list => list.length) }));
      setStorageError("");
    } catch { setStorageError("Sýnilotan er aðeins í minni. Endurkoma eftir endurhleðslu virkar ekki meðan vafrinn hafnar vistun."); }
  }
  function replacePhotos(next: PhotoMap) { photoRef.current = next; setPhotos(next); }
  function update(position: Position, patch: Partial<Observation>) {
    commit({ ...demo, position, rooms: demo.rooms.map(r => r.id !== position.roomId ? r : { ...r, observations: { ...r.observations, [position.itemId]: { ...observationFor(r, position.itemId), ...patch } } }) });
    setMessage("");
  }
  function go(position: Position, question = "heading") {
    pendingFocus.current = question;
    commit({ ...demo, position, paused: false });
    setOpenId(position.itemId); setView("inspect"); setDialog(null); setMessage(""); setOverviewOpen(question === "overview");
  }
  function changeRoom(index: number) {
    const nextRoom = demo.rooms[index];
    if (!nextRoom) return;
    const nextItem = nextRoom.items.find(i => !observationComplete(i, nextRoom.observations[i.id])) ?? nextRoom.items[0];
    go({ roomId: nextRoom.id, itemId: nextItem.id });
    if (concept === "b") setOpenId(null);
  }
  function nextItem(direction = 1) {
    const index = allRows.findIndex(row => photoKey(row.position) === photoKey(demo.position));
    const next = allRows[index + direction];
    if (next) {
      const skipped = !observationComplete(item, observationFor(room, item.id));
      go(next.position);
      if (direction > 0 && skipped) setMessage(`${item.name} er enn ófullskráð og birtist í Ólokið.`);
    } else if (direction > 0) { setView("review"); setReviewFilter("incomplete"); }
  }
  async function addPhotos(key: string, files: FileList) {
    const generation = photoGeneration.current.value;
    const errors: string[] = [];
    const added: DemoPhoto[] = [];
    for (const file of Array.from(files)) {
      if ((photoRef.current[key]?.length ?? 0) + added.length >= 8) { errors.push("Hámark er átta myndir."); break; }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { errors.push(`${file.name}: veldu JPG, PNG eða WebP.`); continue; }
      if (file.size > 10 * 1024 * 1024) { errors.push(`${file.name}: mynd er stærri en 10 MB.`); continue; }
      try {
        const bitmap = await createImageBitmap(file); bitmap.close();
        if (generation !== photoGeneration.current.value) return "";
        const url = URL.createObjectURL(file); blobs.current.add(url);
        added.push({ id: crypto.randomUUID(), url, name: file.name });
      } catch { errors.push(`${file.name}: ekki tókst að lesa myndina.`); }
    }
    if (added.length) {
      const next = { ...photoRef.current, [key]: [...(photoRef.current[key] ?? []), ...added] };
      replacePhotos(next); commit(latestDemo.current, next);
    }
    return errors.join(" ");
  }
  function removePhoto(key: string, id: string) {
    const photo = photoRef.current[key]?.find(p => p.id === id);
    if (photo && blobs.current.has(photo.url)) { URL.revokeObjectURL(photo.url); blobs.current.delete(photo.url); }
    const next = { ...photoRef.current, [key]: (photoRef.current[key] ?? []).filter(p => p.id !== id) };
    replacePhotos(next); commit(demo, next);
  }
  function loadScenario(scenario: Scenario) {
    photoGeneration.current.value++;
    blobs.current.forEach(url => URL.revokeObjectURL(url)); blobs.current.clear();
    const next = scenarioState(scenario);
    replacePhotos(next.photos); commit(next.state, next.photos);
    setLostPhotos(false); setView("inspect"); setOpenId(scenario === "opening" ? null : next.state.position.itemId); setMessage("");
    pendingFocus.current = "heading";
  }
  function editorFor(target: ChecklistItem, compact = false) {
    const position = { roomId: room.id, itemId: target.id };
    const key = photoKey(position);
    return <ItemEditor key={key} room={room} item={target} compact={compact} photos={photos[key] ?? []} onChange={patch => update(position, patch)} onAdd={files => addPhotos(key, files)} onRemove={id => removePhoto(key, id)} />;
  }
  const taskHeading = (target: ChecklistItem) => `item-${room.id}-${target.id}`;
  const reviewRows = reviewFilter === "incomplete" ? incomplete : reviewFilter === "attention" ? attention : allRows;

  if (!ready) return <div className={s.root} aria-busy="true">Opna sýnilotu…</div>;
  return <div className={s.root} data-concept={concept}>
    <div className={s.conceptBar}>
      <Link href="/hugmyndir"><ArrowLeft size={17} aria-hidden="true" />Samanburður</Link>
      <span>Hugmynd {concept.toUpperCase()} <span className={s.demoLabel}>· SÝNI</span></span>
      <button type="button" aria-label="Gera hlé á skoðun" onClick={() => { commit({ ...demo, paused: true }); setDialog(null); }}><Pause size={17} aria-hidden="true" /><span>Gera hlé</span></button>
    </div>
    <header className={s.inspectionHeader}>
      <div><p className={s.property}>Sýnigata 14 <span>· Íbúð 0201</span></p><h1>{concept === "a" ? "Verkefnamiðuð skoðun" : "Þéttur gátlisti"}</h1></div>
      <button className={s.reviewButton} onClick={() => { setView(view === "review" ? "inspect" : "review"); setReviewFilter("incomplete"); }}><ClipboardCheck size={18} aria-hidden="true" />{view === "review" ? "Skoðun" : "Yfirferð"}</button>
    </header>
    <div className={s.overall}><span>{recorded} af {allRows.length} atriðum skráð</span><span>Upphafsskráning</span><progress max={allRows.length} value={recorded} aria-label="Skráð atriði í skoðun" /></div>
    {storageError ? <p className={s.warning} role="alert">{storageError}</p> : null}
    {lostPhotos ? <div className={s.warning} role="status"><TriangleAlert size={18} aria-hidden="true" /><p>Svör og staða komu til baka. Tímabundnar myndir hurfu við endurhleðslu; bættu þeim aftur við í yfirferð.</p><button aria-label="Loka tilkynningu um myndir" onClick={() => setLostPhotos(false)}><X size={18} aria-hidden="true" /></button></div> : null}
    {demo.paused ? <section className={s.resume} aria-labelledby="resume-title">
      <span className={s.resumeIcon}><Pause size={26} aria-hidden="true" /></span><p className={s.kicker}>SKOÐUN Í BIÐ</p><h2 id="resume-title">Haltu áfram þar sem frá var horfið</h2><p>Sýnigata 14 · {room.name}</p>
      <div className={s.resumePlace}><CornerDownLeft size={22} aria-hidden="true" /><div><strong>{item.name}</strong><span>{missingAnswers(item, observationFor(room, item.id)).join(" · ") || "Svör skráð · má yfirfara"}</span></div></div>
      <button className={s.primary} onClick={() => go(demo.position, item.cleanliness && !observationFor(room, item.id).cleanliness && observationFor(room, item.id).condition ? "cleanliness" : "heading")}><Play size={18} aria-hidden="true" />Halda áfram</button>
      <p className={s.smallPrint}>Aðskilin sýnilota í þessum flipa. Myndir eru aðeins tímabundnar.</p>
    </section> : view === "review" ? <section className={s.review} aria-labelledby="review-title">
      <div className={s.reviewHeading}><div><p className={s.kicker}>YFIRFERÐ SKOÐUNAR</p><h2 id="review-title">Það sem þarf að yfirfara</h2></div><button className={s.secondaryButton} onClick={() => go(demo.position)}><ArrowLeft size={17} aria-hidden="true" />Aftur í atriði</button></div>
      <p>Skráð þýðir að svör liggja fyrir. Óskoðuð atriði og frávik þurfa áfram athygli.</p>
      <div className={s.reviewFilters} role="group" aria-label="Sía yfirferð">{([["incomplete", "Ófullskráð", incomplete.length], ["attention", "Athygli", attention.length], ["all", "Öll atriði", allRows.length]] as const).map(([value, label, count]) => <button key={value} aria-pressed={reviewFilter === value} onClick={() => setReviewFilter(value)}>{label}<span>{count}</span></button>)}</div>
      <p className={s.reviewCount} role="status">{reviewRows.length} atriði · Veldu atriði til að fara beint í rétt svar.</p>
      <ul className={s.reviewList}>{reviewRows.map(row => {
        const reasons = reviewReasons(row.item, row.o, photos[photoKey(row.position)] ?? []);
        const missing = missingAnswers(row.item, row.o);
        const question = missing.includes("Ástand vantar") ? "condition" : missing.includes("Virkni vantar") ? "functionality" : missing.includes("Þrif vantar") ? "cleanliness" : "heading";
        return <li key={photoKey(row.position)}><button onClick={() => go(row.position, question)}><span><span className={s.reviewRoom}>{row.room.name}</span><strong>{row.item.name}</strong><span>{reasons.join(" · ") || is.conditions[row.o.condition!]}</span></span><ChevronRight size={20} aria-hidden="true" /></button></li>;
      })}</ul>
      {!reviewRows.length ? <p className={s.empty}><Check size={22} aria-hidden="true" />Engin atriði í þessari síu.</p> : null}
      <details className={s.roomEvidence}><summary><Camera size={18} aria-hidden="true" />Yfirlitsmyndir rýma · {demo.rooms.filter(r => !photos[overviewKey(r.id)]?.length).length} rými án myndar</summary><ul className={s.reviewList}>{demo.rooms.map(r => <li key={r.id}><button onClick={() => go({ roomId: r.id, itemId: r.items[0].id }, "overview")}><span><strong>{r.name}</strong><span>{photos[overviewKey(r.id)]?.length ? "Tímabundin yfirlitsmynd til staðar" : "Yfirlitsmynd vantar"}</span></span><ChevronRight size={20} aria-hidden="true" /></button></li>)}</ul></details>
      <p className={s.smallPrint}>Yfirferð sýnigagna · Enginn frágangur eða sending.</p>
    </section> : <>
      <div className={s.workLayout}>
        <aside className={s.roomRail} aria-label="Rými skoðunar"><p className={s.kicker}>RÝMI SKOÐUNAR</p><ol>{demo.rooms.map((r, index) => <li key={r.id}><button aria-current={r.id === room.id ? "step" : undefined} onClick={() => changeRoom(index)}><span className={s.roomNumber}>{index + 1}</span><span><strong>{r.name}</strong><span>{roomStats(r).recorded} / {r.items.length} skráð</span></span></button></li>)}</ol><p>Öll svör eru valin eftir skoðun.</p></aside>
        <section className={s.roomWork} aria-labelledby="room-title">
          <div className={s.roomOrientation}><div className={s.roomHeader}><button className={s.roomPicker} aria-haspopup="dialog" onClick={() => setDialog("rooms")}><span><span className={s.kicker}>RÝMI {roomIndex + 1} AF {demo.rooms.length}</span><span id="room-title">{room.name}</span></span><ChevronDown size={19} aria-hidden="true" /></button><button className={s.incompleteButton} aria-haspopup="dialog" onClick={() => setDialog("incomplete")}><ListChecks size={18} aria-hidden="true" />Ólokið <strong>{incomplete.length}</strong></button></div>
          <div className={s.roomProgress}><span>{concept === "a" || openId ? <><strong>{concept === "a" ? item.name : room.items.find(i => i.id === openId)?.name}</strong> · </> : null}{stats.recorded} af {stats.total} skráð</span><progress value={stats.recorded} max={stats.total} aria-label={`Skráð atriði í ${room.name}`} /></div></div>
          {concept === "a" ? <section className={s.task} aria-labelledby={taskHeading(item)}>
            <div className={s.taskTitle}><p>Atriði {itemIndex + 1} af {room.items.length}</p><span data-tone={itemStatus(item, observationFor(room, item.id)).tone}>{itemStatus(item, observationFor(room, item.id)).label}</span><h2 id={taskHeading(item)} tabIndex={-1}>{item.name}</h2></div>
            {editorFor(item)}
          </section> : <div className={s.checklist}>
            <div className={s.listHeading}><h2>Skoðunaratriði</h2><span>Veldu svar eða opnaðu atriði</span></div>
            {room.items.map((target, index) => {
              const o = observationFor(room, target.id);
              const status = itemStatus(target, o);
              const open = openId === target.id;
              return <section key={target.id} className={`${s.checkRow} ${open ? s.openRow : ""}`} aria-labelledby={taskHeading(target)}>
                <div className={s.rowMain}>
                  <button className={s.rowToggle} id={taskHeading(target)} aria-expanded={open} aria-controls={`panel-${room.id}-${target.id}`} onClick={() => { if (open) setOpenId(null); else go({ roomId: room.id, itemId: target.id }); }}>
                    <span className={s.rowNumber} data-tone={status.tone}>{observationComplete(target, o) && status.tone === "complete" ? <Check size={17} aria-hidden="true" /> : index + 1}</span>
                    <span><strong>{target.name}</strong><span data-tone={status.tone}>{o.condition ? `${is.conditions[o.condition]} · ${status.label}` : status.label}</span></span><ChevronDown size={16} aria-hidden="true" />
                  </button>
                  <button className={`${s.quickGood} ${o.condition === "good" ? s.quickSelected : ""}`} aria-label={`Í lagi: ${target.name}`} aria-pressed={o.condition === "good"} onClick={() => {
                    const position = { roomId: room.id, itemId: target.id };
                    update(position, { condition: "good" });
                    if (target.functionality || target.cleanliness || o.description || photos[photoKey(position)]?.length) {
                      setOpenId(target.id); pendingFocus.current = target.functionality && !o.functionality ? "functionality" : target.cleanliness && !o.cleanliness ? "cleanliness" : "heading";
                    } else { setOpenId(null); }
                  }}><Check size={16} aria-hidden="true" />Í lagi</button>
                </div>
                {open ? <div id={`panel-${room.id}-${target.id}`} className={s.rowPanel}>{editorFor(target, true)}<button className={s.nextInline} onClick={() => nextItem()}>Næsta atriði<ArrowRight size={17} aria-hidden="true" /></button></div> : null}
              </section>;
            })}
          </div>}
          <details className={s.roomEvidence} data-overview={room.id} open={overviewOpen} onToggle={event => setOverviewOpen(event.currentTarget.open)}><summary><Camera size={18} aria-hidden="true" />Yfirlitsmyndir af {room.name.toLocaleLowerCase("is")}<span>{photos[overviewKey(room.id)]?.length ?? 0}</span></summary><PhotoField title="Yfirlitsmyndir rýmis" photos={photos[overviewKey(room.id)] ?? []} onAdd={files => addPhotos(overviewKey(room.id), files)} onRemove={id => removePhoto(overviewKey(room.id), id)} /></details>
          <p className={s.sessionNote}>Svör í aðskilinni sýnilotu · Myndir tímabundnar</p>
        </section>
      </div>
      {message ? <p role="status" className={s.navigationMessage}>{message}</p> : null}
      <nav className={s.workFooter} aria-label={concept === "a" ? "Fara á milli atriða" : "Fara á milli rýma"}>
        <button className={s.backButton} disabled={concept === "a" ? roomIndex === 0 && itemIndex === 0 : roomIndex === 0} aria-label={concept === "a" ? "Fyrra atriði" : "Fyrra rými"} onClick={() => concept === "a" ? nextItem(-1) : changeRoom(roomIndex - 1)}><ArrowLeft size={19} aria-hidden="true" /><span>{concept === "a" ? "Fyrra" : "Fyrra rými"}</span></button>
        <span>{concept === "a" ? `${itemIndex + 1} / ${room.items.length} í rýminu` : `${stats.recorded} / ${stats.total} skráð`}</span>
        <button className={s.primary} onClick={() => {
          if (concept === "a") nextItem();
          else if (roomIndex < demo.rooms.length - 1) changeRoom(roomIndex + 1);
          else { setView("review"); setReviewFilter("incomplete"); }
        }}>{concept === "a" && itemIndex < room.items.length - 1 ? "Næsta atriði" : roomIndex < demo.rooms.length - 1 ? "Næsta rými" : "Yfirferð"}<ArrowRight size={19} aria-hidden="true" /></button>
      </nav>
    </>}
    <details className={s.scenarios}><summary><RotateCcw size={16} aria-hidden="true" />Prófunarsenur og ný sýnilota</summary><p>Skiptir út svörum í þessari sýnilotu. Snertir engar skýrslur í frumgerðinni.</p><div>{([["opening", "Opna rými"], ["normal", "Í lagi"], ["assessment", "Virkni og þrif"], ["damage", "Frávik með mynd"], ["incomplete", "Ófullskráð atriði"], ["resume", "Endurkoma"]] as const).map(([scenario, label]) => <button key={scenario} onClick={() => loadScenario(scenario)}>{label}</button>)}</div></details>
    {dialog ? <ContextDialog title={dialog === "rooms" ? "Velja rými" : `Ófullskráð atriði (${incomplete.length})`} onClose={() => setDialog(null)}>
      <div className={s.dialogContent}>{dialog === "rooms" ? <ul className={s.reviewList}>{demo.rooms.map((r, index) => <li key={r.id}><button onClick={() => { changeRoom(index); setDialog(null); }} aria-current={r.id === room.id ? "step" : undefined}><span><strong>{index + 1}. {r.name}</strong><span>{roomStats(r).recorded} af {r.items.length} skráð</span></span><ChevronRight size={20} aria-hidden="true" /></button></li>)}</ul> : <><p>Veldu atriði til að halda áfram. Engin svör eru fyllt út sjálfkrafa.</p><ul className={s.reviewList}>{incomplete.map(row => <li key={photoKey(row.position)}><button onClick={() => go(row.position, row.o.condition && row.item.cleanliness && !row.o.cleanliness ? "cleanliness" : "heading")}><span><span className={s.reviewRoom}>{row.room.name}</span><strong>{row.item.name}</strong><span>{missingAnswers(row.item, row.o).join(" · ")}</span></span><ChevronRight size={20} aria-hidden="true" /></button></li>)}</ul>{!incomplete.length ? <p>Öll atriði eru fullskráð. Skoðaðu líka athygli í yfirferð.</p> : null}</>}</div>
    </ContextDialog> : null}
  </div>;
}
