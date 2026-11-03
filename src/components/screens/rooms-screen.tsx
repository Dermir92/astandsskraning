"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Minus, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useReport, MissingReport } from "../report-context";
import { BackLink, FlowFooter, PageHeading, Stepper } from "../ui";
import { makeRoom, type Room, type RoomType } from "@/lib/model";
import { is } from "@/lib/locale/is";
import { SampleSummary } from "./sample-summary";

const roomOptions: RoomType[] = [
  "entry",
  "living",
  "kitchen",
  "bedroom",
  "bathroom",
  "laundry",
  "storage",
  "balcony",
];

function focusAndReveal(target: HTMLElement, context: HTMLElement = target) {
  target.focus({ preventScroll: true });
  context.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  // A long warning may exceed the viewport: keep its focused action reachable too.
  target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
}

export function RoomsScreen() {
  const { report, id, store, state, mode, demoReadOnly } = useReport();
  const [customName, setCustomName] = useState("");
  const [customError, setCustomError] = useState("");
  const [pendingRemove, setPendingRemove] = useState<{ id: string; epoch: number } | null>(null);
  const removalOrigin = useRef<{ trigger: HTMLButtonElement; afterDelete: (HTMLElement | null)[] } | null>(null);
  const returnFocus = useRef<(HTMLElement | null)[] | null>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const cancelRemoval = useRef<HTMLButtonElement>(null);
  const selectedRoomsHeading = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const draftKey = `rooms:${id}:custom-name`;
  useEffect(() => {
    if (mode === "demo") return () => store.setDemoUiDraft(draftKey, "");
  }, [store, draftKey, mode]);
  useLayoutEffect(() => {
    // Only a new, explicit request moves focus. Ownership/save rerenders must not.
    if (pendingRemove && cancelRemoval.current && confirmation.current)
      focusAndReveal(cancelRemoval.current, confirmation.current);
  }, [pendingRemove]);
  useLayoutEffect(() => {
    if (pendingRemove || !returnFocus.current) return;
    const candidates = returnFocus.current;
    returnFocus.current = null;
    const target = candidates.find(element => element?.isConnected &&
      !element.matches(":disabled") && element.getClientRects().length);
    if (target) focusAndReveal(target);
  }, [pendingRemove, report?.rooms]);
  const changeCustomName = (value: string) => {
    setCustomName(value);
    if (mode === "demo") store.setDemoUiDraft(draftKey, value);
  };
  if (state.status === "loading" || !report)
    return <MissingReport loading={state.status === "loading"} />;
  if (report.sampleReviewed || report.assetType !== "apartment")
    return <SampleSummary report={report} />;
  const roomCount = report.rooms.length;
  const addRoom = (type: RoomType) => {
    const name = is.rooms[type];
    const existingNames = new Set(report.rooms.map((r) => r.name));
    let candidate = name;
    let suffix = 1;
    while (existingNames.has(candidate)) candidate = `${name} ${++suffix}`;
    store.updateReport(id, (r) => ({
      ...r,
      rooms: [...r.rooms, makeRoom(type, candidate, undefined, { includeHeating: true })],
    }));
  };
  const closeRemoval = (deleted = false) => {
    const origin = removalOrigin.current;
    returnFocus.current = [
      ...(deleted ? origin?.afterDelete ?? [] : [origin?.trigger ?? null]),
      selectedRoomsHeading.current,
    ];
    removalOrigin.current = null;
    setPendingRemove(null);
  };
  const deleteRoom = (room: Room) => {
    store.removeRoom(id, room.id);
    const deleted = !store.getSnapshot().reports.find(r => r.id === id)?.rooms.some(r => r.id === room.id);
    // Store acceptance may retain a failed-save candidate; it is not a saved acknowledgement.
    if (deleted || pendingRemove) closeRemoval(deleted);
    else removalOrigin.current = null;
  };
  const remove = (room: Room, trigger: HTMLButtonElement, entry: "quantity" | "list") => {
    const index = report.rooms.findIndex(r => r.id === room.id);
    removalOrigin.current = {
      trigger,
      afterDelete: entry === "list"
        ? [report.rooms[index + 1], report.rooms[index - 1]].map(r => r ? document.getElementById(`room-name-${r.id}`) : null)
        : [trigger, trigger.parentElement?.querySelector<HTMLButtonElement>("button:last-of-type") ?? null],
    };
    const hasPhotos = Object.entries(state.photos).some(
      ([key, photos]) => key.startsWith(`${id}:${room.id}:`) && photos.length,
    );
    if (Object.keys(room.observations).length || hasPhotos)
      setPendingRemove({ id: room.id, epoch: store.mutationEpoch });
    else deleteRoom(room);
  };
  const invalidNames = report.rooms.some((r) => !r.name.trim());
  return (
    <>
      <BackLink />
      <Stepper reportId={id} step={1} />
      <PageHeading
        title="Veldu rýmin sem verða skoðuð"
        description="Byrjaðu á tillögunum og aðlagaðu að íbúðinni. Þú getur breytt rýmunum síðar."
      />
      <div className="rooms-layout">
        <section className="panel room-quantities">
          <div className="panel-heading">
            <h2>Rými í íbúðinni</h2>
            <p>Stilltu fjölda hvers rýmis.</p>
          </div>
          <div className="quantity-list">
            {roomOptions.map((type) => {
              const rooms = report.rooms.filter((r) => r.type === type);
              return (
                <div className="quantity-row" key={type}>
                  <span>{is.rooms[type]}</span>
                  <div className="quantity-control">
                    <button
                      className="icon-button"
                      aria-label={`Fækka: ${is.rooms[type]}`}
                      disabled={demoReadOnly || !rooms.length}
                      onClick={event => remove(rooms[rooms.length - 1], event.currentTarget, "quantity")}
                    >
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <span
                      aria-live="polite"
                      aria-label={`${rooms.length} ${is.rooms[type]}`}
                    >
                      {rooms.length}
                    </span>
                    <button
                      className="icon-button"
                      aria-label={`Fjölga: ${is.rooms[type]}`}
                      disabled={demoReadOnly || roomCount >= 50}
                      onClick={() => addRoom(type)}
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            className="custom-room-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!customName.trim()) {
                setCustomError("Skrifaðu heiti sérsniðins rýmis.");
                return;
              }
              const accepted = store.updateReport(id, (r) => ({
                ...r,
                rooms: [...r.rooms, makeRoom("custom", customName.trim(), undefined, { includeHeating: true })],
              }));
              if (accepted) { changeCustomName(""); setCustomError(""); }
            }}
          >
            <label htmlFor="custom-room">Bæta við sérsniðnu rými</label>
            <div>
              <input
                id="custom-room"
                placeholder="T.d. vinnuherbergi"
                value={customName}
                readOnly={demoReadOnly}
                aria-invalid={!!customError}
                aria-describedby={customError ? "custom-room-error" : undefined}
                onChange={(e) => {
                  changeCustomName(e.target.value);
                  setCustomError("");
                }}
              />
              <button
                className="button button-secondary"
                disabled={demoReadOnly || roomCount >= 50}
                type="submit"
              >
                <Plus size={17} aria-hidden="true" />
                <span>Bæta við</span>
              </button>
            </div>
            {demoReadOnly && customName ? <button type="button" className="text-button" onClick={() => changeCustomName("")}>Hætta við óstofnað rýmisheiti</button> : null}
            {customError ? (
              <p className="field-error" id="custom-room-error" role="alert">
                {customError}
              </p>
            ) : null}
            <p className="field-hint">
              Sérsniðið rými fær almenn skoðunaratriði.
            </p>
          </form>
        </section>
        <section className="panel selected-rooms">
          <div className="panel-heading">
            <h2 ref={selectedRoomsHeading} tabIndex={-1}>
              Valin rými <span className="count-pill">{roomCount}</span>
            </h2>
            <p>Breyttu heitum svo þau séu auðþekkjanleg.</p>
          </div>
          {roomCount === 0 ? (
            <p className="no-rooms">
              Engin rými valin. Bættu við rými til að hefja skráningu.
            </p>
          ) : (
            <ol className="selected-room-list">
              {report.rooms.map((room, index) => (
                <li key={room.id}>
                  <div className="selected-room-row">
                    <span className="room-order">{index + 1}</span>
                    <div className="room-name-field">
                      <label
                        className="sr-only"
                        htmlFor={`room-name-${room.id}`}
                      >
                        Heiti rýmis {index + 1}
                      </label>
                      <input
                        id={`room-name-${room.id}`}
                        value={room.name}
                        disabled={demoReadOnly}
                        aria-invalid={!room.name.trim()}
                        aria-describedby={
                          !room.name.trim()
                            ? `room-error-${room.id}`
                            : undefined
                        }
                        onChange={(e) =>
                          store.updateRoom(id, room.id, (r) => ({
                            ...r,
                            name: e.target.value,
                          }))
                        }
                      />
                      <span>{room.items.length} skoðunaratriði</span>
                      {!room.name.trim() ? (
                        <p className="field-error" id={`room-error-${room.id}`}>
                          Rými þarf heiti áður en þú heldur áfram.
                        </p>
                      ) : null}
                    </div>
                    <button
                      className="icon-button remove-room"
                      disabled={demoReadOnly}
                      aria-label={`Fjarlægja ${room.name || `rými ${index + 1}`}`}
                      onClick={event => remove(room, event.currentTarget, "list")}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  {pendingRemove?.id === room.id ? (
                    <div ref={confirmation} className="remove-confirmation" role="group" aria-label={`Fjarlægja ${room.name || `rými ${index + 1}`}`} aria-describedby={`remove-warning-${room.id}`}>
                      <p id={`remove-warning-${room.id}`} role="alert">
                        <TriangleAlert size={16} aria-hidden="true" />
                        Svör og myndaforskoðanir í „{room.name}“ verða fjarlægð.
                      </p>
                      <div>
                        <button
                          className="button button-small button-danger"
                          type="button"
                          disabled={demoReadOnly || pendingRemove.epoch !== store.mutationEpoch}
                          onClick={() => {
                            if (demoReadOnly || pendingRemove.epoch !== store.mutationEpoch) return;
                            deleteRoom(room);
                          }}
                        >
                          Fjarlægja rými
                        </button>
                        <button
                          ref={cancelRemoval}
                          type="button"
                          className="button button-small button-secondary"
                          aria-describedby={`remove-warning-${room.id}${pendingRemove.epoch !== store.mutationEpoch ? ` remove-stale-${room.id}` : ""}`}
                          onClick={() => closeRemoval()}
                        >
                          Hætta við
                        </button>
                      </div>
                      {pendingRemove.epoch !== store.mutationEpoch ? <p id={`remove-stale-${room.id}`} role="status">Breytingaréttur hefur breyst. Hættu við og veldu rýmið aftur til að yfirfara eyðinguna.</p> : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
          <div className="selected-room-total">
            <span>
              {roomCount} rými ·{" "}
              {report.rooms.reduce((sum, r) => sum + r.items.length, 0)}{" "}
              skoðunaratriði
            </span>
          </div>
        </section>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (roomCount && !invalidNames)
            router.push(`/skyrslur/${id}/skraning`);
        }}
      >
        <FlowFooter
          backHref={`/skyrslur/${id}/upplysingar`}
          nextText="Hefja ástandsskráningu"
          disabled={!roomCount || invalidNames}
        />
      </form>
      <p className="small-note">
        <Info size={13} aria-hidden="true" />
        Rýmin birtast í þessari röð. Svör í öðrum rýmum haldast við breytingar.
      </p>
    </>
  );
}
