import { BadgeCheck, Clock, Home, Mail, MapPin, Phone } from 'lucide-react';
import { useActiveLab } from '../../../app/providers/LocationProvider';
import { CITY, STATE, openStatus, telUrl } from '../../../data/laboratories';

/** Lab details: city only — no branch, street or locality names. */
export default function LocationCard() {
  const { lab } = useActiveLab();
  const st = openStatus(lab);
  return (
    <section aria-labelledby="loc" className="card overflow-hidden">
      <div className="grid md:grid-cols-[1.2fr_1fr]">
        <div className="p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand-700"><MapPin className="h-4 w-4" aria-hidden />{CITY}, {STATE}</p>
          <h2 id="loc" className="mt-3 text-2xl sm:text-3xl">{lab.name}</h2>
          <p className="mt-2 text-sm text-ink-500">Diagnostic laboratory with lab visits and home sample collection across {CITY}.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`chip ${st.open ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${st.open ? 'animate-pulse bg-emerald-500' : 'bg-ink-300'}`} aria-hidden />{st.label}</span>
            {lab.accreditations.map((a) => <span key={a} className="chip bg-brand-50 text-brand-700"><BadgeCheck className="h-3 w-3" aria-hidden />{a}</span>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={telUrl(lab)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"><Phone className="h-4 w-4" aria-hidden />{lab.phone}</a>
            <a href={`mailto:${lab.email}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-ink-100 bg-white px-4 text-sm font-semibold transition hover:border-brand-400"><Mail className="h-4 w-4" aria-hidden />{lab.email}</a>
          </div>
        </div>
        <div className="border-t border-ink-100 bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8 md:border-l md:border-t-0">
          <p className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4 text-brand-600" aria-hidden />{lab.hours}</p>
          <div className="mt-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><Home className="h-4 w-4 text-brand-600" aria-hidden />Home sample collection</p>
            <p className="mt-2 text-sm text-ink-500">Available anywhere in {CITY}. Free on orders of ₹500 or more; ₹150 on smaller orders.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
