"use client";

import { useState, useEffect } from "react";

interface StudentProgress {
  id: string;
  full_name: string;
  email: string;
  group_uuid: string | null;
  group_name: string | null;
  level_code: string | null;
  completed: number;
  total: number;
  percent: number;
  last_updated: string | null;
}

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminLearningProgressPage() {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/learning-progress")
      .then((r) => r.json())
      .then((d) => {
        setProgress(d.progress ?? []);
        setGroups(d.groups ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    groupFilter === "all"
      ? progress
      : progress.filter((p) => p.group_uuid === groupFilter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Learning Progress</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor how students are progressing through their checklists.
        </p>
      </div>

      {/* Group filter */}
      <div className="mb-4">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.group_name}
              {g.level_code ? ` (${g.level_code})` : ""}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No students found for this group.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Group</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Level</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">%</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{s.full_name}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      {s.group_name ? (
                        <span className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {s.group_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {s.level_code ? (
                        <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-black uppercase text-indigo-700">
                          {s.level_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-700">
                      {s.total > 0 ? s.completed : "—"}
                    </td>
                    <td className="px-5 py-3 text-center text-slate-500">
                      {s.total > 0 ? s.total : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`font-bold ${
                          s.percent === 100
                            ? "text-emerald-600"
                            : s.percent > 0
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      >
                        {s.total > 0 ? `${s.percent}%` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {formatDate(s.last_updated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{s.full_name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </div>
                  <span
                    className={`shrink-0 text-lg font-black ${
                      s.percent === 100
                        ? "text-emerald-600"
                        : s.percent > 0
                        ? "text-amber-600"
                        : "text-slate-400"
                    }`}
                  >
                    {s.total > 0 ? `${s.percent}%` : "—"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {s.group_name && (
                    <span className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                      {s.group_name}
                    </span>
                  )}
                  {s.level_code && (
                    <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 font-black uppercase text-indigo-700">
                      {s.level_code}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {s.total > 0 ? (
                      <>{s.completed} / {s.total} completed</>
                    ) : (
                      "No items assigned"
                    )}
                  </span>
                  <span className="text-slate-400">{formatDate(s.last_updated)}</span>
                </div>

                {s.total > 0 && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ inlineSize: `${s.percent}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
