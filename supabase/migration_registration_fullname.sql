-- Ensure full_name column exists on student_registrations and reload PostgREST schema cache

ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Reload PostgREST schema cache so the column is recognised immediately
NOTIFY pgrst, 'reload schema';
