/**
 * Curriculum persistence: Supabase or localStorage fallback
 */

import type { Level } from "@/types/curriculum";

const STORAGE_KEY = "mappele_curriculum";

export function loadFromStorage(): Level[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Level[];
  } catch {
    return null;
  }
}

export function saveToStorage(levels: Level[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  } catch {
    // ignore
  }
}
