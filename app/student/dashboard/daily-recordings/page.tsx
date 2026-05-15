"use client";

import { useEffect, useState } from "react";
import VideoEmbed from "@/components/levels/VideoEmbed";

interface Recording {
  id: string;
  title: string;
  class_date: string | null;
  description: string | null;
  video_url: string | null;
  file_url: string | null;
  file_name: string | null;
  signed_file_url: string | null;
  special_instructions: string | null;
  created_at: string;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPostedDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StudentRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/daily-recordings")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRecordings(d.recordings ?? []);
      })
      .catch(() => setError("Failed to load recordings"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Daily Recordings</h1>
        <p className="mt-1 text-sm text-slate-500">Class recordings posted by your instructor</p>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
          <div className="rounded-full bg-slate-100 p-5">
            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600">No recordings yet</p>
          <p className="mt-1 text-xs text-slate-400">Your instructor hasn't posted any recordings for your group.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {recordings.map((rec) => (
            <div key={rec.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{rec.title}</h2>
                    {rec.class_date && (
                      <p className="mt-0.5 text-xs font-medium text-amber-600">
                        {formatDate(rec.class_date)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    Posted {formatPostedDate(rec.created_at)}
                  </span>
                </div>
                {rec.description && (
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rec.description}</p>
                )}
              </div>

              {/* Card body */}
              <div className="px-6 py-5 space-y-5">
                {/* Video */}
                {rec.video_url && (
                  <div>
                    <VideoEmbed title={rec.title} url={rec.video_url} />
                  </div>
                )}

                {/* File attachment */}
                {rec.signed_file_url && rec.file_name && (
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{rec.file_name}</p>
                      <p className="text-xs text-slate-400">Attached file</p>
                    </div>
                    <a
                      href={rec.signed_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                )}

                {/* Special instructions */}
                {rec.special_instructions && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Instructions</p>
                        <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{rec.special_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
