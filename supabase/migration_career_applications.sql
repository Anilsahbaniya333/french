-- career_applications table
CREATE TABLE IF NOT EXISTS career_applications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID        REFERENCES careers(id) ON DELETE SET NULL,
  full_name  TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT,
  message    TEXT,
  resume_url TEXT,
  status     TEXT        NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'career_applications'
      AND policyname = 'Service role full access on career_applications'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role full access on career_applications"
      ON career_applications FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';

-- MANUAL STEP: create the storage bucket in Supabase Dashboard
-- Dashboard → Storage → New bucket
-- Name: career-resumes
-- Public: OFF (private)
-- Or via Supabase CLI: supabase storage create career-resumes
