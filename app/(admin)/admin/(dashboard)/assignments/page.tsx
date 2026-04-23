"use client";

import { useState, useEffect, useCallback } from "react";

interface Level { id: string; code: string; title: string }
interface Module { id: string; title: string; level_id: string; levels?: Level }
interface Topic { id: string; title: string; module_id: string; modules?: Module }

interface Group {
  id: string;
  group_name: string;
  level_code?: string | null;
  is_active: boolean;
}

interface Assignment {
  id: string;
  title: string;
  instructions?: string;
  due_date_time?: string;
  max_score?: number;
  target_group_uuids?: string[];
  created_at: string;
  topics?: {
    id: string;
    title: string;
    modules?: { title: string; levels?: { code: string; title: string } };
  };
}

const EMPTY_FORM = {
  title: "",
  instructions: "",
  due_date_time: "",
  max_score: "100",
  target_group_uuids: [] as string[],
  topic_id: "",
};

function GroupCheckboxes({
  value,
  onChange,
  groups,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  groups: Group[];
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const activeGroups = groups.filter((g) => g.is_active);

  if (activeGroups.length === 0) {
    return <p className="mt-2 text-xs text-slate-400">No active groups found. Create groups first.</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {activeGroups.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => toggle(g.id)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            value.includes(g.id)
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-slate-300 bg-white text-slate-600 hover:border-amber-300"
          }`}
        >
          {g.group_name}
          {g.level_code && (
            <span className="ml-1.5 font-normal opacity-70 uppercase">{g.level_code}</span>
          )}
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange(value.length === activeGroups.length ? [] : activeGroups.map((g) => g.id))
        }
        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
      >
        {value.length === activeGroups.length ? "Clear all" : "Select all"}
      </button>
      {value.length === 0 && (
        <p className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No specific groups selected — this assignment will be visible to <strong>all groups</strong>.
        </p>
      )}
    </div>
  );
}

function AssignmentForm({
  topics,
  groups,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  topics: Topic[];
  groups: Group[];
  initial: typeof EMPTY_FORM;
  submitLabel: string;
  onSubmit: (form: typeof EMPTY_FORM) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Assignment title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            placeholder="e.g. Write about your daily routine in French"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
          <textarea
            rows={4}
            value={form.instructions}
            onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            placeholder="Describe what students need to do, submission format, and any tips…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Due date & time (optional)
          </label>
          <input
            type="datetime-local"
            value={form.due_date_time}
            onChange={(e) => setForm((p) => ({ ...p, due_date_time: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max score</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={form.max_score}
            onChange={(e) => setForm((p) => ({ ...p, max_score: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            placeholder="100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target groups{" "}
            <span className="text-slate-400 font-normal">(leave empty to post to all groups)</span>
          </label>
          <GroupCheckboxes
            value={form.target_group_uuids}
            onChange={(v) => setForm((p) => ({ ...p, target_group_uuids: v }))}
            groups={groups}
          />
        </div>

        {topics.length > 0 && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link to a lesson topic{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              value={form.topic_id}
              onChange={(e) => setForm((p) => ({ ...p, topic_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="">Not linked to a topic</option>
              {topics.map((t) => {
                const levelCode = (t.modules as any)?.levels?.code?.toUpperCase() ?? "";
                const modTitle = (t.modules as any)?.title ?? "";
                return (
                  <option key={t.id} value={t.id}>
                    {levelCode} › {modTitle} › {t.title}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadAssignments = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/assignments")
      .then((r) => r.json())
      .then((d) => setAssignments(d.assignments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAssignments();

    fetch("/api/admin/curriculum")
      .then((r) => r.json())
      .then((d) => {
        const allTopics: Topic[] = [];
        for (const level of d.levels ?? []) {
          for (const mod of level.modules ?? []) {
            for (const topic of mod.topics ?? []) {
              allTopics.push({
                id: topic.id,
                title: topic.title,
                module_id: mod.id,
                modules: {
                  id: mod.id,
                  title: mod.title,
                  level_id: level.id,
                  levels: { id: level.id, code: level.code, title: level.title },
                },
              });
            }
          }
        }
        setTopics(allTopics);
      })
      .catch(() => {});

    fetch("/api/admin/manage-groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {});
  }, [loadAssignments]);

  const createAssignment = async (form: typeof EMPTY_FORM) => {
    const res = await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        max_score: form.max_score ? Number(form.max_score) : 100,
        topic_id: form.topic_id || null,
        due_date_time: form.due_date_time || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to create assignment");
    setAssignments((p) => [json.assignment, ...p]);
    setShowCreate(false);
  };

  const updateAssignment = async (id: string, form: typeof EMPTY_FORM) => {
    const res = await fetch(`/api/admin/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        max_score: form.max_score ? Number(form.max_score) : 100,
        topic_id: form.topic_id || null,
        due_date_time: form.due_date_time || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to update assignment");
    setAssignments((p) => p.map((a) => (a.id === id ? json.assignment : a)));
    setEditingId(null);
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment? This will also delete all student submissions.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Failed to delete assignment");
        return;
      }
      setAssignments((p) => p.filter((a) => a.id !== id));
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const formatGroupUuids = (uuids?: string[]) => {
    if (!uuids || uuids.length === 0) return "All groups";
    const names = uuids
      .map((id) => groups.find((g) => g.id === id)?.group_name ?? id.slice(0, 8))
      .join(", ");
    return names;
  };

  const toForm = (a: Assignment): typeof EMPTY_FORM => ({
    title: a.title,
    instructions: a.instructions ?? "",
    due_date_time: a.due_date_time ? a.due_date_time.slice(0, 16) : "",
    max_score: String(a.max_score ?? 100),
    target_group_uuids: a.target_group_uuids ?? [],
    topic_id: (a.topics as any)?.id ?? "",
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
          <p className="mt-1 text-slate-500">
            Create and manage assignments posted to student groups.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate((v) => !v);
            setEditingId(null);
          }}
          className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          + New Assignment
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-slate-800 text-lg mb-5">Create New Assignment</h2>
          <AssignmentForm
            topics={topics}
            groups={groups}
            initial={EMPTY_FORM}
            submitLabel="Post Assignment"
            onSubmit={createAssignment}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Assignments list */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center gap-3 py-8 text-slate-400">
            <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-amber-500 animate-spin" />
            Loading assignments…
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-3 font-medium text-slate-500">No assignments posted yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Click "New Assignment" to create your first one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const topic = a.topics;
              const mod = (topic as any)?.modules;
              const level = mod?.levels;
              const isEditing = editingId === a.id;

              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                >
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {level && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 uppercase">
                              {level.code}
                            </span>
                            {mod && (
                              <span className="text-xs text-slate-400">{mod.title}</span>
                            )}
                            {topic && (
                              <span className="text-xs text-slate-400">/ {topic.title}</span>
                            )}
                          </div>
                        )}
                        <p className="font-semibold text-slate-800 text-base">{a.title}</p>
                        {a.instructions && !isEditing && (
                          <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                            {a.instructions}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span>
                            Groups:{" "}
                            <strong className="text-slate-600">
                              {formatGroupUuids(a.target_group_uuids)}
                            </strong>
                          </span>
                          {a.max_score && <span>Max: {a.max_score} pts</span>}
                          {a.due_date_time && (
                            <span>
                              Due:{" "}
                              {new Date(a.due_date_time).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          <span>
                            Posted{" "}
                            {new Date(a.created_at).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(a.id);
                              setShowCreate(false);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAssignment(a.id)}
                            disabled={deleting === a.id}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            {deleting === a.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
                      <p className="text-sm font-semibold text-slate-700 mb-4">Edit assignment</p>
                      <AssignmentForm
                        topics={topics}
                        groups={groups}
                        initial={toForm(a)}
                        submitLabel="Save changes"
                        onSubmit={(form) => updateAssignment(a.id, form)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {assignments.length > 0 && (
        <p className="mt-4 text-xs text-slate-400">
          {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}
