/**
 * Fallback curriculum with Level → Module → Topic → Content hierarchy
 * Realistic French course progression (A1–B2)
 */

import type { Level, Module, Topic } from "@/types/curriculum";

function vid(id: string, title: string, videoId: string, desc?: string) {
  return {
    id,
    title,
    url: `https://www.youtube.com/embed/${videoId}`,
    description: desc,
    order: 0,
  };
}

function mat(id: string, title: string, type: "pdf" | "text" | "link", desc?: string) {
  return {
    id,
    title,
    description: desc,
    type,
    publicUrl: type === "link" ? "#" : null,
    contentText: type === "text" ? "Content goes here." : null,
    order: 0,
  };
}

function asgn(id: string, title: string, instructions: string, due?: string) {
  return {
    id,
    title,
    instructions,
    dueNote: due,
    submissionType: "text" as const,
    order: 0,
  };
}

function pract(id: string, title: string, type: Topic["practice"][0]["type"], instructions?: string) {
  return {
    id,
    title,
    type,
    instructions,
    order: 0,
  };
}

// ─── A1 Beginner ───

const A1_MODULES: Module[] = [
  {
    id: "a1_m1",
    levelId: "a1",
    title: "Greetings and Introductions",
    description: "Learn basic greetings and how to introduce yourself.",
    order: 0,
    topics: [
      {
        id: "a1_m1_t1",
        moduleId: "a1_m1",
        title: "Bonjour et Au revoir",
        description: "Basic greetings in French",
        objectives: ["Say hello and goodbye", "Use formal and informal forms"],
        estimatedDuration: "30 min",
        isPreview: true,
        order: 0,
        videos: [vid("a1_t1_v1", "French Greetings", "hQ22eIpiXh4")],
        materials: [mat("a1_t1_m1", "Greetings Vocabulary", "pdf")],
        assignments: [asgn("a1_t1_a1", "Introduce yourself", "Write 5 sentences about yourself in French")],
        practice: [pract("a1_t1_p1", "Match greetings", "mcq", "Match French to English")],
      },
      {
        id: "a1_m1_t2",
        moduleId: "a1_m1",
        title: "Numbers 1–20",
        description: "Counting and basic numbers",
        estimatedDuration: "25 min",
        order: 1,
        videos: [],
        materials: [mat("a1_t2_m1", "Numbers Reference", "pdf")],
        assignments: [],
        practice: [pract("a1_t2_p1", "Count in French", "fill_blank")],
      },
    ],
  },
  {
    id: "a1_m2",
    levelId: "a1",
    title: "Alphabet and Pronunciation",
    description: "Master the French alphabet and key pronunciation rules.",
    order: 1,
    topics: [
      {
        id: "a1_m2_t1",
        moduleId: "a1_m2",
        title: "The French Alphabet",
        description: "Letters and sounds",
        estimatedDuration: "35 min",
        isPreview: true,
        order: 0,
        videos: [vid("a1_m2_v1", "French Alphabet", "d-glyJJB0Fys")],
        materials: [mat("a1_m2_m1", "Pronunciation Guide", "text")],
        assignments: [],
        practice: [pract("a1_m2_p1", "Spell your name", "speaking")],
      },
    ],
  },
  {
    id: "a1_m3",
    levelId: "a1",
    title: "Basic Verbs: Être and Avoir",
    description: "Essential verbs for everyday communication.",
    order: 2,
    topics: [
      {
        id: "a1_m3_t1",
        moduleId: "a1_m3",
        title: "Être – To Be",
        description: "Conjugation and use",
        estimatedDuration: "40 min",
        order: 0,
        videos: [vid("a1_m3_v1", "Être conjugation", "5MnYaMCzne4")],
        materials: [mat("a1_m3_m1", "Verb Chart", "pdf")],
        assignments: [asgn("a1_m3_a1", "Conjugate être", "Write all forms of être")],
        practice: [pract("a1_m3_p1", "Fill in the blank", "fill_blank")],
      },
    ],
  },
];

// ─── A2 Elementary ───

const A2_MODULES: Module[] = [
  {
    id: "a2_m1",
    levelId: "a2",
    title: "Le passé composé",
    description: "Talking about the past.",
    order: 0,
    topics: [
      {
        id: "a2_m1_t1",
        moduleId: "a2_m1",
        title: "Formation of Passé Composé",
        description: "Avoir + past participle",
        estimatedDuration: "45 min",
        isPreview: true,
        order: 0,
        videos: [vid("a2_t1_v1", "Le passé composé", "5MnYaMCzne4")],
        materials: [mat("a2_t1_m1", "A2 Grammar Summary", "pdf")],
        assignments: [asgn("a2_t1_a1", "My day", "Describe your typical day using passé composé")],
        practice: [pract("a2_t1_p1", "Choose the correct form", "mcq")],
      },
    ],
  },
  {
    id: "a2_m2",
    levelId: "a2",
    title: "Daily Routines",
    description: "Describe your day in French.",
    order: 1,
    topics: [
      {
        id: "a2_m2_t1",
        moduleId: "a2_m2",
        title: "Routine Vocabulary",
        description: "Time expressions and verbs",
        estimatedDuration: "35 min",
        order: 0,
        videos: [vid("a2_t2_v1", "Daily Routine", "hQ22eIpiXh4")],
        materials: [mat("a2_t2_m1", "Verb Conjugation Chart", "pdf")],
        assignments: [],
        practice: [pract("a2_t2_p1", "Describe your morning", "writing")],
      },
    ],
  },
];

