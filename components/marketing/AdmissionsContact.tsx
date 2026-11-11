import Link from "next/link";
import { ADMISSIONS_EMAIL } from "@/data/courses";
import Icon from "@/components/marketing/icons";
import { PhoneList } from "@/components/ContactPhones";

export default function AdmissionsContact({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-2xl border border-navy-100 bg-navy-50 p-5">
        <p className="text-sm font-bold text-navy-900">Questions before enrolling?</p>
        <p className="mt-1 text-sm text-slate-600">
          Contact our admissions team at{" "}
          <a href={`mailto:${ADMISSIONS_EMAIL}`} className="break-all font-semibold text-amber-700 underline-offset-2 hover:underline">
            {ADMISSIONS_EMAIL}
          </a>
        </p>
        <div className="mt-3">
          <PhoneList />
        </div>
      </div>
    );
  }

  return (
    <section id="contact-admissions" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20" aria-labelledby="admissions-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Icon name="mail" className="h-6 w-6" />
            </div>
            <div>
              <h2 id="admissions-heading" className="text-xl font-extrabold text-navy-900">
                Have questions before enrolling?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Contact our admissions team at{" "}
                <a href={`mailto:${ADMISSIONS_EMAIL}`} className="break-all font-semibold text-amber-700 underline-offset-2 hover:underline">
                  {ADMISSIONS_EMAIL}
                </a>
                , or call / WhatsApp us:
              </p>
              <div className="mt-3">
                <PhoneList />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a
              href={`mailto:${ADMISSIONS_EMAIL}?subject=${encodeURIComponent("Enrollment question — Mappell French")}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-800"
            >
              <Icon name="mail" className="h-4 w-4" />
              Contact Admissions
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-navy-900 transition-colors hover:border-navy-300 hover:bg-slate-50"
            >
              Contact form
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
