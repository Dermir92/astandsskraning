"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Pencil,
  TriangleAlert,
} from "lucide-react";
import { useReport, MissingReport } from "../report-context";
import { stepPaths } from "../ui";
import {
  reportStats,
  reportTitle,
  roomStats,
  type Report,
  type Room,
} from "@/lib/model";
import { ObservationEditor } from "../observation-editor";
import { PhotoPreview } from "../photo-preview";
import { SampleSummary } from "./sample-summary";
import styles from "../inspection-checklist.module.css";
import ui from "../inspection-screen.module.css";
import { is } from "@/lib/locale/is";
import { inspectionSectionStatus } from "../inspection-section-status";
import { useInspectionSections, type InspectionSection } from "../use-inspection-sections";
import { useInspectionNavigation } from "../use-inspection-navigation";
import { inspectionItems, itemProgress, missingAnswers, navigationTargetId, nextIncomplete, type InspectionPosition } from "@/lib/inspection-navigation";
import { observationComplete } from "@/lib/model";
import { FireObservationFields } from "../fire-observation-fields";
import { useFireCorrection } from "../use-fire-correction";
import { HeatingObservationEditor } from "../heating-observation";
import { MeterReadingFields } from "../meter-readings";
import { useMeterCorrection } from "../use-meter-correction";
import { PreviousInspectionAnswer } from "../inspection-comparison";

