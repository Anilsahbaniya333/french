"use client";

import { useState, useEffect, useRef } from "react";
import { GROUP_NAMES, GROUP_COLORS } from "@/lib/groups";

interface Assignment {
  id: string;
  title: string;
  instructions?: string;
  due_date_time?: string;
  max_score?: number;
  topics?: {
    title: string;
    modules?: {
      title: string;
      levels?: { code: string; title: string };
    };
  };
}

interface SubState {
  text: string;
  file: File | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  submitting: boolean;
  done: boolean;
  error: string;
}

const mkSub = (): SubState => ({
  text: "", file: null, audioBlob: null, audioUrl: null,
  submitting: false, done: false, error: "",
});

function AudioRecorder({
  onRecorded,
}: {
  onRecorded: (blob: Blob, url: string) => void;
}) {
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

  if (previewUrl) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <audio src={previewUrl} controls className="h-9 max-w-xs" />
        <button
          type="button"
          onClick={clear}
          className="text-xs text-slate-500 hover:text-red-600 underline"
        >
          Remove recording
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <>
          <span className="flex items-center gap-2 text-sm text-red-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording {fmt(seconds)}
          </span>
          <button
            type="button"
            onClick={stop}
            className="rounded-lg bg-red-100 border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors"
          >
            Stop
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={start}
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

export default function StudentAssignmentsPage() {
  const [student, setStudent] = useState<{ full_name: string; email: string; group_id: number | null; group_uuid?: string | null; group_name?: string | null } | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subs, setSubs] = useState<Record<string, SubState>>({});

  useEffect(() => {
    fetch("/api/student/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.student) {
          setStudent(d.student);
          // Prefer UUID-based group filter; fall back to legacy integer group_id
          const groupUuid = d.student.group_uuid;
          const groupId = d.student.group_id;
          const url = groupUuid
            ? `/api/assignments?group_uuid=${encodeURIComponent(groupUuid)}`
            : groupId
            ? `/api/assignments?group=${groupId}`
            : "/api/assignments";
          console.log(`[student/assignments] group_uuid=${groupUuid ?? "none"} group_id=${groupId ?? "none"} → ${url}`);
          return fetch(url).then((r) => r.json()).then((a) => {
            const list: Assignment[] = a.assignments ?? [];
            console.log(`[student/assignments] loaded ${list.length} assignments`);
            setAssignments(list);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getSub = (id: string) => subs[id] ?? mkSub();
  const updateSub = (id: string, patch: Partial<SubState>) =>
    setSubs((prev) => ({ ...prev, [id]: { ...getSub(id), ...patch } }));

  const handleSubmit = async (asgn: Assignment) => {
    if (!student) return;
    const sub = getSub(asgn.id);
    updateSub(asgn.id, { submitting: true, error: "" });

    try {
      let audioUrl: string | null = null;

      if (sub.audioBlob && sub.audioBlob.size > 0) {
        console.log(`[audio-upload] Recording captured, size=${sub.audioBlob.size} — uploading via server`);
        const fd = new FormData();
        fd.append("file", sub.audioBlob, `audio_${Date.now()}.webm`);
        fd.append("assignment_id", asgn.id);
        console.log(`[audio-upload] POST /api/upload-audio for assignment ${asgn.id}`);
        const uploadRes = await fetch("/api/upload-audio", { method: "POST", body: fd });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          console.error(`[audio-upload] Failed: ${uploadJson.error}`);
          throw new Error(`Audio upload failed: ${uploadJson.error ?? "Unknown error"}`);
        }
        audioUrl = uploadJson.url;
        console.log(`[audio-upload] Success: ${audioUrl}`);
      }

      let res: Response;
      if (sub.file) {
        const fd = new FormData();
        fd.append("assignment_id", asgn.id);
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
            assignment_id: asgn.id,
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
      updateSub(asgn.id, { submitting: false, done: true });
    } catch (err: unknown) {
      updateSub(asgn.id, {
        submitting: false,
        error: err instanceof Error ? err.message : "Submission failed",
      });
    }
  };

  // Prefer dynamic group name, fall back to legacy group_id label
  const groupName = student?.group_name
    ?? (student?.group_id ? GROUP_NAMES[student.group_id] : null);
  const groupColor = student?.group_id ? GROUP_COLORS[student.group_id] : "bg-amber-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
          {groupName && (
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${groupColor}`}>
                {groupName}
              </span>
              <span className="text-sm text-slate-500">Showing assignments for your group</span>
            </div>
          )}
        </div>
      </div>

      {/* Assignments list */}
      <div className="mt-6">
        {assignments.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-3 text-slate-500 font-medium">No assignments yet</p>
            <p className="mt-1 text-sm text-slate-400">Your teacher hasn&apos;t posted any assignments yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((asgn) => {
              const sub = getSub(asgn.id);
              const isOpen = expanded === asgn.id;
              const level = (asgn.topics as any)?.modules?.levels;
              const mod = (asgn.topics as any)?.modules;
              const topic = asgn.topics as any;

              return (
                <div key={asgn.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : asgn.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {level && (
                          <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 uppercase">
                            {level.code}
                          </span>
                        )}
                        {mod && <span className="text-xs text-slate-400">{mod.title}</span>}
                        {topic && <span className="text-xs text-slate-400">/ {topic.title}</span>}
                      </div>
                      <p className="mt-1 font-semibold text-slate-800">{asgn.title}</p>
                      {asgn.due_date_time && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Due {new Date(asgn.due_date_time).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {sub.done && (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          Submitted
                        </span>
                      )}
                      <svg
                        className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 pb-6 pt-5">
                      {asgn.instructions && (
                        <div className="mb-5 rounded-xl bg-sky-50 border border-sky-100 px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1.5">Instructions</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{asgn.instructions}</p>
                          {asgn.max_score && (
                            <p className="mt-2 text-xs text-slate-500">Max score: <strong>{asgn.max_score}</strong> points</p>
                          )}
                        </div>
                      )}

                      {sub.done ? (
                        <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-8 text-center">
                          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="mt-3 text-base font-semibold text-green-800">Assignment submitted!</p>
                          <p className="mt-1 text-sm text-green-600">Your teacher will review it and provide feedback soon.</p>
                        </div>
                      ) : (
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(asgn); }} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Your answer</label>
                            <textarea
                              rows={5}
                              value={sub.text}
                              onChange={(e) => updateSub(asgn.id, { text: e.target.value })}
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-colors"
                              placeholder="Write your answer here…"
                            />
                          </div>

                          {/* Audio recording */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Audio response <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <AudioRecorder
                              onRecorded={(blob, url) => updateSub(asgn.id, { audioBlob: blob, audioUrl: url })}
                            />
                          </div>

                          {/* File upload */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                              Upload file <span className="text-slate-400 font-normal">(PDF, DOC, DOCX — optional)</span>
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => updateSub(asgn.id, { file: e.target.files?.[0] ?? null })}
                              className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                            />
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
