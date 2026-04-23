"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Progress {
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

interface Student {
  full_name: string;
  email: string;
  group_id: number | null;
  group_uuid?: string | null;
  level_code: string | null;
}

const LEVEL_LABELS: Record<string, string> = {
  a1: "A1 – Beginner",
  a2: "A2 – Elementary",
  b1: "B1 – Intermediate",
  b2: "B2 – Upper Intermediate",
};

const LEVEL_COLORS: Record<string, string> = {
  a1: "bg-emerald-500",
  a2: "bg-sky-500",
  b1: "bg-violet-500",
  b2: "bg-rose-500",
};

const LEVEL_RING: Record<string, string> = {
  a1: "#10b981",
  a2: "#0ea5e9",
  b1: "#8b5cf6",
  b2: "#f43f5e",
};

function CircleProgress({ pct, color = "#f59e0b" }: { pct: number; color?: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StudentDashboardHome() {
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/student/me").then((r) => r.json()),
      fetch("/api/student/progress").then((r) => r.json()),
    ])
      .then(([me, prog]) => {
        const s = me.student ?? null;
        setStudent(s);
        if (!prog.error) setProgress(prog);

        // Count pending assignments — prefer UUID group, fall back to legacy group_id
        const assignmentsUrl = s?.group_uuid
          ? `/api/assignments?group_uuid=${encodeURIComponent(s.group_uuid)}`
          : s?.group_id
          ? `/api/assignments?group=${s.group_id}`
          : null;
        if (assignmentsUrl) {
          fetch(assignmentsUrl)
            .then((r) => r.json())
            .then((a) => {
              const total = (a.assignments ?? []).length;
              const submitted = prog.totalSubmissions ?? 0;
              setPendingAssignments(Math.max(0, total - submitted));
            })
            .catch(() => {});
        }
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

  const levelCode = student?.level_code ?? progress?.levelCode ?? null;
  const levelLabel = levelCode ? LEVEL_LABELS[levelCode] : null;
  const pct = progress?.progressPercent ?? 0;
  const ringColor = levelCode ? LEVEL_RING[levelCode] : "#f59e0b";

  return (
    <div className="space-y-6">

      {/* ── Welcome ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {student?.full_name?.split(" ")[0] ?? "Student"} 👋
        </h1>
        <p className="mt-1 text-slate-500 text-sm">Here's your learning summary.</p>
      </div>

      {/* ── Level + Progress ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* My Level */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">My Level</p>
          {levelCode ? (
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-sm ${LEVEL_COLORS[levelCode] ?? "bg-slate-400"}`}>
                {levelCode.toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-black text-slate-800">{levelCode.toUpperCase()}</p>
                <p className="text-sm text-slate-500 mt-0.5">{levelLabel}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {progress?.completedModules ?? 0} / {progress?.totalModules ?? 0} modules done
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm text-slate-400 italic">No level assigned yet.<br />Ask your teacher to assign you a level.</p>
            </div>
          )}
        </div>

        {/* Overall Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Overall Progress</p>
          {progress && progress.totalTopics > 0 ? (
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <CircleProgress pct={pct} color={ringColor} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black text-slate-800">{pct}%</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Lessons</p>
                  <p className="font-bold text-slate-800">
                    {progress.completedTopics}
                    <span className="text-slate-400 font-normal"> / {progress.totalTopics}</span>
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">Modules</p>
                  <p className="font-bold text-slate-800">
                    {progress.completedModules}
                    <span className="text-slate-400 font-normal"> / {progress.totalModules}</span>
                  </p>
                </div>
                {/* mini progress bar */}
                <div className="h-1.5 w-28 rounded-full bg-slate-100 overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: ringColor }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              {levelCode ? "Start your first lesson to track progress." : "Assign a level to track progress."}
            </p>
          )}
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Lessons Done",
            value: progress?.completedTopics ?? 0,
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
          },
          {
            label: "Modules Done",
            value: progress?.completedModules ?? 0,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
          },
          {
            label: "Submitted",
            value: progress?.totalSubmissions ?? 0,
            color: "text-sky-600",
            bg: "bg-sky-50",
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
          },
          {
            label: "Pending Tasks",
            value: pendingAssignments,
            color: pendingAssignments > 0 ? "text-rose-600" : "text-slate-400",
            bg: pendingAssignments > 0 ? "bg-rose-50" : "bg-slate-50",
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
          },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border border-slate-200 ${stat.bg} p-4 text-center`}>
            <svg className={`mx-auto h-5 w-5 mb-1 ${stat.color} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {stat.icon}
            </svg>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Continue Learning ─────────────────────────────────────────── */}
      {progress?.nextTopic && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">Continue where you left off</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-amber-600 font-medium">{progress.nextTopic.moduleTitle}</p>
              <p className="font-semibold text-slate-800 mt-0.5 text-lg">{progress.nextTopic.title}</p>
            </div>
            <Link
              href={`/student/dashboard/lessons/${progress.nextTopic.id}`}
              className="shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
            >
              Start lesson →
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick nav cards ───────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/student/dashboard/lessons",
            title: "My Lessons",
            desc: "Browse modules and all lessons",
            color: "text-amber-600",
            bg: "group-hover:bg-amber-50 group-hover:border-amber-200",
            iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
          },
          {
            href: "/student/dashboard/assignments",
            title: "Assignments",
            desc: "Submit your work and tasks",
            color: "text-sky-600",
            bg: "group-hover:bg-sky-50 group-hover:border-sky-200",
            iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
          },
          {
            href: "/student/dashboard/progress",
            title: "My Progress",
            desc: "Track completion and stats",
            color: "text-violet-600",
            bg: "group-hover:bg-violet-50 group-hover:border-violet-200",
            iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group rounded-2xl border border-slate-200 bg-white p-5 transition-colors ${link.bg}`}
          >
            <svg className={`h-7 w-7 ${link.color} mb-3`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {link.iconPath}
            </svg>
            <p className="font-semibold text-slate-800">{link.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
