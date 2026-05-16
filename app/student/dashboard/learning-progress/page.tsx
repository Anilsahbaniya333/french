"use client";

import { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  item_text: string;
  description: string | null;
  level_code: string | null;
  is_completed: boolean;
  sort_order: number;
}

export default function LearningProgressPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/student/learning-progress")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setCompleted(d.completed ?? 0);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, is_completed: !item.is_completed } : item
      );
      setCompleted(updated.filter((i) => i.is_completed).length);
      return updated;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates = items.map((item) => ({
        checklist_item_id: item.id,
        is_completed: item.is_completed,
      }));
      const res = await fetch("/api/student/learning-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) setSaved(true);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const levelCode = items.find((i) => i.level_code)?.level_code;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Learning Progress</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No topics have been assigned to your group yet.</p>
          <p className="mt-1 text-sm text-slate-400">Check back later or contact your tutor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {levelCode ? `${levelCode} Learning Progress Form` : "Learning Progress Form"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tick each topic you have learned, then click Save Progress.
        </p>
      </div>

      {/* Progress summary */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            {completed} / {total} learned = {percent}%
          </p>
          <span className="text-2xl font-black text-amber-600">{percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{ inlineSize: `${percent}%` }}
          />
        </div>
      </div>

      {/* Topic list — desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Learned?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="cursor-pointer transition-colors hover:bg-amber-50"
              >
                <td className="px-5 py-3">
                  <span className={`font-medium ${item.is_completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                    {item.item_text}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {item.description ?? "—"}
                </td>
                <td className="px-5 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => toggleItem(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Topic list — mobile cards */}
      <div className="space-y-2 sm:hidden">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:bg-amber-50"
          >
            <input
              type="checkbox"
              checked={item.is_completed}
              onChange={() => toggleItem(item.id)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            <div className="min-w-0">
              <p className={`font-medium ${item.is_completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {item.item_text}
              </p>
              {item.description && (
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
              )}
            </div>
            <span className={`ml-auto shrink-0 text-xs font-semibold ${item.is_completed ? "text-emerald-600" : "text-slate-400"}`}>
              {item.is_completed ? "Learned" : "Not yet"}
            </span>
          </label>
        ))}
      </div>

      {/* Save button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Progress"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600">Progress saved!</span>
        )}
      </div>
    </div>
  );
}
