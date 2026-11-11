"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCoursePackage, COURSE_PACKAGES } from "@/data/courses";
import { REGISTRATION_STATUSES, statusLabel } from "@/data/registration-status";

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  level: string;
  experience?: string | null;
  preferredMode?: string | null;
  preferredTime?: string | null;
  goals?: string | null;
  message?: string | null;
  hasPaymentProof?: boolean;
  status?: string;
  createdAt?: string;
  coursePackage?: string | null;
  countryTimezone?: string | null;
  currentLevel?: string | null;
  preferredSchedule?: string | null;
  learningGoal?: string | null;
  consentAt?: string | null;
  adminNotes?: string | null;
  reviewedAt?: string | null;
  studentId?: string | null;
}

interface Details {
  proofUrl: string | null;
  history: { id: string; event: string; from_status: string | null; to_status: string | null; note: string | null; actor: string; created_at: string }[] | null;
  historyAvailable: boolean;
  account: { id: string; is_active: boolean; level_code: string | null; group_uuid: string | null } | null;
}

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
  is_active: boolean | null;
}

const TONES: Record<string, string> = {
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  sky: "bg-sky-50 text-sky-800 border-sky-200",
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  violet: "bg-violet-50 text-violet-800 border-violet-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ status }: { status?: string }) {
  const s = REGISTRATION_STATUSES.find((x) => x.value === (status ?? "pending")) ?? REGISTRATION_STATUSES[0];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[s.tone]}`}>
      {s.label}
    </span>
  );
}

/** Legacy rows packed v2 fields into `message`; pull them back out for display. */
function legacyField(message: string | null | undefined, label: string): string | null {
  const m = message?.match(new RegExp(`^${label}: (.+)$`, "m"));
  return m ? m[1] : null;
}

function courseFor(r: Registration) {
  return (
    getCoursePackage(r.coursePackage) ??
    getCoursePackage(legacyField(r.message, "Course")) ??
    COURSE_PACKAGES.find((c) => c.code === r.level)
  );
}

function fmtDate(d?: string | null, withTime = false) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

type Filter = "all" | (typeof REGISTRATION_STATUSES)[number]["value"];

export default function RegistrationsList() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/registrations", { cache: "no-store" });
      if (!res.ok) {
        setLoadError(res.status === 401 ? "Your admin session has expired. Please sign in again." : "Could not load registrations.");
        return;
      }
      const json = await res.json();
      setRegistrations(json.registrations ?? []);
      setLoadError("");
    } catch {
      setLoadError("Could not load registrations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Deep link from the notification email: /admin/registrations?id=...
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setOpenId(id);
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: registrations.length };
    for (const r of registrations) c[r.status ?? "pending"] = (c[r.status ?? "pending"] ?? 0) + 1;
    return c;
  }, [registrations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registrations.filter(
      (r) =>
        (filter === "all" || (r.status ?? "pending") === filter) &&
        (!q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone.includes(q))
    );
  }, [registrations, filter, query]);

  const open = registrations.find((r) => r.id === openId) ?? null;

  if (loading) return <p className="mt-6 text-slate-500">Loading registrations…</p>;

  return (
    <>
      {loadError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([{ value: "all", label: "All" }, ...REGISTRATION_STATUSES] as { value: Filter; label: string }[]).map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === t.value ? "bg-slate-800 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label} <span className="opacity-70">({counts[t.value] ?? 0})</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or phone"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm lg:w-72"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">No registrations found.</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Student", "Course", "Amount", "Date", "Status", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const c = courseFor(r);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">{r.fullName}</p>
                        <p className="text-xs text-slate-500">{r.email}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{c?.code ?? r.level}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">{c ? c.priceLabel : "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setOpenId(r.id)}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          {(r.status ?? "pending") === "pending" ? "Review" : "View Details"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open && (
        <ReviewPanel
          reg={open}
          onClose={() => {
            setOpenId(null);
            const url = new URL(window.location.href);
            url.searchParams.delete("id");
            window.history.replaceState(null, "", url);
          }}
          onChanged={load}
        />
      )}
      {openId && !open && !loading && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-slate-800 px-4 py-3 text-sm text-white shadow-lg">
          Registration not found.{" "}
          <button className="underline" onClick={() => setOpenId(null)}>
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

/* ── Review panel ─────────────────────────────────────────────────────── */

function ReviewPanel({ reg, onClose, onChanged }: { reg: Registration; onClose: () => void; onChanged: () => Promise<void> }) {
  const course = courseFor(reg);
  const status = reg.status ?? "pending";
  const [details, setDetails] = useState<Details | null>(null);
  const [detailsError, setDetailsError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [mode, setMode] = useState<null | "info" | "reject" | "approve">(null);
  const [note, setNote] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [level, setLevel] = useState("a1");
  const [groupUuid, setGroupUuid] = useState("");
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/registrations/${reg.id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDetails(json);
      if (json.account?.level_code) setLevel(json.account.level_code);
      if (json.account?.group_uuid) setGroupUuid(json.account.group_uuid);
    } catch (e) {
      setDetailsError(e instanceof Error && e.message ? e.message : "Could not load details.");
    }
  }, [reg.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    if (mode !== "approve" || groups.length) return;
    fetch("/api/admin/manage-groups")
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((j) => setGroups((j.groups ?? []).filter((g: Group) => g.is_active !== false)))
      .catch(() => setGroups([]));
  }, [mode, groups.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function changeStatus(next: string, withNote = "") {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/registrations/${reg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note: withNote }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      const emailNote =
        json.emailSent === true ? " The student was emailed." : json.emailSent === false ? " ⚠ The email to the student was NOT sent (email service not configured) — contact them directly." : "";
      setNotice({ kind: "ok", text: `Status set to “${statusLabel(next)}”.${emailNote}` });
      setMode(null);
      setNote("");
      await Promise.all([onChanged(), loadDetails()]);
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Update failed" });
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/registrations/${reg.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level_code: level, group_uuid: groupUuid || null, note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Activation failed");
      setSetupUrl(json.setupUrl ?? null);
      setNotice({
        kind: "ok",
        text: `${json.existingAccount ? "Existing student account re-activated and linked." : "Student account created and activated."} ${
          json.emailSent
            ? "Welcome email sent."
            : json.setupUrl
              ? "⚠ Welcome email NOT sent (email service not configured). Send the password-setup link below to the student yourself."
              : "⚠ Welcome email NOT sent (email service not configured). Let the student know they can sign in with their existing account."
        }`,
      });
      setMode(null);
      setNote("");
      await Promise.all([onChanged(), loadDetails()]);
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Activation failed" });
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, React.ReactNode][] = [
    ["Full name", reg.fullName],
    ["Email", <a key="e" href={`mailto:${reg.email}`} className="text-amber-700 hover:underline">{reg.email}</a>],
    ["Phone", reg.phone],
    ["Country / time zone", reg.countryTimezone ?? legacyField(reg.message, "Country / time zone") ?? "—"],
    ["Selected course", course?.name ?? reg.level],
    ["Course fee", course ? `CAD ${course.priceLabel}` : "—"],
    ["Current French level", reg.currentLevel ?? reg.experience ?? "—"],
    ["Preferred schedule", reg.preferredSchedule ?? reg.preferredTime ?? "—"],
    ["Learning goal", reg.learningGoal ?? reg.goals ?? "—"],
    ["Registration date", fmtDate(reg.createdAt, true)],
    ["Consent to contact", reg.consentAt ? fmtDate(reg.consentAt, true) : legacyField(reg.message, "Consent to be contacted") ? "Yes" : "—"],
  ];
  const comments = reg.message?.replace(/^(Course|Country \/ time zone|Consent to be contacted): .*$\n?/gm, "").trim();

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <button className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 id="review-title" className="text-lg font-bold text-slate-800">{reg.fullName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              {details?.account && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${details.account.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                  Portal account {details.account.is_active ? "active" : "inactive"}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close panel">
            ✕
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {notice && (
            <p className={`rounded-lg border px-4 py-3 text-sm ${notice.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="status">
              {notice.text}
            </p>
          )}

          {setupUrl && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Password-setup link (single use, expires in 7 days)</p>
              <p className="mt-1 break-all font-mono text-xs text-amber-900">{setupUrl}</p>
              <button
                className="mt-2 rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                onClick={async () => {
                  await navigator.clipboard.writeText(setupUrl).catch(() => undefined);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <p className="mt-2 text-xs text-amber-800">Share only with the student ({reg.email}). Never send passwords in plain text.</p>
            </div>
          )}

          {/* Payment proof */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800">Payment screenshot</h3>
            <p className="text-xs text-slate-500">
              Verify the Interac e-Transfer of {course ? `CAD ${course.priceLabel}` : "the course fee"} from {reg.fullName} arrived in the{" "}
              admissions account before approving. A screenshot alone is not proof of payment.
            </p>
            <div className="mt-3">
              {!details && !detailsError && <p className="text-sm text-slate-400">Loading…</p>}
              {detailsError && <p className="text-sm text-red-600">{detailsError}</p>}
              {details && details.proofUrl && (
                <a href={details.proofUrl} target="_blank" rel="noopener noreferrer" className="block" title="Open full size (link expires in 10 minutes)">
                  {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                  <img src={details.proofUrl} alt={`Payment confirmation from ${reg.fullName}`} className="max-h-96 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />
                  <span className="mt-1 block text-xs text-amber-700">Open full size ↗</span>
                </a>
              )}
              {details && !details.proofUrl && (
                <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  {reg.hasPaymentProof ? "The screenshot could not be loaded." : "No payment screenshot was uploaded with this registration."}
                </p>
              )}
            </div>
          </section>

          {/* Details */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800">Student details</h3>
            <dl className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="col-span-2 break-words text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            {comments && (
              <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">Questions / comments</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{comments}</p>
              </div>
            )}
            {reg.adminNotes && (
              <div className="mt-3 rounded-lg bg-violet-50 px-4 py-3">
                <p className="text-xs font-semibold text-violet-700">Latest admin note</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-violet-900">{reg.adminNotes}</p>
              </div>
            )}
          </section>

          {/* Actions */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800">Actions</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {status !== "payment_verified" && status !== "approved" && (
                <button disabled={busy} onClick={() => changeStatus("payment_verified")} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                  Mark payment verified
                </button>
              )}
              <button disabled={busy} onClick={() => setMode(mode === "approve" ? null : "approve")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {status === "approved" ? "Re-send access / update batch" : "Approve & activate account"}
              </button>
              <button disabled={busy} onClick={() => setMode(mode === "info" ? null : "info")} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                Request more information
              </button>
              {status !== "rejected" && (
                <button disabled={busy} onClick={() => setMode(mode === "reject" ? null : "reject")} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50">
                  Reject
                </button>
              )}
              {status !== "pending" && status !== "approved" && (
                <button disabled={busy} onClick={() => changeStatus("pending")} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50">
                  Back to pending
                </button>
              )}
            </div>

            {mode === "approve" && (
              <div className="mt-3 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                {status !== "payment_verified" && status !== "approved" && (
                  <p className="text-xs font-semibold text-amber-800">⚠ Payment hasn&apos;t been marked as verified yet. Only approve once the e-Transfer has arrived.</p>
                )}
                <p className="text-sm text-slate-700">
                  {details?.account
                    ? "This email already has a portal account — it will be re-activated and linked (no duplicate account, password unchanged)."
                    : "A new portal account will be created. The student receives a secure single-use link to set their own password."}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Starting level
                    <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                      {["a1", "a2", "b1", "b2"].map((l) => (
                        <option key={l} value={l}>
                          {l.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Batch / group (optional)
                    <select value={groupUuid} onChange={(e) => setGroupUuid(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                      <option value="">Assign later</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.group_name}
                          {g.level_code ? ` (${g.level_code.toUpperCase()})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-xs font-semibold text-slate-600">
                  Internal note (optional)
                  <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. e-Transfer ref #12345 received" />
                </label>
                <button disabled={busy} onClick={approve} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {busy ? "Activating…" : "Confirm approval & activate"}
                </button>
              </div>
            )}

            {(mode === "info" || mode === "reject") && (
              <div className={`mt-3 space-y-3 rounded-lg border p-4 ${mode === "info" ? "border-violet-200 bg-violet-50/60" : "border-red-200 bg-red-50/60"}`}>
                <label className="block text-xs font-semibold text-slate-600">
                  {mode === "info" ? "What do you need from the student? (emailed to them)" : "Reason (optional, emailed to the student)"}
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <button
                  disabled={busy || (mode === "info" && !note.trim())}
                  onClick={() => changeStatus(mode === "info" ? "info_required" : "rejected", note)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${mode === "info" ? "bg-violet-600 hover:bg-violet-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {busy ? "Saving…" : mode === "info" ? "Send request" : "Confirm rejection"}
                </button>
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800">Registration history</h3>
            {details && !details.historyAvailable && (
              <p className="mt-2 text-xs text-slate-500">History tracking starts once supabase/migration_registration_v3.sql has been run.</p>
            )}
            {details?.history && details.history.length === 0 && <p className="mt-2 text-xs text-slate-500">No history recorded yet.</p>}
            {details?.history && details.history.length > 0 && (
              <ol className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                {details.history.map((h) => (
                  <li key={h.id} className="text-sm">
                    <p className="text-slate-800">
                      {h.event === "submitted"
                        ? "Registration submitted"
                        : h.event === "account_activated"
                          ? "Approved & account activated"
                          : `Status: ${statusLabel(h.from_status)} → ${statusLabel(h.to_status)}`}
                    </p>
                    {h.note && <p className="whitespace-pre-wrap text-xs text-slate-500">{h.note}</p>}
                    <p className="text-xs text-slate-400">
                      {fmtDate(h.created_at, true)} · {h.actor}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
