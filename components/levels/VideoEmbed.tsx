"use client";

import { useState } from "react";
import { getYouTubeId, getVimeoId, isDirectVideo, isRecordingLink } from "@/lib/video-utils";

interface VideoEmbedProps {
  title: string;
  url: string;
}

export default function VideoEmbed({ title, url }: VideoEmbedProps) {
  const [error, setError] = useState(false);

  // ── OneDrive / SharePoint / Teams recording link ──
  if (isRecordingLink(url)) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700">{title}</p>
            <p className="text-xs text-slate-400">Session recording</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Watch Recording
          </a>
        </div>
      </div>
    );
  }

  // ── Direct video file (Supabase Storage upload or raw mp4/webm/ogg) ──
  if (isDirectVideo(url)) {
    return (
      <div className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-lg bg-slate-900 shadow-md">
          <video controls src={url} className="w-full" title={title} />
        </div>
        <p className="mt-2 text-sm font-medium text-slate-700">{title}</p>
      </div>
    );
  }

  // ── YouTube ──
  const youtubeId = getYouTubeId(url);
  if (youtubeId && !error) {
    return (
      <div className="w-full max-w-2xl">
        <div className="aspect-video overflow-hidden rounded-lg bg-slate-900 shadow-md">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            onError={() => setError(true)}
          />
        </div>
        <p className="mt-2 text-sm font-medium text-slate-700">{title}</p>
      </div>
    );
  }

  // ── Vimeo ──
  const vimeoId = getVimeoId(url);
  if (vimeoId && !error) {
    return (
      <div className="w-full max-w-2xl">
        <div className="aspect-video overflow-hidden rounded-lg bg-slate-900 shadow-md">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            onError={() => setError(true)}
          />
        </div>
        <p className="mt-2 text-sm font-medium text-slate-700">{title}</p>
      </div>
    );
  }

  // ── Fallback: unrecognised URL ──
  return (
    <div className="flex aspect-video w-full max-w-2xl flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-100 p-8 text-center">
      <div className="rounded-full bg-slate-200 p-4">
        <svg
          className="h-10 w-10 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-1 text-xs text-slate-500">
        Video unavailable. The content may have been removed or is restricted.
      </p>
    </div>
  );
}
