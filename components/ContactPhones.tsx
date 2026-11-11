import { CONTACT_PHONES } from "@/data/site";
import { ADMISSIONS_EMAIL } from "@/data/courses";

export function PhoneIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Slim contact bar shown above the navbar on every public page. */
export function TopContactBar() {
  return (
    <div className="bg-navy-950 text-navy-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 text-xs sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {CONTACT_PHONES.map((p) => (
            <span key={p.tel} className="inline-flex items-center gap-2">
              <a href={`tel:${p.tel}`} className="inline-flex items-center gap-1.5 font-medium hover:text-amber-300" aria-label={`Call ${p.label}: ${p.display}`}>
                <PhoneIcon />
                {p.display}
              </a>
              <a
                href={p.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300 hover:bg-emerald-500/25"
                aria-label={`WhatsApp ${p.display}`}
              >
                <WhatsAppIcon className="h-3 w-3" />
                WhatsApp
              </a>
            </span>
          ))}
        </div>
        <a href={`mailto:${ADMISSIONS_EMAIL}`} className="hidden font-medium hover:text-amber-300 sm:inline">
          {ADMISSIONS_EMAIL}
        </a>
      </div>
    </div>
  );
}

/** Stacked list of numbers for footers / contact cards. */
export function PhoneList({ dark = false }: { dark?: boolean }) {
  return (
    <ul className="space-y-2">
      {CONTACT_PHONES.map((p) => (
        <li key={p.tel} className="flex flex-wrap items-center gap-2 text-sm">
          <a
            href={`tel:${p.tel}`}
            className={`inline-flex items-center gap-2 transition-colors ${dark ? "text-slate-400 hover:text-amber-400" : "text-slate-700 hover:text-amber-700"}`}
          >
            <PhoneIcon />
            {p.display} <span className={dark ? "text-slate-500" : "text-slate-400"}>({p.label})</span>
          </a>
          <a
            href={p.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/25"
            aria-label={`WhatsApp ${p.display}`}
          >
            <WhatsAppIcon className="h-3 w-3" />
            WhatsApp
          </a>
        </li>
      ))}
    </ul>
  );
}
