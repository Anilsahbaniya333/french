"use client";

import { useState, useEffect, useCallback } from "react";

interface FeedbackEntry {
  id: string;
  student_name: string;
  student_email: string;
  type: string;
  subject?: string;
  message: string;
  status: string;
  created_at: string;
  topics?: { id: string; title: string } | null;
}

const TYPE_OPTIONS = [
  { value: "general",    label: "General",    emoji: "💬" },
  { value: "lesson",     label: "Lesson",     emoji: "📚" },
  { value: "technical",  label: "Technical",  emoji: "🛠️" },
  { value: "suggestion", label: "Suggestion", emoji: "💡" },
  { value: "other",      label: "Other",      emoji: "📝" },
];

const STATUS_META: Record<string, { badge: string; label: string; dot: string }> = {
  unread:   { badge: "bg-amber-100 text-amber-700 border-amber-200",    label: "Unread",   dot: "bg-amber-400" },
  read:     { badge: "bg-sky-100 text-sky-700 border-sky-200",          label: "Read",     dot: "bg-sky-500" },
  resolved: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Resolved", dot: "bg-emerald-500" },
};

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
function typeEmoji(type: string) {
  return TYPE_OPTIONS.find((o) => o.value === type)?.emoji ?? "📝";
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "resolved">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const url =
      filter === "all"
        ? "/api/admin/feedback"
        : `/api/admin/feedback?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setItems(d.feedback ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      }
    } catch {
      //
    } finally {
      setUpdating(null);
    }
  };

  const unreadCount = items.filter((i) => i.status === "unread").length;

  const FILTER_TABS = [
    { key: "all" as const,      label: "All" },
    { key: "unread" as const,   label: "Unread" },
    { key: "read" as const,     label: "Read" },
    { key: "resolved" as const, label: "Resolved" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Feedback</h1>
          <p className="mt-1 text-slate-500">
            Messages sent by students about lessons, difficulties, or suggestions.
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-semibold text-amber-700">
              {unreadCount} unread
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              filter === tab.key
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
            💬
          </div>
          <p className="font-medium text-slate-500">No feedback messages</p>
          <p className="mt-1 text-sm text-slate-400">
            {filter === "all"
              ? "Student feedback will appear here once they send messages."
              : `No messages with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const meta = STATUS_META[item.status] ?? STATUS_META.read;
            const isUnread = item.status === "unread";

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white overflow-hidden ${
                  isUnread ? "border-amber-200 shadow-sm" : "border-slate-200"
                }`}
              >
                {isUnread && <div className="h-1 w-full bg-amber-400" />}
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {item.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {item.student_name}
                        </p>
                        <p className="text-xs text-slate-400">{item.student_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Type + topic */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      <span>{typeEmoji(item.type)}</span>
                      {typeLabel(item.type)}
                    </span>
                    {item.topics?.title && (
                      <span className="rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-1 text-xs text-sky-700">
                        📚 {item.topics.title}
                      </span>
                    )}
                  </div>

                  {/* Subject + message */}
                  {item.subject && (
                    <p className="mb-1.5 text-sm font-semibold text-slate-700">
                      {item.subject}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {item.message}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.status === "unread" && (
                      <button
                        type="button"
                        disabled={updating === item.id}
                        onClick={() => setStatus(item.id, "read")}
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors disabled:opacity-50"
                      >
                        {updating === item.id ? "Updating…" : "Mark as read"}
                      </button>
                    )}
                    {item.status !== "resolved" && (
                      <button
                        type="button"
                        disabled={updating === item.id}
                        onClick={() => setStatus(item.id, "resolved")}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {updating === item.id ? "Updating…" : "Mark resolved"}
                      </button>
                    )}
                    {item.status === "resolved" && (
                      <button
                        type="button"
                        disabled={updating === item.id}
                        onClick={() => setStatus(item.id, "unread")}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-slate-400">
          {items.length} message{items.length !== 1 ? "s" : ""}
          {filter !== "all" ? ` (filtered: ${filter})` : ""}
        </p>
      )}
    </div>
  );
}
