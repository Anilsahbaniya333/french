"use client";

import { useState, useEffect } from "react";

interface Tutor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
  schedule: string | null;
  start_date: string | null;
  is_active: boolean;
  created_at: string;
  tutors: Tutor | null;
}

const LEVEL_OPTIONS = [
  { value: "", label: "No level" },
  { value: "a1", label: "A1 – Beginner" },
  { value: "a2", label: "A2 – Elementary" },
  { value: "b1", label: "B1 – Intermediate" },
  { value: "b2", label: "B2 – Upper Intermediate" },
];

const LEVEL_BADGE: Record<string, string> = {
  a1: "bg-emerald-100 text-emerald-800",
  a2: "bg-sky-100 text-sky-800",
  b1: "bg-violet-100 text-violet-800",
  b2: "bg-amber-100 text-amber-800",
};

export default function ManageGroupsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"groups" | "tutors">("groups");

  // Tutor form
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [tutorForm, setTutorForm] = useState({ full_name: "", email: "", phone: "" });
  const [savingTutor, setSavingTutor] = useState(false);
  const [tutorError, setTutorError] = useState("");

  // Group form
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({
    group_name: "",
    level_code: "",
    tutor_id: "",
    schedule: "",
    start_date: "",
    is_active: true,
  });
  const [savingGroup, setSavingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  // Edit group
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<typeof groupForm>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [tRes, gRes] = await Promise.all([
      fetch("/api/admin/tutors").then((r) => r.json()),
      fetch("/api/admin/manage-groups").then((r) => r.json()),
    ]);
    setTutors(tRes.tutors ?? []);
    setGroups(gRes.groups ?? []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const createTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    setTutorError("");
    setSavingTutor(true);
    try {
      const res = await fetch("/api/admin/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tutorForm),
      });
      const json = await res.json();
      if (!res.ok) { setTutorError(json.error ?? "Failed"); return; }
      setTutors((p) => [...p, json.tutor].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setTutorForm({ full_name: "", email: "", phone: "" });
      setShowTutorForm(false);
    } catch {
      setTutorError("Network error");
    } finally {
      setSavingTutor(false);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupError("");
    setSavingGroup(true);
    try {
      const res = await fetch("/api/admin/manage-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...groupForm,
          level_code: groupForm.level_code || null,
          tutor_id: groupForm.tutor_id || null,
          start_date: groupForm.start_date || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setGroupError(json.error ?? "Failed"); return; }
      setGroups((p) => [json.group, ...p]);
      setGroupForm({ group_name: "", level_code: "", tutor_id: "", schedule: "", start_date: "", is_active: true });
      setShowGroupForm(false);
    } catch {
      setGroupError("Network error");
    } finally {
      setSavingGroup(false);
    }
  };

  const saveGroupEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/manage-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          level_code: editForm.level_code || null,
          tutor_id: editForm.tutor_id || null,
          start_date: editForm.start_date || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setGroups((p) => p.map((g) => (g.id === id ? json.group : g)));
        setEditingGroup(null);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async (g: Group) => {
    const res = await fetch(`/api/admin/manage-groups/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !g.is_active }),
    });
    if (res.ok) {
      const json = await res.json();
      setGroups((p) => p.map((x) => (x.id === g.id ? json.group : x)));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage Groups</h1>
        <p className="mt-1 text-slate-500">Create groups, assign tutors, and manage schedules.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {(["groups", "tutors"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors capitalize ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : tab === "groups" ? (
        /* ── GROUPS TAB ─────────────────────────────────────────── */
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => setShowGroupForm((v) => !v)}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              + New group
            </button>
          </div>

          {/* Create group form */}
          {showGroupForm && (
            <form onSubmit={createGroup} className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="mb-4 font-semibold text-slate-800">Create new group</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Group name *</label>
                  <input
                    type="text" required
                    placeholder="e.g. A1 Evening Batch – May 2026"
                    value={groupForm.group_name}
                    onChange={(e) => setGroupForm((p) => ({ ...p, group_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                  <select
                    value={groupForm.level_code}
                    onChange={(e) => setGroupForm((p) => ({ ...p, level_code: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  >
                    {LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tutor</label>
                  <select
                    value={groupForm.tutor_id}
                    onChange={(e) => setGroupForm((p) => ({ ...p, tutor_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">No tutor assigned</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                  {tutors.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No tutors yet — create one in the Tutors tab first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon & Wed 18:00–19:30"
                    value={groupForm.schedule}
                    onChange={(e) => setGroupForm((p) => ({ ...p, schedule: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
                  <input
                    type="date"
                    value={groupForm.start_date}
                    onChange={(e) => setGroupForm((p) => ({ ...p, start_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={groupForm.is_active}
                    onChange={(e) => setGroupForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active (visible to students)</label>
                </div>
              </div>
              {groupError && (
                <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{groupError}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={savingGroup}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {savingGroup ? "Creating…" : "Create group"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowGroupForm(false); setGroupError(""); }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Groups list */}
          {groups.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
              <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-4 text-slate-400">No groups yet. Create your first group above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => {
                const isEditing = editingGroup === g.id;
                return (
                  <div
                    key={g.id}
                    className={`rounded-2xl border bg-white p-4 ${!g.is_active ? "opacity-60" : "border-slate-200"}`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Group name</label>
                            <input
                              type="text"
                              value={editForm.group_name ?? ""}
                              onChange={(e) => setEditForm((p) => ({ ...p, group_name: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
                            <select
                              value={editForm.level_code ?? ""}
                              onChange={(e) => setEditForm((p) => ({ ...p, level_code: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              {LEVEL_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Tutor</label>
                            <select
                              value={editForm.tutor_id ?? ""}
                              onChange={(e) => setEditForm((p) => ({ ...p, tutor_id: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            >
                              <option value="">No tutor</option>
                              {tutors.map((t) => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Schedule</label>
                            <input
                              type="text"
                              value={editForm.schedule ?? ""}
                              onChange={(e) => setEditForm((p) => ({ ...p, schedule: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Start date</label>
                            <input
                              type="date"
                              value={editForm.start_date ?? ""}
                              onChange={(e) => setEditForm((p) => ({ ...p, start_date: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveGroupEdit(g.id)}
                            disabled={savingEdit}
                            className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                          >
                            {savingEdit ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGroup(null)}
                            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-800">{g.group_name}</p>
                            {g.level_code && (
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase ${LEVEL_BADGE[g.level_code] ?? "bg-slate-100 text-slate-600"}`}>
                                {g.level_code.toUpperCase()}
                              </span>
                            )}
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${g.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                              {g.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                            {g.tutors && (
                              <span className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {g.tutors.full_name}
                              </span>
                            )}
                            {g.schedule && (
                              <span className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {g.schedule}
                              </span>
                            )}
                            {g.start_date && (
                              <span className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(g.start_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGroup(g.id);
                              setEditForm({
                                group_name: g.group_name,
                                level_code: g.level_code ?? "",
                                tutor_id: g.tutors?.id ?? "",
                                schedule: g.schedule ?? "",
                                start_date: g.start_date ?? "",
                              });
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(g)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            {g.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── TUTORS TAB ─────────────────────────────────────────── */
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">{tutors.length} tutor{tutors.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => setShowTutorForm((v) => !v)}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              + New tutor
            </button>
          </div>

          {/* Create tutor form */}
          {showTutorForm && (
            <form onSubmit={createTutor} className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="mb-4 font-semibold text-slate-800">Add tutor</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full name *</label>
                  <input
                    type="text" required
                    placeholder="Tutor's full name"
                    value={tutorForm.full_name}
                    onChange={(e) => setTutorForm((p) => ({ ...p, full_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="tutor@example.com"
                    value={tutorForm.email}
                    onChange={(e) => setTutorForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 234 567 8900"
                    value={tutorForm.phone}
                    onChange={(e) => setTutorForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
              {tutorError && (
                <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{tutorError}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={savingTutor}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {savingTutor ? "Adding…" : "Add tutor"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowTutorForm(false); setTutorError(""); }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Tutors list */}
          {tutors.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
              <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="mt-4 text-slate-400">No tutors yet. Add your first tutor above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tutors.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                      {t.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{t.full_name}</p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-slate-400">
                        {t.email && <span>{t.email}</span>}
                        {t.phone && <span>{t.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {groups.filter((g) => g.tutors?.id === t.id).length} group(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
