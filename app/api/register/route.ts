import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import { insertRegistration, hasRecentRegistration } from "@/lib/supabase/queries";
import { sendEmail, escapeHtml, getAdmissionsEmail } from "@/lib/email";
import {
  ALLOWED_PROOF_TYPES,
  MAX_PROOF_BYTES,
  sniffImageType,
  uploadPaymentProof,
  removePaymentProof,
  logRegistrationEvent,
  siteUrl,
} from "@/lib/registration-server";
import {
  getCoursePackage,
  CURRENT_LEVEL_OPTIONS,
  SCHEDULE_OPTIONS,
  GOAL_OPTIONS,
  ADMISSIONS_EMAIL,
  type CoursePackage,
} from "@/data/courses";

/* ── Abuse protection (best-effort, per server instance) ──────────────────
   On serverless hosts each instance has its own memory, so this throttles
   bursts rather than enforcing a global limit. Pair with the honeypot,
   minimum fill time and DB-level duplicate check below. */
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();
const recentSubmissions = new Map<string, { at: number; body: unknown }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_MAX;
}

function rememberSubmission(id: string, body: unknown) {
  const now = Date.now();
  for (const [k, v] of recentSubmissions) if (now - v.at > RATE_WINDOW_MS) recentSubmissions.delete(k);
  recentSubmissions.set(id, { at: now, body });
}

/* ── Validation ─────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+[0-9][0-9\s\-().]{6,22}$/;
const MIN_FILL_MS = 2500;

type FieldErrors = Partial<Record<string, string>>;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function optionalEnum<T extends readonly string[]>(v: unknown, options: T): string | null {
  const s = str(v, 60);
  return s && (options as readonly string[]).includes(s) ? s : null;
}

/* ── Emails ─────────────────────────────────────────────────────────────── */

interface Reg {
  fullName: string;
  email: string;
  phone: string;
  countryTimezone: string;
  course: CoursePackage;
  currentLevel: string | null;
  preferredSchedule: string | null;
  learningGoal: string | null;
  message: string | null;
  submittedAt: string;
}

function rows(r: Reg): [string, string][] {
  return [
    ["Name", r.fullName],
    ["Email", r.email],
    ["Phone", r.phone],
    ["Country / time zone", r.countryTimezone],
    ["Course", `${r.course.name} — CAD ${r.course.priceLabel} — ${r.course.duration}`],
    ["Current French level", r.currentLevel ?? "—"],
    ["Preferred schedule", r.preferredSchedule ?? "—"],
    ["Primary goal", r.learningGoal ?? "—"],
    ["Questions / comments", r.message ?? "—"],
    ["Submitted", r.submittedAt],
  ];
}

function adminEmail(r: Reg, reviewUrl: string) {
  const table = rows(r)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 12px;color:#0f1f42;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
    )
    .join("");
  return {
    subject: `New registration (payment to verify): ${r.fullName} — ${r.course.shortName} — CAD ${r.course.priceLabel}`,
    html: `<div style="font-family:system-ui,sans-serif"><h2 style="color:#0f1f42">New registration — pending payment verification</h2><p><a href="${escapeHtml(reviewUrl)}">Review in the admin dashboard</a> (the payment screenshot is stored privately there).</p><table style="border-collapse:collapse;font-size:14px">${table}</table></div>`,
    text: `Review: ${reviewUrl}\n\n` + rows(r).map(([k, v]) => `${k}: ${v}`).join("\n"),
  };
}

