-- ============================================================
-- Migration: Student Feedback + Module/Topic Publishing
-- Run in Supabase SQL Editor (safe, additive only)
-- ============================================================

-- 1. Student Feedback table
--    Students submit course/lesson feedback to admin/tutor.
CREATE TABLE IF NOT EXISTS student_feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name  TEXT NOT NULL,
  student_email TEXT NOT NULL,
  type    TEXT NOT NULL DEFAULT 'general'
          CHECK (type IN ('general', 'lesson', 'technical', 'suggestion', 'other')),
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  subject  TEXT,
  message  TEXT NOT NULL,
  status   TEXT NOT NULL DEFAULT 'unread'
           CHECK (status IN ('unread', 'read', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all feedback" ON student_feedback FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_feedback_student ON student_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON student_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON student_feedback(created_at DESC);

-- 2. Module/topic publishing flags
--    Default true so all existing content stays visible.
ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE topics  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
