-- Seed levels and methodology (run after schema.sql)

-- Methodology: delete existing and insert fresh (single row)
DELETE FROM methodology_content;

INSERT INTO methodology_content (
  introduction,
  teaching_approach,
  weekly_structure,
  grammar_approach,
  listening_approach,
  speaking_approach,
  reading_approach,
  writing_approach,
  assignment_workflow,
  progress_tracking
) VALUES (
  'We use a communicative approach: learn by doing. You will speak French from day one, with grammar and vocabulary taught in context.',
  'Our lessons blend structure with real-world practice. Each session includes speaking, listening, reading, and writing components.',
  'Typically 2-3 lessons per week, each 60-90 minutes. Homework includes exercises, reading, and short writing tasks.',
  'Grammar is introduced in context through dialogues and texts. We avoid long drills in favor of practical application.',
  'We use authentic materials: podcasts, videos, and recordings. Start with slower content and progress to native speed.',
  'Every lesson includes speaking. We focus on communication over perfection. Corrections are selective and encouraging.',
  'Graded readers and authentic texts. We build vocabulary through reading and discuss content in French.',
  'From simple sentences to essays. Writing tasks are linked to topics covered in class.',
  'Assignments are submitted via our platform. You receive feedback within 48 hours. Resubmission is encouraged.',
  'We track your progress with regular assessments. You''ll see clear milestones and can request a level change when ready.'
);

-- Insert levels (A1, A2, B1, B2)
INSERT INTO levels (code, title, subtitle, description, overview, duration, level_goals, practice_section, is_published) VALUES
('a1', 'A1 - Beginner', 'Start your French journey', 'Learn basic greetings, introductions, and everyday phrases. Build a foundation in pronunciation and simple conversations.', 'The A1 course introduces you to French from scratch. You will learn the alphabet, numbers, common greetings, and how to form simple sentences using present tense.', '8-10 weeks', '["Introduce yourself and others","Ask and answer basic questions","Handle simple everyday situations"]', 'Practice with flashcards, audio exercises, and short dialogues. We recommend 15-20 minutes of daily practice.', true),
('a2', 'A2 - Elementary', 'Build confidence in daily French', 'Handle daily situations: shopping, directions, and simple conversations. Expand your vocabulary and grammar.', 'At A2 you consolidate the basics and start handling more complex situations. You will learn the passé composé, daily vocabulary, and practical communication skills.', '10-12 weeks', '["Describe your routine and past events","Navigate shopping and directions","Have short conversations on familiar topics"]', 'Combine reading exercises with listening practice. Try writing short paragraphs about your day.', true),
('b1', 'B1 - Intermediate', 'Express opinions and handle most situations', 'Express opinions, understand main ideas of complex texts, and handle most travel and work situations.', 'B1 focuses on fluency and nuance. You will work on the subjunctive, formal writing, and expressing opinions. Reading and listening comprehension become more challenging.', '12-14 weeks', '["Express opinions and justify them","Write formal emails and short essays","Understand the main points of podcasts and articles"]', 'Read French news or blogs daily. Practice writing opinion paragraphs and participating in discussions.', true),
('b2', 'B2 - Upper Intermediate', 'Fluency and nuance', 'Understand abstract topics and produce detailed, well-structured texts. Prepare for advanced exams.', 'B2 brings you to near-fluency. You will work on literary analysis, business French, and sophisticated grammar. Ideal for DELF B2 preparation.', '14-16 weeks', '["Participate in debates and discussions","Write well-structured argumentative texts","Understand complex spoken and written French"]', 'Engage with French media, literature, and discussions. Regular essay writing and speaking practice.', true)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  overview = EXCLUDED.overview,
  duration = EXCLUDED.duration,
  level_goals = EXCLUDED.level_goals,
  practice_section = EXCLUDED.practice_section,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Note: level_skills, level_videos, level_materials, level_assignments need level IDs
-- Run this after levels are created, or use a script to get level IDs and insert
-- For simplicity, the app uses fallback data when Supabase tables are empty
