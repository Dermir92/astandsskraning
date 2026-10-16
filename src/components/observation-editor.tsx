"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  CONDITIONS,
  FUNCTIONALITIES,
  CLEANLINESS,
  EMPTY_OBSERVATION,
  observationComplete,
  needsAttention,
  requiresDamage,
  type ChecklistItem,
  type Observation,
} from "@/lib/model";
import { is } from "@/lib/locale/is";
import { useDemo } from "./demo-provider";
import { Field } from "./form-field";
import { PhotoPreview } from "./photo-preview";
import styles from "./inspection-checklist.module.css";

type Question = "condition" | "functionality" | "cleanliness";

function AnswerGroup<T extends string>({
  label,
  values,
  labels,
  value,
  onChange,
  name,
  conditions = false,
  question,
}: {
  label: string;
  values: T[];
  labels: Record<T, string>;
  value?: T;
  onChange: (value: T) => void;
  name: string;
  conditions?: boolean;
  question: Question;
}) {
  return (
    <fieldset className="answer-group" data-question={question}>
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
  onOpen,
  onClose,
}: {
  item: ChecklistItem;
  observation?: Observation;
  reportId: string;
  roomId: string;
  index: number;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { store, state } = useDemo();
  const fieldPrefix = useId();
  const headingRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const keyboardNavigation = useRef(false);
  const [foldCondition, setFoldCondition] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{
    question: Question;
  } | null>(null);
  const o = observation ?? EMPTY_OBSERVATION;
  const complete = observationComplete(item, o);
  const damage = requiresDamage(o);
  const attention = needsAttention(item, o);
  const deviation = damage || (o.condition !== "na" && o.cleanliness === "dirty");
  const status = !o.condition ? "Óskráð" : !complete ? "Ófullskráð" : "Skráð";
  const flags = [
    deviation && "Frávik",
    complete && attention && "Þarf athygli",
  ].filter(Boolean);
  const rowState = !o.condition
    ? "unanswered"
    : !complete
      ? "incomplete"
      : attention
        ? "attention"
        : deviation
          ? "deviation"
          : "recorded";
  const panelId = `${fieldPrefix}-panel`;
  const change = <K extends keyof Observation>(key: K, value: Observation[K]) =>
    store.updateObservation(reportId, roomId, item.id, { ...o, [key]: value });
  const missingDamage =
    damage &&
    !(o.damageType.trim() && o.location.trim() && o.description.trim());
  const photoKey = `${reportId}:${roomId}:${item.id}`;
  useEffect(() => {
    if (!open || !focusRequest) return;
    const group = panelRef.current?.querySelector<HTMLElement>(
      `[data-question="${focusRequest.question}"]`,
    );
    const target =
      group?.querySelector<HTMLInputElement>("input:checked") ??
      group?.querySelector<HTMLInputElement>(
        focusRequest.question === "condition" ? 'input[value="wear"]' : "input",
      );
    target?.focus({ preventScroll: true });
    // Radios are visually hidden; scroll their group above the room footer.
    group?.scrollIntoView({ block: "nearest" });
  }, [open, focusRequest]);
  const chooseGood = () => {
    change("condition", "good");
    if (
      item.functionality || item.cleanliness || o.note || o.damageType ||
      o.location || o.description || state.photos[photoKey]?.length
    ) {
      setFoldCondition(true);
      setFocusRequest(
        item.functionality && !o.functionality
          ? { question: "functionality" }
          : item.cleanliness && !o.cleanliness
            ? { question: "cleanliness" }
            : null,
      );
      onOpen();
    } else {
      onClose();
    }
  };
  const openAlternatives = () => {
    setFoldCondition(false);
    setFocusRequest({ question: "condition" });
    onOpen();
  };
  const conditions = (
    <AnswerGroup
      label="Ástand"
      question="condition"
      values={CONDITIONS}
      labels={is.conditions}
      value={o.condition}
      onChange={(value) => change("condition", value)}
      name={`${fieldPrefix}-condition`}
      conditions
    />
  );
  return (
    <section
      className={`checklist-item ${open ? "checklist-item-open" : ""}`}
      aria-labelledby={`${fieldPrefix}-title`}
      data-item={item.id}
      data-state={rowState}
      onKeyDownCapture={() => { keyboardNavigation.current = true; }}
      onPointerDownCapture={() => { keyboardNavigation.current = false; }}
    >
      <div className={styles.row}>
      <h3>
        <button
          className="checklist-toggle"
          ref={headingRef}
          id={`${fieldPrefix}-title`}
          onClick={() => {
            setFocusRequest(null);
            setFoldCondition(false);
            onToggle();
          }}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span
            className={`item-completion ${complete && !attention && !deviation ? "item-complete" : ""}`}
          >
            {complete && !attention && !deviation ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{index + 1}</span>
            )}
          </span>
          <span className={styles.rowText}>
            <span className="item-title">{item.name}</span>
            <span
              className={styles.rowStatus}
              data-attention={!!o.condition && (!complete || attention || deviation)}
            >
              {o.condition ? `${is.conditions[o.condition]} · ` : ""}
              {status}{flags.length ? ` · ${flags.join(" · ")}` : ""}
            </span>
          </span>
          {open ? (
            <ChevronUp size={17} aria-hidden="true" />
          ) : (
            <ChevronDown size={17} aria-hidden="true" />
          )}
        </button>
      </h3>
      <div className={styles.rowActions}>
        <button
          className={styles.rowAnswer}
          aria-label={`Í lagi: ${item.name}`}
          aria-pressed={o.condition === "good"}
          disabled={state.status === "loading" || state.status === "read-error"}
          onClick={chooseGood}
        >
          {o.condition === "good" ? <Check size={16} aria-hidden="true" /> : null}
          Í lagi
        </button>
        <button
          className={styles.rowAnswer}
          aria-label={`Annað ástand: ${item.name}`}
          aria-expanded={open && !foldCondition}
          aria-controls={panelId}
          onClick={openAlternatives}
        >
          Annað ástand
        </button>
      </div>
      </div>
      <div
        className="observation-body"
        id={panelId}
        ref={panelRef}
        hidden={!open}
        onFocusCapture={(event) => {
          if (!keyboardNavigation.current) return;
          const target = event.target as HTMLElement;
          const visibleControl = target.closest<HTMLElement>(".answer-option") ?? target;
          const bounds = visibleControl.getBoundingClientRect();
          if (bounds.top < 110 || bounds.bottom > window.innerHeight - 100) {
            visibleControl.scrollIntoView({ block: "center" });
          }
        }}
      >
      {open ? <>
          {foldCondition && o.condition ? (
            <details className={styles.foldedCondition}>
              <summary>
                Ástand <strong>{is.conditions[o.condition]}</strong><span>Breyta</span>
              </summary>
              {conditions}
            </details>
          ) : conditions}
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
                  question="functionality"
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
                  question="cleanliness"
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
            <span role="status">
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
            <button
              className="text-button"
              onClick={() => {
                headingRef.current?.scrollIntoView({ block: "nearest" });
                headingRef.current?.focus({ preventScroll: true });
                setFocusRequest(null);
                onClose();
              }}
            >
              Loka atriði
            </button>
          </div>
      </> : null}
      </div>
    </section>
  );
}
