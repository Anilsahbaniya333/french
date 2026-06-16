import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import { insertContact } from "@/lib/supabase/queries";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const payload = {
    fullName: (String(body.fullName ?? "")).trim(),
    email: (String(body.email ?? "")).trim(),
    message: (String(body.message ?? "")).trim(),
  };

  if (!payload.fullName || !payload.email || !payload.message) {
    return NextResponse.json(
      { success: false, error: "Please fill in all required fields." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient() ?? createServerClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured. Please contact us directly by email." },
      { status: 503 }
    );
  }

  let result = await insertContact(supabase, payload);

  // If contacts table doesn't exist yet, try to create it via the helper RPC function
  // (run supabase/migration_contacts_fix.sql in Supabase Dashboard to register this function)
  if (!result.success && (result.error?.includes("does not exist") || result.error?.includes("42P01"))) {
    const { error: rpcErr } = await supabase.rpc("setup_contacts_table");
    if (!rpcErr) {
      result = await insertContact(supabase, payload);
    }
  }

  if (result.success) {
    return NextResponse.json({ success: true });
  }

  const errMsg = result.error ?? "";
  if (errMsg.includes("does not exist") || errMsg.includes("42P01")) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Our message system needs a one-time setup. Please contact us directly by email — we will resolve this shortly.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { success: false, error: "Could not save your message. Please try again or contact us by email." },
    { status: 500 }
  );
}
