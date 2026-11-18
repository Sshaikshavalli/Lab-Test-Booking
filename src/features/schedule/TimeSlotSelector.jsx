import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Users } from 'lucide-react';
import { getSlots } from '../../data/timeSlots';
import { useBookings } from '../../hooks/useBookings';

const STATE = {
  Available: 'border-ink-100 bg-white hover:border-brand-400',
  'Filling Fast': 'border-amber-200 bg-amber-50/60 hover:border-amber-400',
  Full: 'cursor-not-allowed border-ink-100 bg-ink-100/50 text-ink-300',
  Past: 'cursor-not-allowed border-ink-100 bg-ink-100/30 text-ink-300',
};

/**
 * Live slot grid. Seat counts come from the shared booking store, so a booking made (or a
 * capacity change made by the operator) in any open tab updates this grid instantly.
 */
export default function TimeSlotSelector({ labId, date, value, onChange, ignoreBookingId = null }) {
  const { bookings, overrides } = useBookings();
  // `bookings` changes identity on every write, so the grid always reflects the latest seat counts.
  const slots = useMemo(() => getSlots({ labId, date, bookings, overrides, ignoreBookingId }), [labId, date, bookings, overrides, ignoreBookingId]);
  const open = slots.filter((s) => s.bookable).length;

  if (!slots.length) return <p className="text-sm text-ink-500">No slots are published for this laboratory.</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-ink-500" aria-live="polite">{open ? `${open} of ${slots.length} slots open` : 'No open slots on this date — try another day.'}</p>
      <div role="radiogroup" aria-label="Choose a time slot" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {slots.map((s) => {
          const on = s.id === value && s.bookable;
          return (
            <motion.button key={s.id} layout type="button" role="radio" aria-checked={on} disabled={!s.bookable}
              onClick={() => onChange(s.id, s)} whileTap={s.bookable ? { scale: .97 } : undefined}
              className={`relative flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${on ? '!border-brand-600 bg-brand-600 text-white shadow-lift' : STATE[s.status]}`}>
              <span className="font-semibold">{s.label}</span>
              <span className={`flex items-center gap-1 text-xs ${on ? 'text-brand-100' : s.status === 'Filling Fast' ? 'text-amber-700' : 'text-ink-500'}`}>
                {s.bookable ? <><Users className="h-3 w-3" aria-hidden />{s.remaining} seat{s.remaining === 1 ? '' : 's'} left{s.status === 'Filling Fast' && !on ? ' · filling fast' : ''}</>
                  : <><Lock className="h-3 w-3" aria-hidden />{s.status === 'Past' ? 'Unavailable' : 'Full'}</>}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
