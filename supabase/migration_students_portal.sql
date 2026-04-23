-- ============================================================
-- Student Portal Migration
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================

-- 1. Make sure the students table exists with all needed columns
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

-- 2. Add level_code (student's assigned French level)
ALTER TABLE students ADD COLUMN IF NOT EXISTS level_code TEXT
  CHECK (level_code IN ('a1','a2','b1','b2'));

-- 3. Enable RLS and allow service role full access
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all students" ON students;
CREATE POLICY "Allow all students" ON students FOR ALL USING (true) WITH CHECK (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);

-- 5. Student lesson progress (tracks which topics each student completed)
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all progress" ON student_lesson_progress;
CREATE POLICY "Allow all progress" ON student_lesson_progress FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_slp_student ON student_lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_slp_topic ON student_lesson_progress(topic_id);

-- 6. Materials: add file_url / file_type columns (used by TopicEditor)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 7. Topics: add content columns used by TopicEditor
ALTER TABLE topics ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_title TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS estimated_duration TEXT;

-- 8. assignments extended columns
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date_time TIMESTAMPTZ;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score INT DEFAULT 100;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_groups JSONB DEFAULT '[]';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;

-- 9. assignment_submissions extended columns
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS group_number INT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

-- 10. Exercises table (MCQ per topic)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  explanation TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all exercises" ON exercises;
CREATE POLICY "Allow all exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);

-- 11. IMPORTANT: Reload PostgREST schema cache so new columns are visible
NOTIFY pgrst, 'reload schema';
