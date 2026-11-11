"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import LogoImage from "@/components/LogoImage";

const NAV_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/courses", label: "Courses" },
  { href: "/#why-mappell", label: "Why Mappell" },
  { href: "/student/login", label: "Student Login" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (href.includes("#")) return false;
    return exact ? pathname === href : pathname.startsWith(href);
  };

  const registerActive = pathname.startsWith("/register");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Mappell French — home">
          <LogoImage size={64} imgClassName="object-contain h-14 w-auto" />
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 text-sm font-semibold text-slate-600 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3.5 py-2 transition-colors duration-150 ${
                    active ? "bg-navy-50 text-navy-900" : "hover:bg-slate-50 hover:text-navy-900"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="ml-2">
            <Link
              href="/register"
              aria-current={registerActive ? "page" : undefined}
              className="inline-flex items-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-500/30 transition-all duration-150 hover:-translate-y-0.5 hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Register Now
            </Link>
          </li>
        </ul>

        {/* Mobile: Register + menu toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/register"
            className="whitespace-nowrap rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-600"
          >
            Register Now
          </Link>
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={() => setIsOpen((o) => !o)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {isOpen && (
        <div id="mobile-menu" className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 shadow-lg lg:hidden">
          <ul className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      active ? "bg-navy-50 text-navy-900" : "text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
