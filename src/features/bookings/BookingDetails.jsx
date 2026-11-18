import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ban, Check, Circle, Radio } from 'lucide-react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import StatusBadge from '../../components/common/StatusBadge';
import NotFound from '../../components/common/NotFound';
import BookingActions from './BookingActions';
import { useBookings } from '../../hooks/useBookings';
import { ageFromDob, formatDateTime, formatLongDate } from '../../utils/dateUtils';
import PriceSummary from '../../components/common/PriceSummary';
import { formatPrice } from '../../utils/priceUtils';

const FLOW = ['Confirmed', 'Checked In', 'Sample Collected', 'Processing', 'Completed'];

function Tracker({ booking }) {
  const cancelled = booking.status === 'Cancelled';
  const idx = FLOW.indexOf(booking.status);
  return (
    <ol className="grid gap-4 sm:grid-cols-5" aria-label="Booking progress">
      {FLOW.map((s, i) => {
        const done = !cancelled && i <= idx;
        const current = !cancelled && i === idx;
        const at = booking.history.find((h) => h.status === s)?.at;
        return (
          <li key={s} className="relative flex gap-3 sm:block" aria-current={current ? 'step' : undefined}>
            {i < FLOW.length - 1 && <span aria-hidden className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 sm:left-8 sm:top-[15px] sm:h-0.5 sm:w-[calc(100%-16px)] ${!cancelled && i < idx ? 'bg-brand-500' : 'bg-ink-100'}`} />}
            <motion.span initial={false} animate={{ scale: current ? 1.12 : 1 }} className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ${done ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-300'} ${current ? 'ring-4 ring-brand-200' : ''}`}>
              {done && !current ? <Check className="h-4 w-4" aria-hidden /> : <Circle className="h-3 w-3 fill-current" aria-hidden />}
            </motion.span>
            <div className="sm:mt-3"><p className={`text-sm font-semibold ${done ? 'text-ink-900' : 'text-ink-300'}`}>{s}</p>{at && done && <p className="text-xs text-ink-500">{formatDateTime(at)}</p>}</div>
          </li>
        );
      })}
    </ol>
  );
}

export default function BookingDetails() {
  const { id } = useParams();
  const { bookings } = useBookings();
  const b = bookings.find((x) => x.id === id || x.reference === id);
  if (!b) return <NotFound title="Booking not found" text="This booking doesn’t exist in this browser." />;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Bookings', to: '/bookings' }, { label: b.reference }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-sm font-semibold text-brand-700">{b.reference}</p><h1 className="text-3xl">{b.patient.fullName}</h1></div>
        <StatusBadge status={b.status} className="!text-sm" />
      </div>

      <section className="card mt-6 p-6" aria-labelledby="track">
        <div className="mb-5 flex items-center justify-between"><h2 id="track" className="font-sans text-base font-semibold">Live status</h2><span className="flex items-center gap-1.5 text-xs text-ink-500"><Radio className="h-3.5 w-3.5 text-emerald-500" aria-hidden />Updates automatically</span></div>
        {b.status === 'Cancelled'
          ? <p className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700"><Ban className="h-4 w-4" aria-hidden />This booking was cancelled and its slot has been released.{b.cancelReason ? ` Reason: ${b.cancelReason}.` : ''}</p>
          : <Tracker booking={b} />}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="d-app">
          <h2 id="d-app" className="font-sans text-base font-semibold">Appointment</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="text-ink-500">When</dt><dd className="font-medium">{formatLongDate(b.date)} · {b.slotLabel}</dd></div>
            <div><dt className="text-ink-500">Laboratory</dt><dd className="font-medium">{b.labName} · Bengaluru</dd></div>
            <div><dt className="text-ink-500">Collection</dt><dd className="font-medium">{b.collection === 'home' ? `Home collection — ${b.address}` : 'Visit lab'}</dd></div>
          </dl>
          <div className="mt-5 border-t border-ink-100 pt-4"><BookingActions booking={b} /></div>
        </section>

        <section className="card p-6" aria-labelledby="d-pat">
          <h2 id="d-pat" className="font-sans text-base font-semibold">Patient</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="text-ink-500">Age / gender</dt><dd className="font-medium">{ageFromDob(b.patient.dob) ?? '—'} yrs{b.patient.gender ? ` · ${b.patient.gender}` : ''}</dd></div>
            <div><dt className="text-ink-500">Mobile</dt><dd className="font-medium">+91 {b.patient.mobile}</dd></div>
            {b.patient.email && <div><dt className="text-ink-500">Email</dt><dd className="font-medium">{b.patient.email}</dd></div>}
          </dl>
        </section>

        <section className="card p-6" aria-labelledby="d-tests">
          <h2 id="d-tests" className="font-sans text-base font-semibold">Tests</h2>
          <ul className="mt-3 divide-y divide-ink-100 text-sm">
            {b.items.map((t) => <li key={t.id} className="flex justify-between gap-3 py-2.5"><span>{t.name}<span className="block text-xs text-ink-500">{t.code} · {t.sampleType}</span></span><span className="shrink-0">{formatPrice(t.price)}</span></li>)}
          </ul>
          <PriceSummary className="mt-2 border-t border-ink-100 pt-3" mrp={b.mrpTotal ?? b.total} subtotal={b.subtotal ?? b.total} fee={b.collectionFee ?? 0} collection={b.collection} />
        </section>

        <section className="card p-6" aria-labelledby="d-hist">
          <h2 id="d-hist" className="font-sans text-base font-semibold">Activity</h2>
          <ol className="mt-3 space-y-3 text-sm">
            {[...b.history].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden /><span><span className="font-medium">{h.status}</span> · {h.note}<span className="block text-xs text-ink-500">{formatDateTime(h.at)}</span></span></li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
