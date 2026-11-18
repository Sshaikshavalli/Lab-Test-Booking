import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Clock, Home, Info, Phone } from 'lucide-react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Stepper from '../../components/common/Stepper';
import Button from '../../components/common/Button';
import DateSelector from './DateSelector';
import TimeSlotSelector from './TimeSlotSelector';
import { getSlots } from '../../data/timeSlots';
import { CITY, isBengaluruPincode, openStatus, telUrl } from '../../data/laboratories';
import { HOME_FEE, FREE_COLLECTION_ABOVE, collectionFee, formatPrice } from '../../utils/priceUtils';
import { useCart } from '../../app/providers/CartProvider';
import { useActiveLab } from '../../app/providers/LocationProvider';
import { useBookingDraft } from '../../hooks/useBookingDraft';
import { useBookings } from '../../hooks/useBookings';
import { formatLongDate, getBookingDates, toISODate } from '../../utils/dateUtils';

export default function SchedulePage() {
  const { selectedTests } = useCart();
  const { draft, update } = useBookingDraft();
  const { bookings, overrides } = useBookings();
  const { lab } = useActiveLab();
  const labId = lab.id;
  const navigate = useNavigate();

  const [date, setDate] = useState(draft.date ?? toISODate(getBookingDates()[0]));
  const [slotId, setSlotId] = useState(draft.slotId ?? null);
  const [collection, setCollection] = useState(draft.collection ?? 'lab');
  const [address, setAddress] = useState(draft.address ?? '');
  const [pincode, setPincode] = useState(draft.pincode ?? '');
  const [touched, setTouched] = useState(false);

  // Drop the chosen slot if it stops being bookable (filled up elsewhere, or the date changed).
  const live = useMemo(() => getSlots({ labId, date, bookings, overrides }).find((s) => s.id === slotId), [labId, date, slotId, bookings, overrides]);
  useEffect(() => { if (slotId && !live?.bookable) setSlotId(null); }, [slotId, live]);

  if (selectedTests.length === 0) return <Navigate to="/cart" replace />;
  if (!draft.patient) return <Navigate to="/patient" replace />;

  const inArea = isBengaluruPincode(pincode);
  const subtotal = selectedTests.reduce((n, t) => n + t.price, 0);
  const fee = collectionFee(subtotal, collection);
  const addressOk = address.trim().length >= 8;
  const homeInvalid = collection === 'home' && (!addressOk || !inArea);
  const canContinue = Boolean(slotId && live?.bookable && !homeInvalid);
  const st = openStatus(lab);

  const next = () => {
    setTouched(true);
    if (!canContinue) return;
    update({ labId, date, slotId, collection, address: collection === 'home' ? address.trim() : '', pincode: collection === 'home' ? pincode.trim() : '' });
    navigate('/review');
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Booking cart', to: '/cart' }, { label: 'Patient details', to: '/patient' }, { label: 'Date & slot' }]} />
      <Stepper current={3} />
      <h1 className="text-3xl font-semibold">Choose a date and time</h1>
      <p className="mt-1 text-sm text-ink-500">Booking for <b>{draft.patient.fullName}</b>. Seat counts update live.</p>

      <div className="mt-6 space-y-6">
        <section className="card p-6" aria-labelledby="loc-h">
          <h2 id="loc-h" className="font-sans text-base font-semibold">1 · Laboratory</h2>
          <p className="mt-2 font-semibold">{lab.name} · {CITY}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4 shrink-0 text-ink-500" aria-hidden /><span className={st.open ? 'font-medium text-emerald-700' : 'text-ink-500'}>{st.label}</span><span className="text-ink-300">· {lab.hours}</span></p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500"><Phone className="h-4 w-4 shrink-0" aria-hidden /><a href={telUrl(lab)} className="hover:underline">{lab.phone}</a></p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lab.accreditations.map((a) => <span key={a} className="chip bg-brand-50 text-brand-700"><BadgeCheck className="h-3 w-3" aria-hidden />{a}</span>)}
          </div>
        </section>

        <section className="card p-6" aria-labelledby="date-h">
          <h2 id="date-h" className="font-sans text-base font-semibold">2 · Date</h2>
          <div className="mt-4"><DateSelector value={date} onChange={(d) => { setDate(d); setSlotId(null); }} /></div>
        </section>

        <section className="card p-6" aria-labelledby="slot-h">
          <h2 id="slot-h" className="font-sans text-base font-semibold">3 · Time slot <span className="font-normal text-ink-500">· {formatLongDate(date)}</span></h2>
          <div className="mt-4"><TimeSlotSelector labId={labId} date={date} value={slotId} onChange={setSlotId} /></div>
          {touched && !slotId && <p role="alert" className="mt-3 text-sm font-medium text-coral-500">Select an available time slot to continue.</p>}
        </section>

        <section className="card p-6" aria-labelledby="coll-h">
          <h2 id="coll-h" className="font-sans text-base font-semibold">4 · Sample collection</h2>
          <div role="radiogroup" aria-label="Collection preference" className="mt-4 inline-flex rounded-2xl bg-ink-100/70 p-1">
            {[['lab', 'Visit lab', Building2], ['home', 'Home collection', Home]].map(([v, label, I]) => {
              const disabled = false;
              const on = collection === v;
              return (
                <button key={v} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => setCollection(v)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'bg-white text-brand-700 shadow-card' : 'text-ink-700'}`}>
                  <I className="h-4 w-4" aria-hidden />{label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-500">Lab visit is free. Home collection is free on orders of {formatPrice(FREE_COLLECTION_ABOVE)} or more, otherwise {formatPrice(HOME_FEE)}{collection === 'home' ? ` (this order: ${fee ? formatPrice(fee) : 'free'})` : ''}.</p>
          {collection === 'home' && (
            <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-[1fr_11rem]">
              <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-xs text-brand-900 sm:col-span-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />Home collection is available anywhere in {CITY} (PIN codes 560001 – 560103).</p>
              <div>
                <label htmlFor="address" className="field-label">Collection address</label>
                <textarea id="address" rows={3} className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House / flat no., street, landmark"
                  aria-invalid={touched && !addressOk ? true : undefined} aria-describedby={touched && !addressOk ? 'address-err' : undefined} />
                {touched && !addressOk && <p id="address-err" role="alert" className="mt-1 text-xs font-medium text-coral-500">Enter the full address where the phlebotomist should visit.</p>}
              </div>
              <div>
                <label htmlFor="pincode" className="field-label">PIN code</label>
                <input id="pincode" inputMode="numeric" maxLength={6} className="input" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} placeholder="560001"
                  aria-invalid={touched && !inArea ? true : undefined} aria-describedby={touched && !inArea ? 'pin-err' : undefined} />
                {touched && !inArea && <p id="pin-err" role="alert" className="mt-1 text-xs font-medium text-coral-500">Enter a Bengaluru PIN code (560001 – 560103).</p>}
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button to="/patient" variant="ghost"><ArrowLeft className="h-4 w-4" />Back</Button>
          <Button onClick={next}>Review booking<ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
