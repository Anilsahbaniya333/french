import Link from "next/link";
import Image from "next/image";
import { getLevels } from "@/lib/content";
import { WHY_CHOOSE_US, METHODOLOGY_PREVIEW, FAQ_ITEMS } from "@/data/site";
import FaqAccordion from "@/components/ui/FaqAccordion";
import Button from "@/components/ui/Button";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Program {
  id: string;
  title: string;
  subtitle?: string | null;
  tutor_name?: string | null;
  badge?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
}

/* ── Static data ────────────────────────────────────────────────────────── */

const BADGE_COLORS: Record<string, string> = {
  Free:    "bg-green-100 text-green-700",
  New:     "bg-blue-100 text-blue-700",
  Ongoing: "bg-amber-100 text-amber-700",
  Paid:    "bg-slate-100 text-slate-700",
  Limited: "bg-red-100 text-red-700",
  Popular: "bg-purple-100 text-purple-700",
};

const LEVEL_META: Record<string, {
  difficulty: string;
  diffColor: string;
  badgeColor: string;
  accentBg: string;
  outcome: string;
}> = {
  a1: {
    difficulty: "Beginner",
    diffColor:  "bg-emerald-100 text-emerald-700",
    badgeColor: "border-emerald-200 bg-emerald-50 text-emerald-800",
    accentBg:   "from-emerald-50 to-white",
    outcome:    "Introduce yourself and handle everyday conversations",
  },
  a2: {
    difficulty: "Elementary",
    diffColor:  "bg-blue-100 text-blue-700",
    badgeColor: "border-blue-200 bg-blue-50 text-blue-800",
    accentBg:   "from-blue-50 to-white",
    outcome:    "Express opinions, travel, and describe experiences",
  },
  b1: {
    difficulty: "Intermediate",
    diffColor:  "bg-violet-100 text-violet-700",
    badgeColor: "border-violet-200 bg-violet-50 text-violet-800",
    accentBg:   "from-violet-50 to-white",
    outcome:    "Discuss topics confidently and understand French media",
  },
  b2: {
    difficulty: "Upper-Intermed.",
    diffColor:  "bg-orange-100 text-orange-700",
    badgeColor: "border-orange-200 bg-orange-50 text-orange-800",
    accentBg:   "from-orange-50 to-white",
    outcome:    "Work and study effectively in French environments",
  },
};


const JOURNEY_STEPS = [
  {
    num: "01",
    title: "Choose Your Level",
    desc: "Take a short placement test and we'll match you to the right CEFR level — A1, A2, B1, or B2.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Join Your Group",
    desc: "Get placed in a small batch with a fixed weekly schedule that fits your routine.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Learn with Lessons",
    desc: "Attend live classes and access recordings any time. Work through structured modules and vocabulary.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Submit & Get Feedback",
    desc: "Complete assignments, practise speaking, and receive personal tutor feedback on every submission.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
];

const WHY_ICONS: Record<string, React.ReactNode> = {
  book: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  teacher: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  calendar: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.877V15.12a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  ),
  materials: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
};

/* ── Types ─────────────────────────────────────────────────────────────── */

interface TutorCard {
  id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  experience: string | null;
  specializations: string[];
}

interface StaffCard {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  description: string | null;
}

interface JobTeaser {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
}

/* ── Data fetching ──────────────────────────────────────────────────────── */

async function getPrograms(): Promise<Program[]> {
  try {
    const supabase = createServiceRoleClient() ?? createServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("programs")
      .select("id, title, subtitle, tutor_name, badge, cta_label, cta_href")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");
    return (data ?? []) as Program[];
  } catch {
    return [];
  }
}

async function getTeam(): Promise<{ tutors: TutorCard[]; staff: StaffCard[] }> {
  try {
    const supabase = createServiceRoleClient() ?? createServerClient();
    if (!supabase) return { tutors: [], staff: [] };

    const [tutorsRes, staffRes] = await Promise.all([
      supabase
        .from("tutors")
        .select("id, full_name, photo_url, bio, experience, specializations")
        .eq("show_on_homepage", true)
        .order("full_name"),
      supabase
        .from("staff_profiles")
        .select("id, name, role, photo_url, description")
        .eq("show_on_homepage", true)
        .order("sort_order")
        .order("created_at"),
    ]);

    return {
      tutors: tutorsRes.error ? [] : (tutorsRes.data ?? []),
      staff: staffRes.error ? [] : (staffRes.data ?? []),
    };
  } catch {
    return { tutors: [], staff: [] };
  }
}

