-- Mappele French - Supabase schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Levels (main course levels A1, A2, B1, B2)
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL CHECK (code IN ('a1', 'a2', 'b1', 'b2')),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  overview TEXT,
  duration TEXT,
  level_goals JSONB DEFAULT '[]',
  practice_section TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Level skills (one per row)
CREATE TABLE IF NOT EXISTS level_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study plan items
CREATE TABLE IF NOT EXISTS level_study_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos (YouTube or other embed URLs)
CREATE TABLE IF NOT EXISTS level_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials (PDF, DOC, link, text - files in Storage)
CREATE TABLE IF NOT EXISTS level_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'doc', 'docx', 'link', 'text')),
  file_path TEXT,
  public_url TEXT,
  content_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS level_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Methodology (single-row config)
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

-- Student registrations
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

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum: Modules (belong to a level)
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum: Topics (belong to a module)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  objectives JSONB DEFAULT '[]',
  estimated_duration TEXT,
  is_preview BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum: Videos (belong to a topic)
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum: Materials (belong to a topic)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'doc', 'docx', 'link', 'text')),
  public_url TEXT,
  content_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum: Assignments (belong to a topic)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  due_note TEXT,
  submission_type TEXT,
  score INT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum: Practice exercises (belong to a topic)
CREATE TABLE IF NOT EXISTS practice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  instructions TEXT,
  content JSONB,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_level_skills_level ON level_skills(level_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modules_level ON modules(level_id);
CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);
CREATE INDEX IF NOT EXISTS idx_videos_topic ON videos(topic_id);
CREATE INDEX IF NOT EXISTS idx_materials_topic ON materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_assignments_topic ON assignments(topic_id);
CREATE INDEX IF NOT EXISTS idx_practice_topic ON practice(topic_id);
CREATE INDEX IF NOT EXISTS idx_level_study_plan_level ON level_study_plan_items(level_id);
CREATE INDEX IF NOT EXISTS idx_level_videos_level ON level_videos(level_id);
CREATE INDEX IF NOT EXISTS idx_level_materials_level ON level_materials(level_id);
CREATE INDEX IF NOT EXISTS idx_level_assignments_level ON level_assignments(level_id);

-- RLS: Allow all for anon (development-friendly)
-- In production, add auth and restrict admin operations
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_study_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all levels" ON levels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all skills" ON level_skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all study_plan" ON level_study_plan_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all videos" ON level_videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all materials" ON level_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all assignments" ON level_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all methodology" ON methodology_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all registrations" ON student_registrations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read contacts" ON contacts FOR SELECT USING (true);

-- Topics: extended columns for lesson content
ALTER TABLE topics ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS video_title TEXT;

-- Materials: add topic_id FK (materials can belong to a topic OR a level)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;

-- Assignments: extended columns
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date_time TIMESTAMPTZ;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score INT DEFAULT 100;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Exercises (MCQ per topic)
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

-- Exercise attempts (student answers)
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  submission_text TEXT,
  file_url TEXT,
  score INT,
  feedback TEXT,
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exercises_topic ON exercises(topic_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all exercises" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all exercise_attempts" ON exercise_attempts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all assignment_submissions" ON assignment_submissions FOR ALL USING (true) WITH CHECK (true);

-- Storage buckets (create via Supabase Dashboard or CLI):
-- supabase storage create course-videos --public
-- supabase storage create materials --public
-- supabase storage create assignments --public

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all modules" ON modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all topics" ON topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all videos" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all practice" ON practice FOR ALL USING (true) WITH CHECK (true);

-- ── Students (login accounts created by admin) ────────────────────────────────
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
CREATE POLICY "Allow all students" ON students FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);

-- ── Extend assignment_submissions ─────────────────────────────────────────────
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS group_number INT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── Extend assignments with target_groups ────────────────────────────────────
-- target_groups: JSONB array of group numbers, e.g. [1,3,5]. Empty = all groups.
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_groups JSONB DEFAULT '[]';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
