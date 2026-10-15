"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
  observationComplete,
  type Report,
  type Room,
} from "@/lib/model";
import { SaveStatus } from "../app-shell";
import { ObservationEditor } from "../observation-editor";
import { PhotoPreview } from "../photo-preview";
import { SampleSummary } from "./sample-summary";

function RoomInspection({ report, room }: { report: Report; room: Room }) {
  const [openItem, setOpenItem] = useState<string | null>(
    () =>
      room.items.find((i) => !observationComplete(i, room.observations[i.id]))
        ?.id ??
      room.items[0]?.id ??
      null,
  );
  const stats = roomStats(room);
  return (
    <div className="room-inspection">
      <div className="room-heading">
        <div>
          <p className="eyebrow">
            RÝMI {report.rooms.indexOf(room) + 1} AF {report.rooms.length}
          </p>
          <h2>{room.name}</h2>
        </div>
        <span className="room-heading-count">
          {stats.recorded}
          <span> / {stats.total} skráð</span>
        </span>
      </div>
      <Progress
        value={stats.recorded}
        max={stats.total}
        label={`Skráð atriði í ${room.name}`}
      />
      <PhotoPreview photoKey={`${report.id}:${room.id}:overview`} />
      <div className="checklist-heading">
        <h3>Skoðunaratriði</h3>
        <span>{stats.unanswered} ósvarað</span>
      </div>
      <div className="checklist">
        {room.items.map((item, index) => (
          <ObservationEditor
            key={item.id}
            item={item}
            observation={room.observations[item.id]}
            reportId={report.id}
            roomId={room.id}
            index={index}
            open={openItem === item.id}
            onToggle={() =>
              setOpenItem((current) => (current === item.id ? null : item.id))
            }
          />
        ))}
      </div>
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
  const params = useSearchParams();
  const router = useRouter();
  const [initialRoomId] = useState(
    () =>
      (
        report.rooms.find((r) => roomStats(r).recorded < r.items.length) ??
        report.rooms[0]
      )?.id,
  );
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
  const room =
    report.rooms.find((r) => r.id === params.get("rymi")) ??
    report.rooms.find((r) => r.id === initialRoomId) ??
    report.rooms[0];
  const currentIndex = report.rooms.indexOf(room);
  const stats = reportStats(report);
  const roomHref = (roomId: string) =>
    `/skyrslur/${id}/skraning?rymi=${encodeURIComponent(roomId)}`;
  return (
    <div className="inspection-page">
      <BackLink />
      <Stepper reportId={id} step={2} />
      <PageHeading
        eyebrow={reportTitle(report)}
        title="Ástandsskráning"
        description="Skoðaðu eitt rými í einu. Þú getur breytt öllum svörum síðar."
        action={
          <Link
            className="button button-secondary"
            href={`/skyrslur/${id}/yfirferd`}
          >
            <ClipboardCheck size={17} aria-hidden="true" />
            Yfirferð
          </Link>
        }
      />
      <div className="inspection-overall">
        <div>
          <ListChecks size={17} aria-hidden="true" />
          <strong>
            {stats.recorded} af {stats.total}
          </strong>
          <span>atriðum skráð</span>
        </div>
        <SaveStatus />
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
              onChange={(e) => router.push(roomHref(e.target.value))}
            >
              {report.rooms.map((r, index) => (
                <option value={r.id} key={r.id}>
                  {index + 1}. {r.name || "Ónefnt rými"} (
                  {roomStats(r).recorded}/{r.items.length})
                </option>
              ))}
            </select>
          </div>
          <RoomInspection key={room.id} report={report} room={room} />
          <nav className="inspection-footer" aria-label="Fara á milli rýma">
            {currentIndex > 0 ? (
              <Link
                className="button button-secondary"
                href={roomHref(report.rooms[currentIndex - 1].id)}
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
              >
                Næsta rými
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                className="button button-primary"
                href={`/skyrslur/${id}/yfirferd`}
              >
                Yfirferð
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
