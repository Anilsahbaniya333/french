import Image from "next/image";
import Link from "next/link";
import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";

interface Tutor {
  id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  experience: string | null;
  specializations: string[];
  qualifications: { title: string; institution: string; year: string }[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  description: string | null;
}

async function getTutors(): Promise<Tutor[]> {
  try {
    const supabase = createServiceRoleClient() ?? createServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("tutors")
      .select("id, full_name, photo_url, bio, experience, specializations, qualifications")
      .order("full_name");
    if (error) return [];
    return (data ?? []) as Tutor[];
  } catch {
    return [];
  }
}

async function getStaff(): Promise<StaffMember[]> {
  try {
    const supabase = createServiceRoleClient() ?? createServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("staff_profiles")
      .select("id, name, role, photo_url, description")
      .order("sort_order")
      .order("created_at");
    if (error?.code === "42P01") return []; // table doesn't exist yet
    if (error) return [];
    return (data ?? []) as StaffMember[];
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const [tutors, staff] = await Promise.all([getTutors(), getStaff()]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-slate-50 py-16 sm:py-24">
        <div className="hero-pattern absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-700">About Us</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            About <span className="text-shimmer">Mappell Academy</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            We are a dedicated French language school offering structured, CEFR-aligned online classes from A1 to B2.
            Our goal is simple — help every student speak French with real confidence.
          </p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {[
              {
                title: "Our Mission",
                body: "To make structured French learning accessible to everyone — with clear progression, expert guidance, and real feedback at every step.",
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                title: "Our Approach",
                body: "We follow the communicative method — you speak from day one. Grammar and vocabulary are taught in context, not in isolation.",
                icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
              },
              {
                title: "What Sets Us Apart",
                body: "Every session is recorded. Every assignment gets personal tutor feedback. You learn at your pace without missing anything.",
                icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-800">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tutors ── */}
      {tutors.length > 0 && (
        <section className="bg-slate-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Expert Instructors</p>
              <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">Our Tutors</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
                Fluent and native French speakers with real classroom experience and a passion for teaching.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200"
                >
                  {/* Photo */}
                  <div className="relative h-48 w-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                    {tutor.photo_url ? (
                      <Image
                        src={tutor.photo_url}
                        alt={tutor.full_name}
                        fill
                        className="object-cover object-top"
                        unoptimized
                      />
                    ) : (
                      <span className="text-5xl font-black text-amber-300 select-none">
                        {tutor.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-base font-bold text-slate-800">{tutor.full_name}</h3>
                    {tutor.experience && (
                      <p className="mt-0.5 text-xs font-semibold text-amber-600">{tutor.experience}</p>
                    )}
                    {tutor.bio && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">{tutor.bio}</p>
                    )}

                    {/* Qualifications */}
                    {(tutor.qualifications ?? []).length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {tutor.qualifications.slice(0, 2).map((q, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                            <svg className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                            <span>{q.title}{q.institution ? ` · ${q.institution}` : ""}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Specialization tags */}
                    {(tutor.specializations ?? []).length > 0 && (
                      <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
                        {tutor.specializations.slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Staff ── */}
      {staff.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Behind the Scenes</p>
              <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">Our Team</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
                The people who keep Mappell Academy running smoothly for every student.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-200"
                >
                  {/* Photo */}
                  <div className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.name}
                        fill
                        className="object-cover object-top"
                        unoptimized
                      />
                    ) : (
                      <span className="text-5xl font-black text-slate-300 select-none">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="text-base font-bold text-slate-800">{member.name}</h3>
                    <p className="mt-0.5 text-xs font-semibold text-amber-600">{member.role}</p>
                    {member.description && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">{member.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-slate-900 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-white sm:text-3xl">Ready to start learning French?</h2>
          <p className="mt-3 text-slate-400 leading-relaxed">
            Take a free placement test and join the right level batch for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
            >
              Join Now
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
