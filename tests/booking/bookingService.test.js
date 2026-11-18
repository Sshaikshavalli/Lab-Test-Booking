import { describe, it, expect, beforeEach } from 'vitest';
import { addDays } from 'date-fns';
import { buildBooking, canModify, canAdvance, canOperatorCancel, BookingError, slotTimeFromId, createBooking, cancelBooking, rescheduleBooking, advanceStatus, setSlotCapacity, getBookings } from '../../src/services/bookingService';
import { logout, setupAdmin } from '../../src/services/authService';
import { buildInitialBookings } from '../../src/data/initialBookings';
import { getSlots } from '../../src/data/timeSlots';
import { nextReference, isValidReference } from '../../src/utils/bookingReference';
import { toISODate } from '../../src/utils/dateUtils';
import { LAB_ID } from '../../src/data/laboratories';
import { collectionFee, bookingTotal, HOME_FEE } from '../../src/utils/priceUtils';

const now = new Date();
const date = toISODate(addDays(now, 3));
// Slots start with a deterministic walk-in load (a few are already full), so pick bookable ones instead of hard-coding ids.
const open = (d, n = 0) => getSlots({ labId: LAB_ID, date: d, bookings: [], now }).filter((s) => s.bookable)[n].id;
const base = { patient: { fullName: 'Test Patient' }, testIds: ['t-cbc', 't-lipid'], labId: LAB_ID, date, slotId: open(date), collection: 'lab' };

describe('seed bookings', () => {
  const seed = buildInitialBookings(now);
  it('creates 20 bookings covering every workflow status', () => {
    expect(seed).toHaveLength(20);
    for (const s of ['Confirmed', 'Checked In', 'Sample Collected', 'Processing', 'Completed', 'Cancelled']) expect(seed.some((b) => b.status === s)).toBe(true);
    expect(seed.every((b) => isValidReference(b.reference))).toBe(true);
  });
});

describe('booking references', () => {
  it('continues the sequence from the highest existing reference', () => {
    expect(nextReference(buildInitialBookings(now), now)).toBe(`LTB-${now.getFullYear()}-1021`);
    expect(nextReference([], now)).toBe(`LTB-${now.getFullYear()}-1001`);
  });
});

describe('creating a booking', () => {
  it('snapshots tests, totals the price and starts as Confirmed', () => {
    const b = buildBooking(base, [], {}, now);
    expect(b.status).toBe('Confirmed');
    expect(b.subtotal).toBe(350 + 650);
    expect(b.collectionFee).toBe(0);
    expect(b.total).toBe(350 + 650);
    expect(b.mrpTotal).toBeGreaterThanOrEqual(b.subtotal);
    expect(b.items.map((i) => i.id)).toEqual(['t-cbc', 't-lipid']);
    expect(b.userId).toBeUndefined();
  });
  it('rejects empty carts and a missing home address', () => {
    expect(() => buildBooking({ ...base, testIds: [] }, [], {}, now)).toThrow(BookingError);
    expect(() => buildBooking({ ...base, collection: 'home', address: '' }, [], {}, now)).toThrow(/address/i);
  });
  it('only collects from Bengaluru PIN codes', () => {
    const home = { ...base, collection: 'home', address: '12 Main Road, near the park' };
    expect(() => buildBooking({ ...home, pincode: '500001' }, [], {}, now)).toThrow(/Bengaluru/i);
    expect(() => buildBooking({ ...home, pincode: '' }, [], {}, now)).toThrow(BookingError);
    const b = buildBooking({ ...home, pincode: '560038' }, [], {}, now);
    expect(b.pincode).toBe('560038');
    expect(b.collection).toBe('home');
  });
  it('adds the home-collection fee only on small orders', () => {
    expect(collectionFee(300, 'home')).toBe(HOME_FEE);
    expect(collectionFee(500, 'home')).toBe(0);
    expect(collectionFee(300, 'lab')).toBe(0);
    expect(bookingTotal(300, 'home')).toBe(300 + HOME_FEE);
    const small = buildBooking({ ...base, testIds: ['t-fbs'], collection: 'home', address: '12 Main Road, near the park', pincode: '560001' }, [], {}, now);
    expect(small.collectionFee).toBe(HOME_FEE);
    expect(small.total).toBe(small.subtotal + HOME_FEE);
  });
});

