/**
 * Supabase query helpers for levels, materials, methodology, registrations, contacts, curriculum
 */

import type { Level } from "@/types/level";
import type { MethodologyContent } from "@/types/methodology";
import type { StudentRegistration } from "@/types/registration";
import type { Contact } from "@/types/contact";
import type {
  Level as CurriculumLevel,
  Module,
  Topic,
  TopicMaterial,
  TopicAssignment,
  TopicPractice,
} from "@/types/curriculum";
import type { SupabaseClient } from "@supabase/supabase-js";

const LEVEL_CODES = ["a1", "a2", "b1", "b2"] as const;

/** Map DB row to Level shape */
function mapLevelRow(row: Record<string, unknown>): Level {
  const levelGoals = Array.isArray(row.level_goals) ? row.level_goals : [];
  return {
    id: String(row.id),
    code: row.code as Level["code"],
    title: String(row.title),
    subtitle: row.subtitle ? String(row.subtitle) : null,
    description: String(row.description),
    overview: row.overview ? String(row.overview) : null,
    duration: row.duration ? String(row.duration) : null,
    levelGoals: levelGoals as string[],
    practiceSection: row.practice_section ? String(row.practice_section) : null,
    isPublished: Boolean(row.is_published),
    skillsCovered: [],
    studyPlanItems: [],
    videos: [],
    materials: [],
    assignments: [],
  };
}

/** Fetch all levels with related data */
export async function fetchLevels(supabase: SupabaseClient | null): Promise<Level[]> {
  if (!supabase) return [];

  const { data: levelRows, error } = await supabase
    .from("levels")
    .select("*")
    .order("code");

  if (error) return [];

  const levels: Level[] = (levelRows ?? []).map((r) => mapLevelRow(r as Record<string, unknown>));

  for (const level of levels) {
    const levelId = level.id;

    const [skillsRes, studyRes, videosRes, materialsRes, assignmentsRes] = await Promise.all([
      supabase.from("level_skills").select("*").eq("level_id", levelId).order("sort_order"),
      supabase.from("level_study_plan_items").select("*").eq("level_id", levelId).order("sort_order"),
      supabase.from("level_videos").select("*").eq("level_id", levelId).order("sort_order"),
      supabase.from("level_materials").select("*").eq("level_id", levelId).order("sort_order"),
      supabase.from("level_assignments").select("*").eq("level_id", levelId).order("sort_order"),
    ]);

    level.skillsCovered = (skillsRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      levelId: String(s.level_id),
      title: String(s.title),
      sortOrder: Number(s.sort_order) ?? 0,
    }));

    level.studyPlanItems = (studyRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      levelId: String(s.level_id),
      title: String(s.title),
      description: s.description ? String(s.description) : undefined,
      sortOrder: Number(s.sort_order) ?? 0,
    }));

    level.videos = (videosRes.data ?? []).map((v: Record<string, unknown>) => ({
      id: String(v.id),
      levelId: String(v.level_id),
      title: String(v.title),
      url: String(v.url),
      sortOrder: Number(v.sort_order) ?? 0,
    }));

    level.materials = (materialsRes.data ?? []).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      levelId: String(m.level_id),
      title: String(m.title),
      description: m.description ? String(m.description) : undefined,
      type: String(m.type) as Level["materials"][0]["type"],
      filePath: m.file_path ? String(m.file_path) : null,
      publicUrl: m.public_url ? String(m.public_url) : null,
      contentText: m.content_text ? String(m.content_text) : null,
      sortOrder: Number(m.sort_order) ?? 0,
      createdAt: m.created_at ? String(m.created_at) : undefined,
    }));

    level.assignments = (assignmentsRes.data ?? []).map((a: Record<string, unknown>) => ({
      id: String(a.id),
      levelId: String(a.level_id),
      title: String(a.title),
      description: String(a.description),
      sortOrder: Number(a.sort_order) ?? 0,
    }));
  }

  return levels;
}

/** Fetch a single level by code */
export async function fetchLevelByCode(
  supabase: SupabaseClient | null,
  code: string
): Promise<Level | null> {
  const levels = await fetchLevels(supabase);
  return levels.find((l) => l.code.toUpperCase() === code.toUpperCase()) ?? null;
}

/** Fetch methodology content */
export async function fetchMethodology(
  supabase: SupabaseClient | null
): Promise<MethodologyContent | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("methodology_content")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    introduction: row.introduction ? String(row.introduction) : null,
    teachingApproach: row.teaching_approach ? String(row.teaching_approach) : null,
    weeklyStructure: row.weekly_structure ? String(row.weekly_structure) : null,
    grammarApproach: row.grammar_approach ? String(row.grammar_approach) : null,
    listeningApproach: row.listening_approach ? String(row.listening_approach) : null,
    speakingApproach: row.speaking_approach ? String(row.speaking_approach) : null,
    readingApproach: row.reading_approach ? String(row.reading_approach) : null,
    writingApproach: row.writing_approach ? String(row.writing_approach) : null,
    assignmentWorkflow: row.assignment_workflow ? String(row.assignment_workflow) : null,
    progressTracking: row.progress_tracking ? String(row.progress_tracking) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

