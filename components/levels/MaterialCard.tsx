import type { TopicMaterial } from "@/types/curriculum";

interface MaterialCardProps {
  material: TopicMaterial;
}

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  link: "Link",
  text: "Text",
};

function getIcon(type: string) {
  switch (type) {
    case "pdf":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "doc":
    case "docx":
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "link":
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
  }
}

export default function MaterialCard({ material }: MaterialCardProps) {
  const typeLabel = TYPE_LABELS[material.type] ?? material.type;
  const href = material.publicUrl || material.contentText ? undefined : "#";
  const isDownload = material.type === "pdf" || material.type === "doc" || material.type === "docx";

  const content = (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
        {getIcon(material.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-800">{material.title}</p>
        {material.description && (
          <p className="mt-0.5 text-sm text-slate-600">{material.description}</p>
        )}
        <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {typeLabel}
        </span>
      </div>
      {material.publicUrl && (
        <span className="shrink-0 text-amber-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </span>
      )}
    </div>
  );

  if (material.publicUrl) {
    return (
      <a
        href={material.publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        download={isDownload}
      >
        {content}
      </a>
    );
  }

  if (material.contentText) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="font-medium text-slate-800">{material.title}</p>
        {material.description && (
          <p className="mt-0.5 text-sm text-slate-600">{material.description}</p>
        )}
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
          {material.contentText}
        </div>
      </div>
    );
  }

  return content;
}
