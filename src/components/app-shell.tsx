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

export function SaveStatus() {
  const { state } = useDemo();
  const Icon =
    state.status === "error"
      ? TriangleAlert
      : state.status === "saved"
        ? Check
        : HardDrive;
  return (
    <span
      className={`save-status ${state.status === "error" ? "save-error" : ""}`}
      role="status"
    >
      <Icon size={14} aria-hidden="true" />
      {is.save[state.status]}
    </span>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, store } = useDemo();
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
          aria-label="Um sýniham"
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
          <span className="desktop-context">Sýnivinnusvæði</span>
          <div className="topbar-right">
            <SaveStatus />
            <button
              className="demo-pill"
              aria-label="Um sýniham"
              aria-haspopup="dialog"
              onClick={() => setShowHelp(true)}
            >
              Sýnihamur
            </button>
          </div>
        </header>
        <div className="demo-banner">
          <span className="demo-banner-label">SÝNI</span>
          <p>
            {is.demoNotice}{" "}
            <span className="demo-banner-extra">Myndir fara ekki á þjón.</span>
          </p>
        </div>
        {state.warning ? (
          <div className="storage-warning" role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            <p>{state.warning}</p>
            <button
              className="button button-small button-secondary"
              onClick={store.retrySave}
            >
              Reyna vistun aftur
            </button>
          </div>
        ) : null}
        <main id="main" tabIndex={-1} className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>Ástandsskráning · Framendafrumgerð</span>
          <span>Tilbúin gögn · Enginn frágangur eða boð</span>
        </footer>
      </div>
      {showHelp ? (
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
