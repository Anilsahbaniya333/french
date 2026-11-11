/**
 * Public "Curriculum by level" content for the Courses page.
 * Edit here to change what visitors see — independent of the lesson modules in the admin panel.
 */

export interface CurriculumTopic {
  title: string;
  detail: string;
}

export interface CurriculumLevel {
  code: "A1" | "A2" | "B1" | "B2";
  title: string;
  stage: string;
  summary: string;
  topics: CurriculumTopic[];
  outcomes: string[];
  /** Package names (from data/courses.ts) that include this level */
  includedIn: string[];
  accent: { badge: string; dot: string; ring: string };
}

export const CURRICULUM_LEVELS: CurriculumLevel[] = [
  {
    code: "A1",
    title: "French Foundations",
    stage: "Beginner",
    summary: "Start from zero and build the sounds, words and structures you need for simple, everyday exchanges.",
    topics: [
      { title: "Alphabet and pronunciation", detail: "French sounds, accents, liaison and reading words aloud correctly." },
      { title: "Basic grammar and vocabulary", detail: "Articles, gender, present tense of key verbs, numbers, days and dates." },
      { title: "Greetings and introductions", detail: "Introducing yourself and others, formal vs. informal French (tu / vous)." },
      { title: "Everyday conversations", detail: "Asking simple questions, ordering, giving directions, talking about family." },
      { title: "Basic listening and writing", detail: "Understanding short, slow speech and writing simple messages and forms." },
    ],
    outcomes: [
      "Introduce yourself and talk about your daily life",
      "Understand familiar words and very basic phrases",
      "Fill in forms and write short, simple messages",
    ],
    includedIn: ["A1 Foundation", "A1 + A2 Combined", "Complete A1–B2 Program"],
    accent: { badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-500" },
  },
  {
    code: "A2",
    title: "Everyday French",
    stage: "Elementary",
    summary: "Handle common real-life situations with growing confidence and talk about past and future events.",
    topics: [
      { title: "Past and future tenses", detail: "Passé composé, imparfait basics and futur proche to describe events in time." },
      { title: "Daily conversations", detail: "Routines, plans, invitations and making arrangements with others." },
      { title: "Shopping, travel, and work", detail: "Practical vocabulary for stores, transport, appointments and the workplace." },
      { title: "Expressing simple opinions", detail: "Saying what you like, prefer or think, and giving a simple reason." },
      { title: "Reading and writing short texts", detail: "Emails, notices and short articles; writing short personal texts." },
    ],
    outcomes: [
      "Manage routine tasks like shopping, travel and appointments",
      "Describe past experiences and future plans",
      "Read and write short, practical texts",
    ],
    includedIn: ["A1 + A2 Combined", "Complete A1–B2 Program"],
    accent: { badge: "border-sky-200 bg-sky-50 text-sky-800", dot: "bg-sky-500", ring: "ring-sky-500" },
  },
  {
    code: "B1",
    title: "Independent French",
    stage: "Intermediate",
    summary: "Become an independent user of French — explain your views, tell stories and follow clear, standard speech.",
    topics: [
      { title: "Intermediate grammar", detail: "Pronouns, relative clauses, conditional and an introduction to the subjunctive." },
      { title: "Expressing and explaining opinions", detail: "Agreeing, disagreeing and justifying your point of view." },
      { title: "Storytelling and experiences", detail: "Narrating events, combining past tenses and describing feelings." },
      { title: "Structured speaking and writing", detail: "Organising ideas with connectors in short talks, letters and essays." },
      { title: "Listening comprehension", detail: "Following conversations, announcements and radio or video on familiar topics." },
    ],
    outcomes: [
      "Deal with most situations while travelling or working",
      "Give and justify opinions in conversation",
      "Write connected texts on familiar subjects",
    ],
    includedIn: ["Complete A1–B2 Program"],
    accent: { badge: "border-violet-200 bg-violet-50 text-violet-800", dot: "bg-violet-500", ring: "ring-violet-500" },
  },
  {
    code: "B2",
    title: "Advanced French & TCF/TEF Preparation",
    stage: "Upper-Intermediate",
    summary: "Communicate fluently on complex topics and prepare specifically for the TCF Canada and TEF Canada exams.",
    topics: [
      { title: "Advanced grammar and vocabulary", detail: "Subjunctive, complex sentences, nuance and topic-specific vocabulary." },
      { title: "Argumentation and debates", detail: "Building arguments, comparing viewpoints and defending a position." },
      { title: "TCF/TEF speaking and writing", detail: "Exam task formats, timing, structure and evaluation criteria." },
      { title: "Reading and listening strategies", detail: "Techniques for exam-style comprehension questions under time limits." },
      { title: "Mock exams and personalized feedback", detail: "Practice tests in exam conditions with individual teacher feedback." },
    ],
    outcomes: [
      "Interact fluently and spontaneously on a wide range of topics",
      "Write clear, detailed, well-argued texts",
      "Approach TCF / TEF Canada tasks with a clear strategy",
    ],
    includedIn: ["Complete A1–B2 Program"],
    accent: { badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500", ring: "ring-amber-500" },
  },
];
