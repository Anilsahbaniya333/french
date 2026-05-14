"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Job {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  description: string | null;
  requirements: string | null;
  created_at: string;
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  message: string;
  resume: File | null;
}

const BLANK: FormState = { full_name: "", email: "", phone: "", message: "", resume: null };

const MAX_BYTES       = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTS    = [".pdf", ".doc", ".docx"];
const ALLOWED_TYPES   = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function CareersList({ jobs }: { jobs: Job[] }) {
  const [applyingTo, setApplyingTo] = useState<Job | null>(null);
  const [form, setForm]             = useState<FormState>(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<{ ok: boolean; msg: string } | null>(null);
  const [fileError, setFileError]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (applyingTo) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [applyingTo]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openModal(job: Job) {
    setApplyingTo(job);
    setForm(BLANK);
    setResult(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function closeModal() {
    if (submitting) return;
    setApplyingTo(null);
    setForm(BLANK);
    setResult(null);
    setFileError(null);
  }

  function setField(field: keyof Omit<FormState, "resume">, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      setForm((f) => ({ ...f, resume: null }));
      return;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
      setFileError("Only PDF, DOC, or DOCX files are accepted.");
      if (fileRef.current) fileRef.current.value = "";
      setForm((f) => ({ ...f, resume: null }));
      return;
    }

    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File is ${mb} MB — please upload a file under 10 MB.`);
      if (fileRef.current) fileRef.current.value = "";
      setForm((f) => ({ ...f, resume: null }));
      return;
    }

    setForm((f) => ({ ...f, resume: file }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!applyingTo) return;
    setSubmitting(true);
    setResult(null);

    const fd = new FormData();
    fd.append("job_id",    applyingTo.id);
    fd.append("full_name", form.full_name);
    fd.append("email",     form.email);
    fd.append("phone",     form.phone);
    fd.append("message",   form.message);
    if (form.resume) fd.append("resume", form.resume);

    try {
      const res  = await fetch("/api/careers/apply", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) {
        setResult({ ok: true, msg: "Application submitted! We'll review it and be in touch soon." });
      } else {
        setResult({ ok: false, msg: json.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setResult({ ok: false, msg: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Job cards ── */}
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-700">No open positions right now</p>
          <p className="mt-2 text-sm text-slate-400">
            Check back soon — or{" "}
            <Link href="/contact" className="text-amber-600 hover:underline font-medium">
              reach out to us directly
            </Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-200"
            >
              {/* Card header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-800">{job.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.location && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </span>
                    )}
                    {job.job_type && (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {job.job_type}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openModal(job)}
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Apply Now
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {job.description && (
                <div className="mt-5">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">About the Role</p>
                  <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{job.description}</p>
                </div>
              )}

              {job.requirements && (
                <div className="mt-5">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Requirements</p>
                  <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">{job.requirements}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom CTA ── */}
      <div className="mt-12 rounded-2xl bg-slate-900 p-8 text-center">
        <p className="text-lg font-black text-white">Don&apos;t see the right role?</p>
        <p className="mt-2 text-sm text-slate-400">
          Send us your CV and we&apos;ll keep you in mind for future openings.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
        >
          Get In Touch
        </Link>
      </div>

      {/* ── Application modal ── */}
      {applyingTo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Apply for</p>
                <h3 className="text-lg font-black text-slate-800 mt-0.5">{applyingTo.title}</h3>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="ml-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success state */}
            {result?.ok ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-bold text-slate-800">Application Received!</p>
                <p className="mt-2 text-sm text-slate-500">{result.msg}</p>
                <button
                  onClick={closeModal}
                  className="mt-6 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Application form */
              <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-4">
                {/* Error banner */}
                {result && !result.ok && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {result.msg}
                  </div>
                )}

                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setField("full_name", e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                  />
                </div>

                {/* Cover note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Cover Note</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setField("message", e.target.value)}
                    placeholder="Tell us why you'd be a great fit..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
                  />
                </div>

                {/* Resume upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Resume / CV
                    <span className="ml-1.5 font-normal text-slate-400">(PDF, DOC, DOCX — max 10 MB)</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-amber-700 hover:file:bg-amber-200 focus:outline-none transition ${
                      fileError ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {fileError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      {fileError}
                    </p>
                  )}
                  {form.resume && !fileError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {form.resume.name} ({(form.resume.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>

                {/* Submit row */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !!fileError}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
