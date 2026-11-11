"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  COURSE_PACKAGES,
  CURRENT_LEVEL_OPTIONS,
  SCHEDULE_OPTIONS,
  GOAL_OPTIONS,
  ADMISSIONS_EMAIL,
  getCoursePackage,
  type CourseId,
} from "@/data/courses";
import PaymentSection from "@/components/forms/PaymentSection";

type Status = "idle" | "loading" | "success" | "error";
type FieldName = "fullName" | "email" | "phone" | "countryTimezone" | "course" | "consent" | "paymentProof";
type FieldErrors = Partial<Record<FieldName, string>>;

const inputBase =
  "mt-1.5 block w-full rounded-xl border bg-white px-4 py-3 text-base text-navy-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 sm:text-sm";
const inputOk = "border-slate-300 focus:border-amber-500 focus:ring-amber-500/30";
const inputErr = "border-red-400 focus:border-red-500 focus:ring-red-500/20";

function newSubmissionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Best guess of the visitor's time zone, e.g. "America/Toronto" — editable under "more details". */
function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function validate(values: Record<string, string>, course: string, proof: File | null): FieldErrors {
  const e: FieldErrors = {};
  if (!getCoursePackage(course)) e.course = "Please choose a course.";
  if (values.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) e.email = "Please enter a valid email address.";
  const phone = values.phone.trim();
  if (!/^\+[0-9][0-9\s\-().]{6,22}$/.test(phone) || phone.replace(/\D/g, "").length < 7)
    e.phone = "Start with your country code, e.g. +1 437 555 0123.";
  if (!proof) e.paymentProof = "Please upload your payment screenshot.";
  return e;
}

