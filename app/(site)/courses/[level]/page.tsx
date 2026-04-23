import { notFound } from "next/navigation";
import { getLevelByCode } from "@/lib/content";
import LevelPageLayout from "@/components/levels/LevelPageLayout";

export default async function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const levelData = await getLevelByCode(level);

  if (!levelData) notFound();

  return <LevelPageLayout level={levelData} />;
}
