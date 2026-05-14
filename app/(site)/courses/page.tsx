import { getLevels } from "@/lib/content";
import { createServiceRoleClient } from "@/lib/supabase/server";
import Link from "next/link";

const LEVEL_META: Record<string, { difficulty: string; diffColor: string; badgeColor: string }> = {
  a1: { difficulty: "Beginner",       diffColor: "bg-emerald-100 text-emerald-700", badgeColor: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  a2: { difficulty: "Elementary",     diffColor: "bg-blue-100 text-blue-700",       badgeColor: "border-blue-200 bg-blue-50 text-blue-800"         },
  b1: { difficulty: "Intermediate",   diffColor: "bg-violet-100 text-violet-700",   badgeColor: "border-violet-200 bg-violet-50 text-violet-800"   },
  b2: { difficulty: "Upper-Intermed", diffColor: "bg-orange-100 text-orange-700",   badgeColor: "border-orange-200 bg-orange-50 text-orange-800"   },
};

async function getLevelFees(): Promise<Record<string, { fee: string | null; fee_note: string | null }>> {
  const supabase = createServiceRoleClient();
  if (!supabase) return {};
  const { data } = await supabase.from("levels").select("level_code, fee, fee_note").not("fee", "is", null);
  if (!data) return {};
  return Object.fromEntries(
    data.map((r: { level_code: string; fee: string | null; fee_note: string | null }) => [
      r.level_code?.toLowerCase(),
      { fee: r.fee, fee_note: r.fee_note },
    ])
  );
}

export default async function CoursesPage() {
  const [levels, fees] = await Promise.all([
    getLevels(),
    getLevelFees().catch(() => ({} as Record<string, { fee: string | null; fee_note: string | null }>)),
  ]);
  const published = levels.filter((l) => l.isPublished);

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">CEFR Framework</p>
        <h1 className="text-4xl font-black text-slate-800 sm:text-5xl">Our Courses</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500 leading-relaxed">
          Choose your level and start learning. Each course follows the CEFR framework for structured progression.
        </p>
      </div>

      {published.length === 0 ? (
        <p className="text-center text-slate-400">Courses coming soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {published.map((level) => {
            const meta = LEVEL_META[level.code.toLowerCase()] ?? {
              difficulty: "All levels",
              diffColor: "bg-slate-100 text-slate-600",
              badgeColor: "border-slate-200 bg-slate-50 text-slate-700",
            };
            const feeData = fees[level.code.toLowerCase()];
            return (
              <Link
                key={level.code}
                href={`/courses/${level.code}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:border-amber-200"
              >
                {/* Level badge + arrow */}
                <div className="mb-5 flex items-start justify-between">
                  <span className={`inline-block rounded-xl border px-3 py-1 text-sm font-black uppercase tracking-wide ${meta.badgeColor}`}>
                    {level.code.toUpperCase()}
                  </span>
                  <svg className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:text-amber-500 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                <h3 className="text-base font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{level.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 flex-1">{level.description}</p>

                {/* Module list preview */}
                {level.modules && level.modules.length > 0 && (
                  <ul className="mt-4 space-y-1">
                    {level.modules.slice(0, 3).map((m) => (
                      <li key={m.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                        {m.title}
                      </li>
                    ))}
                    {level.modules.length > 3 && (
                      <li className="text-xs text-amber-600 font-medium">+{level.modules.length - 3} more modules</li>
                    )}
                  </ul>
                )}

                {/* Footer */}
                <div className="mt-5 border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${meta.diffColor}`}>
                      {meta.difficulty}
                    </span>
                    <span className="text-xs text-slate-400">{level.modules?.length ?? 0} modules</span>
                  </div>
                  {feeData?.fee && (
                    <div>
                      <p className="text-sm font-bold text-amber-600">{feeData.fee}</p>
                      {feeData.fee_note && <p className="text-xs text-slate-400">{feeData.fee_note}</p>}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
