import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * One-time database setup endpoint.
 * Visit /api/admin/setup-db once to create all tables.
 * Safe to call multiple times (uses CREATE TABLE IF NOT EXISTS).
 */
export async function GET() {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set in .env.local" }, { status: 503 });
  }

  const results: Record<string, string> = {};

  // ── Helper: run a SQL statement via RPC ──────────────────────────────────
  // Supabase exposes pg_catalog and information_schema via PostgREST.
  // For DDL we POST directly to the SQL endpoint available in Supabase projects.
  async function sql(label: string, query: string) {
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

    if (!res.ok) {
      const body = await res.text();
      results[label] = `ERROR: ${res.status} – ${body}`;
      return false;
    }
    results[label] = "OK";
    return true;
  }

  // ── uuid-ossp ────────────────────────────────────────────────────────────
  await sql("uuid_extension", `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // ── student_registrations ────────────────────────────────────────────────
  await sql("student_registrations", `
    CREATE TABLE IF NOT EXISTS student_registrations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      level TEXT NOT NULL,
      experience TEXT,
      preferred_mode TEXT,
      preferred_time TEXT,
      goals TEXT,
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await sql("student_registrations_rls", `
    ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
  `);

  await sql("student_registrations_policy", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_registrations' AND policyname = 'Allow all registrations'
      ) THEN
        CREATE POLICY "Allow all registrations"
          ON student_registrations FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);

  // ── contacts ─────────────────────────────────────────────────────────────
  await sql("contacts", `
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await sql("contacts_rls", `
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
  `);

  await sql("contacts_policy", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contacts' AND policyname = 'Allow all contacts'
      ) THEN
        CREATE POLICY "Allow all contacts"
          ON contacts FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);

  // ── Verify tables exist by querying them ─────────────────────────────────
  const { data: regCheck, error: regErr } = await supabase
    .from("student_registrations")
    .select("id")
    .limit(1);

  const { data: conCheck, error: conErr } = await supabase
    .from("contacts")
    .select("id")
    .limit(1);

  return NextResponse.json({
    steps: results,
    verification: {
      student_registrations: regErr ? `FAIL: ${regErr.message}` : "OK – table accessible",
      contacts: conErr ? `FAIL: ${conErr.message}` : "OK – table accessible",
    },
  });
}
