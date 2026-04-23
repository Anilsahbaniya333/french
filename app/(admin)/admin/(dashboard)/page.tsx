"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  total_students: number;
  total_submissions: number;
  total_assignments: number;
  pending_review: number;
  recent_submissions: {
    id: string;
    student_name: string;
    student_email: string;
    status: string;
    submitted_at: string;
    assignments?: { title: string };
  }[];
}

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700",
  reviewed: "bg-sky-100 text-sky-700",
  feedback_sent: "bg-purple-100 text-purple-700",
  graded: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
};

function StatCard({
  label,
  value,
  icon,
  href,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const QUICK_ACTIONS = [
    { href: "/admin/students", label: "Create Student Account", desc: "Add a new student and assign them to a group", icon: "👤" },
    { href: "/admin/assignments", label: "Post New Assignment", desc: "Create an assignment and publish to groups", icon: "📝" },
    { href: "/admin/groups", label: "Review Submissions", desc: "Grade student submissions and send feedback", icon: "✅" },
    { href: "/admin/levels", label: "Edit Course Content", desc: "Update lesson materials, videos, and resources", icon: "📚" },
    { href: "/admin/feedback", label: "Student Feedback", desc: "Read messages and suggestions from students", icon: "💬" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-slate-500">Welcome back. Here&apos;s an overview of your platform.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={stats.total_students}
            href="/admin/students"
            accent="bg-amber-100"
            icon={
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            label="Assignments Posted"
            value={stats.total_assignments}
            href="/admin/assignments"
            accent="bg-sky-100"
            icon={
              <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Total Submissions"
            value={stats.total_submissions}
            href="/admin/groups"
            accent="bg-emerald-100"
            icon={
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label="Pending Review"
            value={stats.pending_review}
            href="/admin/groups"
            accent={stats.pending_review > 0 ? "bg-rose-100" : "bg-slate-100"}
            icon={
              <svg className={`h-6 w-6 ${stats.pending_review > 0 ? "text-rose-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quick actions */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-slate-700">Quick Actions</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-amber-300 hover:bg-amber-50 transition-colors group"
              >
                <span className="text-xl mt-0.5">{action.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-700">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent submissions */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Recent Submissions</h2>
            <Link href="/admin/groups" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              View all →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            {loading ? (
              <div className="space-y-0 divide-y divide-slate-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 px-4 py-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-1.5 py-1">
                      <div className="h-3 w-1/2 rounded bg-slate-200" />
                      <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !stats || stats.recent_submissions.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No submissions yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_submissions.map((s) => {
                  const style = STATUS_STYLES[s.status] ?? "bg-slate-100 text-slate-600";
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {s.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {s.student_name}
                          {s.assignments?.title && (
                            <span className="font-normal text-slate-500"> — {s.assignments.title}</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(s.submitted_at).toLocaleDateString(undefined, {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}>
                        {s.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
