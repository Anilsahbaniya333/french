import Link from "next/link";
import LogoImage from "@/components/LogoImage";

/** Shared layout for Student Login / Forgot password / Set password. */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Mappell French — home">
            <LogoImage size={44} imgClassName="object-contain h-10 w-auto" />
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-navy-900">
            ← Back to website
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold text-amber-600">Student Portal</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-navy-900/5 sm:p-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export const authInput =
  "block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30";
export const authButton =
  "flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
