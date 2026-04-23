import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getMethodology } from "@/lib/content";

export async function GET() {
  const content = await getMethodology();
  if (!content) return NextResponse.json({ content: {} });
  return NextResponse.json({
    content: {
      introduction: content.introduction,
      teachingApproach: content.teachingApproach,
      weeklyStructure: content.weeklyStructure,
      grammarApproach: content.grammarApproach,
      listeningApproach: content.listeningApproach,
      speakingApproach: content.speakingApproach,
      readingApproach: content.readingApproach,
      writingApproach: content.writingApproach,
      assignmentWorkflow: content.assignmentWorkflow,
      progressTracking: content.progressTracking,
    },
  });
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const body = await req.json();

  const payload = {
    introduction: body.introduction ?? null,
    teaching_approach: body.teachingApproach ?? null,
    weekly_structure: body.weeklyStructure ?? null,
    grammar_approach: body.grammarApproach ?? null,
    listening_approach: body.listeningApproach ?? null,
    speaking_approach: body.speakingApproach ?? null,
    reading_approach: body.readingApproach ?? null,
    writing_approach: body.writingApproach ?? null,
    assignment_workflow: body.assignmentWorkflow ?? null,
    progress_tracking: body.progressTracking ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase.from("methodology_content").select("id").limit(1).single();
  const { error } = existing
    ? await supabase.from("methodology_content").update(payload).eq("id", existing.id)
    : await supabase.from("methodology_content").insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
