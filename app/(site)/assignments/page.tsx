"use client";

import { useState, useEffect, useRef } from "react";
import { GROUP_NAMES, GROUP_COLORS, GROUP_LIGHT } from "@/lib/groups";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LEGACY_GROUPS = [1, 2, 3, 4, 5, 6, 7] as const;

interface DynGroup {
  id: string;
  group_name: string;
  level_code: string | null;
}

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
  name: string;
  email: string;
  text: string;
  file: File | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  submitting: boolean;
  done: boolean;
  error: string;
}

const mkSub = (name = "", email = ""): SubState => ({
  name, email, text: "", file: null,
  audioBlob: null, audioUrl: null,
  submitting: false, done: false, error: "",
});

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
      alert("Microphone access is required to record audio. Please allow microphone access and try again.");
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
        <button type="button" onClick={clear} className="text-xs text-slate-500 hover:text-red-600 underline">
          Remove recording
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <>
          <span className="flex items-center gap-2 text-sm font-medium text-red-600">
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
          Record audio response
        </button>
      )}
    </div>
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // Dynamic UUID-based groups (from DB)
  const [dynGroups, setDynGroups] = useState<DynGroup[]>([]);
  const [dynGroupsLoaded, setDynGroupsLoaded] = useState(false);

  // Active selection — either a UUID group or a legacy integer group
  const [groupUuid, setGroupUuid] = useState<string | null>(null);
  const [group, setGroup] = useState<number | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subs, setSubs] = useState<Record<string, SubState>>({});
  const [savedName, setSavedName] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [showGuestMode, setShowGuestMode] = useState(false);

  // Check auth, then load dynamic groups
  useEffect(() => {
    fetch("/api/student/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.student) {
          router.replace("/student/dashboard/assignments");
          return;
        }
        setAuthChecked(true);
        loadGroupsAndRestore();
      })
      .catch(() => {
        setAuthChecked(true);
        loadGroupsAndRestore();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadGroupsAndRestore = () => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => {
        const grps: DynGroup[] = d.groups ?? [];
        setDynGroups(grps);
        setDynGroupsLoaded(true);

        const savedUuid = localStorage.getItem("mappele_group_uuid");
        const savedG = localStorage.getItem("mappele_group");
        setSavedName(localStorage.getItem("mappele_name") ?? "");
        setSavedEmail(localStorage.getItem("mappele_email") ?? "");

        if (grps.length > 0) {
          // UUID system is active — restore UUID selection if valid
          if (savedUuid && grps.find((g) => g.id === savedUuid)) {
            setGroupUuid(savedUuid);
          }
        } else if (savedG) {
          // No dynamic groups — fall back to legacy integer selection
          setGroup(parseInt(savedG));
        }
      })
      .catch(() => {
        setDynGroupsLoaded(true);
        const savedG = localStorage.getItem("mappele_group");
        setSavedName(localStorage.getItem("mappele_name") ?? "");
        setSavedEmail(localStorage.getItem("mappele_email") ?? "");
        if (savedG) setGroup(parseInt(savedG));
      });
  };

  // Load assignments whenever the active group changes
  useEffect(() => {
    if (!dynGroupsLoaded) return;
    const url = groupUuid
      ? `/api/assignments?group_uuid=${encodeURIComponent(groupUuid)}`
      : group
      ? `/api/assignments?group=${group}`
      : null;
    if (!url) return;
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => setAssignments(d.assignments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupUuid, group, dynGroupsLoaded]);

  const selectDynGroup = (g: DynGroup) => {
    setGroupUuid(g.id);
    setGroup(null);
    localStorage.setItem("mappele_group_uuid", g.id);
    localStorage.removeItem("mappele_group");
    setExpanded(null);
  };

  const selectLegacyGroup = (g: number) => {
    setGroup(g);
    setGroupUuid(null);
    localStorage.setItem("mappele_group", String(g));
    localStorage.removeItem("mappele_group_uuid");
    setExpanded(null);
  };

  const clearGroup = () => {
    setGroup(null);
    setGroupUuid(null);
    setAssignments([]);
    localStorage.removeItem("mappele_group");
    localStorage.removeItem("mappele_group_uuid");
  };

  const getSub = (id: string) => subs[id] ?? mkSub(savedName, savedEmail);
  const updateSub = (id: string, patch: Partial<SubState>) =>
    setSubs((prev) => ({ ...prev, [id]: { ...getSub(id), ...patch } }));

  const handleSubmit = async (asgn: Assignment) => {
    const sub = getSub(asgn.id);
    if (!sub.name.trim() || !sub.email.trim()) {
      updateSub(asgn.id, { error: "Your name and email are required to submit." });
      return;
    }
    updateSub(asgn.id, { submitting: true, error: "" });
    localStorage.setItem("mappele_name", sub.name.trim());
    localStorage.setItem("mappele_email", sub.email.trim());
    setSavedName(sub.name.trim());
    setSavedEmail(sub.email.trim());

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
        fd.append("student_name", sub.name.trim());
        fd.append("student_email", sub.email.trim());
        // Only send group_number for legacy integer groups
        if (group) fd.append("group_number", String(group));
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
            student_name: sub.name.trim(),
            student_email: sub.email.trim(),
            group_number: group ?? null,
            submission_text: sub.text.trim() || null,
            audio_url: audioUrl,
          }),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed. Please try again.");
      updateSub(asgn.id, { submitting: false, done: true });
    } catch (err: unknown) {
      updateSub(asgn.id, {
        submitting: false,
        error: err instanceof Error ? err.message : "Submission failed. Please try again.",
      });
    }
  };

  // Derive display values for the active group
  const activeDynGroup = groupUuid ? dynGroups.find((g) => g.id === groupUuid) : null;
  const activeGroupLabel = activeDynGroup
    ? activeDynGroup.group_name
    : group
    ? `G${group} — ${GROUP_NAMES[group]}`
    : "";
  const badgeColor = activeDynGroup
    ? "bg-amber-500"
    : group
    ? (GROUP_COLORS[group] ?? "bg-slate-500")
    : "bg-slate-500";

  const isGroupSelected = Boolean(groupUuid || group);

  // While checking auth, show nothing (prevents flash)
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Student Login CTA (shown when not logged in and guest mode not active) ──
  if (!showGuestMode && !isGroupSelected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-amber-200 bg-white p-10 shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Your Assignments</h1>
            <p className="mt-3 text-slate-500 leading-relaxed">
              Log in to your student portal to see your personalised assignments, track your submissions, and receive teacher feedback.
            </p>
            <Link
              href="/student/login"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign in to Student Portal
            </Link>
            <div className="mt-4">
              <Link href="/register" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                Don&apos;t have an account? Register here →
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowGuestMode(true)}
              className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2"
            >
              Continue without login (guest access)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Guest mode: Group picker ──────────────────────────────────────────────
  if (!isGroupSelected) {
    const useDynamic = dynGroupsLoaded && dynGroups.length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50">
        <div className="mx-auto max-w-2xl px-4 py-16">
          {/* Back to login CTA */}
          <div className="mb-8 rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              <strong>Have a student account?</strong> Log in for a personalised experience with progress tracking and feedback.
            </p>
            <Link
              href="/student/login"
              className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Guest Access — Assignments</h1>
            <p className="mt-2 text-slate-500">Select your group to view and submit your assignments.</p>
          </div>

          {!dynGroupsLoaded ? (
            <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
              <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-amber-400 animate-spin" />
              Loading groups…
            </div>
          ) : useDynamic ? (
            // UUID-based dynamic groups (primary)
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {dynGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => selectDynGroup(g)}
                  className="flex flex-col items-center rounded-2xl border-2 border-amber-100 bg-white px-4 py-6 text-center transition-all hover:scale-105 hover:border-amber-400 hover:shadow-md"
                >
                  <span className="h-3 w-3 rounded-full bg-amber-400 mb-3" />
                  <p className="text-sm font-bold text-slate-800 leading-snug">{g.group_name}</p>
                  {g.level_code && (
                    <span className="mt-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 uppercase">
                      {g.level_code}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            // Legacy G1–G7 fallback (only when no dynamic groups exist)
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {LEGACY_GROUPS.map((g) => {
                const lightClass = GROUP_LIGHT[g] ?? "bg-slate-50 border-slate-200 text-slate-700";
                const dotColor = GROUP_COLORS[g] ?? "bg-slate-400";
                return (
                  <button
                    key={g}
                    onClick={() => selectLegacyGroup(g)}
                    className={`flex flex-col items-center rounded-2xl border-2 px-4 py-6 text-center transition-all hover:scale-105 hover:shadow-md ${lightClass}`}
                  >
                    <span className={`h-3 w-3 rounded-full ${dotColor} mb-3`} />
                    <span className="text-2xl font-black text-slate-800">G{g}</span>
                    <p className="mt-1.5 text-xs font-medium leading-snug">{GROUP_NAMES[g]}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Assignments list ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={`rounded-xl px-3 py-1.5 text-sm font-bold text-white ${badgeColor}`}>
              {activeDynGroup ? activeDynGroup.group_name.split(" ")[0] : `G${group}`}
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-800">Assignments — Guest</h1>
              <p className="text-xs text-slate-500">{activeGroupLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/student/login"
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Sign in for full portal
            </Link>
            <button
              onClick={clearGroup}
              className="text-sm text-slate-400 hover:text-slate-700 underline"
            >
              Change group
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex items-center gap-3 py-16 justify-center text-slate-400">
            <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />
            Loading assignments…
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-3 font-medium text-slate-500">No assignments available yet</p>
            <p className="mt-1 text-sm text-slate-400">Your teacher hasn&apos;t posted any assignments for your group. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""} for your group</p>
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
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {level && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 uppercase">
                            {level.code}
                          </span>
                        )}
                        {mod && <span className="text-xs text-slate-400 truncate">{mod.title}</span>}
                        {topic && topic.title && <span className="text-xs text-slate-400">/ {topic.title}</span>}
                      </div>
                      <p className="font-semibold text-slate-800">{asgn.title}</p>
                      {asgn.due_date_time && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Due:{" "}
                          {new Date(asgn.due_date_time).toLocaleDateString(undefined, {
                            day: "numeric", month: "short", year: "numeric",
                          })}
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
                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                          <p className="mt-3 font-semibold text-green-800">Assignment submitted successfully!</p>
                          <p className="mt-1 text-sm text-green-600">Your teacher will review it and provide feedback soon.</p>
                          <p className="mt-3 text-xs text-green-600">
                            <Link href="/student/login" className="underline font-medium">
                              Sign in to your student portal
                            </Link>{" "}
                            to track your submission and see feedback.
                          </p>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleSubmit(asgn); }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Your full name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={sub.name}
                                onChange={(e) => updateSub(asgn.id, { name: e.target.value })}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-colors"
                                placeholder="Enter your full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email address <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={sub.email}
                                onChange={(e) => updateSub(asgn.id, { email: e.target.value })}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-colors"
                                placeholder="you@example.com"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Written answer</label>
                            <textarea
                              rows={5}
                              value={sub.text}
                              onChange={(e) => updateSub(asgn.id, { text: e.target.value })}
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-colors"
                              placeholder="Write your answer here…"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Audio response <span className="text-slate-400 font-normal">(optional — for speaking practice)</span>
                            </label>
                            <AudioRecorder
                              onRecorded={(blob, url) => updateSub(asgn.id, { audioBlob: blob, audioUrl: url })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Upload a file <span className="text-slate-400 font-normal">(PDF, DOC, DOCX — optional)</span>
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
                            className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 ${badgeColor} hover:opacity-90`}
                          >
                            {sub.submitting ? "Submitting…" : "Submit Assignment"}
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
