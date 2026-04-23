-- Schema fixes: ensure all columns used by the application exist
-- Run this in Supabase SQL Editor if you encounter missing column errors.

-- 1. materials table: add file_url / file_type (admin TopicEditor uses these)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 2. materials table: add topic_id FK (TopicEditor links materials to topics)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;

-- 3. topics table: add content columns used by TopicEditor
ALTER TABLE topics ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_title TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS estimated_duration TEXT;

-- 4. assignments table: add columns used by topic assignment editor
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date_time TIMESTAMPTZ;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score INT DEFAULT 100;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. assignment_submissions table: add audio_url column
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 6. students table: add level_code and group_id
ALTER TABLE students ADD COLUMN IF NOT EXISTS level_code TEXT CHECK (level_code IN ('a1','a2','b1','b2'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS group_id INT;

-- 7. student_lesson_progress table (created by migration_student_learning.sql)
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

-- 8. assignments: ensure target_groups can be stored (encoded in description field via app logic)
-- No migration needed - app uses __tg__[...] prefix encoding in description column.

-- 9. exercises table (should exist from schema, but ensure it does)
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

-- 10. Indexes for student portal performance
CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_student ON student_lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_topic ON student_lesson_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_materials_topic ON materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_exercises_topic ON exercises(topic_id);
CREATE INDEX IF NOT EXISTS idx_assignments_topic ON assignments(topic_id);
