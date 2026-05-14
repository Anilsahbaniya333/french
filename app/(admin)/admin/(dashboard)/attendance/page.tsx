"use client";

import { useState, useEffect } from "react";

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
}

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  status: "present" | "absent" | "late";
}

interface Session {
  id: string;
  group_id: string;
  session_date: string;
  notes: string | null;
  groups?: { group_name: string; level_code: string | null };
}

type Step = "pick" | "mark";

const STATUS_OPTS: { value: "present" | "absent" | "late"; label: string; cls: string }[] = [
  { value: "present", label: "Present", cls: "bg-green-100 text-green-700 border-green-300" },
  { value: "absent",  label: "Absent",  cls: "bg-red-100 text-red-700 border-red-300"   },
  { value: "late",    label: "Late",    cls: "bg-yellow-100 text-yellow-700 border-yellow-300" },
];

export default function AttendancePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [step, setStep] = useState<Step>("pick");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [currentSession, setCurrentSession] = useState<{ id: string; session_date: string } | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Load groups for selector
    fetch("/api/admin/batch-timing")
      .then((r) => r.json())
      .then((d) => setGroups((d.groups ?? []).filter((g: Group & { is_active: boolean }) => g.is_active)))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));

    loadSessions();
  }, []);

  const loadSessions = () => {
    fetch("/api/admin/attendance")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {});
  };

  const openSession = async () => {
    if (!selectedGroup || !selectedDate) return;
    setOpening(true);
    setSaveMsg(null);
    const res = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: selectedGroup, session_date: selectedDate, notes: notes || null }),
    });
    const data = await res.json().catch(() => ({}));
    setOpening(false);
    if (res.ok) {
      setCurrentSession(data.session);
      setStudents(data.students ?? []);
      setStep("mark");
    } else {
      setSaveMsg({ type: "err", text: data.error || "Failed to open session." });
    }
  };

  const setStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
  };

  const markAll = (status: "present" | "absent" | "late") => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const saveAttendance = async () => {
    if (!currentSession) return;
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch(`/api/admin/attendance/${currentSession.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: students.map((s) => ({ student_id: s.id, status: s.status })) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setSaveMsg({ type: "ok", text: `Saved ${data.saved ?? 0} record(s)!` });
      loadSessions();
    } else {
      setSaveMsg({ type: "err", text: data.error || "Save failed." });
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Delete this session and all its records?")) return;
    setDeleting(sessionId);
    await fetch(`/api/admin/attendance/${sessionId}`, { method: "DELETE" });
    setDeleting(null);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
      setStudents([]);
      setStep("pick");
    }
  };

  const inp = "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
      <p className="mt-1 text-slate-500">Create a session and mark student attendance.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: session picker / marker */}
        <div className="lg:col-span-2 space-y-4">
          {step === "pick" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-700">Open a Session</h2>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Group</label>
                {loadingGroups ? (
                  <p className="text-sm text-slate-400">Loading groups…</p>
                ) : (
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className={`w-full ${inp}`}
                  >
                    <option value="">Select a group…</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.group_name}{g.level_code ? ` (${g.level_code.toUpperCase()})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Session Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Unit 3 review"
                  className={`w-full ${inp}`}
                />
              </div>
              {saveMsg && (
                <div className={`rounded-lg px-4 py-2 text-sm font-medium ${saveMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {saveMsg.text}
                </div>
              )}
              <button
                onClick={openSession}
                disabled={opening || !selectedGroup || !selectedDate}
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {opening ? "Opening…" : "Open Session"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-700">Mark Attendance</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentSession?.session_date} · {students.length} student{students.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => { setStep("pick"); setSaveMsg(null); }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  ← Change session
                </button>
              </div>

              {students.length === 0 ? (
                <p className="text-sm text-slate-400">No active students in this group.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-slate-500 font-medium">Mark all:</span>
                    {STATUS_OPTS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => markAll(opt.value)}
                        className={`rounded border px-2.5 py-1 text-xs font-medium ${opt.cls}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {students.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {STATUS_OPTS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setStatus(s.id, opt.value)}
                              className={`rounded border px-2.5 py-1 text-xs font-medium transition-opacity ${
                                s.status === opt.value ? opt.cls : "border-slate-200 bg-slate-50 text-slate-400 opacity-60"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={saveAttendance}
                      disabled={saving}
                      className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save Attendance"}
                    </button>
                    {saveMsg && (
                      <span className={`text-sm font-medium ${saveMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                        {saveMsg.text}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: recent sessions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400">No sessions yet.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                    currentSession?.id === s.id ? "border-amber-300 bg-amber-50" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setSelectedGroup(s.group_id);
                    setSelectedDate(s.session_date);
                    setNotes(s.notes ?? "");
                  }}
                >
                  <p className="text-xs font-semibold text-slate-700">{s.session_date}</p>
                  <p className="text-xs text-slate-500 truncate">{s.groups?.group_name ?? "—"}</p>
                  {s.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{s.notes}</p>}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    disabled={deleting === s.id}
                    className="mt-1.5 text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    {deleting === s.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
