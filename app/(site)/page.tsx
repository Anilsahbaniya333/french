import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS } from "@/data/site";
import { COURSE_PACKAGES } from "@/data/courses";
import FaqAccordion from "@/components/ui/FaqAccordion";
import Icon from "@/components/marketing/icons";
import SectionHeading from "@/components/marketing/SectionHeading";
import PricingCards from "@/components/marketing/PricingCards";
import WhyMappell from "@/components/marketing/WhyMappell";
import HowLearningWorks from "@/components/marketing/HowLearningWorks";
import AdmissionsContact from "@/components/marketing/AdmissionsContact";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mappell French | Online French Classes & TCF / TEF Canada Preparation",
  description:
    "Start French from zero and prepare for TCF & TEF Canada. Live online classes with recordings, weekly mini exams, personalized feedback, and a personal student portal. Packages from CAD $350.",
  openGraph: {
    title: "Mappell French — Start French from Zero. Prepare for TCF & TEF Canada.",
    description:
      "Structured live classes, weekly assessments, personalized feedback, and a dedicated student learning portal.",
    type: "website",
    url: "/",
    siteName: "Mappell Academy",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Mappell Academy — French · Future · Freedom" }],
  },
};

/* ── Types & static data ───────────────────────────────────────────────── */

interface Program {
  id: string;
  title: string;
  subtitle?: string | null;
  tutor_name?: string | null;
  badge?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
}

const BADGE_COLORS: Record<string, string> = {
  Free:    "bg-green-100 text-green-700",
  New:     "bg-blue-100 text-blue-700",
  Ongoing: "bg-amber-100 text-amber-700",
  Paid:    "bg-slate-100 text-slate-700",
  Limited: "bg-red-100 text-red-700",
  Popular: "bg-purple-100 text-purple-700",
};

const HERO_BENEFITS = [
  { icon: "video", title: "Live Classes + Recordings", desc: "Learn live with an instructor and rewatch any lesson." },
  { icon: "clipboard", title: "Weekly Mini Exams + Personalized Feedback", desc: "Know exactly what to improve each week." },
  { icon: "portal", title: "Personal Student Learning Portal", desc: "Recordings, notes, assignments and progress in one place." },
] as const;

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  },
  ...COURSE_PACKAGES.map((c) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.name,
    description: c.description,
    provider: { "@type": "Organization", name: "Mappell French" },
    offers: { "@type": "Offer", price: c.priceCad, priceCurrency: "CAD", category: "Paid" },
  })),
];

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
  const [programs, jobs] = await Promise.all([getPrograms(), getJobTeasers()]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-navy-950 pb-36 pt-16 sm:pb-44 sm:pt-24">
        <div className="hero-pattern-light pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-amber-500/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-navy-600/30 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="animate-fade-in inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold text-amber-200 sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            Online French Classes <span className="text-amber-400/50" aria-hidden="true">|</span> TCF &amp; TEF Canada Preparation
          </p>

          <h1 className="animate-fade-up mt-6 text-[2rem] font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            Start French from Zero.
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Prepare for TCF &amp; TEF Canada.
            </span>
          </h1>

          <p className="animate-fade-up-delay-1 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-navy-100 sm:text-lg">
            From learning your first French words to preparing for your TCF or TEF Canada exam, Mappell French offers
            structured live classes, weekly assessments, personalized feedback, and a dedicated student learning portal.
          </p>

          <div className="animate-fade-up-delay-2 mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="#courses"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
            >
              Explore Our Courses
              <Icon name="arrow" className="h-4 w-4" strokeWidth={2.2} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Register Now
            </Link>
          </div>

          <p className="animate-fade-up-delay-3 mt-6 text-xs text-navy-300">
            Packages from CAD $350 · Pay by Interac e-Transfer
          </p>
        </div>
      </section>

      {/* Benefit cards overlapping the hero */}
      <section aria-label="Key benefits" className="relative z-10 -mt-24 sm:-mt-28">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {HERO_BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-navy-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition-colors duration-300 group-hover:bg-amber-500 group-hover:text-white">
                <Icon name={b.icon} className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[0.95rem] font-bold leading-snug text-navy-900">{b.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          COURSE PRICING
      ════════════════════════════════════════════════ */}
      <section id="courses" className="scroll-mt-24 py-20 sm:py-28" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="pricing-heading"
            eyebrow="Courses & pricing"
            title="Clear packages. One price. No monthly fees."
            description="Every package starts from zero and includes live classes with recordings, weekly mini exams with personalized feedback, and your personal learning portal."
          />
          <PricingCards />
          <p className="mt-6 text-center text-sm text-slate-600">
            Want to see what each level covers?{" "}
            <Link href="/courses" className="font-semibold text-amber-700 underline-offset-2 hover:underline">
              Browse the A1–B2 curriculum
            </Link>
          </p>
        </div>
      </section>

      <WhyMappell />

      <HowLearningWorks />

      {/* ════════════════════════════════════════════════
          PROGRAMS (conditional)
      ════════════════════════════════════════════════ */}
      {programs.length > 0 && (
        <section className="bg-white py-16 sm:py-24" id="programs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Structured Offerings</p>
              <h2 className="text-2xl font-bold text-navy-900 sm:text-[2rem]">Our Programs</h2>
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
                      <h3 className="text-sm font-bold text-navy-900 group-hover:text-amber-700 transition-colors">{p.title}</h3>
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
          CAREERS TEASER
      ════════════════════════════════════════════════ */}
      {jobs.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-navy-900 overflow-hidden">
              <div className="px-8 py-10 sm:px-12 sm:py-14">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
                  {/* heading col */}
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">We&apos;re Hiring</p>
                    <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Join Our Teaching Team</h2>
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
      <section id="faq" className="scroll-mt-24 bg-white py-20 sm:py-28" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading id="faq-heading" eyebrow="Got questions?" title="Frequently Asked Questions" />
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      <AdmissionsContact />

      {/* ════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 py-16 sm:py-24">
        <div className="hero-pattern-light pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            Begin your French learning journey
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-amber-50">
            Choose your course, pay by Interac e-Transfer, and upload your confirmation. Our admissions team verifies
            your payment and activates your Student Portal.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-950 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-colors hover:bg-navy-900"
            >
              Register Now
              <Icon name="arrow" className="h-4 w-4" strokeWidth={2.2} />
            </Link>
            <Link
              href="#courses"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/50 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Compare Courses
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
