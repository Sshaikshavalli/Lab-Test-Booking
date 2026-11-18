import { format } from 'date-fns';
import { laboratories, getLabById } from './laboratories';
import { formatTime12, slotStart, toISODate } from '../utils/dateUtils';

/** Statuses that no longer occupy a slot. */
const RELEASED = new Set(['Cancelled']);

export const slotKey = (labId, date, slotId) => `${labId}|${date}|${slotId}`;

/** Small deterministic hash so the same slot always starts with the same walk-in load. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/** Hourly slot templates for a lab: [{ id: 's0700', time: '07:00', end: '08:00', label: '7:00 AM – 8:00 AM' }] */
export function slotTemplates(lab) {
  const [oh] = lab.open.split(':').map(Number);
  const [ch] = lab.close.split(':').map(Number);
  const out = [];
  for (let h = oh; h < ch; h += 1) {
    const time = `${String(h).padStart(2, '0')}:00`;
    const end = `${String(h + 1).padStart(2, '0')}:00`;
    out.push({ id: `s${String(h).padStart(2, '0')}00`, time, end, label: `${formatTime12(time)} – ${formatTime12(end)}` });
  }
  return out;
}

/** Count of non-cancelled bookings per slot key. */
export function countByKey(bookings) {
  const map = new Map();
  for (const b of bookings) {
    if (RELEASED.has(b.status)) continue;
    const k = slotKey(b.labId, b.date, b.slotId);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

/**
 * Live slots for one lab on one date.
 *  capacity   – operator override or the lab default
 *  bookedCount – baseline walk-in load + every non-cancelled booking in the system
 *  status     – Available | Filling Fast | Full | Past
 * `ignoreBookingId` lets the reschedule dialog treat the booking's own seat as free.
 */
export function getSlots({ labId, date, bookings = [], overrides = {}, now = new Date(), ignoreBookingId = null }) {
  const lab = getLabById(labId);
  if (!lab) return [];
  const counts = countByKey(ignoreBookingId ? bookings.filter((b) => b.id !== ignoreBookingId) : bookings);
  const isToday = date === toISODate(now);
  const cutoff = now.getTime() + 60 * 60 * 1000; // need at least one hour of notice

  return slotTemplates(lab).map((s) => {
    const key = slotKey(labId, date, s.id);
    const capacity = Math.max(0, Number(overrides[key] ?? lab.slotCapacity));
    const r = hash(key);
    const baseline = r > 0.93 ? capacity : Math.floor(r * 0.75 * capacity);
    const bookedCount = Math.min(capacity, baseline + (counts.get(key) ?? 0));
    const remaining = Math.max(0, capacity - bookedCount);
    const past = isToday && slotStart(date, s.time).getTime() < cutoff;
    let status = 'Available';
    if (past) status = 'Past';
    else if (remaining === 0) status = 'Full';
    else if (remaining <= 2) status = 'Filling Fast';
    return { ...s, key, capacity, bookedCount, remaining, status, bookable: status === 'Available' || status === 'Filling Fast' };
  });
}

export const dayLabel = (d) => format(d, 'EEE');
export { laboratories };
