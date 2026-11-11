import Icon from "@/components/marketing/icons";
import SectionHeading from "@/components/marketing/SectionHeading";

/**
 * Every portal item listed here maps to a page under /student/dashboard:
 * daily-recordings, lessons (materials & PDFs), assignments, feedback, learning-progress.
 * Weekly mini exams are delivered and graded through Assignments + Feedback.
 */
const PORTAL_ITEMS = [
  "Class recordings",
  "Course materials and PDF notes",
  "Weekly assignments",
  "Mini exam results",
  "Personalized teacher feedback",
  "Learning progress",
];

export default function WhyMappell() {
  return (
    <section id="why-mappell" className="scroll-mt-24 bg-white py-20 sm:py-28" aria-labelledby="why-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="why-heading"
          eyebrow="Why Mappell French"
          title="Everything you need to make real progress"
          description="Structured instruction, regular assessment, and one place to keep all of your learning."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-amber-400 transition-transform duration-300 group-hover:scale-110">
              <Icon name="video" className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-navy-900">Live Classes + Recordings</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Attend interactive online French classes with experienced instructors.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Access class recordings to review lessons, reinforce your understanding, and catch up when needed.
            </p>
          </div>

          <div className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-amber-400 transition-transform duration-300 group-hover:scale-110">
              <Icon name="clipboard" className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-navy-900">Weekly Mini Exams + Personalized Feedback</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Every week, students complete a mini assessment to track their learning progress.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Teachers provide personalized feedback highlighting strengths, weaknesses, and areas requiring improvement.
            </p>
          </div>

          <div className="group rounded-3xl bg-navy-900 p-8 text-white shadow-xl shadow-navy-900/20 transition-all duration-300 hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white transition-transform duration-300 group-hover:scale-110">
              <Icon name="portal" className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-bold">Personal Student Learning Portal</h3>
            <p className="mt-3 text-sm leading-relaxed text-navy-100">
              Every registered student receives access to a dedicated learning portal with:
            </p>
            <ul className="mt-4 grid gap-2.5" role="list">
              {PORTAL_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-navy-50">
                  <Icon name="check" className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={2.6} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
