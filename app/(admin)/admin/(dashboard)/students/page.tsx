"use client";

import { useState, useEffect } from "react";
import { GROUP_NAMES } from "@/lib/groups";

interface DynGroup {
  id: string;
  group_name: string;
  level_code: string | null;
  is_active: boolean;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  group_id: number | null;      // legacy — display only
  group_uuid: string | null;    // new — used for all new assignments
  level_code: string | null;
  is_active: boolean;
  created_at: string;
}

const LEVEL_OPTIONS = [
  { value: "", label: "No level assigned" },
  { value: "a1", label: "A1 – Beginner" },
  { value: "a2", label: "A2 – Elementary" },
  { value: "b1", label: "B1 – Intermediate" },
  { value: "b2", label: "B2 – Upper Intermediate" },
];

function LevelSelect({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
    >
      {LEVEL_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function DynamicGroupSelect({
  value,
  onChange,
  groups,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  groups: DynGroup[];
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
    >
      <option value="">No group assigned</option>
      {groups
        .filter((g) => g.is_active && g.id)
        .map((g) => (
          <option key={g.id} value={g.id}>
            {g.group_name}{g.level_code ? ` (${g.level_code.toUpperCase()})` : ""}
          </option>
        ))}
    </select>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dynGroups, setDynGroups] = useState<DynGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    group_uuid: null as string | null,
    level_code: null as string | null,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit state
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student & { password: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    // Use allSettled so students load even if groups endpoint fails
    const [sd, gd] = await Promise.allSettled([
      fetch("/api/admin/students").then((r) => r.json()),
      fetch("/api/admin/manage-groups").then((r) => r.json()),
    ]);
    if (sd.status === "fulfilled") {
      // Filter out any students that lack a valid id (defensive guard)
      const raw: Student[] = (sd.value as any).students ?? [];
      setStudents(raw.filter((s) => Boolean(s.id)));
    }
    if (gd.status === "fulfilled") {
      setDynGroups((gd.value as any).groups ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError("");
    if (dynGroups.length > 0 && !form.group_uuid) {
      setCreateError("Please assign this student to a group.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setCreateError(json.error ?? "Failed to create student"); return; }
      if (!json.student?.id) { setCreateError("Student created but response was invalid — refresh to see the new account."); return; }
      setStudents((p) => [json.student, ...p]);
      setForm({ full_name: "", email: "", password: "", group_uuid: null, level_code: null });
      setShowCreate(false);
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async (id: string) => {
    if (!id) return;
    setSaving((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (res.ok && json.student?.id) {
        setStudents((p) => p.map((s) => (s.id === id ? json.student : s)));
        setEditing(null);
      }
    } finally {
      setSaving((p) => ({ ...p, [id]: false }));
    }
  };

  const toggleActive = async (s: Student) => {
    if (!s.id) return;
    const res = await fetch(`/api/admin/students/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.student?.id) {
        setStudents((p) => p.map((x) => (x.id === s.id ? json.student : x)));
      }
    }
  };

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  // Resolve group display label: prefer UUID-based group, fall back to legacy group_id
  const getGroupLabel = (s: Student): string | null => {
    if (s.group_uuid) {
      return dynGroups.find((g) => g.id === s.group_uuid)?.group_name ?? "Unknown group";
    }
    if (s.group_id) return `G${s.group_id} — ${GROUP_NAMES[s.group_id]}`;
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Accounts</h1>
          <p className="mt-1 text-slate-600">Manage student login credentials and group assignments.</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          + New student
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={createStudent}
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
        >
          <h2 className="mb-4 font-semibold text-slate-800">Create new student account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full name *</label>
              <input
                type="text" required
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="Student full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address *</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password * (min 6 chars)</label>
              <input
                type="text"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="Set a password for the student"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
              {dynGroups.length > 0 ? (
                <DynamicGroupSelect
                  value={form.group_uuid}
                  onChange={(v) => setForm((p) => ({ ...p, group_uuid: v }))}
                  groups={dynGroups}
                />
              ) : (
                <p className="text-xs text-slate-400 italic mt-1">
                  No groups yet — create groups in Manage Groups first.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
              <LevelSelect value={form.level_code} onChange={(v) => setForm((p) => ({ ...p, level_code: v }))} />
            </div>
          </div>
          {createError && (
            <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{createError}</p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateError(""); }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-sm rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none"
        />
      </div>

      {/* Students table */}
      <div className="mt-4">
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-400">{students.length === 0 ? "No student accounts yet. Create one above." : "No students match your search."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const isEditing = editing === s.id;
              const groupLabel = getGroupLabel(s);

              return (
                <div key={s.id} className={`rounded-2xl border bg-white p-4 transition-colors ${!s.is_active ? "opacity-60" : "border-slate-200"}`}>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
                          <input
                            type="text"
                            value={editForm.full_name ?? ""}
                            onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                          <input
                            type="email"
                            value={editForm.email ?? ""}
                            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">New password (leave blank to keep)</label>
                          <input
                            type="text"
                            value={(editForm as any).password ?? ""}
                            onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                            placeholder="Leave blank to keep current"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Group</label>
                          {dynGroups.length > 0 ? (
                            <DynamicGroupSelect
                              value={editForm.group_uuid ?? null}
                              onChange={(v) => setEditForm((p) => ({ ...p, group_uuid: v }))}
                              groups={dynGroups}
                            />
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-1">
                              No groups yet — create groups in Manage Groups first.
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
                          <LevelSelect
                            value={(editForm as any).level_code ?? null}
                            onChange={(v) => setEditForm((p) => ({ ...p, level_code: v }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(s.id)}
                          disabled={saving[s.id]}
                          className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          {saving[s.id] ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{s.full_name}</p>
                          <p className="text-sm text-slate-500 truncate">{s.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {s.level_code && (
                          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800 uppercase">
                            {s.level_code.toUpperCase()}
                          </span>
                        )}
                        {groupLabel ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            {groupLabel}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                            No group
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(s.id);
                            setEditForm({
                              full_name: s.full_name,
                              email: s.email,
                              group_uuid: s.group_uuid,
                              level_code: s.level_code,
                            });
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(s)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
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

      {students.length > 0 && (
        <p className="mt-4 text-xs text-slate-400">{students.length} student{students.length !== 1 ? "s" : ""} total</p>
      )}
    </div>
  );
}
