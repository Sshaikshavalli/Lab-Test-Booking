import { useState } from 'react';
import { CalendarClock, Ban, Printer, ArrowRightCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import DateSelector from '../schedule/DateSelector';
import TimeSlotSelector from '../schedule/TimeSlotSelector';
import { cancelBooking, rescheduleBooking, advanceStatus, canAdvance, canModify, NEXT_STATUS, BookingError } from '../../services/bookingService';
import { useAuth } from '../../app/providers/AuthProvider';
import { formatLongDate, toISODate, getBookingDates } from '../../utils/dateUtils';

const STEP_LABEL = { 'Checked In': 'Mark checked in', 'Sample Collected': 'Mark sample collected', Processing: 'Mark processing', Completed: 'Mark completed' };
const REASONS = ['Patient requested', 'Patient did not respond', 'Duplicate booking', 'Lab unavailable', 'Other'];

/**
 * Reschedule and cancel — available to laboratory administrators only (the service layer enforces this too).
 * Both are open while the booking is still Confirmed and its slot has not started.
 */
export default function BookingActions({ booking, compact = false }) {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState(null); // 'reschedule' | 'cancel'
  const [date, setDate] = useState(booking.date);
  const [slotId, setSlotId] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const eligible = isAdmin && canModify(booking);
  const next = isAdmin && canAdvance(booking.status) ? NEXT_STATUS[booking.status] : null;

  const close = () => { setMode(null); setError(''); setSlotId(null); setNote(''); };
  const open = (m) => {
    const first = toISODate(getBookingDates()[0]);
    setDate(booking.date >= first ? booking.date : first);
    setSlotId(null); setError(''); setReason(REASONS[0]); setNote(''); setMode(m);
  };
  const run = (fn, message) => {
    try { fn(); toast(message); close(); } catch (e) { setError(e instanceof BookingError ? e.message : 'That change could not be saved. Please try again.'); }
  };
  const cancelReason = reason === 'Other' ? note.trim() || 'Other' : reason;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {next && <Button size="sm" onClick={() => { try { advanceStatus(booking.id); toast(`Status updated: ${next}`); } catch (e) { toast(e instanceof BookingError ? e.message : 'Could not update the status.'); } }}><ArrowRightCircle className="h-4 w-4" />{STEP_LABEL[next]}</Button>}
        <Button to={`/confirmation/${booking.reference}`} variant="secondary" size="sm"><Printer className="h-4 w-4" />{compact ? 'Pass' : 'View / print pass'}</Button>
        {eligible && <Button variant="secondary" size="sm" onClick={() => open('reschedule')}><CalendarClock className="h-4 w-4" />Reschedule</Button>}
        {eligible && <Button variant="danger" size="sm" onClick={() => open('cancel')}><Ban className="h-4 w-4" />Cancel</Button>}
      </div>
      {isAdmin && !eligible && !compact && booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
        <p className="mt-2 text-xs text-ink-500">Rescheduling and cancelling close once the patient has checked in or the slot has started.</p>
      )}

      <Modal open={mode === 'cancel'} onClose={close} title="Cancel this booking?">
        <p className="text-sm text-ink-700">{booking.reference} · {booking.patient.fullName} · {formatLongDate(booking.date)}, {booking.slotLabel}. The seat is released immediately so another patient can take it.</p>
        <div className="mt-4">
          <label htmlFor="cancel-reason" className="field-label">Reason</label>
          <select id="cancel-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
          {reason === 'Other' && <input aria-label="Other reason" maxLength={120} className="input mt-2" placeholder="Add a short note" value={note} onChange={(e) => setNote(e.target.value)} />}
        </div>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-coral-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={close}>Keep booking</Button><Button variant="accent" onClick={() => run(() => cancelBooking(booking.id, cancelReason), 'Booking cancelled')}>Yes, cancel booking</Button></div>
      </Modal>

      <Modal open={mode === 'reschedule'} onClose={close} title="Reschedule booking">
        <p className="mb-4 text-sm text-ink-500">{booking.patient.fullName} · currently {formatLongDate(booking.date)}, {booking.slotLabel}.</p>
        <DateSelector value={date} onChange={(d) => { setDate(d); setSlotId(null); }} idPrefix="resched" />
        <div className="mt-4"><TimeSlotSelector labId={booking.labId} date={date} value={slotId} onChange={setSlotId} ignoreBookingId={booking.id} /></div>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-coral-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>Close</Button>
          <Button disabled={!slotId || (date === booking.date && slotId === booking.slotId)} onClick={() => run(() => rescheduleBooking(booking.id, { date, slotId }), 'Booking rescheduled')}>Confirm new time</Button>
        </div>
      </Modal>
    </>
  );
}
