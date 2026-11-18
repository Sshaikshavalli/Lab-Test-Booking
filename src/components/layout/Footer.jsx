import { BadgeCheck, Clock, Mail, Phone } from 'lucide-react';
import { useActiveLab } from '../../app/providers/LocationProvider';
import { CITY, STATE, telUrl } from '../../data/laboratories';

/** Footer: contact details for the laboratory (no branch or street names). */
export default function Footer() {
  const { lab } = useActiveLab();
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-9 text-sm text-ink-700 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-bold text-ink-950">{lab.name}</p>
          <p className="mt-1 flex items-start gap-2 text-ink-500"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />{lab.accreditations.join(' · ')} accredited · {CITY}, {STATE}</p>
          <p className="mt-3 text-xs text-ink-500">Preparation notes are general guidance — confirm with the laboratory or your clinician.</p>
        </div>
        <address className="space-y-2 not-italic">
          <p className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />{lab.hours}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /><a href={telUrl(lab)} className="font-semibold hover:underline">{lab.phone}</a></p>
        </address>
        <div className="space-y-2">
          <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /><a href={`mailto:${lab.email}`} className="hover:underline">{lab.email}</a></p>
          <p className="pt-2 text-xs text-ink-500">© {new Date().getFullYear()} {lab.name}</p>
        </div>
      </div>
    </footer>
  );
}
