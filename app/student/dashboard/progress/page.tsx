"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProgressData {
  levelCode: string | null;
  totalTopics: number;
  completedTopics: number;
  totalModules: number;
  completedModules: number;
  progressPercent: number;
  nextTopic: { id: string; title: string; moduleTitle: string } | null;
  totalSubmissions: number;
  gradedSubmissions: number;
}

interface ModuleProgress {
  id: string;
  title: string;
  total: number;
  completed: number;
}

const LEVEL_LABELS: Record<string, string> = {
  a1: "A1 – Beginner",
  a2: "A2 – Elementary",
  b1: "B1 – Intermediate",
  b2: "B2 – Upper Intermediate",
};

function CircleProgress({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const cx = size / 2;
  return (
    <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f59e0b" strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

export default function StudentProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/student/progress").then((r) => r.json()),
      fetch("/api/student/curriculum").then((r) => r.json()),
      fetch("/api/student/lesson-progress").then((r) => r.json()),
    ]).then(([prog, curr, lessonProg]) => {
      if (!prog.error) setProgress(prog);

      // Build per-module progress
      const completedSet = new Set<string>(lessonProg.completed ?? []);
      const mods: ModuleProgress[] = (curr.modules ?? []).map((m: any) => ({
        id: m.id,
        title: m.title,
        total: (m.topics ?? []).length,
        completed: (m.topics ?? []).filter((t: any) => completedSet.has(t.id)).length,
      }));
      setModuleProgress(mods);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
    </div>
  );

  const pct = progress?.progressPercent ?? 0;
  const levelCode = progress?.levelCode;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Progress</h1>
        <p className="mt-1 text-slate-500">Track your learning journey.</p>
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative shrink-0">
            <CircleProgress pct={pct} size={136} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800">{pct}%</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">complete</span>
            </div>
          </div>
          <div className="flex-1 w-full">
            {levelCode && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5">
                <span className="text-xs font-black text-amber-700 uppercase">{levelCode}</span>
                <span className="text-xs text-amber-600">{LEVEL_LABELS[levelCode]}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Lessons Completed", value: progress?.completedTopics ?? 0, total: progress?.totalTopics ?? 0, color: "text-amber-600" },
                { label: "Modules Completed", value: progress?.completedModules ?? 0, total: progress?.totalModules ?? 0, color: "text-emerald-600" },
                { label: "Assignments Submitted", value: progress?.totalSubmissions ?? 0, color: "text-sky-600" },
                { label: "Assignments Reviewed", value: progress?.gradedSubmissions ?? 0, color: "text-violet-600" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className={`text-2xl font-black ${s.color}`}>
                    {s.value}
                    {"total" in s && <span className="text-sm font-normal text-slate-400">/{s.total}</span>}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Next lesson */}
      {progress?.nextTopic && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">Next Lesson</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-amber-700">{progress.nextTopic.moduleTitle}</p>
              <p className="font-semibold text-slate-800 mt-0.5">{progress.nextTopic.title}</p>
            </div>
            <Link
              href={`/student/dashboard/lessons/${progress.nextTopic.id}`}
              className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Continue →
            </Link>
          </div>
        </div>
      )}

      {/* Module breakdown */}
      {moduleProgress.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Module Breakdown</p>
          <div className="space-y-3">
            {moduleProgress.map((m, i) => {
              const modPct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
              const allDone = m.total > 0 && m.completed === m.total;
              return (
                <div key={m.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${allDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {allDone ? "✓" : i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700 truncate">{m.title}</span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{m.completed}/{m.total}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-400" : "bg-amber-400"}`}
                      style={{ width: `${modPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No level state */}
      {!levelCode && !loading && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No level assigned. Ask your teacher to assign you a level to start tracking progress.</p>
        </div>
      )}

      {/* Links */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/student/dashboard/lessons" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Browse lessons →
        </Link>
        <Link href="/student/dashboard/submissions" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          View submissions →
        </Link>
      </div>
    </div>
  );
}
