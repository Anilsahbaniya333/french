"use client";

import { useState, useEffect, useRef } from "react";

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
  schedule: string | null;
  tutors: { full_name: string } | null;
}

interface Submission {
  id: string;
  image_url: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  groups: { group_name: string; level_code: string | null; tutors: { full_name: string } | null } | null;
}

const STATUS_META = {
  pending:  { label: "Pending review",  badge: "bg-amber-100 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  approved: { label: "Approved",        badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Rejected",        badge: "bg-red-100 text-red-700 border-red-200",           dot: "bg-red-400" },
};

const LEVEL_BADGE: Record<string, string> = {
  a1: "bg-emerald-100 text-emerald-700",
  a2: "bg-sky-100 text-sky-700",
  b1: "bg-violet-100 text-violet-700",
  b2: "bg-amber-100 text-amber-700",
};

export default function StudentPaymentPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/manage-groups").then((r) => r.json()),
      fetch("/api/student/payment-submissions").then((r) => r.json()),
    ])
      .then(([gRes, sRes]) => {
        const activeGroups: Group[] = (gRes.groups ?? []).filter((g: Group & { is_active?: boolean }) => g.is_active !== false);
        setGroups(activeGroups);
        setSubmissions(sRes.submissions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setSubmitError("");
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setSubmitError("Please select a screenshot first."); return; }

    setSubmitting(true);
    setSubmitError("");

    try {
      const fd = new FormData();
      fd.append("screenshot", file);
      if (selectedGroupId) fd.append("group_id", selectedGroupId);
      if (note.trim()) fd.append("note", note.trim());

      const res = await fetch("/api/student/payment-submissions", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Upload failed. Please try again.");
        return;
      }

      // Reload submissions list
      const sRes = await fetch("/api/student/payment-submissions").then((r) => r.json());
      setSubmissions(sRes.submissions ?? []);

      // Reset form
      clearFile();
      setNote("");
      setSelectedGroupId("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payment Submission</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload your payment proof after completing your registration payment.
        </p>
      </div>

      {/* Success banner */}
      {submitSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Payment screenshot submitted!</p>
            <p className="text-sm text-emerald-700 mt-0.5">Your admin will review it shortly.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Upload form */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 font-semibold text-slate-800">Submit Payment Proof</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Group selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Group <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select your group…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.group_name}{g.level_code ? ` (${g.level_code.toUpperCase()})` : ""}
                    </option>
                  ))}
                </select>

                {/* Group info card */}
                {selectedGroup && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{selectedGroup.group_name}</span>
                      {selectedGroup.level_code && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-black uppercase ${LEVEL_BADGE[selectedGroup.level_code] ?? "bg-slate-100 text-slate-600"}`}>
                          {selectedGroup.level_code.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {selectedGroup.tutors && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Tutor: {selectedGroup.tutors.full_name}
                      </div>
                    )}
                    {selectedGroup.schedule && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {selectedGroup.schedule}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Payment screenshot *
                </label>

                {!preview ? (
                  <label
                    htmlFor="screenshot-upload"
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                      <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Click to upload screenshot</p>
                      <p className="mt-1 text-xs text-slate-400">JPG, PNG or WebP — max 10 MB</p>
                    </div>
                    <input
                      id="screenshot-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="sr-only"
                      onChange={onFileChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Payment proof preview"
                      className="w-full max-h-72 object-contain rounded-2xl border border-slate-200 bg-slate-50"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{file?.name}</p>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Change image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Note <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Any additional info for your admin…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              {submitError && (
                <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !file}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Uploading…
                  </span>
                ) : (
                  "Submit payment proof"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Previous submissions */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-800">My Submissions</h2>
            {submissions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">No submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((s) => {
                  const meta = STATUS_META[s.status] ?? STATUS_META.pending;
                  return (
                    <div key={s.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex gap-3">
                        <a href={s.image_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.image_url}
                            alt="Payment proof"
                            className="h-14 w-14 rounded-xl border border-slate-200 object-cover hover:opacity-80 transition-opacity"
                          />
                        </a>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-xs text-slate-400 truncate">
                              {s.groups?.group_name ?? "No group"}
                            </p>
                            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </div>
                          {s.groups?.tutors && (
                            <p className="text-xs text-slate-500">Tutor: {s.groups.tutors.full_name}</p>
                          )}
                          {s.note && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{s.note}</p>}
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(s.created_at).toLocaleDateString(undefined, {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Status messages */}
                      {s.status === "approved" && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Payment confirmed by admin.
                        </div>
                      )}
                      {s.status === "rejected" && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Rejected. Please contact your admin.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
