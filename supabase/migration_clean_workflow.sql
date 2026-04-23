-- ============================================================
-- MAPPELE FRENCH — Clean Workflow Migration
-- Safe, idempotent. Run in Supabase SQL Editor.
-- ============================================================

-- ── 1. STUDENT_REGISTRATIONS: add missing columns ──────────
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS preferred_mode TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS preferred_time TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS goals TEXT;

-- Add status constraint (safe: only adds if not already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'student_registrations_status_check'
  ) THEN
    ALTER TABLE student_registrations
      ADD CONSTRAINT student_registrations_status_check
      CHECK (status IN ('pending','approved','rejected'));
  END IF;
END $$;

-- ── 2. ASSIGNMENTS: add target_group_uuids (UUID array) ──────
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_group_uuids UUID[] DEFAULT '{}';

-- ── 3. STUDENTS: add group_uuid for UUID-based group linking ─
ALTER TABLE students ADD COLUMN IF NOT EXISTS group_uuid UUID;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_group_uuid_fkey'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_group_uuid_fkey
      FOREIGN KEY (group_uuid) REFERENCES groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. PROGRAMS table (homepage programs/offers) ───────────
CREATE TABLE IF NOT EXISTS programs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  subtitle    TEXT,
  tutor_name  TEXT,
  badge       TEXT,           -- e.g. "Free", "New", "Ongoing", "Paid"
  cta_label   TEXT DEFAULT 'Learn more',
  cta_href    TEXT,           -- optional link target
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='programs' AND policyname='Allow all programs'
  ) THEN
    CREATE POLICY "Allow all programs" ON programs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active, sort_order);

-- ── 5. STORAGE BUCKET: registration-proofs ─────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-proofs', 'registration-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND schemaname='storage'
      AND policyname='Public read registration-proofs'
  ) THEN
    CREATE POLICY "Public read registration-proofs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'registration-proofs');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND schemaname='storage'
      AND policyname='Allow upload registration-proofs'
  ) THEN
    CREATE POLICY "Allow upload registration-proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'registration-proofs');
  END IF;
END $$;

-- ── RELOAD SCHEMA CACHE ────────────────────────────────────
NOTIFY pgrst, 'reload schema';

SELECT 'Clean workflow migration complete.' AS status;
