-- ============================================================
-- MAPPELE FRENCH — Course Fees
-- Safe, idempotent. Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE levels ADD COLUMN IF NOT EXISTS fee      TEXT;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS fee_note TEXT;

NOTIFY pgrst, 'reload schema';
SELECT 'Course fees migration complete.' AS status;
