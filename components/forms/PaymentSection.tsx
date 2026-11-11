"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ADMISSIONS_EMAIL, type CoursePackage } from "@/data/courses";

export const PAYMENT_EMAIL = ADMISSIONS_EMAIL;

const MAX_INPUT_BYTES = 40 * 1024 * 1024; // what we accept from the device (before compression)
const MAX_UPLOAD_BYTES = 9.5 * 1024 * 1024; // what we send (server limit is 10 MB)
const MAX_SIDE = 2000; // px — plenty to read an e-Transfer confirmation
const PASSTHROUGH = ["image/jpeg", "image/png", "image/webp"];

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

async function decode(file: File): Promise<{ draw: CanvasImageSource; w: number; h: number; close?: () => void }> {
  try {
    const bmp = await createImageBitmap(file);
    return { draw: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
  } catch {
    // Fallback for browsers whose createImageBitmap can't handle the format
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { draw: img, w: img.naturalWidth, h: img.naturalHeight };
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}

/**
 * Accept any image the browser can read (PNG, JPG, WebP, GIF, BMP, AVIF, HEIC on Safari…)
 * and, if needed, convert/shrink it to a JPEG the server accepts. Small JPG/PNG/WebP pass through untouched.
 */
export async function prepareImage(file: File): Promise<File> {
  if (file.size > MAX_INPUT_BYTES) throw new Error("That file is very large. Please upload a screenshot instead.");

  // Always decode first: this proves the file really is a readable image (not a renamed/corrupt file).
  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    if (isHeic(file)) {
      throw new Error("This iPhone photo format (HEIC) can't be opened here. Please take a screenshot of the confirmation and upload that instead.");
    }
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      throw new Error("PDFs aren't supported — please take a screenshot of the confirmation and upload the image.");
    }
    throw new Error("We couldn't read this file as an image. Please upload a screenshot (PNG or JPG).");
  }

  // Small JPG/PNG/WebP that decoded fine: send the original untouched.
  if (PASSTHROUGH.includes(file.type) && file.size <= 4 * 1024 * 1024) {
    decoded.close?.();
    return file;
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(decoded.w, decoded.h));
  const w = Math.max(1, Math.round(decoded.w * scale));
  const h = Math.max(1, Math.round(decoded.h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process this image. Please try a different one.");
  ctx.fillStyle = "#ffffff"; // flatten transparency
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(decoded.draw, 0, 0, w, h);
  decoded.close?.();

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("Your browser couldn't process this image. Please try a different one.");
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("This image is too large even after compression. Please upload a screenshot.");
  const base = (file.name || "payment-confirmation").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

export default function PaymentSection({
  course,
  file,
  onFile,
  error,
}: {
  course: CoursePackage | undefined;
  file: File | null;
  onFile: (f: File | null, error?: string) => void;
  error?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  // Preview URL. Kept alive while the file is selected; revoked when replaced/unmounted.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) setTimeout(() => URL.revokeObjectURL(preview), 1000);
    };
  }, [preview]);

  async function pick(f: File | undefined | null) {
    if (!f) return;
    setProcessing(true);
    try {
      onFileRef.current(await prepareImage(f));
    } catch (e) {
      onFileRef.current(null, e instanceof Error ? e.message : "We couldn't use this file.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  const pickRef = useRef(pick);
  pickRef.current = pick;

  // Paste a screenshot from the clipboard (Ctrl+V / ⌘V) anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      if (!item) return;
      e.preventDefault();
      pickRef.current(item);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(PAYMENT_EMAIL);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = PAYMENT_EMAIL;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* ── Compact payment box ──────────────────────── */}
      <div className="rounded-2xl border border-navy-100 bg-navy-50/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-slate-600">
            Send by <strong className="font-semibold text-navy-900">Interac e-Transfer</strong>
          </p>
          <p className="text-xl font-bold text-navy-900">
            {course ? `CAD ${course.priceLabel}` : "Choose a course"}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-all rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900">
            {PAYMENT_EMAIL}
          </span>
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {copied ? "✓ Copied" : "Copy email"}
          </button>
          <span className="sr-only" aria-live="polite">{copied ? "Payment email copied" : ""}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          Put your <strong>full name</strong> in the payment message, then upload a screenshot of the confirmation below.
          We confirm your enrollment once the payment is verified.
        </p>
      </div>

      {/* ── Upload ───────────────────────────────────── */}
      <div>
        <input
          ref={inputRef}
          id="paymentProof"
          type="file"
          accept="image/*,.heic,.heif"
          className="sr-only"
          aria-labelledby="paymentProof-label"
          aria-invalid={!!error}
          aria-describedby={error ? "paymentProof-error" : undefined}
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {file && preview ? (
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={preview} alt="Preview of your payment confirmation" className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 bg-white object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-800">✓ Screenshot added</p>
              <p className="truncate text-xs text-slate-600">
                {file.name} · {formatSize(file.size)}
              </p>
              <div className="mt-2 flex gap-3 text-xs font-semibold">
                <button type="button" onClick={() => inputRef.current?.click()} className="text-navy-800 hover:underline">
                  Replace
                </button>
                <button type="button" onClick={() => onFile(null)} className="text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            aria-labelledby="paymentProof-label"
            aria-describedby="paymentProof-hint"
            disabled={processing}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-4 py-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-wait ${
              error
                ? "border-red-300 bg-red-50/40"
                : dragging
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50/50"
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600" aria-hidden="true">
              {processing ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-navy-900">
                {processing ? "Preparing image…" : "Upload payment screenshot"}
              </span>
              <span id="paymentProof-hint" className="block text-xs text-slate-500">
                Tap to choose a photo · drag & drop · or paste (Ctrl+V)
              </span>
            </span>
          </button>
        )}
        {error && (
          <p id="paymentProof-error" className="mt-2 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
