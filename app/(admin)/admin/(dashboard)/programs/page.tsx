"use client";

import { useState, useEffect, useCallback } from "react";

interface Program {
  id: string;
  title: string;
  subtitle?: string | null;
  tutor_name?: string | null;
  badge?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  tutor_name: "",
  badge: "",
  cta_label: "Learn more",
  cta_href: "",
  sort_order: "0",
};

const BADGE_SUGGESTIONS = ["Free", "New", "Ongoing", "Paid", "Limited", "Popular"];

function ProgramForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: typeof EMPTY_FORM;
  submitLabel: string;
  onSubmit: (form: typeof EMPTY_FORM) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof typeof EMPTY_FORM, label: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        value={form[name]}
        onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        {...extra}
      />
    </div>
  );

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          {field("title", "Title *", { required: true, placeholder: "e.g. A1 Beginner French" })}
        </div>
        <div className="sm:col-span-2">
          {field("subtitle", "Subtitle", { placeholder: "Short description shown on the card" })}
        </div>
        {field("tutor_name", "Tutor name", { placeholder: "e.g. Mme Dubois" })}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
          <input
            type="text"
            value={form.badge}
            onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
            placeholder="Free, New, Ongoing…"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {BADGE_SUGGESTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setForm((p) => ({ ...p, badge: b }))}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  form.badge === b
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        {field("cta_label", "Button label", { placeholder: "Learn more" })}
        <div className="sm:col-span-2">
          {field("cta_href", "Button link (optional)", { placeholder: "/register or https://…" })}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sort order</label>
          <input
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/programs")
      .then((r) => r.json())
      .then((d) => setPrograms(d.programs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (form: typeof EMPTY_FORM) => {
    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) || 0 }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to create program");
    setPrograms((p) => [...p, json.program]);
    setShowCreate(false);
  };

  const update = async (id: string, form: typeof EMPTY_FORM) => {
    const res = await fetch(`/api/admin/programs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) || 0 }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to update program");
    setPrograms((p) => p.map((x) => (x.id === id ? json.program : x)));
    setEditingId(null);
  };

  const toggleActive = async (p: Program) => {
    setToggling(p.id);
    const res = await fetch(`/api/admin/programs/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    if (res.ok) {
      setPrograms((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !p.is_active } : x)));
    }
    setToggling(null);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this program? It will be removed from the homepage.")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
    if (res.ok) setPrograms((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  };

  const toForm = (p: Program): typeof EMPTY_FORM => ({
    title: p.title,
    subtitle: p.subtitle ?? "",
    tutor_name: p.tutor_name ?? "",
    badge: p.badge ?? "",
    cta_label: p.cta_label ?? "Learn more",
    cta_href: p.cta_href ?? "",
    sort_order: String(p.sort_order),
  });

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programs</h1>
          <p className="mt-1 text-slate-500">Manage the programs/offers displayed on the homepage.</p>
        </div>
        <button
          onClick={() => { setShowCreate((v) => !v); setEditingId(null); }}
          className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
        >
          + Add Program
        </button>
      </div>

      {showCreate && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-5 text-lg font-semibold text-slate-800">New Program</h2>
          <ProgramForm
            initial={EMPTY_FORM}
            submitLabel="Create Program"
            onSubmit={create}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center gap-3 py-8 text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
            Loading programs…
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <p className="font-medium text-slate-500">No programs yet</p>
            <p className="mt-1 text-sm text-slate-400">Add your first program to show it on the homepage.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((p) => {
              const isEditing = editingId === p.id;
              return (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">{p.title}</p>
                          {p.badge && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                              {p.badge}
                            </span>
                          )}
                          {!p.is_active && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                              Hidden
                            </span>
                          )}
                        </div>
                        {p.subtitle && <p className="mt-0.5 text-sm text-slate-500">{p.subtitle}</p>}
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                          {p.tutor_name && <span>Tutor: {p.tutor_name}</span>}
                          {p.cta_label && <span>CTA: {p.cta_label}</span>}
                          <span>Order: {p.sort_order}</span>
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleActive(p)}
                            disabled={toggling === p.id}
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                              p.is_active
                                ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                : "border border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {p.is_active ? "Hide" : "Show"}
                          </button>
                          <button
                            onClick={() => { setEditingId(p.id); setShowCreate(false); }}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => del(p.id)}
                            disabled={deleting === p.id}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                          >
                            {deleting === p.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
                      <p className="mb-4 text-sm font-semibold text-slate-700">Edit program</p>
                      <ProgramForm
                        initial={toForm(p)}
                        submitLabel="Save changes"
                        onSubmit={(form) => update(p.id, form)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {programs.length > 0 && (
        <p className="mt-4 text-xs text-slate-400">
          {programs.filter((p) => p.is_active).length} active · {programs.length} total
        </p>
      )}
    </div>
  );
}
