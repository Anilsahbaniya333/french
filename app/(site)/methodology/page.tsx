import { getMethodology } from "@/lib/content";

export default async function MethodologyPage() {
  const content = await getMethodology();

  if (!content) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-slate-800">Our Methodology</h1>
        <p className="mt-4 text-slate-500">No methodology content available yet.</p>
      </div>
    );
  }

  const sections = [
    { title: "Introduction",        content: content.introduction },
    { title: "Teaching Approach",   content: content.teachingApproach },
    { title: "Weekly Structure",    content: content.weeklyStructure },
    { title: "Grammar",             content: content.grammarApproach },
    { title: "Listening",           content: content.listeningApproach },
    { title: "Speaking",            content: content.speakingApproach },
    { title: "Reading",             content: content.readingApproach },
    { title: "Writing",             content: content.writingApproach },
    { title: "Assignment Workflow", content: content.assignmentWorkflow },
    { title: "Progress Tracking",   content: content.progressTracking },
  ].filter((s) => s.content);

  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">How We Teach</p>
        <h1 className="text-4xl font-black text-slate-800 leading-tight">Our Methodology</h1>
        <p className="mt-3 text-lg text-slate-500">
          How we teach French at Mappele French
        </p>
        <div className="mt-6 h-1 w-16 rounded-full bg-amber-500" />
      </div>

      <div className="space-y-8">
        {sections.map((section, i) => (
          <section
            key={section.title}
            className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xs font-black text-amber-700">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{section.content}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
