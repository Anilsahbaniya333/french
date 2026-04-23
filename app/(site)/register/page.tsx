import RegistrationForm from "@/components/forms/RegistrationForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-800">Student Registration</h1>
      <p className="mt-2 text-slate-600">
        Fill in your details and we'll help you find the right level.
      </p>
      <div className="mt-8">
        <RegistrationForm defaultLevel={level ?? ""} />
      </div>
    </div>
  );
}
