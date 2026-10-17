"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  ListChecks,
  Pencil,
  TriangleAlert,
} from "lucide-react";
import { useReport, MissingReport } from "../report-context";
import { BackLink, PageHeading, Progress, Stepper } from "../ui";
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
import { useInspectionNavigation } from "../use-inspection-navigation";
import { inspectionItems, itemProgress, missingAnswers, navigationTargetId, nextIncomplete, type InspectionPosition } from "@/lib/inspection-navigation";
import { observationComplete } from "@/lib/model";

function RoomInspection({ report, room, navigation }: { report: Report; room: Room; navigation: ReturnType<typeof useInspectionNavigation> }) {
  const openItem = navigation.itemId;
  const stats = roomStats(room);
  const unanswered = room.items.filter(item => itemProgress(item, room.observations[item.id]) === "unanswered").length;
  const nextPosition = openItem ? nextIncomplete(report, { roomId: room.id, itemId: openItem }) : null;
  return (
    <div className="room-inspection">
      <div className="room-heading">
        <div>
          <p className="eyebrow">
            RÝMI {report.rooms.indexOf(room) + 1} AF {report.rooms.length}
          </p>
          <h2 id={navigationTargetId("inspection", room.id)} tabIndex={-1}>{room.name}</h2>
        </div>
        <div className={styles.roomProgress}>
          <span>{stats.recorded} af {stats.total} skráð</span>
          <Progress value={stats.recorded} max={stats.total} label={`Skráð atriði í ${room.name}`} />
        </div>
      </div>
      <div className="checklist-heading">
        <h3>Skoðunaratriði</h3>
        <span>{unanswered} ósvarað · {stats.total - stats.recorded - unanswered} ófullskráð</span>
      </div>
      <div className="checklist">
        {room.items.map((item, index) => (
          <ObservationEditor
            key={item.id}
            item={item}
            observation={room.observations[item.id]}
            reportId={report.id}
            roomId={room.id}
            roomName={room.name || "Ónefnt rými"}
            index={index}
            open={openItem === item.id}
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
        ))}
      </div>
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
  const navigation = useInspectionNavigation(report, state.status !== "read-error");
  const { room } = navigation;
  if (!navigation.ready) return <p role="status">Hleð staðsetningu…</p>;
  if (!report.rooms.length)
    return (
      <>
        <BackLink />
        <Stepper reportId={id} step={2} />
        <PageHeading
          title="Veldu fyrst rými"
          description="Skráning þarf að innihalda að minnsta kosti eitt rými."
        />
        <Link className="button button-primary" href={`/skyrslur/${id}/rymi`}>
          Velja rými
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </>
    );
  if (!room) return null;
  const currentIndex = report.rooms.indexOf(room);
  const stats = reportStats(report);
  const roomHref = navigation.roomHref;
  const incomplete = inspectionItems(report).filter(row => !observationComplete(row.item, row.observation));
  const go = (position: InspectionPosition) => (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const list = document.querySelector<HTMLDetailsElement>(".inspection-overall details");
    if (list) list.open = false;
    navigation.activate(position, position.itemId !== null, true);
  };
  return (
    <div className={`inspection-page ${styles.page}`}>
      <BackLink />
      <Stepper reportId={id} step={2} />
      <PageHeading
        eyebrow={reportTitle(report)}
        title="Ástandsskráning"
        description="Skoðaðu eitt rými í einu. Þú getur breytt öllum svörum síðar."
        action={
          <Link
            className="button button-secondary"
            href={navigation.returnHref}
            replace={navigation.fromReview}
            onNavigate={navigation.returnToReview}
          >
            <ClipboardCheck size={17} aria-hidden="true" />
            {navigation.fromReview ? "Aftur í yfirferð" : "Yfirferð"}
          </Link>
        }
      />
      {navigation.notice ? <p className={styles.navigationNotice} role="status">{navigation.notice}</p> : null}
      {navigation.unavailable ? <p className={styles.navigationNotice} role="status">Ekki tókst að muna staðsetningu milli heimsókna. Vistunarstaða draga er sýnd efst.</p> : null}
      <div className="inspection-overall">
        <div>
          <ListChecks size={17} aria-hidden="true" />
          <strong>
            {stats.recorded} af {stats.total}
          </strong>
          <span>atriðum skráð</span>
        </div>
        <details className={styles.incompleteList}>
          <summary>Ófullskráð atriði ({incomplete.length})</summary>
          {incomplete.length ? report.rooms.map(r => {
            const rows = incomplete.filter(row => row.room.id === r.id);
            return rows.length ? <div key={r.id}><h3>{r.name || "Ónefnt rými"}</h3><ul className={styles.navigationItems}>
              {rows.map(({ item, observation, position }) => <li key={item.id}><Link href={navigation.itemHref(position)} replace scroll={false} onNavigate={go(position)}>
                <strong>{item.name}</strong><span>{itemProgress(item, observation) === "unanswered" ? "Ósvarað" : "Ófullskráð"} · {missingAnswers(item, observation).map(reason => reason.label).join(" · ")}</span>
              </Link></li>)}
            </ul></div> : null;
          }) : <p>Öll skoðunaratriði eru fullskráð. Athugasemdir í yfirferð geta enn átt við.</p>}
        </details>
      </div>
      <div className="inspection-layout">
        <aside className="room-sidebar" aria-label="Rými skráningar">
          <div className="room-sidebar-heading">
            <h2>Rými</h2>
            <Link
              href={`/skyrslur/${id}/rymi`}
              aria-label="Breyta rýmum"
              className="icon-button"
            >
              <Pencil size={15} aria-hidden="true" />
            </Link>
          </div>
          <nav aria-label="Velja rými">
            <ol>
              {report.rooms.map((r, index) => {
                const s = roomStats(r);
                return (
                  <li key={r.id}>
                    <Link
                      href={roomHref(r.id)}
                      replace scroll={false} onNavigate={go({ roomId: r.id, itemId: null })}
                      className={r.id === room.id ? "room-link-active" : ""}
                      aria-current={r.id === room.id ? "page" : undefined}
                    >
                      <span className="room-link-number">
                        {s.recorded === s.total && s.attention === 0 ? (
                          <Check size={15} aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="room-link-text">
                        <strong>{r.name || "Ónefnt rými"}</strong>
                        <span>
                          {s.recorded} / {s.total} skráð
                          {s.deviations ? ` · ${s.deviations} frávik` : ""}
                        </span>
                      </span>
                      {s.deviations ? (
                        <TriangleAlert
                          className="room-deviation-icon"
                          size={14}
                          aria-label="Skráð frávik"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="room-sidebar-note">
            Ekkert atriði er sjálfkrafa merkt „Í lagi“.
          </div>
        </aside>
        <div className="inspection-main">
          <div className="mobile-room-select">
            <label htmlFor="current-room">Velja rými</label>
            <select
              id="current-room"
              value={room.id}
              onChange={(e) => navigation.activate({ roomId: e.target.value, itemId: null }, false, true)}
            >
              {report.rooms.map((r, index) => (
                <option value={r.id} key={r.id}>
                  {index + 1}. {r.name || "Ónefnt rými"} (
                  {roomStats(r).recorded}/{r.items.length})
                </option>
              ))}
            </select>
          </div>
          <RoomInspection key={room.id} report={report} room={room} navigation={navigation} />
          <nav className="inspection-footer" aria-label="Fara á milli rýma">
            {currentIndex > 0 ? (
              <Link
                className="button button-secondary"
                href={roomHref(report.rooms[currentIndex - 1].id)}
                replace scroll={false} onNavigate={go({ roomId: report.rooms[currentIndex - 1].id, itemId: null })}
              >
                <ArrowLeft size={17} aria-hidden="true" />
                <span>Fyrra rými</span>
              </Link>
            ) : (
              <Link
                className="button button-secondary"
                href={`/skyrslur/${id}/rymi`}
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Rými
              </Link>
            )}
            <span className="room-nav-count">
              {currentIndex + 1} / {report.rooms.length}
            </span>
            {currentIndex < report.rooms.length - 1 ? (
              <Link
                className="button button-primary"
                href={roomHref(report.rooms[currentIndex + 1].id)}
                replace scroll={false} onNavigate={go({ roomId: report.rooms[currentIndex + 1].id, itemId: null })}
              >
                Næsta rými
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                className="button button-primary"
                href={navigation.returnHref}
                replace={navigation.fromReview} onNavigate={navigation.returnToReview}
              >
                {navigation.fromReview ? "Aftur í yfirferð" : "Yfirferð"}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
