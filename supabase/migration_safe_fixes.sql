-- ============================================================
-- Safe Fixes Migration
-- Run this in Supabase SQL Editor if you encounter errors
-- about missing columns. All statements are additive and safe.
-- ============================================================

-- 1. student_registrations: ensure full_name column exists
--    (original schema uses full_name; older code may have used 'name')
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS full_name TEXT;

-- If you have a 'name' column from an older schema, copy data across:
-- UPDATE student_registrations SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- 2. Reload PostgREST schema cache (run after any ALTER TABLE)
NOTIFY pgrst, 'reload schema';
