"use client";

import { useState, useEffect } from "react";

export default function AvailabilityPage() {
  const [availabilityText, setAvailabilityText] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/student/availability")
      .then((r) => r.json())
      .then((d) => {
        if (d.availability) {
          setAvailabilityText(d.availability.availability_text ?? "");
          setNote(d.availability.note ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availabilityText.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/student/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability_text: availabilityText, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setMessage({ type: "success", text: "Availability saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Class Availability</h1>
        <p className="mt-1 text-sm text-slate-500">
          Let your tutor know when you are available for classes.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {message && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Available days and time <span className="text-red-500">*</span>
            </label>
            <textarea
              value={availabilityText}
              onChange={(e) => setAvailabilityText(e.target.value)}
              required
              rows={5}
              placeholder="Example: Sunday 7–8 AM, Monday 8–9 PM, Wednesday 6–7 PM"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Note / message{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Any additional notes for your tutor…"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !availabilityText.trim()}
            className="w-full rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Submit Availability"}
          </button>
        </form>
      </div>
    </div>
  );
}
