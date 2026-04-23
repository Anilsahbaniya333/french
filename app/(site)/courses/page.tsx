import { getLevels } from "@/lib/content";
import Card from "@/components/ui/Card";

export default async function CoursesPage() {
  const levels = await getLevels();
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">Our Courses</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Choose your level and start learning. Each course follows the CEFR framework.
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
            <ul className="mt-4 space-y-1 text-xs text-slate-500">
              {level.modules?.slice(0, 3).map((m) => (
                <li key={m.id}>• {m.title}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
