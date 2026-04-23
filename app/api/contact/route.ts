import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import { insertContact } from "@/lib/supabase/queries";

export async function POST(req: Request) {
  const body = await req.json();

  const payload = {
    fullName: (body.fullName ?? "").trim(),
    email: (body.email ?? "").trim(),
    message: (body.message ?? "").trim(),
  };

  if (!payload.fullName || !payload.email || !payload.message) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient() ?? createServerClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured. Add Supabase credentials to .env.local." },
      { status: 503 }
    );
  }

  const result = await insertContact(supabase, payload);

  if (result.success) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, error: result.error || "Could not save message." },
    { status: 500 }
  );
}