export default function RegistrationForm({ defaultCourse = "" }: { defaultCourse?: string }) {
  const [course, setCourse] = useState<CourseId | "">(getCoursePackage(defaultCourse)?.id ?? "");
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    countryTimezone: "",
    currentLevel: "",
    preferredSchedule: "",
    learningGoal: "",
    message: "",
  });
  const [proof, setProof] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [result, setResult] = useState<{ duplicate?: boolean; confirmationEmailSent?: boolean }>({});

  // Anti-spam & idempotency
  const startedAt = useRef<number>(0);
  const submissionId = useRef<string>("");
  const honeypot = useRef<HTMLInputElement>(null);

  const selected = getCoursePackage(course);

  function markStarted(e: React.SyntheticEvent) {
    if (!startedAt.current) startedAt.current = e.timeStamp || 1;
  }

  function update(name: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name as FieldName]) setErrors((x) => ({ ...x, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const v = validate(values, course, proof);
    setErrors(v);
    if (Object.keys(v).length > 0 || !proof) {
      setStatus("error");
      setServerMessage("Please complete the highlighted fields.");
      const first = (["course", "fullName", "email", "phone", "paymentProof"] as const).find((k) => v[k]);
      const el = first && document.getElementById(first === "paymentProof" ? "paymentProof-label" : first === "course" ? "course-label" : first);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (first && first !== "paymentProof" && first !== "course") el?.focus({ preventScroll: true });
      return;
    }

    if (!submissionId.current) submissionId.current = newSubmissionId();
    setStatus("loading");
    setServerMessage("");

    const fd = new FormData();
    for (const [k, val] of Object.entries(values)) fd.append(k, val);
    // Country / time zone is auto-detected unless the student typed one
    fd.set("countryTimezone", values.countryTimezone.trim() || detectTimeZone() || "Not specified");
    fd.append("course", course);
    fd.append("consent", "true"); // agreement shown next to the submit button
    fd.append("website", honeypot.current?.value ?? "");
    fd.append("elapsedMs", String(startedAt.current ? Math.round(e.timeStamp - startedAt.current) : 0));
    fd.append("submissionId", submissionId.current);
    fd.append("paymentProof", proof);

    try {
      const res = await fetch("/api/register", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setResult({ duplicate: json.duplicate, confirmationEmailSent: json.confirmationEmailSent });
        setStatus("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (json.fieldErrors) setErrors(json.fieldErrors);
      setStatus("error");
      setServerMessage(json.error || `Something went wrong. Please try again or email ${ADMISSIONS_EMAIL}.`);
      if (res.status === 400 || res.status === 413 || res.status === 429) submissionId.current = "";
    } catch {
      setStatus("error");
      setServerMessage(`We couldn't reach the server. Check your connection and try again, or email ${ADMISSIONS_EMAIL}.`);
    }
  }

  /* ── Success ─────────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className="py-4 text-center" role="status" aria-live="polite">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-navy-900">Registration submitted</h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-slate-600">
          {result.duplicate
            ? "We already have your registration for this course — no need to submit again."
            : "Thank you! We've received your registration and payment screenshot."}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Pending payment verification
        </span>
        {selected && (
          <p className="mt-4 text-sm text-slate-600">
            {selected.name} · <strong className="text-navy-900">CAD {selected.priceLabel}</strong>
          </p>
        )}
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
          Once we verify your payment, you&apos;ll get an email with a link to set up your Student Portal login.
          {!result.duplicate && result.confirmationEmailSent ? ` A confirmation has been sent to ${values.email}.` : ""}
        </p>
        <Link href="/" className="mt-7 inline-flex items-center justify-center rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-navy-800">
          Back to home
        </Link>
      </div>
    );
  }

  const busy = status === "loading";

  return (
    <form onSubmit={handleSubmit} onFocusCapture={markStarted} onPointerDownCapture={markStarted} noValidate className="space-y-8">
      {/* Honeypot — hidden from people and assistive tech */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input ref={honeypot} type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {/* ── 1. Course ───────────────────────────────────────── */}
      <section>
        <SectionTitle n={1} id="course-label">Choose your course</SectionTitle>
        <div role="radiogroup" aria-labelledby="course-label" className="mt-3 grid gap-3 sm:grid-cols-3">
          {COURSE_PACKAGES.map((c) => {
            const isSel = course === c.id;
            return (
              <label
                key={c.id}
                className={`relative flex cursor-pointer flex-row items-center justify-between gap-3 rounded-xl border-2 bg-white p-4 transition-all sm:flex-col sm:items-start has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-500/40 ${
                  isSel ? "border-amber-500 bg-amber-50/40 shadow-sm" : "border-slate-200 hover:border-amber-300"
                }`}
              >
                <input
                  type="radio"
                  name="course"
                  value={c.id}
                  checked={isSel}
                  onChange={() => {
                    setCourse(c.id);
                    setErrors((x) => ({ ...x, course: undefined }));
                  }}
                  className="sr-only"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-navy-900">{c.shortName}</span>
                  <span className="block text-xs text-slate-500">{c.durationShort}</span>
                </span>
                <span className="text-lg font-bold text-navy-900">{c.priceLabel}</span>
                {isSel && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] text-white sm:right-3 sm:top-3" aria-hidden="true">
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">Prices in CAD for the complete package — not monthly.</p>
        {errors.course && (
          <p className="mt-1 text-sm font-medium text-red-600" role="alert">
            {errors.course}
          </p>
        )}
      </section>

      {/* ── 2. Details ──────────────────────────────────────── */}
      <section>
        <SectionTitle n={2}>Your details</SectionTitle>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <TextField id="fullName" label="Full name" autoComplete="name" value={values.fullName} error={errors.fullName} onChange={(v) => update("fullName", v)} className="sm:col-span-2" />
          <TextField id="email" label="Email" type="email" autoComplete="email" inputMode="email" value={values.email} error={errors.email} onChange={(v) => update("email", v)} />
          <TextField id="phone" label="Phone / WhatsApp" type="tel" autoComplete="tel" inputMode="tel" placeholder="+1 437 555 0123" value={values.phone} error={errors.phone} onChange={(v) => update("phone", v)} />
        </div>

        <details className="group mt-4 rounded-xl border border-slate-200 bg-slate-50/50 open:bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-3 text-sm font-semibold text-navy-800 [&::-webkit-details-marker]:hidden">
            Add more details <span className="font-normal text-slate-500">(optional)</span>
            <span className="ml-auto text-lg leading-none text-slate-400 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="grid gap-4 border-t border-slate-200 px-4 py-4 sm:grid-cols-2">
            <TextField id="countryTimezone" label="Country / time zone" autoComplete="country-name" placeholder="Detected automatically if left blank" value={values.countryTimezone} error={errors.countryTimezone} onChange={(v) => update("countryTimezone", v)} />
            <SelectField id="currentLevel" label="Current French level" options={CURRENT_LEVEL_OPTIONS} value={values.currentLevel} onChange={(v) => update("currentLevel", v)} />
            <SelectField id="preferredSchedule" label="Preferred schedule" options={SCHEDULE_OPTIONS} value={values.preferredSchedule} onChange={(v) => update("preferredSchedule", v)} />
            <SelectField id="learningGoal" label="Main goal" options={GOAL_OPTIONS} value={values.learningGoal} onChange={(v) => update("learningGoal", v)} />
            <div className="sm:col-span-2">
              <label htmlFor="message" className="block text-sm font-semibold text-slate-700">
                Questions or comments
              </label>
              <textarea id="message" rows={2} maxLength={2000} value={values.message} onChange={(e) => update("message", e.target.value)} className={`${inputBase} ${inputOk}`} />
            </div>
          </div>
        </details>
      </section>

      {/* ── 3. Pay & upload ─────────────────────────────────── */}
      <section>
        <SectionTitle n={3} id="paymentProof-label">Pay &amp; upload your screenshot</SectionTitle>
        <div className="mt-3">
          <PaymentSection
            course={selected}
            file={proof}
            error={errors.paymentProof}
            onFile={(f, err) => {
              setProof(f);
              setErrors((x) => ({ ...x, paymentProof: err }));
            }}
          />
        </div>
      </section>

      {/* ── Submit ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div aria-live="assertive">
          {status === "error" && serverMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {serverMessage}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {busy ? "Submitting…" : "Submit Registration"}
        </button>
        <p className="text-center text-xs leading-relaxed text-slate-500">
          By submitting, you agree that Mappell French may contact you by email, phone or WhatsApp about your enrollment.
          Your details and screenshot are kept private and used only for admissions.
        </p>
      </div>
    </form>
  );
}

/* ── Small components ──────────────────────────────────────── */

function SectionTitle({ n, id, children }: { n: number; id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 text-base font-bold text-navy-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white" aria-hidden="true">
        {n}
      </span>
      {children}
    </h2>
  );
}

function TextField({
  id, label, value, onChange, error, type = "text", placeholder, autoComplete, inputMode, className = "",
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string;
  type?: string; placeholder?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputBase} ${error ? inputErr : inputOk}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  id, label, options, value, onChange,
}: {
  id: string; label: string; options: readonly string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select id={id} name={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputBase} ${inputOk}`}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
