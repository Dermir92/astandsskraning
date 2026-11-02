"use client";

import { useRef, useState } from "react";
import { useDemo } from "./demo-provider";

// Only mounted in Demo mode. Acknowledgement is tied to the exact candidate,
// ownership epoch and UI drafts; a download click is not a disk receipt.
export function DemoSaveActions() {
  const { state, store } = useDemo();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const result = useRef<HTMLParagraphElement>(null);
  const local = state.local;
  if (!local) return null;
  const token = store.demoRecoveryToken();
  const confirmed = confirmation === token;
  const copy = store.demoRecoveryJSON();
  const acquiring = local.access === "initializing";
  const focusResult = () => requestAnimationFrame(() => {
    const target = result.current ?? document.querySelector<HTMLElement>(".topbar .save-status");
    target?.focus({ preventScroll: true });
  });
  function download() {
    if (!copy) return;
    const url = URL.createObjectURL(new Blob([copy], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "astandsskraning-demo-endurheimt.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Endurheimtarafrit var sent í niðurhal. Staðfestu sjálf/ur að þú hafir varðveitt það. Myndir og óstofnaður innsláttur eru ekki í afritinu.");
  }
  function reload() {
    if (local?.recovery && !confirmed) return;
    if (store.reloadDemoLatest(token)) {
      setConfirmation(null); setMessage("Vistuð gögn sótt til skoðunar. Óafgreitt endurheimtardrag er áfram varðveitt hér.");
      focusResult();
    } else setMessage("Ekki var skipt um gögn. Varðveittu ósendan innslátt eða reyndu aftur þegar hægt er að staðfesta gögnin.");
  }
  return <div className="demo-save-actions">
    {!local.recoveryUnreadable && !local.recovery && local.access !== "writer" ? <button type="button" className="button button-small button-secondary" disabled={acquiring || local.unsubmitted} onClick={store.retryDemoAccess}>Reyna breytingarétt aftur</button> : null}
    {local.recovery && local.access !== "writer" ? <button type="button" className="button button-small button-secondary" disabled={acquiring || local.unsubmitted} onClick={store.retryDemoAccess}>Reyna breytingarétt aftur</button> : null}
    {copy ? <button type="button" className="button button-small button-secondary" onClick={download}>Sækja endurheimtarafrit</button> : null}
    {local.unsubmitted ? <p>Óstofnaður innsláttur er enn á skjánum. Afritaðu hann og afgreiddu hann áður en þú skiptir um gögn.</p> : null}
    {local.recovery ? <label className="demo-recovery-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmation(event.target.checked ? token : null)} />Ég hef varðveitt afrit dragsins og vil halda áfram með valda endurheimtaraðgerð.</label> : null}
    {!local.recoveryUnreadable ? <button type="button" className="button button-small button-secondary" disabled={acquiring || local.unsubmitted || (local.recovery && !confirmed)} onClick={reload}>Sækja nýjustu vistuðu gögn</button> : null}
    {local.recovery && local.access === "writer" && !local.viewingLatest ? <button type="button" className="button button-small button-secondary" disabled={!confirmed || local.unsubmitted} onClick={() => {
      const accepted = store.resumeDemoRecovery(token); setConfirmation(null);
      setMessage(accepted ? "Endurheimtardrag tekið til vinnslu. Fylgstu með vistunarstöðunni." : "Ekki var hægt að halda áfram með dragið. Grunnur þess kann að hafa breyst; engin yfirskrift var heimiluð.");
      focusResult();
    }}>Halda áfram með endurheimtardrag</button> : null}
    {local.recovery && local.viewingLatest ? <button type="button" className="button button-small button-secondary" disabled={!confirmed || local.unsubmitted} onClick={() => {
      const finished = store.finishDemoRecovery(token); setConfirmation(null);
      setMessage(finished ? "Endurheimtardrag afgreitt samkvæmt staðfestingu þinni. Nýjustu sóttu gögn eru til vinnslu þegar breytingaréttur liggur fyrir." : "Ekki tókst að afgreiða endurheimtardragið. Afritinu var ekki skipt út fyrir nýtt drag.");
      focusResult();
    }}>Vinna með nýjustu drög</button> : null}
    <p ref={result} role="status" tabIndex={-1}>{message}</p>
  </div>;
}
