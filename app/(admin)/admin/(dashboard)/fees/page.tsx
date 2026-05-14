"use client";

import { useState, useEffect } from "react";

interface LevelFee {
  id: string;
  level_code: string;
  title: string;
  fee: string | null;
  fee_note: string | null;
}

export default function FeesPage() {
  const [levels, setLevels] = useState<LevelFee[]>([]);
  const [edits, setEdits] = useState<Record<string, { fee: string; fee_note: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/fees")
      .then((r) => r.json())
      .then((d) => {
        const lvls: LevelFee[] = d.levels ?? [];
        setLevels(lvls);
        const initial: Record<string, { fee: string; fee_note: string }> = {};
        for (const l of lvls) initial[l.id] = { fee: l.fee ?? "", fee_note: l.fee_note ?? "" };
        setEdits(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (id: string) => {
    setSaving(id);
    setMsg(null);
    const { fee, fee_note } = edits[id] ?? { fee: "", fee_note: "" };
    const res = await fetch("/api/admin/fees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ id, fee: fee || null, fee_note: fee_note || null }]),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(null);
    if (res.ok) {
      setMsg({ id, type: "ok", text: "Saved!" });
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ id, type: "err", text: json.error || "Save failed." });
    }
  };

  const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none";
  const lbl = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Course Fees</h1>
      <p className="mt-1 text-slate-500">Set the fee and fee note for each course level.</p>

      {loading ? (
        <p className="mt-8 text-slate-400">Loading…</p>
      ) : levels.length === 0 ? (
        <p className="mt-8 text-slate-400">No levels found.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {levels.map((level) => {
            const edit = edits[level.id] ?? { fee: "", fee_note: "" };
            const isSaving = saving === level.id;
            const feedback = msg?.id === level.id ? msg : null;
            return (
              <div key={level.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="inline-block rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-black text-indigo-700 uppercase mr-2">
                      {level.level_code}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{level.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Fee Amount</label>
                    <input
                      value={edit.fee}
                      onChange={(e) => setEdits((p) => ({ ...p, [level.id]: { ...p[level.id], fee: e.target.value } }))}
                      placeholder="e.g. ₹4,999 / month"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Fee Note (optional)</label>
                    <input
                      value={edit.fee_note}
                      onChange={(e) => setEdits((p) => ({ ...p, [level.id]: { ...p[level.id], fee_note: e.target.value } }))}
                      placeholder="e.g. One-time registration fee"
                      className={inp}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => save(level.id)}
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
        <p className="font-semibold mb-1">Where fees appear</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600 text-sm">
          <li>Courses page — shown on each level card</li>
        </ul>
        <p className="mt-2 text-xs text-blue-500">
          Run <code className="rounded bg-blue-100 px-1">migration_course_fees.sql</code> in Supabase if fees don&apos;t save.
        </p>
      </div>
    </div>
  );
}
