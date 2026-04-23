-- ============================================================
-- MAPPELE FRENCH — Full Database Setup (safe, idempotent)
-- Run this ONCE in your Supabase SQL Editor.
-- Safe to re-run. Uses IF NOT EXISTS everywhere.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── LEVELS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL CHECK (code IN ('a1', 'a2', 'b1', 'b2')),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL DEFAULT '',
  overview TEXT,
  duration TEXT,
  level_goals JSONB DEFAULT '[]',
  practice_section TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='levels' AND policyname='Allow all levels') THEN
    CREATE POLICY "Allow all levels" ON levels FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed the 4 default levels (safe upsert)
INSERT INTO levels (code, title, subtitle, description, overview, duration, level_goals, is_published) VALUES
('a1','A1 - Beginner','Start your French journey',
 'Learn basic greetings, introductions, and everyday phrases.',
 'The A1 course introduces you to French from scratch.',
 '8-10 weeks','["Introduce yourself","Ask basic questions","Handle simple situations"]',true),
('a2','A2 - Elementary','Build confidence in daily French',
 'Handle daily situations: shopping, directions, and simple conversations.',
 'At A2 you consolidate the basics and start handling more complex situations.',
 '10-12 weeks','["Describe your routine","Navigate shopping","Have short conversations"]',true),
('b1','B1 - Intermediate','Express opinions and handle most situations',
 'Express opinions, understand main ideas, and handle most travel situations.',
 'B1 focuses on fluency and nuance.',
 '12-14 weeks','["Express opinions","Write formal emails","Understand podcasts"]',true),
('b2','B2 - Upper Intermediate','Fluency and nuance',
 'Understand abstract topics and produce detailed, well-structured texts.',
 'B2 brings you to near-fluency.',
 '14-16 weeks','["Participate in debates","Write argumentative texts","Understand complex French"]',true)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- ── MODULES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='modules' AND policyname='Allow all modules') THEN
    CREATE POLICY "Allow all modules" ON modules FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_modules_level ON modules(level_id);

-- Add is_published if upgrading from old schema
ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

-- ── TOPICS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  video_url TEXT,
  video_title TEXT,
  objectives JSONB DEFAULT '[]',
  estimated_duration TEXT,
  is_preview BOOLEAN DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='topics' AND policyname='Allow all topics') THEN
    CREATE POLICY "Allow all topics" ON topics FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);

-- Add columns for upgrades
ALTER TABLE topics ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_title TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS estimated_duration TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

-- ── VIDEOS (per topic) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='videos' AND policyname='Allow all videos_topic') THEN
    CREATE POLICY "Allow all videos_topic" ON videos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_videos_topic ON videos(topic_id);

-- ── MATERIALS (per topic) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf', 'doc', 'docx', 'link', 'text')),
  file_url TEXT,
  file_type TEXT,
  public_url TEXT,
  content_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='materials' AND policyname='Allow all materials_topic') THEN
    CREATE POLICY "Allow all materials_topic" ON materials FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;

-- ── ASSIGNMENTS (per topic) ────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  level_id UUID REFERENCES levels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  description TEXT,
  due_date_time TIMESTAMPTZ,
  max_score INT DEFAULT 100,
  target_groups JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignments' AND policyname='Allow all assignments_topic') THEN
    CREATE POLICY "Allow all assignments_topic" ON assignments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date_time TIMESTAMPTZ;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score INT DEFAULT 100;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_groups JSONB DEFAULT '[]';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES levels(id) ON DELETE SET NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS description TEXT;

-- ── EXERCISES (MCQ per topic) ──────────────────────────────
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='exercises' AND policyname='Allow all exercises') THEN
    CREATE POLICY "Allow all exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── STUDENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  group_id INT CHECK (group_id BETWEEN 1 AND 7),
  level_code TEXT CHECK (level_code IN ('a1','a2','b1','b2')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='students' AND policyname='Allow all students') THEN
    CREATE POLICY "Allow all students" ON students FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE students ADD COLUMN IF NOT EXISTS level_code TEXT CHECK (level_code IN ('a1','a2','b1','b2'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS group_id INT CHECK (group_id BETWEEN 1 AND 7);

CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- ── ASSIGNMENT SUBMISSIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  audio_url TEXT,
  score INT,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','reviewed','graded','feedback_sent','completed')),
  group_number INT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assignment_submissions' AND policyname='Allow all submissions') THEN
    CREATE POLICY "Allow all submissions" ON assignment_submissions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS group_number INT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON assignment_submissions(student_email);

-- ── STUDENT LESSON PROGRESS ────────────────────────────────
CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_lesson_progress' AND policyname='Allow all progress') THEN
    CREATE POLICY "Allow all progress" ON student_lesson_progress FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── STUDENT FEEDBACK ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general'
    CHECK (type IN ('general','lesson','technical','suggestion','other')),
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread'
    CHECK (status IN ('unread','read','resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_feedback' AND policyname='Allow all feedback') THEN
    CREATE POLICY "Allow all feedback" ON student_feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── CONTACTS & REGISTRATIONS ───────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contacts' AND policyname='Allow all contacts') THEN
    CREATE POLICY "Allow all contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS student_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  level TEXT NOT NULL,
  experience TEXT,
  preferred_mode TEXT,
  preferred_time TEXT,
  goals TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_registrations' AND policyname='Allow all registrations') THEN
    CREATE POLICY "Allow all registrations" ON student_registrations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── METHODOLOGY ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS methodology_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  introduction TEXT,
  teaching_approach TEXT,
  weekly_structure TEXT,
  grammar_approach TEXT,
  listening_approach TEXT,
  speaking_approach TEXT,
  reading_approach TEXT,
  writing_approach TEXT,
  assignment_workflow TEXT,
  progress_tracking TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE methodology_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='methodology_content' AND policyname='Allow all methodology') THEN
    CREATE POLICY "Allow all methodology" ON methodology_content FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── RELOAD SCHEMA CACHE ────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── DONE ───────────────────────────────────────────────────
SELECT 'Setup complete. All tables created or already exist.' AS status;
