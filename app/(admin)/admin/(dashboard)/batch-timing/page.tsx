"use client";

import { useState, useEffect } from "react";

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
  schedule: string | null;
  schedule_days: string | null;
  schedule_time: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export default function BatchTimingPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<Group>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/batch-timing")
      .then((r) => r.json())
      .then((d) => {
        const g: Group[] = d.groups ?? [];
        setGroups(g);
        const initial: Record<string, Partial<Group>> = {};
        for (const group of g) {
          initial[group.id] = {
            schedule: group.schedule ?? "",
            schedule_days: group.schedule_days ?? "",
            schedule_time: group.schedule_time ?? "",
            start_date: group.start_date ?? "",
            end_date: group.end_date ?? "",
          };
        }
        setEdits(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (id: string) => {
    setSaving(id);
    setMsg(null);
    const edit = edits[id] ?? {};
    const res = await fetch("/api/admin/batch-timing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        schedule: edit.schedule || null,
        schedule_days: edit.schedule_days || null,
        schedule_time: edit.schedule_time || null,
        start_date: edit.start_date || null,
        end_date: edit.end_date || null,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(null);
    if (res.ok && json.group) {
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...json.group } : g)));
      setMsg({ id, type: "ok", text: "Saved!" });
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ id, type: "err", text: json.error || "Save failed." });
    }
  };

  const set = (id: string, field: keyof Group, value: string) =>
    setEdits((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));

  const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none";
  const lbl = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800">Batch Timing</h1>
      <p className="mt-1 text-slate-500">Set schedule and timing information for each group.</p>

      {loading ? (
        <p className="mt-8 text-slate-400">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="mt-8 text-slate-400">No groups found. Create groups first.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {groups.map((group) => {
            const edit = edits[group.id] ?? {};
            const isSaving = saving === group.id;
            const feedback = msg?.id === group.id ? msg : null;
            return (
              <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{group.group_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {group.level_code && (
                        <span className="inline-block rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 uppercase">
                          {group.level_code}
                        </span>
                      )}
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${group.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {group.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={lbl}>Schedule Description</label>
                    <input
                      value={edit.schedule as string ?? ""}
                      onChange={(e) => set(group.id, "schedule", e.target.value)}
                      placeholder="e.g. Mon, Wed, Fri · 6:00 PM"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Days</label>
                    <input
                      value={edit.schedule_days as string ?? ""}
                      onChange={(e) => set(group.id, "schedule_days", e.target.value)}
                      placeholder="e.g. Mon, Wed, Fri"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Time</label>
                    <input
                      value={edit.schedule_time as string ?? ""}
                      onChange={(e) => set(group.id, "schedule_time", e.target.value)}
                      placeholder="e.g. 6:00 PM – 7:30 PM"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Start Date</label>
                    <input
                      type="date"
                      value={edit.start_date as string ?? ""}
                      onChange={(e) => set(group.id, "start_date", e.target.value)}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>End Date</label>
                    <input
                      type="date"
                      value={edit.end_date as string ?? ""}
                      onChange={(e) => set(group.id, "end_date", e.target.value)}
                      className={inp}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => save(group.id)}
                    disabled={isSaving}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                  {feedback && (
                    <span className={`text-sm font-medium ${feedback.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                      {feedback.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">Note</p>
        <p className="text-blue-600 text-sm">
          Run <code className="rounded bg-blue-100 px-1">migration_batch_timing.sql</code> in Supabase to enable the schedule_days, schedule_time, and end_date columns.
        </p>
      </div>
    </div>
  );
}
