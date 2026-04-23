-- Materials table: add file_url and file_type columns
-- The admin TopicEditor and materials API use these column names.
-- Run this if your materials table was created with the original schema
-- (which used public_url / type instead).

ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_type TEXT;
