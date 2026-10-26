import { isReportList, type Report } from "../model";

export interface CloudRecord { id: string; revision: number; document: Report }
// A receipt acknowledges this operation's commit, not the current database head.
export interface SaveReceipt extends CloudRecord { replayed: boolean }
export interface SaveOperation {
  operationId: string;
  issuedAt: string;
  expectedRevision: number;
  document: Report;
}
export function isCloudDocument(value: unknown): value is Report {
  return isReportList([value]) && (value as Report).assetType === "apartment" &&
    (value as Report).details.inspectionType === "independent" &&
    !(value as Report).sampleReviewed && !(value as Report).linkedInitial;
}
export function isCloudRecord(value: unknown): value is CloudRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as CloudRecord;
  return Number.isSafeInteger(r.revision) && r.revision > 0 &&
    isCloudDocument(r.document) && r.id === r.document.id;
}
