import { c1Enabled, failure, localConfig, noStore } from "@/lib/cloud/server";
export async function GET() {
  if (!c1Enabled()) return new Response(null, { status: 404 });
  try { const { url, key } = localConfig(); return noStore({ url, key }); }
  catch (error) { return failure(error); }
}
