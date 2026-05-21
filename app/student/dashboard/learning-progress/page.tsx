"use client";

import { useState, useEffect, Fragment } from "react";
import VideoEmbed from "@/components/levels/VideoEmbed";
import { getYouTubeId, getVimeoId } from "@/lib/video-utils";

interface ChecklistItem {
  id: string;
  item_text: string;
  description: string | null;
  level_code: string | null;
  is_completed: boolean;
  sort_order: number;
  coverage_notes: string | null;
  video_url: string | null;
  resource_file_url: string | null;
  resource_file_name: string | null;
  exercise_instructions: string | null;
}

function hasResources(item: ChecklistItem): boolean {
  return !!(item.coverage_notes || item.video_url || item.resource_file_url || item.exercise_instructions);
}

function VideoResource({ url, topicName }: { url: string; topicName: string }) {
  const isEmbeddable = !!(getYouTubeId(url) || getVimeoId(url));
  if (isEmbeddable) {
    return <VideoEmbed url={url} title={topicName} />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Watch Video
    </a>
  );
}

function ResourcesPanel({ item }: { item: ChecklistItem }) {
  return (
    <div className="space-y-4 bg-slate-50/70 px-5 py-4">
      {item.coverage_notes && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            What to cover
          </p>
          <p className="whitespace-pre-line text-sm text-slate-700">{item.coverage_notes}</p>
        </div>
      )}
      {item.video_url && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Video</p>
          <VideoResource url={item.video_url} topicName={item.item_text} />
        </div>
      )}
      {item.resource_file_url && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Resource File
          </p>
          <a
            href={item.resource_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {item.resource_file_name ?? "Download File"}
          </a>
        </div>
      )}
      {item.exercise_instructions && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Practice
          </p>
          <p className="whitespace-pre-line text-sm text-slate-700">{item.exercise_instructions}</p>
        </div>
      )}
    </div>
  );
}

export default function LearningProgressPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Learned?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <Fragment key={item.id}>
                <tr
                  onClick={() => toggleItem(item.id)}
                  className="cursor-pointer transition-colors hover:bg-amber-50"
                >
                  <td className="px-5 py-3">
                    <p className={`font-medium ${item.is_completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                      {item.item_text}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
                    )}
                    {hasResources(item) && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(item.id); }}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {expanded.has(item.id) ? "Hide Resources" : "View Resources"}
                        <svg
                          className={`h-3 w-3 transition-transform duration-150 ${expanded.has(item.id) ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
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
                {expanded.has(item.id) && (
                  <tr>
                    <td colSpan={2} className="border-t border-slate-100 p-0">
                      <ResourcesPanel item={item} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Topic list — mobile cards */}
      <div className="space-y-2 sm:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* Tap area toggles Learned */}
            <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-amber-50">
              <input
                type="checkbox"
                checked={item.is_completed}
                onChange={() => toggleItem(item.id)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              <div className="min-w-0 flex-1">
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

            {/* View Resources button — separate from the label tap area */}
            {hasResources(item) && (
              <div className="border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleExpanded(item.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {expanded.has(item.id) ? "Hide Resources" : "View Resources"}
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${expanded.has(item.id) ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}

            {expanded.has(item.id) && (
              <div className="border-t border-slate-100">
                <ResourcesPanel item={item} />
              </div>
            )}
          </div>
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
