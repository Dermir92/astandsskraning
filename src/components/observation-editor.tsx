"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  TriangleAlert,
} from "lucide-react";
import { useId } from "react";
import {
  CONDITIONS,
  FUNCTIONALITIES,
  CLEANLINESS,
  EMPTY_OBSERVATION,
  observationComplete,
  requiresDamage,
  type ChecklistItem,
  type Observation,
} from "@/lib/model";
import { is } from "@/lib/locale/is";
import { useDemo } from "./demo-provider";
import { Field } from "./form-field";
import { PhotoPreview } from "./photo-preview";

function AnswerGroup<T extends string>({
  label,
  values,
  labels,
  value,
  onChange,
  name,
  conditions = false,
}: {
  label: string;
  values: T[];
  labels: Record<T, string>;
  value?: T;
  onChange: (value: T) => void;
  name: string;
  conditions?: boolean;
}) {
  return (
    <fieldset className="answer-group">
      <legend>{label}</legend>
      <div className={conditions ? "condition-options" : "answer-options"}>
        {values.map((option) => (
          <label
            key={option}
            className={`answer-option ${conditions ? `condition-${option}` : ""} ${value === option ? "answer-selected" : ""}`}
          >
            <input
              type="radio"
              name={name}
              checked={value === option}
              onChange={() => onChange(option)}
              value={option}
            />
            <span>
              {conditions ? (
                <span className="answer-indicator" aria-hidden="true">
                  {value === option ? <Check size={12} /> : null}
                </span>
              ) : null}
              {labels[option]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function ObservationEditor({
  item,
  observation,
  reportId,
  roomId,
  index,
  open,
  onToggle,
}: {
  item: ChecklistItem;
  observation?: Observation;
  reportId: string;
  roomId: string;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const { store, state } = useDemo();
  const fieldPrefix = useId();
  const o = observation ?? EMPTY_OBSERVATION;
  const complete = observationComplete(item, o);
  const damage = requiresDamage(o);
  const panelId = `${fieldPrefix}-panel`;
  const change = <K extends keyof Observation>(key: K, value: Observation[K]) =>
    store.updateObservation(reportId, roomId, item.id, { ...o, [key]: value });
  const missingDamage =
    damage &&
    !(o.damageType.trim() && o.location.trim() && o.description.trim());
  const photoKey = `${reportId}:${roomId}:${item.id}`;
  return (
    <section className={`checklist-item ${open ? "checklist-item-open" : ""}`}>
      <h3>
        <button
          className="checklist-toggle"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span
            className={`item-completion ${complete ? "item-complete" : ""}`}
          >
            {complete ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{index + 1}</span>
            )}
          </span>
          <span className="item-title">{item.name}</span>
          <span
            className={`item-condition ${o.condition ? `text-condition-${o.condition}` : "item-unanswered"}`}
          >
            {o.condition ? is.conditions[o.condition] : "Óskráð"}
          </span>
          {open ? (
            <ChevronUp size={17} aria-hidden="true" />
          ) : (
            <ChevronDown size={17} aria-hidden="true" />
          )}
        </button>
      </h3>
      {open ? (
        <div className="observation-body" id={panelId}>
          <AnswerGroup
            label="Ástand"
            values={CONDITIONS}
            labels={is.conditions}
            value={o.condition}
            onChange={(value) => change("condition", value)}
            name={`${fieldPrefix}-condition`}
            conditions
          />
          <p className="condition-hint">
            {o.condition
              ? is.conditionHelp[o.condition]
              : "Veldu ástand eftir skoðun. Ekkert svar er valið sjálfkrafa."}
          </p>
          {o.condition !== "na" ? (
            <div className="secondary-answers">
              {item.functionality ? (
                <AnswerGroup
                  label="Virkni"
                  values={FUNCTIONALITIES}
                  labels={is.functionality}
                  value={o.functionality}
                  onChange={(value) => change("functionality", value)}
                  name={`${fieldPrefix}-functionality`}
                />
              ) : null}
              {item.cleanliness ? (
                <AnswerGroup
                  label="Þrif"
                  values={CLEANLINESS}
                  labels={is.cleanliness}
                  value={o.cleanliness}
                  onChange={(value) => change("cleanliness", value)}
                  name={`${fieldPrefix}-cleanliness`}
                />
              ) : null}
            </div>
          ) : (
            <div className="not-applicable-note">
              <Circle size={14} aria-hidden="true" />
              Virkni og þrif eru ekki krafa þegar atriðið á ekki við.
            </div>
          )}
          {damage ? (
            <div className="damage-fields">
              <div className="damage-heading">
                <TriangleAlert size={17} aria-hidden="true" />
                <h4>Lýsing á fráviki</h4>
              </div>
              <div className="form-grid">
                <Field
                  id={`${fieldPrefix}-damage-type`}
                  label="Tegund skemmdar / galla"
                >
                  <select
                    id={`${fieldPrefix}-damage-type`}
                    value={o.damageType}
                    onChange={(e) => change("damageType", e.target.value)}
                  >
                    <option value="">Veldu tegund</option>
                    {[
                      "Rispa",
                      "Slit",
                      "Brot",
                      "Dæld",
                      "Raki / leki",
                      "Óvirkur búnaður",
                      "Annað",
                    ].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={`${fieldPrefix}-location`} label="Staðsetning">
                  <input
                    id={`${fieldPrefix}-location`}
                    value={o.location}
                    onChange={(e) => change("location", e.target.value)}
                    placeholder="T.d. við dyrakarm"
                  />
                </Field>
                <Field
                  id={`${fieldPrefix}-description`}
                  label="Lýsing"
                  className="field-full"
                >
                  <textarea
                    id={`${fieldPrefix}-description`}
                    rows={3}
                    value={o.description}
                    onChange={(e) => change("description", e.target.value)}
                    placeholder="Lýstu því sem sést, stærð og umfangi."
                  />
                </Field>
              </div>
              {missingDamage ? (
                <p className="damage-draft-note">
                  Drög eru leyfð. Tegund, staðsetning og lýsing vantar að hluta.
                </p>
              ) : null}
              <PhotoPreview
                photoKey={photoKey}
                title="Myndir af fráviki"
                detail
              />
              {!state.photos[photoKey]?.length ? (
                <p className="missing-photo">
                  <TriangleAlert size={14} aria-hidden="true" />
                  Mynd af fráviki vantar. Atriðið má áfram vera í drögum.
                </p>
              ) : null}
            </div>
          ) : null}
          <Field id={`${fieldPrefix}-note`} label="Athugasemd" optional>
            <textarea
              id={`${fieldPrefix}-note`}
              rows={2}
              value={o.note}
              onChange={(e) => change("note", e.target.value)}
              placeholder="Bættu við samhengi ef þörf er á."
            />
          </Field>
          <div className="observation-footer">
            <span>
              {complete ? (
                <>
                  <Check size={14} aria-hidden="true" />
                  Svör skráð
                </>
              ) : (
                "Atriðið er enn ófullskráð"
              )}
            </span>
            {observation ? (
              <button
                className="text-button"
                onClick={() =>
                  store.updateObservation(reportId, roomId, item.id, {
                    ...EMPTY_OBSERVATION,
                  })
                }
              >
                Hreinsa svör
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
