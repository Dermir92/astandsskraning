import { AssetIcon, BackLink, Badge, PageHeading } from "../ui";
import { formatDate, reportTitle, type Report } from "@/lib/model";
import { is } from "@/lib/locale/is";
import Link from "next/link";
import { Info } from "lucide-react";

export function SampleSummary({ report }: { report: Report }) {
  return (
    <div className="narrow-page">
      <BackLink />
      <PageHeading
        eyebrow="TILBÚIN SÝNIGÖGN"
        title={reportTitle(report)}
        description={report.subtitle}
      />
      <section className="panel sample-summary">
        <AssetIcon type={report.assetType} />
        <dl>
          <div>
            <dt>Eignategund</dt>
            <dd>{is.assets[report.assetType]}</dd>
          </div>
          <div>
            <dt>Síðast breytt</dt>
            <dd>{formatDate(report.updatedAt)}</dd>
          </div>
          <div>
            <dt>Sýnd staða</dt>
            <dd>
              <Badge status="reviewed" />
            </dd>
          </div>
        </dl>
      </section>
      <div className="info-note">
        <Info size={20} aria-hidden="true" />
        <p>
          Þessi færsla sýnir hvernig eignir af mismunandi tegundum birtast í
          yfirlitinu. Hún inniheldur ekki frágengna úttekt. Fullt
          skráningarflæði er aðeins virkt fyrir íbúðardrög í þessum áfanga.
        </p>
      </div>
      <Link
        className="button button-primary"
        href="/skyrslur/syni-ibud/skraning"
      >
        Prófa íbúðaskráningu
      </Link>
    </div>
  );
}
