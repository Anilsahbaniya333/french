"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  description: string | null;
  show_on_homepage: boolean;
  sort_order: number;
  created_at: string;
}

const BLANK: Omit<StaffMember, "id" | "created_at"> = {
  name: "",
  role: "",
  photo_url: "",
  description: "",
  show_on_homepage: false,
  sort_order: 0,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({ name: "", role: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editForms, setEditForms] = useState<Record<string, Omit<StaffMember, "id" | "created_at">>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveMsg, setSaveMsg] = useState<Record<string, { type: "ok" | "err"; text: string }>>({});

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/staff").then((r) => r.json()).catch(() => ({}));
    setStaff(res.staff ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const initEdit = (s: StaffMember) => {
    setEditForms((prev) => ({
      ...prev,
      [s.id]: {
        name: s.name,
        role: s.role,
        photo_url: s.photo_url ?? "",
        description: s.description ?? "",
        show_on_homepage: s.show_on_homepage,
        sort_order: s.sort_order,
      },
    }));
    setExpandedId(s.id);
  };

  const setField = (id: string, field: string, value: unknown) =>
    setEditForms((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const showMsg = (id: string, type: "ok" | "err", text: string) => {
    setSaveMsg((p) => ({ ...p, [id]: { type, text } }));
    setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[id]; return n; }), 3500);
  };

  const saveStaff = async (id: string) => {
    const form = editForms[id];
    if (!form) return;
    if (!form.name.trim()) { showMsg(id, "err", "Name is required."); return; }
    if (!form.role.trim()) { showMsg(id, "err", "Role is required."); return; }
    setSaving((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        role: form.role,
        photo_url: form.photo_url || null,
        description: form.description || null,
        show_on_homepage: form.show_on_homepage,
        sort_order: Number(form.sort_order) || 0,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving((p) => ({ ...p, [id]: false }));
    if (res.ok && json.staff) {
      setStaff((prev) => prev.map((s) => (s.id === id ? json.staff : s)));
      showMsg(id, "ok", "Saved!");
    } else {
      showMsg(id, "err", json.error || "Save failed.");
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member? This cannot be undone.")) return;
    await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    setStaff((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.name.trim()) { setCreateError("Name is required."); return; }
    if (!createForm.role.trim()) { setCreateError("Role is required."); return; }
    setCreating(true);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const json = await res.json().catch(() => ({}));
    setCreating(false);
    if (res.ok && json.staff) {
      setStaff((prev) => [...prev, json.staff]);
      setCreateForm({ name: "", role: "" });
      setShowCreate(false);
      initEdit(json.staff);
    } else {
      setCreateError(json.error || "Failed to create staff member.");
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Profiles</h1>
          <p className="mt-1 text-slate-500">Manage management staff shown on the homepage.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          + Add Staff
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createStaff} className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-4 font-semibold text-slate-800">New Staff Member</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Full name *</label>
              <input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Full name" required />
            </div>
            <div>
              <label className={labelCls}>Role / Title *</label>
              <input value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} className={inputCls} placeholder="e.g. School Director, Operations Manager" required />
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

      {/* Staff list */}
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : staff.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No staff profiles yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {staff.map((member) => {
            const isOpen = expandedId === member.id;
            const form = editForms[member.id];
            const msg = saveMsg[member.id];

            return (
              <div key={member.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {member.photo_url ? (
                      <Image src={member.photo_url} alt={member.name} fill className="object-cover" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{member.name}</p>
                      {member.show_on_homepage && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Shown on homepage
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{member.role}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => { if (isOpen) { setExpandedId(null); } else { initEdit(member); } }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {isOpen ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStaff(member.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded editor */}
                {isOpen && form && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-5 space-y-6">
                    {msg && (
                      <div className={`rounded-lg px-4 py-2 text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {msg.text}
                      </div>
                    )}

                    {/* Basic Info */}
                    <div>
                      <SectionTitle>Basic Info</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls}>Full name *</label>
                          <input value={form.name} onChange={(e) => setField(member.id, "name", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Role / Title *</label>
                          <input value={form.role} onChange={(e) => setField(member.id, "role", e.target.value)} className={inputCls} placeholder="e.g. School Director" />
                        </div>
                      </div>
                    </div>

                    {/* Photo & Description */}
                    <div>
                      <SectionTitle>Profile</SectionTitle>
                      <div className="space-y-3">
                        <div>
                          <label className={labelCls}>Photo URL</label>
                          <input value={form.photo_url ?? ""} onChange={(e) => setField(member.id, "photo_url", e.target.value)} className={inputCls} placeholder="https://..." />
                          <p className="mt-1 text-xs text-slate-400">Paste a direct image URL (jpg/png). Avatar above updates after saving.</p>
                        </div>
                        <div>
                          <label className={labelCls}>Description / Bio</label>
                          <textarea value={form.description ?? ""} onChange={(e) => setField(member.id, "description", e.target.value)} rows={3} className={inputCls} placeholder="Short bio shown on the homepage…" />
                        </div>
                      </div>
                    </div>

                    {/* Homepage visibility */}
                    <div>
                      <SectionTitle>Homepage Visibility</SectionTitle>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.show_on_homepage}
                          onChange={(e) => setField(member.id, "show_on_homepage", e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Show on public homepage</span>
                      </label>
                      <div className="mt-3">
                        <label className={labelCls}>Sort order (lower = first)</label>
                        <input
                          type="number"
                          value={form.sort_order}
                          onChange={(e) => setField(member.id, "sort_order", e.target.value)}
                          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => saveStaff(member.id)}
                        disabled={saving[member.id]}
                        className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {saving[member.id] ? "Saving…" : "Save"}
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

      <p className="mt-5 text-xs text-slate-400">{staff.length} staff member{staff.length !== 1 ? "s" : ""} total</p>
    </div>
  );
}
