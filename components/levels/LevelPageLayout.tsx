import Link from "next/link";
import type { Level } from "@/types/curriculum";
import Button from "@/components/ui/Button";
import VideoEmbed from "./VideoEmbed";
import MaterialCard from "./MaterialCard";

interface LevelPageLayoutProps {
  level: Level;
}

export default function LevelPageLayout({ level }: LevelPageLayoutProps) {
  return (
    <article className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 via-white to-sky-50 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-600">
            Level {level.code.toUpperCase()}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800 sm:text-4xl">
            {level.title}
          </h1>
          {level.subtitle && (
            <p className="mt-2 text-xl text-slate-600">{level.subtitle}</p>
          )}
          <p className="mt-4 text-slate-600">{level.description}</p>
          {level.duration && (
            <p className="mt-2 text-sm text-slate-500">Duration: {level.duration}</p>
          )}
          <div className="mt-6">
            <Button href={`/register?level=${level.code.toUpperCase()}`} variant="primary">
              Apply for this level
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Overview */}
        {level.overview && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
            <p className="mt-3 text-slate-600">{level.overview}</p>
          </section>
        )}

        {/* Level goals */}
        {level.levelGoals && level.levelGoals.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-800">What you'll achieve</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
              {level.levelGoals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Modules & Topics */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800">Curriculum</h2>
          <div className="mt-6 space-y-10">
            {level.modules.map((module, mi) => (
              <div key={module.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-slate-800">
                  Module {mi + 1}: {module.title}
                </h3>
                {module.description && (
                  <p className="mt-1 text-slate-600">{module.description}</p>
                )}
                <ol className="mt-4 space-y-4">
                  {module.topics.map((topic, ti) => (
                    <li key={topic.id} className="border-l-2 border-amber-200 pl-4">
                      <Link
                        href={`/courses/${level.code}/${module.id}/${topic.id}`}
                        className="font-medium text-slate-800 hover:text-amber-600 transition-colors"
                      >
                        {topic.title}
                        {topic.isPreview && (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                            Preview
                          </span>
                        )}
                      </Link>
                      {topic.description && (
                        <p className="mt-0.5 text-sm text-slate-600">{topic.description}</p>
                      )}
                      {topic.estimatedDuration && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {topic.estimatedDuration}
                        </p>
                      )}
                      {/* Inline content for this topic */}
                      <div className="mt-3 space-y-3">
                        {topic.videos.map((v) => (
                          <VideoEmbed key={v.id} title={v.title} url={v.url} />
                        ))}
                        {topic.materials.map((m) => (
                          <MaterialCard key={m.id} material={m} />
                        ))}
                        {topic.assignments.map((a) => (
                          <div
                            key={a.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="font-medium text-slate-800">{a.title}</p>
                            <p className="mt-0.5 text-sm text-slate-600">{a.instructions}</p>
                            {a.dueNote && (
                              <p className="mt-1 text-xs text-slate-500">{a.dueNote}</p>
                            )}
                          </div>
                        ))}
                        {topic.practice.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="font-medium text-slate-800">{p.title}</p>
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
                              {p.type}
                            </span>
                            {p.instructions && (
                              <p className="mt-1 text-sm text-slate-600">{p.instructions}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-slate-800 px-6 py-10 text-center text-white">
          <h2 className="text-xl font-bold">Ready to join?</h2>
          <p className="mt-2 text-slate-300">
            Register now and start your French learning journey at {level.title}.
          </p>
          <div className="mt-6">
            <Link
              href={`/register?level=${level.code.toUpperCase()}`}
              className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
            >
              Apply for this level
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
