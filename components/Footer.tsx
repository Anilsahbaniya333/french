import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/methodology", label: "Methodology" },
  { href: "/register", label: "Register" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-lg font-bold text-slate-800">
              Mappele French
            </Link>
            <p className="mt-2 text-sm text-slate-600 max-w-xs">
              Learn French with confidence. Structured courses from A1 to B2.
            </p>
          </div>
          <nav>
            <ul className="flex flex-wrap gap-6 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-600 hover:text-amber-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            &copy; {year} Mappele French. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
