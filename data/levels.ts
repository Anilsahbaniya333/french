/**
 * Mock data for French levels (A1–B2)
 * Later: replace with Supabase queries
 */

export interface Level {
  id: string;
  title: string;
  description: string;
  skills: string[];
  studyPlan: string[];
  videos: { title: string; url: string }[];
  materials: { title: string; type: "pdf" | "text"; url?: string }[];
  assignments: { title: string; description: string }[];
}

export const LEVELS: Level[] = [
  {
    id: "a1",
    title: "A1 - Beginner",
    description: "Start your French journey. Learn basic greetings, introductions, and everyday phrases.",
    skills: ["Greetings & introductions", "Numbers & alphabet", "Basic questions", "Simple present tense"],
    studyPlan: ["Week 1-2: Greetings", "Week 3-4: Numbers & colors", "Week 5-6: Basic verbs"],
    videos: [
      { title: "French Alphabet", url: "https://www.youtube.com/embed/d-glyJJB0Fys" },
      { title: "Greetings in French", url: "https://www.youtube.com/embed/hQ22eIpiXh4" },
    ],
    materials: [
      { title: "A1 Vocabulary List", type: "pdf" },
      { title: "Pronunciation Guide", type: "text" },
    ],
    assignments: [
      { title: "Introduce yourself", description: "Write 5 sentences about yourself in French" },
    ],
  },
  {
    id: "a2",
    title: "A2 - Elementary",
    description: "Build confidence. Handle daily situations: shopping, directions, and simple conversations.",
    skills: ["Past tense basics", "Daily routines", "Shopping & directions", "Weather & time"],
    studyPlan: ["Week 1-3: Past tense", "Week 4-6: Daily vocabulary", "Week 7-8: Practical situations"],
    videos: [
      { title: " passé composé", url: "https://www.youtube.com/embed/5MnYaMCzne4" },
      { title: "Daily Routine", url: "https://www.youtube.com/embed/hQ22eIpiXh4" },
    ],
    materials: [
      { title: "A2 Grammar Summary", type: "pdf" },
      { title: "Verb Conjugation Chart", type: "pdf" },
    ],
    assignments: [
      { title: "My day", description: "Describe your typical day using passé composé" },
    ],
  },
  {
    id: "b1",
    title: "B1 - Intermediate",
    description: "Express opinions and handle most travel situations. Understand main ideas of complex texts.",
    skills: ["Conditional & subjunctive", "Opinions & debates", "Formal writing", "Idiomatic expressions"],
    studyPlan: ["Week 1-4: Subjunctive", "Week 5-8: Writing skills", "Week 9-12: Fluency practice"],
    videos: [
      { title: "Subjunctive in French", url: "https://www.youtube.com/embed/5MnYaMCzne4" },
      { title: "French Idioms", url: "https://www.youtube.com/embed/hQ22eIpiXh4" },
    ],
    materials: [
      { title: "B1 Reading Comprehension", type: "pdf" },
      { title: "Essay Structure Guide", type: "text" },
    ],
    assignments: [
      { title: "Opinion essay", description: "Write 200 words on a topic of your choice" },
    ],
  },
  {
    id: "b2",
    title: "B2 - Upper Intermediate",
    description: "Fluency and nuance. Understand abstract topics and produce detailed, well-structured texts.",
    skills: ["Advanced grammar", "Nuanced expression", "Literary analysis", "Business French"],
    studyPlan: ["Week 1-4: Advanced grammar", "Week 5-8: Literature", "Week 9-12: Exam prep"],
    videos: [
      { title: "Advanced French Grammar", url: "https://www.youtube.com/embed/5MnYaMCzne4" },
      { title: "French Literature Overview", url: "https://www.youtube.com/embed/hQ22eIpiXh4" },
    ],
    materials: [
      { title: "B2 Exam Practice", type: "pdf" },
      { title: "Business French Vocabulary", type: "pdf" },
    ],
    assignments: [
      { title: "Literature analysis", description: "Analyze an excerpt from a French novel" },
    ],
  },
];