describe('live slot capacity', () => {
  it('decrements remaining seats when a booking is made and frees them on cancellation', () => {
    const slot1 = open(date);
    const before = getSlots({ labId: LAB_ID, date, bookings: [], now }).find((s) => s.id === slot1);
    const booking = buildBooking({ ...base, labId: LAB_ID, slotId: slot1 }, [], {}, now);
    const during = getSlots({ labId: LAB_ID, date, bookings: [booking], now }).find((s) => s.id === slot1);
    const after = getSlots({ labId: LAB_ID, date, bookings: [{ ...booking, status: 'Cancelled' }], now }).find((s) => s.id === slot1);
    expect(during.bookedCount).toBe(before.bookedCount + 1);
    expect(after.bookedCount).toBe(before.bookedCount);
  });
  it('refuses a booking once the slot is full and honours operator capacity overrides', () => {
    let list = [];
    const slot = getSlots({ labId: LAB_ID, date, bookings: [], now }).find((s) => s.bookable);
    const input = { ...base, labId: LAB_ID, slotId: slot.id };
    for (let i = 0; i < slot.remaining; i += 1) list = [buildBooking(input, list, {}, now), ...list];
    expect(() => buildBooking(input, list, {}, now)).toThrow(/filled up/i);
    const key = slot.key;
    expect(() => buildBooking(input, list, { [key]: slot.capacity + 2 }, now)).not.toThrow();
  });
  it('closes slots that start within the next hour', () => {
    const noon = new Date(); noon.setHours(12, 10, 0, 0);
    const today = getSlots({ labId: LAB_ID, date: toISODate(noon), bookings: [], now: noon });
    expect(today.find((s) => s.id === 's1200').status).toBe('Past');
    expect(today.find((s) => s.id === 's1300').status).toBe('Past');
    expect(today.find((s) => s.id === 's1500').status).not.toBe('Past');
  });
});

describe('eligibility rules', () => {
  const future = { ...buildBooking(base, [], {}, now) };
  it('allows reschedule / cancel only for future Confirmed bookings', () => {
    expect(canModify(future, now)).toBe(true);
    expect(canModify({ ...future, status: 'Checked In' }, now)).toBe(false);
    expect(canModify({ ...future, date: toISODate(addDays(now, -1)) }, now)).toBe(false);
  });
  it('limits operator transitions', () => {
    expect(canAdvance('Confirmed')).toBe(true);
    expect(canAdvance('Completed')).toBe(false);
    expect(canOperatorCancel('Sample Collected')).toBe(false);
    expect(slotTimeFromId('s0930')).toBe('09:30');
  });
});

describe('only administrators can book, reschedule and cancel', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.window = {
      localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) },
      addEventListener() {},
    };
  });
  const credentials = { name: 'Lab Admin', email: 'admin@lab.in', mobile: '9845012345', password: 'Admin@12345' };
  const day2 = toISODate(addDays(now, 4));

  it('blocks signed-out visitors from every booking action', () => {
    for (const run of [() => createBooking(base), () => cancelBooking('x'), () => rescheduleBooking('x', { date, slotId: 's1000' }), () => advanceStatus('x'), () => setSlotCapacity(LAB_ID, date, 's1000', 3)]) {
      expect(run).toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));
    }
  });
  it('lets an admin book, reschedule and cancel — freeing the seat and recording why', async () => {
    await setupAdmin(credentials);
    const b = createBooking({ ...base, slotId: open(date, 1) });
    expect(b.status).toBe('Confirmed');
    const moved = rescheduleBooking(b.id, { date: day2, slotId: open(day2) });
    expect(moved).toMatchObject({ date: day2, slotId: open(day2), status: 'Confirmed' });
    expect(moved.history.at(-1).note).toMatch(/Rescheduled by the lab admin/);
    const cancelled = cancelBooking(b.id, 'Patient requested');
    expect(cancelled).toMatchObject({ status: 'Cancelled', cancelReason: 'Patient requested' });
    expect(cancelled.history.at(-1).note).toMatch(/Patient requested/);
    expect(getBookings().find((x) => x.id === b.id).status).toBe('Cancelled');
    expect(() => rescheduleBooking(b.id, { date, slotId: open(date) })).toThrow(expect.objectContaining({ code: 'NOT_ELIGIBLE' }));
  });
  it('stops a signed-out visitor again after the admin signs out', async () => {
    await setupAdmin(credentials);
    logout();
    expect(() => createBooking(base)).toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));
  });
});
