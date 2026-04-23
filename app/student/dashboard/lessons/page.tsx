"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Topic {
  id: string;
  title: string;
  description?: string;
  estimated_duration?: string;
  sort_order: number;
  hasVideo: boolean;
  hasMaterial: boolean;
  hasExercise: boolean;
  hasAssignment: boolean;
  videos: { id: string }[];
  materials: { id: string }[];
  exercises: { id: string }[];
  assignments: { id: string }[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  topics: Topic[];
}

interface Level {
  id: string;
  code: string;
  title: string;
  subtitle?: string;
  description?: string;
  duration?: string;
}

export default function StudentLessonsPage() {
  const [level, setLevel] = useState<Level | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/student/curriculum").then((r) => r.json()),
      fetch("/api/student/lesson-progress").then((r) => r.json()),
    ])
      .then(([curr, prog]) => {
        setLevel(curr.level ?? null);
        setModules(curr.modules ?? []);
        setCompletedIds(new Set(prog.completed ?? []));
        // Auto-expand the first incomplete module
        const mods: Module[] = curr.modules ?? [];
        const firstIncomplete = mods.find((m) =>
          m.topics.some((t) => !(prog.completed ?? []).includes(t.id))
        );
        if (firstIncomplete) {
          setExpandedModules(new Set([firstIncomplete.id]));
        } else if (mods.length > 0) {
          setExpandedModules(new Set([mods[0].id]));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!level) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Lessons</h1>
        <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="mt-4 font-semibold text-slate-600">No level assigned yet</p>
          <p className="mt-1 text-sm text-slate-400">Your teacher needs to assign you a level before lessons appear here.</p>
        </div>
      </div>
    );
  }

  const totalTopics = modules.reduce((s, m) => s + m.topics.length, 0);
  const completedCount = modules.reduce(
    (s, m) => s + m.topics.filter((t) => completedIds.has(t.id)).length,
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-sm font-black text-amber-800 uppercase">
                {level.code.toUpperCase()}
              </span>
              <h1 className="text-2xl font-bold text-slate-800">{level.title}</h1>
            </div>
            {level.subtitle && <p className="text-slate-500">{level.subtitle}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-amber-500">
              {completedCount}<span className="text-base font-medium text-slate-400">/{totalTopics}</span>
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">lessons done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Modules */}
      {modules.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No modules added yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, modIdx) => {
            const modCompleted = mod.topics.filter((t) => completedIds.has(t.id)).length;
            const modTotal = mod.topics.length;
            const allDone = modTotal > 0 && modCompleted === modTotal;
            const isOpen = expandedModules.has(mod.id);

            return (
              <div key={mod.id} className={`rounded-2xl border bg-white overflow-hidden shadow-sm ${allDone ? "border-emerald-200" : "border-slate-200"}`}>
                {/* Module header */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${allDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {allDone ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      modIdx + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${allDone ? "text-emerald-800" : "text-slate-800"}`}>{mod.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {modCompleted}/{modTotal} lessons complete
                    </p>
                  </div>
                  {/* Module mini progress */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${allDone ? "bg-emerald-400" : "bg-amber-400"}`}
                        style={{ width: `${modTotal > 0 ? (modCompleted / modTotal) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0}%</span>
                  </div>
                  <svg
                    className={`h-5 w-5 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Topics list */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {mod.topics.length === 0 ? (
                      <p className="px-6 py-4 text-sm text-slate-400 italic">No lessons in this module yet.</p>
                    ) : (
                      mod.topics.map((topic, topicIdx) => {
                        const done = completedIds.has(topic.id);
                        const hasVideo = topic.hasVideo || topic.videos.length > 0;
                        const hasExercise = topic.hasExercise || topic.exercises.length > 0;
                        const hasAssignment = topic.hasAssignment || topic.assignments.length > 0;

                        return (
                          <Link
                            key={topic.id}
                            href={`/student/dashboard/lessons/${topic.id}`}
                            className={`flex items-center gap-4 px-5 py-3.5 border-b last:border-b-0 border-slate-100 hover:bg-slate-50 transition-colors group`}
                          >
                            {/* Done indicator */}
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${done ? "border-emerald-400 bg-emerald-50 text-emerald-600" : "border-slate-200 text-slate-400"}`}>
                              {done ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                topicIdx + 1
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate group-hover:text-amber-700 transition-colors ${done ? "text-slate-500" : "text-slate-800"}`}>
                                {topic.title}
                              </p>
                              {topic.estimated_duration && (
                                <p className="text-xs text-slate-400 mt-0.5">{topic.estimated_duration}</p>
                              )}
                            </div>

                            {/* Content badges */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasVideo && (
                                <span className="rounded-md bg-sky-50 border border-sky-100 px-1.5 py-0.5 text-xs text-sky-600 font-medium">video</span>
                              )}
                              {hasExercise && (
                                <span className="rounded-md bg-violet-50 border border-violet-100 px-1.5 py-0.5 text-xs text-violet-600 font-medium">quiz</span>
                              )}
                              {hasAssignment && (
                                <span className="rounded-md bg-amber-50 border border-amber-100 px-1.5 py-0.5 text-xs text-amber-600 font-medium">task</span>
                              )}
                            </div>

                            <svg className="h-4 w-4 text-slate-300 group-hover:text-amber-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
