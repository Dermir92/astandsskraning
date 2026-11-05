"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { itemProgress, missingAnswers, navigationTargetId, photoTargetId } from "@/lib/inspection-navigation";
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
import { RetainedDefectDetails } from "./evidence-gallery";
import { hasRetainedDefect } from "@/lib/inspection-evidence";
import { ContextDialog } from "./context-dialog";
import { prepareAssessmentChange, type AssessmentChange } from "./assessment-change";
import styles from "./inspection-checklist.module.css";
import stofa from "./stofa-inspection.module.css";

type Question = "condition" | "functionality" | "cleanliness";
const answerLabels: Record<Question, Record<string, string>> = {
  condition: is.conditions,
  functionality: is.functionality,
  cleanliness: is.cleanliness,
};

function AnswerGroup<T extends string>({
  label,
  values,
  labels,
  value,
  onChange,
  name,
  conditions = false,
  question,
  disabled = false,
}: {
  label: string;
  values: T[];
  labels: Record<T, string>;
  value?: T;
  onChange: (value: T) => void;
  name: string;
  conditions?: boolean;
  question: Question;
  disabled?: boolean;
}) {
  return (
    <fieldset className="answer-group" data-question={question} tabIndex={-1} aria-disabled={disabled || undefined}>
      <legend>{label}</legend>
      <div className={conditions ? "condition-options" : "answer-options"}>
        {values.map((option) => (
          <label
            key={option}
            className={`answer-option ${conditions ? `condition-${option}` : ""} ${value === option ? "answer-selected" : ""}`}
          >
            <input
              type="radio"
              disabled={disabled}
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
  roomName,
  index,
  open,
  onToggle,
  onOpen,
  onClose,
  onActivate,
  nextAction,
  reference,
  photoFirst = false,
}: {
  item: ChecklistItem;
  observation?: Observation;
  reportId: string;
  roomId: string;
  roomName: string;
  index: number;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onClose: () => void;
  onActivate: () => void;
  nextAction: ReactNode;
  reference?: ReactNode;
  photoFirst?: boolean;
}) {
  const { store, state, demoReadOnly } = useDemo();
  const coordinationLocked = demoReadOnly;
  const fieldPrefix = useId();
  const headingRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const keyboardNavigation = useRef(false);
  const [foldCondition, setFoldCondition] = useState(false);
  const transactions = useRef<{ pending?: AssessmentChange; undo?: AssessmentChange }>({});
  const [confirmation, setConfirmation] = useState<{ from: string; to: string; clear?: boolean; epoch: number } | null>(null);
  const [message, setMessage] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [editDefect, setEditDefect] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    setConfirmation(null);
    if (!open) setEditDefect(false);
  }
  useEffect(() => () => {
    transactions.current.pending?.dispose();
    transactions.current.pending = undefined;
  }, [open]);
  useEffect(() => () => {
    transactions.current.pending?.dispose();
    transactions.current.undo?.dispose();
  }, []);
  const [focusRequest, setFocusRequest] = useState<{
    question: Question;
  } | null>(null);
  const o = observation ?? EMPTY_OBSERVATION;
  const complete = observationComplete(item, o);
  const [showAssessment, setShowAssessment] = useState(photoFirst ? false : !complete);
  const [initialSimpleOpen] = useState(!observation?.condition);
  const damage = requiresDamage(o);
  const attention = needsAttention(item, o);
  const deviation = damage || (o.condition !== "na" && o.cleanliness === "dirty");
  const simpleCondition = o.condition === "damaged" || o.condition === "defect" ? "Frávik" : o.condition ? is.conditions[o.condition] : "Ósvarað";
  const progress = itemProgress(item, o);
  const missingDetailed = photoFirst ? missingAnswers(item, o).filter(
    (answer): answer is { key: "functionality" | "cleanliness"; label: string } => answer.key === "functionality" || answer.key === "cleanliness",
  ) : [];
  const status = progress === "unanswered" ? "Ósvarað" : !complete ? "Ófullskráð" : "Fullskráð";
  const flags = [
    deviation && "Frávik",
    complete && attention && "Þarf athygli",
  ].filter(Boolean);
  const rowState = progress === "unanswered"
    ? "unanswered"
    : !complete
      ? "incomplete"
      : attention
        ? "attention"
        : deviation
          ? "deviation"
          : "recorded";
  const panelId = `${fieldPrefix}-panel`;
  const target = { reportId, roomId, itemId: item.id };
  const labels = (key: Question, value: Observation[Question]) => value ? answerLabels[key][value] : "Ósvarað";
  const change = <K extends keyof Observation>(key: K, value: Observation[K]) => {
    const transaction = prepareAssessmentChange(store, target, { [key]: value });
    if (!transaction) return;
    const live = store.getSnapshot().reports.find(r => r.id === reportId)?.rooms.find(r => r.id === roomId)?.observations[item.id] ?? EMPTY_OBSERVATION;
    const changesDefect = (key === "condition" && (live.condition === "damaged" || live.condition === "defect" || (value === "na" && (live.functionality === "broken" || live.cleanliness === "dirty")))) ||
      (key === "functionality" && live.functionality === "broken") || (key === "cleanliness" && live.cleanliness === "dirty");
    if (changesDefect) {
      transactions.current.pending?.dispose();
      transactions.current.pending = transaction;
      setConfirmation({ from: labels(key as Question, live[key] as Observation[Question]), to: labels(key as Question, value as Observation[Question]), epoch: store.mutationEpoch });
    } else {
      const unusedUndo = transaction.apply();
      unusedUndo?.dispose();
    }
  };
  const cancelChange = () => {
    transactions.current.pending?.dispose();
    transactions.current.pending = undefined;
    setConfirmation(null);
  };
  const missingDamage =
    damage &&
    !(o.damageType.trim() && o.location.trim() && o.description.trim());
  const photoKey = `${reportId}:${roomId}:${item.id}`;
  useEffect(() => {
    if (!open || !focusRequest) return;
    const group = panelRef.current?.querySelector<HTMLElement>(
      `[data-question="${focusRequest.question}"]`,
    );
    if (photoFirst) {
      group?.focus({ preventScroll: true });
      group?.scrollIntoView({ block: "nearest" });
      return;
    }
    const target =
      group?.querySelector<HTMLInputElement>("input:checked") ??
      group?.querySelector<HTMLInputElement>(
        focusRequest.question === "condition" ? 'input[value="wear"]' : "input",
      );
    target?.focus({ preventScroll: true });
    // Radios are visually hidden; scroll their group above the room footer.
    group?.scrollIntoView({ block: "nearest" });
  }, [open, focusRequest, photoFirst]);
  const chooseGood = () => {
    onActivate();
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
  const conditions = (
    <AnswerGroup
      label="Ástand"
      question="condition"
      disabled={coordinationLocked}
      values={CONDITIONS}
      labels={is.conditions}
      value={o.condition}
      onChange={(value) => change("condition", value)}
      name={`${fieldPrefix}-condition`}
      conditions
    />
  );
  const assessment = (
    <details className={styles.assessment} open={photoFirst ? showAssessment : !complete || showAssessment} onToggle={event => { if (photoFirst) setShowAssessment(event.currentTarget.open); }}>
          <summary hidden={!photoFirst && !complete} onClick={event => { event.preventDefault(); setShowAssessment(value => !value); }}>
            <span>{photoFirst ? "Ítarlegt mat · " : "Ástand "}<strong>{o.condition ? is.conditions[o.condition] : "Ósvarað"}</strong>{o.condition !== "na" && item.functionality ? ` · Virkni: ${o.functionality ? is.functionality[o.functionality] : "Ósvarað"}` : ""}{o.condition !== "na" && item.cleanliness ? ` · Þrif: ${o.cleanliness ? is.cleanliness[o.cleanliness] : "Ósvarað"}` : ""}</span><span>Breyta mati</span>
          </summary>
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
          {photoFirst ? <p className="field-hint">Ástand segir ekki til um virkni eða þrif. Fyrri svör haldast óbreytt þar til þú breytir þeim.</p> : null}
          {o.condition !== "na" ? (
            <div className="secondary-answers">
              {item.functionality ? (
                <AnswerGroup
                  label="Virkni"
                  question="functionality"
                  disabled={coordinationLocked}
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
                  disabled={coordinationLocked}
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
          </details>
  );
  return (
    <section
      className={`checklist-item ${styles.ordinary} ${open ? "checklist-item-open" : ""}`}
      aria-labelledby={`${fieldPrefix}-title`}
      data-item={item.id}
      id={navigationTargetId("inspection", roomId, item.id)}
      tabIndex={-1}
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
          data-navigation-heading
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
              <span aria-hidden="true">{progress === "unanswered" ? null : index + 1}</span>
            )}
          </span>
          <span className={styles.rowText}>
            <span className="item-title">{item.name}</span>
            <span
              className={styles.rowStatus}
              data-attention={!!o.condition && (!complete || attention || deviation)}
            >
              {photoFirst ? <>{`${simpleCondition}${deviation && simpleCondition !== "Frávik" ? " · Frávik" : ""}${o.condition && !complete ? " · Ófullskráð" : complete && attention && o.condition !== "uninspected" ? " · Takmörkun" : ""}`}
                {hasRetainedDefect(o) ? <span className={stofa.retainedIndicator}>Varðveitt frávikslýsing</span> : null}
              </> : <>{o.condition ? `${is.conditions[o.condition]} · ` : ""}
              {status}{flags.length ? ` · ${flags.join(" · ")}` : ""}
              {state.photos[photoKey]?.length ? ` · ${state.photos[photoKey].length} ${state.photos[photoKey].length === 1 ? "mynd" : "myndir"}` : ""}
              {o.note.trim() ? " · Athugasemd" : ""}
              {hasRetainedDefect(o) ? " · Varðveitt frávikslýsing" : ""}</>}
            </span>
          </span>
          {open ? (
            <ChevronUp size={17} aria-hidden="true" />
          ) : (
            <ChevronDown size={17} aria-hidden="true" />
          )}
        </button>
      </h3>
      {progress === "unanswered" && !photoFirst ? <div className={styles.rowActions}>
        <button
          className={styles.rowAnswer}
          aria-label={`Ástand í lagi: ${item.name}`}
          aria-pressed={o.condition === "good"}
          disabled={demoReadOnly || state.status === "loading" || state.status === "read-error"}
          onClick={chooseGood}
        >
          <Plus size={16} aria-hidden="true" />
          Ástand í lagi
        </button>
      </div> : null}
      {missingDetailed.length ? <div className={stofa.missingAssessments} role="group" aria-label="Ósvarað ítarlegt mat">
        <span>Til fullskráningar:</span>
        {missingDetailed.map(answer => <button type="button" key={answer.key} className="text-button" aria-controls={panelId} onClick={() => {
          setShowAssessment(true);
          setFocusRequest({ question: answer.key });
          onOpen();
        }}>{answer.label}</button>)}
      </div> : null}
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
          <div className={styles.editorHeading}><span>{roomName} · atriði {index + 1}</span><h4>{item.name}</h4><p>{status}{deviation ? " · Frávik" : attention ? " · Þarf athygli" : ""}</p></div>
          {reference}
          {photoFirst ? <details className={stofa.simpleAssessment} open={initialSimpleOpen || undefined}>
            <summary>Ástand · {simpleCondition}<span>Breyta</span></summary>
            <AnswerGroup
            label="Ástand" question="condition" disabled={coordinationLocked}
            values={["good", "defect", "na", "uninspected"]}
            labels={{ good: "Í lagi", defect: "Frávik", na: "Á ekki við", uninspected: "Ekki skoðað", wear: "Slit" }}
            value={o.condition === "damaged" ? "defect" : o.condition}
            onChange={value => { if (value !== "defect" || (o.condition !== "damaged" && o.condition !== "defect")) change("condition", value); }}
            name={`${fieldPrefix}-simple-condition`} conditions
          /></details> : null}
          {message ? <div className={styles.undoMessage} role="status"><p>{message}</p>{canUndo ? <button className="text-button" disabled={coordinationLocked} onClick={() => {
            const redo = transactions.current.undo?.apply();
            redo?.dispose();
            transactions.current.undo = undefined;
            setCanUndo(false);
            setMessage(redo ? "Breyting afturkölluð. Önnur gögn eru varðveitt." : "Matið hefur breyst eða er læst. Ekki var hægt að afturkalla; skoðaðu núverandi svör.");
            headingRef.current?.focus({ preventScroll: true });
          }}>Afturkalla breytingu</button> : null}</div> : null}
          {!photoFirst ? assessment : null}
          {damage && (!complete || editDefect) ? (
            <div className="damage-fields" tabIndex={-1} role="group" aria-labelledby={`${fieldPrefix}-damage-title`}
              // Keep the active editor mounted when its last required field becomes valid.
              onFocusCapture={() => setEditDefect(true)}>
              <div className="damage-heading">
                <TriangleAlert size={17} aria-hidden="true" />
                <h4 id={`${fieldPrefix}-damage-title`}>Lýsing á fráviki</h4>
              </div>
              <div className="form-grid">
                {photoFirst ? <Field id={`${fieldPrefix}-description`} label="Lýsing á fráviki" className="field-full"><textarea id={`${fieldPrefix}-description`} disabled={coordinationLocked} rows={3} value={o.description} onChange={e => change("description", e.target.value)} placeholder="Hvað sést og hvar? Stutt lýsing nægir." /></Field> : null}
                <details className={photoFirst ? `field-full ${stofa.supporting}` : "field-full"} open={photoFirst ? undefined : true}>
                <summary hidden={!photoFirst}>Tegund og staðsetning{!o.damageType.trim() || !o.location.trim() ? " · Vantar" : ` · ${o.damageType}, ${o.location}`}</summary>
                <div className="form-grid">
                <Field
                  id={`${fieldPrefix}-damage-type`}
                  label="Tegund skemmdar / galla"
                >
                  <select
                    id={`${fieldPrefix}-damage-type`}
                    disabled={coordinationLocked}
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
                    disabled={coordinationLocked}
                    value={o.location}
                    onChange={(e) => change("location", e.target.value)}
                    placeholder="T.d. við dyrakarm"
                  />
                </Field>
                </div>
                </details>
                {photoFirst ? <p className={`field-hint field-full ${stofa.validationNote}`}>Fullskráning krefst lýsingar, tegundar og staðsetningar. Tímabundin mynd kemur ekki í stað þeirra.</p> : null}
                {!photoFirst ? <Field
                  id={`${fieldPrefix}-description`}
                  label="Lýsing"
                  className="field-full"
                >
                  <textarea
                    id={`${fieldPrefix}-description`}
                    disabled={coordinationLocked}
                    rows={3}
                    value={o.description}
                    onChange={(e) => change("description", e.target.value)}
                    placeholder="Lýstu því sem sést, stærð og umfangi."
                  />
                </Field> : null}
              </div>
              {missingDamage ? (
                <p className="damage-draft-note">
                  Drög eru leyfð. Tegund, staðsetning og lýsing vantar að hluta.
                </p>
              ) : null}
              {!photoFirst && !state.photos[photoKey]?.length ? (
                <p className="missing-photo">
                  <TriangleAlert size={14} aria-hidden="true" />
                  Mynd af fráviki vantar. Atriðið má áfram vera í drögum.
                </p>
              ) : null}
            </div>
          ) : null}
          <section className={damage && complete && !editDefect ? styles.defectSummary : undefined} aria-label={damage && complete && !editDefect ? "Skráð frávik" : undefined}>
            {damage && complete && !editDefect ? <div className={styles.findingTitle}><h4>{o.damageType}</h4><button className="text-button" disabled={coordinationLocked} onClick={() => setEditDefect(true)}>Breyta fráviki</button></div> : null}
            <div className={damage && complete && !editDefect ? styles.findingOverview : undefined}>
              {damage && complete && !editDefect ? <div><span>Staðsetning</span><p>{o.location}</p></div> : null}
              <PhotoPreview key="item-photos" targetId={photoTargetId(reportId, roomId, item.id)} photoKey={photoKey} title={photoFirst && damage ? "Fráviksmyndir" : "Myndir við atriði"} context={`${roomName} · ${item.name}`} detail={damage} item featured={!photoFirst && damage && complete && !editDefect} compact={photoFirst} />
            </div>
            {damage && complete && !editDefect ? <p className={styles.findingDescription}>{o.description}</p> : null}
            {!photoFirst && damage && complete && !editDefect && !state.photos[photoKey]?.length ? <p className="missing-photo">Mynd af fráviki vantar. Atriðið má áfram vera í drögum.</p> : null}
          </section>
          {photoFirst ? assessment : null}
          <details open={photoFirst ? undefined : true} className={photoFirst ? stofa.notes : undefined}>
          <summary hidden={!photoFirst}>Athugasemd (valfrjálst){o.note ? " · Skráð" : ""}</summary>
          <Field id={`${fieldPrefix}-note`} label="Athugasemd" optional>
            <textarea
              id={`${fieldPrefix}-note`}
              disabled={coordinationLocked}
              rows={2}
              value={o.note}
              onChange={(e) => change("note", e.target.value)}
              placeholder="Bættu við samhengi ef þörf er á."
            />
          </Field>
          </details>
          <RetainedDefectDetails observation={o} />
          <div className="observation-footer">
            {photoFirst ? <button className="button button-primary" disabled={!complete || state.status !== "saved" || coordinationLocked} onClick={() => { onClose(); headingRef.current?.focus({ preventScroll: true }); }}>Ljúka atriði</button> : null}
            {nextAction}
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
                disabled={coordinationLocked}
                onClick={() => {
                  const patch = { condition: undefined, functionality: undefined, cleanliness: undefined, damageType: "", location: "", description: "", note: "" };
                  const transaction = prepareAssessmentChange(store, target, patch, ["condition", "functionality", "cleanliness", "damageType", "location", "description", "note"]);
                  if (!transaction) return;
                  transactions.current.pending?.dispose();
                  transactions.current.pending = transaction;
                  setConfirmation({ from: "Núverandi svör og lýsing", to: "Ósvarað atriði", clear: true, epoch: store.mutationEpoch });
                }}
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
              {photoFirst ? "Loka ritli" : "Loka atriði"}
            </button>
            {photoFirst ? <span>Lokun heldur gögnunum og lýkur ekki atriðinu.</span> : null}
          </div>
      </> : null}
      </div>
      {confirmation ? <ContextDialog title={confirmation.clear ? "Hreinsa svör atriðis?" : "Breyta virku fráviki?"} closeLabel="Hætta við breytingu" onClose={cancelChange}>
        <p><strong>{roomName} · {item.name}</strong></p>
        <p className={styles.changeContext}>{confirmation.from} → <strong>{confirmation.to}</strong></p>
        <p>{confirmation.clear ? "Svör, frávikslýsing og athugasemd verða hreinsuð. Myndir og viðbótarsvið haldast." : "Þetta breytir virku mati. Lýsing, athugasemd og myndir haldast við atriðið. Ekki er ályktað að viðgerð hafi farið fram."}</p>
        <p>Hægt er að afturkalla breytinguna í þessari setu.</p>
        {confirmation.epoch !== store.mutationEpoch ? <p role="status">Breytingaréttur hefur breyst. Haltu fyrra mati og yfirfarðu breytinguna aftur.</p> : null}
        <div className={styles.dialogActions}>
          <button className="button button-secondary" onClick={cancelChange}>Halda fyrra mati</button>
          <button className="button button-primary" disabled={coordinationLocked || confirmation.epoch !== store.mutationEpoch} onClick={() => {
            if (confirmation.epoch !== store.mutationEpoch) return;
            const undo = transactions.current.pending?.apply();
            transactions.current.pending = undefined;
            transactions.current.undo?.dispose();
            transactions.current.undo = undo ?? undefined;
            setCanUndo(!!undo);
            setMessage(undo ? "Mati breytt. Önnur gögn eru varðveitt." : "Matið hefur breyst eða er læst. Veldu breytinguna aftur eftir að hafa skoðað núverandi svör.");
            setConfirmation(null);
            onOpen();
          }}>Staðfesta breytingu</button>
        </div>
      </ContextDialog> : null}
    </section>
  );
}
