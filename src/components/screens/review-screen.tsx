"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  MessageSquare,
  Pencil,
  TriangleAlert,
} from "lucide-react";
import { useReport, MissingReport } from "../report-context";
import { BackLink, PageHeading, Progress, Stepper } from "../ui";
import {
  missingDetails,
  needsAttention,
  reportStats,
  reportTitle,
  requiresDamage,
  roomStats,
  EMPTY_OBSERVATION,
} from "@/lib/model";
import { is } from "@/lib/locale/is";
import { SampleSummary } from "./sample-summary";
import { SaveStatus } from "../app-shell";
import { useReviewNavigation } from "../use-inspection-navigation";
import { inspectionHref, itemProgress, missingAnswers, navigationTargetId } from "@/lib/inspection-navigation";
import styles from "../inspection-checklist.module.css";
import { EvidenceGallery, RetainedDefectDetails } from "../evidence-gallery";
import { hasRetainedDefect } from "@/lib/inspection-evidence";
import evidenceStyles from "../evidence.module.css";

export function ReviewScreen() {
  const { report, id, state } = useReport();
  const navigation = useReviewNavigation(state.status === "loading" ? undefined : report);
  if (state.status === "loading" || !report)
    return <MissingReport loading={state.status === "loading"} />;
  if (report.sampleReviewed || report.assetType !== "apartment")
    return <SampleSummary report={report} />;
  const stats = reportStats(report);
  const missing = missingDetails(report.details);
  const unnamedRooms = report.rooms.filter((r) => !r.name.trim());
  const missingOverviews = report.rooms.filter(
    (r) => !state.photos[`${id}:${r.id}:overview`]?.length,
  );
  const photos = Object.entries(state.photos)
    .filter(([key]) => key.startsWith(`${id}:`))
    .reduce((sum, [, p]) => sum + p.length, 0);
  const roomHref = (roomId: string) =>
    inspectionHref(id, { roomId, itemId: null }, { roomId, itemId: null });
  const missingDamagePhotos = report.rooms.reduce(
    (sum, r) =>
      sum +
      r.items.filter(
        (i) =>
          requiresDamage(r.observations[i.id]) &&
          !state.photos[`${id}:${r.id}:${i.id}`]?.length,
      ).length,
    0,
  );
  const hasAttention =
    missing.length ||
    stats.attention ||
    missingOverviews.length ||
    missingDamagePhotos ||
    !report.rooms.length ||
    unnamedRooms.length;
  return (
    <div className={evidenceStyles.review}>
      <BackLink />
      <Stepper reportId={id} step={3} />
      <PageHeading
        eyebrow={reportTitle(report)}
        title="Yfirferð skráningar"
        description="Skoðaðu það sem hefur verið skráð og það sem vantar. Drögin eru áfram breytanleg."
      />
      <div
        className={`review-state ${hasAttention ? "review-state-attention" : "review-state-ready"}`}
      >
        {hasAttention ? (
          <TriangleAlert size={22} aria-hidden="true" />
        ) : (
          <ClipboardCheck size={22} aria-hidden="true" />
        )}
        <div>
          <h2>
            {hasAttention
              ? "Nokkur atriði þarfnast yfirferðar"
              : "Skráning hefur verið yfirfarin í sýniham"}
          </h2>
          <p>
            {hasAttention
              ? "Þú getur haldið áfram með drög og bætt við upplýsingum þegar þær liggja fyrir."
              : "Öllum svörum og myndaforskoðunum hefur verið bætt við. Drögin haldast opin."}
          </p>
        </div>
        <span className="draft-tag">DRÖG</span>
      </div>
      <div className="review-summary">
        <div>
          <strong>{report.rooms.length}</strong>
          <span>rými</span>
        </div>
        <div>
          <strong>
            {stats.recorded}
            <span> / {stats.total}</span>
          </strong>
          <span>atriði skráð</span>
        </div>
        <div>
          <strong>{stats.unanswered}</strong>
          <span>ástand vantar</span>
        </div>
        <div>
          <strong>{stats.deviations}</strong>
          <span>frávik</span>
        </div>
        <div>
          <strong>{photos}</strong>
          <span>myndaforskoðanir</span>
        </div>
      </div>
      <div className="review-layout">
        <div className="review-main">
          <section className="panel review-property">
            <div className="panel-heading">
              <h2>Upplýsingar um íbúð</h2>
              <Link className="text-link" href={`/skyrslur/${id}/upplysingar`}>
                <Pencil size={14} aria-hidden="true" />
                Breyta
              </Link>
            </div>
            <dl className="property-details">
              <div>
                <dt>Heimilisfang</dt>
                <dd>
                  {report.details.address || "Óskráð"}
                  {report.details.postalCode || report.details.municipality ? (
                    <span>
                      {report.details.postalCode} {report.details.municipality}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt>Tegund skráningar</dt>
                <dd>
                  {report.details.inspectionType
                    ? is.inspectionTypes[report.details.inspectionType]
                    : "Óskráð"}
                </dd>
              </div>
              <div>
                <dt>Íbúð / hæð</dt>
                <dd>{report.details.unit || "Ekki tilgreint"}</dd>
              </div>
              <div>
                <dt>Hlutverk stofnanda</dt>
                <dd>
                  {report.details.role
                    ? is.roles[report.details.role]
                    : "Óskráð"}
                </dd>
              </div>
              <div>
                <dt>Afhending</dt>
                <dd>{report.details.deliveryDate || "Óskráð"}</dd>
              </div>
              <div>
                <dt>Húsgögn</dt>
                <dd>
                  {
                    {
                      yes: "Fylgja",
                      no: "Fylgja ekki",
                      partly: "Fylgja að hluta",
                      "": "Óskráð",
                    }[report.details.furnished]
                  }
                </dd>
              </div>
            </dl>
            {report.details.notes ? (
              <div className="review-general-note">
                <MessageSquare size={16} aria-hidden="true" />
                <p>{report.details.notes}</p>
              </div>
            ) : null}
          </section>
          <section
            className="review-rooms"
            aria-labelledby="review-rooms-title"
          >
            <div className="section-heading">
              <h2 id="review-rooms-title" tabIndex={-1}>Rými og niðurstöður</h2>
              <Link className="text-link" href={`/skyrslur/${id}/rymi`}>
                Breyta rýmum
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            {report.rooms.map((room) => {
              const s = roomStats(room);
              const flagged = room.items.filter((item) => {
                const o = room.observations[item.id];
                return (
                  requiresDamage(o) ||
                  hasRetainedDefect(o) ||
                  state.photos[`${id}:${room.id}:${item.id}`]?.length ||
                  o?.note ||
                  (o?.condition !== "na" && o?.cleanliness === "dirty") ||
                  (o?.condition && needsAttention(item, o))
                );
              });
              return (
                <section className="panel review-room" key={room.id}>
                  <div className="review-room-heading">
                    <div>
                      <h3 id={navigationTargetId("review", room.id)} tabIndex={-1}>{room.name || "Ónefnt rými"}</h3>
                      <p>
                        {s.recorded} af {s.total} atriðum skráð · {s.attention}{" "}
                        þarfnast athygli
                      </p>
                    </div>
                    <Link
                      href={roomHref(room.id)}
                      onNavigate={() => navigation.leave({ roomId: room.id, itemId: null })}
                      className="button button-secondary button-small"
                      aria-label={`Breyta skráningu: ${room.name || "Ónefnt rými"}`}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Breyta
                    </Link>
                  </div>
                  <Progress
                    value={s.recorded}
                    max={s.total}
                    label={`Framvinda í ${room.name}`}
                  />
                  {flagged.length ? (
                    <ul className="review-observations">
                      {flagged.map((item) => {
                        const o = room.observations[item.id] ?? EMPTY_OBSERVATION;
                        return (
                          <li key={item.id} data-evidence-item={item.id}>
                            <div className="review-observation-heading">
                              <Link className={styles.reviewItemLink} href={navigation.itemHref({ roomId: room.id, itemId: item.id })} onNavigate={() => navigation.leave({ roomId: room.id, itemId: item.id })}><strong>{item.name}</strong></Link>
                              <span
                                className={`item-condition text-condition-${o.condition}`}
                              >
                                {o.condition
                                  ? is.conditions[o.condition]
                                  : "Óskráð"}
                              </span>
                            </div>
                            {o.functionality && o.condition !== "na" ? (
                              <p className="review-answer">
                                Virkni: {is.functionality[o.functionality]}
                              </p>
                            ) : null}
                            {o.cleanliness && o.condition !== "na" ? (
                              <p className="review-answer">
                                Þrif: {is.cleanliness[o.cleanliness]}
                              </p>
                            ) : null}
                            {requiresDamage(o) ? (
                              <>
                                <p>
                                  {o.damageType || "Tegund vantar"} ·{" "}
                                  {o.location || "Staðsetning vantar"}
                                </p>
                                <p>
                                  {o.description || "Lýsing á fráviki vantar."}
                                </p>
                                {!state.photos[`${id}:${room.id}:${item.id}`]
                                  ?.length ? (
                                  <span className="review-missing">
                                    <Camera size={13} aria-hidden="true" />
                                    Mynd af fráviki vantar
                                  </span>
                                ) : null}
                              </>
                            ) : null}
                            {o.note ? (
                              <div className="review-note"><strong>Athugasemd við atriði</strong><p>{o.note}</p></div>
                            ) : null}
                            <RetainedDefectDetails observation={o} />
                            <EvidenceGallery photos={state.photos[`${id}:${room.id}:${item.id}`] ?? []} context={`${room.name || "Ónefnt rými"} · ${item.name}`} />
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {room.items.length ? (
                    <details className={`unanswered-details ${styles.itemIndex}`}>
                      <summary>
                        Skoðunaratriði ({s.total}) · {s.total - s.recorded} ófullskráð
                      </summary>
                      <ul className={styles.navigationItems}>
                        {room.items.map(item => {
                          const o = room.observations[item.id];
                          const progress = itemProgress(item, o);
                          const position = { roomId: room.id, itemId: item.id };
                          return <li key={item.id}><Link id={navigationTargetId("review", room.id, item.id)} href={navigation.itemHref(position)} onNavigate={() => navigation.leave(position)}>
                            <strong>{item.name}</strong>
                            <span>{progress === "unanswered" ? "Ósvarað" : progress === "partial" ? "Ófullskráð" : needsAttention(item, o) ? "Skráð · Þarf athygli" : "Skráð"}{progress !== "recorded" ? ` · ${missingAnswers(item, o).map(reason => reason.label).join(" · ")}` : ""}</span>
                          </Link></li>;
                        })}
                      </ul>
                    </details>
                  ) : null}
                  {!state.photos[`${id}:${room.id}:overview`]?.length ? (
                    <p className="review-missing overview-missing">
                      <Camera size={14} aria-hidden="true" />
                      Yfirlitsmynd rýmis vantar
                    </p>
                  ) : (
                    <p className="review-photo-count">
                      <Check size={14} aria-hidden="true" />
                      {state.photos[`${id}:${room.id}:overview`].length}{" "}
                      yfirlitsmyndir í tímabundinni forskoðun
                    </p>
                  )}
                  <EvidenceGallery photos={state.photos[`${id}:${room.id}:overview`] ?? []} context={`${room.name || "Ónefnt rými"} · Yfirlitsmyndir rýmis`} />
                </section>
              );
            })}
          </section>
        </div>
        <aside
          className="review-attention panel"
          aria-labelledby="attention-title"
        >
          <h2 id="attention-title">Til að yfirfara</h2>
          {missing.length ? (
            <div className="attention-group">
              <h3>Grunnupplýsingar vantar</h3>
              <ul>
                {missing.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
              <Link className="text-link" href={`/skyrslur/${id}/upplysingar`}>
                Fylla út upplýsingar
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          ) : null}
          {!report.rooms.length || unnamedRooms.length ? (
            <div className="attention-group">
              <h3>
                {!report.rooms.length
                  ? "Engin rými valin"
                  : "Heiti rýma vantar"}
              </h3>
              <Link className="text-link" href={`/skyrslur/${id}/rymi`}>
                Breyta rýmum
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          ) : null}
          {stats.attention ? (
            <div className="attention-group">
              <h3>{stats.attention} atriði þarfnast athygli</h3>
              <p>
                Ófullgerð svör, óskoðuð atriði eða búnaður sem hefur ekki verið
                prófaður.
              </p>
              <ul className="attention-room-links">
                {report.rooms
                  .filter((r) => roomStats(r).attention)
                  .map((r) => (
                    <li key={r.id}>
                      <Link href={roomHref(r.id)} onNavigate={() => navigation.leave({ roomId: r.id, itemId: null })}>
                        {r.name || "Ónefnt rými"}
                        <span>
                          {roomStats(r).attention}
                          <ArrowRight size={13} aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
          {missingOverviews.length || missingDamagePhotos ? (
            <div className="attention-group">
              <h3>Myndir vantar</h3>
              <p>
                {missingOverviews.length} rými án yfirlitsmyndar
                {missingDamagePhotos
                  ? ` · ${missingDamagePhotos} frávik án myndar`
                  : ""}
                .
              </p>
              <p className="field-hint">
                Myndir eru aðeins forskoðaðar í þessari setu og hverfa við
                endurhleðslu.
              </p>
            </div>
          ) : null}
          {!hasAttention ? (
            <p className="attention-complete">
              <Check size={18} aria-hidden="true" />
              Ekkert óskráð í þessari setu.
            </p>
          ) : null}
          <div className="review-scope">
            <h3>Drög í sýniham</h3>
            <p>
              Enginn óafturkræfur frágangur eða boð eru virk. Þú getur áfram
              breytt skráningunni.
            </p>
          </div>
        </aside>
      </div>
      <div className="review-footer">
        <Link
          className="button button-secondary"
          href={`/skyrslur/${id}/skraning`}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Aftur í skráningu
        </Link>
        <Link className="button button-primary" href="/">
          Fara í mínar skýrslur
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <div className="local-save">
        <SaveStatus />
      </div>
    </div>
  );
}
