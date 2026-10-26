import "server-only";
import postgres from "postgres";
import { isCloudDocument, type SaveOperation } from "./contracts";

export function c1Enabled() {
  return process.env.NODE_ENV === "development" && process.env.C1_LOCAL_PROOF === "1";
}
export function localConfig() {
  if (!c1Enabled()) throw new Error("c1_disabled");
  const url = process.env.C1_SUPABASE_URL ?? "";
  const key = process.env.C1_ANON_KEY ?? "";
  const database = process.env.C1_DATABASE_URL ?? "";
  const db = new URL(database);
  if (url !== "http://127.0.0.1:55421" || !key || db.hostname !== "127.0.0.1" || db.port !== "55422" || db.username !== "c1_executor") {
    throw new Error("c1_requires_local_stack");
  }
  return { url, key, database };
}
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function verifiedOwner(request: Request) {
  const { url, key } = localConfig();
  const token = request.headers.get("authorization");
  if (!token?.startsWith("Bearer ")) throw new HttpError(401, "authentication_required");
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: token }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new HttpError(response.status >= 500 ? 503 : 401, "authentication_unavailable");
  const user = await response.json();
  if (typeof user.id !== "string") throw new HttpError(401, "authentication_required");
  return { id: user.id as string, authorization: token };
}
export async function readInspections(owner: { id: string; authorization: string }) {
  const { url, key } = localConfig();
  const response = await fetch(`${url}/rest/v1/c1_inspections?select=id,revision,document&owner_id=eq.${encodeURIComponent(owner.id)}&order=updated_at.desc`, {
    headers: { apikey: key, Authorization: owner.authorization }, cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new HttpError(503, "database_unavailable");
  return { ownerId: owner.id, records: await response.json() };
}
let sql: ReturnType<typeof postgres> | undefined;
export async function saveInspection(owner: string, operation: SaveOperation) {
  const { document, expectedRevision, operationId, issuedAt } = operation;
  if (!isCloudDocument(document) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
    typeof operationId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(operationId) ||
    typeof issuedAt !== "string" || !Number.isFinite(Date.parse(issuedAt))) throw new HttpError(400, "invalid_operation");
  sql ??= postgres(localConfig().database, { max: 4, idle_timeout: 20, connect_timeout: 5, connection: { statement_timeout: 10000 } });
  try {
    const rows = await sql`select c1_private.save_inspection(${owner}::uuid, ${document.id}, ${expectedRevision}, ${sql.json(document as unknown as postgres.JSONValue)}, ${operationId}::uuid, ${issuedAt}::timestamptz) as result`;
    return rows[0].result;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P0001") throw new HttpError(409, "revision_conflict");
      if (error.code === "22023") throw new HttpError(400, "invalid_or_expired_operation");
      if (error.code === "54000") throw new HttpError(422, "inspection_limit_reached");
    }
    throw new HttpError(503, "database_unavailable");
  }
}
export function noStore(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "Vary": "Authorization", "X-Content-Type-Options": "nosniff" } });
}
export function failure(error: unknown) {
  return error instanceof HttpError ? noStore({ error: error.message }, error.status) : noStore({ error: "local_service_unavailable" }, 503);
}