function RoomInspection({ report, room, navigation }: { report: Report; room: Room; navigation: ReturnType<typeof useInspectionNavigation> }) {
  const { store, state } = useReport();
  const openItem = navigation.itemId;
  const stats = roomStats(room);
  const unanswered = room.items.filter(item => itemProgress(item, room.observations[item.id]) === "unanswered").length;
  const nextPosition = openItem ? nextIncomplete(report, { roomId: room.id, itemId: openItem }) : null;
  return (
    <div className="room-inspection">
      <div className="room-heading">
        <p className="eyebrow">RÝMI {report.rooms.indexOf(room) + 1} AF {report.rooms.length}</p>
        <div className={ui.roomArrows} aria-label="Flýtileiðir milli rýma">
          <button type="button" aria-label="Fyrra rými" disabled={report.rooms.indexOf(room) === 0} onClick={() => navigation.activate({ roomId: report.rooms[report.rooms.indexOf(room) - 1].id, itemId: null }, false, true)}><ArrowLeft size={18} aria-hidden="true" /></button>
          <button type="button" aria-label="Næsta rými" disabled={report.rooms.indexOf(room) === report.rooms.length - 1} onClick={() => navigation.activate({ roomId: report.rooms[report.rooms.indexOf(room) + 1].id, itemId: null }, false, true)}><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
        <div className={ui.roomChoice}>
          <h2 id={navigationTargetId("inspection", room.id)} tabIndex={-1}>{room.name || "Ónefnt rými"}<ChevronDown size={18} aria-hidden="true" /></h2>
          <label htmlFor="current-room" className="sr-only">Velja rými</label>
          <select id="current-room" value={room.id} onChange={e => navigation.activate({ roomId: e.target.value, itemId: null }, false, true)}>
            {report.rooms.map(r => <option key={r.id} value={r.id}>{r.name || "Ónefnt rými"}</option>)}
          </select>
        </div>
        <p className={ui.roomStatus}>{stats.recorded} af {stats.total} skráð{unanswered ? ` · ${unanswered} ósvarað` : ""}{stats.total - stats.recorded - unanswered ? ` · ${stats.total - stats.recorded - unanswered} ófullskráð` : ""}{stats.deviations ? ` · ${stats.deviations} frávik` : ""}</p>
      </div>
      <h3 className="sr-only">Skoðunaratriði</h3>
      <div className="checklist">
        {room.items.map((item, index) => {
          const Editor = item.kind === "space_heating" ? HeatingObservationEditor : ObservationEditor;
          return <Editor
            key={item.id}
            item={item}
            observation={room.observations[item.id]}
            reportId={report.id}
            roomId={room.id}
            roomName={room.name || "Ónefnt rými"}
            index={index}
            open={openItem === item.id}
            reference={report.linkedInitial && openItem === item.id ? <PreviousInspectionAnswer report={report} roomId={room.id} itemId={item.id} /> : null}
            onActivate={() => navigation.activate({ roomId: room.id, itemId: item.id }, openItem === item.id)}
            onToggle={() => navigation.activate({ roomId: room.id, itemId: item.id }, openItem !== item.id)}
            onOpen={() => navigation.activate({ roomId: room.id, itemId: item.id }, true)}
            onClose={navigation.close}
            nextAction={openItem === item.id ? nextPosition ? (
              <button className="text-button" onClick={() => navigation.activate(nextPosition, true, true)}>
                Næsta ófullskráða atriði<ArrowRight size={14} aria-hidden="true" />
              </button>
            ) : (
              <span>{observationComplete(item, room.observations[item.id]) ? "Öll skoðunaratriði eru fullskráð" : "Þetta er eina ófullskráða atriðið"}</span>
            ) : null}
          />
        })}
      </div>
      {!room.items.some(i => i.kind === "space_heating") ? <button type="button" className="text-button" disabled={state.status === "loading" || state.status === "read-error" || room.items.length >= 100} onClick={() => { const itemId = store.addHeating(report.id, room.id); if (itemId) navigation.activate({ roomId: room.id, itemId }, true, true); }}>Bæta við hitaskráningu</button> : null}
      <details className={styles.roomPhotos}>
        <summary><Camera size={18} aria-hidden="true" />Yfirlitsmyndir rýmis</summary>
        <PhotoPreview photoKey={`${report.id}:${room.id}:overview`} context={`${room.name || "Ónefnt rými"} · Yfirlitsmyndir rýmis`} />
      </details>
    </div>
  );
}
export function InspectionScreen() {
  const { report, id, state } = useReport();
  if (state.status === "loading" || !report)
    return <MissingReport loading={state.status === "loading"} />;
  if (report.sampleReviewed || report.assetType !== "apartment")
    return <SampleSummary report={report} />;
  return <InspectionBody key={id} report={report} />;
}
function InspectionBody({ report }: { report: Report }) {
  const { id } = report;
  const { state } = useReport();
  const root = useRef<HTMLDivElement>(null);
  const fireCorrection = useFireCorrection(report, state.status !== "loading");
  const meterCorrection = useMeterCorrection(report.id, state.status !== "loading");
  const propertyCorrection = fireCorrection.active || meterCorrection.active;
  const navigation = useInspectionNavigation(report, state.status !== "read-error", propertyCorrection);
  const sections = useInspectionSections(root, navigation.ready);
  const { room } = navigation;
  if (!navigation.ready) return <p role="status">Hleð staðsetningu…</p>;
  const currentIndex = room ? report.rooms.indexOf(room) : -1;
  const returnHref = fireCorrection.active ? fireCorrection.reviewHref : meterCorrection.active ? meterCorrection.reviewHref : navigation.returnHref;
  const fromReview = fireCorrection.active ? fireCorrection.fromReview : meterCorrection.active || navigation.fromReview;
  const stats = reportStats(report);
  const status = inspectionSectionStatus(report.details);
  const incomplete = inspectionItems(report).filter(row => itemProgress(row.item, row.observation) !== "recorded");
  const closeSummary = () => { const list = document.querySelector<HTMLDetailsElement>(".inspection-overall details"); if (list) list.open = false; };
  const go = (position: InspectionPosition) => (event: { preventDefault: () => void }) => {
    event.preventDefault(); closeSummary(); navigation.activate(position, position.itemId !== null, true);
  };
  const openSection = (section: InspectionSection) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); closeSummary(); sections.open(section);
  };
  const returnRoom = (event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); sections.returnToRoom(); };
  const reviewLink = <Link className={ui.review} href={returnHref} replace={fromReview} onNavigate={propertyCorrection ? undefined : navigation.returnToReview}>{fromReview ? "Aftur í yfirferð" : "Yfirferð"}<ArrowRight size={16} aria-hidden="true" /></Link>;
  return (
    <div ref={root} className={`inspection-page ${styles.page} ${ui.page}`}>
      <header className={ui.property}>
        <Link className={ui.reportsLink} href="/" aria-label="Mínar skýrslur"><ArrowLeft size={18} aria-hidden="true" /></Link>
        <div className={ui.identity}><h1>{reportTitle(report)}</h1><p>{report.details.inspectionType ? is.inspectionTypes[report.details.inspectionType] : "Tegund óskráð"}{report.details.unit ? ` · ${report.details.unit}` : ""}</p></div>
        {reviewLink}
      </header>
      <nav className={ui.steps} aria-label="Skref skráningar">{is.steps.map((label, index) => <Link key={label} href={`/skyrslur/${id}/${stepPaths[index]}`} aria-current={index === 2 ? "step" : undefined}>{index + 1} {label}</Link>)}</nav>
      {navigation.notice ? <p className={styles.navigationNotice} role="status">{navigation.notice}</p> : null}
      {navigation.unavailable ? <p className={styles.navigationNotice} role="status">Ekki tókst að muna staðsetningu milli heimsókna. Vistunarstaða draga er sýnd efst.</p> : null}
      <div className="inspection-overall">
        <details className={ui.overall}>
          <summary><span><strong>{stats.recorded} af {stats.total}</strong> rýmisatriðum skráð</span><span>{incomplete.length} eftir<ChevronDown size={16} aria-hidden="true" /></span></summary>
          <div className={ui.overallBody}>
            <p>Talningin nær aðeins til rýmisatriða. Fullskráð frávik er áfram frávik. Upplýsingar, myndir og takmarkanir geta enn þarfnast yfirferðar.</p>
            {incomplete.length ? report.rooms.map(r => {
              const rows = incomplete.filter(row => row.room.id === r.id);
              return rows.length ? <div key={r.id}><h3>{r.name || "Ónefnt rými"}</h3><ul className={styles.navigationItems}>
                {rows.map(({ item, observation, position }) => <li key={item.id}><Link href={navigation.itemHref(position)} replace scroll={false} onNavigate={go(position)}><strong>{item.name}</strong><span>{itemProgress(item, observation) === "unanswered" ? "Ósvarað" : "Ófullskráð"} · {missingAnswers(item, observation).map(reason => reason.label).join(" · ")}</span></Link></li>)}
              </ul></div> : null;
            }) : <p>Öll rýmisatriði eru fullskráð. Það staðfestir ekki að allri yfirferð eignarinnar sé lokið.</p>}
            <div className={ui.sectionStatus}><a href="#fire-safety" onClick={openSection("fire-safety")}><strong>Brunavarnir · {status.fire.short}</strong></a><p>{status.fire.context}</p><ul>{status.fire.details.map(text => <li key={text}>{text}</li>)}</ul></div>
            <div className={ui.sectionStatus}><a href="#meter-readings" onClick={openSection("meter-readings")}><strong>Mælastöður · {status.meters.short}</strong></a><p>{status.meters.context}</p><ul>{status.meters.details.map(text => <li key={text}>{text}</li>)}</ul></div>
          </div>
        </details>
      </div>
      {fromReview ? <p className={ui.correction}>Leiðrétting úr yfirferð</p> : null}
      <nav className={ui.sections} data-inspection-sections aria-label="Hlutar skráningar">
        <a href="#inspection-room" aria-current={sections.active === "inspection-room" ? "location" : undefined} onClick={openSection("inspection-room")}><strong>Rými</strong><span>{incomplete.length} atriði eftir</span></a>
        <a href="#fire-safety" aria-current={sections.active === "fire-safety" ? "location" : undefined} onClick={openSection("fire-safety")}><strong>Brunavarnir</strong><span>{status.fire.short}</span></a>
        <a href="#meter-readings" aria-current={sections.active === "meter-readings" ? "location" : undefined} onClick={openSection("meter-readings")}><strong>Mælar</strong><span>{status.meters.short}</span></a>
      </nav>
      <section id="inspection-room" tabIndex={-1} aria-label="Skráning rýmis">
        {room ? <div className="inspection-layout">
          <aside className="room-sidebar" aria-label="Rými skráningar">
            <div className="room-sidebar-heading"><h2>Rými</h2><Link href={`/skyrslur/${id}/rymi`} aria-label="Breyta rýmum" className="icon-button"><Pencil size={15} aria-hidden="true" /></Link></div>
            <nav aria-label="Velja rými"><ol>{report.rooms.map((r, index) => {
              const s = roomStats(r);
              return <li key={r.id}><Link href={navigation.roomHref(r.id)} replace scroll={false} onNavigate={go({ roomId: r.id, itemId: null })} className={r.id === room.id ? "room-link-active" : ""} aria-current={r.id === room.id ? "page" : undefined}>
                <span className="room-link-number">{s.recorded === s.total && s.attention === 0 ? <Check size={15} aria-hidden="true" /> : index + 1}</span>
                <span className="room-link-text"><strong>{r.name || "Ónefnt rými"}</strong><span>{s.recorded} / {s.total} skráð{s.deviations ? ` · ${s.deviations} frávik` : ""}</span></span>
                {s.deviations ? <TriangleAlert className="room-deviation-icon" size={14} aria-label="Skráð frávik" /> : null}
              </Link></li>;
            })}</ol></nav>
            <div className="room-sidebar-note">Ekkert atriði er sjálfkrafa merkt „Í lagi“.</div>
          </aside>
          <div className="inspection-main">
            <RoomInspection key={room.id} report={report} room={room} navigation={navigation} />
            <nav className="inspection-footer" aria-label="Fara á milli rýma">
              {currentIndex > 0 ? <Link className="button button-secondary" href={navigation.roomHref(report.rooms[currentIndex - 1].id)} replace scroll={false} onNavigate={go({ roomId: report.rooms[currentIndex - 1].id, itemId: null })}><ArrowLeft size={17} aria-hidden="true" />Fyrra rými</Link> : <Link className="button button-secondary" href={`/skyrslur/${id}/rymi`}><ArrowLeft size={17} aria-hidden="true" />Rými</Link>}
              <span className="room-nav-count">{currentIndex + 1} / {report.rooms.length}</span>
              {currentIndex < report.rooms.length - 1 ? <Link className="button button-primary" href={navigation.roomHref(report.rooms[currentIndex + 1].id)} replace scroll={false} onNavigate={go({ roomId: report.rooms[currentIndex + 1].id, itemId: null })}>Næsta rými<ArrowRight size={17} aria-hidden="true" /></Link> : <Link className="button button-primary" href={returnHref} replace={fromReview} onNavigate={propertyCorrection ? undefined : navigation.returnToReview}>{fromReview ? "Aftur í yfirferð" : "Yfirferð"}<ArrowRight size={17} aria-hidden="true" /></Link>}
            </nav>
          </div>
        </div> : <section className="panel form-panel"><h2>Veldu fyrst rými</h2><p>Skráning rýma þarf að innihalda að minnsta kosti eitt rými. Brunavarnir má skrá hér óháð rýmum.</p><Link className="button button-primary" href={`/skyrslur/${id}/rymi`}>Velja rými<ArrowRight size={17} aria-hidden="true" /></Link></section>}
      </section>
      <div className={room ? ui.propertySections : ""}>
        <div className={ui.propertySection}><FireObservationFields report={report} correction={fireCorrection} />{room ? <a className={ui.return} href="#inspection-room" onClick={returnRoom}>Aftur í rými · {room.name || "Ónefnt rými"}<ArrowLeft size={16} aria-hidden="true" /></a> : null}</div>
        <div className={ui.propertySection}><MeterReadingFields report={report} invalidCorrection={meterCorrection.active && !meterCorrection.valid} />{room ? <a className={ui.return} href="#inspection-room" onClick={returnRoom}>Aftur í rými · {room.name || "Ónefnt rými"}<ArrowLeft size={16} aria-hidden="true" /></a> : null}</div>
      </div>
    </div>
  );
}
