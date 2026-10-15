"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock3, Info } from "lucide-react";
import { useDemo } from "../demo-provider";
import { AssetIcon, BackLink, PageHeading } from "../ui";
import { is } from "@/lib/locale/is";
import type { AssetType } from "@/lib/model";

export function NewReportScreen() {
  const { store, state } = useDemo();
  const router = useRouter();
  return (
    <div className="narrow-page">
      <BackLink />
      <PageHeading
        eyebrow="NÝ SKRÁNING"
        title="Hvað viltu skoða?"
        description="Veldu eignategund. Við leggjum til rými og skoðunaratriði sem eiga við."
      />
      <div className="asset-options">
        {(Object.keys(is.assets) as AssetType[]).map((type) => (
          <div
            key={type}
            className={`asset-option ${type === "apartment" ? "asset-option-ready" : ""}`}
          >
            <AssetIcon type={type} />
            <div>
              <h2>{is.assets[type]}</h2>
              <p>{is.assetDescriptions[type]}</p>
              {type !== "apartment" ? (
                <span className="coming-soon">
                  <Clock3 size={13} aria-hidden="true" />Í undirbúningi
                </span>
              ) : (
                <span className="available-label">
                  <Check size={14} aria-hidden="true" />
                  Tilbúið til prófunar
                </span>
              )}
            </div>
            {type === "apartment" ? (
              <button
                className="button button-primary"
                disabled={state.status === "loading"}
                onClick={() => {
                  const id = store.createReport();
                  router.push(`/skyrslur/${id}/upplysingar`);
                }}
              >
                Velja íbúð
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="info-note">
        <Info size={19} aria-hidden="true" />
        <p>
          <strong>Byrjaðu á drögum.</strong> Þú getur farið á milli skrefa og
          bætt við upplýsingum síðar. Í áfanga 1A er aðeins íbúðaskráning virk.
        </p>
      </div>
    </div>
  );
}
