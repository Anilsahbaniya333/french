-- Fix contacts table (uses gen_random_uuid — no uuid-ossp extension needed)
-- Run this in Supabase Dashboard → SQL Editor if contact form submissions are failing.

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contacts' AND policyname = 'Allow insert contacts'
  ) THEN
    CREATE POLICY "Allow insert contacts" ON contacts FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contacts' AND policyname = 'Allow read contacts'
  ) THEN
    CREATE POLICY "Allow read contacts" ON contacts FOR SELECT USING (true);
  END IF;
END $$;

-- Optional helper function so the app can auto-create this table via RPC
CREATE OR REPLACE FUNCTION setup_contacts_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Allow insert contacts'
  ) THEN
    CREATE POLICY "Allow insert contacts" ON contacts FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'Allow read contacts'
  ) THEN
    CREATE POLICY "Allow read contacts" ON contacts FOR SELECT USING (true);
  END IF;
END;
$$;
