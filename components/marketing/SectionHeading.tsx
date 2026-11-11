export default function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  dark?: boolean;
  id?: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className={`mb-2 text-sm font-semibold ${dark ? "text-amber-400" : "text-amber-600"}`}>
        {eyebrow}
      </p>
      <h2 id={id} className={`text-2xl font-bold tracking-tight sm:text-[2rem] sm:leading-tight ${dark ? "text-white" : "text-navy-900"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-4 leading-relaxed ${dark ? "text-navy-200" : "text-slate-600"}`}>{description}</p>
      )}
    </div>
  );
}
