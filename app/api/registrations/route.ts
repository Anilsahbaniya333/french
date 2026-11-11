import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import { fetchRegistrations } from "@/lib/supabase/queries";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient() ?? createServerClient();
  const registrations = await fetchRegistrations(supabase);

  // Never send storage references / screenshot URLs in the list — the details
  // endpoint issues a short-lived signed URL on demand.
  const safe = registrations.map(({ paymentScreenshotUrl, ...r }) => ({
    ...r,
    hasPaymentProof: Boolean(paymentScreenshotUrl),
  }));

  return NextResponse.json({ registrations: safe }, { headers: { "Cache-Control": "no-store" } });
}
