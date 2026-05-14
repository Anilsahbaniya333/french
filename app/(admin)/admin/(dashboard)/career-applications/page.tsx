"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  resume_url: string | null;
  resume_signed_url: string | null;
  status: string;
  created_at: string;
  careers: { title: string } | null;
}

const STATUS_OPTIONS = ["new", "reviewed", "shortlisted", "rejected", "hired"] as const;

const STATUS_STYLES: Record<string, string> = {
  new:         "bg-blue-100   text-blue-700",
  reviewed:    "bg-amber-100  text-amber-700",
  shortlisted: "bg-green-100  text-green-700",
  rejected:    "bg-red-100    text-red-700",
  hired:       "bg-emerald-100 text-emerald-700",
};

export default function CareerApplicationsPage() {
  const [apps, setApps]       = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/career-applications");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setApps(json.applications ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res  = await fetch(`/api/admin/career-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: json.application.status } : a))
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  const counts = STATUS_OPTIONS.reduce(
    (acc, s) => ({ ...acc, [s]: apps.filter((a) => a.status === s).length }),
    {} as Record<string, number>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Career Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review candidates who applied through the Careers page.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status summary chips */}
      {!loading && apps.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[s]}`}>
              <span className="capitalize">{s}</span>
              <span className="rounded-full bg-white/60 px-1.5">{counts[s]}</span>
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            Total <span className="rounded-full bg-white px-1.5">{apps.length}</span>
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && apps.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-base font-bold text-slate-700">No applications yet</p>
          <p className="mt-1 text-sm text-slate-400">Applications submitted through the Careers page will appear here.</p>
        </div>
      )}

      {/* Applications list */}
      {!loading && !error && apps.length > 0 && (
        <div className="space-y-4">
          {apps.map((app) => {
            const isOpen = expanded === app.id;
            return (
              <div key={app.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Card header */}
                <button
                  className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : app.id)}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-700">
                    {app.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800">{app.full_name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[app.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {app.careers?.title ?? "Unknown position"} · {app.email}
                    </p>
                  </div>

                  {/* Date */}
                  <span className="hidden shrink-0 text-xs text-slate-400 sm:block">
                    {new Date(app.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>

                  {/* Chevron */}
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-6 py-5 space-y-5">
                    {/* Contact row */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</p>
                        <a href={`mailto:${app.email}`} className="text-sm text-amber-600 hover:underline font-medium">
                          {app.email}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Phone</p>
                        {app.phone ? (
                          <a href={`tel:${app.phone}`} className="text-sm text-slate-700 font-medium">
                            {app.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Applied</p>
                        <p className="text-sm text-slate-700">
                          {new Date(app.created_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Cover note */}
                    {app.message && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cover Note</p>
                        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                          {app.message}
                        </p>
                      </div>
                    )}

                    {/* Resume */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Resume</p>
                      {app.resume_signed_url ? (
                        <a
                          href={app.resume_signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors shadow-sm"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Resume
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">No resume uploaded</span>
                      )}
                    </div>

                    {/* Status update */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 border-t border-slate-100 pt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:w-24">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            disabled={app.status === s || updating === app.id}
                            onClick={() => updateStatus(app.id, s)}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-all ${
                              app.status === s
                                ? `${STATUS_STYLES[s]} ring-2 ring-offset-1 ring-current`
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            }`}
                          >
                            {updating === app.id && app.status !== s ? (
                              <span className="opacity-50">{s}</span>
                            ) : s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
