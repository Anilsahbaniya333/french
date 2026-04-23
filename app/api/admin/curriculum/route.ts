import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchCurriculum } from "@/lib/supabase/queries";
import { verifyAdminSessionToken, COOKIE_NAME } from "@/lib/auth-admin";

async function checkAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (
    password && password.length >= 8 &&
    secret && secret.length >= 16 &&
    (!token || !(await verifyAdminSessionToken(token)))
  ) {
    return false;
  }
  return true;
}

/** Seed the 4 default levels (A1–B2) if the table is empty. Safe to call multiple times. */
async function seedLevelsIfEmpty(supabase: ReturnType<typeof createServiceRoleClient>) {
  if (!supabase) return;

  const { count } = await supabase
    .from("levels")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) return; // Already has levels, nothing to do

  const defaults = [
    {
      code: "a1",
      title: "A1 - Beginner",
      subtitle: "Start your French journey",
      description: "Learn basic greetings, introductions, and everyday phrases. Build a foundation in pronunciation and simple conversations.",
      overview: "The A1 course introduces you to French from scratch. You will learn the alphabet, numbers, common greetings, and how to form simple sentences using present tense.",
      duration: "8-10 weeks",
      level_goals: ["Introduce yourself and others", "Ask and answer basic questions", "Handle simple everyday situations"],
      is_published: true,
    },
    {
      code: "a2",
      title: "A2 - Elementary",
      subtitle: "Build confidence in daily French",
      description: "Handle daily situations: shopping, directions, and simple conversations. Expand your vocabulary and grammar.",
      overview: "At A2 you consolidate the basics and start handling more complex situations. You will learn the passé composé, daily vocabulary, and practical communication skills.",
      duration: "10-12 weeks",
      level_goals: ["Describe your routine and past events", "Navigate shopping and directions", "Have short conversations on familiar topics"],
      is_published: true,
    },
    {
      code: "b1",
      title: "B1 - Intermediate",
      subtitle: "Express opinions and handle most situations",
      description: "Express opinions, understand main ideas of complex texts, and handle most travel and work situations.",
      overview: "B1 focuses on fluency and nuance. You will work on the subjunctive, formal writing, and expressing opinions.",
      duration: "12-14 weeks",
      level_goals: ["Express opinions and justify them", "Write formal emails and short essays", "Understand the main points of podcasts and articles"],
      is_published: true,
    },
    {
      code: "b2",
      title: "B2 - Upper Intermediate",
      subtitle: "Fluency and nuance",
      description: "Understand abstract topics and produce detailed, well-structured texts. Prepare for advanced exams.",
      overview: "B2 brings you to near-fluency. You will work on literary analysis, business French, and sophisticated grammar.",
      duration: "14-16 weeks",
      level_goals: ["Participate in debates and discussions", "Write well-structured argumentative texts", "Understand complex spoken and written French"],
      is_published: true,
    },
  ];

  await supabase.from("levels").upsert(defaults, { onConflict: "code" });
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Auto-seed levels so the editor always has real UUIDs to work with
  await seedLevelsIfEmpty(supabase);

  const levels = await fetchCurriculum(supabase);
  console.log(`[curriculum GET] returning ${levels.length} levels:`, levels.map(l => `${l.code}:${l.id}`).join(", "));
  return NextResponse.json({ levels });
}
