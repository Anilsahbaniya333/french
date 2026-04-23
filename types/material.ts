/**
 * Material types for course content
 * Supports PDF, DOC, link, and text materials
 */

export type MaterialType = "pdf" | "doc" | "docx" | "link" | "text";

export interface Material {
  id: string;
  levelId: string;
  title: string;
  description?: string | null;
  type: MaterialType;
  filePath?: string | null;
  publicUrl?: string | null;
  contentText?: string | null;
  sortOrder?: number;
  createdAt: string;
}
