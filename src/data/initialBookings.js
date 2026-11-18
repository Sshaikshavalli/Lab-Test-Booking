import { addDays, format, subDays } from 'date-fns';
import { tests } from './tests';
import { lab } from './laboratories';
import { bookingTotal, collectionFee } from '../utils/priceUtils';
import { slotTemplates } from './timeSlots';
import { toISODate } from '../utils/dateUtils';

/**
 * 20 patient bookings across every workflow state. Dates are relative to "today" so the
 * schedule always looks current. Called once, when the browser has no saved bookings yet.
 */
const P = [
  ['Aarav Reddy', 1988, 'Male', '9848012345'], ['Priya Nair', 1993, 'Female', '9440123456'],
  ['Mohammed Irfan', 1979, 'Male', '9912345670'], ['Sneha Kulkarni', 1996, 'Female', '9700123987'],
  ['Rakesh Varma', 1965, 'Male', '9849876543'], ['Ananya Iyer', 2001, 'Female', '9505123456'],
  ['Kiran Kumar', 1984, 'Male', '9848765432'], ['Fatima Begum', 1972, 'Female', '9951234567'],
  ['Vikram Singh', 1990, 'Male', '9618123456'], ['Lakshmi Devi', 1958, 'Female', '9440987654'],
  ['Rohit Sharma', 1995, 'Male', '9700456123'], ['Meera Joshi', 1987, 'Female', '9849123789'],
  ['Suresh Babu', 1969, 'Male', '9912001234'], ['Divya Menon', 1999, 'Female', '9505987123'],
  ['Arjun Rao', 1982, 'Male', '9848555123'], ['Nisha Patel', 1991, 'Female', '9618765123'],
  ['Imran Khan', 1976, 'Male', '9951567890'], ['Kavya Reddy', 2004, 'Female', '9700888123'],
  ['Harish Chandra', 1961, 'Male', '9440333111'], ['Pooja Agarwal', 1989, 'Female', '9849222333'],
];

// [dayOffset, status, unused, slotIndex, collection, testIds]
const PLAN = [
  [-12, 'Completed', 0, 1, 'lab', ['t-cbc', 't-lipid']],
  [-10, 'Completed', 1, 2, 'home', ['p-basic']],
  [-9, 'Cancelled', 2, 0, 'lab', ['t-thy']],
  [-8, 'Completed', 3, 3, 'lab', ['t-hba1c', 't-fbs']],
  [-6, 'Completed', 0, 4, 'home', ['p-heart']],
  [-5, 'Completed', 1, 1, 'lab', ['t-urine', 't-kft']],
  [-3, 'Completed', 4, 2, 'lab', ['t-dengue']],
  [-2, 'Cancelled', 3, 1, 'lab', ['t-vitd', 't-b12']],
  [0, 'Processing', 0, 0, 'lab', ['t-lft', 't-cbc']],
  [0, 'Sample Collected', 1, 1, 'home', ['p-diab']],
  [0, 'Checked In', 4, 2, 'lab', ['t-crp']],
  [0, 'Confirmed', 3, 5, 'lab', ['t-thy', 't-b12']],
  [1, 'Confirmed', 0, 2, 'home', ['p-full']],
  [1, 'Confirmed', 1, 3, 'lab', ['t-cbc', 't-esr']],
  [2, 'Confirmed', 2, 1, 'lab', ['t-lipid', 't-fbs']],
  [3, 'Confirmed', 3, 2, 'lab', ['t-urcs']],
  [4, 'Cancelled', 0, 3, 'lab', ['t-iron']],
  [5, 'Confirmed', 1, 4, 'home', ['p-basic']],
  [7, 'Confirmed', 2, 3, 'lab', ['t-widal', 't-cbc']],
  [9, 'Confirmed', 0, 5, 'lab', ['t-hba1c', 't-microalb']],
];

const NOTE = {
  Confirmed: 'Booking confirmed',
  'Checked In': 'Patient checked in at the front desk',
  'Sample Collected': 'Sample collected and labelled',
  Processing: 'Sample received in the laboratory',
  Completed: 'Report released',
  Cancelled: 'Cancelled by the lab admin',
};
const FLOW = ['Confirmed', 'Checked In', 'Sample Collected', 'Processing', 'Completed'];

export function buildInitialBookings(now = new Date()) {
  const byId = Object.fromEntries(tests.map((t) => [t.id, t]));
  return PLAN.map(([offset, status, , slotIdx, collection, ids], i) => {
    const slots = slotTemplates(lab);
    const slot = slots[Math.min(slotIdx, slots.length - 1)];
    const [name, born, gender, mobile] = P[i];
    const items = ids.map((id) => byId[id]).map((t) => ({ id: t.id, code: t.code, name: t.name, price: t.price, sampleType: t.sampleType, category: t.category }));
    const day = offset >= 0 ? addDays(now, offset) : subDays(now, -offset);
    const created = subDays(day, 2);
    const trail = status === 'Cancelled' ? ['Confirmed', 'Cancelled'] : FLOW.slice(0, FLOW.indexOf(status) + 1);
    return {
      id: `bk-seed-${String(i + 1).padStart(2, '0')}`,
      reference: `LTB-${now.getFullYear()}-${1001 + i}`,
      createdAt: created.toISOString(),
      status,
      patient: {
        fullName: name, dob: `${born}-0${(i % 9) + 1}-1${i % 9}`, gender, mobile,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      },
      items,
      testIds: ids,
      mrpTotal: ids.reduce((s, id) => s + (byId[id].mrp ?? byId[id].price), 0),
      subtotal: items.reduce((s, t) => s + t.price, 0),
      collectionFee: collectionFee(items.reduce((s, t) => s + t.price, 0), collection),
      total: bookingTotal(items.reduce((s, t) => s + t.price, 0), collection),
      labId: lab.id, labName: lab.name,
      date: toISODate(day), slotId: slot.id, slotLabel: slot.label,
      collection,
      address: collection === 'home' ? `Flat ${100 + i}, Green Park Residency, Bengaluru` : '',
      pincode: collection === 'home' ? '560001' : '',
      history: trail.map((s, k) => ({ status: s, at: new Date(created.getTime() + k * 3600e3).toISOString(), note: NOTE[s] })),
    };
  });
}

export const todayLabel = (now = new Date()) => format(now, 'yyyy-MM-dd');
