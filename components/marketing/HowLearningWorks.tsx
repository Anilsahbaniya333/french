import Icon from "@/components/marketing/icons";
import SectionHeading from "@/components/marketing/SectionHeading";

const STEPS = [
  { icon: "target", title: "Choose Your Course", desc: "Pick the package that matches your starting point and goal." },
  { icon: "user", title: "Register and Join Your Classes", desc: "Register, pay by Interac e-Transfer and upload your confirmation — we verify it and activate your portal." },
  { icon: "video", title: "Attend Live Classes and Review Recordings", desc: "Learn live with your instructor, then rewatch any lesson in your portal." },
  { icon: "clipboard", title: "Complete Weekly Assessments", desc: "Take a weekly mini exam and receive personalized teacher feedback." },
  { icon: "chart", title: "Track Your Progress and Prepare for Your Exam", desc: "Follow your progress in the portal as you work toward your level and exam." },
] as const;

export default function HowLearningWorks() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 sm:py-28" aria-labelledby="how-heading">
      <div className="hero-pattern-light pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="how-heading"
          dark
          eyebrow="How learning works"
          title="Five simple steps from sign-up to exam day"
        />

        <div className="relative">
        <div
          className="pointer-events-none absolute left-[10%] right-[10%] top-7 hidden border-t border-dashed border-amber-400/30 lg:block"
          aria-hidden="true"
        />
        <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-navy-800 text-amber-400 shadow-lg">
                <Icon name={s.icon} className="h-6 w-6" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-extrabold text-white">
                  {i + 1}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-amber-400/90">Step {i + 1}</p>
              <h3 className="mt-1 text-sm font-bold leading-snug text-white">{s.title}</h3>
              <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-navy-200">{s.desc}</p>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}
