import type { Metadata } from "next";
import PricingCards from "@/components/marketing/PricingCards";
import CurriculumLevels from "@/components/marketing/CurriculumLevels";

export const metadata: Metadata = {
  title: "Courses & Pricing | Mappell French",
  description:
    "A1 Foundation (CAD $350), A1 + A2 Combined (CAD $600), and the Complete A1–B2 Program with TCF / TEF Canada preparation (CAD $1,000).",
};

export default function CoursesPage() {

  return (
    <>
    <section className="relative overflow-hidden bg-navy-950 pb-16 pt-14 sm:pt-20">
      <div className="hero-pattern-light pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-amber-400">Courses &amp; pricing</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[2.75rem] sm:leading-tight">Start from zero. Go as far as B2.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-navy-100">
          Three clear packages — each priced for the complete course, not per month.
        </p>
      </div>
    </section>

    <section className="py-16 sm:py-20" aria-label="Course packages">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingCards />
      </div>
    </section>

    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <p className="mb-2 text-sm font-semibold text-amber-600">CEFR Framework</p>
        <h2 className="text-2xl font-bold text-navy-900 sm:text-[2rem]">Curriculum by level</h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-500">
          Click a level to see the full curriculum. Every package follows this CEFR-aligned progression.
        </p>
      </div>

      <CurriculumLevels />
    </div>
    </>
  );
}
