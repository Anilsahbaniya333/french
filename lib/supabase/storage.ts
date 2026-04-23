/**
 * Supabase Storage helpers for course materials
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "course-materials";

const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

/** Upload a file to course-materials bucket */
export async function uploadMaterial(
  supabase: SupabaseClient,
  file: File,
  levelCode: string
): Promise<{ path?: string; publicUrl?: string; error?: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${levelCode}/${Date.now()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { path: data.path, publicUrl: urlData.publicUrl };
}

/** Get public URL for a storage path */
export function getPublicUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Delete a file from storage */
export async function deleteMaterialFile(
  supabase: SupabaseClient,
  path: string
): Promise<{ error?: string }> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return error ? { error: error.message } : {};
}
