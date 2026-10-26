import { c1Enabled, failure, HttpError, noStore, readInspections, saveInspection, verifiedOwner } from "@/lib/cloud/server";

export async function GET(request: Request) {
  if (!c1Enabled()) return new Response(null, { status: 404 });
  try { return noStore(await readInspections(await verifiedOwner(request))); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  if (!c1Enabled()) return new Response(null, { status: 404 });
  try {
    const origin = request.headers.get("origin");
    // Next's internal request URL can use localhost even when the browser uses
    // 127.0.0.1. C1 has one fixed, loopback-only launcher origin.
    if (origin && origin !== "http://127.0.0.1:3101") throw new HttpError(403, "invalid_origin");
    const owner = await verifiedOwner(request);
    const text = await request.text();
    if (text.length > 5 * 1024 * 1024) throw new HttpError(413, "c1_document_too_large");
    let operation;
    try { operation = JSON.parse(text); } catch { throw new HttpError(400, "invalid_json"); }
    if (!operation || typeof operation !== "object" || Array.isArray(operation)) throw new HttpError(400, "invalid_operation");
    return noStore(await saveInspection(owner.id, operation));
  } catch (error) { return failure(error); }
}