// ─── B1 Intermediate ───

const B1_MODULES: Module[] = [
  {
    id: "b1_m1",
    levelId: "b1",
    title: "The Subjunctive",
    description: "When and how to use the subjunctive mood.",
    order: 0,
    topics: [
      {
        id: "b1_m1_t1",
        moduleId: "b1_m1",
        title: "Introduction to Subjunctive",
        description: "Triggers and formation",
        estimatedDuration: "50 min",
        isPreview: true,
        order: 0,
        videos: [vid("b1_t1_v1", "Subjunctive in French", "5MnYaMCzne4")],
        materials: [mat("b1_t1_m1", "B1 Reading Comprehension", "pdf")],
        assignments: [asgn("b1_t1_a1", "Opinion essay", "Write 200 words on a topic of your choice")],
        practice: [pract("b1_t1_p1", "Subjunctive or indicative?", "mcq")],
      },
    ],
  },
  {
    id: "b1_m2",
    levelId: "b1",
    title: "Formal Writing",
    description: "Emails and formal letters.",
    order: 1,
    topics: [
      {
        id: "b1_m2_t1",
        moduleId: "b1_m2",
        title: "Writing Emails in French",
        description: "Structure and register",
        estimatedDuration: "45 min",
        order: 0,
        videos: [],
        materials: [mat("b1_t2_m1", "Essay Structure Guide", "text")],
        assignments: [],
        practice: [pract("b1_t2_p1", "Write a formal email", "writing")],
      },
    ],
  },
];

// ─── B2 Upper Intermediate ───

const B2_MODULES: Module[] = [
  {
    id: "b2_m1",
    levelId: "b2",
    title: "Advanced Grammar",
    description: "Complex structures and nuance.",
    order: 0,
    topics: [
      {
        id: "b2_m1_t1",
        moduleId: "b2_m1",
        title: "Literary Analysis",
        description: "Reading and analyzing French texts",
        estimatedDuration: "60 min",
        isPreview: true,
        order: 0,
        videos: [vid("b2_t1_v1", "Advanced French Grammar", "5MnYaMCzne4")],
        materials: [mat("b2_t1_m1", "B2 Exam Practice", "pdf")],
        assignments: [asgn("b2_t1_a1", "Literature analysis", "Analyze an excerpt from a French novel")],
        practice: [pract("b2_t1_p1", "Debate preparation", "speaking")],
      },
    ],
  },
  {
    id: "b2_m2",
    levelId: "b2",
    title: "Business French",
    description: "Professional communication.",
    order: 1,
    topics: [
      {
        id: "b2_m2_t1",
        moduleId: "b2_m2",
        title: "Business Vocabulary",
        description: "Meetings, negotiations, emails",
        estimatedDuration: "50 min",
        order: 0,
        videos: [vid("b2_t2_v1", "French Literature Overview", "hQ22eIpiXh4")],
        materials: [mat("b2_t2_m1", "Business French Vocabulary", "pdf")],
        assignments: [],
        practice: [pract("b2_t2_p1", "Role-play meeting", "speaking")],
      },
    ],
  },
];

// ─── Full curriculum ───

export const FALLBACK_CURRICULUM: Level[] = [
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
    isPublished: true,
    modules: A1_MODULES,
    videos: [], materials: [], assignments: [], practice: [],
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
    isPublished: true,
    modules: A2_MODULES,
    videos: [], materials: [], assignments: [], practice: [],
  },
  {
    id: "b1",
    code: "b1",
    title: "B1 - Intermediate",
    subtitle: "Express opinions and handle most situations",
    description:
      "Express opinions, understand main ideas of complex texts, and handle most travel and work situations.",
    overview:
      "B1 focuses on fluency and nuance. You will work on the subjunctive, formal writing, and expressing opinions.",
    duration: "12-14 weeks",
    levelGoals: [
      "Express opinions and justify them",
      "Write formal emails and short essays",
      "Understand the main points of podcasts and articles",
    ],
    isPublished: true,
    modules: B1_MODULES,
    videos: [], materials: [], assignments: [], practice: [],
  },
  {
    id: "b2",
    code: "b2",
    title: "B2 - Upper Intermediate",
    subtitle: "Fluency and nuance",
    description:
      "Understand abstract topics and produce detailed, well-structured texts. Prepare for advanced exams.",
    overview:
      "B2 brings you to near-fluency. You will work on literary analysis, business French, and sophisticated grammar.",
    duration: "14-16 weeks",
    levelGoals: [
      "Participate in debates and discussions",
      "Write well-structured argumentative texts",
      "Understand complex spoken and written French",
    ],
    isPublished: true,
    modules: B2_MODULES,
    videos: [], materials: [], assignments: [], practice: [],
  },
];
