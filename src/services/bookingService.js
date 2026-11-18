import { readJSON, writeJSON, subscribe, STORAGE_KEYS } from './storageService';
import { getCurrentUser, ROLES } from './authService';
import { buildInitialBookings } from '../data/initialBookings';
import { getSlots, slotKey } from '../data/timeSlots';
import { getLabById, isBengaluruPincode, LAB_ID } from '../data/laboratories';
import { getTestById } from '../data/tests';
import { nextReference } from '../utils/bookingReference';
import { slotStart, formatLongDate } from '../utils/dateUtils';
import { bookingTotal, collectionFee } from '../utils/priceUtils';

export const STATUSES = ['Confirmed', 'Checked In', 'Sample Collected', 'Processing', 'Completed', 'Cancelled'];
export const ACTIVE_STATUSES = ['Confirmed', 'Checked In', 'Sample Collected', 'Processing'];
/** Operator workflow – one step forward at a time. */
export const NEXT_STATUS = { Confirmed: 'Checked In', 'Checked In': 'Sample Collected', 'Sample Collected': 'Processing', Processing: 'Completed' };
const OPERATOR_CANCELLABLE = ['Confirmed', 'Checked In'];

export class BookingError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

/* ───────────── in-memory snapshot cache (stable references for useSyncExternalStore) ───────────── */
let bookingsCache = null;
let overridesCache = null;
const watchers = new Set();

subscribe((key) => {
  if (key === STORAGE_KEYS.bookings) bookingsCache = null;
  if (key === STORAGE_KEYS.slotOverrides) overridesCache = null;
  if (key === STORAGE_KEYS.bookings || key === STORAGE_KEYS.slotOverrides) watchers.forEach((fn) => fn());
});

/** Subscribe to booking / slot-capacity changes from this tab or any other open tab. */
export function subscribeBookings(fn) {
  watchers.add(fn);
  return () => watchers.delete(fn);
}

export function getBookings() {
  if (bookingsCache) return bookingsCache;
  const stored = readJSON(STORAGE_KEYS.bookings, null);
  if (Array.isArray(stored)) {
    // Older saves may carry branch ids from a multi-branch build; fold them into the single laboratory.
    const stale = stored.some((b) => b.labId !== LAB_ID);
    if (stale) {
      const migrated = stored.map((b) => ({ ...b, labId: LAB_ID, labName: getLabById(LAB_ID).name }));
      writeJSON(STORAGE_KEYS.bookings, migrated); // a write invalidates the cache, so assign afterwards
      bookingsCache = migrated;
    } else {
      bookingsCache = stored;
    }
  } else {
    const seed = buildInitialBookings(); // first visit: seed the 20 starter bookings
    writeJSON(STORAGE_KEYS.bookings, seed); // a write invalidates the cache via the listener above…
    bookingsCache = seed;                   // …so set it after, keeping one stable reference
  }
  return bookingsCache;
}

export function getSlotOverrides() {
  if (overridesCache) return overridesCache;
  const stored = readJSON(STORAGE_KEYS.slotOverrides, null);
  overridesCache = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  return overridesCache;
}

function saveBookings(list) {
  writeJSON(STORAGE_KEYS.bookings, list);
  bookingsCache = list; // after the write (which invalidates the cache) so readers keep a stable reference
  watchers.forEach((fn) => fn());
}

/* ───────────── draft (in-progress booking) ───────────── */
export const getDraft = () => readJSON(STORAGE_KEYS.draft, {}) ?? {};
export function saveDraft(patch) {
  const next = { ...getDraft(), ...patch };
  writeJSON(STORAGE_KEYS.draft, next);
  return next;
}
export const clearDraft = () => writeJSON(STORAGE_KEYS.draft, {});

/* ───────────── pure rules (exported so they can be unit-tested) ───────────── */
export const slotTimeFromId = (slotId) => `${slotId.slice(1, 3)}:${slotId.slice(3, 5)}`;
export const bookingStart = (b) => slotStart(b.date, slotTimeFromId(b.slotId));

