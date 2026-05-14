-- ============================================================
-- MAPPELE FRENCH — Site Settings (contact info, etc.)
-- Safe, idempotent. Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='Allow all site_settings'
  ) THEN
    CREATE POLICY "Allow all site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed default keys
INSERT INTO site_settings (key, value) VALUES
  ('contact_email',   ''),
  ('contact_phone',   ''),
  ('contact_phone_2', ''),
  ('contact_address', '')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
SELECT 'Site settings migration complete.' AS status;
