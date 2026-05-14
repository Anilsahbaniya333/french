-- ============================================================
-- MAPPELE FRENCH — Tutor Profile Extension
-- Safe, idempotent. Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE tutors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]';
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS qualifications JSONB DEFAULT '[]';
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Tutor profile migration complete.' AS status;
