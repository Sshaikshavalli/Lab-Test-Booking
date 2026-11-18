import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, FlaskConical, Home, Building2, Pencil, User } from 'lucide-react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Stepper from '../../components/common/Stepper';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { useCart } from '../../app/providers/CartProvider';
import { useBookingDraft } from '../../hooks/useBookingDraft';
import { createBooking, BookingError, getBookings, getSlotOverrides } from '../../services/bookingService';
import { getLabById } from '../../data/laboratories';
import { getSlots } from '../../data/timeSlots';
import { formatLongDate, ageFromDob } from '../../utils/dateUtils';
import { collectionFee, formatPrice, sumMrp } from '../../utils/priceUtils';
import PriceSummary from '../../components/common/PriceSummary';

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-ink-500">{label}</dt><dd className="text-right font-medium">{children}</dd></div>
);

export default function BookingReview() {
  const { selectedTests, selectedTestIds, indicativeTotal, clear } = useCart();
  const { draft, reset } = useBookingDraft();
  const navigate = useNavigate();
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const done = useRef(false);

  if (done.current) return null; // booking saved – the router is already moving to the confirmation page
  if (selectedTests.length === 0) return <Navigate to="/cart" replace />;
  if (!draft.patient) return <Navigate to="/patient" replace />;
  if (!draft.labId || !draft.date || !draft.slotId) return <Navigate to="/schedule" replace />;

  const lab = getLabById(draft.labId);
  const slot = getSlots({ labId: draft.labId, date: draft.date, bookings: getBookings(), overrides: getSlotOverrides() }).find((s) => s.id === draft.slotId);
  const p = draft.patient;
  const mrp = sumMrp(selectedTests);
  const fee = collectionFee(indicativeTotal, draft.collection);

  const confirm = () => {
    setBusy(true); setError('');
    try {
      const booking = createBooking({ patient: p, testIds: selectedTestIds, labId: draft.labId, date: draft.date, slotId: draft.slotId, collection: draft.collection, address: draft.address, pincode: draft.pincode });
      done.current = true;
      clear(); reset();
      toast(`Booking ${booking.reference} confirmed`);
      navigate(`/confirmation/${booking.reference}`, { replace: true });
    } catch (e) {
      setBusy(false);
      setError(e instanceof BookingError ? e.message : 'Something went wrong while confirming. Please try again.');
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Booking cart', to: '/cart' }, { label: 'Date & slot', to: '/schedule' }, { label: 'Review' }]} />
      <Stepper current={4} />
      <h1 className="text-3xl font-semibold">Review the booking</h1>
      <p className="mt-1 text-sm text-ink-500">Check everything below before confirming. The booking can be rescheduled or cancelled later from the Bookings page.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <section className="card p-6" aria-labelledby="r-patient">
            <div className="flex items-center justify-between"><h2 id="r-patient" className="flex items-center gap-2 font-sans text-base font-semibold"><User className="h-4 w-4 text-brand-600" aria-hidden />Patient</h2>
              <Link to="/patient" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><Pencil className="h-3.5 w-3.5" aria-hidden />Edit</Link></div>
            <dl className="mt-2 divide-y divide-ink-100">
              <Row label="Name">{p.fullName}</Row>
              <Row label="Age">{ageFromDob(p.dob)} yrs{p.gender ? ` · ${p.gender}` : ''}</Row>
              <Row label="Mobile">+91 {p.mobile}</Row>
              {p.email && <Row label="Email">{p.email}</Row>}
            </dl>
          </section>

          <section className="card p-6" aria-labelledby="r-sched">
            <div className="flex items-center justify-between"><h2 id="r-sched" className="flex items-center gap-2 font-sans text-base font-semibold"><CalendarClock className="h-4 w-4 text-brand-600" aria-hidden />Appointment</h2>
              <Link to="/schedule" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><Pencil className="h-3.5 w-3.5" aria-hidden />Edit</Link></div>
            <dl className="mt-2 divide-y divide-ink-100">
              <Row label="Laboratory">{lab.name} · Bengaluru</Row>
              <Row label="Date">{formatLongDate(draft.date)}</Row>
              <Row label="Time slot">{slot?.label ?? '—'}</Row>
              <Row label="Collection"><span className="inline-flex items-center gap-1.5">{draft.collection === 'home' ? <Home className="h-4 w-4" aria-hidden /> : <Building2 className="h-4 w-4" aria-hidden />}{draft.collection === 'home' ? 'Home collection' : 'Visit lab'}</span></Row>
              {draft.collection === 'home' && <Row label="Address">{draft.address} — {draft.pincode}</Row>}
            </dl>
          </section>

          <section className="card p-6" aria-labelledby="r-tests">
            <div className="flex items-center justify-between"><h2 id="r-tests" className="flex items-center gap-2 font-sans text-base font-semibold"><FlaskConical className="h-4 w-4 text-brand-600" aria-hidden />Tests</h2>
              <Link to="/cart" className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><Pencil className="h-3.5 w-3.5" aria-hidden />Edit</Link></div>
            <ul className="mt-2 divide-y divide-ink-100">
              {selectedTests.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span><span className="font-medium">{t.name}</span><span className="block text-xs text-ink-500">{t.code} · {t.sampleType}{t.fasting ? ` · fasting ${t.fastingHours}h` : ''}</span></span>
                  <span className="shrink-0 font-medium">{formatPrice(t.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <h2 className="font-sans text-base font-semibold">Payment summary</h2>
          <PriceSummary className="mt-3" count={selectedTests.length} mrp={mrp} subtotal={indicativeTotal} fee={fee} collection={draft.collection} />
          <p className="mt-2 text-xs text-ink-500">The patient pays at the laboratory or to the phlebotomist at collection.</p>
          {error && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-coral-100 p-3 text-sm text-ink-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" aria-hidden /><span>{error} <Link to="/schedule" className="font-semibold underline">Choose another slot</Link></span>
            </div>
          )}
          <Button className="mt-5 w-full" size="lg" onClick={confirm} disabled={busy}><CheckCircle2 className="h-5 w-5" />{busy ? 'Confirming…' : 'Confirm booking'}</Button>
          <Button to="/schedule" variant="ghost" className="mt-2 w-full"><ArrowLeft className="h-4 w-4" />Back</Button>
        </aside>
      </div>
    </div>
  );
}
