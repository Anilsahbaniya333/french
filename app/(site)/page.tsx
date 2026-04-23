import Link from "next/link";
import { getLevels } from "@/lib/content";
import { WHY_CHOOSE_US, METHODOLOGY_PREVIEW } from "@/data/site";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";

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
  Free: "bg-green-100 text-green-700",
  New: "bg-blue-100 text-blue-700",
  Ongoing: "bg-amber-100 text-amber-700",
  Paid: "bg-slate-100 text-slate-700",
  Limited: "bg-red-100 text-red-700",
  Popular: "bg-purple-100 text-purple-700",
};

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

export default async function Home() {
  const [levels, programs] = await Promise.all([getLevels(), getPrograms()]);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-sky-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
              Learn French with{" "}
              <span className="text-amber-600">Mappele French</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Structured courses from beginner to upper intermediate. Master French with
              experienced teachers, clear progression, and materials you can trust.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button href="/courses" variant="primary">
                Explore Courses
              </Button>
              <Button href="/register" variant="outline">
                Join Now
              </Button>
              <Link
                href="/student/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-amber-500 bg-white px-6 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Student Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Levels Overview */}
      <section className="py-16 sm:py-24" id="levels">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">
              Choose Your Level
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              From complete beginner to confident speaker. Each level builds on the previous.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {levels.filter((l) => l.isPublished).map((level) => (
              <Card
                key={level.code}
                title={level.title}
                description={level.description}
                href={`/courses/${level.code}`}
              >
                <div className="mt-4">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800">
                    {level.modules?.length ?? 0} modules
                  </span>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button href="/courses" variant="secondary">
              View All Courses
            </Button>
          </div>
        </div>
      </section>

      {/* Programs / Offers */}
      {programs.length > 0 && (
        <section className="bg-white py-16 sm:py-24" id="programs">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">Our Programs</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                Structured offerings to get you speaking French with confidence.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programs.map((p) => {
                const badgeClass =
                  p.badge ? (BADGE_COLORS[p.badge] ?? "bg-slate-100 text-slate-700") : null;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-amber-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-800">{p.title}</h3>
                      {p.badge && badgeClass && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>
                    {p.subtitle && (
                      <p className="mt-2 text-sm text-slate-600">{p.subtitle}</p>
                    )}
                    {p.tutor_name && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {p.tutor_name}
                      </p>
                    )}
                    <div className="mt-auto pt-5">
                      {p.cta_href ? (
                        <Link
                          href={p.cta_href}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                        >
                          {p.cta_label ?? "Learn more"}
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700">
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

      {/* Why Choose Us */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">
              Why Choose Us
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              We're built for learners who want structure, flexibility, and real progress.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE_US.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center"
              >
                <div className="flex justify-center">
                  <Icon name={item.icon as "book" | "teacher" | "calendar" | "materials"} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Preview */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-12 text-white sm:px-12 sm:py-16">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {METHODOLOGY_PREVIEW.title}
            </h2>
            <p className="mt-4 max-w-2xl text-slate-300">
              {METHODOLOGY_PREVIEW.description}
            </p>
            <ul className="mt-6 flex flex-wrap gap-4">
              {METHODOLOGY_PREVIEW.highlights.map((h) => (
                <li
                  key={h}
                  className="inline-flex items-center rounded-full bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-200"
                >
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/methodology"
                className="inline-flex items-center text-amber-400 hover:text-amber-300 font-medium"
              >
                Read more about our approach
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-amber-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">
            Ready to Start?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Register now and take a placement test. We'll help you find the right level.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button href="/register" variant="primary">
              Join Now
            </Button>
            <Button href="/contact" variant="outline">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
