/**
 * Content layer: fetches from Supabase, falls back to static data when DB is empty
 */

import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchCurriculum, fetchMethodology } from "@/lib/supabase/queries";
import { FALLBACK_CURRICULUM } from "@/lib/fallback-curriculum";
import { FALLBACK_METHODOLOGY } from "@/lib/fallback-data";
import type { Level } from "@/types/curriculum";
import type { MethodologyContent } from "@/types/methodology";

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Get all levels with full module→topic hierarchy from Supabase, fallback to static data */
export async function getLevels(): Promise<Level[]> {
  if (!isSupabaseConfigured()) return FALLBACK_CURRICULUM;
  const supabase = createServiceRoleClient() ?? createServerClient();
  const fromDb = await fetchCurriculum(supabase);
  // If DB has levels (even with no modules), use DB data
  if (fromDb.length > 0) return fromDb;
  return FALLBACK_CURRICULUM;
}

/** Get a single level by code (a1, a2, b1, b2) */
export async function getLevelByCode(code: string): Promise<Level | null> {
  const upper = code.toUpperCase();
  if (!["A1", "A2", "B1", "B2"].includes(upper)) return null;
  const levels = await getLevels();
  return levels.find((l) => l.code.toUpperCase() === upper) ?? null;
}

/** Get methodology content */
export async function getMethodology(): Promise<MethodologyContent | null> {
  if (!isSupabaseConfigured()) return FALLBACK_METHODOLOGY;
  const supabase = createServerClient();
  const fromDb = await fetchMethodology(supabase);
  return fromDb ?? FALLBACK_METHODOLOGY;
}
