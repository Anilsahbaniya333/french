-- Daily Recording Posts table
CREATE TABLE IF NOT EXISTS daily_recording_posts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID        REFERENCES groups(id) ON DELETE CASCADE,
  title               TEXT        NOT NULL,
  class_date          DATE,
  description         TEXT,
  video_url           TEXT,
  file_url            TEXT,
  file_name           TEXT,
  special_instructions TEXT,
  is_published        BOOLEAN     NOT NULL DEFAULT true,
  sort_order          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE daily_recording_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'daily_recording_posts'
      AND policyname = 'Service role full access on daily_recording_posts'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role full access on daily_recording_posts"
      ON daily_recording_posts FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';

-- MANUAL STEP: create the storage bucket in Supabase Dashboard
-- Dashboard → Storage → New bucket
-- Name: daily-recording-files
-- Public: OFF (private)
