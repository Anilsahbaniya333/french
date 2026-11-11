"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell, { authButton, authInput } from "@/components/student/AuthShell";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: params.get("email") ?? "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const justSet = params.get("password") === "set";

  // Only allow redirects back into the student dashboard (no open redirects).
  const redirect = params.get("redirect");
  const target = redirect && redirect.startsWith("/student/dashboard") ? redirect : "/student/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Login failed");
        return;
      }
      router.replace(target);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Student Login"
      subtitle="For enrolled students. Sign in to your classes, recordings and materials."
      footer={
        <>
          New to Mappell French?{" "}
          <Link href="/courses" className="font-semibold text-amber-700 hover:underline">
            Explore our courses
          </Link>{" "}
          and{" "}
          <Link href="/register" className="font-semibold text-amber-700 hover:underline">
            register
          </Link>
          .
        </>
      }
    >
      {justSet && (
        <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          Your password has been set. Sign in to continue.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className={authInput}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <Link href="/student/forgot-password" className="text-xs font-semibold text-amber-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className={authInput}
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
        Recently registered? Your account is activated once our admissions team verifies your payment — you&apos;ll
        receive an email with a link to set your password.
      </p>
    </AuthShell>
  );
}
