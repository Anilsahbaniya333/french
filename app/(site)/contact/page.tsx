import ContactForm from "@/components/forms/ContactForm";
import { createServiceRoleClient } from "@/lib/supabase/server";

async function getContactSettings() {
  const supabase = createServiceRoleClient();
  if (!supabase) return {};
  const { data } = await supabase.from("site_settings").select("key, value");
  if (!data) return {};
  return Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));
}

export default async function ContactPage() {
  const settings = await getContactSettings().catch(() => ({})) as Record<string, string>;
  const email = settings.contact_email;
  const phone = settings.contact_phone;
  const phone2 = settings.contact_phone_2;
  const address = settings.contact_address;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-800">Contact Us</h1>
      <p className="mt-4 text-slate-600">
        Have a question or want to learn more? Send us a message and we&apos;ll be in touch.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        {/* Contact info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">Get in touch</h2>

            {email && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</p>
                  <a href={`mailto:${email}`} className="text-sm text-slate-700 hover:text-amber-600 transition-colors">
                    {email}
                  </a>
                </div>
              </div>
            )}

            {phone && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</p>
                  <a href={`tel:${phone}`} className="text-sm text-slate-700 hover:text-amber-600 transition-colors">
                    {phone}
                  </a>
                  {phone2 && (
                    <a href={`tel:${phone2}`} className="block text-sm text-slate-700 hover:text-amber-600 transition-colors">
                      {phone2}
                    </a>
                  )}
                </div>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{address}</p>
                </div>
              </div>
            )}

            {!email && !phone && !address && (
              <p className="text-sm text-slate-400">Contact details coming soon.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
