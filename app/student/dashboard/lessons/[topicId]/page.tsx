"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Video { id: string; title: string; url: string; description?: string }
interface Material { id: string; title: string; type: string; url?: string | null }
interface Exercise {
  id: string;
  question: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  explanation?: string;
}
interface Assignment {
  id: string; title: string; instructions?: string;
  due_date_time?: string; max_score?: number;
}
interface Submission {
  status: string;
  score: number | null;
  feedback: string | null;
}
interface Topic {
  id: string; title: string; description?: string; notes?: string;
  modules?: { id: string; title: string; levels?: { code: string; title: string } };
}

interface SubState {
  text: string; file: File | null;
  audioBlob: Blob | null; audioUrl: string | null;
  submitting: boolean; done: boolean; error: string;
}

type ExerciseState = { chosen: string | null; submitted: boolean };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&\s]+)/);
  return m ? m[1] : null;
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📄", doc: "📝", docx: "📝", link: "🔗", text: "📋",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  submitted:     { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",  label: "Submitted – awaiting review" },
  graded:        { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Graded" },
  reviewed:      { bg: "bg-sky-50 border-sky-200",       text: "text-sky-700",    label: "Reviewed" },
  feedback_sent: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", label: "Feedback sent" },
  completed:     { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Completed" },
};

// ─── Audio Recorder ──────────────────────────────────────────────────────────

function AudioRecorder({ onRecorded }: { onRecorded: (blob: Blob, url: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onRecorded(blob, url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      alert("Microphone access is required to record audio.");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const clear = () => {
    setPreviewUrl(null);
    setSeconds(0);
    onRecorded(new Blob(), "");
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (previewUrl) return (
    <div className="flex flex-wrap items-center gap-3">
      <audio src={previewUrl} controls className="h-9 max-w-xs" />
      <button type="button" onClick={clear} className="text-xs text-slate-500 hover:text-red-600 underline">
        Remove recording
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <>
          <span className="flex items-center gap-2 text-sm text-red-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording {fmt(seconds)}
          </span>
          <button
            type="button" onClick={stop}
            className="rounded-lg bg-red-100 border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors"
          >
            Stop
          </button>
        </>
      ) : (
        <button
          type="button" onClick={start}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Record audio
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LessonPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<{ full_name: string; email: string; group_id: number | null } | null>(null);

  const [exStates, setExStates] = useState<Record<string, ExerciseState>>({});
  const [exScore, setExScore] = useState<{ correct: number; total: number } | null>(null);

  const [sub, setSub] = useState<SubState>({
    text: "", file: null, audioBlob: null, audioUrl: null,
    submitting: false, done: false, error: "",
  });

  const [marking, setMarking] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/student/topic/${topicId}`).then((r) => r.json()),
      fetch("/api/student/me").then((r) => r.json()),
    ]).then(([data, me]) => {
      if (!data.error) {
        setTopic(data.topic);
        setVideos(data.videos ?? []);
        setMaterials(data.materials ?? []);
        setExercises(data.exercises ?? []);
        setAssignment(data.assignment ?? null);
        setSubmission(data.submission ?? null);
        setIsCompleted(data.isCompleted ?? false);
        // If already submitted, put form in done state
        if (data.submission) setSub((p) => ({ ...p, done: true }));
      }
      if (me.student) setStudent(me.student);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [topicId]);

  const toggleComplete = async () => {
    setMarking(true);
    const next = !isCompleted;
    try {
      await fetch("/api/student/lesson-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId, is_completed: next }),
      });
      setIsCompleted(next);
    } finally {
      setMarking(false);
    }
  };

  const submitExercise = (ex: Exercise, chosen: string) => {
    setExStates((p) => ({ ...p, [ex.id]: { chosen, submitted: true } }));
  };

  const checkAllExercises = () => {
    const total = exercises.length;
    const correct = exercises.filter((ex) => exStates[ex.id]?.chosen === ex.correct_answer).length;
    setExScore({ correct, total });
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !assignment) return;
    setSub((p) => ({ ...p, submitting: true, error: "" }));
    try {
      let audioUrl: string | null = null;
      if (sub.audioBlob && sub.audioBlob.size > 0) {
        const supabase = createClient();
        const path = `audio/${assignment.id}/${Date.now()}.webm`;
        const { data: storageData, error: storageErr } = await supabase.storage
          .from("assignments").upload(path, sub.audioBlob, { contentType: "audio/webm", upsert: false });
        if (storageErr) throw new Error(`Audio upload failed: ${storageErr.message}`);
        const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(storageData.path);
        audioUrl = urlData.publicUrl;
      }

      let res: Response;
      if (sub.file) {
        const fd = new FormData();
        fd.append("assignment_id", assignment.id);
        fd.append("student_name", student.full_name);
        fd.append("student_email", student.email);
        if (student.group_id) fd.append("group_number", String(student.group_id));
        if (sub.text.trim()) fd.append("submission_text", sub.text.trim());
        if (audioUrl) fd.append("audio_url", audioUrl);
        fd.append("file", sub.file);
        res = await fetch("/api/assignment-submissions", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/assignment-submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignment_id: assignment.id,
            student_name: student.full_name,
            student_email: student.email,
            group_number: student.group_id,
            submission_text: sub.text.trim() || null,
            audio_url: audioUrl,
          }),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setSub((p) => ({ ...p, submitting: false, done: true }));
      setSubmission({ status: "submitted", score: null, feedback: null });
    } catch (err: unknown) {
      setSub((p) => ({
        ...p, submitting: false,
        error: err instanceof Error ? err.message : "Submission failed",
      }));
    }
  };

  // ─── Loading / error ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
    </div>
  );

  if (!topic) return (
    <div className="text-center py-24 space-y-3">
      <p className="text-slate-500">Lesson not found.</p>
      <Link href="/student/dashboard/lessons" className="text-sm text-amber-600 hover:underline">
        ← Back to lessons
      </Link>
    </div>
  );

  const levelCode = (topic.modules as any)?.levels?.code;
  const moduleTitle = (topic.modules as any)?.title;
  const allExSubmitted = exercises.length > 0 && exercises.every((ex) => exStates[ex.id]?.submitted);
  const submissionStyle = submission ? STATUS_STYLES[submission.status] : null;
  const isGraded = submission && ["graded", "reviewed", "feedback_sent", "completed"].includes(submission.status);

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 flex-wrap">
        <Link href="/student/dashboard/lessons" className="hover:text-amber-600 transition-colors">
          My Lessons
        </Link>
        {levelCode && (
          <>
            <span>/</span>
            <span className="font-bold text-amber-600 uppercase">{levelCode}</span>
          </>
        )}
        {moduleTitle && (
          <>
            <span>/</span>
            <span className="truncate max-w-[10rem]">{moduleTitle}</span>
          </>
        )}
      </nav>

      {/* ── Topic header ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800">{topic.title}</h1>
            {topic.description && (
              <p className="mt-2 text-slate-500 leading-relaxed">{topic.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={toggleComplete}
            disabled={marking}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              isCompleted
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {isCompleted ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Completed
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark complete
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Videos ─────────────────────────────────────────────────────── */}
      {videos.map((v) => {
        const ytId = getYouTubeId(v.url);
        const isVid = isVideoFile(v.url);
        return (
          <div key={v.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
              <svg className="h-4 w-4 text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lesson Video</p>
                <p className="font-semibold text-slate-800">{v.title}</p>
              </div>
            </div>

            {ytId ? (
              <div className="aspect-video bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : isVid ? (
              <video controls className="w-full max-h-[480px] bg-black">
                <source src={v.url} />
              </video>
            ) : (
              <div className="px-5 py-4 bg-slate-50">
                <a
                  href={v.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 hover:underline font-medium"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open video link
                </a>
              </div>
            )}

            {v.description && (
              <p className="px-5 py-3 text-sm text-slate-500 border-t border-slate-100">{v.description}</p>
            )}
          </div>
        );
      })}

      {/* ── Lesson Notes ───────────────────────────────────────────────── */}
      {topic.notes && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Lesson Notes</p>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{topic.notes}</p>
        </div>
      )}

      {/* ── Study Materials ─────────────────────────────────────────────── */}
      {materials.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Study Materials <span className="text-slate-300">({materials.length})</span>
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {materials.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-white hover:border-slate-200 transition-colors"
              >
                <span className="text-xl shrink-0">{FILE_ICONS[m.type] ?? "📎"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                  <p className="text-xs text-slate-400 uppercase">{m.type}</p>
                </div>
                {m.url ? (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-slate-300">No file</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Practice Quiz ───────────────────────────────────────────────── */}
      {exercises.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Practice Quiz <span className="text-slate-300">({exercises.length} questions)</span>
              </p>
            </div>
            {exScore && (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                exScore.correct === exScore.total
                  ? "bg-emerald-100 text-emerald-700"
                  : exScore.correct >= exScore.total / 2
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {exScore.correct}/{exScore.total} correct
              </span>
            )}
          </div>

          <div className="space-y-5">
            {exercises.map((ex, i) => {
              const st = exStates[ex.id];
              const isCorrect = st?.chosen === ex.correct_answer;
              return (
                <div
                  key={ex.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    st?.submitted
                      ? isCorrect
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-red-200 bg-red-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800 mb-3">
                    {i + 1}. {ex.question}
                  </p>
                  <div className="space-y-2">
                    {(["a", "b", "c", "d"] as const).map((opt) => {
                      const text = ex[`option_${opt}`];
                      const chosen = st?.chosen === opt;
                      const isRight = ex.correct_answer === opt;
                      let cls = "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50";
                      if (st?.submitted) {
                        if (isRight) cls = "border-emerald-400 bg-emerald-100 text-emerald-800 font-semibold";
                        else if (chosen) cls = "border-red-400 bg-red-100 text-red-700";
                        else cls = "border-slate-200 bg-white text-slate-400";
                      } else if (chosen) {
                        cls = "border-amber-400 bg-amber-50 text-amber-800";
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={st?.submitted}
                          onClick={() => !st?.submitted && submitExercise(ex, opt)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-sm text-left transition-colors ${cls} disabled:cursor-default`}
                        >
                          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-bold uppercase">
                            {opt}
                          </span>
                          {text}
                          {st?.submitted && isRight && (
                            <svg className="h-4 w-4 text-emerald-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {st?.submitted && ex.explanation && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <svg className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-slate-600">{ex.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allExSubmitted && !exScore && (
            <button
              type="button"
              onClick={checkAllExercises}
              className="mt-4 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
            >
              See my score →
            </button>
          )}
        </div>
      )}

      {/* ── Assignment ──────────────────────────────────────────────────── */}
      {assignment && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assignment</p>
            {submission && submissionStyle && (
              <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold border ${submissionStyle.bg} ${submissionStyle.text}`}>
                {submissionStyle.label}
              </span>
            )}
          </div>

          {/* Assignment brief */}
          <div className="rounded-xl bg-sky-50 border border-sky-100 px-4 py-4 mb-4">
            <p className="font-semibold text-slate-800">{assignment.title}</p>
            {assignment.instructions && (
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {assignment.instructions}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
              {assignment.max_score && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Max {assignment.max_score} pts
                </span>
              )}
              {assignment.due_date_time && (
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due {new Date(assignment.due_date_time).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>

          {/* Graded feedback block */}
          {isGraded && submission && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
                Teacher Feedback
              </p>
              {submission.score != null && (
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black text-emerald-700">{submission.score}</span>
                  {assignment.max_score && (
                    <span className="text-sm text-emerald-500">/ {assignment.max_score} pts</span>
                  )}
                </div>
              )}
              {submission.feedback && (
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {submission.feedback}
                </p>
              )}
              {!submission.feedback && !submission.score && (
                <p className="text-sm text-emerald-700 italic">Your teacher has reviewed your work.</p>
              )}
            </div>
          )}

          {/* Submission form or done state */}
          {sub.done || submission ? (
            !isGraded && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-5 flex items-center gap-4">
                <svg className="h-8 w-8 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-800">Assignment submitted!</p>
                  <p className="text-sm text-amber-600 mt-0.5">
                    Your teacher will review it soon. Check{" "}
                    <Link href="/student/dashboard/submissions" className="underline font-medium">
                      My Submissions
                    </Link>{" "}
                    for feedback.
                  </p>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Your answer
                </label>
                <textarea
                  rows={5}
                  value={sub.text}
                  onChange={(e) => setSub((p) => ({ ...p, text: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-colors resize-none"
                  placeholder="Write your answer here…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Voice recording{" "}
                  <span className="text-slate-400 font-normal text-xs">(optional — for speaking tasks)</span>
                </label>
                <AudioRecorder onRecorded={(blob, url) => setSub((p) => ({ ...p, audioBlob: blob, audioUrl: url }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Upload file{" "}
                  <span className="text-slate-400 font-normal text-xs">(PDF, DOC, DOCX — optional)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSub((p) => ({ ...p, file: e.target.files?.[0] ?? null }))}
                  className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                />
                {sub.file && (
                  <p className="mt-1 text-xs text-slate-500">Selected: {sub.file.name}</p>
                )}
              </div>

              {sub.error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {sub.error}
                </div>
              )}

              <button
                type="submit"
                disabled={sub.submitting}
                className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {sub.submitting ? "Submitting…" : "Submit assignment"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Bottom navigation ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <Link
          href="/student/dashboard/lessons"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to lessons
        </Link>
        {!isCompleted && (
          <button
            type="button"
            onClick={toggleComplete}
            disabled={marking}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {marking ? "Saving…" : "Mark as complete"}
          </button>
        )}
      </div>
    </div>
  );
}
