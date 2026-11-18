import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Check, Download, FileText, Home, MapPin, Printer, TestTube2, Building2, Clock } from 'lucide-react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Stepper from '../../components/common/Stepper';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import NotFound from '../../components/common/NotFound';
import { useBookings } from '../../hooks/useBookings';
import { formatLongDate } from '../../utils/dateUtils';
import { formatPrice } from '../../utils/priceUtils';
import PriceSummary from '../../components/common/PriceSummary';
import { downloadPass } from './passHtml';

export default function BookingConfirmation() {
  const { reference } = useParams();
  const { bookings } = useBookings();
  const b = bookings.find((x) => x.reference === reference);
  if (!b) return <NotFound title="Booking not found" text={`We couldn’t find a booking with reference ${reference}.`} />;

  return (
    <div>
      <div className="print:hidden"><Breadcrumbs items={[{ label: 'Bookings', to: '/bookings' }, { label: b.reference }]} /><Stepper current={5} /></div>

      <motion.div initial={{ scale: .92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} className="mx-auto max-w-2xl text-center print:hidden">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60"><Check className="h-8 w-8" strokeWidth={3} aria-hidden /></span>
        <h1 className="mt-4 text-3xl">Booking confirmed</h1>
        <p className="mt-1 text-sm text-ink-500">The slot is reserved. Give the patient this pass, or print it for them.</p>
      </motion.div>

      <article className="print-area card relative mx-auto mt-6 max-w-2xl overflow-hidden" aria-label="Digital booking pass">
        <header className="bg-gradient-to-br from-brand-700 via-brand-600 to-aqua-500 px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/80">Booking reference</p><p className="mt-1 font-mono text-3xl font-medium tracking-wide" data-testid="reference">{b.reference}</p></div>
            <StatusBadge status={b.status} className="!bg-white/10 !text-white !ring-white/20" />
          </div>
        </header>
        <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
          <Info icon={FileText} label="Patient">{b.patient.fullName}<span className="block text-xs font-normal text-ink-500">+91 {b.patient.mobile}</span></Info>
          <Info icon={CalendarDays} label="Date">{formatLongDate(b.date)}</Info>
          <Info icon={Clock} label="Time slot">{b.slotLabel}</Info>
          <Info icon={b.collection === 'home' ? Home : Building2} label="Collection">{b.collection === 'home' ? 'Home collection' : 'Visit lab'}{b.collection === 'home' && <span className="block text-xs font-normal text-ink-500">{b.address}</span>}</Info>
          <div className="sm:col-span-2"><Info icon={MapPin} label="Laboratory">{b.labName}<span className="block text-xs font-normal text-ink-500">Bengaluru</span></Info></div>
        </div>
        <div className="border-t border-dashed border-ink-300 px-6 py-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500"><TestTube2 className="h-3.5 w-3.5" aria-hidden />Tests booked</p>
          <ul className="mt-2 divide-y divide-ink-100 text-sm">
            {b.items.map((t) => <li key={t.id} className="flex justify-between gap-3 py-2"><span>{t.name}<span className="block text-xs text-ink-500">{t.code} · {t.sampleType}</span></span><span className="shrink-0">{formatPrice(t.price)}</span></li>)}
          </ul>
          <PriceSummary className="mt-2 border-t border-ink-100 pt-3" mrp={b.mrpTotal ?? b.total} subtotal={b.subtotal ?? b.total} fee={b.collectionFee ?? 0} collection={b.collection} />
          <p className="mt-4 text-xs text-ink-500">Carry a photo ID. Follow any fasting guidance shown for your tests and confirm it with the laboratory if unsure.</p>
        </div>
      </article>

      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-3 print:hidden">
        <Button onClick={() => downloadPass(b)}><Download className="h-4 w-4" />Download pass</Button>
        <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
        <Button to={`/bookings/${b.id}`} variant="secondary">View booking details</Button>
        <Button to="/" variant="ghost">Back to dashboard</Button>
      </div>
    </div>
  );
}

function Info({ icon: I, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><I className="h-4 w-4" aria-hidden /></span>
      <div><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p><p className="font-semibold">{children}</p></div>
    </div>
  );
}
