"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  PanelRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useDemo } from "../demo-provider";
import { ContextDialog } from "../context-dialog";
import {
  ReportOverview,
  reportAction,
  reportHref,
  reportLocation,
} from "../report-overview";
import { AssetIcon, Badge } from "../ui";
import {
  formatDate,
  reportStats,
  reportStatus,
  reportTitle,
  type AssetType,
  type ReportStatus,
} from "@/lib/model";
import { is } from "@/lib/locale/is";

const statuses = ["all", "active", "draft", "reviewed"] as const;
const statusLabel = (status: ReportStatus | "all") =>
  status === "all"
    ? "Allar"
    : status === "reviewed"
      ? "Yfirfarið"
      : is.statuses[status];

export function ReportsScreen() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [asset, setAsset] = useState<AssetType | "all">("all");
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterToggle = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const visible = state.reports
    .filter(
      (report) =>
        (status === "all" || reportStatus(report) === status) &&
        (asset === "all" || report.assetType === asset) &&
        `${reportTitle(report)} ${report.subtitle} ${report.details.postalCode} ${report.details.municipality} ${is.assets[report.assetType]}`
          .toLocaleLowerCase("is")
          .includes(query.trim().toLocaleLowerCase("is")),
    )
    .sort((a, b) =>
      sort === "name"
        ? reportTitle(a).localeCompare(reportTitle(b), "is")
        : Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
  const selected =
    visible.find((report) => report.id === selectedId) ?? visible[0];
  // Reconcile selection with the filtered live store without moving keyboard focus.
  if (selectedId !== (selected?.id ?? null))
    setSelectedId(selected?.id ?? null);
  const drawerReport = visible.find((report) => report.id === drawerId);
  if (drawerId && !drawerReport) setDrawerId(null);
  const filtered = query !== "" || status !== "all" || asset !== "all";
  const activeFilterCount = Number(status !== "all") + Number(asset !== "all");
  const count = (tab: ReportStatus | "all") =>
    state.reports.filter(
      (report) => tab === "all" || reportStatus(report) === tab,
    ).length;
  const reset = () => {
    setQuery("");
    setStatus("all");
    setAsset("all");
  };
  const resetToSearch = () => {
    reset();
    searchInput.current?.focus();
  };
  const groups = [
    {
      name: "Ólokið",
      reports: visible.filter((report) => reportStatus(report) !== "reviewed"),
    },
    {
      name: "Yfirfarið · sýni",
      reports: visible.filter((report) => reportStatus(report) === "reviewed"),
    },
  ];

  return (
    <div className="reports-workspace">
      <div className="reports-heading">
        <div>
          <h1>Mínar skýrslur</h1>
          <p>{state.reports.length} skýrslur</p>
        </div>
        <Link className="button button-primary" href="/skyrslur/ny">
          <Plus size={18} aria-hidden="true" />
          Ný skýrsla
        </Link>
      </div>
      <div className="register-toolbar">
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchInput}
            aria-label="Leita að eign eða heimilisfangi"
            placeholder="Leita að eign eða heimilisfangi…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              className="icon-button"
              onClick={() => {
                setQuery("");
                searchInput.current?.focus();
              }}
              aria-label="Hreinsa leit"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div
          className="mobile-report-controls"
          onKeyDown={(event) => {
            if (event.key === "Escape" && filtersOpen) {
              event.preventDefault();
              setFiltersOpen(false);
              filterToggle.current?.focus();
            }
          }}
        >
          <button
            ref={filterToggle}
            className="mobile-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="mobile-report-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span>
              Sía og raða
              {activeFilterCount ? (
                <strong>
                  {" "}
                  · {activeFilterCount}{" "}
                  {activeFilterCount === 1 ? "virk sía" : "virkar síur"}
                </strong>
              ) : null}
            </span>
            <span className="mobile-sort-hint">
              {sort === "newest" ? "Nýjast fyrst" : "Eftir heiti innan hópa"}
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          <div
            id="mobile-report-filters"
            className="mobile-filter-fields"
            hidden={!filtersOpen}
            role="group"
            aria-label="Síur og röðun"
          >
            <label className="register-filter">
              <span>Staða</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ReportStatus | "all")
                }
              >
                {statuses.map((tab) => (
                  <option key={tab} value={tab}>
                    {tab === "all" ? "Allar skýrslur" : statusLabel(tab)} (
                    {count(tab)})
                  </option>
                ))}
              </select>
            </label>
            <label className="register-filter">
              <span>Eignategund</span>
              <select
                value={asset}
                onChange={(event) =>
                  setAsset(event.target.value as AssetType | "all")
                }
              >
                <option value="all">Allar tegundir</option>
                {Object.entries(is.assets).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>
            <label className="register-filter">
              <span>Röðun</span>
              <select
                aria-label="Röðun skýrslna"
                aria-describedby="mobile-sort-help"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">Nýjast fyrst</option>
                <option value="name">Eftir heiti</option>
              </select>
              <span id="mobile-sort-help" className="mobile-sort-help">
                Raðað innan hópa · ólokið fyrst.
              </span>
            </label>
            <button
              className="button button-secondary mobile-filter-reset"
              disabled={!filtered}
              onClick={() => {
                // Reset disables this button; keep keyboard focus on the disclosure.
                filterToggle.current?.focus();
                reset();
              }}
            >
              Endurstilla leit og síur
            </button>
          </div>
        </div>
        <div className="desktop-register-filters">
          <label className="register-filter">
            <span>Eignategund</span>
            <select
              value={asset}
              onChange={(event) =>
                setAsset(event.target.value as AssetType | "all")
              }
            >
              <option value="all">Allar eignategundir</option>
              {Object.entries(is.assets).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label className="register-filter register-sort">
            <span>Röðun skýrslna</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Nýjast fyrst</option>
              <option value="name">Eftir heiti</option>
            </select>
          </label>
        </div>
      </div>
      <p id="mobile-overview-help" className="sr-only" aria-hidden="true">
        Heiti skýrslu opnar stutt yfirlit. Framhaldshnappurinn opnar skráninguna
        eða sýniskýrsluna.
      </p>
      <div className="reports-workbench">
        <section className="report-register" aria-label="Skýrsluyfirlit">
          <div className="register-heading">
            <div>
              <h2>Skýrsluskrá</h2>
              <p
                role="status"
                aria-atomic="true"
                className={filtered ? undefined : "sr-only"}
              >
                {visible.length} af {state.reports.length} skýrslum
              </p>
            </div>
            <div
              className="register-status-filters"
              role="group"
              aria-label="Sía eftir stöðu"
            >
              {statuses.map((tab) => (
                <button
                  key={tab}
                  aria-pressed={status === tab}
                  onClick={() => setStatus(tab)}
                >
                  {statusLabel(tab)}
                  <span>{count(tab)}</span>
                </button>
              ))}
            </div>
          </div>
          {groups.map((group) =>
            group.reports.length ? (
              <section
                className="register-group"
                key={group.name}
                aria-label={group.name}
              >
                <h3>
                  {group.name}
                  <span>{group.reports.length}</span>
                </h3>
                <ul className="register-list">
                  {group.reports.map((report) => {
                    const currentStatus = reportStatus(report);
                    const stats = reportStats(report);
                    return (
                      <li
                        className={`report-entry ${selected?.id === report.id ? "report-selected" : ""}`}
                        key={report.id}
                      >
                        <div className="register-property register-desktop-property">
                          <AssetIcon type={report.assetType} />
                          <div>
                            <Link
                              className="property-name"
                              href={reportHref(report)}
                            >
                              {reportTitle(report)}
                            </Link>
                            <p>
                              <span className="register-asset-type">
                                {is.assets[report.assetType]} ·{" "}
                              </span>
                              {reportLocation(report)}
                            </p>
                          </div>
                        </div>
                        <button
                          className="register-property register-mobile-property"
                          aria-label={`Yfirlit: ${reportTitle(report)}`}
                          aria-describedby={`report-location-${encodeURIComponent(report.id)} mobile-overview-help`}
                          aria-haspopup="dialog"
                          onClick={() => {
                            setSelectedId(report.id);
                            setDrawerId(report.id);
                          }}
                        >
                          <AssetIcon type={report.assetType} />
                          <span className="mobile-report-identity">
                            <span className="mobile-report-title">
                              <span className="property-name">
                                {reportTitle(report)}
                              </span>
                              <span
                                className="mobile-preview-cue"
                                aria-hidden="true"
                              >
                                Yfirlit
                                <ChevronDown size={16} />
                              </span>
                            </span>
                            <span
                              className="mobile-report-location"
                              id={`report-location-${encodeURIComponent(report.id)}`}
                            >
                              {reportLocation(report)}
                            </span>
                          </span>
                        </button>
                        <div className="register-metadata">
                          <Badge status={currentStatus} />
                          {currentStatus === "active" && stats.total > 0 ? (
                            <span className="register-progress">
                              {stats.recorded}/{stats.total} skráð
                            </span>
                          ) : null}
                          <time dateTime={report.updatedAt}>
                            {formatDate(report.updatedAt)}
                          </time>
                        </div>
                        <div className="register-actions">
                          <Link
                            className={`register-next ${currentStatus === "active" ? "register-next-active" : ""}`}
                            href={reportHref(report)}
                            aria-label={`${reportAction(report)}: ${reportTitle(report)}`}
                          >
                            <span className="desktop-report-action">
                              {currentStatus === "reviewed" ||
                              report.assetType !== "apartment"
                                ? "Skoða"
                                : reportAction(report)}
                            </span>
                            <span className="mobile-report-action">
                              {reportAction(report)}
                            </span>
                            <ArrowRight size={16} aria-hidden="true" />
                          </Link>
                          <button
                            className="register-select"
                            aria-label={`Yfirlit: ${reportTitle(report)}`}
                            aria-pressed={selected?.id === report.id}
                            aria-controls="selected-report-context"
                            onClick={() => setSelectedId(report.id)}
                          >
                            <PanelRight size={16} aria-hidden="true" />
                            <span>
                              {selected?.id === report.id ? "Valin" : "Yfirlit"}
                            </span>
                          </button>
                          <button
                            className="register-drawer-trigger"
                            aria-label={`Yfirlit: ${reportTitle(report)}`}
                            aria-haspopup="dialog"
                            onClick={() => {
                              setSelectedId(report.id);
                              setDrawerId(report.id);
                            }}
                          >
                            <PanelRight size={16} aria-hidden="true" />
                            <span>Yfirlit</span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null,
          )}
          {!visible.length ? (
            <div className="empty-state">
              <Search size={28} aria-hidden="true" />
              <h2>Engar skýrslur fundust</h2>
              <p>
                {state.reports.length
                  ? "Prófaðu annað leitarorð eða breyttu síunum."
                  : "Stofnaðu nýja skýrslu til að hefja skráningu."}
              </p>
              {state.reports.length ? (
                <button
                  className="button button-secondary"
                  onClick={resetToSearch}
                >
                  Hreinsa leit og síur
                </button>
              ) : (
                <Link className="button button-secondary" href="/skyrslur/ny">
                  Stofna skýrslu
                </Link>
              )}
            </div>
          ) : null}
          <div className="register-footer">
            {filtered ? (
              <button className="text-button" onClick={resetToSearch}>
                Hreinsa síur
              </button>
            ) : (
              <p>Eingöngu tilbúin gögn · Drög haldast opin</p>
            )}
          </div>
        </section>
        <aside
          className="selected-report-context"
          id="selected-report-context"
          aria-label="Yfirlit valinnar skýrslu"
        >
          {selected ? (
            <ReportOverview report={selected} />
          ) : (
            <p className="context-empty">Engin skýrsla valin.</p>
          )}
        </aside>
      </div>
      {drawerReport ? (
        <ContextDialog title="Skýrsluyfirlit" onClose={() => setDrawerId(null)}>
          <ReportOverview report={drawerReport} />
        </ContextDialog>
      ) : null}
    </div>
  );
}
