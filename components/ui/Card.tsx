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
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      {children}
    </>
  );

  const baseStyles =
    "rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={`block ${baseStyles} ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`${baseStyles} ${className}`}>{content}</div>;
}
