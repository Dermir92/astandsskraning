"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  CircleHelp,
  ClipboardList,
  HardDrive,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { is } from "@/lib/locale/is";
import { useDemo } from "./demo-provider";
import { useState, type ReactNode } from "react";
import { ContextDialog } from "./context-dialog";
import { C1Panel } from "./cloud/c1-root";

export function SaveStatus() {
  const { state, mode } = useDemo();
  const failed =
    state.status === "error" ||
    state.status === "read-error" ||
    state.status === "validation-error" || state.status === "conflict" || state.status === "refresh-required";
  const Icon =
    failed
      ? TriangleAlert
      : state.status === "saved"
        ? Check
        : HardDrive;
  return (
    <span
      className={`save-status ${failed ? "save-error" : ""}`}
      role="status"
    >
      <Icon size={14} aria-hidden="true" />
      {state.status === "refresh-required" ? "Fyrri vistun staðfest · sækja þarf drög" : state.status === "pending" ? "Vistun í bið…" : state.status === "conflict" ? "Árekstur við vistun" : mode === "cloud" && state.status === "error" ? "Vistun óstaðfest" : mode === "cloud" && state.status === "read-error" ? "Gagnasókn mistókst" : state.status === "saved" && mode === "cloud" ? "Vistað í gagnagrunni" : is.save[state.status]}
    </span>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, store, mode } = useDemo();
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className={`app-shell ${pathname === "/" ? "reports-shell" : ""}`}>
      <a className="skip-link" href="#main">
        Fara beint í efni
      </a>
      <aside className="app-rail" aria-label="Leiðsögn">
        <Link href="/" className="brand" aria-label="Ástandsskráning — forsíða">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
        </Link>
        <nav className="main-nav" aria-label="Aðalvalmynd">
          <Link
            href="/"
            className={pathname === "/" ? "nav-active" : ""}
            aria-current={pathname === "/" ? "page" : undefined}
            aria-label={`Mínar skýrslur (${state.reports.length})`}
            title="Mínar skýrslur"
          >
            <ClipboardList size={19} aria-hidden="true" />
            <span>Skýrslur</span>
          </Link>
          <Link
            href="/skyrslur/ny"
            className={pathname === "/skyrslur/ny" ? "nav-active" : ""}
            aria-current={pathname === "/skyrslur/ny" ? "page" : undefined}
            aria-label="Ný skýrsla"
            title="Ný skýrsla"
          >
            <Plus size={19} aria-hidden="true" />
            <span>Ný</span>
          </Link>
        </nav>
        <button
          className="rail-help"
          aria-label={mode === "cloud" ? "Um staðbundna C1-prófun" : "Um sýniham"}
          aria-haspopup="dialog"
          onClick={() => setShowHelp(true)}
        >
          <CircleHelp size={20} aria-hidden="true" />
          <span>Hjálp</span>
        </button>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <Link href="/" className="shell-brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            Ástandsskráning
          </Link>
          <span className="desktop-context">{mode === "cloud" ? "Staðbundin C1-prófun" : "Sýnivinnusvæði"}</span>
          <div className="topbar-right">
            <SaveStatus />
            <button
              className="demo-pill"
              aria-label={mode === "cloud" ? "Um staðbundna C1-prófun" : "Um sýniham"}
              aria-haspopup="dialog"
              onClick={() => setShowHelp(true)}
            >
              {mode === "cloud" ? "C1-prófun" : "Sýnihamur"}
            </button>
          </div>
        </header>
        <div className="demo-banner">
          <span className="demo-banner-label">SÝNI</span>
          <p>
            {mode === "cloud" ? "C1-prófdrög vistast í staðbundnum gagnagrunni þegar vistun er staðfest. Aðeins tilbúin gögn." : is.demoNotice}{" "}
            <span className="demo-banner-extra">{mode === "cloud" ? "Myndir eru óvirkar." : "Myndir fara ekki á þjón."}</span>
          </p>
        </div>
        {state.warning ? (
          <div className="storage-warning" role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            <p>{state.warning}</p>
            {mode === "demo" && state.status === "error" && pathname.endsWith("/forskodun") ? (
              <Link className="text-link" href={`${pathname.slice(0, -"forskodun".length)}yfirferd#report-preview-entry`}>Aftur í yfirferð til að reyna vistun aftur</Link>
            ) : state.status === "error" ? (
              <button
                className="button button-small button-secondary"
                onClick={store.retrySave}
              >
                Reyna vistun aftur
              </button>
            ) : null}
          </div>
        ) : null}
        {mode === "cloud" ? <C1Panel /> : null}
        <main id="main" tabIndex={-1} className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>Ástandsskráning · Framendafrumgerð</span>
          <span>Tilbúin gögn · Enginn frágangur eða boð</span>
        </footer>
      </div>
      {showHelp && mode === "cloud" ? <ContextDialog title="Um staðbundna C1-prófun" onClose={() => setShowHelp(false)}><p>Prófaðu aðeins með tilbúnum gögnum. Texti og svör vistast í staðbundnum gagnagrunni þegar vistun er staðfest. Fylgstu með vistunarstöðunni.</p><p>Myndir, tengdar skoðanir og deiling eru óvirk. Þetta er verkfræðiprófun, ekki framleiðsluþjónusta.</p></ContextDialog> : showHelp ? (
        <ContextDialog title="Um sýniham" onClose={() => setShowHelp(false)}>
          <p>
            Prófaðu skráningu með tilbúnum gögnum. Texti, rými og svör vistast í
            þessum vafra. Notaðu eingöngu tilbúin gögn.
          </p>
          <p>
            Myndir eru aðeins tímabundnar forskoðanir meðan glugginn er opinn.
            Þær hverfa við endurhleðslu og fara ekki á þjón.
          </p>
          <p>Áfangi 1A · v0.1 · Enginn frágangur eða boð.</p>
        </ContextDialog>
      ) : null}
    </div>
  );
}
