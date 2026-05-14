-- Careers / jobs table

CREATE TABLE IF NOT EXISTS careers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  location    TEXT,
  job_type    TEXT,
  description TEXT,
  requirements TEXT,
  is_active   BOOLEAN     DEFAULT true,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'careers'
      AND policyname = 'Service role full access on careers'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role full access on careers"
      ON careers FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';
