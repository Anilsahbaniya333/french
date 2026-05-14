-- ============================================================
-- MAPPELE FRENCH — Batch Timing (extend groups table)
-- Safe, idempotent. Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE groups ADD COLUMN IF NOT EXISTS schedule_days TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS schedule_time TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_date      DATE;

NOTIFY pgrst, 'reload schema';
SELECT 'Batch timing migration complete.' AS status;
