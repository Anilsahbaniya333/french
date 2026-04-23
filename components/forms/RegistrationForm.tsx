"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const LEVELS = ["A1", "A2", "B1", "B2"];
const MODES = ["Online", "Offline", "Hybrid"];

interface RegistrationFormProps {
  defaultLevel?: string;
}

export default function RegistrationForm({ defaultLevel = "" }: RegistrationFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Validate payment screenshot
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setMessage("Please upload your payment screenshot.");
      return;
    }

    setStatus("loading");
    setMessage("");

    // Send as FormData (no JSON.stringify — file needs multipart)
    const res = await fetch("/api/register", {
      method: "POST",
      body: data,
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.success) {
      setStatus("success");
      setMessage("Registration submitted successfully. We'll review your payment and get in touch soon!");
      form.reset();
      setPreview(null);
      setFileName(null);
      return;
    }

    setStatus("error");
    setMessage(
      json.error ||
        "Could not submit. Check that Supabase is configured in .env.local and try again."
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-800">Registration received!</h3>
        <p className="mt-2 text-sm text-green-700">{message}</p>
        <button
          onClick={() => { setStatus("idle"); setMessage(""); }}
          className="mt-6 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Personal info ─────────────────────────────── */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
          Phone *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="level" className="block text-sm font-medium text-slate-700">
          Level *
        </label>
        <select
          id="level"
          name="level"
          required
          defaultValue={defaultLevel.toUpperCase()}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">Select a level</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* ── Background & preferences ───────────────────── */}
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-slate-700">
          French experience
        </label>
        <textarea
          id="experience"
          name="experience"
          rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Any prior French experience?"
        />
      </div>

      <div>
        <label htmlFor="preferredMode" className="block text-sm font-medium text-slate-700">
          Preferred mode
        </label>
        <select
          id="preferredMode"
          name="preferredMode"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">Select</option>
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="preferredTime" className="block text-sm font-medium text-slate-700">
          Preferred time
        </label>
        <input
          type="text"
          id="preferredTime"
          name="preferredTime"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="e.g. Mornings, Weekends"
        />
      </div>

      <div>
        <label htmlFor="goals" className="block text-sm font-medium text-slate-700">
          Goals
        </label>
        <textarea
          id="goals"
          name="goals"
          rows={2}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="What do you want to achieve?"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="Any questions or comments?"
        />
      </div>

      {/* ── Payment screenshot ─────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Payment screenshot *
        </label>
        <p className="mb-2 text-xs text-slate-500">
          Upload a screenshot of your payment confirmation (JPG, PNG or WebP, max 10 MB).
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 transition hover:border-amber-400 hover:bg-amber-50"
        >
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-white">
                <Image
                  src={preview}
                  alt="Payment screenshot preview"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-slate-600">{fileName}</p>
              <p className="text-xs text-amber-600 underline">Click to change</p>
            </div>
          ) : (
            <>
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-600">Click to upload payment screenshot</p>
              <p className="mt-1 text-xs text-slate-400">JPG, PNG, WebP — up to 10 MB</p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          name="paymentScreenshot"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Status message ─────────────────────────────── */}
      {message && status === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {status === "loading" ? "Submitting…" : "Submit registration"}
      </button>
    </form>
  );
}
