-- ============================================================
-- MAPPELL FRENCH — Registration v2 (course packages, no upfront payment)
-- Safe & idempotent. Run in the Supabase SQL Editor.
--
-- The app works before this runs (it falls back to packing the new
-- fields into the legacy columns), but run it so admins get clean,
-- filterable columns.
-- ============================================================

ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS course_package     TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS country_timezone   TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS current_level      TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS preferred_schedule TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS learning_goal      TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS consent_at         TIMESTAMPTZ;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS source_ip_hash     TEXT;

-- Payment proof is no longer collected at registration
ALTER TABLE student_registrations ALTER COLUMN payment_screenshot_url DROP NOT NULL;

CREATE INDEX IF NOT EXISTS student_registrations_email_created_idx
  ON student_registrations (lower(email), created_at DESC);

NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------
-- RECOMMENDED (security): the original schema created a policy
-- "Allow all registrations" FOR ALL USING (true), which lets anyone
-- holding the public anon key READ every registration (names,
-- emails, phone numbers). The website writes and the admin panel
-- reads registrations through the service-role key, so the anon
-- key does not need access at all.
--
-- Only run this once SUPABASE_SERVICE_ROLE_KEY is set in your
-- deployment environment, otherwise the admin list will be empty.
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "Allow all registrations" ON student_registrations;
