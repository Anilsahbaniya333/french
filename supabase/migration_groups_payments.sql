-- ============================================================
-- MAPPELE FRENCH — Groups, Tutors & Payment Submissions
-- Safe, idempotent. Run in Supabase SQL Editor.
-- ============================================================

-- ── TUTORS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='tutors' AND policyname='Allow all tutors'
  ) THEN
    CREATE POLICY "Allow all tutors" ON tutors FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── GROUPS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name  TEXT NOT NULL,
  level_code  TEXT CHECK (level_code IN ('a1','a2','b1','b2')),
  tutor_id    UUID REFERENCES tutors(id) ON DELETE SET NULL,
  schedule    TEXT,
  start_date  DATE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='Allow all groups'
  ) THEN
    CREATE POLICY "Allow all groups" ON groups FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);

-- ── PAYMENT SUBMISSIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES groups(id) ON DELETE SET NULL,
  image_url   TEXT NOT NULL,
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='payment_submissions' AND policyname='Allow all payment_submissions'
  ) THEN
    CREATE POLICY "Allow all payment_submissions" ON payment_submissions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_student ON payment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_status  ON payment_submissions(status);

-- ── STORAGE BUCKET: payment-proofs ─────────────────────────
-- Run this block to create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND schemaname='storage'
      AND policyname='Public read payment-proofs'
  ) THEN
    CREATE POLICY "Public read payment-proofs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-proofs');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='objects' AND schemaname='storage'
      AND policyname='Allow upload payment-proofs'
  ) THEN
    CREATE POLICY "Allow upload payment-proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payment-proofs');
  END IF;
END $$;

-- ── RELOAD SCHEMA CACHE ────────────────────────────────────
NOTIFY pgrst, 'reload schema';

SELECT 'Groups + Payments migration complete.' AS status;
