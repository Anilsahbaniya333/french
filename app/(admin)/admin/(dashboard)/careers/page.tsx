"use client";

import { useState, useEffect } from "react";

interface Career {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  description: string | null;
  requirements: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const BLANK: Omit<Career, "id" | "created_at"> = {
  title: "",
  location: "",
  job_type: "",
  description: "",
  requirements: "",
  is_active: true,
  sort_order: 0,
};

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Remote"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>;
}

export default function CareersAdminPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({ title: "", location: "", job_type: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editForms, setEditForms] = useState<Record<string, Omit<Career, "id" | "created_at">>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveMsg, setSaveMsg] = useState<Record<string, { type: "ok" | "err"; text: string }>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/careers").then((r) => r.json()).catch(() => ({}));
    setCareers(res.careers ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const initEdit = (c: Career) => {
    setEditForms((prev) => ({
      ...prev,
      [c.id]: {
        title: c.title,
        location: c.location ?? "",
        job_type: c.job_type ?? "",
        description: c.description ?? "",
        requirements: c.requirements ?? "",
        is_active: c.is_active,
        sort_order: c.sort_order,
      },
    }));
    setExpandedId(c.id);
  };

  const setField = (id: string, field: string, value: unknown) =>
    setEditForms((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const showMsg = (id: string, type: "ok" | "err", text: string) => {
    setSaveMsg((p) => ({ ...p, [id]: { type, text } }));
    setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[id]; return n; }), 3500);
  };

  const saveCareer = async (id: string) => {
    const form = editForms[id];
    if (!form?.title?.trim()) { showMsg(id, "err", "Title is required."); return; }
    setSaving((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/careers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        location: form.location || null,
        job_type: form.job_type || null,
        description: form.description || null,
        requirements: form.requirements || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving((p) => ({ ...p, [id]: false }));
    if (res.ok && json.career) {
      setCareers((prev) => prev.map((c) => (c.id === id ? json.career : c)));
      showMsg(id, "ok", "Saved!");
    } else {
      showMsg(id, "err", json.error || "Save failed.");
    }
  };

  const toggleActive = async (career: Career) => {
    setToggling((p) => ({ ...p, [career.id]: true }));
    const res = await fetch(`/api/admin/careers/${career.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !career.is_active }),
    });
    const json = await res.json().catch(() => ({}));
    setToggling((p) => ({ ...p, [career.id]: false }));
    if (res.ok && json.career) {
      setCareers((prev) => prev.map((c) => (c.id === career.id ? json.career : c)));
    }
  };

  const deleteCareer = async (id: string) => {
    if (!confirm("Delete this job posting? This cannot be undone.")) return;
    await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
    setCareers((prev) => prev.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const createCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.title.trim()) { setCreateError("Title is required."); return; }
    setCreating(true);
    const res = await fetch("/api/admin/careers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const json = await res.json().catch(() => ({}));
    setCreating(false);
    if (res.ok && json.career) {
      setCareers((prev) => [json.career, ...prev]);
      setCreateForm({ title: "", location: "", job_type: "" });
      setShowCreate(false);
      initEdit(json.career);
    } else {
      setCreateError(json.error || "Failed to create job.");
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Careers</h1>
          <p className="mt-1 text-slate-500">Manage job postings shown on the public Careers page.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          + Add Job
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createCareer} className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-4 font-semibold text-slate-800">New Job Posting</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Job title *</label>
              <input value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="e.g. French Tutor" required />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={createForm.location} onChange={(e) => setCreateForm((p) => ({ ...p, location: e.target.value }))} className={inputCls} placeholder="e.g. Remote, Mumbai" />
            </div>
            <div>
              <label className={labelCls}>Job type</label>
              <select value={createForm.job_type} onChange={(e) => setCreateForm((p) => ({ ...p, job_type: e.target.value }))} className={inputCls}>
                <option value="">Select type</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={creating} className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
              {creating ? "Creating…" : "Create"}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setCreateError(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : careers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No job postings yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {careers.map((career) => {
            const isOpen = expandedId === career.id;
            const form = editForms[career.id];
            const msg = saveMsg[career.id];

            return (
              <div key={career.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{career.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${career.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {career.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {[career.location, career.job_type].filter(Boolean).join(" · ") || "No details set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(career)}
                      disabled={toggling[career.id]}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${career.is_active ? "border-slate-200 text-slate-500 hover:bg-slate-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
                    >
                      {toggling[career.id] ? "…" : career.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (isOpen) setExpandedId(null); else initEdit(career); }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {isOpen ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCareer(career.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded editor */}
                {isOpen && form && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-5 space-y-5">
                    {msg && (
                      <div className={`rounded-lg px-4 py-2 text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {msg.text}
                      </div>
                    )}

                    {/* Basic details */}
                    <div>
                      <SectionTitle>Job Details</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className={labelCls}>Title *</label>
                          <input value={form.title} onChange={(e) => setField(career.id, "title", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Location</label>
                          <input value={form.location ?? ""} onChange={(e) => setField(career.id, "location", e.target.value)} className={inputCls} placeholder="Remote, Mumbai…" />
                        </div>
                        <div>
                          <label className={labelCls}>Job type</label>
                          <select value={form.job_type ?? ""} onChange={(e) => setField(career.id, "job_type", e.target.value)} className={inputCls}>
                            <option value="">Select type</option>
                            {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <SectionTitle>Description</SectionTitle>
                      <textarea value={form.description ?? ""} onChange={(e) => setField(career.id, "description", e.target.value)} rows={5} className={inputCls} placeholder="What will this person do? What's the role about?" />
                    </div>

                    {/* Requirements */}
                    <div>
                      <SectionTitle>Requirements</SectionTitle>
                      <textarea value={form.requirements ?? ""} onChange={(e) => setField(career.id, "requirements", e.target.value)} rows={4} className={inputCls} placeholder="List qualifications, skills, experience needed…" />
                    </div>

                    {/* Settings */}
                    <div>
                      <SectionTitle>Settings</SectionTitle>
                      <div className="flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setField(career.id, "is_active", e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Active (visible on website)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <label className={labelCls + " mb-0"}>Sort order</label>
                          <input
                            type="number"
                            value={form.sort_order}
                            onChange={(e) => setField(career.id, "sort_order", e.target.value)}
                            className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => saveCareer(career.id)}
                        disabled={saving[career.id]}
                        className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {saving[career.id] ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-xs text-slate-400">
        {careers.filter((c) => c.is_active).length} active · {careers.length} total
      </p>
    </div>
  );
}
