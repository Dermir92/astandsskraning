import { developmentMode, h1aLocalRequest } from "@/lib/cloud/development-mode.mjs";
import { hostedPreparationStatus } from "@/lib/cloud/hosted-preparation";

export async function GET(request: Request) {
  if (developmentMode() !== "h1a-hosted") return new Response(null, { status: 404 });
  if (!h1aLocalRequest(request.headers)) return new Response(null, { status: 403 });
  const status = hostedPreparationStatus();
  return Response.json(status, { status: status.configuration === "valid" ? 200 : 503,
    headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
