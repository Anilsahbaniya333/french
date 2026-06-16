"use client";

import { useState } from "react";

interface Props {
  contactEmail?: string;
}

export default function ContactForm({ contactEmail }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("loading");
    setMessage("");

    const payload = {
      fullName: data.get("fullName") as string,
      email: data.get("email") as string,
      message: data.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setStatus("success");
        setMessage("Message sent! We'll get back to you soon.");
        form.reset();
        return;
      }

      setStatus("error");
      setMessage(json.error || "Could not send message. Please try again.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again or email us directly.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <label htmlFor="message" className="block text-sm font-medium text-slate-700">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="How can we help you?"
        />
      </div>

      {status === "success" && (
        <p className="text-sm text-green-600">{message}</p>
      )}

      {status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 space-y-1">
          <p>{message}</p>
          {contactEmail && (
            <p>
              You can also reach us directly at{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-medium underline hover:text-red-900"
              >
                {contactEmail}
              </a>
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
