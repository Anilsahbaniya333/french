import LevelEditor from "@/components/admin/LevelEditor";
import { getLevels } from "@/lib/content";

export default async function AdminLevelsPage() {
  const levels = await getLevels();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Level Management</h1>
      <p className="mt-1 text-slate-600">
        Edit level content for A1, A2, B1, and B2. Changes are saved to Supabase when configured.
      </p>
      <LevelEditor initialLevels={levels} />
    </div>
  );
}
