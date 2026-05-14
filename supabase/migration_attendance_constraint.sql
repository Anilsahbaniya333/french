-- Add unique constraint to attendance_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'attendance_sessions'::regclass
      AND contype = 'u'
      AND conname = 'attendance_sessions_group_date_unique'
  ) THEN
    ALTER TABLE attendance_sessions
      ADD CONSTRAINT attendance_sessions_group_date_unique
      UNIQUE (group_id, session_date);
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';
