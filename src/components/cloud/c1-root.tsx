"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { InspectionStoreProvider, useDemo } from "../demo-provider";
import { CloudStore } from "@/lib/cloud/store";
import styles from "./c1.module.css";

const SessionContext = createContext<{ email: string; signOut: () => Promise<void> } | null>(null);
export function C1Root({ children }: { children: ReactNode }) {
  const [store] = useState(() => new CloudStore());
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const allowSession = useRef(true);
  useEffect(() => {
    let live = true;
    let unsubscribe: (() => void) | undefined;
    fetch("/api/c1/config", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("config_unavailable");
      const { url, key } = await response.json();
      if (!live) return;
      // Only an unprivileged local API key. Inspection documents are never
      // written to Auth storage or copied from the demonstration collection.
      const auth = createClient(url, key, { auth: { storageKey: "astandsskraning-c1-auth", storage: window.sessionStorage, detectSessionInUrl: false } });
      setClient(auth);
      const { data } = auth.auth.onAuthStateChange((_event, next) => {
        if (!live || !allowSession.current) return;
        setSession(next); setReady(true);
        void store.activate(next?.user.id ?? null, next?.access_token);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    }).catch(() => { if (live) { setProblem("Staðbundinn C1-þjónn eða setugeymsla vafrans er ekki tiltæk. Athugaðu staðbundna uppsetningu og vafrastillingar."); setReady(true); } });
    const leave = (event: BeforeUnloadEvent) => { if (store.hasRecoverable) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", leave);
    return () => { live = false; unsubscribe?.(); window.removeEventListener("beforeunload", leave); void store.activate(null); };
  }, [store]);
  async function signOut() {
    if (!client) return;
    allowSession.current = false;
    // Detach requests and hide owner data before waiting for the network.
    await store.activate(null); setSession(null);
    await client.auth.stopAutoRefresh();
    const { error } = await client.auth.signOut({ scope: "local" });
    window.sessionStorage.removeItem("astandsskraning-c1-auth");
    if (error) setProblem("Tengingu við auðkenningarþjón vantaði við útskráningu. Staðbundin seta var fjarlægð; fyrri aðgangslykill kann að gilda þar til hann rennur út.");
  }
  if (session) return <SessionContext.Provider value={{ email: session.user.email ?? "Prófnotandi", signOut }}>
    <InspectionStoreProvider key={session.user.id} store={store} mode="cloud" navigationScope={`c1:${session.user.id}:`}>{children}</InspectionStoreProvider>
  </SessionContext.Provider>;
  return <main id="main" className={styles.login}>
    <p className={styles.eyebrow}>C1 · STAÐBUNDIN VERKFRÆÐIPRÓFUN</p>
    <h1>Prófa gagnagrunnsvistun</h1>
    <p>Aðeins tilbúin gögn og stýrðir prófreikningar. Sýnihamurinn á venjulegu vefslóðinni er óháður þessari prófun.</p>
    <p>Engin nýskráning, myndageymsla, tengdar lokaskoðanir eða boð eru virk í C1.</p>
    {problem ? <p role="alert">{problem}</p> : null}
    {!ready ? <p role="status">Undirbý staðbundna prófun…</p> : null}
    <form onSubmit={async event => {
      event.preventDefault(); if (!client || busy) return;
      setBusy(true); setProblem(""); allowSession.current = true;
      const fields = new FormData(event.currentTarget);
      try {
        const { error } = await client.auth.signInWithPassword({ email: String(fields.get("email")), password: String(fields.get("password")) });
        if (error) setProblem("Innskráning tókst ekki. Athugaðu prófreikning, lykilorð og tengingu.");
        else await client.auth.startAutoRefresh();
      } catch { setProblem("Innskráning tókst ekki. Athugaðu tengingu og reyndu aftur."); }
      finally { setBusy(false); }
    }}>
      <label htmlFor="c1-email">Netfang prófreiknings</label>
      <input id="c1-email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="c1-password">Lykilorð prófreiknings</label>
      <input id="c1-password" name="password" type="password" autoComplete="current-password" required />
      <button className="button button-primary" disabled={!client || busy}>Skrá inn í C1</button>
      <p role="status">{busy ? "Staðfesti innskráningu…" : ""}</p>
    </form>
  </main>;
}

export function C1Panel() {
  const { store: shared, state } = useDemo();
  const session = useContext(SessionContext);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messageRef = useRef<HTMLParagraphElement>(null);
  if (!session) return null;
  const store = shared as CloudStore;
  const recovery = store.recoveryJSON();
  // Normal autosaves must not insert/remove a large panel above the focused
  // field on every keystroke. Recovery controls appear for blocked work only.
  const recoverable = store.hasRecovery || (store.hasUnsaved && state.status !== "pending");
  function download() {
    if (!recovery) return;
    const url = URL.createObjectURL(new Blob([recovery], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "astandsskraning-c1-endurheimt.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Endurheimtarafrit var sent í niðurhal. Það er ekki sjálfvirk vistun eða innflutningur.");
  }
  return <section className={styles.panel} aria-label="Staðbundin C1-prófun">
    <div className={styles.row}><p><strong>C1 · staðbundinn gagnagrunnur</strong><br />{session.email}</p>
      <button type="button" className="button button-small button-secondary" onClick={() => { void session.signOut(); }}>Skrá út</button></div>
    <p>Aðeins sjálfstæð íbúðardrög. Myndir, tengdar skoðanir og deiling eru óvirk. Engin gögn eru sótt úr sýniham.</p>
    {recoverable ? <p>Óvistaðar breytingar eða fyrri endurheimt eru aðeins í minni þessa glugga. Sæktu afrit áður en þú lokar honum. Fyrri endurheimt er bundin við sama prófreikning.</p> : null}
    <div className={styles.actions}>
      {recoverable ? <button type="button" className="button button-small button-secondary" onClick={download} disabled={!store.ownerId}>Sækja endurheimtarafrit</button> : null}
      {state.status === "read-error" ? <button type="button" className="button button-small button-secondary" onClick={store.retryLoad}>Reyna gagnasókn aftur</button> : null}
    </div>
    {store.hasUnsaved && recoverable ? <>
      <label className={styles.confirm}><input type="checkbox" disabled={store.reloading} checked={confirmation === recovery} onChange={event => setConfirmation(event.target.checked ? recovery : null)} />Ég hef varðveitt breytingarnar og vil sækja vistuð drög í þeirra stað.</label>
      <button type="button" className="button button-small button-secondary" aria-busy={store.reloading} disabled={store.reloading || state.status === "pending" || confirmation !== recovery} onClick={async () => {
        setMessage("Sæki vistuð drög. Breytingar þínar eru enn í minni og endurheimtarafrit er aðgengilegt.");
        const result = await store.reloadLatest();
        if (result.status === "superseded") return;
        if (result.status === "reloaded") {
          setConfirmation(null);
          setMessage("Vistuð drög sótt. Fyrri breytingar eru enn tiltækar í endurheimtarafriti þessa glugga.");
          // The initiating button disappears after replacement. Keep keyboard
          // focus on the persistent result, rather than losing it to the page.
          requestAnimationFrame(() => messageRef.current?.focus());
        } else if (result.status === "changed") {
          setConfirmation(null);
          setMessage("Breytingar bættust við meðan beðið var. Engum drögum var skipt út. Varðveittu nýjustu breytingarnar og staðfestu aftur.");
        } else if (result.status === "failed") {
          setMessage("Ekki tókst að sækja og staðfesta vistuð drög. Breytingar þínar eru enn í minni og endurheimtarafrit er aðgengilegt. Reyndu aftur.");
        } else {
          setMessage("Ekki var skipt um drög. Bíddu eftir aðgerðinni sem er í gangi og reyndu aftur.");
        }
      }}>Sækja nýjustu drög</button>
    </> : null}
    <p ref={messageRef} role="status" aria-atomic="true" tabIndex={-1}>{message}</p>
  </section>;
}
