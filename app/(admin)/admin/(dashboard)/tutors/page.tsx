"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface QualEntry { title: string; institution: string; year: string }
interface CertEntry { name: string; issuer: string; year: string }

interface Tutor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  photo_url: string | null;
  experience: string | null;
  specializations: string[];
  qualifications: QualEntry[];
  certifications: CertEntry[];
  show_on_homepage?: boolean;
  created_at: string;
}

const _BLANK_TUTOR = {
  full_name: "",
  email: "",
  phone: "",
  bio: "",
  photo_url: "",
  experience: "",
  specializations: [] as string[],
  qualifications: [] as QualEntry[],
  certifications: [] as CertEntry[],
  show_on_homepage: false,
};

const BLANK_QUAL: QualEntry = { title: "", institution: "", year: "" };
const BLANK_CERT: CertEntry = { name: "", issuer: "", year: "" };

// ── small helpers ──────────────────────────────────────────────
function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 text-amber-600 hover:text-red-600">×</button>
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>;
}

// ── main page ─────────────────────────────────────────────────
export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({ full_name: "", email: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit state keyed by tutor id
  const [editForms, setEditForms] = useState<Record<string, Omit<Tutor, "id" | "created_at">>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveMsg, setSaveMsg] = useState<Record<string, { type: "ok" | "err"; text: string }>>({});

  // Specialization input per tutor
  const [specInput, setSpecInput] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/tutors").then((r) => r.json()).catch(() => ({}));
    setTutors(res.tutors ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const initEdit = (t: Tutor) => {
    setEditForms((prev) => ({
      ...prev,
      [t.id]: {
        full_name: t.full_name,
        email: t.email ?? "",
        phone: t.phone ?? "",
        bio: t.bio ?? "",
        photo_url: t.photo_url ?? "",
        experience: t.experience ?? "",
        specializations: [...(t.specializations ?? [])],
        qualifications: (t.qualifications ?? []).map((q) => ({ ...q })),
        certifications: (t.certifications ?? []).map((c) => ({ ...c })),
        show_on_homepage: t.show_on_homepage ?? false,
      },
    }));
    setExpandedId(t.id);
  };

  const setField = (id: string, field: string, value: unknown) =>
    setEditForms((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const showMsg = (id: string, type: "ok" | "err", text: string) => {
    setSaveMsg((p) => ({ ...p, [id]: { type, text } }));
    setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[id]; return n; }), 3500);
  };

  const saveTutor = async (id: string) => {
    const form = editForms[id];
    if (!form) return;
    if (!form.full_name.trim()) { showMsg(id, "err", "Name is required."); return; }
    setSaving((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/tutors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        bio: form.bio || null,
        photo_url: form.photo_url || null,
        experience: form.experience || null,
        specializations: form.specializations,
        qualifications: form.qualifications.filter((q) => q.title.trim()),
        certifications: form.certifications.filter((c) => c.name.trim()),
        show_on_homepage: form.show_on_homepage ?? false,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving((p) => ({ ...p, [id]: false }));
    if (res.ok && json.tutor) {
      setTutors((prev) => prev.map((t) => (t.id === id ? json.tutor : t)));
      showMsg(id, "ok", "Saved!");
    } else {
      showMsg(id, "err", json.error || "Save failed.");
    }
  };

  const deleteTutor = async (id: string) => {
    if (!confirm("Delete this tutor? This cannot be undone.")) return;
    await fetch(`/api/admin/tutors/${id}`, { method: "DELETE" });
    setTutors((prev) => prev.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const createTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.full_name.trim()) { setCreateError("Name is required."); return; }
    setCreating(true);
    const res = await fetch("/api/admin/tutors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    });
    const json = await res.json().catch(() => ({}));
    setCreating(false);
    if (res.ok && json.tutor) {
      setTutors((prev) => [...prev, json.tutor]);
      setCreateForm({ full_name: "", email: "", phone: "" });
      setShowCreate(false);
      initEdit(json.tutor);
    } else {
      setCreateError(json.error || "Failed to create tutor.");
    }
  };

  // ── qualification helpers ──
  const addQual = (id: string) =>
    setField(id, "qualifications", [...(editForms[id]?.qualifications ?? []), { ...BLANK_QUAL }]);
  const updateQual = (id: string, i: number, field: keyof QualEntry, val: string) =>
    setField(id, "qualifications", editForms[id].qualifications.map((q, j) => j === i ? { ...q, [field]: val } : q));
  const removeQual = (id: string, i: number) =>
    setField(id, "qualifications", editForms[id].qualifications.filter((_, j) => j !== i));

  // ── certification helpers ──
  const addCert = (id: string) =>
    setField(id, "certifications", [...(editForms[id]?.certifications ?? []), { ...BLANK_CERT }]);
  const updateCert = (id: string, i: number, field: keyof CertEntry, val: string) =>
    setField(id, "certifications", editForms[id].certifications.map((c, j) => j === i ? { ...c, [field]: val } : c));
  const removeCert = (id: string, i: number) =>
    setField(id, "certifications", editForms[id].certifications.filter((_, j) => j !== i));

  // ── specialization helpers ──
  const addSpec = (id: string) => {
    const val = (specInput[id] ?? "").trim();
    if (!val) return;
    const current = editForms[id]?.specializations ?? [];
    if (!current.includes(val)) setField(id, "specializations", [...current, val]);
    setSpecInput((p) => ({ ...p, [id]: "" }));
  };
  const removeSpec = (id: string, spec: string) =>
    setField(id, "specializations", (editForms[id]?.specializations ?? []).filter((s) => s !== spec));

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tutors</h1>
          <p className="mt-1 text-slate-500">Manage tutor profiles, qualifications and certifications.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          + Add Tutor
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createTutor} className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-4 font-semibold text-slate-800">New Tutor</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Full name *</label>
              <input value={createForm.full_name} onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))} className={inputCls} placeholder="Full name" required />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="tutor@example.com" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} placeholder="+91 ..." />
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

      {/* Tutor list */}
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : tutors.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400">No tutors yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map((tutor) => {
            const isOpen = expandedId === tutor.id;
            const form = editForms[tutor.id];
            const msg = saveMsg[tutor.id];

            return (
              <div key={tutor.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-amber-100">
                    {tutor.photo_url ? (
                      <Image src={tutor.photo_url} alt={tutor.full_name} fill className="object-cover" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-bold text-amber-700">
                        {tutor.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{tutor.full_name}</p>
                      {tutor.show_on_homepage && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          On homepage
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{[tutor.email, tutor.phone].filter(Boolean).join(" · ") || "No contact info"}</p>
                    {tutor.experience && <p className="text-xs text-slate-400 mt-0.5">{tutor.experience}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isOpen) { setExpandedId(null); }
                        else { initEdit(tutor); }
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {isOpen ? "Close" : "Edit profile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTutor(tutor.id)}
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

                    {/* ── Basic Info ── */}
                    <div>
                      <SectionTitle>Basic Info</SectionTitle>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className={labelCls}>Full name *</label>
                          <input value={form.full_name} onChange={(e) => setField(tutor.id, "full_name", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Email</label>
                          <input type="email" value={form.email ?? ""} onChange={(e) => setField(tutor.id, "email", e.target.value)} className={inputCls} placeholder="tutor@example.com" />
                        </div>
                        <div>
                          <label className={labelCls}>Phone</label>
                          <input value={form.phone ?? ""} onChange={(e) => setField(tutor.id, "phone", e.target.value)} className={inputCls} placeholder="+91 ..." />
                        </div>
                      </div>
                    </div>

                    {/* ── Profile ── */}
                    <div>
                      <SectionTitle>Profile</SectionTitle>
                      <div className="space-y-3">
                        <div>
                          <label className={labelCls}>Photo URL</label>
                          <input value={form.photo_url ?? ""} onChange={(e) => setField(tutor.id, "photo_url", e.target.value)} className={inputCls} placeholder="https://..." />
                          <p className="mt-1 text-xs text-slate-400">Paste a direct image URL (jpg/png). The avatar above will update after saving.</p>
                        </div>
                        <div>
                          <label className={labelCls}>Experience</label>
                          <input value={form.experience ?? ""} onChange={(e) => setField(tutor.id, "experience", e.target.value)} className={inputCls} placeholder="e.g. 5 years of French teaching experience" />
                        </div>
                        <div>
                          <label className={labelCls}>Bio / About</label>
                          <textarea value={form.bio ?? ""} onChange={(e) => setField(tutor.id, "bio", e.target.value)} rows={4} className={inputCls} placeholder="Short bio shown to students…" />
                        </div>
                      </div>
                    </div>

                    {/* ── Specializations ── */}
                    <div>
                      <SectionTitle>Teaching Specializations</SectionTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(form.specializations ?? []).map((s) => (
                          <Tag key={s} label={s} onRemove={() => removeSpec(tutor.id, s)} />
                        ))}
                        {form.specializations?.length === 0 && <p className="text-xs text-slate-400">None added.</p>}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={specInput[tutor.id] ?? ""}
                          onChange={(e) => setSpecInput((p) => ({ ...p, [tutor.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(tutor.id); } }}
                          placeholder="e.g. A1–A2 Beginner, Conversation…"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
                        />
                        <button type="button" onClick={() => addSpec(tutor.id)} className="rounded-lg bg-slate-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
                          Add
                        </button>
                      </div>
                    </div>

                    {/* ── Qualifications ── */}
                    <div>
                      <SectionTitle>Qualifications</SectionTitle>
                      <div className="space-y-2">
                        {(form.qualifications ?? []).map((q, i) => (
                          <div key={i} className="grid grid-cols-[1fr_1fr_5rem_auto] gap-2 items-center">
                            <input value={q.title} onChange={(e) => updateQual(tutor.id, i, "title", e.target.value)} placeholder="Degree / title" className={inputCls} />
                            <input value={q.institution} onChange={(e) => updateQual(tutor.id, i, "institution", e.target.value)} placeholder="Institution" className={inputCls} />
                            <input value={q.year} onChange={(e) => updateQual(tutor.id, i, "year", e.target.value)} placeholder="Year" className={inputCls} />
                            <button type="button" onClick={() => removeQual(tutor.id, i)} className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap">Remove</button>
                          </div>
                        ))}
                        {form.qualifications?.length === 0 && <p className="text-xs text-slate-400">No qualifications added.</p>}
                      </div>
                      <button type="button" onClick={() => addQual(tutor.id)} className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-800">
                        + Add qualification
                      </button>
                    </div>

                    {/* ── Homepage Visibility ── */}
                    <div>
                      <SectionTitle>Homepage Visibility</SectionTitle>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.show_on_homepage ?? false}
                          onChange={(e) => setField(tutor.id, "show_on_homepage", e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Show this tutor on the public homepage</span>
                      </label>
                    </div>

                    {/* ── Certifications ── */}
                    <div>
                      <SectionTitle>Certifications</SectionTitle>
                      <div className="space-y-2">
                        {(form.certifications ?? []).map((c, i) => (
                          <div key={i} className="grid grid-cols-[1fr_1fr_5rem_auto] gap-2 items-center">
                            <input value={c.name} onChange={(e) => updateCert(tutor.id, i, "name", e.target.value)} placeholder="Certification name" className={inputCls} />
                            <input value={c.issuer} onChange={(e) => updateCert(tutor.id, i, "issuer", e.target.value)} placeholder="Issuing body" className={inputCls} />
                            <input value={c.year} onChange={(e) => updateCert(tutor.id, i, "year", e.target.value)} placeholder="Year" className={inputCls} />
                            <button type="button" onClick={() => removeCert(tutor.id, i)} className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap">Remove</button>
                          </div>
                        ))}
                        {form.certifications?.length === 0 && <p className="text-xs text-slate-400">No certifications added.</p>}
                      </div>
                      <button type="button" onClick={() => addCert(tutor.id)} className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-800">
                        + Add certification
                      </button>
                    </div>

                    {/* Save */}
                    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => saveTutor(tutor.id)}
                        disabled={saving[tutor.id]}
                        className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {saving[tutor.id] ? "Saving…" : "Save Profile"}
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

      <p className="mt-5 text-xs text-slate-400">{tutors.length} tutor{tutors.length !== 1 ? "s" : ""} total</p>
    </div>
  );
}