/** Cancel / reschedule are open only before check-in and before the slot starts. */
export const canModify = (b, now = new Date()) => b.status === 'Confirmed' && bookingStart(b).getTime() > now.getTime();

export const canAdvance = (status) => Boolean(NEXT_STATUS[status]);
export const canOperatorCancel = (status) => OPERATOR_CANCELLABLE.includes(status);

const entry = (status, note, now) => ({ status, at: now.toISOString(), note });

/** Throws BookingError when the slot cannot take another patient. */
export function assertSlotFree({ labId, date, slotId, bookings, overrides, now = new Date(), ignoreBookingId = null }) {
  const slot = getSlots({ labId, date, bookings, overrides, now, ignoreBookingId }).find((s) => s.id === slotId);
  if (!slot) throw new BookingError('NO_SLOT', 'That time slot does not exist for this laboratory.');
  if (slot.status === 'Past') throw new BookingError('PAST_SLOT', 'That time slot has already started. Please choose a later one.');
  if (!slot.bookable) throw new BookingError('SLOT_FULL', 'Sorry, that slot has just filled up. Please choose another time.');
  return slot;
}

export function buildBooking(input, bookings, overrides, now = new Date()) {
  const { patient, testIds, labId = LAB_ID, date, slotId, collection = 'lab', address = '', pincode = '' } = input;
  const lab = getLabById(labId);
  if (!lab) throw new BookingError('NO_LAB', 'Please choose a laboratory.');
  if (!testIds?.length) throw new BookingError('NO_TESTS', 'Select at least one test to book.');
  if (collection === 'home' && !lab.homeCollection) throw new BookingError('NO_HOME', 'This laboratory does not offer home collection.');
  if (collection === 'home' && !address.trim()) throw new BookingError('NO_ADDRESS', 'Enter a collection address for home sample collection.');
  if (collection === 'home' && !isBengaluruPincode(pincode)) {
    throw new BookingError('OUT_OF_AREA', 'Home collection is available within Bengaluru only. Enter a Bengaluru PIN code (560001 – 560103).');
  }
  const slot = assertSlotFree({ labId, date, slotId, bookings, overrides, now });
  const items = testIds.map(getTestById).filter(Boolean)
    .map((t) => ({ id: t.id, code: t.code, name: t.name, price: t.price, sampleType: t.sampleType, category: t.category }));
  return {
    id: `bk-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    reference: nextReference(bookings, now),
    createdAt: now.toISOString(),
    status: 'Confirmed',
    patient,
    items,
    testIds: items.map((t) => t.id),
    mrpTotal: items.reduce((s, t) => s + (getTestById(t.id)?.mrp ?? t.price), 0),
    subtotal: items.reduce((s, t) => s + t.price, 0),
    collectionFee: collectionFee(items.reduce((s, t) => s + t.price, 0), collection),
    total: bookingTotal(items.reduce((s, t) => s + t.price, 0), collection),
    labId, labName: lab.name,
    date, slotId, slotLabel: slot.label,
    collection, address: collection === 'home' ? address.trim() : '', pincode: collection === 'home' ? String(pincode).trim() : '',
    history: [entry('Confirmed', 'Booking confirmed', now)],
  };
}

/* ───────────── actions (administrators only) ───────────── */
/** Booking, rescheduling, cancelling and operator actions are reserved for administrators. */
function requireAdmin() {
  if (getCurrentUser()?.role !== ROLES.admin) throw new BookingError('FORBIDDEN', 'Only an administrator can book or change slots.');
}

export function createBooking(input) {
  requireAdmin();
  const booking = buildBooking(input, getBookings(), getSlotOverrides());
  saveBookings([booking, ...getBookings()]);
  return booking;
}

function mutate(id, fn) {
  const list = getBookings();
  const idx = list.findIndex((b) => b.id === id);
  if (idx < 0) throw new BookingError('NOT_FOUND', 'Booking not found.');
  const next = fn(list[idx]);
  const copy = [...list];
  copy[idx] = next;
  saveBookings(copy);
  return next;
}

/** Operator action: advance one step along Confirmed → Checked In → Sample Collected → Processing → Completed. */
export function advanceStatus(id, now = new Date()) {
  requireAdmin();
  return mutate(id, (b) => {
    const to = NEXT_STATUS[b.status];
    if (!to) throw new BookingError('BAD_TRANSITION', `A ${b.status.toLowerCase()} booking cannot move forward.`);
    return { ...b, status: to, history: [...b.history, entry(to, `Updated by the lab admin`, now)] };
  });
}

/** Operator action: cancel a booking that has not reached sample collection. */
export function operatorCancel(id, now = new Date()) {
  requireAdmin();
  return mutate(id, (b) => {
    if (!canOperatorCancel(b.status)) throw new BookingError('BAD_TRANSITION', 'Sample collection has started, so this booking can no longer be cancelled.');
    return { ...b, status: 'Cancelled', history: [...b.history, entry('Cancelled', 'Cancelled by the lab admin', now)] };
  });
}

/** Frees the slot (cancelled bookings are not counted against capacity). */
export function cancelBooking(id, reason = '', now = new Date()) {
  requireAdmin();
  return mutate(id, (b) => {
    if (!canModify(b, now)) throw new BookingError('NOT_ELIGIBLE', 'This booking can no longer be cancelled — it has been checked in or its slot has started.');
    const why = String(reason).trim().slice(0, 140);
    return { ...b, status: 'Cancelled', cancelReason: why, history: [...b.history, entry('Cancelled', why ? `Cancelled by the lab admin — ${why}` : 'Cancelled by the lab admin', now)] };
  });
}

/** Admin only. Locks the new slot and releases the old one in a single write. */
export function rescheduleBooking(id, { date, slotId }, now = new Date()) {
  requireAdmin();
  const current = getBookings().find((b) => b.id === id);
  if (!current) throw new BookingError('NOT_FOUND', 'Booking not found.');
  if (!canModify(current, now)) throw new BookingError('NOT_ELIGIBLE', 'This booking can no longer be rescheduled — it has been checked in or its slot has started.');
  const slot = assertSlotFree({ labId: current.labId, date, slotId, bookings: getBookings(), overrides: getSlotOverrides(), now, ignoreBookingId: id });
  return mutate(id, (b) => ({
    ...b, date, slotId, slotLabel: slot.label,
    history: [...b.history, entry('Confirmed', `Rescheduled by the lab admin from ${formatLongDate(b.date)}, ${b.slotLabel}`, now)],
  }));
}

/** Operator action: change how many patients a slot can take. */
export function setSlotCapacity(labId, date, slotId, capacity) {
  requireAdmin();
  const value = Math.max(0, Math.min(50, Math.round(Number(capacity) || 0)));
  const next = { ...getSlotOverrides(), [slotKey(labId, date, slotId)]: value };
  writeJSON(STORAGE_KEYS.slotOverrides, next);
  overridesCache = next;
  watchers.forEach((fn) => fn());
}

/* ───────────── dashboard metrics ───────────── */
const hoursOf = (text) => Number(/(\d+)\s*hour/.exec(text ?? '')?.[1]) || 0;

export function computeStats(bookings, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const upcoming = active.filter((b) => bookingStart(b).getTime() >= today);
  const hours = bookings.flatMap((b) => b.items.map((i) => hoursOf(getTestById(i.id)?.turnaround))).filter(Boolean);
  return {
    activeAppointments: upcoming.length,
    completedReports: bookings.filter((b) => b.status === 'Completed').length,
    avgTurnaroundHours: hours.length ? Math.round(hours.reduce((s, h) => s + h, 0) / hours.length) : 0,
    total: bookings.length,
  };
}
