"use client";

import { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  item_text: string;
  description: string | null;
  level_code: string | null;
  target_group_uuids: string[];
  is_active: boolean;
  sort_order: number;
}

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
}

const LEVELS = ["A1", "A2", "B1", "B2"];

const emptyForm = {
  item_text: "",
  description: "",
  level_code: "A1",
  target_group_uuids: [] as string[],
  sort_order: 0,
  is_active: true,
};

export default function AdminLearningChecklistsPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/learning-checklists").then((r) => r.json()),
      fetch("/api/admin/manage-groups").then((r) => r.json()),
    ])
      .then(([checklists, groupsData]) => {
        setItems(checklists.items ?? []);
        setGroups(groupsData.groups ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!form.item_text.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const url = editingId
        ? `/api/admin/learning-checklists/${editingId}`
        : "/api/admin/learning-checklists";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_text: form.item_text,
          description: form.description || null,
          level_code: form.level_code || null,
          target_group_uuids: form.target_group_uuids,
          sort_order: form.sort_order,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      resetForm();
      load();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ChecklistItem) => {
    setForm({
      item_text: item.item_text,
      description: item.description ?? "",
      level_code: item.level_code ?? "A1",
      target_group_uuids: item.target_group_uuids ?? [],
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setEditingId(item.id);
    setShowForm(true);
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this topic? Student progress for this item will also be removed.")) return;
    await fetch(`/api/admin/learning-checklists/${id}`, { method: "DELETE" });
    load();
  };

  const toggleGroup = (groupId: string) => {
    setForm((prev) => ({
      ...prev,
      target_group_uuids: prev.target_group_uuids.includes(groupId)
        ? prev.target_group_uuids.filter((id) => id !== groupId)
        : [...prev.target_group_uuids, groupId],
    }));
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Learning Checklists</h1>
          <p className="mt-1 text-sm text-slate-500">
            Add topics for students to mark as learned.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          + Add Topic
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-800">
            {editingId ? "Edit Topic" : "Add New Topic"}
          </h2>

          {formError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.item_text}
                  onChange={(e) => setForm((p) => ({ ...p, item_text: e.target.value }))}
                  required
                  placeholder="e.g. Articles"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Level</label>
                <select
                  value={form.level_code}
                  onChange={(e) => setForm((p) => ({ ...p, level_code: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">No level</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Description <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. le, la, les, un, une, des"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Assign to groups
              </label>
              {groups.length === 0 ? (
                <p className="text-sm text-slate-400">No groups found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const selected = form.target_group_uuids.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selected
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                        }`}
                      >
                        {g.group_name}
                        {g.level_code && <span className="ml-1 opacity-70">({g.level_code})</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Sort order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Update Topic" : "Add Topic"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Topics table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No topics yet. Click &ldquo;+ Add Topic&rdquo; to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Level</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Groups</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Active</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className={`font-medium ${item.is_active ? "text-slate-800" : "text-slate-400 line-through"}`}>
                        {item.item_text}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {item.level_code ? (
                        <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-black uppercase text-indigo-700">
                          {item.level_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {item.target_group_uuids?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.target_group_uuids.map((gid) => {
                            const g = groups.find((g) => g.id === gid);
                            return g ? (
                              <span key={gid} className="rounded-md border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
                                {g.group_name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-semibold ${item.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                        {item.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-slate-500">
                      {item.sort_order}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4">
        <p className="text-xs text-slate-400">
          First-time or schema update: visit{" "}
          <a href="/api/admin/setup-new-features" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
            /api/admin/setup-new-features
          </a>{" "}
          to apply database migrations.
        </p>
      </div>
    </div>
  );
}
