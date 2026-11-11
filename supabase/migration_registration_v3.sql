-- ============================================================
-- MAPPELL FRENCH — Registration v3: payment verification workflow
-- Run AFTER migration_registration_v2.sql. Safe & idempotent.
-- ============================================================

-- 1. New workflow statuses
ALTER TABLE student_registrations DROP CONSTRAINT IF EXISTS student_registrations_status_check;
ALTER TABLE student_registrations
  ADD CONSTRAINT student_registrations_status_check
  CHECK (status IN ('pending', 'payment_verified', 'approved', 'info_required', 'rejected'));
ALTER TABLE student_registrations ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Review fields + link to the activated student account
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS admin_notes  TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMPTZ;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS student_id   UUID REFERENCES students(id) ON DELETE SET NULL;

-- 3. Students: which package they enrolled in
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_package  TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS registration_id UUID;

-- 4. Registration history (audit trail of every status change / admin action)
CREATE TABLE IF NOT EXISTS registration_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
  event           TEXT NOT NULL,          -- submitted | status_changed | account_activated | note
  from_status     TEXT,
  to_status       TEXT,
  note            TEXT,
  actor           TEXT NOT NULL DEFAULT 'system',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS registration_events_reg_idx ON registration_events (registration_id, created_at);

-- Service role only (no anon access to PII / audit data)
ALTER TABLE registration_events ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------
-- Payment screenshots are stored in the PRIVATE storage bucket
-- "registration-payments" (created automatically by the app on first
-- upload). Verify in Supabase → Storage that it is NOT public.
--
-- Recommended once SUPABASE_SERVICE_ROLE_KEY is set in production
-- (see migration_registration_v2.sql):
-- DROP POLICY IF EXISTS "Allow all registrations" ON student_registrations;
-- ------------------------------------------------------------
