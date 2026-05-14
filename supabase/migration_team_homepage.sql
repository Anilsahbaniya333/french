-- Safe migration: add show_on_homepage to tutors + create staff_profiles table

ALTER TABLE tutors ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS staff_profiles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  role             TEXT        NOT NULL,
  photo_url        TEXT,
  description      TEXT,
  show_on_homepage BOOLEAN     DEFAULT false,
  sort_order       INTEGER     DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'staff_profiles'
      AND policyname = 'Service role full access on staff_profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role full access on staff_profiles"
      ON staff_profiles FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';
