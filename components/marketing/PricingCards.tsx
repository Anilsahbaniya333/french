import Link from "next/link";
import { COURSE_PACKAGES, INCLUDED_IN_ALL, PRICING_DISCLAIMER, type CoursePackage } from "@/data/courses";
import Icon from "@/components/marketing/icons";

function PricingCard({ course }: { course: CoursePackage }) {
  const dark = course.highlight === "comprehensive";
  const popular = course.highlight === "popular";

  return (
    <article
      aria-labelledby={`course-${course.id}`}
      className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
        dark
          ? "bg-navy-900 text-white shadow-xl shadow-navy-900/25"
          : popular
            ? "bg-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-500"
            : "bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-md"
      }`}
    >
      {course.badge && (
        <span
          className={`absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold shadow-sm ${
            dark ? "bg-amber-400 text-navy-950" : "bg-amber-500 text-white"
          }`}
        >
          {course.badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`course-${course.id}`} className={`text-lg font-bold leading-snug ${dark ? "text-white" : "text-navy-900"}`}>
            {course.shortName}
          </h3>
          <p className={`mt-0.5 text-sm ${dark ? "text-navy-200" : "text-slate-500"}`}>{course.levelRange}</p>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1.5">
        <span className={`text-4xl font-bold tracking-tight ${dark ? "text-white" : "text-navy-900"}`}>{course.priceLabel}</span>
        <span className={`pb-1 text-sm font-medium ${dark ? "text-navy-200" : "text-slate-500"}`}>CAD</span>
      </div>
      <p className={`text-xs ${dark ? "text-navy-300" : "text-slate-400"}`}>One-time · full package</p>

      <p
        className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          dark ? "bg-white/10 text-white" : "bg-navy-50 text-navy-800"
        }`}
      >
        <Icon name="calendar" className="h-3.5 w-3.5" />
        {course.duration}
      </p>

      <p className={`mt-4 text-sm leading-relaxed ${dark ? "text-navy-100" : "text-slate-600"}`}>{course.tagline}</p>

      <ul className="mt-4 flex-1 space-y-2" role="list">
        {course.keyFeatures.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Icon
              name="check"
              className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-amber-400" : "text-amber-500"}`}
              strokeWidth={2.6}
            />
            <span className={dark ? "text-navy-50" : "text-slate-700"}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/register?course=${course.id}`}
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
          dark || popular
            ? "bg-amber-500 text-white hover:bg-amber-600"
            : "bg-navy-900 text-white hover:bg-navy-800"
        } ${dark ? "focus-visible:ring-offset-navy-900" : ""}`}
      >
        {course.cta}
        <Icon name="arrow" className="h-4 w-4" strokeWidth={2.2} />
      </Link>
    </article>
  );
}

export default function PricingCards() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 pt-3 md:grid-cols-3 md:gap-5">
        {COURSE_PACKAGES.map((c) => (
          <PricingCard key={c.id} course={c} />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-center text-sm font-semibold text-navy-900 md:text-left">Every package includes</p>
        <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start md:gap-x-6" role="list">
          {INCLUDED_IN_ALL.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Icon name="check" className="h-3 w-3" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-slate-500">{PRICING_DISCLAIMER}</p>
    </div>
  );
}
