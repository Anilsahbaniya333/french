"use client";

import { useState, useEffect } from "react";

interface FeedbackEntry {
  id: string;
  type: string;
  subject?: string;
  message: string;
  status: string;
  created_at: string;
  topics?: { title: string } | null;
}

const TYPE_OPTIONS = [
  { value: "general",     label: "General feedback",      emoji: "💬" },
  { value: "lesson",      label: "Lesson / topic",        emoji: "📚" },
  { value: "technical",   label: "Technical issue",       emoji: "🛠️" },
  { value: "suggestion",  label: "Suggestion",            emoji: "💡" },
  { value: "other",       label: "Other",                 emoji: "📝" },
];

const STATUS_STYLES: Record<string, string> = {
  unread:   "bg-amber-100 text-amber-700 border-amber-200",
  read:     "bg-sky-100 text-sky-700 border-sky-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const STATUS_LABELS: Record<string, string> = {
  unread:   "Sent",
  read:     "Seen",
  resolved: "Resolved",
};

const EMPTY_FORM = { type: "general", subject: "", message: "" };

export default function StudentFeedbackPage() {
  const [history, setHistory] = useState<FeedbackEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadHistory = () => {
    setLoadingHistory(true);
    fetch("/api/student/feedback")
      .then((r) => r.json())
      .then((d) => setHistory(d.feedback ?? []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) { setError("Please write your message."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send feedback.");
      setDone(true);
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel = (type: string) => TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
  const typeEmoji = (type: string) => TYPE_OPTIONS.find((o) => o.value === type)?.emoji ?? "📝";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Feedback & Support</h1>
          <p className="mt-1 text-sm text-slate-500">
            Send a message to your teacher about any lesson, issue, or suggestion.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setDone(false); setError(""); }}
          className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          {showForm ? "Cancel" : "+ Send feedback"}
        </button>
      </div>

      {/* Success banner */}
      {done && !showForm && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-emerald-700 font-medium">
            Your feedback was sent. Your teacher will review it shortly.
          </p>
        </div>
      )}

      {/* Feedback form */}
      {showForm && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Send feedback to your teacher</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">What is your feedback about?</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: opt.value }))}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                      form.type === opt.value
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subject <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-colors bg-white"
                placeholder="e.g. Lesson was too fast, audio issue, suggestion for next class…"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Your message <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-colors bg-white resize-none"
                placeholder="Write your feedback here. Be as detailed as you like — your teacher will read this."
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Sending…" : "Send feedback"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback history */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Your feedback history
        </h2>

        {loadingHistory ? (
          <div className="flex items-center gap-3 py-10 text-slate-400">
            <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />
            Loading…
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
              💬
            </div>
            <p className="font-medium text-slate-500">No feedback sent yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Use the button above to send your first message to your teacher.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeEmoji(item.type)}</span>
                    <div>
                      <span className="text-sm font-semibold text-slate-700">{typeLabel(item.type)}</span>
                      {item.topics?.title && (
                        <span className="ml-2 text-xs text-slate-400">— {item.topics.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[item.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {item.subject && (
                  <p className="mb-1 text-sm font-medium text-slate-700">{item.subject}</p>
                )}
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 flex items-start gap-3">
        <svg className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-sky-700 leading-relaxed">
          Your teacher reviews feedback regularly. Responses are provided directly in your next class or via the assignments section. For urgent issues, contact your teacher directly.
        </p>
      </div>
    </div>
  );
}
