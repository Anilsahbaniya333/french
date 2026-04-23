/**
 * Standard reusable level schema for Mappele French
 * Used for both Supabase records and fallback mock data
 */

export type LevelCode = "a1" | "a2" | "b1" | "b2";

export interface LevelSkill {
  id?: string;
  levelId?: string;
  title: string;
  sortOrder?: number;
}

export interface LevelStudyPlanItem {
  id?: string;
  levelId?: string;
  title: string;
  description?: string;
  sortOrder?: number;
}

export interface LevelVideo {
  id?: string;
  levelId?: string;
  title: string;
  url: string;
  sortOrder?: number;
}

export type MaterialType = "pdf" | "doc" | "docx" | "link" | "text";

export interface LevelMaterial {
  id?: string;
  levelId?: string;
  title: string;
  description?: string;
  type: MaterialType;
  filePath?: string | null;
  publicUrl?: string | null;
  contentText?: string | null;
  sortOrder?: number;
  createdAt?: string;
}

export interface LevelAssignment {
  id?: string;
  levelId?: string;
  title: string;
  description: string;
  sortOrder?: number;
}

export interface Level {
  id: string;
  code: LevelCode;
  title: string;
  subtitle?: string | null;
  description: string;
  overview?: string | null;
  duration?: string | null;
  levelGoals?: string[] | null;
  practiceSection?: string | null;
  isPublished: boolean;
  skillsCovered: LevelSkill[];
  studyPlanItems: LevelStudyPlanItem[];
  videos: LevelVideo[];
  materials: LevelMaterial[];
  assignments: LevelAssignment[];
}
