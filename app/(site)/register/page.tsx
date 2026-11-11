import type { Metadata } from "next";
import Link from "next/link";
import RegistrationForm from "@/components/forms/RegistrationForm";
import AdmissionsContact from "@/components/marketing/AdmissionsContact";
import { getCoursePackage, type CourseId } from "@/data/courses";

export const metadata: Metadata = {
  title: "Register | Mappell French",
  description:
    "Register for Mappell French online classes — A1 Foundation, A1 + A2, or the complete A1–B2 program with TCF / TEF Canada preparation. Pay by Interac e-Transfer; enrollment is confirmed after payment verification.",
};

/** Legacy links (/register?level=A2) map to the package that covers that level. */
const LEVEL_TO_COURSE: Record<string, CourseId> = {
  a1: "a1-foundation",
  a2: "a1-a2-package",
  b1: "a1-b2-complete",
  b2: "a1-b2-complete",
};

const REASSURANCES = [
  "Pay securely by Interac e-Transfer",
  "Enrollment confirmed after payment verification",
  "Prices in CAD — complete package, not monthly",
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; level?: string }>;
}) {
  const { course, level } = await searchParams;
  const defaultCourse =
    getCoursePackage(course)?.id ?? (level ? LEVEL_TO_COURSE[level.toLowerCase()] : undefined) ?? "";

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-24 pt-14 sm:pb-28 sm:pt-20">
        <div className="hero-pattern-light pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-amber-400">Student registration</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[2.75rem] sm:leading-tight">
            Begin Your French Learning Journey
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-navy-100">
            Three quick steps: choose a course, add your details, and upload your Interac e-Transfer screenshot.
          </p>
          <p className="mt-3 text-sm text-navy-200">
            Already enrolled with Mappell French?{" "}
            <Link href="/student/login" className="font-semibold text-amber-300 underline-offset-2 hover:underline">
              Sign in
            </Link>{" "}
            to your Student Portal.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-navy-200">
            {REASSURANCES.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-navy-900/5 sm:p-10">
          <RegistrationForm defaultCourse={defaultCourse} />
        </div>
        <div className="mt-6">
          <AdmissionsContact compact />
        </div>
      </div>
    </>
  );
}
