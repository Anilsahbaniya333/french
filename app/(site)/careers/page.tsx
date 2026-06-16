import { createServiceRoleClient, createServerClient } from "@/lib/supabase/server";
import CareersList from "@/components/careers/CareersList";

interface Job {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  description: string | null;
  requirements: string | null;
  created_at: string;
}

async function getJobs(): Promise<Job[]> {
  try {
    const supabase = createServiceRoleClient() ?? createServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("careers")
      .select("id, title, location, job_type, description, requirements, created_at")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error?.code === "42P01") return [];
    if (error) return [];
    return (data ?? []) as Job[];
  } catch {
    return [];
  }
}

export default async function CareersPage() {
  const jobs = await getJobs();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-slate-50 py-16 sm:py-24">
        <div className="hero-pattern absolute inset-0 opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Join Our Team</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Careers at <span className="text-shimmer">Mappell Academy</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            We&apos;re growing — and we&apos;re looking for passionate educators and professionals to join us.
            Help thousands of students speak French with confidence.
          </p>
        </div>
      </section>

      {/* Jobs + Apply modal */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <CareersList jobs={jobs} />
        </div>
      </section>
    </>
  );
}
