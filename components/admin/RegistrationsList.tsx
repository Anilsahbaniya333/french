"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  level: string;
  experience?: string | null;
  preferredMode?: string | null;
  preferredTime?: string | null;
  goals?: string | null;
  message?: string | null;
  paymentScreenshotUrl?: string | null;
  status?: string;
  createdAt?: string;
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "pending";
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[s] ?? styles.pending}`}
    >
      {s}
    </span>
  );
}

export default function RegistrationsList() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/registrations");
        if (!res.ok) { setRegistrations([]); return; }
        const json = await res.json();
        setRegistrations(json.registrations ?? []);
      } catch {
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function updateStatus(id: string, status: "approved" | "rejected" | "pending") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  const filtered =
    filter === "all" ? registrations : registrations.filter((r) => r.status === filter);

  const counts = {
    all: registrations.length,
    pending: registrations.filter((r) => (r.status ?? "pending") === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  if (loading) return <p className="mt-6 text-slate-600">Loading…</p>;

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl overflow-auto rounded-xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-2 top-2 rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative min-h-64 w-full">
              <Image
                src={lightbox}
                alt="Payment screenshot"
                width={600}
                height={600}
                className="rounded-lg object-contain"
                unoptimized
              />
            </div>
            <div className="mt-3 flex justify-center">
              <a
                href={lightbox}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-600 underline hover:text-amber-700"
              >
                Open full size
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mt-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        {(["all", "pending", "approved", "rejected"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? "bg-amber-500 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab} <span className="ml-1 text-xs opacity-75">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">No registrations{filter !== "all" ? ` with status "${filter}"` : ""} yet.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Email / Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Level / Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Screenshot</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{r.fullName}</p>
                      {r.goals && (
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-1" title={r.goals}>
                          {r.goals}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{r.email}</p>
                      <p className="text-xs text-slate-400">{r.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 uppercase">
                        {r.level}
                      </span>
                      {r.preferredMode && (
                        <p className="mt-1 text-xs text-slate-500">{r.preferredMode}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.paymentScreenshotUrl ? (
                        <button
                          onClick={() => setLightbox(r.paymentScreenshotUrl!)}
                          className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 hover:border-amber-400 hover:shadow-sm transition"
                          title="View screenshot"
                        >
                          <Image
                            src={r.paymentScreenshotUrl}
                            alt="Payment"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {r.status !== "approved" && (
                          <button
                            disabled={updating === r.id}
                            onClick={() => updateStatus(r.id, "approved")}
                            className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== "rejected" && (
                          <button
                            disabled={updating === r.id}
                            onClick={() => updateStatus(r.id, "rejected")}
                            className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        {r.status !== "pending" && (
                          <button
                            disabled={updating === r.id}
                            onClick={() => updateStatus(r.id, "pending")}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
