"use client";

import { useState, useEffect, useRef } from "react";
import { getYouTubeId, getVimeoId, isDirectVideo, isRecordingLink, normalizeVimeoUrl } from "@/lib/video-utils";

type TopicTab = "Content" | "Materials" | "Exercises" | "Assignment" | "Preview";
const TOPIC_TABS: TopicTab[] = ["Content", "Materials", "Exercises", "Assignment", "Preview"];

interface Exercise {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  order_index: number;
}

interface Material {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
}

interface Assignment {
  id: string;
  title: string;
  instructions?: string;
  due_date_time?: string;
  max_score?: number;
  target_group_uuids?: string[] | null;
}

interface Group {
  id: string;
  group_name: string;
  level_code?: string | null;
  is_active: boolean;
}

interface Submission {
  id: string;
  student_name: string;
  student_email: string;
  submission_text?: string;
  file_url?: string;
  score?: number;
  feedback?: string;
  status: string;
  submitted_at: string;
}

interface TopicData {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  video_url?: string;
  video_title?: string;
}

interface TopicEditorProps {
  topicId: string;
  topicTitle: string;
  levelId: string;
  onClose: () => void;
}

export default function TopicEditor({ topicId, topicTitle, levelId, onClose }: TopicEditorProps) {
  const [activeTab, setActiveTab] = useState<TopicTab>("Content");
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Content tab
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");

  // Materials tab
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matUploading, setMatUploading] = useState(false);
  const matInputRef = useRef<HTMLInputElement>(null);

  // Exercises tab
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exForm, setExForm] = useState({ question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a", explanation: "" });

  // Assignment tab
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [asgForm, setAsgForm] = useState({ title: "", instructions: "", due_date_time: "", max_score: "100", target_group_uuids: [] as string[] });
  const [groups, setGroups] = useState<Group[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({});

  const showStatus = (type: "success" | "error", msg: string) => {
    setStatus(type);
    setStatusMsg(msg);
    setTimeout(() => setStatus("idle"), type === "error" ? 8000 : 3000);
  };

  // Load topic data
  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    fetch(`/api/admin/topics/${topicId}`)
      .then((r) => r.json())
      .then((data) => {
        setTopic(data);
        setDescription(data.description ?? "");
        setNotes(data.notes ?? "");
        setVideoUrl(data.video_url ?? "");
        setVideoTitle(data.video_title ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topicId]);

  // Load materials when tab active
  useEffect(() => {
    if (activeTab !== "Materials") return;
    fetch(`/api/admin/topics/${topicId}/materials`)
      .then((r) => r.json())
      .then((data) => setMaterials(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [activeTab, topicId]);

  // Load exercises when tab active
  useEffect(() => {
    if (activeTab !== "Exercises") return;
    fetch(`/api/admin/topics/${topicId}/exercises`)
      .then((r) => r.json())
      .then((data) => setExercises(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [activeTab, topicId]);

  // Load assignment + groups when tab active
  useEffect(() => {
    if (activeTab !== "Assignment" && activeTab !== "Preview") return;

    fetch(`/api/admin/topics/${topicId}/assignment`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setAssignment(data);
          setAsgForm({
            title: data.title ?? "",
            instructions: data.instructions ?? "",
            due_date_time: data.due_date_time ? data.due_date_time.slice(0, 16) : "",
            max_score: String(data.max_score ?? 100),
            target_group_uuids: Array.isArray(data.target_group_uuids) ? data.target_group_uuids : [],
          });
        }
      })
      .catch(() => {});

    fetch("/api/admin/manage-groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {});
  }, [activeTab, topicId]);

  // Load submissions when assignment set
  useEffect(() => {
    if (!assignment?.id || activeTab !== "Assignment") return;
    fetch(`/api/admin/assignments/${assignment.id}/submissions`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissions(data);
          const g: Record<string, { score: string; feedback: string }> = {};
          data.forEach((s: Submission) => {
            g[s.id] = { score: String(s.score ?? ""), feedback: s.feedback ?? "" };
          });
          setGrades(g);
        }
      })
      .catch(() => {});
  }, [assignment?.id, activeTab]);

  // ── Content save ──
  const saveContent = async () => {
    setStatus("saving");
    const res = await fetch(`/api/admin/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, notes, video_url: videoUrl || null, video_title: videoTitle || null }),
    });
    if (res.ok) showStatus("success", "Content saved!");
    else { const j = await res.json().catch(() => ({})); showStatus("error", j.error || "Save failed."); }
  };

  // ── Video upload: browser → API route → Supabase Storage (service role) ──
  const videoInputRef = useRef<HTMLInputElement>(null);
  const handleVideoUpload = async (file: File) => {
    console.log(`[video] selected: "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    setUploadProgress(0);

    // Fake progress ticker while upload runs
    let pct = 0;
    const ticker = setInterval(() => {
      pct = Math.min(pct + 2, 90);
      setUploadProgress(pct);
    }, 300);

    try {
      console.log(`[video] uploading to /api/admin/topics/${topicId}/video …`);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/topics/${topicId}/video`, {
        method: "POST",
        body: formData,
      });

      clearInterval(ticker);
      setUploadProgress(95);

      const data = await res.json().catch(() => ({}));
      setUploadProgress(null);

      if (res.ok) {
        console.log(`[video] upload success → ${data.video_url}`);
        setVideoUrl(data.video_url);
        setVideoTitle(data.video_title ?? "");
        showStatus("success", "Video uploaded!");
      } else {
        console.error(`[video] upload failed: ${data.error}`);
        showStatus("error", data.error || "Upload failed.");
      }
    } catch (err) {
      clearInterval(ticker);
      setUploadProgress(null);
      console.error("[video] upload error:", err);
      showStatus("error", "Upload failed. Check console for details.");
    }
  };

  const removeVideo = async () => {
    console.log(`[video] removing from topic=${topicId}`);
    const res = await fetch(`/api/admin/topics/${topicId}/video`, { method: "DELETE" });
    if (res.ok) {
      setVideoUrl("");
      setVideoTitle("");
      showStatus("success", "Video removed.");
    } else {
      const d = await res.json().catch(() => ({}));
      showStatus("error", d.error || "Remove failed.");
    }
  };

  // ── Material upload ──
  const handleMaterialUpload = async (file: File) => {
    setMatUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("levelId", levelId);
    const res = await fetch(`/api/admin/topics/${topicId}/materials`, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setMaterials((prev) => [...prev, data]);
    else showStatus("error", data.error || "Upload failed.");
    setMatUploading(false);
    if (matInputRef.current) matInputRef.current.value = "";
  };

  const deleteMaterial = async (id: string) => {
    const res = await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
    if (res.ok) setMaterials((prev) => prev.filter((m) => m.id !== id));
    else showStatus("error", "Delete failed.");
  };

  // ── Exercise CRUD ──
  const resetExForm = () => setExForm({ question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "a", explanation: "" });

  const saveExercise = async () => {
    if (!exForm.question || !exForm.option_a || !exForm.option_b || !exForm.option_c || !exForm.option_d) {
      showStatus("error", "Fill all fields.");
      return;
    }
    if (editingExercise) {
      const res = await fetch(`/api/admin/exercises/${editingExercise.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...exForm, explanation: exForm.explanation || null }),
      });
      if (res.ok) {
        setExercises((prev) => prev.map((e) => e.id === editingExercise.id ? { ...e, ...exForm } : e));
        showStatus("success", "Exercise updated!");
      } else showStatus("error", "Update failed.");
      setEditingExercise(null);
    } else {
      const res = await fetch(`/api/admin/topics/${topicId}/exercises`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...exForm, explanation: exForm.explanation || null, order_index: exercises.length }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setExercises((prev) => [...prev, data]); showStatus("success", "Exercise added!"); }
      else showStatus("error", data.error || "Add failed.");
    }
    resetExForm();
  };

  const deleteExercise = async (id: string) => {
    const res = await fetch(`/api/admin/exercises/${id}`, { method: "DELETE" });
    if (res.ok) setExercises((prev) => prev.filter((e) => e.id !== id));
    else showStatus("error", "Delete failed.");
  };

  const startEditExercise = (ex: Exercise) => {
    setEditingExercise(ex);
    setExForm({ question: ex.question, option_a: ex.option_a, option_b: ex.option_b, option_c: ex.option_c, option_d: ex.option_d, correct_answer: ex.correct_answer, explanation: ex.explanation ?? "" });
  };

  // ── Assignment CRUD ──
  const saveAssignment = async () => {
    const payload = {
      title: asgForm.title,
      instructions: asgForm.instructions || null,
      due_date_time: asgForm.due_date_time ? new Date(asgForm.due_date_time).toISOString() : null,
      max_score: Number(asgForm.max_score) || 100,
      level_id: levelId,
      target_group_uuids: asgForm.target_group_uuids,
    };
    if (assignment?.id) {
      const res = await fetch(`/api/admin/topics/${topicId}/assignment`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: assignment.id, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setAssignment(data); showStatus("success", "Assignment saved!"); }
      else showStatus("error", data.error || "Save failed.");
    } else {
      const res = await fetch(`/api/admin/topics/${topicId}/assignment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setAssignment(data); showStatus("success", "Assignment created!"); }
      else showStatus("error", data.error || "Create failed.");
    }
  };

  const saveGrade = async (subId: string) => {
    const g = grades[subId];
    if (!g) return;
    const res = await fetch(`/api/admin/submissions/${subId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: g.score ? Number(g.score) : null, feedback: g.feedback || null }),
    });
    if (res.ok) {
      setSubmissions((prev) => prev.map((s) => s.id === subId ? { ...s, score: g.score ? Number(g.score) : undefined, feedback: g.feedback, status: "graded" } : s));
      showStatus("success", "Grade saved!");
    } else showStatus("error", "Grade save failed.");
  };

  if (loading) return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-slate-500">Loading topic editor…</p>
    </div>
  );

  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Topic Editor</p>
          <h3 className="mt-0.5 text-lg font-semibold text-slate-800">{topicTitle}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
        >
          ✕ Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 px-6 pt-3">
        {TOPIC_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${activeTab === tab ? "border-b-2 border-amber-500 text-amber-700" : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Status bar */}
        {status !== "idle" && (
          <div className={`mb-4 rounded-lg px-4 py-2 text-sm font-medium ${status === "success" ? "bg-green-50 text-green-700" : status === "saving" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
            {status === "saving" ? "Saving…" : statusMsg}
          </div>
        )}

        {/* ── Tab: Content ── */}
        {activeTab === "Content" && (
          <div className="space-y-6">
            {/* Video */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Lesson Video</label>
              {videoUrl ? (
                <div className="mt-2">
                  {/* Recording link (OneDrive / SharePoint / Teams) */}
                  {isRecordingLink(videoUrl) ? (
                    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 max-w-lg">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">Recording link set</p>
                        <p className="truncate text-xs text-slate-400">{videoUrl}</p>
                      </div>
                      <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                        Watch
                      </a>
                    </div>
                  ) : /* YouTube */
                  getYouTubeId(videoUrl) ? (
                    <div className="aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-slate-200">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : getVimeoId(videoUrl) ? (
                    /* Vimeo */
                    <div className="aspect-video w-full max-w-lg overflow-hidden rounded-lg border border-slate-200">
                      <iframe
                        className="h-full w-full"
                        src={`https://player.vimeo.com/video/${getVimeoId(videoUrl)}`}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    /* Direct file upload */
                    <video
                      controls
                      src={videoUrl}
                      className="w-full max-w-lg rounded-lg border border-slate-200 bg-black"
                    />
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    {videoTitle && <p className="text-sm text-slate-600 truncate max-w-xs">{videoTitle}</p>}
                    <button type="button" onClick={removeVideo} className="text-xs text-red-500 hover:underline shrink-0">
                      Remove video
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-4">
                  {/* ── Paste a video or recording URL ── */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-600">Paste a video or recording URL</p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="YouTube, Vimeo, OneDrive / SharePoint / Teams recording…"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={!urlInput.trim()}
                        onClick={() => {
                          const raw = urlInput.trim();
                          // Recording links and YouTube stored as-is; Vimeo normalised to embed form
                          const normalised = isRecordingLink(raw) ? raw : normalizeVimeoUrl(raw);
                          setVideoUrl(normalised);
                          setUrlInput("");
                        }}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40"
                      >
                        Set URL
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Supported: YouTube, Vimeo, OneDrive / SharePoint / Teams recording links
                    </p>
                  </div>

                  {/* ── Or upload a file ── */}
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-600">Or upload a video file</p>
                    <p className="mb-1.5 text-xs text-slate-500">mp4 / webm — large files may take a moment.</p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-800 hover:file:bg-amber-200"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleVideoUpload(f);
                        e.target.value = "";
                      }}
                    />
                    {uploadProgress !== null && (
                      <div className="mt-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-amber-500 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{uploadProgress}% — uploading, please wait…</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Topic Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description shown to students…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Lesson Notes</label>
              <p className="text-xs text-slate-500">Full notes, explanations, grammar rules — displayed to students below the video.</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={10}
                placeholder="Write detailed lesson notes here…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={saveContent}
              className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Save Content
            </button>
          </div>
        )}

        {/* ── Tab: Materials ── */}
        {activeTab === "Materials" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Upload Material</label>
              <p className="text-xs text-slate-500">PDF, DOC, DOCX, PPT, PPTX</p>
              <input
                ref={matInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                disabled={matUploading}
                className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-800 hover:file:bg-amber-200 disabled:opacity-50"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMaterialUpload(f); }}
              />
              {matUploading && <p className="mt-1 text-xs text-amber-600">Uploading…</p>}
            </div>

            {materials.length === 0 ? (
              <p className="text-sm text-slate-500">No materials uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {materials.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 uppercase">{m.file_type}</span>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-amber-600">
                        {m.title}
                      </a>
                    </div>
                    <button type="button" onClick={() => deleteMaterial(m.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Tab: Exercises ── */}
        {activeTab === "Exercises" && (
          <div className="space-y-6">
            {/* Form */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">{editingExercise ? "Edit Exercise" : "Add Exercise"}</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Question *</label>
                  <textarea value={exForm.question} onChange={(e) => setExForm((f) => ({ ...f, question: e.target.value }))} rows={2} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["a","b","c","d"] as const).map((opt) => (
                    <div key={opt}>
                      <label className="block text-xs font-medium text-slate-600">Option {opt.toUpperCase()} *</label>
                      <input value={(exForm as Record<string, string>)[`option_${opt}`]} onChange={(e) => setExForm((f) => ({ ...f, [`option_${opt}`]: e.target.value }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Correct Answer *</label>
                    <select value={exForm.correct_answer} onChange={(e) => setExForm((f) => ({ ...f, correct_answer: e.target.value }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm">
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Explanation</label>
                    <input value={exForm.explanation} onChange={(e) => setExForm((f) => ({ ...f, explanation: e.target.value }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={saveExercise} className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600">
                  {editingExercise ? "Update" : "Add Exercise"}
                </button>
                {editingExercise && (
                  <button type="button" onClick={() => { setEditingExercise(null); resetExForm(); }} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            {exercises.length === 0 ? (
              <p className="text-sm text-slate-500">No exercises yet.</p>
            ) : (
              <ul className="space-y-2">
                {exercises.map((ex, i) => (
                  <li key={ex.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-slate-800">{i + 1}. {ex.question}</p>
                      <div className="flex gap-2 ml-4">
                        <button type="button" onClick={() => startEditExercise(ex)} className="text-xs text-slate-500 hover:text-amber-600">Edit</button>
                        <button type="button" onClick={() => deleteExercise(ex.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-600">
                      <span className={ex.correct_answer === "a" ? "font-semibold text-green-700" : ""}>A: {ex.option_a}</span>
                      <span className={ex.correct_answer === "b" ? "font-semibold text-green-700" : ""}>B: {ex.option_b}</span>
                      <span className={ex.correct_answer === "c" ? "font-semibold text-green-700" : ""}>C: {ex.option_c}</span>
                      <span className={ex.correct_answer === "d" ? "font-semibold text-green-700" : ""}>D: {ex.option_d}</span>
                    </div>
                    {ex.explanation && <p className="mt-1 text-xs text-slate-500">💡 {ex.explanation}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Tab: Assignment ── */}
        {activeTab === "Assignment" && (
          <div className="space-y-6">
            {/* Assignment form */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">{assignment ? "Edit Assignment" : "Create Assignment"}</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Title *</label>
                  <input value={asgForm.title} onChange={(e) => setAsgForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Instructions</label>
                  <textarea value={asgForm.instructions} onChange={(e) => setAsgForm((f) => ({ ...f, instructions: e.target.value }))} rows={4} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Due Date & Time</label>
                    <input type="datetime-local" value={asgForm.due_date_time} onChange={(e) => setAsgForm((f) => ({ ...f, due_date_time: e.target.value }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Max Score</label>
                    <input type="number" value={asgForm.max_score} onChange={(e) => setAsgForm((f) => ({ ...f, max_score: e.target.value }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Assign to Groups <span className="text-slate-400 font-normal">(leave all unchecked = visible to all groups)</span>
                  </label>
                  {groups.filter((g) => g.is_active).length === 0 ? (
                    <p className="text-xs text-slate-400">No active groups. Create groups first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {groups.filter((g) => g.is_active).map((g) => {
                        const checked = asgForm.target_group_uuids.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setAsgForm((f) => ({
                              ...f,
                              target_group_uuids: checked
                                ? f.target_group_uuids.filter((x) => x !== g.id)
                                : [...f.target_group_uuids, g.id],
                            }))}
                            className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                              checked
                                ? "border-amber-500 bg-amber-500 text-white"
                                : "border-slate-300 bg-white text-slate-600 hover:border-amber-300"
                            }`}
                          >
                            {g.group_name}
                            {g.level_code && (
                              <span className="ml-1 font-normal opacity-70 uppercase">{g.level_code}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {asgForm.target_group_uuids.length > 0 && (
                    <p className="mt-1.5 text-xs text-amber-700">
                      Visible to:{" "}
                      {asgForm.target_group_uuids
                        .map((id) => groups.find((g) => g.id === id)?.group_name ?? id.slice(0, 8))
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <button type="button" onClick={saveAssignment} className="mt-3 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600">
                {assignment ? "Update Assignment" : "Create Assignment"}
              </button>
            </div>

            {/* Submissions table */}
            {assignment && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700">Submissions ({submissions.length})</h4>
                {submissions.length === 0 ? (
                  <p className="text-sm text-slate-500">No submissions yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">Student</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">Submitted</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">Answer</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">Score</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">Feedback</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {submissions.map((sub) => (
                          <tr key={sub.id} className={sub.status === "graded" ? "bg-green-50" : ""}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-800">{sub.student_name}</p>
                              <p className="text-xs text-slate-500">{sub.student_email}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {new Date(sub.submitted_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              {sub.submission_text && <p className="text-xs text-slate-600 line-clamp-3">{sub.submission_text}</p>}
                              {sub.file_url && <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:underline">View file</a>}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={grades[sub.id]?.score ?? ""}
                                onChange={(e) => setGrades((g) => ({ ...g, [sub.id]: { ...g[sub.id], score: e.target.value } }))}
                                placeholder="/"
                                className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                              />
                              <span className="ml-1 text-xs text-slate-400">/{assignment.max_score ?? 100}</span>
                            </td>
                            <td className="px-4 py-3">
                              <textarea
                                value={grades[sub.id]?.feedback ?? ""}
                                onChange={(e) => setGrades((g) => ({ ...g, [sub.id]: { ...g[sub.id], feedback: e.target.value } }))}
                                rows={2}
                                placeholder="Feedback…"
                                className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button type="button" onClick={() => saveGrade(sub.id)} className="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600">
                                Save grade
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Preview ── */}
        {activeTab === "Preview" && (
          <div className="space-y-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Student Preview</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-5">
              <h2 className="text-xl font-bold text-slate-800">{topicTitle}</h2>

              {videoUrl ? (
                isRecordingLink(videoUrl) ? (
                  /* Recording link */
                  <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 max-w-lg">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{topicTitle}</p>
                      <p className="text-xs text-slate-400">Session recording</p>
                    </div>
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                      Watch Recording
                    </a>
                  </div>
                ) : getYouTubeId(videoUrl) ? (
                  /* YouTube */
                  <div className="aspect-video w-full max-w-lg overflow-hidden rounded-lg">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : getVimeoId(videoUrl) ? (
                  /* Vimeo */
                  <div className="aspect-video w-full max-w-lg overflow-hidden rounded-lg">
                    <iframe
                      className="h-full w-full"
                      src={`https://player.vimeo.com/video/${getVimeoId(videoUrl)}`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  /* Direct file */
                  <video controls className="w-full max-w-lg rounded-lg bg-black">
                    <source src={videoUrl} type={isDirectVideo(videoUrl) ? "video/mp4" : undefined} />
                  </video>
                )
              ) : (
                <div className="flex h-40 w-full max-w-lg items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 text-sm">
                  No video added
                </div>
              )}

              {description && <p className="text-slate-700">{description}</p>}

              {notes && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Lesson Notes</p>
                  <pre className="whitespace-pre-wrap text-sm text-slate-600 font-sans">{notes}</pre>
                </div>
              )}

              {materials.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Materials ({materials.length})</p>
                  <ul className="space-y-1">
                    {materials.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 text-sm text-amber-600">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs uppercase">{m.file_type}</span>
                        {m.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exercises.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700">{exercises.length} Exercise{exercises.length !== 1 ? "s" : ""}</p>
                </div>
              )}

              {assignment && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-700">Assignment: {assignment.title}</p>
                  {assignment.instructions && <p className="mt-1 text-sm text-slate-600">{assignment.instructions}</p>}
                  {assignment.due_date_time && (
                    <p className="mt-1 text-xs text-slate-500">Due: {new Date(assignment.due_date_time).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
