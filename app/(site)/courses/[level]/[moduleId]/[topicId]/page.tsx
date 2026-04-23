import { notFound } from "next/navigation";
import TopicLearningPage from "@/components/TopicLearningPage";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ level: string; moduleId: string; topicId: string }>;
}) {
  const { level, moduleId, topicId } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/topics/${topicId}`,
    { cache: "no-store" }
  );
  if (!res.ok) notFound();
  const data = await res.json();
  if (!data.topic) notFound();

  return (
    <TopicLearningPage
      topicData={data}
      levelCode={level}
      moduleId={moduleId}
    />
  );
}
