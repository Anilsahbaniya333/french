"use client";

import { useState, useEffect } from "react";

interface AttendanceRecord {
  session_date: string;
  notes: string | null;
  status: "present" | "absent" | "late";
}

interface Stats {
  total: number;
  present: number;
  absent: number;
  late: number;
  pct: number;
}

const STATUS_STYLE: Record<string, string> = {
  present: "bg-green-50 text-green-700 border border-green-200",
  absent:  "bg-red-50 text-red-700 border border-red-200",
  late:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
};

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, present: 0, absent: 0, late: 0, pct: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/attendance")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setRecords(d.records ?? []);
        setStats(d.stats ?? { total: 0, present: 0, absent: 0, late: 0, pct: 0 });
      })
      .catch(() => setError("Failed to load attendance."))
      .finally(() => setLoading(false));
  }, []);

  const pctColor =
    stats.pct >= 80 ? "text-green-600" :
    stats.pct >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Attendance</h1>
      <p className="mt-1 text-slate-500">Your attendance record across all class sessions.</p>

      {loading ? (
        <p className="mt-8 text-slate-400">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-red-500">{error}</p>
      ) : (
        <>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">Total Classes</p>
            </div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
              <p className="text-2xl font-black text-green-700">{stats.present}</p>
              <p className="mt-0.5 text-xs font-medium text-green-600">Present</p>
            </div>
            <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-center">
              <p className="text-2xl font-black text-yellow-700">{stats.late}</p>
              <p className="mt-0.5 text-xs font-medium text-yellow-600">Late</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
              <p className="text-2xl font-black text-red-700">{stats.absent}</p>
              <p className="mt-0.5 text-xs font-medium text-red-600">Absent</p>
            </div>
          </div>

          {/* Attendance rate */}
          {stats.total > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Attendance Rate</p>
                <p className={`text-xl font-black ${pctColor}`}>{stats.pct}%</p>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${stats.pct >= 80 ? "bg-green-500" : stats.pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {stats.pct >= 80
                  ? "Great attendance! Keep it up."
                  : stats.pct >= 60
                  ? "Attendance is below recommended. Try to attend more classes."
                  : "Attendance is low. Please reach out to your tutor."}
              </p>
            </div>
          )}

          {/* Records table */}
          {records.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-400 text-sm">No attendance records yet.</p>
              <p className="text-slate-400 text-xs mt-1">Records appear once your tutor marks sessions.</p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {new Date(r.session_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.notes || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[r.status] ?? "bg-slate-50 text-slate-500"}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
