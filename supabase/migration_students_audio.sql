-- Migration: Add students table + extend assignment_submissions and assignments
-- Run this in Supabase SQL Editor if your database was created before this migration.

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  group_id INT CHECK (group_id BETWEEN 1 AND 7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Allow all students'
  ) THEN
    CREATE POLICY "Allow all students" ON students FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);

-- Extend assignment_submissions
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS group_number INT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Extend assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_groups JSONB DEFAULT '[]';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
