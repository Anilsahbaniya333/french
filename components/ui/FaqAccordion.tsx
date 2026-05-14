"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-150 ${
                isOpen ? "bg-amber-50" : "hover:bg-slate-50"
              }`}
            >
              <span className={`text-sm font-semibold leading-snug ${isOpen ? "text-amber-700" : "text-slate-800"}`}>
                {item.question}
              </span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                isOpen ? "bg-amber-500 text-white rotate-45" : "bg-slate-100 text-slate-400"
              }`}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-amber-100 bg-amber-50/50 px-6 pb-4 pt-3">
                <p className="text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
