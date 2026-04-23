-- Migration: Add all missing columns
-- Run this once in Supabase SQL Editor.

-- assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date_time TIMESTAMPTZ;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score INT DEFAULT 100;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS target_groups JSONB DEFAULT '[]';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- assignment_submissions table (audio recording support)
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS group_number INT;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
