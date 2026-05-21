import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/auth-admin-check";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const results: Record<string, string> = {};

  async function sql(label: string, query: string) {
    const res = await fetch(`${url}/rest/v1/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key!,
        Authorization: `Bearer ${key}`,
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

  // ── student_availability ─────────────────────────────────────────────────
  await sql("student_availability", `
    CREATE TABLE IF NOT EXISTS student_availability (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
      availability_text TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_id)
    );
  `);

  await sql("student_availability_rls", `
    ALTER TABLE student_availability ENABLE ROW LEVEL SECURITY;
  `);

  await sql("student_availability_policy", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_availability' AND policyname = 'Service role full access sa'
      ) THEN
        CREATE POLICY "Service role full access sa"
          ON student_availability FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);

  // ── learning_checklist_items ─────────────────────────────────────────────
  await sql("learning_checklist_items", `
    CREATE TABLE IF NOT EXISTS learning_checklist_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category TEXT NOT NULL,
      item_text TEXT NOT NULL,
      level_code TEXT,
      target_group_uuids UUID[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await sql("learning_checklist_items_rls", `
    ALTER TABLE learning_checklist_items ENABLE ROW LEVEL SECURITY;
  `);

  await sql("learning_checklist_items_policy", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'learning_checklist_items' AND policyname = 'Service role full access lci'
      ) THEN
        CREATE POLICY "Service role full access lci"
          ON learning_checklist_items FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);

  // ── student_learning_progress ────────────────────────────────────────────
  await sql("student_learning_progress", `
    CREATE TABLE IF NOT EXISTS student_learning_progress (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      checklist_item_id UUID NOT NULL REFERENCES learning_checklist_items(id) ON DELETE CASCADE,
      is_completed BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_id, checklist_item_id)
    );
  `);

  await sql("student_learning_progress_rls", `
    ALTER TABLE student_learning_progress ENABLE ROW LEVEL SECURITY;
  `);

  await sql("student_learning_progress_policy", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'student_learning_progress' AND policyname = 'Service role full access slp'
      ) THEN
        CREATE POLICY "Service role full access slp"
          ON student_learning_progress FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `);

  // ── learning_checklist_items: add description column, make category optional
  await sql("lci_add_description", `
    ALTER TABLE learning_checklist_items ADD COLUMN IF NOT EXISTS description TEXT;
  `);

  await sql("lci_category_optional", `
    DO $$ BEGIN
      ALTER TABLE learning_checklist_items ALTER COLUMN category DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END $$;
  `);

  // ── learning_checklist_items: add optional resource columns ─────────────────
  await sql("lci_add_coverage_notes", `
    ALTER TABLE learning_checklist_items ADD COLUMN IF NOT EXISTS coverage_notes TEXT;
  `);

  await sql("lci_add_video_url", `
    ALTER TABLE learning_checklist_items ADD COLUMN IF NOT EXISTS video_url TEXT;
  `);

  await sql("lci_add_resource_file_url", `
    ALTER TABLE learning_checklist_items ADD COLUMN IF NOT EXISTS resource_file_url TEXT;
  `);

  await sql("lci_add_resource_file_name", `
    ALTER TABLE learning_checklist_items ADD COLUMN IF NOT EXISTS resource_file_name TEXT;
  `);

  await sql("lci_add_exercise_instructions", `
    ALTER TABLE learning_checklist_items ADD COLUMN IF NOT EXISTS exercise_instructions TEXT;
  `);

  // ── learning-checklist-files storage bucket ──────────────────────────────────
  await sql("learning_checklist_files_bucket", `
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('learning-checklist-files', 'learning-checklist-files', true)
    ON CONFLICT (id) DO NOTHING;
  `);

  await sql("learning_checklist_files_read_policy", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'lcf public read'
      ) THEN
        CREATE POLICY "lcf public read"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'learning-checklist-files');
      END IF;
    END $$;
  `);

  await sql("learning_checklist_files_write_policy", `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'lcf service role all'
      ) THEN
        CREATE POLICY "lcf service role all"
          ON storage.objects FOR ALL
          USING (bucket_id = 'learning-checklist-files')
          WITH CHECK (bucket_id = 'learning-checklist-files');
      END IF;
    END $$;
  `);

  const hasErrors = Object.values(results).some((v) => v.startsWith("ERROR"));
  return NextResponse.json({ ok: !hasErrors, results });
}