async function getJobTeasers(): Promise<JobTeaser[]> {
  try {
    const supabase = createServiceRoleClient() ?? createServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("careers")
      .select("id, title, location, job_type")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at", { ascending: false })
      .limit(3);
    if (error) return [];
    return (data ?? []) as JobTeaser[];
  } catch {
    return [];
  }
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default async function Home() {
  const [levels, programs, team, jobs] = await Promise.all([getLevels(), getPrograms(), getTeam(), getJobTeasers()]);
  const publishedLevels = levels.filter((l) => l.isPublished);

  return (
    <>
      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-slate-50 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="hero-pattern absolute inset-0 opacity-50 pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-amber-200/20 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-sky-200/15 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">

          {/* Overline pill */}
          <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-700">French Language Classes · Online</span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-up text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.08]">
            Learn French<br />
            <span className="text-shimmer">Step by Step</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-delay-1 mt-5 mx-auto max-w-xl text-lg leading-relaxed text-slate-600">
            Live classes, recordings, structured assignments, and expert tutor feedback — everything in one place.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-delay-2 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button href="/register" variant="primary" className="px-8 py-3 text-sm font-bold">
              Join Now
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Button href="/courses" variant="outline" className="px-8 py-3 text-sm font-bold">
              Explore Courses
            </Button>
          </div>

          {/* Feature chips */}
          <div className="animate-fade-up-delay-3 mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
            {[
              { label: "Live online classes" },
              { label: "All sessions recorded" },
              { label: "Expert French tutors" },
              { label: "Assignments + feedback" },
              { label: "PDF notes & vocabulary" },
              { label: "Free placement test" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <svg className="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-slate-700">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Micro social proof */}
          <p className="animate-fade-up-delay-3 mt-6 text-xs text-slate-400">
            CEFR-aligned · A1 to B2 · Free placement test
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          LEVEL CARDS
      ════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24" id="levels">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">CEFR Framework</p>
            <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">Choose Your Level</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
              From complete beginner to confident speaker — each level builds on the last with clear goals.
            </p>
          </div>

          {publishedLevels.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {publishedLevels.map((level) => {
                const meta = LEVEL_META[level.code.toLowerCase()] ?? {
                  difficulty: "All levels",
                  diffColor:  "bg-slate-100 text-slate-600",
                  badgeColor: "border-slate-200 bg-slate-50 text-slate-700",
                  accentBg:   "from-slate-50 to-white",
                  outcome:    "",
                };
                return (
                  <Link
                    key={level.code}
                    href={`/courses/${level.code}`}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl hover:border-amber-200"
                  >
                    {/* Top accent strip */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${meta.accentBg.replace("to-white", "to-transparent")}`}
                      style={{ background: meta.diffColor.includes("emerald") ? "linear-gradient(90deg,#10b981,transparent)" :
                               meta.diffColor.includes("blue")    ? "linear-gradient(90deg,#3b82f6,transparent)" :
                               meta.diffColor.includes("violet")  ? "linear-gradient(90deg,#7c3aed,transparent)" :
                                                                     "linear-gradient(90deg,#f97316,transparent)" }}
                    />

                    <div className="flex flex-col flex-1 p-5">
                      {/* Badge row */}
                      <div className="mb-4 flex items-start justify-between">
                        <span className={`inline-block rounded-xl border px-3 py-1 text-sm font-black uppercase tracking-wide ${meta.badgeColor}`}>
                          {level.code.toUpperCase()}
                        </span>
                        <svg className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:text-amber-500 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      {/* Title & description */}
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{level.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 flex-1">{level.description}</p>

                      {/* Outcome */}
                      {meta.outcome && (
                        <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                          <svg className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {meta.outcome}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${meta.diffColor}`}>
                          {meta.difficulty}
                        </span>
                        <span className="text-xs text-slate-400">{level.modules?.length ?? 0} modules</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">Courses coming soon.</p>
          )}

          <div className="mt-10 text-center">
            <Button href="/courses" variant="secondary">View All Courses</Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STUDENT LEARNING JOURNEY
      ════════════════════════════════════════════════ */}
      <section className="bg-slate-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">How It Works</p>
            <h2 className="text-3xl font-black text-white sm:text-4xl">Your Learning Journey</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400 leading-relaxed">
              From your first lesson to confident conversation — here is the path.
            </p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connector line (desktop only) */}
            <div className="absolute top-9 left-[12.5%] right-[12.5%] hidden h-px border-t border-dashed border-amber-500/30 lg:block" aria-hidden="true" />

            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center lg:items-center">
                {/* Numbered icon */}
                <div className="relative z-10 mb-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-slate-800 shadow-lg">
                  <div className="text-amber-400">{step.icon}</div>
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 max-w-[180px]">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors shadow-lg shadow-amber-900/30"
            >
              Start Your Journey
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PROGRAMS (conditional)
      ════════════════════════════════════════════════ */}
      {programs.length > 0 && (
        <section className="bg-white py-16 sm:py-24" id="programs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Structured Offerings</p>
              <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">Our Programs</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
                Structured offerings to get you speaking French with confidence.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((p) => {
                const badgeClass = p.badge ? (BADGE_COLORS[p.badge] ?? "bg-slate-100 text-slate-700") : null;
                return (
                  <div key={p.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{p.title}</h3>
                      {p.badge && badgeClass && (
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>{p.badge}</span>
                      )}
                    </div>
                    {p.subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.subtitle}</p>}
                    {p.tutor_name && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {p.tutor_name}
                      </p>
                    )}
                    <div className="mt-auto pt-5">
                      {p.cta_href ? (
                        <Link href={p.cta_href} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm">
                          {p.cta_label ?? "Learn more"}
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                          {p.cta_label ?? "Learn more"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          WHY CHOOSE US
      ════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Our Strengths</p>
            <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">Why Students Choose Us</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
              Built for learners who want structure, real practice, and measurable progress.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE_US.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200"
              >
                <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 transition-all duration-200 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110">
                  {WHY_ICONS[item.icon]}
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          METHODOLOGY
      ════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
            <div className="hero-pattern absolute inset-0 opacity-[0.04]" aria-hidden="true" />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

            <div className="relative flex flex-col gap-10 px-8 py-12 sm:px-12 sm:py-16 lg:flex-row lg:items-center lg:gap-16">
              {/* text column */}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400/80 mb-4">Our Approach</p>
                <h2 className="text-2xl font-black text-white sm:text-3xl lg:text-4xl leading-tight">
                  {METHODOLOGY_PREVIEW.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  {METHODOLOGY_PREVIEW.description}
                </p>
                <div className="mt-8">
                  <Link
                    href="/methodology"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-all duration-150 shadow-lg shadow-black/20"
                  >
                    Read about our approach
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* highlights grid */}
              <div className="flex-shrink-0 lg:w-72">
                <div className="grid grid-cols-1 gap-3">
                  {METHODOLOGY_PREVIEW.highlights.map((h) => (
                    <div
                      key={h}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                        <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          OUR TUTORS & TEAM
      ════════════════════════════════════════════════ */}
      {(team.tutors.length > 0 || team.staff.length > 0) && (
        <section className="bg-white py-16 sm:py-24" id="team">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Meet the Team</p>
              <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">Our Tutors &amp; Staff</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
                Expert instructors and a dedicated team — all here to help you succeed in French.
              </p>
            </div>

            {/* Tutors */}
            {team.tutors.length > 0 && (
              <>
                {team.staff.length > 0 && (
                  <p className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">Tutors</p>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {team.tutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-amber-100">
                          {tutor.photo_url ? (
                            <Image src={tutor.photo_url} alt={tutor.full_name} fill className="object-cover" unoptimized />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xl font-black text-amber-700">
                              {tutor.full_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{tutor.full_name}</p>
                          {tutor.experience && (
                            <p className="text-xs text-slate-500 mt-0.5">{tutor.experience}</p>
                          )}
                        </div>
                      </div>

                      {tutor.bio && (
                        <p className="text-sm leading-relaxed text-slate-500 flex-1 line-clamp-3">{tutor.bio}</p>
                      )}

                      {(tutor.specializations ?? []).length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tutor.specializations.slice(0, 3).map((s) => (
                            <span key={s} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Staff */}
            {team.staff.length > 0 && (
              <>
                {team.tutors.length > 0 && (
                  <p className="mt-10 mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">Management &amp; Staff</p>
                )}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {team.staff.map((member) => (
                    <div
                      key={member.id}
                      className="group flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
                          {member.photo_url ? (
                            <Image src={member.photo_url} alt={member.name} fill className="object-cover" unoptimized />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xl font-black text-slate-500">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors">{member.name}</p>
                          <p className="text-xs font-semibold text-amber-600 mt-0.5">{member.role}</p>
                        </div>
                      </div>

                      {member.description && (
                        <p className="text-sm leading-relaxed text-slate-500 line-clamp-3">{member.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          CAREERS TEASER
      ════════════════════════════════════════════════ */}
      {jobs.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-900 overflow-hidden">
              <div className="px-8 py-10 sm:px-12 sm:py-14">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
                  {/* heading col */}
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">We&apos;re Hiring</p>
                    <h2 className="text-2xl font-black text-white sm:text-3xl">Join Our Teaching Team</h2>
                    <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                      We&apos;re looking for passionate French educators and professionals to help students succeed.
                    </p>
                    <Link
                      href="/careers"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
                    >
                      View All Openings
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                  {/* job cards col */}
                  <div className="flex-1 space-y-3">
                    {jobs.map((job) => (
                      <Link
                        key={job.id}
                        href="/careers"
                        className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">{job.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {[job.location, job.job_type].filter(Boolean).join(" · ") || "See details"}
                          </p>
                        </div>
                        <svg className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Got Questions?</p>
            <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mx-auto mt-3 text-slate-500 leading-relaxed">
              Still have a question?{" "}
              <Link href="/contact" className="text-amber-600 hover:underline font-medium">Contact us.</Link>
            </p>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 py-16 sm:py-24">
        <div className="absolute inset-0 hero-pattern opacity-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-100 mb-4">Start Today</p>
          <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight">
            Ready to Speak French?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-amber-100">
            Register now and take a free placement test. We&apos;ll find your level and get you started.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors shadow-xl"
            >
              Join Now
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Talk to Us
            </Link>
          </div>
          <p className="mt-7 text-xs text-amber-200">
            Free placement test · No commitment · Expert support
          </p>
        </div>
      </section>
    </>
  );
}
