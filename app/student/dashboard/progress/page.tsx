"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProgressData {
  levelCode: string | null;
  totalTopics: number;
  completedTopics: number;
  totalModules: number;
  completedModules: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  totalAssignments: number;
  checklistTotal: number;
  checklistCompleted: number;
  checklistPercent: number;
  coursePercent: number;
  finalPercent: number;
  nextTopic: { id: string; title: string; moduleTitle: string } | null;
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

function CircleProgress({ pct, size = 160 }: { pct: number; size?: number }) {
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const cx = size / 2;
  return (
    <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke="#f59e0b" strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
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
    ])
      .then(([prog, curr, lessonProg]) => {
        if (!prog.error) setProgress(prog);
        const completedSet = new Set<string>(lessonProg.completed ?? []);
        const mods: ModuleProgress[] = (curr.modules ?? []).map((m: any) => ({
          id: m.id,
          title: m.title,
          total: (m.topics ?? []).length,
          completed: (m.topics ?? []).filter((t: any) => completedSet.has(t.id)).length,
        }));
        setModuleProgress(mods);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const finalPct = progress?.finalPercent ?? 0;
  const levelCode = progress?.levelCode?.toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Progress</h1>
        <p className="mt-1 text-slate-500">Your combined course and checklist progress.</p>
      </div>

      {/* ── Overall progress ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          {/* Circle */}
          <div className="relative shrink-0">
            <CircleProgress pct={finalPct} size={160} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-800">{finalPct}%</span>
              <span className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-400">overall</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="w-full flex-1 space-y-4">
            {levelCode && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
                <span className="text-xs font-black uppercase text-amber-700">{levelCode}</span>
                <span className="text-xs text-amber-600">{LEVEL_LABELS[levelCode] ?? ""}</span>
              </div>
            )}

            <p className="text-sm font-bold text-slate-800">
              Overall Progress: <span className="text-amber-600">{finalPct}%</span>
            </p>

            {/* Course contribution */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Course Activity <span className="text-slate-400">(weight 60%)</span>
                </span>
                <span className="font-semibold text-slate-700">{progress?.coursePercent ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-500"
                  style={{ inlineSize: `${progress?.coursePercent ?? 0}%` }}
                />
              </div>
            </div>

            {/* Checklist contribution */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Learning Checklist <span className="text-slate-400">(weight 40%)</span>
                </span>
                <span className="font-semibold text-slate-700">{progress?.checklistPercent ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ inlineSize: `${progress?.checklistPercent ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Next lesson CTA ──────────────────────────────────────────── */}
      {progress?.nextTopic && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
            Next Lesson
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-amber-700">{progress.nextTopic.moduleTitle}</p>
              <p className="mt-0.5 font-semibold text-slate-800">{progress.nextTopic.title}</p>
            </div>
            <Link
              href={`/student/dashboard/lessons/${progress.nextTopic.id}`}
              className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Continue →
            </Link>
          </div>
        </div>
      )}

      {/* ── Course Activity cards ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Course Activity
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Lessons Done",
              value: progress?.completedTopics ?? 0,
              of: progress?.totalTopics ?? 0,
              color: "text-amber-600",
            },
            {
              label: "Modules Done",
              value: progress?.completedModules ?? 0,
              of: progress?.totalModules ?? 0,
              color: "text-emerald-600",
            },
            {
              label: "Submitted",
              value: progress?.totalSubmissions ?? 0,
              of: progress?.totalAssignments ?? 0,
              color: "text-sky-600",
            },
            {
              label: "Reviewed",
              value: progress?.gradedSubmissions ?? 0,
              of: progress?.totalSubmissions ?? 0,
              color: "text-violet-600",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className={`text-2xl font-black ${s.color}`}>
                {s.value}
                <span className="text-sm font-normal text-slate-400">/{s.of}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Learning Checklist summary ────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Learning Checklist
          </p>
          <Link
            href="/student/dashboard/learning-progress"
            className="text-xs text-amber-600 hover:underline"
          >
            View checklist →
          </Link>
        </div>

        {(progress?.checklistTotal ?? 0) === 0 ? (
          <p className="text-sm text-slate-400">No topics assigned to your group yet.</p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-700">
                <span className="font-bold text-emerald-600">
                  {progress?.checklistCompleted ?? 0}
                </span>
                {" / "}
                <span className="font-semibold">{progress?.checklistTotal ?? 0}</span>
                {" topics learned"}
              </p>
              <span className="text-sm font-bold text-emerald-600">
                {progress?.checklistPercent ?? 0}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ inlineSize: `${progress?.checklistPercent ?? 0}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Module breakdown ─────────────────────────────────────────── */}
      {moduleProgress.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Module Breakdown
          </p>
          <div className="space-y-3">
            {moduleProgress.map((m, i) => {
              const modPct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
              const allDone = m.total > 0 && m.completed === m.total;
              return (
                <div key={m.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          allDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {allDone ? "✓" : i + 1}
                      </span>
                      <span className="truncate text-sm font-medium text-slate-700">{m.title}</span>
                    </div>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">
                      {m.completed}/{m.total}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        allDone ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                      style={{ inlineSize: `${modPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!levelCode && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">
            No level assigned yet. Ask your teacher to assign a level to start tracking progress.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/student/dashboard/lessons"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Browse lessons →
        </Link>
        <Link
          href="/student/dashboard/submissions"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          View submissions →
        </Link>
        <Link
          href="/student/dashboard/learning-progress"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Learning checklist →
        </Link>
      </div>
    </div>
  );
}
