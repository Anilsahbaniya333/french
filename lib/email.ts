/**
 * Transactional email via Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 * No SDK dependency — a single fetch call.
 *
 * Env vars:
 *   RESEND_API_KEY       — required to send. If missing, sends are skipped (reported, never faked).
 *   EMAIL_FROM           — e.g. "Mappell French <admissions@mappell.com>". The domain must be
 *                          verified in Resend. Defaults to Resend's test sender, which can only
 *                          deliver to the Resend account owner's address.
 *   ADMISSIONS_EMAIL     — where new-registration notifications go. Defaults to frenchclass357@gmail.com.
 */

import { ADMISSIONS_EMAIL } from "@/data/courses";

export interface SendResult {
  sent: boolean;
  skipped?: boolean;
  error?: string;
}

export function getAdmissionsEmail(): string {
  return process.env.ADMISSIONS_EMAIL?.trim() || ADMISSIONS_EMAIL;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { sent: false, skipped: true, error: "RESEND_API_KEY not configured" };

  const from = process.env.EMAIL_FROM?.trim() || "Mappell French <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
