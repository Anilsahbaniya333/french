import Link from "next/link";

interface CardProps {
  title: string;
  description?: string;
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Card({
  title,
  description,
  href,
  children,
  className = "",
}: CardProps) {
  const content = (
    <>
      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">{title}</h3>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>}
      {children}
    </>
  );

  const baseStyles =
    "group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200";

  if (href) {
    return (
      <Link href={href} className={`block ${baseStyles} ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`${baseStyles} ${className}`}>{content}</div>;
}
