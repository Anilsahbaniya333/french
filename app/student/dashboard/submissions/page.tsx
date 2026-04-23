"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Submission {
  id: string;
  submission_text?: string;
  file_url?: string;
  audio_url?: string;
  score?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
  graded_at?: string;
  assignments?: {
    title: string;
    max_score?: number;
    topics?: {
      title: string;
      modules?: { title: string; levels?: { code: string; title: string } };
    };
  };
}

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  submitted:      { label: "Submitted",       badge: "bg-amber-100 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  graded:         { label: "Graded",          badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  reviewed:       { label: "Reviewed",        badge: "bg-sky-100 text-sky-700 border-sky-200",           dot: "bg-sky-500" },
  needs_revision: { label: "Needs revision",  badge: "bg-red-100 text-red-700 border-red-200",           dot: "bg-red-500" },
  feedback_sent:  { label: "Feedback sent",   badge: "bg-violet-100 text-violet-700 border-violet-200",  dot: "bg-violet-500" },
  completed:      { label: "Completed",       badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const GRADED_STATUSES = new Set(["graded", "reviewed", "needs_revision", "feedback_sent", "completed"]);

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");

  useEffect(() => {
    fetch("/api/student/submissions")
      .then((r) => r.json())
      .then((d) => {
        const subs = d.submissions ?? [];
        console.log(`[submissions] loaded count=${subs.length} graded=${subs.filter((s: any) => GRADED_STATUSES.has(s.status)).length}`);
        setSubmissions(subs);
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

  const gradedCount   = submissions.filter((s) => GRADED_STATUSES.has(s.status)).length;
  const pendingCount  = submissions.filter((s) => !GRADED_STATUSES.has(s.status)).length;

  const filtered = submissions.filter((s) => {
    if (filter === "pending") return !GRADED_STATUSES.has(s.status);
    if (filter === "graded")  return GRADED_STATUSES.has(s.status);
    return true;
  });

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Submissions</h1>
        <p className="mt-1 text-sm text-slate-500">All your assignment submissions and teacher feedback.</p>
      </div>

      {/* ── Summary badges ─────────────────────────────────────────────── */}
      {submissions.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
              filter === "all"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            All
            <span className={`rounded-full px-2 py-0.5 text-xs ${filter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {submissions.length}
            </span>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
              filter === "pending"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-slate-600 border-slate-200 hover:border-amber-200"
            }`}
          >
            Awaiting review
            {pendingCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${filter === "pending" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("graded")}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
              filter === "graded"
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200"
            }`}
          >
            With feedback
            {gradedCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${filter === "graded" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                {gradedCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 font-semibold text-slate-500">
            {submissions.length === 0
              ? "No submissions yet"
              : filter === "graded"
              ? "No graded submissions yet"
              : "Nothing awaiting review"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {submissions.length === 0
              ? "Once you submit an assignment it will appear here."
              : "Check back soon!"}
          </p>
          {submissions.length === 0 && (
            <Link
              href="/student/dashboard/assignments"
              className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              View assignments →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const asgn = s.assignments as any;
            const topic = asgn?.topics as any;
            const mod = topic?.modules as any;
            const level = mod?.levels as any;
            const meta = STATUS_META[s.status] ?? { label: s.status, badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
            const isGraded = GRADED_STATUSES.has(s.status);
            const isRevision = s.status === "needs_revision";

            return (
              <div
                key={s.id}
                className={`rounded-2xl border bg-white overflow-hidden ${isRevision ? "border-red-100" : isGraded ? "border-emerald-100" : "border-slate-200"}`}
              >
                {/* Top accent bar for graded / needs revision */}
                {isRevision && <div className="h-1 w-full bg-red-400" />}
                {isGraded && !isRevision && <div className="h-1 w-full bg-emerald-400" />}

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {level?.code && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800 uppercase">
                            {level.code}
                          </span>
                        )}
                        {mod?.title && (
                          <span className="text-xs text-slate-400 truncate max-w-[12rem]">{mod.title}</span>
                        )}
                        {topic?.title && (
                          <span className="text-xs text-slate-400">/ {topic.title}</span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800">{asgn?.title ?? "Assignment"}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Submitted{" "}
                        {new Date(s.submitted_at).toLocaleDateString(undefined, {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>

                  {/* Student's answer */}
                  {s.submission_text && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Your answer</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{s.submission_text}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {(s.file_url || s.audio_url) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {s.file_url && (
                        <a
                          href={s.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-amber-300 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attached file
                        </a>
                      )}
                      {s.audio_url && (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <audio src={s.audio_url} controls className="h-8 max-w-[200px]" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher feedback */}
                  {isGraded && (s.score != null || s.feedback) ? (
                    <div className={`rounded-xl px-4 py-4 border ${isRevision ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isRevision ? "text-red-600" : "text-emerald-600"}`}>
                        {isRevision ? "Revision Needed" : "Teacher Feedback"}
                      </p>
                      {s.score != null && (
                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span className={`text-3xl font-black ${isRevision ? "text-red-700" : "text-emerald-700"}`}>{s.score}</span>
                          {asgn?.max_score && (
                            <span className={`text-sm ${isRevision ? "text-red-500" : "text-emerald-500"}`}>/ {asgn.max_score} pts</span>
                          )}
                          <span className={`ml-2 text-xs font-semibold rounded-full px-2 py-0.5 ${
                            s.score >= (asgn?.max_score ?? 100) * 0.8
                              ? "bg-emerald-100 text-emerald-700"
                              : s.score >= (asgn?.max_score ?? 100) * 0.5
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {asgn?.max_score
                              ? `${Math.round((s.score / asgn.max_score) * 100)}%`
                              : ""}
                          </span>
                        </div>
                      )}
                      {s.feedback && (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{s.feedback}</p>
                      )}
                      {s.graded_at && (
                        <p className={`mt-3 text-xs ${isRevision ? "text-red-600/70" : "text-emerald-600/70"}`}>
                          Reviewed on {new Date(s.graded_at).toLocaleDateString(undefined, {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  ) : isGraded ? (
                    <div className={`rounded-xl px-4 py-3 border ${isRevision ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                      <p className={`text-sm italic ${isRevision ? "text-red-700" : "text-emerald-700"}`}>
                        {isRevision ? "Your teacher has requested a revision." : "Your teacher has reviewed this submission."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                      <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-amber-700">Awaiting teacher review…</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
