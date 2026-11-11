"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { CURRICULUM_LEVELS, type CurriculumLevel } from "@/data/curriculum-levels";

function Check({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function DetailPanel({ level, id }: { level: CurriculumLevel; id: string }) {
  return (
    <div id={id} role="region" aria-label={`${level.code} curriculum details`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-amber-600">
            {level.code} · {level.stage}
          </p>
          <h3 className="mt-1 text-xl font-bold text-navy-900">{level.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{level.summary}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {level.includedIn.map((p) => (
            <span key={p} className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-800">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h4 className="text-sm font-bold text-navy-900">What you&apos;ll learn</h4>
          <ol className="mt-3 space-y-3">
            {level.topics.map((t, i) => (
              <li key={t.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{t.title}</p>
                  <p className="text-sm text-slate-600">{t.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl bg-amber-50/70 p-5">
          <h4 className="text-sm font-bold text-navy-900">By the end of {level.code}, you can</h4>
          <ul className="mt-3 space-y-2.5">
            {level.outcomes.map((o) => (
              <li key={o} className="flex gap-2 text-sm text-slate-700">
                <Check className="mt-0.5 text-amber-600" />
                {o}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Learning outcomes follow the CEFR framework. Individual progress depends on participation and learning pace.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CurriculumLevels() {
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();
  const active = CURRICULUM_LEVELS.find((l) => l.code === open) ?? null;

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CURRICULUM_LEVELS.map((level) => {
          const isOpen = open === level.code;
          const panelId = `${baseId}-${level.code}`;
          return (
            <div key={level.code} className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : level.code)}
                aria-expanded={isOpen}
                aria-controls={`${panelId} ${panelId}-m`}
                className={`group flex h-full flex-col rounded-2xl border bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isOpen ? "border-amber-400 shadow-lg ring-2 ring-amber-400/40" : "border-slate-200 hover:border-amber-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-xl border px-3 py-1 text-sm font-bold ${level.accent.badge}`}>{level.code}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-base transition-all duration-200 ${
                      isOpen ? "rotate-45 bg-amber-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-700"
                    }`}
                  >
                    +
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold leading-snug text-navy-900">
                  {level.code} – {level.title}
                </h3>
                <ul className="mt-4 flex-1 space-y-2">
                  {level.topics.map((t) => (
                    <li key={t.title} className="flex gap-2 text-sm text-slate-600">
                      <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${level.accent.dot}`} aria-hidden="true" />
                      {t.title}
                    </li>
                  ))}
                </ul>
                <span className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-amber-700">
                  {isOpen ? "Hide details" : "View full curriculum"}
                </span>
              </button>

              {/* Phones: details open directly under the tapped card */}
              {isOpen && (
                <div className="sm:hidden">
                  <DetailPanel level={level} id={`${panelId}-m`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tablet & desktop: full-width details below the cards */}
      {active && (
        <div className="mt-6 hidden sm:block">
          <DetailPanel level={active} id={`${baseId}-${active.code}`} />
        </div>
      )}
    </div>
  );
}
