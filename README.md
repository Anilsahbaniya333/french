# Mappele French

A French tutoring platform where students explore levels (A1–B2) and apply for classes. Built with Next.js, React, Tailwind CSS, and Supabase.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase env vars, the app uses **fallback mock data** so you can develop and test immediately.

## Connect Supabase

1. Copy the env template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Supabase credentials (from [Dashboard](https://supabase.com/dashboard) → Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # optional, for uploads
   ```

3. Run the SQL in Supabase:

   - [supabase/schema.sql](supabase/schema.sql) – tables
   - [supabase/seed.sql](supabase/seed.sql) – seed levels + methodology
   - [supabase/storage-bucket.sql](supabase/storage-bucket.sql) – `course-materials` bucket

4. In Supabase Dashboard → Storage, create bucket `course-materials` (public) if the SQL doesn’t create it.

## Project Structure

```
app/
  (site)/           # Public site (Navbar + Footer)
    page.tsx        # Home
    about/
    courses/        # List + /courses/[level]
    methodology/
    assignments/
    register/       # Student registration form
    contact/
  (admin)/          # Admin (sidebar layout, no site nav)
    admin/
      page.tsx      # Dashboard
      levels/       # Level editor
      registrations/
      methodology/
  api/              # API routes
    register/
    registrations/
    methodology/
    materials/upload/

components/
  Navbar.tsx, Footer.tsx
  levels/           # VideoEmbed, MaterialCard, LevelPageLayout
  admin/            # LevelEditor, RegistrationsList, MethodologyEditor
  forms/            # RegistrationForm
  ui/               # Button, Card, Icon

lib/
  content.ts        # getLevels, getLevelByCode, getMethodology (Supabase or fallback)
  fallback-data.ts  # Mock data when Supabase not configured
  supabase/
    client.ts, server.ts
    queries.ts, storage.ts

types/
  level.ts, material.ts, registration.ts, methodology.ts

data/
  site.ts           # Why choose us, methodology preview (homepage)

supabase/
  schema.sql        # DB tables
  seed.sql          # Seed content
  storage-bucket.sql
```

## Database Design

| Table | Purpose |
|-------|---------|
| `levels` | A1, A2, B1, B2 course info |
| `level_skills` | Skills per level |
| `level_study_plan_items` | Study plan steps |
| `level_videos` | YouTube embeds |
| `level_materials` | PDFs, docs, links (files in Storage) |
| `level_assignments` | Assignments per level |
| `methodology_content` | Editable methodology page |
| `student_registrations` | Registration form submissions |

## Storage Bucket

- **Bucket:** `course-materials`
- **Purpose:** Upload PDF, DOC, DOCX, TXT for course materials
- **Flow:** Admin uploads file → saved to Storage → material row created with `public_url` → public course page shows it

## Content Flow

1. **Fallback mode:** If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing, `lib/content.ts` returns mock data from `lib/fallback-data.ts`.
2. **Supabase mode:** Content is fetched from Supabase. If tables are empty, fallback data is still used as default.
3. **Student registration:** Saves to Supabase when configured; otherwise saves to browser `localStorage` (visible in Admin → Students when no Supabase).

## Where to Edit Content

| Content | Location |
|---------|----------|
| Levels, skills, videos, materials, assignments | Admin → Levels (or `lib/fallback-data.ts` for dev) |
| Methodology | Admin → Methodology |
| Student registrations | Admin → Students |
| Why choose us, homepage methodology preview | `data/site.ts` |

## Production Build

```bash
npm run build
npm start
```
