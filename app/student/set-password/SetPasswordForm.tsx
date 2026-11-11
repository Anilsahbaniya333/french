"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, { authButton, authInput } from "@/components/student/AuthShell";

type Check = { state: "checking" } | { state: "valid"; email: string; purpose: string } | { state: "invalid"; error: string };

export default function SetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [check, setCheck] = useState<Check>(token ? { state: "checking" } : { state: "invalid", error: "This link is missing its token." });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/student/set-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setCheck(j.valid ? { state: "valid", email: j.email, purpose: j.purpose } : { state: "invalid", error: j.error });
      })
      .catch(() => !cancelled && setCheck({ state: "invalid", error: "Couldn't verify the link. Please try again." }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return setError("Use at least one letter and one number.");
    if (password !== confirm) return setError("Passwords don't match.");
    setSaving(true);
    try {
      const res = await fetch("/api/student/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not set your password.");
        return;
      }
      router.replace(`/student/login?password=set&email=${encodeURIComponent(json.email ?? "")}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isSetup = check.state === "valid" && check.purpose === "setup";

  return (
    <AuthShell
      title={isSetup ? "Create your password" : "Choose a new password"}
      subtitle={check.state === "valid" ? <>For <strong className="text-navy-900">{check.email}</strong></> : undefined}
      footer={
        <Link href="/student/login" className="font-semibold text-amber-700 hover:underline">
          ← Back to Student Login
        </Link>
      }
    >
      {check.state === "checking" && <p className="text-center text-sm text-slate-500">Checking your link…</p>}

      {check.state === "invalid" && (
        <div className="space-y-4">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {check.error}
          </p>
          <Link href="/student/forgot-password" className={authButton}>
            Request a new link
          </Link>
        </div>
      )}

      {check.state === "valid" && (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInput}
              aria-describedby="pw-hint"
            />
            <p id="pw-hint" className="mt-1 text-xs text-slate-500">
              At least 8 characters, including a letter and a number.
            </p>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={authInput}
            />
          </div>
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={saving} className={authButton}>
            {saving ? "Saving…" : isSetup ? "Create password" : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
