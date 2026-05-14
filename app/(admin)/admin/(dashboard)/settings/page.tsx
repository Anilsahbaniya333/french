"use client";

import { useState, useEffect } from "react";

interface Settings {
  contact_email: string;
  contact_phone: string;
  contact_phone_2: string;
  contact_address: string;
}

const BLANK: Settings = { contact_email: "", contact_phone: "", contact_phone_2: "", contact_address: "" };

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Settings>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings({ ...BLANK, ...d.settings }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    setMsg(res.ok ? { type: "ok", text: "Settings saved!" } : { type: "err", text: json.error || "Save failed." });
    if (res.ok) setTimeout(() => setMsg(null), 3000);
  };

  const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none";
  const lbl = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">Site Settings</h1>
      <p className="mt-1 text-slate-500">Contact details displayed on the website and footer.</p>

      {loading ? (
        <p className="mt-8 text-slate-400">Loading…</p>
      ) : (
        <div className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <label className={lbl}>Contact Email</label>
            <input
              type="email"
              value={settings.contact_email}
              onChange={(e) => setSettings((p) => ({ ...p, contact_email: e.target.value }))}
              placeholder="info@mappelefrench.com"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Phone Number (Primary)</label>
            <input
              value={settings.contact_phone}
              onChange={(e) => setSettings((p) => ({ ...p, contact_phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Phone Number (Secondary — optional)</label>
            <input
              value={settings.contact_phone_2}
              onChange={(e) => setSettings((p) => ({ ...p, contact_phone_2: e.target.value }))}
              placeholder="+91 98765 43211"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Address / Location (optional)</label>
            <textarea
              value={settings.contact_address}
              onChange={(e) => setSettings((p) => ({ ...p, contact_address: e.target.value }))}
              rows={3}
              placeholder="123 Main Street, City, State"
              className={inp}
            />
          </div>

          {msg && (
            <div className={`rounded-lg px-4 py-2 text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {msg.text}
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">Where these appear</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>Contact page — shown alongside the contact form</li>
          <li>Website footer — email and phone displayed at bottom</li>
        </ul>
        <p className="mt-2 text-xs text-blue-500">
          Run <code className="rounded bg-blue-100 px-1">migration_site_settings.sql</code> in Supabase if settings don&apos;t save.
        </p>
      </div>
    </div>
  );
}
