import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ClipboardList, MapPin, Radio, Search, SearchX, X } from 'lucide-react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import BookingActions from './BookingActions';
import { useBookings } from '../../hooks/useBookings';
import PageHero from '../../components/common/PageHero';
import { STATUSES } from '../../services/bookingService';
import { formatLongDate } from '../../utils/dateUtils';
import { formatPrice } from '../../utils/priceUtils';

export const matchesBooking = (b, f) => {
  const q = f.query.trim().toLowerCase();
  if (q && ![b.reference, b.patient.fullName, b.patient.mobile, ...b.items.map((i) => i.name)].join(' ').toLowerCase().includes(q)) return false;
  if (f.status !== 'All' && b.status !== f.status) return false;
  if (f.from && b.date < f.from) return false;
  if (f.to && b.date > f.to) return false;
  return true;
};

export default function MyBookings() {
  const { bookings: all } = useBookings();
  const bookings = all;
  const [f, setF] = useState({ query: '', status: 'All', from: '', to: '' });
  const set = (patch) => setF((s) => ({ ...s, ...patch }));
  const list = useMemo(() => bookings.filter((b) => matchesBooking(b, f)).sort((a, b) => (b.date + b.slotId).localeCompare(a.date + a.slotId)), [bookings, f]);
  const dirty = f.query || f.status !== 'All' || f.from || f.to;
  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, bookings.filter((b) => b.status === s).length])), [bookings]);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Bookings' }]} />
      <PageHero icon={ClipboardList} tone="booking" eyebrow="Bengaluru" title="Bookings"
        subtitle="Every booking made by the lab. Reschedule, cancel and print passes from here.">
        <span className="flex items-center gap-1.5 text-xs text-white/70"><Radio className="h-3.5 w-3.5 text-emerald-400" aria-hidden />Live</span>
        <Button to="/tests" className="!bg-white !text-brand-700 hover:!bg-brand-50">New booking</Button>
      </PageHero>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by status">
        {['All', ...STATUSES].map((s) => (
          <button key={s} type="button" aria-pressed={f.status === s} onClick={() => set({ status: s })}
            className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${f.status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-100 bg-white hover:border-brand-400'}`}>
            {s}<span className={`text-xs ${f.status === s ? 'text-white/80' : 'text-ink-500'}`}>{s === 'All' ? bookings.length : counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="card mt-4 grid gap-3 p-4 md:grid-cols-[1fr_11rem_11rem_auto] md:items-end">
        <div className="relative"><label htmlFor="bq" className="field-label">Search</label>
          <Search className="pointer-events-none absolute bottom-3 left-3.5 h-4 w-4 text-ink-300" aria-hidden />
          <input id="bq" type="search" className="input pl-10" placeholder="Reference, patient, mobile or test" value={f.query} onChange={(e) => set({ query: e.target.value })} /></div>
        <div><label htmlFor="bfrom" className="field-label">From</label><input id="bfrom" type="date" className="input" value={f.from} max={f.to || undefined} onChange={(e) => set({ from: e.target.value })} /></div>
        <div><label htmlFor="bto" className="field-label">To</label><input id="bto" type="date" className="input" value={f.to} min={f.from || undefined} onChange={(e) => set({ to: e.target.value })} /></div>
        <Button variant="ghost" disabled={!dirty} onClick={() => setF({ query: '', status: 'All', from: '', to: '' })}><X className="h-4 w-4" />Clear</Button>
      </div>

      <p className="mt-4 text-sm text-ink-500" aria-live="polite">{list.length} booking{list.length === 1 ? '' : 's'}</p>

      {list.length === 0 ? (
        <div className="card mt-3 grid place-items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">{bookings.length ? <SearchX className="h-8 w-8" /> : <ClipboardList className="h-8 w-8" />}</span>
          <h2 className="mt-4 text-xl font-semibold">{bookings.length ? 'No bookings match your filters' : 'No bookings yet'}</h2>
          <p className="mt-1 text-sm text-ink-500">{bookings.length ? 'Try a different search or clear the filters.' : 'Bookings you make appear here.'}</p>
          {!bookings.length && <Button to="/tests" className="mt-5">Create a booking</Button>}
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          <AnimatePresence initial={false}>
            {list.map((b) => (
              <motion.li layout key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/bookings/${b.id}`} className="font-mono text-sm font-semibold text-brand-700 hover:underline">{b.reference}</Link>
                    <p className="mt-0.5 text-lg font-semibold">{b.patient.fullName}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-2 text-sm text-ink-700">{b.items.map((i) => i.name).join(' · ')}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-500">
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{formatLongDate(b.date)} · {b.slotLabel}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden />{b.collection === 'home' ? 'Home collection' : 'Lab visit'}</span>
                  <span className="font-semibold text-ink-900">{formatPrice(b.total)}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
                  <BookingActions booking={b} compact />
                  <Link to={`/bookings/${b.id}`} className="text-sm font-semibold text-brand-700 hover:underline">Details & tracking →</Link>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
