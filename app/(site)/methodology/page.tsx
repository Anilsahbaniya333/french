import { getMethodology } from "@/lib/content";

export default async function MethodologyPage() {
  const content = await getMethodology();

  if (!content) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-800">Our Methodology</h1>
        <p className="mt-4 text-slate-600">No methodology content available yet.</p>
      </div>
    );
  }

  const sections = [
    { title: "Introduction", content: content.introduction },
    { title: "Teaching Approach", content: content.teachingApproach },
    { title: "Weekly Structure", content: content.weeklyStructure },
    { title: "Grammar", content: content.grammarApproach },
    { title: "Listening", content: content.listeningApproach },
    { title: "Speaking", content: content.speakingApproach },
    { title: "Reading", content: content.readingApproach },
    { title: "Writing", content: content.writingApproach },
    { title: "Assignment Workflow", content: content.assignmentWorkflow },
    { title: "Progress Tracking", content: content.progressTracking },
  ].filter((s) => s.content);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-800">Our Methodology</h1>
      <p className="mt-2 text-slate-500">
        How we teach French at Mappele French
      </p>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-slate-800">{section.title}</h2>
            <p className="mt-3 text-slate-600 whitespace-pre-wrap">{section.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
