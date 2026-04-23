/**
 * Fallback mock data when Supabase is not configured
 * Used for local development without backend
 */

import type { Level } from "@/types/level";
import type { MethodologyContent } from "@/types/methodology";

const SAMPLE_SKILLS = (
  level: string
): { title: string; sortOrder: number }[] => {
  const byLevel: Record<string, string[]> = {
    a1: [
      "Greetings & introductions",
      "Numbers & alphabet",
      "Basic questions",
      "Simple present tense",
    ],
    a2: [
      "Past tense basics (passé composé)",
      "Daily routines",
      "Shopping & directions",
      "Weather & time",
    ],
    b1: [
      "Conditional & subjunctive",
      "Opinions & debates",
      "Formal writing",
      "Idiomatic expressions",
    ],
    b2: [
      "Advanced grammar",
      "Nuanced expression",
      "Literary analysis",
      "Business French",
    ],
  };
  const skills = byLevel[level] ?? [];
  return skills.map((title, i) => ({ title, sortOrder: i }));
};

const SAMPLE_STUDY_PLAN = (
  level: string
): { title: string; description?: string; sortOrder: number }[] => {
  const plans: Record<string, { title: string; description?: string }[]> = {
    a1: [
      { title: "Week 1-2: Greetings", description: "Bonjour, au revoir, comment ça va?" },
      { title: "Week 3-4: Numbers & colors", description: "Count to 100, basic colors" },
      { title: "Week 5-6: Basic verbs", description: "Être, avoir, faire" },
    ],
    a2: [
      { title: "Week 1-3: Passé composé", description: "Formation and common verbs" },
      { title: "Week 4-6: Daily vocabulary", description: "Routines, time expressions" },
      { title: "Week 7-8: Practical situations", description: "Shopping, directions" },
    ],
    b1: [
      { title: "Week 1-4: Subjunctive", description: "When and how to use" },
      { title: "Week 5-8: Writing skills", description: "Emails, formal letters" },
      { title: "Week 9-12: Fluency practice", description: "Debates, presentations" },
    ],
    b2: [
      { title: "Week 1-4: Advanced grammar", description: "Complex structures" },
      { title: "Week 5-8: Literature", description: "Reading and analysis" },
      { title: "Week 9-12: Exam prep", description: "DELF B2 practice" },
    ],
  };
  const items = plans[level] ?? [];
  return items.map((item, i) => ({ ...item, sortOrder: i }));
};

const SAMPLE_VIDEOS = (
  level: string
): { title: string; url: string; sortOrder: number }[] => {
  const videos: Record<string, { title: string; videoId: string }[]> = {
    a1: [
      { title: "French Alphabet", videoId: "d-glyJJB0Fys" },
      { title: "Greetings in French", videoId: "hQ22eIpiXh4" },
    ],
    a2: [
      { title: "Le passé composé", videoId: "5MnYaMCzne4" },
      { title: "Daily Routine in French", videoId: "hQ22eIpiXh4" },
    ],
    b1: [
      { title: "Subjunctive in French", videoId: "5MnYaMCzne4" },
      { title: "French Idioms", videoId: "hQ22eIpiXh4" },
    ],
    b2: [
      { title: "Advanced French Grammar", videoId: "5MnYaMCzne4" },
      { title: "French Literature Overview", videoId: "hQ22eIpiXh4" },
    ],
  };
  const items = videos[level] ?? [];
  return items.map((item, i) => ({
    title: item.title,
    url: `https://www.youtube.com/embed/${item.videoId}`,
    sortOrder: i,
  }));
};

const SAMPLE_MATERIALS = (
  level: string
): { title: string; description?: string; type: "pdf" | "doc" | "docx" | "link" | "text"; sortOrder: number }[] => {
  const mats: Record<string, { title: string; type: "pdf" | "text" }[]> = {
    a1: [
      { title: "A1 Vocabulary List", type: "pdf" },
      { title: "Pronunciation Guide", type: "text" },
    ],
    a2: [
      { title: "A2 Grammar Summary", type: "pdf" },
      { title: "Verb Conjugation Chart", type: "pdf" },
    ],
    b1: [
      { title: "B1 Reading Comprehension", type: "pdf" },
      { title: "Essay Structure Guide", type: "text" },
    ],
    b2: [
      { title: "B2 Exam Practice", type: "pdf" },
      { title: "Business French Vocabulary", type: "pdf" },
    ],
  };
  const items = mats[level] ?? [];
  return items.map((item, i) => ({
    ...item,
    description: undefined,
    sortOrder: i,
  }));
};

const SAMPLE_ASSIGNMENTS = (
  level: string
): { title: string; description: string; sortOrder: number }[] => {
  const assignments: Record<string, { title: string; description: string }[]> = {
    a1: [
      {
        title: "Introduce yourself",
        description: "Write 5 sentences about yourself in French",
      },
    ],
    a2: [
      {
        title: "My day",
        description: "Describe your typical day using passé composé",
      },
    ],
    b1: [
      {
        title: "Opinion essay",
        description: "Write 200 words on a topic of your choice",
      },
    ],
    b2: [
      {
        title: "Literature analysis",
        description: "Analyze an excerpt from a French novel",
      },
    ],
  };
  const items = assignments[level] ?? [];
  return items.map((item, i) => ({ ...item, sortOrder: i }));
};

