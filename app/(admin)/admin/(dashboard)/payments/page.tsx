"use client";

import { useState, useEffect } from "react";

interface PaymentSubmission {
  id: string;
  image_url: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  students: { id: string; full_name: string; email: string } | null;
  groups: { id: string; group_name: string; level_code: string | null } | null;
}

const STATUS_META = {
  pending:  { label: "Pending",  badge: "bg-amber-100 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700 border-red-200",           dot: "bg-red-400" },
};

const LEVEL_BADGE: Record<string, string> = {
  a1: "bg-emerald-100 text-emerald-800",
  a2: "bg-sky-100 text-sky-800",
  b1: "bg-violet-100 text-violet-800",
  b2: "bg-amber-100 text-amber-800",
};

export default function AdminPaymentsPage() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/payment-submissions")
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    setUpdating((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/payment-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setSubmissions((p) => p.map((s) => (s.id === id ? { ...s, status } : s)));
      }
    } finally {
      setUpdating((p) => ({ ...p, [id]: false }));
    }
  };

  const counts = {
    all:      submissions.length,
    pending:  submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payment Submissions</h1>
        <p className="mt-1 text-slate-500">Review payment proof uploaded by students.</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors capitalize ${
              filter === f
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {f}
            <span className={`rounded-full px-2 py-0.5 text-xs ${filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
          <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-slate-400">
            {submissions.length === 0 ? "No payment submissions yet." : `No ${filter} submissions.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Student</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Group</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Screenshot</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Note</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => {
                const meta = STATUS_META[s.status] ?? STATUS_META.pending;
                const busy = !!updating[s.id];
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{s.students?.full_name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{s.students?.email ?? ""}</p>
                    </td>

                    {/* Group */}
                    <td className="px-4 py-3">
                      {s.groups ? (
                        <div>
                          <p className="text-slate-700">{s.groups.group_name}</p>
                          {s.groups.level_code && (
                            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-black uppercase ${LEVEL_BADGE[s.groups.level_code] ?? "bg-slate-100 text-slate-600"}`}>
                              {s.groups.level_code.toUpperCase()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Screenshot */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setLightboxUrl(s.image_url)}
                        className="group relative block h-14 w-14 overflow-hidden rounded-xl border border-slate-200 hover:border-amber-400 transition-colors"
                        title="Click to enlarge"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.image_url}
                          alt="Payment proof"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl">
                          <svg className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </button>
                    </td>

                    {/* Note */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-slate-600 text-xs line-clamp-2">{s.note || <span className="text-slate-300 italic">No note</span>}</p>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-slate-600">
                        {new Date(s.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(s.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {s.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(s.id, "approved")}
                            disabled={busy}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {s.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(s.id, "rejected")}
                            disabled={busy}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        {s.status !== "pending" && (
                          <button
                            onClick={() => updateStatus(s.id, "pending")}
                            disabled={busy}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Payment proof full size"
              className="w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
            <a
              href={lightboxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open full size
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
