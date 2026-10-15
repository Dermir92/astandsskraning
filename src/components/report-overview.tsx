"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useDemo } from "./demo-provider";
import { Badge, Progress } from "./ui";
import {
  formatDate,
  missingDetails,
  reportStats,
  reportStatus,
  reportTitle,
  requiresDamage,
  roomStats,
  type Report,
} from "@/lib/model";
import { is } from "@/lib/locale/is";

export function reportHref(report: Report) {
  if (report.sampleReviewed || report.assetType !== "apartment")
    return `/skyrslur/${report.id}/yfirferd`;
  return `/skyrslur/${report.id}/${reportStatus(report) === "active" ? "skraning" : "upplysingar"}`;
}

export function reportAction(report: Report) {
  return report.sampleReviewed || report.assetType !== "apartment"
    ? "Skoða sýniskýrslu"
    : reportStatus(report) === "active"
      ? "Halda áfram"
      : "Opna drög";
}

export function reportLocation(report: Report) {
  return report.details.address
    ? `${report.details.postalCode} ${report.details.municipality}${report.details.unit ? ` · ${report.details.unit}` : ""}`.trim()
    : report.subtitle;
}

export function ReportOverview({ report }: { report: Report }) {
  const { state } = useDemo();
  const sample = report.sampleReviewed || report.assetType !== "apartment";
  const stats = reportStats(report);
  const missing = missingDetails(report.details);
  const roomHref = (id: string) =>
    `/skyrslur/${report.id}/skraning?rymi=${encodeURIComponent(id)}`;
  const deviations = report.rooms.flatMap((room) =>
    room.items
      .filter((item) => {
        const observation = room.observations[item.id];
        return (
          requiresDamage(observation) ||
          (observation?.condition !== "na" &&
            observation?.cleanliness === "dirty")
        );
      })
      .map((item) => ({ room, item, observation: room.observations[item.id] })),
  );
  const missingOverviews = report.rooms.filter(
    (room) => !state.photos[`${report.id}:${room.id}:overview`]?.length,
  ).length;
  const previewedDeviations = deviations.slice(0, 2);
  const missingDamagePhotos = deviations.filter(
    ({ room, item, observation }) =>
      requiresDamage(observation) &&
      !state.photos[`${report.id}:${room.id}:${item.id}`]?.length,
  ).length;
  const actions = (
    <div className="context-actions">
      <Link className="button button-primary" href={reportHref(report)}>
        {reportAction(report)}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
      {!sample ? (
        <Link className="text-link" href={`/skyrslur/${report.id}/yfirferd`}>
          Yfirferð skráningar
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );

  return (
    <div className="report-overview">
      <p className="context-kicker">VALIN SKÝRSLA</p>
      <h2>{reportTitle(report)}</h2>
      <p className="context-location">
        {reportLocation(report) || "Staðsetning óskráð"}
      </p>
      <div className="context-status">
        <Badge status={reportStatus(report)} />
        <span>
          {sample
            ? "Sýnifærsla"
            : report.details.inspectionType
              ? is.inspectionTypes[report.details.inspectionType]
              : "Tegund óskráð"}
        </span>
      </div>
      {sample ? (
        <>
          <div className="context-section">
            <p>
              Tilbúin sýnifærsla. Enginn atriðalisti eða staðfest niðurstaða
              fylgir; þetta er ekki endanleg skýrsla.
            </p>
            <dl className="context-definition">
              <div>
                <dt>Eignategund</dt>
                <dd>{is.assets[report.assetType]}</dd>
              </div>
              <div>
                <dt>Síðast breytt</dt>
                <dd>{formatDate(report.updatedAt)}</dd>
              </div>
            </dl>
          </div>
          {actions}
        </>
      ) : (
        <>
          <div className="context-progress">
            {stats.total ? (
              <>
                <div>
                  <strong>
                    {stats.recorded} af {stats.total} atriðum skráð
                  </strong>
                  <span>
                    {Math.round((stats.recorded / stats.total) * 100)}%
                  </span>
                </div>
                <Progress
                  value={stats.recorded}
                  max={stats.total}
                  label={`Framvinda: ${reportTitle(report)}`}
                />
                <p>
                  {stats.unanswered} ósvarað · {stats.deviations} frávik
                </p>
              </>
            ) : (
              <p>
                {report.rooms.length
                  ? "Atriðalisti vantar í valin rými."
                  : "Engin rými valin."}
              </p>
            )}
          </div>
          {actions}
          <div className="context-section">
            <h3>Til að yfirfara</h3>
            <ul className="context-missing">
              {missing.length ? (
                <li>
                  <Link href={`/skyrslur/${report.id}/upplysingar`}>
                    {missing.length} grunnupplýsingar vantar
                  </Link>
                </li>
              ) : null}
              {stats.attention ? (
                <li>
                  {stats.attention} atriði með ófullgerð eða óstaðfest svör
                </li>
              ) : null}
              {!report.rooms.length || !stats.total ? (
                <li>
                  <Link href={`/skyrslur/${report.id}/rymi`}>
                    Velja rými og atriðalista
                  </Link>
                </li>
              ) : null}
              {report.rooms.some((room) => !room.name.trim()) ? (
                <li>
                  <Link href={`/skyrslur/${report.id}/rymi`}>
                    Heiti rýma vantar
                  </Link>
                </li>
              ) : null}
              {missingOverviews ? (
                <li>{missingOverviews} rými án yfirlitsmyndar</li>
              ) : null}
              {missingDamagePhotos ? (
                <li>{missingDamagePhotos} frávik án myndar</li>
              ) : null}
            </ul>
            {!missing.length &&
            !stats.attention &&
            stats.total > 0 &&
            !missingOverviews &&
            !missingDamagePhotos &&
            report.rooms.every((room) => room.name.trim()) ? (
              <p>Svör og myndaforskoðanir til staðar. Drögin haldast opin.</p>
            ) : null}
          </div>
          {report.rooms.length ? (
            <div className="context-section">
              <div className="context-section-heading">
                <h3>Rými skráningar</h3>
                <span>{report.rooms.length} rými</span>
              </div>
              <ul className="context-rooms">
                {report.rooms.map((room) => {
                  const roomProgress = roomStats(room);
                  return (
                    <li key={room.id}>
                      <Link href={roomHref(room.id)}>
                        <span>{room.name || "Ónefnt rými"}</span>
                        <span>
                          {roomProgress.total
                            ? `${roomProgress.recorded}/${roomProgress.total} skráð`
                            : "Engin atriði"}
                          {roomProgress.deviations ? (
                            <span className="context-deviation-count">
                              {" "}
                              · {roomProgress.deviations} frávik
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {deviations.length ? (
            <div className="context-section">
              <div className="context-section-heading">
                <h3>Skráð frávik</h3>
                <span>
                  Sýnir {previewedDeviations.length} af {deviations.length}
                </span>
              </div>
              <ul className="context-deviations">
                {previewedDeviations.map(({ room, item, observation }) => (
                  <li key={`${room.id}:${item.id}`}>
                    <Link href={roomHref(room.id)}>
                      {room.name || "Ónefnt rými"} · {item.name}
                    </Link>
                    <p>
                      {observation.description ||
                        observation.note ||
                        (requiresDamage(observation)
                          ? "Lýsing á fráviki vantar."
                          : "Þarfnast þrifa.")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
      {!sample ? (
        <p className="context-footnote">
          Skráð atriði jafngilda ekki góðu ástandi. Myndir eru tímabundnar
          forskoðanir.
        </p>
      ) : null}
    </div>
  );
}
