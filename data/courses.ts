/**
 * Course packages — single source of truth for pricing shown on the
 * homepage, /courses, the registration form, the API validator and emails.
 * Edit here and every page stays consistent.
 */

export type CourseId = "a1-foundation" | "a1-a2-package" | "a1-b2-complete";

export interface CoursePackage {
  id: CourseId;
  /** Short label used in badges, the admin list, and the DB `level` column */
  code: string;
  name: string;
  shortName: string;
  priceCad: number;
  priceLabel: string;
  duration: string;
  durationShort: string;
  levelRange: string;
  description: string;
  audience: string;
  /** One-line summary for compact cards */
  tagline: string;
  /** What makes this package different (shared features are shown once, see INCLUDED_IN_ALL) */
  keyFeatures: string[];
  features: string[];
  cta: string;
  badge?: string;
  highlight?: "popular" | "comprehensive";
  extra?: string;
}

export const ADMISSIONS_EMAIL = "frenchclass357@gmail.com";

export const COURSE_PACKAGES: CoursePackage[] = [
  {
    id: "a1-foundation",
    code: "A1",
    name: "A1 French Foundation",
    shortName: "A1 Foundation",
    priceCad: 350,
    priceLabel: "$350",
    duration: "Up to 3 months",
    durationShort: "Up to 3 months",
    levelRange: "Complete Beginner → A1",
    description:
      "Start learning French from the very beginning — the alphabet, pronunciation, essential vocabulary, basic grammar, and everyday communication.",
    audience: "Designed for students with absolutely no prior French knowledge.",
    tagline: "For absolute beginners — no French needed.",
    keyFeatures: ["French alphabet and pronunciation", "Basic vocabulary and grammar", "Everyday speaking and listening practice"],
    features: [
      "French alphabet and pronunciation",
      "Basic vocabulary and grammar",
      "Everyday speaking and listening practice",
      "Live classes with recordings",
      "Weekly mini exams with personalized feedback",
      "Personal student learning portal",
    ],
    cta: "Enroll in A1",
  },
  {
    id: "a1-a2-package",
    code: "A1–A2",
    name: "A1 + A2 Complete Beginner Package",
    shortName: "A1 + A2 Combined",
    priceCad: 600,
    priceLabel: "$600",
    duration: "6 months",
    durationShort: "6 months",
    levelRange: "Complete Beginner → A2",
    description:
      "Build a strong French foundation through a structured learning journey covering both the A1 and A2 levels.",
    audience:
      "For students who want to progress from the alphabet to communicating confidently in common everyday situations.",
    tagline: "From the alphabet to confident everyday conversations.",
    keyFeatures: ["Complete A1 and A2 curriculum", "Progressive speaking and listening practice", "Grammar and vocabulary development"],
    features: [
      "Complete A1 and A2 curriculum",
      "Progressive speaking and listening practice",
      "Grammar and vocabulary development",
      "Live classes with recordings",
      "Weekly mini exams with personalized feedback",
      "Personal student learning portal",
    ],
    cta: "Enroll in A1 + A2",
    badge: "Popular choice",
    highlight: "popular",
  },
  {
    id: "a1-b2-complete",
    code: "A1–B2",
    name: "Complete French Program — A1 to B2",
    shortName: "Complete A1–B2 Program",
    priceCad: 1000,
    priceLabel: "$1,000",
    duration: "Estimated 10–12 months",
    durationShort: "10–12 months (est.)",
    levelRange: "Complete Beginner → B2",
    description:
      "Our most comprehensive program takes you from the alphabet through upper-intermediate French, with structured preparation for TCF and TEF Canada leading up to your exam.",
    audience: "Includes TCF / TEF Canada exam preparation.",
    tagline: "From zero to B2, with TCF / TEF Canada exam preparation.",
    keyFeatures: [
      "Complete A1, A2, B1, and B2 curriculum",
      "TCF / TEF Canada exam preparation",
      "Speaking, listening, reading, and writing practice",
      "Exam-focused practice and guidance",
    ],
    features: [
      "Complete A1, A2, B1, and B2 curriculum",
      "TCF / TEF Canada exam preparation",
      "Speaking, listening, reading, and writing practice",
      "Live classes with recordings",
      "Weekly mini exams with personalized feedback",
      "Personal student learning portal",
      "Exam-focused practice and guidance",
    ],
    cta: "Enroll in Full Program",
    badge: "Most comprehensive",
    highlight: "comprehensive",
    extra: "Includes TCF / TEF Canada exam preparation",
  },
];

/** Included in every package — shown once below the price cards */
export const INCLUDED_IN_ALL = [
  "Live classes with recordings",
  "Weekly mini exams with personalized feedback",
  "Personal student learning portal",
];

export function getCoursePackage(id: string | null | undefined): CoursePackage | undefined {
  return COURSE_PACKAGES.find((c) => c.id === id);
}

export const PRICING_DISCLAIMER =
  "All prices are in Canadian dollars (CAD) and cover the complete course package — they are not monthly fees. Durations are estimated learning timelines; individual progress depends on participation and learning pace. We do not guarantee a specific CEFR level, NCLC score, exam result, or immigration outcome.";

/* Registration form option lists (shared by the form and the API validator) */
export const CURRENT_LEVEL_OPTIONS = ["Complete Beginner", "A1", "A2", "B1", "B2", "Not Sure"] as const;
export const SCHEDULE_OPTIONS = ["Morning", "Evening", "Flexible"] as const;
export const GOAL_OPTIONS = ["TCF Canada", "TEF Canada", "General French", "Other"] as const;
