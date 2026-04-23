/**
 * Curriculum hierarchy: Level → Module → Topic → Content
 * Used for admin management and public course display
 */

export type LevelCode = "a1" | "a2" | "b1" | "b2";

export type MaterialType = "pdf" | "doc" | "docx" | "link" | "text";
export type SubmissionType = "text" | "file" | "url";
export type PracticeType = "mcq" | "writing" | "speaking" | "short_answer" | "fill_blank";

// ─── Topic content (under each topic) ───

export interface TopicVideo {
  id: string;
  title: string;
  url: string;
  description?: string;
  order: number;
}

export interface TopicMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  publicUrl?: string | null;
  contentText?: string | null;
  order: number;
}

export interface TopicAssignment {
  id: string;
  title: string;
  instructions: string;
  dueNote?: string;
  submissionType?: SubmissionType;
  score?: number;
  order: number;
}

export interface TopicPractice {
  id: string;
  title: string;
  type: PracticeType;
  instructions?: string;
  content?: string;
  order: number;
}

// ─── Topic (Lesson) ───

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  objectives?: string[];
  estimatedDuration?: string;
  isPreview?: boolean;
  isPublished?: boolean;
  order: number;
  videos: TopicVideo[];
  materials: TopicMaterial[];
  assignments: TopicAssignment[];
  practice: TopicPractice[];
}

// ─── Module ───

export interface Module {
  id: string;
  levelId: string;
  title: string;
  description?: string;
  isPublished?: boolean;
  order: number;
  topics: Topic[];
}

// ─── Level ───

export interface Level {
  id: string;
  code: LevelCode;
  title: string;
  subtitle?: string | null;
  description: string;
  overview?: string | null;
  duration?: string | null;
  levelGoals?: string[];
  isPublished: boolean;
  modules: Module[];
  // Level-scoped content (stored with level_id in DB)
  videos: TopicVideo[];
  materials: TopicMaterial[];
  assignments: TopicAssignment[];
  practice: TopicPractice[];
}

// ─── Helpers ───

export function createId(): string {
  return crypto.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
