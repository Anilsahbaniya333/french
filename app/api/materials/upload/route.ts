import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadMaterial } from "@/lib/supabase/storage";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const levelCode = formData.get("levelCode") as string | null;

  if (!file || !levelCode || !["a1", "a2", "b1", "b2"].includes(levelCode)) {
    return NextResponse.json(
      { error: "Invalid file or level" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Allowed types: PDF, DOC, DOCX, TXT" },
      { status: 400 }
    );
  }

  const supabase = createClient(url, key);
  const result = await uploadMaterial(supabase, file, levelCode);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    path: result.path,
    publicUrl: result.publicUrl,
  });
}