/** Insert student registration */
export async function insertRegistration(
  supabase: SupabaseClient | null,
  data: Omit<StudentRegistration, "id" | "createdAt" | "status">
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { error } = await supabase.from("student_registrations").insert({
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    level: data.level,
    experience: data.experience ?? null,
    preferred_mode: data.preferredMode ?? null,
    preferred_time: data.preferredTime ?? null,
    goals: data.goals ?? null,
    message: data.message ?? null,
    payment_screenshot_url: data.paymentScreenshotUrl ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Insert contact form submission */
export async function insertContact(
  supabase: SupabaseClient | null,
  data: Omit<Contact, "id" | "createdAt">
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { error } = await supabase.from("contacts").insert({
    full_name: data.fullName,
    email: data.email,
    message: data.message,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Fetch all contact submissions */
export async function fetchContacts(
  supabase: SupabaseClient | null
): Promise<Contact[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    fullName: String(r.full_name),
    email: String(r.email),
    message: String(r.message),
    createdAt: r.created_at ? String(r.created_at) : undefined,
  }));
}

/**
 * Fetch full curriculum hierarchy: Level → Module → Topic → Content
 * DB schema:
 *   modules: level_id
 *   topics: module_id, video_url (legacy), estimated_duration, notes
 *   videos: topic_id (topic-scoped only)
 *   materials: topic_id OR level_id
 *   assignments: topic_id OR level_id, due_date_time, instructions
 *   exercises: topic_id (MCQ practice questions)
 */
export async function fetchCurriculum(
  supabase: SupabaseClient | null
): Promise<CurriculumLevel[]> {
  if (!supabase) return [];

  const { data: levelRows, error: levelsErr } = await supabase
    .from("levels")
    .select("*")
    .order("code");

  if (levelsErr || !levelRows?.length) return [];

  const levelIds = levelRows.map((l: Record<string, unknown>) => l.id as string);

  // Fetch modules
  const { data: moduleRows } = await supabase
    .from("modules")
    .select("*")
    .in("level_id", levelIds)
    .order("sort_order");

  const allModules = (moduleRows ?? []) as Record<string, unknown>[];

  // Fetch topics for all modules
  let allTopics: Record<string, unknown>[] = [];
  if (allModules.length > 0) {
    const moduleIds = allModules.map((m) => m.id as string);
    const { data: topicRows } = await supabase
      .from("topics")
      .select("*")
      .in("module_id", moduleIds)
      .order("sort_order");
    allTopics = (topicRows ?? []) as Record<string, unknown>[];
  }

  // Fetch topic-scoped content (videos, materials, exercises, assignments) in parallel
  let allVideos: Record<string, unknown>[] = [];
  let allTopicMaterials: Record<string, unknown>[] = [];
  let allExercises: Record<string, unknown>[] = [];
  let allTopicAssignments: Record<string, unknown>[] = [];

  if (allTopics.length > 0) {
    const topicIds = allTopics.map((t) => t.id as string);
    const [videosRes, topicMatsRes, exercisesRes, topicAssignRes] = await Promise.all([
      supabase.from("videos").select("*").in("topic_id", topicIds).order("sort_order"),
      supabase.from("materials").select("*").in("topic_id", topicIds).order("sort_order"),
      supabase.from("exercises").select("*").in("topic_id", topicIds).order("order_index"),
      supabase.from("assignments").select("*").in("topic_id", topicIds).order("created_at"),
    ]);
    allVideos = (videosRes.data ?? []) as Record<string, unknown>[];
    allTopicMaterials = (topicMatsRes.data ?? []) as Record<string, unknown>[];
    allExercises = (exercisesRes.data ?? []) as Record<string, unknown>[];
    allTopicAssignments = (topicAssignRes.data ?? []) as Record<string, unknown>[];
  }

  // Fetch level-scoped materials and assignments (topic_id IS NULL)
  const [levelMatsRes, levelAssignRes] = await Promise.all([
    supabase.from("materials").select("*").in("level_id", levelIds).is("topic_id", null).order("sort_order"),
    supabase.from("assignments").select("*").in("level_id", levelIds).is("topic_id", null).order("created_at"),
  ]);
  const allLevelMaterials = (levelMatsRes.data ?? []) as Record<string, unknown>[];
  const allLevelAssignments = (levelAssignRes.data ?? []) as Record<string, unknown>[];

  return levelRows.map((lr: Record<string, unknown>): CurriculumLevel => ({
    id: String(lr.id),
    code: String(lr.code) as CurriculumLevel["code"],
    title: String(lr.title),
    subtitle: lr.subtitle ? String(lr.subtitle) : null,
    description: String(lr.description ?? ""),
    overview: lr.overview ? String(lr.overview) : null,
    duration: lr.duration ? String(lr.duration) : null,
    levelGoals: Array.isArray(lr.level_goals) ? (lr.level_goals as string[]) : [],
    isPublished: Boolean(lr.is_published),
    modules: allModules
      .filter((m) => m.level_id === lr.id)
      .map((mr): Module => ({
        id: String(mr.id),
        levelId: String(mr.level_id),
        title: String(mr.title),
        description: mr.description ? String(mr.description) : undefined,
        isPublished: mr.is_published !== false,
        order: Number(mr.sort_order ?? mr.order_index) || 0,
        topics: allTopics
          .filter((t) => t.module_id === mr.id)
          .map((tr): Topic => {
            const topicVideos = allVideos.filter((v) => v.topic_id === tr.id);
            const topicMats = allTopicMaterials.filter((m) => m.topic_id === tr.id);
            const topicExercises = allExercises.filter((e) => e.topic_id === tr.id);
            const topicAssigns = allTopicAssignments.filter((a) => a.topic_id === tr.id);

            return {
              id: String(tr.id),
              moduleId: String(tr.module_id),
              title: String(tr.title),
              description: tr.description ? String(tr.description) : undefined,
              objectives: Array.isArray(tr.objectives) ? (tr.objectives as string[]) : [],
              estimatedDuration: tr.estimated_duration ? String(tr.estimated_duration) : undefined,
              isPreview: Boolean(tr.is_preview),
              isPublished: tr.is_published !== false,
              order: Number(tr.sort_order ?? tr.order_index) || 0,
              videos: [
                // Legacy: video_url directly on the topic row
                ...(tr.video_url
                  ? [{ id: `${tr.id}_v`, title: tr.video_title ? String(tr.video_title) : String(tr.title), url: String(tr.video_url), order: -1 }]
                  : []),
                // Videos from the videos table
                ...topicVideos.map((v) => ({
                  id: String(v.id),
                  title: String(v.title),
                  url: String(v.url),
                  description: v.description ? String(v.description) : undefined,
                  order: Number(v.sort_order) || 0,
                })),
              ],
              materials: topicMats.map((m) => ({
                id: String(m.id),
                title: String(m.title),
                description: undefined,
                type: String(m.file_type || m.type || "pdf") as TopicMaterial["type"],
                publicUrl: m.file_url ? String(m.file_url) : (m.public_url ? String(m.public_url) : null),
                contentText: m.content_text ? String(m.content_text) : null,
                order: Number(m.sort_order) || 0,
              })),
              assignments: topicAssigns.map((a) => ({
                id: String(a.id),
                title: String(a.title),
                instructions: a.instructions ? String(a.instructions) : (a.description ? String(a.description) : ""),
                dueNote: a.due_date_time ? String(a.due_date_time) : undefined,
                submissionType: undefined,
                score: undefined,
                order: Number(a.sort_order) || 0,
              })),
              practice: topicExercises.map((e) => ({
                id: String(e.id),
                title: e.question ? String(e.question) : "",
                type: "mcq" as TopicPractice["type"],
                instructions: e.explanation ? String(e.explanation) : undefined,
                content: e.option_a ? String(e.option_a) : undefined,
                order: Number(e.order_index) || 0,
              })),
            };
          }),
      })),
    // Level-scoped content (videos are topic-scoped only, so level.videos is always empty)
    videos: [],
    materials: allLevelMaterials
      .filter((m) => m.level_id === lr.id)
      .map((m) => ({
        id: String(m.id),
        title: String(m.title),
        description: undefined,
        type: String(m.file_type || m.type || "pdf") as TopicMaterial["type"],
        publicUrl: m.file_url ? String(m.file_url) : null,
        contentText: m.content_text ? String(m.content_text) : null,
        order: Number(m.sort_order) || 0,
      })),
    assignments: allLevelAssignments
      .filter((a) => a.level_id === lr.id)
      .map((a) => ({
        id: String(a.id),
        title: String(a.title),
        instructions: a.instructions ? String(a.instructions) : (a.description ? String(a.description) : ""),
        dueNote: a.due_date_time ? String(a.due_date_time) : undefined,
        submissionType: undefined,
        score: undefined,
        order: 0,
      })),
    practice: [],
  }));
}

/** Fetch all registrations */
export async function fetchRegistrations(
  supabase: SupabaseClient | null
): Promise<StudentRegistration[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("student_registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    fullName: String(r.full_name ?? r.name ?? ""),
    email: String(r.email),
    phone: String(r.phone),
    level: String(r.level),
    experience: r.experience ? String(r.experience) : null,
    preferredMode: r.preferred_mode ? String(r.preferred_mode) : null,
    preferredTime: r.preferred_time ? String(r.preferred_time) : null,
    goals: r.goals ? String(r.goals) : null,
    message: r.message ? String(r.message) : null,
    paymentScreenshotUrl: r.payment_screenshot_url ? String(r.payment_screenshot_url) : null,
    status: r.status ? String(r.status) : "pending",
    createdAt: r.created_at ? String(r.created_at) : undefined,
  }));
}
