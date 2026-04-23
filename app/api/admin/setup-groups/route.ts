import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function sql(query: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sql`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

export async function GET() {
  const results: Record<string, string> = {};

  // Add group_number column to assignment_submissions (safe to run multiple times)
  const r1 = await sql(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'assignment_submissions' AND column_name = 'group_number'
      ) THEN
        ALTER TABLE assignment_submissions ADD COLUMN group_number INTEGER CHECK (group_number BETWEEN 1 AND 7);
      END IF;
    END $$;
  `);
  results["add_group_number"] = r1.ok ? "OK" : `ERROR: ${r1.body}`;

  return NextResponse.json({ results });
}
