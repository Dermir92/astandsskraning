import Link from "next/link";
import { fireState } from "@/lib/fire-observations";
import type { Report } from "@/lib/model";

export function RoomProgressContext({ report, linkToReview = true }: { report: Report; linkToReview?: boolean }) {
  const fire = fireState(report.details);
  const missingFire = report.details.inspectionContext === "residential_rental" ? fire.missing.length : 0;
  return <p className="field-hint" data-room-progress-context>
    Talningin nær aðeins til rýmisatriða. Upplýsingar, brunavarnir, mælar og myndir eru yfirfarin sér.
    {missingFire > 0 ? <> <strong>Brunavarnir: {missingFire} {missingFire === 1 ? "svar vantar" : "svör vantar"}.</strong></> : null}
    {linkToReview ? <> <Link className="text-link" href={`/skyrslur/${encodeURIComponent(report.id)}/yfirferd`}>Yfirfara alla skráninguna</Link></> : null}
  </p>;
}
