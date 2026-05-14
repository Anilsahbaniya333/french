-- ============================================================
-- MAPPELE FRENCH — Attendance
-- Safe, idempotent. Run in Supabase SQL Editor.
-- ============================================================

-- One session per group per date
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, session_date)
);

-- One record per student per session
CREATE TABLE IF NOT EXISTS attendance_records (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'present'
               CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='attendance_sessions' AND policyname='Allow all attendance_sessions') THEN
    CREATE POLICY "Allow all attendance_sessions" ON attendance_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='attendance_records' AND policyname='Allow all attendance_records') THEN
    CREATE POLICY "Allow all attendance_records" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_att_sessions_group ON attendance_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_att_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON attendance_records(student_id);

NOTIFY pgrst, 'reload schema';
SELECT 'Attendance migration complete.' AS status;
