"use client";

import { useState, useEffect } from "react";

const FIELDS = [
  { key: "introduction", label: "Introduction" },
  { key: "teachingApproach", label: "Teaching Approach" },
  { key: "weeklyStructure", label: "Weekly Structure" },
  { key: "grammarApproach", label: "Grammar" },
  { key: "listeningApproach", label: "Listening" },
  { key: "speakingApproach", label: "Speaking" },
  { key: "readingApproach", label: "Reading" },
  { key: "writingApproach", label: "Writing" },
  { key: "assignmentWorkflow", label: "Assignment Workflow" },
  { key: "progressTracking", label: "Progress Tracking" },
] as const;

export default function MethodologyEditor() {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/methodology");
        const json = await res.json();
        setData(json.content ?? {});
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="mt-6 text-slate-600">Loading...</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700">{label}</label>
          <textarea
            value={data[key] ?? ""}
            onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))}
            rows={4}
            className="mt-1 block w-full max-w-2xl rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saveStatus === "loading"}
          onClick={async () => {
            setSaveStatus("loading");
            try {
              const res = await fetch("/api/methodology", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const json = await res.json();
              setSaveStatus(res.ok ? "success" : "error");
              if (!res.ok) console.error(json.error);
            } catch {
              setSaveStatus("error");
            }
          }}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {saveStatus === "loading" ? "Saving..." : "Save"}
        </button>
        {saveStatus === "success" && (
          <span className="text-sm text-green-600">Saved.</span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-600">Save failed. Check Supabase.</span>
        )}
      </div>
    </div>
  );
}
