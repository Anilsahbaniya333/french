"use client";

import { useState, useEffect } from "react";

interface AvailabilityRecord {
  id: string;
  availability_text: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  students: { full_name: string; email: string } | null;
  groups: { group_name: string } | null;
}

export default function AdminStudentAvailabilityPage() {
  const [records, setRecords] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/student-availability")
      .then((r) => r.json())
      .then((d) => setRecords(d.availability ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.students?.full_name ?? "").toLowerCase().includes(q) ||
      (r.students?.email ?? "").toLowerCase().includes(q) ||
      (r.groups?.group_name ?? "").toLowerCase().includes(q) ||
      r.availability_text.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Student Availability</h1>
        <p className="mt-1 text-sm text-slate-500">
          View when students are available for classes.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No availability submissions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">
                    {r.students?.full_name ?? "Unknown"}
                  </p>
                  <p className="text-sm text-slate-500">{r.students?.email ?? ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.groups?.group_name && (
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {r.groups.group_name}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Updated {new Date(r.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Availability
                </p>
                <p className="whitespace-pre-wrap text-sm text-slate-800">
                  {r.availability_text}
                </p>
              </div>

              {r.note && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Note
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{r.note}</p>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Submitted{" "}
                {new Date(r.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
