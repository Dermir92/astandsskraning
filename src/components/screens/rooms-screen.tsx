"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, Minus, Plus, Trash2, TriangleAlert } from "lucide-react";
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
export function RoomsScreen() {
  const { report, id, store, state, mode, demoReadOnly } = useReport();
  const [customName, setCustomName] = useState("");
  const [customError, setCustomError] = useState("");
  const [pendingRemove, setPendingRemove] = useState<{ id: string; epoch: number } | null>(null);
  const router = useRouter();
  const draftKey = `rooms:${id}:custom-name`;
  useEffect(() => {
    if (mode === "demo") return () => store.setDemoUiDraft(draftKey, "");
  }, [store, draftKey, mode]);
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
  const remove = (room: Room) => {
    const hasPhotos = Object.entries(state.photos).some(
      ([key, photos]) => key.startsWith(`${id}:${room.id}:`) && photos.length,
    );
    if (Object.keys(room.observations).length || hasPhotos)
      setPendingRemove({ id: room.id, epoch: store.mutationEpoch });
    else store.removeRoom(id, room.id);
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
                      onClick={() => remove(rooms[rooms.length - 1])}
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
            <h2>
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
                      onClick={() => remove(room)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  {pendingRemove?.id === room.id ? (
                    <div className="remove-confirmation" role="alert">
                      <p>
                        <TriangleAlert size={16} aria-hidden="true" />
                        Svör og myndaforskoðanir í „{room.name}“ verða fjarlægð.
                      </p>
                      <div>
                        <button
                          className="button button-small button-danger"
                          disabled={demoReadOnly || pendingRemove.epoch !== store.mutationEpoch}
                          onClick={() => {
                            if (pendingRemove.epoch !== store.mutationEpoch) return;
                            store.removeRoom(id, room.id);
                            setPendingRemove(null);
                          }}
                        >
                          Fjarlægja rými
                        </button>
                        <button
                          className="button button-small button-secondary"
                          onClick={() => setPendingRemove(null)}
                        >
                          Hætta við
                        </button>
                      </div>
                      {pendingRemove.epoch !== store.mutationEpoch ? <p role="status">Breytingaréttur hefur breyst. Hættu við og veldu rýmið aftur til að yfirfara eyðinguna.</p> : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
          <div className="selected-room-total">
            <Check size={16} aria-hidden="true" />
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