export const FALLBACK_LEVELS: Level[] = [
  {
    id: "a1",
    code: "a1",
    title: "A1 - Beginner",
    subtitle: "Start your French journey",
    description:
      "Learn basic greetings, introductions, and everyday phrases. Build a foundation in pronunciation and simple conversations.",
    overview:
      "The A1 course introduces you to French from scratch. You will learn the alphabet, numbers, common greetings, and how to form simple sentences using present tense.",
    duration: "8-10 weeks",
    levelGoals: [
      "Introduce yourself and others",
      "Ask and answer basic questions",
      "Handle simple everyday situations",
    ],
    practiceSection:
      "Practice with flashcards, audio exercises, and short dialogues. We recommend 15-20 minutes of daily practice.",
    isPublished: true,
    skillsCovered: SAMPLE_SKILLS("a1").map((s) => ({ ...s })),
    studyPlanItems: SAMPLE_STUDY_PLAN("a1"),
    videos: SAMPLE_VIDEOS("a1"),
    materials: SAMPLE_MATERIALS("a1"),
    assignments: SAMPLE_ASSIGNMENTS("a1"),
  },
  {
    id: "a2",
    code: "a2",
    title: "A2 - Elementary",
    subtitle: "Build confidence in daily French",
    description:
      "Handle daily situations: shopping, directions, and simple conversations. Expand your vocabulary and grammar.",
    overview:
      "At A2 you consolidate the basics and start handling more complex situations. You will learn the passé composé, daily vocabulary, and practical communication skills.",
    duration: "10-12 weeks",
    levelGoals: [
      "Describe your routine and past events",
      "Navigate shopping and directions",
      "Have short conversations on familiar topics",
    ],
    practiceSection:
      "Combine reading exercises with listening practice. Try writing short paragraphs about your day.",
    isPublished: true,
    skillsCovered: SAMPLE_SKILLS("a2").map((s) => ({ ...s })),
    studyPlanItems: SAMPLE_STUDY_PLAN("a2"),
    videos: SAMPLE_VIDEOS("a2"),
    materials: SAMPLE_MATERIALS("a2"),
    assignments: SAMPLE_ASSIGNMENTS("a2"),
  },
  {
    id: "b1",
    code: "b1",
    title: "B1 - Intermediate",
    subtitle: "Express opinions and handle most situations",
    description:
      "Express opinions, understand main ideas of complex texts, and handle most travel and work situations.",
    overview:
      "B1 focuses on fluency and nuance. You will work on the subjunctive, formal writing, and expressing opinions. Reading and listening comprehension become more challenging.",
    duration: "12-14 weeks",
    levelGoals: [
      "Express opinions and justify them",
      "Write formal emails and short essays",
      "Understand the main points of podcasts and articles",
    ],
    practiceSection:
      "Read French news or blogs daily. Practice writing opinion paragraphs and participating in discussions.",
    isPublished: true,
    skillsCovered: SAMPLE_SKILLS("b1").map((s) => ({ ...s })),
    studyPlanItems: SAMPLE_STUDY_PLAN("b1"),
    videos: SAMPLE_VIDEOS("b1"),
    materials: SAMPLE_MATERIALS("b1"),
    assignments: SAMPLE_ASSIGNMENTS("b1"),
  },
  {
    id: "b2",
    code: "b2",
    title: "B2 - Upper Intermediate",
    subtitle: "Fluency and nuance",
    description:
      "Understand abstract topics and produce detailed, well-structured texts. Prepare for advanced exams.",
    overview:
      "B2 brings you to near-fluency. You will work on literary analysis, business French, and sophisticated grammar. Ideal for DELF B2 preparation.",
    duration: "14-16 weeks",
    levelGoals: [
      "Participate in debates and discussions",
      "Write well-structured argumentative texts",
      "Understand complex spoken and written French",
    ],
    practiceSection:
      "Engage with French media, literature, and discussions. Regular essay writing and speaking practice.",
    isPublished: true,
    skillsCovered: SAMPLE_SKILLS("b2").map((s) => ({ ...s })),
    studyPlanItems: SAMPLE_STUDY_PLAN("b2"),
    videos: SAMPLE_VIDEOS("b2"),
    materials: SAMPLE_MATERIALS("b2"),
    assignments: SAMPLE_ASSIGNMENTS("b2"),
  },
];

export const FALLBACK_METHODOLOGY: MethodologyContent = {
  introduction:
    "We use a communicative approach: learn by doing. You will speak French from day one, with grammar and vocabulary taught in context.",
  teachingApproach:
    "Our lessons blend structure with real-world practice. Each session includes speaking, listening, reading, and writing components.",
  weeklyStructure:
    "Typically 2-3 lessons per week, each 60-90 minutes. Homework includes exercises, reading, and short writing tasks.",
  grammarApproach:
    "Grammar is introduced in context through dialogues and texts. We avoid long drills in favor of practical application.",
  listeningApproach:
    "We use authentic materials: podcasts, videos, and recordings. Start with slower content and progress to native speed.",
  speakingApproach:
    "Every lesson includes speaking. We focus on communication over perfection. Corrections are selective and encouraging.",
  readingApproach:
    "Graded readers and authentic texts. We build vocabulary through reading and discuss content in French.",
  writingApproach:
    "From simple sentences to essays. Writing tasks are linked to topics covered in class.",
  assignmentWorkflow:
    "Assignments are submitted via our platform. You receive feedback within 48 hours. Resubmission is encouraged.",
  progressTracking:
    "We track your progress with regular assessments. You'll see clear milestones and can request a level change when ready.",
};
