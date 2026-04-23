"use client";

import { useState, useEffect, useCallback } from "react";
import { GROUP_NAMES, GROUP_COLORS, GROUP_LIGHT } from "@/lib/groups";

const LEGACY_GROUPS = [1, 2, 3, 4, 5, 6, 7];

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "needs_revision", label: "Needs Revision" },
  { value: "feedback_sent", label: "Feedback Sent" },
  { value: "graded", label: "Graded" },
  { value: "completed", label: "Completed" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700 border-amber-200",
  reviewed: "bg-sky-100 text-sky-700 border-sky-200",
  needs_revision: "bg-red-100 text-red-700 border-red-200",
  feedback_sent: "bg-purple-100 text-purple-700 border-purple-200",
  graded: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface DynGroup {
  id: string;
  group_name: string;
  level_code: string | null;
  is_active: boolean;
}

interface Submission {
  id: string;
  student_name: string;
  student_email: string;
  submission_text?: string;
  file_url?: string;
  audio_url?: string;
  score?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
  graded_at?: string;
  group_number?: number;
  assignments?: {
    title: string;
    max_score?: number;
    topics?: {
      title: string;
      modules?: { title: string; levels?: { code: string } };
    };
  };
}

export default function AdminGroupsPage() {
  // Dynamic groups from DB
  const [dynGroups, setDynGroups] = useState<DynGroup[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  // Active group (UUID for dynamic, number for legacy fallback)
  const [activeGroupUuid, setActiveGroupUuid] = useState<string | null>(null);
  const [activeLegacyGroup, setActiveLegacyGroup] = useState<number>(1);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string; status: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Load dynamic groups on mount
  useEffect(() => {
    fetch("/api/admin/manage-groups")
      .then((r) => r.json())
      .then((d) => {
        const grps: DynGroup[] = d.groups ?? [];
        setDynGroups(grps);
        setGroupsLoaded(true);
        if (grps.length > 0) setActiveGroupUuid(grps[0].id);
      })
      .catch(() => setGroupsLoaded(true));
  }, []);

  const loadSubmissions = useCallback((url: string) => {
    setLoading(true);
    setExpanded(null);
    setFilterStatus("all");
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const subs: Submission[] = d.submissions ?? [];
        setSubmissions(subs);
        const g: Record<string, { score: string; feedback: string; status: string }> = {};
        for (const s of subs) {
          g[s.id] = {
            score: s.score != null ? String(s.score) : "",
            feedback: s.feedback ?? "",
            status: s.status ?? "submitted",
          };
        }
        setGrades(g);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const useDynamic = groupsLoaded && dynGroups.length > 0;

  useEffect(() => {
    if (!groupsLoaded) return;
    if (useDynamic && activeGroupUuid) {
      loadSubmissions(`/api/admin/groups?group_uuid=${encodeURIComponent(activeGroupUuid)}`);
    } else if (!useDynamic) {
      loadSubmissions(`/api/admin/groups?group=${activeLegacyGroup}`);
    }
  }, [groupsLoaded, useDynamic, activeGroupUuid, activeLegacyGroup, loadSubmissions]);

  const saveGrade = async (id: string) => {
    setSaving((p) => ({ ...p, [id]: true }));
    setSaveError((p) => ({ ...p, [id]: "" }));
    const g = grades[id] ?? { score: "", feedback: "", status: "submitted" };
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: g.score !== "" ? Number(g.score) : null,
          feedback: g.feedback || null,
          status: g.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError((p) => ({ ...p, [id]: json.error ?? "Save failed" }));
        return;
      }
      // Sync from server response when available, otherwise apply local grades
      const updated = json.submission;
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                score: updated?.score ?? (g.score !== "" ? Number(g.score) : undefined),
                feedback: updated?.feedback ?? (g.feedback || undefined),
                status: updated?.status ?? g.status,
                graded_at: updated?.graded_at ?? s.graded_at,
              }
            : s
        )
      );
      setSaved((p) => ({ ...p, [id]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [id]: false })), 2500);
    } catch (err: any) {
      setSaveError((p) => ({ ...p, [id]: err?.message ?? "Network error" }));
    } finally {
      setSaving((p) => ({ ...p, [id]: false }));
    }
  };

  const filteredSubs = filterStatus === "all"
    ? submissions
    : submissions.filter((s) => s.status === filterStatus);

  const countByStatus = (status: string) =>
    submissions.filter((s) => s.status === status).length;

  const activeGroupLabel = useDynamic
    ? (dynGroups.find((g) => g.id === activeGroupUuid)?.group_name ?? "")
    : `G${activeLegacyGroup} — ${GROUP_NAMES[activeLegacyGroup]}`;

  const activeLabelClass = useDynamic
    ? "bg-amber-50 border-amber-300 text-amber-800"
    : (GROUP_LIGHT[activeLegacyGroup] ?? "bg-slate-50 border-slate-300 text-slate-700");

  return (
    <div>
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Group Submissions</h1>
        <p className="mt-1 text-slate-500">Review, grade, and send feedback on student assignment submissions.</p>
      </div>

      {/* Group tabs */}
      {!groupsLoaded ? (
        <div className="mt-6 flex items-center gap-2 text-slate-400 text-sm">
          <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-amber-500 animate-spin" />
          Loading groups…
        </div>
      ) : useDynamic ? (
        // Dynamic UUID-based group tabs
        <div className="mt-6 flex flex-wrap gap-2">
          {dynGroups.map((g) => {
            const isActive = activeGroupUuid === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGroupUuid(g.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : "bg-amber-400"}`} />
                <span>{g.group_name}</span>
                {g.level_code && (
                  <span className={`text-xs font-bold uppercase ${isActive ? "opacity-70" : "text-slate-400"}`}>
                    {g.level_code}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        // Legacy G1–G7 fallback (shown only when no dynamic groups exist)
        <div className="mt-6">
          <p className="mb-2 text-xs text-slate-400">Legacy groups — create groups in Manage Groups to use the new system.</p>
          <div className="flex flex-wrap gap-2">
            {LEGACY_GROUPS.map((g) => {
              const isActive = activeLegacyGroup === g;
              const dotColor = GROUP_COLORS[g] ?? "bg-slate-400";
              return (
                <button
                  key={g}
                  onClick={() => setActiveLegacyGroup(g)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : dotColor}`} />
                  <span className="hidden lg:inline">G{g} — {GROUP_NAMES[g]}</span>
                  <span className="lg:hidden">G{g}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active group label */}
      {groupsLoaded && (
        <div className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${activeLabelClass}`}>
          <span>{activeGroupLabel}</span>
          {!loading && (
            <span className="opacity-60">
              ({submissions.length} submission{submissions.length !== 1 ? "s" : ""})
            </span>
          )}
        </div>
      )}

      {/* Status filter */}
      {submissions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-slate-800 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All ({submissions.length})
          </button>
          {STATUS_OPTIONS.map((opt) => {
            const count = countByStatus(opt.value);
            if (count === 0) return null;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterStatus === opt.value
                    ? "bg-slate-800 border-slate-800 text-white"
                    : `${STATUS_STYLES[opt.value]} hover:opacity-80`
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Submissions */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-3 py-10 text-slate-400">
            <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-amber-500 animate-spin" />
            Loading submissions…
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-3 text-slate-400">
              {filterStatus !== "all"
                ? `No ${filterStatus.replace("_", " ")} submissions for this group.`
                : `No submissions for ${activeGroupLabel} yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubs.map((s) => {
              const asgn = s.assignments as any;
              const topic = asgn?.topics as any;
              const mod = topic?.modules as any;
              const g = grades[s.id] ?? { score: "", feedback: "", status: s.status };
              const isExpanded = expanded === s.id;
              const statusStyle = STATUS_STYLES[s.status] ?? "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <div key={s.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  {/* Collapsed header */}
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : s.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {s.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {mod?.levels?.code && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800 uppercase">
                              {mod.levels.code}
                            </span>
                          )}
                          <p className="font-semibold text-slate-800 truncate">{s.student_name}</p>
                          {asgn?.title && (
                            <span className="hidden sm:inline text-xs text-slate-400">— {asgn.title}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {s.student_email} · Submitted{" "}
                          {new Date(s.submitted_at).toLocaleDateString(undefined, {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle}`}>
                        {s.status.replace("_", " ")}
                      </span>
                      <svg
                        className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 pb-6 pt-5 space-y-5">
                      {/* Assignment info */}
                      {asgn?.title && (
                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Assignment</p>
                          <p className="font-semibold text-slate-800">{asgn.title}</p>
                          {topic?.title && <p className="text-xs text-slate-500 mt-0.5">{mod?.title} › {topic.title}</p>}
                          {asgn?.max_score && <p className="text-xs text-slate-400 mt-1">Max score: {asgn.max_score} pts</p>}
                        </div>
                      )}

                      {/* Written answer */}
                      {s.submission_text && (
                        <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-2">Written Answer</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{s.submission_text}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      <div className="flex flex-wrap gap-3">
                        {s.file_url && (
                          <a
                            href={s.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            View Uploaded File
                          </a>
                        )}
                        {s.audio_url && (
                          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2">
                            <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <div>
                              <p className="text-xs font-medium text-slate-600 mb-1">Audio Recording</p>
                              <audio src={s.audio_url} controls className="h-8 max-w-xs" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Grading panel */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Teacher Review & Feedback</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Score {asgn?.max_score && <span className="text-slate-400">/ {asgn.max_score}</span>}
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={asgn?.max_score ?? 100}
                              value={g.score}
                              onChange={(e) =>
                                setGrades((p) => ({ ...p, [s.id]: { ...g, score: e.target.value } }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                              placeholder="—"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                            <select
                              value={g.status}
                              onChange={(e) =>
                                setGrades((p) => ({ ...p, [s.id]: { ...g, status: e.target.value } }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Written feedback for student</label>
                            <textarea
                              rows={3}
                              value={g.feedback}
                              onChange={(e) =>
                                setGrades((p) => ({ ...p, [s.id]: { ...g, feedback: e.target.value } }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none"
                              placeholder="Write feedback that will be visible to the student…"
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => saveGrade(s.id)}
                            disabled={saving[s.id]}
                            className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
                          >
                            {saving[s.id] ? "Saving…" : "Save & Send Feedback"}
                          </button>
                          {saved[s.id] && (
                            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Saved
                            </span>
                          )}
                          {saveError[s.id] && (
                            <span className="text-sm text-red-600 font-medium">{saveError[s.id]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
