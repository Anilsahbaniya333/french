"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { authButton, authInput } from "@/components/student/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/student/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("done");
        setMessage(json.message);
      } else {
        setState("error");
        setMessage(json.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you use for the Student Portal and we'll send you a reset link."
      footer={
        <Link href="/student/login" className="font-semibold text-amber-700 hover:underline">
          ← Back to Student Login
        </Link>
      }
    >
      {state === "done" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInput}
              placeholder="you@example.com"
            />
          </div>
          {state === "error" && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {message}
            </p>
          )}
          <button type="submit" disabled={state === "loading"} className={authButton}>
            {state === "loading" ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