function studentEmail(r: Reg) {
  const first = r.fullName.split(/\s+/)[0];
  const text = `Bonjour ${first},

Thank you for registering with Mappell French! We have received your registration and payment confirmation screenshot.

Course: ${r.course.name}
Price: CAD ${r.course.priceLabel} (complete package)
Estimated duration: ${r.course.duration}

Status: Pending payment verification. Our admissions team will verify your Interac e-Transfer and confirm your enrollment. Once approved, you'll receive an email with a secure link to set up your Student Portal password.

Questions? Reply to this email or write to ${ADMISSIONS_EMAIL}.

— Mappell French Admissions`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#1e293b;line-height:1.6">
<h2 style="color:#0f1f42;margin-bottom:4px">Bonjour ${escapeHtml(first)},</h2>
<p>Thank you for registering with <strong>Mappell French</strong>! We have received your registration and payment confirmation screenshot.</p>
<div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:20px 0;background:#f8fafc">
<p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d97706;font-weight:700">Your selected course</p>
<p style="margin:6px 0 0;font-size:17px;font-weight:800;color:#0f1f42">${escapeHtml(r.course.name)}</p>
<p style="margin:4px 0 0;color:#475569">CAD ${escapeHtml(r.course.priceLabel)} (complete package) · ${escapeHtml(r.course.duration)}</p>
</div>
<p><strong>Status: Pending payment verification.</strong> Our admissions team will verify your Interac e-Transfer and confirm your enrollment. Once approved, you'll receive an email with a secure link to set up your Student Portal password.</p>
<p>Questions? Reply to this email or write to <a href="mailto:${ADMISSIONS_EMAIL}">${ADMISSIONS_EMAIL}</a>.</p>
<p style="color:#64748b">— Mappell French Admissions</p></div>`;
  return { subject: "We received your Mappell French registration", html, text };
}

/* ── Handler ────────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  // Reject oversized bodies early (10 MB image + form fields)
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_PROOF_BYTES + 512 * 1024) {
    return NextResponse.json(
      {
        success: false,
        error: "The upload is too large. Payment screenshots must be under 10 MB.",
        fieldErrors: { paymentProof: "File must be under 10 MB." },
      },
      { status: 413 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  const body: Record<string, unknown> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") body[k] = v;
  const proof = form.get("paymentProof");

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
  const ipHash = createHash("sha256").update(`${ip}|${process.env.ADMIN_SESSION_SECRET ?? "mappell"}`).digest("hex").slice(0, 32);

  // Honeypot: real users never see or fill this field. Pretend success so bots don't adapt.
  if (str(body.website, 200)) {
    return NextResponse.json({ success: true });
  }

  // Idempotency: the same form submission (double-click, retry) returns the original result.
  const submissionId = str(body.submissionId, 64);
  if (submissionId) {
    const prior = recentSubmissions.get(submissionId);
    if (prior) return NextResponse.json(prior.body);
  }

  // Minimum fill time: humans take more than a couple of seconds to complete the form.
  const elapsedMs = Number(body.elapsedMs);
  if (!Number.isFinite(elapsedMs) || elapsedMs < MIN_FILL_MS) {
    return NextResponse.json(
      { success: false, error: "That was very fast — please review your details and submit again." },
      { status: 429 }
    );
  }

  if (rateLimited(ipHash)) {
    return NextResponse.json(
      { success: false, error: `Too many attempts. Please wait a few minutes or email us at ${ADMISSIONS_EMAIL}.` },
      { status: 429 }
    );
  }

  /* Validate */
  const errors: FieldErrors = {};
  const fullName = str(body.fullName, 120);
  const email = str(body.email, 200).toLowerCase();
  const phone = str(body.phone, 30);
  const countryTimezone = str(body.countryTimezone, 120);
  const course = getCoursePackage(str(body.course, 40));
  const message = str(body.message, 2000) || null;

  if (fullName.length < 2) errors.fullName = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 7)
    errors.phone = "Include your country code, e.g. +1 416 555 0123.";
  if (countryTimezone.length < 2) errors.countryTimezone = "Please tell us your country or time zone.";
  if (!course) errors.course = "Please choose a course.";
  if (body.consent !== "true") errors.consent = "Please agree to be contacted about your enrollment.";

  // Payment screenshot: required, ≤10 MB, real JPEG/PNG/WebP (verified by file signature)
  let proofBytes: Uint8Array | null = null;
  let proofType: string | null = null;
  if (!(proof instanceof File) || proof.size === 0) {
    errors.paymentProof = "Please upload your payment confirmation screenshot.";
  } else if (proof.size > MAX_PROOF_BYTES) {
    errors.paymentProof = "File must be under 10 MB.";
  } else if (
    !(ALLOWED_PROOF_TYPES as readonly string[]).includes(proof.type === "image/jpg" ? "image/jpeg" : proof.type)
  ) {
    errors.paymentProof = "Upload a JPG, PNG or WebP image.";
  } else {
    proofBytes = new Uint8Array(await proof.arrayBuffer());
    proofType = sniffImageType(proofBytes);
    if (!proofType) errors.paymentProof = "This file doesn't look like a valid JPG, PNG or WebP image.";
  }

  if (Object.keys(errors).length > 0 || !course || !proofBytes || !proofType) {
    return NextResponse.json(
      { success: false, error: "Please correct the highlighted fields.", fieldErrors: errors },
      { status: 400 }
    );
  }

  const reg: Reg = {
    fullName,
    email,
    phone,
    countryTimezone,
    course,
    currentLevel: optionalEnum(body.currentLevel, CURRENT_LEVEL_OPTIONS),
    preferredSchedule: optionalEnum(body.preferredSchedule, SCHEDULE_OPTIONS),
    learningGoal: optionalEnum(body.learningGoal, GOAL_OPTIONS),
    message,
    submittedAt: new Date().toISOString(),
  };

  const supabase = createServiceRoleClient() ?? createServerClient();
  if (!supabase) {
    console.error("[/api/register] Supabase is not configured");
    return NextResponse.json(
      {
        success: false,
        error: `Registration is temporarily unavailable. Please email us at ${ADMISSIONS_EMAIL}.`,
      },
      { status: 503 }
    );
  }

  // Duplicate check: same email + same course within 30 minutes → treat as already received.
  if (await hasRecentRegistration(supabase, email, course.code)) {
    const result = { success: true, duplicate: true, confirmationEmailSent: false };
    if (submissionId) rememberSubmission(submissionId, result);
    return NextResponse.json(result);
  }

  const upload = await uploadPaymentProof(supabase, proofBytes, proofType);
  if (!upload.ref || !upload.path) {
    console.error("[/api/register] payment proof upload failed:", upload.error);
    return NextResponse.json(
      {
        success: false,
        error: `We couldn't upload your payment screenshot. Please try again, or email us at ${ADMISSIONS_EMAIL}.`,
      },
      { status: 500 }
    );
  }

  const saved = await insertRegistration(supabase, {
    fullName,
    email,
    phone,
    level: course.code,
    coursePackage: course.id,
    countryTimezone,
    currentLevel: reg.currentLevel,
    preferredSchedule: reg.preferredSchedule,
    learningGoal: reg.learningGoal,
    message,
    consentAt: reg.submittedAt,
    sourceIpHash: ipHash,
    paymentScreenshotUrl: upload.ref,
  });

  if (!saved.success) {
    console.error("[/api/register] insert failed:", saved.error);
    await removePaymentProof(supabase, upload.path);
    return NextResponse.json(
      {
        success: false,
        error: `We couldn't save your registration. Please try again, or email us at ${ADMISSIONS_EMAIL}.`,
      },
      { status: 500 }
    );
  }

  // Emails are sent only after the registration is safely stored. Failures are logged
  // and reported to the client honestly, but do not undo a successful registration.
  if (saved.id) {
    await logRegistrationEvent(supabase, {
      registrationId: saved.id,
      event: "submitted",
      toStatus: "pending",
      note: "Registration submitted with payment screenshot",
      actor: "student",
    });
  }

  const reviewUrl = `${siteUrl(req)}/admin/registrations${saved.id ? `?id=${saved.id}` : ""}`;
  const admin = adminEmail(reg, reviewUrl);
  const student = studentEmail(reg);
  const [adminRes, studentRes] = await Promise.all([
    sendEmail({ to: getAdmissionsEmail(), ...admin, replyTo: email }),
    sendEmail({ to: email, ...student, replyTo: getAdmissionsEmail() }),
  ]);
  if (!adminRes.sent) console.error("[/api/register] admissions notification not sent:", adminRes.error);
  if (!studentRes.sent) console.error("[/api/register] student confirmation not sent:", studentRes.error);

  const result = { success: true, id: saved.id, confirmationEmailSent: studentRes.sent };
  if (submissionId) rememberSubmission(submissionId, result);
  return NextResponse.json(result);
}
