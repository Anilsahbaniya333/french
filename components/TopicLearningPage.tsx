"use client";

import { useState } from "react";
import Link from "next/link";

interface Material {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
}

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

interface Assignment {
  id: string;
  title: string;
  instructions?: string;
  due_date_time?: string;
  max_score?: number;
}

interface TopicData {
  topic: {
    id: string;
    title: string;
    description?: string;
    notes?: string;
    video_url?: string;
    video_title?: string;
    is_preview: boolean;
    module_id: string;
  };
  materials: Material[];
  exercises: Exercise[];
  assignment: Assignment | null;
}

interface Props {
  topicData: TopicData;
  levelCode: string;
  moduleId: string;
}

export default function TopicLearningPage({ topicData, levelCode, moduleId }: Props) {
  const { topic, materials, exercises, assignment } = topicData;
  const [notesOpen, setNotesOpen] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ [id: string]: boolean }>({});
  const [score, setScore] = useState(0);
  const [exercisesDone, setExercisesDone] = useState(false);

  // Assignment state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ id: string; submitted_at: string } | null>(null);
  const [submitError, setSubmitError] = useState("");

  const currentExercise = exercises[currentExIdx];

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentExercise) return;
    setSubmitted(true);

    const isCorrect = selectedAnswer === currentExercise.correct_answer;
    const newResults = { ...results, [currentExercise.id]: isCorrect };
    setResults(newResults);
    if (isCorrect) setScore((s) => s + 1);

    // Save attempt (fire and forget)
    if (studentEmail) {
      fetch("/api/exercise-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: currentExercise.id,
          student_email: studentEmail,
          answer: selectedAnswer,
        }),
      }).catch(() => {});
    }
  };

  const handleNextExercise = () => {
    if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx((i) => i + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    } else {
      setExercisesDone(true);
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    if (!studentName.trim() || !studentEmail.trim()) {
      setSubmitError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      let res: Response;
      if (submissionFile) {
        const fd = new FormData();
        fd.append("assignment_id", assignment.id);
        fd.append("student_name", studentName.trim());
        fd.append("student_email", studentEmail.trim());
        if (submissionText.trim()) fd.append("submission_text", submissionText.trim());
        fd.append("file", submissionFile);
        res = await fetch("/api/assignment-submissions", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/assignment-submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignment_id: assignment.id,
            student_name: studentName.trim(),
            student_email: studentEmail.trim(),
            submission_text: submissionText.trim() || null,
          }),
        });
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setSubmissionResult({ id: json.id, submitted_at: json.submitted_at });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center gap-2 text-sm text-slate-500">
          <Link href={`/courses/${levelCode}`} className="hover:text-amber-600">
            Level {levelCode.toUpperCase()}
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{topic.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{topic.title}</h1>
          {topic.description && <p className="mt-2 text-slate-600">{topic.description}</p>}
        </div>

        {/* Video */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Video Lesson</h2>
          {topic.video_url ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
              <video
                controls
                src={topic.video_url}
                className="w-full max-h-96"
                title={topic.video_title ?? topic.title}
              />
              {topic.video_title && (
                <p className="px-4 py-2 text-sm text-slate-300 bg-slate-800">{topic.video_title}</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-400">No video uploaded yet for this topic.</p>
            </div>
          )}
        </section>

        {/* Notes */}
        {topic.notes && (
          <section>
            <button
              type="button"
              onClick={() => setNotesOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left"
            >
              <h2 className="text-lg font-semibold text-slate-800">Notes</h2>
              <svg
                className={`h-5 w-5 text-slate-500 transition-transform ${notesOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {notesOpen && (
              <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white px-5 py-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">{topic.notes}</pre>
              </div>
            )}
          </section>
        )}

        {/* Materials */}
        {materials.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Materials</h2>
            <div className="space-y-2">
              {materials.map((m) => (
                <a
                  key={m.id}
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 uppercase">
                    {m.file_type}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{m.title}</span>
                  <svg className="ml-auto h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Exercises */}
        {exercises.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              Exercises ({exercises.length} question{exercises.length !== 1 ? "s" : ""})
            </h2>

            {/* Email for tracking (optional) */}
            {!studentEmail && !exercisesDone && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                <label className="block text-sm font-medium text-slate-700">
                  Your email (to save progress — optional)
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}

            {exercisesDone ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <p className="text-2xl font-bold text-slate-800">{score}/{exercises.length}</p>
                <p className="mt-1 text-slate-600">
                  {score === exercises.length
                    ? "Perfect score! Excellent work."
                    : score >= exercises.length / 2
                    ? "Good job! Keep practising."
                    : "Keep studying — you'll get there!"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentExIdx(0);
                    setSelectedAnswer(null);
                    setSubmitted(false);
                    setResults({});
                    setScore(0);
                    setExercisesDone(false);
                  }}
                  className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                  Try again
                </button>
              </div>
            ) : currentExercise ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-xs text-slate-500 mb-2">
                  Question {currentExIdx + 1} of {exercises.length}
                </p>
                <p className="font-medium text-slate-800 mb-4">{currentExercise.question}</p>
                <div className="space-y-2">
                  {(["a", "b", "c", "d"] as const).map((opt) => {
                    const val = currentExercise[`option_${opt}`];
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = opt === currentExercise.correct_answer;
                    let cls = "flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ";
                    if (!submitted) {
                      cls += isSelected
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-200 hover:border-amber-200 hover:bg-amber-50";
                    } else {
                      if (isCorrect) cls += "border-green-400 bg-green-50";
                      else if (isSelected) cls += "border-red-400 bg-red-50";
                      else cls += "border-slate-200 opacity-60";
                    }
                    return (
                      <label key={opt} className={cls}>
                        <input
                          type="radio"
                          name="answer"
                          value={opt}
                          checked={isSelected}
                          onChange={() => !submitted && setSelectedAnswer(opt)}
                          className="accent-amber-500"
                          disabled={submitted}
                        />
                        <span className="text-sm text-slate-700">
                          <strong className="text-slate-500 mr-1">{opt.toUpperCase()}.</strong>
                          {val}
                        </span>
                        {submitted && isCorrect && (
                          <svg className="ml-auto h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {submitted && isSelected && !isCorrect && (
                          <svg className="ml-auto h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </label>
                    );
                  })}
                </div>
                {submitted && currentExercise.explanation && (
                  <div className="mt-4 rounded-lg bg-sky-50 border border-sky-200 px-4 py-3">
                    <p className="text-sm text-sky-800"><strong>Explanation:</strong> {currentExercise.explanation}</p>
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  {!submitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextExercise}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      {currentExIdx < exercises.length - 1 ? "Next Question" : "See Results"}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* Assignment */}
        {assignment && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">Assignment</h2>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-slate-800">{assignment.title}</h3>
              {assignment.instructions && (
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{assignment.instructions}</p>
              )}
              {assignment.due_date_time && (
                <p className="mt-2 text-xs text-slate-500">
                  Due: {new Date(assignment.due_date_time).toLocaleString()}
                </p>
              )}
              {assignment.max_score && (
                <p className="text-xs text-slate-500">Max score: {assignment.max_score}</p>
              )}

              {submissionResult ? (
                <div className="mt-6 rounded-lg bg-green-50 border border-green-200 px-4 py-4">
                  <p className="font-medium text-green-800">Submission received!</p>
                  <p className="mt-1 text-sm text-green-700">
                    Submitted at: {new Date(submissionResult.submitted_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAssignmentSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Your name *</label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Your email *</label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Written answer (optional if uploading a file)
                    </label>
                    <textarea
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Type your answer here…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Or upload a file (PDF, DOC, DOCX)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setSubmissionFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block text-sm text-slate-600"
                    />
                  </div>
                  {submitError && (
                    <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                      {submitError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40"
                  >
                    {submitting ? "Submitting…" : "Submit Assignment"}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
