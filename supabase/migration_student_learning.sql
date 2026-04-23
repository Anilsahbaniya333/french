-- Student Learning Platform Migration (Supabase / PostgreSQL)

-- 1) Enable UUID generator if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Add level_code to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS level_code TEXT;

-- 3) Add/check allowed values for level_code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'students_level_code_check'
  ) THEN
    ALTER TABLE public.students
    ADD CONSTRAINT students_level_code_check
    CHECK (level_code IN ('a1', 'a2', 'b1', 'b2'));
  END IF;
END $$;

-- 4) Create lesson progress table
CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_slp_student
ON public.student_lesson_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_slp_topic
ON public.student_lesson_progress(topic_id);

-- 6) Enable RLS
ALTER TABLE public.student_lesson_progress
ENABLE ROW LEVEL SECURITY;

-- 7) Create policy only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'student_lesson_progress'
      AND policyname = 'Allow all student_lesson_progress'
  ) THEN
    CREATE POLICY "Allow all student_lesson_progress"
    ON public.student_lesson_progress
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;


use practise
create table employ (
name varchar(32),
age int ,
id int primary key,
salary decimal(10,2),
department varchar(32)

);
insert into employ values('anil', 28, 1, 34000,'it'),
('sunil',27,2,45000,'sale');
select department, salary from employ where department='it'