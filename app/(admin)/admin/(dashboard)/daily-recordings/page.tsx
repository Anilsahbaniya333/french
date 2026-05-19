"use client";

import { useEffect, useRef, useState } from "react";

interface Group {
  id: string;
  group_name: string;
  level_code: string | null;
}

interface Recording {
  id: string;
  group_id: string | null;
  title: string;
  class_date: string | null;
  description: string | null;
  video_url: string | null;
  file_url: string | null;
  file_name: string | null;
  special_instructions: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  groups?: { group_name: string } | null;
}

type RForm = {
  group_id: string;
  title: string;
  class_date: string;
  description: string;
  video_url: string;
  file_url: string | null;
  file_name: string | null;
  special_instructions: string;
  is_published: boolean;
  sort_order: number;
};

const BLANK: RForm = {
  group_id: "", title: "", class_date: "", description: "",
  video_url: "", file_url: null, file_name: null,
  special_instructions: "", is_published: true, sort_order: 0,
};

// ── Stable top-level component — must NOT be defined inside the page function ──
function FormFields({
  form,
  setForm,
  file,
  setFile,
  fileRef,
  groups,
}: {
  form: RForm;
  setForm: (patch: Partial<RForm>) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  groups: Group[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ title: e.target.value })}
            placeholder="e.g. A1 Class — Greetings & Introduction"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Group <span className="text-red-500">*</span>
          </label>
          <select
            value={form.group_id}
            onChange={(e) => setForm({ group_id: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
          >
            <option value="">Select group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name}{g.level_code ? ` (${g.level_code.toUpperCase()})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Class Date</label>
          <input
            type="date"
            value={form.class_date}
            onChange={(e) => setForm({ class_date: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Sort Order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ sort_order: parseInt(e.target.value) || 0 })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ description: e.target.value })}
          placeholder="What was covered in this class?"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Video URL</label>
        <input
          type="url"
          value={form.video_url}
          onChange={(e) => setForm({ video_url: e.target.value })}
          placeholder="YouTube, Vimeo, OneDrive, SharePoint, Teams, or Google Drive link"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
        />
        <p className="mt-1 text-xs text-slate-400">YouTube/Vimeo embed automatically. Drive/OneDrive/Teams shows a Watch button.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Attach File
          <span className="ml-1.5 font-normal text-slate-400">(PDF, DOC, DOCX, PPT, PPTX — max 50 MB)</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-amber-700 hover:file:bg-amber-200 focus:outline-none transition"
        />
        {file && (
          <p className="mt-1 text-xs text-green-600 font-medium">
            Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        )}
        {!file && form.file_name && (
          <p className="mt-1 text-xs text-slate-500">Current: {form.file_name}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Special Instructions</label>
        <textarea
          rows={3}
          value={form.special_instructions}
          onChange={(e) => setForm({ special_instructions: e.target.value })}
          placeholder="Homework, review notes, or reminders for students…"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 transition"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={form.is_published}
            onChange={(e) => setForm({ is_published: e.target.checked })}
          />
          <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-amber-500 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-4" />
        </label>
        <span className="text-sm font-medium text-slate-700">Published (visible to students)</span>
      </div>
    </div>
  );
}

export default function DailyRecordingsAdminPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [groups, setGroups]         = useState<Group[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterGroup, setFilterGroup] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<RForm>(BLANK);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [creating, setCreating]     = useState(false);
  const [createMsg, setCreateMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForms, setEditForms]   = useState<Record<string, RForm>>({});
  const [editFiles, setEditFiles]   = useState<Record<string, File | null>>({});
  const [saving, setSaving]         = useState<Record<string, boolean>>({});
  const [saveMsg, setSaveMsg]       = useState<Record<string, { type: "ok" | "err"; text: string }>>({});
  const [deleting, setDeleting]     = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const [recRes, grpRes] = await Promise.all([
      fetch("/api/admin/daily-recordings").then((r) => r.json()).catch(() => ({ recordings: [] })),
      fetch("/api/groups").then((r) => r.json()).catch(() => ({ groups: [] })),
    ]);
    setRecordings(recRes.recordings ?? []);
    setGroups(grpRes.groups ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function uploadFile(file: File, groupId: string): Promise<{ file_url: string; file_name: string } | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("group_id", groupId);
    const res  = await fetch("/api/admin/daily-recordings/upload", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { alert(json.error ?? "File upload failed"); return null; }
    return { file_url: json.file_url, file_name: json.file_name };
  }

  async function createRecording() {
    if (!createForm.title.trim())   { setCreateMsg({ type: "err", text: "Title is required" }); return; }
    if (!createForm.group_id)       { setCreateMsg({ type: "err", text: "Please select a group" }); return; }
    setCreating(true);
    setCreateMsg(null);

    let file_url = createForm.file_url;
    let file_name = createForm.file_name;

    if (createFile) {
      const up = await uploadFile(createFile, createForm.group_id);
      if (!up) { setCreating(false); return; }
      file_url  = up.file_url;
      file_name = up.file_name;
    }

    const res  = await fetch("/api/admin/daily-recordings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createForm, file_url, file_name }),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && json.recording) {
      setRecordings((prev) => [json.recording, ...prev]);
      setCreateForm(BLANK);
      setCreateFile(null);
      if (createFileRef.current) createFileRef.current.value = "";
      setShowCreate(false);
      setCreateMsg({ type: "ok", text: "Recording created!" });
    } else {
      setCreateMsg({ type: "err", text: json.error ?? "Failed to create" });
    }
    setCreating(false);
  }

  function initEdit(r: Recording) {
    setEditForms((prev) => ({
      ...prev,
      [r.id]: {
        group_id: r.group_id ?? "",
        title: r.title,
        class_date: r.class_date ?? "",
        description: r.description ?? "",
        video_url: r.video_url ?? "",
        file_url: r.file_url,
        file_name: r.file_name,
        special_instructions: r.special_instructions ?? "",
        is_published: r.is_published,
        sort_order: r.sort_order,
      },
    }));
    setEditFiles((prev) => ({ ...prev, [r.id]: null }));
  }

  function patchEdit(id: string, patch: Partial<RForm>) {
    setEditForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveRecording(id: string) {
    const form = editForms[id];
    if (!form?.title?.trim()) { setSaveMsg((p) => ({ ...p, [id]: { type: "err", text: "Title required" } })); return; }
    setSaving((p) => ({ ...p, [id]: true }));

    let file_url  = form.file_url;
    let file_name = form.file_name;
    const newFile = editFiles[id];

    if (newFile) {
      const up = await uploadFile(newFile, form.group_id);
      if (!up) { setSaving((p) => ({ ...p, [id]: false })); return; }
      file_url  = up.file_url;
      file_name = up.file_name;
    }

    const res  = await fetch(`/api/admin/daily-recordings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, file_url, file_name }),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && json.recording) {
      setRecordings((prev) => prev.map((r) => (r.id === id ? json.recording : r)));
      setSaveMsg((p) => ({ ...p, [id]: { type: "ok", text: "Saved!" } }));
    } else {
      setSaveMsg((p) => ({ ...p, [id]: { type: "err", text: json.error ?? "Save failed" } }));
    }
    setSaving((p) => ({ ...p, [id]: false }));
    setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[id]; return n; }), 3000);
  }

  async function deleteRecording(id: string) {
    if (!confirm("Delete this recording permanently?")) return;
    setDeleting((p) => ({ ...p, [id]: true }));
    const res = await fetch(`/api/admin/daily-recordings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } else {
      alert("Delete failed");
    }
    setDeleting((p) => ({ ...p, [id]: false }));
  }

  async function togglePublished(id: string, current: boolean) {
    const res  = await fetch(`/api/admin/daily-recordings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !current }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.recording) {
      setRecordings((prev) => prev.map((r) => (r.id === id ? json.recording : r)));
    }
  }

  const displayed = filterGroup
    ? recordings.filter((r) => r.group_id === filterGroup)
    : recordings;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Daily Recordings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Post class recordings and materials for student groups.</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateMsg(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Recording
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-slate-800">New Recording Post</h2>
          <FormFields
            form={createForm}
            setForm={(p) => setCreateForm((f) => ({ ...f, ...p }))}
            file={createFile}
            setFile={setCreateFile}
            fileRef={createFileRef}
            groups={groups}
          />
          {createMsg && (
            <p className={`mt-4 text-sm font-medium ${createMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {createMsg.text}
            </p>
          )}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={createRecording}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              {creating ? (
                <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating…</>
              ) : "Create Recording"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateForm(BLANK); setCreateFile(null); setCreateMsg(null); }}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Group filter */}
      {groups.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500">Filter by group:</label>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none shadow-sm"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.group_name}</option>
            ))}
          </select>
          {filterGroup && (
            <button onClick={() => setFilterGroup("")} className="text-xs text-slate-400 hover:text-slate-700 underline">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
        </div>
      )}

      {/* Empty */}
      {!loading && displayed.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="font-bold text-slate-700">No recordings yet</p>
          <p className="mt-1 text-sm text-slate-400">Click &ldquo;New Recording&rdquo; to post your first class recording.</p>
        </div>
      )}

      {/* List */}
      {!loading && displayed.length > 0 && (
        <div className="space-y-3">
          {displayed.map((rec) => {
            const isOpen = expandedId === rec.id;
            const form   = editForms[rec.id];
            return (
              <div key={rec.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      if (!isOpen) initEdit(rec);
                      setExpandedId(isOpen ? null : rec.id);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-800 text-sm">{rec.title}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${rec.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {rec.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {rec.groups?.group_name ?? "—"} · {fmtDate(rec.class_date)}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => togglePublished(rec.id, rec.is_published)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                      title={rec.is_published ? "Unpublish" : "Publish"}
                    >
                      {rec.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => deleteRecording(rec.id)}
                      disabled={deleting[rec.id]}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      {deleting[rec.id] ? "…" : "Delete"}
                    </button>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform cursor-pointer ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      onClick={() => { if (!isOpen) initEdit(rec); setExpandedId(isOpen ? null : rec.id); }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Edit form */}
                {isOpen && form && (
                  <div className="border-t border-slate-100 px-5 py-5">
                    <FormFields
                      form={form}
                      setForm={(p) => patchEdit(rec.id, p)}
                      file={editFiles[rec.id] ?? null}
                      setFile={(f) => setEditFiles((prev) => ({ ...prev, [rec.id]: f }))}
                      fileRef={{ current: null }}
                      groups={groups}
                    />
                    {saveMsg[rec.id] && (
                      <p className={`mt-3 text-sm font-medium ${saveMsg[rec.id].type === "ok" ? "text-green-600" : "text-red-600"}`}>
                        {saveMsg[rec.id].text}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => saveRecording(rec.id)}
                        disabled={saving[rec.id]}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
                      >
                        {saving[rec.id] ? (
                          <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</>
                        ) : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setExpandedId(null)}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
