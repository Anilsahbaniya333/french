-- Create storage buckets
-- Run in Supabase SQL Editor

-- course-materials bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read course-materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-materials');

CREATE POLICY "Allow upload course-materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-materials');

-- assignments bucket (student audio recordings and file uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read assignments"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignments');

CREATE POLICY "Allow upload assignments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assignments');

CREATE POLICY "Allow delete assignments"
ON storage.objects FOR DELETE
USING (bucket_id = 'assignments');
